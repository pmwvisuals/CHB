"""Extract rooted, metre-scale plant prototypes from the two supplied packs."""
import bpy,sys,json,hashlib,shutil
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'native/assets/plants';out.mkdir(parents=True,exist_ok=True)
source=root/'assets-source/imported-plants';source.mkdir(parents=True,exist_ok=True)
inputs=[('grass','grass_pack_lowpoly_game-ready.glb'),('bushes','lowpoly_flower_bushes.glb')]
records=[];prototypes=[]
bpy.ops.wm.read_factory_settings(use_empty=True)
for category,filename in inputs:
 incoming=Path.home()/'Downloads'/filename;local=source/filename
 if incoming.exists():shutil.copy2(incoming,local)
 assert local.exists(),str(local)
 records.append({'file':filename,'sha256':hashlib.sha256(local.read_bytes()).hexdigest(),'bytes':local.stat().st_size})
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(local));objects=[o for o in bpy.data.objects if o not in before];meshes=[o for o in objects if o.type=='MESH']
 groups=[]
 if category=='grass':
  for ob in meshes:
   if 'Grass main fresh' in ob.name:groups.append(('GrassFresh'+str(sum(n.startswith('GrassFresh') for n,_ in groups)),[ob]))
   elif 'Grass main aged' in ob.name:groups.append(('GrassAged'+str(sum(n.startswith('GrassAged') for n,_ in groups)),[ob]))
   elif 'Grass main dry' in ob.name:groups.append(('GrassDry'+str(sum(n.startswith('GrassDry') for n,_ in groups)),[ob]))
   elif 'Grass tall high' in ob.name:groups.append(('GrassTall'+str(sum(n.startswith('GrassTall') for n,_ in groups)),[ob]))
   elif 'Grass tall low' in ob.name:groups.append(('GrassReed'+str(sum(n.startswith('GrassReed') for n,_ in groups)),[ob]))
 else:
  # Two separate complete bushes in the display pack. Cluster the card
  # centres along its horizontal display axis, rather than exporting leaves.
  centers=[(o,(sum((o.matrix_world@Vector(v) for v in o.bound_box),Vector())/8).x) for o in meshes]
  a=min(x for _,x in centers);b=max(x for _,x in centers)
  for _ in range(12):
   left=[x for _,x in centers if abs(x-a)<abs(x-b)];right=[x for _,x in centers if abs(x-a)>=abs(x-b)];a=sum(left)/len(left);b=sum(right)/len(right)
  groups=[('BushGarden',[o for o,x in centers if abs(x-a)<abs(x-b)]),('BushLakeside',[o for o,x in centers if abs(x-a)>=abs(x-b)])]
 for name,parts in groups:
  copies=[]
  for ob in parts:
   data=ob.data.copy();data.transform(ob.matrix_world);copy=bpy.data.objects.new('Prepared',data);bpy.context.scene.collection.objects.link(copy);copies.append(copy)
  bpy.ops.object.select_all(action='DESELECT')
  for ob in copies:ob.select_set(True)
  bpy.context.view_layer.objects.active=copies[0]
  if len(copies)>1:bpy.ops.object.join()
  ob=bpy.context.object;ob.name=name
  p=np.array([tuple(v.co) for v in ob.data.vertices],dtype=np.float32);lo=p.min(axis=0);hi=p.max(axis=0);height=float(hi[2]-lo[2]);assert height>0
  p-=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]];p/=height
  ob.data.vertices.foreach_set('co',p.ravel());ob.data.update();prototypes.append(ob)
 for ob in objects:
  if ob.name in bpy.data.objects:bpy.data.objects.remove(ob,do_unlink=True)

used={m for ob in prototypes for m in ob.data.materials}
for mat in used:
 # Encode cutout in the GLB after export as well; the game must avoid the
 # alpha-blended sorting path for thousands of overlapping plant cards.
 mat.use_backface_culling=False
 bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 bsdf.inputs['Metallic'].default_value=0;bsdf.inputs['Roughness'].default_value=.92
 bsdf.inputs['Specular IOR Level'].default_value=.12
bpy.ops.object.select_all(action='DESELECT')
for ob in prototypes:ob.select_set(True)
bpy.context.view_layer.objects.active=prototypes[0]
bpy.ops.export_scene.gltf(filepath=str(out/'imported-plants.glb'),export_format='GLB',use_selection=True,export_animations=False,export_apply=True)
file=out/'imported-plants.glb';data=file.read_bytes();length=int.from_bytes(data[12:16],'little');doc=json.loads(data[20:20+length]);binary=data[28+length:]
for mat in doc['materials']:mat['alphaMode']='MASK';mat['alphaCutoff']=.38;mat['doubleSided']=True
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
file.write_bytes(b'glTF'+(2).to_bytes(4,'little')+(28+len(encoded)+len(binary)).to_bytes(4,'little')+len(encoded).to_bytes(4,'little')+b'JSON'+encoded+len(binary).to_bytes(4,'little')+b'BIN\x00'+binary)
report={'sources':records,'prototypes':[],'alpha_mode':'MASK','alpha_cutoff':.38,'unit_height_m':1,'source_authorship':'User supplied third-party model packs; original files retained'}
for ob in prototypes:
 ob.data.calc_loop_triangles();report['prototypes'].append({'name':ob.name,'triangles':len(ob.data.loop_triangles),'height':1.0})
assert len(prototypes)==17,len(prototypes)
(out/'import-report.json').write_text(json.dumps(report,indent=2))
manifest_path=root/'native/assets-manifest.json';manifest=json.loads(manifest_path.read_text());manifest['assets']=[a for a in manifest['assets'] if not a['file'].startswith('assets/plants/')]
for name in ['imported-plants.glb','import-report.json']:
 content=(out/name).read_bytes();manifest['assets'].append({'file':'assets/plants/'+name,'source':'User supplied packs; scripts/blender/prepare_imported_plants.py','bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
manifest_path.write_text(json.dumps(manifest,indent=2));print('PLANTS PREPARED',json.dumps(report),flush=True)
