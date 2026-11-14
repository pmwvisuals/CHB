extends SceneTree
var failures := 0
func _initialize():
	call_deferred("run")
func check(condition:bool,text:String):
	print(("PASS: " if condition else "FAIL: ")+text)
	if not condition:failures += 1
func frames(count:int):
	for i in range(count):await process_frame
func run():
	root.set_disable_input(true)
	var session = root.get_node("Session")
	session.save_path = "res://tests/_lighting-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp = app.world
	await frames(80)
	var env:Environment = camp.environment
	check(env.ambient_light_source==Environment.AMBIENT_SOURCE_SKY,"Directional sky fill replaces the flat green ambient color")
	check(env.tonemap_mode==Environment.TONE_MAPPER_ACES,"Filmic highlight rolloff protects pale stone and roads")
	check(camp.key_light.light_color.r>camp.key_light.light_color.b,"The fixed key is warmer than the sky fill")
	check(camp.key_light.position.x<0 and camp.key_light.position.y/camp.key_light.position.length()<.5,"The sun stays low in the western evening sky")
	check(env.tonemap_exposure<=.7 and camp.key_light.light_energy<.85,"Evening exposure and key strength stay within the comfortable range")
	check(camp.key_light.shadow_enabled and camp.key_light.directional_shadow_mode==DirectionalLight3D.SHADOW_ORTHOGONAL,"One directional shadow pass remains")
	check(env.fog_mode==Environment.FOG_MODE_DEPTH and env.fog_depth_begin>=70 and env.fog_depth_end>350,"Distant haze leaves nearby architecture clear")
	check(is_zero_approx(env.fog_sky_affect),"Fog cannot become a white overlay across the sky")
	check(not env.volumetric_fog_enabled and not env.ssao_enabled and not env.sdfgi_enabled,"Atmosphere does not add full-screen AO or volumetric/GI passes")
	var sky_material:ShaderMaterial = env.sky.sky_material
	check(env.sky.radiance_size==Sky.RADIANCE_SIZE_128,"Sky lighting uses a bounded radiance cache")
	check(not sky_material.shader.code.contains("TIME"),"Sky shader does not request built-in per-frame time updates")
	var clouds:Texture2D = sky_material.get_shader_parameter("cloud_banks")
	var cloud_image := clouds.get_image()
	var cloudy := 0
	for y in range(0,cloud_image.get_height(),8):
		for x in range(0,cloud_image.get_width(),8):
			if cloud_image.get_pixel(x,y).a>.15:cloudy += 1
	var coverage := float(cloudy)/(cloud_image.get_width()*cloud_image.get_height()/64.0)
	check(coverage>.005 and coverage<.15,"Four sparse baked cloud banks keep most of the sky clear")
	check(clouds.get_width()==2048 and clouds.get_height()==1024,"Cloud silhouettes retain the authored panorama resolution")
	var field:Texture2D = load("res://assets/atmosphere/ground-light.png")
	var image := field.get_image()
	check(field.get_width()==1536 and field.get_height()==1536,"Contact and canopy lighting share one compact field")
	var raw:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/camp-layout.json"))
	var report:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/atmosphere/bake-report.json"))
	check(report.layout_sha256==FileAccess.get_sha256("res://assets/camp/camp-layout.json"),"Baked contact shading matches this exact map version")
	var grounded := 0
	var sampled := 0
	for batch in raw.batches:
		if not "bark high" in batch.kind:continue
		for m in batch.instances:
			var point := Vector2(batch.center[0]+m[9],batch.center[2]+m[11])
			var pixel := Vector2i((point+Vector2.ONE*224)/448*1536)
			pixel = pixel.clamp(Vector2i.ZERO,Vector2i(1535,1535))
			if image.get_pixelv(pixel).r<.9:grounded += 1
			sampled += 1
	check(sampled>3000 and grounded>sampled*.98,"Baked contact shade aligns with retained tree roots")
	var leaf_materials := 0
	for part in camp.get_children():
		if part is not MultiMeshInstance3D:continue
		for surface in range(part.multimesh.mesh.get_surface_count()):
			var material = part.multimesh.mesh.surface_get_material(surface)
			if material is ShaderMaterial and material.get_shader_parameter("leaf")==true:leaf_materials += 1
	check(leaf_materials>100,"Leaf materials receive thin-leaf backlighting and grounded shade")
	var rays = camp.get_node("EveningCanopyRays")
	check(rays.get_child_count()==6 and rays.get_children().all(func(ray):return ray.visibility_range_end<=38 and ray.cast_shadow==GeometryInstance3D.SHADOW_CASTING_SETTING_OFF),"Six short-range rays add no lights, collisions or shadow passes")
	var sun_radius:float = sky_material.get_shader_parameter("sun_radius")
	check(sun_radius>.004 and sun_radius<.020 and camp.find_children("*","DirectionalLight3D",true,false).size()==1,"One modest solar disc corresponds to one fixed directional key")
	var water = camp.scenery.find_child("MirrorLake",true,false).material_override
	check(not water.shader.code.contains("ALPHA=") and not water.shader.code.contains("ALPHA ="),"Blue lake water remains opaque")
	var key_pose:Transform3D = camp.key_light.transform
	var sky_tint = sky_material.get_shader_parameter("zenith_tint")
	var clock:float = session.data.time
	var phase:float = camp.weather_time
	camp._process(60)
	check(camp.weather_time>phase+59 and session.data.time==clock,"Cloud drift is independent of the retired day/night clock")
	check(camp.key_light.transform==key_pose and sky_material.get_shader_parameter("zenith_tint")==sky_tint,"Cloud movement cannot change the fixed lighting")
	phase = camp.weather_time
	session.paused = true
	camp._process(20)
	check(camp.weather_time==phase,"Pause stops cloud drift")
	session.paused = false
	# Test actual draw submissions: a global cloud phase must not rebake sky lighting.
	if DisplayServer.get_name()!="headless":
		await frames(20)
		await RenderingServer.frame_post_draw
		var before := Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
		RenderingServer.global_shader_parameter_set("sanctuary_weather_time",600.0)
		await frames(1)
		await RenderingServer.frame_post_draw
		var after := Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
		print("SKY CACHE DRAW CHECK: ",before," -> ",after)
		check(after<=before+5,"Visible cloud drift does not submit another radiance bake")
	app.queue_free()
	await frames(4)
	DirAccess.remove_absolute(session.save_path)
	print("LIGHTING CHECK: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
