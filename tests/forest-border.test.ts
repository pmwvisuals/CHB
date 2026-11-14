import assert from 'node:assert/strict';
import {Scene,Group,Mesh,InstancedMesh,Vector3,ShaderLib,MeshStandardMaterial} from 'three';
import {forestBorderPlacements,forestAtmosphere} from '../lib/game/forest-border';
import {forestDepth} from '../lib/game/forest-border-layout';
import {groundHeight} from '../lib/game/data';
import {plantCollection} from '../lib/game/vegetation';
import {forestUnderstoryPlacements} from '../lib/game/forest-understory';
import {insideTempleGrounds} from '../lib/game/sanctuary-layout';
import {roadCover} from '../lib/game/ground-surface';
const plants=forestBorderPlacements();assert.ok(plants.length>1800&&plants.length<=2400,`${plants.length} trees`);
const sectors=new Array(24).fill(0);for(const p of plants){assert.ok(forestDepth(p.x,p.z)>=.35);assert.ok(p.y<=groundHeight(p.x,p.z)-.034);assert.ok(groundHeight(p.x,p.z)-p.y<.6,'root collars remain near the local soil');assert.ok(p.scale<=1&&p.scale>=.8);sectors[Math.floor((Math.atan2(p.z,p.x)+Math.PI)/Math.PI/2*24)%24]++;}assert.ok(sectors.every(n=>n>25),'continuous belt in all directions');
assert.equal(new Set(plants.map(p=>p.id)).size,5,'all five dark tree varieties are present');
// A planting grid gives a strong periodic peak. Continuous scatter should not
// retain the old 4.6 m lattice in either axis, even when inspected from above.
for(const axis of ['x','z'] as const){const wave=plants.reduce((n,p)=>{const a=p[axis]/4.6*Math.PI*2;n[0]+=Math.cos(a);n[1]+=Math.sin(a);return n;},[0,0]);assert.ok(Math.hypot(...wave)/plants.length<.08,'no periodic rows in '+axis);}
const floor=forestUnderstoryPlacements();assert.ok(floor.grass.length>25000&&floor.plants.length>4000,'dense layers inside the smaller belt');assert.ok(floor.plants.filter(p=>p.id==='forest_bramble').length>300);
console.log('PASS dense forest floor:',floor.grass.length,'grass clumps,',floor.plants.length,'bushes, ferns and litter plants');
for(const p of [...floor.plants,...floor.grass].filter((_,i)=>i%47===0)){assert.ok(!insideTempleGrounds(p.x,p.z,1));assert.ok(roadCover(p.x,p.z)<=.025,'woodland floor stays off the roads');assert.ok(Math.abs(p.y-groundHeight(p.x,p.z))<.03,'understory follows the terrain');}
const scene=new Scene(),collection=plantCollection(scene,[{id:'forest_fir',x:0,y:0,z:0,scale:1,rotation:0}],{range:620,canopyLayers:2});
scene.traverse(o=>{if(o instanceof InstancedMesh&&o.name.includes('bark')){o.geometry.computeBoundingBox();assert.ok(Math.abs(o.geometry.boundingBox!.min.y)<.001,'trunk base normalized to ground');}if(o instanceof InstancedMesh&&o.name.includes('canopy')){assert.equal(o.count,1);assert.equal((o.material as MeshStandardMaterial).alphaTest,0,'distant canopy cannot disappear in texture mipmaps');}});collection.update(0,new Vector3(300,60,0));assert.ok(scene.children.some(o=>o.visible),'distant canopy stays present inside mist');
forestAtmosphere(scene);let checked=false;scene.traverse(o=>{if(!(o instanceof Mesh)||!(o.material instanceof MeshStandardMaterial)||checked)return;const shader={vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader,uniforms:{}};o.material.onBeforeCompile(shader as any,{} as any);assert.ok(shader.vertexShader.includes('instanceMatrix*forestLocal'));assert.ok(!shader.fragmentShader.includes('outerMist'),'trees are never whitened by their map position');assert.ok(shader.fragmentShader.includes('reflectedLight.directDiffuse'));checked=true;});assert.ok(checked);collection.dispose();console.log('PASS forest border:',plants.length,'grounded trees, player-relative scale, opaque distant crowns and canopy shade');
