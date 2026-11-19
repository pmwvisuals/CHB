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
var training_panel:Control
var training_info:Label
var sword_button:Button
var bow_button:Button
var drill_button:Button
var draw_meter:ProgressBar
var graphics_panel:Control
var journal_panel:Control
var quest_tracker:Label
var heal_button:Button
var flight_button:Button
var jump_button:Button
var return_button:Button
var xp_meter:ProgressBar

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
	plate.size = Vector2(402,116)
	plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(plate)
	var title := label_at(root,"ASTERION  /  " + (world.theme.name if Session.data.zone=="temple" else "DEEPWOOD" if world.forest else "SANCTUARY"),Vector2(30,22),21)
	title.add_theme_font_override("font",preload("res://fonts/Cinzel.ttf"))
	title.add_theme_color_override("font_color",Color("dfc991"))
	health = label_at(root,"",Vector2(30,57),17)
	info = label_at(root,"",Vector2(30,82),15)
	xp_meter=ProgressBar.new()
	xp_meter.position=Vector2(30,108)
	xp_meter.size=Vector2(366,6)
	xp_meter.show_percentage=false
	for style_name in ["background","fill"]:
		var bar_style:=StyleBoxFlat.new()
		bar_style.bg_color=Color("b49a5c") if style_name=="fill" else Color("182c25")
		bar_style.content_margin_top=0
		bar_style.content_margin_bottom=0
		bar_style.content_margin_left=0
		bar_style.content_margin_right=0
		xp_meter.add_theme_stylebox_override(style_name,bar_style)
	xp_meter.mouse_filter=Control.MOUSE_FILTER_IGNORE
	root.add_child(xp_meter)
	quest_tracker=label_at(root,"",Vector2(30,140),17)
	quest_tracker.size=Vector2(382,80)
	quest_tracker.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	quest_tracker.max_lines_visible=3
	quest_tracker.mouse_filter=Control.MOUSE_FILTER_IGNORE
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
	var journal_button:=button(root,"JOURNAL",Vector2.ZERO,Vector2(112,54),open_journal)
	pin(journal_button,Control.PRESET_TOP_RIGHT,Rect2(-316,22,112,54))
	if Session.data.zone=="camp":
		var map_button := button(root,"MAP",Vector2.ZERO,Vector2(90,54),open_map)
		pin(map_button,Control.PRESET_TOP_RIGHT,Rect2(-190,22,90,54))
	training_panel = Control.new()
	training_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(training_panel)
	pin(training_panel,Control.PRESET_TOP_RIGHT,Rect2(-326,96,302,140))
	var training_plate := Panel.new()
	training_plate.size = Vector2(302,140)
	training_plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	training_panel.add_child(training_plate)
	sword_button = button(training_panel,"1  SWORD",Vector2(8,8),Vector2(92,46),func(): Session.weapon_requested="sword",Session.touch_controls)
	bow_button = button(training_panel,"2  BOW",Vector2(104,8),Vector2(86,46),func(): Session.weapon_requested="bow",Session.touch_controls)
	drill_button = button(training_panel,"R  DRILL",Vector2(194,8),Vector2(100,46),func(): Session.drill_requested=true,Session.touch_controls)
	for b in [sword_button,bow_button,drill_button]:
		b.add_theme_font_size_override("font_size",17)
	if Session.touch_controls:
		sword_button.text = "SWORD"
		bow_button.text = "BOW"
	training_info = label_at(training_panel,"",Vector2(14,66),16)
	training_info.size=Vector2(274,70)
	training_info.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	training_info.max_lines_visible=3
	training_info.mouse_filter = Control.MOUSE_FILTER_IGNORE
	draw_meter = ProgressBar.new()
	draw_meter.max_value = 1.2
	draw_meter.show_percentage = false
	draw_meter.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(draw_meter)
	pin(draw_meter,Control.PRESET_CENTER,Rect2(-70,32,140,8))
	if Session.touch_controls:
		var stick = preload("res://scripts/joystick.gd").new()
		root.add_child(stick)
		pin(stick,Control.PRESET_BOTTOM_LEFT,Rect2(20,-260,240,240))
		attack_button = button(root,"STRIKE",Vector2.ZERO,Vector2(112,80),func():
			if world.player.weapon_kind == "sword":
				Session.attack_requested=true
		,true)
		attack_button.button_down.connect(func():
			if world.player.weapon_kind == "bow":
				Session.bow_held=true
		)
		attack_button.button_up.connect(func(): Session.bow_held=false)
		attack_button.visible = false
		pin(attack_button,Control.PRESET_BOTTOM_RIGHT,Rect2(-152,-130,112,80))
		heal_button=button(root,"HEAL",Vector2.ZERO,Vector2(112,52),func():Session.heal_requested=true,true)
		pin(heal_button,Control.PRESET_BOTTOM_RIGHT,Rect2(-152,-198,112,52))
		jump_button = button(root,"JUMP",Vector2.ZERO,Vector2(94,64),func(): Session.jump_requested=true,true)
		pin(jump_button,Control.PRESET_BOTTOM_RIGHT,Rect2(-270,-112,94,64))
		flight_button=button(root,"FLIGHT",Vector2.ZERO,Vector2(112,64),func(): Session.flight_requested=true,true)
		pin(flight_button,Control.PRESET_BOTTOM_RIGHT,Rect2(-152,-112,112,64))
		flight_button.hide()
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
	button(pause_panel,"RESUME",Vector2(460,260),Vector2(360,58),toggle_pause)
	button(pause_panel,"GRAPHICS",Vector2(460,332),Vector2(360,58),open_graphics)
	button(pause_panel,"SAVE PROGRESS",Vector2(460,404),Vector2(360,58),save_progress)
	return_button=button(pause_panel,"RETURN TO SANCTUARY",Vector2(460,476),Vector2(360,58),func():Session.return_to_camp())
	var credit:=RichTextLabel.new()
	credit.position=Vector2(200,552)
	credit.size=Vector2(880,154)
	credit.bbcode_enabled=true
	credit.add_theme_font_size_override("normal_font_size",14)
	credit.text="[center]Lantern: Galaxy Abundant · CC BY 4.0 · [url=https://sketchfab.com/3d-models/vintage-brass-hurricane-lantern-unlit-46528337bec34fa49f2c71577efc7bc0]Source[/url] · [url=https://creativecommons.org/licenses/by/4.0/]License[/url]\nAdapted mesh, textures and scale; in-game flame and lighting added.\nMagic Wolf: alice.duarte13 · CC BY 4.0 · [url=https://sketchfab.com/3d-models/magic-wolf-2b183ca4a3984c1385856ca864c7508c]Source[/url] · [url=https://creativecommons.org/licenses/by/4.0/]License[/url]\nPraying Mantis: LostBoyz2078 · CC BY-NC 4.0 · [url=https://sketchfab.com/3d-models/praying-mantis-monster-7a629fa3040c4949954509101cb9b5cc]Source[/url] · [url=https://creativecommons.org/licenses/by-nc/4.0/]License[/url]\nCreature scale, grounding, material finish and behaviour adapted for this prototype.\nFantasy boar: user-supplied asset; creator and license unverified.\nMantis is for noncommercial prototype use. Confirm rights before commercial release.[/center]"
	credit.text+="\n[center]Ares Ludovisi: noe-3d.at · CC BY-NC 4.0 · [url=https://sketchfab.com/3d-models/ares-ludovisi-a2400788e3964cfca36c97f09a45dbf6]Source[/url] · Noncommercial prototype use.\nZeus: user-supplied scan; author/license unverified. Temple model credits are included in assets/temple-statues/CREDITS.txt.[/center]"
	credit.text+="\n[center]Poseidon scan: Revopoint 3D · [url=https://sketchfab.com/3d-models/poseidon-statue-3d-scanned-by-revopoint-trackit-13793d04fd974061aeaec2f68ce57648]Source[/url]\nTrident: Finn the Demon Cat · [url=https://sketchfab.com/3d-models/trident-66d41b0b9115486f9ec5112902028d1d]Source[/url]\nBoth CC BY 4.0 · [url=https://creativecommons.org/licenses/by/4.0/]License[/url] · Sculpture simplified, base leveled, marble finish applied, trident fitted.[/center]"
	credit.meta_clicked.connect(func(url):OS.shell_open(str(url)))
	pause_panel.add_child(credit)
	pause_panel.visible = false

