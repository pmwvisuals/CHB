extends SceneTree

var failures := 0

func _initialize():call_deferred("run")

func check(value:bool,message:String):
	print(("PASS " if value else "FAIL ")+message)
	if not value:failures += 1

func run():
	var session = root.get_node("Session")
	session.save_path = "res://tests/_supplied-creatures-save.json"
	session.data.positions = {}
	var app = load("res://scenes/app.tscn").instantiate()
	root.add_child(app)
	app.travel("forest")
	while app.transitioning:await process_frame
	var forest = app.world
	check(forest.supplied_creatures.size()==3 and is_instance_valid(forest.enemy),"All three supplied models accompany the original Ash-Tusk Boar")
	forest.player.set_physics_process(false)
	var start_health:float = session.data.health
	for actor in forest.supplied_creatures:
		var point:Array = actor.definition.point
		forest.player.position = Vector3(point[0]+12,forest.height(point[0]+12,point[1]),point[1])
		forest.refresh_collisions()
		for i in range(35):await physics_frame
		check(actor.is_on_floor() and absf(actor.position.y-forest.height(actor.position.x,actor.position.z))<.2,actor.name+" has physical ground contact")
		check(is_equal_approx(actor.model_height,actor.definition.height),actor.name+" is normalized to its intended in-game height")
		var model:Node3D = actor.visual.get_child(0).get_child(0)
		var box:AABB = actor.pose_bounds(model)
		check(absf(box.position.y*actor.visual.scale.y)<.4,actor.name+" animated feet align with the character floor")
		check(actor.animation!=null and actor.active_clip!="",actor.name+" plays its supplied animation")
		var materials_ok := true
		for part in model.find_children("*","MeshInstance3D",true,false):
			for i in range(part.mesh.get_surface_count()):
				var mat = part.get_active_material(i)
				materials_ok = materials_ok and mat is BaseMaterial3D and mat.albedo_texture!=null
		check(materials_ok,actor.name+" retains textured materials")
		actor.set_physics_process(false)
		if actor.walk_clip!="":
			actor.rest_time = 0
			var visited := {}
			var walked := false
			var stayed := true
			Engine.time_scale = 8
			for i in range(2700):
				await physics_frame
				actor._physics_process(1.0/30)
				visited[actor.waypoint] = true
				walked = walked or actor.active_clip==actor.walk_clip
				stayed = stayed and Vector2(actor.position.x-point[0],actor.position.z-point[1]).length()<9
			Engine.time_scale = 1
			check(visited.size()==4 and walked and stayed,actor.name+" walks its complete route inside the clearing")
			print("ROUTE ",actor.name," visited=",visited," walked=",walked," stayed=",stayed," at=",actor.position," velocity=",actor.velocity)
			forest.player.position = actor.position+Vector3(0,0,1.5)
			actor._physics_process(.01)
			check(Vector2(actor.velocity.x,actor.velocity.z).length()==0 and actor.active_clip==actor.idle_clip,actor.name+" pauses when the player approaches")
		else:
			check(actor.definition.route.is_empty(),actor.name+" uses its single supplied loop at its habitat")
		var at:Vector3 = actor.position
		session.paused = true
		actor._physics_process(1)
		check(actor.position==at and actor.animation.speed_scale==0,actor.name+" pauses movement and animation")
		session.paused = false
		forest.player.position = actor.position+Vector3(0,0,130)
		actor._physics_process(.01)
		check(not actor.visual.visible and actor.animation.speed_scale==0,actor.name+" stops rendering and animation at distance")
		forest.player.position = actor.position+Vector3(0,0,4)
		actor._physics_process(.01)
		check(actor.visual.visible and actor.animation.speed_scale==1,actor.name+" returns when approached")
		actor.set_physics_process(true)
	check(session.data.health==start_health and not forest.player.combat_enabled(),"Supplied creatures preserve the peaceful placement pass")
	var credits := FileAccess.get_file_as_string("res://assets/forest-creatures/CREDITS.txt")
	check("alice.duarte13" in credits and "CC BY-NC 4.0" in credits and "unverified" in credits,"Source credits and known licensing limits accompany the models")
	var old:WeakRef = weakref(forest.supplied_creatures[0])
	app.travel("camp")
	while app.transitioning:await process_frame
	check(old.get_ref()==null,"Returning to camp releases supplied creature actors")
	app.travel("forest")
	while app.transitioning:await process_frame
	check(app.world.supplied_creatures.size()==3 and is_instance_valid(app.world.enemy),"Re-entry creates exactly three supplied creatures and the original boar")
	app.queue_free()
	for i in range(4):await process_frame
	DirAccess.remove_absolute(session.save_path)
	print("SUPPLIED CREATURES CHECK ",failures," failure(s)")
	quit(0 if failures==0 else 1)
