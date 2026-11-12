extends SceneTree

func _initialize():
	call_deferred("run")

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_preview-save.json"
	session.data.positions = {}
	session.data.time = 600.0
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	await process_frame
	await RenderingServer.frame_post_draw
	get_root().get_texture().get_image().save_png("res://builds/menu-preview.png")
	for zone in ["camp","forest"]:
		app.travel(zone)
		while app.transitioning:
			await process_frame
		for i in range(120):
			await process_frame
		if zone == "forest":
			app.world.player.position = Vector3(2,app.world.height(2,1),1)
			app.world.player.look(Vector2(.05,.08))
		await RenderingServer.frame_post_draw
		get_root().get_texture().get_image().save_png("res://builds/"+zone+"-preview.png")
		print("Rendered ",zone," at ",Engine.get_frames_per_second()," FPS; nodes=",get_node_count()," draw_calls=",Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)," triangles=",Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME))
	app.queue_free()
	await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