func toggle_pause():
	Session.paused = not Session.paused
	Session.clear_touch()
	world.player.cancel_draw()
	if not Session.touch_controls:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Session.paused else Input.MOUSE_MODE_CAPTURED

func save_progress():
	if Session.save_game(world.player):
		Session.message = "Progress saved on this device."

func open_graphics():
	graphics_panel = preload("res://scripts/graphics_settings.gd").new()
	graphics_panel.closed.connect(func():
		graphics_panel.queue_free()
		graphics_panel = null
	)
	add_child(graphics_panel)

func open_map():
	if Session.data.zone!="camp" or Session.paused:
		return
	Session.paused = true
	Session.clear_touch()
	world.player.cancel_draw()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	map_panel = preload("res://scripts/camp_map.gd").new()
	map_panel.world = world
	map_panel.closed.connect(close_map)
	add_child(map_panel)

func close_map():
	if is_instance_valid(map_panel):
		if map_panel.traveling:
			return
		map_panel.queue_free()
	Session.paused = false
	Session.clear_touch()
	if not Session.touch_controls:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func handle_back():
	if is_instance_valid(journal_panel):
		close_journal()
	elif is_instance_valid(graphics_panel):
		graphics_panel.closed.emit()
	elif is_instance_valid(map_panel):
		close_map()
	else:
		toggle_pause()

