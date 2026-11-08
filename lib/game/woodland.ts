import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight as h, type Settings } from './data';

export const woodlandSample={x:-40,z:-96,radius:29};
export const inWoodland=(x:number,z:number)=>Math.hypot(x+40,z+96)<29;
const noise=(x:number,z:number)=>{const v=Math.sin(x*127.1+z*311.7)*43758.5453;return v-Math.floor(v);};
function surface(bark=false){
 const size=256,bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=noise(x,y),b=bark?.55+.2*Math.sin(x*.3+Math.sin(y*.07))+.15*n:.7+.22*n+.06*Math.sin(x*.17)*Math.sin(y*.13);
  const i=(y*size+x)*4;bytes[i]=Math.round(b*255);bytes[i+1]=Math.round(b*(bark?235:250));bytes[i+2]=Math.round(b*(bark?211:230));bytes[i+3]=255;
 }
 const tex=new T.DataTexture(bytes,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}
export function woodlandGround(){
 const map=surface();map.repeat.set(100,100);
 const material=new T.MeshStandardMaterial({vertexColors:true,map,roughness:1});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 terrainPoint;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPoint=position;');
  shader.fragmentShader='varying vec3 terrainPoint;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float woodland=1.-smoothstep(23.,30.,length(terrainPoint.xz-vec2(-40.,-96.)));
   float patches=sin(terrainPoint.x*.57+sin(terrainPoint.z*.23))*sin(terrainPoint.z*.71);
   vec3 floorColor=mix(vec3(.10,.13,.045),vec3(.23,.17,.09),smoothstep(-.4,.7,patches));
   diffuseColor.rgb=mix(diffuseColor.rgb,floorColor,woodland*.85);`);
 };
 material.customProgramCacheKey=()=> 'woodland-ground-v1';return material;
}
export function buildWoodland(scene:T.Scene,collision:T.Group,blocked:(x:number,z:number,pad:number)=>boolean){
 let seed=941;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const time={value:0};
 const barkMap=surface(true);barkMap.repeat.set(2,5);
 const bark=new T.MeshStandardMaterial({color:'#74634d',map:barkMap,roughness:1});
 const leaf=new T.MeshStandardMaterial({color:'#829455',roughness:.88,side:T.DoubleSide});
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
 wind(leaf,false);wind(grassMat,true);
 const stems:T.BufferGeometry[]=[];const leaves:T.Matrix4[]=[];const d=new T.Object3D();const trees:{x:number;z:number}[]=[];
 function branch(a:T.Vector3,b:T.Vector3,r:number,end:number){const geo=new T.CylinderGeometry(end,r,a.distanceTo(b),9,3);d.position.copy(a).add(b).multiplyScalar(.5);d.scale.set(1,1,1);d.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());d.updateMatrix();geo.applyMatrix4(d.matrix);stems.push(geo);}
 for(let attempt=0;attempt<500&&trees.length<24;attempt++){
  const x=-40+(rand()-.5)*55,z=-96+(rand()-.5)*55;if(!inWoodland(x,z)||blocked(x,z,3)||trees.some(p=>Math.hypot(p.x-x,p.z-z)<5))continue;
  trees.push({x,z});const y=h(x,z),height=8+rand()*6,trunk=new T.Vector3(x,y,z),top=new T.Vector3(x+(rand()-.5),y+height*.72,z+(rand()-.5));branch(trunk,top,.35+rand()*.2,.13);
  const collider=new T.Mesh(new T.CylinderGeometry(.45,.55,height*.7,8));collider.position.set(x,y+height*.35,z);collision.add(collider);
  for(let k=0;k<7;k++){
   const a=k*2.4+rand(),reach=2+rand()*2,base=trunk.clone().lerp(top,.38+k*.07),tip=new T.Vector3(x+Math.cos(a)*reach,y+height*(.65+rand()*.3),z+Math.sin(a)*reach);branch(base,tip,.12,.025);
   for(let j=0;j<120;j++){
    const az=rand()*Math.PI*2,r=Math.sqrt(rand())*2.1;d.position.set(tip.x+Math.cos(az)*r,tip.y+(rand()-.5)*1.7,tip.z+Math.sin(az)*r);d.rotation.set((rand()-.5)*1.6,rand()*6.28,rand()*.5);d.scale.setScalar(.65+rand()*.8);d.updateMatrix();leaves.push(d.matrix.clone());
   }
  }
  for(let k=0;k<5;k++){const a=k*1.256;branch(new T.Vector3(x+Math.cos(a)*1.15,h(x+Math.cos(a)*1.15,z+Math.sin(a)*1.15)+.03,z+Math.sin(a)*1.15),new T.Vector3(x,y+.45,z),.04,.18);}
 }
 const merged=mergeGeometries(stems);stems.forEach(g=>g.dispose());
 if(merged){const trunks=new T.Mesh(merged,bark);trunks.name='Woodland branching trunks';trunks.castShadow=trunks.receiveShadow=true;scene.add(trunks);}
 const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute([0,0,-.24,-.12,.025,0,0,.055,.28,.12,.025,0,0,.07,0],3));leafGeo.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leafGeo.computeVertexNormals();
 const canopy=new T.InstancedMesh(leafGeo,leaf,leaves.length);canopy.name='Woodland individual leaves';leaves.forEach((m,i)=>{canopy.setMatrixAt(i,m);canopy.setColorAt(i,new T.Color().setHSL(.19+rand()*.08,.25+rand()*.2,.34+rand()*.18));});canopy.castShadow=canopy.receiveShadow=true;canopy.computeBoundingSphere();canopy.boundingSphere!.radius+=.1;scene.add(canopy);
 // Six curved blades per clump, with dark roots and sunlit tips. No transparent cards.
 const verts:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let blade=0;blade<6;blade++){
  const angle=rand()*6.28,height=.35+rand()*.55,bend=.12+rand()*.25,offset=verts.length/3;
  for(let j=0;j<=4;j++){const t=j/4,w=.035*(1-t)+.001;for(const side of [-1,1]){const x=side*w+bend*t*t;verts.push(Math.cos(angle)*x, t*height,Math.sin(angle)*x);const c=new T.Color().setRGB(.24+t*.48,.33+t*.45,.12+t*.22);colors.push(c.r,c.g,c.b);}if(j<4){const n=offset+j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
 }
 const grassGeo=new T.BufferGeometry();grassGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));grassGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));grassGeo.setIndex(indices);grassGeo.computeVertexNormals();
 const patches:T.InstancedMesh[]=[];const centers:T.Vector3[]=[];
 for(let gx=-68;gx<-12;gx+=8)for(let gz=-124;gz<-68;gz+=8){
  const transforms:T.Matrix4[]=[];for(let i=0;i<420;i++){const x=gx+rand()*8,z=gz+rand()*8;if(!inWoodland(x,z)||blocked(x,z,.35)||noise(Math.floor(x*.5),Math.floor(z*.5))<.17)continue;d.position.set(x,h(x,z)-.015,z);d.rotation.set(0,rand()*6.28,0);const size=.65+rand()*.65;d.scale.set(size,size,size);d.updateMatrix();transforms.push(d.matrix.clone());}
  if(!transforms.length)continue;const patch=new T.InstancedMesh(grassGeo,grassMat,transforms.length);patch.name='Woodland grass patch';transforms.forEach((m,i)=>patch.setMatrixAt(i,m));patch.receiveShadow=true;patch.computeBoundingSphere();patch.boundingSphere!.radius+=.4;patch.userData.fullCount=transforms.length;scene.add(patch);patches.push(patch);centers.push(new T.Vector3(gx+4,h(gx+4,gz+4),gz+4));
 }
 const rockMap=surface();rockMap.repeat.set(2,2);const rockMat=new T.MeshStandardMaterial({color:'#918a70',map:rockMap,roughness:1});
 const rockGeo=new T.IcosahedronGeometry(1,2),p=rockGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=.8+.22*Math.sin(x*9+y*5)*Math.cos(z*7);p.setXYZ(i,x*r,y*r,z*r);}rockGeo.computeVertexNormals();
 const rocks=new T.InstancedMesh(rockGeo,rockMat,65);let count=0;
 for(let i=0;i<300&&count<65;i++){const x=-40+(rand()-.5)*53,z=-96+(rand()-.5)*53;if(!inWoodland(x,z)||blocked(x,z,1.5))continue;d.position.set(x,h(x,z)-.1,z);d.rotation.set(rand(),rand()*6,rand());const size=.2+rand()*.7;d.scale.set(size*1.6,size*.6,size);d.updateMatrix();rocks.setMatrixAt(count++,d.matrix);}rocks.count=count;rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
 const stats={trees:trees.length,leaves:leaves.length,grassClumps:patches.reduce((sum,p)=>sum+p.count,0),patches:patches.length};scene.userData.woodland=stats;
 let quality:Settings['quality']='medium';
 return {stats,setQuality(q:Settings['quality']){quality=q;},update(t:number,camera?:T.Vector3){time.value=t;if(!camera)return;patches.forEach((p,i)=>{const distance=centers[i].distanceTo(camera),range=quality==='high'?65:quality==='medium'?42:25;p.visible=distance<range;p.count=Math.floor(p.userData.fullCount*(quality==='low'?.2:distance>25?.45:1));});},dispose(){/* Scene geometry and textures are owned by World.dispose. */}};
}
