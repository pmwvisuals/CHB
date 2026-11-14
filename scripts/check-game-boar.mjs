import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const folder='assets-source/creatures/ash-tusk-boar/game/';
const loader=new GLTFLoader();loader.register(parser=>{parser.loadTexture=async()=>null;return{name:'HeadlessTextures'};});
async function load(file){const b=await fs.readFile(file);return {json:JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),gltf:await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')};}
const {gltf,json}=await load(folder+'ash-tusk-boar-game.glb');
const polished=(await load('assets-source/creatures/ash-tusk-boar/polished/ash-tusk-boar-polished.glb')).gltf;
const levels=[[],[],[]],source=[];polished.scene.traverse(o=>{if(o.isMesh)source.push(o);});
gltf.scene.traverse(o=>{if(o.isMesh){const match=o.name.match(/^LOD([012])_/);assert(match,o.name);levels[Number(match[1])].push(o);}});
const triangles=levels.map(meshes=>meshes.reduce((s,m)=>s+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0));
assert.deepEqual(triangles,[104660,48380,21096]);assert(levels.every(m=>m.length===5));
assert.equal(json.images.length,3);assert.equal(json.materials.length,5);assert.equal(json.skins.length,1);
assert(json.images.every(i=>i.bufferView!==undefined&&!i.uri));
for(let i=0;i<5;i++)for(const name of ['position','normal','uv','skinWeight','skinIndex','color']){
 const a=levels[0][i].geometry.getAttribute(name),b=source.find(m=>m.material.name===levels[0][i].material.name).geometry.getAttribute(name);assert.equal(!!a,!!b);
 if(a)assert(a.count===b.count && Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength).equals(Buffer.from(b.array.buffer,b.array.byteOffset,b.array.byteLength)),`Close-up data changed: ${name} part ${i}`);
}
const skeletonNames=levels[0][0].skeleton.bones.map(b=>b.name);
for(const meshes of levels)for(const m of meshes){
 assert(m.isSkinnedMesh);assert.equal(m.skeleton.bones.length,21);assert.deepEqual(m.skeleton.bones.map(b=>b.name),skeletonNames);
 const w=m.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)assert(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<.001);
}
assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['Idle','TuskAttack','Walk']);
const mixer=new T.AnimationMixer(gltf.scene);let samples=0;
for(const clip of gltf.animations){
 mixer.stopAllAction();mixer.clipAction(clip).setLoop(T.LoopOnce,1).play();
 for(let s=0;s<=16;s++){
  mixer.setTime(clip.duration*s/16);gltf.scene.updateMatrixWorld(true);
  for(const meshes of levels)for(const m of meshes){
   m.skeleton.update();const p=new T.Vector3(),count=m.geometry.attributes.position.count;
   for(let i=0;i<count;i+=Math.max(1,Math.floor(count/300))){m.getVertexPosition(i,p);assert(p.toArray().every(Number.isFinite));assert(p.length()<12,'Deformation exploded');}
  }samples++;
 }
}
const result={triangles,close_up_attributes_identical:true,shared_skeletons:json.skins.length,bones:21,shared_materials:5,embedded_maps:3,normalized_weights:true,animation_samples:samples};
await fs.writeFile(folder+'game-validation.json',JSON.stringify(result,null,2));console.log('PASS',result);