func _unhandled_input(event):
	if event.is_action_pressed("journal"):
		get_viewport().set_input_as_handled()
		if is_instance_valid(journal_panel):close_journal()
		elif not Session.paused:open_journal()
	if event.is_action_pressed("camp_map") and Session.data.zone=="camp":
		get_viewport().set_input_as_handled()
		open_map()

func _process(delta):
	# Full-screen menus cover the scene; avoid drawing it underneath them.
	world.visible = not Session.paused
	var armed:bool = world.player.combat_enabled()
	var rules=Session.RULES
	var level:int=rules.level(Session.data.xp)
	health.text="LV %d · VITALITY %d / %d · %d GOLD"%[level,Session.data.health,rules.max_health(Session.data),Session.data.coins]
	info.text=(world.danger_name() if world.forest else "TRAINING · PRACTICE" if armed else "SACRED HALL · SAFE" if Session.data.zone=="temple" else "SANCTUARY · SAFE")+" · %d XP"%Session.data.xp
	var previous:int=0 if level==1 else rules.threshold(level-1)
	xp_meter.max_value=rules.threshold(level)-previous
	xp_meter.value=Session.data.xp-previous
	quest_tracker.text=rules.tracker(Session.data)
	quest_tracker.visible=not Session.paused
	var mounted:bool=is_instance_valid(world.player.mount)
	var flying:bool=mounted and world.player.mount.airborne
	var landing:bool=flying and world.player.mount.landing
	if mounted:
		info.text="DAWNWING · "+("LANDING" if landing else "IN FLIGHT" if flying else "RIDING")
	if is_instance_valid(flight_button):
		flight_button.visible=mounted and not Session.paused
		flight_button.text="CANCEL" if landing else "LAND" if flying else "FLIGHT"
		jump_button.text="CLIMB" if flying else "JUMP"
	if is_instance_valid(heal_button):
		heal_button.visible=world.forest and not Session.paused
		heal_button.text="HEAL · %d"%Session.data.adventure.potions
		heal_button.disabled=Session.data.adventure.potions<=0 or Session.data.health>=rules.max_health(Session.data) or Session.heal_cooldown>0
	return_button.disabled=world.forest and is_instance_valid(world.encounters) and world.encounters.in_combat()
	return_button.text="LOSE YOUR PURSUERS FIRST" if return_button.disabled else "RETURN TO SANCTUARY"
	if is_instance_valid(attack_button):
		attack_button.visible = armed and not Session.paused
		attack_button.disabled = not armed or Session.paused
		attack_button.text = "RELEASE" if world.player.draw_time>0 else "DRAW" if world.player.weapon_kind == "bow" else "STRIKE"
		if armed and world.player.weapon_kind == "bow" and is_instance_valid(world.training) and not world.training.can_shoot():
			attack_button.disabled = true
			attack_button.text = "5 / 5"
	training_panel.visible = armed and not Session.paused
	drill_button.visible=not world.forest
	draw_meter.visible = armed and not Session.paused and world.player.draw_time>0
	draw_meter.value = world.player.draw_time
	if armed and is_instance_valid(world.training):
		training_info.text = world.training.status_text(world.player.weapon_kind)
		sword_button.modulate = Color("e9cc88") if world.player.weapon_kind == "sword" else Color.WHITE
		bow_button.modulate = Color("e9cc88") if world.player.weapon_kind == "bow" else Color.WHITE
		drill_button.text = ("" if Session.touch_controls else "R  ")+("RETRY" if world.training.completed else "DRILL")
	if is_instance_valid(controls):
		controls.text = "WASD  Move   SHIFT  Run   MOUSE  Look   SPACE  Jump   E  Interact   M  Map   J  Journal   ESC  Pause"+(("   1/2 Weapon   H Heal" if world.forest else "   1/2 Weapon   R Drill") if armed else "")
		if mounted:controls.text="WASD  Steer   SPACE  Climb   F  Land / cancel   M  Map   ESC  Pause" if flying else "WASD  Ride   SHIFT  Trot   SPACE  Leap   F  Take off   E  Dismount   M  Map   ESC  Pause"
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
	pause_panel.visible = Session.paused and not is_instance_valid(map_panel) and not is_instance_valid(graphics_panel) and not is_instance_valid(journal_panel)


func open_journal():
	if Session.paused:return
	Session.paused=true
	Session.clear_touch()
	world.player.cancel_draw()
	Input.mouse_mode=Input.MOUSE_MODE_VISIBLE
	journal_panel=preload("res://scripts/adventure_journal.gd").new()
	journal_panel.world=world
	journal_panel.closed.connect(close_journal)
	add_child(journal_panel)

func close_journal():
	if is_instance_valid(journal_panel):journal_panel.queue_free()
	journal_panel=null
	Session.paused=false
	Session.clear_touch()
	if not Session.touch_controls:Input.mouse_mode=Input.MOUSE_MODE_CAPTURED
