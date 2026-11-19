"""Polish, rig and export Dawnwing's grounded and airborne poses."""
from pathlib import Path
import bpy,math,json,os,tempfile,hashlib,sys
import bmesh
import numpy as np
from mathutils import Vector,Matrix,Euler,Quaternion

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).resolve().parent))
from dawnwing_wings import JOINTS,build_wings
BASE=ROOT/'assets-source/creatures/dawnwing-pegasus'
OUT=BASE/'Rigged'
OUT.mkdir(exist_ok=True)
TEXTURES=OUT/'Textures'
TEXTURES.mkdir(exist_ok=True)
MODEL_SCALE=.71
REFERENCE_SPEEDS={'Walk':1.30,'Trot':2.85}
scratch=BASE/'scratch';os.environ['TMP']=os.environ['TEMP']=str(scratch);tempfile.tempdir=str(scratch)
bpy.ops.wm.open_mainfile(filepath=str(BASE/'Blender/DawnwingPegasus.blend'))
scene=bpy.context.scene
objects=[o for name in ['PEGASUS | original static companion','TACK | optional removable riding equipment'] for o in bpy.data.collections[name].objects if o.type=='MESH']
old_wings=next(obj for obj in objects if 'flight_feathers' in obj.name.lower())
feather_material=old_wings.data.materials[0]
objects.remove(old_wings)
bpy.data.objects.remove(old_wings,do_unlink=True)
deps=bpy.context.evaluated_depsgraph_get()
for obj in objects:
    data=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
    data.transform(obj.matrix_world);obj.data=data;obj.matrix_world=Matrix.Identity(4);obj.modifiers.clear()

def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)

def points(obj):
    positions=np.empty(len(obj.data.vertices)*3,np.float32)
    obj.data.vertices.foreach_get('co',positions)
    return positions.reshape(-1,3)

for obj in objects:
    positions=points(obj)
    x,y,z=positions.T.copy()
    label=obj.name.lower()
    cheek=np.exp(-((y+1.56)/.26)**2-((z-2.87)/.17)**2)
    nose=np.exp(-((y+2.10)/.17)**2-((z-2.53)/.19)**2)
    positions[:,0]=x*(1+.115*cheek+.04*nose)
    positions[:,1]=y+.084*smooth(1.59,2.23,-y)*smooth(2.27,2.47,z)
    positions[:,2]=z-.13*smooth(3.16,3.53,z)*(1-smooth(-1.15,-.90,y))
    if 'mane_and_tail' in label:
        mane=smooth(-1.48,-1.31,y)*(1-smooth(-.63,-.54,y))
        positions[:,0]-=.115*mane*smooth(.015,.165,-x)
        positions[:,2]+=.066*(1-smooth(.12,.18,np.abs(x)))*(1-smooth(-1.51,-1.37,y))
    elif label.startswith('tack_') and 'leather' in label:
        cheekstrap=(1-smooth(-1.52,-1.33,y))*np.exp(-((z-2.99)/.16)**2)
        positions[:,1]+=.110*cheekstrap
        positions[:,0]-=.015*np.sign(x)*cheekstrap
        saddle_end=smooth(-1.23,-.30,y)*smooth(2.225,2.285,z)*(1-smooth(.36,.43,np.abs(x)))
        positions[:,2]-=.18*saddle_end
        positions[:,0]-=.085*np.sign(x)*saddle_end
        positions[:,1]+=.17*saddle_end
        side_clearance=smooth(-1.80,-1.24,y)*(1-smooth(-.62,-.18,y))*smooth(2.10,2.28,z)*(1-smooth(2.55,2.70,z))
        positions[:,0]+=.12*np.sign(x)*side_clearance
    obj.data.vertices.foreach_set('co',positions.ravel())
    obj.data.update()

