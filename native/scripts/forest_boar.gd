extends "res://scripts/boar.gd"

var route := PackedVector2Array()
var waypoint := 0
var rest_time := 2.0
var blocked_time := 0.0
const WALK_SPEED := .55

func passive_step(delta:float):
	var to_player := Vector2(player.global_position.x-global_position.x,player.global_position.z-global_position.z)
	var walking := false
	velocity.x = 0
	velocity.z = 0
	if not route.is_empty() and to_player.length()>2.8 and to_player.length()<65:
		if rest_time>0:
			rest_time = maxf(0,rest_time-delta)
		else:
			var offset := route[waypoint]-Vector2(global_position.x,global_position.z)
			if offset.length()<.45:
				waypoint = (waypoint+1)%route.size()
				rest_time = 2.0+waypoint%3
			else:
				var heading := atan2(offset.x,offset.y)
				rotation.y = rotate_toward(rotation.y,heading,delta*.9)
				var alignment := maxf(0,cos(angle_difference(rotation.y,heading)))
				velocity.x = sin(rotation.y)*WALK_SPEED*alignment
				velocity.z = cos(rotation.y)*WALK_SPEED*alignment
				walking = alignment>.1
	play("Walk" if walking else "Idle")
	if not is_on_floor():
		velocity.y -= 20*delta
	var before := global_position
	move_and_slide()
	if walking and before.distance_to(global_position)<WALK_SPEED*delta*.1:
		blocked_time += delta
	else:
		blocked_time = 0
	if blocked_time>2:
		waypoint = (waypoint+1)%route.size()
		rest_time = 2
		blocked_time = 0
