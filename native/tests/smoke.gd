extends SceneTree

var failures:Array[String] = []
var app
var session

func check(condition:bool,description:String):
	if condition:
		print("PASS: " + description)
	else:
		failures.append(description)
		push_error("FAIL: " + description)

func _initialize():
	call_deferred("run")

func frames(count:int):
	for i in range(count):
		await physics_frame
		await process_frame

func travel(zone:String):
	app.travel(zone)
	for i in range(1800):
		await process_frame
		if not app.transitioning:
			return is_instance_valid(app.world) and app.world.forest == (zone == "forest")
	return false

func run():
	session = root.get_node("Session")
	# Keep automated tests independent of the player's real device save.
	session.save_path = "res://tests/_temporary-save.json"
	session.data = {"zone":"camp","coins":0,"xp":0,"health":100.0,"time":360.0,"positions":{}}
	app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	check(await travel("camp"),"Camp loads")
	if not is_instance_valid(app.world):
		quit(1)
		return
	var camp = app.world
	var player = camp.player
	await frames(40)
	check(player.is_on_floor(),"Player stands on terrain")
	check(absf(player.position.y-camp.height(player.position.x,player.position.z))<.12,"Feet and camera stay at correct terrain height")
	var initial:Vector3 = player.position
	Input.action_press("forward")
	await frames(25)
	Input.action_release("forward")
	check(player.position.z<initial.z-1,"WASD moves the physical player")
	await frames(15)
	var floor_y:float = player.position.y
	session.jump_requested = true
	await frames(10)
	check(player.position.y>floor_y+.4,"Jump raises the capsule")
	await frames(60)
	check(player.is_on_floor(),"Player lands after jumping")
	session.paused = true
	initial = player.position
	var time_before:float = session.data.time
	Input.action_press("forward")
	await frames(8)
	Input.action_release("forward")
	check(player.position.distance_to(initial)<.001 and session.data.time == time_before,"Pause freezes movement and clock")
	session.paused = false
	var old_camp:WeakRef = weakref(camp)
	player.position = camp.gate+Vector3(0,.2,1)
	check(camp.near_gate(),"Gate interaction is available nearby")
	check(await travel("forest"),"Forest loads")
	await frames(4)
	check(old_camp.get_ref() == null,"Previous region is released")
	var forest = app.world
	var beast = forest.enemy
	player = forest.player
	await frames(40)
	check(player.is_on_floor(),"Forest terrain has collision")
	check(beast.animation != null and beast.clips.size() == 3,"Boar imports Idle, Walk and TuskAttack")
	# Isolate combat from chase while keeping the actual model, animation and physics.
	beast.set_physics_process(false)
	player.position = Vector3(0,forest.height(0,0)+.1,0)
	beast.position = Vector3(0,forest.height(0,-2)+.1,-2)
	player.rotation = Vector3.ZERO
	player.camera.rotation = Vector3.ZERO
	await frames(8)
	player.attack()
	check(beast.health == 75,"Sword attack damages the boar in front")
	player.rotation.y = PI
	player.attack()
	check(beast.health == 75,"Sword cannot hit a target behind the player")
	player.rotation.y = 0
	# Strike crosses the damage moment in the real enemy update.
	beast.rotation.y = 0
	beast.strike = .67
	beast.hit_applied = false
	beast.active_clip = "TuskAttack"
	var before:float = session.data.health
	beast._physics_process(.02)
	check(session.data.health == before-18,"Tusk wind-up causes one timed hit")
	beast._physics_process(.02)
	check(session.data.health == before-18,"Same strike cannot deal repeated damage")
	beast.hurt(75)
	await frames(2)
	check(session.data.coins == 15 and session.data.xp == 25,"Defeat awards coins and XP once")
	check(not is_instance_valid(forest.enemy),"Defeated enemy is released")
	check(session.save_game(player),"Save writes successfully")
	var saved_position:Vector3 = player.position
	session.data.coins = 0
	session.data.xp = 0
	session.data.positions = {}
	session.load_game()
	check(session.data.coins == 15 and session.data.xp == 25,"Reload restores numeric progression")
	check(Vector3(session.data.positions.forest[0],session.data.positions.forest[1],session.data.positions.forest[2]).distance_to(saved_position)<.01,"Reload restores position")
	check(await travel("camp"),"Return to camp loads")
	await frames(15)
	check(app.world.get_parent().get_children().filter(func(n): return n is Node3D).size() == 1,"Only one world is active")
	check(session.data.health>before-18,"Camp restores health")
	# Check the requested day/night duration at their boundary.
	session.data.time = 1439.9
	app.world._process(.2)
	check(is_equal_approx(session.data.time,1440.1),"Day lasts 24 minutes")
	session.data.time = 1919.9
	app.world._process(.2)
	check(is_equal_approx(session.data.time,.1),"Night lasts 8 minutes and cycle wraps")
	app.queue_free()
	await frames(4)
	DirAccess.remove_absolute(session.save_path)
	print("NATIVE SMOKE: %d failure(s)" % failures.size())
	quit(0 if failures.is_empty() else 1)
