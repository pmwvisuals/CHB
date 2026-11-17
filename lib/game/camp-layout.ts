import {Vector3} from 'three';
import {shrineTrail} from './shrine-layout';
/** The same routes drive ground surfaces, vegetation clearance and the map. */
export const campRoutes=[
 {name:'Arrival walk',width:5.5,points:[[0,122],[0,0]]},
 {name:'Garden promenade',width:3.8,points:[[0,28],[28,28],[28,-28],[-28,-28],[-28,28],[0,28]]},
 {name:'Wayfarer walk',width:4,points:[[0,32],[-22,37],[-40,64],[-55,64],[-55,60]]},
 {name:'Dining walk',width:4,points:[[0,32],[20,39],[34,55],[46,55],[46,51]]},
 {name:'Lake walk',width:3.8,points:[[0,0],[28,0],[44,5],[55,5]]},
 {name:'Training walk',width:3.4,points:[[-28,0],[-44,-8],[-62,-14],[-67,-20]]},
 {name:'Ember walk',width:3.6,points:[[0,-28],[0,-38],[0,-49]]},
 {name:'Forest walk',width:2.5,points:[[-17,-23],[-25,-47],[-24,-75],[-40,-96],[-40,-108]]},
 {name:'Deepwood entrance',width:2.5,points:[[-40,-108],[-40,-121]]},
 {name:'Shrine trail',width:1.65,points:shrineTrail},
 {name:'Garden walk',width:2.8,points:[[-55,64],[-91,62],[-93,87],[-68,92],[-32,88],[0,96]]},
 {name:'Eastern promenade',width:3.2,points:[[46,55],[61,49],[57,27],[48,15],[55,5]]},
 {name:'Lakeside pavilion walk',width:2.6,points:[[55,5],[55,29],[65,29],[65,35]]},
 {name:'Boat dock walk',width:2.8,points:[[55,5],[52,-5],[53,-12],[53,-18]]},
] as const;
/** Straight axis-aligned legs with exact right-angle corners; no spline interpolation. */
export function routePoints(points:readonly (readonly number[])[]){
 const corners:Vector3[]=[];
 for(const [x,z] of points){const p=new Vector3(x,0,z),a=corners.at(-1);if(a&&Math.abs(a.x-x)>1e-7&&Math.abs(a.z-z)>1e-7)corners.push(Math.abs(x-a.x)>=Math.abs(z-a.z)?new Vector3(x,0,a.z):new Vector3(a.x,0,z));if(!corners.at(-1)?.equals(p))corners.push(p);}
 const lengths=corners.slice(1).map((p,i)=>p.distanceTo(corners[i])),total=lengths.reduce((a,b)=>a+b,0),counts=lengths.map(l=>Math.max(1,Math.floor(l/total*160)));
 while(counts.reduce((a,b)=>a+b,0)<160){let best=0;for(let i=1;i<counts.length;i++)if(lengths[i]/counts[i]>lengths[best]/counts[best])best=i;counts[best]++;}
 const result=[corners[0]];counts.forEach((n,i)=>{for(let j=1;j<=n;j++)result.push(corners[i].clone().lerp(corners[i+1],j/n));});return result;
}
// Circular flower courts are temporarily removed, including their soil and edging.
export const gardenCourts:{x:number;z:number;rx:number;rz:number}[]=[];
export function inGardenCourt(x:number,z:number,pad=0){return gardenCourts.some(g=>((x-g.x)/(g.rx+pad))**2+((z-g.z)/(g.rz+pad))**2<1);}

/** One simple gathering court replaces the pointed islands at the arrival junction. */
export const centralCourt={x:0,z:32,halfWidth:7,halfDepth:6};
export function insideCentralCourt(x:number,z:number,pad=0){return Math.abs(x-centralCourt.x)<=centralCourt.halfWidth+pad&&Math.abs(z-centralCourt.z)<=centralCourt.halfDepth+pad;}
export function centralCourtOutline(){const c=centralCourt;return [[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([x,z])=>new Vector3(c.x+x*c.halfWidth,0,c.z+z*c.halfDepth));}