body=next(obj for obj in objects if obj.name.startswith('Pegasus_Body'))
small_details=next(obj for obj in objects if any('skin details' in material.name for material in obj.data.materials if material))
details=bmesh.new()
details.from_mesh(small_details.data)
old_lids=[vertex for vertex in details.verts
          if .12<abs(vertex.co.x)<.25 and -1.67<vertex.co.y<-1.52 and 2.95<vertex.co.z<3.08]
old_spars=[vertex for vertex in details.verts
           if abs(vertex.co.x)>.17 and -.85<vertex.co.y<.14 and vertex.co.z>1.79]
assert old_lids and old_spars,'Original eye and wing geometry was not found'
bmesh.ops.delete(details,geom=old_lids+old_spars,context='VERTS')
details.to_mesh(small_details.data)
details.free()
small_details.data.update()

def eye_surfaces(obj,levels,lid=False):
    verts=[];faces=[];uvs=[]
    segments=40
    bpy.context.view_layer.update()
    for side in (-1,1):
        start=len(verts)
        for level in levels:
            for index in range(segments):
                angle=index*math.tau/segments
                along=math.cos(angle)
                opening=math.sin(angle)*(.65+.35*math.sin(angle)**2)
                u=level*along
                v=level*opening
                eye_y=-1.584+.060*u
                eye_z=2.999+.028*v-.007*u
                hit,surface,_,_=body.ray_cast(Vector((side,eye_y,eye_z)),Vector((-side,0,0)))
                assert hit,(side,eye_y,eye_z)
                if lid:
                    depth=.0015+.0038*math.sin(math.pi*(level-.93)/(.28))
                else:
                    depth=.0027+.0085*(1-level*level)
                verts.append((surface.x+side*depth,eye_y,eye_z))
                uvs.append((.5+.43*u,.5+.43*v))
        for row in range(len(levels)-1):
            for index in range(segments):
                index_next=(index+1)%segments
                first=start+row*segments
                quad=(first+index,first+segments+index,first+segments+index_next,first+index_next)
                faces.append(quad if side>0 else tuple(reversed(quad)))
        if not lid:
            center=len(verts)
            hit,surface,_,_=body.ray_cast(Vector((side,-1.584,2.999)),Vector((-side,0,0)))
            assert hit
            verts.append((surface.x+side*.0112,-1.584,2.999))
            uvs.append((.5,.5))
            for index in range(segments):
                tri=(center,start+index,start+(index+1)%segments)
                faces.append(tri if side>0 else tuple(reversed(tri)))
    material=obj.data.materials[0]
    mesh=bpy.data.meshes.new('Sculpted eyelid margins' if lid else 'Inset almond-shaped corneas')
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(material)
    uv_layer=mesh.uv_layers.new(name='UVMap')
    for loop in mesh.loops:uv_layer.data[loop.index].uv=uvs[loop.vertex_index]
    for polygon in mesh.polygons:polygon.use_smooth=True
    mesh.update()
    obj.data=mesh

eye=next(obj for obj in objects if 'wet_eyes' in obj.name.lower())
lids=next(obj for obj in objects if 'amber_iris' in obj.name.lower())
eye_surfaces(eye,(.18,.38,.57,.76,1.0))
eye_surfaces(lids,(.93,.99,1.07,1.15,1.21),lid=True)
lids.name='Pegasus_soft_eyelid_margins'
wing_anchors=dict(build_wings(feather_material))
objects.extend(wing_anchors)

def texture(name,values,linear=False):
    height,width,_=values.shape
    image=bpy.data.images.new(name,width,height,alpha=False)
    if linear:image.colorspace_settings.name='Non-Color'
    image.pixels.foreach_set(np.asarray(values,np.float32).ravel())
    image.filepath_raw=str(TEXTURES/(name+'.png'))
    image.file_format='PNG';image.save();image.pack()
    return image

def image_node(material,image):
    node=material.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
    return node

