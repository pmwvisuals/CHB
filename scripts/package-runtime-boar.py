from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent;asset=root/'assets-source/creatures/ash-tusk-boar/runtime';clean=asset.parent/'clean'
files=['ash-tusk-boar-runtime.blend','ash-tusk-boar-runtime.glb','ash-tusk-boar-runtime.fbx','rig-quality-report.json','export-motion-checks.json','interchange-checks.json','rest.png','walk.png','strike.png','exported-strike.png']
with zipfile.ZipFile(root/'asterion-boar-runtime.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(asset/name,'Gameplay boar/'+name)
 for kind in ['BaseColor','Roughness','Normal']:
  name='CleanBoar_'+kind+'.png';z.write(clean/'textures'/name,'Gameplay boar/textures/'+name)
 z.write(root/'asterion-boar-runtime.html','Gameplay boar/OPEN-GAMEPLAY-MODEL.html');z.write(root/'BOAR-RUNTIME.md','Gameplay boar/README.md');z.write(root/'node_modules/three/LICENSE','Gameplay boar/THIRD-PARTY-NOTICES.txt')
 for name in ['optimize_boar.py','export_rigged_boar.py','validate_rigged_boar.py']:z.write(root/'scripts/blender'/name,'Gameplay boar/source/'+name)
with zipfile.ZipFile(root/'asterion-boar-runtime.zip') as z:assert z.testzip() is None
print('Gameplay package complete; ZIP integrity checked')
