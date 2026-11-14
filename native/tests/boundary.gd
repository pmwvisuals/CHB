extends SceneTree
var failures := 0
func _initialize():
	call_deferred("run")
func check(value:bool,description:String):
	print(("PASS: " if value else "FAIL: ")+description)
	if not value:
		failures += 1
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_boundary-save.json"
	session.data.coins = 7
	session.data.xp = 11
	session.data.positions = {"camp":[230,0,230]}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	for i in range(20):
		await physics_frame
	check(camp.inside_bounds(camp.player.position) and camp.player.position.distance_to(camp.spawn_position())<1,"An old position on trimmed land returns safely to Arrival Ridge")
	check(session.data.coins==7 and session.data.xp==11,"Boundary migration preserves progression")
	check(not camp.inside_bounds(Vector3(230,0,230)),"The former outer corner is outside the new perimeter")
	var area := 0.0
	for i in range(camp.boundary.size()):
		area += camp.boundary[i].cross(camp.boundary[(i+1)%camp.boundary.size()])
	check(absf(area)*.5<235*235*4*.7,"Walkable outline removes more than thirty percent of the old unused area")
	var walls_work := true
	for i in range(0,camp.boundary.size(),24):
		var point:Vector2 = camp.boundary[i]
		var normal:Vector2 = point.normalized()
		var a:Vector2 = point-normal*5
		var b:Vector2 = point+normal*5
		var query := PhysicsRayQueryParameters3D.create(Vector3(a.x,12,a.y),Vector3(b.x,12,b.y))
		query.exclude = [camp.player.get_rid()]
		walls_work = walls_work and not camp.get_world_3d().direct_space_state.intersect_ray(query).is_empty()
	check(walls_work,"Physical forest boundary stops crossings around the whole perimeter")
	var raw:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/camp-layout.json"))
	var front_trees := 0
	var tree_parts := 0
	var edge := PackedVector2Array()
	for p in raw.forestEdge:
		edge.append(Vector2(p[0],p[1]))
	for batch in raw.batches:
		if not batch.kind.begins_with("forest_") or not "bark high" in batch.kind or "bramble" in batch.kind:
			continue
		for transform in batch.instances:
			var point := Vector2(batch.center[0]+transform[9],batch.center[2]+transform[11])
			tree_parts += 1
			if Geometry2D.is_point_in_polygon(point,edge):
				front_trees += 1
	check(tree_parts>1800 and front_trees==0,"All dark forest trunks begin on the forest side of the shared edge")
	for id in ["ares","hephaestus"]:
		var temple:Dictionary = raw.temples.filter(func(t): return t.id==id)[0]
		var enclosed := true
		for x in [-10.5,10.5]:
			for z in [-10.0,16.0]:
				var corner := Vector2(temple.x+cos(temple.rotation)*x+sin(temple.rotation)*z,temple.z-sin(temple.rotation)*x+cos(temple.rotation)*z)
				enclosed = enclosed and not Geometry2D.is_point_in_polygon(corner,edge)
		check(enclosed,id+" building and forecourt lie entirely inside the forest belt")
	for id in ["ares","aphrodite","hephaestus"]:
		camp.travel_to(camp.destinations.filter(func(d): return d.id==id)[0])
		for i in range(12):
			await physics_frame
		check(camp.inside_bounds(camp.player.position) and camp.player.is_on_floor(),id+" retains its walkable approach beside the closer forest")
	var light_pose:Transform3D = camp.key_light.transform
	var sky_color:Color = camp.environment.sky.sky_material.sky_top_color
	session.data.time = 1800.0
	camp._process(60)
	check(camp.key_light.transform.is_equal_approx(light_pose) and camp.environment.sky.sky_material.sky_top_color==sky_color,"Time changes do not move the light or darken the sky")
	check(camp.key_light.sky_mode==DirectionalLight3D.SKY_MODE_LIGHT_ONLY,"The fixed lighting does not draw a procedural sun")
	var spheres := 0
	for part in camp.find_children("*","MeshInstance3D",true,false):
		if part.mesh is SphereMesh:
			spheres += 1
	check(spheres==0,"Sun/moon sphere models are absent")
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("BOUNDARY CHECK: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
