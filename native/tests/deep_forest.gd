extends SceneTree

var failures := 0

func _initialize():
	call_deferred("run")

func check(value:bool,message:String):
	print(("PASS " if value else "FAIL ")+message)
	if not value:
		failures += 1

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_deep-forest-save.json"
	session.data.positions = {"forest":[0,0,18]}
	session.data.adventure={}
	session.data.erase("forest_layout")
	session.data.coins = 7
	session.data.xp = 11
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:
		await process_frame
	var forest = app.world
	# Landscape checks isolate terrain from the separately tested combat AI.
	forest.enemy.set_physics_process(false)
	for actor in forest.supplied_creatures:actor.set_physics_process(false)
	for i in range(20):
		await physics_frame
	check(forest.player.position.distance_to(forest.spawn_position())<1,"Old forest saves migrate to the new entrance")
	check(session.data.coins==7 and session.data.xp==11,"Forest migration retains progression")
	check(forest.player.is_on_floor(),"Player stands on the new forest floor")
	check(forest.bounds()==275 and not forest.inside_bounds(Vector3(280,0,0)),"Forest has a bounded 550-metre playable diameter")
	check(forest.tree_count==5200 and forest.floor_count==15435,"Existing trees and woodland floor plants populate the full forest")
	check(forest.find_children("ForestGround_*","MeshInstance3D",true,false).size()==36,"Terrain uses shared-edge spatial chunks")
	check(forest.layout.trails.size()==4 and forest.layout.clearings.size()==6,"Four connected trails serve six clearings")
	check(forest.environment.ambient_light_energy>.5 and forest.environment.fog_depth_begin>=60,"Canopy shade retains readable daylight and nearby visibility")
	check(forest.mist_nodes.size()==12,"Mist remains in separate world-space pockets")
	var noise:Image = preload("res://assets/deep-forest/mist.png").get_image()
	check(noise.get_pixel(0,0).a==0 and noise.get_pixel(64,64).a>0,"Mist edges fade completely")
	var grounded := true
	for p in forest.layout.trees:
		grounded = grounded and p[2]<=forest.height(p[1],p[3])+.04 and forest.height(p[1],p[3])-p[2]<.65
	check(grounded,"Every trunk root is embedded in the local terrain")
	var raw:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/deep-forest/layout.json"))
	var native_species := {}
	for p in raw.trees:
		native_species[int(p[0])] = true
	check(native_species.size()==5,"All five existing dark tree varieties appear")
	var densities:Array[float] = []
	for z in range(-200,201,40):
		for x in range(-200,201,40):
			if Vector2(x+20,z+20).length()>230:
				continue
			densities.append(raw.trees.filter(func(p): return p[1]>=x and p[1]<x+40 and p[3]>=z and p[3]<z+40).size())
	var mean:float = densities.reduce(func(a,b): return a+b,0.0)/densities.size()
	var variance:float = densities.reduce(func(a,b): return a+pow(b-mean,2),0.0)/densities.size()
	check(sqrt(variance)/mean>.25,"Tree density varies between groves and open woodland")
	var darker := true
	var floor_palette := true
	for node in forest.get_children():
		if node is MultiMeshInstance3D and String(node.name).begins_with("forest_"):
			var tone:Vector3 = node.multimesh.mesh.surface_get_material(0).get_shader_parameter("woodland_tone")
			if String(node.name).get_slice("_",1) in ["oak","hornbeam","cedar","fir","spruce"]:
				darker = darker and tone.x<.6 and tone.y<.65 and tone.z<.6
			else:
				floor_palette = floor_palette and tone==Vector3.ONE
	check(darker,"Tree bark and foliage use the darker woodland palette")
	check(floor_palette,"Woodland floor plants retain their own palette")
	var tree:Array = raw.trees.filter(func(p): return Vector2(p[1],p[3]).length()<200)[0]
	var root_position := Vector3(tree[1],forest.height(tree[1],tree[3])+.1,tree[3])
	var recovered:Vector3 = forest.recover_tree_position(root_position)
	check(not forest.tree_overlaps(recovered) and recovered.distance_to(root_position)<10,"Saved positions inside relocated trunks recover nearby")
	session.set_graphics_quality("balanced")
	check(forest.detail_nodes.all(func(n): return n.visibility_range_end==42),"Balanced retains near-leaf detail")
	session.set_graphics_quality("high")
	check(forest.detail_nodes.all(func(n): return n.visibility_range_end==52),"High extends the same leaf artwork")
	forest.player.position = Vector3(0,forest.height(0,270)+.1,270)
	forest._process(.01)
	check(forest.environment.fog_depth_end<60,"Peripheral mist hides the outer scenery edge")
	forest.player.position = Vector3(0,forest.height(0,118)+.1,118)
	forest._process(.01)
	check(forest.environment.fog_depth_begin==65,"Interior exploration retains its normal view distance")
	for trail in forest.layout.trails:
		var walkable := true
		var clear := true
		for index in range(0,trail.size()-4,4):
			var p:Array = trail[index]
			var q:Array = trail[index+4]
			forest.player.position = Vector3(p[0],forest.height(p[0],p[1])+.1,p[1])
			forest.refresh_collisions()
			var at := Vector3(p[0],forest.height(p[0],p[1]),p[1])
			var ray := PhysicsRayQueryParameters3D.create(at+Vector3.UP*2,at-Vector3.UP)
			var exclusions:Array[RID] = [forest.player.get_rid(),forest.enemy.get_rid()]
			for creature in forest.supplied_creatures:
				exclusions.append(creature.get_rid())
			ray.exclude = exclusions
			var hit:Dictionary = forest.get_world_3d().direct_space_state.intersect_ray(ray)
			walkable = walkable and not hit.is_empty() and absf(hit.position.y-at.y)<.04 and hit.normal.y>.65 and forest.inside_bounds(at)
			var to := Vector3(q[0],forest.height(q[0],q[1]),q[1])
			ray.from = at+Vector3.UP*1.5
			ray.to = to+Vector3.UP*1.5
			clear = clear and forest.get_world_3d().direct_space_state.intersect_ray(ray).is_empty()
		check(walkable,"Trail floor is continuous, walkable and aligned with physics")
		check(clear,"Trail walking corridor remains clear of tree trunks")
	forest.player.position = forest.gate+Vector3(0,.1,-1)
	check(forest.near_gate() and forest.interaction_text()=="Return to camp","Forest gate offers a working return route")
	forest.player.sync_combat()
	check(not forest.player.combat_enabled() and not forest.player.weapon.visible,"The forest entrance remains a safe return corridor")
	var remembered := Vector3(6,forest.height(6,118)+.15,118)
	forest.player.position = remembered
	session.save_game(forest.player)
	var old:WeakRef = weakref(forest)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	check(old.get_ref()==null,"Leaving the forest releases its scene")
	app.travel("forest")
	while app.transitioning:
		await process_frame
	check(app.world.player.position.distance_to(remembered)<1,"A new forest save restores its exploration position")
	check(app.world.tree_count==5200 and app.world.floor_count==15435,"Repeated entry reconstructs the complete forest")
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("DEEP FOREST CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
