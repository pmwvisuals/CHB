extends CanvasLayer

var world
var health:Label
var info:Label
var prompt:Button
var pause_panel:ColorRect
var toast:Label
var map_panel:Control
var attack_button:Button
var controls:Label
var toast_panel:PanelContainer
var last_message := ""
var toast_time := 0.0

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
	root.theme = Session.ui_theme
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	var plate := PanelContainer.new()
	plate.position = Vector2(14,12)
	plate.size = Vector2(402,104)
	plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(plate)
	var title := label_at(root,"ASTERION  /  " + ("DEEPWOOD" if world.forest else "SANCTUARY"),Vector2(30,22),21)
	title.add_theme_font_override("font",preload("res://fonts/Cinzel.ttf"))
	title.add_theme_color_override("font_color",Color("dfc991"))
	health = label_at(root,"",Vector2(30,57),18)
	info = label_at(root,"",Vector2(30,82),16)
	toast_panel = PanelContainer.new()
	root.add_child(toast_panel)
	pin(toast_panel,Control.PRESET_CENTER_BOTTOM,Rect2(-280,-194,560,98))
	toast_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var note_style := StyleBoxFlat.new()
	note_style.bg_color = Color(.025,.055,.045,.91)
	note_style.content_margin_left = 18
	note_style.content_margin_right = 18
	note_style.content_margin_top = 12
	note_style.content_margin_bottom = 12
	note_style.border_width_top = 1
	note_style.border_color = Color("aa945f")
	toast_panel.add_theme_stylebox_override("panel",note_style)
	toast = Label.new()
	toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	toast.max_lines_visible = 3
	toast.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	toast.add_theme_font_size_override("font_size",19)
	toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	toast_panel.add_child(toast)
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
		attack_button = button(root,"STRIKE",Vector2.ZERO,Vector2(112,80),func(): Session.attack_requested=true,true)
		attack_button.visible = false
		pin(attack_button,Control.PRESET_BOTTOM_RIGHT,Rect2(-152,-130,112,80))
		var jump = button(root,"JUMP",Vector2.ZERO,Vector2(94,64),func(): Session.jump_requested=true,true)
		pin(jump,Control.PRESET_BOTTOM_RIGHT,Rect2(-270,-112,94,64))
		var sprint := button(root,"RUN",Vector2.ZERO,Vector2(76,54),func(): pass,true)
		pin(sprint,Control.PRESET_BOTTOM_LEFT,Rect2(280,-94,76,54))
		sprint.button_down.connect(func(): Session.sprint_requested=true)
		sprint.button_up.connect(func(): Session.sprint_requested=false)
	else:
		var footer := ColorRect.new()
		footer.color = Color(.02,.045,.04,.84)
		footer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		root.add_child(footer)
		pin(footer,Control.PRESET_BOTTOM_LEFT,Rect2(0,-40,1280,40))
		controls = label_at(root,"",Vector2.ZERO,17)
		pin(controls,Control.PRESET_BOTTOM_LEFT,Rect2(26,-36,1100,32))
	pause_panel = ColorRect.new()
	pause_panel.color = Color(.035,.075,.06,.96)
	pause_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(pause_panel)
	var pause_title := label_at(pause_panel,"REST A MOMENT",Vector2(420,180),30)
	pause_title.add_theme_font_override("font",preload("res://fonts/Cinzel.ttf"))
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

func _process(delta):
	var armed:bool = world.player.combat_enabled()
	health.text = "VITALITY %d   ·   %d GOLD   ·   %d XP" % [Session.data.health,Session.data.coins,Session.data.xp]
	info.text = "TRAINING GROUND  ·  PRACTICE ENABLED" if armed else "WOODLAND  ·  EXPLORATION" if world.forest else "SANCTUARY  ·  WEAPONS SHEATHED"
	if armed and is_instance_valid(world.enemy):
		info.text += "     BOAR %d / 100" % world.enemy.health
	if is_instance_valid(attack_button):
		attack_button.visible = armed and not Session.paused
		attack_button.disabled = not armed or Session.paused
	if is_instance_valid(controls):
		controls.text = "WASD  Move    SHIFT  Run    MOUSE  Look    SPACE  Jump    E  Interact    M  Map    ESC  Pause"+("    CLICK  Practice" if armed else "")
	if last_message != Session.message:
		last_message = Session.message
		toast_time = 5.5
	if not Session.paused:
		toast_time = maxf(0,toast_time-delta)
	toast.text = Session.message
	var note_font := toast.get_theme_font("font")
	var note_width := clampf(note_font.get_string_size(toast.text,HORIZONTAL_ALIGNMENT_LEFT,-1,19).x+36,240,560)
	var note_height := mini(3,maxi(1,toast.get_line_count()))*note_font.get_height(19)+24
	toast_panel.offset_left = -note_width/2
	toast_panel.offset_right = note_width/2
	toast_panel.offset_top = -96-note_height
	toast_panel.offset_bottom = -96
	toast_panel.visible = toast_time>0 and not Session.paused
	prompt.text = world.interaction_text()
	prompt.visible = prompt.text != "" and not Session.paused
	pause_panel.visible = Session.paused and not is_instance_valid(map_panel)
