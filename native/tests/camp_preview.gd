extends SceneTree

func _initialize():
	call_deferred("run")

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_camp-preview-save.json"
	session.data.positions = {}
	session.data.time = 600.0
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	for id in ["arrival","hall","wayfarer","training","lake","poseidon","ares","hephaestus"]:
		var destination:Dictionary = camp.destinations.filter(func(d): return d.id == id)[0]
		camp.travel_to(destination)
		camp.player.camera.rotation.x = .12 if id not in ["arrival","lake"] else -.04
		for i in range(75):
			await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/native-"+id+".png")
		print("VIEW ",id," FPS=",Engine.get_frames_per_second()," draws=",Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)," triangles=",Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME))
	camp.player.hud.open_map()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/native-map.png")
	camp.player.hud.close_map()
	var hall:Dictionary = camp.destinations.filter(func(d): return d.id == "hall")[0]
	camp.travel_to(hall)
	session.data.time = 1680.0
	for i in range(45):
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/native-night.png")
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
