extends Node3D

const CLIPS := ["Idle", "Walk", "Trot", "Jump", "Takeoff", "Wingbeat", "Glide"]
const MODELS := ["res://Models/Dawnwing_Game.glb", "res://Models/Dawnwing_Full.glb"]
var model: Node3D
var animation: AnimationPlayer
var camera: Camera3D
var clip_names: Dictionary = {}
var current_clip := "Idle"
var paused := false
var azimuth := .48
var elevation := .40
var distance := 6.6
var dragging := false
var overlay: Control
var pause_button: Button
var motion_label: Label

func _ready():
	var environment_node := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("243035")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("d0dce2")
	environment.ambient_light_energy = .43
	environment_node.environment = environment
	add_child(environment_node)
	for setup in [[Vector3(-42,-30,0), .85], [Vector3(-30,145,0), .32]]:
		var light := DirectionalLight3D.new()
		light.rotation_degrees = setup[0]
		light.light_energy = setup[1]
		light.shadow_enabled = setup[1] > .8
		add_child(light)
	var floor_mesh := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(200,200)
	floor_mesh.mesh = plane
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("465759")
	material.roughness = 1
	floor_mesh.material_override = material
	add_child(floor_mesh)
	camera = Camera3D.new()
	camera.fov = 38
	camera.current = true
	add_child(camera)
	load_model(0)
	build_controls()
	position_camera()

func load_model(index: int):
	if is_instance_valid(model):
		remove_child(model)
		model.queue_free()
	model = load(MODELS[index]).instantiate()
	add_child(model)
	for mesh in model.find_children("*", "MeshInstance3D", true, false):
		mesh.extra_cull_margin = 3
	animation = model.find_children("*", "AnimationPlayer", true, false)[0]
	clip_names.clear()
	for kind in CLIPS:
		for imported in animation.get_animation_list():
			if String(imported).ends_with(kind):
				clip_names[kind] = imported
				animation.get_animation(imported).loop_mode = Animation.LOOP_NONE if kind in ["Jump","Takeoff"] else Animation.LOOP_LINEAR
	play_clip(current_clip)

func play_clip(kind: String):
	current_clip = kind
	model.position.y = 1.05 if kind in ["Takeoff", "Wingbeat", "Glide"] else 0
	animation.play(clip_names[kind])
	animation.seek(0, true)
	animation.speed_scale = 0 if paused else 1
	if is_instance_valid(motion_label):
		motion_label.text = kind
	position_camera()

func position_camera():
	var target := Vector3(0, 1.25 + (0.55 if current_clip in ["Takeoff","Wingbeat","Glide"] else 0), 0)
	camera.position = target + Vector3(sin(azimuth)*cos(elevation), sin(elevation), cos(azimuth)*cos(elevation))*distance
	camera.look_at(target)

func set_paused(value: bool):
	paused = value
	animation.speed_scale = 0 if value else 1
	pause_button.text = "Play" if value else "Pause"

func build_controls():
	var layer := CanvasLayer.new()
	add_child(layer)
	overlay = Control.new()
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(overlay)
	var panel := PanelContainer.new()
	panel.position = Vector2(18,18)
	overlay.add_child(panel)
	var controls := HBoxContainer.new()
	panel.add_child(controls)
	var selector := OptionButton.new()
	for kind in CLIPS:
		selector.add_item(kind)
	selector.item_selected.connect(func(index): play_clip(CLIPS[index]))
	controls.add_child(selector)
	var mesh_selector := OptionButton.new()
	mesh_selector.add_item("Game mesh")
	mesh_selector.add_item("Full mesh")
	mesh_selector.item_selected.connect(load_model)
	controls.add_child(mesh_selector)
	pause_button = Button.new()
	pause_button.text = "Pause"
	pause_button.pressed.connect(func(): set_paused(not paused))
	controls.add_child(pause_button)
	var restart := Button.new()
	restart.text = "Restart"
	restart.pressed.connect(func(): play_clip(current_clip))
	controls.add_child(restart)
	motion_label = Label.new()
	motion_label.text = current_clip
	motion_label.position = Vector2(24,68)
	motion_label.add_theme_font_size_override("font_size",20)
	overlay.add_child(motion_label)
	var help := Label.new()
	help.text = "Drag to orbit   ·   Wheel to zoom"
	help.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	help.position = Vector2(20,610)
	overlay.add_child(help)

func _unhandled_input(event):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			dragging = event.pressed
		elif event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN]:
			distance = clampf(distance + (-.5 if event.button_index == MOUSE_BUTTON_WHEEL_UP else .5), 4.5, 12)
			position_camera()
	if event is InputEventMouseMotion and dragging:
		azimuth -= event.relative.x * .008
		elevation = clampf(elevation + event.relative.y * .005, -.05, 1.1)
		position_camera()
