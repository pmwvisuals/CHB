/** Irregular inner canopy line; the outer scenery disappears into fog before it ends. */
export function forestEdge(angle:number){return 197+12*Math.sin(angle*3+.4)+8*Math.sin(angle*7);}
export function forestDepth(x:number,z:number){return Math.hypot(x,z)-forestEdge(Math.atan2(z,x));}
export function forestShade(x:number,z:number){const t=Math.max(0,Math.min(1,(forestDepth(x,z)+4)/22));return t*t*(3-2*t);}
/** Continuous pockets of thick growth and small clearings, shared by each layer. */
export function forestPatch(x:number,z:number){
 const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(a:number,b:number)=>{const i=Math.floor(a),j=Math.floor(b);let u=a-i,v=b-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v;};
 return .7*noise(x*.044+17,z*.044-9)+.3*noise(x*.12-4,z*.12+13);
}
