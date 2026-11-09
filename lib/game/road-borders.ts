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
  const a=r.points[i-1],b=r.points[i],pad=r.width*.66+.2,segment={a,b,route,width:r.width};
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
     return Math.hypot(x-s.a.x-dx*u,z-s.a.z-dz*u)<s.width*.66+.2;
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

export function buildRoadBorders(scene:T.Scene,routes:BorderRoute[]){
 const placements=roadBorderPlacements(routes);buildLimestoneBlocks(scene,placements,'Greek-key limestone road borders');
 scene.userData.roadBorders={blocks:placements.length,routes:routes.length,perRoute:routes.map((_,i)=>placements.filter(p=>p.route===i).length)};
 return placements;
}
