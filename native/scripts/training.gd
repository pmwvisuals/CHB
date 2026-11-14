extends Node

const ARROW := preload("res://scripts/practice_arrow.gd")
var world
var targets:Array[StaticBody3D] = []
var arrows:Array[Node3D] = []
var round_id := 0
var mode := ""
var score := 0
var fired := 0
var resolved := 0
var remaining := 0.0
var completed := false
var combo := 0
var clock := 0.0
var last_sword := -10.0
var last_score := 0
var last_target := -1

func _ready():
	Session.ensure_training()
	for x in [-74.0,-66.0,-58.0]:
		var body := StaticBody3D.new()
		body.position = Vector3(x,world.height(x,-48.8)+1.8,-48.67)
		body.set_meta("practice_target",targets.size())
		var shape := CollisionShape3D.new()
		var cylinder := CylinderShape3D.new()
		cylinder.radius = 1.13
		cylinder.height = .08
		shape.shape = cylinder
		shape.rotation.x = PI/2
		body.add_child(shape)
		world.add_child(body)
		targets.append(body)

func clear_arrows():
	for arrow in arrows:
		if is_instance_valid(arrow):
			arrow.resolved = true
			arrow.queue_free()
	arrows.clear()

func cancel_round():
	round_id += 1
	mode = ""
	completed = false
	combo = 0
	last_sword = -10.0
	clear_arrows()

func start_round(kind:String):
	if not world.player.combat_enabled() or kind not in ["sword","bow"]:
		return false
	cancel_round()
	world.player.cancel_draw()
	mode = kind
	score = 0
	fired = 0
	resolved = 0
	remaining = 30.0 if kind == "sword" else 0.0
	Session.message = "SWORD DRILL  ·  30 seconds. Three clean hits make a combo." if kind == "sword" else "ARCHERY DRILL  ·  Five arrows. Aim for the gold centre."
	return true

func finish_round():
	if completed or mode == "":
		return
	completed = true
	var prefix := "archery" if mode == "bow" else "sword"
	Session.data.training[prefix+"_best"] = maxi(Session.data.training[prefix+"_best"],score)
	Session.data.training[prefix+"_rounds"] += 1
	Session.save_game(world.player)
	Session.message = "%s COMPLETE  ·  %d points  ·  Best %d. Start a new drill to retry." % [prefix.to_upper(),score,Session.data.training[prefix+"_best"]]

func _physics_process(delta):
	if Session.paused:
		return
	clock += delta
	if combo>0 and clock-last_sword>1.35:
		combo = 0
	if mode == "sword" and not completed:
		remaining = maxf(0,remaining-delta)
		if remaining == 0:
			finish_round()

func sword_result(index:int):
	if index<0:
		combo = 0
		Session.message = "MISSED  ·  Move closer and face the dummy."
		return
	Session.data.training.sword_hits += 1
	combo = combo+1 if clock-last_sword<=1.35 else 1
	last_sword = clock
	var points := 10
	if combo == 3:
		points += 20
		combo = 0
		Session.data.training.combos += 1
	if mode == "sword" and not completed:
		score += points
	Session.message = "THREE-HIT COMBO  ·  +30" if points == 30 else "CLEAN HIT  ·  Dummy %d  ·  Combo %d / 3" % [index+1,combo]

func can_shoot() -> bool:
	return world.player.combat_enabled() and not Session.paused and world.player.weapon_kind == "bow" and not (mode == "bow" and (completed or fired>=5))

func shoot(camera:Camera3D,charge:float):
	if not can_shoot():
		return null
	arrows = arrows.filter(func(a): return is_instance_valid(a))
	if arrows.size()>=16:
		arrows[0].finish({})
		arrows.pop_front().queue_free()
	var arrow := ARROW.new()
	arrow.trainer = self
	arrow.round_id = round_id
	world.add_child(arrow)
	var forward := -camera.global_basis.z
	arrow.global_position = camera.global_position+forward*.65
	arrow.velocity = forward*lerpf(12,40,clampf(charge,0,1))
	arrow.look_at(arrow.global_position+forward,Vector3.UP)
	arrows.append(arrow)
	Session.data.training.arrows_fired += 1
	if mode == "bow":
		fired += 1
	# Resolve immediately if the muzzle would cross a nearby wall.
	var query := PhysicsRayQueryParameters3D.create(camera.global_position,arrow.global_position)
	query.exclude = [world.player.get_rid()]
	var hit:Dictionary = world.get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty():
		arrow.global_position = hit.position
		arrow.finish(hit)
	return arrow

func ring_score(hit:Dictionary,velocity:Vector3) -> int:
	if hit.is_empty() or not hit.collider.has_meta("practice_target") or hit.normal.z<.35 or velocity.z>=0:
		return 0
	var centre:Vector3 = hit.collider.global_position
	var radius := Vector2(hit.position.x-centre.x,hit.position.y-centre.y).length()
	if radius<=.29:
		return 10
	if radius<=.54:
		return 7
	if radius<=.79:
		return 4
	return 1 if radius<=1.13 else 0

func arrow_result(arrow,hit:Dictionary):
	if arrow.round_id != round_id or not world.player.combat_enabled():
		return
	last_score = ring_score(hit,arrow.velocity)
	last_target = int(hit.collider.get_meta("practice_target")) if not hit.is_empty() and hit.collider.has_meta("practice_target") else -1
	if last_score>0:
		Session.data.training.target_hits += 1
	if mode == "bow" and not completed:
		score += last_score
		resolved += 1
	Session.message = ("BULLSEYE  ·  +10" if last_score == 10 else "TARGET HIT  ·  +%d" % last_score) if last_score>0 else "MISSED  ·  Draw longer and aim above distant targets."
	if mode == "bow" and resolved == 5:
		finish_round()

func status_text(kind:String) -> String:
	if mode == kind:
		if completed:
			return "DRILL COMPLETE   ·   %d POINTS\nPERSONAL BEST   %d" % [score,Session.data.training.archery_best if kind == "bow" else Session.data.training.sword_best]
		if kind == "bow":
			return "FIVE ARROWS   ·   %d / 5 SHOT\n%d POINTS   ·   %d LANDED" % [fired,score,resolved]
		return "%02d SECONDS   ·   %d POINTS\nCOMBO   %d / 3" % [ceili(remaining),score,combo]
	if kind == "bow":
		return "FREE ARCHERY   ·   HOLD, THEN RELEASE\nPERSONAL BEST   %d / 50" % Session.data.training.archery_best
	return "FREE SWORD PRACTICE   ·   THREE-HIT COMBOS\nPERSONAL BEST   %d" % Session.data.training.sword_best
