"""Clean fur/material revision. Reuses anatomy; adds no decorative features.
Native Hair Curves remain editable; a matching solid mesh groom exports to GLB.
"""
import bpy,bmesh,sys,math,json,os,tempfile,ast
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
ROOT=Path(sys.argv[sys.argv.index('--')+1]);base=ROOT/'assets-source/creatures/ash-tusk-boar';OUT=base/'clean';OUT.mkdir(exist_ok=True)
scratch=OUT/'scratch';scratch.mkdir(exist_ok=True);tempfile.tempdir=str(scratch);os.environ['TMP']=os.environ['TEMP']=str(scratch)
quick='--quick' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(base/'ash-tusk-boar-anatomy.blend'))
scene=bpy.context.scene;asset=bpy.data.collections['ASSET · Ash-Tusk Boar · static'];asset.name='ASSET · Clean boar'
body=bpy.data.objects['Continuous skin · anatomy refinement'];deps=bpy.context.evaluated_depsgraph_get();body.data=bpy.data.meshes.new_from_object(body.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
old_fur=next(ob for ob in asset.objects if ob.name.startswith('Guard hairs'));bpy.data.objects.remove(old_fur,do_unlink=True)
for collection in list(bpy.data.collections):
 if collection.name.startswith('SOURCE ·'):
  for ob in list(collection.objects):bpy.data.objects.remove(ob,do_unlink=True)
  bpy.data.collections.remove(collection)
# Smooth only the old scar regions. No new incisions or markings are introduced.
data=body.data;positions=np.empty(len(data.vertices)*3,dtype=np.float32);data.vertices.foreach_get('co',positions);positions=positions.reshape((-1,3))
scar=data.color_attributes.get('ScarMask');mask=np.zeros(len(positions),dtype=bool)
if scar:
 values=np.empty(len(scar.data)*4,dtype=np.float32);scar.data.foreach_get('color',values);mask=values.reshape((-1,4))[:,0]>.012
edges=np.empty(len(data.edges)*2,dtype=np.int32);data.edges.foreach_get('vertices',edges);edges=edges.reshape((-1,2));a,b=edges.T
for _ in range(2):
 extended=mask.copy();extended[a[mask[b]]]=True;extended[b[mask[a]]]=True;mask=extended
degree=np.bincount(edges.ravel(),minlength=len(positions)).clip(1)
for _ in range(8):
 sums=np.zeros_like(positions);np.add.at(sums,a,positions[b]);np.add.at(sums,b,positions[a]);positions[mask]=positions[mask]*.40+(sums/degree[:,None])[mask]*.60
data.vertices.foreach_set('co',positions.ravel());data.update()
for ob in asset.objects:
 if ob.type=='MESH':
  for name in ['ScarMask','CoatTint']:
   attribute=ob.data.color_attributes.get(name)
   if attribute:ob.data.color_attributes.remove(attribute)

def material(name,color,rough=.8):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;return m
def surface(name,dark,light,scale,rough,bump_distance):
 m=material(name,dark,rough);nt=m.node_tree;p=nt.nodes.get('Principled BSDF');n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=scale;n.inputs['Detail'].default_value=3
 ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(*dark,1);ramp.color_ramp.elements[1].color=(*light,1);nt.links.new(n.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
 finish=nt.nodes.new('ShaderNodeMapRange');finish.inputs['To Min'].default_value=rough-.09;finish.inputs['To Max'].default_value=min(1,rough+.06);nt.links.new(n.outputs['Fac'],finish.inputs['Value']);nt.links.new(finish.outputs['Result'],p.inputs['Roughness'])
 fine=nt.nodes.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=160;fine.inputs['Detail'].default_value=2;bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.25;bump.inputs['Distance'].default_value=bump_distance;nt.links.new(fine.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal']);return m
coat=surface('Clean hide',(.007,.008,.008),(.025,.027,.024),9,.84,.0025)
nose=surface('Clean muzzle leather',(.012,.010,.009),(.035,.029,.023),24,.59,.002)
ivory=surface('Natural ivory',(.30,.255,.19),(.62,.56,.45),12,.45,.0015)
hoof=surface('Natural keratin',(.009,.010,.009),(.025,.024,.020),22,.62,.0015)
inner=material('Inner ear',(.020,.014,.011),.85);black=material('Natural mouth and nostrils',(.002,.002,.002),.73)
parts=[];bake_parts=[]
for ob in asset.objects:
 if ob.type!='MESH':continue
 name=ob.name;mat=coat
 if name.startswith(('Eyeball','Amber iris','Dark pupil')):parts.append(ob);continue
 if 'tusk' in name.lower() or 'tooth' in name.lower():mat=ivory
 elif 'hoof' in name or name.startswith('Dewclaw'):mat=hoof
 elif name.startswith(('Nose','Upper snarling lip','Lower lip')):mat=nose
 elif name.startswith(('Mouth','Nostril')):mat=black
 elif name.startswith('Ear cup'):mat=inner
 ob.data.materials.clear();ob.data.materials.append(mat)
 for face in ob.data.polygons:face.material_index=0
 parts.append(ob);bake_parts.append(ob)

# Area-weighted sampling of the actual refined surface embeds every root.
data.calc_loop_triangles();coords=np.array([tuple(body.matrix_world@v.co) for v in data.vertices],dtype=np.float64);normals=np.array([tuple(v.normal) for v in data.vertices],dtype=np.float64)
tri=np.array([tuple(t.vertices) for t in data.loop_triangles],dtype=np.int32);tv=coords[tri];area=np.linalg.norm(np.cross(tv[:,1]-tv[:,0],tv[:,2]-tv[:,0]),axis=1)*.5;prob=area/area.sum();rng=np.random.default_rng(65481)
def sample(count):
 indices=rng.choice(len(tri),count,p=prob);uv=rng.random((count,2));flip=uv.sum(axis=1)>1;uv[flip]=1-uv[flip];weights=np.column_stack((1-uv.sum(axis=1),uv));points=(tv[indices]*weights[:,:,None]).sum(axis=1);ns=(normals[tri[indices]]*weights[:,:,None]).sum(axis=1);ns/=np.linalg.norm(ns,axis=1)[:,None];return points,ns
def direction(p,n):
 flow=Vector((0,1,-.32))
 if p.y<-1.55:flow=Vector((n.x*.15,1,-.18))
 flow-=n*flow.dot(n)
 if flow.length<.05:flow=Vector((n.x,0,.5))
 return flow.normalized()
guides,guide_n=sample(900);tree=KDTree(len(guides))
for i,p in enumerate(guides):tree.insert(p,i)
tree.balance();lines=[];radii=[];colors=[];roots=[]
points,ns=sample(34000)
for p0,n0 in zip(points,ns):
 p=Vector(p0);n=Vector(n0)
 if p.z<.30 or p.y<-2.42:continue
 face=p.y<-1.55
 if face and abs(p.x)>.50 and -2.20<p.y<-1.82 and 1.65<p.z<2.02:continue
 # Keep a short face coat and medium body coat, with irregular local density.
 if not face and rng.random()<.22:continue
 length=float(rng.uniform(.045,.080) if face and p.z>1.95 else rng.uniform(.025,.055) if face else rng.uniform(.025,.060) if p.z<1.1 else rng.uniform(.065,.14));flow=direction(p,n)
 _,index,_=tree.find(p);guide=Vector(guides[index]);gn=Vector(guide_n[index]);tip=guide+direction(guide,gn)*length+gn*length*.20
 aim=(p+flow*length).lerp(tip,.27);aim=p+(aim-p).normalized()*length
 side=n.cross(flow).normalized();bend=side*float(rng.uniform(-.12,.12))*length
 line=[]
 for t in np.linspace(0,1,5):line.append(p-n*.003+(aim-p)*float(t)+n*length*.22*math.sin(float(t)*math.pi)+bend*float(t*t))
 lines.append(line);radii.append(float(rng.uniform(.0015,.0027))*(.75 if face else 1));tone=float(rng.uniform(.7,1.35));colors.append((.014*tone,.013*tone,.012*tone));roots.append(p0)
# Longer mane follows the back and neck, with bent, staggered ends.
points,ns=sample(26000);crest=0
for p0,n0 in zip(points,ns):
 p=Vector(p0);n=Vector(n0)
 if not(-1.8<p.y<1.45 and abs(p.x)<.34 and p.z>2.18 and n.z>.45):continue
 if crest>=1400:break
 crest+=1;length=float(rng.uniform(.19,.36));side=Vector((float(rng.uniform(-.5,.5)),0,0));flow=(Vector((0,.90,.40))+side).normalized();line=[]
 for t in np.linspace(0,1,7):line.append(p-n*.007+flow*length*float(t)+n*length*.24*math.sin(float(t)*math.pi)+side*.05*math.sin(float(t)*math.tau))
 lines.append(line);radii.append(float(rng.uniform(.002,.0034)));tone=float(rng.uniform(.7,1.4));colors.append((.016*tone,.014*tone,.012*tone));roots.append(p0)
assert crest>300 and len(lines)>17000

groom_collection=bpy.data.collections.new('GROOM · editable native Hair Curves');scene.collection.children.link(groom_collection);groom_collection.hide_render=True;groom_collection.hide_viewport=True
curves=bpy.data.hair_curves.new('Editable clean groom');curves.add_curves([len(line) for line in lines]);groom=bpy.data.objects.new('Editable groom centre lines',curves);groom_collection.objects.link(groom)
curve_positions=np.array([tuple(p) for line in lines for p in line],dtype=np.float32);curves.attributes['position'].data.foreach_set('vector',curve_positions.ravel());radius=curves.attributes.new('radius','FLOAT','POINT');radius.data.foreach_set('value',np.array([r*(1-j/(len(line)-1))+.00002 for line,r in zip(lines,radii) for j in range(len(line))],dtype=np.float32))
# Portable mesh derived from the same groom centre lines. No alpha sorting or hair shader.
v=[];f=[];vertex_colors=[]
for line,r,color in zip(lines,radii,colors):
 start=len(v)
 for j,p in enumerate(line):
  tangent=(line[min(j+1,len(line)-1)]-line[max(0,j-1)]).normalized();axis=tangent.cross(Vector((0,1,0)))
  if axis.length<.01:axis=tangent.cross(Vector((1,0,0)))
  axis.normalize();other=tangent.cross(axis).normalized();t=j/(len(line)-1)
  for k in range(3):a=k/3*math.tau;v.append(p+(axis*math.cos(a)+other*math.sin(a))*r*(1-t*.98));vertex_colors.append((*[c*(.8+.2*t) for c in color],1))
  if j:
   for k in range(3):a=start+(j-1)*3+k;b=start+(j-1)*3+(k+1)%3;f.append((a,b,b+3,a+3))
mesh=bpy.data.meshes.new('Clean mesh coat');mesh.from_pydata(v,[],f);mesh.update();fur=bpy.data.objects.new('Clean directional fur',mesh);asset.objects.link(fur)
for poly in mesh.polygons:poly.use_smooth=True
attr=mesh.color_attributes.new(name='BristleTint',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',np.array(vertex_colors,dtype=np.float32).ravel())
fur_mat=material('Natural coat fibres',(.015,.014,.012),.78);nt=fur_mat.node_tree;vc=nt.nodes.new('ShaderNodeVertexColor');vc.layer_name='BristleTint';nt.links.new(vc.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color']);mesh.materials.append(fur_mat);parts.append(fur)
print('GROOM',len(lines),'curves;',crest,'mane strands',flush=True)

# Reuse the proven single-surface bake routine with a distinct output directory/prefix.
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True
if not quick:
 source=ast.parse((ROOT/'scripts/blender/build_calydonian_boar.py').read_text(encoding='utf8'));function=next(n for n in source.body if isinstance(n,ast.FunctionDef) and n.name=='bake_maps');exec(compile(ast.Module(body=[function],type_ignores=[]),'bake_maps','exec'),globals());bake_maps('CleanBoar')
scene.render.resolution_x=1280;scene.render.resolution_y=960;scene.render.resolution_percentage=60 if quick else 100;scene.cycles.samples=6 if quick else 12
def render(name,eye,target):
 scene.camera.location=eye;scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/(name+'.png'));print('RENDER',name,flush=True);bpy.ops.render.render(write_still=True)
render('three-quarter',(9,-6.5,3.4),(0,-.3,1.55))
if quick:print('DRAFT COMPLETE',flush=True);sys.exit(0)
render('head',(5.2,-4.,2.9),(0,-1.85,1.75));render('profile',(11,-.2,3.2),(0,-.3,1.55))
scene.camera.location=(9,-6.5,3.4);scene.camera.rotation_euler=(Vector((0,-.3,1.55))-scene.camera.location).to_track_quat('-Z','Y').to_euler();bpy.context.preferences.filepaths.save_version=0
used={m for ob in parts for m in ob.data.materials}
for m in bpy.data.materials:
 if m not in used:m.use_fake_user=False
bpy.data.orphans_purge(do_recursive=True);bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ash-tusk-boar-clean.blend'))
export=bpy.data.collections.new('TEMP · mesh export');scene.collection.children.link(export);groups={};deps=bpy.context.evaluated_depsgraph_get()
for ob in parts:
 data=bpy.data.meshes.new_from_object(ob.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps);copy=bpy.data.objects.new(ob.name,data);export.objects.link(copy);copy.matrix_world=ob.matrix_world.copy();groups.setdefault(data.materials[0].name,[]).append(copy)
selected=[]
for name,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 if len(objects)>1:bpy.ops.object.join()
 ob=bpy.context.object;ob.name=name;selected.append(ob)
bpy.ops.object.select_all(action='DESELECT')
for ob in selected:ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'ash-tusk-boar-clean.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_skins=False)
bpy.ops.export_scene.fbx(filepath=str(OUT/'ash-tusk-boar-clean.fbx'),use_selection=True,object_types={'MESH'},axis_forward='-Z',axis_up='Y',bake_anim=False,path_mode='COPY',embed_textures=True)
report={'name':'Clean boar','stage':'clean static asset','decorative_scars':False,'scar_region_vertices_smoothed':int(mask.sum()),'groom_curves':len(lines),'mane_strands':crest,'groom_source':'Editable native Blender Hair Curves; solid mesh export derived from same centre lines','texture_size':4096,'mesh_groups':len(selected),'animated':False,'units':'metres','prior_files_preserved':True}
(OUT/'quality-report.json').write_text(json.dumps(report,indent=2));print('FINISHED clean model',json.dumps(report),flush=True)
