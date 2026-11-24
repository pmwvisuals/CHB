extends Control

signal closed
var world
var map_center := Vector2(332,386)
var map_scale := 1.15
var marker_lines:Array = []
var road_review := true
var place_markers:Array[Button] = []
var map_canvas:Control
var traveling := false
var travel_hint:Label

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
	travel_hint = Label.new()
	travel_hint.text = "Street plan · Gold: main road · Cream: access paths · Grey: buildings"
	travel_hint.position = Vector2(36,70)
	add_child(travel_hint)
	var canvas := Control.new()
	map_canvas = canvas
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
		button.text = str(index+1)+"  "+destination.name+("\nCOMING SOON" if destination.temple and destination.id not in Session.OPEN_TEMPLES else "")
		button.custom_minimum_size = Vector2(182,68)
		button.add_theme_font_size_override("font_size",17)
		button.pressed.connect(choose.bind(destination))
		grid.add_child(button)
		var marker := Button.new()
		marker.text = str(index+1)
		place_markers.append(marker)
		marker.visible = not road_review
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
	var view_toggle := Button.new()
	view_toggle.text = "SHOW PLACE NUMBERS"
	view_toggle.position = Vector2(36,112)
	view_toggle.size = Vector2(250,38)
	view_toggle.pressed.connect(func():
		road_review=not road_review
		view_toggle.text="SHOW PLACE NUMBERS" if road_review else "SHOW STREET PLAN"
		for marker in place_markers:marker.visible=not road_review
		map_canvas.queue_redraw()
	)
	add_child(view_toggle)
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
	var plan:Dictionary=world.layout.get("roadPlan",{})
	for r in plan.get("paving",[]):
		canvas.draw_rect(Rect2(map_center+Vector2(r[0],r[1])*map_scale,Vector2(r[2]-r[0],r[3]-r[1])*map_scale),Color("d0bea0"))
	for r in plan.get("main",[]):
		canvas.draw_rect(Rect2(map_center+Vector2(r[0],r[1])*map_scale,Vector2(r[2]-r[0],r[3]-r[1])*map_scale),Color("d3a84e"))
	for temple in world.layout.temples:
		draw_building(canvas,Vector2(temple.x,temple.z),Vector2(13,16),temple.rotation,temple.name)
	for entry in [[Vector2(0,0),Vector2(16,18),"Hall"],[Vector2(-55,50),Vector2(25,19),"Wayfarer"],[Vector2(46,43),Vector2(20,16),"Dining"],[Vector2(65,35),Vector2(10,10),"Lakeside"]]:
		draw_building(canvas,entry[0],entry[1],0.0,entry[2])
	draw_building(canvas,Vector2(-40,-121),Vector2(5.4,.8),0.0,"Deepwood Gate")
	canvas.draw_rect(Rect2(map_center+Vector2(53,-20.1)*map_scale,Vector2(22,4.2)*map_scale),Color("806448"))
	if road_review:
		canvas.draw_string(get_theme_default_font(),map_center+Vector2(0,114)*map_scale+Vector2(10,0),"Arrival Ridge",HORIZONTAL_ALIGNMENT_LEFT,-1,14,Color("eee3c7"))
		canvas.draw_string(get_theme_default_font(),map_center+Vector2(75,-18)*map_scale+Vector2(4,0),"Dock",HORIZONTAL_ALIGNMENT_LEFT,-1,14,Color("eee3c7"))
	var shrine:Dictionary=world.layout.get("shrine",{})
	if not shrine.is_empty():draw_building(canvas,Vector2(shrine.x,shrine.z),Vector2(7,6),shrine.rotation,"Shrine")
	if road_review:
		var at:Vector2=map_center+Vector2(-67,-34)*map_scale
		canvas.draw_rect(Rect2(at-Vector2(22,20)*map_scale,Vector2(44,40)*map_scale),Color("8d7856"),false,1.0)
		canvas.draw_string(get_theme_default_font(),at+Vector2(-23,5),"Training",HORIZONTAL_ALIGNMENT_LEFT,-1,13,Color("e8e0c6"))
	else:
		for line in marker_lines:canvas.draw_line(line[0],line[1],Color("b6a787"),1,true)
	canvas.draw_circle(map_center+Vector2(world.player.position.x,world.player.position.z)*map_scale,6,Color("ffda81"))

func draw_building(canvas:Control,at:Vector2,extent:Vector2,turn:float,label:String):
	var points:=PackedVector2Array()
	for corner in [Vector2(-1,-1),Vector2(1,-1),Vector2(1,1),Vector2(-1,1)]:
		var p:Vector2=corner*extent*.5
		points.append(map_center+(at+Vector2(cos(turn)*p.x+sin(turn)*p.y,-sin(turn)*p.x+cos(turn)*p.y))*map_scale)
	canvas.draw_colored_polygon(points,Color("849084"))
	points.append(points[0]);canvas.draw_polyline(points,Color("e0decd"),1.0,true)
	if road_review:
		var font:=get_theme_default_font()
		var size:=14
		var width:=font.get_string_size(label,HORIZONTAL_ALIGNMENT_LEFT,-1,size).x
		canvas.draw_string(font,map_center+at*map_scale+Vector2(-width*.5,-extent.y*map_scale*.5-5),label,HORIZONTAL_ALIGNMENT_LEFT,-1,size,Color("f0e8cd"))

func choose(destination:Dictionary):
	if traveling:
		return
	traveling = true
	travel_hint.text = "Loading nearby buildings…"
	await world.prepare_destination_view(destination)
	world.travel_to(destination)
	traveling = false
	closed.emit()

func _unhandled_input(event):
	if event.is_action_pressed("camp_map") or event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		closed.emit()
