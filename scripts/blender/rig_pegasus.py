"""Rig the original Pegasus and export the first ground-riding animation set."""
from pathlib import Path
import bpy,math,json,os,tempfile,hashlib
import numpy as np
from mathutils import Vector,Matrix,Euler

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'assets-source/creatures/dawnwing-pegasus'
OUT=BASE/'Rigged'
OUT.mkdir(exist_ok=True)
scratch=BASE/'scratch';os.environ['TMP']=os.environ['TEMP']=str(scratch);tempfile.tempdir=str(scratch)
bpy.ops.wm.open_mainfile(filepath=str(BASE/'Blender/DawnwingPegasus.blend'))
scene=bpy.context.scene
objects=[o for name in ['PEGASUS | original static companion','TACK | optional removable riding equipment'] for o in bpy.data.collections[name].objects if o.type=='MESH']
deps=bpy.context.evaluated_depsgraph_get()
for obj in objects:
    data=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
    data.transform(obj.matrix_world);obj.data=data;obj.matrix_world=Matrix.Identity(4);obj.modifiers.clear()
arm_data=bpy.data.armatures.new('Pegasus skeleton')
arm=bpy.data.objects.new('PegasusRig',arm_data)
bpy.data.collections['PEGASUS | original static companion'].objects.link(arm)
arm.show_in_front=True
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
spec={}
def bone(name,a,b,parent=None,deform=True):
    eb=arm_data.edit_bones.new(name);eb.head=a;eb.tail=b;eb.use_deform=deform
    eb.matrix=Matrix.Translation(Vector(a))@(Vector(b)-Vector(a)).to_track_quat('Y','X').to_matrix().to_4x4();eb.length=(Vector(b)-Vector(a)).length
    if parent:eb.parent=arm_data.edit_bones[parent]
    spec[name]={'a':list(a),'b':list(b),'parent':parent}
bone('Root',(0,0,0),(0,0,.3),deform=False)
bone('Pelvis',(0,.8,1.7),(0,.15,1.7),'Root')
bone('Spine',(0,.15,1.7),(0,-.45,1.8),'Pelvis')
bone('Chest',(0,-.45,1.8),(0,-.78,2.0),'Spine')
bone('Neck.01',(0,-.78,2.0),(0,-1.12,2.55),'Chest')
bone('Neck.02',(0,-1.12,2.55),(0,-1.43,3.04),'Neck.01')
bone('Head',(0,-1.43,3.04),(0,-2.11,2.54),'Neck.02')
bone('Tail.01',(0,1.06,1.83),(0,1.44,1.35),'Pelvis')
bone('Tail.02',(0,1.44,1.35),(.08,1.62,.4),'Tail.01')
legs={}
for suffix,side in [('L',-1),('R',1)]:
    x=side*.31
    for kind in ['Fore','Hind']:
        front=kind=='Fore'
        root=(x,-.70,1.70) if front else (x,.84,1.72)
        knee=(x,-.80,.75) if front else (x,1.12,.68)
        fetlock=(x,-.84,.26) if front else (x,1.00,.26)
        toe=(x,-.94,.06) if front else (x,.90,.06)
        stem=kind+'.'+suffix
        bone(stem+'.Upper',root,knee,'Chest' if front else 'Pelvis')
        bone(stem+'.Lower',knee,fetlock,stem+'.Upper')
        bone(stem+'.Foot',fetlock,toe,stem+'.Lower')
        legs[stem]=(Vector(root),Vector(knee),Vector(fetlock),Vector(toe))
    points=[(side*.34,-.35,2.04),(side*.96,-.22,2.58),(side*1.49,-.17,2.92),(side*2.15,-.27,3.18),(side*2.66,-.37,3.28)]
    for i in range(4):bone('Wing.'+suffix+'.'+str(i+1),points[i],points[i+1],'Chest' if i==0 else 'Wing.'+suffix+'.'+str(i))
    bone('Ear.'+suffix,(side*.13,-1.40,3.17),(side*.18,-1.37,3.50),'Head')
bpy.ops.object.mode_set(mode='OBJECT')
names=[b.name for b in arm_data.bones if b.use_deform];indices={n:i for i,n in enumerate(names)}
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'

def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def points(obj):
    a=np.empty(len(obj.data.vertices)*3,np.float32);obj.data.vertices.foreach_get('co',a);return a.reshape(-1,3)
