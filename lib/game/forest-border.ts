import * as T from 'three';
import {groundHeight} from './data';
import {insideTempleGrounds} from './sanctuary-layout';
import {roadCover} from './ground-surface';
import {forestDepth} from './forest-border-layout';
import {plantCollection,type PlantPlacement} from './vegetation';
export function forestBorderPlacements(){
 const plants:PlantPlacement[]=[];let seed=8013;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 // Staggered, jittered bands overlap crowns without an obvious row or fence pattern.
 for(let z=-312;z<312;z+=10)for(let x=-312;x<312;x+=10){const px=x+(random()-.5)*7,pz=z+(random()-.5)*7,depth=forestDepth(px,pz);if(depth<0||depth>92||insideTempleGrounds(px,pz,11)||roadCover(px,pz)>.05)continue;
  const large=random()>.38,scale=large?1.12+random()*.30:.65+random()*.22;
  // Sample the uphill side as well, embedding the root collar into sloping soil.
  const y=Math.min(groundHeight(px,pz),groundHeight(px+.55,pz),groundHeight(px-.55,pz),groundHeight(px,pz+.55),groundHeight(px,pz-.55))-.22;
  plants.push({id:large?'forest_oak':'forest_fir',x:px,y,z:pz,scale,rotation:random()*Math.PI*2});
 }return plants;
}
export function buildForestBorder(scene:T.Scene,collision:T.Group){
 const plants=forestBorderPlacements(),collection=plantCollection(scene,plants,{range:620,canopyLayers:2});collection.setQuality('high');
 const proxy=new T.CylinderGeometry(1,1,1,8);
 for(const p of plants){if(Math.abs(p.x)>235||Math.abs(p.z)>235)continue;const trunk=new T.Mesh(proxy);trunk.position.set(p.x,groundHeight(p.x,p.z)+5,p.z);trunk.scale.set(.65*p.scale,10,.65*p.scale);collision.add(trunk);}
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
    float shade=smoothstep(edge-4.,edge+18.,length(forestWorld.xz))*(1.-smoothstep(16.,34.,forestWorld.y));
    reflectedLight.directDiffuse*=mix(1.,.16,shade);reflectedLight.indirectDiffuse*=mix(1.,.32,shade);`);
   s.fragmentShader=s.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
    #ifdef USE_FOG
     float forestRadius=length(forestWorld.xz);
     float outerMist=smoothstep(205.,282.,forestRadius);
     float canopyMist=outerMist*mix(.65,1.,smoothstep(5.,32.,forestWorld.y));
     float travelMist=1.-exp(-pow(length(cameraPosition-forestWorld)*.006,2.));
     float mist=max(canopyMist,travelMist*smoothstep(178.,225.,forestRadius));
     mist=max(mist,smoothstep(265.,286.,forestRadius));
     gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,mist);
    #endif`);
  };m.customProgramCacheKey=()=>cache+'-forest-mist-v1';m.needsUpdate=true;
 }});
}

