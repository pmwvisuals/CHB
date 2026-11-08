import * as T from 'three';
import { plantCollection, type PlantPlacement } from './vegetation';
import { groundHeight as h, type Settings } from './data';
import { groundMaterial,groundHabitat,weatheredRockGeometry,weatheredRockMaterial } from './landscape';

export const woodlandSample={x:-40,z:-96,radius:29};
export const inWoodland=(x:number,z:number)=>Math.hypot(x+40,z+96)<29;
const noise=(x:number,z:number)=>{const v=Math.sin(x*127.1+z*311.7)*43758.5453;return v-Math.floor(v);};
export const woodlandGround=groundMaterial;
export function buildWoodland(scene:T.Scene,collision:T.Group,blocked:(x:number,z:number,pad:number)=>boolean){
 let seed=941;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const time={value:0};
 const grassMat=new T.MeshStandardMaterial({color:'#92975a',roughness:.95,side:T.DoubleSide,vertexColors:true});
 function wind(material:T.MeshStandardMaterial,grass:boolean){material.onBeforeCompile=s=>{
  s.uniforms.woodlandTime=time;s.vertexShader='uniform float woodlandTime;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
   vec3 origin=instanceMatrix[3].xyz;
   float sway=sin(woodlandTime*1.65+origin.x*.37+origin.z*.28)+.35*sin(woodlandTime*3.1+origin.z);
   transformed.x+=sway*${grass?'position.y*position.y*.15':'.035'};
   transformed.z+=sin(woodlandTime+origin.x*.3)*${grass?'position.y*position.y*.08':'.025'};
   #endif`);
 };material.customProgramCacheKey=()=>grass?'woodland-grass-v1':'woodland-leaf-v1';}
 wind(grassMat,true);
 const d=new T.Object3D(),trees:{x:number;z:number}[]=[],plants:PlantPlacement[]=[];
 for(let attempt=0;attempt<800&&trees.length<24;attempt++){
  const x=-40+(rand()-.5)*55,z=-96+(rand()-.5)*55;if(!inWoodland(x,z)||blocked(x,z,3)||trees.some(p=>Math.hypot(p.x-x,p.z-z)<7))continue;
  trees.push({x,z});const scale=.72+rand()*.22;plants.push({id:trees.length%2?'forest_oak':'forest_fir',x,y:h(x,z),z,scale,rotation:rand()*Math.PI*2});
  const collider=new T.Mesh(new T.CylinderGeometry(.65,.9,12,8));collider.position.set(x,h(x,z)+6,z);collision.add(collider);
 }
 for(let i=0;i<1000;i++){const x=-40+(rand()-.5)*56,z=-96+(rand()-.5)*56;if(!inWoodland(x,z)||blocked(x,z,.8)||rand()>groundHabitat(x,z).bush*.9)continue;plants.push({id:i%4===0?'forest_bramble':i%4===1?'forest_fern':i%4===2?'forest_bracken':'forest_litter',x,y:h(x,z),z,scale:.65+rand()*.7,rotation:rand()*6.28});}
 const planting=plantCollection(scene,plants);
 // Six curved blades per clump, with dark roots and sunlit tips. No transparent cards.
 const verts:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let blade=0;blade<6;blade++){
  const angle=rand()*6.28,height=.35+rand()*.55,bend=.12+rand()*.25,offset=verts.length/3;
  for(let j=0;j<=4;j++){const t=j/4,w=.035*(1-t)+.001;for(const side of [-1,1]){const x=side*w+bend*t*t;verts.push(Math.cos(angle)*x, t*height,Math.sin(angle)*x);const c=new T.Color().setRGB(.24+t*.48,.33+t*.45,.12+t*.22);colors.push(c.r,c.g,c.b);}if(j<4){const n=offset+j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
 }
 const grassGeo=new T.BufferGeometry();grassGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));grassGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));grassGeo.setIndex(indices);grassGeo.computeVertexNormals();
 const patches:T.InstancedMesh[]=[];const centers:T.Vector3[]=[];
 for(let gx=-68;gx<-12;gx+=8)for(let gz=-124;gz<-68;gz+=8){
  const transforms:T.Matrix4[]=[];for(let i=0;i<420;i++){const x=gx+rand()*8,z=gz+rand()*8;if(!inWoodland(x,z)||blocked(x,z,.35)||rand()>groundHabitat(x,z).grass*.9)continue;d.position.set(x,h(x,z)-.015,z);d.rotation.set(0,rand()*6.28,0);const size=.65+rand()*.65;d.scale.set(size,size,size);d.updateMatrix();transforms.push(d.matrix.clone());}
  if(!transforms.length)continue;const patch=new T.InstancedMesh(grassGeo,grassMat,transforms.length);patch.name='Woodland grass patch';transforms.forEach((m,i)=>patch.setMatrixAt(i,m));patch.receiveShadow=true;patch.computeBoundingSphere();patch.boundingSphere!.radius+=.4;patch.userData.fullCount=transforms.length;scene.add(patch);patches.push(patch);centers.push(new T.Vector3(gx+4,h(gx+4,gz+4),gz+4));
 }
 const rockMat=weatheredRockMaterial(),rockGeo=weatheredRockGeometry(2);
 const rocks=new T.InstancedMesh(rockGeo,rockMat,65);let count=0;
 for(let i=0;i<300&&count<65;i++){const x=-40+(rand()-.5)*53,z=-96+(rand()-.5)*53;if(!inWoodland(x,z)||blocked(x,z,1.5))continue;d.position.set(x,h(x,z)-.1,z);d.rotation.set((rand()-.5)*.3,rand()*6,(rand()-.5)*.3);const size=.3+rand()*.85;d.scale.set(size*1.4,size*.8,size);d.updateMatrix();rocks.setMatrixAt(count++,d.matrix);if(size>.6){const solid=new T.Mesh(rockGeo);solid.matrixAutoUpdate=false;solid.matrix.copy(d.matrix);collision.add(solid);}}rocks.count=count;rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
 const stats={trees:trees.length,plantTypes:planting.stats.types,grassClumps:patches.reduce((sum,p)=>sum+p.count,0),patches:patches.length};scene.userData.woodland=stats;
 let quality:Settings['quality']='medium';
 return {stats,setQuality(q:Settings['quality']){quality=q;planting.setQuality(q);},update(t:number,camera?:T.Vector3){time.value=t;planting.update(t,camera);if(!camera)return;patches.forEach((p,i)=>{const distance=centers[i].distanceTo(camera),range=quality==='high'?65:quality==='medium'?42:25;p.visible=distance<range;p.count=Math.floor(p.userData.fullCount*(quality==='low'?.2:distance>25?.45:1));});},dispose(){planting.dispose();}};
}
