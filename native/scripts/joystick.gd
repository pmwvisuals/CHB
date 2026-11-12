extends Control

var finger := -1
var offset := Vector2.ZERO

func _ready():
	mouse_filter = Control.MOUSE_FILTER_STOP

func _gui_input(event):
	if Session.paused:
		return
	if event is InputEventScreenTouch:
		if event.pressed and finger == -1:
			finger = event.index
		elif event.index == finger and not event.pressed:
			finger = -1
			offset = Vector2.ZERO
			Session.touch_move = Vector2.ZERO
		accept_event()
	if event is InputEventScreenDrag and event.index == finger:
		offset = (event.position-size*.5).limit_length(74)
		Session.touch_move = offset/74.0
		accept_event()
	queue_redraw()

func _process(_delta):
	if Session.paused and finger != -1:
		finger = -1
		offset = Vector2.ZERO
		Session.touch_move = Vector2.ZERO
		queue_redraw()

func _draw():
	draw_circle(size*.5,98,Color(.72,.83,.71,.14))
	draw_arc(size*.5,98,0,TAU,64,Color(.83,.77,.55,.7),2,true)
	draw_circle(size*.5+offset,39,Color(.83,.77,.55,.65))
