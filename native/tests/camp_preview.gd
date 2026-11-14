extends SceneTree

func _initialize():
	call_deferred("run")

func run():
	root.set_disable_input(true)
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
	for id in ["arrival","hall","wayfarer","training","lake","poseidon","ares","hephaestus","aphrodite"]:
		session.paused = false
		var destination:Dictionary = camp.destinations.filter(func(d): return d.id == id)[0]
		camp.travel_to(destination)
		camp.player.camera.rotation.x = .12 if id not in ["arrival","lake"] else -.04
		for i in range(75):
			await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/native-"+id+".png")
		print("VIEW ",id," FPS=",Engine.get_frames_per_second()," draws=",Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)," triangles=",Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME))
		if Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)<100000:
			push_error("Preview scenery was covered by a menu")
			quit(1)
			return
	for id in ["ares","hephaestus","aphrodite"]:
		camp.travel_to(camp.destinations.filter(func(d): return d.id==id)[0])
		var temple:Dictionary = camp.layout.temples.filter(func(t): return t.id==id)[0]
		var centre := Vector3(temple.x,temple.height+2,temple.z)
		var inward := -Vector3(temple.x,0,temple.z).normalized()
		camp.player.set_physics_process(false)
		camp.player.camera.global_position = centre+inward*40+Vector3.UP*23
		camp.player.camera.look_at(centre)
		for i in range(45):
			await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/native-"+id+"-forest.png")
		camp.player.set_physics_process(true)
	camp.player.hud.open_map()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/native-map.png")
	camp.player.hud.close_map()
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
