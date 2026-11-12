"""Correct the disconnected jaw and reshape the muzzle on the canonical rig.

The mandible is now part of the continuous skin. No floating jaw/peg teeth.
Reuses packed UV materials and existing motion; preserves the previous source.
"""
import bpy,bmesh,sys,json,math,shutil
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'rigged';backup=out/'before-head-repair.blend'
if not backup.exists():shutil.copy2(out/'ash-tusk-boar-rigged.blend',backup)
bpy.ops.wm.open_mainfile(filepath=str(backup));scene=bpy.context.scene;scene.frame_set(40);arm=bpy.data.objects['BoarRig']
for pb in arm.pose.bones:pb.matrix_basis.identity()
bpy.context.view_layer.update();asset=bpy.data.collections['ASSET · Rigged clean boar'];body=bpy.data.objects['Continuous skin · anatomy refinement']
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def g(x,c,w):return np.exp(-((x-c)/w)**2)
def coords(ob):
 p=np.empty(len(ob.data.vertices)*3,dtype=np.float32);ob.data.vertices.foreach_get('co',p);return p.reshape((-1,3))
def warp(p):
 q=p.copy();x,y,z=p.T;front=1-smooth(-2.55,-1.95,y);lower=1-smooth(1.35,1.72,z)
 q[:,1]-=.10*front
 q[:,0]*=1+.10*g(y,-2.30,.34)*lower
 q[:,2]-=.070*g(y,-2.40,.34)*lower
 # A flatter nasal bridge and a broad, sloping orbital ridge.
 q[:,2]-=.060*g(y,-2.18,.24)*smooth(1.86,2.10,z)
 ridge=g(np.abs(x),.76,.16)*g(y,-1.96,.19)*g(z,2.015,.105)
 q[:,0]+=np.sign(x)*.035*ridge;q[:,2]+=.027*ridge
 return q
removed=[]
for ob in list(asset.objects):
 if ob.name.startswith(('02 · Lower jaw','Mouth · dark oral','Upper snarling lip','Lower lip','Lower exposed tooth','Upper exposed tooth','Upper honing tusk')):
  removed.append(ob.name);bpy.data.objects.remove(ob,do_unlink=True)
for ob in [body,bpy.data.objects['Clean directional fur']]:
 ob.data.vertices.foreach_set('co',warp(coords(ob)).ravel());ob.data.update()
# Apply the same field to editable rest-pose groom guides.
groom=bpy.data.objects.get('Editable groom centre lines')
if groom:
 attr=groom.data.attributes['position'];p=np.empty(len(attr.data)*3,dtype=np.float32);attr.data.foreach_get('vector',p);attr.data.foreach_set('vector',warp(p.reshape((-1,3))).ravel())
# Flatten and widen the nasal disc, keeping its genuinely carved nostrils.
for ob in asset.objects:
 if ob.type!='MESH':continue
 if ob.name.startswith(('Nose','Nostril interior')):
  p=coords(ob);p[:,0]*=1.10;p[:,1]=-2.77+(p[:,1]+2.60)*.86;p[:,2]=1.49+(p[:,2]-1.462)*.86;ob.data.vertices.foreach_set('co',p.ravel());ob.data.update()
 if ob.name.startswith('Main lower tusk'):
  side=-1 if ob.name.endswith('-1') else 1
  controls=[Vector((side*x,y,z)) for x,y,z in [(.46,-1.98,1.57),(.78,-2.14,1.41),(1.13,-2.36,1.55),(1.24,-2.41,1.98),(1.04,-2.30,2.68)]];radii=[.14,.145,.10,.06,.0015];line=[];rs=[]
  for i in range(4):
   a,b,c,d=controls[max(0,i-1)],controls[i],controls[i+1],controls[min(4,i+2)]
   for j in range(10):
    t=j/10;line.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t));rs.append(radii[i]*(1-t)+radii[i+1]*t)
  line.append(controls[-1]);rs.append(radii[-1]);p=[];previous=Vector((1,0,0))
  for i,point in enumerate(line):
   tangent=(line[min(i+1,40)]-line[max(0,i-1)]).normalized();axis=previous-tangent*previous.dot(tangent)
   if axis.length<.01:axis=tangent.cross(Vector((0,1,0)))
   axis.normalize();across=tangent.cross(axis).normalized();previous=axis
   for k in range(24):a=k/24*math.tau;p.append(point+(axis*math.cos(a)+across*math.sin(a))*rs[i])
  assert len(p)==len(ob.data.vertices);ob.data.vertices.foreach_set('co',np.array(p,dtype=np.float32).ravel());ob.data.update()
# Transfer the lower-face region into the existing Jaw bone without splitting skin.
p=coords(body);jaw=body.vertex_groups['Jaw'];jidx=jaw.index
for i,(x,y,z) in enumerate(p):
 amount=float((1-smooth(-2.20,-1.58,y))*(1-smooth(1.28,1.53,z))*.95)
 if amount<.001:continue
 old=[(v.group,v.weight) for v in body.data.vertices[i].groups if v.group!=jidx]
 for group,weight in old:body.vertex_groups[group].add([i],weight*(1-amount),'REPLACE')
 jaw.add([i],amount,'REPLACE')
