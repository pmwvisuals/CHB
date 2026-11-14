extends Node

# Near cells retain the source meshes. Distant trunks/crowns share larger cells;
# each source placement belongs to exactly one representation at a time.
var world
var near_cells:Array[Dictionary] = []
var distant := {}
var last_position := Vector2(INF,INF)
var near_range := 112.0
var last_quality := ""
var timer := 0.0

func register_cell(node:MultiMeshInstance3D,entry:Dictionary):
	if not ("bark high" in entry.kind or "canopy high" in entry.kind):
		return
	var centre := Vector2(node.position.x,node.position.z)
	var coarse := Vector3(floorf(centre.x/96)*96+48,0,floorf(centre.y/96)*96+48)
	var key := "%s:%d:%d" % [entry.proto,int(coarse.x),int(coarse.z)]
	if not distant.has(key):
		distant[key] = {"origin":coarse,"mesh":node.multimesh.mesh,"material":node.material_override,"cells":[],"capacity":0}
	var transforms:Array[Transform3D] = []
	for i in range(node.multimesh.instance_count):
		var transform := node.multimesh.get_instance_transform(i)
		transform.origin += node.position-coarse
		transforms.append(transform)
	var cell := {"node":node,"centre":centre,"transforms":transforms,"near":false}
	near_cells.append(cell)
	distant[key].cells.append(cell)
	distant[key].capacity += transforms.size()

func finish():
	for group in distant.values():
		var multi := MultiMesh.new()
		multi.transform_format = MultiMesh.TRANSFORM_3D
		multi.mesh = group.mesh
		multi.instance_count = group.capacity
		multi.visible_instance_count = 0
		var node := MultiMeshInstance3D.new()
		node.name = "DistantCrownCell"
		node.set_meta("distant_crown",true)
		node.multimesh = multi
		node.position = group.origin
		node.material_override = group.material
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		node.visibility_range_end = 390
		world.add_child(node)
		group.node = node
	refresh(true)

func refresh(force:bool=false):
	if not is_instance_valid(world.player):
		return
	var point := Vector2(world.player.position.x,world.player.position.z)
	var quality:String = Session.graphics_quality()
	if not force and quality == last_quality and point.distance_squared_to(last_position)<36:
		return
	last_position = point
	last_quality = quality
	var preset:Dictionary = Session.graphics_preset()
	near_range = preset.near_range
	for cell in near_cells:
		cell.near = cell.centre.distance_squared_to(point)<near_range*near_range
		cell.node.visible = cell.near
	for group in distant.values():
		var multi:MultiMesh = group.node.multimesh
		var count := 0
		for cell in group.cells:
			if cell.near:
				continue
			for transform in cell.transforms:
				multi.set_instance_transform(count,transform)
				count += 1
		multi.visible_instance_count = count
		group.node.visible = count>0
		group.node.lod_bias = preset.far_lod

func _process(delta):
	timer -= delta
	if timer<=0:
		timer = .25
		refresh()
