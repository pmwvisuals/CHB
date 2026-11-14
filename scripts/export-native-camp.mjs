import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { installCanvas,png } from './native-canvas.mjs';
import { optimizeScenery } from './optimize-native-scenery.mjs';
installCanvas();
await fs.mkdir('.tools/native-export',{recursive:true});
await fs.mkdir('native/assets/camp',{recursive:true});
await build({stdin:{contents:`export {buildWorld} from './lib/game/world';export {boundaryContour,forestContour,insideCampTerrain} from './lib/game/camp-boundary';export {groundHeight} from './lib/game/data';export {templeSites,sitePlacement,templeTrails,sitePoint} from './lib/game/sanctuary-layout';export {templeCatalog} from './lib/game/temple-catalog';export {campRoutes,routePoints} from './lib/game/camp-layout';export {groundHabitat} from './lib/game/landscape';export {campLampPositions} from './lib/game/camp-lighting';export {groundCover} from './lib/game/generated/ground-cover';`,resolveDir:process.cwd()},outfile:'.tools/native-export/source.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'export-collision',setup(b){b.onLoad({filter:/[\\/]lib[\\/]game[\\/]world\.ts$/},async args=>({contents:(await fs.readFile(args.path,'utf8')).replace('const octree=new Octree().fromGraphNode(collision);','const octree=new Octree();').replace('return {scene,octree,water','return {scene,collision,octree,water'),loader:'ts'}));}}]});
const source=await import(pathToFileURL(path.resolve('.tools/native-export/source.mjs')).href);
const mapRoutes=[...source.campRoutes,...Object.entries(source.templeTrails).filter(([id])=>id!=='poseidon').map(([id,points])=>{const p=source.sitePoint(id,0,16);return{name:id+' approach',points:[...points,[p.x,p.z]]};}),{name:'Island causeway',points:[[55,5],[84,5]]}].map(r=>({name:r.name,points:source.routePoints(r.points).map(p=>[p.x,p.z])}));
if(process.argv.includes('--refresh-map-routes')){
 const file='native/assets/camp/camp-layout.json',layout=JSON.parse(await fs.readFile(file,'utf8'));layout.routes=mapRoutes;const bytes=Buffer.from(JSON.stringify(layout));await fs.writeFile(file,bytes);const manifest=JSON.parse(await fs.readFile('native/assets-manifest.json','utf8')),entry=manifest.assets.find(a=>a.file==='assets/camp/camp-layout.json');entry.bytes=bytes.length;entry.sha256=crypto.createHash('sha256').update(bytes).digest('hex');await fs.writeFile('native/assets-manifest.json',JSON.stringify(manifest,null,2));console.log('Updated camp map:',mapRoutes.length,'routes');process.exit(0);
}
console.log('Building the original browser camp…');
const world=source.buildWorld(),scene=world.scene;
scene.updateMatrixWorld(true);world.collision.updateMatrixWorld(true);
const staticScene=new T.Scene(),prototypes=new T.Scene(),colliders=new T.Scene();
const data={version:3,extent:Math.ceil(Math.max(...source.boundaryContour().flat().map(Math.abs)))+2,boundary:source.boundaryContour(),forestEdge:source.forestContour(),spawn:[0,0,113],gate:[-40,0,-121],temples:source.templeCatalog.map(t=>({...t,...source.sitePlacement(t.id)})),labels:[],batches:[],lights:source.campLampPositions().map(p=>[p.x,source.groundHeight(p.x,p.z)+2.19,p.z]),routes:mapRoutes};
const protoCache=new Map(),batches=new Map(),geometryHashes=new WeakMap(),materialHashes=new WeakMap();
function geometryHash(g){if(!geometryHashes.has(g)){const hash=crypto.createHash('sha256');for(const [name,a] of Object.entries(g.attributes)){hash.update(name);hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(g.index)hash.update(Buffer.from(g.index.array.buffer,g.index.array.byteOffset,g.index.array.byteLength));geometryHashes.set(g,hash.digest('hex'));}return geometryHashes.get(g);}
function materialHash(m){if(!materialHashes.has(m)){const hash=crypto.createHash('sha256');hash.update(JSON.stringify({color:m.color?.toArray(),metalness:m.metalness,roughness:m.roughness,side:m.side,alphaTest:m.alphaTest,opacity:m.opacity,emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity,vertexColors:m.vertexColors}));for(const name of ['map','normalMap','roughnessMap','metalnessMap']){const image=m[name]?.image;if(image?.data)hash.update(Buffer.from(image.data.buffer,image.data.byteOffset,image.data.byteLength));else if(image?.pixels)hash.update(Buffer.from(image.pixels()));}materialHashes.set(m,hash.digest('hex'));}return materialHashes.get(m);}
const matrix=new T.Matrix4(),combined=new T.Matrix4();
const isVisible=node=>{for(let o=node;o;o=o.parent)if(!o.visible)return false;return true;};
function prepareGeometry(g,material){g=g.clone();for(const name of Object.keys(g.attributes))if(!['position','normal','uv','uv1','color','tangent'].includes(name))g.deleteAttribute(name);if(material.name==='Worn Greek limestone paving'){const p=g.getAttribute('position'),uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/7.2,p.getZ(i)/7.2);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}return g;}
let staticCount=0,instanceCount=0;
scene.traverse(o=>{
 if(!(o instanceof T.Mesh)||!isVisible(o)||o.material instanceof T.ShaderMaterial||Array.isArray(o.material))return;
 const canvas=o.material.map?.image;
 if(canvas?._text){const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();o.matrixWorld.decompose(p,q,s);data.labels.push({...canvas._text,position:p.toArray(),quaternion:q.toArray(),width:(o.geometry.parameters?.width||4)*s.x});return;}
 if(o instanceof T.InstancedMesh){
  const key=geometryHash(o.geometry)+materialHash(o.material);
  if(!protoCache.has(key)){const id='Proto_'+protoCache.size,g=prepareGeometry(o.geometry,o.material),node=new T.Mesh(g,o.material);node.name=id;prototypes.add(node);protoCache.set(key,id);}
  const proto=protoCache.get(key);
  for(let i=0;i<o.count;i++){
   o.getMatrixAt(i,matrix);combined.multiplyMatrices(o.matrixWorld,matrix);
   const m=combined.elements,x=m[12],z=m[14];if(!source.insideCampTerrain(x,z,-1))continue;
   const cx=Math.floor(x/32)*32+16,cz=Math.floor(z/32)*32+16,k=proto+':'+cx+':'+cz;
   if(!batches.has(k))batches.set(k,{proto,center:[cx,0,cz],kind:o.name||'ground cover',shadow:o.castShadow,instances:[]});
   const a=[m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10],x-cx,m[13],z-cz].map(v=>Math.round(v*100000)/100000);
   batches.get(k).instances.push(a);instanceCount++;
  }
  return;
 }
 if(o.material.userData.groundCover){const m=new T.MeshStandardMaterial({vertexColors:true,color:'#ffffff',roughness:1});m.name='Native living ground';o=new T.Mesh(o.geometry,m).copy(o,false);o.material=m;}
 const copy=new T.Mesh(prepareGeometry(o.geometry,o.material),o.material);copy.name=o.name||'CampDetail_'+staticCount++;
 copy.matrix.copy(o.matrixWorld);copy.matrixAutoUpdate=false;copy.userData={};
 if(o.geometry.getAttribute('groundCover'))copy.name='CampTerrain_'+staticCount++;
 if(o.material.name==='Worn Greek limestone paving')copy.name='CampRoad_'+staticCount++;
 if(o===world.water)copy.name='MirrorLake';
 staticScene.add(copy);
});
data.batches=[...batches.values()];
// Compact collision chunks retain the browser's exact walls, ramps and walkable roads.
const collisionChunks=new Map();
world.collision.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=new T.Vector3().setFromMatrixPosition(o.matrixWorld),key=Math.floor(p.x/64)+':'+Math.floor(p.z/64),g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const name of Object.keys(g.attributes))if(name!=='position')g.deleteAttribute(name);if(!collisionChunks.has(key))collisionChunks.set(key,[]);collisionChunks.get(key).push(g.index?g.toNonIndexed():g);});
for(const [key,list] of collisionChunks){const g=mergeGeometries(list,false);g.computeVertexNormals();const m=new T.Mesh(g,new T.MeshStandardMaterial());m.name='Collision_'+key.replace(':','_');colliders.add(m);list.forEach(g=>g.dispose());}
const saved=[];
async function write(name,content){const file='native/assets/camp/'+name,buffer=Buffer.isBuffer(content)?content:Buffer.from(content);await fs.writeFile(file,buffer);saved.push({source:'generated from lib/game browser sources',file:'assets/camp/'+name,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});}
const exporter=new GLTFExporter();
for(const [name,root] of [['camp-static.glb',staticScene],['camp-prototypes.glb',prototypes],['camp-collision.glb',colliders]]){console.log('Exporting',name,root.children.length,'meshes');const binary=await exporter.parseAsync(root,{binary:true,onlyVisible:true,trs:false,maxTextureSize:1024});await write(name,Buffer.from(binary));}
const optimization=await optimizeScenery();
data.statistics={sceneryTriangles:optimization.triangles,collisionTriangles:colliders.children.reduce((sum,o)=>sum+(o.geometry.index?.count||o.geometry.attributes.position.count)/3,0),collisionChunks:colliders.children.length,instances:instanceCount,forestTrees:scene.userData.forestBorder.trees,blockyRockInstances:0};
const optimized=await fs.readFile('native/assets/camp/camp-static.glb');
Object.assign(saved.find(a=>a.file==='assets/camp/camp-static.glb'),{bytes:optimized.length,sha256:crypto.createHash('sha256').update(optimized).digest('hex')});
// A shared height grid and habitat mask preserve the original camp terrain rules.
const size=251,heights=[],mask=new Uint8Array(size*size*4);
for(let z=0;z<size;z++)for(let x=0;x<size;x++){const xx=-250+x*2,zz=-250+z*2,a=source.groundHabitat(xx,zz),i=(z*size+x)*4;heights.push(source.groundHeight(xx,zz));mask[i]=a.grass*255;mask[i+1]=a.forest*(.45+.35*a.patch)*255;mask[i+2]=0;mask[i+3]=255;}
data.heightfield={size,origin:-250,spacing:2,values:heights};
await write('habitat.png',png(size,size,mask));
const {inflateSync}=await import('node:zlib');
for(const kind of ['albedo','normal','roughness']){const raw=inflateSync(Buffer.from(source.groundCover.maps[kind],'base64')),rgba=new Uint8Array(source.groundCover.width*source.groundCover.height*4);for(let i=0,j=0;i<raw.length;i+=3,j+=4){rgba[j]=raw[i];rgba[j+1]=raw[i+1];rgba[j+2]=raw[i+2];rgba[j+3]=255;}await write('ground-'+kind+'.png',png(source.groundCover.width,source.groundCover.height,rgba));}
await write('camp-layout.json',JSON.stringify(data));
const manifest=JSON.parse(await fs.readFile('native/assets-manifest.json','utf8'));manifest.assets=manifest.assets.filter(a=>!a.file.startsWith('assets/camp/')).concat(saved);await fs.writeFile('native/assets-manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({staticMeshes:staticScene.children.length,prototypes:prototypes.children.length,batches:data.batches.length,instances:instanceCount,colliderChunks:colliders.children.length,labels:data.labels.length,temples:data.temples.length,exportBytes:saved.reduce((s,a)=>s+a.bytes,0)}));
