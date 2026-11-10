import * as T from 'three';
import {groundHeight} from './data';
import {templeSites,sitePoint,type SiteId} from './sanctuary-layout';
import type {DayCycleState} from './day-cycle';

export function campLampPositions(){
 const positions:{x:number;z:number}[]=[];
 for(const id of Object.keys(templeSites) as SiteId[])for(const side of [-1,1])positions.push(sitePoint(id,side*6.5,10.5));
 for(const [x,z] of [[-10,10],[10,10],[-10,-10],[10,-10],[-59,62],[-51,62],[41,54],[51,54],[-72,-12],[-62,-12],[57,10],[60,-18],[61,31],[69,31],[-8,91],[8,91],[-23,57],[23,57]])positions.push({x,z});
 return positions;
}

/** Visible bronze lanterns throughout camp; nearby pools share eight light slots. */
export function buildCampLighting(scene:T.Scene,state:DayCycleState){
 const positions=campLampPositions(),root=new T.Group();root.name='Camp night lanterns';scene.add(root);
 const stone=new T.MeshStandardMaterial({color:'#b9af97',roughness:.85}),bronze=new T.MeshStandardMaterial({color:'#84643d',roughness:.48,metalness:.55}),glass=new T.MeshStandardMaterial({color:'#e9c891',emissive:'#ffba64',emissiveIntensity:.3,roughness:.45});
 const base=new T.CylinderGeometry(.28,.36,.18,8),shaft=new T.CylinderGeometry(.085,.12,1.85,12),caseGeo=new T.CylinderGeometry(.23,.23,.42,8),cap=new T.ConeGeometry(.34,.24,8),bar=new T.BoxGeometry(.025,.46,.025);
 const targets:T.Vector3[]=[];
 for(const p of positions){const group=new T.Group();group.position.set(p.x,groundHeight(p.x,p.z)-.025,p.z);root.add(group);
  for(const [geo,mat,y] of [[base,stone,.09],[shaft,bronze,1.08],[caseGeo,glass,2.19],[cap,bronze,2.53]] as const){const m=new T.Mesh(geo,mat);m.position.y=y;m.castShadow=m.receiveShadow=true;group.add(m);}
  for(const x of [-.16,.16])for(const z of [-.16,.16]){const m=new T.Mesh(bar,bronze);m.position.set(x,2.19,z);group.add(m);}
  targets.push(new T.Vector3(p.x,group.position.y+2.19,p.z));
 }
 const lights=Array.from({length:8},()=>{const light=new T.PointLight('#ffc27f',0,23,2);light.name='Warm lantern light pool';scene.add(light);return light;});
 function update(camera=new T.Vector3(0,2,113)){
  glass.emissiveIntensity=.3+state.nightLights*2.2;
  const nearby=targets.map((position,index)=>({position,index,d:position.distanceToSquared(camera)})).filter(p=>p.d<65*65).sort((a,b)=>a.d-b.d).slice(0,lights.length);
  lights.forEach((light,i)=>{const p=nearby[i];light.intensity=p?30*state.nightLights:0;if(p)light.position.copy(p.position);});
 }
 update();scene.userData.campLighting={lanterns:positions.length,lightSlots:lights.length};
 return {update,lights,positions};
}
