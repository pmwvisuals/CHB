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
	camp.player.set_physics_process(false)
	camp.player.camera.global_position = Vector3(0,camp.height(0,-56)+2.2,-56)
	camp.player.camera.look_at(fire.global_position+Vector3.UP*1.3)
	var counts:Array[int] = []
	var images:Array[Image] = []
	var energies:Array[float] = []
	for sample in range(4):
		for frame in range(45):
			await process_frame
		await RenderingServer.frame_post_draw
		var picture:Image = root.get_texture().get_image()
		picture.save_png("res://builds/campfire-"+str(sample)+".png")
		images.append(picture)
		energies.append(light.light_energy)
		var orange := 0
		for y in range(130,590,2):
			for x in range(380,900,2):
				var c:Color = picture.get_pixel(x,y)
				if c.r>.55 and c.g>.16 and c.r>c.g*1.12 and c.g>c.b*1.3:
					orange += 1
		counts.append(orange)
		check(orange>150,"Flame stays visibly bright at sample "+str(sample))
	check(energies.all(func(e): return e>=3.0 and e<=3.4),"Warm firelight varies gently within a continuously lit range")
	var changed := 0
	var active := 0
	for y in range(230,470,2):
		for x in range(500,770,2):
			var a:Color = images[0].get_pixel(x,y)
			var b:Color = images[1].get_pixel(x,y)
			if maxf(a.r,b.r)>.5 and maxf(a.g,b.g)>.15:
				active += 1
				if absf(a.r-b.r)+absf(a.g-b.g)+absf(a.b-b.b)>.12:
					changed += 1
	check(active>100 and float(changed)/active>.15,"Rendered flame visibly changes shape and internal flow")
	var stopped_energy:float = light.light_energy
	var phase:float = fire.phase
	session.paused = true
	fire._process(2)
	check(fire.phase==phase and light.light_energy==stopped_energy,"Pause freezes flame motion and firelight")
	print("FIRE MOTION ",changed," / ",active," light=",energies)
	print("FIRE PIXELS ",counts)
	if "--motion-preview" in OS.get_cmdline_user_args():
		session.paused = false
		fire.set_process(false)
		var folder := ProjectSettings.globalize_path("res://../.tools/campfire-motion")
		DirAccess.make_dir_recursive_absolute(folder)
		for i in range(60):
			fire._process(1.0/30)
			await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png(folder+"/frame-%03d.png" % i)
	app.queue_free()
	for i in range(3):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("CAMPFIRE CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
