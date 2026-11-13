extends Node

const SAVE := "user://sanctuary-save.json"
var save_path := SAVE
var data := {"zone":"camp", "coins":0, "xp":0, "health":100.0, "time":360.0, "positions":{}}
var touch_move := Vector2.ZERO
var jump_requested := false
var attack_requested := false
var interact_requested := false
var sprint_requested := false
var paused := false
var message := "Welcome to Asterion. Follow the northern path to the forest."
var app
var ui_theme:Theme
var touch_controls := OS.has_feature("mobile") or "--touch-controls" in OS.get_cmdline_user_args()

func _ready():
	Engine.max_fps = 30 if touch_controls else 60
	for action in ["left","right","forward","back","jump","attack","interact","pause","camp_map","sprint"]:
		InputMap.add_action(action)
	var keys = {"left":[KEY_A,KEY_LEFT],"right":[KEY_D,KEY_RIGHT],"forward":[KEY_W,KEY_UP],"back":[KEY_S,KEY_DOWN],"jump":[KEY_SPACE],"interact":[KEY_E],"pause":[KEY_ESCAPE],"camp_map":[KEY_M],"sprint":[KEY_SHIFT]}
	for action in keys:
		for code in keys[action]:
			var key := InputEventKey.new()
			key.physical_keycode = code
			InputMap.action_add_event(action,key)
	var mouse := InputEventMouseButton.new()
	mouse.button_index = MOUSE_BUTTON_LEFT
	InputMap.action_add_event("attack",mouse)
	load_game()

func load_game():
	if FileAccess.file_exists(save_path):
		var parsed = JSON.parse_string(FileAccess.get_file_as_string(save_path))
		if parsed is Dictionary and parsed.get("version",0) == 1:
			for key in data:
				if not parsed.has(key):
					continue
				if key in ["coins","xp"] and (parsed[key] is float or parsed[key] is int):
					data[key] = maxi(0,int(parsed[key]))
				elif typeof(parsed[key]) == typeof(data[key]):
					data[key] = parsed[key]
			if data.zone not in ["camp","forest"]:
				data.zone = "camp"
			data.health = clampf(data.health,1,100) if is_finite(data.health) else 100.0
			data.time = fposmod(data.time,1920.0) if is_finite(data.time) else 360.0

func save_game(player = null):
	if is_instance_valid(player):
		var p:Vector3 = player.global_position
		data.positions[data.zone] = [p.x,p.y,p.z]
	var payload = data.duplicate(true)
	payload.version = 1
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(save_path).get_base_dir())
	var file := FileAccess.open(save_path + ".tmp", FileAccess.WRITE)
	if file == null:
		push_warning("Cannot open save file: " + error_string(FileAccess.get_open_error()))
		message = "Unable to save progress."
		return false
	file.store_string(JSON.stringify(payload))
	file.close()
	var rename_error := DirAccess.rename_absolute(ProjectSettings.globalize_path(save_path + ".tmp"), ProjectSettings.globalize_path(save_path))
	if rename_error != OK:
		push_warning("Cannot replace save file: " + error_string(rename_error))
		message = "Unable to save progress."
		return false
	return true

func clear_touch():
	touch_move = Vector2.ZERO
	jump_requested = false
	attack_requested = false
	interact_requested = false
	sprint_requested = false

func change_zone(zone:String):
	if is_instance_valid(app):
		app.travel(zone)

func _notification(what):
	if what == NOTIFICATION_APPLICATION_PAUSED:
		if is_instance_valid(app) and is_instance_valid(app.world):
			save_game(app.world.player)
