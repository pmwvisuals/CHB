extends SceneTree
func _initialize():call_deferred("run")
func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_lighting-preview-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp = app.world
	if "--calibrate" in OS.get_cmdline_user_args():
		camp.travel_to(camp.destinations.filter(func(d):return d.id=="arrival")[0])
		camp.player.camera.rotation.x=-.04
		for sample in [
			["aces",.9,1.2,.85,Environment.TONE_MAPPER_ACES],
			["filmic",.75,1.05,.85,Environment.TONE_MAPPER_FILMIC],
			["linear",.75,.9,.7,Environment.TONE_MAPPER_LINEAR],
			["soft",.65,1.25,.85,Environment.TONE_MAPPER_ACES]]:
			camp.key_light.light_energy=sample[1]
			camp.environment.ambient_light_energy=sample[2]
			camp.environment.tonemap_exposure=sample[3]
			camp.environment.tonemap_mode=sample[4]
			for i in range(45):await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://builds/lighting-calibration-"+sample[0]+".png")
	else:
		for view in [["grass",0,113,0,-.04],["sky",0,110,1.02,.42],["forest",124,-106,-.35,-.1]]:
			camp.player.position=Vector3(view[1],camp.height(view[1],view[2])+.1,view[2])
			camp.player.rotation.y=view[3]
			camp.player.camera.rotation.x=view[4]
			for i in range(65):await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://builds/lighting-"+view[0]+".png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	quit()
