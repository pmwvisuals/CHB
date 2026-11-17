"""Original Dawnwing Pegasus: static companion model, authored in metres.

Blender --background --factory-startup --python scripts/blender/build_pegasus.py
No third-party mesh, texture, rig or animation is used.
"""
from pathlib import Path
import bpy, bmesh, math, random, json, os, tempfile, sys
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets-source/creatures/dawnwing-pegasus'
for folder in ['Models','Textures','Previews','Blender','Reports','scratch']:(OUT/folder).mkdir(parents=True,exist_ok=True)
os.environ['TMP']=os.environ['TEMP']=str(OUT/'scratch');tempfile.tempdir=str(OUT/'scratch')
random.seed(417)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
asset=bpy.data.collections.new('PEGASUS | original static companion');scene.collection.children.link(asset)
tack=bpy.data.collections.new('TACK | optional removable riding equipment');scene.collection.children.link(tack)
studio=bpy.data.collections.new('STUDIO | not exported');scene.collection.children.link(studio)
parts=[];skin=[]

def move(obj,col=asset):
    for c in list(obj.users_collection):c.objects.unlink(obj)
    col.objects.link(obj)
    return obj

def mat(name,color,rough=.7,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    m.diffuse_color=(*color,1)
    return m

coat=mat('Pegasus | warm ivory coat',(.62,.60,.54),.76)
feathermat=mat('Pegasus | layered ivory flight feathers',(.76,.74,.67),.77)
hairmat=mat('Pegasus | silver flax mane and tail',(.43,.46,.44),.78)
hoofmat=mat('Pegasus | slate keratin',(.095,.105,.10),.62)
muzzle=mat('Pegasus | soft grey muzzle',(.18,.19,.175),.72)
dark=mat('Pegasus | mouth and nostril recess',(.018,.022,.020),.7)
eye=mat('Pegasus | dark wet eyes',(.008,.013,.012),.16)
iris=mat('Pegasus | warm amber iris',(.115,.066,.023),.29)
leather=mat('Tack | worn chestnut leather',(.11,.054,.025),.77)
cloth=mat('Tack | woven linen saddle pad',(.34,.37,.30),.95)
bronze=mat('Tack | aged bronze fittings',(.29,.22,.10),.46,.65)

def mesh(name,verts,faces,material,col=asset,uvs=None):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(name,data);col.objects.link(obj);data.materials.append(material)
    for p in data.polygons:p.use_smooth=True
    if uvs:
        layer=data.uv_layers.new(name='UVMap')
        for loop in data.loops:layer.data[loop.index].uv=uvs[loop.vertex_index]
    parts.append(obj)
    return obj

def ell(name,at,size,material=coat,organic=False,segments=32,rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=at)
    obj=move(bpy.context.object);obj.name=name;obj.scale=size;obj.data.materials.append(material)
    for p in obj.data.polygons:p.use_smooth=True
    parts.append(obj)
    if organic:skin.append(obj)
    return obj

def tube(name,points,radii,material=coat,organic=False,sides=14,col=asset):
    verts=[];faces=[];uvs=[]
    for i,point in enumerate(points):
        point=Vector(point)
        tangent=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])).normalized()
        axis=tangent.cross(Vector((1,0,0)))
        if axis.length<.1:axis=tangent.cross(Vector((0,1,0)))
        axis.normalize();other=tangent.cross(axis).normalized()
        radius=radii[i];rx,ry=radius if isinstance(radius,tuple) else (radius,radius)
        for j in range(sides):
            a=j*math.tau/sides;v=point+axis*(math.cos(a)*rx)+other*(math.sin(a)*ry)
            verts.append(v);uvs.append((j/sides,i/max(1,len(points)-1)))
        if i:
            for j in range(sides):a=(i-1)*sides+j;b=(i-1)*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces+=[tuple(reversed(range(sides))),tuple((len(points)-1)*sides+j for j in range(sides))]
    obj=mesh(name,verts,faces,material,col,uvs)
    if organic:skin.append(obj)
    return obj

