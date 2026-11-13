extends RefCounted

const FONT:Font = preload("res://fonts/Cinzel.ttf")

static func fit(label:Label3D,width:float,height:float=.26):
	label.font = FONT
	label.font_size = 96
	var measured := FONT.get_string_size(label.text,HORIZONTAL_ALIGNMENT_LEFT,-1,96)
	label.pixel_size = minf(width/maxf(measured.x,1),height/FONT.get_height(96))
	label.outline_size = 0
	label.no_depth_test = false
	label.shaded = true
	label.billboard = BaseMaterial3D.BILLBOARD_DISABLED
	label.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	label.visibility_range_end = 42
