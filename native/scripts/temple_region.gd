extends "res://scripts/world.gd"

const THEMES={
	"zeus":{"name":"ZEUS","title":"THE THUNDER HALL","stone":"b7b09f","ivory":"d8d1bd","accent":"4b5963","metal":"8e7b50","light":"ded8c8","offering":"DEDICATIONS TO THE SKY"},
	"ares":{"name":"ARES","title":"THE HALL OF VALOR","stone":"8d8577","ivory":"c8baa0","accent":"613e37","metal":"90704a","light":"ddd0b9","offering":"COURAGE · DISCIPLINE · HONOR"},
	"poseidon":{"name":"POSEIDON","title":"THE HALL OF TIDES","stone":"b2b7aa","ivory":"dad5c2","accent":"365b5b","metal":"8c7954","light":"ccd6cb","offering":"OFFERINGS OF THE SEAFARERS"}
}
var temple:=true
var theme:Dictionary
var temple_id:="poseidon"
var surfaces:Dictionary={}
var palette:Dictionary={}
var solids:StaticBody3D
var flames:Array[MeshInstance3D]=[]

func prepare():
	Session.ensure_adventure()
	temple_id=Session.data.get("temple","poseidon")
	if not THEMES.has(temple_id):temple_id="poseidon"
	theme=THEMES[temple_id]
	build_sky()
	environment.fog_enabled=false
	environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color=Color(theme.light)
	environment.ambient_light_energy=.58 if temple_id=="ares" else .65
	environment.tonemap_exposure=.9
	key_light.light_energy=.48
	key_light.rotation_degrees=Vector3(-55,-20,0)
	solids=StaticBody3D.new()
	solids.name="TempleCollision"
	add_child(solids)
	for id in ["stone","ivory","accent","metal","timber","clay"]:
		var mat:Material
		if id in ["timber","clay"]:
			mat=material("423c30" if id=="timber" else "885e44",.94)
		elif id=="metal":
			mat=material(theme[id],.45)
			mat.metallic=.55
		else:
			mat=ShaderMaterial.new()
			mat.shader=preload("res://shaders/temple_stone.gdshader")
			mat.set_shader_parameter("stone_tint",Color(theme[id]))
			mat.set_shader_parameter("marble",id=="ivory")
		palette[id]=mat
		var tool:=SurfaceTool.new()
		tool.begin(Mesh.PRIMITIVE_TRIANGLES)
		surfaces[id]=tool
	build_shell()
	build_sanctum()
	if temple_id=="poseidon":build_tides()
	elif temple_id=="zeus":build_thunder()
	else:build_valor()
	for id in surfaces:
		var part:=MeshInstance3D.new()
		part.name="TempleArchitecture_"+id
		part.mesh=surfaces[id].commit()
		part.material_override=palette[id]
		add_child(part)
	surfaces.clear()
	player=preload("res://scripts/player.gd").new()
	player.world=self
	add_child(player)
	player.position=spawn_position()
	player.camera.far=90
	var hud=preload("res://scripts/hud.gd").new()
	hud.world=self
	add_child(hud)
	player.hud=hud
	Session.message=theme.title+" · Walk the sacred hall. The entrance returns you to camp."
	await get_tree().process_frame

func height(_x:float,_z:float) -> float:return 0.0
func spawn_position() -> Vector3:return Vector3(0,.06,17)
func inside_bounds(at:Vector3) -> bool:return absf(at.x)<9.5 and at.z> -21 and at.z<23
func near_gate():return is_instance_valid(player) and player.position.z>17.8
func interaction_text() -> String:return "Return to camp" if near_gate() else ""
func interact():
	if near_gate():Session.change_zone("camp")
func _process(delta):
	if Session.paused:return
	autosave+=delta
	for i in range(flames.size()):flames[i].scale.y=1.0+.12*sin(autosave*5+i*2)
	Session.data.health=minf(Session.RULES.max_health(Session.data),Session.data.health+delta*4)
	if autosave>20:
		autosave=0
		Session.save_game(player)

