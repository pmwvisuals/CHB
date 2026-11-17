from pathlib import Path
import zipfile,json,hashlib
root=Path(__file__).resolve().parents[1]
asset=root/'assets-source/creatures/dawnwing-pegasus'
files=[p for folder in ['Blender','Models','Textures','Reports'] for p in (asset/folder).rglob('*') if p.is_file() and p.suffix in ['.blend','.glb','.png','.json']]
files += sorted((asset/'Previews').glob('Exported-*.png'))
assert (asset/'Reports/validation.json').exists()
archive=root/'asterion-pegasus-model.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,'Dawnwing Pegasus/'+p.relative_to(asset).as_posix())
    z.write(root/'PEGASUS.md','Dawnwing Pegasus/README.md')
    for p in ['scripts/blender/build_pegasus.py','scripts/blender/validate_pegasus.py','scripts/package-pegasus.py']:z.write(root/p,'Dawnwing Pegasus/Source/'+Path(p).name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert not any('/scratch/' in p or p.endswith('.blend1') for p in z.namelist())
print(json.dumps({'file':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':len(files)}))
