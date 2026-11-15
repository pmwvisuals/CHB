extends SceneTree

func _initialize():
	call_deferred("run")

func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_deep-forest-preview-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:
		await process_frame
	var forest = app.world
	forest.player.set_physics_process(false)
	for view in [
		["entrance",Vector2(0,216),Vector2(-12,174)],
		["trail",Vector2(-8,160),Vector2(6,118)],
		["clearing",Vector2(6,124),Vector2(-30,60)],
		["hollow",Vector2(-65,-32),Vector2(-65,-70)],
		["ridge",Vector2(92,-64),Vector2(110,-8)],
		["deep",Vector2(48,-174),Vector2(38,-210)],
		["edge",Vector2(267,-31),Vector2(310,-45)]
	]:
		var at:Vector2 = view[1]
		var to:Vector2 = view[2]
		forest.player.position = Vector3(at.x,forest.height(at.x,at.y),at.y)
		forest.player.camera.position = Vector3(0,1.82,0)
		forest.player.camera.look_at(Vector3(to.x,forest.height(to.x,to.y)+1.2,to.y))
		forest.foliage_stream.refresh(true)
		forest.refresh_collisions()
		for i in range(55):
			await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/deep-forest-"+view[0]+".png")
		print("FOREST VIEW ",view[0]," FPS=",Engine.get_frames_per_second()," draws=",Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)," triangles=",Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME))
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
