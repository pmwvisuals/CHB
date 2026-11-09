/** Footprints shared by architecture, planting clearance and dock spawn heights. */
export function inMainLandmark(x:number,z:number,pad=0){
 return (Math.abs(x+67)<23+pad&&Math.abs(z+34)<23+pad)
  ||(x>42-pad&&x<78+pad&&z>-32-pad&&z<-10+pad)
  ||Math.hypot(x-65,z-35)<7+pad;
}
export const dock={start:53,rampEnd:60,end:75,z:-18,halfWidth:2.1,height:1.12};
export function dockWalkHeight(x:number,z:number,ground:(x:number,z:number)=>number){
 if(Math.abs(z-dock.z)>dock.halfWidth||x<dock.start||x>dock.end)return undefined;
 const shore=ground(dock.start,z)+.055,t=Math.max(0,Math.min(1,(x-dock.start)/(dock.rampEnd-dock.start)));
 return shore+(dock.height-shore)*t;
}
