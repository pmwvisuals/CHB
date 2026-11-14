extends CharacterBody3D

var player
@export var model_scene:PackedScene
var model:Node3D
var animation:AnimationPlayer
var clips := {}
var health := 100
var strike := -1.0
var cooldown := 0.0
var hit_applied := false
var active_clip := ""
var lod_meshes:Array = [[],[],[]]
var current_lod := 0
var visual_timer := 0.0
const MODEL_SCALE := .65
const AUTHORED_WALK_SPEED := .375

func _ready():
	if not is_instance_valid(model) and model_scene:
		model = model_scene.instantiate()
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.height = 3.0
	capsule.radius = .65
	collision.shape = capsule
	collision.position = Vector3(0,.65,.15)
	collision.rotation.x = PI/2
	add_child(collision)
	model.scale = Vector3.ONE*MODEL_SCALE
	add_child(model)
	var materials := {}
	for mesh in model.find_children("*","MeshInstance3D",true,false):
		for i in range(3):
			if String(mesh.name).begins_with("LOD%d_" % i):
				lod_meshes[i].append(mesh)
		for i in range(mesh.mesh.get_surface_count()):
			var original = mesh.get_active_material(i)
			if not original is BaseMaterial3D:
				continue
			var colors = mesh.mesh.surface_get_arrays(i)[Mesh.ARRAY_COLOR]
			var colored:bool = colors!=null and colors.size()>0
			var key := str(original.get_instance_id())+str(colored)
			if not materials.has(key):
				var corrected = original.duplicate()
				corrected.vertex_color_use_as_albedo = colored
				corrected.vertex_color_is_srgb = false
				materials[key] = corrected
			mesh.mesh.surface_set_material(i,materials[key])
	select_lod(0)
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
	animation.speed_scale = walk_playback_speed() if name == "Walk" else 1.0
	animation.play(clips[name],.15)

func walk_playback_speed() -> float:
	return clampf(Vector2(velocity.x,velocity.z).length()/(AUTHORED_WALK_SPEED*MODEL_SCALE),.05,4.0)

func select_lod(level:int):
	current_lod = level
	for i in range(3):
		for mesh in lod_meshes[i]:
			mesh.visible = i==level
			mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if i==2 else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	model.visible = level>=0

func update_visual_distance(distance:float):
	var level := current_lod
	if distance>100:
		level = -1
	elif level<0:
		if distance<90:
			level = 0 if distance<14 else 1 if distance<32 else 2
	elif distance<14:
		level = 0
	elif distance>40:
		level = 2
	elif level==0 and distance>18:
		level = 1
	elif level==2 and distance<32:
		level = 1
	if level!=current_lod:
		select_lod(level)

func _physics_process(delta):
	if Session.paused or not is_instance_valid(player):
		if animation:
			animation.speed_scale = 0.0
		return
	if animation:
		animation.speed_scale = walk_playback_speed() if active_clip == "Walk" else 1.0
	visual_timer -= delta
	if visual_timer<=0:
		visual_timer = .2
		var camera := get_viewport().get_camera_3d()
		if camera:
			update_visual_distance(global_position.distance_to(camera.global_position))
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
