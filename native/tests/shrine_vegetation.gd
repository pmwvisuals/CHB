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
	check(raw.batches.all(func(b):return not String(b.kind).begins_with("forest_fern ")),"Retired giant fern is absent from every camp batch")
	var tall_clear := true
	var tree_clear := true
	var grass_near := 0
	for b in raw.batches:
		for m in b.instances:
			var distance := Vector2(m[9]+b.center[0]+40,m[11]+b.center[2]+108).length()
			if distance<12 and (String(b.kind).begins_with("forest_bramble ") or String(b.kind).begins_with("forest_bracken ")):tall_clear=false
			if distance<13 and String(b.kind).begins_with("camp_olive bark"):tree_clear=false
			if distance<20 and b.kind=="Woodland grass patch":grass_near+=1
	check(tall_clear,"Shrine has a twelve-metre forecourt without tall undergrowth")
	check(tree_clear,"Nearby woodland trunks leave the shrine clear")
	check(grass_near>200 and grass_near<3000,"Shrine keeps sparse grass rather than the former dense carpet")
	print("SHRINE grass within 20m=",grass_near," (previously 5140)")
	var forest:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/deep-forest/layout.json"))
	check(not forest.ids.has("forest_fern") and forest.floor.all(func(p):return int(p[0])>=0 and int(p[0])<forest.ids.size()),"Deep Forest contains no retired fern prototype or placement")
	check(not FileAccess.file_exists("res://assets/forest_fern.glb"),"Unused standalone fern is removed from the game files")
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp = app.world
	check(camp.get_children().all(func(n):return not String(n.get_meta("plant_kind","")).begins_with("forest_fern ")),"Loaded native camp contains no giant fern draws")
	camp.player.set_physics_process(false)
	for view in [["approach",Vector3(-40,0,-91),Vector3(-40,2.3,-108)],["forecourt",Vector3(-32,0,-99),Vector3(-41,1.2,-109)]]:
		var point:Vector3 = view[1]
		point.y=camp.height(point.x,point.z)+1.82
		camp.player.position=point-Vector3.UP*1.82
		camp.player.camera.global_position=point
		var target:Vector3 = view[2]
		target.y+=camp.height(target.x,target.z)
		camp.player.camera.look_at(target)
		for i in range(45):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/shrine-"+view[0]+".png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("SHRINE VEGETATION: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
