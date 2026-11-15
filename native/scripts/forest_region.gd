extends "res://scripts/world.gd"

var layout:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/deep-forest/layout.json"))
var foliage_stream
var collision_cells := {}
var collision_tick := 0.0
var tree_count := 0
var floor_count := 0
var detail_nodes:Array[MultiMeshInstance3D] = []
var mist_nodes:Array[Node3D] = []
var supplied_creatures:Array[CharacterBody3D] = []
const SUPPLIED_CREATURES := [
	{"id":"MagicWolf","asset":"res://assets/forest-creatures/magic-wolf.glb","height":2.1,"heading":0.0,"speed":.7,"point":[-65,-45],"route":[[-60,-41],[-60,-49],[-69,-50],[-71,-43]]},
	{"id":"MutantMantis","asset":"res://assets/forest-creatures/mutant-mantis.glb","height":2.8,"heading":PI,"speed":0.0,"point":[92,-70],"route":[]},
	{"id":"FantasyBoar","asset":"res://assets/forest-creatures/fantasy-boar.glb","height":1.6,"heading":0.0,"speed":.55,"point":[-130,90],"route":[[-126,94],[-125,87],[-133,85],[-135,92]]}
]

func bounds() -> float:
	return layout.radius

func inside_bounds(at:Vector3) -> bool:
	return Vector2(at.x,at.z).length()<bounds()

func height(x:float,z:float) -> float:
	var grid:Dictionary = layout.heightfield
	var xx := clampf((x-grid.origin)/grid.spacing,0,grid.size-1.001)
	var zz := clampf((z-grid.origin)/grid.spacing,0,grid.size-1.001)
	var ix := int(xx)
	var iz := int(zz)
	var fx := xx-ix
	var fz := zz-iz
	var row:int = grid.size
	var i := iz*row+ix
	if fx+fz<=1:
		return grid.values[i]+(grid.values[i+1]-grid.values[i])*fx+(grid.values[i+row]-grid.values[i])*fz
	return grid.values[i+row+1]+(grid.values[i+row]-grid.values[i+row+1])*(1-fx)+(grid.values[i+1]-grid.values[i+row+1])*(1-fz)

func spawn_position() -> Vector3:
	return Vector3(0,height(0,216)+.15,216)

func creature_position() -> Vector3:
	var point := Vector2(10,123)
	if is_instance_valid(player) and point.distance_to(Vector2(player.position.x,player.position.z))<3:
		point = Vector2(3,113)
	return Vector3(point.x,height(point.x,point.y)+.15,point.y)

func create_creature():
	var boar := preload("res://scripts/forest_boar.gd").new()
	boar.name = "AshTuskBoar"
	boar.route = PackedVector2Array([Vector2(13,120),Vector2(10,113),Vector2(3,113),Vector2(0,119),Vector2(5,124),Vector2(10,123)])
	return boar

func build_sky():
	super.build_sky()
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("c5d2cd")
	environment.ambient_light_energy = 1.4
	environment.tonemap_exposure = .8
	environment.fog_light_color = Color("82958f")
	environment.fog_light_energy = .55
	environment.fog_density = .7
	environment.fog_depth_begin = 65
	environment.fog_depth_end = 210
	key_light.light_energy = .8

func build_ground():
	var ground := ShaderMaterial.new()
	ground.shader = preload("res://shaders/forest_ground.gdshader")
	ground.set_shader_parameter("habitat",preload("res://assets/deep-forest/habitat.png"))
	ground.set_shader_parameter("soil_noise",preload("res://assets/deep-forest/soil-noise.png"))
	var grid:Dictionary = layout.heightfield
	# Shared edge samples keep both shading and physical ground continuous.
	for tz in range(6):
		for tx in range(6):
			var vertices := PackedVector3Array()
			var normals := PackedVector3Array()
			var uv := PackedVector2Array()
			var indices := PackedInt32Array()
			for z in range(41):
				for x in range(41):
					var px:float = grid.origin+(tx*40+x)*grid.spacing
					var pz:float = grid.origin+(tz*40+z)*grid.spacing
					vertices.append(Vector3(px,height(px,pz),pz))
					normals.append(Vector3(height(px-.5,pz)-height(px+.5,pz),1,height(px,pz-.5)-height(px,pz+.5)).normalized())
					uv.append(Vector2(px,pz))
			for z in range(40):
				for x in range(40):
					var i := z*41+x
					indices.append_array(PackedInt32Array([i,i+1,i+41,i+1,i+42,i+41]))
			var arrays := []
			arrays.resize(Mesh.ARRAY_MAX)
			arrays[Mesh.ARRAY_VERTEX] = vertices
			arrays[Mesh.ARRAY_NORMAL] = normals
			arrays[Mesh.ARRAY_TEX_UV] = uv
			arrays[Mesh.ARRAY_INDEX] = indices
			var mesh := ArrayMesh.new()
			mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
			var tile := mesh_node(mesh,Vector3.ZERO,ground,true)
			tile.name = "ForestGround_%d_%d" % [tx,tz]
			tile.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var wall := StaticBody3D.new()
	wall.name = "ForestPerimeter"
	add_child(wall)
	for i in range(180):
		var angle := i*TAU/180
		var at := Vector2(sin(angle),cos(angle))*bounds()
		var shape := BoxShape3D.new()
		shape.size = Vector3(bounds()*TAU/180+.3,40,1.2)
		var collider := CollisionShape3D.new()
		collider.shape = shape
		collider.position = Vector3(at.x,height(at.x,at.y)+12,at.y)
		collider.rotation.y = angle
		wall.add_child(collider)

