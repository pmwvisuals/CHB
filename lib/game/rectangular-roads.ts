import {Vector3} from 'three';
export interface RoadRectangle {x0:number;x1:number;z0:number;z1:number}
/** Merge collinear samples into square-ended rectangular road legs. */
export function roadRectangles(points:Vector3[],width:number):RoadRectangle[]{
 const result:RoadRectangle[]=[],half=width*.72;let start=points[0],end=start,axis='';
 const add=()=>{if(!start.equals(end))result.push({x0:Math.min(start.x,end.x)-half,x1:Math.max(start.x,end.x)+half,z0:Math.min(start.z,end.z)-half,z1:Math.max(start.z,end.z)+half});};
 for(let i=1;i<points.length;i++){const p=points[i],next=Math.abs(p.x-end.x)<1e-6?'z':'x';if(axis&&(next!==axis||(p.x-end.x)*(end.x-start.x)+(p.z-end.z)*(end.z-start.z)<-1e-8)){add();start=end;}axis=next;end=p;}add();return result;
}
export function rectangleOutline(rectangles:RoadRectangle[]){
 const round=(n:number)=>Math.round(n*100000)/100000,xs=[...new Set(rectangles.flatMap(r=>[round(r.x0),round(r.x1)]))].sort((a,b)=>a-b),zs=[...new Set(rectangles.flatMap(r=>[round(r.z0),round(r.z1)]))].sort((a,b)=>a-b),w=xs.length-1,h=zs.length-1,filled=new Uint8Array(w*h),xi=new Map(xs.map((x,i)=>[x,i])),zi=new Map(zs.map((z,i)=>[z,i]));
 for(const r of rectangles)for(let z=zi.get(round(r.z0))!;z<zi.get(round(r.z1))!;z++)for(let x=xi.get(round(r.x0))!;x<xi.get(round(r.x1))!;x++)filled[z*w+x]=1;
 const lines=new Map<string,{a:number;b:number;fixed:number;horizontal:boolean}[]>();
 function edge(horizontal:boolean,fixed:number,a:number,b:number,side:number){const k=horizontal+':'+fixed+':'+side,list=lines.get(k)||[];list.push({a,b,fixed,horizontal});lines.set(k,list);}
 for(let z=0;z<h;z++)for(let x=0;x<w;x++){if(!filled[z*w+x])continue;if(z===0||!filled[(z-1)*w+x])edge(true,zs[z],xs[x],xs[x+1],-1);if(z===h-1||!filled[(z+1)*w+x])edge(true,zs[z+1],xs[x],xs[x+1],1);if(x===0||!filled[z*w+x-1])edge(false,xs[x],zs[z],zs[z+1],-1);if(x===w-1||!filled[z*w+x+1])edge(false,xs[x+1],zs[z],zs[z+1],1);}
 const merged:{a:number;b:number;fixed:number;horizontal:boolean}[]=[];
 for(const list of lines.values()){list.sort((a,b)=>a.a-b.a);let current={...list[0]};for(const next of list.slice(1)){if(Math.abs(current.b-next.a)<1e-4)current.b=next.b;else{merged.push(current);current={...next};}}merged.push(current);}return merged;
}