eye_material=eye.data.materials[0]
eye_shader=eye_material.node_tree.nodes.get('Principled BSDF')
eyev,eyeu=np.mgrid[0:256,0:256].astype(np.float32)/255
eyev=(eyev-.5)/.43
eyeu=(eyeu-.46)/.43
iris_radius=np.hypot(eyeu*.96,eyev*.66)
iris_angle=np.arctan2(eyev*.66,eyeu*.96)
iris=(1-smooth(.55,.71,iris_radius))*smooth(.17,.37,iris_radius)
iris*=.86+.08*np.sin(iris_angle*41+iris_radius*15)+.06*np.sin(iris_angle*23)
pupil=1-smooth(.82,1.05,np.hypot(eyeu/.48,(eyev+.03)/.22))
eye_rgba=np.ones((256,256,4),np.float32)
for channel,value in enumerate((.16,.071,.026)):
    eye_rgba[...,channel]=.006+value*iris*(1-pupil)
eye_color=image_node(eye_material,texture('Dawnwing_Eye_BaseColor',eye_rgba))
eye_material.node_tree.links.new(eye_color.outputs['Color'],eye_shader.inputs['Base Color'])
eye_shader.inputs['Roughness'].default_value=.29
lids_material=lids.data.materials[0]
lids_material.name='Pegasus | soft taupe eyelid margins'
lids_shader=lids_material.node_tree.nodes.get('Principled BSDF')
lids_shader.inputs['Base Color'].default_value=(.32,.29,.25,1)
lids_shader.inputs['Roughness'].default_value=.70

node_tree=feather_material.node_tree
shader=node_tree.nodes.get('Principled BSDF')
yy,xx=np.mgrid[0:1024,0:1024].astype(np.float32)/1023
edge=np.abs(xx-.46)*2
grain=yy+.22*edge+.015*np.sin(yy*17+edge*5)
barbs=np.sin(grain*685)+.31*np.sin(grain*1733)
shaft=np.exp(-((xx-.46)/.016)**2)*(1-.86*yy)
shade=.80-.17*(1-yy)**2-.14*yy**5-.09*edge**2+.022*barbs+.13*shaft
rgba=np.ones((1024,1024,4),np.float32)
for channel,value in enumerate((1.03,.995,.94)):rgba[...,channel]=np.clip(shade*value,0,1)
base=image_node(feather_material,texture('Dawnwing_Feather_BaseColor',rgba))
node_tree.links.new(base.outputs['Color'],shader.inputs['Base Color'])
dy,dx=np.gradient(.10*shaft+.007*barbs)
normal=np.stack((-24*dx,-24*dy,np.ones_like(dx)),axis=-1)
rgba[...,:3]=.5+.5*normal/np.linalg.norm(normal,axis=-1,keepdims=True)
normal_image=image_node(feather_material,texture('Dawnwing_Feather_Normal',rgba,True))
normal_map=node_tree.nodes.new('ShaderNodeNormalMap')
normal_map.inputs['Strength'].default_value=.45
node_tree.links.new(normal_image.outputs['Color'],normal_map.inputs['Color'])
node_tree.links.new(normal_map.outputs[0],shader.inputs['Normal'])

coat=body.data.materials[0]
node_tree=coat.node_tree
shader=node_tree.nodes.get('Principled BSDF')
x,y,z=points(body).T
flecks=np.sin(x*33+y*27)*np.sin(z*28+y*12)*np.cos(z*29-x*26)
dapple=.085*flecks*smooth(.14,.44,np.abs(x))*smooth(1.13,1.65,z)*(1-smooth(2.2,2.8,z))
muzzle_fade=smooth(1.79,2.08,-y)*np.exp(-((z-2.53)/.34)**2)
leg_fade=1-smooth(.18,.58,z)
masks=np.ones((len(x),4),np.float32)
for channel,value in enumerate((.52,.46,.37)):
    masks[:,channel]=np.clip(.94+dapple-value*muzzle_fade-(.16-channel*.018)*leg_fade,0,1)
