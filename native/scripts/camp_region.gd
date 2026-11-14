extends "res://scripts/world.gd"

@export var scenery_scene:PackedScene
@export var prototypes_scene:PackedScene
@export var collision_scene:PackedScene
var layout:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/camp-layout.json"))
var scenery:Node3D
var destinations:Array[Dictionary] = []
var boundary := PackedVector2Array()
var material_cache := {}
var training_hits := 0
var foliage_stream
var collision_root:Node3D

func apply_graphics():
	super.apply_graphics()
	var preset:Dictionary = Session.graphics_preset()
	if is_instance_valid(scenery):
		for part in scenery.find_children("SceneryCell_*","MeshInstance3D",true,false):
			part.lod_bias = preset.scenery_lod
	for node in get_children():
		if node is MultiMeshInstance3D and not node.has_meta("distant_crown"):
			node.lod_bias = preset.lod
			if node.get_meta("foliage_detail",false):
				node.visibility_range_end = preset.leaf_range
	if is_instance_valid(foliage_stream):
		foliage_stream.refresh(true)

func finish_preparation():
	player.camera.far = 430
	training = preload("res://scripts/training.gd").new()
	training.world = self
	add_child(training)
	if not Session.render_profile.is_empty():
		var arrival:Dictionary = destinations.filter(func(d): return d.id == "arrival")[0]
		travel_to(arrival)

func combat_allowed(at:Vector3) -> bool:
	return absf(at.x+67)<23 and absf(at.z+34)<23

func practice_attack(attacker) -> bool:
	if not combat_allowed(attacker.position):
		return false
	for index in range(3):
		var target := Vector3(-48.5,height(-48.5,-23-index*8)+1.48,-23-index*8)
		var offset:Vector3 = target-attacker.camera.global_position
		if offset.length()>3.3 or offset.normalized().dot(-attacker.camera.global_basis.z)<.72:
			continue
		var query := PhysicsRayQueryParameters3D.create(attacker.camera.global_position,target)
		query.exclude = [attacker.get_rid()]
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		if not hit.is_empty() and hit.position.distance_to(target)>.75:
			continue
		training_hits += 1
		if is_instance_valid(training):
			training.sword_result(index)
		return true
	if is_instance_valid(training):
		training.sword_result(-1)
	return false

func finish_import(part:MeshInstance3D):
	for surface in range(part.mesh.get_surface_count()):
		var original = part.get_active_material(surface)
		if not original is BaseMaterial3D:
			continue
		if original.resource_name.begins_with("SpatialPalette_"):
			var palette_key:String = original.resource_name
			if not material_cache.has(palette_key):
				var palette := ShaderMaterial.new()
				palette.shader = preload("res://shaders/scenery_palette.gdshader")
				if original.cull_mode == BaseMaterial3D.CULL_DISABLED:
					var two_sided := Shader.new()
					two_sided.code = palette.shader.code.replace("shader_type spatial;","shader_type spatial;\nrender_mode cull_disabled;")
					palette.shader = two_sided
				palette.set_shader_parameter("textured",original.albedo_texture!=null)
				palette.set_shader_parameter("stone_texture",original.albedo_texture)
				material_cache[palette_key] = palette
			part.mesh.surface_set_material(surface,material_cache[palette_key])
			continue
		var colors = part.mesh.surface_get_arrays(surface)[Mesh.ARRAY_COLOR]
		var has_colors:bool = colors != null and colors.size()>0
		var key := str(original.get_instance_id())+str(has_colors)
		if not material_cache.has(key):
			var corrected = original.duplicate()
			corrected.vertex_color_use_as_albedo = has_colors
			corrected.vertex_color_is_srgb = false
			corrected.metallic_specular = .16 if corrected.metallic<.1 else .35
			material_cache[key] = corrected
		part.mesh.surface_set_material(surface,material_cache[key])

func bounds() -> float:
	return float(layout.extent)

