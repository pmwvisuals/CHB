extends SceneTree
var failures := 0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func run():
	root.set_disable_input(true)
	var session=root.get_node("Session")
	session.save_path="res://tests/_surfaces-save.json"
	session.data.positions={}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	for id in ["arrival","training","lake"]:
		camp.travel_to(camp.destinations.filter(func(d):return d.id==id)[0])
		for i in range(20):await physics_frame
		var q=PhysicsRayQueryParameters3D.create(camp.player.position+Vector3.UP*.1,camp.player.position-Vector3.UP)
		q.exclude=[camp.player.get_rid()]
		var hit=camp.get_world_3d().direct_space_state.intersect_ray(q)
		check(not hit.is_empty() and absf(camp.player.camera.global_position.y-hit.position.y-1.82)<.04,"Full standing eye height on "+id)
	# Traverse the actual bank/ramp with the physical capsule, not map teleport.
	camp.player.position=Vector3(54,camp.height(54,5)+.2,5)
	camp.player.rotation.y=-PI/2
	for i in range(20):await physics_frame
	Input.action_press("forward")
	for i in range(150):await physics_frame
	Input.action_release("forward")
	check(camp.player.position.x>63 and camp.player.is_on_floor(),"Lake entrance can be walked continuously over the bank onto the causeway")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("SURFACE CHECK: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
