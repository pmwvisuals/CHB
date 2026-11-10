import {CatmullRomCurve3,Vector3,MathUtils} from 'three';
import type {PlantPlacement} from './vegetation';

export const deepForest={radius:260,sceneryRadius:330,terrainSize:720,spawn:{x:0,z:216}};
const smooth=(a:number,b:number,x:number)=>MathUtils.smoothstep(x,a,b);
const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
export function forestPatchNoise(x:number,z:number){const ix=Math.floor(x),iz=Math.floor(z),u=smooth(0,1,x-ix),v=smooth(0,1,z-iz);return MathUtils.lerp(MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),u),MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),u),v);}
export function deepForestHeight(x:number,z:number){return 1.8*Math.sin(x*.022)*Math.cos(z*.017)+Math.sin(x*.055+.7)*Math.sin(z*.047)+4*Math.exp(-((x-92)**2+(z+70)**2)/1800)+2.5*Math.exp(-((x+130)**2+(z-90)**2)/2200)-2.2*Math.exp(-((x+65)**2+(z+45)**2)/2500)+.12*Math.sin(x*.19)*Math.sin(z*.17)+12*smooth(240,282,Math.hypot(x,z));}
export const deepForestHeightGLSL=`float forestGround(vec2 p){return 1.8*sin(p.x*.022)*cos(p.y*.017)+sin(p.x*.055+.7)*sin(p.y*.047)+4.*exp(-dot(p-vec2(92.,-70.),p-vec2(92.,-70.))/1800.)+2.5*exp(-dot(p-vec2(-130.,90.),p-vec2(-130.,90.))/2200.)-2.2*exp(-dot(p-vec2(-65.,-45.),p-vec2(-65.,-45.))/2500.)+.12*sin(p.x*.19)*sin(p.y*.17)+12.*smoothstep(240.,282.,length(p));}`;
export const forestClearings=[{x:0,z:216,r:9},{x:6,z:118,r:12},{x:-65,z:-45,r:16},{x:92,z:-70,r:11},{x:-130,z:90,r:10},{x:48,z:-182,r:12}];
const coordinates=[[[0,224],[-12,174],[6,118],[-30,60],[-20,10],[-65,-45],[-36,-102],[48,-182]],[[6,118],[-70,136],[-130,90],[-154,15],[-65,-45]],[[-20,10],[52,35],[110,-8],[92,-70],[35,-110],[-36,-102]],[[92,-70],[171,-129],[184,-192]]];
export const forestTrails=coordinates.map(points=>new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,0,z))).getPoints(220));
const trailCells=new Map<string,Vector3[]>();for(const path of forestTrails)for(const p of path){const x=Math.floor(p.x/12),z=Math.floor(p.z/12);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const k=(x+dx)+':'+(z+dz),list=trailCells.get(k)||[];list.push(p);trailCells.set(k,list);}}
export function forestTrailDistance(x:number,z:number){let distance=Infinity;for(const p of trailCells.get(Math.floor(x/12)+':'+Math.floor(z/12))||[])distance=Math.min(distance,Math.hypot(p.x-x,p.z-z));return distance;}
export function clearingDistance(x:number,z:number){return Math.min(...forestClearings.map(c=>Math.hypot(x-c.x,z-c.z)-c.r));}
export function forestCanopyCover(x:number,z:number){const gap=1-smooth(-6,7,clearingDistance(x,z));return (.80+.18*forestPatchNoise(x*.018,z*.018))*(1-gap*.72);}

export function deepForestPlacements(){
 let seed=772913;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const trees:PlantPlacement[]=[],floor:PlantPlacement[]=[],cells=new Map<string,PlantPlacement[]>(),ids=['forest_oak','forest_hornbeam','forest_oak','forest_cedar','forest_fir','forest_spruce'] as const;
 for(let attempt=0;attempt<280000&&trees.length<5200;attempt++){
  const a=random()*Math.PI*2,r=Math.sqrt(random())*deepForest.sceneryRadius,x=Math.cos(a)*r,z=Math.sin(a)*r,patch=forestPatchNoise(x*.022,z*.022);
  if(forestTrailDistance(x,z)<3.7||clearingDistance(x,z)<0||random()>.45+patch*.55)continue;
  const cx=Math.floor(x/7),cz=Math.floor(z/7);let crowded=false;const spacing=5.4+(1-patch)*1.7;
  for(let dx=-1;dx<=1&&!crowded;dx++)for(let dz=-1;dz<=1&&!crowded;dz++)if((cells.get((cx+dx)+':'+(cz+dz))||[]).some(p=>Math.hypot(p.x-x,p.z-z)<spacing))crowded=true;
  if(crowded)continue;const scale=2.9+random()*.85,id=ids[Math.floor(random()*ids.length)],y=Math.min(deepForestHeight(x,z),deepForestHeight(x+.5,z),deepForestHeight(x-.5,z),deepForestHeight(x,z+.5),deepForestHeight(x,z-.5))-.045;
  const p={id,x,y,z,scale,rotation:random()*Math.PI*2};trees.push(p);const key=cx+':'+cz,list=cells.get(key)||[];list.push(p);cells.set(key,list);
 }
 for(let i=0;i<65000&&floor.length<20000;i++){
  const a=random()*Math.PI*2,r=Math.sqrt(random())*300,x=Math.cos(a)*r,z=Math.sin(a)*r,patch=forestPatchNoise(x*.038,z*.038),choice=random();if(forestTrailDistance(x,z)<1.7||Math.hypot(x,z-216)<5||random()>.25+.7*patch)continue;
  const id=choice<.56?'forest_litter':choice<.79?'forest_fern':choice<.96?'forest_bracken':'forest_bramble';floor.push({id,x,z,y:deepForestHeight(x,z)-.02,scale:id==='forest_bramble'?.30+random()*.25:.45+random()*.55,rotation:random()*Math.PI*2});
 }
 return {trees,floor};
}

export const forestMistPockets=[{x:-25,z:165,r:23},{x:40,z:95,r:29},{x:-100,z:90,r:26},{x:-65,z:-45,r:34},{x:40,z:-20,r:20},{x:112,z:-87,r:28},{x:-155,z:-45,r:31},{x:45,z:-170,r:32},{x:185,z:36,r:25},{x:-15,z:-225,r:29},{x:-210,z:135,r:30},{x:215,z:-170,r:38}];
export function forestMistDensity(x:number,y:number,z:number,time=0){
 const height=y-deepForestHeight(x,z);if(height<-.3||height>11)return 0;let pockets=0;for(const p of forestMistPockets)pockets=Math.max(pockets,1-smooth(p.r*.35,p.r,Math.hypot(x-p.x,z-p.z)));
 const billow=.55+.45*forestPatchNoise(x*.045+time*.004,z*.045);return (pockets*.008*billow+smooth(225,325,Math.hypot(x,z))*.028)*(1-smooth(1.5,8,height));
}
export const deepForestMistDensityGLSL=`${deepForestHeightGLSL}
 float density(vec3 p){float h=p.y-forestGround(p.xz);if(h<-.3||h>11.)return 0.;float pockets=0.;${forestMistPockets.map(p=>`pockets=max(pockets,1.-smoothstep(${(p.r*.35).toFixed(3)},${p.r}.,length(p.xz-vec2(${p.x}.,${p.z}.))));`).join('')}
 float billow=.55+.45*noise3(p*vec3(.045,.13,.045)+vec3(mistTime*.004,0.,0.));return (pockets*.008*billow+smoothstep(225.,325.,length(p.xz))*.028)*(1.-smoothstep(1.5,8.,h));}`;