colors=body.data.color_attributes.new(name='Coat markings',type='FLOAT_COLOR',domain='POINT')
colors.data.foreach_set('color',masks.ravel())
markings=node_tree.nodes.new('ShaderNodeVertexColor');markings.layer_name=colors.name
mix=node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
previous_base=shader.inputs['Base Color'].links[0].from_socket
node_tree.links.new(previous_base,mix.inputs[1]);node_tree.links.new(markings.outputs['Color'],mix.inputs[2])
node_tree.links.new(mix.outputs[0],shader.inputs['Base Color'])
baked=bpy.data.images.new('Dawnwing_Coat_BaseColor',2048,2048,alpha=False)
target=image_node(coat,baked);node_tree.nodes.active=target
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.bake(type='DIFFUSE')
baked.filepath_raw=str(TEXTURES/'Dawnwing_Coat_BaseColor.png');baked.file_format='PNG';baked.save();baked.pack()
node_tree.links.new(target.outputs['Color'],shader.inputs['Base Color'])
node_tree.nodes.remove(mix);node_tree.nodes.remove(markings);body.data.color_attributes.remove(colors)
for obj in objects:
    material=obj.data.materials[0]
    shader=material.node_tree.nodes.get('Principled BSDF')
    if 'mane_and_tail' in obj.name.lower():
        shader.inputs['Base Color'].default_value=(.31,.32,.30,1)
        material.diffuse_color=(.31,.32,.30,1)
print('DAWNWING SURFACES BAKED',flush=True)
arm_data=bpy.data.armatures.new('Pegasus skeleton')
arm=bpy.data.objects.new('PegasusRig',arm_data)
bpy.data.collections['PEGASUS | original static companion'].objects.link(arm)
arm.show_in_front=True
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
def bone(name,a,b,parent=None,deform=True):
    eb=arm_data.edit_bones.new(name);eb.head=a;eb.tail=b;eb.use_deform=deform
    eb.matrix=Matrix.Translation(Vector(a))@(Vector(b)-Vector(a)).to_track_quat('Y','X').to_matrix().to_4x4();eb.length=(Vector(b)-Vector(a)).length
    if parent:eb.parent=arm_data.edit_bones[parent]
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
    joints=[(side*x,y,z) for x,y,z in JOINTS]
    for i in range(4):bone('Wing.'+suffix+'.'+str(i+1),joints[i],joints[i+1],'Chest' if i==0 else 'Wing.'+suffix+'.'+str(i))
    bone('Ear.'+suffix,(side*.13,-1.40,3.17),(side*.18,-1.37,3.37),'Head')
bpy.ops.object.mode_set(mode='OBJECT')
names=[b.name for b in arm_data.bones if b.use_deform];indices={n:i for i,n in enumerate(names)}
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'

def body_weights(p):
    x,y,z=p.T;w=np.zeros((len(p),len(names)),np.float32)
    # Upper-neck influence is based on height as well as longitudinal position.
    anchors=[('Head',-1.64),('Neck.02',-1.25),('Neck.01',-.98),('Chest',-.64),('Spine',.0),('Pelvis',.8)]
    centres=np.array([v for _,v in anchors]);high=np.clip(np.searchsorted(centres,y),1,len(centres)-1);low=high-1;t=smooth(centres[low],centres[high],y)
    for i,(name,_) in enumerate(anchors):w[:,indices[name]]=np.where(low==i,1-t,0)+np.where(high==i,t,0)
    head=smooth(2.37,2.71,z)*(1-smooth(-1.48,-1.24,y))
    head=np.maximum(head,1-smooth(-1.62,-1.48,y))
    w*=1-head[:,None];w[:,indices['Head']]+=head
    for stem,(a,k,f,toe) in legs.items():
        front=stem.startswith('Fore');side=(x<0) if '.L' in stem else (x>=0)
        center=-.79 if front else .91
        lower_leg=1-smooth(.5,1.02,z)
        gate=np.maximum(lower_leg*((y<0) if front else (y>0)),
                        (1-smooth(.23,.52,np.abs(y-center)))*(1-smooth(1.23,1.67,z))*smooth(.12,.27,np.abs(x)))*side
        w*=1-gate[:,None]
        foot=1-smooth(.27,.36,z);upper=smooth(.62,.89,z);lower=np.maximum(0,1-foot-upper)
        for key,v in [('Upper',upper),('Lower',lower),('Foot',foot)]:w[:,indices[stem+'.'+key]]+=gate*v
    tail=smooth(1.16,1.35,y)
    w*=1-tail[:,None]
    blend=1-smooth(.9,1.45,z)
    w[:,indices['Tail.01']]+=tail*(1-blend);w[:,indices['Tail.02']]+=tail*blend
    return w
