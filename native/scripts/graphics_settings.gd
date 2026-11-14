extends Control

signal closed
var choices := {}
var current:Label

func _ready():
	theme = Session.ui_theme
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.color = Color("101f1c")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	var panel := PanelContainer.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.position = Vector2(-280,-224)
	panel.custom_minimum_size = Vector2(560,448)
	add_child(panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation",18)
	panel.add_child(box)
	var heading := Label.new()
	heading.text = "GRAPHICS"
	heading.add_theme_font_override("font",preload("res://fonts/Cinzel.ttf"))
	heading.add_theme_font_size_override("font_size",30)
	box.add_child(heading)
	var recommended := Label.new()
	recommended.text = "Recommended for this device: "+Session.GRAPHICS.PRESETS[Session.graphics_recommended].name
	recommended.add_theme_font_size_override("font_size",20)
	box.add_child(recommended)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation",16)
	box.add_child(row)
	for id in ["balanced","high"]:
		var choice := Button.new()
		choice.text = Session.GRAPHICS.PRESETS[id].name.to_upper()
		choice.custom_minimum_size = Vector2(248,70)
		choice.pressed.connect(select.bind(id))
		row.add_child(choice)
		choices[id] = choice
	var explanation := Label.new()
	explanation.text = "The same world, models and textures in both modes.\nBalanced favors smoother play.\nHigh shows more detail in the distance."
	explanation.custom_minimum_size.x = 512
	explanation.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	explanation.add_theme_font_size_override("font_size",20)
	box.add_child(explanation)
	current = Label.new()
	current.add_theme_font_size_override("font_size",20)
	box.add_child(current)
	var back := Button.new()
	back.text = "DONE"
	back.custom_minimum_size.y = 56
	back.pressed.connect(func(): closed.emit())
	box.add_child(back)
	refresh()

func select(id:String):
	Session.set_graphics_quality(id)
	refresh()

func refresh():
	for id in choices:
		choices[id].modulate = Color("e9cc88") if id == Session.graphics_quality() else Color.WHITE
	current.text = "Current: "+Session.graphics_preset().name+"  ·  Changes apply immediately"

func _unhandled_input(event):
	if event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		closed.emit()