def curve(name,points,radius,material,col=asset):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=10;data.bevel_depth=radius;data.bevel_resolution=2;data.use_fill_caps=True
    spline=data.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    if name.startswith(('Mane','Tail lock','Forelock')):
        for i,p in enumerate(spline.bezier_points):p.radius=max(.035,1-i/max(1,len(points)-1)*.965)
    obj=bpy.data.objects.new(name,data);col.objects.link(obj);obj.data.materials.append(material)
    return obj

def smooth_profiles(profiles,t):
    i=min(len(profiles)-2,max(0,next((j for j in range(len(profiles)-1) if profiles[j][0]<=t<=profiles[j+1][0]),len(profiles)-2)))
    a,b=profiles[i:i+2];u=(t-a[0])/(b[0]-a[0]);u=max(0,min(1,u));u=u*u*(3-2*u)
    return [a[k]*(1-u)+b[k]*u for k in range(1,len(a))]

# Equine trunk: deep chest, long rib cage, narrower loin and rounded croup.
profiles=[(-1.02,1.68,.12,.22),(-.85,1.68,.38,.50),(-.55,1.65,.46,.57),(-.15,1.61,.47,.51),(.30,1.67,.41,.44),(.68,1.72,.46,.47),(1.02,1.66,.39,.42),(1.16,1.62,.10,.20)]
verts=[];faces=[];rows=65;sides=48
for i in range(rows):
    y=profiles[0][0]+(profiles[-1][0]-profiles[0][0])*i/(rows-1);z,rx,rz=smooth_profiles(profiles,y)
    for j in range(sides):
        a=j*math.tau/sides;side=abs(math.cos(a));s=math.sin(a)
        shoulder=.04*math.exp(-((y+.65)/.20)**2)*side**4
        flank=.025*math.exp(-((y-.8)/.23)**2)*side**4
        verts.append((math.cos(a)*(rx+shoulder+flank),y,z+s*rz))
for i in range(rows-1):
    for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
faces += [tuple(reversed(range(sides))),tuple((rows-1)*sides+j for j in range(sides))]
body=mesh('Horse | continuous ribcage and loin',verts,faces,coat);skin.append(body)
ell('Chest and pectoral volume',(0,-.77,1.55),(.34,.31,.48),organic=True)
ell('Withers',(0,-.60,2.10),(.23,.30,.18),organic=True)
# A long rising muscular neck, with a narrow throatlatch below the jaw.
tube('Neck | crest to throatlatch',[(0,-.73,1.80),(0,-.86,2.02),(0,-1.04,2.26),(0,-1.16,2.52),(0,-1.24,2.78),(0,-1.37,3.03)],[(.33,.35),(.34,.37),(.30,.34),(.245,.29),(.18,.23),(.14,.18)],organic=True,sides=32)
ell('Poll and upper skull',(0,-1.46,3.04),(.18,.24,.22),organic=True)
# Cheek, forehead and muzzle stay connected to the same skin.
tube('Face | long tapered equine nasal bridge',[(0,-1.48,3.02),(0,-1.63,2.93),(0,-1.80,2.78),(0,-1.98,2.63),(0,-2.11,2.54)],[(.18,.17),(.16,.165),(.12,.14),(.135,.13),(.155,.13)],organic=True,sides=24)
ell('Jaw and cheek',(0,-1.57,2.87),(.19,.22,.19),organic=True)
tube('Lower jaw joined along cheek and muzzle',[(0,-1.57,2.85),(0,-1.78,2.69),(0,-2.04,2.50)],[(.13,.13),(.115,.12),(.095,.13)],organic=True,sides=24)
ell('Muzzle',(0,-2.10,2.53),(.18,.16,.13),organic=True)
# Tendon paths and joint forms: a single solid hoof on each slender leg.
for side in [-1,1]:
    x=side*.31
    tube('Foreleg anatomy '+str(side),[(x,-.69,1.75),(x,-.81,1.47),(x,-.86,1.22),(x,-.79,.79),(x,-.80,.65),(x,-.83,.31),(x,-.90,.19)],[(.175,.20),(.145,.17),(.10,.125),(.065,.08),(.08,.085),(.056,.062),(.064,.07)],organic=True,sides=20)
    ell('Fore elbow '+str(side),(x,-.87,1.30),(.11,.12,.15),organic=True)
    ell('Fore fetlock '+str(side),(x,-.83,.29),(.078,.095,.095),organic=True)
    tube('Hindleg anatomy '+str(side),[(x,.84,1.79),(x,.66,1.46),(x,.67,1.27),(x,1.06,.78),(x,1.12,.64),(x,1.00,.29),(x,.93,.18)],[(.22,.25),(.18,.20),(.13,.15),(.075,.09),(.085,.095),(.056,.062),(.068,.075)],organic=True,sides=20)
    ell('Hind haunch '+str(side),(x,.82,1.65),(.235,.29,.34),organic=True)
    ell('Hind hock '+str(side),(x,1.13,.68),(.082,.095,.11),organic=True)

