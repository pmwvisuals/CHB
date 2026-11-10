import * as T from 'three';

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