def wing_weights(p):
    w=np.zeros((len(p),len(names)),np.float32)
    x=np.abs(p[:,0])
    transitions=[smooth(joint[0]-.17,joint[0]+.17,x) for joint in JOINTS[1:4]]
    blend=[1-transitions[0],transitions[0]-transitions[1],transitions[1]-transitions[2],transitions[2]]
    for side in ['L','R']:
        sign=p[:,0]<0 if side=='L' else p[:,0]>=0
        for i in range(4):w[:,indices['Wing.'+side+'.'+str(i+1)]]=blend[i]*sign
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
    if obj in wing_anchors:
        anchored=p.copy()
        anchored[:,0]=np.sign(p[:,0])*wing_anchors[obj]
        w=wing_weights(anchored)
        joined=smooth(.26,.56,wing_anchors[obj])
        w*=joined[:,None]
        w[:,indices['Chest']]+=1-joined
    elif name.startswith('tack_'):
        if 'leather' not in name:
            w[:]=0;w[:,indices['Spine']]=1
        else:
            # Saddle, cheekstraps and reins share a material; retain their local attachments.
            head=(p[:,1]<-1.45).astype(np.float32)
            back=(p[:,1]>-.40).astype(np.float32)
            w*=1-back[:,None];w[:,indices['Spine']]+=back
            w*=1-head[:,None];w[:,indices['Head']]+=head
    elif obj in (eye,lids):
        w[:]=0
        w[:,indices['Head']]=1
    if obj not in wing_anchors and not name.startswith('tack_') and 'mane' not in name:
        ear=smooth(3.17,3.29,p[:,2])*(1-smooth(.07,.13,np.abs(p[:,1]+1.40)))*smooth(.045,.105,np.abs(p[:,0]))
        w*=1-ear[:,None]
        w[:,indices['Ear.L']]+=ear*(p[:,0]<0)
        w[:,indices['Ear.R']]+=ear*(p[:,0]>=0)
    bind(obj,w)
print('PEGASUS SKINNED',len(arm_data.bones),'bones',flush=True)

def rot(name,xyz):
    q=arm_data.bones[name].matrix_local.to_quaternion();world=Euler(xyz,'XYZ').to_quaternion()
    arm.pose.bones[name].rotation_quaternion=q.inverted()@world@q
def reset():
    for pb in arm.pose.bones:pb.matrix_basis.identity()

def axes(direction,trailing):
    along=Vector(direction).normalized()
    across=(Vector(trailing)-along*along.dot(Vector(trailing))).normalized()
    return Matrix((along,across,along.cross(across))).transposed()

def fold(amount=1.0):
    for side,sign in [('L',-1),('R',1)]:
        name=f'Wing.{side}.1'
        start=axes((sign,-.035,.33),(0,1,-.18))
        end=axes((sign*.09,.994,.055),(sign*.105,.02,-1))
        posed=Quaternion().slerp((end@start.transposed()).to_quaternion(),amount)
        bone_basis=arm_data.bones[name].matrix_local.to_quaternion()
        shoulder=arm.pose.bones[name]
        shoulder.rotation_quaternion=bone_basis.inverted()@posed@bone_basis
        shoulder.location=bone_basis.inverted()@Vector((sign*.20,.012,-.086))*amount
        shoulder.scale=(1-.29*amount,)*3

