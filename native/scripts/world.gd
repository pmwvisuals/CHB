extends Node3D

@export var forest := false
@export var tree_scenes:Array[PackedScene] = []
@export var shrub_scene:PackedScene
@export var beast_scene:PackedScene
var player
var enemy
var training
var gate := Vector3.ZERO
var rng := RandomNumberGenerator.new()
var key_light:DirectionalLight3D
var environment:Environment
var autosave := 0.0

func material(color:String,roughness:float=.85) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(color)
	m.roughness = roughness
	return m

func mesh_node(mesh:Mesh,at:Vector3,mat:Material,solid:bool=false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.position = at
	node.material_override = mat
	add_child(node)
	if solid:
		node.create_trimesh_collision()
	return node

func block(at:Vector3,extent:Vector3,mat:Material,solid:bool=false) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = extent
	return mesh_node(mesh,at,mat,solid)

func height(x:float,z:float) -> float:
	var rolls := .55*sin(x*.13)*cos(z*.11)+.35*sin(z*.19+x*.06)
	var road := 1.0-smoothstep(2.0,5.0,absf(x-3*sin(z*.08)))
	if not forest:
		rolls *= smoothstep(9.0,21.0,Vector2(x,z).length())
	return rolls*(1-road*.65)

func bounds() -> float:
	return 44.0

func inside_bounds(at:Vector3) -> bool:
	return absf(at.x)<bounds() and absf(at.z)<bounds()

func spawn_position() -> Vector3:
	return Vector3(0,height(0,18)+.2,18)

func interaction_text() -> String:
	return ("Return to camp" if forest else "Enter the woodland") if near_gate() else ""

func combat_allowed(_at:Vector3) -> bool:
	return false

func practice_attack(_attacker) -> bool:
	return false

func prepare():
	rng.seed = 72191 if forest else 41256
	build_sky()
	build_ground()
	await get_tree().process_frame
	build_landmarks()
	await plant()
	player = preload("res://scripts/player.gd").new()
	player.world = self
	add_child(player)
	player.position = spawn_position()
	var saved = Session.data.positions.get(Session.data.zone,[])
	if saved is Array and saved.size() == 3:
		if saved.all(func(v): return (v is float or v is int) and is_finite(float(v))):
			if inside_bounds(Vector3(saved[0],saved[1],saved[2])):
				player.position = Vector3(saved[0],maxf(saved[1],height(saved[0],saved[2])+.1),saved[2])
	var hud = preload("res://scripts/hud.gd").new()
	hud.world = self
	add_child(hud)
	player.hud = hud
	finish_preparation()
	apply_graphics()
	if forest and beast_scene:
		enemy = preload("res://scripts/boar.gd").new()
		enemy.player = player
		enemy.model = beast_scene.instantiate()
		add_child(enemy)
		enemy.position = Vector3(3,height(3,-8)+.3,-8)
	Session.message = "Explore the woodland. Combat is currently reserved for the training ground." if forest else "Welcome to the sanctuary. Open the map to explore."

func finish_preparation():
	pass

func apply_graphics():
	key_light.directional_shadow_max_distance = Session.graphics_preset().shadow_range

func build_sky():
	var world := WorldEnvironment.new()
	environment = Environment.new()
	environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("345f71")
	sky_mat.sky_horizon_color = Color("a4b7ac")
	sky_mat.ground_bottom_color = Color("14291d")
	sky.sky_material = sky_mat
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("9bbaa6")
	environment.fog_enabled = true
	environment.fog_light_color = Color("748b7b")
	environment.fog_density = .013 if forest else .005
	environment.fog_sky_affect = .10
	world.environment = environment
	add_child(world)
	environment.ambient_light_energy = .36 if forest else .44
	# The key provides fixed natural daylight without a visible sun or moon.
	key_light = DirectionalLight3D.new()
	key_light.name = "FixedDaylight"
	key_light.sky_mode = DirectionalLight3D.SKY_MODE_LIGHT_ONLY
	key_light.light_color = Color("fff0dc")
	key_light.light_energy = .88
	key_light.shadow_enabled = true
	key_light.directional_shadow_max_distance = 45
	key_light.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	add_child(key_light)
	key_light.position = Vector3(.62,.72,.25).normalized()*65
	key_light.look_at(Vector3.ZERO)

func build_ground():
	var tool := SurfaceTool.new()
	tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	var size := 64
	for row in range(size):
		for column in range(size):
			for corner in [Vector2(0,0),Vector2(1,0),Vector2(0,1),Vector2(1,0),Vector2(1,1),Vector2(0,1)]:
				var x:float = (column+corner.x)*1.5-48
				var z:float = (row+corner.y)*1.5-48
				var path := 1.0-smoothstep(1.9,2.4,absf(x-3*sin(z*.08)))
				var green := Color("203e29") if forest else Color("35583b")
				var soil := Color("4a4030") if forest else Color("a69c7e")
				var variation := .90+.12*sin(x*1.7+z*.9)
				tool.set_color(green.lerp(soil,path)*variation)
				tool.set_uv(Vector2(x,z)*.15)
				tool.add_vertex(Vector3(x,height(x,z),z))
	tool.generate_normals()
	var mat = material("ffffff")
	mat.vertex_color_use_as_albedo = true
	mat.vertex_color_is_srgb = true
	mesh_node(tool.commit(),Vector3.ZERO,mat,true)
	# Invisible limits keep this small test region traversable.
	for x in [-47.0,47.0]:
		var wall := StaticBody3D.new()
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = Vector3(1,16,96)
		collision.shape = shape
		wall.position = Vector3(x,5,0)
		wall.add_child(collision)
		add_child(wall)
	for z in [-47.0,47.0]:
		var wall := StaticBody3D.new()
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = Vector3(96,16,1)
		collision.shape = shape
		wall.position = Vector3(0,5,z)
		wall.add_child(collision)
		add_child(wall)

func build_landmarks():
	var marble = material("b5b7a6")
	var dark = material("324a48")
	var gold = material("b5a46b",.4)
	gate = Vector3(0,height(0,24 if forest else -28),24 if forest else -28)
	for side in [-1,1]:
		block(gate+Vector3(side*2.1,1.7,0),Vector3(.55,3.4,.65),marble,true)
	block(gate+Vector3(0,3.5,0),Vector3(5,.45,.9),gold)
	var sign := Label3D.new()
	sign.text = "SANCTUARY" if forest else "DEEPWOOD"
	sign.position = gate+Vector3(0,3.5,-.49 if forest else .49)
	sign.rotation.y = PI if forest else 0.0
	preload("res://scripts/inscription.gd").fit(sign,3.5,.25)
	add_child(sign)
	if forest:
		return
	# Four open approaches echo the central hall, without pretending to port its final art.
	block(Vector3(0,.2,0),Vector3(11,.4,9),marble,true)
	for x in [-4.0,4.0]:
		for z in [-3.0,0.0,3.0]:
			var column := CylinderMesh.new()
			column.top_radius = .30
			column.bottom_radius = .39
			column.height = 4
			column.radial_segments = 12
			mesh_node(column,Vector3(x,2.4,z),marble,true)
	block(Vector3(0,4.55,0),Vector3(11,.4,9),marble)
	block(Vector3(0,4.9,0),Vector3(10.5,.30,8.5),dark)
	for z in range(-22,26,3):
		for side in [-1,1]:
			var x:float = 3*sin(z*.08)+side*2.45
			block(Vector3(x,height(x,z)+.10,z),Vector3(.3,.2,1.15),marble)
	var water := CylinderMesh.new()
	water.top_radius = 7
	water.bottom_radius = 7
	water.height = .10
	water.radial_segments = 48
	mesh_node(water,Vector3(24,height(24,5)+.03,5),material("246f95",.26))

func plant():
	var positions := []
	var target := 68 if forest else 20
	var attempts := 0
	while positions.size() < target and attempts < 3000:
		attempts += 1
		var p := Vector2(rng.randf_range(-43,43),rng.randf_range(-41,41))
		if absf(p.x-3*sin(p.y*.08)) < 5 or p.length()<10 or (not forest and p.distance_to(Vector2(24,5))<10):
			continue
		if positions.any(func(v): return v.distance_to(p)<3.5):
			continue
		positions.append(p)
	for i in range(positions.size()):
		var p:Vector2 = positions[i]
		var tree = tree_scenes[i%tree_scenes.size()].instantiate()
		tree.position = Vector3(p.x,height(p.x,p.y)-.08,p.y)
		tree.rotation.y = rng.randf()*TAU
		tree.scale = Vector3.ONE*rng.randf_range(1.25,1.7) if forest else Vector3.ONE*rng.randf_range(.95,1.20)
		add_child(tree)
		finish_plant(tree)
		var trunk := StaticBody3D.new()
		trunk.position = tree.position+Vector3.UP
		var collider := CollisionShape3D.new()
		var shape := CylinderShape3D.new()
		shape.height = 2
		shape.radius = .22
		collider.shape = shape
		trunk.add_child(collider)
		add_child(trunk)
		if i%8 == 0:
			await get_tree().process_frame
	for i in range(64 if forest else 24):
		var x := rng.randf_range(-40,40)
		var z := rng.randf_range(-38,38)
		if absf(x-3*sin(z*.08)) < 4 or Vector2(x,z).length()<9:
			continue
		var shrub = shrub_scene.instantiate()
		shrub.position = Vector3(x,height(x,z)-.03,z)
		shrub.rotation.y = rng.randf()*TAU
		add_child(shrub)
		finish_plant(shrub)

func finish_plant(plant_root:Node3D):
	for part in plant_root.find_children("*","MeshInstance3D",true,false):
		# Closed crown geometry supplies the shadow; thousands of tiny leaves
		# need not be rendered again into the sun's shadow map.
		if "foliage" in part.name:
			part.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		if "bark" in part.name:
			var bark = material("514335")
			bark.metallic_specular = .08
			part.material_override = bark

func near_gate():
	return is_instance_valid(player) and player.global_position.distance_to(gate)<3.4

func interact():
	if near_gate():
		Session.change_zone("camp" if forest else "forest")

func _process(delta):
	if Session.paused or not is_instance_valid(player):
		return
	autosave += delta
	if not forest:
		Session.data.health = minf(100,Session.data.health+delta*4)
	if autosave>20:
		autosave = 0
		Session.save_game(player)

