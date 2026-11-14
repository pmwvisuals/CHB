extends SceneTree
func _initialize():call_deferred("run")
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_plants-preview-save.json"
	var helper = load("res://scripts/imported_plants.gd").new()
	var meshes:Dictionary = helper.load_prototypes()
	var world = load("res://scripts/world.gd").new()
	root.add_child(world)
	world.set_process(false)
	world.build_sky()
	var ground := BoxMesh.new()
	ground.size = Vector3(30,.2,30)
	var floor_visual = world.mesh_node(ground,Vector3(0,-.1,0),world.material("34452d"))
	floor_visual.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	for entry in [["GrassFresh0",Vector3(-1,0,1),.28],["GrassFresh1",Vector3(-.3,0,.8),.25],["GrassAged0",Vector3(.4,0,.9),.25],["GrassTall0",Vector3(1.2,0,.9),.75],["BushGarden",Vector3(-.9,0,-.8),.9],["BushLakeside",Vector3(.8,0,-1),.8]]:
		var part:MeshInstance3D = meshes[entry[0]].duplicate()
		world.add_child(part)
		part.position = entry[1]
		part.scale = Vector3.ONE*entry[2]
	var camera := Camera3D.new()
	world.add_child(camera)
	camera.fov = 45
	camera.position = Vector3(1.9,1.15,2.6)
	camera.look_at(Vector3(0,.4,-.15))
	for i in range(20):await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/imported-plants-patch.png")
	helper.dispose()
	world.queue_free()
	await process_frame
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp = app.world
	camp.player.set_physics_process(false)
	for view in [["garden",Vector2(0,35)],["lakeside",Vector2(55,5)]]:
		var nearest := Vector3.ZERO
		var distance := INF
		for node in camp.get_children():
			if not node is MultiMeshInstance3D or node.get_meta("plant_kind","")!="Imported flower bushes":continue
			if view[0]=="lakeside" and node.get_meta("plant_proto","")!="BushLakeside":continue
			for i in range(node.multimesh.instance_count):
				var point:Vector3 = node.position+node.multimesh.get_instance_transform(i).origin
				var candidate := Vector2(point.x,point.z).distance_squared_to(view[1])
				if candidate<distance:nearest=point;distance=candidate
		camp.player.position = nearest
		camp.player.camera.global_position = nearest+Vector3(1.8,1.05,2.1)
		camp.player.camera.look_at(nearest+Vector3.UP*.3)
		for i in range(20):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/imported-plants-"+view[0]+".png")
	app.queue_free()
	for i in range(3):await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
