extends SceneTree

var failures:=0
var session
var app
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func frames(count:int):
	for i in range(count):await physics_frame
func aim(player,at:Vector3):
	player.camera.look_at(at,Vector3.UP)
func run():
	session=root.get_node("Session")
	session.save_path="res://tests/_adventure-game-save.json"
	session.data.positions={}
	session.data.zone="camp"
	session.data.coins=0
	session.data.xp=0
	session.data.health=100.0
	session.data.adventure={}
	session.ensure_adventure()
	session.touch_controls=true
	session.accept_quest("steady_hand")
	session.progress_event("sword_hit",3)
	session.progress_event("target_hit")
	session.claim_quest("steady_hand")
	session.accept_quest("first_watch")
	app=load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:await process_frame
	var forest=app.world
	var player=forest.player
	await frames(3)
	check(forest.encounters.residents.size()==4,"The existing four woodland models have encounter controllers")
	check(not player.combat_enabled() and not player.weapon.visible,"The woodland entrance sheathes weapons and stays safe")
	check(session.data.adventure.quests.first_watch.progress.forest_enter==1,"Entering the real forest advances the accepted quest")
	player.set_physics_process(false)
	for actor in forest.encounters.residents.values():actor.set_physics_process(false)
	var boar=forest.enemy
	boar.position=Vector3(6,forest.height(6,118)+.1,118)
	boar.brain.home=boar.position
	player.position=boar.position+Vector3(0,0,3.2)
	player.sync_combat()
	aim(player,boar.brain.point())
	await frames(3)
	check(player.combat_enabled() and player.weapon.visible and player.equip("sword"),"Moving beyond the safe entrance enables field weapons")
	if "--capture" in OS.get_cmdline_user_args():
		for i in range(3):await process_frame
		root.get_texture().get_image().save_png("res://builds/adventure-forest.png")
	var hp:int=boar.health
	player.attack()
	check(boar.health==hp-25,"A real sword strike damages the aimed creature")
	player.attack()
	check(boar.health==hp-25,"Sword cooldown prevents repeated damage in the same instant")
	player.cooldown=0
	player.camera.rotation.y=PI
	player.attack()
	check(boar.health==hp-25,"Sword strikes miss creatures behind the player")
	aim(player,boar.brain.point())
	var wall:=StaticBody3D.new()
	var collider:=CollisionShape3D.new()
	var shape:=BoxShape3D.new()
	shape.size=Vector3(4,4,.4)
	collider.shape=shape
	wall.add_child(collider)
	forest.add_child(wall)
	wall.position=boar.position+Vector3(0,1.3,2.2)
	await frames(3)
	player.cooldown=0
	player.attack()
	check(boar.health==hp-25,"A physical wall blocks melee damage")
	wall.queue_free()
	await frames(3)
	player.position=boar.position+Vector3(0,0,2.4)
	boar.brain.state="idle"
	boar.brain.step(.01)
	check(boar.brain.state=="windup","Nearby visible players trigger a readable attack wind-up")
	var vitality:float=session.data.health
	boar.brain.step(.70)
	check(session.data.health==vitality,"Enemy wind-up gives time to dodge before damage")
	player.position=boar.position+Vector3(4,0,0)
	boar.brain.step(.1)
	check(session.data.health==vitality,"Sidestepping a committed attack avoids damage")
	player.position=boar.position+Vector3(0,0,2.4)
	boar.brain.state="chase"
	boar.brain.step(.01)
	boar.brain.step(.8)
	check(session.data.health==vitality-12,"A landed boar strike applies its configured damage")
	boar.brain.step(.1)
	check(session.data.health==vitality-12,"One enemy attack applies damage only once")
	session.paused=true
	var state:String=boar.brain.state
	var timer:float=boar.brain.timer
	boar.brain.step(3)
	check(boar.brain.timer==timer and boar.brain.state==state and not boar.hurt(999),"Pause freezes AI and rejects damage")
	session.paused=false
	player.position=forest.spawn_position()
	boar.brain.step(.01)
	check(boar.brain.state in ["return","idle"] and boar.health==boar.brain.spec.hp,"Creatures disengage and reset at their home when the player reaches safety")
	boar.brain.state="idle"
	boar.position=boar.brain.home
	player.position=boar.position+Vector3(0,0,8)
	aim(player,boar.brain.point())
	player.sync_combat()
	player.cooldown=0
	player.equip("bow")
	boar.health=90
	player.draw_time=1.2
	check(player.release_bow(),"The field bow launches a physical charged arrow")
	await frames(32)
	check(boar.health==48,"An arrow hits creature collision and deals charge-based damage")
	player.cooldown=0
	player.draw_time=1.2
	player.release_bow()
	var arrow=forest.training.arrows.back()
	var at:Vector3=arrow.position
	session.paused=true
	await frames(8)
	check(arrow.position==at,"Pause freezes an airborne field arrow")
	session.paused=false
	forest.training.cancel_round()
	var xp:int=session.data.xp
	var gold:int=session.data.coins
	check(boar.hurt(999) and not boar.hurt(999),"Defeat is handled once even with overlapping hits")
	check(session.data.xp==xp+22 and session.data.coins==gold+10,"A creature pays exactly its listed XP and gold")
	check(session.data.adventure.quests.first_watch.progress.ash_tusk==1,"The named hunt advances from an actual creature defeat")
	check(session.data.adventure.respawns.ash_tusk>Time.get_unix_time_from_system(),"Defeat saves a respawn cooldown across scene changes")
	forest.encounters.combat_grace=0
	player.position=forest.encounters.cache_nodes.trail_cache.position+Vector3(0,.1,1)
	check(forest.interaction_text()=="Open supply cache" and forest.encounters.open_cache(),"A nearby cache has a working interaction and loot")
	gold=session.data.coins
	check(not forest.encounters.open_cache() and session.data.coins==gold,"The opened cache cannot be looted again")
	session.data.health=20
	var potions:int=session.data.adventure.potions
	check(session.use_draught() and session.data.health==60 and session.data.adventure.potions==potions-1,"The session consumes healing supplies in the forest")
	check(not session.use_draught(),"Healing cooldown blocks accidental double use")
	player.hud.open_journal()
	await frames(3)
	check(session.paused and is_instance_valid(player.hud.journal_panel),"The touch HUD opens the quest and inventory journal")
	player.hud.handle_back()
	check(not session.paused and not is_instance_valid(player.hud.journal_panel),"Android Back closes the journal and restores input")
	for actor in forest.encounters.residents.values():
		if is_instance_valid(actor):actor.brain.state="idle" if actor.health>0 else "dead"
	forest.encounters.combat_grace=0
	player.position=forest.gate+Vector3(0,.1,-1)
	var old:WeakRef=weakref(forest)
	forest.interact()
	while app.transitioning:await process_frame
	check(app.world.forest==false and old.get_ref()==null,"The physical forest gate releases the forest and loads camp")
	check(not app.world.player.combat_enabled() and not app.world.player.weapon.visible,"Safe camp sheathes field weapons")
	check(session.RULES.ready(session.data,session.RULES.QUESTS[1]),"A real safe return completes the hunt contract")
	check(session.claim_quest("first_watch") and not session.claim_quest("first_watch"),"Camp claims the hunt reward once")
	app.world.player.hud.open_journal()
	await frames(3)
	if "--capture" in OS.get_cmdline_user_args():
		await process_frame
		root.get_texture().get_image().save_png("res://builds/adventure-journal.png")
	var accepts=app.world.player.hud.journal_panel.find_children("*","Button",true,false).filter(func(b):return b.text=="ACCEPT CONTRACT" and b.get_meta("quest_id","")=="deep_echoes")
	check(accepts.size()==1,"The camp journal offers the next unlocked story contract")
	if not accepts.is_empty():accepts[0].pressed.emit()
	check(session.RULES.active(session.data).get("id","")=="deep_echoes","The visible Accept control starts the correct quest")
	app.world.player.hud.close_journal()
	# Keep the cooldown fixture alive even on a very slow display/debug machine.
	# The earlier defeat assertion checks that normal gameplay creates it.
	session.data.adventure.respawns.ash_tusk=int(Time.get_unix_time_from_system())+3600
	app.travel("forest")
	while app.transitioning:await process_frame
	await frames(3)
	check(not is_instance_valid(app.world.enemy),"Re-entering cannot reset the defeated boar's saved cooldown")
	var saved_gold:int=session.data.coins
	var earned_xp:int=session.data.xp
	var wolf=app.world.encounters.residents.MagicWolf
	app.world.player.position=wolf.position+Vector3(0,0,4)
	session.data.health=1
	app.world.encounters.damage_player(999)
	while app.transitioning:await process_frame
	check(not app.world.forest and session.data.health==session.RULES.max_health(session.data),"A real defeat loads camp with restored vitality")
	check(session.data.coins==saved_gold and session.data.xp==earned_xp and session.data.adventure.defeats==1,"Rescue retains earned currency, XP and a defeat record")
	check(not session.data.positions.has("forest") and session.data.adventure.quests.deep_echoes.progress.camp_return==0,"Rescue clears the dangerous saved position and does not count as a safe quest return")
	session.save_game(app.world.player)
	var saved_xp:int=session.data.xp
	session.data.xp=0
	session.load_game()
	check(session.data.xp==saved_xp and session.data.adventure.caches.has("trail_cache"),"Reloading retains quest, combat and treasure progression together")
	app.queue_free()
	await frames(4)
	DirAccess.remove_absolute(session.save_path)
	print("ADVENTURE GAME: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
