"""Keep original resolution; enable native GPU compression for imported cards."""
from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parent.parent
native=root/'native';folder=native/'assets/plants';manifest_path=native/'assets-manifest.json'
manifest=json.loads(manifest_path.read_text());files=[]
for settings in sorted(folder.glob('imported-plants_*.png.import')):
 text=settings.read_text();text=re.sub(r'compress/mode=\d+', 'compress/mode=2',text);settings.write_text(text)
 files.append(settings.with_suffix(''))
assert len(files)==9,len(files)
paths={p.relative_to(native).as_posix() for p in files}
manifest['assets']=[a for a in manifest['assets'] if a['file'] not in paths and not (a['file'].startswith('assets/plants/') and a['file'].endswith('.import'))]
for p in files:
 content=p.read_bytes();manifest['assets'].append({'file':p.relative_to(native).as_posix(),'source':'Extracted from supplied GLBs; original resolution, VRAM compression import setting','bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
manifest_path.write_text(json.dumps(manifest,indent=2));print('Configured',len(files),'shared plant textures for GPU compression')
