"""Skin the clean asset and bake idle, planted walk and tusk-strike clips.

No material rebake, downloaded assets, or decoration. Original files stay intact.
"""
import bpy,sys,math,json,os,tempfile
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.kdtree import KDTree

root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'rigged';out.mkdir(exist_ok=True)
scratch=out/'scratch';scratch.mkdir(exist_ok=True);tempfile.tempdir=str(scratch);os.environ['TEMP']=os.environ['TMP']=str(scratch)
bpy.ops.wm.open_mainfile(filepath=str(base/'clean/ash-tusk-boar-clean.blend'))
scene=bpy.context.scene;asset=bpy.data.collections['ASSET · Clean boar'];asset.name='ASSET · Rigged clean boar'
parts=[o for o in asset.objects if o.type=='MESH'];body=bpy.data.objects['Continuous skin · anatomy refinement'];fur=bpy.data.objects['Clean directional fur']
# Apply evaluated surface geometry before skinning, keeping UVs and packed maps.
deps=bpy.context.evaluated_depsgraph_get()
for ob in parts:
 data=bpy.data.meshes.new_from_object(ob.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps);data.transform(ob.matrix_world);ob.data=data;ob.modifiers.clear();ob.matrix_world=Matrix.Identity(4)

arm_data=bpy.data.armatures.new('Boar skeleton');arm=bpy.data.objects.new('BoarRig',arm_data);asset.objects.link(arm);arm.show_in_front=True;arm_data.display_type='OCTAHEDRAL'
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
spec={}
def bone(name,a,b,parent=None,deform=True):
 eb=arm_data.edit_bones.new(name);eb.head=a;eb.tail=b;eb.matrix=Matrix.Translation(Vector(a))@(Vector(b)-Vector(a)).to_track_quat('Y','X').to_matrix().to_4x4();eb.length=(Vector(b)-Vector(a)).length;eb.use_deform=deform
 if parent:eb.parent=arm_data.edit_bones[parent]
 spec[name]={'head':list(a),'tail':list(b),'parent':parent}
bone('Root',(0,0,0),(0,0,.4),deform=False)
bone('Pelvis',(0,.95,1.45),(0,.25,1.6),'Root')
bone('Spine',(0,.25,1.6),(0,-.45,1.8),'Pelvis')
bone('Chest',(0,-.45,1.8),(0,-.95,1.9),'Spine')
bone('Neck',(0,-.95,1.9),(0,-1.30,1.86),'Chest')
bone('Head',(0,-1.30,1.86),(0,-2.42,1.47),'Neck')
bone('Jaw',(0,-1.65,1.28),(0,-2.45,1.05),'Head')
bone('Tail.01',(0,1.59,1.40),(.10,2.03,1.30),'Pelvis')
bone('Tail.02',(.10,2.03,1.30),(.18,2.43,1.25),'Tail.01')
legs={}
for side,sign in [('L',-1),('R',1)]:
 for kind in ['Fore','Hind']:
  fore=kind=='Fore';x=sign*(.743 if fore else .702)
  a=(x,-.95,1.45) if fore else (x,1.,1.43)
  k=(x,-.78,.74) if fore else (x,.68,.78)
  f=(x,-1.20,.24) if fore else (x,1.12,.24)
  end=(x,f[1]-.20,.10);stem=kind+'.'+side
  bone(stem+'.Upper',a,k,'Chest' if fore else 'Pelvis');bone(stem+'.Lower',k,f,stem+'.Upper');bone(stem+'.Foot',f,end,stem+'.Lower')
  legs[stem]=(Vector(a),Vector(k),Vector(f))
bpy.ops.object.mode_set(mode='OBJECT')
names=[b.name for b in arm_data.bones if b.use_deform];index={n:i for i,n in enumerate(names)}
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'

def smooth(a,b,v):
 t=np.clip((v-a)/(b-a),0,1);return t*t*(3-2*t)
def points(ob):
 a=np.empty(len(ob.data.vertices)*3,dtype=np.float32);ob.data.vertices.foreach_get('co',a);return a.reshape((-1,3))
def body_weights(p):
 w=np.zeros((len(p),len(names)),dtype=np.float32);x,y,z=p.T
 # Partition the torso along its centre line, with a soft neck transition.
 anchors=[('Head',-1.77),('Neck',-1.20),('Chest',-.73),('Spine',-.05),('Pelvis',.91)]
 centres=np.array([a[1] for a in anchors]);hi=np.clip(np.searchsorted(centres,y),1,len(centres)-1);lo=hi-1;t=np.clip((y-centres[lo])/(centres[hi]-centres[lo]),0,1);t=t*t*(3-2*t)
 for j,(name,_) in enumerate(anchors):w[:,index[name]]=np.where(lo==j,1-t,0)+np.where(hi==j,t,0)
 for stem in legs:
  fore=stem.startswith('Fore');side=x<0 if '.L' in stem else x>=0
  gate=1-smooth(.40,.75,np.abs(y-(-1.10 if fore else 1.02)))
  influence=smooth(.35,.63,np.abs(x))*(1-smooth(.85,1.65,z))*gate*side
  influence=np.clip(influence,0,1);w*=1-influence[:,None]
  foot=1-smooth(.25,.44,z);upper=smooth(.62,.94,z);lower=np.maximum(0,1-foot-upper)
  for suffix,blend in [('Upper',upper),('Lower',lower),('Foot',foot)]:w[:,index[stem+'.'+suffix]]+=influence*blend
 return w
