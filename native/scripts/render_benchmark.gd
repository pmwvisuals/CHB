extends Node

# Opt-in diagnostic APK only. All cases use the same High camera and save.
var world
var snapshots:Array[Dictionary]=[]
var results:Array=[]
const CASES=["baseline","no_grass","no_non_grass_instances","no_instances","no_shadows","flat_materials","simple_ground","no_scenery","baseline_repeat"]

func _ready():call_deferred("run")

func restore():
	for item in snapshots:
		item.node.visible=item.visible
		item.node.material_override=item.material
	world.key_light.shadow_enabled=true

func configure(id:String):
	restore()
	var flat:=StandardMaterial3D.new()
	flat.albedo_color=Color("829173")
	flat.roughness=1
	for item in snapshots:
		var node=item.node
		var kind:String=node.get_meta("plant_kind","")
		var grass:bool="grass" in kind.to_lower() or kind=="ground cover"
		if id=="no_grass" and grass:node.hide()
		if id=="no_non_grass_instances" and node is MultiMeshInstance3D and not grass:node.hide()
		if id=="no_instances" and node is MultiMeshInstance3D:node.hide()
		if id=="flat_materials":node.material_override=flat
		if id=="simple_ground" and node.name.begins_with("CampTerrain"):node.material_override=flat
		if id=="no_scenery" and world.scenery.is_ancestor_of(node):node.hide()
	if id=="no_shadows":world.key_light.shadow_enabled=false

func run():
	get_tree().root.set_disable_input(true)
	world=Session.app.world
	world.travel_to(world.destinations.filter(func(d):return d.id=="arrival")[0])
	for i in range(20):await get_tree().physics_frame
	world.player.set_physics_process(false)
	world.foliage_stream.set_process(false)
	world.player.camera.rotation=Vector3.ZERO
	for node in world.find_children("*","GeometryInstance3D",true,false):
		snapshots.append({"node":node,"visible":node.visible,"material":node.material_override})
	for id in CASES:
		configure(id)
		Session.message="Measuring rendering: "+id
		print("BENCH_BEGIN ",id)
		var quick:bool="--benchmark-quick" in OS.get_cmdline_user_args()
		var warm_until:=Time.get_ticks_msec()+(1000 if quick else 5000)
		while Time.get_ticks_msec()<warm_until:await get_tree().process_frame
		var start:=Time.get_ticks_usec()
		var frames:=0
		var draws:=0.0
		var triangles:=0.0
		var physics:=0.0
		var duration:=2000000 if quick else 15000000
		while Time.get_ticks_usec()-start<duration:
			await get_tree().process_frame
			frames+=1
			draws+=Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
			triangles+=Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
			physics+=Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS)*1000
		var result={"case":id,"frames":frames,"seconds":(Time.get_ticks_usec()-start)/1000000.0,"fps":frames*1000000.0/(Time.get_ticks_usec()-start),"draws":draws/maxi(1,frames),"triangles":triangles/maxi(1,frames),"physics_ms":physics/maxi(1,frames)}
		results.append(result)
		print("BENCH_RESULT ",JSON.stringify(result))
	restore()
	world.foliage_stream.set_process(true)
	world.player.set_physics_process(true)
	get_tree().root.set_disable_input(false)
	Session.message="Rendering measurements complete."
	var file=FileAccess.open("user://render-benchmark-results.json",FileAccess.WRITE)
	if file:file.store_string(JSON.stringify(results,"  "))
	print("BENCH_COMPLETE ",JSON.stringify(results))
	if "--benchmark-quick" in OS.get_cmdline_user_args():get_tree().quit()
