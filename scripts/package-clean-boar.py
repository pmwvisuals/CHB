from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent;asset=root/'assets-source/creatures/ash-tusk-boar/clean'
files=['ash-tusk-boar-clean.blend','ash-tusk-boar-clean.glb','ash-tusk-boar-clean.fbx','quality-report.json','three-quarter.png','head.png','profile.png','exported-model.png']+[f'textures/CleanBoar_{kind}.png' for kind in ['BaseColor','Roughness','Normal']]
with zipfile.ZipFile(root/'asterion-boar-clean.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(asset/name,'Clean boar/'+name)
 z.write(root/'asterion-boar-clean.html','Clean boar/OPEN-MODEL.html');z.write(root/'CLEAN-BOAR.md','Clean boar/README.md');z.write(root/'node_modules/three/LICENSE','Clean boar/THIRD-PARTY-NOTICES.txt')
 for name in ['scripts/blender/finish_clean_boar.py','scripts/blender/validate_clean_boar.py']:z.write(root/name,'Clean boar/source/'+Path(name).name)
with zipfile.ZipFile(root/'asterion-boar-clean.zip') as z:assert z.testzip() is None
print('Packaged clean boar, CRC checked')
