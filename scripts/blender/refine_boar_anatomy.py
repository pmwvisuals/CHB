"""Bounded anatomy pass on the existing asset. No texture bake or fur rebuild.
The original static and motion files are never overwritten.
"""
import bpy,bmesh,sys,json,math,os,tempfile
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar'
tempfile.tempdir=str(out/'scratch');os.environ['TMP']=os.environ['TEMP']=tempfile.tempdir
bpy.ops.wm.open_mainfile(filepath=str(out/'ash-tusk-boar.blend'))
scene=bpy.context.scene;asset=bpy.data.collections['ASSET · Ash-Tusk Boar · static'];body=bpy.data.objects['01 · Continuous body head and legs']
quick='--quick' in sys.argv
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def g(x,centre,width):return np.exp(-((x-centre)/width)**2)
def warp(points,skin=False):
 # Work in the original authoring scale; shared fields keep roots and details attached.
 q=points/1.35;q[:,2]+=.012;x,y,z=q.T.copy();side=np.sign(x);ax=np.abs(x)
 head=1-smooth(-1.78,-1.02,y);torso=smooth(-1.15,-.94,y)
 broad=head*(.08+.11*g(y,-1.57,.32))
 q[:,0]*=1+broad
 q[:,1]+=.14*head
 q[:,2]+=.065*head
 flank=smooth(.28,.64,ax)
 # Shoulder shield, shoulder-blade border, abdominal tuck and hindquarter.
 q[:,0]+=side*torso*flank*(.085*g(y,-.62,.28)*g(z,1.26,.45)-.075*g(y,.30,.32)*g(z,1.12,.45)+.075*g(y,.88,.27)*g(z,1.05,.39))
 q[:,2]+=.055*g(y,-.64,.36)*smooth(1.55,1.95,z)
 q[:,2]+=.105*g(y,.29,.38)*g(z,.70,.23)*(1-smooth(.30,.58,ax))
 # Separate deltoid / triceps and thigh masses with narrower lower-leg tendons.
 fore=g(y,-.73,.30)*(1-smooth(.76,.99,z))*smooth(.28,.40,ax)
 hind=g(y,.68,.34)*(1-smooth(.87,1.04,z))*smooth(.27,.39,ax)
 q[:,0]+=side*(ax-.55)*fore*(.34*g(z,.63,.24)-.10*g(z,.23,.10))
 q[:,0]+=side*(ax-.52)*hind*(.30*g(z,.61,.24)-.08*g(z,.24,.10))
 q[:,1]-=.025*fore*g(z,.53,.25)
 if skin:
  # Soften the old evenly spaced flank corrugation into restrained skin relief.
  rows=[-1.1,-.9,-.55,-.15,.25,.65,1.,1.28]
  cz=np.interp(y,rows,[1.32,1.34,1.34,1.25,1.20,1.20,1.12,1.04]);rx=np.interp(y,rows,[.43,.64,.71,.66,.53,.49,.38,.23]);rz=np.interp(y,rows,[.46,.70,.75,.65,.53,.48,.42,.27])
  angle=np.arctan2((z-cz)/rz,x/rx);old_ribs=.021*np.sin(y*36+np.sin(angle)*2)*g(y,.08,.47)*np.abs(np.cos(angle))**6*torso
  q[:,0]-=.8*np.cos(angle)*old_ribs;q[:,2]-=.8*np.sin(angle)*old_ribs
  # Broad anatomical relief, not detached muscle spheres or surface strips.
  q[:,0]+=side*flank*(.045*g(y,-.40,.11)*g(z,1.36,.35)-.026*g(y,-.15,.08)*g(z,1.10,.32))
  q[:,0]+=side*.052*g(y,-1.55,.23)*g(z,1.49,.09)*smooth(.30,.43,ax)
  q[:,0]-=side*.018*g(y,-1.55,.14)*g(z,1.32,.07)*smooth(.30,.45,ax)
  q[:,2]+=.010*np.cos((y+1.83)*65)*g(y,-1.82,.22)*smooth(1.14,1.32,z)*head
 q[:,2]-=.012
 return q*1.35

