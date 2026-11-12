extends CanvasLayer

var world
var health:Label
var info:Label
var prompt:Button
var pause_panel:ColorRect
var toast:Label
var map_panel:Control

func label_at(parent,text:String,at:Vector2,font_size:int=20) -> Label:
	var label := Label.new()
	label.text = text
	label.position = at
	label.add_theme_font_size_override("font_size",font_size)
	label.add_theme_color_override("font_color",Color("e7e0c6"))
	parent.add_child(label)
	return label

func button(parent,text:String,at:Vector2,extent:Vector2,callback:Callable,multitouch:bool=false) -> Button:
	var b:Button = preload("res://scripts/touch_action.gd").new() if multitouch else Button.new()
	b.text = text
	b.position = at
	b.size = extent
	b.pressed.connect(callback)
	parent.add_child(b)
	return b

func pin(control:Control,preset:int,rect:Rect2):
	control.set_anchors_preset(preset)
	control.offset_left = rect.position.x
	control.offset_top = rect.position.y
	control.offset_right = rect.end.x
	control.offset_bottom = rect.end.y

func _ready():
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	label_at(root,"ASTERION  /  " + ("DEEPWOOD" if world.forest else "SANCTUARY"),Vector2(26,20),24)
	health = label_at(root,"",Vector2(26,58))
	info = label_at(root,"",Vector2(26,88),17)
	toast = label_at(root,"",Vector2(26,128),18)
	var cross := Label.new()
	cross.text = "·"
	cross.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	cross.position -= Vector2(4,14)
	root.add_child(cross)
	prompt = button(root,"",Vector2.ZERO,Vector2(220,56),func(): Session.interact_requested=true)
	pin(prompt,Control.PRESET_CENTER_BOTTOM,Rect2(-110,-86,220,56))
	var pause := button(root,"Ⅱ",Vector2.ZERO,Vector2(62,54),toggle_pause)
	pin(pause,Control.PRESET_TOP_RIGHT,Rect2(-86,22,62,54))
	if not world.forest:
		var map_button := button(root,"MAP",Vector2.ZERO,Vector2(90,54),open_map)
		pin(map_button,Control.PRESET_TOP_RIGHT,Rect2(-190,22,90,54))
	if Session.touch_controls:
		var stick = preload("res://scripts/joystick.gd").new()
		root.add_child(stick)
		pin(stick,Control.PRESET_BOTTOM_LEFT,Rect2(20,-260,240,240))
		var attack = button(root,"STRIKE",Vector2.ZERO,Vector2(112,80),func(): Session.attack_requested=true,true)
		pin(attack,Control.PRESET_BOTTOM_RIGHT,Rect2(-152,-130,112,80))
		var jump = button(root,"JUMP",Vector2.ZERO,Vector2(94,64),func(): Session.jump_requested=true,true)
		pin(jump,Control.PRESET_BOTTOM_RIGHT,Rect2(-270,-112,94,64))
		var sprint := button(root,"RUN",Vector2.ZERO,Vector2(76,54),func(): pass,true)
		pin(sprint,Control.PRESET_BOTTOM_LEFT,Rect2(280,-94,76,54))
		sprint.button_down.connect(func(): Session.sprint_requested=true)
		sprint.button_up.connect(func(): Session.sprint_requested=false)
	else:
		var controls = label_at(root,"WASD  Move    Shift  Run    Mouse  Look    Space  Jump    Click  Strike    E  Interact    M  Map    Esc  Pause",Vector2.ZERO,16)
		pin(controls,Control.PRESET_BOTTOM_LEFT,Rect2(26,-36,1100,32))
	pause_panel = ColorRect.new()
	pause_panel.color = Color(.035,.075,.06,.96)
	pause_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(pause_panel)
	label_at(pause_panel,"REST A MOMENT",Vector2(420,180),32)
	button(pause_panel,"RESUME",Vector2(460,280),Vector2(360,58),toggle_pause)
	button(pause_panel,"SAVE PROGRESS",Vector2(460,354),Vector2(360,58),save_progress)
	button(pause_panel,"RETURN TO SANCTUARY",Vector2(460,428),Vector2(360,58),func(): Session.paused=false;Session.change_zone("camp"))
	pause_panel.visible = false

func toggle_pause():
	Session.paused = not Session.paused
	Session.clear_touch()
	if not Session.touch_controls:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Session.paused else Input.MOUSE_MODE_CAPTURED

func save_progress():
	if Session.save_game(world.player):
		Session.message = "Progress saved on this device."

func open_map():
	if world.forest or Session.paused:
		return
	Session.paused = true
	Session.clear_touch()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	map_panel = preload("res://scripts/camp_map.gd").new()
	map_panel.world = world
	map_panel.closed.connect(close_map)
	add_child(map_panel)

func close_map():
	if is_instance_valid(map_panel):
		map_panel.queue_free()
	Session.paused = false
	Session.clear_touch()
	if not Session.touch_controls:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func handle_back():
	if is_instance_valid(map_panel):
		close_map()
	else:
		toggle_pause()

func _unhandled_input(event):
	if event.is_action_pressed("camp_map") and not world.forest:
		get_viewport().set_input_as_handled()
		open_map()

func _process(_delta):
	health.text = "HEALTH %d     COINS %d     XP %d" % [Session.data.health,Session.data.coins,Session.data.xp]
	info.text = "SAFE HAVEN  •  Recover and prepare" if not world.forest else "WOODLAND  •  Stay alert"
	if is_instance_valid(world.enemy):
		info.text += "     BOAR %d / 100" % world.enemy.health
	toast.text = Session.message
	prompt.text = world.interaction_text()
	prompt.visible = prompt.text != "" and not Session.paused
	pause_panel.visible = Session.paused and not is_instance_valid(map_panel)