func inside_bounds(at:Vector3) -> bool:
	return Geometry2D.is_point_in_polygon(Vector2(at.x,at.z),boundary)

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
	for point in layout.boundary:
		boundary.append(Vector2(point[0],point[1]))
	scenery = scenery_scene.instantiate()
	scenery_scene = null
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
		finish_import(part)
		if part.name.begins_with("CampTerrain"):
			part.material_override = ground_shader
			part.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		elif part.name == "MirrorLake":
			part.material_override = water
			part.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		part.visibility_range_end = 390
	collision_root = collision_scene.instantiate()
	collision_scene = null
	add_child(collision_root)
	environment.fog_density = .0035

func build_landmarks():
	gate = Vector3(-40,height(-40,-121),-121)
	var marble = material("c6beac")
	for side in [-1,1]:
		block(gate+Vector3(side*2.2,2,0),Vector3(.5,4,.6),marble,true)
	block(gate+Vector3(0,4.1,0),Vector3(5.4,.4,.8),marble)
	var label := Label3D.new()
	label.text = "DEEPWOOD"
	label.position = gate+Vector3(0,4.12,.43)
	preload("res://scripts/inscription.gd").fit(label,3.6,.26)
	add_child(label)
	for entry in layout.labels:
		var sign := Label3D.new()
		sign.text = entry.text
		preload("res://scripts/inscription.gd").fit(sign,entry.width*.85,.34)
		sign.modulate = Color(entry.color)
		for temple in layout.temples:
			if temple.name.to_upper() == entry.text:
				sign.modulate = Color("59472e") if Color(temple.stone).get_luminance()>.6 else Color("e1c991")
		sign.position = Vector3(entry.position[0],entry.position[1],entry.position[2])
		sign.quaternion = Quaternion(entry.quaternion[0],entry.quaternion[1],entry.quaternion[2],entry.quaternion[3])
		for temple in layout.temples:
			if temple.name.to_upper() != entry.text:
				continue
			# The source frieze has projecting bronze ribs. A mounted nameplate
			# gives the lettering its own clear surface ahead of those ornaments.
			var normal := Basis(sign.quaternion).z
			var word_width := sign.font.get_string_size(sign.text,HORIZONTAL_ALIGNMENT_LEFT,-1,sign.font_size).x*sign.pixel_size
			var width := clampf(word_width+.65,2.4,entry.width*.9)
			var plaque_mat := material(temple.ivory,.94)
			plaque_mat.metallic_specular = .08
			var plaque := block(sign.position+normal*.17,Vector3(width,.52,.16),plaque_mat)
			plaque.name = "TempleNameplate_"+temple.id
			plaque.quaternion = sign.quaternion
			plaque.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			sign.modulate = Color("59472e")
			var edge_mat := material(temple.metal,.75)
			for side in [-1,1]:
				var edge := block(plaque.position+normal*.085+Vector3.UP*side*.245,Vector3(width-.08,.018,.018),edge_mat)
				edge.quaternion = sign.quaternion
			sign.position += normal*.265
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

func plant():
	foliage_stream = preload("res://scripts/foliage_stream.gd").new()
	foliage_stream.world = self
	add_child(foliage_stream)
	# The device receives already-baked shapes, never invisible GPU meshes.
	for body in collision_root.get_children():
		if body is StaticBody3D:
			body.reparent(self,true)
	collision_root.free()
	collision_root = null
	var prototypes = prototypes_scene.instantiate()
	var meshes := {}
	for part in prototypes.find_children("*","MeshInstance3D",true,false):
		finish_import(part)
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
		node.set_meta("foliage_detail","foliage high" in entry.kind)
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
		foliage_stream.register_cell(node,entry)
		if i%90 == 0:
			Session.app.build_progress(.67+float(i)/layout.batches.size()*.30,"Planting the sanctuary…")
			await get_tree().process_frame
	prototypes.free()
	prototypes_scene = null
	foliage_stream.finish()
	# Transforms now live in shared instance buffers and the distance streamer.
	layout.erase("batches")

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
	player.sync_combat()
	Session.message = destination.name