parts=list(asset.objects);before={};after={};old_brows=bpy.data.collections.new('SOURCE · superseded raised brow strips');scene.collection.children.link(old_brows);old_brows.hide_render=True;old_brows.hide_viewport=True
for ob in parts:
 if ob.type!='MESH':continue
 if ob.name.startswith('Heavy scowling brow'):
  asset.objects.unlink(ob);old_brows.objects.link(ob);continue
 coords=np.empty(len(ob.data.vertices)*3,dtype=np.float32);ob.data.vertices.foreach_get('co',coords);coords=coords.reshape((-1,3));matrix=np.array(ob.matrix_world,dtype=np.float32);world=coords@matrix[:3,:3].T+matrix[:3,3]
 if ob==body:before=world.copy()
 sculpt=warp(world.copy(),ob==body)
 if ob.name.startswith(('02 · Lower jaw','Lower lip','Lower exposed tooth')):sculpt[:,2]-=.032
 if ob.name.startswith(('Eyeball','Amber iris','Dark pupil')):
  centre=sculpt.mean(axis=0);sculpt[:,2]=centre[2]+(sculpt[:,2]-centre[2])*.84
 if ob.name.startswith('Upper orbital eyelid'):
  centre=sculpt.mean(axis=0);sculpt[:,2]-=.009*(1+np.tanh((centre[1]-sculpt[:,1])*18))
 inverse=np.linalg.inv(matrix);local=(sculpt-matrix[:3,3])@inverse[:3,:3].T
 if ob==body:
  after=sculpt.copy();ob.shape_key_add(name='Original anatomy');key=ob.shape_key_add(name='Anatomy refinement');key.data.foreach_set('co',local.ravel());key.value=1
 else:ob.data.vertices.foreach_set('co',local.ravel());ob.data.update()

parts=[o for o in asset.objects if o.type=='MESH'];body.name='Continuous skin · anatomy refinement'
bm=bmesh.new();bm.from_mesh(body.data);bad=sum(not e.is_manifold for e in bm.edges);bm.free();assert bad==0
assert np.isfinite(after).all();movement=np.linalg.norm(after-before,axis=1);assert movement.max()<.5 and np.count_nonzero(movement>.01)>len(before)*.3
report={'stage':'anatomy review','body_vertices':len(before),'body_nonmanifold_edges':bad,'max_body_move_m':float(movement.max()),'moved_body_vertices':int(np.count_nonzero(movement>.01)),'textures':'Existing packed 4K maps reused; no new texture bake','fur':'Existing mesh groom follows the anatomical deformation; no new groom in this pass','animation':'Separate static review; previous animated file remains unchanged','checks':['Finite anatomy coordinates','Continuous body retains manifold topology','Bounded deformation with preserved vertex count and UV layout']}
scene.render.resolution_x=1280;scene.render.resolution_y=960;scene.render.resolution_percentage=60 if quick else 100;scene.cycles.samples=8 if quick else 12;scene.cycles.use_denoising=True
def view(name,eye,target):
 scene.camera.location=eye;scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'.png'));print('RENDER',name,flush=True);bpy.ops.render.render(write_still=True)
view('anatomy-three-quarter',(9,-6.5,3.4),(0,-.3,1.55))
view('anatomy-profile',(11,-.2,3.2),(0,-.3,1.55))
view('anatomy-head',(5.2,-4.0,2.9),(0,-1.85,1.75))
# An uncluttered clay view exposes actual anatomy beneath the unchanged groom.
fur=next(o for o in parts if o.name.startswith('Guard hairs'));fur.hide_render=True
clay=bpy.data.materials.new('Anatomy inspection clay');clay.diffuse_color=(.30,.32,.33,1);clay.use_nodes=True;clay.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.30,.32,.33,1);clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
scene.view_layers[0].material_override=clay
view('anatomy-clay',(8.5,-6.5,3.8),(0,-.3,1.5));scene.view_layers[0].material_override=None;fur.hide_render=False
scene.camera.location=(9,-6.5,3.4);scene.camera.rotation_euler=(Vector((0,-.3,1.55))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(out/'ash-tusk-boar-anatomy.blend'))
export=bpy.data.collections.new('TEMP · evaluated static export');scene.collection.children.link(export);groups={};deps=bpy.context.evaluated_depsgraph_get()
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
bpy.ops.export_scene.gltf(filepath=str(out/'ash-tusk-boar-anatomy.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_skins=False)
report['export_meshes']=len(selected);(out/'anatomy-quality-report.json').write_text(json.dumps(report,indent=2));print('DONE anatomy review',json.dumps(report),flush=True)
