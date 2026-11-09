import assert from 'node:assert/strict';
import {Scene,Vector3,Mesh,InstancedMesh} from 'three';
import {vegetationAssets} from '../lib/game/generated/vegetation';
import {unpackPlant,plantCollection,gardenGrass,type PlantId} from '../lib/game/vegetation';
const ids=Object.keys(vegetationAssets) as PlantId[];assert.equal(ids.length,12);
assert.ok(vegetationAssets.forest_oak.height>=4.5&&vegetationAssets.forest_oak.height<=5);
assert.ok(vegetationAssets.forest_fir.height>=4.5&&vegetationAssets.forest_fir.height<=5.1);
assert.ok(vegetationAssets.camp_olive.height<10&&vegetationAssets.camp_blossom.height<10);
for(const id of ids){let high=0,low=0;for(const part of vegetationAssets[id].parts){for(const lod of ['high','low'] as const){const g=unpackPlant(part[lod]);const p=g.getAttribute('position'),uv=g.getAttribute('uv');assert.equal(p.count,uv.count);assert.ok(g.index!.count>0,`${id} ${part.material} empty`);for(const a of ['position','normal','uv'])assert.ok(Array.from(g.getAttribute(a).array).every(Number.isFinite));assert.ok(Array.from(g.index!.array).every(i=>i<p.count));g.dispose();}high+=part.high.triangles;low+=part.low.triangles;}assert.ok(low<high,`${id} distance geometry must be smaller`);assert.ok(high<60000,`${id} excessive geometry`);}
const scene=new Scene();const plants=plantCollection(scene,ids.map((id,i)=>({id,x:i*3,y:0,z:0,scale:1,rotation:0})));
plants.setQuality('high');plants.update(1,new Vector3());assert.ok(scene.children.some(o=>o.name.includes('high detail')&&o.visible));plants.setQuality('low');plants.update(2,new Vector3());assert.ok(scene.children.filter(o=>o.name.includes('high detail')).every(o=>!o.visible));plants.update(3,new Vector3(1000,0,1000));assert.ok(scene.children.every(o=>!o.visible));plants.dispose();scene.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());if(o instanceof InstancedMesh)o.dispose();}});
console.log('PASS twelve Blender assets: finite decoded geometry, valid indices, height separation, smaller LODs and distance culling');
for(const id of ['forest_oak','forest_fir','camp_olive','camp_blossom'] as const){
 const asset=vegetationAssets[id],bark=unpackPlant(asset.parts.find(p=>p.material==='bark')!.high);
 assert.ok(Math.abs(bark.boundingBox!.min.y)<.001,'each tree has actual root geometry at the origin');bark.dispose();
 const canopy=asset.parts.find(p=>p.material==='canopy');assert.ok(canopy&&canopy.low.triangles>1000,'the distant crown retains continuous solid coverage');
 assert.ok(asset.parts.some(p=>p.material==='foliage'),'individual leaves use geometry silhouettes');
}
const garden=gardenGrass();for(const geometry of [garden.garden,garden.wisps]){const position=geometry.getAttribute('position'),color=geometry.getAttribute('color');assert.equal(position.count,color.count);assert.ok(geometry.index!.count>300);assert.ok(Array.from(position.array).every(Number.isFinite));assert.ok(Math.max(...Array.from(position.array).filter((_,i)=>i%3===1))>.12);assert.ok(Array.from(color.array).reduce((n,v,i)=>n+(i%3===1?v:0),0)/(color.count)<.16,'garden blades stay dark green');geometry.dispose();}garden.material.dispose();
console.log('PASS Blender garden grass: two folded varieties, finite geometry, dark vertex colour and realistic height variation');
