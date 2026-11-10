import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const path='assets-source/creatures/ash-tusk-boar/',bytes=await fs.readFile(path+'ash-tusk-boar-motion.glb');
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
assert(!json.skins?.length);assert.deepEqual(json.animations.map(a=>a.name).sort(),['TuskAttack','Walk']);
// This checks actual exported geometry and motion without a browser/GPU.
// Image loading is omitted here; packed material validation is in the static asset check.
const loader=new GLTFLoader();loader.register(parser=>{parser.loadTexture=async()=>null;return {name:'HeadlessTextureCheck'};});
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const mixer=new T.AnimationMixer(gltf.scene),report={clips:[],browserUIVisuallyTested:false};
const foot=gltf.scene.getObjectByName('ForeL')??gltf.scene.getObjectByName('Fore.L');
const head=gltf.scene.getObjectByName('HeadMotion');assert(foot&&head);
for(const clip of gltf.animations){
 mixer.stopAllAction();const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 const samples=[];
 for(const time of [0,clip.duration*.25,clip.duration*.5,clip.duration*.75,clip.duration]){
  mixer.setTime(time);gltf.scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new T.Vector3());
  assert(size.x<4&&size.y<5&&size.z<7,'Detached part or invalid scale');
  samples.push({time,foot:foot.getWorldPosition(new T.Vector3()).toArray(),head:head.quaternion.toArray(),size:size.toArray()});
 }
 if(clip.name==='Walk'){
  assert(new T.Vector3().fromArray(samples[0].foot).distanceTo(new T.Vector3().fromArray(samples[1].foot))>.05,'Foot never steps');
  assert(new T.Vector3().fromArray(samples[0].foot).distanceTo(new T.Vector3().fromArray(samples[4].foot))<.001,'Walk loop seam');
 }else assert(samples.some(s=>new T.Quaternion().fromArray(s.head).angleTo(new T.Quaternion().fromArray(samples[0].head))>.15),'Head never attacks');
 report.clips.push({name:clip.name,duration:clip.duration,samples});
}
await fs.writeFile(path+'motion-quality-report.json',JSON.stringify(report,null,2));
console.log('PASS: actual GLB has both clips; feet step, walk loops, head strikes, bounds stay intact.');
