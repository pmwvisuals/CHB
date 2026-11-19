extends SceneTree

# Run after importing the current camp-static.glb into Godot.
const SOURCE := "res://assets/camp/camp-static.glb"
const DIRECTORY := "res://assets/camp/architecture/"
const MANIFEST := "res://assets-manifest.json"

func _initialize():
	call_deferred("bake")

func save_scene(scene:Node3D, path:String) -> bool:
	var packed := PackedScene.new()
	return packed.pack(scene) == OK and ResourceSaver.save(packed, path, ResourceSaver.FLAG_COMPRESS) == OK

func bake():
	var source:PackedScene = load(SOURCE)
	var original:Node3D = source.instantiate()
	var ground := Node3D.new()
	ground.name = "CampScenery"
	root.add_child(original)
	root.add_child(ground)
	DirAccess.make_dir_recursive_absolute(DIRECTORY)
	var source_hash := FileAccess.get_sha256(SOURCE)
	var manifest:Dictionary = JSON.parse_string(FileAccess.get_file_as_string(MANIFEST))
	var assets:Array = manifest.assets.filter(func(item): return not item.file.begins_with("assets/camp/architecture/"))
	var source_entries := assets.filter(func(item): return item.file == SOURCE.trim_prefix("res://"))
	if source_entries.size() != 1 or source_entries[0].sha256 != source_hash:
		fail("camp-static.glb does not match the asset manifest")
		return
	var groups := {}
	var materials := {}
	var files:Array[String] = []
	var chunks := []
	var original_triangles := 0
	var source_meshes := 0
	for part in original.find_children("*","MeshInstance3D",true,false):
		var pose:Transform3D = part.global_transform
		var target := ground
		if part.name.begins_with("SceneryCell_"):
			# The art export sets each 48 m cell's centre as its mesh origin.
			var key := "%d_%d" % [roundi(pose.origin.x),roundi(pose.origin.z)]
			if not groups.has(key):
				target = Node3D.new()
				target.name = "Architecture_" + key
				root.add_child(target)
				groups[key] = {"node":target, "bounds":pose * part.get_aabb(), "triangles":0}
			var group:Dictionary = groups[key]
			target = group.node
			group.bounds = group.bounds.merge(pose * part.get_aabb())
			for surface in range(part.mesh.get_surface_count()):
				var count:int = part.mesh.surface_get_array_index_len(surface)
				if count == 0:count = part.mesh.surface_get_array_len(surface)
				group.triangles += count / 3
				var material:Material = part.mesh.surface_get_material(surface)
				if not materials.has(material):
					var palette_path := DIRECTORY + "palette_%d.res" % materials.size()
					var palette := material.duplicate()
					if ResourceSaver.save(palette, palette_path, ResourceSaver.FLAG_CHANGE_PATH) != OK:
						fail("Cannot save " + palette_path)
						return
					materials[material] = palette
					files.append(palette_path)
				part.mesh.surface_set_material(surface,materials[material])
			source_meshes += 1
		part.reparent(target, true)
		part.owner = target
	if groups.is_empty() or source_meshes == 0:
		fail("The camp source has no SceneryCell meshes")
		return
	original.free()
	var base_path := DIRECTORY + "ground.scn"
	if not save_scene(ground,base_path):
		fail("Cannot save base scenery")
		return
	files.append(base_path)
	ground.free()
	var keys := groups.keys()
	keys.sort()
	for key in keys:
		var group:Dictionary = groups[key]
		var chunk:Node3D = group.node
		var path := DIRECTORY + "cell_" + str(key) + ".scn"
		if not save_scene(chunk,path):
			fail("Cannot save " + path)
			return
		var bounds:AABB = group.bounds
		chunks.append({"path":path,"min":[bounds.position.x,bounds.position.z],
			"max":[bounds.end.x,bounds.end.z],"triangles":group.triangles,
			"meshes":chunk.get_child_count()})
		files.append(path)
		original_triangles += group.triangles
		chunk.free()
	var index_path := DIRECTORY + "index.json"
	var index := FileAccess.open(index_path,FileAccess.WRITE)
	if index == null:
		fail("Cannot save architecture index")
		return
	index.store_string(JSON.stringify({"source_sha256":source_hash,"chunks":chunks,
		"triangles":original_triangles,"meshes":source_meshes},"  ")+"\n")
	index.close()
	files.append(index_path)
	for path in files:
		var relative := path.trim_prefix("res://")
		assets.append({"file":relative,"source":"scripts/bake-native-architecture.gd",
			"bytes":FileAccess.get_size(path),"sha256":FileAccess.get_sha256(path)})
	manifest.assets = assets
	var writer := FileAccess.open(MANIFEST,FileAccess.WRITE)
	writer.store_string(JSON.stringify(manifest,"  ")+"\n")
	writer.close()
	print("ARCHITECTURE BAKE: ",chunks.size()," sections; ",source_meshes," meshes; ",
		original_triangles," triangles; ",materials.size()," shared materials")
	quit()

func fail(message:String):
	push_error(message)
	quit(1)
