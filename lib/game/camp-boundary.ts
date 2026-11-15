/** One outline for planting, terrain, collision and the map. Temples stay put. */
export const forestBeltWidth=28;
const turn=Math.PI*2;
// These stations trace the old perimeter's convex envelope. Rounding in world
// space fills the notches while retaining the trees behind the outer temples.
const perimeterRadii=[193.806,197.946,203.829,213.831,217.195,209.935,206.553,204.609,
 195.941,191.071,187.943,185.014,184.731,187.641,191.231,194.608,196.345,195.753,
 194.312,193.826,194.905,196.458,197.385,201.163,208.716,210.552,206.924,206.884,
 210.431,217.882,219.612,208.546,201.819,198.795,199.206,203.087,208.8,202.22,
 196.494,194.305,195.457,200.053,208.512,204.907,195.636,190.272,188.317,189.6];
const perimeterControls=perimeterRadii.map((r,i)=>({x:Math.cos(i/perimeterRadii.length*turn)*r,z:Math.sin(i/perimeterRadii.length*turn)*r}));
const perimeter=Array.from({length:720},(_,i)=>{
 const f=i/720*perimeterControls.length,k=Math.floor(f),t=f-k,count=perimeterControls.length;
 const a=perimeterControls[(k+count-1)%count],b=perimeterControls[k],c=perimeterControls[(k+1)%count],d=perimeterControls[(k+2)%count];
 const w=[(1-t)**3,3*t**3-6*t*t+4,-3*t**3+3*t*t+3*t+1,t**3];
 const x=(a.x*w[0]+b.x*w[1]+c.x*w[2]+d.x*w[3])/6,z=(a.z*w[0]+b.z*w[1]+c.z*w[2]+d.z*w[3])/6;
 return {x,z,angle:(Math.atan2(z,x)+turn)%turn};
}).sort((a,b)=>a.angle-b.angle);
const forestRadii=[168.6,172.6,174.2,173.6,169.8,163.7,160.4,163,168.7,171.5,170.3,169.9,
 172.7,174.1,168.4,158.2,153,158,166.9,169.4,163.1,155.8,155.5,161.7];
function roundedRadius(angle:number,radii:number[]){
 const count=radii.length,f=((angle/turn)%1+1)%1*count,i=Math.floor(f),t=f-i;
 const a=radii[(i+count-1)%count],b=radii[i],c=radii[(i+1)%count],d=radii[(i+2)%count];
 // A periodic cubic B-spline rounds the joins without overshooting a corner.
 return (a*(1-t)**3+b*(3*t**3-6*t*t+4)+c*(-3*t**3+3*t*t+3*t+1)+d*t**3)/6;
}
export function forestInnerRadius(angle:number){return roundedRadius(angle,forestRadii);}
export function campRadius(angle:number){
 const a=(angle%turn+turn)%turn;
 let lo=0,hi=perimeter.length;
 while(lo<hi){const middle=(lo+hi)>>>1;if(perimeter[middle].angle<a)lo=middle+1;else hi=middle;}
 const p=perimeter[(lo+perimeter.length-1)%perimeter.length],q=perimeter[lo%perimeter.length];
 // Intersect the radial query with the rounded outline's containing segment.
 return (p.x*q.z-p.z*q.x)/(Math.cos(a)*(q.z-p.z)-Math.sin(a)*(q.x-p.x));
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
