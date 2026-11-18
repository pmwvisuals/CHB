extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS " if ok else "FAIL ")+label)
	if not ok:failures+=1
func run():
	root.set_disable_input(true)
	var session=root.get_node("Session")
	session.save_path="res://tests/_street-review-save.json"
	session.data.positions={}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	await physics_frame
	check(camp.layout.has("roadPlan") and camp.layout.roadPlan.paving.size()>0,"Native map receives the actual complete paved footprint")
	check(camp.layout.routes.filter(func(r):return r.kind=="main").size()==1,"Only one primary street is exported")
	for temple in camp.layout.temples:
		if temple.id=="poseidon":continue
		var connected:=true
		for distance in [10.5,12.0,14.0,16.0]:
			var point:Vector3=Vector3(temple.x,0,temple.z)+Basis(Vector3.UP,temple.rotation)*Vector3(0,0,distance)
			point.y=camp.height(point.x,point.z)
			var ray=PhysicsRayQueryParameters3D.create(point+Vector3.UP*4,point-Vector3.UP*2)
			var hit:Dictionary=camp.get_world_3d().direct_space_state.intersect_ray(ray)
			connected=connected and not hit.is_empty() and hit.position.y>point.y+.07
		check(connected,temple.id+" entrance landing remains continuously walkable")
	for route in camp.layout.routes:
		var supported:=true
		for i in range(0,route.points.size(),8):
			var point=route.points[i]
			var height:float=camp.height(point[0],point[1])
			var ray=PhysicsRayQueryParameters3D.create(Vector3(point[0],height+4,point[1]),Vector3(point[0],height-2,point[1]))
			var hit:Dictionary=camp.get_world_3d().direct_space_state.intersect_ray(ray)
			# Terrain triangles interpolate the analytic height; allow their small vertical error.
			var paved:bool=camp.layout.roadPlan.paving.any(func(r):return point[0]>=r[0]-.001 and point[0]<=r[2]+.001 and point[1]>=r[1]-.001 and point[1]<=r[3]+.001)
			supported=supported and paved and not hit.is_empty() and hit.position.y>=height-.08
		check(supported,route.name+" has a continuous physical surface")
	session.paused=false
	DisplayServer.window_move_to_foreground()
	camp.player.set_physics_process(false)
	for view in [["arrival",Vector3(0,0,72),Vector3(0,0,20)],["hall",Vector3(16,0,34),Vector3(-8,0,12)],["lakeside",Vector3(62,0,28),Vector3(15,0,18)],["gate",Vector3(-40,0,-105),Vector3(-40,1,-121)]]:
		var point:Vector3=view[1];point.y=camp.height(point.x,point.z)+1.82
		camp.player.position=point-Vector3.UP*1.82
		camp.player.camera.global_position=point
		var target:Vector3=view[2];target.y+=camp.height(target.x,target.z)
		camp.player.camera.look_at(target)
		for i in range(12):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/street-review-"+view[0]+".png")
	camp.player.hud.open_map()
	await process_frame
	var map=camp.player.hud.map_panel
	check(map.road_review and map.place_markers.all(func(m):return not m.visible),"Map defaults to an unobstructed street-plan review")
	var toggle=map.find_children("*","Button",true,false).filter(func(b):return b.text=="SHOW PLACE NUMBERS")[0]
	toggle.pressed.emit()
	check(not map.road_review and map.place_markers.all(func(m):return m.visible),"Place-number overlay can be restored for travel")
	toggle.pressed.emit()
	for i in range(5):await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://builds/street-review-map.png")
	var viewport:=SubViewport.new()
	viewport.size=Vector2i(1600,1600)
	viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	var canvas:=Control.new()
	canvas.size=Vector2(1600,1600)
	viewport.add_child(canvas)
	map.map_center=Vector2(800,800)
	map.map_scale=3.2
	canvas.draw.connect(func():
		canvas.draw_rect(Rect2(Vector2.ZERO,Vector2(1600,1600)),Color("101f1c"))
		map.draw_map(canvas)
		var font=ThemeDB.fallback_font
		canvas.draw_string(font,Vector2(70,58),"ASTERION / CAMP STREET PLAN",HORIZONTAL_ALIGNMENT_LEFT,-1,34,Color("eee3c7"))
		canvas.draw_string(font,Vector2(70,105),"GOLD: MAIN ROAD    CREAM: ACCESS PATHS    GREY: BUILDINGS",HORIZONTAL_ALIGNMENT_LEFT,-1,22,Color("d7cdb5"))
		canvas.draw_string(font,Vector2(70,1530),"One connected network. No freestanding plazas. Exact paved widths and footprints.",HORIZONTAL_ALIGNMENT_LEFT,-1,23,Color("d7cdb5"))
	)
	for i in range(5):await process_frame
	await RenderingServer.frame_post_draw
	viewport.get_texture().get_image().save_png("res://builds/camp-street-plan.png")
	viewport.queue_free()
	camp.player.hud.close_map()
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("STREET REVIEW: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