# Join overlapping organic masses and voxel-remesh to remove detached joints.
bpy.ops.object.select_all(action='DESELECT')
for o in skin:o.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.convert(target='MESH');bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bpy.ops.object.join()
body=bpy.context.object;body.name='Pegasus_Body | welded horse anatomy'
remesh=body.modifiers.new('Continuous organic skin','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.018;remesh.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=body.modifiers.new('Gentle sculpt relaxation','SMOOTH');smooth.factor=.8;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
for p in body.data.polygons:p.use_smooth=True
parts=[body]

# Cut actual nostril cavities into the welded muzzle, keeping shadows inset.
for side in [-1,1]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=(side*.155,-2.175,2.55))
    cutter=bpy.context.object;cutter.scale=(.038,.043,.053)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    boolean=body.modifiers.new('Nostril cavity '+str(side),'BOOLEAN');boolean.operation='DIFFERENCE';boolean.object=cutter
    bpy.context.view_layer.objects.active=body
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

# UV unwrapping for real, portable base-color/roughness maps.
bpy.context.view_layer.objects.active=body
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.0,island_margin=.012);bpy.ops.object.mode_set(mode='OBJECT')

# Short coat shader in Blender; its base colour is baked below for GLB use.
nt=coat.node_tree;p=nt.nodes.get('Principled BSDF');texcoord=nt.nodes.new('ShaderNodeTexCoord')
noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=7;noise.inputs['Detail'].default_value=2;nt.links.new(texcoord.outputs['Generated'],noise.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.46,.47,.43,1);ramp.color_ramp.elements[1].color=(.77,.75,.67,1);nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
hairnoise=nt.nodes.new('ShaderNodeTexNoise');hairnoise.inputs['Scale'].default_value=310;hairnoise.inputs['Detail'].default_value=2
mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1,.22,2);nt.links.new(texcoord.outputs['Generated'],mapping.inputs[0]);nt.links.new(mapping.outputs[0],hairnoise.inputs['Vector'])
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.002;nt.links.new(hairnoise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
print('BODY welded, UV unwrapped:',len(body.data.polygons),'faces',flush=True)

# Hooves are tapered equine capsules, not cloven toes.
for side in [-1,1]:
    for label,y in [('Fore',-.92),('Hind',.91)]:
        x=side*.31
        hoof=tube('Hoof_'+label+('_L' if side<0 else '_R'),[(x,y-.018,.025),(x,y,.10),(x,y+.028,.19)],[(.103,.135),(.108,.14),(.075,.085)],hoofmat,sides=24)
        curve('Coronet band '+label+str(side),[(x-.075,y,.18),(x,y-.075,.185),(x+.075,y,.18)],.013,coat)

# Ears: leaf-shaped outer shell with recessed inner bowl.
for side in [-1,1]:
    x=side*.13
    tube('Ear_'+str(side),[(x,-1.40,3.17),(x+side*.025,-1.39,3.31),(x+side*.05,-1.37,3.50)],[(.074,.06),(.065,.042),(.005,.006)],coat,sides=16)
    tube('Inner ear_'+str(side),[(x,-1.443,3.23),(x+side*.025,-1.427,3.33),(x+side*.045,-1.397,3.46)],[.035,.031,.002],muzzle,sides=10)
    eyeball=ell('Eye_'+str(side),(side*.161,-1.588,3.008),(.038,.051,.038),eye,segments=24,rings=12)
    ell('Iris_'+str(side),(side*.190,-1.612,3.008),(.013,.021,.023),iris,segments=20,rings=12)
    curve('Upper eyelid_'+str(side),[(side*.15,-1.548,3.020),(side*.19,-1.589,3.046),(side*.174,-1.636,3.020)],.012,coat)
    curve('Lower eyelid_'+str(side),[(side*.15,-1.548,3.005),(side*.186,-1.589,2.981),(side*.174,-1.636,3.005)],.009,coat)
    nostril=ell('Nostril recessed shadow_'+str(side),(side*.132,-2.157,2.550),(.023,.026,.038),dark,segments=24,rings=12)
    nostril.rotation_euler.y=side*.35
    curve('Nostril rim_'+str(side),[(side*.137,-2.176,2.516),(side*.163,-2.175,2.565),(side*.131,-2.183,2.595)],.006,muzzle)
    curve('Mouth seam_'+str(side),[(side*.137,-2.208,2.474),(side*.151,-2.13,2.462),(side*.121,-1.966,2.482)],.005,dark)

# Feather texture atlas: separate closed feather meshes share the same UV map.
N=1024
yy,xx=np.mgrid[0:N,0:N].astype(np.float32);u=xx/(N-1);v=yy/(N-1)
barbs=np.sin((v+(np.abs(u-.48)*.24))*500)*.012+np.sin((v+np.abs(u-.48)*.31)*1790)*.006
shaft=np.exp(-((u-.48)/.018)**2)*.075
shade=.78+.12*v+barbs+shaft-.07*np.abs(u-.48)
rgba=np.ones((N,N,4),np.float32)
for k,t in enumerate([1.0,.985,.94]):rgba[:,:,k]=np.clip(shade*t,0,1)
image=bpy.data.images.new('Pegasus_Feather_BaseColor',width=N,height=N,alpha=True);image.pixels.foreach_set(rgba.ravel());image.filepath_raw=str(OUT/'Textures/Pegasus_Feather_BaseColor.png');image.file_format='PNG';image.save();image.pack()
nt=feathermat.node_tree;node=nt.nodes.new('ShaderNodeTexImage');node.image=image;nt.links.new(node.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])

