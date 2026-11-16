extends RefCounted

# Game rules contain no scene or device dependencies. Rewards are committed
# together with their receipt, so loading or revisiting cannot pay twice.
const QUESTS = [
	{"id":"steady_hand","title":"A Steady Hand","story":"The sanctuary needs defenders. Use Map → Training Ground. Land three sword hits on a dummy and one arrow on a target before venturing beyond the gate.","objectives":[["sword_hit",3,"Sword hits on training dummies"],["target_hit",1,"Archery target hits"]],"xp":40,"gold":25},
	{"id":"first_watch","title":"Beyond the Gate","story":"An Ash-Tusk Boar is troubling the first clearing. Follow the trail north from the woodland entrance, defeat it, then return safely.","objectives":[["forest_enter",1,"Enter Deepwood"],["ash_tusk",1,"Defeat the Ash-Tusk Boar"],["camp_return",1,"Return to camp after the hunt"]],"xp":80,"gold":45},
	{"id":"deep_echoes","title":"Echoes in Deepwood","story":"Something stirs deeper in the woodland. Defeat two creatures and recover the sealed cache in the northern hollow, beyond the central hunting grounds.","objectives":[["kill",2,"Defeat woodland creatures"],["heart_cache",1,"Open the northern hollow cache"],["camp_return",1,"Return with your findings"]],"xp":140,"gold":80},
	{"id":"wardens_watch","title":"Warden's Watch","story":"Keep the trails safe. Defeat three creatures on each patrol, then return for the camp's bounty. This contract can be repeated.","objectives":[["kill",3,"Defeat woodland creatures"],["camp_return",1,"Return after the patrol"]],"xp":60,"gold":30,"repeatable":true}
]
const ENEMIES = {
	"ash_tusk":{"name":"Ash-Tusk Boar","hp":90,"damage":12,"xp":22,"gold":10,"speed":1.65,"range":2.7,"event":"ash_tusk","tier":1},
	"FantasyBoar":{"name":"Briar Boar","hp":110,"damage":15,"xp":28,"gold":12,"speed":1.8,"range":2.5,"tier":1},
	"MagicWolf":{"name":"Grove Wolf","hp":135,"damage":18,"xp":40,"gold":18,"speed":2.4,"range":2.3,"tier":2},
	"MutantMantis":{"name":"Hollow Mantis","hp":170,"damage":22,"xp":55,"gold":24,"speed":1.6,"range":3.1,"tier":3}
}
const CACHES = [
	{"id":"trail_cache","name":"Trail supply cache","point":Vector2(-1,123),"gold":18,"xp":12},
	{"id":"grove_cache","name":"Grove cache","point":Vector2(-65,-36),"gold":28,"xp":20},
	{"id":"heart_cache","name":"Northern hollow cache","point":Vector2(45,-174),"gold":40,"xp":30}
]
const POTION_PRICE = 12
const POTION_HEAL = 40.0
const POTION_LIMIT = 5

static func integer(value, fallback:int=0, limit:int=100000000) -> int:
	return clampi(int(value),0,limit) if (value is int or value is float) and is_finite(float(value)) else fallback

static func ensure(data:Dictionary):
	data.coins=integer(data.get("coins"))
	data.xp=integer(data.get("xp"))
	if not data.get("adventure") is Dictionary:data.adventure={}
	var a:Dictionary=data.adventure
	a.potions=integer(a.get("potions",2),2,POTION_LIMIT)
	a.defeats=integer(a.get("defeats"))
	for field in ["quests","caches","respawns"]:
		if not a.get(field) is Dictionary:a[field]={}
	for q in QUESTS:
		var state=a.quests.get(q.id,{})
		if not state is Dictionary:state={}
		var progress=state.get("progress",{})
		if not progress is Dictionary:progress={}
		var clean={}
		for o in q.objectives:clean[o[0]]=integer(progress.get(o[0]),0,o[1])
		a.quests[q.id]={"state":state.get("state","available") if state.get("state","") in ["available","active","claimed"] else "available","progress":clean,"claims":integer(state.get("claims"))}
	# Only known one-time cache receipts and bounded respawn timestamps persist.
	for key in a.caches.keys():
		if not CACHES.any(func(c):return c.id==key) or a.caches[key]!=true:a.caches.erase(key)
	for key in a.respawns.keys():
		if not ENEMIES.has(key):a.respawns.erase(key)
		else:a.respawns[key]=integer(a.respawns[key],0,2147483647)