def top4(w):
 inds=np.argsort(w,axis=1)[:,-4:];values=np.take_along_axis(w,inds,axis=1);values=np.rint(values*128)/128;values/=values.sum(axis=1)[:,None];return inds,values
def bind(ob,inds,values):
 groups=[ob.vertex_groups.new(name=n) for n in names]
 # Bucket equal weights so Blender receives bulk assignments rather than millions of calls.
 for j,group in enumerate(groups):
  rows,cols=np.where(inds==j)
  if not len(rows):continue
  weights=values[rows,cols];quant=np.rint(weights*4096).astype(np.int32)
  for value in np.unique(quant):
   if value:group.add(rows[quant==value].tolist(),float(value)/4096,'REPLACE')
 mod=ob.modifiers.new('Boar skeletal deformation','ARMATURE');mod.object=arm;mod.use_deform_preserve_volume=False;ob.parent=arm
body_p=points(body);body_w=body_weights(body_p);bi,bw=top4(body_w);bind(body,bi,bw)
# Every strand receives its root's skin weights, keeping the coat attached to the skin.
report=json.loads((base/'clean/quality-report.json').read_text());count=report['groom_curves'];mane=report['mane_strands'];lengths=np.array([15]*(count-mane)+[21]*mane);starts=np.r_[0,np.cumsum(lengths)[:-1]];fp=points(fur);assert lengths.sum()==len(fp)
tree=KDTree(len(body_p))
for i,p in enumerate(body_p):tree.insert(p,i)
tree.balance();root_weights=[]
for start in starts:
 _,nearest,_=tree.find(fp[start:start+3].mean(axis=0));root_weights.append(nearest)
fi=np.repeat(bi[root_weights],lengths,axis=0);fw=np.repeat(bw[root_weights],lengths,axis=0);bind(fur,fi,fw)
for ob in parts:
 if ob in [body,fur]:continue
 centre=points(ob).mean(axis=0);name=ob.name
 if 'hoof' in name or name.startswith('Dewclaw'):
  target=('Fore' if centre[1]<0 else 'Hind')+('.L' if centre[0]<0 else '.R')+'.Foot';w=np.zeros((len(ob.data.vertices),len(names)),dtype=np.float32);w[:,index[target]]=1
 elif name.startswith('Tail'):
  p=points(ob);t=smooth(1.85,2.16,p[:,1]);w=np.zeros((len(p),len(names)),dtype=np.float32);w[:,index['Tail.01']]=1-t;w[:,index['Tail.02']]=t
 else:
  jaw=name.startswith(('02 · Lower jaw','Lower lip','Lower exposed tooth','Main lower tusk'));target='Jaw' if jaw else 'Head';w=np.zeros((len(ob.data.vertices),len(names)),dtype=np.float32);w[:,index[target]]=1
 bind(ob,*top4(w))
print('SKINNED',len(parts),'meshes;',len(arm_data.bones),'bones',flush=True)

def pose_matrix(name,translation=None,pitch=0,roll=0):
 pb=arm.pose.bones[name];rest=pb.bone.matrix_local;parent=pb.parent
 matrix=parent.matrix@parent.bone.matrix_local.inverted()@rest if parent else rest.copy()
 pivot=matrix.translation.copy();matrix=Matrix.Translation(pivot)@Matrix.Rotation(pitch,4,'X')@Matrix.Rotation(roll,4,'Z')@matrix.to_quaternion().to_matrix().to_4x4()
 if translation is not None:matrix.translation+=Vector(translation)
 pb.matrix=matrix
def align(name,a,b):arm.pose.bones[name].matrix=Matrix.Translation(a)@(b-a).to_track_quat('Y','X').to_matrix().to_4x4()
def leg_ik(stem,target):
 rest_a,rest_k,rest_f=legs[stem];upper=arm.pose.bones[stem+'.Upper'];parent=upper.parent;a=parent.matrix@parent.bone.matrix_local.inverted()@rest_a
 l1=(rest_k-rest_a).length;l2=(rest_f-rest_k).length;delta=target-a;d=delta.length
 assert abs(l1-l2)+.0001<d<l1+l2-.0001,('Unreachable foot',stem,d,l1+l2)
 direction=delta/d;bend=rest_k-rest_a;bend-=direction*bend.dot(direction);bend.normalize();along=(l1*l1-l2*l2+d*d)/(2*d);k=a+direction*along+bend*math.sqrt(max(0,l1*l1-along*along))
 align(stem+'.Upper',a,k);bpy.context.view_layer.update();align(stem+'.Lower',k,target);bpy.context.view_layer.update()
 pb=arm.pose.bones[stem+'.Foot'];m=pb.bone.matrix_local.copy();m.translation=target;pb.matrix=m
