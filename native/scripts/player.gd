extends CharacterBody3D

var camera:Camera3D
var weapon:Node3D
var cooldown := 0.0
var pitch := 0.0
var look_finger := -1
var hud
var world
var combat_active := false
var swing:Tween

func _ready():
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = .32
	capsule.height = 1.75
	collision.shape = capsule
	collision.position.y = .875
	add_child(collision)
	camera = Camera3D.new()
	camera.position.y = 1.64
	camera.fov = 75
	camera.far = 110
	add_child(camera)
	camera.current = true
	weapon = Node3D.new()
	weapon.visible = false
	weapon.position = Vector3(.38,-.36,-.65)
	camera.add_child(weapon)
	var blade := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(.055,.65,.025)
	blade.mesh = box
	var steel := StandardMaterial3D.new()
	steel.albedo_color = Color("abbfc0")
	steel.metallic = .7
	steel.roughness = .3
	blade.material_override = steel
	blade.position.y = .25
	blade.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	weapon.add_child(blade)
	var guard := MeshInstance3D.new()
	var guard_mesh := BoxMesh.new()
	guard_mesh.size = Vector3(.22,.045,.06)
	guard.mesh = guard_mesh
	guard.material_override = steel
	weapon.add_child(guard)
	floor_snap_length = .35

func _unhandled_input(event):
	if event.is_action_pressed("pause"):
		Session.paused = not Session.paused
		Session.clear_touch()
		if not Session.touch_controls:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Session.paused else Input.MOUSE_MODE_CAPTURED
		return
	if Session.paused:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		look(event.relative * .0022)
	if event is InputEventScreenTouch:
		if event.pressed and event.position.x > get_viewport().get_visible_rect().size.x * .42:
			look_finger = event.index
	if event is InputEventScreenDrag and event.index == look_finger:
		look(event.relative * .003)

func _input(event):
	# A release over a HUD button must still release the camera finger.
	if event is InputEventScreenTouch and not event.pressed and event.index == look_finger:
		look_finger = -1

func look(amount:Vector2):
	rotate_y(-amount.x)
	pitch = clampf(pitch - amount.y,-1.3,1.3)
	camera.rotation.x = pitch

func combat_enabled() -> bool:
	return is_instance_valid(world) and world.combat_allowed(global_position)

func sync_combat():
	var active := combat_enabled()
	weapon.visible = active
	if active == combat_active:
		return
	combat_active = active
	Session.attack_requested = false
	if not active:
		if swing and swing.is_running():
			swing.kill()
		weapon.rotation.z = 0
		cooldown = 0
	Session.message = "TRAINING GROUND  ·  Practice sword ready" if active else "SANCTUARY  ·  Weapon sheathed"

func _physics_process(delta):
	sync_combat()
	if Session.paused:
		return
	cooldown = maxf(0,cooldown-delta)
	var direction := Input.get_vector("left","right","forward","back") + Session.touch_move
	direction = direction.limit_length()
	var movement := global_basis * Vector3(direction.x,0,direction.y)
	var speed := 7.2 if Input.is_action_pressed("sprint") or Session.sprint_requested else 4.2
	velocity.x = move_toward(velocity.x,movement.x*speed,delta*22)
	velocity.z = move_toward(velocity.z,movement.z*speed,delta*22)
	if not is_on_floor():
		velocity.y -= 20*delta
	elif Input.is_action_just_pressed("jump") or Session.jump_requested:
		velocity.y = 6.8
	Session.jump_requested = false
	move_and_slide()
	sync_combat()
	if ((not Session.touch_controls and Input.is_action_just_pressed("attack")) or Session.attack_requested) and cooldown <= 0:
		attack()
	Session.attack_requested = false
	if Input.is_action_just_pressed("interact") or Session.interact_requested:
		world.interact()
	Session.interact_requested = false
	if global_position.y < -12:
		global_position = world.spawn_position()
		velocity = Vector3.ZERO
	if Session.data.health <= 0:
		Session.data.health = 100.0
		Session.message = "You recovered at the sanctuary."
		Session.data.positions.erase("camp")
		Session.change_zone("camp")

func attack():
	if not combat_enabled() or cooldown>0:
		return false
	cooldown = .65
	swing = create_tween()
	swing.tween_property(weapon,"rotation:z",-1.1,.13)
	swing.tween_property(weapon,"rotation:z",0.0,.30)
	world.practice_attack(self)
	if is_instance_valid(world.enemy):
		var target:Vector3 = world.enemy.global_position + Vector3.UP
		var offset := target-camera.global_position
		if offset.length() < 3.5 and offset.normalized().dot(-camera.global_basis.z) > .55:
			var query := PhysicsRayQueryParameters3D.create(camera.global_position,target)
			query.exclude = [get_rid()]
			var hit := get_world_3d().direct_space_state.intersect_ray(query)
			if hit.is_empty() or hit.collider == world.enemy:
				world.enemy.hurt(25)
	return true
