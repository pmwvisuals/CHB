"""Stage the supplied wolf/mantis and convert the textured animated FBX boar."""
from pathlib import Path
import bpy, hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT/'assets-source/imported-creatures'
OUT = ROOT/'native/assets/forest-creatures'
OUT.mkdir(parents=True, exist_ok=True)
shutil.copyfile(SOURCE/'magic_wolf.glb', OUT/'magic-wolf.glb')
shutil.copyfile(SOURCE/'mutant-mantis-20/mantis.glb', OUT/'mutant-mantis.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(SOURCE/'fantasy-boar-animation/source/2(A)_ Boar_Blue.fbx'))
image = bpy.data.images.load(str(SOURCE/'fantasy-boar-animation/textures/T_Boar_Diffuse_Blue.png'))
for material in bpy.data.materials:
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    texture = material.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = image
    material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
    shader.inputs['Roughness'].default_value = .86
    shader.inputs['Metallic'].default_value = 0
armature = next(o for o in bpy.data.objects if o.type=='ARMATURE')
for action in bpy.data.actions:
    track = armature.animation_data.nla_tracks.new()
    name = action.name.split('|')[1]
    track.name = name
    strip = track.strips.new(name, 1, action)
    track.mute = True
armature.animation_data.action = None
bpy.ops.export_scene.gltf(filepath=str(OUT/'fantasy-boar.glb'), export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS')
manifest_path = ROOT/'native/assets-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['assets'] = [a for a in manifest['assets'] if not a['file'].startswith('assets/forest-creatures/')]
(OUT/'CREDITS.txt').write_text('''Supplied forest creature assets

Magic Wolf by alice.duarte13 (liiceduarte)
https://sketchfab.com/3d-models/magic-wolf-2b183ca4a3984c1385856ca864c7508c
CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
Source mesh, textures and animation retained. In-game size, grounding, material finish and behaviour adapted.

Praying Mantis (monster) by LostBoyz2078 (LostModels2025)
https://sketchfab.com/3d-models/praying-mantis-monster-7a629fa3040c4949954509101cb9b5cc
CC BY-NC 4.0 — https://creativecommons.org/licenses/by-nc/4.0/
Noncommercial prototype use. Commercial release needs additional permission or a replacement.
Source mesh, textures and animation retained. In-game size, grounding and material finish adapted.

Fantasy blue boar supplied in fantasy-boar-animation.zip
The supplied archive contains an FBX and diffuse texture. It contains no creator or license statement.
License and commercial permissions remain unverified. Confirm the source terms before distribution.
Converted to GLB with its supplied texture and seven animations. In-game size, grounding and behaviour adapted.
''',encoding='utf-8')
for path in sorted([*OUT.glob('*.glb'),OUT/'CREDITS.txt']):
    data = path.read_bytes()
    manifest['assets'].append({'file':path.relative_to(ROOT/'native').as_posix(), 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(), 'source':'User-supplied creature files; scripts/blender/prepare_forest_creatures.py'})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('STAGED three supplied creatures')
