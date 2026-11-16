extends SceneTree
const RULES=preload("res://scripts/adventure_rules.gd")
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS " if ok else "FAIL ")+label)
	if not ok:failures+=1
func frames(count:int):
	for i in range(count):await physics_frame
func stand_near(forest,id:String):
	var marker:Node3D=forest.exploration.sites[id]
	for offset in [Vector3(0,0,1.7),Vector3(1.7,0,0),Vector3(-1.7,0,0),Vector3(0,0,-1.7)]:
		var at:Vector3=marker.position+offset
		at.y=forest.height(at.x,at.z)+.05
		forest.player.position=at
		forest.player.camera.look_at(marker.position+Vector3.UP*.65)
		if forest.exploration.near_site()==id:return
func run():
	root.set_disable_input(true)
	var session=root.get_node("Session")
	session.save_path="res://tests/_exploration-game-save.json"
	session.data.positions={};session.data.adventure={};session.data.xp=0;session.data.coins=0;session.data.health=100.0
	session.ensure_adventure()
	session.data.adventure.quests.steady_hand={"state":"claimed","claims":1,"progress":{"sword_hit":3,"target_hit":1}}
	session.data.zone="camp"
	check(session.accept_quest("read_the_woods"),"Survey contract accepts in camp after training")
	var app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:await process_frame
	var forest=app.world
	forest.player.set_physics_process(false)
	forest.encounters.set_process(false)
	for actor in forest.encounters.residents.values():actor.set_physics_process(false)
	check(forest.exploration.sites.size()==4,"All four original survey markers load in the real forest")
	var grounded:=true
	for marker in forest.exploration.sites.values():grounded=grounded and absf(marker.position.y-forest.height(marker.position.x,marker.position.z)+.02)<.005
	check(grounded,"Survey cairns sit on the physical terrain")
	for pair in [["survey_hollow","MagicWolf"],["survey_watcher","MutantMantis"]]:
		check(forest.exploration.sites[pair[0]].position.distance_to(forest.encounters.homes[pair[1]])>17,"Survey mark leaves room to approach outside automatic creature notice: "+pair[0])
	stand_near(forest,"survey_trail")
	await frames(2)
	check(forest.interaction_text()=="Inspect Old Trail Cairn","Nearby survey mark has an Interact prompt")
	var at:Vector3=forest.player.position
	forest.player.position+=Vector3(0,0,8)
	check(not forest.exploration.inspect(),"Distant marks cannot be collected remotely")
	forest.player.position=at
	forest.player.camera.look_at(forest.exploration.sites.survey_trail.position+Vector3.UP*.65)
	forest.player.camera.rotate_y(PI)
	check(not forest.exploration.inspect(),"Marks behind the player cannot be collected")
	stand_near(forest,"survey_trail")
	session.paused=true
	check(not forest.exploration.inspect(),"Pause rejects inspection")
	session.paused=false
	forest.encounters.combat_grace=1
	check(not forest.exploration.inspect() and session.data.adventure.discoveries.is_empty(),"Active danger blocks survey rewards")
	forest.encounters.combat_grace=0
	var wall:=StaticBody3D.new()
	var shape:=CollisionShape3D.new()
	var box:=BoxShape3D.new();box.size=Vector3(3,3,.15);shape.shape=box;wall.add_child(shape);forest.add_child(wall)
	wall.position=(forest.player.position+forest.exploration.sites.survey_trail.position)*.5+Vector3.UP
	await frames(3)
	check(not forest.exploration.inspect(),"Physical obstacles block survey interaction")
	wall.queue_free();await frames(3)
	forest.interact()
	check(session.data.adventure.discoveries.has("survey_trail") and session.data.xp==10,"Real Interact saves the first discovery reward")
	var xp:int=session.data.xp
	forest.interact()
	check(session.data.xp==xp and forest.interaction_text()=="Read Old Trail Cairn","Re-reading a known marker does not pay again")
	stand_near(forest,"survey_ridge");forest.interact()
	check(session.data.adventure.quests.read_the_woods.progress.survey_ridge==1,"Actual ridge inspection advances the quest")
	if "--capture" in OS.get_cmdline_user_args():
		DisplayServer.window_move_to_foreground()
		stand_near(forest,"survey_trail")
		session.message="Old Trail Cairn · Recorded in the Expedition Record."
		for i in range(8):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/exploration-cairn.png")
	forest.player.hud.open_journal();await frames(2)
	var journal=forest.player.hud.journal_panel
	var record:Array=journal.find_children("*","Label",true,false).filter(func(l):return l.text.begins_with("2 / 4 survey"))
	check(session.paused and record.size()==1,"Journal displays the persistent expedition count")
	var lore:Array=journal.find_children("*","Label",true,false).filter(func(l):return l.text==RULES.DISCOVERIES[0].lore)
	check(lore.size()==1,"Discovered history is readable in the Journal")
	if "--capture" in OS.get_cmdline_user_args() and not record.is_empty():
		var scroll=journal.find_children("*","ScrollContainer",true,false)[0]
		scroll.scroll_vertical=int(record[0].position.y)-35
		for i in range(5):await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://builds/exploration-journal.png")
	forest.player.hud.close_journal()
	app.travel("camp")
	while app.transitioning:await process_frame
	check(RULES.ready(session.data,RULES.QUESTS.filter(func(q):return q.id=="read_the_woods")[0]),"Returning safely completes the exploration contract")
	check(session.claim_quest("read_the_woods") and not session.claim_quest("read_the_woods"),"Camp pays the survey contract exactly once")
	app.travel("forest")
	while app.transitioning:await process_frame
	forest=app.world
	forest.player.set_physics_process(false)
	for actor in forest.encounters.residents.values():actor.set_physics_process(false)
	stand_near(forest,"survey_trail")
	xp=session.data.xp
	check(not forest.exploration.inspect() and session.data.xp==xp,"Region re-entry retains discovery receipts and prevents farming")
	for id in ["survey_hollow","survey_watcher"]:
		stand_near(forest,id)
		check(forest.exploration.inspect(),id+" can be physically inspected in its actual clearing")
	check(forest.encounters.cache_nodes.size()==3,"Existing exploration caches remain available")
	app.queue_free();await frames(4)
	DirAccess.remove_absolute(session.save_path)
	print("EXPLORATION GAME: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
