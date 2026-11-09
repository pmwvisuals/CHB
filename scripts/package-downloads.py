"""Package the built portable game, clean source and editable vegetation exports."""
from pathlib import Path
import subprocess,zipfile,json
root=Path(__file__).resolve().parent.parent
pages=['asterion-sanctuary.html','forest.html']+[n+'.html' for n in ['zeus','hera','poseidon','demeter','ares','athena','apollo','artemis','hephaestus','aphrodite','hermes','dionysus']]
source=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=root,text=True).splitlines()
source=sorted({p for p in source if p!='.npmrc' and not p.startswith('.openai/') and (root/p).is_file()})
models=[p.relative_to(root).as_posix() for p in (root/'assets-source/vegetation').iterdir() if p.suffix in ['.blend','.glb','.png','.json']]
ground=[p.relative_to(root).as_posix() for p in (root/'assets-source/ground-cover').iterdir() if p.suffix in ['.blend','.glb','.png','.json']]
for name,files,flatten in [('asterion-playable.zip',pages,True),('camp-half-blood-source.zip',source,False),('asterion-vegetation-assets.zip',models,True),('asterion-ground-cover-assets.zip',ground,True)]:
 with zipfile.ZipFile(root/name,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
  for relative in files:archive.write(root/relative,Path(relative).name if flatten else relative)
 with zipfile.ZipFile(root/name) as archive:
  assert archive.testzip() is None
  print(name,len(archive.namelist()),'files',round((root/name).stat().st_size/1048576,2),'MiB')
