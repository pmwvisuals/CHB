extends Node

const RULES=preload("res://scripts/adventure_rules.gd")
var world
var sites:Dictionary={}

func install(region):
	world=region
	var stone=world.material("777b70",.98)
	var dark=world.material("42483f",.98)
	for site in RULES.DISCOVERIES:
		var marker:=Node3D.new()
		marker.name=site.id
		var at:Vector2=site.point
		marker.position=world.recover_tree_position(Vector3(at.x,world.height(at.x,at.y),at.y))
		marker.position.y=world.height(marker.position.x,marker.position.z)-.02
		world.add_child(marker)
		for tier in range(3):
			var mesh:=MeshInstance3D.new()
			var rock:=CylinderMesh.new()
			rock.top_radius=.48-tier*.10
			rock.bottom_radius=.57-tier*.10
			rock.height=.22
			rock.radial_segments=7
			mesh.mesh=rock
			mesh.position.y=.11+tier*.21
			mesh.rotation.y=tier*.65
			mesh.material_override=stone
			mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			marker.add_child(mesh)
		var plate:=MeshInstance3D.new()
		var slab:=BoxMesh.new()
		slab.size=Vector3(.48,.48,.09)
		plate.mesh=slab
		plate.position=Vector3(0,.77,.02)
		plate.material_override=dark
		plate.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		marker.add_child(plate)
		var inscription:=Label3D.new()
		inscription.text=site.mark
		preload("res://scripts/inscription.gd").fit(inscription,.32,.24)
		inscription.modulate=Color("c6bd9c")
		inscription.position=Vector3(0,.77,.075)
		marker.add_child(inscription)
		for visual in marker.get_children():
			if visual is MeshInstance3D:visual.visibility_range_end=65
		sites[site.id]=marker

func near_site() -> String:
	if not is_instance_valid(world.player):return ""
	var nearest:=""
	var distance:=2.8
	for id in sites:
		var marker:Node3D=sites[id]
		var target:Vector3=marker.global_position+Vector3.UP*.65
		var offset:Vector3=target-world.player.camera.global_position
		var reach:float=world.player.global_position.distance_to(marker.global_position)
		if reach>=distance or offset.normalized().dot(-world.player.camera.global_basis.z)<.25:continue
		var query:=PhysicsRayQueryParameters3D.create(world.player.camera.global_position,target)
		query.exclude=[world.player.get_rid()]
		var hit:Dictionary=world.get_world_3d().direct_space_state.intersect_ray(query)
		if not hit.is_empty():continue
		nearest=id
		distance=reach
	return nearest

func interaction_text() -> String:
	var id:=near_site()
	if id=="":return ""
	for site in RULES.DISCOVERIES:
		if site.id==id:return ("Read " if Session.data.adventure.discoveries.has(id) else "Inspect ")+site.name
	return ""

func inspect() -> bool:
	var id:=near_site()
	if id=="" or Session.paused or Session.recovering:return false
	if world.encounters.in_combat():
		Session.message="Find safety before studying this survey mark."
		return false
	var site:Dictionary=RULES.DISCOVERIES.filter(func(d):return d.id==id)[0]
	if Session.data.adventure.discoveries.has(id):
		Session.message=site.name+" · Already recorded. Read its history in your Journal."
		return false
	if not Session.discover_site(id):
		Session.message="Your survey could not be saved. Try again."
		return false
	Session.message="Discovered · %s\n+%d XP · +%d gold · History saved in Journal."%[site.name,site.xp,site.gold]
	return true
