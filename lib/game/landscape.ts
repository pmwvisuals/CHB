import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { groundHeight } from './data';

const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
export function landNoise(x:number,z:number){const ix=Math.floor(x),iz=Math.floor(z),u=smooth(0,1,x-ix),v=smooth(0,1,z-iz);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),u),T.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),u),v);}
// A single ecological mask drives both soil colour and planting. Bare clearings really stay bare.
export function groundHabitat(x:number,z:number){
 const warpX=x+8*landNoise(x*.027+19,z*.027),warpZ=z+8*landNoise(x*.031,z*.031+31);
 const patch=.72*landNoise(warpX*.065,warpZ*.065)+.28*landNoise(x*.19+9,z*.19);
 const forest=Math.max(1-smooth(23,42,Math.hypot(x+40,z+96)),1-smooth(-90,-62,z),smooth(99,124,Math.abs(x)));
 const grass=smooth(.33,.64,patch),bush=smooth(.54,.74,patch);
 return {grass,bush,forest,patch};
}
export function groundColor(x:number,z:number){
 const a=groundHabitat(x,z),fine=landNoise(x*.4,z*.4),c=new T.Color('#82725b');
 c.lerp(new T.Color('#665643'),a.forest*.7).lerp(new T.Color('#717854'),a.grass*.85);
 c.lerp(new T.Color('#496044'),a.forest*a.grass*.6);
 return c.multiplyScalar(.86+fine*.25);
}
export function terrainGeometry(width=320,depth=320,cx=0,cz=0){
 const g=new T.PlaneGeometry(width,depth,Math.ceil(width/1.6),Math.ceil(depth/1.6));g.rotateX(-Math.PI/2);g.translate(cx,0,cz);
 const p=g.getAttribute('position'),colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,groundHeight(x,z));const c=groundColor(x,z);colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
function detailTexture(){
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=hash(x,y),speck=grain>.975?.52:grain<.04?.2:0,v=.72+grain*.16+speck,i=(y*size+x)*4;
  data[i]=Math.min(255,v*255);data[i+1]=Math.min(255,v*248);data[i+2]=Math.min(255,v*233);data[i+3]=255;
 }
 const t=new T.DataTexture(data,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;
}
export function groundMaterial(){
 const map=detailTexture();map.repeat.set(140,140);
 const m=new T.MeshStandardMaterial({vertexColors:true,map,bumpMap:map,bumpScale:.055,roughness:1});
 // World-space grain avoids the texture scale changing on the separate forest map.
 m.onBeforeCompile=s=>{s.vertexShader='varying vec3 soilPoint;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsoilPoint=position;');s.fragmentShader='varying vec3 soilPoint;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','diffuseColor *= texture2D(map,soilPoint.xz*.46);');};
 m.customProgramCacheKey=()=> 'asterion-soil-v2';return m;
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
