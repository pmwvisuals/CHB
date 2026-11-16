extends RefCounted

var actor:CharacterBody3D
var world
var spec:Dictionary
var id:String
var home:Vector3
var state:="idle"
var timer:=0.0
var hit_applied:=false
var attack_heading:=Vector3.FORWARD
var blocked:=0.0
var rewarded:=false

func setup(body:CharacterBody3D,region,enemy_id:String):
	actor=body
	world=region
	id=enemy_id
	spec=preload("res://scripts/adventure_rules.gd").ENEMIES[id]
	home=actor.global_position
	actor.health=spec.hp
	actor.add_to_group("pve_enemy")

func point() -> Vector3:return actor.global_position+Vector3.UP*minf(1.2,actor.get("model_height") if actor.get("model_height")!=null else 1.0)

func clear_line(to:Vector3,exclude_player:bool=false) -> bool:
	var query:=PhysicsRayQueryParameters3D.create(point(),to)
	query.exclude=[actor.get_rid()]
	if exclude_player:query.exclude.append(world.player.get_rid())
	var hit:=actor.get_world_3d().direct_space_state.intersect_ray(query)
	return hit.is_empty() or hit.collider==world.player

func animate(kind:String):
	actor.combat_animation(kind)

func hurt(amount:int) -> bool:
	if amount<=0 or rewarded or Session.paused or not world.combat_allowed(world.player.position):return false
	if actor.global_position.distance_to(world.player.global_position)>55:return false
	actor.health=maxi(0,actor.health-amount)
	if actor.health==0:
		rewarded=true
		state="dead"
		timer=0
		actor.collision_layer=0
		actor.collision_mask=0
		animate("death")
		world.encounters.defeated(id)
	elif state in ["idle","return"]:
		state="chase"
	return true

func move_towards(target:Vector3,speed:float,delta:float):
	var offset:=target-actor.global_position
	offset.y=0
	if offset.length_squared()<.01:return
	var heading:=atan2(offset.x,offset.z)
	actor.rotation.y=rotate_toward(actor.rotation.y,heading,delta*3)
	var direction:=offset.normalized()
	actor.velocity.x=direction.x*speed
	actor.velocity.z=direction.z*speed
	animate("walk")

# Returns false only when the creature may use its existing idle/patrol.
func step(delta:float) -> bool:
	if Session.paused:return true
	if state=="dead":
		timer+=delta
		if timer>3:actor.queue_free()
		return true
	var player=world.player
	var to_player:Vector3=player.global_position-actor.global_position
	to_player.y=0
	var distance:=to_player.length()
	var allowed:bool=world.combat_allowed(player.position) and Session.data.health>0
	var leash:bool=actor.global_position.distance_to(home)>25 or player.global_position.distance_to(home)>31
	if state=="idle":
		if not allowed or distance>14 or not clear_line(player.camera.global_position):return false
		state="chase"
	if (not allowed or leash) and state!="return":
		state="return"
		timer=0
	actor.velocity.x=0
	actor.velocity.z=0
	if state=="return":
		timer+=delta
		if actor.global_position.distance_to(home)<1.0:
			actor.health=spec.hp
			state="idle"
			animate("idle")
		elif timer>12:
			actor.global_position=home
			actor.velocity=Vector3.ZERO
			actor.health=spec.hp
			state="idle"
		else:move_towards(home,spec.speed,delta)
	elif state=="chase":
		if distance<spec.range and clear_line(player.camera.global_position):
			state="windup"
			timer=0
			hit_applied=false
			attack_heading=to_player.normalized()
			actor.rotation.y=atan2(attack_heading.x,attack_heading.z)
			animate("attack")
		else:move_towards(player.global_position,spec.speed,delta)
	elif state=="windup":
		timer+=delta
		if timer>=.75 and not hit_applied:
			hit_applied=true
			if distance<spec.range+.35 and to_player.normalized().dot(attack_heading)>.55 and clear_line(player.camera.global_position):
				world.encounters.damage_player(spec.damage)
		if timer>=1.25:
			state="recover"
			timer=0
			animate("idle")
	elif state=="recover":
		timer+=delta
		if timer>=.85:state="chase"
	if not actor.is_on_floor():actor.velocity.y-=20*delta
	var before:=actor.global_position
	actor.move_and_slide()
	if state=="chase" and actor.velocity.length()>.1 and before.distance_to(actor.global_position)<.02:
		blocked+=delta
		if blocked>3:state="return";timer=0;blocked=0
	else:blocked=0
	return true
