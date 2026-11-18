extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func frames(count:int):
	for i in range(count):await physics_frame
func run():
	var session=root.get_node("Session")
	session.save_path="res://tests/_pegasus-save.json"
	session.data.zone="camp"
	session.data.positions={}
	session.data.graphics_quality="high"
	session.data.adventure={}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:await process_frame
	var camp=app.world
	var player=camp.player
	var mount=camp.pegasus
	await frames(30)
	check(is_instance_valid(mount) and mount.is_on_floor(),"Dawnwing spawns grounded in the camp field")
	check(mount.clips.size()==5,"The native model imports idle, walk, trot, jump and wingbeat clips")
	check(not mount.mount_player(player),"Mounting is blocked from a distance")
	player.set_physics_process(false)
	player.position=mount.position+Vector3(140,0,0)
	mount._physics_process(.31)
	mount._physics_process(.01)
	check(not mount.model.visible and mount.animation.speed_scale==0,"Distant rendering and animation stay disabled between distance checks")
	player.position=mount.position+Vector3(2.3,.1,0)
	mount._physics_process(.31)
	check(mount.model.visible and mount.animation.speed_scale==1,"Approaching restores the Pegasus model and animation")
	var boarding:Vector3=player.position
	check(camp.interaction_text()=="Ride Dawnwing","A nearby player sees the riding interaction")
	camp.interact()
	check(player.mount==mount and mount.rider==player,"The normal camp interaction mounts the companion")
	check(is_equal_approx(player.camera.position.y,3.15) and player.collision_layer==0 and not player.combat_enabled(),"Mounting raises rider eye height and sheathes weapons")
	session.save_game(player)
	check(Vector3(session.data.positions.camp[0],session.data.positions.camp[1],session.data.positions.camp[2]).is_equal_approx(boarding),"Saving while mounted records the safe pre-mount foot position")
	var start:Vector3=mount.position
	player.rotation.y=mount.rotation.y
	session.touch_move=Vector2(0,-1)
	for i in range(65):
		await physics_frame
		mount.drive(player,1.0/60)
	check(mount.position.distance_to(start)>1.7 and mount.active_clip=="Walk","Mounted movement drives real physics and the walk animation")
	check(player.position.distance_to(mount.position)<.3,"The rider remains attached to the saddle during movement")
	if "--capture" in OS.get_cmdline_user_args():
		for i in range(4):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/pegasus-riding.png")
	session.sprint_requested=true
	for i in range(35):
		await physics_frame
		mount.drive(player,1.0/60)
	check(Vector2(mount.velocity.x,mount.velocity.z).length()>4 and mount.active_clip=="Trot","Run selects a faster trot")
	session.touch_move=Vector2.ZERO
	session.sprint_requested=false
	for i in range(40):
		await physics_frame
		mount.drive(player,1.0/60)
	session.jump_requested=true
	await physics_frame
	mount.drive(player,1.0/60)
	check(mount.velocity.y>0 and mount.active_clip=="Jump","Jump triggers a physical leap and the jump animation")
	check(not mount.dismount(),"A rider cannot dismount in mid-air")
	for i in range(90):
		await physics_frame
		mount.drive(player,1.0/60)
	check(mount.is_on_floor(),"The Pegasus lands on the physical camp surface")
	var obstacle:=StaticBody3D.new()
	var collision:=CollisionShape3D.new()
	var shape:=BoxShape3D.new()
	shape.size=Vector3(6,4,.4)
	collision.shape=shape
	obstacle.add_child(collision)
	camp.add_child(obstacle)
	var forward:Vector3=-mount.global_basis.z
	var wall_origin:Vector3=mount.position
	obstacle.position=wall_origin+forward*3+Vector3.UP*1.5
	obstacle.rotation.y=mount.rotation.y
	player.rotation.y=mount.rotation.y
	session.touch_move=Vector2(0,-1)
	for i in range(100):
		await physics_frame
		mount.drive(player,1.0/60)
	check((mount.position-wall_origin).dot(forward)<2.5,"Mounted physics stops at a solid wall instead of passing through it")
	obstacle.queue_free()
	session.clear_touch()
	await frames(3)
	session.paused=true
	var at:Vector3=mount.position
	session.touch_move=Vector2(0,-1)
	mount.drive(player,1)
	check(mount.position==at and not mount.dismount(),"Pause freezes riding and prevents dismount actions")
	session.paused=false
	session.clear_touch()
	check(not mount.allowed(Vector3(91,0,0)) and not mount.allowed(Vector3(-67,0,-34)) and not mount.allowed(Vector3(999,0,999)),"Riding rejects the lake, practice yard and map exterior")
	check(mount.dismount(),"A grounded rider dismounts onto a checked open surface")
	check(not is_instance_valid(player.mount) and is_equal_approx(player.camera.position.y,1.82) and player.collision_layer==1,"Dismount restores the normal player camera and collision")
	check(player.position.distance_to(mount.position)>1,"Dismount places the player beside the horse")
	player.position=mount.position+Vector3(2.3,.1,0)
	check(mount.mount_player(player),"The same companion can be mounted again")
	camp.travel_to(camp.destinations.filter(func(d):return d.id=="arrival")[0])
	check(not is_instance_valid(player.mount) and not is_instance_valid(mount.rider) and is_equal_approx(player.camera.position.y,1.82),"Map travel safely releases both rider and companion")
	if "--capture" in OS.get_cmdline_user_args():
		player.position=mount.position+Vector3(5,.1,6)
		player.camera.look_at(mount.position+Vector3.UP*1.8)
		for i in range(5):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/pegasus-companion.png")
	var old:WeakRef=weakref(mount)
	app.travel("temple")
	while app.transitioning:await process_frame
	check(old.get_ref()==null,"Leaving camp releases the Pegasus scene and its rig")
	app.queue_free()
	await frames(3)
	DirAccess.remove_absolute(session.save_path)
	print("PEGASUS RIDING: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
