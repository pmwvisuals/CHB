"""Check the original source and re-imported GLB, then render the actual export."""
from pathlib import Path
import bpy,bmesh,json,math
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets-source/creatures/dawnwing-pegasus'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'Blender/DawnwingPegasus.blend'))
body=next(o for o in bpy.data.objects if o.name.startswith('Pegasus_Body'))
bm=bmesh.new();bm.from_mesh(body.data)
assert all(e.is_manifold for e in bm.edges),'Body must be a closed manifold skin'
remaining=set(bm.verts);components=0
while remaining:
    components+=1;stack=[remaining.pop()]
    while stack:
        v=stack.pop()
        for e in v.link_edges:
            other=e.other_vert(v)
            if other in remaining:remaining.remove(other);stack.append(other)
bm.free()
assert components==1,('Detached body component',components)
assert not any(o.type=='ARMATURE' for o in bpy.context.scene.objects)
assert len(bpy.data.collections['TACK | optional removable riding equipment'].objects)==3
for name in ['Pegasus_Coat_BaseColor','Pegasus_Coat_Normal','Pegasus_Feather_BaseColor']:
    image=bpy.data.images[name]
    assert image.packed_file and min(image.size)>=1024
    assert all(math.isfinite(v) for v in list(image.pixels)[::4096])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(OUT/'Models/DawnwingPegasus.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert len(meshes)==12 and not any(o.type in ['LIGHT','CAMERA','ARMATURE'] for o in bpy.context.scene.objects)
triangles=0;points=[]
for obj in meshes:
    obj.data.calc_loop_triangles();triangles+=len(obj.data.loop_triangles)
    assert all(math.isfinite(v) for p in obj.data.vertices for v in p.co)
    points.extend(obj.matrix_world@Vector(c) for c in obj.bound_box)
lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)]
assert abs(lo[2])<.01 and 6.4<hi[0]-lo[0]<7 and 3.4<hi[2]<3.7
assert triangles<350000
assert len([o for o in meshes if o.name.startswith('Tack_')])==3
assert len(bpy.data.images)>=3
with bpy.data.libraries.load(str(OUT/'Blender/DawnwingPegasus.blend'),link=False) as (src,dst):
    dst.collections=['STUDIO | not exported'];dst.worlds=['Neutral blue-grey studio']
scene=bpy.context.scene;scene.collection.children.link(dst.collections[0]);scene.world=dst.worlds[0]
camera=next(o for o in dst.collections[0].objects if o.type=='CAMERA');scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.view_settings.view_transform='AgX'
scene.render.resolution_x=1280;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
for name,at,target,lens in [('Hero',(7,-9,4.7),(0,-.10,1.9),52),('Profile',(10,-.1,3.4),(0,-.20,1.8),52),('Head',(2.8,-5.7,3.5),(0,-1.65,2.80),70)]:
    camera.location=at;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens
    scene.render.filepath=str(OUT/'Previews'/('Exported-'+name+'.png'));bpy.ops.render.render(write_still=True)
    print('EXPORTED PREVIEW',name,flush=True)
report={'checks':['Closed manifold, single connected horse skin','No rig or animation claimed','Three separately removable tack meshes','Packed real coat and feather textures','GLB re-imports with twelve meshes and no studio objects','Finite coordinates, grounded hooves, metre dimensions','GLB under 350k triangles','Studio previews rendered from the re-imported GLB'], 'triangles':triangles,'meshes':len(meshes),'dimensions_m':[hi[i]-lo[i] for i in range(3)],'rigged':False,'animated':False,'mobile_optimized':False}
(OUT/'Reports/validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('PEGASUS VALIDATED',json.dumps(report),flush=True)
