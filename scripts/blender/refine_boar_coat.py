"""Refine the existing skinned boar's groom and forehead; preserve the source."""
import bpy,sys,json,math
import numpy as np
from pathlib import Path
from mathutils import Vector

root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'refined';out.mkdir(exist_ok=True);(out/'textures').mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(base/'polished/ash-tusk-boar-polished.blend'))
scene=bpy.context.scene;scene.frame_set(40);arm=bpy.data.objects['BoarRig']
for b in arm.pose.bones:b.matrix_basis.identity()
parts=[o for o in bpy.data.collections['ASSET · Gameplay boar'].objects if o.type=='MESH']
before={o.name:len(o.data.vertices) for o in parts}
def points(ob):
 a=np.empty(len(ob.data.vertices)*3,np.float32);ob.data.vertices.foreach_get('co',a);return a.reshape(-1,3)
def forehead(p):
 q=p.copy();x,y,z=p.T
 mask=np.exp(-((y+1.72)/.44)**2)*np.clip((z-1.98)/.45,0,1)
 q[:,0]*=1-.035*mask
 # A shallow, continuous brow plane rather than separate raised strips.
 q[:,2]+=.025*np.exp(-((y+1.92)/.18)**2-((z-2.02)/.15)**2)*np.clip(np.abs(x)/.55,0,1)
 return q
body=bpy.data.objects['Continuous skin · anatomy refinement']
p=forehead(points(body));body.data.vertices.foreach_set('co',p.ravel());body.data.update()
fur=bpy.data.objects['Clean directional fur'];p=points(fur).reshape(-1,3,3,3);centres=p.mean(2);rng=np.random.default_rng(243891)
new=p.copy();stats=[]
for i in range(len(p)):
 rootpoint=centres[i,0];mane=i>=4500;face=rootpoint[1]<-1.65;low=rootpoint[2]<.85
 length_scale=(.82+rng.random()*.38) if mane else (1.05 if face else 1.18 if low else 1.65)
 width_scale=.85 if mane else 1.22 if face else 1.5
 root_shift=forehead(rootpoint[None,:])[0]-rootpoint
 for ring in range(3):
  t=ring/2;centre=rootpoint+(centres[i,ring]-rootpoint)*length_scale
  # Small lateral deviations remove parallel wire-like mane rows.
  centre[0]+=math.sin(i*1.73)*(.012 if mane else .004)*t*t
  radial=p[i,ring]-centres[i,ring]
  taper=[1.,.70,.10][ring] if mane else [1.,.76,.13][ring]
  new[i,ring]=centre+radial*width_scale*taper+root_shift
fur.data.vertices.foreach_set('co',new.ravel());fur.data.update()
attr=fur.data.color_attributes['BristleTint'];colors=np.empty(len(attr.data)*4,np.float32);attr.data.foreach_get('color',colors);colors=colors.reshape(-1,3,3,4)
for ring in range(3):
 # Dark embedded roots, charcoal tips; no bright orange mane edging.
 colors[:,ring,:,:3]*=[.74,.9,.98][ring]
attr.data.foreach_set('color',colors.ravel())
fur.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.86

for kind in ['BaseColor','Normal','Roughness']:
 image=bpy.data.images['PolishedBoar_'+kind];copy=image.copy();copy.name='RefinedBoar_'+kind
 if kind=='BaseColor':
  w,h=copy.size;a=np.empty(w*h*4,np.float32);copy.pixels.foreach_get(a);a=a.reshape(h,w,4)
  yy,xx=np.mgrid[:h,:w].astype(np.float32)
  grain=np.sin(xx*.37+np.sin(yy*.19)*2)*np.sin(yy*.43+xx*.07)
  broad=np.sin(xx*.011+np.sin(yy*.009))*np.sin(yy*.017)
  dark=a[:,:,:3].mean(-1)<.20
  a[:,:,:3]*=(1+np.where(dark,.055*grain+.065*broad,.012*grain))[:,:,None]
  copy.pixels.foreach_set(np.clip(a,0,1).ravel())
 copy.filepath_raw=str(out/'textures'/(copy.name+'.png'));copy.file_format='PNG';copy.save();copy.unpack(method='REMOVE');copy.reload();copy.pack()
 for mat in {m for ob in parts for m in ob.data.materials}:
  for node in mat.node_tree.nodes:
   if node.type=='TEX_IMAGE' and node.image==image:node.image=copy

assert all(len(o.data.vertices)==before[o.name] for o in parts)
assert len(arm.data.bones)==21
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-refined.blend'))
sys.path.insert(0,str(root/'scripts/blender'));from export_rigged_boar import export_rig
assert export_rig(scene,parts,arm,out,'ash-tusk-boar-refined')==5
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=1024;scene.render.resolution_y=768;scene.render.resolution_percentage=100
for name,frame,eye,target in [('rest',40,(9,-6.5,3.4),(0,-.3,1.55)),('head',40,(4.6,-5,2.7),(0,-1.85,1.72)),('strike',66,(9,-6.5,3.4),(0,-.3,1.55))]:
 scene.frame_set(frame);scene.camera.location=eye;scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
(out/'refinement-report.json').write_text(json.dumps({'source':'polished/ash-tusk-boar-polished.blend','triangles':104660,'bones':21,'materials':5,'groom_strands':5900,'body_coat_length_multiplier':1.65,'mane':'Irregular lengths, narrower tips, dark embedded roots','head':'Shallow forehead taper and continuous brow plane; jaw and tusk roots unchanged','maps':'Three shared original 4K maps; restrained base-color grain revision','animation':'Existing Idle, Walk, TuskAttack retained; validation required'},indent=2))
print('REFINED BOAR EXPORTED',flush=True)
