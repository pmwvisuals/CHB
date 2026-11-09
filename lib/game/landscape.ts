import {forestShade} from './forest-border-layout';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {templeSites} from './sanctuary-layout';
import { groundHeight } from './data';
import {surfaceCover} from './ground-surface';
import {unzlibSync} from 'three/addons/libs/fflate.module.js';
import {groundCover} from './generated/ground-cover';

const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
export function landNoise(x:number,z:number){const ix=Math.floor(x),iz=Math.floor(z),u=smooth(0,1,x-ix),v=smooth(0,1,z-iz);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),u),T.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),u),v);}
// One slope/road mask drives the ground material and its living ground cover.
export function groundHabitat(x:number,z:number){
 const warpX=x+8*landNoise(x*.027+19,z*.027),warpZ=z+8*landNoise(x*.031,z*.031+31);
 const patch=.72*landNoise(warpX*.065,warpZ*.065)+.28*landNoise(x*.19+9,z*.19);
 const forest=Math.max(1-smooth(23,42,Math.hypot(x+40,z+96)),1-smooth(-90,-62,z),smooth(99,124,Math.abs(x)));
 const grass=surfaceCover(x,z)*(.85+.15*patch),bush=smooth(.54,.74,patch)*grass;
 return {grass,bush,forest,patch};
}
export function groundColor(x:number,z:number){
 const a=groundHabitat(x,z),fine=landNoise(x*.4,z*.4),broad=landNoise(x*.035+8,z*.035-3),c=new T.Color('#8b7556');
 const green=new T.Color('#315b32').lerp(new T.Color('#1d3e2a'),a.forest*.72);
 green.lerp(new T.Color('#486d39'),broad*.42);c.lerp(green,a.grass);
 const forge=1-Math.min(1,Math.hypot(x-templeSites.hephaestus.x,z-templeSites.hephaestus.z)/31);
 c.lerp(new T.Color('#524b43'),forge*.9);return c.multiplyScalar((.91+fine*.15)*(1-forestShade(x,z)*.48));
}
export function terrainGeometry(width=500,depth=500,cx=0,cz=0,spacing=1.6){
 const nx=Math.ceil(width/spacing),nz=Math.ceil(depth/spacing),dx=width/nx,dz=depth/nz,refined=new Uint8Array(nx*nz);
 // Spend extra triangles at the curving shoreline and small knolls, rather than
 // multiplying the mesh across the entire forest. Shared edge vertices prevent cracks.
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const x=cx-width/2+(ix+.5)*dx,z=cz-depth/2+(iz+.5)*dz,r=Math.hypot((x-91)/31,z/47);
  if(spacing<=2.1&&((r>.83&&r<1.29)||Math.hypot(x+13,z+10)<11||Math.hypot(x-13,z-11)<11||Math.hypot(x-65,z-35)<12))refined[iz*nx+ix]=1;
 }
 const positions:number[]=[],colors:number[]=[],cover:number[]=[],uv:number[]=[],indices:number[]=[],vertices=new Map<number,number>();
 function vertex(ix:number,iz:number){const key=iz*(nx*2+1)+ix,old=vertices.get(key);if(old!==undefined)return old;
  const x=cx-width/2+ix*dx/2,z=cz-depth/2+iz*dz/2,c=groundColor(x,z),habitat=groundHabitat(x,z),id=positions.length/3;
  vertices.set(key,id);positions.push(x,groundHeight(x,z),z);colors.push(c.r,c.g,c.b);cover.push(habitat.grass,habitat.forest*(.45+.35*landNoise(x*.08,z*.08)));uv.push(ix/(nx*2),1-iz/(nz*2));return id;
 }
 function fine(ix:number,iz:number){return ix>=0&&ix<nx&&iz>=0&&iz<nz&&refined[iz*nx+ix]===1;}
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const x=ix*2,z=iz*2,self=fine(ix,iz),north=self||fine(ix,iz-1),east=self||fine(ix+1,iz),south=self||fine(ix,iz+1),west=self||fine(ix-1,iz);
  const nw=vertex(x,z),ne=vertex(x+2,z),se=vertex(x+2,z+2),sw=vertex(x,z+2);
  if(!north&&!east&&!south&&!west){indices.push(nw,sw,ne,ne,sw,se);continue;}
  const perimeter=[nw];if(north)perimeter.push(vertex(x+1,z));perimeter.push(ne);if(east)perimeter.push(vertex(x+2,z+1));perimeter.push(se);if(south)perimeter.push(vertex(x+1,z+2));perimeter.push(sw);if(west)perimeter.push(vertex(x,z+1));
  const center=vertex(x+1,z+1);for(let i=0;i<perimeter.length;i++)indices.push(center,perimeter[(i+1)%perimeter.length],perimeter[i]);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('groundCover',new T.Float32BufferAttribute(cover,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function detailTexture(){
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=hash(x,y),speck=grain>.975?.52:grain<.04?.2:0,v=.72+grain*.16+speck,i=(y*size+x)*4;
  data[i]=Math.min(255,v*255);data[i+1]=Math.min(255,v*248);data[i+2]=Math.min(255,v*233);data[i+3]=255;
 }
 const t=new T.DataTexture(data,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;
}
function coverTexture(kind:'albedo'|'normal'|'roughness'){
 const raw=unzlibSync(Uint8Array.from(atob(groundCover.maps[kind]),c=>c.charCodeAt(0)));
 // Expand RGB to RGBA: WebGL2 supports this layout consistently on all devices.
 const rgba=new Uint8Array(groundCover.width*groundCover.height*4);
 for(let i=0,j=0;i<raw.length;i+=3,j+=4){rgba[j]=raw[i];rgba[j+1]=raw[i+1];rgba[j+2]=raw[i+2];rgba[j+3]=255;}
 const t=new T.DataTexture(rgba,groundCover.width,groundCover.height);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=16;t.colorSpace=kind==='albedo'?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;return t;
}
export function groundMaterial(){
 const albedo=coverTexture('albedo'),normal=coverTexture('normal'),roughness=coverTexture('roughness'),soil=detailTexture();
 const m=new T.MeshStandardMaterial({vertexColors:true,map:albedo,normalMap:normal,normalScale:new T.Vector2(.55,-.55),roughnessMap:roughness,roughness:1});
 m.userData.groundCover=true;
 m.onBeforeCompile=s=>{
  s.uniforms.soilDetail={value:soil};
  s.vertexShader='attribute vec2 groundCover; varying vec3 soilPoint; varying vec2 coverWeights;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsoilPoint=position;coverWeights=groundCover;');
  s.fragmentShader=`varying vec3 soilPoint;varying vec2 coverWeights;uniform sampler2D soilDetail;
   vec2 coverUV(float tile,vec2 uv){uv=fract(uv);return vec2((uv.x*.996+.002)*.5+tile*.5,uv.y*.996+.002);}
   vec4 coverSample(sampler2D tex){
    vec2 p=soilPoint.xz;
    vec2 a=p*.47;vec2 b=mat2(.819,.574,-.574,.819)*p*.283+vec2(.37,.19);
    float blend=.34+.32*sin(p.x*.071+sin(p.y*.053));
    vec4 grass=mix(texture2D(tex,coverUV(0.,a)),texture2D(tex,coverUV(0.,b)),blend);
    vec4 moss=mix(texture2D(tex,coverUV(1.,a)),texture2D(tex,coverUV(1.,b)),blend);
    return mix(grass,moss,smoothstep(.25,.8,coverWeights.y));
   }
  `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 coverGrain=coverSample(map).rgb/mix(vec3(.25,.32,.105),vec3(.17,.25,.085),smoothstep(.25,.8,coverWeights.y));
   vec3 soilGrain=texture2D(soilDetail,soilPoint.xz*.46).rgb;
   float gardenMottle=.82+.24*texture2D(soilDetail,soilPoint.xz*.037+vec2(.13,.61)).r;
   diffuseColor.rgb*=mix(soilGrain,clamp(coverGrain*gardenMottle,vec3(.34),vec3(1.45)),coverWeights.x);`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','float roughnessFactor = roughness * mix(.96,coverSample(roughnessMap).g,coverWeights.x);');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replaceAll('texture2D( normalMap, vNormalMapUv ).xyz','mix(vec3(.5,.5,1.),coverSample(normalMap).xyz,coverWeights.x)'));
 };
 m.customProgramCacheKey=()=> 'asterion-garden-cover-v3';
 // The soil sampler is an extra shader uniform, so release it explicitly.
 const dispose=m.dispose.bind(m);m.dispose=()=>{soil.dispose();dispose();};return m;
}
export function trailMaterial(){
 const map=detailTexture();map.repeat.set(4,45);
 const m=new T.MeshStandardMaterial({color:'#ac9575',map,bumpMap:map,bumpScale:.035,roughness:1,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 m.onBeforeCompile=s=>{s.vertexShader='varying vec2 trailUV;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntrailUV=uv;');s.fragmentShader='varying vec2 trailUV;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',`float edge=abs(trailUV.x-.5)*2.;float wear=.035*sin(trailUV.y*71.)+.045*sin(trailUV.y*29.+trailUV.x*13.);diffuseColor.a*=1.-smoothstep(.58+wear,1.,edge);\n#include <alphatest_fragment>`);};
 m.customProgramCacheKey=()=> 'asterion-worn-trail-v2';return m;
}
export function weatheredRockGeometry(variant=0){
 const g=new RoundedBoxGeometry(2,1.65,1.8,2,.22),p=g.getAttribute('position'),colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=landNoise(x*2.8+variant*11,z*2.8+y*2),chip=.94+n*.12;
  p.setXYZ(i,x*chip+.1*y,y*(.90+.1*landNoise(x*4,z*4))+.16*x-.12*z+.08*(n-.5),z*chip+.08*x);
  const c=new T.Color('#a59e8d').multiplyScalar(.78+n*.29),moss=smooth(.15,.7,y)*smooth(.42,.7,landNoise(x*3+variant,z*3));c.lerp(new T.Color('#667052'),moss*.65);colors.push(c.r,c.g,c.b);
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function weatheredRockMaterial(){const map=detailTexture();map.repeat.set(2,2);return new T.MeshStandardMaterial({color:'#d0c9b8',vertexColors:true,map,bumpMap:map,bumpScale:.09,roughness:.91});}

