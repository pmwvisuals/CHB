extends SceneTree
var failures := 0
func _initialize():
	call_deferred("run")
func check(value:bool,description:String):
	print(("PASS: " if value else "FAIL: ")+description)
	if not value:
		failures += 1
func frames(count:int):
	for i in range(count):
		await physics_frame
		await process_frame
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_polish-save.json"
	session.data = {"zone":"camp","coins":0,"xp":0,"health":100.0,"time":600.0,"positions":{}}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	var player = camp.player
	await frames(10)
	check(not player.weapon.visible and not player.attack(),"Arrival is unarmed and cannot attack")
	for destination in camp.destinations:
		camp.travel_to(destination)
		await frames(2)
		var training:bool = destination.id == "training"
		check(player.combat_enabled() == training and player.weapon.visible == training,"Correct weapon mode at "+destination.name)
	# The original ground patch has vertex colors; every such surface must use them.
	var checked := 0
	var correct := true
	for part in camp.scenery.find_children("*","MeshInstance3D",true,false):
		for index in range(part.mesh.get_surface_count()):
			var material = part.get_active_material(index)
			var colors = part.mesh.surface_get_arrays(index)[Mesh.ARRAY_COLOR]
			if material is BaseMaterial3D and colors != null and colors.size()>0:
				checked += 1
				correct = correct and material.vertex_color_use_as_albedo
	check(checked>0 and correct,"Colored imported surfaces retain their original colors")
	var fitted:bool = camp.find_children("TempleNameplate_*","MeshInstance3D",true,false).size() == 12
	var font_correct := true
	for sign in camp.find_children("*","Label3D",true,false):
		fitted = fitted and sign.get_aabb().size.y<=.35 and not sign.no_depth_test
		font_correct = font_correct and sign.font.resource_path == "res://fonts/Cinzel.ttf"
	check(fitted,"World inscriptions fit their architectural bands and respect depth")
	check(font_correct,"All world inscriptions use the bundled classical font")
	check(player.hud.health.get_theme_font("font").resource_path.contains("Barlow"),"HUD uses the bundled game interface font")
	# An actual attack reaches the existing practice dummy, without granting economy rewards.
	player.position = Vector3(-48.5,camp.height(-48.5,-21)+.1,-21)
	player.rotation.y = 0
	player.pitch = 0
	player.camera.rotation.x = 0
	await frames(12)
	check(player.weapon.visible and player.attack(),"Entering the dummy lane equips and enables the sword")
	check(camp.training_hits == 1,"Sword strikes register on the existing practice dummy")
	player.position = Vector3(-40,camp.height(-40,-21)+.1,-21)
	await frames(2)
	check(not player.weapon.visible and not player.attack() and player.cooldown == 0,"Leaving practice cancels the swing and blocks attacks")
	check(session.data.coins == 0 and session.data.xp == 0,"Practice hits do not create economy rewards")
	app.queue_free()
	await frames(3)
	DirAccess.remove_absolute(session.save_path)
	print("POLISH CHECK: %d failure(s)" % failures)
	quit(0 if failures == 0 else 1)
