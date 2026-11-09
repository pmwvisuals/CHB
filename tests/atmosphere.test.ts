import assert from 'node:assert/strict';
import {Scene,Mesh,PlaneGeometry,MeshStandardMaterial,Vector3,ShaderLib} from 'three';
import {buildAtmosphere} from '../lib/game/atmosphere';
import {easternSunDirection,cloudBanks,cloudCenter,cloudShadowTransmission} from '../lib/game/atmosphere-layout';
import {buildLakeside} from '../lib/game/lakeside';
import {Group} from 'three';
const scene=new Scene(),atmosphere=buildAtmosphere(scene),sun=atmosphere.sun.position.clone();
assert.equal(atmosphere.clouds.length,4);assert.ok(easternSunDirection.x>.8&&Math.abs(easternSunDirection.z)<.0001,'sun is due east');
const initial=atmosphere.clouds.map(c=>c.position.clone());atmosphere.update(60,new Vector3(10,2,30));assert.ok(atmosphere.sun.position.equals(sun),'sun never moves');
for(let i=0;i<4;i++){const moved=atmosphere.clouds[i].position.distanceTo(initial[i]);assert.ok(moved>5&&moved<20,'cloud motion is slow');assert.ok(cloudBanks[i].size.x>=95&&cloudBanks[i].size.y>=30,'large three-dimensional clouds');const m=atmosphere.clouds[i].material;assert.equal(Array.isArray(m)?m[0].type:m.type,'ShaderMaterial');}
const center=cloudCenter(1,0),shadowPoint=center.clone().addScaledVector(easternSunDirection,-center.y/easternSunDirection.y);shadowPoint.y=0;
assert.ok(cloudShadowTransmission(shadowPoint,0)<.4,'cloud casts a visible soft ground shadow');assert.ok(cloudShadowTransmission(new Vector3(-400,0,-400),0)>.99,'clear sky remains sunlit');assert.ok(Math.abs(cloudShadowTransmission(shadowPoint,0)-cloudShadowTransmission(shadowPoint,600))>.1,'shadow drifts with its cloud');
assert.ok(cloudShadowTransmission(new Vector3(0,2,0),0)>.99,'the eastern sun is visible from the central camp at the start');
const floor=new Mesh(new PlaneGeometry(10,10),new MeshStandardMaterial());floor.receiveShadow=true;scene.add(floor);const lake=buildLakeside(scene,new Group());atmosphere.applyCloudShadows();
const blue=lake.water.geometry.getAttribute('color');for(let i=0;i<blue.count;i++)assert.ok(blue.getZ(i)>blue.getY(i)*1.25&&blue.getY(i)>blue.getX(i),'the opaque lake retains a blue base colour');
for(const material of [floor.material,lake.water.material] as MeshStandardMaterial[]){const shader={vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader,uniforms:{}};material.onBeforeCompile(shader as any,{} as any);assert.ok(shader.fragmentShader.includes('directLight.color*=cloudTransmission'));assert.ok(shader.vertexShader.includes('instanceMatrix*cloudLocal'));if(material===lake.water.material){assert.ok(shader.fragmentShader.includes('lakeFresnel')&&shader.fragmentShader.includes('lakeCloudMask'));assert.equal(material.transparent,false);assert.equal(material.opacity,1);assert.equal(material.depthWrite,true);}}
scene.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});scene.clear();
console.log('PASS fixed eastern sun, four large slow clouds, moving ground shadows, shader hooks and opaque blue water');
