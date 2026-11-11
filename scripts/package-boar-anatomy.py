from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent;asset=root/'assets-source/creatures/ash-tusk-boar'
files=['ash-tusk-boar-anatomy.blend','ash-tusk-boar-anatomy.glb','anatomy-quality-report.json','anatomy-three-quarter.png','anatomy-profile.png','anatomy-head.png','anatomy-clay.png','anatomy-export-check.png']
with zipfile.ZipFile(root/'asterion-boar-anatomy.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(asset/name,'Boar anatomy/'+name)
 z.write(root/'asterion-boar-anatomy.html','Boar anatomy/OPEN-ANATOMY-VIEWER.html');z.write(root/'BOAR-ANATOMY.md','Boar anatomy/README.md')
 for script in ['scripts/blender/refine_boar_anatomy.py','scripts/blender/validate_boar_anatomy.py','scripts/check-boar-anatomy.mjs']:z.write(root/script,'Boar anatomy/source/'+Path(script).name)
with zipfile.ZipFile(root/'asterion-boar-anatomy.zip') as z:assert z.testzip() is None
print('Packaged and CRC checked anatomy review')