func piece(mesh:Mesh,at:Vector3,kind:String,rotation:Vector3=Vector3.ZERO):
	var basis:=Basis.from_euler(rotation)
	var transform:=Transform3D(basis,at)
	surfaces[kind].append_from(mesh,0,transform)

func box(at:Vector3,size:Vector3,kind:String,solid:bool=false):
	var mesh:=BoxMesh.new()
	mesh.size=size
	piece(mesh,at,kind)
	if solid:
		var shape:=CollisionShape3D.new()
		var form:=BoxShape3D.new()
		form.size=size
		shape.shape=form
		shape.position=at
		solids.add_child(shape)

func column(at:Vector3,radius:float,tall:float,kind:String,top:float=-1,rotation:Vector3=Vector3.ZERO):
	var mesh:=CylinderMesh.new()
	mesh.bottom_radius=radius
	mesh.top_radius=radius if top<0 else top
	mesh.height=tall
	mesh.radial_segments=24
	piece(mesh,at,kind,rotation)

func ring(at:Vector3,radius:float,tube:float,kind:String,rotation:Vector3=Vector3.ZERO):
	var mesh:=TorusMesh.new()
	mesh.inner_radius=radius-tube
	mesh.outer_radius=radius+tube
	mesh.rings=32
	mesh.ring_segments=8
	piece(mesh,at,kind,rotation)

func rod(a:Vector3,b:Vector3,radius:float,kind:String):
	var mesh:=CylinderMesh.new()
	mesh.bottom_radius=radius
	mesh.top_radius=radius
	mesh.height=a.distance_to(b)
	mesh.radial_segments=8
	surfaces[kind].append_from(mesh,0,Transform3D(Basis(Quaternion(Vector3.UP,(b-a).normalized())),(a+b)*.5))

func inscription(words:String,at:Vector3,width:float,size:float=1.0):
	var label:=Label3D.new()
	label.text=words
	label.position=at
	label.modulate=Color("d8c89d")
	preload("res://scripts/inscription.gd").fit(label,width,size)
	add_child(label)

func build_shell():
	box(Vector3(0,-.25,0),Vector3(19,.5,44),"stone",true)
	# Staggered limestone paving; marble is reserved for the altar and trims.
	for row in range(-13,14):
		for col in range(-5,6):
			var x:float=col*1.7+(.8 if row%2 else 0)
			if absf(x)>8.8:continue
			box(Vector3(x,.014,row*1.55),Vector3(1.67,.028,1.52),"stone")
	for x in [-9.3,9.3]:
		box(Vector3(x,5.5,0),Vector3(.5,11,42),"stone",true)
		box(Vector3(x*.97,1.1,0),Vector3(.18,2.2,42),"accent")
		for y in [.18,2.25,9.65,10.6]:box(Vector3(x*.96,y,0),Vector3(.18,.13,42),"metal")
	box(Vector3(0,5.5,-21),Vector3(19,11,.5),"stone",true)
	for x in [-6.1,6.1]:
		box(Vector3(x,5.5,21),Vector3(6.7,11,.5),"stone",true)
		for z in [-16,-10,-4,2,8,14]:
			box(Vector3(x,.16,z),Vector3(1.5,.32,1.5),"ivory",true)
			column(Vector3(x,.47,z),.66,.3,"stone")
			column(Vector3(x,4.7,z),.52,8.2,"stone",.43)
			for flute in range(16):
				var angle:float=flute*TAU/16
				column(Vector3(x+cos(angle)*.47,4.7,z+sin(angle)*.47),.024,7.8,"stone")
			box(Vector3(x,8.95,z),Vector3(1.5,.3,1.5),"ivory")
			box(Vector3(x,9.18,z),Vector3(1.65,.16,1.65),"metal")
			var collision:=CollisionShape3D.new()
			var shape:=CylinderShape3D.new()
			shape.radius=.66
			shape.height=9.1
			collision.shape=shape
			collision.position=Vector3(x,4.55,z)
			solids.add_child(collision)
		box(Vector3(x,9.55,-1),Vector3(1.7,.6,36),"stone")
	box(Vector3(0,9.2,21),Vector3(5,3.6,.5),"stone",true)
	box(Vector3(0,11.1,0),Vector3(19,.3,42),"timber")
	for z in range(-18,20,4):
		box(Vector3(0,10.7,z),Vector3(19,.4,.2),"timber")
		for x in [-7.5,-4.5,-1.5,1.5,4.5,7.5]:
			box(Vector3(x,10.91,z+1.8),Vector3(2.65,.13,3.3),"timber")
			ring(Vector3(x,10.79,z+1.8),.29,.045,"metal")
	for x in [-4.1,4.1]:
		box(Vector3(x,.03,0),Vector3(.075,.025,37),"metal")
		for z in range(-18,19):
			box(Vector3(x,.03,z),Vector3(.42,.025,.08),"accent")
			box(Vector3(x+.18,.03,z+.18),Vector3(.08,.025,.42),"accent")
	inscription(theme.title,Vector3(0,9.9,-20.67),11,.7)
	inscription("RETURN TO SANCTUARY",Vector3(0,6.4,20.65),4,.4)
	# Open doorway with a closed forecourt: interaction loads camp, never a void.
	box(Vector3(0,2.5,22),Vector3(5,5,.3),"accent",true)
	for x in [-2.4,2.4]:box(Vector3(x,3.5,20.7),Vector3(.2,7,.25),"metal")

