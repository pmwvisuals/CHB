import bpy,bmesh,sys,json,math
import numpy as np
from pathlib import Path
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar/clean';source=out/'ash-tusk-boar-clean.blend'
bpy.ops.wm.open_mainfile(filepath=str(source));body=bpy.data.objects['Continuous skin · anatomy refinement'];bm=bmesh.new();bm.from_mesh(body.data);assert all(e.is_manifold for e in bm.edges);bm.free()
assert not body.data.color_attributes.get('ScarMask')
groom=bpy.data.objects['Editable groom centre lines'];assert groom.type=='CURVES' and len(groom.data.curves)>17000
for name in ['BaseColor','Roughness','Normal']:
 image=bpy.data.images['CleanBoar_'+name];assert tuple(image.size)==(4096,4096) and image.packed_file
 values=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(values);assert np.isfinite(values).all() and np.ptp(values[::4000])>.01;del values
def imported(fmt):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if fmt=='fbx':bpy.ops.import_scene.fbx(filepath=str(out/'ash-tusk-boar-clean.fbx'))
 else:bpy.ops.import_scene.gltf(filepath=str(out/'ash-tusk-boar-clean.glb'))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert len(meshes)==5 and not any(o.type=='ARMATURE' for o in bpy.context.scene.objects)
 lo=np.full(3,np.inf);hi=-lo;triangles=0
 for ob in meshes:
  ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
  coords=np.array([tuple(ob.matrix_world@v.co) for v in ob.data.vertices]);assert np.isfinite(coords).all();lo=np.minimum(lo,coords.min(axis=0));hi=np.maximum(hi,coords.max(axis=0))
 assert abs(lo[2])<.01 and 2<(hi-lo)[0]<3.5 and 4.5<(hi-lo)[1]<6 and 2.8<(hi-lo)[2]<4
 return {'triangles':triangles,'dimensions_blender_m':list(hi-lo),'meshes':len(meshes)}
fbx=imported('fbx');glb=imported('glb');assert fbx['triangles']==glb['triangles']
with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.collections=['STUDIO · excluded from exports'];dst.worlds=['Neutral studio']
scene=bpy.context.scene;scene.collection.children.link(dst.collections[0]);scene.world=dst.worlds[0];scene.camera=next(o for o in dst.collections[0].objects if o.type=='CAMERA');scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True;scene.render.resolution_x=1280;scene.render.resolution_y=960;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'exported-model.png');bpy.ops.render.render(write_still=True)
report=json.loads((out/'quality-report.json').read_text());report.update({'fbx_import':fbx,'glb_import':glb,'checks':['Manifold continuous skin and no scar mask','Editable native Hair Curves','Packed, nonempty, finite 4K base colour, roughness and normal maps','GLB and FBX re-import with matching triangle counts and metre scale','Actual re-imported GLB studio render'],'browserUIVisuallyTested':False});(out/'quality-report.json').write_text(json.dumps(report,indent=2));print('VALIDATED clean boar',json.dumps(report),flush=True)
