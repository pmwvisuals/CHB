import bpy,sys,json,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
(root/"native/assets/props").mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'assets-source/props/hurricane-lantern-original.glb'))
meshes=[o for o in bpy.data.objects if o.type=='MESH']; allp=[o.matrix_world@v.co for o in meshes for v in o.data.vertices];lo=Vector(tuple(min(p[i] for p in allp) for i in range(3)));hi=Vector(tuple(max(p[i] for p in allp) for i in range(3)));print('BOUNDS',lo,hi)
for o in meshes:
 base=np.array([tuple(v.uv) for v in o.data.uv_layers[0].data])
 for uv in list(o.data.uv_layers)[1:]:
  other=np.array([tuple(v.uv) for v in uv.data]);assert np.max(np.abs(other-base))<1e-6
  o.data.uv_layers.remove(uv)
 o.data.transform(o.matrix_world);o.parent=None;o.matrix_world.identity()
 for v in o.data.vertices:v.co=(v.co-Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z)))*(1.25/(hi.z-lo.z))
 bpy.context.view_layer.objects.active=o
 dec=o.modifiers.new('Mobile detail','DECIMATE');dec.ratio=.032;dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
 print('PART',o.name,len(o.data.polygons),'UVS',[(u.name) for u in o.data.uv_layers])
for mat in bpy.data.materials:
 if mat.use_nodes:
  for node in mat.node_tree.nodes:
   if node.type=='UVMAP':node.uv_map='UVMap'
for im in bpy.data.images:
 if im.size[0]>1024 or im.size[1]>1024:im.scale(1024,1024)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root/'native/assets/props/forge-oil-lantern.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
print('EXPORTED',sum(len(o.data.polygons) for o in meshes))

asset=root/"native/assets/props/forge-oil-lantern.glb"
p=root/"native/assets-manifest.json"
d=json.loads(p.read_text())
e=next(a for a in d["assets"] if a["file"]=="assets/props/forge-oil-lantern.glb")
e.update(bytes=asset.stat().st_size,sha256=hashlib.sha256(asset.read_bytes()).hexdigest())
p.write_text(json.dumps(d,indent=2)+"\n")
