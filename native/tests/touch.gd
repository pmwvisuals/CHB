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
	session.touch_controls = true
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var player = app.world.player
	player.set_physics_process(false)
	await process_frame
	var screen := root.get_visible_rect()
	print("Viewport ",screen," final=",root.get_final_transform()," mouse_from_touch=",Input.is_emulating_mouse_from_touch())
	for stick in app.world.find_children("*","Control",true,false):
		if stick.get_script() == load("res://scripts/joystick.gd"):
			print("Joystick rectangle ",stick.get_global_rect()," visible=",stick.is_visible_in_tree())
	for b in app.world.find_children("*","Button",true,false):
		if b.text in ["STRIKE","JUMP","Ⅱ"]:
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
	await touch(0,false,Vector2(140,520))
	check(session.touch_move == Vector2.ZERO,"Joystick release stops movement")
	await touch(0,true,Vector2(1057,640))
	await touch(0,false,Vector2(1057,640))
	check(session.jump_requested,"Touching Jump requests a jump")
	await touch(0,true,Vector2(1184,630))
	await touch(0,false,Vector2(1184,630))
	check(session.attack_requested,"Touching Strike requests an attack")
	app.queue_free()
	await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("TOUCH SMOKE: %d failure(s)" % failures)
	quit(0 if failures == 0 else 1)
