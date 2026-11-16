"""Split world-spanning road/terrain draws into cullable cells, preserving every triangle."""
from pathlib import Path
import json,struct,hashlib,sys,copy
root=Path(__file__).resolve().parents[1]
p=root/'native/assets/camp/camp-static.glb'
b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);binary=bytearray(b[28+n:]);cell=48
def write_report(report):
 f=root/'native/assets/camp/surface-cells.json';f.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
 manifest_file=root/'native/assets-manifest.json';manifest=json.loads(manifest_file.read_text(encoding='utf-8'));data=f.read_bytes()
 entry={'file':'assets/camp/surface-cells.json','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source':'scripts/split-native-surfaces.py; exact triangle/attribute preservation check'}
 manifest['assets']=[a for a in manifest['assets'] if a['file']!=entry['file']]+[entry]
 manifest_file.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
if d.get('asset',{}).get('extras',{}).get('surfaceCells'):
 write_report(d['asset']['extras']['surfaceCells']);print('Surface cells already prepared');sys.exit(0)
sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};counts={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def rows(idx):
 a=d['accessors'][idx];v=d['bufferViews'][a['bufferView']];size=sizes[a['componentType']]*counts[a['type']];offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size)
 return [bytes(binary[offset+i*stride:offset+i*stride+size]) for i in range(a['count'])]
def append(data,target):
 while len(binary)%4:binary.append(0)
 i=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(data),'target':target});binary.extend(data);return i
def digest(tris):return hashlib.sha256(b''.join(sorted(tris))).hexdigest()
before=[];after=[];newnodes=0
for node in list(d['nodes']):
 if 'mesh' not in node or not node.get('name','').startswith(('CampTerrain','CampRoad')):continue
 mesh=d['meshes'][node['mesh']];assert len(mesh['primitives'])==1
 prim=mesh['primitives'][0];attrs={k:rows(a) for k,a in prim['attributes'].items()};meta={k:d['accessors'][a] for k,a in prim['attributes'].items()};pos=[struct.unpack('<fff',v) for v in attrs['POSITION']]
 if 'indices' in prim:
  a=d['accessors'][prim['indices']];fmt={5121:'<B',5123:'<H',5125:'<I'}[a['componentType']];ids=[struct.unpack(fmt,v)[0] for v in rows(prim['indices'])]
 else:ids=list(range(len(pos)))
 groups={}
 for i in range(0,len(ids),3):
  tri=ids[i:i+3];x=sum(pos[j][0] for j in tri)/3;z=sum(pos[j][2] for j in tri)/3;key=(int(x//cell),int(z//cell));groups.setdefault(key,[]).extend(tri)
  before.append(hashlib.sha256(b''.join(attrs[k][j] for j in tri for k in sorted(attrs))).digest())
 mesh['primitives']=[]
 for (x,z),index in groups.items():
  unique=list(dict.fromkeys(index));mapping={v:i for i,v in enumerate(unique)};p2=copy.deepcopy(prim);p2['attributes']={}
  for name,values in attrs.items():
   accessor=copy.deepcopy(meta[name]);accessor.pop('byteOffset',None);accessor.pop('min',None);accessor.pop('max',None);accessor['count']=len(unique);accessor['bufferView']=append(b''.join(values[j] for j in unique),34962)
   if name=='POSITION':
    accessor['min']=[min(pos[j][k] for j in unique) for k in range(3)];accessor['max']=[max(pos[j][k] for j in unique) for k in range(3)]
   p2['attributes'][name]=len(d['accessors']);d['accessors'].append(accessor)
  indices=struct.pack('<'+'I'*len(index),*(mapping[j] for j in index));p2['indices']=len(d['accessors']);d['accessors'].append({'bufferView':append(indices,34963),'componentType':5125,'count':len(index),'type':'SCALAR'})
  node2=copy.deepcopy(node);node2['name']=node['name']+'_Cell_'+str(x)+'_'+str(z);node2['mesh']=len(d['meshes']);d['meshes'].append({'primitives':[p2]});d['nodes'].append(node2);d['scenes'][0]['nodes'].append(len(d['nodes'])-1);newnodes+=1
  for i in range(0,len(index),3):after.append(hashlib.sha256(b''.join(attrs[k][j] for j in index[i:i+3] for k in sorted(attrs))).digest())
 # Keep an empty transform node, but remove its now-unused render mesh.
 node.pop('mesh')
assert len(before)==len(after) and digest(before)==digest(after)
# Compact unused source meshes/accessors/buffer views so splitting adds no duplicate art payload.
used_mesh=sorted({node['mesh'] for node in d['nodes'] if 'mesh' in node});remap={old:i for i,old in enumerate(used_mesh)};d['meshes']=[d['meshes'][i] for i in used_mesh]
for node in d['nodes']:
 if 'mesh' in node:node['mesh']=remap[node['mesh']]
used=set()
for m in d['meshes']:
 for s in m['primitives']:
  used.update(s['attributes'].values())
  if 'indices' in s:used.add(s['indices'])
used=sorted(used);remap={old:i for i,old in enumerate(used)};d['accessors']=[d['accessors'][i] for i in used]
for m in d['meshes']:
 for s in m['primitives']:
  s['attributes']={k:remap[v] for k,v in s['attributes'].items()}
  if 'indices' in s:s['indices']=remap[s['indices']]
views=sorted({a['bufferView'] for a in d['accessors']}|{im['bufferView'] for im in d.get('images',[]) if 'bufferView' in im});remap={old:i for i,old in enumerate(views)};output=bytearray();newviews=[]
for i in views:
 v=copy.deepcopy(d['bufferViews'][i]);start=v.get('byteOffset',0);data=binary[start:start+v['byteLength']]
 while len(output)%4:output.append(0)
 v['byteOffset']=len(output);newviews.append(v);output.extend(data)
for a in d['accessors']:a['bufferView']=remap[a['bufferView']]
for im in d.get('images',[]):
 if 'bufferView' in im:im['bufferView']=remap[im['bufferView']]
d['bufferViews']=newviews;d['buffers']=[{'byteLength':len(output)}];d['asset'].setdefault('extras',{})['surfaceCells']={'size':cell,'cells':newnodes,'triangles':len(before),'triangleAttributeHash':digest(before)}
j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4);output+=b'\0'*((-len(output))%4)
p.write_bytes(struct.pack('<IIIII',0x46546c67,2,28+len(j)+len(output),len(j),0x4e4f534a)+j+struct.pack('<II',len(output),0x004e4942)+output)
f=root/'native/assets-manifest.json';manifest=json.loads(f.read_text(encoding='utf-8'));e=next(a for a in manifest['assets'] if a['file']=='assets/camp/camp-static.glb');data=p.read_bytes();e.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest());f.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(d['asset']['extras']['surfaceCells']));print('GLB bytes',len(data))
write_report(d['asset']['extras']['surfaceCells'])