func build_landmarks():
	gate = Vector3(0,height(0,224),224)
	var stone = material("9caa9f")
	for side in [-1,1]:
		block(gate+Vector3(side*2.1,1.7,0),Vector3(.55,3.4,.65),stone,true)
	block(gate+Vector3(0,3.5,0),Vector3(5,.45,.9),stone)
	var sign := Label3D.new()
	sign.text = "SANCTUARY"
	sign.position = gate+Vector3(0,3.5,-.49)
	sign.rotation.y = PI
	preload("res://scripts/inscription.gd").fit(sign,3.5,.25)
	add_child(sign)

func plant():
	var prototypes = load("res://assets/deep-forest/prototypes.glb").instantiate()
	var materials := {}
	var parts := {}
	for id in layout.ids:
		parts[id] = prototypes.find_children(id+"_*","MeshInstance3D",true,false)
	for part in prototypes.find_children("*","MeshInstance3D",true,false):
		part.mesh = part.mesh.duplicate()
		for surface in range(part.mesh.get_surface_count()):
			var original = part.get_active_material(surface)
			var key := str(original.get_instance_id())
			if not materials.has(key):
				var mat := ShaderMaterial.new()
				mat.shader = preload("res://shaders/forest_vegetation.gdshader")
				mat.set_shader_parameter("tint",Color("514335") if "bark" in part.name else original.albedo_color)
				var tree:bool = String(part.name).get_slice("_",1) in ["oak","hornbeam","cedar","fir","spruce"]
				mat.set_shader_parameter("woodland_tone",Vector3(.48,.58,.46) if tree else Vector3.ONE)
				mat.set_shader_parameter("leaf","foliage" in part.name or "canopy" in part.name)
				mat.set_shader_parameter("bark","bark" in part.name)
				mat.set_shader_parameter("bark_noise",preload("res://assets/deep-forest/soil-noise.png"))
				materials[key] = mat
			part.mesh.surface_set_material(surface,materials[key])
	foliage_stream = preload("res://scripts/foliage_stream.gd").new()
	foliage_stream.world = self
	foliage_stream.far_range = 205
	foliage_stream.near_range_scale = .65
	add_child(foliage_stream)
	var batches := {}
	for tree in layout.trees:
		var centre := Vector2(floorf(tree[1]/48)*48+24,floorf(tree[3]/48)*48+24)
		if not collision_cells.has(centre):
			collision_cells[centre] = {"trees":[],"body":null}
		collision_cells[centre].trees.append(tree)
	for list in [layout.trees,layout.floor]:
		var trees:bool = list==layout.trees
		for p in list:
			var id:String = layout.ids[int(p[0])]
			for part in parts[id]:
				var detail:bool = "foliage" in part.name
				var cell_size := 24.0 if detail or not trees else 48.0
				var cx := floorf(p[1]/cell_size)*cell_size+cell_size*.5
				var cz := floorf(p[3]/cell_size)*cell_size+cell_size*.5
				var key := "%s:%d:%d" % [part.name,int(cx),int(cz)]
				if not batches.has(key):
					batches[key] = {"part":part,"centre":Vector3(cx,0,cz),"transforms":[],"trees":trees,"detail":detail}
				var scale := Vector3(p[4],p[4],p[4])
				if trees:
					scale.x *= 1.12
					scale.z *= 1.12
				var basis := Basis(Vector3.UP,p[5]).scaled(scale)
				batches[key].transforms.append(Transform3D(basis,Vector3(p[1]-cx,p[2],p[3]-cz)))
	var count := 0
	for entry in batches.values():
		var multi := MultiMesh.new()
		multi.transform_format = MultiMesh.TRANSFORM_3D
		multi.mesh = entry.part.mesh
		multi.instance_count = entry.transforms.size()
		for i in range(entry.transforms.size()):
			multi.set_instance_transform(i,entry.transforms[i])
		var node := MultiMeshInstance3D.new()
		node.name = entry.part.name
		node.multimesh = multi
		node.position = entry.centre
		node.visibility_range_end = 205 if entry.trees else 65
		node.lod_bias = .35
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if entry.trees and not entry.detail else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(node)
		if entry.detail and entry.trees:
			detail_nodes.append(node)
		elif entry.trees:
			foliage_stream.register_cell(node,{"proto":String(entry.part.name),"kind":"bark high" if "bark" in entry.part.name else "canopy high"})
		count += 1
		if count%75==0:
			Session.app.build_progress(.3+.65*count/batches.size(),"Growing the deep forest…")
			await get_tree().process_frame
	tree_count = layout.trees.size()
	floor_count = layout.floor.size()
	foliage_stream.finish()
	prototypes.free()
	layout.erase("floor")
	add_mist()

