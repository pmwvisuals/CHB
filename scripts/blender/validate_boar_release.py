"""Independently open the buyer source and round-trip every FBX detail level."""
import bpy,sys,json,hashlib
import numpy as np
from pathlib import Path
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar/release'
bpy.ops.wm.open_mainfile(filepath=str(out/'Blender/AshTuskBoar.blend'))
scene=bpy.context.scene;meshes=[o for o in scene.objects if o.type=='MESH'];arms=[o for o in scene.objects if o.type=='ARMATURE']
assert len(meshes)==15 and len(arms)==1 and len(scene.objects)==16
assert len(arms[0].data.bones)==21
assert all(o.type not in ['CAMERA','LIGHT'] for o in scene.objects)
assert len(bpy.data.actions)==3
for level in range(3):
 col=bpy.data.collections['Boar_LOD'+str(level)];assert col.hide_render==(level>0) and col.hide_viewport==(level>0)
assert all(np.allclose(np.array(o.matrix_world),np.eye(4)) for o in meshes+arms)
packed=[]
for image in bpy.data.images:
 if not image.name.startswith('Boar_'):continue
 assert image.packed_file and tuple(image.size)==(4096,4096)
 assert image.filepath.replace(chr(92),'/').startswith('//../Textures/')
 assert Path(bpy.path.abspath(image.filepath)).resolve().is_relative_to(out.resolve())
 file=out/'Textures'/(image.name+'.png')
 assert hashlib.sha256(bytes(image.packed_file.data)).hexdigest()==hashlib.sha256(file.read_bytes()).hexdigest()
 packed.append(image.name)
assert len(packed)==3
report={'clean_source':{'objects':16,'mesh_objects':15,'skeletons':1,'bones':21,'actions':3,'default_visible_lod':0,'identity_object_transforms':True,'studio_removed':True,'relative_paths':True,'packed_textures_match_external':packed},'fbx':[]}
for level,expected in enumerate([104660,48380,21096]):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.fbx(filepath=str(out/('Models/Boar_LOD%d.fbx'%level)))
 scene=bpy.context.scene;arms=[o for o in scene.objects if o.type=='ARMATURE'];meshes=[o for o in scene.objects if o.type=='MESH'];assert len(arms)==1 and len(meshes)==5
 arm=arms[0];assert len(arm.data.bones)==21;assert len(bpy.data.actions)==3
 count=0
 for ob in meshes:ob.data.calc_loop_triangles();count+=len(ob.data.loop_triangles)
 assert count==expected
 clips=[]
 for name in ['Idle','Walk','TuskAttack']:
  action=next(a for a in bpy.data.actions if name in a.name)
  if not arm.animation_data:arm.animation_data_create()
  for track in arm.animation_data.nla_tracks:track.mute=True
  arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
  start,end=action.frame_range
  for t in [0,.5,1.]:
   scene.frame_set(round(start+(end-start)*t));bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
   lo=np.full(3,np.inf);hi=-lo
   for ob in meshes:
    ev=ob.evaluated_get(deps);data=ev.to_mesh();p=np.array([tuple(ev.matrix_world@v.co) for v in data.vertices]);assert np.isfinite(p).all();lo=np.minimum(lo,p.min(0));hi=np.maximum(hi,p.max(0));ev.to_mesh_clear()
   assert lo[2]>-.06 and np.all(hi-lo<7)
  clips.append(name)
 report['fbx'].append({'lod':level,'triangles':count,'meshes':5,'bones':21,'clips':clips,'deformed_poses':9})
 print('FBX RELEASE VALIDATED',level,count,flush=True)
(out/'Reports/source-fbx-validation.json').write_text(json.dumps(report,indent=2))
print('CLEAN SOURCE AND ALL FBX LEVELS PASS',flush=True)
