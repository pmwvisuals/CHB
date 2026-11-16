extends SceneTree

var failures := 0

func _initialize():
	call_deferred("run")

func check(value:bool,message:String):
	print(("PASS " if value else "FAIL ")+message)
	if not value:
		failures += 1

func inspect(forest):
	for actor in forest.supplied_creatures:
		var matte := true
		var textured := true
		var subdued := true
		var local := true
		var model:Node3D = actor.visual.get_child(0).get_child(0)
		for part in model.find_children("*","MeshInstance3D",true,false):
			for surface in range(part.mesh.get_surface_count()):
				var mat = part.get_active_material(surface)
				var source = part.mesh.surface_get_material(surface)
				matte = matte and not mat.emission_enabled and mat.metallic==0 and mat.metallic_texture==null and mat.roughness>=.9 and mat.roughness_texture==null and mat.metallic_specular<=.1 and not mat.clearcoat_enabled and not mat.rim_enabled
				textured = textured and mat.albedo_texture==source.albedo_texture and mat.normal_texture==source.normal_texture
				local = local and mat!=source
				if actor.name=="MagicWolf":
					subdued = subdued and mat.albedo_color.r<source.albedo_color.r*.75 and mat.albedo_color.g<source.albedo_color.g*.8
		check(matte,actor.name+" uses matte non-emissive surfaces with bounded highlights")
		check(textured and local,actor.name+" retains source textures through local material overrides")
		if actor.name=="MagicWolf":
			check(subdued,"Wolf colours are muted for the shaded woodland")

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_creature-materials-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:
		await process_frame
	inspect(app.world)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	app.travel("forest")
	while app.transitioning:
		await process_frame
	inspect(app.world)
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("CREATURE MATERIALS CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
