extends SceneTree
var failures := 0

func check(condition: bool, description: String):
	print(("PASS " if condition else "FAIL ") + description)
	if not condition:
		failures += 1

func _initialize():
	call_deferred("run")

func run():
	var preview = load("res://Preview/preview.tscn").instantiate()
	root.add_child(preview)
	await process_frame
	for variant in range(2):
		preview.load_model(variant)
		await process_frame
		check(preview.model.find_children("*","MeshInstance3D",true,false).size()==13, "Thirteen meshes in variant %d"%variant)
		check(preview.clip_names.size()==7, "Seven animations in variant %d"%variant)
		var skeleton: Skeleton3D = preview.model.find_children("*","Skeleton3D",true,false)[0]
		check(skeleton.get_bone_count()==31, "Thirty-one bones in variant %d"%variant)
		for kind in preview.CLIPS:
			preview.play_clip(kind)
			preview.animation.seek(preview.animation.current_animation_length * .35,true)
			check(preview.animation.current_animation.ends_with(kind), "Playback "+kind+" variant %d"%variant)
		preview.set_paused(true)
		check(preview.animation.speed_scale==0, "Pause in variant %d"%variant)
		preview.set_paused(false)
		check(preview.animation.speed_scale==1, "Resume in variant %d"%variant)
	var azimuth: float = preview.azimuth
	var mouse := InputEventMouseButton.new()
	mouse.button_index = MOUSE_BUTTON_LEFT
	mouse.pressed = true
	preview._unhandled_input(mouse)
	var motion := InputEventMouseMotion.new()
	motion.relative = Vector2(32,10)
	preview._unhandled_input(motion)
	check(preview.azimuth != azimuth, "Orbit control changes camera")
	var distance: float = preview.distance
	mouse.button_index = MOUSE_BUTTON_WHEEL_UP
	preview._unhandled_input(mouse)
	check(preview.distance<distance, "Wheel control zooms")
	if "--capture" in OS.get_cmdline_user_args():
		await capture(preview)
	print("BUYER PREVIEW FAILURES ",failures)
	quit(1 if failures else 0)

func capture(preview):
	preview.load_model(0)
	preview.overlay.hide()
	for item in [["Walk","Walking",56],["Wingbeat","Flight",70]]:
		preview.play_clip(item[0])
		preview.animation.pause()
		var folder: String = OS.get_environment("DAWNWING_FRAMES").path_join(item[1])
		DirAccess.make_dir_recursive_absolute(folder)
		var caption := Label.new()
		caption.text = "Dawnwing · "+item[0]
		caption.position = Vector2(16,14)
		caption.add_theme_font_size_override("font_size",21)
		var layer := CanvasLayer.new()
		root.add_child(layer)
		layer.add_child(caption)
		var duration: float = preview.animation.get_animation(preview.clip_names[item[0]]).length * 2
		for index in range(item[2]):
			preview.animation.seek(duration * index/item[2],true)
			await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png(folder.path_join("%03d.png"%index))
		layer.queue_free()
