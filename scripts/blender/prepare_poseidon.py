"""Combine the complete supplied Poseidon scan and trident as an ash marble asset."""
from pathlib import Path
import bpy, numpy as np, math, json, struct, hashlib, shutil
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'assets-source/temple-statues'
OUT=ROOT/'native/assets/temple-statues'
source=SOURCE/'poseidon.glb'
if not source.exists():shutil.copyfile('C:/Users/User/Downloads/poseidon_statue-_3d_scanned_by_revopoint_trackit.glb',source)
b=source.read_bytes()
assert b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b),'Poseidon must be a complete GLB'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
body=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in body:
    matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix
bpy.ops.object.select_all(action='DESELECT')
for o in body:o.select_set(True)
bpy.context.view_layer.objects.active=body[0]
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
def vertices(obj):
    data=np.empty(len(obj.data.vertices)*3,dtype=np.float32)
    obj.data.vertices.foreach_get('co',data)
    data=data.reshape((-1,3))
    matrix=np.array(obj.matrix_world,dtype=np.float32)
    return data@matrix[:3,:3].T+matrix[:3,3]
points=np.concatenate([vertices(o) for o in body])
print('Measured source vertices',len(points),flush=True)
lo=points.min(0);hi=points.max(0)
factor=6/(hi[2]-lo[2]);centre=np.array([(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]])
points=(points-centre)*factor
# Fit the scan's broad bottom plane so the source pedestal rests level.
cloud=points[::5];cloud=cloud[cloud[:,2]<.85]
rng=np.random.default_rng(921);best_count=0;best=None
for _ in range(240):
    a,c,d=cloud[rng.choice(len(cloud),3,replace=False)]
    normal=np.cross(c-a,d-a);length=np.linalg.norm(normal)
    if length<1e-8:continue
    normal/=length
    if abs(normal[2])<.75:continue
    mask=np.abs((cloud-a)@normal)<.012;count=int(mask.sum())
    if count>best_count:best_count=count;best=cloud[mask]
assert best is not None and best_count>100,'Cannot locate a stable statue base'
_,_,vt=np.linalg.svd(best-best.mean(0),full_matrices=False)
normal=vt[-1];normal=normal if normal[2]>0 else -normal
level=Vector(normal).rotation_difference(Vector((0,0,1))).to_matrix().to_4x4()
normalize=Matrix.Diagonal((factor,factor,factor,1))@Matrix.Translation(-Vector(centre))
for o in body:o.matrix_world=level@normalize@o.matrix_world
points=np.concatenate([vertices(o) for o in body])
lo=points.min(0);hi=points.max(0)
offset=Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]))
for o in body:o.location-=offset
del points,cloud,best
# Reduce source chunks before joining, avoiding a large edit-mode memory peak.
original=0
for o in body:
    o.data.calc_loop_triangles();original+=len(o.data.loop_triangles)
ratio=min(1,220000/original)
for o in body:
    bpy.context.view_layer.objects.active=o
    modifier=o.modifiers.new('Game sculpture','DECIMATE');modifier.ratio=ratio
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    print('Simplified',o.name,flush=True)
bpy.context.view_layer.objects.active=body[0]
bpy.ops.object.join()
statue=bpy.context.object;statue.name='Poseidon_Marble'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
modifier=statue.modifiers.new('Join scan seams','WELD');modifier.merge_threshold=.00003
bpy.ops.object.modifier_apply(modifier=modifier.name)
for face in statue.data.polygons:face.use_smooth=True
marble=bpy.data.materials.new('Poseidon ash-grey marble');marble.use_nodes=True
shader=marble.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(.49,.485,.47,1)
shader.inputs['Metallic'].default_value=0
shader.inputs['Roughness'].default_value=.74
marble.diffuse_color=(.49,.485,.47,1)
statue.data.materials.clear();statue.data.materials.append(marble)
for face in statue.data.polygons:face.material_index=0

existing=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(OUT/'trident.glb'))
trident=[o for o in bpy.context.scene.objects if o not in existing and o.type=='MESH']
# The lower fist is the scan's open staff grip. The shaft meets it at 42%
# of the prepared trident's length, with its fork above the statue's head.
grip=Vector((-.08,.02,2.91))
trident_height=6.7
transform=Matrix.Translation(grip)@Matrix.Rotation(math.radians(-18),4,'Y')@Matrix.Translation((0,0,-trident_height*.42))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Diagonal((trident_height/4.5,)*3+(1,))
bronze=bpy.data.materials.new('Aged trident bronze');bronze.use_nodes=True
shader=bronze.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.21,.16,.08,1);shader.inputs['Metallic'].default_value=.65;shader.inputs['Roughness'].default_value=.57
bronze.diffuse_color=(.21,.16,.08,1)
for o in trident:
    matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=transform@matrix
    o.data.materials.clear();o.data.materials.append(bronze)
    for face in o.data.polygons:face.material_index=0
bpy.ops.object.select_all(action='DESELECT')
for o in trident:o.select_set(True)
bpy.context.view_layer.objects.active=trident[0];bpy.ops.object.join();staff=bpy.context.object;staff.name='Trident_Attached'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
root=bpy.data.objects.new('Poseidon_With_Trident',None);bpy.context.collection.objects.link(root)
statue.parent=root;staff.parent=root
bpy.ops.object.select_all(action='DESELECT');statue.select_set(True);staff.select_set(True);root.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'poseidon.glb'),export_format='GLB',use_selection=True,export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'poseidon-with-trident.blend'))
report_file=OUT/'preparation.json';report=json.loads(report_file.read_text(encoding='utf-8'))
statue.data.calc_loop_triangles()
report['poseidon']={'source_bytes':len(b),'source_triangles':original,'triangles':len(statue.data.loop_triangles),'base_normal':normal.tolist(),'grip_blender':list(grip),'trident_height':trident_height,'material':'neutral ash-grey marble; aged bronze trident','meshes':2,'bytes':(OUT/'poseidon.glb').stat().st_size}
report_file.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
manifest_file=ROOT/'native/assets-manifest.json'
manifest=json.loads(manifest_file.read_text(encoding='utf-8'))
manifest['assets']=[a for a in manifest['assets'] if not a['file'].startswith('assets/temple-statues/')]
for path in sorted(OUT.iterdir()):
    if path.suffix not in ['.glb','.txt','.json']:continue
    payload=path.read_bytes()
    manifest['assets'].append({'file':path.relative_to(ROOT/'native').as_posix(),'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest(),'source':'User-supplied temple models; scripts/blender/prepare_poseidon.py; see CREDITS.txt'})
manifest_file.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('POSEIDON',json.dumps(report['poseidon']))
# Workbench images make the hand alignment and source orientation reviewable.
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.world=bpy.data.worlds.new('Inspection');scene.world.color=(.10,.11,.12)
scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH';scene.display.shading.background_type='WORLD'
scene.render.resolution_x=900;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
for i in [0,1]:
    data=bpy.data.cameras.new('Inspection');camera=bpy.data.objects.new('Inspection',data);scene.collection.objects.link(camera)
    camera.location=(0,-14,4.2) if i==0 else (12,-4,4.2)
    camera.rotation_euler=(Vector((0,0,3.5))-camera.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=8
    scene.camera=camera;scene.render.filepath=str(ROOT/f'.tools/poseidon-combined-{i}.png');bpy.ops.render.render(write_still=True)
