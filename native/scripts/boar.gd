extends CharacterBody3D

var player
var model:Node3D
var animation:AnimationPlayer
var clips := {}
var health := 100
var strike := -1.0
var cooldown := 0.0
var hit_applied := false
var active_clip := ""

func _ready():
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.height = 1.9
	capsule.radius = .65
	collision.shape = capsule
	collision.position.y = .95
	add_child(collision)
	model.scale = Vector3.ONE*.65
	add_child(model)
	for node in model.find_children("*","AnimationPlayer",true,false):
		animation = node
		break
	if animation:
		for clip in animation.get_animation_list():
			for name in ["Idle","Walk","TuskAttack"]:
				if clip.ends_with(name):
					clips[name] = clip
					animation.get_animation(clip).loop_mode = Animation.LOOP_NONE if name == "TuskAttack" else Animation.LOOP_LINEAR
	play("Idle")
	floor_snap_length = .35

func play(name:String):
	if active_clip == name or not animation or not clips.has(name):
		return
	active_clip = name
	animation.speed_scale = 2.4 if name == "Walk" else 1.0
	animation.play(clips[name],.15)

func _physics_process(delta):
	if Session.paused or not is_instance_valid(player):
		if animation:
			animation.speed_scale = 0.0
		return
	if animation:
		animation.speed_scale = 2.4 if active_clip == "Walk" else 1.0
	if not player.combat_enabled():
		strike = -1
		velocity.x = 0
		velocity.z = 0
		play("Idle")
		if not is_on_floor():
			velocity.y -= 20*delta
		move_and_slide()
		return
	cooldown = maxf(0,cooldown-delta)
	var to_player:Vector3 = player.global_position-global_position
	to_player.y = 0
	var distance := to_player.length()
	velocity.x = 0
	velocity.z = 0
	if strike >= 0:
		strike += delta
		if strike >= .68 and not hit_applied:
			hit_applied = true
			if distance < 3.4 and to_player.normalized().dot(global_basis.z) > .35:
				Session.data.health = maxf(0,Session.data.health-18)
				Session.message = "Tusk strike! Step aside during the wind-up."
		if strike >= 1.34:
			strike = -1
			cooldown = 1.5
			play("Idle")
	elif distance < 2.8 and cooldown <= 0:
		strike = 0
		hit_applied = false
		play("TuskAttack")
	elif distance < 15 and distance > 2.4:
		var direction := to_player.normalized()
		rotation.y = lerp_angle(rotation.y,atan2(direction.x,direction.z),delta*3)
		velocity.x = direction.x*.9
		velocity.z = direction.z*.9
		play("Walk")
	else:
		play("Idle")
	if not is_on_floor():
		velocity.y -= 20*delta
	move_and_slide()

func hurt(amount:int):
	if health <= 0 or not player.combat_enabled():
		return
	health = maxi(0,health-amount)
	Session.message = "Boar hit. Watch for its counterattack."
	if health == 0:
		Session.data.coins += 15
		Session.data.xp += 25
		Session.message = "Encounter complete: +15 coins, +25 XP. Return to camp."
		Session.save_game(player)
		queue_free()
