extends SceneTree
var failures := 0
func _initialize():call_deferred("run")
func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path="res://tests/_roads-save.json"
	session.data.positions={}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	await physics_frame
	for temple in camp.layout.temples:
		if temple.id=="poseidon":continue
		var connected := true
		for distance in [10.5,12.0,14.0,16.0]:
			var point:Vector3=Vector3(temple.x,0,temple.z)+Basis(Vector3.UP,temple.rotation)*Vector3(0,0,distance)
			point.y=camp.height(point.x,point.z)
			var ray=PhysicsRayQueryParameters3D.create(point+Vector3.UP*4,point-Vector3.UP*2)
			var hit:Dictionary=camp.get_world_3d().direct_space_state.intersect_ray(ray)
			connected=connected and not hit.is_empty() and hit.position.y>point.y+.075
		print(("PASS " if connected else "FAIL ")+temple.id+" continuous paved approach to entrance ramp")
		if not connected:failures+=1
	session.paused=false
	DisplayServer.window_move_to_foreground()
	camp.player.set_physics_process(false)
	for id in ["hera","athena","ares","wayfarer","training","arrival"]:
		camp.travel_to(camp.destinations.filter(func(d):return d.id==id)[0])
		camp.player.camera.rotation.x=.18
		for i in range(8):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/roads-"+id+".png")
	for view in [["wayfarer-join",Vector3(-46,0,67),Vector3(-53,0,61)],["training-join",Vector3(-58,0,-14),Vector3(-66,0,-23)],["old-gardens",Vector3(-3,0,57),Vector3(-15,0,43)],["central-join",Vector3(10,0,33),Vector3(0,0,30)]]:
		var point:Vector3=view[1]
		point.y=camp.height(point.x,point.z)+2.2
		camp.player.position=point-Vector3.UP*1.82
		camp.player.camera.global_position=point
		var target:Vector3=view[2]
		target.y=camp.height(target.x,target.z)
		camp.player.camera.look_at(target)
		for i in range(8):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/roads-"+view[0]+".png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("ROAD APPROACHES: %d failures" % failures)
	quit(0 if failures==0 else 1)