def feather(name,start,end,width,side,layer=0):
    a,b=Vector(start),Vector(end);direction=b-a
    across=Vector((-direction.y,direction.x,0)).normalized()
    verts=[];faces=[];uv=[];rows=11;cols=7
    for back in [False,True]:
        for i in range(rows):
            t=i/(rows-1)
            # Broad vane, fine root and long taper; slightly swept distal tip.
            w=width*(math.sin(math.pi*(t*.94+.025))**.58)*(1-.30*t)
            if i==rows-1:w*=.10
            centre=a+direction*t+Vector((side*.035*t*t,.05*t*t,.075*math.sin(math.pi*t)))
            for j in range(cols):
                q=j/(cols-1);asym=(q-.48)*2
                offset=across*(w*asym)+Vector((0,0,(.023*(1-asym*asym)+.004)*(-1 if back else 1)))
                verts.append(centre+offset);uv.append((q,t))
    total=rows*cols
    for layer_index in range(2):
        base=layer_index*total
        for i in range(rows-1):
            for j in range(cols-1):
                n=base+i*cols+j;f=(n,n+1,n+1+cols,n+cols);faces.append(tuple(reversed(f)) if layer_index else f)
    for i in range(rows-1):
        for j in [0,cols-1]:n=i*cols+j;faces.append((n,n+cols,n+cols+total,n+total))
    for i in [0,rows-1]:
        for j in range(cols-1):n=i*cols+j;faces.append((n,n+1,n+1+total,n+total))
    return mesh(name,verts,faces,feathermat,uvs=uv)

