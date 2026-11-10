"""Validate actual static exports, then render the imported GLB for comparison."""
import bpy,bmesh,json,struct,sys,math
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1]);OUT=ROOT/'assets-source/creatures/ash-tusk-boar'
source=OUT/'ash-tusk-boar.blend';binary=(OUT/'ash-tusk-boar.glb').read_bytes();magic,version,total=struct.unpack_from('<III',binary);assert magic==0x46546c67 and version==2 and total==len(binary)
length,kind=struct.unpack_from('<II',binary,12);assert kind==0x4e4f534a;gltf=json.loads(binary[20:20+length]);assert not gltf.get('skins') and not gltf.get('animations'),'Static export unexpectedly contains rig or clips'
assert all('uri' not in image for image in gltf.get('images',[])),'GLB must embed its textures'
report={'static':True,'gltf_meshes':len(gltf.get('meshes',[])),'gltf_materials':len(gltf.get('materials',[])),'gltf_images':len(gltf.get('images',[])),'gltf_bytes':len(binary),'checks':[]}
assert report['gltf_meshes']<=6,'Static meshes should be grouped by material'
assert any('normalTexture' in m for m in gltf['materials']),'Baked normal map missing'
assert any('baseColorTexture' in m.get('pbrMetallicRoughness',{}) for m in gltf['materials']),'Base colour atlas missing'
bpy.ops.wm.open_mainfile(filepath=str(source));body=bpy.data.objects['01 · Continuous body head and legs'];assert not any(o.type=='ARMATURE' for o in bpy.data.objects)
assert body.data.uv_layers.active and len(body.data.uv_layers.active.data)>0
assert all(math.isfinite(v) for ob in bpy.data.collections['ASSET · Ash-Tusk Boar · static'].objects if ob.type=='MESH' for vertex in ob.data.vertices for v in vertex.co)
assert all(not p.use_smooth or len(p.vertices)>=3 for p in body.data.polygons)
report['source_vertices']=len(body.data.vertices);report['source_quads']=sum(len(p.vertices)==4 for p in body.data.polygons);report['source_faces']=len(body.data.polygons)
assert report['source_quads']/report['source_faces']>.95,'Continuous body must retain its editable quad cage'
bm=bmesh.new();bm.from_mesh(body.data);report['body_nonmanifold_edges']=sum(not edge.is_manifold for edge in bm.edges);bm.free();assert report['body_nonmanifold_edges']==0
assert bpy.data.objects.get('Original editable quad cage'),'Original modelling cage missing'
for name in ['AshTusk_BaseColor','AshTusk_Normal','AshTusk_Roughness']:
 image=bpy.data.images[name];assert tuple(image.size)==(4096,4096) and image.packed_file,'Packed 4K map missing: '+name
 pixels=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(pixels);stride=max(4,(len(pixels)//4000//4)*4);values=pixels[::stride];assert float(np.ptp(values))>.015,'Texture appears empty: '+name;del values,pixels
 print('CHECKED packed 4K map:',name,flush=True)
report['checks']+=['GLB JSON, embedded PBR maps, no skins or animation','Editable predominantly quad body with preserved original source cage','Finite source coordinates and packed nonempty 4K textures']

def validate_import(filepath,fmt):
 print('REIMPORT',fmt,flush=True)
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if fmt=='glb':bpy.ops.import_scene.gltf(filepath=str(filepath))
 else:bpy.ops.import_scene.fbx(filepath=str(filepath))
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert objects and not any(o.type=='ARMATURE' for o in bpy.context.scene.objects)
 lo=Vector((1e8,)*3);hi=Vector((-1e8,)*3);triangles=0
 for ob in objects:
  assert len(ob.data.vertices)>0;ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
  for vertex in ob.data.vertices:
   point=ob.matrix_world@vertex.co;assert all(math.isfinite(x) for x in point)
   for k in range(3):lo[k]=min(lo[k],point[k]);hi[k]=max(hi[k],point[k])
 size=hi-lo;assert 2<size.x<3.5 and 4.5<size.y<6 and 2.8<size.z<4,'Unexpected giant model scale or orientation: '+str(tuple(size))
 assert abs(lo.z)<.01,'Feet must rest at ground level: '+str(lo.z)
 return {'meshes':len(objects),'triangles':triangles,'dimensions_blender_m':list(size),'min_z':lo.z}
report['fbx_import']=validate_import(OUT/'ash-tusk-boar.fbx','fbx');report['glb_import']=validate_import(OUT/'ash-tusk-boar.glb','glb');print('CHECKED both export geometries',flush=True)
assert report['glb_import']['triangles']==report['fbx_import']['triangles'],'Export formats disagree on geometry'
report['checks'].append('GLB and FBX re-import with matching geometry, metre scale, no rig or animation')

with bpy.data.libraries.load(str(source),link=False) as (data_from,data_to):data_to.collections=['STUDIO · excluded from exports'];data_to.worlds=['Neutral studio']
bpy.context.scene.collection.children.link(data_to.collections[0]);scene=bpy.context.scene;scene.world=data_to.worlds[0];scene.camera=next(o for o in data_to.collections[0].objects if o.type=='CAMERA');scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'exported-glb-three-quarter.png');bpy.ops.render.render(write_still=True)
scene.camera.location=(11,-.2,3.2);scene.camera.rotation_euler=(Vector((0,-.35,1.55))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/'profile.png');bpy.ops.render.render(write_still=True)
report['checks'].append('Three-quarter and full profile studio images rendered from the re-imported actual GLB')
(OUT/'quality-report.json').write_text(json.dumps(report,indent=2));print('VALIDATED',json.dumps(report),flush=True)
