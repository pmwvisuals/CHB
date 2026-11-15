"""Build a clean, portable release from the refined boar without touching it."""
import bpy,sys,json,math,shutil
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'release';out.mkdir(exist_ok=True)
for folder in ['Blender','Models','Textures','Reports','Previews']:(out/folder).mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(base/'refined/ash-tusk-boar-refined.blend'))
scene=bpy.context.scene;scene.frame_set(40);arm=bpy.data.objects['BoarRig']
for b in arm.pose.bones:b.matrix_basis.identity()
bpy.context.view_layer.update()
source=bpy.data.collections['ASSET · Gameplay boar'];original=[o for o in source.objects if o.type=='MESH']
materials={}
for o in original:
 m=o.data.materials[0]
 if m.name not in materials:materials[m.name]='Coat' if o.name=='Clean directional fur' else 'Iris' if o.name.startswith('Amber iris') else 'Pupil' if o.name.startswith('Dark pupil') else 'Eyes' if o.name.startswith('Eyeball') else 'Hide'
for m,name in materials.items():bpy.data.materials[m].name='Boar_'+name
for kind in ['BaseColor','Normal','Roughness']:
 image=bpy.data.images['RefinedBoar_'+kind];file=out/'Textures'/('Boar_'+kind+'_4K.png')
 shutil.copy2(base/'refined/textures'/('RefinedBoar_'+kind+'.png'),file)
 image.unpack(method='REMOVE');image.filepath=str(file);image.reload();image.pack();image.name='Boar_'+kind+'_4K'
 image.colorspace_settings.name='sRGB' if kind=='BaseColor' else 'Non-Color'