for side in [-1,1]:
    suffix='L' if side<0 else 'R'
    tube('Wing_'+suffix+'_root',[(side*.34,-.35,2.04),(side*.64,-.27,2.25),(side*.96,-.22,2.58),(side*1.49,-.17,2.92),(side*2.15,-.27,3.18),(side*2.66,-.37,3.28)],[.15,.16,.13,.10,.07,.02],coat,sides=18)
    # Flight feathers attach along the arm; rearward vanes create the wing area.
    for i in range(14):
        t=i/13
        a=(side*(.61+1.48*t),-.22-.05*t,2.27+.92*t)
        b=(side*(.73+1.68*t),.70+.55*t,2.08+.58*t)
        feather('Wing_'+suffix+'_secondary_%02d'%i,a,b,.16,side)
    for i in range(12):
        t=i/11
        a=(side*(1.75+.91*t),-.23-.14*t,3.04+.24*t)
        b=(side*(2.09+1.17*t),1.17-.87*t,2.67+.48*t)
        feather('Wing_'+suffix+'_primary_%02d'%i,a,b,.19-.035*t,side)
    # Two staggered layers of coverts cover the primary/secondary roots.
    for row in range(2):
        for i in range(26):
            t=i/25;x=.48+2.18*t
            z=smooth_profiles([(.34,2.04),(.64,2.25),(.96,2.58),(1.49,2.92),(2.15,3.18),(2.66,3.28)],x)[0]
            a=(side*x,-.42+row*.10,z+.12+row*.025)
            b=(side*(x+.13),.25+row*.16,z-.015)
            feather('Wing_'+suffix+'_covert_%d_%02d'%(row,i),a,b,.125,side)
    # Leading-edge down feathers break up the bare arm silhouette.
    for i in range(24):
        x=.45+i*2.18/23
        z=smooth_profiles([(.34,2.04),(.64,2.25),(.96,2.58),(1.49,2.92),(2.15,3.18),(2.66,3.28)],x)[0]
        feather('Wing_'+suffix+'_leading_%02d'%i,(side*x,-.38,z+.1),(side*(x+.10),-.51,z-.025),.10,side)
    for i in range(12):
        t=i/11
        feather('Wing_'+suffix+'_scapular_%02d'%i,(side*(.34+.40*t),-.41+.05*t,2.06+.36*t),(side*(.57+.40*t),.05+.20*t,2.04+.30*t),.105,side)

# Long mane clumps flow down the crest; a layered tail has a real dock.
for i in range(30):
    t=i/29;y=-1.42+.72*t;z=3.17-1.03*t
    side=-1
    end=(side*(.16+.12*t),y+.18,z-.23-.20*t)
    curve('Mane lock %02d'%i,[(0,y,z),(-.035,y+.05,z+.03),end],.017+random.random()*.012,hairmat)
    for j in range(2):
        curve('Mane fine %02d_%d'%(i,j),[(.006*j,y,z+.02),(-.06-j*.012,y+.10,z-.08),(end[0]-.02*j,end[1]+.025*j,end[2]-.06)],.005,hairmat)
for i in range(9):
    x=(i-4)*.018
    curve('Forelock %02d'%i,[(x,-1.44,3.22),(x*.9,-1.60,3.19),(x*.8,-1.72,3.04)],.012,hairmat)
