import assert from 'node:assert/strict';
import * as T from 'three';
import {campRoutes,routePoints} from '../lib/game/camp-layout';
import {templeCatalog} from '../lib/game/temple-catalog';
import {templeTrails,sitePoint} from '../lib/game/sanctuary-layout';
import {roadBorderPlacements,roadKerbGeometry,buildRoadBorders} from '../lib/game/road-borders';
import {flowerGeometry,buildFlowers} from '../lib/game/flowers';
import {groundHeight} from '../lib/game/data';
import {terrainGeometry} from '../lib/game/landscape';
if(typeof document==='undefined'){const ctx=new Proxy({}, {get:()=>()=>{}});Object.assign(globalThis,{document:{createElement:()=>({width:128,height:128,getContext:()=>ctx})}});}

const routes=campRoutes.map(r=>({points:routePoints(r.points),width:r.width}));
for(const t of templeCatalog)if(t.id!=='poseidon'){const end=sitePoint(t.id,0,16);routes.push({points:routePoints([...templeTrails[t.id],[end.x,end.z]]),width:2.8});}
const placements=roadBorderPlacements(routes);
assert.ok(placements.length>2000,'all routes receive edging without a fixed capacity cutoff');
for(let i=0;i<routes.length;i++)for(const side of [-1,1])assert.ok(placements.some(p=>p.route===i&&p.side===side),`route ${i} has both borders`);
const straight=roadBorderPlacements([{points:[new T.Vector3(0,0,0),new T.Vector3(0,0,100)],width:4}]);
for(const side of [-1,1]){const line=straight.filter(p=>p.side===side);assert.ok(line.length>90);for(let i=1;i<line.length;i++)assert.ok(Math.abs(line[i].z-line[i-1].z-1.04)<1e-8,'kerbs use equal arc-length spacing');}
const cross=roadBorderPlacements([{points:[new T.Vector3(0,0,-20),new T.Vector3(0,0,20)],width:4},{points:[new T.Vector3(-20,0,0),new T.Vector3(20,0,0)],width:4}]);
for(const p of cross)assert.ok(p.route===0?Math.abs(p.z)>=2.84:Math.abs(p.x)>=2.84,'crossroads remain open');
const kerb=roadKerbGeometry();assert.ok(kerb.boundingBox!.max.y<.2&&kerb.boundingBox!.max.z<.51,'low chamfered road edging fits its spacing');assert.equal(kerb.getAttribute('position').count,kerb.getAttribute('color').count);
const scene=new T.Scene();buildRoadBorders(scene,routes);
const blocks=scene.getObjectByName('Greek-key limestone road borders') as T.InstancedMesh,matrix=new T.Matrix4(),position=new T.Vector3();
for(let i=0;i<blocks.count;i+=13){blocks.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);assert.ok(Math.abs(position.y-groundHeight(position.x,position.z)+.02)<.0001,'every block follows the actual terrain');}
for(const kind of ['daisy','poppy','lavender'] as const){const g=flowerGeometry(kind),p=g.getAttribute('position');assert.ok(p.count>500&&p.count<4000,'modelled botanical detail has a shared geometry budget');assert.ok(Array.from(p.array).every(Number.isFinite));assert.ok(g.boundingBox!.min.y===0&&g.boundingBox!.max.y>.5,'complete rooted stems and raised flower heads');g.dispose();}
const flowers=buildFlowers(scene,[{x:-30,z:60,scale:1,rotation:0,kind:'daisy'},{x:10,z:20,y:5,scale:.7,rotation:1,kind:'lavender'}]);
const daisies=scene.getObjectByName('Living flowers · daisy') as T.InstancedMesh;daisies.getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);assert.ok(Math.abs(position.y-groundHeight(-30,60)+.012)<.00001,'flowers are planted at terrain height');
const potted=scene.getObjectByName('Living flowers · lavender') as T.InstancedMesh;potted.getMatrixAt(0,matrix);assert.equal(matrix.elements[13],5,'planter height override is respected');
const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};flowers.update(12);(daisies.material as T.Material).onBeforeCompile(shader as any,{} as any);assert.equal((shader.uniforms as any).flowerTime.value,12);assert.ok(shader.vertexShader.includes('position.y*position.y'));
// An adaptive terrain edge must be shared by exactly two triangles, except at
// the outer boundary. This catches cracks where fine shore cells meet coarse land.
const terrain=terrainGeometry(90,110,91,0),idx=terrain.index!,p=terrain.getAttribute('position'),edges=new Map<string,number>();
for(let i=0;i<idx.count;i+=3)for(let k=0;k<3;k++){const a=idx.getX(i+k),b=idx.getX(i+(k+1)%3),key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}
for(const [edge,count] of edges){assert.ok(count<=2);if(count===1){const [a,b]=edge.split(':').map(Number),boundary=(i:number)=>Math.abs(Math.abs(p.getX(i)-91)-45)<.0001||Math.abs(Math.abs(p.getZ(i))-55)<.0001;assert.ok(boundary(a)&&boundary(b),'terrain has no open seams inside the shoreline');}}
assert.ok(terrain.index!.count/3<20000,'shore refinement stays local');
flowers.dispose();kerb.dispose();terrain.dispose();console.log('PASS complete Greek road borders, open junctions, grounded blocks, rooted botanical flowers and crack-free adaptive shoreline');
