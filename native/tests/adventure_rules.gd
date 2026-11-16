extends SceneTree

const RULES=preload("res://scripts/adventure_rules.gd")
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func fresh() -> Dictionary:
	var data={"coins":0,"xp":0,"health":100.0}
	RULES.ensure(data)
	return data
func run():
	var d:=fresh()
	check(d.adventure.potions==2 and d.coins==0 and RULES.level(d.xp)==1,"Old saves gain starter supplies without resetting currency")
	check(RULES.max_health(d)==100 and RULES.level(100)==2 and RULES.level(250)==3,"Level thresholds and starting vitality are defined")
	check(not RULES.accept(d,"first_watch") and not RULES.accept(d,"unknown"),"Story quests unlock in order; unknown IDs are rejected")
	check(RULES.accept(d,"steady_hand") and not RULES.accept(d,"steady_hand"),"Only one active quest can be accepted")
	check(not RULES.claim(d,"steady_hand"),"An incomplete quest cannot pay out")
	RULES.record(d,"sword_hit",2)
	RULES.record(d,"target_hit")
	check(not RULES.ready(d,RULES.QUESTS[0]),"Partial practice progress is insufficient")
	RULES.record(d,"sword_hit",10)
	check(d.adventure.quests.steady_hand.progress.sword_hit==3,"Objective progress clamps at its target")
	check(RULES.claim(d,"steady_hand") and d.xp==40 and d.coins==25,"Quest completion pays the listed XP and gold")
	check(not RULES.claim(d,"steady_hand") and not RULES.accept(d,"steady_hand"),"Story rewards cannot be reclaimed or restarted")
	check(RULES.accept(d,"first_watch"),"Completing training unlocks the first hunt")
	RULES.record(d,"camp_return")
	check(d.adventure.quests.first_watch.progress.camp_return==0,"Returning before the hunt cannot pre-complete safe return")
	RULES.record(d,"forest_enter")
	RULES.record(d,"kill")
	check(d.adventure.quests.first_watch.progress.ash_tusk==0,"The named boar objective requires the correct creature")
	RULES.record(d,"ash_tusk")
	check(not RULES.ready(d,RULES.QUESTS[1]),"Hunting does not finish the return objective")
	RULES.record(d,"camp_return")
	check(RULES.claim(d,"first_watch") and d.xp==120 and d.coins==70,"Returning unlocks one saved hunt reward")
	check(RULES.level(d.xp)==2 and RULES.max_health(d)==110 and d.health==110,"Earning a level increases vitality without a currency cost")
	check(RULES.open_cache(d,"heart_cache"),"A cache can be opened during free exploration")
	var coins:int=d.coins
	check(not RULES.open_cache(d,"heart_cache") and d.coins==coins,"A cache receipt prevents duplicate loot")
	check(not RULES.open_cache(d,"unknown"),"Unknown cache IDs cannot create rewards")
	check(RULES.accept(d,"deep_echoes") and d.adventure.quests.deep_echoes.progress.heart_cache==1,"An early unique cache cannot soft-lock the story")
	RULES.record(d,"kill",2)
	RULES.record(d,"camp_return")
	check(RULES.claim(d,"deep_echoes"),"The deeper expedition completes after kills and return")
	check(RULES.accept(d,"wardens_watch"),"The repeatable patrol unlocks after the story")
	RULES.record(d,"kill",3)
	RULES.record(d,"camp_return")
	check(RULES.claim(d,"wardens_watch") and RULES.accept(d,"wardens_watch"),"A completed patrol can be accepted again")
	check(not RULES.ready(d,RULES.QUESTS[3]) and d.adventure.quests.wardens_watch.progress.kill==0,"Repeatable contracts reset every objective")
	d.health=10
	d.adventure.potions=2
	check(RULES.heal(d) and d.health==50 and d.adventure.potions==1,"A draught heals forty and consumes one item")
	d.health=RULES.max_health(d)
	check(not RULES.heal(d) and d.adventure.potions==1,"Healing at full vitality does not consume supplies")
	d.health=0
	check(not RULES.heal(d),"A draught cannot revive a defeated player")
	d.coins=12
	check(RULES.buy_potion(d) and d.coins==0 and d.adventure.potions==2,"Camp supplies spend exactly twelve gold")
	check(not RULES.buy_potion(d) and d.coins==0,"Insufficient funds never create supplies or debt")
	d.coins=100
	d.adventure.potions=5
	check(not RULES.buy_potion(d) and d.coins==100,"The carrying limit cannot consume extra gold")
	d.adventure={"potions":"bad","quests":{"steady_hand":{"state":"exploit","progress":{"sword_hit":INF}}},"caches":{"fake":true},"respawns":{"fake":999}}
	d.coins=-200
	d.xp=NAN
	RULES.ensure(d)
	check(d.coins==0 and d.xp==0 and d.adventure.potions==2,"Malformed and nonfinite money, XP and inventory sanitize safely")
	check(d.adventure.quests.steady_hand.state=="available" and d.adventure.quests.steady_hand.progress.sword_hit==0 and d.adventure.caches.is_empty(),"Malformed objectives and invented loot receipts are removed")
	var session=root.get_node("Session")
	session.save_path="res://tests/_adventure-save.json"
	session.data=fresh()
	session.data.zone="camp"
	session.data.positions={}
	session.data.time=480.0
	session.data.training={}
	session.ensure_training()
	check(session.accept_quest("steady_hand"),"Session accepts and saves a camp contract")
	session.progress_event("sword_hit",3)
	session.progress_event("target_hit")
	check(session.claim_quest("steady_hand"),"Session commits the reward and receipt together")
	session.data.coins=0
	session.load_game()
	check(session.data.coins==25 and session.data.xp==40 and session.data.adventure.quests.steady_hand.claims==1,"Save reload retains rewards, inventory and the claim receipt")
	session.data.zone="forest"
	check(not session.accept_quest("first_watch") and not session.buy_draught(),"Forest exploration cannot remotely accept contracts or shop")
	session.data.zone="camp"
	session.save_path="res://tests/_missing_directory/no-write/save.json"
	# The actual disk-failure branch is exercised with a file as the parent.
	var obstruction=FileAccess.open("res://tests/_adventure-block",FileAccess.WRITE)
	obstruction.store_string("occupied")
	obstruction.close()
	session.save_path="res://tests/_adventure-block/save.json"
	check(not session.accept_quest("first_watch") and session.data.adventure.quests.first_watch.state=="available","Failed save rolls back a contract acceptance")
	DirAccess.remove_absolute("res://tests/_adventure-block")
	DirAccess.remove_absolute("res://tests/_adventure-save.json")
	print("ADVENTURE RULES: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
