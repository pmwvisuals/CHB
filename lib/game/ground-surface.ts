import {streetRectangles} from './camp-streets';
import {groundHeight} from './data';
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function roadCover(x:number,z:number){let cover=0;for(const r of streetRectangles){const d=Math.hypot(Math.max(r.x0-x,0,x-r.x1),Math.max(r.z0-z,0,z-r.z1));cover=Math.max(cover,1-smooth(0,.45,d));}return cover;}
/** Rise/run: sample at the same physical scale as the triangulated terrain. */
export function terrainSlope(x:number,z:number){const d=.8;return Math.hypot((groundHeight(x+d,z)-groundHeight(x-d,z))/(2*d),(groundHeight(x,z+d)-groundHeight(x,z-d))/(2*d));}
// Rounded hills stay green. Soil only emerges on faces approaching a true cliff.
export function slopeCover(slope:number){return 1-smooth(.62,1.28,slope);}
export function surfaceCover(x:number,z:number){
 const lake=Math.sqrt(((x-91)/31)**2+(z/47)**2),island=Math.hypot(x-94,z-5);
 const shore=smooth(1.04,1.16,lake),islandGreen=1-smooth(11.5,14,island);
 const wet=Math.max(shore,islandGreen),forge=smooth(19,34,Math.hypot(x+147,z+132));
 return slopeCover(terrainSlope(x,z))*(1-roadCover(x,z))*wet*forge;
}