def body_weights(p):
    x,y,z=p.T;w=np.zeros((len(p),len(names)),np.float32)
    # Upper-neck influence is based on height as well as longitudinal position.
    anchors=[('Head',-1.64),('Neck.02',-1.25),('Neck.01',-.98),('Chest',-.64),('Spine',.0),('Pelvis',.8)]
    centres=np.array([v for _,v in anchors]);high=np.clip(np.searchsorted(centres,y),1,len(centres)-1);low=high-1;t=smooth(centres[low],centres[high],y)
    for i,(name,_) in enumerate(anchors):w[:,indices[name]]=np.where(low==i,1-t,0)+np.where(high==i,t,0)
    head=smooth(2.72,3.02,z)*(1-smooth(-1.45,-1.18,y))
    w*=1-head[:,None];w[:,indices['Head']]+=head
    for stem,(a,k,f,toe) in legs.items():
        front=stem.startswith('Fore');side=(x<0) if '.L' in stem else (x>=0)
        center=-.79 if front else .91
        gate=(1-smooth(.22,.48,np.abs(y-center)))*(1-smooth(1.23,1.67,z))*smooth(.12,.27,np.abs(x))*side
        w*=1-gate[:,None]
        foot=1-smooth(.24,.39,z);upper=smooth(.63,.95,z);lower=np.maximum(0,1-foot-upper)
        for key,v in [('Upper',upper),('Lower',lower),('Foot',foot)]:w[:,indices[stem+'.'+key]]+=gate*v
    tail=smooth(1.16,1.35,y)
    w*=1-tail[:,None]
    blend=1-smooth(.9,1.45,z)
    w[:,indices['Tail.01']]+=tail*(1-blend);w[:,indices['Tail.02']]+=tail*blend
    return w
def wing_weights(p):
    w=np.zeros((len(p),len(names)),np.float32)
    centres=np.array([.50,1.17,1.79,2.40]);x=np.abs(p[:,0]);high=np.clip(np.searchsorted(centres,x),1,3);low=high-1;t=smooth(centres[low],centres[high],x)
    for side in ['L','R']:
        sign=p[:,0]<0 if side=='L' else p[:,0]>=0
        for i in range(4):w[:,indices['Wing.'+side+'.'+str(i+1)]]=(np.where(low==i,1-t,0)+np.where(high==i,t,0))*sign
    return w
def bind(obj,w):
    top=np.argsort(w,axis=1)[:,-4:];values=np.take_along_axis(w,top,axis=1)
    values=np.rint(values*128)/128;values/=np.maximum(values.sum(axis=1)[:,None],.00001)
    assert np.isfinite(values).all() and np.allclose(values.sum(axis=1),1)
    obj.vertex_groups.clear()
    for j,name in enumerate(names):
        group=obj.vertex_groups.new(name=name);rows,cols=np.where(top==j)
        q=np.rint(values[rows,cols]*4096).astype(np.int32)
        for value in np.unique(q):
            if value:group.add(rows[q==value].tolist(),float(value)/4096,'REPLACE')
    mod=obj.modifiers.new('Pegasus skeletal deformation','ARMATURE');mod.object=arm;obj.parent=arm

for obj in objects:
    p=points(obj);w=body_weights(p);name=obj.name.lower()
    if 'feather' in name:
        # All vane vertices inherit the same root weights, avoiding elastic feathers.
        assert len(p)%154==0
        roots=np.array([p[i:i+7].mean(axis=0) for i in range(0,len(p),154)])
        w=np.repeat(wing_weights(roots),154,axis=0)
    elif name.startswith('tack_'):
        if 'leather' not in name:
            w[:]=0;w[:,indices['Spine']]=1
        else:
            # Saddle, cheekstraps and reins share a material; retain their local attachments.
            head=(p[:,1]<-1.45).astype(np.float32)
            back=(p[:,1]>-.40).astype(np.float32)
            w*=1-back[:,None];w[:,indices['Spine']]+=back
            w*=1-head[:,None];w[:,indices['Head']]+=head
    elif any('skin details' in m.name for m in obj.data.materials if m) or 'coronet' in name:
        mask=(np.abs(p[:,0])>.42)&(p[:,2]>1.85)&(p[:,1]>-.95)&(p[:,1]<1.5)
        w[mask]=wing_weights(p[mask])
    bind(obj,w)
print('PEGASUS SKINNED',len(arm_data.bones),'bones',flush=True)

def rot(name,xyz):
    q=arm_data.bones[name].matrix_local.to_quaternion();world=Euler(xyz,'XYZ').to_quaternion()
    arm.pose.bones[name].rotation_quaternion=q.inverted()@world@q
def reset():
    for pb in arm.pose.bones:pb.matrix_basis.identity()
def fold(amount=.18):
    for side,sign in [('L',-1),('R',1)]:
        rot('Wing.'+side+'.1',(0,sign*.12*amount,sign*1.05*amount))
        rot('Wing.'+side+'.2',(0,sign*.16*amount,sign*.18*amount))
        rot('Wing.'+side+'.3',(0,-sign*.25*amount,-sign*1.1*amount))
        rot('Wing.'+side+'.4',(0,0,-sign*.25*amount))