# Keep each fur strand on the newly weighted skin; inherit closest-root weights.
from mathutils.kdtree import KDTree
tree=KDTree(len(p))
for i,v in enumerate(p):tree.insert(v,i)
tree.balance();fur=bpy.data.objects['Clean directional fur'];fp=coords(fur);clean=json.loads((base/'clean/quality-report.json').read_text());lengths=[15]*(clean['groom_curves']-clean['mane_strands'])+[21]*clean['mane_strands'];offset=0;buckets={}
for length in lengths:
 point=fp[offset:offset+3].mean(axis=0);_,nearest,_=tree.find(point)
 if point[1]<-1.55 and point[2]<1.58:
  indices=list(range(offset,offset+length))
  for group in fur.vertex_groups:group.remove(indices)
  for v in body.data.vertices[nearest].groups:
   if v.weight>.0001:buckets.setdefault((v.group,round(v.weight,5)),[]).extend(indices)
 offset+=length
for (group,weight),indices in buckets.items():fur.vertex_groups[group].add(indices,weight,'REPLACE')
# A very narrow inset mouth crease follows the actual connected face surface.
bm=bmesh.new();bm.from_mesh(body.data);surface=BVHTree.FromBMesh(bm);lines=[]
for side in [-1,1]:
 line=[]
 for t in np.linspace(0,1,45):
  y=-2.62+.81*t;z=1.29+.145*math.sin(t*math.pi*.65)
  hit,normal,_,_=surface.ray_cast(Vector((side*2,y,z)),Vector((-side,0,0)),3)
  if hit is not None:line.append((hit,normal,t))
 lines.append(line)
bm.free();vertices=[];faces=[];colors=[];binding=[]
for line in lines:
 for i,(point,normal,t) in enumerate(line):
  tangent=(line[min(i+1,len(line)-1)][0]-line[max(0,i-1)][0]).normalized();axis=tangent.cross(normal).normalized();start=len(vertices);radius=.0045*math.sin(math.pi*(.08+.84*t))
  # Most of the thin section sits within the skin, making a seam rather than a tube lip.
  centre=point-normal*.0015
  for k in range(6):
   a=k/6*math.tau;vertices.append(centre+axis*math.cos(a)*radius+normal*math.sin(a)*radius);colors.append((.0015,.0012,.001,1));binding.append(point.copy())
  if i:
   for k in range(6):a=start-6+k;b=start-6+(k+1)%6;faces.append((a,b,b+6,a+6))
mesh=bpy.data.meshes.new('Inset mouth crease');mesh.from_pydata(vertices,[],faces);mesh.materials.append(fur.data.materials[0]);mesh.update();ob=bpy.data.objects.new('Mouth crease · connected mandible',mesh);asset.objects.link(ob)
for poly in mesh.polygons:poly.use_smooth=True
attr=mesh.color_attributes.new(name='BristleTint',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',np.array(colors,dtype=np.float32).ravel())
for group in body.vertex_groups:ob.vertex_groups.new(name=group.name)
for i,point in enumerate(binding):
 _,near,_=tree.find(point)
 for v in body.data.vertices[near].groups:
  if v.weight>.0001:ob.vertex_groups[v.group].add([i],v.weight,'REPLACE')
mod=ob.modifiers.new('Boar skeletal deformation','ARMATURE');mod.object=arm;ob.parent=arm
# Manifold skin must survive reshaping, and the old detached pieces must be gone.
bm=bmesh.new();bm.from_mesh(body.data);assert all(e.is_manifold for e in bm.edges);bm.free();assert not any(o.name.startswith('02 · Lower jaw') for o in asset.objects)
parts=[o for o in asset.objects if o.type=='MESH'];bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-rigged.blend'))
sys.path.insert(0,str(root/'scripts/blender'));from export_rigged_boar import export_rig
export_rig(scene,parts,arm,out)
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
def render(name,eye,target,frame=40):
 scene.frame_set(frame);scene.camera.location=eye;scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
render('head-repaired',(4.6,-5.0,2.7),(0,-1.85,1.72))
render('head-profile',(7,-1.9,2.4),(0,-1.95,1.70))
render('head-front',(0,-8,2.45),(0,-1.85,1.72))
render('head-strike',(4.6,-5.0,2.7),(0,-1.85,1.72),66)
result={'removed_parts':removed,'mandible':'Part of the continuous manifold skin, weighted into the Jaw bone','mouth':'Closed resting mouth with narrow surface crease; no separated lower plate or exposed peg teeth','muzzle':'Widened flattened nose with retained carved nostrils; reshaped nasal bridge and orbital ridge','tusks':'Lower roots embedded into cheeks','rig':'Existing 21 bones and three clips preserved','previous_source':backup.name}
triangles=0
for ob in parts:ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
quality=json.loads((out/'rig-quality-report.json').read_text());quality.update({'triangles':triangles,'head_revision':result,'geometry':'High-detail geometry with connected mandible and revised muzzle'});(out/'rig-quality-report.json').write_text(json.dumps(quality,indent=2))
(out/'head-repair-report.json').write_text(json.dumps(result,indent=2));print('HEAD REPAIRED',json.dumps(result),flush=True)