def solve_leg(stem,target,hoof_pitch=0):
    a,k,f,toe=legs[stem];l1=(k-a).length;l2=(f-k).length
    dy=target[0]-a.y;dz=target[1]-a.z;dist=min(l1+l2-.001,max(abs(l1-l2)+.001,math.hypot(dy,dz)))
    theta=math.atan2(dy,-dz);alpha=math.acos(max(-1,min(1,(l1*l1+dist*dist-l2*l2)/(2*l1*dist))))
    # Hind hocks bend backwards; fore knees bend forwards during swing.
    knee_sign=1 if stem.startswith('Hind') else -1
    upper=theta+knee_sign*alpha
    lower=upper-knee_sign*math.acos(max(-1,min(1,(dist*dist-l1*l1-l2*l2)/(2*l1*l2))))
    rest_upper=math.atan2(k.y-a.y,-(k.z-a.z));rest_lower=math.atan2(f.y-k.y,-(f.z-k.z))
    u=upper-rest_upper;l=lower-rest_lower-u
    rot(stem+'.Upper',(u,0,0));rot(stem+'.Lower',(l,0,0));rot(stem+'.Foot',(hoof_pitch-u-l,0,0))

def height_offset(value):
    root=arm.pose.bones['Root']
    root.location=root.bone.matrix_local.to_3x3().inverted()@Vector((0,0,value))

def flight_pose(t,spread,flap):
    fold(spread)
    if spread<=0:
        for side,sign in [('L',-1),('R',1)]:
            rot(f'Wing.{side}.1',(0,sign*(.13+.61*flap*math.sin(t)),sign*.05))
            rot(f'Wing.{side}.2',(0,sign*(.06+.20*flap*math.sin(t-.63)),sign*.055))
            rot(f'Wing.{side}.3',(0,sign*(.04+.18*flap*math.sin(t-.99)),sign*.07))
            rot(f'Wing.{side}.4',(0,sign*.10*flap*math.sin(t-1.28),0))
    tuck=1-spread
    for stem in legs:
        front=stem.startswith('Fore')
        hoof=legs[stem][2]
        solve_leg(stem,(hoof.y+(.45 if front else -.26)*tuck,hoof.z+(.80 if front else .67)*tuck),-.45*tuck)
    rot('Neck.01',(-.09*tuck,0,0))
    rot('Tail.01',(-.38*tuck,0,.055*math.sin(t)*tuck))

