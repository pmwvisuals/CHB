extends RefCounted

const PRESETS := {
	"balanced":{"name":"Balanced","scale":.8,"leaf_range":55.0,"near_range":80.0,"shadow_range":45.0,"lod":.45,"far_lod":.3,"scenery_lod":.65},
	"high":{"name":"High","scale":1.0,"leaf_range":85.0,"near_range":112.0,"shadow_range":65.0,"lod":.6,"far_lod":.45,"scenery_lod":.85}
}

static func recommend(memory_bytes:int,mobile:bool,architecture:String) -> String:
	if mobile and (memory_bytes<6*1024*1024*1024 or not "64" in architecture):
		return "balanced"
	return "high"

static func valid(value) -> bool:
	return value is String and PRESETS.has(value)
