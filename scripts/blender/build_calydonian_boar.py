"""Original static Ash-Tusk boar asset. No rig, animation or third-party art.
blender --background --python scripts/blender/build_calydonian_boar.py -- <project> [--draft]
"""
import bpy,bmesh,math,random,json,sys,os,tempfile
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1]);OUT=ROOT/'assets-source/creatures/ash-tusk-boar';OUT.mkdir(parents=True,exist_ok=True)
DRAFT='--draft' in sys.argv
QUICK='--quick' in sys.argv
# Keep exporter scratch files in the project: the Windows app's virtual temp
# directory does not support Blender's temporary-image cleanup reliably.
scratch=OUT/'scratch';scratch.mkdir(exist_ok=True)
os.environ['TMP']=os.environ['TEMP']=str(scratch);tempfile.tempdir=str(scratch)
random.seed(9071)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials):bpy.data.materials.remove(data)
asset=bpy.data.collections.new('ASSET · Ash-Tusk Boar · static');bpy.context.scene.collection.children.link(asset)
studio=bpy.data.collections.new('STUDIO · excluded from exports');bpy.context.scene.collection.children.link(studio)
parts=[];bake_parts=[]
def move(ob,collection=asset):
 for c in list(ob.users_collection):c.objects.unlink(ob)
 collection.objects.link(ob);return ob
