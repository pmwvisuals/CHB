from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
asset=root/'assets-source/creatures/ash-tusk-boar/polished'
files=['ash-tusk-boar-polished.blend','ash-tusk-boar-polished.glb','ash-tusk-boar-polished.fbx','rig-quality-report.json','export-motion-checks.json','interchange-checks.json','head-attachment-checks.json','rest.png','head.png','strike.png','exported-strike.png']
archive=root/'asterion-boar-polished.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(asset/name,'Polished boar/'+name)
 for p in sorted((asset/'textures').glob('*.png')):z.write(p,'Polished boar/textures/'+p.name)
 z.write(root/'asterion-boar-polished.html','Polished boar/OPEN-POLISHED-MODEL.html')
 z.write(root/'BOAR-POLISHED.md','Polished boar/README.md')
 z.write(root/'node_modules/three/LICENSE','Polished boar/THIRD-PARTY-NOTICES.txt')
 for name in ['polish_boar_small.py','export_rigged_boar.py','validate_boar_head.py','validate_rigged_boar.py']:z.write(root/'scripts/blender'/name,'Polished boar/source/'+name)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print('Polished model package checked:',archive,archive.stat().st_size,'bytes')
