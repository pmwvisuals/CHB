extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
	print(("PASS: " if ok else "FAIL: ")+label)
	if not ok:failures+=1
func run():
	var report:Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://assets/camp/surface-cells.json"))
	var packed=load("res://assets/camp/camp-static.glb")
	var scenery=packed.instantiate()
	var cells:=0
	var triangles:=0
	var bounded:=true
	var textured_roads:=true
	for part in scenery.find_children("*","MeshInstance3D",true,false):
		if not part.name.begins_with("CampTerrain") and not part.name.begins_with("CampRoad"):continue
		cells+=1
		var bounds:AABB=part.mesh.get_aabb()
		bounded=bounded and bounds.size.x<=report.size+4 and bounds.size.z<=report.size+4
		triangles+=part.mesh.get_faces().size()/3
		if part.name.begins_with("CampRoad"):
			textured_roads=textured_roads and part.get_active_material(0).albedo_texture!=null and part.get_active_material(0).normal_texture!=null
	check(cells==report.cells and bounded,"Terrain and roads use the prepared bounded surface cells")
	check(triangles==report.triangles,"Every original terrain and road triangle is retained")
	check(textured_roads,"Split paving retains color and normal textures")
	check(not root.get_node("Session").benchmark_enabled,"Normal builds do not enable diagnostic scene changes")
	scenery.free()
	print("RENDER SURFACES: %d failure(s)"%failures)
	quit(0 if failures==0 else 1)
