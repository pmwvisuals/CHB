extends Control

signal closed
var world
var map_center := Vector2(332,386)
var map_scale := 1.15
var marker_lines:Array = []

func _ready():
	theme = Session.ui_theme
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var backdrop := ColorRect.new()
	backdrop.color = Color("101f1c")
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(backdrop)
	var title := Label.new()
	title.text = "ASTERION  /  THE SANCTUARY"
	title.add_theme_font_override("font",preload("res://fonts/Cinzel.ttf"))
	title.position = Vector2(34,24)
	title.add_theme_font_size_override("font_size",26)
	add_child(title)
	var hint := Label.new()
	hint.text = "Choose a place to travel."
	hint.position = Vector2(36,70)
	add_child(hint)
	var canvas := Control.new()
	canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.draw.connect(draw_map.bind(canvas))
	canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(canvas)
	var grid := GridContainer.new()
	grid.columns = 3
	grid.position = Vector2(654,112)
	grid.add_theme_constant_override("h_separation",12)
	grid.add_theme_constant_override("v_separation",14)
	add_child(grid)
	var marker_boxes:Array[Rect2] = []
	for index in range(world.destinations.size()):
		var destination:Dictionary = world.destinations[index]
		var button := Button.new()
		button.text = str(index+1)+"  "+destination.name
		button.custom_minimum_size = Vector2(182,68)
		button.add_theme_font_size_override("font_size",17)
		button.pressed.connect(choose.bind(destination))
		grid.add_child(button)
		var marker := Button.new()
		marker.text = str(index+1)
		var actual:Vector2 = map_center+destination.point*map_scale
		var at := actual-Vector2(19,18)
		for attempt in range(12):
			var box := Rect2(at,Vector2(38,36)).grow(3)
			if not marker_boxes.any(func(other): return other.intersects(box)):
				break
			at = actual-Vector2(19,18)+Vector2(cos(attempt*1.7),sin(attempt*1.7))*(42+attempt*4)
		marker.position = at
		marker_boxes.append(Rect2(at,Vector2(38,36)).grow(3))
		marker_lines.append([actual,at+Vector2(19,18)])
		marker.size = Vector2(38,36)
		marker.tooltip_text = destination.name
		marker.pressed.connect(choose.bind(destination))
		add_child(marker)
	var exit := Button.new()
	exit.text = "CLOSE MAP"
	exit.position = Vector2(1000,620)
	exit.size = Vector2(210,60)
	exit.pressed.connect(func(): closed.emit())
	add_child(exit)
	var footer := Label.new()
	footer.text = "M  Map     •     Esc  Close"
	footer.position = Vector2(36,676)
	add_child(footer)

func draw_map(canvas:Control):
	var perimeter := PackedVector2Array()
	for point in world.layout.boundary:
		perimeter.append(map_center+Vector2(point[0],point[1])*map_scale)
	canvas.draw_colored_polygon(perimeter,Color("193b2b"))
	var clearing := PackedVector2Array()
	for point in world.layout.forestEdge:
		clearing.append(map_center+Vector2(point[0],point[1])*map_scale)
	canvas.draw_colored_polygon(clearing,Color("354d32"))
	perimeter.append(perimeter[0])
	canvas.draw_polyline(perimeter,Color("9d926f"),2,true)
	var lake := PackedVector2Array()
	for i in range(64):
		var angle := i*TAU/64
		lake.append(map_center+(Vector2(91,0)+Vector2(cos(angle)*31,sin(angle)*47))*map_scale)
	canvas.draw_colored_polygon(lake,Color("285c76"))
	for route in world.layout.routes:
		var line := PackedVector2Array()
		for point in route.points:
			line.append(map_center+Vector2(point[0],point[1])*map_scale)
		canvas.draw_polyline(line,Color("b6a787"),2,true)
	for line in marker_lines:
		canvas.draw_line(line[0],line[1],Color("b6a787"),1,true)
	canvas.draw_circle(map_center+Vector2(world.player.position.x,world.player.position.z)*map_scale,6,Color("ffda81"))

func choose(destination:Dictionary):
	world.travel_to(destination)
	closed.emit()

func _unhandled_input(event):
	if event.is_action_pressed("camp_map") or event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		closed.emit()
