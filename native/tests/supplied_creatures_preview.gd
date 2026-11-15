extends SceneTree

func _initialize():call_deferred("run")

func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_supplied-preview-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:await process_frame
	var forest = app.world
	forest.player.set_physics_process(false)
	for actor in forest.supplied_creatures:
		actor.rest_time = 20
		var centre:Vector3 = actor.position
		var at:Vector2 = Vector2(centre.x,centre.z)+Vector2(5,6)
		forest.player.position = Vector3(at.x,forest.height(at.x,at.y),at.y)
		forest.player.camera.position = Vector3(0,1.82,0)
		forest.player.camera.look_at(centre+Vector3.UP*actor.model_height*.55)
		forest.refresh_collisions()
		forest.foliage_stream.refresh(true)
		for i in range(60):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/supplied-"+actor.name+".png")
		print("CREATURE VIEW ",actor.name," height=",actor.model_height," scale=",actor.visual.scale," grounded=",actor.is_on_floor()," animation=",actor.active_clip)
		if actor.walk_clip!="":
			actor.rest_time = 0
			for i in range(70):await process_frame
			forest.player.camera.look_at(actor.position+Vector3.UP*actor.model_height*.55)
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://builds/supplied-"+actor.name+"-walk.png")
			print("WALK VIEW ",actor.name," clip=",actor.active_clip)
	forest.player.hud.toggle_pause()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/supplied-creature-credits.png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
