"""No armature: continuous skin uses vertex poses; details use object transforms.
Reuses the existing packed materials. Does not rebuild or rebake the static asset.
"""
import bpy,bmesh,sys,math,json,os,tempfile
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar'
tempfile.tempdir=str(out/'scratch');os.environ['TEMP']=os.environ['TMP']=tempfile.tempdir
bpy.ops.wm.open_mainfile(filepath=str(out/'ash-tusk-boar.blend'))
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=81
collection=bpy.data.collections['ASSET · Ash-Tusk Boar · static'];collection.name='ASSET · no-skeleton movement prototype'
objects=list(collection.objects);body=bpy.data.objects['01 · Continuous body head and legs']
def empty(name,location,parent=None):
 ob=bpy.data.objects.new(name,None);collection.objects.link(ob);ob.location=location;ob.parent=parent;return ob
motion=empty('CreatureMotion',(0,0,0));head=empty('HeadMotion',(0,-1.485,1.70),motion)
feet={name:empty(name,(0,0,0),motion) for name in ['Fore.L','Fore.R','Hind.L','Hind.R']}
bpy.context.view_layer.update()
def parent_keep(ob,parent):
 matrix=ob.matrix_world.copy();ob.parent=parent;ob.matrix_parent_inverse=parent.matrix_world.inverted();ob.matrix_world=matrix
# Split the dense fur only at the neck; each exported piece remains rigid.
fur=next(ob for ob in objects if ob.name.startswith('Guard hairs'))
for is_head in [True,False]:
 copy=fur.copy();copy.data=fur.data.copy();collection.objects.link(copy);copy.name='Head fur' if is_head else 'Body fur'
 bm=bmesh.new();bm.from_mesh(copy.data);remove=[v for v in bm.verts if ((fur.matrix_world@v.co).y < -1.60)!=is_head];bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(copy.data);bm.free();parent_keep(copy,head if is_head else motion)
objects.remove(fur);bpy.data.objects.remove(fur,do_unlink=True)
for ob in objects:
 if ob==body or ob.name.startswith('Tail'):parent_keep(ob,motion)
 elif 'hoof' in ob.name or ob.name.startswith('Dewclaw'):
  centre=sum((ob.matrix_world@Vector(p) for p in ob.bound_box),Vector())/8
  name=('Fore' if centre.y<0 else 'Hind')+('.L' if centre.x<0 else '.R');parent_keep(ob,feet[name])
 else:parent_keep(ob,head)
# Group rigid details by parent and material. The deforming body stays separate.
groups={};deps=bpy.context.evaluated_depsgraph_get()
for ob in list(collection.objects):
 if ob.type!='MESH' or ob==body:continue
 if ob.modifiers:
  data=bpy.data.meshes.new_from_object(ob.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps);ob.data=data;ob.modifiers.clear()
 groups.setdefault((ob.parent.name,ob.data.materials[0].name),[]).append(ob)
for (parent,mat),parts in groups.items():
 if len(parts)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for ob in parts:ob.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();bpy.context.object.name=parent+' · '+mat
body.shape_key_add(name='Basis');coords=np.array([tuple(v.co) for v in body.data.vertices],dtype=np.float32)
world=coords+np.array(body.location);count=len(coords)
foot_points={n:np.array(((-.55 if n.endswith('L') else .55)*1.35,(-.88 if n.startswith('Fore') else .82)*1.35,0)) for n in feet}
masks={}
for n,p in foot_points.items():
 horizontal=np.linalg.norm(world[:,:2]-p[:2],axis=1);height=np.clip((1.18-world[:,2])/.70,0,1);masks[n]=height*height*(3-2*height)*np.clip((.55-horizontal)/.23,0,1)
def foot_offset(phase):return np.array((0,.19*math.cos(phase),.12*max(0,math.sin(phase))))
offsets={'Fore.L':0,'Hind.R':math.pi/2,'Fore.R':math.pi,'Hind.L':math.pi*1.5}
walk_keys=[]
for i in range(8):
 positions=coords.copy()
 for n in feet:positions+=masks[n][:,None]*foot_offset(i/8*math.tau+offsets[n])
 key=body.shape_key_add(name='Walk pose '+str(i));key.data.foreach_set('co',positions.ravel());walk_keys.append(key)
