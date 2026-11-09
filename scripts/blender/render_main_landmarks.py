"""Render the actual runtime geometry for the two completed main landmarks."""
import bpy,json,sys
from pathlib import Path
from mathutils import Matrix,Vector
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/landmarks'
data=json.loads((out/'main-landmarks-preview.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
convert=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
materials={};meshes={}
for key,m in data['materials'].items():
 mat=bpy.data.materials.new(key);mat.use_nodes=True;nt=mat.node_tree;p=nt.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*m['color'],1);p.inputs['Roughness'].default_value=m.get('roughness',.85);p.inputs['Metallic'].default_value=m.get('metalness',0)
 if m['colors']:
  c=nt.nodes.new('ShaderNodeVertexColor');c.layer_name='Color';nt.links.new(c.outputs['Color'],p.inputs['Base Color'])
 materials[key]=mat
for key,g in data['geometries'].items():
 verts=list(zip(g['p'][::3],g['p'][1::3],g['p'][2::3]));idx=g['i'] or list(range(len(verts)));mesh=bpy.data.meshes.new(key);mesh.from_pydata(verts,[],list(zip(idx[::3],idx[1::3],idx[2::3])));mesh.update()
 if g['c']:
  c=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT');c.data.foreach_set('color',[v for i in range(len(verts)) for v in (*g['c'][i*3:i*3+3],1)])
 meshes[key]=mesh
bound={}
for o in data['objects']:
 key=(o['geometry'],o['material'])
 if key not in bound:
  mesh=meshes[o['geometry']].copy();mesh.materials.clear();mesh.materials.append(materials[o['material']]);bound[key]=mesh
 ob=bpy.data.objects.new(o['name'],bound[key]);bpy.context.collection.objects.link(ob);ob.matrix_world=convert@Matrix([o['matrix'][i::4] for i in range(4)])
world=bpy.data.worlds.new('Soft daylight');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs[0].default_value=(.54,.65,.71,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.7;bpy.context.scene.world=world
bpy.ops.object.light_add(type='SUN');bpy.context.object.rotation_euler=(.5,-.6,-.7);bpy.context.object.data.energy=2.5;bpy.context.object.data.angle=.13
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.lens=42;camera.data.clip_end=1000;bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1400;scene.render.resolution_y=950;scene.render.resolution_percentage=100
for name,eye,look in [('training-ground',(-35,27,-3),(-67,0,-34)),('lakeside',(25,25,-44),(61,1,-6))]:
 camera.location=convert@Vector(eye);camera.rotation_euler=(convert@Vector(look)-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'-preview.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'asterion-main-landmarks.blend'))
