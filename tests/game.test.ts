import assert from 'node:assert/strict';
import { Vector3, Group, Mesh, BoxGeometry } from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';
import { Octree } from 'three/addons/math/Octree.js';
import { simulatePlayer, type PlayerState } from '../lib/game/physics';
import { buildWorld } from '../lib/game/world';
import { buildSacredTemple } from '../lib/game/sacred-temple';
import { templeCatalog, templeAtEntrance, templePlacement, templeLocal, templeReturnPoint, findTemple } from '../lib/game/temple-catalog';
import { groundHeight, readSave, writeSave, defaults, poseidonTemple } from '../lib/game/data';
const pass=(name:string)=>console.log('PASS '+name);
const ctx=new Proxy({}, {get:()=>()=>{}});
Object.assign(globalThis,{document:{createElement:()=>({width:128,height:128,getContext:()=>ctx})}});
const p=(x=0,z=0,y=0):PlayerState=>({keys:new Set(),yaw:0,grounded:false,jumpQueued:false,velocity:new Vector3(),collider:new Capsule(new Vector3(x,y+.33,z),new Vector3(x,y+1.63,z),.32)});
const step=(s:PlayerState,tree:Octree,n=120)=>{for(let i=0;i<n;i++)simulatePlayer(s,tree,1/120);};
const stage=new Group();const floor=new Mesh(new BoxGeometry(200,1,200));floor.position.y=-.5;stage.add(floor);const wall=new Mesh(new BoxGeometry(30,10,1));wall.position.set(0,5,-20);stage.add(wall);stage.updateMatrixWorld(true);const tree=new Octree().fromGraphNode(stage);
let player=p();step(player,tree);assert.ok(player.grounded);assert.ok(Math.abs(player.collider.start.y-.32)<.01);pass('gravity settles on solid ground');
player.jumpQueued=true;let peak=0;for(let i=0;i<120;i++){simulatePlayer(player,tree,1/120);peak=Math.max(peak,player.collider.start.y-.32);}assert.ok(peak>1&&peak<1.3);assert.ok(player.grounded);pass('jump rises, falls and lands');
player.jumpQueued=true;simulatePlayer(player,tree,1/120);const vy=player.velocity.y;player.jumpQueued=true;simulatePlayer(player,tree,1/120);assert.ok(player.velocity.y<vy);pass('jump cannot repeat in mid-air');
const straight=p(),diagonal=p();straight.keys.add('KeyW');diagonal.keys.add('KeyW');diagonal.keys.add('KeyD');step(straight,tree,240);step(diagonal,tree,240);assert.ok(Math.abs(straight.collider.start.clone().setY(0).length()-diagonal.collider.start.clone().setY(0).length())<.01);pass('diagonal movement is normalized');
const sprint=p();sprint.keys.add('KeyW');sprint.keys.add('ShiftLeft');step(sprint,tree,240);assert.ok(-sprint.collider.start.z>14);pass('sprint is faster than walking');
player=p();player.keys.add('KeyW');step(player,tree,1200);assert.ok(player.collider.start.z>-19.25);pass('solid wall blocks sustained movement');
const renderRates=[30,60,144].map(rate=>{const s=p();s.keys.add('KeyD');let acc=0;for(let frame=0;frame<rate*2;frame++){acc+=1/rate;while(acc+1e-9>=1/120){simulatePlayer(s,tree,1/120);acc-=1/120;}}return s.collider.start.x;});assert.ok(Math.max(...renderRates)-Math.min(...renderRates)<.001);pass('30, 60 and 144 FPS produce the same movement distance');
const world=buildWorld();player=p(0,113,groundHeight(0,113));player.keys.add('KeyW');step(player,world.octree,2100);assert.ok(player.collider.start.z<36,`arrival blocked at ${player.collider.start.z}`);assert.ok(player.collider.start.y>-1);pass('arrival hill and path lead into camp');
player=p(0,45,groundHeight(0,45));player.keys.add('KeyW');step(player,world.octree,1200);assert.ok(player.collider.start.z<5,`courtyard blocked at ${player.collider.start.z}`);pass('gap between cabins leads into courtyard');
player=p(-55,62,groundHeight(-55,62));player.keys.add('KeyW');step(player,world.octree,360);assert.ok(player.collider.start.z<52&&player.collider.start.z>43,`house entry at ${player.collider.start.z}`);pass('Big House ground-floor doorway is enterable');
for(const index of [5]){const a=index/12*Math.PI*2+Math.PI/12;const x=Math.sin(a)*33,z=Math.cos(a)*33;player=p(x*.75,z*.75,groundHeight(x*.75,z*.75));player.yaw=Math.atan2(-x,-z);player.keys.add('KeyW');step(player,world.octree,250);assert.ok(Math.hypot(player.collider.start.x-x,player.collider.start.z-z)<4,`cabin ${index} blocked`);pass(`${index===2?'Poseidon':'Athena'} cabin is enterable`);}
player=p(55,20,groundHeight(55,20));player.yaw=-Math.PI/2;player.keys.add('KeyW');step(player,world.octree,900);assert.ok(player.collider.start.x<66);pass('lakeshore stops entry into deep water');
Object.assign(globalThis,{localStorage:{getItem:()=>'{broken'}});assert.deepEqual(readSave().settings,defaults);pass('corrupt saved data safely uses defaults');
Object.assign(globalThis,{localStorage:{getItem:()=>{throw new Error('unavailable');}}});assert.deepEqual(readSave().discoveries,[]);pass('unavailable storage does not block play');

