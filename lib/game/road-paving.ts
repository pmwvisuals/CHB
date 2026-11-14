import * as T from 'three';
import {groundHeight} from './data';

export const pavingLift=.065;
/** One surface is used by rendering and walking collision, including on hills. */
export function pavedRoadGeometry(points:T.Vector3[],width:number,height=groundHeight){
 const verts:number[]=[],indices:number[]=[],uvs:number[]=[];
 points.forEach((p,i)=>{const dir=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(i-1,0)]).normalize();for(let j=0;j<5;j++){const side=(j/4-.5)*2,edge=width*.72,x=p.x+dir.z*edge*side,z=p.z-dir.x*edge*side;verts.push(x,height(x,z)+pavingLift,z);uvs.push(j/4,i/(points.length-1));}if(i<points.length-1)for(let j=0;j<4;j++){const a=i*5+j;indices.push(a,a+5,a+1,a+1,a+5,a+6);}});
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();geo.userData.surfacePolygons=points.slice(1).map((_,i)=>[i*5,i*5+5,i*5+9,i*5+4]);return geo;
}

/** Simple worn limestone flagstones. One seamless material covers the road network. */
export function limestoneRoadMaterial(){
 const size=512,cells=8,albedo=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 const hash=(x:number,z:number)=>{const v=Math.sin(x*127.1+z*311.7)*43758.5453;return v-Math.floor(v);},wrap=(n:number)=>((n%cells)+cells)%cells;
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=x/size*cells,pz=z/size*cells,ix=Math.floor(px),iz=Math.floor(pz);let first=Infinity,second=Infinity,stone=0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const gx=ix+dx,gz=iz+dz,wx=wrap(gx),wz=wrap(gz),sx=gx+.5+(hash(wx,wz)-.5)*.65,sz=gz+.5+(hash(wx+41,wz+17)-.5)*.65,d=(sx-px)**2+(sz-pz)**2;if(d<first){second=first;first=d;stone=hash(wx+93,wz+7);}else if(d<second)second=d;}
  const edge=(Math.sqrt(second)-Math.sqrt(first))*.5,face=T.MathUtils.smoothstep(edge,.010,.052),grain=hash(x*.73,z*.91),tone=.89+stone*.17+(grain-.5)*.07,index=(z*size+x)*4;
  for(let c=0;c<3;c++){const slab=[190,182,162][c]*tone,mortar=[111,105,92][c];albedo[index+c]=T.MathUtils.lerp(mortar,slab,face);roughness[index+c]=225+grain*22;}albedo[index+3]=roughness[index+3]=255;height[z*size+x]=face*.8+(grain-.5)*.035;
 }
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){const left=height[z*size+(x+size-1)%size],right=height[z*size+(x+1)%size],up=height[((z+size-1)%size)*size+x],down=height[((z+1)%size)*size+x],n=new T.Vector3((left-right)*.65,(up-down)*.65,1).normalize(),i=(z*size+x)*4;normal[i]=(n.x*.5+.5)*255;normal[i+1]=(n.y*.5+.5)*255;normal[i+2]=(n.z*.5+.5)*255;normal[i+3]=255;}
 function texture(data:Uint8Array,srgb=false){const t=new T.DataTexture(data,size,size);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=16;t.needsUpdate=true;return t;}
 const material=new T.MeshStandardMaterial({color:'#ffffff',map:texture(albedo,true),normalMap:texture(normal),roughnessMap:texture(roughness),roughness:.96,normalScale:new T.Vector2(.8,.8),polygonOffset:true,polygonOffsetFactor:-1});
 material.name='Worn Greek limestone paving';
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
  vec2 pavingUV=(modelMatrix*vec4(position,1.)).xz/7.2;
  #ifdef USE_MAP
   vMapUv=pavingUV;
  #endif
  #ifdef USE_NORMALMAP
   vNormalMapUv=pavingUV;
  #endif
  #ifdef USE_ROUGHNESSMAP
   vRoughnessMapUv=pavingUV;
  #endif`);};material.customProgramCacheKey=()=> 'greek-limestone-paving-v1';return material;
}