def material(name,color,rough=.7):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;m.diffuse_color=(*color,1);return m
coat=material('Coat · charcoal umber',(.052,.032,.019),.86)
nt=coat.node_tree;p=nt.nodes.get('Principled BSDF');coord=nt.nodes.new('ShaderNodeTexCoord');mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(65,6,75);nt.links.new(coord.outputs['Generated'],mapping.inputs[0])
noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=4;noise.inputs['Detail'].default_value=2.5;noise.inputs['Roughness'].default_value=.7;nt.links.new(mapping.outputs[0],noise.inputs['Vector'])
color=nt.nodes.new('ShaderNodeValToRGB');color.color_ramp.elements[0].position=.22;color.color_ramp.elements[0].color=(.003,.0035,.004,1);color.color_ramp.elements[1].position=.78;color.color_ramp.elements[1].color=(.020,.018,.016,1);nt.links.new(noise.outputs['Fac'],color.inputs[0])
tint=nt.nodes.new('ShaderNodeVertexColor');tint.layer_name='CoatTint';mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=.65;nt.links.new(color.outputs['Color'],mix.inputs[1]);nt.links.new(tint.outputs['Color'],mix.inputs[2]);nt.links.new(mix.outputs[0],p.inputs['Base Color'])
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=.012;nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
scar_attr=nt.nodes.new('ShaderNodeVertexColor');scar_attr.layer_name='ScarMask';scar_mix=nt.nodes.new('ShaderNodeMixRGB');scar_mix.inputs[2].default_value=(.075,.024,.016,1);nt.links.new(scar_attr.outputs['Color'],scar_mix.inputs[0]);nt.links.new(mix.outputs[0],scar_mix.inputs[1]);nt.links.new(scar_mix.outputs[0],p.inputs['Base Color'])
leather_noise=nt.nodes.new('ShaderNodeTexNoise');leather_noise.inputs['Scale'].default_value=30;leather_noise.inputs['Detail'].default_value=4;leather_bump=nt.nodes.new('ShaderNodeBump');leather_bump.inputs['Strength'].default_value=.4;leather_bump.inputs['Distance'].default_value=.014;nt.links.new(leather_noise.outputs['Fac'],leather_bump.inputs['Height']);nt.links.new(bump.outputs[0],leather_bump.inputs['Normal']);nt.links.new(leather_bump.outputs[0],p.inputs['Normal'])
ivory=material('Tusks · aged ivory',(.38,.33,.24),.49);nt=ivory.node_tree;n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=23;n.inputs['Detail'].default_value=3;b=nt.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.3;b.inputs['Distance'].default_value=.009;nt.links.new(n.outputs['Fac'],b.inputs['Height']);nt.links.new(b.outputs[0],nt.nodes.get('Principled BSDF').inputs['Normal']);r=nt.nodes.new('ShaderNodeValToRGB');r.color_ramp.elements[0].color=(.12,.074,.038,1);r.color_ramp.elements[1].color=(.62,.53,.38,1);nt.links.new(n.outputs['Fac'],r.inputs[0]);nt.links.new(r.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
keratin=material('Cloven hooves · dark keratin',(.018,.015,.013),.70)
nosemat=material('Nose and lips · weathered leather',(.034,.023,.019),.56);nt=nosemat.node_tree;n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=58;n.inputs['Detail'].default_value=2;b=nt.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.25;b.inputs['Distance'].default_value=.009;nt.links.new(n.outputs['Fac'],b.inputs['Height']);nt.links.new(b.outputs[0],nt.nodes.get('Principled BSDF').inputs['Normal'])
inner=material('Inner ear · weathered dark hide',(.025,.012,.009),.86);black=material('Nostrils and mouth recess',(.004,.003,.002),.65);scar=material('Healed scar tissue',(.13,.079,.045),.9)
eye=material('Eyes · dark wet sclera',(.003,.003,.002),.14);iris=material('Iris · dark amber',(.22,.068,.003),.28);pupil=material('Pupil',(.001,.001,.001),.14);bristle=material('Clumped fur · charcoal and rust vertex tint',(.012,.010,.009),.86);nt=bristle.node_tree;vcol=nt.nodes.new('ShaderNodeVertexColor');vcol.layer_name='BristleTint';nt.links.new(vcol.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color']);n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=170;b=nt.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.25;b.inputs['Distance'].default_value=.003;nt.links.new(n.outputs['Fac'],b.inputs['Height']);nt.links.new(b.outputs[0],nt.nodes.get('Principled BSDF').inputs['Normal'])

def mesh(name,verts,faces,mat,bake=True,sub=0):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();ob=bpy.data.objects.new(name,data);asset.objects.link(ob);data.materials.append(mat)
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
 for f in data.polygons:f.use_smooth=True
 if mat==coat:
  mask=data.color_attributes.new(name='ScarMask',type='FLOAT_COLOR',domain='POINT')
  for item in mask.data:item.color=(0,0,0,1)
  attr=data.color_attributes.new(name='CoatTint',type='FLOAT_COLOR',domain='POINT')
  for vertex,c in zip(data.vertices,attr.data):
   x,y,z=vertex.co;age=max(0,min(1,(-y-1.15)/1.1));underside=max(0,min(1,(z-.3)/1.4));c.color=(.54+age*.37,.49+age*.34,.42+age*.3,1) if y<-1.1 else (.65+underside*.26,.57+underside*.23,.46+underside*.2,1)
 if sub:
  mod=ob.modifiers.new('Editable surface subdivision','SUBSURF');mod.levels=sub;mod.render_levels=sub
 parts.append(ob)
 if bake:bake_parts.append(ob)
 return ob

def sample(profiles,t):
 # Shape-preserving cubic interpolation along the longitudinal axis.
 i=next((i for i in range(len(profiles)-1) if profiles[i][0]<=t<=profiles[i+1][0]),len(profiles)-2);a,b=profiles[i],profiles[i+1];u=max(0,min(1,(t-a[0])/(b[0]-a[0])));prev=profiles[max(0,i-1)];nxt=profiles[min(len(profiles)-1,i+2)];out=[]
 for k in range(1,len(a)):
  m0=(b[k]-prev[k])/(b[0]-prev[0]);m1=(nxt[k]-a[k])/(nxt[0]-a[0]);d=b[0]-a[0];out.append((2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*d*m0+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*d*m1)
 return out

# One continuous quad cage: torso, head and all four legs share vertices.
profiles=[(-1.1,1.32,.43,.46),(-.9,1.34,.64,.70),(-.55,1.34,.71,.75),(-.15,1.25,.66,.65),(.25,1.20,.53,.53),(.65,1.20,.49,.48),(1.,1.12,.38,.42),(1.28,1.04,.23,.27)]
head_profiles=[(-2.05,1.03,.285,.20),(-1.91,1.07,.32,.25),(-1.72,1.20,.40,.35),(-1.50,1.32,.49,.46),(-1.30,1.38,.48,.50),(-1.1,1.32,.43,.46)]

def torso_surface(y,a):
 cz,rx,rz=sample(profiles,y)
 # Anatomical masses sit in the continuous skin, rather than separate spheres.
 side=abs(math.cos(a));s=math.sin(a)
 shoulder=.10*math.exp(-((y+.57)/.24)**2)*side**5
 scapula=.105*math.exp(-((y+.18+.20*s)/.13)**2)*max(0,s+.4)*side**2
 ham=.11*math.exp(-((y-.76)/.25)**2)*side**5
 neck=-.038*math.exp(-((y+1.)/.27)**2)*math.cos((y+1)*53+s*4)*side**2
 ribs=.021*math.sin(y*36+s*2)*math.exp(-((y-.08)/.47)**2)*side**6
 amount=shoulder+scapula+ham+neck+ribs
 return Vector((math.cos(a)*(rx+amount),y,cz+s*(rz+amount)))

def head_surface(y,a):
 cz,rx,rz=sample(head_profiles,y);s=math.sin(a);side=abs(math.cos(a))
 cheek=.055*math.exp(-((y+1.48)/.18)**2)*side**6
 nasal=.012*math.sin((y+1.83)*60)*math.exp(-((y+1.82)/.26)**2)*max(0,s)**8
 x=math.cos(a)*(rx+cheek);z=cz+s*rz+nasal
 # Raise the back of the upper jaw, leaving a physical mouth opening.
 if s<-.5:z+=.07*math.exp(-((y+1.67)/.30)**2)*(-s)**4
 return Vector((x,y,z))
verts=[];faces=[];ROWS=49;SIDES=32
for i in range(ROWS):
 y=-1.1+(1.28+1.1)*i/(ROWS-1)
 for j in range(SIDES):
  a=j/SIDES*math.tau;verts.append(torso_surface(y,a))
holes=[(7,11,18,22,-1,'Fore.L'),(7,11,26,30,1,'Fore.R'),(35,39,18,22,-1,'Hind.L'),(35,39,26,30,1,'Hind.R')]
for i in range(ROWS-1):
 for j in range(SIDES):
  if any(i0<=i<i1 and j0<=j<j1 for i0,i1,j0,j1,_,_ in holes):continue
  a=i*SIDES+j;b=i*SIDES+(j+1)%SIDES;faces.append((a,b,b+SIDES,a+SIDES))
faces.append(tuple((ROWS-1)*SIDES+j for j in range(SIDES)))
# Head starts at the exact open neck ring and narrows into a flat nasal disc.
last=list(range(SIDES))
for i in range(1,25):
 y=-1.1-(2.05-1.1)*i/24;ring=[]
 for j in range(SIDES):
  a=j/SIDES*math.tau;ring.append(len(verts));verts.append(head_surface(y,a))
 for j in range(SIDES):faces.append((last[j],last[(j+1)%SIDES],ring[(j+1)%SIDES],ring[j]))
 last=ring
faces.append(tuple(reversed(last)))
# Each 16-edge shoulder/hip opening bridges into a sculpted, bent leg.
for i0,i1,j0,j1,side,name in holes:
 boundary=[i*SIDES+j0 for i in range(i0,i1)]+[i1*SIDES+j for j in range(j0,j1)]+[i*SIDES+j1 for i in range(i1,i0,-1)]+[i0*SIDES+j for j in range(j1,j0,-1)]
 center=sum((Vector(verts[k]) for k in boundary),Vector())/len(boundary);boundary.sort(key=lambda k:math.atan2(verts[k][1]-center.y,verts[k][0]-center.x));last=boundary;phase=math.atan2(verts[last[0]][1]-center.y,verts[last[0]][0]-center.x)
 if name.startswith('Fore'):path=[(.75,.54,-.65,.205,.23),(.60,.56,-.67,.17,.19),(.43,.56,-.72,.12,.14),(.25,.55,-.82,.09,.11),(.12,.55,-.85,.095,.105)]
 else:path=[(.76,.51,.65,.24,.25),(.57,.53,.54,.20,.20),(.38,.52,.80,.13,.14),(.26,.52,.94,.09,.105),(.12,.52,.82,.095,.11)]
 # Two interpolated rings per segment keep the bend topology smooth.
 expanded=[]
 for i,p in enumerate(path):
  if i:expanded.append(tuple((a+b)*.5 for a,b in zip(path[i-1],p)))
  expanded.append(p)
 for z,x,y,rx,ry in expanded:
  ring=[]
  for k in range(16):
   a=phase+k/16*math.tau;ring.append(len(verts));verts.append((side*x+math.cos(a)*rx,y+math.sin(a)*ry,z))
  for k in range(16):faces.append((last[k],last[(k+1)%16],ring[(k+1)%16],ring[k]))
  last=ring
 faces.append(tuple(reversed(last)))
body=mesh('01 · Continuous body head and legs',verts,faces,coat,sub=2)
# Preserve the original modelling cage separately, outside the visible/export asset.
source_collection=bpy.data.collections.new('SOURCE · original quad modelling cage');bpy.context.scene.collection.children.link(source_collection)
cage=body.copy();cage.data=body.data.copy();cage.name='Original editable quad cage';source_collection.objects.link(cage);source_collection.hide_render=True;source_collection.hide_viewport=True
bpy.context.view_layer.objects.active=body;body.select_set(True);bpy.ops.object.modifier_apply(modifier=body.modifiers[0].name)
# Recessed claw scars with raised, irregular healed edges. Colour and displacement
# are computed on the skin itself, not on floating decal or tube objects.
scar_paths=[]
for side,lines in [(1,[(-.84,.40,-.25,.04),(-.66,.65,-.03,.22),(-.38,.80,.16,.42),(.63,.42,.91,.05)]),(-1,[(-.70,.25,-.17,.67),(-.46,.18,.07,.56),(.55,.10,.92,.40)])]:
 for y0,a0,y1,a1 in lines:
  scar_paths.append([torso_surface(y0+(y1-y0)*t,a0+(a1-a0)*t)*Vector((side,1,1)) for t in np.linspace(0,1,24)])
positions=np.empty(len(body.data.vertices)*3,dtype=np.float32);body.data.vertices.foreach_get('co',positions);positions=positions.reshape((-1,3));distance=np.full(len(positions),100,dtype=np.float32)
for line in scar_paths:
 for point in line:distance=np.minimum(distance,np.linalg.norm(positions-np.array(point),axis=1))
normals=np.empty(len(body.data.vertices)*3,dtype=np.float32);body.data.vertices.foreach_get('normal',normals);normals=normals.reshape((-1,3))
grain=np.sin(positions[:,0]*99+positions[:,1]*51)*np.sin(positions[:,2]*77-positions[:,1]*37)
displace=-.018*np.exp(-(distance/.010)**2)+.010*np.exp(-((distance-.019)/.008)**2)+.0025*grain
positions+=normals*displace[:,None];body.data.vertices.foreach_set('co',positions.ravel());body.data.update()
mask=body.data.color_attributes['ScarMask']
for item,d in zip(mask.data,distance):v=.84*math.exp(-(float(d)/.016)**2);item.color=(v,v,v,1)

def ellipsoid(name,center,scale,mat,bake=True,segments=24,rings=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center);ob=bpy.context.object;ob.name=name;move(ob);ob.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(mat)
 for p in ob.data.polygons:p.use_smooth=True
 parts.append(ob)
 if bake:bake_parts.append(ob)
 if mat==coat:
  mask=ob.data.color_attributes.new(name='ScarMask',type='FLOAT_COLOR',domain='POINT')
  for item in mask.data:item.color=(0,0,0,1)
  attr=ob.data.color_attributes.new(name='CoatTint',type='FLOAT_COLOR',domain='POINT')
  for c in attr.data:c.color=(.8,.73,.63,1)
 return ob

def tube(name,points,radii,mat,sides=16,steps=5,bake=True):
 # Catmull-Rom sweep with a transported radial frame and closed end caps.
 controls=[Vector(p) for p in points];curve=[];rs=[]
 for i in range(len(controls)-1):
  a,b,c,d=controls[max(0,i-1)],controls[i],controls[i+1],controls[min(len(controls)-1,i+2)]
  for j in range(steps):
   t=j/steps;curve.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t));rs.append(radii[i]*(1-t)+radii[i+1]*t)
 curve.append(controls[-1]);rs.append(radii[-1]);v=[];f=[];last_axis=Vector((1,0,0))
 for i,p in enumerate(curve):
  direction=(curve[min(i+1,len(curve)-1)]-curve[max(0,i-1)]).normalized();axis=last_axis-direction*last_axis.dot(direction)
  if axis.length<.01:axis=direction.cross(Vector((0,1,0)))
  axis.normalize();second=direction.cross(axis).normalized();last_axis=axis
  for k in range(sides):
   a=k/sides*math.tau;r=rs[i]*(1+.025*math.sin(i*1.7));v.append(p+(axis*math.cos(a)+second*math.sin(a))*r)
  if i:
   for k in range(sides):a=(i-1)*sides+k;b=(i-1)*sides+(k+1)%sides;f.append((a,b,b+sides,a+sides))
 f.append(tuple(reversed(range(sides))));f.append(tuple((len(curve)-1)*sides+k for k in range(sides)));return mesh(name,v,f,mat,bake)

ellipsoid('02 · Lower jaw',(0,-1.66,.72),(.31,.46,.105),coat)
ellipsoid('Mouth · dark oral cavity',(0,-1.70,.86),(.32,.35,.15),black)
nose=ellipsoid('Nose · leathery nasal disc',(0,-2.065,1.03),(.285,.080,.18),nosemat,segments=48,rings=32)
for v in nose.data.vertices:
 if v.co.y<0:
  depression=sum(math.exp(-((v.co.x-s*.102)**2/.0019+(v.co.z-.025)**2/.0016)) for s in [-1,1]);v.co.y+=depression*.036
for side in [-1,1]:
 # True recessed nostril openings, with dark interior tissue behind the rim.
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=(side*.122,-2.13,1.065));cutter=bpy.context.object;cutter.scale=(.062,.115,.045);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 boolean=nose.modifiers.new('Carved nostril opening','BOOLEAN');boolean.operation='DIFFERENCE';boolean.object=cutter;bpy.context.view_layer.objects.active=nose;bpy.ops.object.modifier_apply(modifier=boolean.name);bpy.data.objects.remove(cutter,do_unlink=True)
 nose.data.materials.clear();nose.data.materials.append(nosemat)
 for polygon in nose.data.polygons:polygon.material_index=0
 ob=ellipsoid('Nostril interior '+str(side),(side*.122,-2.043,1.065),(.054,.012,.036),black);ob.rotation_euler.y=side*.12
 # Four tusks, heavy at the base and needle tapered at the ends.
 tube('Main lower tusk '+str(side),[(side*.30,-1.67,.91),(side*.53,-1.83,.87),(side*.76,-1.96,1.08),(side*.83,-1.93,1.43),(side*.70,-1.80,1.90)],[.14,.128,.094,.055,.0015],ivory,24,10)
 tube('Upper honing tusk '+str(side),[(side*.39,-1.70,1.15),(side*.53,-1.80,1.09),(side*.60,-1.78,.96)],[.072,.045,.0015],ivory,16,8)
 tube('Upper snarling lip '+str(side),[(side*.26,-1.98,.89),(side*.32,-1.76,.94),(side*.37,-1.54,1.01)],[.018,.027,.01],nosemat,10)
 tube('Lower lip '+str(side),[(side*.22,-2.00,.755),(side*.29,-1.78,.735),(side*.30,-1.48,.80)],[.008,.012,.006],nosemat,10)
 for i in range(5):
  y=-1.96+i*.092;x=side*(.22+i*.025)
  tube('Lower exposed tooth',[(x,y,.80),(x*1.03,y-.016,.86+(.014 if i==3 else 0))],[.020,.001],ivory,8,3)
  if i>1:tube('Upper exposed tooth',[(x*1.06,y,.93+i*.013),(x*1.07,y-.01,.855+i*.011)],[.019,.001],ivory,8,3)
 # Inset eyes point outward and slightly forward, beneath heavy brows.
 eye_center=head_surface(-1.55,.18)*Vector((side,1,1));out=Vector((side*.75,-.66,.06)).normalized()
 ellipsoid('Eyeball '+str(side),eye_center,(.052,.045,.030),eye,False)
 iris_ob=ellipsoid('Amber iris '+str(side),eye_center+out*.041,(.024,.006,.014),iris,False);iris_ob.rotation_euler=Vector((0,-1,0)).rotation_difference(out).to_euler()
 pupil_ob=ellipsoid('Dark pupil '+str(side),eye_center+out*.048,(.008,.004,.012),pupil,False);pupil_ob.rotation_euler=Vector((0,-1,0)).rotation_difference(out).to_euler()
 horizontal=out.cross(Vector((0,0,1))).normalized();lid=[]
 for t in np.linspace(0,math.pi,9):lid.append(eye_center+out*.027+horizontal*math.cos(t)*.050+Vector((0,0,.022*math.sin(t))))
 tube('Upper orbital eyelid '+str(side),lid,[.009]*len(lid),coat,8,2)
 brow=[]
 for y,angle in [(-1.72,.32),(-1.54,.34),(-1.32,.53)]:brow.append(head_surface(y,angle)*Vector((side,1,1)))
 tube('Heavy scowling brow '+str(side),brow,[.022,.045,.018],coat,16)
 # Cupped ears: a sealed inner and outer shell, tapered triangular silhouette.
 outline=[(.34,-1.04,1.63),(.52,-1.10,1.67),(.68,-.97,1.98),(.59,-.78,1.84),(.38,-.83,1.65)]
 ev=[(side*x,y,z) for x,y,z in outline]+[(side*.49,-.92,1.72)]+[(side*x,y+.055,z-.015) for x,y,z in outline]+[(side*.48,-.87,1.72)]
 ef=[]
 for k in range(5):ef.extend([(5,k,(k+1)%5),(11,6+(k+1)%5,6+k),(k,6+k,6+(k+1)%5,(k+1)%5)])
 ear=mesh('Ear outer '+str(side),ev,ef,coat,sub=2)
 iv=[(side*.49,-.963,1.75),(side*.39,-1.01,1.67),(side*.52,-1.06,1.70),(side*.62,-.96,1.89),(side*.56,-.85,1.79)]
 mesh('Ear cup '+str(side),iv,[(0,1,2),(0,2,3),(0,3,4),(0,4,1)],inner)
 # Subtle skin folds articulate the long wedge-shaped muzzle.
 fold=[]
 for y in [-1.98,-1.85,-1.70]:fold.append(head_surface(y,.80)*Vector((side,1,1)))
 # Split hooves with a genuine central cleft and small rear dewclaws.
 for fore in [True,False]:
  foot_y=-.88 if fore else .82;foot_x=.55 if fore else .52
  for toe in [-1,1]:
   v=[];f=[];levels=[(.012,.075,.16),(.035,.085,.16),(.12,.080,.14),(.17,.06,.095)]
   for z,rx,ry in levels:
    for j in range(12):a=j/12*math.tau;v.append((side*foot_x+toe*.085+math.cos(a)*rx,foot_y+math.sin(a)*ry-.035,z))
   for j in range(3):
    for k in range(12):a=j*12+k;b=j*12+(k+1)%12;f.append((a,b,b+12,a+12))
   f.append(tuple(reversed(range(12))));f.append(tuple(36+k for k in range(12)));hoof=mesh(('Fore' if fore else 'Hind')+' hoof '+str(side)+' '+str(toe),v,f,keratin);bevel=hoof.modifiers.new('Worn hoof edge','BEVEL');bevel.width=.008;bevel.segments=2
  for dx in [-.065,.065]:ellipsoid('Dewclaw',(side*foot_x+dx,foot_y+.055,.225),(.025,.045,.045),keratin)

