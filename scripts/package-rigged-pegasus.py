from pathlib import Path
import zipfile,json,hashlib
root=Path(__file__).resolve().parents[1]
asset=root/'assets-source/creatures/dawnwing-pegasus'
archive=root/'asterion-pegasus-riding.zip'
assert (asset/'Rigged/validation.json').exists()
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted((asset/'Rigged').iterdir()):
        if p.suffix in ['.blend','.glb','.json']:z.write(p,'Dawnwing Pegasus/Rigged/'+p.name)
    for p in sorted((asset/'Textures').glob('*.png')):z.write(p,'Dawnwing Pegasus/Textures/'+p.name)
    for name in ['pegasus-companion.png','pegasus-riding.png','pegasus-idle.png','pegasus-walk.png','pegasus-wingbeat.png']:
        p=root/'native/builds'/name
        if p.exists():z.write(p,'Dawnwing Pegasus/Previews/'+name)
    z.write(root/'native/assets/pegasus/dawnwing.glb','Dawnwing Pegasus/Game/dawnwing.glb')
    z.write(root/'PEGASUS-RIDING.md','Dawnwing Pegasus/README.md')
    for name in ['scripts/blender/rig_pegasus.py','scripts/blender/validate_rigged_pegasus.py','native/scripts/pegasus.gd','native/tests/pegasus.gd']:
        z.write(root/name,'Dawnwing Pegasus/Source/'+name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(set(z.namelist()))
print(json.dumps({'file':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))
