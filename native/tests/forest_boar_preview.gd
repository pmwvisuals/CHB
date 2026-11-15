extends SceneTree

func _initialize():
	call_deferred("run")

func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_forest-boar-preview-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:
		await process_frame
	var forest = app.world
	var boar = forest.enemy
	forest.player.set_physics_process(false)
	for view in [["approach",Vector2(4,136)],["idle",Vector2(14,129)],["walk",Vector2(15,126)]]:
		var at:Vector2 = view[1]
		forest.player.position = Vector3(at.x,forest.height(at.x,at.y),at.y)
		forest.player.camera.position = Vector3(0,1.82,0)
		forest.player.camera.look_at(boar.position+Vector3.UP*.9)
		forest.refresh_collisions()
		forest.foliage_stream.refresh(true)
		boar.rest_time = 10 if view[0]!="walk" else 0
		for i in range(60):
			await process_frame
		forest.player.camera.look_at(boar.position+Vector3.UP*.9)
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/forest-boar-"+view[0]+".png")
		print("BOAR VIEW ",view[0]," clip=",boar.active_clip," floor=",boar.is_on_floor())
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