clips={}
one_shots={'Jump','Takeoff'}
for name,seconds in [('Idle',3.0),('Walk',7/6),('Trot',2/3),('Jump',.54),('Takeoff',.63),('Wingbeat',1.45),('Glide',2.0)]:
    frames=round(seconds*24);arm.animation_data_create();action=bpy.data.actions.new(name);arm.animation_data.action=action
    seconds=frames/24
    for frame in range(frames+1):
        phase=frame/frames;t=phase*math.tau;reset();fold()
        if name=='Idle':
            rot('Neck.01',(.012*math.sin(t),0,0));rot('Head',(.012*math.sin(t+.5),0,.01*math.sin(t)))
            rot('Tail.01',(0,.05*math.sin(t),.04*math.sin(t)));rot('Ear.L',(0,.06*math.sin(t+.3),0))
        elif name in ['Walk','Trot']:
            stance=.62 if name=='Walk' else .52
            stride=REFERENCE_SPEEDS[name]*seconds*stance/MODEL_SCALE
            bob=-(.175 if name=='Walk' else .185)+.025*math.cos(t*2)
            height_offset(bob)
            for stem in legs:
                offset={'Fore.L':0,'Hind.R':.25,'Fore.R':.5,'Hind.L':.75}[stem] if name=='Walk' else (0 if stem in ['Fore.L','Hind.R'] else .5)
                p=(phase+offset)%1
                if p<stance:y=(p/stance-.5)*stride;lift=0;pitch=0
                else:
                    f=(p-stance)/(1-stance)
                    y=(.5-f*f*(3-2*f))*stride
                    lift=(.20 if name=='Walk' else .33)*math.sin(math.pi*f)**1.4
                    pitch=.42*math.sin(math.tau*f)*math.sin(math.pi*f)
                foot=legs[stem][2];solve_leg(stem,(foot.y+y,foot.z+lift-bob),pitch)
            rot('Neck.01',(.038*math.sin(t*2),0,0));rot('Head',(-.022*math.sin(t*2-.4),0,0))
            rot('Tail.01',(0,.10*math.sin(t),.06*math.sin(t)));rot('Tail.02',(.065*math.sin(t-.75),0,0))
        elif name in ['Wingbeat','Glide','Takeoff']:
            spread=1-float(smooth(0,.89,phase)) if name=='Takeoff' else 0
            flight_pose(t,spread,1 if name=='Wingbeat' else 0)
            if name=='Wingbeat':height_offset(.065*math.sin(t-.6))
            elif name=='Glide':height_offset(.018*math.sin(t))
        else:
            lift=math.sin(math.pi*phase)
            for stem in legs:
                foot=legs[stem][2]
                front=stem.startswith('Fore')
                solve_leg(stem,(foot.y+(.37 if front else -.11)*lift,foot.z+(.53 if front else .31)*lift),-.32*lift)
            rot('Neck.01',(.15*lift,0,0))
        for pb in arm.pose.bones:
            pb.keyframe_insert('rotation_quaternion',frame=frame)
            pb.keyframe_insert('location',frame=frame)
            if pb.name in {'Wing.L.1','Wing.R.1'}:
                pb.keyframe_insert('scale',frame=frame)
    for curve in action.fcurves if hasattr(action,'fcurves') else []:
        for point in curve.keyframe_points:point.interpolation='LINEAR'
    clips[name]={'frames':frames,'seconds':seconds,'loop':name not in one_shots}
    if name in REFERENCE_SPEEDS:clips[name]['reference_speed_mps']=REFERENCE_SPEEDS[name]
    track=arm.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,0,action);track.mute=True
arm.animation_data.action=None
reset();fold();arm.scale=(MODEL_SCALE,)*3
scene.render.fps=24;scene.frame_start=0;scene.frame_end=72

# Retain the full source. The game copy uses one moderate reduction, shared by both presets.
scene.render.resolution_percentage=100
scene.camera.location=(4.9,-6.4,3.1)
scene.camera.rotation_euler=(Vector((0,0,1.18))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'DawnwingPegasus-Rigged.blend'))
reset()
def select_asset():
    bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=arm
select_asset()
bpy.ops.export_scene.gltf(filepath=str(OUT/'DawnwingPegasus-Rigged.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_apply=True)
for obj in objects:
    if obj not in (eye,lids) and len(obj.data.polygons)>100:
        bpy.context.view_layer.objects.active=obj
        mod=obj.modifiers.new('Game surface reduction','DECIMATE');mod.ratio=.52
        while obj.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
        bpy.ops.object.modifier_apply(modifier=mod.name)
select_asset()
native=ROOT/'native/assets/pegasus';native.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(native/'dawnwing.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_apply=True)
report={'bones':len(arm_data.bones),'clips':clips,'rig':'Explicit deform skeleton; no external rigging add-on','game_reduction':.52,'scale_from_original':MODEL_SCALE,'riding':'Compact fold on the ground, with takeoff, wingbeat and glide clips for camp flight'}
(OUT/'rig-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(native/'animation-info.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
manifest_path=ROOT/'native/assets-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['assets']=[a for a in manifest['assets'] if not a['file'].startswith('assets/pegasus/')]
for file in [native/'dawnwing.glb',native/'animation-info.json']:
    data=file.read_bytes();manifest['assets'].append({'file':file.relative_to(ROOT/'native').as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source':'Original Dawnwing Pegasus; scripts/blender/rig_pegasus.py'})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('RIGGED PEGASUS COMPLETE',json.dumps(report),flush=True)
