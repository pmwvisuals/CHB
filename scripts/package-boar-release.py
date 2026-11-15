"""Build a customer ZIP and a separate private seller/listing kit."""
from pathlib import Path
import hashlib,json,shutil,zipfile,struct
root=Path(__file__).resolve().parent.parent;source=root/'assets-source/creatures/ash-tusk-boar/release';seller=root/'boar-seller-kit'
assert (source/'Reports/portable-validation.json').is_file()
assert (source/'Reports/source-fbx-validation.json').is_file()
for name in ['Hero.jpg','Side.jpg','Head.jpg','Rear.jpg','Cover.jpg','Topology_CoatHidden.jpg','Godot_LOD0.png','Godot_LOD2.png']:assert (source/'Previews'/name).is_file(),name
for name in ['Hero.jpg','Side.jpg','Head.jpg','Rear.jpg','Cover.jpg','Topology_CoatHidden.jpg']:shutil.copy2(source/'Previews'/name,seller/name)
# The model viewer is part of the paid download; it embeds the full-quality model.
glb=source/'Models/Boar_LOD0.glb'
import base64,re
html=(root/'asterion-boar-runtime.html').read_text(encoding='utf-8')
html=re.sub(r'(window.__BOAR_GLB__=)"[^"]*"',lambda m:m[1]+json.dumps(base64.b64encode(glb.read_bytes()).decode()),html)
html=html.replace('ash-tusk-boar-runtime.glb','Boar_LOD0.glb').replace('Gameplay Boar','Ash-Tusk Boar').replace('Reduced gameplay boar ·','Full-quality model preview ·')
(source/'ModelViewer.html').write_text(html,encoding='utf-8');shutil.copy2(root/'node_modules/three/LICENSE',source/'THREE-MIT-LICENSE.txt')
report={'asset':'Ash-Tusk Boar','version':'1.0.0','measured_triangles':[104660,48380,21096],'mesh_groups_per_level':5,'bones':21,'shared_maps':3,'portable_pose_checks':99,'portable_pose_levels':297,'fbx_pose_checks':27,'godot_demo_assertions':19,'source_scene_checks':'16 objects; only rig and 3 LOD collections; identity transforms; packed/external maps match; relative paths inside package','renders':'Actual supplied geometry; topology image hides the coat and is named accordingly','supported_tested':'Blender 5.2.3, Three.js GLB loader, Godot 4.7.2 Compatibility on Windows','not_tested':['Unity','Unreal Engine','mobile frame rate','marketplace approval'],'previous_connected_head_checks':'Unchanged refined LOD0 passes 7 manifold mouth/tusk-seat poses; close mesh attributes match refined source','asset_license':'LICENSE.txt; commercial project use, no standalone redistribution','ai_disclosure':'AI-assisted procedural modeling, texturing and rigging; no third-party art downloads'}
(source/'Reports/RELEASE-VALIDATION.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(source/'Reports/RELEASE-VALIDATION.md').write_text('''# Release verification

- Three portable detail levels match measured counts; original refined LOD0 attributes are unchanged.
- 99 animation samples cover all 3 mesh levels (297 pose/level checks); all weights are normalized and finite.
- Three FBX files re-import with 5 meshes, 21 bones, 3 clips and 9 finite deformation poses each.
- Clean Blender source opens with 16 objects, only the rig and 3 detail collections, identity object transforms and LOD0 visible by default. All 3 packed 4K maps match external files; image paths resolve inside the package.
- 19 standalone Godot assertions pass; actual renders show full and distant mesh detail. The demo has no sanctuary-game dependency.
- Prior connected-jaw and seated-tusk checks remain applicable because the close mesh matches the checked refined source exactly.
- Screenshots show actual model geometry. The structural wireframe preview explicitly hides the coat for readability.

These checks establish this package's recorded behavior, not a photorealism claim, marketplace approval, or a hardware frame-rate guarantee. This is a stylized triangulated creature with three in-place clips, not a complete AI or animation library.
''')
def eligible(p):
 return p.is_file() and '.godot' not in p.parts and p.suffix not in ['.import','.blend1','.log'] and p.name!='SHA256SUMS.txt'
files=sorted(p for p in source.rglob('*') if eligible(p))
hashes={p.relative_to(source).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(source/'SHA256SUMS.txt').write_text(''.join(f'{h}  {name}\n' for name,h in hashes.items()),encoding='utf-8')
files.append(source/'SHA256SUMS.txt')
destination=root/'ash-tusk-boar-commercial.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,'AshTuskBoar/'+p.relative_to(source).as_posix())
with zipfile.ZipFile(destination) as z:
 assert z.testzip() is None
 for name,h in hashes.items():assert hashlib.sha256(z.read('AshTuskBoar/'+name)).hexdigest()==h
 assert not any('/.godot/' in n or '/.tools/' in n for n in z.namelist())
(seller/'BUYER-PACKAGE-SHA256.txt').write_text(hashlib.sha256(destination.read_bytes()).hexdigest()+'  '+destination.name+'\n')
seller_archive=root/'ash-tusk-boar-seller-kit.zip'
with zipfile.ZipFile(seller_archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(seller.iterdir()):
  if p.is_file():z.write(p,'SellerKit/'+p.name)
with zipfile.ZipFile(seller_archive) as z:assert z.testzip() is None
print('Verified buyer package:',len(files),'files;',destination.stat().st_size,'bytes')
print('Verified seller kit:',seller_archive.stat().st_size,'bytes')
