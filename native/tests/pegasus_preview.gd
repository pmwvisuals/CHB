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
	sun.light_energy=1.0
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
	camera.current=true
	var animation=model.find_children("*","AnimationPlayer",true,false)[0]
	for kind in ["Idle","Walk","Wingbeat"]:
		camera.position=Vector3(4.4,2.65,4.6)
		camera.look_at(Vector3(0,1.2,0))
		model.position.y=0.0
		if kind=="Wingbeat":
			camera.position=Vector3(4.4,4.1,7.1)
			camera.look_at(Vector3(0,2.1,0))
			model.position.y=1.1
		var clip=Array(animation.get_animation_list()).filter(func(n):return String(n).ends_with(kind))[0]
		animation.play(clip)
		animation.seek(.22 if kind=="Walk" else .48,true)
		animation.pause()
		for i in range(4):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/pegasus-"+kind.to_lower()+".png")
	print("PEGASUS POSE PREVIEWS COMPLETE")
	quit()
