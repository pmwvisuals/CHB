extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func luminance(im:Image)->float:
	var value:=0.0
	for y in range(200,480,8):
		for x in range(440,840,8):value+=im.get_pixel(x,y).get_luminance()
	return value/(35*50)
func run():
	root.set_disable_input(true)
	var session=root.get_node("Session")
	session.save_path="res://tests/_forge-save.json"
	session.data.positions={}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	var group=camp.get_node("HephaestusOilLamps")
	var lights=group.find_children("*","OmniLight3D",true,false)
	check(group.get_child_count()==2 and lights.size()==2,"Exactly two oil lamps flank Hephaestus")
	check(lights.all(func(l):return l.light_energy>=4 and not l.shadow_enabled and l.omni_range<=15 and l.distance_fade_enabled),"Warm local lighting has bounded range and adds no shadow passes")
	check(group.get_child(0).position.x< -2 and group.get_child(1).position.x>2,"Central entrance and ramp remain clear")
	check(group.find_children("OilFlame","MeshInstance3D",true,false).size()==2,"Each lamp contains a visible animated flame")
	var a=group.get_child(0).get_node("BrassHurricaneLantern").find_children("*","MeshInstance3D",true,false)
	var b=group.get_child(1).get_node("BrassHurricaneLantern").find_children("*","MeshInstance3D",true,false)
	check(a.size()==5 and a[0].mesh==b[0].mesh,"Both lamps share the supplied optimized model")
	check(FileAccess.file_exists("res://assets/props/LANTERN-CREDITS.txt"),"Model attribution accompanies the asset")
	camp.travel_to(camp.destinations.filter(func(d):return d.id=="hephaestus")[0])
	camp.player.camera.rotation.x=.12
	for i in range(40):await process_frame
	if DisplayServer.get_name()!="headless":
		for l in lights:l.hide()
		for i in range(8):await process_frame
		await RenderingServer.frame_post_draw
		var before=root.get_texture().get_image()
		before.save_png("res://builds/forge-unlit.png")
		for l in lights:l.show()
		for i in range(8):await process_frame
		await RenderingServer.frame_post_draw
		var after=root.get_texture().get_image()
		after.save_png("res://builds/forge-lit.png")
		print("FACADE LUMINANCE: ",luminance(before)," -> ",luminance(after))
		check(luminance(after)>luminance(before)*1.5,"The two lamps visibly brighten the facade in the actual renderer")
		session.paused=true
		for i in range(4):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/forge-credits.png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("FORGE CHECK: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
