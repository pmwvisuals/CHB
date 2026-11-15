import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const folder='assets-source/creatures/ash-tusk-boar/release/';
const loader=new GLTFLoader();loader.register(parser=>{parser.loadTexture=async()=>null;return{name:'HeadlessTextures'};});
async function load(file){const b=await fs.readFile(file);return {json:JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),gltf:await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')};}
const {json,gltf}=await load(folder+'Models/Boar_AllLODs.glb');
const reference=(await load('assets-source/creatures/ash-tusk-boar/refined/ash-tusk-boar-refined.glb')).gltf;
const close=(await load(folder+'Models/Boar_LOD0.glb')).gltf;
const levels=[[],[],[]],source=[],single=[];
reference.scene.traverse(o=>{if(o.isMesh)source.push(o);});close.scene.traverse(o=>{if(o.isMesh)single.push(o);});
gltf.scene.traverse(o=>{if(o.isMesh){const m=o.name.match(/^LOD([012])_/);assert(m,o.name);levels[+m[1]].push(o);}});
assert.equal(json.skins.length,1);assert.equal(json.images.length,3);assert.equal(json.materials.length,5);
assert(json.images.every(i=>i.bufferView!==undefined&&!i.uri));assert(levels.every(g=>g.length===5));assert.equal(single.length,5);
const counts=levels.map(g=>g.reduce((s,m)=>s+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0));
assert.deepEqual(counts,[104660,48380,21096]);
const buffers=m=>Object.fromEntries(['position','normal','uv','color','skinWeight','skinIndex'].map(n=>{const a=m.geometry.getAttribute(n);return[n,a?Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength).toString('base64'):null];}));
const hashes=new Set(source.map(m=>JSON.stringify(buffers(m))));
for(const m of levels[0])assert(hashes.has(JSON.stringify(buffers(m))),'Close mesh data changed');
for(const m of single)assert(hashes.has(JSON.stringify(buffers(m))),'Standalone close mesh changed');
const bones=levels[0][0].skeleton.bones.map(b=>b.name);
assert.equal(bones.length,21);assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['Idle','TuskAttack','Walk']);
for(const group of levels)for(const m of group){assert(m.isSkinnedMesh);assert.deepEqual(m.skeleton.bones.map(b=>b.name),bones);const w=m.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)assert(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<.001);}
const mixer=new T.AnimationMixer(gltf.scene);let poses=0;const p=new T.Vector3();
for(const clip of gltf.animations){mixer.stopAllAction();const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 for(let step=0;step<=32;step++){mixer.setTime(clip.duration*step/32);gltf.scene.updateMatrixWorld(true);
  for(const group of levels)for(const m of group){m.skeleton.update();for(let i=0;i<m.geometry.attributes.position.count;i+=Math.max(1,Math.floor(m.geometry.attributes.position.count/500))){m.getVertexPosition(i,p).applyMatrix4(m.matrixWorld);assert(p.toArray().every(Number.isFinite));assert(p.length()<12);assert(p.y>-.06);}}
  poses++;
 }
}
const result={pass:true,triangles:counts,unchanged_refined_close_mesh:true,single_skin:true,shared_materials:5,shared_embedded_maps:3,bones:21,normalized_weights:true,checked_animation_poses:poses,pose_mesh_levels:poses*3,single_lod_export_matches:true};
await fs.writeFile(folder+'Reports/portable-validation.json',JSON.stringify(result,null,2));console.log('PASS',result);
