from pathlib import Path
import shutil
root=Path(__file__).resolve().parent.parent
package=root/'assets-source/creatures/ash-tusk-boar/release';demo=package/'GodotDemo';(demo/'assets').mkdir(parents=True,exist_ok=True)
shutil.copy2(package/'Models/Boar_AllLODs.glb',demo/'assets/boar.glb')
(demo/'project.godot').write_text('''config_version=5
[application]
config/name="Ash-Tusk Boar Asset Preview"
run/main_scene="res://preview.tscn"
config/features=PackedStringArray("4.7", "GL Compatibility")
[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"
[rendering]
renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
''')
(demo/'preview.tscn').write_text('''[gd_scene load_steps=2 format=3]
[ext_resource type="Script" path="res://preview.gd" id="1"]
[node name="BoarPreview" type="Node3D"]
script = ExtResource("1")
''')
(demo/'boar.gd').write_text('''extends Node3D
var model:Node3D
var animation:AnimationPlayer
var clips := {}
var levels:Array = [[],[],[]]
var current_lod := 0
func _ready():
 model=preload("res://assets/boar.glb").instantiate()
 add_child(model)
 var materials := {}
 for mesh in model.find_children("*","MeshInstance3D",true,false):
  for i in range(3):
   if String(mesh.name).begins_with("LOD%d_"%i):levels[i].append(mesh)
  for surface in range(mesh.mesh.get_surface_count()):
   var original=mesh.get_active_material(surface)
   if not original is BaseMaterial3D:continue
   var colors=mesh.mesh.surface_get_arrays(surface)[Mesh.ARRAY_COLOR]
   var colored:bool=colors!=null and colors.size()>0
   var key=str(original.get_instance_id())+str(colored)
   if not materials.has(key):
    var material=original.duplicate()
    material.vertex_color_use_as_albedo=colored
    material.vertex_color_is_srgb=false
    materials[key]=material
   mesh.mesh.surface_set_material(surface,materials[key])
 animation=model.find_children("*","AnimationPlayer",true,false)[0]
 for clip in animation.get_animation_list():
  for name in ["Idle","Walk","TuskAttack"]:
   if clip.ends_with(name):
    clips[name]=clip
    animation.get_animation(clip).loop_mode=Animation.LOOP_NONE if name=="TuskAttack" else Animation.LOOP_LINEAR
 select_lod(0)
 play("Idle")
func select_lod(level:int):
 current_lod=clampi(level,0,2)
 for i in range(3):
  for mesh in levels[i]:
   mesh.visible=i==current_lod
   mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if i==2 else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
func play(name:String):
 if clips.has(name):animation.play(clips[name],.12)
''')
(demo/'preview.gd').write_text('''extends Node3D
var boar
var camera:Camera3D
var angle := .68
var distance := 6.7
var dragging := false
func _ready():
 var environment_node=WorldEnvironment.new()
 var env=Environment.new()
 env.background_mode=Environment.BG_COLOR
 env.background_color=Color("20282b")
 env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
 env.ambient_light_color=Color("c4d2e0")
 env.ambient_light_energy=.62
 environment_node.environment=env
 add_child(environment_node)
 for item in [[Vector3(5,7,4),Color("fff0d8"),1.0],[Vector3(-4,4,-4),Color("a3bacb"),.6]]:
  var light=DirectionalLight3D.new()
  add_child(light)
  light.position=item[0]
  light.look_at(Vector3.ZERO)
  light.light_color=item[1]
  light.light_energy=item[2]
  light.shadow_enabled=item[2]> .9
 var floor_mesh=MeshInstance3D.new()
 var plane=PlaneMesh.new()
 plane.size=Vector2(50,50)
 floor_mesh.mesh=plane
 var mat=StandardMaterial3D.new()
 mat.albedo_color=Color("3b4140")
 mat.roughness=1
 floor_mesh.material_override=mat
 add_child(floor_mesh)
 boar=preload("res://boar.gd").new()
 add_child(boar)
 camera=Camera3D.new()
 add_child(camera)
 camera.current=true
 camera.fov=50
 var hud=CanvasLayer.new()
 add_child(hud)
 var label=Label.new()
 label.position=Vector2(24,20)
 label.text="ASH-TUSK BOAR  /  ORIGINAL GAME CREATURE\\n1 Idle   2 Walk   3 Tusk attack    Q/W/E Detail 0/1/2\\nDrag to orbit  /  Wheel to zoom"
 hud.add_child(label)
 update_camera()
func update_camera():
 camera.position=Vector3(sin(angle)*distance,2.7,cos(angle)*distance)
 camera.look_at(Vector3(0,1.4,0))
func _unhandled_input(event):
 if event is InputEventMouseButton:
  if event.button_index==MOUSE_BUTTON_LEFT:dragging=event.pressed
  if event.pressed and event.button_index==MOUSE_BUTTON_WHEEL_UP:distance=maxf(4.8,distance-.5)
  if event.pressed and event.button_index==MOUSE_BUTTON_WHEEL_DOWN:distance=minf(18,distance+.5)
 if event is InputEventMouseMotion and dragging:angle-=event.relative.x*.007
 if event is InputEventKey and event.pressed:
  var key=event.keycode
  if key==KEY_1:boar.play("Idle")
  if key==KEY_2:boar.play("Walk")
  if key==KEY_3:boar.play("TuskAttack")
  if key==KEY_Q:boar.select_lod(0)
  if key==KEY_W:boar.select_lod(1)
  if key==KEY_E:boar.select_lod(2)
 update_camera()
''')
(demo/'validate.gd').write_text('''extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
 print(("PASS: " if ok else "FAIL: ")+label)
 if not ok:failures+=1
func run():
 var preview=load("res://preview.tscn").instantiate()
 root.add_child(preview)
 var boar=preview.boar
 check(boar.levels.all(func(a):return a.size()==5),"Three complete detail levels")
 check(boar.clips.size()==3,"Three named animation clips")
 var counts:=[]
 var skeletons:={}
 for level in range(3):
  var triangles:=0
  for mesh in boar.levels[level]:
   skeletons[mesh.get_node(mesh.skeleton).get_instance_id()]=true
   for i in range(mesh.mesh.get_surface_count()):triangles+=mesh.mesh.surface_get_array_index_len(i)/3
  counts.append(triangles)
  boar.select_lod(level)
  check(boar.levels[level].all(func(m):return m.visible) and boar.levels[(level+1)%3].all(func(m):return not m.visible),"Exclusive LOD"+str(level))
 check(counts==[104660,48380,21096],"Triangle counts match the product specification")
 check(skeletons.size()==1,"One shared skeleton")
 boar.select_lod(0)
 boar.play("TuskAttack")
 boar.animation.advance(.65)
 var time:float=boar.animation.current_animation_position
 boar.select_lod(1)
 check(is_equal_approx(boar.animation.current_animation_position,time),"LOD switch preserves strike time")
 for name in ["Idle","Walk","TuskAttack"]:
  boar.play(name)
  boar.animation.advance(.2)
  check(boar.animation.is_playing(),name+" plays in the engine")
 for pair in [[KEY_1,"Idle"],[KEY_2,"Walk"],[KEY_3,"TuskAttack"]]:
  var key=InputEventKey.new()
  key.keycode=pair[0]
  key.pressed=true
  preview._unhandled_input(key)
  check(boar.animation.current_animation.ends_with(pair[1]),"Keyboard selects "+pair[1])
 for pair in [[KEY_Q,0],[KEY_W,1],[KEY_E,2]]:
  var key=InputEventKey.new()
  key.keycode=pair[0]
  key.pressed=true
  preview._unhandled_input(key)
  check(boar.current_lod==pair[1],"Keyboard selects detail "+str(pair[1]))
 var mouse=InputEventMouseButton.new()
 mouse.button_index=MOUSE_BUTTON_LEFT
 mouse.pressed=true
 preview._unhandled_input(mouse)
 var old_angle:float=preview.angle
 var drag=InputEventMouseMotion.new()
 drag.relative=Vector2(30,0)
 preview._unhandled_input(drag)
 check(not is_equal_approx(old_angle,preview.angle),"Mouse drag orbits the view")
 var old_distance:float=preview.distance
 mouse.button_index=MOUSE_BUTTON_WHEEL_UP
 preview._unhandled_input(mouse)
 check(preview.distance<old_distance,"Mouse wheel zooms the view")
 if DisplayServer.get_name()!="headless":
  boar.select_lod(0)
  boar.play("Idle")
  for i in range(50):await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://../Previews/Godot_LOD0.png")
  boar.select_lod(2)
  for i in range(5):await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://../Previews/Godot_LOD2.png")
 preview.queue_free()
 for i in range(4):await process_frame
 print("RELEASE DEMO CHECK: %d failure(s)"%failures)
 quit(0 if failures==0 else 1)
''')
print('Created independent Godot demonstration project')
