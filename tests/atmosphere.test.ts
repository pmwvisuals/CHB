import assert from 'node:assert/strict';
import {Scene,Mesh,PlaneGeometry,MeshStandardMaterial,Vector3,ShaderLib,Group,FogExp2,PointLight,ShaderMaterial} from 'three';
import {buildAtmosphere} from '../lib/game/atmosphere';
import {cloudBanks,cloudCenter,cloudShadowTransmission} from '../lib/game/atmosphere-layout';
import {sampleDayCycle,cycleSecondsAtHour,dayCycleDuration,updateDayCycle,createDayCycleClock,skyStateLabel} from '../lib/game/day-cycle';
import {buildLakeside} from '../lib/game/lakeside';
import {buildCampLighting} from '../lib/game/camp-lighting';
const sample=(hour:number)=>sampleDayCycle(cycleSecondsAtHour(hour));
for(let hour=0;hour<24;hour+=.125){const s=sample(hour);assert.ok(Math.abs(s.sunDirection.length()-1)<1e-10);assert.ok(s.sunDirection.dot(s.moonDirection)<-.9999);assert.ok(s.lightDirection.y>=-1e-10);assert.ok(Number.isFinite(s.lightIntensity));assert.ok(s.daylight>=0&&s.daylight<=1);}
assert.ok(sample(6).sunDirection.x>.99&&sample(12).sunDirection.y>.9&&sample(18).sunDirection.x<-.99,'sun rises east, arcs south and sets west');
assert.ok(sample(0).moonDirection.y>.9&&sample(0).stars>.99&&sample(12).stars===0,'moon and stars dominate midnight');
assert.equal(dayCycleDuration,780,'a complete cycle lasts thirteen minutes');
assert.ok(sample(12).ambientIntensity>sample(0).ambientIntensity*5&&sample(12).lightIntensity>sample(0).lightIntensity*6,'night lighting remains distinct from day');
assert.ok(sample(18).moonDirection.x>.99&&sample(0).moonDirection.y>.9&&sample(6).moonDirection.x<-.99,'moon also rises east and sets west');
assert.ok(sample(7).lightColor.b<sample(12).lightColor.b,'low sun has a warmer colour');
assert.ok(sample(0).nightLights>.99&&sample(12).nightLights===0);assert.equal(skyStateLabel(sample(0)),'NIGHT · 00:00');
for(const hour of [0,6,12,18,23.99]){const a=sample(hour),b=sampleDayCycle(cycleSecondsAtHour(hour)+dayCycleDuration);assert.ok(a.sunDirection.distanceTo(b.sunDirection)<1e-8,'cycle wraps without a position jump');}
const state=sample(12),reference=state.sunDirection;updateDayCycle(state,cycleSecondsAtHour(0));assert.equal(state.sunDirection,reference,'uniform vector references stay live across updates');assert.ok(state.sunDirection.y<-.9);
const saved=new Map<string,string>(),storage={getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>{saved.set(k,v);}};
const first=createDayCycleClock(()=>storage);assert.equal(first(1000),0);assert.equal(first(61000),60);const restored=createDayCycleClock(()=>storage);assert.equal(restored(121000),120,'page transitions retain the epoch');
const blocked=createDayCycleClock(()=>{throw new Error('storage blocked');});assert.equal(blocked(1000),0);assert.equal(blocked(11000),10,'in-memory fallback keeps time');
saved.set('asterion-sky-epoch','NaN');assert.equal(createDayCycleClock(()=>storage)(1000),0);saved.set('asterion-sky-epoch','9999999');assert.equal(createDayCycleClock(()=>storage)(1000),0,'invalid or future epochs safely reset');

