extends SceneTree

var failures := 0

func check(condition:bool,description:String):
	print(("PASS: " if condition else "FAIL: ")+description)
	if not condition:
		failures += 1

func touch(index:int,pressed:bool,position:Vector2):
	var event := InputEventScreenTouch.new()
	event.index = index
	event.pressed = pressed
	event.position = position
	Input.parse_input_event(event)
	await process_frame

func drag(index:int,position:Vector2,relative:Vector2):
	var event := InputEventScreenDrag.new()
	event.index = index
	event.position = position
	event.relative = relative
	Input.parse_input_event(event)
	await process_frame

func _initialize():
	call_deferred("run")

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_touch-save.json"
	session.data.positions = {}
	session.touch_controls = true
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var player = app.world.player
	player.set_physics_process(false)
	await process_frame
	check(not player.weapon.visible and not player.hud.attack_button.visible,"Safe camp hides the weapon and Strike control")
	await touch(0,true,Vector2(1184,630))
	await touch(0,false,Vector2(1184,630))
	check(not session.attack_requested,"Safe camp cannot trigger a touch attack")
	var training:Dictionary = app.world.destinations.filter(func(d): return d.id == "training")[0]
	app.world.travel_to(training)
	await process_frame
	check(player.weapon.visible and player.hud.attack_button.visible,"Training ground reveals the weapon and Strike control")
	var screen := root.get_visible_rect()
	print("Viewport ",screen," final=",root.get_final_transform()," mouse_from_touch=",Input.is_emulating_mouse_from_touch())
	for stick in app.world.find_children("*","Control",true,false):
		if stick.get_script() == load("res://scripts/joystick.gd"):
			print("Joystick rectangle ",stick.get_global_rect()," visible=",stick.is_visible_in_tree())
	for b in app.world.find_children("*","Button",true,false):
		if b.text in ["STRIKE","JUMP","Ⅱ","RUN","MAP"]:
			check(screen.encloses(b.get_global_rect()),b.text+" fits inside the screen")
	await touch(0,true,Vector2(140,580))
	await drag(0,Vector2(140,520),Vector2(0,-60))
	print("Touch move ",session.touch_move)
	check(session.touch_move.y<-.5,"Joystick drag requests movement")
	var yaw:float = player.rotation.y
	await touch(1,true,Vector2(700,300))
	await drag(1,Vector2(760,300),Vector2(60,0))
	check(absf(player.rotation.y-yaw)>.05,"Second finger turns camera while moving")
	await touch(1,false,Vector2(1184,630))
	check(player.look_finger == -1,"Releasing camera over a button releases its finger")
	await touch(1,true,Vector2(1057,640))
	check(session.jump_requested and session.touch_move.y<-.5,"Second finger can jump while the joystick stays held")
	await touch(1,false,Vector2(1057,640))
	await touch(1,true,Vector2(1184,630))
	check(session.attack_requested and session.touch_move.y<-.5,"Second finger can strike while moving")
	await touch(1,false,Vector2(1184,630))
	await touch(1,true,Vector2(318,653))
	check(session.sprint_requested and session.touch_move.y<-.5,"Run can be held together with the joystick")
	await touch(1,false,Vector2(318,653))
	check(not session.sprint_requested,"Releasing Run clears sprint")
	await touch(0,false,Vector2(140,520))
	check(session.touch_move == Vector2.ZERO,"Joystick release stops movement")
	await touch(0,true,Vector2(1057,640))
	await touch(0,false,Vector2(1057,640))
	check(session.jump_requested,"Touching Jump requests a jump")
	await touch(0,true,Vector2(1184,630))
	await touch(0,false,Vector2(1184,630))
	check(session.attack_requested,"Touching Strike requests an attack")
	await touch(0,true,Vector2(1101,127))
	await touch(0,false,Vector2(1101,127))
	check(session.weapon_requested == "bow","The training Bow selector responds to touch")
	player.equip("bow")
	session.weapon_requested = ""
	session.attack_requested = false
	await process_frame
	await touch(0,true,Vector2(140,580))
	await drag(0,Vector2(140,520),Vector2(0,-60))
	await touch(1,true,Vector2(1184,630))
	check(session.bow_held and session.touch_move.y<-.5 and not session.attack_requested,"Bow drawing supports a second finger while moving")
	await touch(1,false,Vector2(1184,630))
	check(not session.bow_held,"Releasing the bow button clears the held input")
	await touch(0,false,Vector2(140,520))
	player.set_physics_process(true)
	await touch(0,true,Vector2(1184,630))
	for i in range(24):
		await physics_frame
		await process_frame
	check(player.draw_time>.12,"Holding the touch button visibly charges the bow")
	var shots:int = session.data.training.arrows_fired
	await touch(0,false,Vector2(1184,630))
	for i in range(3):
		await physics_frame
		await process_frame
	check(session.data.training.arrows_fired == shots+1,"Releasing touch fires exactly one physical arrow")
	player.set_physics_process(false)
	await touch(0,true,Vector2(1135,49))
	await touch(0,false,Vector2(1135,49))
	check(session.paused and is_instance_valid(player.hud.map_panel),"Touching Map opens the camp map")
	if "--capture-map" in OS.get_cmdline_user_args():
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/native-map.png")
	await touch(0,true,Vector2(1133,146))
	await touch(0,false,Vector2(1133,146))
	check(not session.paused and absf(player.position.x-77)<.1,"Touching Poseidon travels to the island approach")
	check(not player.weapon.visible and not player.hud.attack_button.visible,"Map travel out of practice immediately sheathes the weapon")
	app.queue_free()
	await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("TOUCH SMOKE: %d failure(s)" % failures)
	quit(0 if failures == 0 else 1)