tube('Tail · tapered old boar',[(0,1.18,1.06),(0,1.47,1.00),(.08,1.68,.90),(.15,1.80,.91)],[.07,.052,.032,.013],coat,12)

# Geometry guard hairs: no particle system, hair shader or alpha cards.
hair_v=[];hair_f=[];hair_colors=[]
def hair(points,radius,color):
 start=len(hair_v)
 for j,p in enumerate(points):
  tangent=(points[min(j+1,len(points)-1)]-points[max(0,j-1)]).normalized();axis=tangent.cross(Vector((0,1,0)))
  if axis.length<.01:axis=tangent.cross(Vector((1,0,0)))
  axis.normalize();across=tangent.cross(axis).normalized();t=j/(len(points)-1)
  for k in range(3):a=k/3*math.tau;hair_v.append(p+(axis*math.cos(a)+across*math.sin(a))*radius*(1-t*.98));hair_colors.append(tuple(c*(.68+.32*t) for c in color))
 for j in range(len(points)-1):
  for k in range(3):a=start+j*3+k;b=start+j*3+(k+1)%3;hair_f.append((a,b,b+3,a+3))
def tuft(root,out,direction,length,width,rust=0):
 # A curved solid lock with a ridged cross section. Off-axis split ends and
 # varied sweep prevent the flat cards / uniformly upright bristle appearance.
 out=out.normalized();direction=direction.normalized();across=direction.cross(out)
 if across.length<.01:across=Vector((1,0,0))
 across.normalize();bend=across*random.uniform(-.09,.09)*length
 start=len(hair_v);sections=7;sides=8
 for i in range(sections):
  t=i/(sections-1);p=root+out*(length*.19*math.sin(t*math.pi))+direction*(length*t)+bend*t*t
  w=width*.32*(.6+.6*math.sin(t*math.pi))*max(.012,(1-t)**.7)
  for k in range(sides):
   a=k/sides*math.tau;ridge=1+.18*math.cos(k*math.pi+i*.4)
   hair_v.append(p+across*math.cos(a)*w+out*math.sin(a)*w*.18*ridge)
   # Rust appears sparsely along the broken crest tips, rather than glowing.
   warm=rust*t*t;v=random.uniform(.88,1.12)
   hair_colors.append(((.007+warm*.065)*v,(.007+warm*.011)*v,(.008+warm*.005)*v))
  if i:
   for k in range(sides):a=start+(i-1)*sides+k;b=start+(i-1)*sides+(k+1)%sides;hair_f.append((a,b,b+sides,a+sides))
 hair_f.append(tuple(start+k for k in reversed(range(sides))));hair_f.append(tuple(start+(sections-1)*sides+k for k in range(sides)))
 # Fine broken edges catch light independently of the broader locks.
 for k in range(9):
  offset=across*width*random.uniform(-.7,.7);p=root+offset;l=length*random.uniform(.85,1.22);d=direction+across*random.uniform(-.2,.2)
  hair([p,p+out*l*.21+d*l*.30,p+out*l*.10+d*l*.7,p+d*l],random.uniform(.001,.0022),(.014+rust*.026,.009+rust*.006,.008))

