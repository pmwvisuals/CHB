import * as T from 'three';
import { unzlibSync } from 'three/addons/libs/fflate.module.js';
import { vegetationAssets,leafAtlas,leafAtlasSize } from './generated/vegetation';
import {gardenGrassAssets} from './generated/garden-grass';
export type PlantId=keyof typeof vegetationAssets;
export const forestTreeIds=['forest_oak','forest_fir','forest_hornbeam','forest_cedar','forest_spruce'] as const;
export interface PlantPlacement {id:PlantId;x:number;y:number;z:number;scale:number;rotation:number}
function bytes(s:string){const binary=atob(s);return unzlibSync(Uint8Array.from(binary,c=>c.charCodeAt(0)));}
type Packed=typeof vegetationAssets.forest_oak.parts[number]['high'];
export function unpackPlant(p:Packed){
 const raw=bytes(p.v),view=new DataView(raw.buffer),count=raw.length/9,positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvraw=bytes(p.uv),uvview=new DataView(uvraw.buffer),uv=new Float32Array(count*2);
 for(let i=0;i<count;i++){for(let a=0;a<3;a++){positions[i*3+a]=view.getInt16(i*9+a*2,true)/32767*p.scale;normals[i*3+a]=view.getInt8(i*9+6+a)/127;}uv[i*2]=uvview.getUint16(i*4,true)/65535;uv[i*2+1]=uvview.getUint16(i*4+2,true)/65535;}
 const idxraw=bytes(p.i),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(p.wide?new Uint32Array(idxraw.buffer):new Uint16Array(idxraw.buffer),1));g.computeBoundingSphere();g.computeBoundingBox();return g;
}
export function plantCollection(scene:T.Scene,placements:PlantPlacement[],options:{range?:number;canopyLayers?:number;detailedRange?:number;cellSize?:number;widthScale?:number}={}){
 const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>(),depths:T.MeshDepthMaterial[]=[];
 const atlas=new T.DataTexture(bytes(leafAtlas),leafAtlasSize,leafAtlasSize);atlas.colorSpace=T.SRGBColorSpace;atlas.magFilter=T.LinearFilter;atlas.minFilter=T.LinearMipmapLinearFilter;atlas.generateMipmaps=true;atlas.anisotropy=8;atlas.needsUpdate=true;
 const pixels=new Uint8Array(128*256*4);for(let y=0;y<256;y++)for(let x=0;x<128;x++){const grain=Math.sin(x*.4+Math.sin(y*.07)*1.8)*.5+.5,crack=Math.pow(grain,8),n=Math.sin(x*17.3+y*71.7)*.5+.5,i=(y*128+x)*4,v=.43+.16*n-.27*crack;pixels[i]=v*255;pixels[i+1]=v*211;pixels[i+2]=v*169;pixels[i+3]=255;}
 const bark=new T.DataTexture(pixels,128,256);bark.colorSpace=T.SRGBColorSpace;bark.wrapS=bark.wrapT=T.RepeatWrapping;bark.magFilter=T.LinearFilter;bark.minFilter=T.LinearMipmapLinearFilter;bark.generateMipmaps=true;bark.anisotropy=4;bark.needsUpdate=true;
 const time={value:0};
 function material(id:PlantId,key:string){const name=id+'_'+key;if(materials.has(name))return materials.get(name)!;const colors:Record<string,string>={forest_oak:'#284c2b',forest_fir:'#1d3c30',forest_hornbeam:'#23452d',forest_cedar:'#203f35',forest_spruce:'#163f32',camp_olive:'#b4c797',camp_blossom:'#8fa35d',forest_bramble:'#355735',camp_laurel:'#729353',camp_myrtle:'#6b9980',fern:'#426e3f',pink:'#efb0bd',white:'#f0e3b5',grass:'#90a45c',dry:'#9a7348'};const leafy=key==='leaf';const m=new T.MeshStandardMaterial({color:key==='bark'?'#bcb5a4':colors[leafy?id:key]||'#668348',map:leafy?atlas:key==='bark'?bark:null,roughness:key==='bark'?.96:.82,side:key==='bark'?T.FrontSide:T.DoubleSide,alphaTest:leafy?.48:0});
  if(key==='bark'){m.bumpMap=bark;m.bumpScale=.035;}
  if(key==='foliage'||key==='canopy'){m.color.set(colors[id]||'#49734a');if(key==='canopy')m.color.multiplyScalar(.68);m.side=T.DoubleSide;m.roughness=.9;}
  if(leafy||key==='foliage'){m.onBeforeCompile=s=>{s.uniforms.plantTime=time;s.vertexShader='uniform float plantTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
   float strength=clamp(position.y*.0015,0.,.025)*sin(uv.y*6.2831853)*sin(uv.y*6.2831853);vec3 root=instanceMatrix[3].xyz;
   transformed.x+=sin(plantTime*1.3+position.y*.5+root.x*.2)*strength;
   transformed.z+=cos(plantTime*.9+root.z*.3)*strength*.6;
   #endif`);};m.customProgramCacheKey=()=> 'asterion-leaf-wind-v2';}
  materials.set(name,m);return m;
 }
 const rootOffsets=new Map<string,number>();
 for(const id of new Set(placements.map(p=>p.id))){const asset=vegetationAssets[id];if(asset.height<3)continue;const part=asset.parts.find(p=>p.material==='bark');if(part){const g=unpackPlant(part.high);rootOffsets.set(id,g.boundingBox!.min.y);g.dispose();}}
 const cellSize=options.cellSize??24,cells=new Map<string,PlantPlacement[]>();for(const p of placements){const key=`${p.id}:${Math.floor(p.x/cellSize)}:${Math.floor(p.z/cellSize)}`;const list=cells.get(key)||[];list.push(p);cells.set(key,list);}
 const batches:{high:T.Group;low:T.Group;center:T.Vector3;ground:boolean}[]=[];const dummy=new T.Object3D();
 for(const list of cells.values()){
  const id=list[0].id,asset=vegetationAssets[id],high=new T.Group(),low=new T.Group();high.name=id+' high detail';low.name=id+' distant detail';scene.add(high,low);
  for(const lod of ['high','low'] as const)for(let i=0;i<asset.parts.length;i++){
   const part=asset.parts[i],key=`${id}:${i}:${lod}`;let geo=geometries.get(key);if(!geo){geo=unpackPlant(part[lod]);geo.translate(0,-(rootOffsets.get(id)||0),0);geometries.set(key,geo);}const mat=material(id,part.material),layers=part.material==='leaf'?(options.canopyLayers||1):1,mesh=new T.InstancedMesh(geo,mat,list.length*layers);mesh.name=`${id} ${part.material} ${lod}`;
   for(let layer=0;layer<layers;layer++)list.forEach((p,index)=>{const n=index+layer*list.length;dummy.position.set(p.x,p.y-(asset.height>3?.045:0),p.z);dummy.rotation.set(0,p.rotation+layer*1.73,0);dummy.scale.set(p.scale*(options.widthScale??1),p.scale,p.scale*(options.widthScale??1));dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);if(['leaf','foliage','canopy'].includes(part.material))mesh.setColorAt(n,new T.Color().setScalar(.88+(n%5)*.045));});mesh.castShadow=asset.height>1;mesh.receiveShadow=true;
   if(part.material==='leaf'){const d=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:atlas,alphaTest:.48,side:T.DoubleSide});depths.push(d);mesh.customDepthMaterial=d;}
   mesh.computeBoundingSphere();mesh.boundingSphere!.radius+=.2;(lod==='high'?high:low).add(mesh);
  }
  const center=new T.Vector3();for(const p of list)center.add(new T.Vector3(p.x,p.y,p.z));center.divideScalar(list.length);batches.push({high,low,center,ground:asset.height<1});low.visible=false;
 }
 let quality='high';return {setQuality(q:string){quality=q;},update(t:number,camera?:T.Vector3){time.value=t;if(!camera)return;for(const b of batches){const distance=Math.hypot(camera.x-b.center.x,camera.z-b.center.z),near=quality==='high'?(options.detailedRange||100):quality==='medium'?55:0,range=b.ground?(quality==='low'?24:55):(options.range||240);const visible=distance<range;const detailed=distance<near;b.high.visible=visible&&detailed;b.low.visible=visible&&!detailed;}},dispose(){depths.forEach(d=>d.dispose());},stats:{plants:placements.length,cells:cells.size,types:[...new Set(placements.map(p=>p.id))]}};
}

export function gardenGrass(){
 const geometry=(kind:keyof typeof gardenGrassAssets)=>{const source=gardenGrassAssets[kind],raw=bytes(source.p),colors=bytes(source.c),indices=bytes(source.i),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(raw.buffer),3));g.setAttribute('color',new T.BufferAttribute(new Float32Array(colors.buffer),3));g.setIndex(new T.BufferAttribute(new Uint16Array(indices.buffer),1));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;};
 const garden=geometry('garden'),wisps=geometry('wisps'),time={value:0};
 const material=new T.MeshStandardMaterial({color:'#b8cdb4',vertexColors:true,roughness:.88,side:T.DoubleSide});
 material.onBeforeCompile=s=>{s.uniforms.meadowTime=time;s.vertexShader='uniform float meadowTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 float gardenWind=sin(meadowTime*1.45+instanceMatrix[3].x*.37+instanceMatrix[3].z*.29);
 transformed.x+=gardenWind*position.y*position.y*.15;
 transformed.z+=sin(meadowTime*.83+instanceMatrix[3].z*.41)*position.y*position.y*.08;
 #endif`);};material.customProgramCacheKey=()=> 'asterion-garden-grass-v2';
 return {garden,wisps,material,update(t:number){time.value=t;}};
}
