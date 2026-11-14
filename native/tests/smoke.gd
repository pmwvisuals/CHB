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
	var floor_hit = camp.get_world_3d().direct_space_state.intersect_ray(PhysicsRayQueryParameters3D.create(player.global_position+Vector3.UP*.1,player.global_position-Vector3.UP,1,[player.get_rid()]))
	check(not floor_hit.is_empty() and absf(player.camera.global_position.y-floor_hit.position.y-1.82)<.04,"Standing eyes remain 1.82 metres above the actual walking surface")
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
	check(not player.attack() and beast.health == 100,"Forest attacks are disabled")
	check(not player.weapon.visible,"Forest exploration keeps the weapon sheathed")
	beast.rotation.y = 0
	beast.strike = .67
	beast.hit_applied = false
	beast.active_clip = "TuskAttack"
	var before:float = session.data.health
	beast._physics_process(.02)
	check(session.data.health == before,"Passive forest boar cannot damage the player")
	beast._physics_process(.02)
	check(beast.strike<0,"Leaving combat cancels the enemy strike")
	beast.hurt(75)
	await frames(2)
	check(session.data.coins == 0 and session.data.xp == 0,"Disabled combat cannot award currency or XP")
	check(is_instance_valid(forest.enemy) and beast.health == 100,"Forest creature stays unharmed")
	# Verify progression serialization independently of currently disabled forest combat.
	session.data.coins = 15
	session.data.xp = 25
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
	check(session.data.health>=before,"Camp preserves or restores health")
	# The retired save clock cannot advance or affect the fixed light.
	session.data.time = 1439.9
	app.world._process(.2)
	check(is_equal_approx(session.data.time,1439.9),"The day/night clock no longer advances")
	session.data.time = 1919.9
	app.world._process(.2)
	check(is_equal_approx(session.data.time,1919.9) and app.world.key_light.light_energy>.6,"Legacy night time retains fixed natural evening light")
	app.queue_free()
	await frames(4)
	DirAccess.remove_absolute(session.save_path)
	print("NATIVE SMOKE: %d failure(s)" % failures.size())
	quit(0 if failures.is_empty() else 1)
