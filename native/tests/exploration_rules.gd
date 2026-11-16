extends SceneTree
const RULES=preload("res://scripts/adventure_rules.gd")
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS " if ok else "FAIL ")+label)
	if not ok:failures+=1
func run():
	var d={"coins":17,"xp":12,"health":100.0,"adventure":{"quests":{"steady_hand":{"state":"claimed","claims":1}},"caches":{"trail_cache":true}}}
	RULES.ensure(d)
	check(d.coins==17 and d.xp==12 and d.adventure.caches.has("trail_cache") and d.adventure.discoveries.is_empty(),"Existing progress migrates without resetting currency or loot")
	check(RULES.unlocked(d,"read_the_woods") and not RULES.unlocked(d,"lost_survey"),"Exploration unlocks after training without requiring the hunting story")
	check(RULES.discover(d,"survey_trail") and d.coins==17 and d.xp==22,"First trail discovery grants its listed reward")
	var xp:int=d.xp
	check(not RULES.discover(d,"survey_trail") and d.xp==xp and not RULES.discover(d,"invented"),"Repeated and unknown discoveries cannot pay")
	check(RULES.accept(d,"read_the_woods") and d.adventure.quests.read_the_woods.progress.survey_trail==1,"Discovery before acceptance credits the later contract")
	check(not RULES.accept(d,"first_watch"),"Exploration and hunting share the one-active-contract limit")
	RULES.record(d,"camp_return")
	check(d.adventure.quests.read_the_woods.progress.camp_return==0,"An early return does not satisfy the survey")
	check(RULES.discover(d,"survey_ridge") and d.adventure.quests.read_the_woods.progress.survey_ridge==1,"A live discovery advances the active survey")
	var survey:Dictionary=RULES.QUESTS.filter(func(q):return q.id=="read_the_woods")[0]
	check(not RULES.ready(d,survey),"Survey notes still require a safe camp return")
	RULES.record(d,"camp_return")
	xp=d.xp
	var gold:int=d.coins
	check(RULES.claim(d,"read_the_woods") and d.xp==xp+65 and d.coins==gold+25,"First survey pays its stated reward after return")
	check(not RULES.claim(d,"read_the_woods") and not RULES.accept(d,"read_the_woods"),"A story survey cannot be paid or started again")
	check(RULES.unlocked(d,"first_watch") and not RULES.unlocked(d,"deep_echoes"),"Optional surveys do not bypass or block the existing story chain")
	RULES.discover(d,"survey_hollow")
	RULES.discover(d,"survey_watcher")
	check(RULES.accept(d,"lost_survey") and d.adventure.quests.lost_survey.progress.survey_hollow==1 and d.adventure.quests.lost_survey.progress.survey_watcher==1,"Both early deep discoveries are credited when the final survey unlocks")
	RULES.record(d,"camp_return")
	xp=d.xp;gold=d.coins
	check(RULES.claim(d,"lost_survey") and d.xp==xp+110 and d.coins==gold+50,"Final survey pays once without requiring kills")
	RULES.ensure(d)
	check(d.adventure.discoveries.size()==4,"Discovery receipts survive save sanitization")
	d.adventure.discoveries={"fake":true,"survey_trail":"true","survey_ridge":false,"survey_watcher":true}
	RULES.ensure(d)
	check(d.adventure.discoveries=={"survey_watcher":true},"Unknown and malformed discovery receipts are rejected")
	var session=root.get_node("Session")
	session.save_path="res://tests/_exploration-rules-save.json"
	session.data={"zone":"forest","coins":7,"xp":5,"health":100.0,"positions":{},"training":{},"adventure":{}}
	session.ensure_adventure()
	session.paused=true
	check(not session.discover_site("survey_trail"),"Pause cannot create a discovery")
	session.paused=false
	session.recovering=true
	check(not session.discover_site("survey_trail"),"Rescue cannot create a discovery")
	session.recovering=false
	session.data.zone="camp"
	check(not session.discover_site("survey_trail"),"Camp cannot collect a forest discovery remotely")
	session.data.zone="forest"
	check(session.discover_site("survey_trail"),"Session commits discovery and reward together")
	session.data.xp=0
	session.load_game()
	check(session.data.xp==15 and session.data.adventure.discoveries.has("survey_trail"),"Save reload retains discovery and its reward")
	check(not session.discover_site("survey_trail") and session.data.xp==15,"Reloading cannot farm the discovery")
	var blocker=FileAccess.open("res://tests/_exploration-block",FileAccess.WRITE)
	blocker.store_string("occupied");blocker.close()
	session.save_path="res://tests/_exploration-block/save.json"
	xp=session.data.xp;gold=session.data.coins
	check(not session.discover_site("survey_ridge") and session.data.xp==xp and session.data.coins==gold and not session.data.adventure.discoveries.has("survey_ridge"),"Failed save rolls back both discovery receipt and rewards")
	DirAccess.remove_absolute("res://tests/_exploration-block")
	DirAccess.remove_absolute("res://tests/_exploration-rules-save.json")
	print("EXPLORATION RULES: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
