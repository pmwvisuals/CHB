extends SceneTree

var failures := 0
func _initialize():
	call_deferred("run")
func check(value:bool,text:String):
	print(("PASS: " if value else "FAIL: ")+text)
	if not value:
		failures += 1
func frames(count:int):
	for i in range(count):
		await physics_frame
		await process_frame
func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_graphics-save.json"
	session.data = {"zone":"camp","coins":7,"xp":11,"health":100.0,"time":600.0,"positions":{},"training":{}}
	var policy = load("res://scripts/graphics_quality.gd")
	check(policy.PRESETS.size()==2 and policy.valid("high") and policy.valid("balanced"),"Exactly two graphics options exist")
	check(policy.recommend(2*1024*1024*1024,true,"32")=="balanced","The 2 GB 32-bit tablet receives Balanced")
	check(policy.recommend(4*1024*1024*1024,true,"64")=="balanced","A 4 GB phone receives the conservative recommendation")
	check(policy.recommend(8*1024*1024*1024,true,"64")=="high","A stronger 64-bit phone receives High")
	check(policy.recommend(12*1024*1024*1024,false,"64")=="high","Desktop receives High")
	check(not session.set_graphics_quality("ultra"),"Unknown quality values are rejected")
	session.set_graphics_quality("high")
	session.data.graphics_quality = "balanced"
	session.load_game()
	check(session.graphics_quality()=="high","A manual choice survives save and reload")
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	await frames(8)
	check(not is_instance_valid(camp.collision_root) and camp.collision_scene==null,"Temporary physics wrapper and its packed source are released")
	check(not camp.layout.has("batches"),"Converted placement JSON is released after instance creation")
	check(camp.player.is_on_floor(),"Walkable collision remains after releasing temporary geometry")
	var collision_triangles := 0
	var collision_chunks := 0
	for body in camp.get_children():
		if body is StaticBody3D and String(body.name).begins_with("WalkableChunk_"):
			collision_chunks += 1
			collision_triangles += body.get_child(0).shape.get_faces().size()/3
	check(collision_chunks==61 and collision_triangles==475218,"All original collision faces load directly as physics shapes")
	var scenery_parts = camp.scenery.find_children("*","MeshInstance3D",true,false)
	var scenery_triangles := 0
	var palette_materials := {}
	for part in scenery_parts:
		for i in range(part.mesh.get_surface_count()):
			var index_count:int = part.mesh.surface_get_array_index_len(i)
			scenery_triangles += (index_count if index_count>0 else part.mesh.surface_get_array_len(i))/3
			var material = part.get_active_material(i)
			if material is ShaderMaterial and material.shader.code.contains("ROUGHNESS = UV2.x"):
				palette_materials[material.get_instance_id()] = true
	check(scenery_triangles==985778,"Scenery batching preserves all original rendered triangles")
	check(scenery_parts.size()<180 and palette_materials.size()==4,"Opaque scenery shares four palette materials and spatial groups")
	var stream = camp.foliage_stream
	var source_count := 0
	var positions_match := true
	for group in stream.distant.values():
		for cell in group.cells:
			source_count += cell.transforms.size()
			for i in range(cell.transforms.size()):
				var source:Transform3D = cell.node.multimesh.get_instance_transform(i)
				var far:Transform3D = cell.transforms[i]
				positions_match = positions_match and (source.origin+cell.node.position).distance_to(far.origin+group.origin)<.001 and source.basis.is_equal_approx(far.basis)
	check(source_count>10000 and positions_match,"Distant instances retain every original transform")
	for quality in ["balanced","high"]:
		session.set_graphics_quality(quality)
		check(is_equal_approx(root.scaling_3d_scale,policy.PRESETS[quality].scale),quality+" updates only the 3D resolution scale")
		check(is_equal_approx(camp.sun.directional_shadow_max_distance,policy.PRESETS[quality].shadow_range),quality+" applies its shadow distance")
		var leaf_ranges := true
		for node in camp.get_children():
			if node is MultiMeshInstance3D and node.get_meta("foliage_detail",false):
				leaf_ranges = leaf_ranges and is_equal_approx(node.visibility_range_end,policy.PRESETS[quality].leaf_range)
		check(leaf_ranges,quality+" applies detail distance to every leaf cell")
		for id in ["arrival","poseidon","training"]:
			camp.travel_to(camp.destinations.filter(func(d): return d.id == id)[0])
			stream.refresh(true)
			var represented := 0
			for cell in stream.near_cells:
				if cell.near:
					represented += cell.transforms.size()
			for group in stream.distant.values():
				represented += group.node.multimesh.visible_instance_count
			check(represented==source_count,"No missing or duplicate trunk/crown placements: "+quality+" at "+id)
	check(session.data.coins==7 and session.data.xp==11,"Changing graphics preserves progression")
	camp.player.hud.toggle_pause()
	camp.player.hud.open_graphics()
	await frames(2)
	check(not camp.visible and camp.player.hud.graphics_panel.is_visible_in_tree(),"Graphics menu stays visible while covered 3D scenery stops rendering")
	check(camp.player.hud.graphics_panel.choices.size()==2,"The settings screen offers two choices")
	camp.player.hud.graphics_panel.select("balanced")
	check(session.graphics_quality()=="balanced" and session.paused,"A settings choice applies without leaving pause")
	camp.player.hud.handle_back()
	await frames(2)
	check(not is_instance_valid(camp.player.hud.graphics_panel) and session.paused,"Back returns from Graphics to Pause")
	camp.player.hud.toggle_pause()
	await frames(2)
	check(camp.visible and not session.paused,"Resume restores the scene")
	if "--capture" in OS.get_cmdline_user_args():
		camp.player.hud.toggle_pause()
		camp.player.hud.open_graphics()
		await frames(2)
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/graphics-settings.png")
	app.queue_free()
	await frames(3)
	DirAccess.remove_absolute(session.save_path)
	print("GRAPHICS CHECK: %d failure(s)" % failures)
	quit(0 if failures==0 else 1)
