"""Three portable skinned LODs sharing one skeleton and the polished 4K maps."""
import bpy,sys,json,shutil
import numpy as np
from pathlib import Path
root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar'
out=base/'game';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(base/'polished/ash-tusk-boar-polished.blend'))
scene=bpy.context.scene;scene.frame_set(40);arm=bpy.data.objects['BoarRig']
for bone in arm.pose.bones:bone.matrix_basis.identity()
original=bpy.data.collections['ASSET · Gameplay boar'];source=[o for o in original.objects if o.type=='MESH']
collections=[original];levels=[source];counts=[]

def reduced_coat(ob,step,mane_step):
 old=ob.data;names=[g.name for g in ob.vertex_groups]
 points=np.empty(len(old.vertices)*3,dtype=np.float32);old.vertices.foreach_get('co',points);points=points.reshape((-1,3))
 colors=np.empty(len(old.vertices)*4,dtype=np.float32);old.color_attributes['BristleTint'].data.foreach_get('color',colors);colors=colors.reshape((-1,4))
 # Retain whole spatially distributed strands, including root weights; never
 # collapse isolated fur vertices into detached scraps.
 chosen=list(range(0,4500,step))+list(range(4500,5900,mane_step))
 verts=[];faces=[];tints=[];weights=[]
 for strand in chosen:
  offset=strand*9;start=len(verts)
  for i in range(9):
   verts.append(points[offset+i]);tints.append(colors[offset+i]);weights.append([(g.group,g.weight) for g in old.vertices[offset+i].groups])
  for ring in range(2):
   for j in range(3):a=start+ring*3+j;b=start+ring*3+(j+1)%3;faces.append((a,b,b+3,a+3))
 mesh=bpy.data.meshes.new('Whole strand distance coat');mesh.from_pydata(verts,[],faces);mesh.materials.append(old.materials[0]);mesh.update();ob.data=mesh
 for face in mesh.polygons:face.use_smooth=True
 attr=mesh.color_attributes.new(name='BristleTint',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',np.array(tints,dtype=np.float32).ravel())
 ob.vertex_groups.clear()
 for name in names:ob.vertex_groups.new(name=name)
 buckets={}
 for i,groups in enumerate(weights):
  for g,w in groups:buckets.setdefault((g,w),[]).append(i)
 for (g,w),indices in buckets.items():ob.vertex_groups[g].add(indices,w,'REPLACE')
 return len(chosen)

for level,ratio,step,mane_step in [(1,.65,3,2),(2,.30,8,4)]:
 col=bpy.data.collections.new('LOD'+str(level)+' · game mesh');scene.collection.children.link(col);collections.append(col);parts=[]
 for original_ob in source:
  ob=original_ob.copy();ob.data=original_ob.data.copy();col.objects.link(ob);parts.append(ob)
  if original_ob.name=='Clean directional fur':reduced_coat(ob,step,mane_step)
  elif len(ob.data.polygons)>90:
   bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
   mod=ob.modifiers.new('Distance surface reduction','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True
   while ob.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
   bpy.ops.object.modifier_apply(modifier=mod.name)
 levels.append(parts)

# Export each level by material, keeping material/image references shared.
temporary=bpy.data.collections.new('TEMP · portable game LODs');scene.collection.children.link(temporary);selected=[]
for level,parts in enumerate(levels):
 triangles=0;groups={}
 for ob in parts:
  ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
  copy=ob.copy();copy.data=ob.data.copy();temporary.objects.link(copy);groups.setdefault(copy.data.materials[0].name,[]).append(copy)
 counts.append(triangles)
 for index,objects in enumerate(groups.values()):
  bpy.ops.object.select_all(action='DESELECT')
  for ob in objects:ob.select_set(True)
  bpy.context.view_layer.objects.active=objects[0]
  if len(objects)>1:bpy.ops.object.join()
  ob=bpy.context.object;ob.name=f'LOD{level}_Part{index}';selected.append(ob)
assert counts[0]==104660 and counts[0]>counts[1]>counts[2]
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
for ob in selected:ob.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(out/'ash-tusk-boar-game.glb'),export_format='GLB',use_selection=True,export_apply=False,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_def_bones=False,export_all_influences=False)
for ob in list(temporary.objects):bpy.data.objects.remove(ob,do_unlink=True)
bpy.data.collections.remove(temporary)
for col in collections[1:]:col.hide_viewport=True;col.hide_render=True
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-game.blend'))
shutil.copytree(base/'polished/textures',out/'textures',dirs_exist_ok=True)
report={'triangles':counts,'mesh_groups_per_level':5,'bones':21,'clips':['Idle','Walk','TuskAttack'],'maps':'Three shared polished 4K maps','lod0':'Unchanged polished gameplay geometry','lower_lods':'Decimated surfaces and whole-strand fur sampling; retained UVs and root weights','authored_walk_speed_mps':.375,'game_scale':.65,'collision':'Primitive capsule authored in Godot; no triangle-mesh physics','topology':'Existing triangulated/decimated game meshes; not a new hand-retopologized quad cage'}
(out/'game-report.json').write_text(json.dumps(report,indent=2));print('GAME PREPARED',json.dumps(report),flush=True)
