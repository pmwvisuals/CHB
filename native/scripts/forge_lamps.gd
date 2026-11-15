extends RefCounted

static func add_to(camp):
	var site:Dictionary=camp.layout.temples.filter(func(t):return t.id=="hephaestus")[0]
	var root:=Node3D.new()
	root.name="HephaestusOilLamps"
	camp.add_child(root)
	root.position=Vector3(site.x,site.height,site.z)
	root.rotation.y=site.rotation
	var bronze:=StandardMaterial3D.new()
	bronze.albedo_color=Color("674a32")
	bronze.metallic=.55
	bronze.roughness=.7
	var stone:=StandardMaterial3D.new()
	stone.albedo_color=Color("635d50")
	stone.roughness=.95
	var flame_mat:=ShaderMaterial.new()
	flame_mat.shader=preload("res://shaders/oil_flame.gdshader")
	var model=preload("res://assets/props/forge-oil-lantern.glb")
	for side in [-1,1]:
		var lamp:=Node3D.new()
		lamp.name="OilLampLeft" if side<0 else "OilLampRight"
		root.add_child(lamp)
		lamp.position=Vector3(side*2.25,1.24,7.4)
		var pedestal:=MeshInstance3D.new()
		var plinth:=BoxMesh.new()
		plinth.size=Vector3(.7,.8,.7)
		pedestal.mesh=plinth
		pedestal.material_override=stone
		pedestal.position.y=-.4
		lamp.add_child(pedestal)
		var cap:=MeshInstance3D.new()
		var rim:=CylinderMesh.new()
		rim.top_radius=.38
		rim.bottom_radius=.38
		rim.height=.07
		rim.radial_segments=12
		cap.mesh=rim
		cap.material_override=bronze
		lamp.add_child(cap)
		var prop=model.instantiate()
		prop.name="BrassHurricaneLantern"
		prop.position.y=.035
		lamp.add_child(prop)
		for part in prop.find_children("*","MeshInstance3D",true,false):
			part.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			part.visibility_range_end=65
		var flame:=MeshInstance3D.new()
		flame.name="OilFlame"
		var teardrop:=SphereMesh.new()
		teardrop.radius=.085
		teardrop.height=.32
		teardrop.radial_segments=10
		teardrop.rings=6
		flame.mesh=teardrop
		flame.material_override=flame_mat
		flame.position=Vector3(0,.58,.04)
		flame.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		lamp.add_child(flame)
		var light:=OmniLight3D.new()
		light.name="WarmOilLight"
		light.position=Vector3(0,.65,.15)
		light.light_color=Color("ffd09a")
		light.light_energy=4.5
		light.omni_range=15
		light.omni_attenuation=1.25
		light.light_specular=.15
		light.shadow_enabled=false
		light.distance_fade_enabled=true
		light.distance_fade_begin=35
		light.distance_fade_length=15
		lamp.add_child(light)
