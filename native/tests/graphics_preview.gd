extends SceneTree

func _initialize():
	call_deferred("run")
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_graphics-preview-save.json"
	session.data.positions = {}
	session.data.time = 600.0
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	for id in ["arrival","training"]:
		app.world.travel_to(app.world.destinations.filter(func(d): return d.id == id)[0])
		for quality in ["balanced","high"]:
			session.set_graphics_quality(quality)
			for i in range(65):
				await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://builds/graphics-"+id+"-"+quality+".png")
			print("QUALITY VIEW ",id," ",quality," FPS=",Engine.get_frames_per_second()," draws=",Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)," primitives=",Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME))
	app.queue_free()
	for i in range(3):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
