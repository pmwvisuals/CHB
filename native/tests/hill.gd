extends SceneTree

var failures := 0
var road_faces := PackedVector3Array()

func _initialize():call_deferred("run")

func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1

func rendered_road_height(x:float,z:float) -> float:
	var top := -INF
	var start := Vector3(x,35,z)
	var end := Vector3(x,-5,z)
	for i in range(0,road_faces.size(),3):
		var hit = Geometry3D.segment_intersects_triangle(start,end,road_faces[i],road_faces[i+1],road_faces[i+2])
		if hit != null:top=maxf(top,hit.y)
	return top

func run():
	root.set_disable_input(true)
	var session=root.get_node("Session")
	session.save_path="res://tests/_hill-save.json"
	# Reproduce an old arrival save whose feet predate the paved surface.
	session.data.positions={"camp":[0,16.6,113]}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	var player=camp.player
	check(Vector2(player.position.x,player.position.z).distance_to(Vector2(0,109))<.01,"Old ridge save recovers to the forward crest landing")
	check(player.camera.global_position.y-camp.walking_surface_height(Vector2(0,109))>=1.82,"Recovered eyes start above the actual paved floor before settling")
	check(camp.recover_position(Vector3(0,.5,0)).y<1,"Indoor save recovery keeps the player below the hall roof")
	check(camp.recover_position(Vector3(0,20,109)).y==20,"Save recovery preserves a jump above the ridge")
	for i in range(20):await physics_frame
	for part in camp.scenery.find_children("CampRoad*","MeshInstance3D",true,false):
		var mat=part.material_override
		check(absf(7.2/(8*mat.uv1_scale.x)-.4)<.001 and mat.normal_scale<=.36,"Paving reads as 40 cm stones with shallow relief")
		var faces:PackedVector3Array=part.mesh.get_faces()
		for i in range(0,faces.size(),3):
			var a:Vector3=part.global_transform*faces[i]
			var b:Vector3=part.global_transform*faces[i+1]
			var c:Vector3=part.global_transform*faces[i+2]
			if minf(a.x,minf(b.x,c.x))<=0 and maxf(a.x,maxf(b.x,c.x))>=0 and minf(a.z,minf(b.z,c.z))<=123 and maxf(a.z,maxf(b.z,c.z))>=91:
				road_faces.append_array(PackedVector3Array([a,b,c]))
	# Stay inside the road footprint: z=122 is its terminating edge, where
	# floating-point edge inclusion differs from the ground beneath it.
	for z in [121,118,115,113,111,109,106,102,98,92]:
		var point=Vector2(0,z)
		var visual_y=rendered_road_height(0,z)
		var physical_y:float=camp.walking_surface_height(point)
		player.position=Vector3(0,physical_y+.06,z)
		player.velocity=Vector3.ZERO
		for i in range(20):await physics_frame
		var eye_clearance:float=player.camera.global_position.y-visual_y
		check(is_finite(visual_y) and absf(visual_y-physical_y)<.01 and eye_clearance>=1.8 and eye_clearance<1.95,"Rendered paving, collision and standing eyes agree at ridge z=%d"%z)
	player.position=Vector3(0,camp.walking_surface_height(Vector2(0,100))+.06,100)
	player.velocity=Vector3.ZERO
	player.rotation.y=0
	for i in range(20):await physics_frame
	var minimum_clearance:=INF
	Input.action_press("back")
	for i in range(240):
		await physics_frame
		if i%12==0:
			minimum_clearance=minf(minimum_clearance,player.camera.global_position.y-rendered_road_height(player.position.x,player.position.z))
	Input.action_release("back")
	check(player.position.z>114 and minimum_clearance>=1.8,"Walking uphill across the crest preserves standing height")
	camp.travel_to(camp.destinations.filter(func(d):return d.id=="arrival")[0])
	for i in range(30):await physics_frame
	check(absf(player.position.z-109)<.1 and player.is_on_floor(),"Map teleport settles onto the forward ridge crest")
	if DisplayServer.get_name()!="headless":
		for i in range(35):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/height-fixed-arrival.png")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("HILL CHECK: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