static func level(xp:int) -> int:
	var result:=1
	while result<10 and xp>=threshold(result):result+=1
	return result

static func threshold(current_level:int) -> int:
	return 100*current_level+25*current_level*(current_level-1)

static func max_health(data:Dictionary) -> float:return 100.0+(level(data.xp)-1)*10.0

static func active(data:Dictionary) -> Dictionary:
	for q in QUESTS:
		if data.adventure.quests[q.id].state=="active":return q
	return {}

static func unlocked(data:Dictionary,id:String) -> bool:
	for i in range(QUESTS.size()):
		if QUESTS[i].id==id:return i==0 or data.adventure.quests[QUESTS[i-1].id].claims>0
	return false

static func accept(data:Dictionary,id:String) -> bool:
	ensure(data)
	if not active(data).is_empty() or not unlocked(data,id):return false
	var matches=QUESTS.filter(func(q):return q.id==id)
	if matches.is_empty():return false
	var q:Dictionary=matches[0]
	var state:Dictionary=data.adventure.quests[id]
	if state.state=="claimed" and not q.get("repeatable",false):return false
	state.state="active"
	for o in q.objectives:state.progress[o[0]]=0
	# A unique story cache opened while exploring must never soft-lock a quest.
	if id=="deep_echoes" and data.adventure.caches.has("heart_cache"):state.progress.heart_cache=1
	return true

static func ready(data:Dictionary,q:Dictionary) -> bool:
	if q.is_empty() or data.adventure.quests[q.id].state!="active":return false
	return q.objectives.all(func(o):return data.adventure.quests[q.id].progress[o[0]]>=o[1])

static func record(data:Dictionary,event:String,amount:int=1):
	ensure(data)
	var q:=active(data)
	if q.is_empty() or amount<=0:return
	var progress:Dictionary=data.adventure.quests[q.id].progress
	for o in q.objectives:
		if o[0]!=event:continue
		if event=="camp_return" and not q.objectives.all(func(other):return other[0]=="camp_return" or progress[other[0]]>=other[1]):return
		progress[event]=mini(o[1],progress[event]+amount)

static func reward(data:Dictionary,xp:int,gold:int):
	var before:=level(data.xp)
	data.xp=mini(100000000,data.xp+maxi(0,xp))
	data.coins=mini(100000000,data.coins+maxi(0,gold))
	data.health=minf(max_health(data),data.health+(level(data.xp)-before)*10.0)

static func claim(data:Dictionary,id:String) -> bool:
	ensure(data)
	var q:=active(data)
	if q.is_empty() or q.id!=id or not ready(data,q):return false
	var state:Dictionary=data.adventure.quests[id]
	state.state="claimed"
	state.claims+=1
	reward(data,q.xp,q.gold)
	return true

static func open_cache(data:Dictionary,id:String) -> bool:
	ensure(data)
	var matches=CACHES.filter(func(c):return c.id==id)
	if matches.is_empty() or data.adventure.caches.has(id):return false
	var c:Dictionary=matches[0]
	data.adventure.caches[id]=true
	reward(data,c.xp,c.gold)
	data.adventure.potions=mini(POTION_LIMIT,data.adventure.potions+1)
	record(data,id)
	return true

static func buy_potion(data:Dictionary) -> bool:
	ensure(data)
	if data.coins<POTION_PRICE or data.adventure.potions>=POTION_LIMIT:return false
	data.coins-=POTION_PRICE
	data.adventure.potions+=1
	return true

static func heal(data:Dictionary) -> bool:
	ensure(data)
	if data.adventure.potions<=0 or data.health<=0 or data.health>=max_health(data):return false
	data.adventure.potions-=1
	data.health=minf(max_health(data),data.health+POTION_HEAL)
	return true

static func tracker(data:Dictionary) -> String:
	var q:=active(data)
	if q.is_empty():return "Open Journal in camp to accept a quest."
	if ready(data,q):return q.title+"\nReady · Claim your reward in camp."
	for o in q.objectives:
		var count:int=data.adventure.quests[q.id].progress[o[0]]
		if count<o[1]:return "%s\n%s  %d / %d"%[q.title,o[2],count,o[1]]
	return q.title
