"""Prepare the user-supplied sculptures; never read a partial download as a GLB."""
from pathlib import Path
import bpy, json, zipfile, io, shutil, hashlib, runpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'assets-source/temple-statues'
OUT=ROOT/'native/assets/temple-statues'
SOURCE.mkdir(parents=True,exist_ok=True)
OUT.mkdir(parents=True,exist_ok=True)
downloads=Path('C:/Users/User/Downloads')
for name in ['zeus.zip','ares_ludovisi.glb','trident.glb']:
    if not (SOURCE/name).exists():shutil.copyfile(downloads/name,SOURCE/name)
with zipfile.ZipFile(SOURCE/'zeus.zip') as archive:
    with zipfile.ZipFile(io.BytesIO(archive.read('source/Zeus.zip'))) as inner:
        for item in inner.infolist():
            target=SOURCE/'zeus'/item.filename
            assert target.resolve().is_relative_to((SOURCE/'zeus').resolve())
            if not item.is_dir():
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(inner.read(item))

report={}
for name,path,height in [('zeus',SOURCE/'zeus/Zeus_300k_ZR.OBJ',6.0),('ares',SOURCE/'ares_ludovisi.glb',4.8),('trident',SOURCE/'trident.glb',4.5)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if path.suffix.lower()=='.obj':bpy.ops.wm.obj_import(filepath=str(path),forward_axis='Y',up_axis='Z')
    else:bpy.ops.import_scene.gltf(filepath=str(path))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    # Bake source hierarchy coordinates before normalizing a single sculpture.
    for obj in meshes:
        matrix=obj.matrix_world.copy()
        obj.parent=None
        obj.matrix_world=matrix
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:obj.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    lo=Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
    factor=height/(hi.z-lo.z)
    origin=Vector(((lo.x+hi.x)*.5,(lo.y+hi.y)*.5,lo.z))
    original=sum(len(o.data.loop_triangles) for o in meshes)
    for obj in meshes:
        obj.location=(obj.location-origin)*factor
        obj.scale=Vector((factor,)*3)
        obj.data.calc_loop_triangles()
        count=len(obj.data.loop_triangles)
        if count>180000:
            modifier=obj.modifiers.new('Sculpture game mesh','DECIMATE')
            modifier.ratio=180000/count
            bpy.context.view_layer.objects.active=obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        for material in obj.data.materials:
            if not material or not material.use_nodes:continue
            shader=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
            if shader:
                shader.inputs['Roughness'].default_value=.86
                shader.inputs['Metallic'].default_value=0
    for image in bpy.data.images:
        if image.size[0]>2048 or image.size[1]>2048:
            scale=2048/max(image.size)
            image.scale(max(1,round(image.size[0]*scale)),max(1,round(image.size[1]*scale)))
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=92)
    report[name]={'height':height,'source_bounds':[list(lo),list(hi)],'meshes':len(meshes),'bytes':(OUT/(name+'.glb')).stat().st_size}
    print('STATUE',name,json.dumps(report[name]))

(OUT/'preparation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if (SOURCE/'poseidon.glb').exists():
    runpy.run_path(str(ROOT/'scripts/blender/prepare_poseidon.py'),run_name='__main__')

(OUT/'CREDITS.txt').write_text('''User-supplied temple sculptures

Zeus: supplied zeus.zip; OBJ, MTL and two original texture tiles.
No author or license statement is included in the archive. Rights remain unverified.

Ares Ludovisi by noe-3d.at
https://sketchfab.com/3d-models/ares-ludovisi-a2400788e3964cfca36c97f09a45dbf6
CC BY-NC 4.0 — https://creativecommons.org/licenses/by-nc/4.0/
Noncommercial prototype use only. Textures resized, mesh simplified and scale adapted.

Trident by Finn the Demon Cat
https://sketchfab.com/3d-models/trident-66d41b0b9115486f9ec5112902028d1d
CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
Scaled, turned and attached to Poseidon's lower hand as part of the combined sculpture.

Poseidon statue - 3D Scanned by Revopoint Trackit, by Revopoint 3D
https://sketchfab.com/3d-models/poseidon-statue-3d-scanned-by-revopoint-trackit-13793d04fd974061aeaec2f68ce57648
CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
Complete supplied scan: 39,891,876 bytes. Mesh simplified, pedestal leveled,
blue source material replaced by ash-grey marble, and the separate trident attached.
''',encoding='utf-8')
manifest_path=ROOT/'native/assets-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['assets']=[a for a in manifest['assets'] if not a['file'].startswith('assets/temple-statues/')]
for path in sorted(OUT.iterdir()):
    if path.suffix not in ['.glb','.txt','.json']:continue
    data=path.read_bytes()
    manifest['assets'].append({'file':path.relative_to(ROOT/'native').as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source':'User-supplied temple models; scripts/blender/prepare_temple_statues.py; see CREDITS.txt'})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