for i in range(8000):
 y=random.uniform(-1.04,1.12);a=random.uniform(-math.pi,math.pi);out=Vector((math.cos(a),.1,math.sin(a))).normalized();p=torso_surface(y,a)-out*.009
 length=random.uniform(.045,.14);direction=(out*.45+Vector((0,1,-.12))).normalized();hair([p,p+out*length*.20+direction*length*.25,p+direction*length*.67,p+direction*length],random.uniform(.001,.0022),(.011,.010,.010))
# Heavy irregular crest flows from the brow over the shoulders and down the back.
for i in range(380):
 y=random.uniform(-1.10,.99);a=math.pi/2+random.uniform(-.48,.48);out=Vector((math.cos(a),0,math.sin(a)));p=torso_surface(max(-1.1,y),a)-out*.018
 length=random.uniform(.28,.56)*(1-.20*max(0,y));direction=Vector((random.uniform(-.22,.22),random.uniform(.7,1.1),random.uniform(.45,.95)))
 tuft(p,out,direction,length,random.uniform(.025,.052),random.uniform(.1,.85))
# Clumped neck ruff and hanging shoulder locks, with deliberate bare scarred areas.
for i in range(650):
 y=random.uniform(-1.07,.25);a=random.uniform(-.45,math.pi+.45);out=Vector((math.cos(a),0,math.sin(a)));p=torso_surface(y,a)-out*.016
 # Keep the middle of the flank readable instead of blanketing all anatomy.
 if abs(math.cos(a))>.82 and y>-.72 and random.random()<.65:continue
 direction=Vector((math.cos(a)*.27,1.,-.38 if math.sin(a)<.5 else .12));length=random.uniform(.12,.30)
 tuft(p,out,direction,length,random.uniform(.014,.032),random.uniform(0,.30))
