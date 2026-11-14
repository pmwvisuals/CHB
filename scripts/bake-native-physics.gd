extends SceneTree

# Run with --headless --path native --script <absolute path to this file>.
# Keep the original collision GLB as the editable source. Only pure physics
# resources are loaded on the device, avoiding an invisible GPU mesh copy.
func _initialize():
	call_deferred("bake")

func bake():
	var source:PackedScene = load("res://assets/camp/camp-collision.glb")
	var original:Node3D = source.instantiate()
	root.add_child(original)
	var physics := Node3D.new()
	physics.name = "CampPhysics"
	root.add_child(physics)
	var triangles := 0
	var count := 0
	for part in original.find_children("*","MeshInstance3D",true,false):
		var shape:ConcavePolygonShape3D = part.mesh.create_trimesh_shape()
		triangles += shape.get_faces().size()/3
		var body := StaticBody3D.new()
		body.name = "WalkableChunk_"+str(count)
		physics.add_child(body)
		body.owner = physics
		body.transform = part.global_transform
		var collision := CollisionShape3D.new()
		collision.shape = shape
		body.add_child(collision)
		collision.owner = physics
		count += 1
	physics.set_meta("source_triangles",triangles)
	physics.set_meta("chunks",count)
	var packed := PackedScene.new()
	assert(packed.pack(physics)==OK,"Cannot pack physics")
	var destination := "res://assets/camp/camp-physics.scn"
	assert(ResourceSaver.save(packed,destination,ResourceSaver.FLAG_COMPRESS)==OK,"Cannot save physics")
	var restored:Node3D = load(destination).instantiate()
	assert(restored.find_children("*","MeshInstance3D",true,false).is_empty(),"Physics must not contain graphics meshes")
	assert(restored.get_child_count()==count,"Physics chunks lost during packing")
	for i in range(count):
		var before:StaticBody3D = physics.get_child(i)
		var after:StaticBody3D = restored.get_child(i)
		assert(before.transform.is_equal_approx(after.transform),"Collision moved")
		assert(before.get_child(0).shape.get_faces()==after.get_child(0).shape.get_faces(),"Collision faces changed")
	var file := FileAccess.open(destination,FileAccess.READ)
	var bytes:PackedByteArray = file.get_buffer(file.get_length())
	var hasher := HashingContext.new()
	hasher.start(HashingContext.HASH_SHA256)
	hasher.update(bytes)
	var manifest_path := "res://assets-manifest.json"
	var manifest:Dictionary = JSON.parse_string(FileAccess.get_file_as_string(manifest_path))
	manifest.assets = manifest.assets.filter(func(a): return a.file!="assets/camp/camp-physics.scn")
	manifest.assets.append({"source":"exact collision faces from camp-collision.glb; physics only","file":"assets/camp/camp-physics.scn","bytes":bytes.size(),"sha256":hasher.finish().hex_encode()})
	var writer := FileAccess.open(manifest_path,FileAccess.WRITE)
	writer.store_string(JSON.stringify(manifest,"  "))
	writer.close()
	print("PHYSICS BAKE: ",count," chunks; ",triangles," exact triangles; ",bytes.size()," bytes; no graphics meshes")
	restored.free()
	original.free()
	physics.free()
	quit()
