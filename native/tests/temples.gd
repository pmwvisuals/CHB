extends SceneTree
var failures:=0
var session
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func run():
	session=root.get_node("Session")
	session.save_path="res://tests/_temple-save.json"
	session.data.positions={}
	session.data.zone="camp"
	session.render_profile={"quality":"high"}
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	check(session.OPEN_TEMPLES.size()==3,"Exactly Zeus, Ares and Poseidon are open")
	var previous:WeakRef
	for id in session.OPEN_TEMPLES:
		session.data.temple=id
		app.travel("temple")
		while app.transitioning:await process_frame
		var room=app.world
		if previous:check(previous.get_ref()==null,"Previous temple is released before another hall loads")
		previous=weakref(room)
		for i in range(15):await physics_frame
		check(room.temple_id==id and room.player.is_on_floor(),id+" opens with the player standing on its physical floor")
		check(room.find_children("TempleArchitecture_*","MeshInstance3D",true,false).size()==6,id+" batches stone, marble trim, pigment, bronze, timber and clay")
		check(not room.player.combat_enabled() and not room.player.weapon.visible,id+" is a safe sacred space")
		check(room.flames.size()==6 and room.find_children("*","OmniLight3D",true,false).size()==7,id+" has six visible oil lamps and a sanctum fill light")
		check(room.has_node("CultStatue")== (id in ["zeus","ares"]),id+" uses its complete supplied sculpture; incomplete Poseidon stays absent")
		room.player.hud.open_map()
		check(not session.paused and not is_instance_valid(room.player.hud.map_panel),"Camp map cannot be opened against a temple scene")
		room.player.hud.open_journal()
		check(session.paused and is_instance_valid(room.player.hud.journal_panel),"Journal remains available inside "+id)
		room.player.hud.close_journal()
		if "--capture" in OS.get_cmdline_user_args():
			room.player.set_physics_process(false)
			room.player.position=Vector3(2.2,.05,15)
			room.player.camera.look_at(Vector3(0,4,-14))
			for i in range(4):await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("res://builds/temple-"+id+".png")
		room.player.position=Vector3(0,.05,19)
		check(room.interaction_text()=="Return to camp","The entrance provides a return interaction")
	session.render_profile={}
	session.data.zone="temple"
	session.data.temple="poseidon"
	var coins:int=session.data.coins
	check(not session.accept_quest("steady_hand") and not session.buy_draught() and session.data.coins==coins,"Temple visits cannot spend gold or accept camp contracts remotely")
	app.world.interact()
	while app.transitioning:await process_frame
	check(session.data.zone=="camp" and not app.world.forest,"The actual temple exit loads camp")
	for destination in app.world.destinations:
		if not destination.temple:continue
		app.world.travel_to(destination)
		var text:String=app.world.interaction_text()
		check(("Enter " in text) if destination.id in session.OPEN_TEMPLES else ("Coming soon" in text),destination.name+" has the correct entrance availability")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("TEMPLE CHECK: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
