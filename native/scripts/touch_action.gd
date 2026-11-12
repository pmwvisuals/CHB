extends Button

var finger := -1

func _ready():
	# Handle each finger directly so movement and actions can happen together.
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	focus_mode = Control.FOCUS_NONE

func release_finger():
	if finger != -1:
		finger = -1
		set_pressed_no_signal(false)
		button_up.emit()

func _input(event):
	if not event is InputEventScreenTouch:
		return
	if not event.pressed and event.index == finger:
		release_finger()
		get_viewport().set_input_as_handled()
	elif event.pressed and finger == -1 and not Session.paused and is_visible_in_tree() and get_global_rect().has_point(event.position):
		finger = event.index
		set_pressed_no_signal(true)
		button_down.emit()
		pressed.emit()
		get_viewport().set_input_as_handled()

func _process(_delta):
	if Session.paused:
		release_finger()
