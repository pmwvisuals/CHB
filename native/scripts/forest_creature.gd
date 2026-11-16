extends CharacterBody3D

var player
var brain
var health:=100
var attack_clip:=""
var death_clip:=""
var definition:Dictionary
var visual:Node3D
var animation:AnimationPlayer
var idle_clip := ""
var walk_clip := ""
var waypoint := 0
var rest_time := 2.0
var active_clip := ""
var model_height := 0.0
var body_radius := .5

func _ready():
	name = definition.id
	visual = Node3D.new()
	add_child(visual)
	var centre := Node3D.new()
	visual.add_child(centre)
	var model = load(definition.asset).instantiate()
	centre.add_child(model)
	var animations:Array = model.find_children("*","AnimationPlayer",true,false)
	if not animations.is_empty():
		animation = animations[0]
		for clip in animation.get_animation_list():
			if String(clip).to_lower().ends_with("idle"):
				idle_clip = clip
			if "attack" in String(clip).to_lower() and attack_clip=="":attack_clip=clip
			if "death" in String(clip).to_lower() or "die" in String(clip).to_lower():death_clip=clip
			if String(clip).to_lower().ends_with("walk"):
				walk_clip = clip
		if idle_clip=="":
			idle_clip = animation.get_animation_list()[0]
		for clip in animation.get_animation_list():
			animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR if clip in [idle_clip,walk_clip] else Animation.LOOP_NONE
		play(idle_clip)
		animation.advance(.1)
	# Imported bind-pose boxes differ from the animated surface. Measure the
	# skinned idle pose once so FBX units and the wolf's skeleton align correctly.
	var box := pose_bounds(model)
	var scale_factor:float = definition.height/box.size.y
	centre.position = -box.position-Vector3(box.size.x*.5,0,box.size.z*.5)
	visual.scale = Vector3.ONE*scale_factor
	visual.rotation.y = definition.get("heading",0.0)
	model_height = box.size.y*scale_factor
	body_radius = clampf(box.size.x*scale_factor*.42,.35,.85)
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = body_radius
	shape.height = maxf(body_radius*2,model_height*.85)
	collision.shape = shape
	collision.position.y = shape.height*.5
	add_child(collision)
	floor_snap_length = .5
	var materials := {}
	for part in model.find_children("*","MeshInstance3D",true,false):
		# Animated source bounds must also cover the posed mesh for culling.
		part.custom_aabb = part.global_transform.affine_inverse()*centre.global_transform*box.grow(box.size.length()*.2)
		for surface in range(part.mesh.get_surface_count()):
			var original = part.get_active_material(surface)
			if not original is BaseMaterial3D:
				continue
			var key:int = original.get_instance_id()
			if not materials.has(key):
				var material = original.duplicate()
				material.emission_enabled = false
				material.metallic = 0
				material.metallic_texture = null
				material.metallic_specular = .08
				material.roughness = .94
				material.roughness_texture = null
				material.clearcoat_enabled = false
				material.rim_enabled = false
				if definition.id=="MagicWolf":
					material.albedo_color *= Color(.68,.72,.67)
				elif definition.id=="FantasyBoar":
					material.albedo_color *= Color(.85,.88,.83)
				materials[key] = material
			part.set_surface_override_material(surface,materials[key])

func pose_bounds(model:Node3D) -> AABB:
	var result := AABB()
	var first := true
	for part in model.find_children("*","MeshInstance3D",true,false):
		var skeleton = part.get_node_or_null(part.skeleton)
		var poses:Array[Transform3D] = []
		if skeleton is Skeleton3D and part.skin:
			skeleton.force_update_all_bone_transforms()
			for i in range(part.skin.get_bind_count()):
				var bone:int = part.skin.get_bind_bone(i)
				if bone<0:
					bone = skeleton.find_bone(part.skin.get_bind_name(i))
				poses.append(visual.global_transform.affine_inverse()*skeleton.global_transform*skeleton.get_bone_global_pose(bone)*part.skin.get_bind_pose(i))
		for surface in range(part.mesh.get_surface_count()):
			var arrays:Array = part.mesh.surface_get_arrays(surface)
			var vertices:PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			var bones = arrays[Mesh.ARRAY_BONES]
			var weights = arrays[Mesh.ARRAY_WEIGHTS]
			var stride:int = weights.size()/vertices.size() if weights!=null else 0
			for i in range(vertices.size()):
				var point := Vector3.ZERO
				if not poses.is_empty() and stride>0:
					for j in range(stride):
						if weights[i*stride+j]>0:
							point += (poses[bones[i*stride+j]]*vertices[i])*weights[i*stride+j]
				else:
					point = visual.global_transform.affine_inverse()*part.global_transform*vertices[i]
				result = AABB(point,Vector3.ZERO) if first else result.expand(point)
				first = false
	return result

func play(clip:String):
	if not animation or clip=="" or active_clip==clip:
		return
	active_clip = clip
	animation.play(clip,.2)

func _physics_process(delta:float):
	if not is_instance_valid(player):
		return
	var distance := Vector2(player.position.x-position.x,player.position.z-position.z).length()
	if distance>105:
		visual.hide()
	elif distance<95:
		visual.show()
	if Session.paused or distance>75:
		if animation:
			animation.speed_scale = 0
		return
	if animation:
		animation.speed_scale = 1
	if brain and brain.step(delta):return
	velocity.x = 0
	velocity.z = 0
	var walking := false
	var route:Array = definition.route
	if walk_clip!="" and not route.is_empty() and distance>body_radius+1.8:
		if rest_time>0:
			rest_time = maxf(0,rest_time-delta)
		else:
			var offset:Vector2 = Vector2(route[waypoint][0],route[waypoint][1])-Vector2(position.x,position.z)
			if offset.length()<.4:
				waypoint = (waypoint+1)%route.size()
				rest_time = 2.5
			else:
				var heading := atan2(offset.x,offset.y)
				rotation.y = rotate_toward(rotation.y,heading,delta)
				var speed:float = definition.speed*maxf(0,cos(angle_difference(rotation.y,heading)))
				velocity.x = sin(rotation.y)*speed
				velocity.z = cos(rotation.y)*speed
				walking = speed>.05
	play(walk_clip if walking else idle_clip)
	if not is_on_floor():
		velocity.y -= 20*delta
	move_and_slide()


func combat_animation(kind:String):
	play(walk_clip if kind=="walk" and walk_clip!="" else attack_clip if kind=="attack" and attack_clip!="" else death_clip if kind=="death" and death_clip!="" else idle_clip)
	# The mantis source has no locomotion clip; its authored idle remains.
	if kind=="attack" and attack_clip=="":
		visual.rotation.x=-.15
	elif kind in ["idle","walk"]:visual.rotation.x=0

func hurt(amount:int) -> bool:
	return brain.hurt(amount) if brain else false