for i in range(330):
 y=random.uniform(.25,1.17);a=random.uniform(-math.pi,math.pi);out=Vector((math.cos(a),0,math.sin(a)));p=torso_surface(y,a)-out*.012
 if abs(math.cos(a))>.80 and random.random()<.7:continue
 tuft(p,out,Vector((math.cos(a)*.3,1,-.3)),random.uniform(.10,.22),random.uniform(.012,.027),random.uniform(0,.18))
for i in range(3000):
 y=random.uniform(-1.99,-1.15);a=random.uniform(-math.pi,math.pi);p=head_surface(y,a);out=Vector((math.cos(a),0,math.sin(a)));p-=out*.007
 length=random.uniform(.025,.075);direction=Vector((math.cos(a)*.2,1,-.12)).normalized();hair([p,p+out*length*.2+direction*length*.2,p+direction*length],random.uniform(.0008,.0014),(.014,.011,.010))
# Cheek whiskers and ragged beard frame a low, broad and threatening face.
for side in [-1,1]:
 for i in range(105):
  y=random.uniform(-1.73,-1.19);a=random.uniform(-.60,1.18);out=Vector((side*math.cos(a),0,math.sin(a)));p=head_surface(y,a)*Vector((side,1,1))-out*.01
  if -1.70<y<-1.35 and .02<a<.50:continue
  tuft(p,out,Vector((side*.32,.85,-.40)),random.uniform(.09,.23),random.uniform(.010,.027),random.uniform(0,.4))
 for i in range(40):
  y=random.uniform(-1.96,-1.29);p=Vector((side*random.uniform(.15,.28),y,.71));tuft(p,Vector((side,0,-.4)),Vector((side*.15,.65,-.8)),random.uniform(.09,.20),random.uniform(.01,.022),.18)
