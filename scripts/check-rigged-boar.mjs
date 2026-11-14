import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const runtime=process.argv.includes('--runtime')||process.argv.includes('--polished'),variant=process.argv.includes('--polished')?'polished':runtime?'runtime':'rigged';
const folder=`assets-source/creatures/ash-tusk-boar/${variant}/`;
const bytes=await fs.readFile(folder+`ash-tusk-boar-${variant}.glb`);
assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
assert(json.skins?.length);assert.deepEqual(json.animations.map(a=>a.name).sort(),['Idle','TuskAttack','Walk']);
assert.equal(json.images.length,3);assert(json.images.every(i=>i.bufferView!==undefined&&!i.uri));
const loader=new GLTFLoader();loader.register(parser=>{parser.loadTexture=async()=>null;return {name:'HeadlessTextureCheck'};});
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const skinned=[];let triangles=0;
gltf.scene.traverse(ob=>{
 if(!(ob instanceof T.Mesh))return;
 assert(ob instanceof T.SkinnedMesh,'Every exported part must share the skeletal motion');skinned.push(ob);
 const p=ob.geometry.getAttribute('position'),n=ob.geometry.getAttribute('normal'),w=ob.geometry.getAttribute('skinWeight'),j=ob.geometry.getAttribute('skinIndex');
 assert(p.array.every(Number.isFinite)&&n.array.every(Number.isFinite));assert.equal(w.itemSize,4);assert.equal(j.count,p.count);
 for(let v=0;v<w.count;v++)assert(Math.abs(w.getX(v)+w.getY(v)+w.getZ(v)+w.getW(v)-1)<.001,'Non-normalized skin weights');
 triangles+=(ob.geometry.index?.count??p.count)/3;
});
assert.equal(skinned.length,5);if(runtime)assert(triangles>70000&&triangles<120000);else assert.equal(triangles,JSON.parse(await fs.readFile(folder+'rig-quality-report.json','utf8')).triangles??790996);
const bone=name=>{const b=gltf.scene.getObjectByName(name)??gltf.scene.getObjectByName(name.replaceAll('.',''));assert(b,`Missing bone ${name}`);return b;};
const feet=['Fore.L','Fore.R','Hind.L','Hind.R'].map(n=>bone(n+'.Foot'));
const head=bone('Head'),jaw=bone('Jaw');const mixer=new T.AnimationMixer(gltf.scene),report={clips:[],triangles,meshes:skinned.length,bones:skinned[0].skeleton.bones.length,embedded_maps:3,browserUIVisuallyTested:false};
function sample(clip,t){
 mixer.setTime(t);gltf.scene.updateMatrixWorld(true);for(const m of skinned)m.skeleton.update();
 const lo=new T.Vector3(Infinity,Infinity,Infinity),hi=new T.Vector3(-Infinity,-Infinity,-Infinity),p=new T.Vector3();
 // Check deformed geometry throughout the assembly, including root and tip fur vertices.
 for(const m of skinned){const count=m.geometry.getAttribute('position').count;for(let i=0;i<count;i+=Math.max(1,Math.floor(count/1600))){m.getVertexPosition(i,p);p.applyMatrix4(m.matrixWorld);assert(p.toArray().every(Number.isFinite));lo.min(p);hi.max(p);}}
 const size=hi.clone().sub(lo);assert(size.x<4&&size.y<4.5&&size.z<6.8,'Detached geometry or bad scale');assert(lo.y>-.06,'Feet or skin pass below ground');
 return {time:t,feet:feet.map(f=>f.getWorldPosition(new T.Vector3()).toArray()),head:head.getWorldQuaternion(new T.Quaternion()).toArray(),jaw:jaw.getWorldQuaternion(new T.Quaternion()).toArray(),bounds:[lo.toArray(),hi.toArray()]};
}
for(const clip of gltf.animations){
 assert(Math.abs(clip.duration-(clip.name==='Idle'?2:4/3))<.001,'Clip retains a timeline offset or wrong duration');
 assert(clip.tracks.every(track=>Math.abs(track.times[0])<.00001),'Clip must start at time zero');
 mixer.stopAllAction();const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 const samples=Array.from({length:17},(_,i)=>sample(clip,clip.duration*i/16));
 if(clip.name==='Walk'){
  for(let f=0;f<4;f++){
   assert(new T.Vector3().fromArray(samples[0].feet[f]).distanceTo(new T.Vector3().fromArray(samples[4].feet[f]))>.04,'Foot does not step');
   assert(new T.Vector3().fromArray(samples[0].feet[f]).distanceTo(new T.Vector3().fromArray(samples.at(-1).feet[f]))<.001,'Walk loop jumps');
   assert(samples.every(s=>s.feet[f][1]>=.239&&s.feet[f][1]<.401),'Foot support/lift height');
  }
 }else if(clip.name==='TuskAttack'){
  assert(samples.some(s=>new T.Quaternion().fromArray(s.head).angleTo(new T.Quaternion().fromArray(samples[0].head))>.22),'Head does not strike');
  for(const s of samples)for(let f=0;f<4;f++)assert(new T.Vector3().fromArray(s.feet[f]).distanceTo(new T.Vector3().fromArray(samples[0].feet[f]))<.002,'Attack support foot slides');
 }else assert(samples.some(s=>new T.Quaternion().fromArray(samples[0].head).angleTo(new T.Quaternion().fromArray(s.head))>.001),'Idle has no movement');
 report.clips.push({name:clip.name,duration_seconds:clip.duration,samples});
}
const html=await fs.readFile(`asterion-boar-${variant}.html`,'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const code of scripts)new vm.Script(code);const ctx={window:{}};vm.runInNewContext(scripts[0],ctx);assert(Buffer.from(ctx.window.__BOAR_GLB__,'base64').equals(bytes));
await fs.writeFile(folder+'export-motion-checks.json',JSON.stringify(report,null,2));
console.log('PASS actual GLB: 5 skinned meshes, normalized weights, embedded maps; idle, seamless walk and planted-foot tusk attack; viewer embeds matching bytes.');
