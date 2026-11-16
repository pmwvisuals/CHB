extends CharacterBody3D

var player
var brain
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
	if brain and brain.step(delta):return
	passive_step(delta)

func passive_step(delta:float):
	velocity.x = 0
	velocity.z = 0
	play("Idle")
	if not is_on_floor():
		velocity.y -= 20*delta
	move_and_slide()

func combat_animation(kind:String):
	play({"walk":"Walk","attack":"TuskAttack","idle":"Idle","death":"Idle"}.get(kind,"Idle"))

func hurt(amount:int) -> bool:
	return brain.hurt(amount) if brain else false
