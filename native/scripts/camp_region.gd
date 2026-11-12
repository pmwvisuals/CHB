extends "res://scripts/world.gd"

@export var scenery_scene:PackedScene
@export var prototypes_scene:PackedScene
@export var collision_scene:PackedScene
var layout:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/camp-layout.json"))
var scenery:Node3D
var pending_collision:Array[MeshInstance3D] = []
var destinations:Array[Dictionary] = []
var light_slots:Array[OmniLight3D] = []
var light_timer := 0.0

func bounds() -> float:
	return 233.0

func spawn_position() -> Vector3:
	return Vector3(0,height(0,113)+.2,113)

func height(x:float,z:float) -> float:
	var grid:Dictionary = layout.heightfield
	var xx:float = clampf((x-grid.origin)/grid.spacing,0,grid.size-1.001)
	var zz:float = clampf((z-grid.origin)/grid.spacing,0,grid.size-1.001)
	var ix := int(xx)
	var iz := int(zz)
	var index:int = iz*int(grid.size)+ix
	var row:int = int(grid.size)
	return lerpf(lerpf(grid.values[index],grid.values[index+1],xx-ix),lerpf(grid.values[index+row],grid.values[index+row+1],xx-ix),zz-iz)

func build_ground():
	scenery = scenery_scene.instantiate()
	add_child(scenery)
	var ground_shader := ShaderMaterial.new()
	ground_shader.shader = preload("res://shaders/camp_ground.gdshader")
	ground_shader.set_shader_parameter("habitat",preload("res://assets/camp/habitat.png"))
	ground_shader.set_shader_parameter("cover_albedo",preload("res://assets/camp/ground-albedo.png"))
	ground_shader.set_shader_parameter("cover_normal",preload("res://assets/camp/ground-normal.png"))
	ground_shader.set_shader_parameter("cover_roughness",preload("res://assets/camp/ground-roughness.png"))
	var water := ShaderMaterial.new()
	water.shader = preload("res://shaders/lake.gdshader")
	for part in scenery.find_children("*","MeshInstance3D",true,false):
		if part.name.begins_with("CampTerrain"):
			part.material_override = ground_shader
			part.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		elif part.name == "MirrorLake":
			part.material_override = water
			part.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		part.visibility_range_end = 390
	var collision_root = collision_scene.instantiate()
	add_child(collision_root)
	collision_root.hide()
	for part in collision_root.find_children("*","MeshInstance3D",true,false):
		pending_collision.append(part)
	environment.fog_density = .0035
	sun.directional_shadow_max_distance = 65

func build_landmarks():
	gate = Vector3(-40,height(-40,-121),-121)
	var marble = material("c6beac")
	for side in [-1,1]:
		block(gate+Vector3(side*2.2,2,0),Vector3(.5,4,.6),marble,true)
	block(gate+Vector3(0,4.1,0),Vector3(5.4,.4,.8),marble)
	var label := Label3D.new()
	label.text = "DEEPWOOD"
	label.position = gate+Vector3(0,4.7,0)
	label.font_size = 64
	label.pixel_size = .008
	add_child(label)
	for entry in layout.labels:
		var sign := Label3D.new()
		sign.text = entry.text
		sign.font_size = 64
		sign.pixel_size = entry.width/maxf(64,entry.text.length()*36)
		sign.modulate = Color(entry.color)
		sign.position = Vector3(entry.position[0],entry.position[1],entry.position[2])
		sign.quaternion = Quaternion(entry.quaternion[0],entry.quaternion[1],entry.quaternion[2],entry.quaternion[3])
		sign.outline_size = 0
		add_child(sign)
	for temple in layout.temples:
		var turn:float = temple.rotation
		var x:float = temple.x+sin(turn)*17
		var z:float = temple.z+cos(turn)*17
		destinations.append({"id":temple.id,"name":temple.name,"description":temple.description,"point":Vector2(x,z),"yaw":turn,"temple":true})
	for entry in [{"id":"hall","name":"Great Hall","point":Vector2(0,16)}, {"id":"wayfarer","name":"Wayfarer Hall","point":Vector2(-55,64)}, {"id":"training","name":"Training Ground","point":Vector2(-67,-15)}, {"id":"lake","name":"Lakeside","point":Vector2(55,5)}, {"id":"gate","name":"Deepwood Gate","point":Vector2(-40,-117)}, {"id":"arrival","name":"Arrival Ridge","point":Vector2(0,113)}]:
		entry.yaw = -PI/2 if entry.id == "lake" else 0.0
		entry.temple = false
		destinations.append(entry)
	for i in range(8):
		var lamp := OmniLight3D.new()
		lamp.light_color = Color("ffc889")
		lamp.omni_range = 20
		lamp.light_energy = 0
		lamp.visible = false
		lamp.shadow_enabled = false
		add_child(lamp)
		light_slots.append(lamp)

