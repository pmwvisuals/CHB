extends CharacterBody3D

const MODEL_PATH="res://assets/pegasus/dawnwing.glb"
var world
var rider
var model:Node3D
var animation:AnimationPlayer
var clips:Dictionary={}
var active_clip:=""
var home:=Vector3.ZERO
var boarding_position:=Vector3.ZERO
var jump_timer:=0.0
var visibility_tick:=0.0
var animate_near:=true

func _ready():
	name="DawnwingPegasus"
	var shape:=CollisionShape3D.new()
	var capsule:=CapsuleShape3D.new()
	capsule.radius=.56
	capsule.height=2.15
	shape.shape=capsule
	shape.position.y=1.075
	add_child(shape)
	var torso:=CollisionShape3D.new()
	var box:=BoxShape3D.new()
	box.size=Vector3(.9,1.1,1.9)
	torso.shape=box
	torso.position.y=1.55
	add_child(torso)
	model=load(MODEL_PATH).instantiate()
	model.rotation.y=PI
	add_child(model)
	for part in model.find_children("*","MeshInstance3D",true,false):
		part.extra_cull_margin=4
		part.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		part.custom_aabb=part.get_aabb().grow(3.0)
	for node in model.find_children("*","AnimationPlayer",true,false):
		animation=node
		break
	if animation:
		for clip in animation.get_animation_list():
			for kind in ["Idle","Walk","Trot","Jump","Wingbeat"]:
				if String(clip).ends_with(kind):
					clips[kind]=clip
					animation.get_animation(clip).loop_mode=Animation.LOOP_NONE if kind=="Jump" else Animation.LOOP_LINEAR
	play("Idle")
	floor_snap_length=.6
	floor_max_angle=deg_to_rad(38)

func play(kind:String):
	if kind==active_clip or not animation or not clips.has(kind):return
	active_clip=kind
	animation.play(clips[kind],.18)

func mount_player(player) -> bool:
	if Session.paused or is_instance_valid(rider) or player.global_position.distance_to(global_position)>3.2 or not is_on_floor():return false
	if player.combat_enabled():return false
	rider=player
	boarding_position=player.global_position
	player.mount=self
	player.cancel_draw()
	player.velocity=Vector3.ZERO
	player.collision_layer=0
	player.collision_mask=0
	player.camera.position.y=3.15
	player.sync_combat()
	Session.clear_touch()
	Session.message="DAWNWING · Move normally, Run to trot, Jump to leap, Interact to dismount."
	return true

func dismount_point() -> Vector3:
	var player=world.player
	for offset in [Vector3(2,0,0),Vector3(-2,0,0),Vector3(0,0,2.5),Vector3(0,0,-2.8)]:
		var at:Vector3=global_position+global_basis*offset
		if not world.inside_bounds(at):continue
		var ray:=PhysicsRayQueryParameters3D.create(at+Vector3.UP*2.5,at-Vector3.UP*4)
		ray.exclude=[get_rid(),player.get_rid()]
		var hit:Dictionary=get_world_3d().direct_space_state.intersect_ray(ray)
		if hit.is_empty() or hit.normal.y<.7:continue
		var floor_at:Vector3=hit.position+Vector3.UP*.04
		var query:=PhysicsShapeQueryParameters3D.new()
		var capsule:=CapsuleShape3D.new()
		capsule.radius=.35
		capsule.height=1.95
		query.shape=capsule
		query.transform=Transform3D(Basis.IDENTITY,floor_at+Vector3.UP*.98)
		query.exclude=[get_rid(),player.get_rid()]
		if get_world_3d().direct_space_state.intersect_shape(query).is_empty():return floor_at
	return Vector3(INF,INF,INF)

func dismount() -> bool:
	if Session.paused or not is_instance_valid(rider):return false
	if not is_on_floor():
		Session.message="Land before dismounting."
		return false
	var at:=dismount_point()
	if not at.is_finite():
		Session.message="Move to an open patch before dismounting."
		return false
	var player=rider
	release_rider()
	player.global_position=at
	Session.message="Dawnwing waits here. Approach and interact to ride again."
	Session.save_game(player)
	return true

func release_rider():
	if is_instance_valid(rider):
		rider.mount=null
		rider.collision_layer=1
		rider.collision_mask=1
		rider.camera.position.y=1.82
		rider.velocity=Vector3.ZERO
	rider=null
	velocity.x=0
	velocity.z=0
	Session.clear_touch()
	play("Idle")

func allowed(at:Vector3) -> bool:
	if not world.inside_bounds(at) or world.combat_allowed(at):return false
	# Keep this first ground-riding test out of the lake and its narrow causeway.
	return pow((at.x-91)/34,2)+pow(at.z/49,2)>1

func drive(player,delta:float):
	if Session.paused:return
	var input:=Input.get_vector("left","right","forward","back")+Session.touch_move
	input=input.limit_length()
	var movement:Vector3=player.global_basis*Vector3(input.x,0,input.y)
	var trotting:bool=Input.is_action_pressed("sprint") or Session.sprint_requested
	var speed:=5.5 if trotting else 2.8
	if movement.length()>.01:
		var heading:=atan2(-movement.x,-movement.z)
		rotation.y=rotate_toward(rotation.y,heading,delta*2.8)
		movement=-global_basis.z*movement.length()
	if not allowed(global_position+movement*speed*maxf(delta,.12)):
		movement=Vector3.ZERO
		Session.message="Dawnwing stays on safe camp ground. Dismount to use the lake or training yard."
	velocity.x=move_toward(velocity.x,movement.x*speed,delta*9)
	velocity.z=move_toward(velocity.z,movement.z*speed,delta*9)
	if not is_on_floor():velocity.y-=20*delta
	elif Input.is_action_just_pressed("jump") or Session.jump_requested:
		velocity.y=5.0
		jump_timer=1.1
		play("Jump")
	Session.jump_requested=false
	move_and_slide()
	jump_timer=maxf(0,jump_timer-delta)
	if jump_timer<=0:play(("Trot" if trotting else "Walk") if Vector2(velocity.x,velocity.z).length()>.15 else "Idle")
	player.global_position=global_position+Vector3(0,.05,.12).rotated(Vector3.UP,rotation.y)
	player.velocity=Vector3.ZERO
	if Input.is_action_just_pressed("interact") or Session.interact_requested:dismount()
	Session.interact_requested=false
	Session.attack_requested=false
	Session.weapon_requested=""
	Session.drill_requested=false
	if global_position.y< -10:
		global_position=home
		velocity=Vector3.ZERO

func _physics_process(delta):
	if Session.paused:
		if animation:animation.speed_scale=0
		return
	if is_instance_valid(rider):
		if animation:animation.speed_scale=1
		return # The rider's physics step drives both bodies.
	visibility_tick+=delta
	if visibility_tick>=.3:
		visibility_tick=0
		var distance:float=world.player.global_position.distance_to(global_position)
		model.visible=distance<100
		animate_near=distance<55
	if animation:animation.speed_scale=1 if animate_near else 0
	if not is_on_floor():velocity.y-=20*delta
	else:velocity.y=0
	move_and_slide()
