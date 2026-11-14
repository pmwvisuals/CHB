extends SceneTree

var failures := 0
var session

func _initialize():
	call_deferred("run")

func check(condition:bool,description:String):
	print(("PASS: " if condition else "FAIL: ")+description)
	if not condition:
		failures += 1

func frames(count:int):
	for i in range(count):
		await physics_frame
		await process_frame

func run():
	session = root.get_node("Session")
	session.save_path = "res://tests/_camp-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	var player = camp.player
	await frames(20)
	check(camp.layout.temples.size()==12,"Twelve original temple sites are present")
	check(camp.bounds()<220 and camp.bounds()>200 and player.position.z>100,"Compact camp retains Arrival Ridge and the original landmark coordinates")
	var cells:Array = camp.find_children("*","MultiMeshInstance3D",true,false)
	check(cells.size()>2000 and cells.size()<4000,"Retained vegetation, flowers and road edging use fewer shared cells")
	check(camp.scenery.find_children("MirrorLake","MeshInstance3D",true,false).size()==1,"Original lake has its native opaque water material")
	for destination in camp.destinations:
		camp.travel_to(destination)
		await frames(35)
		check(player.is_on_floor() and player.position.y>-5,"Safe walkable arrival: "+destination.name)
		if destination.temple:
			check(camp.interaction_text().begins_with("Read "),"Temple inscription: "+destination.name)
			var site:Dictionary = camp.layout.temples.filter(func(t): return t.id == destination.id)[0]
			var direction := Vector3(site.x-player.position.x,0,site.z-player.position.z).normalized()
			check((-player.global_basis.z).dot(direction)>.98,"Travel faces the temple: "+destination.name)
		if destination.id == "poseidon":
			check(player.position.y>1,"Poseidon arrival stands on the causeway, above the lake bed")
	# The central hall must retain all four unobstructed approaches.
	for index in range(4):
		var direction := Vector3(sin(index*PI/2),0,cos(index*PI/2))
		var query := PhysicsRayQueryParameters3D.create(direction*11+Vector3.UP*2,Vector3.UP*2)
		query.exclude = [player.get_rid()]
		check(camp.get_world_3d().direct_space_state.intersect_ray(query).is_empty(),"Great Hall doorway %d stays open" % (index+1))
	var hud = player.hud
	hud.open_map()
	await process_frame
	check(session.paused and is_instance_valid(hud.map_panel),"Opening the map pauses the world")
	check(hud.map_panel.find_children("*","Button",true,false).size()>=37,"Map exposes every destination and a close control")
	hud.map_panel.choose(camp.destinations[0])
	await frames(20)
	check(not session.paused and not is_instance_valid(hud.map_panel),"Choosing a destination closes the map and resumes movement")
	hud.open_map()
	await process_frame
	hud.handle_back()
	await process_frame
	check(not session.paused and not is_instance_valid(hud.map_panel),"Android Back closes the map cleanly")
	session.data.time = 1680.0
	var light_pose:Transform3D = camp.key_light.transform
	camp._process(.4)
	check(camp.key_light.transform.is_equal_approx(light_pose) and camp.key_light.light_energy>.6,"Legacy night saves cannot change the fixed evening light")
	session.data.time = 720.0
	camp._process(.4)
	check(camp.find_children("*","OmniLight3D",true,false).is_empty(),"Removed night-light slots do not remain in the scene")
	app.queue_free()
	await frames(4)
	DirAccess.remove_absolute(session.save_path)
	print("CAMP SMOKE: %d failure(s)" % failures)
	quit(0 if failures == 0 else 1)
