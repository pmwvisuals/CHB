extends Node

var world
var loading_path := ""
var layer:CanvasLayer
var backdrop:ColorRect
var menu:PanelContainer
var title:Label
var detail:Label
var play:Button
var progress:ProgressBar
var transitioning := false

func _ready():
	Session.app = self
	layer = CanvasLayer.new()
	layer.layer = 20
	add_child(layer)
	backdrop = ColorRect.new()
	backdrop.color = Color("14231f")
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(backdrop)
	menu = PanelContainer.new()
	menu.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	menu.position = Vector2(-280,-160)
	menu.custom_minimum_size = Vector2(560,320)
	backdrop.add_child(menu)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation",20)
	menu.add_child(box)
	title = Label.new()
	title.text = "ASTERION SANCTUARY"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size",30)
	box.add_child(title)
	detail = Label.new()
	detail.text = "Native Android prototype\nCamp • Woodland • First encounter\n\nProgress is saved on this device."
	detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(detail)
	progress = ProgressBar.new()
	progress.visible = false
	box.add_child(progress)
	play = Button.new()
	play.text = "ENTER SANCTUARY"
	play.custom_minimum_size.y = 60
	play.pressed.connect(func(): travel(Session.data.zone))
	box.add_child(play)

func travel(zone:String):
	if transitioning or zone not in ["camp","forest"]:
		return
	transitioning = true
	if is_instance_valid(world):
		Session.save_game(world.player)
		world.queue_free()
		world = null
	Session.clear_touch()
	Session.paused = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	backdrop.visible = true
	play.visible = false
	progress.visible = true
	progress.value = 0
	detail.text = "Loading woodland…" if zone == "forest" else "Loading sanctuary…"
	# Release the previous region before requesting the next one.
	await get_tree().process_frame
	Session.data.zone = zone
	loading_path = "res://scenes/" + zone + ".tscn"
	var result := ResourceLoader.load_threaded_request(loading_path)
	if result != OK:
		load_failed()

func _process(_delta):
	if loading_path == "":
		return
	var amount := []
	var status := ResourceLoader.load_threaded_get_status(loading_path,amount)
	if not amount.is_empty():
		progress.value = amount[0] * 100.0
	if status == ResourceLoader.THREAD_LOAD_LOADED:
		var packed = ResourceLoader.load_threaded_get(loading_path)
		loading_path = ""
		world = packed.instantiate()
		add_child(world)
		set_process(false)
		await world.prepare()
		transitioning = false
		Session.paused = false
		backdrop.visible = false
		set_process(true)
		if not Session.touch_controls:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif status == ResourceLoader.THREAD_LOAD_FAILED or status == ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
		load_failed()

func load_failed():
	transitioning = false
	loading_path = ""
	detail.text = "This area could not load. Check the imported assets and try again."
	play.visible = true
	play.text = "RETRY"
	progress.visible = false

func _notification(what):
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		if is_instance_valid(world):
			Session.save_game(world.player)
	if what == NOTIFICATION_WM_GO_BACK_REQUEST and is_instance_valid(world) and not transitioning:
		Session.paused = not Session.paused
		Session.clear_touch()