tube('Tail dock',[(0,1.03,1.86),(0,1.30,1.75),(.05,1.43,1.48)],[.12,.09,.05],coat,sides=16)
for i in range(72):
    a=i*math.tau/72;r=.09*math.sqrt((i%13+1)/13);x=math.cos(a)*r
    curve('Tail lock %02d'%i,[(x,1.22+math.sin(a)*.06,1.78),(x*1.2,1.48,1.35),(x*1.1+.08,1.65,.86),(.08+x*.8,1.62+math.sin(i)*.05,.36+random.random()*.16)],.010+random.random()*.009,hairmat)

# Removable lightweight tack; the mounting space between the wing roots is clear.
# The pad is a curved, thickened surface conforming to the ribcage.
verts=[];faces=[]
for j in range(13):
    y=-.14+j*.065
    for i in range(17):
        x=(i-8)*.058;z=2.105-.53*(abs(x)/.49)**1.7
        verts.append((x,y,z+.025))
for j in range(12):
    for i in range(16):n=j*17+i;faces.append((n,n+1,n+18,n+17))
pad=mesh('Tack_Linen_pad',verts,faces,cloth,tack)
solid=pad.modifiers.new('Woven pad thickness','SOLIDIFY');solid.thickness=.022
verts=[];faces=[]
for j in range(17):
    y=-.04+j*.040
    for i in range(13):
        x=(i-6)*.045;z=2.145-.43*(abs(x)/.44)**1.7+.08*((j-8)/8)**4
        verts.append((x,y,z))
for j in range(16):
    for i in range(12):n=j*13+i;faces.append((n,n+1,n+14,n+13))
saddle=mesh('Tack_Leather_saddle',verts,faces,leather,tack);mod=saddle.modifiers.new('Leather thickness','SOLIDIFY');mod.thickness=.035
for side in [-1,1]:
    curve('Tack_stirrup_leather_'+str(side),[(side*.22,.15,2.09),(side*.46,.14,1.85),(side*.48,.14,1.45)],.018,leather,tack)
    curve('Tack_stirrup_'+str(side),[(side*.48,.14,1.48),(side*.60,.14,1.36),(side*.48,.14,1.28),(side*.36,.14,1.36),(side*.48,.14,1.48)],.016,bronze,tack)
    curve('Tack_cheek_strap_'+str(side),[(side*.15,-1.4,3.15),(side*.205,-1.64,2.92),(side*.173,-2.05,2.55)],.011,leather,tack)
    curve('Tack_rein_'+str(side),[(side*.175,-2.05,2.52),(side*.30,-1.22,2.36),(side*.27,-.05,2.30)],.008,leather,tack)
curve('Tack_noseband',[(-.17,-2.06,2.57),(0,-2.19,2.65),(.17,-2.06,2.57)],.013,leather,tack)

