import * as T from 'three';
import {groundHeight} from './data';

export type FlowerKind='daisy'|'poppy'|'lavender';
export interface FlowerPlacement {x:number;z:number;y?:number;scale:number;rotation:number;kind:FlowerKind}

/** Curved petals, complete stems, folded leaves and pollen centres. No proxy solids. */
export function flowerGeometry(kind:FlowerKind){
 const vertices:number[]=[],colors:number[]=[],indices:number[]=[];
 const green=new T.Color('#42683c'),leafGreen=new T.Color('#62854a'),petal=new T.Color(kind==='poppy'?'#c77991':kind==='lavender'?'#9580ba':'#eee6cf'),pollen=new T.Color(kind==='poppy'?'#554d49':'#bc9850');
 function point(x:number,y:number,z:number,c:T.Color,shade=1){const i=vertices.length/3;vertices.push(x,y,z);colors.push(c.r*shade,c.g*shade,c.b*shade);return i;}
 function ellipsoid(center:T.Vector3,r:T.Vector3,c:T.Color){const start=vertices.length/3,around=8,rows=5;for(let j=0;j<=rows;j++)for(let k=0;k<=around;k++){const a=k/around*Math.PI*2,b=j/rows*Math.PI;point(center.x+Math.sin(b)*Math.cos(a)*r.x,center.y+Math.cos(b)*r.y,center.z+Math.sin(b)*Math.sin(a)*r.z,c,.88+.12*Math.sin(b));}for(let j=0;j<rows;j++)for(let k=0;k<around;k++){const a=start+j*(around+1)+k;indices.push(a,a+1,a+around+1,a+1,a+around+2,a+around+1);}}
 for(let stem=0;stem<3;stem++){
  const angle=stem*2.399,bx=Math.cos(angle)*.10,bz=Math.sin(angle)*.10,height=(kind==='lavender'?.58:.40)+stem*.07,bend=.06*Math.sin(stem*1.7+1),stemStart=vertices.length/3;
  for(let j=0;j<=5;j++){const t=j/5;for(let k=0;k<=6;k++){const a=k/6*Math.PI*2;point(bx+bend*t*t+Math.cos(a)*.009*(1-t*.45),height*t,bz+Math.sin(a)*.009*(1-t*.45),green);}}
  for(let j=0;j<5;j++)for(let k=0;k<6;k++){const a=stemStart+j*7+k;indices.push(a,a+1,a+7,a+1,a+8,a+7);}
  for(let leaf=0;leaf<3;leaf++){
   const a=angle+leaf*2.4,y=height*(.18+leaf*.19),n=vertices.length/3,len=kind==='lavender'?.12:.18;
   for(let j=0;j<=4;j++){const t=j/4,w=Math.sin(t*Math.PI)*len*(kind==='lavender'?.13:.27);for(const side of [-1,0,1])point(bx+Math.cos(a)*len*t-Math.sin(a)*w*side,y+Math.sin(t*2.4)*.055+(side===0?.012:0),bz+Math.sin(a)*len*t+Math.cos(a)*w*side,leafGreen,.85+t*.15);}
   for(let j=0;j<4;j++)for(let k=0;k<2;k++){const a=n+j*3+k;indices.push(a,a+1,a+3,a+1,a+4,a+3);}
  }
  const head=new T.Vector3(bx+bend,height,bz);
  if(kind==='lavender'){
   for(let ring=0;ring<6;ring++)for(let k=0;k<3;k++){const a=k*Math.PI*2/3+ring*1.1,r=.025+(1-ring/7)*.015;ellipsoid(new T.Vector3(head.x+Math.cos(a)*r,head.y+ring*.025,head.z+Math.sin(a)*r),new T.Vector3(.026,.029,.022),petal);}
  }else{
   const petals=kind==='daisy'?12:6,length=kind==='daisy'?.115:.15;
   for(let pet=0;pet<petals;pet++){
    const a=pet*Math.PI*2/petals+stem*.38,n=vertices.length/3;
    for(let j=0;j<=5;j++){const t=j/5,r=.018+t*length,w=Math.sin(t*Math.PI)**.65*length*(kind==='poppy'?.54:.20);
     for(let k=0;k<=4;k++){const side=k/2-1,lift=kind==='poppy'?.075*t*t-.03*Math.sin(t*Math.PI):.025*Math.sin(t*Math.PI)-.023*t*t;
      point(head.x+Math.cos(a)*r-Math.sin(a)*w*side,head.y+lift+.012*side*side*Math.sin(t*Math.PI),head.z+Math.sin(a)*r+Math.cos(a)*w*side,petal,.79+.21*t);}
    }
    for(let j=0;j<5;j++)for(let k=0;k<4;k++){const a=n+j*5+k;indices.push(a,a+1,a+5,a+1,a+6,a+5);}
   }
   ellipsoid(head.clone().add(new T.Vector3(0,.013,0)),new T.Vector3(.038,.022,.038),pollen);
   for(let k=0;k<7;k++){const a=k*2.399;ellipsoid(head.clone().add(new T.Vector3(Math.cos(a)*.023,.034,Math.sin(a)*.023)),new T.Vector3(.006,.006,.006),pollen);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}

export function buildFlowers(scene:T.Scene,placements:FlowerPlacement[]){
 const time={value:0},material=new T.MeshStandardMaterial({vertexColors:true,color:'#ffffff',roughness:.78,side:T.DoubleSide});
 material.onBeforeCompile=s=>{s.uniforms.flowerTime=time;s.vertexShader='uniform float flowerTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   float sway=sin(flowerTime*.95+instanceMatrix[3].x*.41+instanceMatrix[3].z*.32);transformed.x+=sway*position.y*position.y*.055;
  #endif`);};material.customProgramCacheKey=()=> 'curved-garden-flowers-v1';
 const geometries=new Map<FlowerKind,T.BufferGeometry>(),cells=new Map<string,FlowerPlacement[]>(),batches:{mesh:T.InstancedMesh;center:T.Vector3}[]=[],dummy=new T.Object3D();
 for(const p of placements){const key=`${p.kind}:${Math.floor(p.x/20)}:${Math.floor(p.z/20)}`;const list=cells.get(key)||[];list.push(p);cells.set(key,list);}
 for(const list of cells.values()){
  const kind=list[0].kind;let geometry=geometries.get(kind);if(!geometry){geometry=flowerGeometry(kind);geometries.set(kind,geometry);}
  const mesh=new T.InstancedMesh(geometry,material,list.length);mesh.name='Living flowers · '+kind;const center=new T.Vector3();
  list.forEach((p,i)=>{const y=p.y??groundHeight(p.x,p.z)-.012;dummy.position.set(p.x,y,p.z);dummy.rotation.set(0,p.rotation,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);center.add(dummy.position);});center.divideScalar(list.length);mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);batches.push({mesh,center});
 }
 scene.userData.flowers={clumps:placements.length,varieties:3};
 return {update(t:number,camera?:T.Vector3){time.value=t;if(camera)for(const b of batches)b.mesh.visible=Math.hypot(camera.x-b.center.x,camera.z-b.center.z)<120;},dispose(){batches.length=0;}};
}