def solve_leg(stem,target):
    a,k,f,toe=legs[stem];l1=(k-a).length;l2=(f-k).length
    dy=target[0]-a.y;dz=target[1]-a.z;dist=min(l1+l2-.001,max(abs(l1-l2)+.001,math.hypot(dy,dz)))
    theta=math.atan2(dy,-dz);alpha=math.acos(max(-1,min(1,(l1*l1+dist*dist-l2*l2)/(2*l1*dist))))
    # Hind hocks bend backwards; fore knees bend forwards during swing.
    knee_sign=1 if stem.startswith('Hind') else -1
    upper=theta+knee_sign*alpha
    ky=a.y+math.sin(upper)*l1;kz=a.z-math.cos(upper)*l1
    lower=math.atan2(target[0]-ky,-(target[1]-kz))
    rest_upper=math.atan2(k.y-a.y,-(k.z-a.z));rest_lower=math.atan2(f.y-k.y,-(f.z-k.z))
    u=upper-rest_upper;l=lower-rest_lower-u
    rot(stem+'.Upper',(u,0,0));rot(stem+'.Lower',(l,0,0));rot(stem+'.Foot',(-u-l,0,0))

clips={}
for name,seconds in [('Idle',3.0),('Walk',1.4),('Trot',.85),('Jump',1.1),('Wingbeat',1.7)]:
    frames=round(seconds*24);arm.animation_data_create();action=bpy.data.actions.new(name);arm.animation_data.action=action
    for frame in range(frames+1):
        phase=frame/frames;t=phase*math.tau;reset();fold()
        if name=='Idle':
            rot('Neck.01',(.012*math.sin(t),0,0));rot('Head',(.012*math.sin(t+.5),0,.01*math.sin(t)))
            rot('Tail.01',(0,.05*math.sin(t),.04*math.sin(t)));rot('Ear.L',(0,.06*math.sin(t+.3),0))
        elif name in ['Walk','Trot']:
            stride=.48 if name=='Walk' else .68
            for stem in legs:
                offset={'Fore.L':0,'Hind.R':.25,'Fore.R':.5,'Hind.L':.75}[stem] if name=='Walk' else (0 if stem in ['Fore.L','Hind.R'] else .5)
                p=(phase+offset)%1;stance=.62 if name=='Walk' else .52
                if p<stance:y=(p/stance-.5)*stride;lift=0
                else:
                    f=(p-stance)/(1-stance);y=(.5-f)*stride;lift=(.15 if name=='Walk' else .25)*math.sin(math.pi*f)
                foot=legs[stem][2];solve_leg(stem,(foot.y+y,foot.z+lift))
            rot('Neck.01',(.016*math.sin(t*2),0,0));rot('Tail.01',(0,.05*math.sin(t),.04*math.sin(t)))
        elif name=='Wingbeat':
            fold(0)
            for side,sign in [('L',-1),('R',1)]:
                rot('Wing.'+side+'.1',(0,sign*.48*math.sin(t),0))
                rot('Wing.'+side+'.2',(0,sign*.16*math.sin(t-.4),0))
                rot('Wing.'+side+'.3',(0,sign*.12*math.sin(t-.7),0))
        else:
            lift=math.sin(math.pi*phase)
            fold(.18*(1-lift))
            for stem in legs:
                rot(stem+'.Upper',((-.25 if stem.startswith('Fore') else .17)*lift,0,0))
                rot(stem+'.Lower',(.65*lift,0,0));rot(stem+'.Foot',(-.35*lift,0,0))
        for pb in arm.pose.bones:
            pb.keyframe_insert('rotation_quaternion',frame=frame)
            pb.keyframe_insert('location',frame=frame)
    for curve in action.fcurves if hasattr(action,'fcurves') else []:
        for point in curve.keyframe_points:point.interpolation='LINEAR'
    clips[name]={'frames':frames,'seconds':seconds,'loop':name!='Jump'}
    track=arm.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,0,action);track.mute=True
arm.animation_data.action=None
reset();scene.render.fps=24;scene.frame_start=0;scene.frame_end=72

# Retain the full source. The game copy uses one moderate reduction, shared by both presets.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'DawnwingPegasus-Rigged.blend'))
def select_asset():
    bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=arm
select_asset()
bpy.ops.export_scene.gltf(filepath=str(OUT/'DawnwingPegasus-Rigged.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_apply=True)
for obj in objects:
    if len(obj.data.polygons)>100:
        bpy.context.view_layer.objects.active=obj
        mod=obj.modifiers.new('Game surface reduction','DECIMATE');mod.ratio=.52
        while obj.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
        bpy.ops.object.modifier_apply(modifier=mod.name)
select_asset()
native=ROOT/'native/assets/pegasus';native.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(native/'dawnwing.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_apply=True)
report={'bones':len(arm_data.bones),'clips':clips,'rig':'Explicit deform skeleton; no external rigging add-on','game_reduction':.52,'riding':'First ground-riding prototype; flight locomotion is not implemented'}
(OUT/'rig-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(native/'animation-info.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
manifest_path=ROOT/'native/assets-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['assets']=[a for a in manifest['assets'] if not a['file'].startswith('assets/pegasus/')]
for file in [native/'dawnwing.glb',native/'animation-info.json']:
    data=file.read_bytes();manifest['assets'].append({'file':file.relative_to(ROOT/'native').as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source':'Original Dawnwing Pegasus; scripts/blender/rig_pegasus.py'})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('RIGGED PEGASUS COMPLETE',json.dumps(report),flush=True)
