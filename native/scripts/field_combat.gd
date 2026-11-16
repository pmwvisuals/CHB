extends Node

const ARROW=preload("res://scripts/practice_arrow.gd")
var world
var arrows:Array=[]
var round_id:=0
var completed:=false

func cancel_round():
	round_id+=1
	for arrow in arrows:
		if is_instance_valid(arrow):arrow.queue_free()
	arrows.clear()

func start_round(_kind:String) -> bool:return false

func can_shoot() -> bool:
	return world.player.combat_enabled() and not Session.paused and world.player.weapon_kind=="bow"

func shoot(camera:Camera3D,charge:float):
	if not can_shoot():return null
	arrows=arrows.filter(func(a):return is_instance_valid(a))
	if arrows.size()>=12:arrows.pop_front().queue_free()
	var arrow:=ARROW.new()
	arrow.trainer=self
	arrow.round_id=round_id
	arrow.damage=int(lerpf(16,42,clampf(charge,0,1)))+2*(preload("res://scripts/adventure_rules.gd").level(Session.data.xp)-1)
	world.add_child(arrow)
	var forward:Vector3=-camera.global_basis.z
	arrow.global_position=camera.global_position+forward*.65
	arrow.velocity=forward*lerpf(12,40,clampf(charge,0,1))
	arrow.look_at(arrow.global_position+forward,Vector3.UP)
	arrows.append(arrow)
	var query:=PhysicsRayQueryParameters3D.create(camera.global_position,arrow.global_position)
	query.exclude=[world.player.get_rid()]
	var hit:Dictionary=world.get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty():
		arrow.global_position=hit.position
		arrow.finish(hit)
	return arrow

func arrow_result(arrow,hit:Dictionary):
	if arrow.round_id!=round_id or not world.player.combat_enabled() or Session.paused:return
	if not hit.is_empty() and is_instance_valid(hit.collider) and hit.collider.is_in_group("pve_enemy"):
		hit.collider.hurt(arrow.damage)

func status_text(_kind:String) -> String:
	var target:String=world.encounters.target_text()
	return target if target!="" else "SIDESTEP WIND-UPS · KEEP YOUR DISTANCE\nH / HEAL · Use a healing draught"
