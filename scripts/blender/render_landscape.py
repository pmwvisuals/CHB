"""Offline geometry study; the browser shaders and mist are not reproduced here."""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Matrix,Vector
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/landmarks'
data=json.loads((out/'landscape-preview.json').read_text())
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
 for p in mesh.polygons:p.use_smooth=True
 meshes[key]=mesh
bound={}
for o in data['objects']:
 key=(o['geometry'],o['material'])
 if key not in bound:
  mesh=meshes[o['geometry']].copy();mesh.materials.clear();mesh.materials.append(materials[o['material']]);bound[key]=mesh
 for matrix in o['matrices']:
  ob=bpy.data.objects.new(o['name'],bound[key]);bpy.context.collection.objects.link(ob);ob.matrix_world=convert@Matrix([matrix[i::4] for i in range(4)])
world=bpy.data.worlds.new('Eastern daylight');world.use_nodes=True;nt=world.node_tree;sky=nt.nodes.new('ShaderNodeTexSky');sky.sky_type='PREETHAM';sky.sun_direction=Vector((1,0,.64)).normalized();sky.turbidity=3.6;nt.links.new(sky.outputs['Color'],nt.nodes.get('Background').inputs['Color']);nt.nodes.get('Background').inputs[1].default_value=.24;bpy.context.scene.world=world
bpy.ops.object.light_add(type='SUN');bpy.context.object.rotation_euler=(Vector((-1,0,-.64))).to_track_quat('-Z','Y').to_euler();bpy.context.object.data.energy=2.9;bpy.context.object.data.angle=.0093
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.lens=45;camera.data.clip_end=1000;bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1400;scene.render.resolution_y=950;scene.render.resolution_percentage=100
for view in data['cameras']:
 name,eye,look=view['name'],view['eye'],view['look']
 camera.location=convert@Vector(eye);camera.rotation_euler=(convert@Vector(look)-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'-preview.png'));bpy.ops.render.render(write_still=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'asterion-landscape-polish.blend'))
