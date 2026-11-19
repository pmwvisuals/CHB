extends SceneTree

var failures := 0
var session
var app

func _initialize():
	call_deferred("run")

func check(value:bool, label:String):
	print(("PASS: " if value else "FAIL: ") + label)
	if not value:
		failures += 1

func sample(label:String, camp):
	for i in range(12):
		await process_frame
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		if "--capture" in OS.get_cmdline_user_args():
			root.get_texture().get_image().save_png("res://builds/architecture-" + label + ".png")
	var vertices := 0
	var triangles := 0
	var pieces:Array[Node] = camp.scenery.find_children("SceneryCell_*","MeshInstance3D",true,false)
	for part in pieces:
		for surface in range(part.mesh.get_surface_count()):
			vertices += part.mesh.surface_get_array_len(surface)
			triangles += int(part.mesh.surface_get_array_index_len(surface) / 3.0)
	print("ARCHITECTURE SAMPLE ",JSON.stringify({"case":label,"meshes":pieces.size(),
		"vertices":vertices,"triangles":triangles,"godot_static_bytes":OS.get_static_memory_usage(),
		"draws":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"buffer_bytes":Performance.get_monitor(Performance.RENDER_BUFFER_MEM_USED)}))
	return triangles

func run():
	root.set_disable_input(true)
	session = root.get_node("Session")
	var mobile := "--touch-controls" in OS.get_cmdline_user_args()
	session.save_path = "res://tests/_architecture-" + ("mobile" if mobile else "desktop") + ".json"
	session.data.positions = {}
	session.data.zone = "camp"
	session.data.graphics_quality = "high"
	session.apply_graphics()
	app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	var camp = app.world
	camp.player.set_physics_process(false)
	var index:Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/architecture/index.json"))
	var arrival_triangles:int = await sample("mobile-arrival" if mobile else "desktop-arrival",camp)
	if mobile:
		check(arrival_triangles > 0 and arrival_triangles < index.triangles,"Mobile loads the Arrival Ridge neighborhood without the full architecture")
		check(not ResourceLoader.has_cached("res://assets/camp/camp-static.glb"),"Mobile never loads the monolithic scenery")
		var stream = camp.architecture_stream
		check(stream.failed.is_empty() and stream.pending.is_empty(),"Initial load completes before the camp is revealed")
		var arrival_path:String = stream.residents.keys()[0]
		var arrival_mesh:WeakRef = weakref(stream.residents[arrival_path].get_child(0).mesh)
		var destination:Dictionary = camp.destinations.filter(func(d): return d.id == "ares")[0]
		camp.player.hud.open_map()
		var map = camp.player.hud.map_panel
		var old_position:Vector3 = camp.player.position
		map.choose(destination)
		if map.traveling:
			check(session.paused and camp.player.position == old_position,"The map covers the old view while destination assets load")
			camp.player.hud.handle_back()
			check(is_instance_valid(map) and session.paused,"Back cannot expose a partially loaded destination")
		while is_instance_valid(map):
			await process_frame
		await process_frame
		var landing := Vector2(camp.player.position.x,camp.player.position.z)
		check(landing.distance_to(destination.point) < .01 and not session.paused and stream.failed.is_empty(),"Map travel lands at Ares after its buildings are ready")
		check(arrival_mesh.get_ref() == null and not stream.residents.has(arrival_path),"The departed section's actual mesh resource is released")
		await sample("mobile-ares",camp)
		var arrival:Dictionary = camp.destinations.filter(func(d): return d.id == "arrival")[0]
		# Move the camera target without priming as flight and movement do.
		camp.travel_to(arrival)
		var deadline := Time.get_ticks_msec() + 5000
		while not stream.residents.has(arrival_path) and Time.get_ticks_msec() < deadline:
			await process_frame
		check(stream.residents.has(arrival_path),"Approaching the old neighborhood loads its mesh again")
		var stream_ref:WeakRef = weakref(stream)
		app.travel("temple")
		while app.transitioning:
			await process_frame
		check(stream_ref.get_ref() == null and app.world.has_node("CultStatue"),"Temple entry releases the entire camp stream")
	else:
		check(arrival_triangles == index.triangles,"Desktop still has the full original architecture")
	app.queue_free()
	await process_frame
	if FileAccess.file_exists(session.save_path):
		DirAccess.remove_absolute(session.save_path)
	print("ARCHITECTURE CHECK: %d failure(s)" % failures)
	quit(0 if failures == 0 else 1)