for i in range(60):
 y=random.uniform(-1.66,-1.10);p=head_surface(y,math.pi/2+random.uniform(-.25,.25));tuft(p,Vector((0,0,1)),Vector((random.uniform(-.1,.1),1,.45)),random.uniform(.14,.28),random.uniform(.014,.031),random.uniform(.25,.85))
for i in range(320):
 y=random.uniform(-1.88,-1.12);a=random.uniform(.5,math.pi-.5);out=Vector((math.cos(a),0,math.sin(a)));p=head_surface(y,a)-out*.012
 tuft(p,out,Vector((math.cos(a)*.35,1,.08)),random.uniform(.06,.15),random.uniform(.007,.017),random.uniform(0,.25))
for i in range(55):
 p=Vector((.14,1.76,.91));hair([p,p+Vector((random.uniform(-.06,.06),.10,random.uniform(-.03,.04))),p+Vector((random.uniform(-.08,.08),.21,random.uniform(-.05,.07)))],.003,(.045,.027,.015))
hair_ob=mesh('Guard hairs · spine crest and coat',hair_v,hair_f,bristle,False);attr=hair_ob.data.color_attributes.new(name='BristleTint',type='FLOAT_COLOR',domain='POINT')
for item,c in zip(attr.data,hair_colors):item.color=(*c,1)

# A mythic scale: approximately 2.8 m at the shoulder, 5 m nose-to-rump.
SCALE=1.35
for ob in parts+[cage]:
 for vertex in ob.data.vertices:vertex.co*=SCALE
 ob.location*=SCALE
 ob.location.z-=.012*SCALE