def step(t):
 t=t%1
 if t<.6:return -.15+.30*t/.6,0
 s=(t-.6)/.4;return .15-.30*(s*s*(3-2*s)),.15*math.sin(math.pi*s)**2
phases={'Fore.L':0,'Hind.R':.25,'Fore.R':.5,'Hind.L':.75}
attack=np.array([(0,0,0,0),(.22,.17,0,.025),(.38,.17,-.045,.045),(.53,-.29,.18,-.025),(.68,-.10,.10,0),(1,0,0,0)])
def animate(kind,frame,start,end):
 scene.frame_set(frame);t=(frame-start)/(end-start)
 for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4)
 if kind=='Walk':bob=.008*(1-math.cos(t*math.tau*2));lunge=0;head_pitch=.012*math.sin(t*math.tau);lean=0
 elif kind=='TuskAttack':head_pitch=float(np.interp(t,attack[:,0],attack[:,1]));lunge=float(np.interp(t,attack[:,0],attack[:,2]));lean=float(np.interp(t,attack[:,0],attack[:,3]));bob=-.015*math.sin(math.pi*t)**2
 else:bob=.003*math.sin(t*math.tau);lunge=0;head_pitch=.006*math.sin(t*math.tau);lean=0
 pose_matrix('Root',(0,-lunge,bob));bpy.context.view_layer.update()
 for n,pitch,roll in [('Pelvis',0,0),('Spine',lean,0),('Chest',0,0),('Neck',head_pitch*.28,0),('Head',head_pitch*.72,0),('Jaw',.025*math.sin(math.pi*t)**2 if kind=='TuskAttack' else 0,0),('Tail.01',0,.025*math.sin(t*math.tau)),('Tail.02',0,.035*math.sin(t*math.tau+.5)-.035*math.sin(.5))]:
  pose_matrix(n,pitch=pitch,roll=roll);bpy.context.view_layer.update()
 for stem,(_,_,rest_f) in legs.items():
  dy,dz=step(t+phases[stem]) if kind=='Walk' else (0,0);leg_ik(stem,rest_f+Vector((0,dy,dz)))
 for pb in arm.pose.bones:
  pb.keyframe_insert('location',frame=frame,group=pb.name);pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)

scene.render.fps=24;scene.frame_start=1;scene.frame_end=145;clips=[('Walk',1,33),('TuskAttack',49,81),('Idle',97,145)]
for kind,start,end in clips:
 for frame in range(start,end+1):animate(kind,frame,start,end)
 action=arm.animation_data.action;action.name=kind;track=arm.animation_data.nla_tracks.new();track.name=kind;strip=track.strips.new(kind,start,action);strip.extrapolation='NOTHING';arm.animation_data.action=None
 for layer in action.layers:
  for astrip in layer.strips:
   for bag in astrip.channelbags:
    for curve in bag.fcurves:
     for key in curve.keyframe_points:key.interpolation='LINEAR'
 print('BAKED',kind,flush=True)
scene.frame_set(40)
for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4)
bpy.context.view_layer.update();bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-rigged.blend'))
# Join export copies by material. All share the same skeleton and vertex group names.
sys.path.insert(0,str(root/'scripts/blender'))
from export_rigged_boar import export_rig
mesh_groups=export_rig(scene,parts,arm,out)
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_x=1024;scene.render.resolution_y=768;scene.render.resolution_percentage=100
for label,frame in [('rest',40),('walk',9),('strike',66)]:
 scene.frame_set(frame);scene.render.filepath=str(out/(label+'.png'));bpy.ops.render.render(write_still=True)
report={'source':'Clean static boar; original source and textures preserved','bones':len(arm_data.bones),'mesh_groups':mesh_groups,'max_influences':4,'clips':[{'name':n,'frames':[a,b],'duration_seconds':(b-a)/24} for n,a,b in clips],'fur_binding':'Each solid strand inherits its nearest skin vertex weights at the root','geometry':'High-detail original geometry; no runtime decimation in this rigging pass','feet':'Two-segment leg solve baked to bone transforms; fixed-height support feet','animated_groom':'Export mesh coat is skinned; hidden native Hair Curves stay in rest pose','browserUIVisuallyTested':False}
(out/'rig-quality-report.json').write_text(json.dumps(report,indent=2));print('RIG COMPLETE',json.dumps(report),flush=True)
