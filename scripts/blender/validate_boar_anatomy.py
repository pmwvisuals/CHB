"""Render the re-imported exported model, using the same studio as the source."""
import bpy,sys,json
from pathlib import Path
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(out/'ash-tusk-boar-anatomy.glb'))
assert not any(ob.type=='ARMATURE' for ob in bpy.context.scene.objects)
with bpy.data.libraries.load(str(out/'ash-tusk-boar-anatomy.blend'),link=False) as (src,dst):dst.collections=['STUDIO · excluded from exports'];dst.worlds=['Neutral studio']
scene=bpy.context.scene;scene.collection.children.link(dst.collections[0]);scene.world=dst.worlds[0];scene.camera=next(ob for ob in dst.collections[0].objects if ob.type=='CAMERA')
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_x=1280;scene.render.resolution_y=960;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'anatomy-export-check.png');bpy.ops.render.render(write_still=True)
report=json.loads((out/'anatomy-quality-report.json').read_text());report['roundtrip_render']='anatomy-export-check.png';(out/'anatomy-quality-report.json').write_text(json.dumps(report,indent=2));print('PASS re-imported anatomy GLB rendered',flush=True)
