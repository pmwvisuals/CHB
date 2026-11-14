extends Node3D

const MODEL := preload("res://assets/weapons/practice-arrow.glb")
var trainer
var velocity := Vector3.ZERO
var round_id := -1
var resolved := false
var age := 0.0
var lodged_age := 0.0

func _ready():
	var model := MODEL.instantiate()
	# The root follows the tip; the rest of the arrow trails behind it.
	model.position.z = .78
	add_child(model)
	for mesh in model.find_children("*","MeshInstance3D",true,false):
		mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

func finish(hit:Dictionary):
	if resolved:
		return
	resolved = true
	trainer.arrow_result(self,hit)

func _physics_process(delta):
	if Session.paused:
		return
	if resolved:
		lodged_age += delta
		if lodged_age>14:
			queue_free()
		return
	age += delta
	var next:Vector3 = global_position+velocity*delta+Vector3.DOWN*4.9*delta*delta
	var query := PhysicsRayQueryParameters3D.create(global_position,next)
	query.exclude = [trainer.world.player.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	velocity += Vector3.DOWN*9.8*delta
	if velocity.length_squared()>.01:
		look_at(global_position+velocity,Vector3.UP)
	if not hit.is_empty():
		global_position = hit.position
		finish(hit)
	else:
		global_position = next
		if age>6 or global_position.y< -12:
			finish({})
			queue_free()
