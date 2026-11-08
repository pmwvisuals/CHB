import assert from 'node:assert/strict';
import {Scene,Group,Mesh,BoxGeometry,Vector3,Box3} from 'three';
import {Capsule} from 'three/addons/math/Capsule.js';
import {Octree} from 'three/addons/math/Octree.js';
import {buildTempleExteriors,buildGreatHall} from '../lib/game/temple-exteriors';
import {templeCatalog,templePlacement,templeAtEntrance} from '../lib/game/temple-catalog';
import {groundHeight} from '../lib/game/data';
import {simulatePlayer} from '../lib/game/physics';
import {terrainGeometry} from '../lib/game/landscape';
const scene=new Scene(),collision=new Group();collision.add(new Mesh(terrainGeometry()));
const temples=buildTempleExteriors(scene,collision),hall=buildGreatHall(scene,collision);collision.updateMatrixWorld(true);const tree=new Octree().fromGraphNode(collision);
const player=(x:number,z:number,yaw:number,y=0)=>({keys:new Set(['KeyW']),yaw,grounded:false,jumpQueued:false,velocity:new Vector3(),collider:new Capsule(new Vector3(x,y+.33,z),new Vector3(x,y+1.63,z),.32)});
const walk=(p:ReturnType<typeof player>,frames=360)=>{for(let i=0;i<frames;i++)simulatePlayer(p,tree,1/120);};
assert.equal(temples.roots.length,12);
for(const theme of templeCatalog){const place=templePlacement(theme.id),p=player(place.x+Math.sin(place.rotation)*(theme.id==='poseidon'?12:16),place.z+Math.cos(place.rotation)*(theme.id==='poseidon'?12:16),place.rotation,groundHeight(place.x,place.z));let reached=false;for(let i=0;i<650;i++){simulatePlayer(p,tree,1/120);if(templeAtEntrance(p.collider.start.x,p.collider.start.z)?.id===theme.id){reached=true;break;}}assert.ok(reached,`${theme.id} ramp and portico approach ${JSON.stringify({p:p.collider.start,place})}`);
 const root=temples.roots.find(r=>r.userData.templeId===theme.id)!;let meshes=0,triangles=0;root.traverse(o=>{if(o instanceof Mesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.getAttribute('position').count)/3;assert.ok(Array.from(o.geometry.getAttribute('position').array).every(Number.isFinite));}});assert.ok(meshes<=28,`${theme.id} batch count ${meshes}`);assert.ok(triangles<100000,`${theme.id} triangle budget ${triangles}`);
 const bounds=new Box3().setFromObject(root),size=bounds.getSize(new Vector3());assert.ok(size.y>9,`${theme.id} monumental height`);
 // Actual wall collision, clear of the portal's threshold.
 const lx=2.0,lz=-3.5,x=place.x+Math.cos(place.rotation)*lx+Math.sin(place.rotation)*lz,z=place.z-Math.sin(place.rotation)*lx+Math.cos(place.rotation)*lz;
 const wall=player(x,z,place.rotation-Math.PI/2,groundHeight(place.x,place.z)+.44);walk(wall,240);const dx=wall.collider.start.x-place.x,dz=wall.collider.start.z-place.z;assert.ok(dx*Math.cos(place.rotation)-dz*Math.sin(place.rotation)<3.6,`${theme.id} side wall blocks movement`);
 console.log(`PASS ${theme.name} exterior: ramp, portal, wall, ${meshes} batches, ${Math.round(triangles)} triangles`);
}
for(let i=0;i<4;i++){const yaw=i*Math.PI/2,p=player(Math.sin(yaw)*13,Math.cos(yaw)*13,yaw);walk(p,720);const exit=p.collider.start.x*Math.sin(yaw)+p.collider.start.z*Math.cos(yaw);assert.ok(exit<-12&&p.grounded,`Great Hall crossing ${i}: ${exit}`);}
assert.deepEqual(hall.userData.doors,['north','east','south','west']);
const wall=player(3.3,13,0);walk(wall,360);assert.ok(wall.collider.start.z>5.9,'Great Hall solid wall between doors');
console.log('PASS central Great Hall: four entrances, four complete through-routes, solid walls and unobstructed center');
const geos=new Set<any>(),mats=new Set<any>(),textures=new Set<any>();scene.traverse(o=>{if(o instanceof Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const value of Object.values(m))if(value&&typeof value==='object'&&'isTexture' in value)textures.add(value);}}});collision.traverse(o=>{if(o instanceof Mesh)geos.add(o.geometry);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
