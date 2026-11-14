import * as T from 'three';
import {groundHeight} from './data';
import {insideTempleGrounds} from './sanctuary-layout';
import {roadCover} from './ground-surface';
import {forestDepth,forestEdge,forestPatch} from './forest-border-layout';
import {plantCollection,forestTreeIds,type PlantPlacement} from './vegetation';
import {buildForestUnderstory} from './forest-understory';
import {insideCamp,campRadius,forestEdgeGLSL,forestEdgeSamples} from './camp-boundary';
export function forestBorderPlacements(){
 const plants:PlantPlacement[]=[];let seed=8013;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 // Rejection-sampled scatter: no planting lattice, rows or concentric bands.
 // Variable spacing gives dense groves, loose edge trees and small clearings.
 const cells=new Map<string,PlantPlacement[]>(),cellSize=3.2;
 const place=(px:number,pz:number,edge=false)=>{
  const patch=forestPatch(px,pz);
  if(forestDepth(px,pz)<.35||!insideCamp(px,pz,3)||insideTempleGrounds(px,pz,-1)||roadCover(px,pz)>.05)return;
  if(!edge&&(random()>.25+patch*.75||(patch<.26&&random()<.65)))return;
  const cx=Math.floor(px/cellSize),cz=Math.floor(pz/cellSize),spacing=2.0+(1-patch)*1.3;let crowded=false;
  for(let dx=-1;dx<=1&&!crowded;dx++)for(let dz=-1;dz<=1&&!crowded;dz++)for(const p of cells.get(`${cx+dx}:${cz+dz}`)||[]){if(Math.hypot(px-p.x,pz-p.z)<spacing){crowded=true;break;}}
  if(crowded)return;
  const variety=random(),id=forestTreeIds[Math.min(4,Math.floor((variety*.7+forestPatch(px+51,pz-23)*.3)*5))],scale=.82+random()*.18;
  // Sample the uphill side as well, embedding the root collar into sloping soil.
  const y=Math.min(groundHeight(px,pz),groundHeight(px+.3,pz),groundHeight(px-.3,pz),groundHeight(px,pz+.3),groundHeight(px,pz-.3))-.035;
  const plant={id,x:px,y,z:pz,scale,rotation:random()*Math.PI*2};plants.push(plant);const key=`${cx}:${cz}`,list=cells.get(key)||[];list.push(plant);cells.set(key,list);
 };
 // Irregular, overlapping front/back layers define a continuous forest edge.
 // Random arc spacing and depth jitter prevent a visible planting ring/grid.
 for(const depth of [1,9,21])for(let angle=0;angle<Math.PI*2;){
  const r=(depth===21?campRadius(angle)+.6:forestEdge(angle)+depth)+random()*1.4;
  place(Math.cos(angle)*r,Math.sin(angle)*r,true);
  angle+=(3.8+random()*1.8)/r;
 }
 for(let attempt=0;attempt<60000&&plants.length<2400;attempt++){
  const angle=random()*Math.PI*2,inner=forestEdge(angle),outer=Math.max(inner+35,campRadius(angle)+2),radius=Math.sqrt(inner*inner+random()*(outer*outer-inner*inner));
  place(Math.cos(angle)*radius,Math.sin(angle)*radius);
 }
 return plants;
}
export function buildForestBorder(scene:T.Scene,collision:T.Group){
 const plants=forestBorderPlacements(),collection=plantCollection(scene,plants,{range:540,detailedRange:55}),understory=buildForestUnderstory(scene);collection.setQuality('high');
 const proxy=new T.CylinderGeometry(1,1,1,8);
 for(const p of plants){if(!insideCamp(p.x,p.z))continue;const trunk=new T.Mesh(proxy);trunk.position.set(p.x,groundHeight(p.x,p.z)+1.3,p.z);trunk.scale.set(.16*p.scale,2.6*p.scale,.16*p.scale);collision.add(trunk);}
 scene.userData.forestBorder={trees:plants.length,varieties:forestTreeIds.length,...understory.stats};return {stats:scene.userData.forestBorder,update(time:number,camera?:T.Vector3){collection.update(time,camera);understory.update(time,camera);},dispose(){collection.dispose();understory.dispose();}};
}
/** Applied after existing wind/terrain shader hooks, preserving their uniforms. */
export function forestAtmosphere(scene:T.Scene){
 const seen=new Set<T.Material>();scene.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(seen.has(m)||m instanceof T.ShaderMaterial||!(m as T.MeshStandardMaterial).fog)continue;seen.add(m);const previous=m.onBeforeCompile,cache=m.customProgramCacheKey();
  m.onBeforeCompile=(s:Parameters<T.Material['onBeforeCompile']>[0],r:T.WebGLRenderer)=>{previous.call(m,s,r);s.vertexShader='varying vec3 forestWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 forestLocal=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    forestLocal=instanceMatrix*forestLocal;
   #endif
   forestWorld=(modelMatrix*forestLocal).xyz;`);
   s.uniforms.compactForestEdge={value:forestEdgeSamples};
   s.fragmentShader=forestEdgeGLSL+'\nvarying vec3 forestWorld;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    float a=atan(forestWorld.z,forestWorld.x);float edge=campForestEdge(a);
    float shade=smoothstep(edge-2.,edge+12.,length(forestWorld.xz))*(1.-smoothstep(2.,7.,forestWorld.y));
    reflectedLight.directDiffuse*=mix(1.,.24,shade);reflectedLight.indirectDiffuse*=mix(1.,.48,shade);`);
  };m.customProgramCacheKey=()=>cache+'-forest-shade-v2';m.needsUpdate=true;
 }});
}

