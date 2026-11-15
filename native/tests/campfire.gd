extends SceneTree

var failures := 0

func _initialize():
	call_deferred("run")

func check(value:bool,message:String):
	print(("PASS " if value else "FAIL ")+message)
	if not value:
		failures += 1

func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_campfire-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	var fire = camp.get_node("SanctuaryCampfire")
	check(fire.removed_flames==7,"All seven old flame cones are hidden")
	check(fire.find_children("*","AnimationPlayer",true,false).is_empty(),"Off-screen and zero-scale source animation is replaced")
	check(fire.find_children("*","MeshInstance3D",true,false).size()==1,"Supplied flame cards share one mesh draw")
	var light = fire.get_node("SteadyFirelight")
	var energy:float = light.light_energy
	camp.player.set_physics_process(false)
	camp.player.camera.global_position = Vector3(0,camp.height(0,-56)+2.2,-56)
	camp.player.camera.look_at(fire.global_position+Vector3.UP*1.3)
	var counts:Array[int] = []
	for sample in range(4):
		for frame in range(45):
			await process_frame
		await RenderingServer.frame_post_draw
		var picture:Image = root.get_texture().get_image()
		picture.save_png("res://builds/campfire-"+str(sample)+".png")
		var orange := 0
		for y in range(130,590,2):
			for x in range(380,900,2):
				var c:Color = picture.get_pixel(x,y)
				if c.r>.55 and c.g>.16 and c.r>c.g*1.12 and c.g>c.b*1.3:
					orange += 1
		counts.append(orange)
		check(orange>150,"Flame stays visibly bright at sample "+str(sample))
	check(light.light_energy==energy and energy>3,"Warm firelight remains steady")
	var phase:float = fire.phase
	session.paused = true
	fire._process(2)
	check(fire.phase==phase,"Pause stops flame movement")
	print("FIRE PIXELS ",counts)
	app.queue_free()
	for i in range(3):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("CAMPFIRE CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
