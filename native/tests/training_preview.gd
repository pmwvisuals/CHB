extends SceneTree

func _initialize():
	call_deferred("run")

func frames(count:int):
	for i in range(count):
		await physics_frame
		await process_frame

func capture(name:String):
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/training-"+name+".png")
	print("VIEW ",name," FPS=",Engine.get_frames_per_second())

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_training-preview-save.json"
	session.data = {"zone":"camp","coins":0,"xp":0,"health":100.0,"time":600.0,"positions":{}}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	var player = camp.player
	player.position = Vector3(-48.5,camp.height(-48.5,-20.6)+.12,-20.6)
	await frames(15)
	camp.training.start_round("sword")
	for i in range(3):
		player.attack()
		await frames(27)
	await capture("sword")
	player.position = Vector3(-66,camp.height(-66,-41.5)+.12,-41.5)
	player.velocity = Vector3.ZERO
	player.rotation.y = 0
	await frames(12)
	player.equip("bow")
	var target:Vector3 = camp.training.targets[1].global_position
	var distance:float = absf(target.z-player.camera.global_position.z)
	var flight:float = (distance-.65)/40
	player.pitch = atan2(target.y-player.camera.global_position.y+4.9*flight*flight,distance)
	player.camera.rotation.x = player.pitch
	camp.training.start_round("bow")
	session.bow_held = true
	await frames(78)
	await capture("draw")
	session.bow_held = false
	await frames(35)
	for i in range(4):
		player.draw_time = 1.2
		player.release_bow()
		await frames(35)
	await capture("score")
	app.queue_free()
	await frames(3)
	DirAccess.remove_absolute(session.save_path)
	quit()
