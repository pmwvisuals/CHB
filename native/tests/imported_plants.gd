extends SceneTree
var failures := 0
func _initialize():call_deferred("run")
func check(value:bool,label:String):
	print(("PASS: " if value else "FAIL: ")+label)
	if not value:failures+=1
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_imported-plants-save.json"
	session.data.positions = {}
	var helper = load("res://scripts/imported_plants.gd").new()
	var prototypes:Dictionary = helper.load_prototypes()
	check(prototypes.size()==17,"Fifteen grass variants and two complete bushes import")
	var rooted := true
	var cutout := true
	for part in prototypes.values():
		var box:AABB = part.mesh.get_aabb()
		rooted = rooted and absf(box.position.y)<.002 and absf(box.size.y-1)<.002
		for i in range(part.mesh.get_surface_count()):
			var material = part.get_active_material(i)
			cutout = cutout and material.transparency==BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR and material.albedo_texture!=null
	check(rooted,"All prototypes are centred and rooted at a consistent unit height")
	check(cutout,"Textured plant materials use cutout transparency")
	helper.dispose()
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp = app.world
	check(camp.imported_plants.grass_count>30000,"Uploaded grass replaces the camp ground-cover placements")
	check(camp.imported_plants.bush_count>20 and camp.imported_plants.flower_count>100,"Camp shrubs and flower beds use the supplied bush models")
	var grounded := true
	var forest_safe := true
	var old_camp_bushes := false
	var count := 0
	var habitat:Image = load("res://assets/camp/habitat.png").get_image()
	for node in camp.get_children():
		if not node is MultiMeshInstance3D:continue
		var kind:String = node.get_meta("plant_kind","")
		old_camp_bushes = old_camp_bushes or kind.begins_with("camp_laurel ") or kind.begins_with("camp_myrtle ")
		if not kind.begins_with("Imported"):continue
		for i in range(node.multimesh.instance_count):
			var t:Transform3D = node.multimesh.get_instance_transform(i)
			var p:Vector3 = t.origin+node.position
			grounded = grounded and absf(p.y-camp.height(p.x,p.z)+.025)<.003
			if "bushes" in kind:
				var xx := clampi(int((p.x+250)/500*habitat.get_width()),0,habitat.get_width()-1)
				var zz := clampi(int((p.z+250)/500*habitat.get_height()),0,habitat.get_height()-1)
				forest_safe = forest_safe and habitat.get_pixel(xx,zz).g<=.25
			count += 1
	check(count==camp.imported_plants.replaced,"Every prepared placement appears once")
	check(grounded,"New plant roots follow the camp hills and ground")
	check(forest_safe,"Flowering bushes stay outside the dark forest habitat")
	check(not old_camp_bushes,"Old multipart camp bush models are replaced")
	var original:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/camp-layout.json"))
	var expected_forest := {}
	var actual_forest := {}
	for entry in original.batches:
		if String(entry.kind).begins_with("forest_") and "bark high" in entry.kind:
			expected_forest[entry.kind] = expected_forest.get(entry.kind,0)+entry.instances.size()
	for node in camp.get_children():
		if node is MultiMeshInstance3D:
			var kind:String = node.get_meta("plant_kind","")
			if kind.begins_with("forest_") and "bark high" in kind:
				actual_forest[kind] = actual_forest.get(kind,0)+node.multimesh.instance_count
	check(actual_forest==expected_forest and expected_forest.size()>=5,"Every original dark forest tree/bush trunk placement remains")
	print("IMPORTED COUNTS grass=",camp.imported_plants.grass_count," shrubs=",camp.imported_plants.bush_count," flowers=",camp.imported_plants.flower_count)
	app.queue_free()
	for i in range(3):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("IMPORTED PLANTS CHECK: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
