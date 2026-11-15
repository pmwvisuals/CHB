extends Node3D

var phase := 0.0
var flame_material:ShaderMaterial
var removed_flames := 0

func install(world):
	name = "SanctuaryCampfire"
	world.add_child(self)
	position = Vector3(0,world.height(0,-62)+.45,-62)
	# The old unlit orange cones are separate transparent draws in the export.
	for part in world.scenery.find_children("*","MeshInstance3D",true,false):
		var at:Vector3 = part.global_position
		if absf(at.x)>2 or absf(at.z+62)>2:
			continue
		var material = part.get_active_material(0)
		if material is BaseMaterial3D and material.shading_mode==BaseMaterial3D.SHADING_MODE_UNSHADED and is_equal_approx(material.albedo_color.a,.85):
			part.hide()
			removed_flames += 1
	var flames = preload("res://assets/campfire/campfire-flames.glb").instantiate()
	add_child(flames)
	flame_material = ShaderMaterial.new()
	flame_material.shader = preload("res://shaders/campfire.gdshader")
	flame_material.set_shader_parameter("flame_atlas",preload("res://assets/campfire/flames.png"))
	for part in flames.find_children("*","MeshInstance3D",true,false):
		part.material_override = flame_material
		part.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var light := OmniLight3D.new()
	light.name = "SteadyFirelight"
	light.position.y = 1.0
	light.light_color = Color("ff9b40")
	light.light_energy = 3.2
	light.omni_range = 11.0
	light.shadow_enabled = false
	add_child(light)

func _process(delta:float):
	if Session.paused:
		return
	phase += delta
	flame_material.set_shader_parameter("fire_time",phase)
