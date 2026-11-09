import {CatmullRomCurve3,Vector3} from 'three';
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
 {name:'Garden walk',width:2.8,points:[[-55,64],[-91,62],[-93,87],[-68,92],[-32,88],[0,96]]},
 {name:'Eastern promenade',width:3.2,points:[[46,55],[61,49],[57,27],[48,15],[55,5]]},
 {name:'Lakeside pavilion walk',width:2.6,points:[[55,5],[55,14],[58,25],[65,29],[65,35]]},
 {name:'Boat dock walk',width:2.8,points:[[55,5],[52,-5],[53,-12],[53,-18]]},
] as const;
export function routePoints(points:readonly (readonly number[])[]){return new CatmullRomCurve3(points.map(p=>new Vector3(p[0],0,p[1]))).getPoints(160);}
export const gardenCourts=[{x:-15,z:43,rx:6,rz:10},{x:15,z:43,rx:6,rz:10},{x:-18,z:-15,rx:4,rz:5},{x:18,z:-15,rx:4,rz:5}];
export function inGardenCourt(x:number,z:number,pad=0){return gardenCourts.some(g=>((x-g.x)/(g.rx+pad))**2+((z-g.z)/(g.rz+pad))**2<1);}
