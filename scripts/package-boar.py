from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent;asset=root/'assets-source/creatures/ash-tusk-boar'
files=['ash-tusk-boar.blend','ash-tusk-boar.glb','ash-tusk-boar.fbx','manifest.json','quality-report.json','three-quarter.png','profile.png','head-detail.png','exported-glb-three-quarter.png','textures/AshTusk_BaseColor.png','textures/AshTusk_Normal.png','textures/AshTusk_Roughness.png']
for name in files:assert (asset/name).is_file(),name
with zipfile.ZipFile(root/'asterion-ash-tusk-boar.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(asset/name,'Ash-Tusk Boar/'+name)
 z.write(root/'asterion-boar-viewer.html','Ash-Tusk Boar/OPEN-MODEL-VIEWER.html')
 z.write(root/'ASH-TUSK-BOAR.md','Ash-Tusk Boar/README.md')
 z.write(root/'scripts/blender/build_calydonian_boar.py','Ash-Tusk Boar/source/build_calydonian_boar.py')
 z.write(root/'scripts/blender/validate_calydonian_boar.py','Ash-Tusk Boar/source/validate_calydonian_boar.py')
with zipfile.ZipFile(root/'asterion-ash-tusk-boar.zip') as z:assert z.testzip() is None
print('Packaged static boar:',round((root/'asterion-ash-tusk-boar.zip').stat().st_size/1048576,2),'MiB; source, exports, maps, actual renders and viewer.')
