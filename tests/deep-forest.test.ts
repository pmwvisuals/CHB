import assert from 'node:assert/strict';
import * as T from 'three';
import {Octree} from 'three/addons/math/Octree.js';
import {Capsule} from 'three/addons/math/Capsule.js';
import {deepForest,deepForestPlacements,deepForestHeight as h,forestTrails,forestTrailDistance,forestMistPockets,forestMistDensity,forestCanopyCover} from '../lib/game/deep-forest-layout';
import {deepForestTerrain,buildDeepForest} from '../lib/game/deep-forest';
import {simulatePlayer,type PlayerState} from '../lib/game/physics';
import {vegetationAssets} from '../lib/game/generated/vegetation';
import {unpackPlant} from '../lib/game/vegetation';
import {ForestMist} from '../lib/game/forest-mist';
import {sampleDayCycle,updateDayCycle,cycleSecondsAtHour} from '../lib/game/day-cycle';

const placements=deepForestPlacements();assert.equal(placements.trees.length,5200);assert.ok(deepForest.radius*2>=500);assert.equal(new Set(placements.trees.map(p=>p.id)).size,5);
const heights:Record<string,{min:number;max:number}>={};for(const id of new Set(placements.trees.map(p=>p.id))){const asset=vegetationAssets[id],leaf=unpackPlant(asset.parts.find(p=>p.material==='foliage')!.high);heights[id]={min:leaf.boundingBox!.min.y,max:leaf.boundingBox!.max.y};leaf.dispose();}
for(const tree of placements.trees){assert.ok(forestTrailDistance(tree.x,tree.z)>=3.7);assert.ok(tree.y<=h(tree.x,tree.z)-.044,'roots are embedded in actual forest terrain');assert.ok(h(tree.x,tree.z)-tree.y<.8);assert.ok(heights[tree.id].max*tree.scale>13&&heights[tree.id].max*tree.scale<23,'overstory trees stand well above the player');assert.ok(heights[tree.id].min*tree.scale>2.4,'existing crown geometry clears standing eye height');}
assert.ok(placements.floor.every(p=>['forest_fern','forest_bracken','forest_bramble','forest_litter'].includes(p.id)),'no ornamental trees, flowers or meadow grass');
for(const p of placements.floor.filter((_,i)=>i%43===0)){assert.ok(Math.abs(p.y-h(p.x,p.z)+.02)<1e-6);assert.ok(forestTrailDistance(p.x,p.z)>=1.7);}
for(const axis of ['x','z'] as const){let a=0,b=0;for(const p of placements.trees){const angle=p[axis]/7*Math.PI*2;a+=Math.cos(angle);b+=Math.sin(angle);}assert.ok(Math.hypot(a,b)/placements.trees.length<.08,'tree scatter has no planting rows');}
assert.ok(forestCanopyCover(140,140)>.75&&forestCanopyCover(-65,-45)<.3,'overstory is dense with occasional sky openings');
for(const p of forestMistPockets){const ground=h(p.x,p.z);assert.ok(forestMistDensity(p.x,ground+1.6,p.z)>0);assert.equal(forestMistDensity(p.x,ground+14,p.z),0,'mist stays below the canopy');}
assert.equal(forestMistDensity(0,h(0,216)+1.6,216),0,'entrance is not covered by a screen-wide fog blanket');
assert.ok(Math.exp(-forestMistDensity(-65,h(-65,-45)+1.6,-45)*20)>.80,'even a mist pocket keeps nearby visibility readable');
const terrain=deepForestTerrain(),p=terrain.getAttribute('position');for(let i=0;i<p.count;i+=97)assert.ok(Math.abs(p.getY(i)-h(p.getX(i),p.getZ(i)))<.00001);
let largestSlope=0;for(let x=-220;x<220;x+=8)for(let z=-220;z<220;z+=8){if(Math.hypot(x,z)>225)continue;largestSlope=Math.max(largestSlope,Math.hypot((h(x+.3,z)-h(x-.3,z))/.6,(h(x,z+.3)-h(x,z-.3))/.6));}assert.ok(largestSlope<.5,'interior hills are gentle enough to explore');
const mist=new ForestMist('deep'),shader=(mist as any).material.fragmentShader as string;assert.ok(shader.includes('forestGround')&&shader.includes('pockets=max')&&shader.includes('i<48'));assert.ok(!shader.includes('edge=197.'),'the deep forest uses its own mist field');mist.dispose();
const scene=new T.Scene();scene.userData.dayCycle=sampleDayCycle(cycleSecondsAtHour(12));const collision=new T.Group(),forest=buildDeepForest(scene,collision);assert.equal(forest.stats.trees,5200);collision.updateMatrixWorld(true);const tree=new Octree().fromGraphNode(collision);
for(const path of forestTrails){const start=path[0],y=h(start.x,start.z),player:PlayerState={keys:new Set(['KeyW']),yaw:0,grounded:false,jumpQueued:false,velocity:new T.Vector3(),collider:new Capsule(new T.Vector3(start.x,y+.35,start.z),new T.Vector3(start.x,y+1.65,start.z),.32)};
 for(let i=5;i<path.length;i+=5){const target=path[i];let frames=0;while(Math.hypot(player.collider.start.x-target.x,player.collider.start.z-target.z)>.7&&frames++<600){player.yaw=Math.atan2(player.collider.start.x-target.x,player.collider.start.z-target.z);simulatePlayer(player,tree,1/120);}assert.ok(frames<600,`forest trail blocked at ${player.collider.start.x},${player.collider.start.z}`);assert.ok(Math.abs(player.collider.start.y-.32-h(player.collider.start.x,player.collider.start.z))<.15,'trail walking follows real ground');}
}
forest.update(20,new T.Vector3(0,2,216));let checked=false;scene.traverse(o=>{if(checked||!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial))return;const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};o.material.onBeforeCompile(shader as any,{} as any);assert.ok(shader.fragmentShader.includes('deepWorld.y-forestGround'));checked=true;});assert.ok(checked);
const soil=scene.getObjectByName('Old forest soil and rolling hollows') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>,filtered={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{} as Record<string,{value:any}>};soil.material.onBeforeCompile(filtered as any,{} as any);
assert.ok(filtered.fragmentShader.includes('leafTransmission*leafFacing')&&filtered.fragmentShader.includes('deepSunStrength'),'sun-facing terrain receives dim, spatially varied canopy transmission');assert.ok(filtered.uniforms.deepSunStrength.value>.99);
updateDayCycle(scene.userData.dayCycle,cycleSecondsAtHour(0));forest.update(21,new T.Vector3(0,2,216));assert.equal(filtered.uniforms.deepSunStrength.value,0,'filtered sunlight turns off completely at night');assert.equal(filtered.uniforms.deepTime.value,21);
forest.dispose();scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(m))if(value instanceof T.Texture)value.dispose();m.dispose();}}});tree.clear();scene.clear();collision.clear();terrain.dispose();
console.log('PASS deep forest: 520m landscape, 5200 grounded tall trees, standing sightlines, natural scatter, bare/fern floor, localized depth-aware mist, canopy light filtering and all woodland trails walkable');
