import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {groundHeight as h} from './data';

export interface BorderRoute {points:T.Vector3[];width:number}
export interface RoadKerb {x:number;z:number;route:number;side:number;forward:T.Vector3}
const spacing=1.04;

/** Arc-length spacing keeps the edging continuous on both long and short routes. */
export function roadBorderPlacements(routes:BorderRoute[]){
 const cells=new Map<string,{a:T.Vector3;b:T.Vector3;route:number;width:number}[]>(),cell=8;
 routes.forEach((r,route)=>{for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],pad=r.width*.72+.65,segment={a,b,route,width:r.width};
  for(let x=Math.floor((Math.min(a.x,b.x)-pad)/cell);x<=Math.floor((Math.max(a.x,b.x)+pad)/cell);x++)for(let z=Math.floor((Math.min(a.z,b.z)-pad)/cell);z<=Math.floor((Math.max(a.z,b.z)+pad)/cell);z++){
   const key=x+':'+z,list=cells.get(key)||[];list.push(segment);cells.set(key,list);
  }
 }});
 const result:RoadKerb[]=[],occupied=new Map<string,RoadKerb[]>();
 routes.forEach((route,id)=>{
  const lengths=[0];for(let i=1;i<route.points.length;i++)lengths.push(lengths[i-1]+route.points[i].distanceTo(route.points[i-1]));
  const total=lengths.at(-1)!,closed=route.points[0].distanceTo(route.points.at(-1)!)<.1;
  let segment=1;
  for(let d=closed?spacing*.5:1.6;d<total-(closed?0:1.6);d+=spacing){
   while(segment<lengths.length-1&&lengths[segment]<d)segment++;
   const a=route.points[segment-1],b=route.points[segment],t=(d-lengths[segment-1])/(lengths[segment]-lengths[segment-1]),p=a.clone().lerp(b,t),forward=b.clone().sub(a).normalize();
   for(const side of [-1,1]){
    const edge=route.width*.72+.15,x=p.x+forward.z*edge*side,z=p.z-forward.x*edge*side;
    // Open junctions completely: a kerb must never cut across a joining road.
    const crossing=(cells.get(Math.floor(x/cell)+':'+Math.floor(z/cell))||[]).some(s=>{
     if(s.route===id)return false;const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,u=T.MathUtils.clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz||1),0,1);
     return Math.hypot(x-s.a.x-dx*u,z-s.a.z-dz*u)<s.width*.72+.65;
    });if(crossing)continue;
    const ix=Math.floor(x),iz=Math.floor(z);let overlap=false;
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if((occupied.get((ix+dx)+':'+(iz+dz))||[]).some(k=>Math.hypot(x-k.x,z-k.z)<.65))overlap=true;
    if(overlap)continue;const k={x,z,route:id,side,forward};result.push(k);const key=ix+':'+iz,list=occupied.get(key)||[];list.push(k);occupied.set(key,list);
   }
  }
 });return result;
}

/** Chamfered limestone with a restrained carved Greek-key ribbon. */
export function roadKerbGeometry(){
 const shape=new T.Shape(),w=.18,l=.47,c=.065;
 shape.moveTo(-w+c,-l);shape.lineTo(w-c,-l);shape.lineTo(w,-l+c);shape.lineTo(w,l-c);shape.lineTo(w-c,l);shape.lineTo(-w+c,l);shape.lineTo(-w,l-c);shape.lineTo(-w,-l+c);shape.closePath();
 const body=new T.ExtrudeGeometry(shape,{depth:.135,bevelEnabled:true,bevelSize:.023,bevelThickness:.023,bevelSegments:2,steps:1});body.rotateX(-Math.PI/2);body.translate(0,.023,0);
 const parts:T.BufferGeometry[]=[];
 function add(g:T.BufferGeometry,color:string){const flat=g.index?g.toNonIndexed():g;flat.deleteAttribute('uv');const c=new T.Color(color),p=flat.getAttribute('position'),colors=[];for(let i=0;i<p.count;i++){const shade=.95+.05*Math.sin(p.getX(i)*17+p.getZ(i)*29);colors.push(c.r*shade,c.g*shade,c.b*shade);}flat.setAttribute('color',new T.Float32BufferAttribute(colors,3));parts.push(flat);}
 add(body,'#c8bea6');
 const key=[[-.105,-.32],[.105,-.32],[.105,-.09],[-.055,-.09],[-.055,.15],[.105,.15],[.105,.32],[-.105,.32]];
 for(let i=1;i<key.length;i++){const [x,z]=key[i-1],[xx,zz]=key[i],g=new T.BoxGeometry(Math.abs(xx-x)+.018,.004,Math.abs(zz-z)+.018);g.translate((x+xx)/2,.183,(z+zz)/2);add(g,'#94856b');}
 const merged=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());merged.computeBoundingBox();return merged;
}

export function buildLimestoneBlocks(scene:T.Scene,placements:Pick<RoadKerb,'x'|'z'|'forward'>[],name:string){
 const g=roadKerbGeometry(),m=new T.MeshStandardMaterial({vertexColors:true,roughness:.86}),blocks=new T.InstancedMesh(g,m,placements.length),dummy=new T.Object3D();
 blocks.name=name;blocks.receiveShadow=true;blocks.castShadow=true;
 placements.forEach((p,i)=>{const e=.16,up=new T.Vector3(-(h(p.x+e,p.z)-h(p.x-e,p.z))/(2*e),1,-(h(p.x,p.z+e)-h(p.x,p.z-e))/(2*e)).normalize(),forward=p.forward.clone().addScaledVector(up,-p.forward.dot(up)).normalize(),right=new T.Vector3().crossVectors(up,forward).normalize();
  dummy.position.set(p.x,h(p.x,p.z)-.02,p.z);dummy.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));dummy.updateMatrix();blocks.setMatrixAt(i,dummy.matrix);
  blocks.setColorAt(i,new T.Color('#ffffff').multiplyScalar(.94+.06*(Math.sin(i*79.7)*.5+.5)));
 });blocks.computeBoundingSphere();scene.add(blocks);return blocks;
}

