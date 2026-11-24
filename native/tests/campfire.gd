extends SceneTree

var failures := 0

func _initialize():
	call_deferred("run")

func check(condition:bool,description:String):
	print(("PASS " if condition else "FAIL ")+description)
	if not condition:
		failures += 1

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_campfire-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	camp.player.set_physics_process(false)
	for frame in range(5):
		await physics_frame
	check(not camp.has_node("SanctuaryCampfire"),"No fire node, flame animation or firelight is created")
	check(camp.layout.routes.all(func(route):return route.name!="Ember walk"),"The retired access path is absent")
	check(camp.layout.labels.all(func(label):return not "AMPHITHEATRE" in str(label)),"No amphitheatre label remains")
	for spot in [Vector2.ZERO,Vector2(8,0),Vector2(-8,0),Vector2(0,9),Vector2(0,-11)]:
		var at:Vector2=Vector2(0,-62)+spot
		var height:float=camp.height(at.x,at.y)
		var ray:=PhysicsRayQueryParameters3D.create(Vector3(at.x,height+3,at.y),Vector3(at.x,height-1,at.y))
		ray.exclude=[camp.player.get_rid(),camp.pegasus.get_rid()]
		var hit:Dictionary=camp.get_world_3d().direct_space_state.intersect_ray(ray)
		check(not hit.is_empty() and absf(hit.position.y-height)<.06,"Open walking surface matches the ground at "+str(at))
	var grid:Dictionary=camp.layout.heightfield
	check(grid.size>0,"The camp terrain heightfield remains available")
	if "--capture" in OS.get_cmdline_user_args():
		camp.player.position=Vector3(0,camp.height(0,-45)+.06,-45)
		camp.player.camera.look_at(Vector3(0,camp.height(0,-64),-64))
		for frame in range(8):
			await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/campfire-cleared.png")
	app.queue_free()
	for frame in range(3):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("CLEARED CAMPFIRE CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
