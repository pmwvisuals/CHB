"""Small reversible visual pass on the current gameplay boar; no new geometry."""
import bpy,sys,json,shutil,math
import numpy as np
from pathlib import Path
from mathutils import Vector

root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar'
out=base/'polished';out.mkdir(exist_ok=True);textures=out/'textures';textures.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(base/'runtime/ash-tusk-boar-runtime.blend'))
scene=bpy.context.scene;scene.frame_set(40);arm=bpy.data.objects['BoarRig']
for pb in arm.pose.bones:pb.matrix_basis.identity()
asset=bpy.data.collections['ASSET · Gameplay boar'];parts=[o for o in asset.objects if o.type=='MESH']
counts={o.name:len(o.data.vertices) for o in parts}
def coords(ob):
 p=np.empty(len(ob.data.vertices)*3,dtype=np.float32);ob.data.vertices.foreach_get('co',p);return p.reshape((-1,3))

# Reduce the button-nose projection slightly; its carved holes and dark inserts
# receive the identical deformation so they remain aligned.
nose=bpy.data.objects['Nose · leathery nasal disc'];p=coords(nose);centre=(p.min(axis=0)+p.max(axis=0))*.5
for ob in parts:
 if ob.name.startswith(('Nose','Nostril interior')):
  p=coords(ob);p[:,1]=centre[1]+(p[:,1]-centre[1])*.86
  ob.data.vertices.foreach_set('co',p.ravel());ob.data.update()
 if ob.name.startswith('Upper orbital eyelid'):
  p=coords(ob);p[:,2]-=.014;ob.data.vertices.foreach_set('co',p.ravel());ob.data.update()

# Gentle atlas variation remains fully portable: edit pixels, not a procedural
# Blender-only material graph. Retain 4K resolution and the original UV layout.
for kind in ['BaseColor','Roughness','Normal']:
 image=bpy.data.images.get('CleanBoar_'+kind);assert image is not None
 image=image.copy();image.name='PolishedBoar_'+kind
 if kind=='BaseColor':
  w,h=image.size;data=np.empty(w*h*4,dtype=np.float32);image.pixels.foreach_get(data);data=data.reshape((h,w,4))
  yy,xx=np.mgrid[0:h,0:w].astype(np.float32);grain=np.sin(xx*.019+np.sin(yy*.013))*np.sin(yy*.023+xx*.007)
  dark=data[:,:,:3].mean(axis=2)<.20
  tone=np.where(dark,1+.045*grain,1+.018*grain)
  data[:,:,:3]*=tone[:,:,None]
  data[:,:,0]*=np.where(dark,1.035,1.0);data[:,:,2]*=np.where(dark,.97,.975)
  image.pixels.foreach_set(np.clip(data,0,1).ravel())
 image.filepath_raw=str(textures/(image.name+'.png'));image.file_format='PNG';image.save();image.pack()
 for mat in {m for ob in parts for m in ob.data.materials}:
  for node in mat.node_tree.nodes:
   if node.type=='TEX_IMAGE' and node.image and node.image.name=='CleanBoar_'+kind:node.image=image

# A matte coat and modest root-to-tip tint break up the wiry highlights.
fur=bpy.data.objects['Clean directional fur'];attribute=fur.data.color_attributes['BristleTint']
colors=np.empty(len(attribute.data)*4,dtype=np.float32);attribute.data.foreach_get('color',colors);colors=colors.reshape((-1,4))
p=coords(fur);shade=.94+.06*np.sin(p[:,1]*7+p[:,2]*4)*np.sin(p[:,0]*9)
colors[:,:3]*=shade[:,None];attribute.data.foreach_set('color',colors.ravel())
fur.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.9
for mat in {m for ob in parts for m in ob.data.materials}:
 for node in mat.node_tree.nodes:
  if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=1.12

assert all(len(o.data.vertices)==counts[o.name] for o in parts)
assert len(arm.data.bones)==21
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-polished.blend'))
sys.path.insert(0,str(root/'scripts/blender'));from export_rigged_boar import export_rig
groups=export_rig(scene,parts,arm,out,'ash-tusk-boar-polished');assert groups==5
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.render.resolution_x=1024;scene.render.resolution_y=768;scene.render.resolution_percentage=100
for label,frame,eye,target in [('rest',40,(9,-6.5,3.4),(0,-.3,1.55)),('head',40,(4.6,-5,2.7),(0,-1.85,1.72)),('strike',66,(9,-6.5,3.4),(0,-.3,1.55))]:
 scene.frame_set(frame);scene.camera.location=eye;scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(out/(label+'.png'));bpy.ops.render.render(write_still=True)
report=json.loads((base/'runtime/rig-quality-report.json').read_text())
report['visual_polish']=['Slightly flatter nasal disc with matching nostril inserts','Subtle lowered upper eyelids','Gentle charcoal/ivory atlas variation','More matte, varied coat','Slightly stronger existing normal detail']
report['source']='Unmodified runtime model; all original detailed/runtime files retained'
report['maps']='Packed and external 4K PolishedBoar maps; original UVs retained'
(out/'rig-quality-report.json').write_text(json.dumps(report,indent=2))
print('SMALL POLISH COMPLETE: same triangles, mesh groups, bones, weights and animation tracks',flush=True)
