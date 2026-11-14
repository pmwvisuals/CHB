import * as T from 'three';
/** Clip overlays to the actual terrain triangles, preserving its slopes exactly. */
export function terrainSurface(terrain:T.BufferGeometry){
 const p=terrain.getAttribute('position'),ids=terrain.index!,bins=new Map<string,number[]>(),cell=2;
 const point=(i:number)=>new T.Vector3(p.getX(i),p.getY(i),p.getZ(i));
 const triangles:Array<T.Vector3[]>=[];
 for(let i=0;i<ids.count;i+=3){const t=[point(ids.getX(i)),point(ids.getX(i+1)),point(ids.getX(i+2))],id=triangles.length;triangles.push(t);
  for(let x=Math.floor(Math.min(...t.map(v=>v.x))/cell);x<=Math.floor(Math.max(...t.map(v=>v.x))/cell);x++)for(let z=Math.floor(Math.min(...t.map(v=>v.z))/cell);z<=Math.floor(Math.max(...t.map(v=>v.z))/cell);z++){const key=x+':'+z,list=bins.get(key)||[];list.push(id);bins.set(key,list);}
 }
 const cross=(a:T.Vector3,b:T.Vector3,c:T.Vector3)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 function stamp(shape:T.BufferGeometry,lift:number,floor?:(x:number,z:number)=>number){
  const src=shape.getAttribute('position'),index=shape.index,positions:number[]=[],uv:number[]=[];
  const polygons:number[][]=shape.userData.surfacePolygons||Array.from({length:(index?.count||src.count)/3},(_,i)=>[0,1,2].map(k=>index?index.getX(i*3+k):i*3+k));
  for(const polygon of polygons){const subject=polygon.map(n=>new T.Vector3(src.getX(n),0,src.getZ(n))),candidates=new Set<number>();
   for(let x=Math.floor(Math.min(...subject.map(v=>v.x))/cell);x<=Math.floor(Math.max(...subject.map(v=>v.x))/cell);x++)for(let z=Math.floor(Math.min(...subject.map(v=>v.z))/cell);z<=Math.floor(Math.max(...subject.map(v=>v.z))/cell);z++)for(const id of bins.get(x+':'+z)||[])candidates.add(id);
   for(const id of candidates){const t=triangles[id],den=cross(t[0],t[1],t[2]),sign=Math.sign(den);if(Math.abs(den)<1e-10)continue;let poly=subject.map(v=>v.clone());
    for(let e=0;e<3&&poly.length;e++){const a=t[e],b=t[(e+1)%3],out:T.Vector3[]=[];
     for(let j=0;j<poly.length;j++){const q=poly[j],r=poly[(j+1)%poly.length],dq=cross(a,b,q)*sign,dr=cross(a,b,r)*sign;if(dq>=-1e-8)out.push(q);if((dq>1e-8&&dr< -1e-8)||(dq< -1e-8&&dr>1e-8))out.push(q.clone().lerp(r,dq/(dq-dr)));}poly=out;
    }
    for(let j=1;j+1<poly.length;j++){const tri=[poly[0],poly[j],poly[j+1]];if(Math.abs(cross(...tri as [T.Vector3,T.Vector3,T.Vector3]))<1e-9)continue;
     for(const q of tri){const w0=cross(t[1],t[2],q)/den,w1=cross(t[2],t[0],q)/den,y=t[0].y*w0+t[1].y*w1+t[2].y*(1-w0-w1)+lift;positions.push(q.x,Math.max(y,floor?.(q.x,q.z)??-Infinity),q.z);uv.push(q.x/7.2,q.z/7.2);}
    }
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
 }
 return {stamp,dispose(){bins.clear();triangles.length=0;}};
}
