import {CatmullRomCurve3,Vector3} from 'three';
import {shrineTrail} from './shrine-layout';
/** The same routes drive ground surfaces, vegetation clearance and the map. */
export const campRoutes=[
 {name:'Arrival walk',width:5.5,points:[[0,122],[0,96],[3,76],[0,52],[0,15],[0,0]]},
 {name:'Garden promenade',width:3.8,points:[[0,28],[21,22],[28,0],[21,-22],[0,-28],[-21,-22],[-28,0],[-21,22],[0,28]]},
 {name:'Wayfarer walk',width:4,points:[[0,32],[-22,37],[-40,64],[-55,64],[-55,60]]},
 {name:'Dining walk',width:4,points:[[0,32],[20,39],[34,55],[46,55],[46,51]]},
 {name:'Lake walk',width:3.8,points:[[0,0],[28,0],[44,5],[55,5]]},
 {name:'Training walk',width:3.4,points:[[-28,0],[-44,-8],[-62,-14],[-67,-20]]},
 {name:'Ember walk',width:3.6,points:[[0,-28],[0,-38],[0,-49]]},
 {name:'Forest walk',width:2.5,points:[[-17,-23],[-25,-47],[-24,-75],[-40,-96],[-40,-108]]},
 {name:'Shrine trail',width:1.65,points:shrineTrail},
 {name:'Garden walk',width:2.8,points:[[-55,64],[-91,62],[-93,87],[-68,92],[-32,88],[0,96]]},
 {name:'Eastern promenade',width:3.2,points:[[46,55],[61,49],[57,27],[48,15],[55,5]]},
 {name:'Lakeside pavilion walk',width:2.6,points:[[55,5],[55,14],[58,25],[65,29],[65,35]]},
 {name:'Boat dock walk',width:2.8,points:[[55,5],[52,-5],[53,-12],[53,-18]]},
] as const;
export function routePoints(points:readonly (readonly number[])[]){return new CatmullRomCurve3(points.map(p=>new Vector3(p[0],0,p[1]))).getPoints(160);}
// Circular flower courts are temporarily removed, including their soil and edging.
export const gardenCourts:{x:number;z:number;rx:number;rz:number}[]=[];
export function inGardenCourt(x:number,z:number,pad=0){return gardenCourts.some(g=>((x-g.x)/(g.rx+pad))**2+((z-g.z)/(g.rz+pad))**2<1);}

/** One simple gathering court replaces the pointed islands at the arrival junction. */
export const centralCourt={x:0,z:32,halfWidth:15,halfDepth:13};
export function insideCentralCourt(x:number,z:number,pad=0){return Math.abs(x-centralCourt.x)<=centralCourt.halfWidth+pad&&Math.abs(z-centralCourt.z)<=centralCourt.halfDepth+pad;}
export function centralCourtOutline(){const c=centralCourt;return [[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([x,z])=>new Vector3(c.x+x*c.halfWidth,0,c.z+z*c.halfDepth));}
