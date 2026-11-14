extends RefCounted

static func add_to(camp):
	var rays := Node3D.new()
	rays.name = "EveningCanopyRays"
	camp.add_child(rays)
	var mesh := CylinderMesh.new()
	mesh.height = 6.5
	mesh.top_radius = .46
	mesh.bottom_radius = 1.15
	mesh.radial_segments = 12
	mesh.rings = 1
	mesh.cap_top = false
	mesh.cap_bottom = false
	var material := ShaderMaterial.new()
	material.shader = preload("res://shaders/sun_shafts.gdshader")
	var direction:Vector3 = camp.key_light.position.normalized()
	# Small shafts at forest-side openings, with normal scene depth testing.
	# No screen overlay, point lights or shadows; foliage/architecture occlude them.
	for point in [Vector2(124,-111),Vector2(129,-108),Vector2(-135,-117),Vector2(-139,-113),Vector2(151,80),Vector2(-44,-115)]:
		var ray := MeshInstance3D.new()
		ray.name = "CanopySunRay"
		ray.mesh = mesh
		ray.material_override = material
		ray.position = Vector3(point.x,camp.height(point.x,point.y)+.15,point.y)+direction*3.25
		ray.quaternion = Quaternion(Vector3.UP,direction)
		ray.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		ray.visibility_range_end = 38
		rays.add_child(ray)