func plant():
	for i in range(pending_collision.size()):
		pending_collision[i].create_trimesh_collision()
		if i%4 == 0:
			Session.app.build_progress(.55+float(i)/pending_collision.size()*.12,"Preparing walkways…")
			await get_tree().process_frame
	pending_collision.clear()
	var prototypes = prototypes_scene.instantiate()
	var meshes := {}
	for part in prototypes.find_children("*","MeshInstance3D",true,false):
		meshes[String(part.name)] = part
	for i in range(layout.batches.size()):
		var entry:Dictionary = layout.batches[i]
		if not meshes.has(entry.proto):
			push_error("Missing camp prototype: "+entry.proto)
			continue
		var original:MeshInstance3D = meshes[entry.proto]
		var multi := MultiMesh.new()
		multi.transform_format = MultiMesh.TRANSFORM_3D
		multi.mesh = original.mesh
		multi.instance_count = entry.instances.size()
		for index in range(entry.instances.size()):
			var m:Array = entry.instances[index]
			multi.set_instance_transform(index,Transform3D(Basis(Vector3(m[0],m[1],m[2]),Vector3(m[3],m[4],m[5]),Vector3(m[6],m[7],m[8])),Vector3(m[9],m[10],m[11])))
		var node := MultiMeshInstance3D.new()
		node.name = entry.kind
		node.multimesh = multi
		node.position = Vector3(entry.center[0],entry.center[1],entry.center[2])
		node.material_override = original.material_override
		node.lod_bias = .6
		var ground_cover:bool = entry.kind == "ground cover" or "grass" in entry.kind or "flowers" in entry.kind or "litter" in entry.kind
		var bushes:bool = "fern" in entry.kind or "bracken" in entry.kind or "bramble" in entry.kind or "laurel" in entry.kind or "myrtle" in entry.kind
		node.visibility_range_end = 60 if ground_cover else 110 if bushes else 350
		node.visibility_range_end_margin = 8
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if entry.shadow and "foliage" not in entry.kind and not ground_cover else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(node)
		if i%90 == 0:
			Session.app.build_progress(.67+float(i)/layout.batches.size()*.30,"Planting the sanctuary…")
			await get_tree().process_frame
	prototypes.free()

func near_temple() -> Dictionary:
	for destination in destinations:
		if destination.temple and Vector2(player.position.x,player.position.z).distance_to(destination.point)<4:
			return destination
	return {}

func interaction_text() -> String:
	if near_gate():
		return "Enter the woodland"
	var temple := near_temple()
	return "Read "+temple.name+" inscription" if not temple.is_empty() else ""

func interact():
	if near_gate():
		Session.change_zone("forest")
		return
	var temple := near_temple()
	if not temple.is_empty():
		Session.message = temple.name+" — "+temple.description

func travel_to(destination:Dictionary):
	var point:Vector2 = destination.point
	var floor_y := height(point.x,point.y)
	var query := PhysicsRayQueryParameters3D.create(Vector3(point.x,floor_y+20,point.y),Vector3(point.x,floor_y-5,point.y))
	query.exclude = [player.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty():
		floor_y = hit.position.y
	player.position = Vector3(point.x,floor_y+.15,point.y)
	player.velocity = Vector3.ZERO
	player.rotation.y = destination.yaw
	player.pitch = 0.0
	player.camera.rotation.x = 0
	Session.message = destination.name

func _process(delta):
	super._process(delta)
	if not is_instance_valid(player) or Session.paused:
		return
	player.camera.far = 900
	sun_disc.position = player.position+sun.position.normalized()*600
	moon_disc.position = player.position+moon.position.normalized()*600
	sun_disc.scale = Vector3.ONE*(600.0/65)
	moon_disc.scale = sun_disc.scale
	light_timer -= delta
	if light_timer<=0:
		light_timer = .3
		var nearby:Array = layout.lights.duplicate()
		nearby.sort_custom(func(a,b): return Vector3(a[0],a[1],a[2]).distance_squared_to(player.position)<Vector3(b[0],b[1],b[2]).distance_squared_to(player.position))
		for i in range(light_slots.size()):
			var p:Array = nearby[i]
			light_slots[i].position = Vector3(p[0],p[1],p[2])
			light_slots[i].light_energy = (1-daylight)*1.8 if light_slots[i].position.distance_to(player.position)<55 else 0.0
			light_slots[i].visible = light_slots[i].light_energy>.01
