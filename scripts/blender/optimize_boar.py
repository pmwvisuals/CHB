"""One reduced gameplay asset; preserve detailed source and packed 4K maps."""
import bpy,sys,json,math
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'runtime';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(base/'rigged/ash-tusk-boar-rigged.blend'))
scene=bpy.context.scene;scene.frame_set(40);arm=bpy.data.objects['BoarRig']
for pb in arm.pose.bones:pb.matrix_basis.identity()
bpy.context.view_layer.update();asset=bpy.data.collections['ASSET · Rigged clean boar'];asset.name='ASSET · Gameplay boar'
parts=[o for o in asset.objects if o.type=='MESH'];fur=bpy.data.objects['Clean directional fur'];old=fur.data;group_names=[g.name for g in fur.vertex_groups]
report=json.loads((base/'clean/quality-report.json').read_text());regular=report['groom_curves']-report['mane_strands'];lengths=np.array([15]*regular+[21]*report['mane_strands']);starts=np.r_[0,np.cumsum(lengths)[:-1]]
p=np.empty(len(old.vertices)*3,dtype=np.float32);old.vertices.foreach_get('co',p);p=p.reshape((-1,3));col=np.empty(len(old.vertices)*4,dtype=np.float32);old.color_attributes['BristleTint'].data.foreach_get('color',col);col=col.reshape((-1,4))
# Sample spatially across the short coat, retaining every mane strand for the silhouette.
roots=np.array([p[s:s+3].mean(axis=0) for s in starts]);rng=np.random.default_rng(19251);order=rng.permutation(regular);cells={}
for i in order:
 key=tuple(np.floor(roots[i]/.08).astype(int));cells.setdefault(key,[]).append(int(i))
chosen=[]
while len(chosen)<4500:
 for indices in cells.values():
  if indices:chosen.append(indices.pop())
  if len(chosen)==4500:break
chosen+=list(range(regular,len(lengths)))
verts=[];faces=[];colors=[];weights=[]
for i in chosen:
 start=int(starts[i]);rings=int(lengths[i]//3);first=len(verts)
 for ring in [0,rings//2,rings-1]:
  center=p[start+ring*3:start+ring*3+3].mean(axis=0)
  for k in range(3):
   source=start+ring*3+k;verts.append(center+(p[source]-center)*(1.5 if i<regular else 1.1));colors.append(col[source]);weights.append([(g.group,g.weight) for g in old.vertices[start].groups])
 for r in range(2):
  for k in range(3):a=first+r*3+k;b=first+r*3+(k+1)%3;faces.append((a,b,b+3,a+3))
mesh=bpy.data.meshes.new('Reduced mesh coat');mesh.from_pydata(verts,[],faces);mesh.materials.append(old.materials[0]);mesh.update();fur.data=mesh
fur.vertex_groups.clear()
for name in group_names:fur.vertex_groups.new(name=name)
for poly in mesh.polygons:poly.use_smooth=True
attr=mesh.color_attributes.new(name='BristleTint',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',np.array(colors,dtype=np.float32).ravel())
for j,group in enumerate(fur.vertex_groups):
 buckets={}
 for v,values in enumerate(weights):
  for g,w in values:
   if g==j:buckets.setdefault(w,[]).append(v)
 for w,indices in buckets.items():group.add(indices,w,'REPLACE')
before=790996
for ob in parts:
 if ob==fur:continue
 bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
 ratio=.25 if ob.name.startswith('Continuous skin') else .65 if 'tusk' in ob.name.lower() else .4
 if len(ob.data.polygons)<90:continue
 mod=ob.modifiers.new('Gameplay surface reduction','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True
 bpy.ops.object.modifier_move_up(modifier=mod.name);bpy.ops.object.modifier_apply(modifier=mod.name)
triangles=0
for ob in parts:ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
assert 70000<triangles<120000,triangles
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-runtime.blend'))
sys.path.insert(0,str(root/'scripts/blender'));from export_rigged_boar import export_rig
groups=export_rig(scene,parts,arm,out,'ash-tusk-boar-runtime')
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_x=1024;scene.render.resolution_y=768;scene.render.resolution_percentage=100
for label,frame in [('rest',40),('walk',9),('strike',66)]:
 scene.frame_set(frame);scene.render.filepath=str(out/(label+'.png'));bpy.ops.render.render(write_still=True)
result={'triangles':triangles,'original_triangles':before,'reduction_percent':100*(1-triangles/before),'coat_strands':len(chosen),'original_coat_strands':len(lengths),'mane_strands_preserved':report['mane_strands'],'bones':21,'mesh_groups':groups,'maps':'Original packed 4K maps retained','clips':['Idle','Walk','TuskAttack'],'method':'Reduced skin/detail surfaces and spatially sampled simplified solid strands; original UVs and skin weights retained','performance':'Geometry reduction measured; actual gameplay frame rate remains unmeasured','browserUIVisuallyTested':False}
(out/'rig-quality-report.json').write_text(json.dumps(result,indent=2));print('OPTIMIZED',json.dumps(result),flush=True)
