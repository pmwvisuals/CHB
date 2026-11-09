import * as T from 'three';
import {groundHeight} from './data';
import {insideTempleGrounds} from './sanctuary-layout';
import {roadCover} from './ground-surface';
import {forestDepth} from './forest-border-layout';
import {plantCollection,type PlantPlacement} from './vegetation';
export function forestBorderPlacements(){
 const plants:PlantPlacement[]=[];let seed=8013;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 // Staggered, jittered bands overlap crowns without an obvious row or fence pattern.
 for(let z=-302;z<302;z+=4.6)for(let x=-302;x<302;x+=4.6){const px=x+(random()-.5)*2.1,pz=z+(random()-.5)*2.1,depth=forestDepth(px,pz);if(depth<0||depth>76||insideTempleGrounds(px,pz,7)||roadCover(px,pz)>.05)continue;
  const large=random()>.44,scale=large?.92+random()*.08:.80+random()*.12;
  // Sample the uphill side as well, embedding the root collar into sloping soil.
  const y=Math.min(groundHeight(px,pz),groundHeight(px+.3,pz),groundHeight(px-.3,pz),groundHeight(px,pz+.3),groundHeight(px,pz-.3))-.035;
  plants.push({id:large?'forest_oak':'forest_fir',x:px,y,z:pz,scale,rotation:random()*Math.PI*2});
 }return plants;
}
export function buildForestBorder(scene:T.Scene,collision:T.Group){
 const plants=forestBorderPlacements(),collection=plantCollection(scene,plants,{range:540,detailedRange:55});collection.setQuality('high');
 const proxy=new T.CylinderGeometry(1,1,1,8);
 for(const p of plants){if(Math.abs(p.x)>235||Math.abs(p.z)>235)continue;const trunk=new T.Mesh(proxy);trunk.position.set(p.x,groundHeight(p.x,p.z)+1.3,p.z);trunk.scale.set(.16*p.scale,2.6*p.scale,.16*p.scale);collision.add(trunk);}
 scene.userData.forestBorder={trees:plants.length,varieties:2};return collection;
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
   s.fragmentShader='varying vec3 forestWorld;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    float a=atan(forestWorld.z,forestWorld.x);float edge=197.+12.*sin(a*3.+.4)+8.*sin(a*7.);
    float shade=smoothstep(edge-2.,edge+12.,length(forestWorld.xz))*(1.-smoothstep(2.,7.,forestWorld.y));
    reflectedLight.directDiffuse*=mix(1.,.24,shade);reflectedLight.indirectDiffuse*=mix(1.,.48,shade);`);
  };m.customProgramCacheKey=()=>cache+'-forest-shade-v2';m.needsUpdate=true;
 }});
}