# Editable, packed UVs are shared by the bakeable surfaces.
bpy.ops.object.select_all(action='DESELECT')
for ob in bake_parts:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(62),island_margin=.006);bpy.ops.object.mode_set(mode='OBJECT')
for ob in parts:ob['asset']='Ash-Tusk Boar';ob['rigged']=False
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.image_settings.file_format='PNG';scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=65 if QUICK else 100

def bake_maps(map_prefix='AshTusk'):
 textures=OUT/'textures';textures.mkdir(exist_ok=True);original={};targets={}
 # One evaluated bake surface avoids allocating a complete 4K image for every
 # separate tooth and hoof. Preserve per-object generated coordinates in an
 # attribute before joining, so their procedural materials retain their scale.
 source_mats={m for ob in bake_parts for m in ob.data.materials};bake_mats={}
 for m in source_mats:
  m.use_fake_user=True;copy=m.copy();copy.name=m.name+' · bake only';bake_mats[m]=copy;nt=copy.node_tree
  coord=nt.nodes.new('ShaderNodeAttribute');coord.attribute_name='GeneratedLocal'
  for node in list(nt.nodes):
   if node.type=='TEX_COORD':
    for link in list(node.outputs['Generated'].links):nt.links.new(coord.outputs['Vector'],link.to_socket)
   if node.type=='TEX_NOISE' and not node.inputs['Vector'].is_linked:nt.links.new(coord.outputs['Vector'],node.inputs['Vector'])
 proxy_collection=bpy.data.collections.new('TEMP · texture bake only');scene.collection.children.link(proxy_collection);proxies=[];depsgraph=bpy.context.evaluated_depsgraph_get()
 for ob in bake_parts:
  data=bpy.data.meshes.new_from_object(ob.evaluated_get(depsgraph),preserve_all_data_layers=True,depsgraph=depsgraph);proxy=bpy.data.objects.new('Bake '+ob.name,data);proxy_collection.objects.link(proxy);proxy.matrix_world=ob.matrix_world.copy();proxies.append(proxy)
  coordinates=np.array([tuple(v.co) for v in data.vertices],dtype=np.float32);lo=coordinates.min(axis=0);size=np.maximum(coordinates.max(axis=0)-lo,.000001);generated=data.attributes.new('GeneratedLocal','FLOAT_VECTOR','POINT');generated.data.foreach_set('vector',((coordinates-lo)/size).ravel())
  for i,m in enumerate(data.materials):data.materials[i]=bake_mats[m]
 bpy.ops.object.select_all(action='DESELECT')
 for ob in proxies:ob.select_set(True)
 bpy.context.view_layer.objects.active=proxies[0];bpy.ops.object.join();proxy=bpy.context.object
 visibility={ob:ob.hide_render for ob in parts}
 for ob in parts:ob.hide_render=True
 materials=set(bake_mats.values())
 scene.cycles.samples=8;scene.render.bake.margin=12;scene.render.bake.use_clear=False
 for m in materials:
  nt=m.node_tree;output=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL');original[m]=output.inputs['Surface'].links[0].from_socket;targets[m]=nt.nodes.new('ShaderNodeTexImage');targets[m].label='Baked atlas target';nt.nodes.active=targets[m]
 maps={}
 for kind in ['BaseColor','Roughness','Normal']:
  image=bpy.data.images.new(map_prefix+'_'+kind,4096,4096,alpha=False);image.colorspace_settings.name='sRGB' if kind=='BaseColor' else 'Non-Color';image.generated_color=(.5,.5,1,1) if kind=='Normal' else (.8,.8,.8,1) if kind=='Roughness' else (.025,.025,.02,1);maps[kind]=image
  for m in materials:
   nt=m.node_tree;targets[m].image=image;nt.nodes.active=targets[m];output=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL');principled=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
   for link in list(output.inputs['Surface'].links):nt.links.remove(link)
   if kind=='Normal':nt.links.new(original[m],output.inputs['Surface'])
   else:
    emission=nt.nodes.new('ShaderNodeEmission');source=principled.inputs['Base Color' if kind=='BaseColor' else 'Roughness'];emission.inputs['Color'].default_value=source.default_value if kind=='BaseColor' else (source.default_value,)*3+(1,)
    if source.is_linked:nt.links.new(source.links[0].from_socket,emission.inputs['Color'])
    nt.links.new(emission.outputs[0],output.inputs['Surface'])
  print('BAKING',kind,flush=True);bpy.ops.object.bake(type='NORMAL' if kind=='Normal' else 'EMIT');image.filepath_raw=str(textures/(image.name+'.png'));image.file_format='PNG';image.save();image.pack()
 bpy.data.objects.remove(proxy,do_unlink=True);bpy.data.collections.remove(proxy_collection)
 for ob,hidden in visibility.items():ob.hide_render=hidden
 atlas=material('Portable PBR atlas · hide ivory and hooves',(1,1,1));nt=atlas.node_tree;p=nt.nodes.get('Principled BSDF')
 for kind,socket in [('BaseColor','Base Color'),('Roughness','Roughness'),('Normal','Normal')]:
  node=nt.nodes.new('ShaderNodeTexImage');node.image=maps[kind];node.label='Portable 4K '+kind
  if kind=='Normal':normal=nt.nodes.new('ShaderNodeNormalMap');nt.links.new(node.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs[0],p.inputs[socket])
  else:nt.links.new(node.outputs['Color'],p.inputs[socket])
 for ob in bake_parts:ob.data.materials.clear();ob.data.materials.append(atlas)
 scene.cycles.samples=32

