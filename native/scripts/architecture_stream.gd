extends Node3D

const CHUNK_INDEX := "res://assets/camp/architecture/index.json"
# Prefetch beyond the distance fog. Keep a second margin so moving back and
# forth across the load boundary does not repeatedly reload the same mesh.
const PREFETCH_MARGIN := 20.0
const RETENTION_MARGIN := 30.0
const MAX_PENDING := 2
const UPDATE_INTERVAL := 0.15

var camera:Camera3D
var decorate:Callable
var chunks:Array = []
var residents := {}
var pending := {}
var failed := {}
var wanted:Array[Dictionary] = []
var load_radius := 0.0
var last_point := Vector2(INF,INF)
var tick := 0.0

func _ready():
	var index = JSON.parse_string(FileAccess.get_file_as_string(CHUNK_INDEX))
	if not index is Dictionary or not index.get("chunks") is Array:
		push_error("Camp architecture index is missing or unreadable: " + CHUNK_INDEX)
		return
	for item in index.chunks:
		var lower := Vector2(item.min[0], item.min[1])
		var upper := Vector2(item.max[0], item.max[1])
		chunks.append({"path":item.path, "bounds":Rect2(lower,upper-lower), "triangles":int(item.triangles)})

func distance_to_bounds(point:Vector2, bounds:Rect2) -> float:
	var nearest := point.clamp(bounds.position,bounds.end)
	return point.distance_squared_to(nearest)

func refresh(point:Vector2, jumped:bool=false):
	last_point = point
	load_radius = camera.far + PREFETCH_MARGIN
	var release_radius := load_radius if jumped else load_radius + RETENTION_MARGIN
	var load_radius_squared := load_radius * load_radius
	var release_radius_squared := release_radius * release_radius
	wanted.clear()
	for chunk in chunks:
		var path:String = chunk.path
		var distance := distance_to_bounds(point,chunk.bounds)
		if distance <= load_radius_squared:
			wanted.append({"path":path, "distance":distance})
		if distance > release_radius_squared and residents.has(path):
			var node:Node3D = residents[path]
			remove_child(node)
			node.queue_free()
			residents.erase(path)
	wanted.sort_custom(func(a,b): return a.distance < b.distance)
	request_chunks()

func request_chunks():
	for item in wanted:
		if pending.size() >= MAX_PENDING:
			break
		var path:String = item.path
		if residents.has(path) or pending.has(path) or failed.has(path):
			continue
		var result := ResourceLoader.load_threaded_request(path,"PackedScene",false,ResourceLoader.CACHE_MODE_IGNORE)
		if result == OK:
			pending[path] = true
		else:
			fail(path)

func finish_one_request():
	for path in pending.keys():
		var status := ResourceLoader.load_threaded_get_status(path)
		if status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			continue
		pending.erase(path)
		var packed:PackedScene
		if status != ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
			packed = ResourceLoader.load_threaded_get(path) as PackedScene
		if packed == null:
			fail(path)
		elif wanted.any(func(item): return item.path == path):
			var node:Node3D = packed.instantiate()
			for part in node.get_children():
				decorate.call(part)
				part.lod_bias = Session.graphics_preset().scenery_lod
			add_child(node)
			residents[path] = node
		# Attach at most one section per frame so a finished batch does not spike.
		break
	request_chunks()

func fail(path:String):
	failed[path] = true
	push_error("Cannot stream camp architecture: " + path)

func prepare_view(at:Vector3):
	refresh(Vector2(at.x, at.z),true)
	while wanted.any(func(item): return not residents.has(item.path) and not failed.has(item.path)):
		await get_tree().process_frame

func _process(delta:float):
	if not Session.paused:
		tick -= delta
		if tick <= 0:
			tick = UPDATE_INTERVAL
			var position_3d := camera.global_position
			var point := Vector2(position_3d.x,position_3d.z)
			if point.distance_squared_to(last_point) > 16.0 or not is_equal_approx(load_radius,camera.far+PREFETCH_MARGIN):
				refresh(point)
	if not pending.is_empty():
		finish_one_request()

func _exit_tree():
	# Consume accepted requests even when entering a different region.
	# There are at most two, and no scene is instantiated on exit.
	for path in pending:
		if ResourceLoader.load_threaded_get_status(path) != ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
			ResourceLoader.load_threaded_get(path)