neck=np.clip((-world[:,1]-1.25)/.43,0,1);neck=neck*neck*(3-2*neck)
head_keys=[];pivot=np.array(head.location)
for name,angle in [('Head lowered',.30),('Tusk strike',-.36)]:
 relative=world-pivot;c,s=math.cos(angle),math.sin(angle);rotated=relative.copy();rotated[:,1]=c*relative[:,1]-s*relative[:,2];rotated[:,2]=s*relative[:,1]+c*relative[:,2]
 positions=coords+(rotated-relative)*neck[:,None];key=body.shape_key_add(name=name);key.data.foreach_set('co',positions.ravel());head_keys.append(key)
def strip(owner,name,start,end):
 action=owner.animation_data.action;action.name=name+' · '+owner.name;track=owner.animation_data.nla_tracks.new();track.name=name;clip=track.strips.new(name,start,action);clip.extrapolation='NOTHING';owner.animation_data.action=None
# A four-beat walk in place. Feet lift on the recovery half of each step.
for frame in range(1,34):
 phase=(frame-1)/32*math.tau;t=(frame-1)/4;i=int(t)%8;f=t-math.floor(t)
 for k,key in enumerate(walk_keys):key.value=(1-f if k==i else f if k==(i+1)%8 else 0);key.keyframe_insert('value',frame=frame)
 for n,ob in feet.items():ob.location=foot_offset(phase+offsets[n]);ob.keyframe_insert('location',frame=frame)
 motion.location.z=.012*(1-math.cos(phase*2));motion.keyframe_insert('location',frame=frame)
strip(body.data.shape_keys,'Walk',1,33)
for ob in [motion,*feet.values()]:strip(ob,'Walk',1,33)
# Wind-up, forward lunge, upward tusk strike and recovery. Returns to its origin.
for frame,down,up,lunge in [(49,0,0,0),(56,1,0,-.10),(61,1,0,.10),(65,0,1,.55),(70,0,.35,.30),(81,0,0,0)]:
 for key in walk_keys:key.value=0;key.keyframe_insert('value',frame=frame)
 head_keys[0].value=down;head_keys[1].value=up
 for key in head_keys:key.keyframe_insert('value',frame=frame)
 head.rotation_euler.x=.30*down-.36*up;head.keyframe_insert('rotation_euler',frame=frame)
 motion.location=(0,-lunge,0);motion.keyframe_insert('location',frame=frame)
strip(body.data.shape_keys,'TuskAttack',49,81)
for ob in [head,motion]:strip(ob,'TuskAttack',49,81)
# Linear samples avoid overshoot and negative shape-key weights at the loop seam.
for action in bpy.data.actions:
 for layer in action.layers:
  for action_strip in layer.strips:
   for bag in action_strip.channelbags:
    for curve in bag.fcurves:
     for key in curve.keyframe_points:key.interpolation='LINEAR'
scene.frame_set(40)
for key in body.data.shape_keys.key_blocks[1:]:key.value=0
for ob in feet.values():ob.location=(0,0,0)
motion.location=(0,0,0);head.rotation_euler=(0,0,0);bpy.context.preferences.filepaths.save_version=0
assert not any(o.type=='ARMATURE' for o in collection.objects)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-motion.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in collection.objects:ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(out/'ash-tusk-boar-motion.glb'),export_format='GLB',use_selection=True,export_apply=False,export_skins=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_morph=True,export_morph_normal=False,export_morph_tangent=False)
print('EXPORTED no-armature walk and tusk attack',flush=True)
if '--preview' in sys.argv:
 scene.render.engine='CYCLES';scene.cycles.samples=4;scene.cycles.use_denoising=True;scene.render.resolution_percentage=30
 for frame in [1,9,17,25,49,56,65,81]:
  scene.frame_set(frame);scene.render.filepath=str(out/('motion-frame-'+str(frame)+'.png'));bpy.ops.render.render(write_still=True)
