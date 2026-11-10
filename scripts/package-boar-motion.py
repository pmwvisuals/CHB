from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent;asset=root/'assets-source/creatures/ash-tusk-boar'
with zipfile.ZipFile(root/'asterion-boar-motion.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in ['ash-tusk-boar-motion.blend','ash-tusk-boar-motion.glb','motion-quality-report.json']:
  z.write(asset/name,'Boar movement/'+name)
 for frame in [1,9,17,25,49,56,65,81]:z.write(asset/('motion-frame-'+str(frame)+'.png'),'Boar movement/previews/'+str(frame)+'.png')
 z.write(root/'asterion-boar-motion.html','Boar movement/OPEN-MOVEMENT-VIEWER.html')
 z.write(root/'BOAR-MOTION.md','Boar movement/README.md')
 z.write(root/'scripts/blender/animate_boar_prototype.py','Boar movement/source/animate_boar_prototype.py')
with zipfile.ZipFile(root/'asterion-boar-motion.zip') as z:assert z.testzip() is None
print('Packaged and CRC checked movement prototype')
