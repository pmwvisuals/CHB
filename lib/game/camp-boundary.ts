import {templeSites} from './sanctuary-layout';

/** One outline for planting, terrain, collision and the map. Temples stay put. */
export const forestBeltWidth=28;
const turn=Math.PI*2;
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const anchors=[
 {x:templeSites.ares.x,z:templeSites.ares.z,radius:155,width:.28},
 {x:templeSites.aphrodite.x,z:templeSites.aphrodite.z,radius:173,width:.23},
 {x:templeSites.hephaestus.x,z:templeSites.hephaestus.z,radius:167,width:.28},
 {x:-40,z:-121,radius:126,width:.14},
];
export function forestInnerRadius(angle:number){
 let r=166+5*Math.sin(angle*3+.4)+3*Math.sin(angle*7);
 for(const a of anchors){const d=wrap(angle-Math.atan2(a.z,a.x)),w=Math.exp(-Math.pow(d/a.width,2));r+=(a.radius-r)*w;}
 // Retain generous ground behind the other outer temples. The three named
 // forest-edge temples deliberately sit within, or immediately beside, trees.
 for(const [id,s] of Object.entries(templeSites)){
  if(['ares','aphrodite','hephaestus'].includes(id))continue;
  const distance=Math.hypot(s.x,s.z);if(distance<150)continue;
  const d=wrap(angle-Math.atan2(s.z,s.x)),w=Math.exp(-Math.pow(d/.13,2));
  r=Math.max(r,r+(distance+13-r)*w);
 }
 return r;
}
export function campRadius(angle:number){
 let r=forestInnerRadius(angle)+forestBeltWidth-3;
 const x=Math.cos(angle),z=Math.sin(angle);
 // Local bulges preserve every foundation and its decorative grounds.
 for(const site of Object.values(templeSites)){
  const along=site.x*x+site.z*z,cross=site.x*z-site.z*x,pad=24;
  if(along>0&&Math.abs(cross)<pad)r=Math.max(r,along+Math.sqrt(pad*pad-cross*cross));
 }
 return r;
}
export function insideCamp(x:number,z:number,pad=0){return Math.hypot(x,z)<=campRadius(Math.atan2(z,x))+pad;}
export function insideCampTerrain(x:number,z:number,pad=0){return insideCamp(x,z,6+pad);}
export function boundaryContour(offset=0,steps=240){return Array.from({length:steps},(_,i)=>{const a=i/steps*turn,r=campRadius(a)+offset;return [Math.cos(a)*r,Math.sin(a)*r];});}
export function forestContour(steps=240){return Array.from({length:steps},(_,i)=>{const a=i/steps*turn,r=forestInnerRadius(a);return [Math.cos(a)*r,Math.sin(a)*r];});}

// The same sampled edge drives browser shading/mist; no independent old ring.
export const forestEdgeSamples=Array.from({length:128},(_,i)=>forestInnerRadius(i/128*turn));
export const forestEdgeGLSL=`uniform float compactForestEdge[128];float campForestEdge(float a){
 float f=mod(a+6.28318530718,6.28318530718)/6.28318530718*128.;
 int k=int(floor(f));return mix(compactForestEdge[k],compactForestEdge[(k+1)-((k+1)/128)*128],fract(f));
}`;
