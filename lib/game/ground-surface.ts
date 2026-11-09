import {campRoutes,routePoints} from './camp-layout';
import {templeTrails,sitePoint,type SiteId} from './sanctuary-layout';
import {groundHeight} from './data';

const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
type Segment={x:number;z:number;dx:number;dz:number;length2:number;width:number};
const cells=new Map<string,Segment[]>(),cellSize=10;
const routes=[...campRoutes.map(r=>({points:r.points,width:r.width})),...Object.entries(templeTrails).filter(([id])=>id!=='poseidon').map(([id,points])=>{const p=sitePoint(id as SiteId,0,16);return {points:[...points,[p.x,p.z]],width:2.8};})];
for(const route of routes){const points=routePoints(route.points);for(let i=1;i<points.length;i++){
 const a=points[i-1],b=points[i],segment={x:a.x,z:a.z,dx:b.x-a.x,dz:b.z-a.z,length2:a.distanceToSquared(b),width:route.width};
 const pad=route.width*.75+1;
 for(let x=Math.floor((Math.min(a.x,b.x)-pad)/cellSize);x<=Math.floor((Math.max(a.x,b.x)+pad)/cellSize);x++)for(let z=Math.floor((Math.min(a.z,b.z)-pad)/cellSize);z<=Math.floor((Math.max(a.z,b.z)+pad)/cellSize);z++){
  const key=x+':'+z,list=cells.get(key)||[];list.push(segment);cells.set(key,list);
 }
}}
export function roadCover(x:number,z:number){let cover=0;for(const s of cells.get(Math.floor(x/cellSize)+':'+Math.floor(z/cellSize))||[]){
 const t=Math.max(0,Math.min(1,((x-s.x)*s.dx+(z-s.z)*s.dz)/(s.length2||1))),d=Math.hypot(x-s.x-t*s.dx,z-s.z-t*s.dz);
 cover=Math.max(cover,1-smooth(s.width*.49,s.width*.76+.4,d));
}return cover;}
/** Rise/run: sample at the same physical scale as the triangulated terrain. */
export function terrainSlope(x:number,z:number){const d=.8;return Math.hypot((groundHeight(x+d,z)-groundHeight(x-d,z))/(2*d),(groundHeight(x,z+d)-groundHeight(x,z-d))/(2*d));}
export function slopeCover(slope:number){return 1-smooth(.25,.60,slope);}
export function surfaceCover(x:number,z:number){
 const lake=Math.sqrt(((x-91)/31)**2+(z/47)**2),island=Math.hypot(x-94,z-5);
 const shore=smooth(1.04,1.16,lake),islandGreen=1-smooth(11.5,14,island);
 const wet=Math.max(shore,islandGreen),forge=smooth(19,34,Math.hypot(x+147,z+132));
 return slopeCover(terrainSlope(x,z))*(1-roadCover(x,z))*wet*forge;
}