func add_mist():
	var quad := QuadMesh.new()
	quad.size = Vector2(1,1)
	var mat := StandardMaterial3D.new()
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.albedo_color = Color(.52,.63,.58,.17)
	mat.albedo_texture = preload("res://assets/deep-forest/mist.png")
	mat.proximity_fade_enabled = true
	mat.proximity_fade_distance = 3
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	for pocket in layout.mist:
		var fog := MeshInstance3D.new()
		fog.name = "HollowMist"
		fog.mesh = quad
		fog.material_override = mat
		fog.position = Vector3(pocket.x,height(pocket.x,pocket.z)+2.0,pocket.z)
		fog.scale = Vector3(pocket.r*1.7,4.0,1)
		fog.visibility_range_end = 115
		fog.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(fog)
		mist_nodes.append(fog)

func finish_preparation():
	player.camera.far = 240
	if Session.data.get("forest_layout","")!="deepwood_1":
		player.position = spawn_position()
		Session.data.forest_layout = "deepwood_1"
	player.position = recover_tree_position(player.position)
	refresh_collisions()
	for definition in SUPPLIED_CREATURES:
		var actor := preload("res://scripts/forest_creature.gd").new()
		actor.player = player
		actor.definition = definition
		var point := Vector2(definition.point[0],definition.point[1])
		if point.distance_to(Vector2(player.position.x,player.position.z))<3:
			point += Vector2(4,0)
		actor.position = Vector3(point.x,height(point.x,point.y)+.15,point.y)
		add_child(actor)
		supplied_creatures.append(actor)
	Session.message = "Follow the earth trail into Deepwood. The stone gate behind you returns to camp."

func tree_overlaps(at:Vector3) -> bool:
	for tree in layout.trees:
		if at.y>=tree[2]+6 or at.y+1.95<=tree[2]:
			continue
		if Vector2(at.x-tree[1],at.z-tree[3]).length()<tree[4]*.2+.4:
			return true
	return false

func recover_tree_position(at:Vector3) -> Vector3:
	if not tree_overlaps(at):
		return at
	for distance in [1.5,3.0,6.0]:
		for index in range(12):
			var point:Vector2 = Vector2(at.x,at.z)+Vector2(cos(index*TAU/12),sin(index*TAU/12))*distance
			var candidate := Vector3(point.x,height(point.x,point.y)+.1,point.y)
			if inside_bounds(candidate) and not tree_overlaps(candidate):
				return candidate
	return spawn_position()

func apply_graphics():
	super.apply_graphics()
	var high:bool = Session.graphics_quality()=="high"
	for node in detail_nodes:
		node.visibility_range_end = 52 if high else 42
		node.visibility_range_end_margin = 8
		node.lod_bias = .35 if high else .25
	if is_instance_valid(foliage_stream):
		foliage_stream.refresh(true)

func refresh_collisions():
	if not is_instance_valid(player):
		return
	var point := Vector2(player.position.x,player.position.z)
	for centre in collision_cells:
		var cell:Dictionary = collision_cells[centre]
		var distance:float = point.distance_to(centre)
		if distance>120 and is_instance_valid(cell.body):
			cell.body.queue_free()
			cell.body = null
		elif distance<96 and not is_instance_valid(cell.body):
			var body := StaticBody3D.new()
			body.position = Vector3(centre.x,0,centre.y)
			add_child(body)
			for p in cell.trees:
				var shape := CylinderShape3D.new()
				shape.radius = .2*p[4]
				shape.height = 6
				var collider := CollisionShape3D.new()
				collider.shape = shape
				collider.position = Vector3(p[1]-centre.x,p[2]+3,p[3]-centre.y)
				body.add_child(collider)
			cell.body = body

func _process(delta):
	super._process(delta)
	if Session.paused or not is_instance_valid(player):
		return
	var rim := smoothstep(210,270,Vector2(player.position.x,player.position.z).length())
	environment.fog_depth_begin = lerpf(65,18,rim)
	environment.fog_depth_end = lerpf(210,55,rim)
	environment.fog_density = lerpf(.7,.98,rim)
	collision_tick += delta
	if collision_tick>=.4:
		collision_tick = 0
		refresh_collisions()
