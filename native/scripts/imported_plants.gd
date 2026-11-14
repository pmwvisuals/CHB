extends RefCounted

var prototypes:Node3D
var replaced := 0
var grass_count := 0
var bush_count := 0
var flower_count := 0
var material_cache := {}

func load_prototypes() -> Dictionary:
	prototypes = preload("res://assets/plants/imported-plants.glb").instantiate()
	var result := {}
	for part in prototypes.find_children("*","MeshInstance3D",true,false):
		for i in range(part.mesh.get_surface_count()):
			var original = part.get_active_material(i)
			var key := str(original.get_instance_id())
			if not material_cache.has(key):
				var mat = original.duplicate()
				mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
				mat.alpha_scissor_threshold = .38
				mat.alpha_antialiasing_mode = BaseMaterial3D.ALPHA_ANTIALIASING_ALPHA_TO_COVERAGE
				mat.cull_mode = BaseMaterial3D.CULL_DISABLED
				mat.metallic = 0
				mat.roughness = .92
				mat.metallic_specular = .12
				mat.normal_scale = .65
				if String(part.name).begins_with("Grass"):
					mat.albedo_color = Color(.76,.90,.72)
				material_cache[key] = mat
			part.mesh.surface_set_material(i,material_cache[key])
		result[String(part.name)] = part
	return result

func dispose():
	if is_instance_valid(prototypes):prototypes.free()
	prototypes = null

func remap(entries:Array,world) -> Array:
	var result:Array = []
	var groups := {}
	var habitat:Image = preload("res://assets/camp/habitat.png").get_image()
	for entry in entries:
		var kind:String = entry.kind
		var shrub:bool = kind.begins_with("camp_laurel ") or kind.begins_with("camp_myrtle ")
		var flowers:bool = kind.begins_with("Living flowers")
		var grass:bool = kind=="ground cover" or kind=="Woodland grass patch" or kind.begins_with("camp_grass ")
		if not shrub and not flowers and not grass:
			result.append(entry)
			continue
		# Existing shrubs were split into bark, leaves, crown and blossom draws.
		# Replace each complete shrub once, at the original bark placement.
		if shrub and not "bark" in kind:continue
		for index in range(entry.instances.size()):
			if flowers and index%7!=0:continue
			var m:Array = entry.instances[index]
			var x:float = m[9]+entry.center[0]
			var z:float = m[11]+entry.center[2]
			var seed_value := int(absf(sin(x*12.9898+z*78.233)*43758.5453))
			var px := clampi(int((x+250)/500*habitat.get_width()),0,habitat.get_width()-1)
			var pz := clampi(int((z+250)/500*habitat.get_height()),0,habitat.get_height()-1)
			var forest:bool = habitat.get_pixel(px,pz).g>.25
			if (shrub or flowers) and forest:continue
			var cell_seed := absi(int(entry.center[0]*31+entry.center[2]*17))
			var proto := "BushGarden"
			var size := .85+.25*(seed_value%100)/100.0
			if grass:
				proto = ("GrassAged" if forest else "GrassFresh")+str(cell_seed%3)
				if forest and cell_seed%11==0:proto = "GrassDry"+str(cell_seed%3)
				size = .18+.12*(seed_value%100)/100.0
				var lake:float = pow((x-91)/40,2)+pow((z-5)/52,2)
				if lake>.8 and lake<1.3 and seed_value%23==0:
					proto = ("GrassTall" if cell_seed%2==0 else "GrassReed")+str(cell_seed%3)
					size = .65+.20*(seed_value%100)/100.0
				grass_count += 1
			elif flowers:
				proto = "BushLakeside" if absf(x-91)<40 and absf(z-5)<55 else "BushGarden"
				size = .35+.15*(seed_value%100)/100.0
				flower_count += 1
			else:
				bush_count += 1
			var old_basis := Basis(Vector3(m[0],m[1],m[2]),Vector3(m[3],m[4],m[5]),Vector3(m[6],m[7],m[8]))
			var basis := Basis(Vector3.UP,old_basis.get_euler().y).scaled(Vector3.ONE*size)
			var transform := [basis.x.x,basis.x.y,basis.x.z,basis.y.x,basis.y.y,basis.y.z,basis.z.x,basis.z.y,basis.z.z,m[9],world.height(x,z)-.025,m[11]]
			var key := proto+":"+str(entry.center)
			if not groups.has(key):
				groups[key] = {"proto":proto,"center":entry.center,"kind":"Imported grass" if grass else "Imported flower bushes" if flowers else "Imported camp bushes","shadow":not grass,"instances":[]}
			groups[key].instances.append(transform)
			replaced += 1
	result.append_array(groups.values())
	return result
