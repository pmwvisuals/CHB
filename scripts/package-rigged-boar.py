from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent;asset=root/'assets-source/creatures/ash-tusk-boar/rigged';clean=asset.parent/'clean'
files=['ash-tusk-boar-rigged.blend','ash-tusk-boar-rigged.glb','ash-tusk-boar-rigged.fbx','rig-quality-report.json','export-motion-checks.json','interchange-checks.json','head-repair-report.json','head-attachment-checks.json','head-repaired.png','head-profile.png','head-front.png','head-strike.png','exported-strike.png']
with zipfile.ZipFile(root/'asterion-boar-rigged.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(asset/name,'Rigged boar/'+name)
 for kind in ['BaseColor','Roughness','Normal']:
  name='CleanBoar_'+kind+'.png';z.write(clean/'textures'/name,'Rigged boar/textures/'+name)
 z.write(root/'asterion-boar-rigged.html','Rigged boar/OPEN-ANIMATION.html');z.write(root/'BOAR-RIGGED.md','Rigged boar/README.md');z.write(root/'node_modules/three/LICENSE','Rigged boar/THIRD-PARTY-NOTICES.txt')
 for name in ['rig_clean_boar.py','repair_boar_head.py','validate_boar_head.py','export_rigged_boar.py','validate_rigged_boar.py']:z.write(root/'scripts/blender'/name,'Rigged boar/source/'+name)
with zipfile.ZipFile(root/'asterion-boar-rigged.zip') as z:assert z.testzip() is None
print('Rigged package complete; ZIP integrity checked')
