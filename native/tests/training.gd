extends SceneTree

var failures := 0
var session
var camp
var player
var trainer

func _initialize():
	call_deferred("run")

func check(value:bool,description:String):
	print(("PASS: " if value else "FAIL: ")+description)
	if not value:
		failures += 1

func frames(count:int):
	for i in range(count):
		await physics_frame
		await process_frame

func at_line(offset:float=0.0):
	player.position = Vector3(-66,camp.height(-66,-41.5)+.12,-41.5)
	player.velocity = Vector3.ZERO
	player.rotation.y = 0
	await frames(10)
	var target:Vector3 = trainer.targets[1].global_position+Vector3(offset,0,.04)
	var distance:float = Vector2(target.x-player.camera.global_position.x,target.z-player.camera.global_position.z).length()
	var flight:float = (distance-.65)/40
	player.pitch = atan2(target.y-player.camera.global_position.y+4.9*flight*flight,distance)
	player.camera.rotation.x = player.pitch
	player.rotation.y = -atan2(offset,distance)
	player.sync_combat()

func fire() -> Node3D:
	player.cooldown = 0
	player.draw_time = 1.2
	var count:int = trainer.arrows.size()
	check(player.release_bow(),"Releasing a drawn bow fires a physical arrow")
	return trainer.arrows[count]

func run():
	session = root.get_node("Session")
	session.save_path = "res://tests/_training-save.json"
	session.data = {"zone":"camp","coins":7,"xp":11,"health":100.0,"time":600.0,"positions":{}}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	camp = app.world
	player = camp.player
	trainer = camp.training
	await frames(3)
	check(trainer.targets.size() == 3,"All three existing archery faces have physical targets")
	check(not player.equip("bow") and not trainer.start_round("bow"),"Safe camp cannot equip weapons or start drills")
	await at_line()
	check(player.equip("bow") and player.bow_model.visible and not player.sword_model.visible,"Selecting Bow equips the imported ash bow")
	session.bow_held = true
	await frames(75)
	check(player.draw_time>=1.19,"Holding the control fully draws the bow")
	var nock:float = player.nocked_arrow.position.z
	check(nock>.31,"Nocked arrow and string pull back with the draw")
	session.bow_held = false
	await frames(30)
	check(trainer.last_score == 10 and trainer.last_target == 1,"A physical arrow reaches the visible middle bullseye")
	check(trainer.arrows.size() == 1 and trainer.arrows[0].resolved,"An impacting arrow lodges in the target")
	var first = trainer.arrows[0]
	var hits:int = session.data.training.target_hits
	first.finish({})
	check(session.data.training.target_hits == hits,"A lodged arrow cannot score twice")
	await at_line(.67)
	var outer = await fire()
	await frames(30)
	check(outer.resolved and trainer.last_score == 4,"An off-centre impact scores the visible outer ring")
	await at_line()
	var flying = await fire()
	session.paused = true
	var paused_at:Vector3 = flying.position
	await frames(12)
	check(flying.position == paused_at,"Pause freezes arrows in flight")
	session.paused = false
	await frames(30)
	check(flying.resolved,"An arrow resumes and lands after pause")
	# A wall inside the launch offset must block a shot before its first flight step.
	var wall := StaticBody3D.new()
	var collision := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1,1,.1)
	collision.shape = box
	wall.add_child(collision)
	camp.add_child(wall)
	wall.global_position = player.camera.global_position-player.camera.global_basis.z*.35
	await frames(2)
	var blocked = await fire()
	check(blocked.resolved and trainer.last_score == 0,"A close wall blocks the muzzle and awards no score")
	wall.queue_free()
	await frames(2)
	check(trainer.start_round("bow"),"A five-arrow archery drill starts in the yard")
	for i in range(5):
		await at_line()
		await fire()
		await frames(30)
	check(trainer.completed and trainer.fired == 5 and trainer.resolved == 5 and trainer.score == 50,"Five actual bullseyes complete a 50-point drill")
	check(not trainer.can_shoot(),"A completed five-shot drill cannot accept a sixth arrow")
	check(session.data.training.archery_best == 50 and session.data.training.archery_rounds == 1,"A completed drill stores its personal best and round count")
	session.data.training.archery_best = 0
	session.load_game()
	check(session.data.training.archery_best == 50,"The personal best survives save and reload")
	trainer.start_round("bow")
	await at_line()
	var missed = await fire()
	missed.position.y += 20
	await frames(370)
	check(trainer.resolved == 1 and trainer.score == 0,"An expired arrow counts as a miss so a round cannot stall")
	trainer.start_round("bow")
	await at_line()
	await fire()
	check(player.equip("sword") and trainer.mode == "" and trainer.arrows.is_empty(),"Switching weapons cancels the drill and clears pending arrows")
	player.position = Vector3(-48.5,camp.height(-48.5,-21)+.1,-21)
	player.velocity = Vector3.ZERO
	player.rotation.y = 0
	player.pitch = 0
	player.camera.rotation.x = 0
	await frames(12)
	trainer.start_round("sword")
	for i in range(3):
		check(player.attack(),"Sword attack is accepted at the practice dummy")
		await frames(27)
	check(trainer.score == 50 and session.data.training.combos == 1,"Three real dummy hits award the combo bonus")
	check(camp.training_hits == 3,"The existing practice dummy registers all three sword hits")
	player.rotation.y = PI
	player.attack()
	check(trainer.combo == 0,"A missed sword strike breaks the combo")
	var before:float = trainer.remaining
	session.paused = true
	await frames(10)
	check(trainer.remaining == before,"Pause freezes the timed sword drill")
	session.paused = false
	trainer.remaining = .05
	await frames(6)
	check(trainer.completed and session.data.training.sword_best == 50,"The sword timer finishes and saves its personal best")
	player.equip("bow")
	player.draw_time = .8
	player.hud.open_map()
	check(player.draw_time == 0 and session.paused,"Opening the map cancels a charged shot")
	player.hud.close_map()
	trainer.start_round("bow")
	await at_line()
	await fire()
	var arrival:Dictionary = camp.destinations.filter(func(d): return d.id == "arrival")[0]
	camp.travel_to(arrival)
	await frames(3)
	check(not player.weapon.visible and trainer.mode == "" and trainer.arrows.is_empty(),"Leaving practice immediately sheathes weapons and cancels pending hits")
	check(not player.release_bow() and not player.attack(),"Both weapon types remain blocked outside the yard")
	check(session.data.coins == 7 and session.data.xp == 11,"All drills preserve coins and XP")
	var damaged := FileAccess.open(session.save_path,FileAccess.WRITE)
	damaged.store_string("{interrupted")
	damaged.close()
	session.load_game()
	check(session.data.coins == 7 and session.data.training.archery_best == 50,"An unreadable save cannot erase the current progress")
	session.data.training = {"archery_best":900,"sword_best":-10,"arrows_fired":"invalid"}
	session.ensure_training()
	check(session.data.training.archery_best == 50 and session.data.training.sword_best == 0 and session.data.training.arrows_fired == 0,"Imported practice records reject invalid values")
	app.queue_free()
	await frames(3)
	DirAccess.remove_absolute(session.save_path)
	print("TRAINING CHECK: %d failure(s)" % failures)
	quit(0 if failures == 0 else 1)