/** A connected bevelled stone ribbon; joints share vertices instead of separate blocks. */
export function continuousRoadBorderGeometry(routes:BorderRoute[]){
 const vertices:number[]=[],indices:number[]=[];let runs=0;const ends:{x:number;z:number;run:number}[]=[];
 const profile=[[-.16,.025],[-.16,.15],[-.12,.19],[.12,.19],[.16,.15],[.16,.025]];
 const segments=routes.flatMap((r,id)=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,id,width:r.width})));
 const cells=new Map<string,typeof segments>(),cell=8;
 for(const s of segments){const pad=s.width*.72+.4;for(let x=Math.floor((Math.min(s.a.x,s.b.x)-pad)/cell);x<=Math.floor((Math.max(s.a.x,s.b.x)+pad)/cell);x++)for(let z=Math.floor((Math.min(s.a.z,s.b.z)-pad)/cell);z<=Math.floor((Math.max(s.a.z,s.b.z)+pad)/cell);z++){const key=x+':'+z,list=cells.get(key)||[];list.push(s);cells.set(key,list);}}
 routes.forEach((route,id)=>{
  const lengths=[0];for(let i=1;i<route.points.length;i++)lengths.push(lengths[i-1]+route.points[i].distanceTo(route.points[i-1]));
  const total=lengths.at(-1)!,closed=route.points[0].distanceTo(route.points.at(-1)!)<.1,steps=Math.ceil(total/.45);
  for(const side of [-1,1]){let previous=-1;let segment=1;
   const cap=()=>{if(previous<0)return;ends.push({x:(vertices[previous*3]+vertices[(previous+5)*3])/2,z:(vertices[previous*3+2]+vertices[(previous+5)*3+2])/2,run:runs});for(let k=1;k<5;k++)indices.push(previous,previous+k+1,previous+k);previous=-1;};
   for(let j=0;j<=steps;j++){
    const distance=total*j/steps;while(segment<lengths.length-1&&lengths[segment]<distance)segment++;
    const a=route.points[segment-1],b=route.points[segment],t=(distance-lengths[segment-1])/(lengths[segment]-lengths[segment-1]||1),point=a.clone().lerp(b,t),f=b.clone().sub(a).normalize(),right=new T.Vector3(f.z,0,-f.x),edge=route.width*.72+.13,x=point.x+right.x*edge*side,z=point.z+right.z*edge*side;
    const covered=(cells.get(Math.floor(x/cell)+':'+Math.floor(z/cell))||[]).some(s=>{if(s.id===id)return false;const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,u=T.MathUtils.clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-s.a.x-dx*u,z-s.a.z-dz*u)<s.width*.72+.24;});
    if(covered||(!closed&&(distance<.8||distance>total-.8))){cap();continue;}
    const index=vertices.length/3;
    for(const [offset,y] of profile){const px=x+right.x*offset,pz=z+right.z*offset;vertices.push(px,h(px,pz)+y,pz);}
    if(previous>=0){for(let k=0;k<6;k++){const next=(k+1)%6;indices.push(previous+k,index+k,previous+next,previous+next,index+k,index+next);}}
    else{runs++;ends.push({x,z,run:runs});for(let k=1;k<5;k++)indices.push(index,index+k,index+k+1);}
    previous=index;
   }cap();
  }
 });
 // Short rectangular returns close sharp grass-island tips without pointed wedges.
 const joined=new Set<number>();
 for(let i=0;i<ends.length;i++){if(joined.has(i))continue;const a=ends[i];let nearest=-1,distance=1.8;
  for(let j=i+1;j<ends.length;j++){if(joined.has(j)||ends[j].run===a.run)continue;const d=Math.hypot(a.x-ends[j].x,a.z-ends[j].z);if(d>.08&&d<distance){distance=d;nearest=j;}}
  if(nearest<0)continue;const b=ends[nearest],dx=(b.x-a.x)/distance,dz=(b.z-a.z)/distance,start=vertices.length/3;
  for(const p of [a,b])for(const [offset,y] of profile){const x=p.x+dz*offset,z=p.z-dx*offset;vertices.push(x,h(x,z)+y,z);}
  for(let k=0;k<6;k++){const n=(k+1)%6;indices.push(start+k,start+6+k,start+n,start+n,start+6+k,start+6+n);}
  joined.add(i);joined.add(nearest);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.userData.runs=runs;return geometry;
}
export function buildRoadBorders(scene:T.Scene,routes:BorderRoute[]){
 const geometry=continuousRoadBorderGeometry(routes),material=new T.MeshStandardMaterial({color:'#bdb398',roughness:.94});
 const border=new T.Mesh(geometry,material);border.name='Continuous limestone road outline';border.receiveShadow=true;border.castShadow=false;scene.add(border);
 scene.userData.roadBorders={blocks:0,routes:routes.length,runs:geometry.userData.runs};
 return border;
}