func build_sanctum():
	# Central altar, offering table and empty rear dais; no cult sculpture.
	box(Vector3(0,.13,-14.5),Vector3(6.6,.26,4.5),"stone",true)
	box(Vector3(0,.34,-14.8),Vector3(5.8,.16,3.8),"ivory",true)
	box(Vector3(0,.7,-9),Vector3(3.4,1.4,1.6),"accent",true)
	box(Vector3(0,1.47,-9),Vector3(3.9,.14,2),"ivory")
	box(Vector3(0,1.56,-9),Vector3(3.2,.035,1.4),"metal")
	inscription(theme.offering,Vector3(0,.85,-8.17),3,.28)
	for x in [-.9,.9]:vase(Vector3(x,1.6,-9),.6)
	column(Vector3(0,1.65,-9),.3,.08,"metal")
	for side in [-1,1]:
		for z in [-15,-3,11]:lamp(Vector3(side*4.5,0,z))
	for x in [-7.8,7.8]:
		for z in [-12,0,12]:
			box(Vector3(x,.55,z),Vector3(1.2,1.1,1.5),"accent",true)
			box(Vector3(x,1.15,z),Vector3(1.4,.12,1.7),"ivory")
			vase(Vector3(x,1.22,z),1.0)
	var fill:=OmniLight3D.new()
	fill.position=Vector3(0,6,-10)
	fill.light_color=Color(theme.light)
	fill.light_energy=2.0
	fill.omni_range=20
	fill.shadow_enabled=false
	add_child(fill)

func vase(at:Vector3,size:float):
	column(at+Vector3.UP*size*.10,.24*size,.2*size,"clay",.34*size)
	column(at+Vector3.UP*size*.40,.34*size,.4*size,"clay",.23*size)
	column(at+Vector3.UP*size*.68,.11*size,.16*size,"clay")
	ring(at+Vector3.UP*size*.77,.14*size,.025*size,"metal")

func lamp(at:Vector3):
	column(at+Vector3.UP*.12,.38,.24,"metal")
	column(at+Vector3.UP*1.15,.08,2.1,"metal")
	column(at+Vector3.UP*2.25,.3,.2,"metal",.4)
	var flame:=MeshInstance3D.new()
	var mesh:=SphereMesh.new()
	mesh.radius=.13
	mesh.height=.6
	flame.mesh=mesh
	flame.position=at+Vector3.UP*2.6
	var mat:=StandardMaterial3D.new()
	mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color=Color("ffd08a")
	flame.material_override=mat
	flame.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(flame)
	flames.append(flame)
	var light:=OmniLight3D.new()
	light.position=at+Vector3.UP*2.8
	light.light_color=Color("ffd29c")
	light.light_energy=1.5
	light.omni_range=8
	light.shadow_enabled=false
	add_child(light)

