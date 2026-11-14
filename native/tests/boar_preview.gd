extends SceneTree
func _initialize():call_deferred("run")
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_boar-preview-save.json"
	session.data.time = 600.0
	var world = load("res://scripts/world.gd").new()
	world.forest = true
	root.add_child(world)
	world.set_process(false)
	world.build_sky()
	var ground := BoxMesh.new()
	ground.size = Vector3(150,.2,150)
	world.mesh_node(ground,Vector3(0,-.1,0),world.material("283c2b"))
	var boar = load("res://scenes/boar.tscn").instantiate()
	world.add_child(boar)
	boar.set_physics_process(false)
	var camera := Camera3D.new()
	world.add_child(camera)
	camera.position = Vector3(4.1,2.0,4.7)
	camera.look_at(Vector3(0,.95,0))
	for level in range(3):
		boar.select_lod(level)
		boar.play("Idle")
		for i in range(12):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/boar-lod"+str(level)+".png")
	boar.select_lod(0)
	boar.play("TuskAttack")
	boar.animation.advance(.7)
	boar.animation.pause()
	for i in range(3):await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/boar-attack.png")
	world.queue_free()
	await process_frame
	quit()
