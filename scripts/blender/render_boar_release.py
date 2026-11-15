"""Render truthful listing media from the cleaned sale asset."""
import bpy,sys,json
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'release'
bpy.ops.wm.open_mainfile(filepath=str(out/'Blender/AshTuskBoar.blend'))
with bpy.data.libraries.load(str(base/'refined/ash-tusk-boar-refined.blend'),link=False) as (src,dst):
 dst.collections=['STUDIO · excluded from exports'];dst.worlds=['Neutral studio']
scene=bpy.context.scene;scene.collection.children.link(dst.collections[0]);scene.world=dst.worlds[0];scene.camera=next(o for o in dst.collections[0].objects if o.type=='CAMERA')
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92
for label,eye,target in [('Hero',(8,-8,3.8),(0,-.2,1.5)),('Side',(10,-.25,2.5),(0,-.25,1.5)),('Head',(4.6,-5,2.7),(0,-1.7,1.8)),('Rear',(-7,7,3.4),(0,.1,1.5))]:
 scene.frame_set(40);scene.camera.location=eye;scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/'Previews'/(label+'.jpg'));bpy.ops.render.render(write_still=True)
 print('PREVIEW',label,flush=True)
print('LISTING PREVIEWS COMPLETE',flush=True)
