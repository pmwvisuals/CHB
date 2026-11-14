extends SceneTree
var failures := 0
func _initialize():
	call_deferred("run")
func check(value:bool,label:String):
	print(("PASS: " if value else "FAIL: ")+label)
	if not value:failures+=1
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_boar-save.json"
	var boar = load("res://scenes/boar.tscn").instantiate()
	root.add_child(boar)
	boar.set_physics_process(false)
	check(boar.lod_meshes.all(func(level): return level.size()==5),"All three LODs import with five material groups")
	check(boar.clips.size()==3,"Idle, Walk and TuskAttack import")
	var skeletons := {}
	var counts := []
	for level in boar.lod_meshes:
		var triangles := 0
		for mesh in level:
			skeletons[mesh.get_node(mesh.skeleton).get_instance_id()] = true
			for i in range(mesh.mesh.get_surface_count()):triangles+=mesh.mesh.surface_get_array_index_len(i)/3
		counts.append(triangles)
	check(counts==[104660,48380,21096],"Engine geometry matches all authored LOD budgets")
	check(skeletons.size()==1,"Every LOD shares one live skeleton")
	for level in range(3):
		boar.select_lod(level)
		check(boar.lod_meshes[level].all(func(m):return m.visible) and boar.lod_meshes[(level+1)%3].all(func(m):return not m.visible),"Exactly one visible mesh level: LOD"+str(level))
	boar.select_lod(0)
	boar.update_visual_distance(19)
	check(boar.current_lod==1,"Middle mesh selected at distance")
	boar.update_visual_distance(16)
	check(boar.current_lod==1,"Hysteresis avoids boundary flicker")
	boar.update_visual_distance(12)
	check(boar.current_lod==0,"Full polished mesh returns close up")
	boar.update_visual_distance(50)
	check(boar.current_lod==2 and boar.lod_meshes[2].all(func(m):return m.cast_shadow==0),"Far mesh avoids additional shadow draws")
	boar.update_visual_distance(110)
	check(not boar.model.visible,"Distant visual culls without deleting the actor")
	boar.update_visual_distance(80)
	check(boar.model.visible and boar.current_lod==2,"Visual returns on approach")
	var shape = boar.get_children().filter(func(n):return n is CollisionShape3D)[0]
	check(shape.shape is CapsuleShape3D and is_equal_approx(shape.rotation.x,PI/2),"Simple horizontal capsule fits the body")
	boar.velocity = Vector3(0,0,.9)
	check(is_equal_approx(boar.walk_playback_speed()*.375*.65,.9),"Walk playback matches travel and model scale")
	boar.play("TuskAttack")
	var clip:String = boar.animation.current_animation
	boar.animation.advance(.65)
	var before:float = boar.animation.current_animation_position
	boar.select_lod(1)
	check(boar.animation.current_animation==clip and is_equal_approx(boar.animation.current_animation_position,before),"LOD switch preserves attack playback position")
	var floor_body := StaticBody3D.new()
	var floor_shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(20,.2,20)
	floor_shape.shape = box
	floor_body.position.y = -.1
	floor_body.add_child(floor_shape)
	root.add_child(floor_body)
	boar.position.y = 1
	for i in range(90):
		await physics_frame
		boar.velocity.y -= 20.0/60
		boar.move_and_slide()
	check(boar.is_on_floor() and absf(boar.position.y)<.03,"Collision keeps the hooves at ground level")
	floor_body.queue_free()
	boar.queue_free()
	await process_frame
	print("BOAR GAME CHECK: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
