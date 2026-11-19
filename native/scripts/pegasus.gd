extends CharacterBody3D

const MODEL_PATH="res://assets/pegasus/dawnwing.glb"
const RIDER_EYE_HEIGHT:=2.52
const WALK_SPEED:=1.30
const TROT_SPEED:=2.85
const FLIGHT_SPEED:=8.5
const FLIGHT_CEILING:=18.0
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
var airborne:=false
var landing:=false
var cruise_height:=0.0
var takeoff_timer:=0.0

func _ready():
	name="DawnwingPegasus"
	var shape:=CollisionShape3D.new()
	var capsule:=CapsuleShape3D.new()
	capsule.radius=.38
	capsule.height=1.52
	shape.shape=capsule
	shape.position.y=.76
	add_child(shape)
	var torso:=CollisionShape3D.new()
	var box:=BoxShape3D.new()
	box.size=Vector3(.70,.75,1.32)
	torso.shape=box
	torso.position.y=1.12
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
			for kind in ["Idle","Walk","Trot","Jump","Takeoff","Wingbeat","Glide"]:
				if String(clip).ends_with(kind):
					clips[kind]=clip
					animation.get_animation(clip).loop_mode=Animation.LOOP_NONE if kind in ["Jump","Takeoff"] else Animation.LOOP_LINEAR
	play("Idle")
	floor_snap_length=.32
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
	player.camera.position.y=RIDER_EYE_HEIGHT
	model.visible=true
	player.sync_combat()
	Session.clear_touch()
	Session.message="DAWNWING · F to take off or land. Use Flight on touch."
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
	if airborne or not is_on_floor():
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
	if airborne:
		global_position=home
	airborne=false
	landing=false
	takeoff_timer=0
	jump_timer=0
	velocity=Vector3.ZERO
	model.rotation=Vector3(0,PI,0)
	Session.clear_touch()
	play("Idle")

func allowed(at:Vector3) -> bool:
	if not world.inside_bounds(at) or world.combat_allowed(at):return false
	return pow((at.x-91)/34,2)+pow(at.z/49,2)>1

func flight_toggle():
	if airborne:
		if landing:
			landing=false
			cruise_height=global_position.y+1.0
		elif can_land_here():
			landing=true
			Session.message="Landing. Use Flight to climb again."
		else:
			Session.message="Fly over open camp ground before landing."
	elif is_on_floor() and not test_move(global_transform,Vector3.UP*2.0):
		airborne=true
		landing=false
		cruise_height=global_position.y+4.2
		takeoff_timer=animation.get_animation(clips["Takeoff"]).length if clips.has("Takeoff") else .63
		velocity.y=3.5
		play("Takeoff")
		Session.message="DAWNWING · Jump to climb. Use Flight over open ground to land."
	elif is_on_floor():
		Session.message="Move out from under the cover before taking off."

func can_land_here() -> bool:
	if not allowed(global_position):return false
	var terrain_y:float=world.height(global_position.x,global_position.z)
	var ray:=PhysicsRayQueryParameters3D.create(global_position+Vector3.UP*.4,Vector3(global_position.x,terrain_y-1.5,global_position.z))
	ray.exclude=[get_rid(),rider.get_rid()]
	var surface:=get_world_3d().direct_space_state.intersect_ray(ray)
	return not surface.is_empty() and surface.normal.y>.78 and surface.position.y<=terrain_y+.95

func steer(movement:Vector3,delta:float) -> Vector3:
	if movement.length_squared()<.0001:return Vector3.ZERO
	var heading:=atan2(-movement.x,-movement.z)
	rotation.y=rotate_toward(rotation.y,heading,delta*(2.15 if airborne else 3.5))
	return -global_basis.z*movement.length()

func drive_air(movement:Vector3,climb:bool,delta:float):
	var terrain_y:float=world.height(global_position.x,global_position.z)
	if climb:
		landing=false
		cruise_height=maxf(cruise_height,global_position.y)+3.1
	cruise_height=clampf(cruise_height,terrain_y+3.0,terrain_y+FLIGHT_CEILING)
	if landing and not can_land_here():
		landing=false
		cruise_height=maxf(cruise_height,global_position.y+1.0)
		Session.message="Find a clear patch of camp ground to land."
	var speed:=2.2 if landing else FLIGHT_SPEED
	var target:=movement*speed
	velocity.x=move_toward(velocity.x,target.x,delta*7.0)
	velocity.z=move_toward(velocity.z,target.z,delta*7.0)
	if not world.inside_bounds(global_position+Vector3(velocity.x,0,velocity.z)*maxf(.15,delta)):
		velocity.x=0
		velocity.z=0
	var vertical:float=clampf((cruise_height-global_position.y)*1.8,-2.4,4.0)
	velocity.y=move_toward(velocity.y,-2.7 if landing else vertical,delta*9.0)
	move_and_slide()
	takeoff_timer=maxf(0,takeoff_timer-delta)
	if landing and is_on_floor() and can_land_here():
		airborne=false
		landing=false
		velocity=Vector3.ZERO
		play("Idle")
		Session.message="Landed. Interact to dismount."
	elif takeoff_timer<=0:
		var gliding:=not landing and get_real_velocity().length()>4.5 and absf(velocity.y)<.95
		play("Glide" if gliding else "Wingbeat")
	if animation:animation.speed_scale=1.0

func drive_ground(movement:Vector3,trotting:bool,leap:bool,delta:float):
	var speed:=TROT_SPEED if trotting else WALK_SPEED
	velocity.x=move_toward(velocity.x,movement.x*speed,delta*7.0)
	velocity.z=move_toward(velocity.z,movement.z*speed,delta*7.0)
	if not allowed(global_position+Vector3(velocity.x,0,velocity.z)*maxf(.15,delta)):
		velocity.x=0
		velocity.z=0
	if not is_on_floor():velocity.y-=20*delta
	elif leap:
		velocity.y=5.0
		jump_timer=.54
		play("Jump")
	move_and_slide()
	jump_timer=maxf(0,jump_timer-delta)
	if jump_timer<=0:
		var measured:=Vector2(get_real_velocity().x,get_real_velocity().z).length()
		var gait:="Trot" if trotting else "Walk"
		play(gait if measured>.12 else "Idle")
		if animation:animation.speed_scale=clampf(measured/speed,.25,1.2) if active_clip==gait else 1.0
	elif animation:
		animation.speed_scale=1.0

func drive(player,delta:float):
	if Session.paused:return
	var input:=Input.get_vector("left","right","forward","back")+Session.touch_move
	var direction:=input.limit_length()
	if Input.is_action_just_pressed("mount_flight") or Session.flight_requested:flight_toggle()
	Session.flight_requested=false
	var movement:=steer(player.global_basis*Vector3(direction.x,0,direction.y),delta)
	var trotting:bool=Input.is_action_pressed("sprint") or Session.sprint_requested
	var jump:=Input.is_action_just_pressed("jump") or Session.jump_requested
	Session.jump_requested=false
	if airborne:drive_air(movement,jump,delta)
	else:drive_ground(movement,trotting,jump,delta)
	var local_velocity:=global_basis.inverse()*get_real_velocity()
	model.rotation.x=lerpf(model.rotation.x,clampf(-velocity.y*.035,-.18,.17) if airborne else 0,minf(1,delta*5))
	model.rotation.z=lerpf(model.rotation.z,clampf(local_velocity.x*.05,-.23,.23) if airborne else 0,minf(1,delta*5))
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
