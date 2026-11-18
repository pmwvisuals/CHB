extends SceneTree
func _initialize():call_deferred("run")
func run():
	var stage:=Node3D.new()
	root.add_child(stage)
	var world:=WorldEnvironment.new()
	var env:=Environment.new()
	env.background_mode=Environment.BG_COLOR
	env.background_color=Color("263438")
	env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color=Color("d6e1e3")
	env.ambient_light_energy=.6
	world.environment=env
	stage.add_child(world)
	var sun:=DirectionalLight3D.new()
	sun.rotation_degrees=Vector3(-45,-30,0)
	sun.light_energy=1.5
	sun.shadow_enabled=true
	stage.add_child(sun)
	var floor:=MeshInstance3D.new()
	var plane:=PlaneMesh.new()
	plane.size=Vector2(40,40)
	floor.mesh=plane
	var mat:=StandardMaterial3D.new()
	mat.albedo_color=Color("485c58")
	mat.roughness=1
	floor.material_override=mat
	stage.add_child(floor)
	var model=load("res://assets/pegasus/dawnwing.glb").instantiate()
	stage.add_child(model)
	var camera:=Camera3D.new()
	camera.fov=35
	stage.add_child(camera)
	camera.position=Vector3(7,4,8)
	camera.look_at(Vector3(0,1.7,0))
	camera.current=true
	var animation=model.find_children("*","AnimationPlayer",true,false)[0]
	for kind in ["Idle","Walk","Wingbeat"]:
		var clip=Array(animation.get_animation_list()).filter(func(n):return String(n).ends_with(kind))[0]
		animation.play(clip)
		animation.seek(.3,true)
		animation.pause()
		for i in range(4):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/pegasus-"+kind.to_lower()+".png")
	print("PEGASUS POSE PREVIEWS COMPLETE")
	quit()