func build_tides():
	for side in [-1,1]:
		var x:float=side*7.8
		for z in [-6,6]:
			box(Vector3(x,.18,z),Vector3(1.65,.36,7.5),"stone",true)
			var water:=MeshInstance3D.new()
			var plane:=PlaneMesh.new()
			plane.size=Vector2(1.38,7.2)
			water.mesh=plane
			water.position=Vector3(x,.37,z)
			var mat:=ShaderMaterial.new()
			mat.shader=preload("res://shaders/lake.gdshader")
			water.material_override=mat
			add_child(water)
		for z in range(-17,18,3):
			for i in range(10):
				var a:float=i*PI/9
				rod(Vector3(side*9.0,4+sin(a)*.27,z+a*.5),Vector3(side*9.0,4+sin(a+.35)*.27,z+(a+.35)*.5),.035,"metal")
	# Three tall trident reliefs, architectural emblems rather than statues.
	for x in [-3.2,0,3.2]:
		rod(Vector3(x,2,-20.6),Vector3(x,7.8,-20.6),.065,"metal")
		rod(Vector3(x-.65,6.4,-20.6),Vector3(x+.65,6.4,-20.6),.06,"metal")
		for dx in [-.65,0,.65]:rod(Vector3(x+dx,6.4,-20.6),Vector3(x+dx,7.8 if dx==0 else 7.3,-20.6),.06,"metal")
	inscription("THE SEA REMEMBERS",Vector3(0,1.15,-14),4,.3)

func build_thunder():
	for x in [-3.5,0,3.5]:
		box(Vector3(x,5.4,-20.65),Vector3(2.5,7.4,.12),"stone")
		var points=[Vector3(x+.35,8.2,-20.5),Vector3(x-.65,5.4,-20.5),Vector3(x+.5,5.4,-20.5),Vector3(x-.4,2.8,-20.5)]
		for i in range(3):rod(points[i],points[i+1],.11,"metal")
	for x in [-8.95,8.95]:
		for z in [-12,0,12]:
			box(Vector3(x,5.6,z),Vector3(.08,4.7,2.4),"accent")
			for y in [3.3,7.9]:box(Vector3(x,y,z),Vector3(.12,.12,2.6),"metal")
	# Radial floor compass beneath the open central processional aisle.
	for r in [1.7,2.0,2.8]:ring(Vector3(0,.04,3),r,.035,"metal")
	for i in range(16):
		var a:float=i*TAU/16
		rod(Vector3(sin(a)*1.1,.05,3+cos(a)*1.1),Vector3(sin(a)*2.6,.05,3+cos(a)*2.6),.035,"metal")
	inscription("HONOR THE SKY",Vector3(0,1.15,-14),4,.3)

func build_valor():
	for side in [-1,1]:
		for z in [-15,-7,1,9]:
			box(Vector3(side*8.95,5.8,z),Vector3(.1,5.7,2),"accent")
			box(Vector3(side*8.85,8.7,z),Vector3(.18,.12,2.4),"metal")
			# Circular bronze shield with a raised boss, mounted to the side wall.
			column(Vector3(side*8.78,5.4,z),.65,.12,"metal",-1,Vector3(0,0,PI/2))
			column(Vector3(side*8.66,5.4,z),.18,.17,"metal",-1,Vector3(0,0,PI/2))
	for x in [-3.2,3.2]:
		box(Vector3(x,5.4,-20.6),Vector3(2.4,7.2,.12),"accent")
		rod(Vector3(x-.7,3,-20.4),Vector3(x+.7,8,-20.4),.07,"metal")
		rod(Vector3(x+.7,3,-20.4),Vector3(x-.7,8,-20.4),.07,"metal")
	for z in range(-16,18,2):box(Vector3(0,.03,z),Vector3(2.4,.025,1.92),"accent")
	for x in [-2.8,2.8]:
		column(Vector3(x,.7,-15),.6,1.4,"stone")
		ring(Vector3(x,1.45,-15),.64,.08,"metal")
	inscription("STRENGTH WITH DISCIPLINE",Vector3(0,3,-20.5),5,.4)
