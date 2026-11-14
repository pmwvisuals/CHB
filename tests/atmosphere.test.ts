import assert from 'node:assert/strict';
import {Scene,Mesh,PlaneGeometry,MeshStandardMaterial,Vector3,ShaderLib,Group,FogExp2,PointLight,ShaderMaterial} from 'three';
import {buildAtmosphere} from '../lib/game/atmosphere';
import {cloudBanks,cloudShadowTransmission} from '../lib/game/atmosphere-layout';
import {buildLakeside} from '../lib/game/lakeside';
import {buildCampLighting} from '../lib/game/camp-lighting';

const scene=new Scene();scene.fog=new FogExp2('#9bafba',.0013);
const atmosphere=buildAtmosphere(scene,{clock:()=>999999}),direction=atmosphere.sun.position.clone(),color=atmosphere.sun.color.clone();
assert.equal(atmosphere.clouds.length,4);
assert.equal(scene.userData.atmosphere.fixedDaylight,true);
assert.equal(scene.userData.atmosphere.cycleSeconds,0);
assert.ok(!('moon' in atmosphere)&&!('stars' in atmosphere),'celestial models are not constructed');
assert.ok((atmosphere.sky.material as ShaderMaterial).fragmentShader.includes('float sundisk = 0.;'),'sky shader does not draw a solar disc');
const initial=atmosphere.clouds.map(c=>c.position.clone());
atmosphere.update(60,new Vector3(10,2,30));
assert.ok(atmosphere.sun.position.equals(direction)&&atmosphere.sun.color.equals(color),'lighting remains fixed');
for(let i=0;i<4;i++){const moved=atmosphere.clouds[i].position.distanceTo(initial[i]);assert.ok(moved>5&&moved<20);assert.ok(cloudBanks[i].size.x>=95);}
assert.ok(Number.isFinite(cloudShadowTransmission(new Vector3(0,0,0),60,atmosphere.state.lightDirection)));

const floor=new Mesh(new PlaneGeometry(10,10),new MeshStandardMaterial());floor.receiveShadow=true;scene.add(floor);
const lake=buildLakeside(scene,new Group());atmosphere.applyCloudShadows();
for(const material of [floor.material,lake.water.material] as MeshStandardMaterial[]){
 const shader={vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader,uniforms:{}};
 material.onBeforeCompile(shader as any,{} as any);assert.ok(shader.fragmentShader.includes('directLight.color*=cloudTransmission'));
}
assert.equal((lake.water.material as MeshStandardMaterial).transparent,false);
assert.equal((lake.water.material as MeshStandardMaterial).opacity,1);
const lamp=new PointLight('#ffba70',7);atmosphere.registerNightLight(lamp);
const lights=buildCampLighting(scene,atmosphere.state),dayFog=scene.fog.color.clone();
for(const time of [1920,43200,999999]){
 atmosphere.update(time,new Vector3(40,2,50));lights.update(new Vector3(0,2,0));lake.update(time);
 assert.ok(atmosphere.sun.position.equals(direction)&&scene.fog.color.equals(dayFog));
 assert.equal(lamp.intensity,0);assert.ok(lights.lights.every(l=>l.intensity===0));
 assert.equal(atmosphere.state.daylight,1);
}
atmosphere.dispose();scene.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
console.log('PASS fixed daylight, absent sun/moon models, moving clouds and opaque blue water');
