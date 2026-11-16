extends SceneTree
var failures := 0
func _initialize():call_deferred("run")
func check(value:bool,label:String):
	print(("PASS " if value else "FAIL ")+label)
	if not value:failures+=1
func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_shrine-vegetation-save.json"
	session.data.positions = {}
	var raw:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/camp-layout.json"))
	var shrine:Dictionary=raw.shrine
	var centre:=Vector2(shrine.x,shrine.z)
	check(centre.distance_to(Vector2(-40,-108))>65,"Shrine moved away from the former central grove")
	check(raw.batches.all(func(b):return not String(b.kind).begins_with("forest_fern ")),"Retired giant fern stays absent")
	check(raw.batches.all(func(b):return b.kind!="Woodland grass patch"),"Former bespoke grove and dense grass carpet are removed")
	var clearing := true
	var surrounding_trees := 0
	for b in raw.batches:
		if not String(b.kind).begins_with("forest_"):continue
		for m in b.instances:
			var distance := Vector2(m[9]+b.center[0],m[11]+b.center[2]).distance_to(centre)
			if distance<shrine.clearingRadius:clearing=false
			if distance<22 and "bark high" in b.kind:surrounding_trees+=1
	check(clearing,"Shrine clearing has no obstructing forest trunks or tall understory")
	check(surrounding_trees>12,"Dark boundary trees surround the new shrine")
	check(raw.labels.any(func(l):return "FORGOTTEN SHRINE" in String(l.text) and Vector2(l.position[0],l.position[2]).distance_to(centre)<9),"Shrine discovery plaque follows its new location")
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	await physics_frame
	var old:=Vector3(-40,camp.height(-40,-108),-108)
	var ray=PhysicsRayQueryParameters3D.create(old+Vector3.UP*3,old-Vector3.UP)
	var hit:Dictionary=camp.get_world_3d().direct_space_state.intersect_ray(ray)
	check(not hit.is_empty() and absf(hit.position.y-old.y)<.2,"Old shrine site has ordinary walkable camp ground without the former altar")
	var pad:=Vector3(centre.x,shrine.height,centre.y)+Basis(Vector3.UP,shrine.rotation)*Vector3(0,0,2)
	ray=PhysicsRayQueryParameters3D.create(pad+Vector3.UP*2,pad-Vector3.UP)
	hit=camp.get_world_3d().direct_space_state.intersect_ray(ray)
	check(not hit.is_empty() and absf(hit.position.y-(shrine.height+.24))<.03,"Shrine foundation collision moved with the visible structure")
	check(camp.gate.distance_to(Vector3(-40,camp.height(-40,-121),-121))<.01,"Deepwood Gate retains its existing location")
	session.paused=false
	DisplayServer.window_move_to_foreground()
	camp.player.set_physics_process(false)
	var facing:=Basis(Vector3.UP,shrine.rotation)
	for view in [["approach",Vector3(centre.x,0,centre.y)+facing*Vector3(0,0,14),Vector3(centre.x,2,centre.y)],["forecourt",Vector3(centre.x,0,centre.y)+facing*Vector3(6,0,7),Vector3(centre.x,2,centre.y)],["old-site",Vector3(-34,0,-92),Vector3(-40,0,-108)]]:
		var point:Vector3=view[1]
		point.y=camp.height(point.x,point.z)+1.82
		camp.player.position=point-Vector3.UP*1.82
		camp.player.camera.global_position=point
		var target:Vector3=view[2]
		target.y+=camp.height(target.x,target.z)
		camp.player.camera.look_at(target)
		for i in range(12):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/shrine-relocated-"+view[0]+".png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("SHRINE RELOCATION: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