def reduce_fur(ob,step,mane_step):
 old=ob.data;names=[g.name for g in ob.vertex_groups];points=np.array([v.co[:] for v in old.vertices]);attr=old.color_attributes['BristleTint'];colors=np.empty(len(attr.data)*4,np.float32);attr.data.foreach_get('color',colors);colors=colors.reshape(-1,4)
 chosen=list(range(0,4500,step))+list(range(4500,5900,mane_step));verts=[];faces=[];tints=[];weights=[]
 for strand in chosen:
  start=len(verts)
  for i in range(9):
   n=strand*9+i;verts.append(points[n]);tints.append(colors[n]);weights.append([(g.group,g.weight) for g in old.vertices[n].groups])
  for ring in range(2):
   for j in range(3):a=start+ring*3+j;b=start+ring*3+(j+1)%3;faces.append((a,b,b+3,a+3))
 mesh=bpy.data.meshes.new('Boar_Coat_Distance');mesh.from_pydata(verts,[],faces);mesh.materials.append(old.materials[0]);mesh.update();ob.data=mesh
 for f in mesh.polygons:f.use_smooth=True
 attr=mesh.color_attributes.new(name='BristleTint',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',np.array(tints,np.float32).ravel())
 ob.vertex_groups.clear()
 for name in names:ob.vertex_groups.new(name=name)
 buckets={}
 for i,groups in enumerate(weights):
  for g,w in groups:buckets.setdefault((g,w),[]).append(i)
 for (g,w),ids in buckets.items():ob.vertex_groups[g].add(ids,w,'REPLACE')

collections=[];levels=[]
for level in range(3):
 col=bpy.data.collections.new('Boar_LOD'+str(level));scene.collection.children.link(col);collections.append(col);parts=[]
 for ob in original:
  cp=ob.copy();cp.data=ob.data.copy();col.objects.link(cp);parts.append(cp)
  if level:
   if ob.name=='Clean directional fur':reduce_fur(cp,3 if level==1 else 8,2 if level==1 else 4)
   elif len(cp.data.polygons)>90:
    bpy.ops.object.select_all(action='DESELECT');cp.select_set(True);bpy.context.view_layer.objects.active=cp
    mod=cp.modifiers.new('DistanceMesh','DECIMATE');mod.ratio=.65 if level==1 else .30;mod.use_collapse_triangulate=True
    while cp.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
    bpy.ops.object.modifier_apply(modifier=mod.name)
 groups={}
 for ob in parts:groups.setdefault(ob.data.materials[0].name,[]).append(ob)
 meshes=[]
 for material,group in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for ob in group:ob.select_set(True)
  bpy.context.view_layer.objects.active=group[0]
  if len(group)>1:bpy.ops.object.join()
  ob=bpy.context.object;ob.name='LOD%d_%s'%(level,material);ob.data.name=ob.name+'_Mesh';meshes.append(ob)
 levels.append(meshes)

# Keep only the sale asset; no studio, superseded meshes, helper bones or caches.
keep={arm,*[m for parts in levels for m in parts]}
for ob in list(bpy.data.objects):
 if ob not in keep:bpy.data.objects.remove(ob,do_unlink=True)
rig=bpy.data.collections.new('Boar_Rig');scene.collection.children.link(rig)
for c in list(arm.users_collection):c.objects.unlink(arm)
rig.objects.link(arm)
for c in list(bpy.data.collections):
 if c not in collections+[rig]:bpy.data.collections.remove(c)
scene.camera=None;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
arm.name='BoarRig';arm.data.name='Boar_Skeleton';arm['asset_version']='1.0.0';arm['forward_blender']='-Y';arm['forward_gltf']='+Z';arm['walk_support_speed_mps']=.375
scene.frame_start=1;scene.frame_end=81
for action in bpy.data.actions:action.use_fake_user=True
for ob in keep:
 ob.hide_set(False);ob.hide_viewport=False;ob.hide_render=False
for c in collections:c.hide_viewport=False;c.hide_render=False
scene.frame_set(40)
for b in arm.pose.bones:b.matrix_basis.identity()
bpy.context.view_layer.update()
counts=[];audit=[]
for level,meshes in enumerate(levels):
 count=0
 for ob in meshes:
  ob.data.calc_loop_triangles();count+=len(ob.data.loop_triangles)
  points=np.array([v.co[:] for v in ob.data.vertices]);assert np.isfinite(points).all()
  assert np.isfinite(np.array([v.normal[:] for v in ob.data.vertices])).all()
  assert all(abs(sum(g.weight for g in v.groups)-1)<.001 and len([g for g in v.groups if g.weight>0])<=4 for v in ob.data.vertices)
  areas=[t.area for t in ob.data.loop_triangles];assert min(areas)>1e-12,(ob.name,min(areas))
  audit.append({'mesh':ob.name,'vertices':len(points),'triangles':len(areas),'uv_layers':[u.name for u in ob.data.uv_layers],'vertex_colors':[a.name for a in ob.data.color_attributes],'open_surface_expected':'Coat' in ob.name,'applied_object_transform':np.allclose(np.array(ob.matrix_world),np.eye(4))})
 counts.append(count)
allpoints=np.concatenate([np.array([tuple(m.matrix_world@v.co) for v in m.data.vertices]) for m in levels[0]])
dimensions=(allpoints.max(0)-allpoints.min(0)).tolist()

def select(meshes):
 bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
 for ob in meshes:ob.select_set(True)
 bpy.context.view_layer.objects.active=arm
select([m for level in levels for m in level])
bpy.ops.export_scene.gltf(filepath=str(out/'Models/Boar_AllLODs.glb'),export_format='GLB',use_selection=True,export_apply=False,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_def_bones=False,export_all_influences=False)
for level,meshes in enumerate(levels):
 select(meshes)
 bpy.ops.export_scene.fbx(filepath=str(out/('Models/Boar_LOD%d.fbx'%level)),use_selection=True,object_types={'MESH','ARMATURE'},use_mesh_modifiers=False,add_leaf_bones=False,axis_forward='-Z',axis_up='Y',bake_anim=True,bake_anim_use_nla_strips=True,bake_anim_use_all_actions=False,path_mode='COPY',embed_textures=True)
 if level==0:bpy.ops.export_scene.gltf(filepath=str(out/'Models/Boar_LOD0.glb'),export_format='GLB',use_selection=True,export_apply=False,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_def_bones=False,export_all_influences=False)
for i,col in enumerate(collections):col.hide_viewport=i>0;col.hide_render=i>0
select(levels[0]);scene.frame_set(40)
bpy.context.preferences.filepaths.save_version=0
# Put every external image path inside the package; packed copies also open offline.
for image in bpy.data.images:
 if image.name.startswith('Boar_'):image.filepath='//../Textures/'+image.name+'.png'
for area in bpy.context.screen.areas if bpy.context.screen else []:
 if area.type=='VIEW_3D':
  region=area.spaces.active.region_3d;region.view_distance=8;region.view_location=Vector((0,-.1,1.4));region.view_rotation=Vector((7,-9,4)).to_track_quat('Z','Y')
for _ in range(3):bpy.data.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Blender/AshTuskBoar.blend'),relative_remap=False)
report={'version':'1.0.0','triangles':counts,'mesh_groups_per_level':5,'bones':len(arm.data.bones),'materials':5,'dimensions_blender_xyz_m':dimensions,'clips':{'Idle':2.,'Walk':4/3,'TuskAttack':4/3},'animation_type':'In place; walk support travel 0.375 m/s at source scale','maps':{'size':[4096,4096],'channels':['BaseColor sRGB','Normal tangent-space +Y, linear','Roughness linear']},'topology':'Triangulated game mesh; decimated lower detail surfaces and retained whole mesh bristle strands','source':'Original refined model; previous source untouched','audit':audit}
(out/'Reports/asset-specification.json').write_text(json.dumps(report,indent=2))
print('RELEASE ASSET BUILT',json.dumps({'triangles':counts,'dimensions':dimensions,'meshes':len(audit)}),flush=True)
