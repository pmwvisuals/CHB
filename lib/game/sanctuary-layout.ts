/** Shared by terrain, architecture, paths, navigation and the illustrated map. */
export const sanctuaryExtent=235;
export const templeSites={
 zeus:{x:0,z:-170,region:'Stormwatch Ridge',height:14},
 hera:{x:-43,z:146,region:'The Royal Gardens',height:3},
 poseidon:{x:94,z:5,region:'Mirror Lake Island',height:1.1},
 demeter:{x:-125,z:90,region:'The Harvest Fields',height:2},
 ares:{x:137,z:-125,region:'The Ironwood Encampment',height:4},
 athena:{x:-83,z:10,region:'The Olive Archive',height:3},
 apollo:{x:108,z:128,region:'The Sunlit Terrace',height:7},
 artemis:{x:-174,z:-12,region:'Moonwood Grove',height:4},
 hephaestus:{x:-147,z:-132,region:'The Ember Crater',height:5},
 aphrodite:{x:173,z:89,region:'The Pearl Gardens',height:6},
 hermes:{x:48,z:89,region:'The Travelers’ Crossroads',height:1},
 dionysus:{x:-118,z:-62,region:'The Vineyard Theatre',height:2},
} as const;
export type SiteId=keyof typeof templeSites;
export function sitePlacement(id:SiteId){const s=templeSites[id];return {...s,rotation:id==='poseidon'?-Math.PI/2:Math.atan2(-s.x,-s.z),threshold:id==='poseidon'?.6:4.5};}
export function sitePoint(id:SiteId,x:number,z:number){const p=sitePlacement(id);return {x:p.x+Math.cos(p.rotation)*x+Math.sin(p.rotation)*z,z:p.z-Math.sin(p.rotation)*x+Math.cos(p.rotation)*z};}
export function insideTempleGrounds(x:number,z:number,pad=0){return Object.values(templeSites).some(p=>Math.hypot(x-p.x,z-p.z)<19+pad);}
/** Waypoints avoid the lake, central hall, service buildings and neighboring sites. */
export const templeTrails:Record<SiteId,number[][]>={
 zeus:[[0,-25],[21,-51],[28,-110],[20,-143]],
 hera:[[-6,92],[-23,117]],
 poseidon:[[64,5],[78,5]],
 demeter:[[-55,62],[-95,63],[-106,77]],
 ares:[[18,-18],[57,-44],[103,-63],[122,-102]],
 athena:[[-20,8],[-49,10],[-62,10]],
 apollo:[[12,90],[39,116],[73,122],[91,119]],
 artemis:[[-62,10],[-111,22],[-152,1]],
 hephaestus:[[-68,-35],[-87,-86],[-127,-111]],
 aphrodite:[[60,52],[128,61],[154,78]],
 hermes:[[8,76],[23,76],[36,76]],
 dionysus:[[-67,-35],[-91,-44],[-99,-53]],
};