const templePoint=(x:number,z:number)=>({x:poseidonTemple.x+Math.cos(poseidonTemple.rotation)*x+Math.sin(poseidonTemple.rotation)*z,z:poseidonTemple.z-Math.sin(poseidonTemple.rotation)*x+Math.cos(poseidonTemple.rotation)*z});
const localZ=(s:PlayerState)=>(s.collider.start.x-poseidonTemple.x)*Math.sin(poseidonTemple.rotation)+(s.collider.start.z-poseidonTemple.z)*Math.cos(poseidonTemple.rotation);
let start=templePoint(0,17);player=p(start.x,start.z,groundHeight(start.x,start.z));player.yaw=poseidonTemple.rotation;player.keys.add('KeyW');step(player,world.octree,520);assert.ok(localZ(player)<-1&&localZ(player)>-4,`temple entry stopped at ${localZ(player)}`);pass('temple entrance, pool walkway and living hall form a continuous walkable route');
player.keys.clear();player.keys.add('KeyS');step(player,world.octree,540);assert.ok(localZ(player)>15);pass('player can walk back out of the temple');
start=templePoint(0,4);player=p(start.x,start.z,groundHeight(poseidonTemple.x,poseidonTemple.z)+.18);player.yaw=poseidonTemple.rotation;step(player,world.octree);player.jumpQueued=true;step(player,world.octree);assert.ok(player.grounded);assert.ok(localZ(player)>3.8&&localZ(player)<4.2);pass('jump lands on the courtyard floor');
start=templePoint(6.15,13);player=p(start.x,start.z,groundHeight(poseidonTemple.x,poseidonTemple.z)+.18);player.yaw=poseidonTemple.rotation;player.keys.add('KeyW');let closestColumn=Infinity;for(let i=0;i<200;i++){step(player,world.octree,1);const c=templePoint(6.15,10);closestColumn=Math.min(closestColumn,Math.hypot(player.collider.start.x-c.x,player.collider.start.z-c.z));}assert.ok(closestColumn>.65,'Column clearance '+closestColumn);pass('portico columns block the player');
start=templePoint(6, -4);player=p(start.x,start.z,groundHeight(poseidonTemple.x,poseidonTemple.z)+.18);player.yaw=poseidonTemple.rotation;player.keys.add('KeyD');step(player,world.octree,300);const localX=(player.collider.start.x-poseidonTemple.x)*Math.cos(poseidonTemple.rotation)-(player.collider.start.z-poseidonTemple.z)*Math.sin(poseidonTemple.rotation);assert.ok(localX<6.3);pass('living quarters walls block movement');
const saves=new Map<string,string>([['half-blood-v1',JSON.stringify({settings:{...defaults,volume:.7},discoveries:['cabins']})]]);
Object.assign(globalThis,{localStorage:{getItem:(key:string)=>saves.get(key)||null,setItem:(key:string,value:string)=>saves.set(key,value)}});
assert.equal(readSave().settings.volume,.7);assert.deepEqual(readSave().discoveries,['cabins']);writeSave({...defaults,volume:.2},['house']);assert.equal(readSave().settings.volume,.2);assert.deepEqual(readSave().discoveries,['house']);pass('existing discoveries migrate and new sanctuary saves take precedence');
for(const theme of templeCatalog){const t=templePlacement(theme.id),r=templeReturnPoint(theme.id);assert.equal(templeAtEntrance(r.x,r.z),undefined,`${theme.id}: returning must not immediately re-enter`);player=p(r.x,r.z,groundHeight(r.x,r.z));player.yaw=t.rotation;player.keys.add('KeyW');let reached=false;for(let i=0;i<400;i++){step(player,world.octree,1);if(templeAtEntrance(player.collider.start.x,player.collider.start.z)?.id===theme.id){reached=true;break;}}assert.ok(reached,`${theme.id} outdoor doorway blocked at ${JSON.stringify(templeLocal(theme.id,player.collider.start.x,player.collider.start.z))}`);}
pass('all twelve outdoor entrances are reachable and return points avoid redirect loops');
assert.equal(findTemple('unknown'),undefined);assert.equal(new Set(templeCatalog.map(t=>t.id)).size,12);pass('temple routes are unique and unknown names are rejected');
world.dispose();
const sacred=buildSacredTemple();player=p(0,16);player.keys.add('KeyW');step(player,sacred.octree,480);assert.ok(player.collider.start.z<0);assert.ok(player.grounded);pass('sacred hall central aisle is walkable');
player=p(6.15,18);player.keys.add('KeyW');step(player,sacred.octree,240);assert.ok(player.collider.start.z>16.7);pass('sacred hall columns block movement');
player=p(8,0);player.keys.add('KeyD');step(player,sacred.octree,240);assert.ok(player.collider.start.x<9);pass('sacred hall walls block movement');
player=p(0,16);player.keys.add('KeyS');step(player,sacred.octree,150);assert.ok(player.collider.start.z>20);pass('sacred hall exit doorway reaches the forecourt');
player=p(0,-9);player.keys.add('KeyW');step(player,sacred.octree,240);assert.ok(player.collider.start.z>-11);pass('statue pedestal blocks movement');
sacred.dispose();
for(const theme of templeCatalog){
 const hall=buildSacredTemple(theme.id);assert.equal(hall.scene.userData.templeId,theme.id);
 player=p(0,16);player.keys.add('KeyW');step(player,hall.octree,480);assert.ok(player.collider.start.z<0&&player.grounded,`${theme.id} central aisle`);
 player=p(0,16);player.keys.add('KeyS');step(player,hall.octree,150);assert.ok(player.collider.start.z>20,`${theme.id} exit`);
 player=p(6.15,18);player.keys.add('KeyW');step(player,hall.octree,240);assert.ok(player.collider.start.z>16.7,`${theme.id} column`);
 let meshes=0,triangles=0;hall.scene.traverse(o=>{if(o instanceof Mesh&&o.visible){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 assert.ok(meshes<100,`${theme.id}: ${meshes} meshes exceeds draw-call budget`);assert.ok(triangles<350000,`${theme.id}: ${triangles} triangles exceeds geometry budget`);
 hall.update(1);hall.update(2);hall.dispose();pass(`${theme.name}: entrance, exit, collisions, animation and scene budget (${meshes} meshes, ${Math.round(triangles)} triangles)`);
}
console.log('All game checks passed.');

