import {Vector3} from 'three';
import {sitePoint,type SiteId} from './sanctuary-layout';
import {shrineTrail} from './shrine-layout';
/** The same routes drive ground surfaces, vegetation clearance and the map. */
type StreetRoute={name:string;width:number;kind:'main'|'access';points:number[][]};
const entry=(id:SiteId)=>{const p=sitePoint(id,0,16);return [p.x,p.z];};
const templeAccess=(id:SiteId,points:number[][]):StreetRoute=>{const a=entry(id),e=sitePoint(id,0,9.8);return {name:id+' approach',kind:'access',width:1.9,points:[...points,a,[e.x,e.z]]};};
/** A single authored connected tree: one main street, only destination access branches. */
export const campRoutes:StreetRoute[]=[
 {name:'Main street',kind:'main',width:3.2,points:[[0,122],[0,20],[-24,20],[-24,-95],[-40,-95],[-40,-121]]},
 {name:'Great Hall entrance',kind:'access',width:2.2,points:[[-24,14],[0,14],[0,10.8]]},
 {name:'West service lane',kind:'access',width:2.2,points:[[0,64],[-146,64],[-146,-10]]},
 {name:'Wayfarer walk',kind:'access',width:2.0,points:[[-55,64],[-55,60]]},
 {name:'East service lane',kind:'access',width:2.2,points:[[0,64],[64,64],[64,108]]},
 {name:'Dining walk',kind:'access',width:2.0,points:[[46,64],[46,51]]},
 {name:'Training walk',kind:'access',width:2.0,points:[[-24,-12],[-96,-12],[-96,-110]]},
 {name:'Training entrance',kind:'access',width:2.0,points:[[-67,-12],[-67,-20]]},
 {name:'Ember walk',kind:'access',width:1.8,points:[[-24,-62],[-15,-62]]},
 {name:'Lake walk',kind:'access',width:2.0,points:[[0,20],[34,20],[34,5],[55,5]]},
 {name:'Lakeside pavilion walk',kind:'access',width:1.8,points:[[55,5],[55,29],[65,29],[65,35]]},
 {name:'Boat dock walk',kind:'access',width:1.8,points:[[53,5],[53,-18]]},
 {name:'Shrine trail',kind:'access',width:1.3,points:shrineTrail},
 templeAccess('zeus',[[-24,-90],[0,-90]]),
 templeAccess('hera',[[0,96],[-26,96],[-26,entry('hera')[1]]]),
 templeAccess('demeter',[[-110,64],[-110,entry('demeter')[1]]]),
 templeAccess('athena',[[-24,entry('athena')[1]]]),
 templeAccess('artemis',[[-146,-10],[-146,entry('artemis')[1]]]),
 templeAccess('dionysus',[[-96,entry('dionysus')[1]]]),
 templeAccess('hephaestus',[[-96,-110],[-128,-110],[-128,entry('hephaestus')[1]]]),
 templeAccess('hermes',[[entry('hermes')[0],64]]),
 templeAccess('apollo',[[64,108],[entry('apollo')[0],108]]),
 templeAccess('aphrodite',[[64,64],[150,64],[150,entry('aphrodite')[1]]]),
 templeAccess('ares',[[-24,-82],[110,-82],[110,entry('ares')[1]]])
];
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

/** Legacy compatibility: the former central court is disabled. */
export const centralCourt={x:0,z:32,halfWidth:0,halfDepth:0};
export function insideCentralCourt(x:number,z:number,pad=0){return false;}
export function centralCourtOutline(){const c=centralCourt;return [[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([x,z])=>new Vector3(c.x+x*c.halfWidth,0,c.z+z*c.halfDepth));}
