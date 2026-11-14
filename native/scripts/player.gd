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
var weapon_kind := "sword"
var sword_model:Node3D
var bow_model:Node3D
var nocked_arrow:Node3D
var bow_strings:Array[MeshInstance3D] = []
var draw_time := 0.0
var primary_held := false
var primary_pressed := false

func _ready():
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = .32
	capsule.height = 1.95
	collision.shape = capsule
	collision.position.y = .975
	add_child(collision)
	camera = Camera3D.new()
	camera.position.y = 1.82
	camera.fov = 75
	camera.far = 110
	add_child(camera)
	camera.current = true
	weapon = Node3D.new()
	weapon.visible = false
	camera.add_child(weapon)
	sword_model = preload("res://assets/weapons/practice-sword.glb").instantiate()
	sword_model.position = Vector3(.44,-.46,-.85)
	sword_model.scale = Vector3.ONE*.68
	sword_model.rotation.z = -.12
	weapon.add_child(sword_model)
	bow_model = preload("res://assets/weapons/practice-bow.glb").instantiate()
	bow_model.position = Vector3(-.28,-.19,-.72)
	bow_model.scale = Vector3.ONE*.8
	weapon.add_child(bow_model)
	bow_model.hide()
	nocked_arrow = preload("res://assets/weapons/practice-arrow.glb").instantiate()
	nocked_arrow.position.x = .04
	bow_model.add_child(nocked_arrow)
	var cord := StandardMaterial3D.new()
	cord.albedo_color = Color("e4d9b9")
	cord.roughness = .95
	for i in range(2):
		var segment := MeshInstance3D.new()
		var cylinder := CylinderMesh.new()
		cylinder.top_radius = .003
		cylinder.bottom_radius = .003
		cylinder.radial_segments = 4
		segment.mesh = cylinder
		segment.material_override = cord
		bow_model.add_child(segment)
		bow_strings.append(segment)
	for mesh in weapon.find_children("*","MeshInstance3D",true,false):
		mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	update_bow()
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
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		primary_held = true
		primary_pressed = true
	if event.is_action_pressed("sword"):
		equip("sword")
	if event.is_action_pressed("bow"):
		equip("bow")
	if event.is_action_pressed("drill") and combat_enabled():
		world.training.start_round(weapon_kind)
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		look(event.relative * .0022)
	if event is InputEventScreenTouch:
		if event.pressed and event.position.x > get_viewport().get_visible_rect().size.x * .42:
			look_finger = event.index
	if event is InputEventScreenDrag and event.index == look_finger:
		look(event.relative * .003)

func _input(event):
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
		primary_held = false
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
	cancel_draw()
	if not active:
		if swing and swing.is_running():
			swing.kill()
		weapon.rotation.z = 0
		cooldown = 0
		if is_instance_valid(world.training):
			world.training.cancel_round()
	Session.message = "TRAINING GROUND  ·  1 Sword  ·  2 Bow  ·  R Start drill" if active else "SANCTUARY  ·  Weapon sheathed"

func cancel_draw():
	draw_time = 0
	primary_held = false
	primary_pressed = false
	Session.bow_held = false
	update_bow()

func update_bow():
	if not is_instance_valid(bow_model):
		return
	var pull := clampf(draw_time/1.2,0,1)*.32
	nocked_arrow.position.z = pull
	for i in range(bow_strings.size()):
		var end := Vector3(0,.58 if i == 0 else -.58,0)
		var nock := Vector3(0,0,pull)
		var segment := bow_strings[i]
		segment.position = (end+nock)/2
		segment.scale.y = end.distance_to(nock)/2
		segment.quaternion = Quaternion(Vector3.UP,(end-nock).normalized())

func equip(kind:String) -> bool:
	if not combat_enabled() or Session.paused or kind not in ["sword","bow"]:
		return false
	if kind == weapon_kind:
		return true
	cancel_draw()
	if swing and swing.is_running():
		swing.kill()
	weapon.rotation.z = 0
	cooldown = 0
	weapon_kind = kind
	sword_model.visible = kind == "sword"
	bow_model.visible = kind == "bow"
	world.training.cancel_round()
	Session.message = "ASH BOW  ·  Hold to draw, release to fire. Stand on the archery line." if kind == "bow" else "PRACTICE SWORD  ·  Face a dummy and land three quick hits."
	return true

func release_bow() -> bool:
	var charge := clampf(draw_time/1.2,0,1)
	var ready := draw_time>=.12 and cooldown<=0 and is_instance_valid(world.training)
	cancel_draw()
	if not ready:
		return false
	var arrow = world.training.shoot(camera,charge)
	if arrow == null:
		return false
	cooldown = .35
	return true

func _physics_process(delta):
	sync_combat()
	if Session.paused:
		cancel_draw()
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
	if Session.weapon_requested != "":
		equip(Session.weapon_requested)
		Session.weapon_requested = ""
	if Session.drill_requested and combat_enabled():
		world.training.start_round(weapon_kind)
	Session.drill_requested = false
	if combat_enabled() and weapon_kind == "bow":
		if (primary_held or Session.bow_held) and cooldown<=0 and world.training.can_shoot():
			draw_time = minf(1.2,draw_time+delta)
			update_bow()
		elif draw_time>0:
			release_bow()
	elif (primary_pressed or Session.attack_requested) and cooldown<=0:
		attack()
	primary_pressed = false
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
	if not combat_enabled() or cooldown>0 or Session.paused or weapon_kind != "sword":
		return false
	cooldown = .4
	if swing and swing.is_running():
		swing.kill()
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