const scene=new Scene();scene.fog=new FogExp2('#9bafba',.0013);const atmosphere=buildAtmosphere(scene),sun=atmosphere.sun.position.clone();
assert.equal(atmosphere.clouds.length,4);assert.equal(scene.userData.atmosphere.sunMotion,true);
assert.ok(Math.abs(atmosphere.sun.shadow.camera.projectionMatrix.elements[0]-.004)<1e-8,'shadow projection actually covers the full camp');
const initial=atmosphere.clouds.map(c=>c.position.clone());atmosphere.update(60,new Vector3(10,2,30));assert.ok(atmosphere.sun.position.distanceTo(sun)>50,'light and its shadow camera move through the sky');
for(let i=0;i<4;i++){const moved=atmosphere.clouds[i].position.distanceTo(initial[i]);assert.ok(moved>5&&moved<20,'cloud motion stays slow');assert.ok(cloudBanks[i].size.x>=95&&cloudBanks[i].size.y>=30);}
const morning=sampleDayCycle(0).lightDirection,center=cloudCenter(1,0),shadowPoint=center.clone().addScaledVector(morning,-center.y/morning.y);shadowPoint.y=0;
assert.ok(cloudShadowTransmission(shadowPoint,0,morning)<.4);assert.ok(cloudShadowTransmission(new Vector3(-400,0,-400),0,morning)>.99);assert.ok(Math.abs(cloudShadowTransmission(shadowPoint,0,morning)-cloudShadowTransmission(shadowPoint,600,morning))>.1);
for(const hour of [0,6,12,18])assert.ok(Number.isFinite(cloudShadowTransmission(shadowPoint,cycleSecondsAtHour(hour))),'horizon cloud projection has no division singularity');
const floor=new Mesh(new PlaneGeometry(10,10),new MeshStandardMaterial());floor.receiveShadow=true;scene.add(floor);const lake=buildLakeside(scene,new Group());atmosphere.applyCloudShadows();
const blue=lake.water.geometry.getAttribute('color');for(let i=0;i<blue.count;i++)assert.ok(blue.getZ(i)>blue.getY(i)*1.25&&blue.getY(i)>blue.getX(i),'water keeps its opaque blue base');
const nightLamp=new PointLight('#ffba70',7);atmosphere.registerNightLight(nightLamp);const shaders:any[]=[];
for(const material of [floor.material,lake.water.material] as MeshStandardMaterial[]){const shader={vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader,uniforms:{}};material.onBeforeCompile(shader as any,{} as any);shaders.push(shader);assert.ok(shader.fragmentShader.includes('directLight.color*=cloudTransmission'));assert.ok(shader.fragmentShader.includes('if(cloudSun.y<.025)'));if(material===lake.water.material){assert.ok(shader.fragmentShader.includes('moonGlint')&&shader.fragmentShader.includes('lakeCloudMask'));assert.equal(material.transparent,false);assert.equal(material.opacity,1);assert.equal(material.depthWrite,true);}}
const renderer={shadowMap:{needsUpdate:false},toneMappingExposure:1} as any;
atmosphere.update(cycleSecondsAtHour(12));lake.update(1);atmosphere.prepareRenderer(renderer);assert.ok(renderer.shadowMap.needsUpdate);assert.equal(nightLamp.intensity,0);const dayFog=scene.fog.color.clone();
renderer.shadowMap.needsUpdate=false;atmosphere.update(cycleSecondsAtHour(12)+.01);atmosphere.prepareRenderer(renderer);assert.equal(renderer.shadowMap.needsUpdate,false,'shadow redraws are bounded');
atmosphere.update(cycleSecondsAtHour(0),new Vector3(40,2,50));lake.update(2);atmosphere.prepareRenderer(renderer);assert.ok(renderer.shadowMap.needsUpdate&&nightLamp.intensity>6.9);assert.ok(atmosphere.moon.visible&&atmosphere.stars.visible);assert.ok(scene.fog.color.r<dayFog.r*.1,'night fog is dark');
assert.ok(shaders[0].uniforms.cloudSun.value.y>.9,'cloud shadows follow the moon at night');assert.ok(shaders[1].uniforms.lakeSunDirection.value.y<-.9&&shaders[1].uniforms.lakeMoonDirection.value.y>.9);assert.ok(shaders[1].uniforms.lakeMoonStrength.value>.99&&shaders[1].uniforms.lakeSunStrength.value===0,'water reflects the active body');
assert.ok(atmosphere.moon.position.clone().sub(new Vector3(40,2,50)).normalize().distanceTo(atmosphere.state.moonDirection)<1e-8);assert.ok((atmosphere.sky.material as ShaderMaterial).fragmentShader.includes('mix(nightColor,retColor,cycleDaylight)'));
const nightLightPosition=atmosphere.sun.position.clone();atmosphere.update(cycleSecondsAtHour(2));assert.ok(nightLightPosition.distanceTo(atmosphere.sun.position)>100,'lunar shadows also move');
const campLights=buildCampLighting(scene,atmosphere.state);campLights.update(new Vector3(0,2,0));assert.equal(campLights.positions.length,42);assert.equal(campLights.lights.length,8);assert.ok(campLights.lights.some(l=>l.intensity>29),'nearby paths and gathering areas have warm light pools');
atmosphere.update(cycleSecondsAtHour(12));campLights.update(new Vector3(0,2,0));assert.ok(campLights.lights.every(l=>l.intensity===0),'added lamps switch off during daylight');
atmosphere.dispose();scene.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});scene.clear();
console.log('PASS full day/night orbit, smooth cycle wrap, warm twilight, moving sun/moon shadows, timed shadow refresh, persisted clock, night lamps/stars/fog and opaque blue water reflections');
