extends SceneTree
func _initialize():
	call_deferred("run")
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_polish-preview-save.json"
	session.data.positions = {}
	session.data.time = 600.0
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/polish-menu.png")
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	for id in (["poseidon"] if "--quick" in OS.get_cmdline_user_args() else ["training","hall","poseidon","ares"]):
		var destination:Dictionary = camp.destinations.filter(func(d): return d.id == id)[0]
		camp.travel_to(destination)
		camp.player.camera.rotation.x = .18
		if id == "training":
			camp.player.position = Vector3(-64,camp.height(-64,-31)+.15,-31)
			camp.player.rotation.y = 0
			camp.player.camera.rotation.x = -.35
		for i in range(75):
			await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/polish-"+id+".png")
		print("VIEW ",id," FPS=",Engine.get_frames_per_second())
	camp.player.hud.open_map()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/polish-map.png")
	app.queue_free()
	for i in range(3):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