# Convert hair curves to meshes and join each material into a small draw set.
for obj in list(asset.objects)+list(tack.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
        parts.append(bpy.context.object)
for col in [asset,tack]:
    materials={}
    for obj in list(col.objects):
        if obj.type=='MESH' and obj!=body:materials.setdefault(obj.data.materials[0].name,[]).append(obj)
    for name,group in materials.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:o.select_set(True)
        bpy.context.view_layer.objects.active=group[0]
        if len(group)>1:bpy.ops.object.join()
        bpy.context.object.name=('Tack_' if col==tack else 'Pegasus_')+name.split('|')[-1].strip().replace(' ','_')

# Small separate skin details have their own constant ivory material. They must
# not sample the body's packed UV atlas (its unused space is intentionally dark).
detailcoat=mat('Pegasus | ivory wing roots and small skin details',(.62,.60,.54),.76)
for col in [asset,tack]:
    for obj in col.objects:
        if obj.type=='MESH' and obj!=body:
            for i,m in enumerate(obj.data.materials):
                if m==coat:obj.data.materials[i]=detailcoat

# Bake the true coat into an ordinary image texture, portable across engines.
scene.render.engine='CYCLES';scene.cycles.samples=8
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=12
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
for kind,bake_type in [('BaseColor','DIFFUSE'),('Normal','NORMAL')]:
    image=bpy.data.images.new('Pegasus_Coat_'+kind,width=2048,height=2048,alpha=False)
    if kind=='Normal':image.colorspace_settings.name='Non-Color'
    node=coat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;coat.node_tree.nodes.active=node
    bpy.ops.object.bake(type=bake_type)
    image.filepath_raw=str(OUT/'Textures'/('Pegasus_Coat_'+kind+'.png'));image.file_format='PNG';image.save();image.pack()
    if kind=='BaseColor':base_node=node
    else:normal_node=node
    print('BAKED',kind,flush=True)
nt=coat.node_tree;p=nt.nodes.get('Principled BSDF')
nt.links.new(base_node.outputs['Color'],p.inputs['Base Color'])
norm=nt.nodes.new('ShaderNodeNormalMap');nt.links.new(normal_node.outputs['Color'],norm.inputs['Color']);nt.links.new(norm.outputs['Normal'],p.inputs['Normal'])

# Export clean geometry only. Source collection separation keeps tack removable.
objects=[o for col in [asset,tack] for o in col.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=body
scene.view_settings.view_transform='AgX'
bpy.ops.export_scene.gltf(filepath=str(OUT/'Models/DawnwingPegasus.glb'),export_format='GLB',use_selection=True,export_animations=False,export_apply=True)

# Neutral studio for genuine model previews; no generated concept images.
world=bpy.data.worlds.new('Neutral blue-grey studio');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs[0].default_value=(.10,.14,.17,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.45;scene.world=world
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));ground=move(bpy.context.object,studio);ground.name='Studio floor';ground.data.materials.append(mat('Studio matte',(.065,.085,.09),.9))
def area(name,at,power,color,size,target=(0,0,1.8)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    ob=bpy.data.objects.new(name,data);studio.objects.link(ob);ob.location=at;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
area('Large soft key',(3,-5,7),1250,(1,.91,.78),5)
area('Cool fill',(-4,-2,4.5),850,(.72,.84,1),5)
area('Feather rim',(1,4,6.5),1500,(1,.94,.83),4)
data=bpy.data.cameras.new('Preview Camera');camera=bpy.data.objects.new('Preview Camera',data);studio.objects.link(camera);scene.camera=camera;data.lens=52
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
camera.location=(7,-9,5);camera.rotation_euler=(Vector((0,-.10,1.95))-camera.location).to_track_quat('-Z','Y').to_euler()
report={'name':'Dawnwing Pegasus','status':'Original static first model; no rig or animation','units':'metres','objects':len(objects),'triangles':0,'wings':'Two layered closed feather wings','tack':'Separate removable meshes','source':'Procedurally authored original geometry and texture maps; no third-party assets'}
for o in objects:o.data.calc_loop_triangles();report['triangles']+=len(o.data.loop_triangles)
points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
report['bounds_min']=[min(p[i] for p in points) for i in range(3)];report['bounds_max']=[max(p[i] for p in points) for i in range(3)]
(OUT/'Reports/model.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Blender/DawnwingPegasus.blend'))
views=[] if '--no-previews' in sys.argv else [('Hero',(7,-9,4.7),(0,-.10,1.9)),('Profile',(10,-.1,3.4),(0,-.20,1.8)),('Front',(0,-12,3.6),(0,-.1,1.9)),('Rear',(7,9,4.9),(0,.1,1.9)),('Head',(3.2,-5.8,3.6),(0,-1.60,2.84))]
for name,at,target in views:
    camera.location=at;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();data.lens=65 if name=='Head' else 52
    scene.render.filepath=str(OUT/'Previews'/(name+'.png'));bpy.ops.render.render(write_still=True);print('PREVIEW',name,flush=True)
print('PEGASUS COMPLETE',json.dumps(report),flush=True)
