import bpy,sys
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);base=root/'assets-source/creatures/ash-tusk-boar';out=base/'release'
bpy.ops.wm.open_mainfile(filepath=str(out/'Blender/AshTuskBoar.blend'))
with bpy.data.libraries.load(str(base/'refined/ash-tusk-boar-refined.blend'),link=False) as (src,dst):dst.collections=['STUDIO · excluded from exports'];dst.worlds=['Neutral studio']
scene=bpy.context.scene;scene.collection.children.link(dst.collections[0]);scene.world=dst.worlds[0];scene.camera=next(o for o in dst.collections[0].objects if o.type=='CAMERA')
scene.frame_set(40);scene.camera.location=(8,-8,3.8);scene.camera.rotation_euler=(Vector((0,-.2,1.5))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_percentage=100;scene.render.resolution_x=1260;scene.render.resolution_y=1000;scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=94
scene.render.filepath=str(out/'Previews/Cover.jpg');bpy.ops.render.render(write_still=True)
for ob in bpy.data.collections['Boar_LOD0'].objects:
 if 'Coat' in ob.name:ob.hide_render=True
wire=bpy.data.materials.new('TopologyPreview');wire.use_nodes=True;nt=wire.node_tree;p=nt.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.85
w=nt.nodes.new('ShaderNodeWireframe');w.use_pixel_size=True;w.inputs['Size'].default_value=.65
mix=nt.nodes.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.26,.31,.32,1);mix.inputs[2].default_value=(.012,.022,.027,1);nt.links.new(w.outputs[0],mix.inputs[0]);nt.links.new(mix.outputs[0],p.inputs['Base Color'])
for ob in bpy.data.collections['Boar_LOD0'].objects:
 for i in range(len(ob.data.materials)):ob.data.materials[i]=wire
scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.filepath=str(out/'Previews/Topology_CoatHidden.jpg');bpy.ops.render.render(write_still=True)
print('COVER AND STRUCTURAL TOPOLOGY PREVIEW COMPLETE',flush=True)
