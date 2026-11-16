extends Node

const RULES=preload("res://scripts/adventure_rules.gd")
const BRAIN=preload("res://scripts/encounter_brain.gd")
var world
var residents:Dictionary={}
var homes:Dictionary={}
var cache_nodes:Dictionary={}
var tick:=0.0
var combat_grace:=0.0

func install(region):
	world=region
	register("ash_tusk",world.enemy)
	for actor in world.supplied_creatures:register(actor.definition.id,actor)
	for cache in RULES.CACHES:
		if Session.data.adventure.caches.has(cache.id):continue
		var chest:=Node3D.new()
		chest.name=cache.id
		var at:Vector2=cache.point
		chest.position=world.recover_tree_position(Vector3(at.x,world.height(at.x,at.y)+.04,at.y))
		world.add_child(chest)
		var mesh:=MeshInstance3D.new()
		var box:=BoxMesh.new()
		box.size=Vector3(.9,.55,.6)
		mesh.mesh=box
		mesh.position.y=.275
		mesh.material_override=world.material("695135")
		chest.add_child(mesh)
		var lid:=MeshInstance3D.new()
		var top:=BoxMesh.new()
		top.size=Vector3(.96,.10,.66)
		lid.mesh=top
		lid.position.y=.58
		lid.material_override=world.material("a18a52")
		chest.add_child(lid)
		cache_nodes[cache.id]=chest

func register(id:String,actor):
	homes[id]=actor.position
	residents[id]=actor
	if Time.get_unix_time_from_system()<Session.data.adventure.respawns.get(id,0):
		actor.hide()
		actor.collision_layer=0
		actor.queue_free()
		return
	actor.brain=BRAIN.new()
	actor.brain.setup(actor,world,id)

func in_combat() -> bool:
	if combat_grace>0:return true
	for actor in residents.values():
		if is_instance_valid(actor) and actor.brain and actor.brain.state in ["chase","windup","recover"]:return true
	return false

func damage_player(amount:float):
	if Session.paused or not world.combat_allowed(world.player.position) or Session.recovering:return
	combat_grace=6
	Session.data.health=maxf(0,Session.data.health-amount)
	Session.message="Hit! Sidestep during the creature's wind-up."
	if Session.data.health<=0:Session.recover_at_camp()

func defeated(id:String):
	var spec:Dictionary=RULES.ENEMIES[id]
	# Store the cooldown and both rewards before saving the transaction.
	Session.data.adventure.respawns[id]=int(Time.get_unix_time_from_system())+90
	Session.award(spec.xp,spec.gold)
	Session.progress_event("kill")
	if spec.has("event"):Session.progress_event(spec.event)
	Session.message="%s defeated · +%d XP · +%d gold"%[spec.name,spec.xp,spec.gold]
	Session.save_game(world.player)

func melee(attacker) -> bool:
	var candidates:Array=[]
	for actor in residents.values():
		if not is_instance_valid(actor) or not actor.brain or actor.health<=0:continue
		var target:Vector3=actor.brain.point()
		var offset:Vector3=target-attacker.camera.global_position
		if offset.length()>3.6 or offset.normalized().dot(-attacker.camera.global_basis.z)<.60:continue
		candidates.append({"actor":actor,"target":target,"distance":offset.length()})
	candidates.sort_custom(func(a,b):return a.distance<b.distance)
	for candidate in candidates:
		var query:=PhysicsRayQueryParameters3D.create(attacker.camera.global_position,candidate.target)
		query.exclude=[attacker.get_rid()]
		var hit:Dictionary=world.get_world_3d().direct_space_state.intersect_ray(query)
		if hit.is_empty() or hit.collider==candidate.actor:return candidate.actor.hurt(25+2*(RULES.level(Session.data.xp)-1))
	Session.message="Missed · Face the creature and move within sword reach."
	return false

func near_cache() -> String:
	for id in cache_nodes:
		if is_instance_valid(cache_nodes[id]) and world.player.global_position.distance_to(cache_nodes[id].global_position)<2.5:return id
	return ""

func open_cache() -> bool:
	var id:=near_cache()
	if id=="" or Session.paused:return false
	if in_combat():
		Session.message="Finish the encounter before opening a cache."
		return false
	if not RULES.open_cache(Session.data,id):return false
	cache_nodes[id].queue_free()
	cache_nodes.erase(id)
	Session.message="Cache recovered · Gold, XP and a healing draught."
	Session.save_game(world.player)
	return true

func target_text() -> String:
	var best=55.0
	var result:=""
	for actor in residents.values():
		if not is_instance_valid(actor) or not actor.brain or actor.health<=0:continue
		var offset:Vector3=actor.brain.point()-world.player.camera.global_position
		if offset.length()<best and offset.normalized().dot(-world.player.camera.global_basis.z)>.88:
			best=offset.length()
			result="%s · %d / %d%s"%[actor.brain.spec.name,actor.health,actor.brain.spec.hp," · WIND-UP!" if actor.brain.state=="windup" else ""]
	return result

func _process(delta):
	if Session.paused or Session.recovering:return
	combat_grace=maxf(0,combat_grace-delta)
	tick+=delta
	if tick<1:return
	tick=0
	for id in homes:
		if is_instance_valid(residents.get(id)):continue
		if Time.get_unix_time_from_system()<Session.data.adventure.respawns.get(id,0):continue
		# Never respawn a creature in the player's sight or immediately beside them.
		if world.player.position.distance_to(homes[id])<40:continue
		var actor
		if id=="ash_tusk":
			actor=world.create_creature()
			actor.player=world.player
			actor.model=world.beast_scene.instantiate()
		else:
			actor=preload("res://scripts/forest_creature.gd").new()
			actor.player=world.player
			actor.definition=world.SUPPLIED_CREATURES.filter(func(d):return d.id==id)[0]
		actor.position=homes[id]
		world.add_child(actor)
		register(id,actor)
		if id=="ash_tusk":world.enemy=actor
