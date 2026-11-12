"""Check the connected jaw and root seating at rest and across the attack."""
import bpy,bmesh,sys,json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=Path(sys.argv[sys.argv.index('--')+1]);variant='runtime' if '--runtime' in sys.argv else 'rigged';out=root/'assets-source/creatures/ash-tusk-boar'/variant
source=out/f'ash-tusk-boar-{variant}.blend';bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene
body=bpy.data.objects['Continuous skin · anatomy refinement'];crease=bpy.data.objects['Mouth crease · connected mandible'];assert not any(o.name.startswith(('02 · Lower jaw','Mouth · dark oral','Lower exposed tooth','Upper exposed tooth','Upper snarling lip','Lower lip')) for o in scene.objects)
bm=bmesh.new();bm.from_mesh(body.data);assert all(e.is_manifold for e in bm.edges);unseen={v for v in bm.verts if v.link_faces};components=0
while unseen:
 components+=1;stack=[unseen.pop()]
 while stack:
  v=stack.pop()
  for edge in v.link_edges:
   other=edge.other_vert(v)
   if other in unseen:unseen.remove(other);stack.append(other)
bm.free();assert components==1,'Skin must be one connected component'
samples=[]
for frame in [40,1,9,49,56,66,81]:
 scene.frame_set(frame);deps=bpy.context.evaluated_depsgraph_get();ev=body.evaluated_get(deps);skin=ev.to_mesh();bm=bmesh.new();bm.from_mesh(skin);surface=BVHTree.FromBMesh(bm)
 cm=crease.evaluated_get(deps).to_mesh();gap=max(surface.find_nearest(v.co)[3] for v in cm.vertices);assert gap<.04,('Detached mouth crease',frame,gap)
 seats=[]
 for name in ['Main lower tusk -1','Main lower tusk 1']:
  ob=bpy.data.objects[name];t=ob.evaluated_get(deps);mesh=t.to_mesh();point=sum((v.co for v in list(mesh.vertices)[:24]),Vector())/24;hit,normal,_,distance=surface.find_nearest(point);signed=(point-hit).dot(normal);assert signed<.015,('Tusk root outside skin',frame,signed);seats.append(signed);t.to_mesh_clear()
 samples.append({'frame':frame,'max_crease_surface_distance_m':gap,'tusk_root_signed_distance_m':seats});crease.evaluated_get(deps).to_mesh_clear();ev.to_mesh_clear();bm.free()
report={'skin_components':components,'skin_manifold':True,'detached_jaw_removed':True,'samples':samples};(out/'head-attachment-checks.json').write_text(json.dumps(report,indent=2));print('HEAD ATTACHMENT PASS',json.dumps(report),flush=True)
