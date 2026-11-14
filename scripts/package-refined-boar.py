from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
source=root/'assets-source/creatures/ash-tusk-boar/refined'
destination=root/'asterion-boar-refined.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in ['ash-tusk-boar-refined.blend','ash-tusk-boar-refined.glb','ash-tusk-boar-refined.fbx','refinement-report.json','export-motion-checks.json','head-attachment-checks.json','interchange-checks.json','rest.png','head.png','strike.png','exported-strike.png']:
  z.write(source/name,'Refined boar/'+name)
 for p in sorted((source/'textures').glob('*.png')):z.write(p,'Refined boar/textures/'+p.name)
 z.write(root/'asterion-boar-refined.html','Refined boar/OPEN-MODEL.html')
 z.write(root/'BOAR-REFINED.md','Refined boar/README.md')
 z.write(root/'node_modules/three/LICENSE','Refined boar/THIRD-PARTY-NOTICES.txt')
 for name in ['refine_boar_coat.py','export_rigged_boar.py','validate_boar_head.py','validate_rigged_boar.py']:
  z.write(root/'scripts/blender'/name,'Refined boar/source/'+name)
with zipfile.ZipFile(destination) as z:assert z.testzip() is None
print('Refined boar archive verified:',destination,destination.stat().st_size,'bytes')
