extends SceneTree

var failures := 0

func _initialize():
	call_deferred("run")

func check(value:bool,message:String):
	print(("PASS " if value else "FAIL ")+message)
	if not value:
		failures += 1

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_forest-boar-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:
		await process_frame
	var forest = app.world
	var boar = forest.enemy
	check(boar.name=="AshTuskBoar" and boar.route.size()==6,"The normal forest entry creates the roaming Ash-Tusk Boar")
	check(boar.clips.has("Idle") and boar.clips.has("Walk") and boar.clips.has("TuskAttack"),"The existing rig and animations remain available")
	forest.player.set_physics_process(false)
	forest.player.position = Vector3(6,forest.height(6,134),134)
	forest.refresh_collisions()
	boar.set_physics_process(false)
	var start:Vector3 = boar.position
	var visited := {}
	var walking := false
	var resting := false
	var grounded := true
	var in_clearing := true
	var smooth_turns := true
	Engine.time_scale = 8
	for i in range(3600):
		await physics_frame
		var previous_heading:float = boar.rotation.y
		boar._physics_process(1.0/30)
		visited[boar.waypoint] = true
		walking = walking or boar.active_clip=="Walk"
		resting = resting or (i>100 and boar.active_clip=="Idle")
		if i>20:
			grounded = grounded and absf(boar.position.y-forest.height(boar.position.x,boar.position.z))<.15
		in_clearing = in_clearing and Vector2(boar.position.x-6,boar.position.z-118).length()<11
		smooth_turns = smooth_turns and absf(angle_difference(previous_heading,boar.rotation.y))<=.031
	Engine.time_scale = 1
	check(visited.size()==6 and boar.position.distance_to(start)>.5,"Boar visits every roaming waypoint and moves through the clearing")
	check(walking and resting,"Walking alternates with idle pauses")
	check(grounded,"Hooves follow the forest's physical ground throughout the route")
	check(in_clearing and smooth_turns,"Boar stays within its clearing and turns smoothly")
	check(is_equal_approx(boar.walk_playback_speed()*boar.AUTHORED_WALK_SPEED*boar.MODEL_SCALE,Vector2(boar.velocity.x,boar.velocity.z).length()),"Walk animation speed follows actual travel speed")
	forest.player.position = boar.position+Vector3(0,0,2)
	var before:Vector3 = boar.position
	for i in range(12):
		await physics_frame
		boar._physics_process(1.0/60)
	check(Vector2(before.x-boar.position.x,before.z-boar.position.z).length()<.02 and boar.active_clip=="Idle","Approaching players make the boar pause")
	forest.player.position = Vector3(6,forest.height(6,134),134)
	session.paused = true
	var waypoint:int = boar.waypoint
	before = boar.position
	boar._physics_process(2)
	check(boar.position==before and boar.waypoint==waypoint and boar.animation.speed_scale==0,"Pause freezes creature movement and animation")
	session.paused = false
	var health:float = session.data.health
	var coins:int = session.data.coins
	boar.hurt(25)
	check(boar.health==100 and session.data.health==health and session.data.coins==coins and not forest.player.combat_enabled(),"Roaming keeps the current peaceful forest rules")
	boar.update_visual_distance(110)
	check(not boar.model.visible,"Distant boar geometry culls")
	boar.update_visual_distance(8)
	check(boar.model.visible and boar.current_lod==0,"Approaching restores the detailed boar")
	forest.player.position = Vector3(10,forest.height(10,123)+.1,123)
	app.travel("camp")
	while app.transitioning:
		await process_frame
	check(not is_instance_valid(boar),"The boar is released when returning to camp")
	app.travel("forest")
	while app.transitioning:
		await process_frame
	check(is_instance_valid(app.world.enemy) and app.world.enemy.route.size()==6,"Re-entering recreates one roaming boar")
	check(app.world.enemy.position.distance_to(app.world.player.position)>3,"Returning beside the habitat avoids spawning the boar inside the player")
	app.queue_free()
	for i in range(4):
		await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("FOREST BOAR CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