if not DRAFT:bake_maps()

# Ground and studio lighting never enter the model exports.
sv=[];sf=[];rings=[(0,-.012),(4,-.012),(8,-.012),(10,.12),(12,.7),(14,2),(16,5),(18,10),(20,18)]
for r,z in rings:
 for i in range(128):a=i/128*math.tau;sv.append((r*math.cos(a),r*math.sin(a),z))
for j in range(len(rings)-1):
 for i in range(128):a=j*128+i;b=j*128+(i+1)%128;sf.append((a,b,b+128,a+128))
floor_data=bpy.data.meshes.new('Studio sweep');floor_data.from_pydata(sv,[],sf);floor_data.update();floor=bpy.data.objects.new('Studio cyclorama',floor_data);studio.objects.link(floor);floor_data.materials.append(material('Studio ground',(.025,.031,.034),.95))
for face in floor_data.polygons:face.use_smooth=True
world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.16,.18,1);world.node_tree.nodes['Background'].inputs[1].default_value=.20;scene.world=world
for name,location,power,size,color in [('Key',(5,-5,7),1550,4,(.85,.91,1)),('Fill',(-5,-2,4),600,5,(.65,.76,1)),('Rim',(0,5,6),2100,3,(1,.48,.25))]:
 bpy.ops.object.light_add(type='AREA',location=location);ob=move(bpy.context.object,studio);ob.name=name;ob.data.energy=power;ob.data.shape='DISK';ob.data.size=size;ob.data.color=color;ob.rotation_euler=(Vector((0,-.3,1))-ob.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=move(bpy.context.object,studio);scene.camera=camera;camera.data.lens=55;camera.data.clip_end=300
views=[('three-quarter',(9.,-6.5,3.4),(0,-.35,1.55)),('profile',(11.,-.2,3.2),(0,-.35,1.55)),('head-detail',(4.5,-4.5,2.9),(0,-1.95,1.72))]
if QUICK:views=views[:1]
for name,eye,target in views:
 camera.location=eye;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(('draft-' if DRAFT else '')+name+'.png'));print('RENDER',name,flush=True);bpy.ops.render.render(write_still=True)

camera.location=views[0][1];camera.rotation_euler=(Vector(views[0][2])-camera.location).to_track_quat('-Z','Y').to_euler();bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.context.view_layer.objects.active=body
mesh_stats=[]
for ob in parts:
 evaluated=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());data=evaluated.to_mesh();data.calc_loop_triangles();mesh_stats.append({'name':ob.name,'vertices':len(data.vertices),'triangles':len(data.loop_triangles)});evaluated.to_mesh_clear()
bm=bmesh.new();bm.from_mesh(body.data);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
manifest={'name':'Ash-Tusk Boar','kind':'Original Calydonian-boar-inspired static creature','design_revision':'Dark reference-led sculpt, clumped mane, scarred hide, snarling mouth, giant scale','rigged':False,'animated':False,'units':'metres','blender_forward':'-Y','gltf_forward':'+Z','source_topology':'Continuous predominantly quad torso/head/legs surface; original low resolution cage retained in hidden SOURCE collection; separate jaw, ears and details','body_nonmanifold_edges':nonmanifold,'triangles':sum(m['triangles'] for m in mesh_stats),'meshes':mesh_stats,'textures':[] if DRAFT else ['textures/AshTusk_BaseColor.png','textures/AshTusk_Roughness.png','textures/AshTusk_Normal.png'],'texture_size':4096,'status':'static review build; not a claim of marketplace acceptance','provenance':'Original procedural geometry and original procedural materials guided by the user supplied concept sheet; no downloaded mesh or texture assets.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/('ash-tusk-boar-draft.blend' if DRAFT else 'ash-tusk-boar.blend')))
if not DRAFT:
 export_collection=bpy.data.collections.new('TEMP · optimized static export');scene.collection.children.link(export_collection);groups={}
 depsgraph=bpy.context.evaluated_depsgraph_get()
 for ob in parts:
  evaluated=ob.evaluated_get(depsgraph);data=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph);copy=bpy.data.objects.new(ob.name+' export',data);export_collection.objects.link(copy);copy.matrix_world=ob.matrix_world;groups.setdefault(data.materials[0].name,[]).append(copy)
 optimized=[]
 for name,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for ob in objects:ob.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();ob=bpy.context.object;ob.name=name;optimized.append(ob)
 bpy.ops.object.select_all(action='DESELECT')
 for ob in optimized:ob.select_set(True)
 bpy.context.view_layer.objects.active=optimized[0]
 bpy.ops.export_scene.gltf(filepath=str(OUT/'ash-tusk-boar.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_skins=False,export_materials='EXPORT',export_image_format='AUTO')
 bpy.ops.export_scene.fbx(filepath=str(OUT/'ash-tusk-boar.fbx'),use_selection=True,object_types={'MESH'},apply_unit_scale=True,axis_forward='-Z',axis_up='Y',bake_anim=False,path_mode='COPY',embed_textures=True)
 manifest['export_meshes']=len(optimized);(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('FINISHED',manifest['triangles'],'triangles; continuous body nonmanifold edges',nonmanifold,flush=True)
