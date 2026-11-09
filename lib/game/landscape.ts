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
 const a=groundHabitat(x,z),fine=landNoise(x*.4,z*.4),c=new T.Color('#a18a68');
 const green=new T.Color('#698546').lerp(new T.Color('#4c693d'),a.forest*.7);
 green.lerp(new T.Color('#7c9151'),landNoise(x*.045,z*.045)*.32);c.lerp(green,a.grass);
 const forge=1-Math.min(1,Math.hypot(x-templeSites.hephaestus.x,z-templeSites.hephaestus.z)/31);
 c.lerp(new T.Color('#524b43'),forge*.9);return c.multiplyScalar(.91+fine*.15);
}
export function terrainGeometry(width=500,depth=500,cx=0,cz=0){
 const g=new T.PlaneGeometry(width,depth,Math.ceil(width/1.6),Math.ceil(depth/1.6));g.rotateX(-Math.PI/2);g.translate(cx,0,cz);
 const p=g.getAttribute('position'),colors=[],cover=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,groundHeight(x,z));const c=groundColor(x,z);colors.push(c.r,c.g,c.b);const habitat=groundHabitat(x,z);cover.push(habitat.grass,habitat.forest*(.45+.35*landNoise(x*.08,z*.08)));}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('groundCover',new T.Float32BufferAttribute(cover,2));g.computeVertexNormals();return g;
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
   vec2 coverUV(float tile,vec2 offset){vec2 uv=fract(soilPoint.xz*.5+offset);return vec2((uv.x*.996+.002)*.5+tile*.5,uv.y*.996+.002);}
   vec4 coverSample(sampler2D tex){return mix(texture2D(tex,coverUV(0.,vec2(0.))),texture2D(tex,coverUV(1.,vec2(.31,.47))),coverWeights.y);}
  `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 coverGrain=coverSample(map).rgb/mix(vec3(.25,.32,.105),vec3(.17,.25,.085),coverWeights.y);
   vec3 soilGrain=texture2D(soilDetail,soilPoint.xz*.46).rgb;
   diffuseColor.rgb*=mix(soilGrain,clamp(coverGrain,vec3(.4),vec3(1.65)),coverWeights.x);`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','float roughnessFactor = roughness * mix(.96,coverSample(roughnessMap).g,coverWeights.x);');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replaceAll('texture2D( normalMap, vNormalMapUv ).xyz','mix(vec3(.5,.5,1.),coverSample(normalMap).xyz,coverWeights.x)'));
 };
 m.customProgramCacheKey=()=> 'asterion-blender-cover-v1';
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

