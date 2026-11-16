extends Control

signal closed
const RULES=preload("res://scripts/adventure_rules.gd")
var world
var content:VBoxContainer
var notice:Label

func text(value:String,size:int=18) -> Label:
	var label:=Label.new()
	label.text=value
	label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size",size)
	content.add_child(label)
	return label

func action(value:String,callback:Callable,enabled:bool=true) -> Button:
	var button:=Button.new()
	button.text=value
	button.custom_minimum_size.y=48
	button.disabled=not enabled
	button.pressed.connect(callback)
	content.add_child(button)
	return button

func _ready():
	theme=Session.ui_theme
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var shade:=ColorRect.new()
	shade.color=Color(.025,.05,.04,.98)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(shade)
	var panel:=PanelContainer.new()
	panel.anchor_left=.12
	panel.anchor_right=.88
	panel.anchor_top=.035
	panel.anchor_bottom=.965
	add_child(panel)
	var outer:=VBoxContainer.new()
	outer.add_theme_constant_override("separation",12)
	panel.add_child(outer)
	var title:=Label.new()
	title.text="THE WARDEN'S JOURNAL"
	title.add_theme_font_override("font",preload("res://fonts/Cinzel.ttf"))
	title.add_theme_font_size_override("font_size",26)
	outer.add_child(title)
	var scroll:=ScrollContainer.new()
	scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL
	outer.add_child(scroll)
	content=VBoxContainer.new()
	content.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation",12)
	scroll.add_child(content)
	var close:=Button.new()
	close.text="RETURN TO GAME"
	close.custom_minimum_size.y=52
	close.pressed.connect(func():closed.emit())
	outer.add_child(close)
	rebuild()

func rebuild():
	for child in content.get_children():
		content.remove_child(child)
		child.queue_free()
	Session.ensure_adventure()
	var level:=RULES.level(Session.data.xp)
	text("LEVEL %d  ·  %d XP  ·  %d GOLD  ·  VITALITY %d / %d"%[level,Session.data.xp,Session.data.coins,Session.data.health,RULES.max_health(Session.data)])
	text("Complete contracts, collect caches and return to camp. Quest progress and rewards save on this device.",16)
	notice=text("Return to camp to accept quests, claim rewards and buy supplies." if Session.data.zone!="camp" else "Camp quest board · Accept one contract at a time.",16)
	var ordered:Array=RULES.QUESTS.duplicate()
	ordered.sort_custom(func(a,b):
		var sa:String=Session.data.adventure.quests[a.id].state
		var sb:String=Session.data.adventure.quests[b.id].state
		var pa:int=0 if sa=="active" else 3 if sa=="claimed" and not a.get("repeatable",false) else 1 if RULES.unlocked(Session.data,a.id) else 2
		var pb:int=0 if sb=="active" else 3 if sb=="claimed" and not b.get("repeatable",false) else 1 if RULES.unlocked(Session.data,b.id) else 2
		return pa<pb
	)
	for q in ordered:
		var state:Dictionary=Session.data.adventure.quests[q.id]
		text(q.title+(" · REPEATABLE" if q.get("repeatable",false) else " · EXPLORATION" if q.get("kind","")=="EXPLORATION" else ""),22)
		if state.state=="claimed" and not q.get("repeatable",false):
			text("COMPLETED",16)
			continue
		text(q.story,17)
		for o in q.objectives:
			text("%s  %d / %d"%[o[2],state.progress[o[0]],o[1]],16)
		text("Reward · %d XP · %d gold"%[q.xp,q.gold],16)
		if state.state=="active":
			action("CLAIM REWARD IN CAMP" if RULES.ready(Session.data,q) else "QUEST IN PROGRESS",func():Session.claim_quest(q.id);rebuild(),Session.data.zone=="camp" and RULES.ready(Session.data,q))
		elif state.state=="claimed" and not q.get("repeatable",false):
			text("COMPLETED",16)
		else:
			var available:bool=RULES.unlocked(Session.data,q.id)
			action("ACCEPT CONTRACT" if available else RULES.unlock_hint(q),func():Session.accept_quest(q.id);rebuild(),available and RULES.active(Session.data).is_empty() and Session.data.zone=="camp").set_meta("quest_id",q.id)
	text("EXPEDITION RECORD",22)
	text("%d / %d survey marks recorded · First discoveries grant one-time XP and gold."%[Session.data.adventure.discoveries.size(),RULES.DISCOVERIES.size()],17)
	for site in RULES.DISCOVERIES:
		var found:bool=Session.data.adventure.discoveries.has(site.id)
		text(site.name+(" · RECORDED" if found else " · UNDISCOVERED"),20)
		text(site.lore if found else site.hint,17)
	text("CAMP SUPPLIES",22)
	text("Healing draughts · %d / %d carried · Restores 40 vitality. Camp restores vitality for free."%[Session.data.adventure.potions,RULES.POTION_LIMIT],17)
	action("BUY DRAUGHT · %d GOLD"%RULES.POTION_PRICE,func():Session.buy_draught();rebuild(),Session.data.zone=="camp" and Session.data.coins>=RULES.POTION_PRICE and Session.data.adventure.potions<RULES.POTION_LIMIT)
	text("Deepwood guide",22)
	text("The entrance is safe. The southern trails lead to boar clearings. The central groves hide a wolf; a mantis guards the northern hollow and its sealed cache. Survey marks reveal the woodland history. Inspect them with Interact / E when nearby; finish or escape an encounter before stopping to read. Stronger creatures reward more XP and gold. Wind-ups last 0.75 seconds: sidestep before the strike. Sword and bow are available in the forest. Defeat returns you to camp with earned progress intact.",17)
