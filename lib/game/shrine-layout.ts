/** The hidden shrine shares one site across terrain, planting, discovery and export. */
export const forgottenShrine={x:-92,z:-155,rotation:Math.atan2(92,155),height:.6,clearingRadius:8.5};
export function shrineDistance(x:number,z:number){return Math.hypot(x-forgottenShrine.x,z-forgottenShrine.z);}
export function shrinePoint(x:number,z:number){const s=forgottenShrine,c=Math.cos(s.rotation),t=Math.sin(s.rotation);return {x:s.x+c*x+t*z,z:s.z-t*x+c*z};}
const alignment=shrinePoint(0,16),entrance=shrinePoint(0,3.3);
export const shrineTrail=[[-40,-108],[-59,-122],[-72,-137],[alignment.x,alignment.z],[entrance.x,entrance.z]];

/** Root clearance includes the crown overhang beside the narrow footpath. */
export function shrineApproachDistance(x:number,z:number){let distance=Infinity;for(let i=1;i<shrineTrail.length;i++){const a=shrineTrail[i-1],b=shrineTrail[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));distance=Math.min(distance,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return distance;}
