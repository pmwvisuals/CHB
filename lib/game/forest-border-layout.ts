/** Irregular inner canopy line; the outer scenery disappears into fog before it ends. */
export function forestEdge(angle:number){return 197+12*Math.sin(angle*3+.4)+8*Math.sin(angle*7);}
export function forestDepth(x:number,z:number){return Math.hypot(x,z)-forestEdge(Math.atan2(z,x));}
export function forestShade(x:number,z:number){const t=Math.max(0,Math.min(1,(forestDepth(x,z)+4)/22));return t*t*(3-2*t);}
