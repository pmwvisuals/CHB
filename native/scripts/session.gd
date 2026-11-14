extends Node

const SAVE := "user://sanctuary-save.json"
var save_path := SAVE
var data := {"zone":"camp", "coins":0, "xp":0, "health":100.0, "time":360.0, "positions":{}, "training":{},"graphics_quality":""}
const GRAPHICS := preload("res://scripts/graphics_quality.gd")
var graphics_recommended := "high"
const TRAINING_KEYS := ["archery_best","sword_best","archery_rounds","sword_rounds","arrows_fired","target_hits","sword_hits","combos"]
var touch_move := Vector2.ZERO
var jump_requested := false
var attack_requested := false
var bow_held := false
var weapon_requested := ""
var drill_requested := false
var interact_requested := false
var sprint_requested := false
var paused := false
var message := "Welcome to Asterion. Follow the northern path to the forest."
var app
var ui_theme:Theme
var render_profile:Dictionary = {}
var profile_tick := 0
var touch_controls := OS.has_feature("mobile") or "--touch-controls" in OS.get_cmdline_user_args()

func _ready():
	Engine.max_fps = 30 if touch_controls else 60
	if OS.has_feature("mobile") and OS.is_debug_build():
		print("PERF user_dir=",OS.get_user_data_dir())
		var reader := JSON.new()
		if FileAccess.file_exists("user://render-profile.json") and reader.parse(FileAccess.get_file_as_string("user://render-profile.json")) == OK and reader.data is Dictionary:
			render_profile = reader.data
		print("PERF config=",JSON.stringify(render_profile))
	for action in ["left","right","forward","back","jump","attack","interact","pause","camp_map","sprint","sword","bow","drill"]:
		InputMap.add_action(action)
	var keys = {"left":[KEY_A,KEY_LEFT],"right":[KEY_D,KEY_RIGHT],"forward":[KEY_W,KEY_UP],"back":[KEY_S,KEY_DOWN],"jump":[KEY_SPACE],"interact":[KEY_E],"pause":[KEY_ESCAPE],"camp_map":[KEY_M],"sprint":[KEY_SHIFT],"sword":[KEY_1],"bow":[KEY_2],"drill":[KEY_R]}
	for action in keys:
		for code in keys[action]:
			var key := InputEventKey.new()
			key.physical_keycode = code
			InputMap.action_add_event(action,key)
	var mouse := InputEventMouseButton.new()
	mouse.button_index = MOUSE_BUTTON_LEFT
	InputMap.action_add_event("attack",mouse)
	load_game()
	ensure_training()
	graphics_recommended = GRAPHICS.recommend(int(OS.get_memory_info().get("physical",0)),OS.has_feature("mobile"),"64" if OS.has_feature("64") else "32")
	if not GRAPHICS.valid(data.get("graphics_quality")):
		data.graphics_quality = graphics_recommended
	if GRAPHICS.valid(render_profile.get("quality")):
		data.graphics_quality = render_profile.quality
	apply_graphics()

func graphics_quality() -> String:
	return data.get("graphics_quality") if GRAPHICS.valid(data.get("graphics_quality")) else graphics_recommended

func graphics_preset() -> Dictionary:
	return GRAPHICS.PRESETS[graphics_quality()]

func set_graphics_quality(value:String) -> bool:
	if not GRAPHICS.valid(value):
		return false
	data.graphics_quality = value
	apply_graphics()
	save_game(app.world.player if is_instance_valid(app) and is_instance_valid(app.world) else null)
	return true

func apply_graphics():
	get_viewport().scaling_3d_scale = graphics_preset().scale
	if is_instance_valid(app) and is_instance_valid(app.world) and is_instance_valid(app.world.player):
		app.world.apply_graphics()

func ensure_training():
	if not data.get("training") is Dictionary:
		data.training = {}
	for key in TRAINING_KEYS:
		var value = data.training.get(key,0)
		data.training[key] = clampi(int(value),0,100000000) if (value is float or value is int) and is_finite(float(value)) else 0
	data.training.archery_best = mini(50,data.training.archery_best)

func load_game():
	if FileAccess.file_exists(save_path):
		var reader := JSON.new()
		if reader.parse(FileAccess.get_file_as_string(save_path)) != OK:
			ensure_training()
			return
		var parsed = reader.data
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
	ensure_training()

func save_game(player = null):
	# Diagnostic runs must never overwrite the player's position or records.
	if not render_profile.is_empty():
		return true
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
	bow_held = false
	weapon_requested = ""
	drill_requested = false
	interact_requested = false
	sprint_requested = false

func change_zone(zone:String):
	if is_instance_valid(app):
		app.travel(zone)

func _notification(what):
	if what == NOTIFICATION_APPLICATION_PAUSED:
		if is_instance_valid(app) and is_instance_valid(app.world):
			save_game(app.world.player)

func _process(_delta):
	if not OS.has_feature("mobile") or not OS.is_debug_build() or not is_instance_valid(app) or not is_instance_valid(app.world) or app.transitioning:
		return
	var now := Time.get_ticks_msec()
	if now-profile_tick<5000:
		return
	profile_tick = now
	print("PERF ",JSON.stringify({"case":render_profile.get("case","normal"),"fps":Engine.get_frames_per_second(),"process_ms":Performance.get_monitor(Performance.TIME_PROCESS)*1000,"physics_ms":Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS)*1000,"draw_calls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"primitives":Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),"objects":Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),"static_mb":Performance.get_monitor(Performance.MEMORY_STATIC)/1048576.0,"video_mb":Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED)/1048576.0}))
