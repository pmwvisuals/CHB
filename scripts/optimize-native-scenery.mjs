// Rebatch opaque scenery without removing a triangle, changing a texture, or
// changing the road/collision surfaces. Re-run the camp exporter to regenerate.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import * as T from 'three';

export async function optimizeScenery(file='native/assets/camp/camp-static.glb') {
 const raw=await fs.readFile(file);
 const jsonLength=raw.readUInt32LE(12);
 const doc=JSON.parse(raw.subarray(20,20+jsonLength).toString());
 if(doc.asset.extras?.spatialPalette) return {alreadyOptimized:true};
 const oldBin=raw.subarray(28+jsonLength);
 const chunks=[],views=[],accessors=[],meshes=[],nodes=[],materials=[];
 let byteLength=0,sourceTriangles=0,outputTriangles=0;
 const align=b=>b.length%4?Buffer.concat([b,Buffer.alloc(4-b.length%4)]):b;
 function bufferView(bytes,target){
  const bytesAligned=align(bytes),index=views.length;
  views.push({buffer:0,byteOffset:byteLength,byteLength:bytes.length,...(target?{target}:{})});
  chunks.push(bytesAligned);byteLength+=bytesAligned.length;return index;
 }
 const copiedViews=new Map(),copiedAccessors=new Map();
 function copyView(index){
  if(copiedViews.has(index))return copiedViews.get(index);
  const v=doc.bufferViews[index];
  const result=bufferView(oldBin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength),v.target);
  if(v.byteStride)views[result].byteStride=v.byteStride;
  copiedViews.set(index,result);return result;
 }
 function copyAccessor(index){
  if(copiedAccessors.has(index))return copiedAccessors.get(index);
  const a=doc.accessors[index];if(a.sparse)throw Error('Sparse scenery accessor unsupported');
  const result=accessors.length;accessors.push({...a,bufferView:copyView(a.bufferView)});
  copiedAccessors.set(index,result);return result;
 }
 const imageHashes=(doc.images||[]).map(im=>{
  const v=doc.bufferViews[im.bufferView];
  return crypto.createHash('sha256').update(oldBin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)).digest('hex');
 });
 const canonical=new Map(),textureMap=new Map();
 for(let i=0;i<(doc.textures||[]).length;i++){
  const tex=doc.textures[i],key=imageHashes[tex.source]+JSON.stringify(doc.samplers?.[tex.sampler]);
  if(!canonical.has(key))canonical.set(key,i);
  textureMap.set(i,canonical.get(key));
 }
 const materialMap=new Map();
 function copyMaterial(index){
  if(!materialMap.has(index)){materialMap.set(index,materials.length);materials.push(structuredClone(doc.materials[index]));}
  return materialMap.get(index);
 }
 const componentSize={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
 const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
 function attribute(index){
  if(index==null)return null;
  const a=doc.accessors[index],v=doc.bufferViews[a.bufferView],count=components[a.type],size=componentSize[a.componentType];
  const stride=v.byteStride||count*size,offset=(v.byteOffset||0)+(a.byteOffset||0);
  const read={5120:'readInt8',5121:'readUInt8',5122:'readInt16LE',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];
  return {count:a.count,at(i){const out=[];for(let c=0;c<count;c++){let n=oldBin[read](offset+i*stride+c*size);if(a.normalized){const max={5120:127,5121:255,5122:32767,5123:65535}[a.componentType];n=Math.max(-1,n/max);}out.push(n);}return out;}};
 }
 function newAttribute(values,size,type){
  const array=Float32Array.from(values),a={bufferView:bufferView(Buffer.from(array.buffer),34962),componentType:5126,count:values.length/size,type};
  if(size===3){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<values.length;i++) {const c=i%3;a.min[c]=Math.min(a.min[c],values[i]);a.max[c]=Math.max(a.max[c],values[i]);}}
  accessors.push(a);return accessors.length-1;
 }
 const groups=new Map(),paletteMaterials=new Map();
 const worldMatrices=new Map();
 function visit(index,parent){
  const n=doc.nodes[index],local=new T.Matrix4();
  if(n.matrix)local.fromArray(n.matrix);else local.compose(new T.Vector3().fromArray(n.translation||[0,0,0]),new T.Quaternion().fromArray(n.rotation||[0,0,0,1]),new T.Vector3().fromArray(n.scale||[1,1,1]));
  const matrix=new T.Matrix4().multiplyMatrices(parent,local);worldMatrices.set(index,matrix);
  for(const child of n.children||[])visit(child,matrix);
 }
 for(const index of doc.scenes[doc.scene||0].nodes)visit(index,new T.Matrix4());
 let batchedSourceMeshes=0,retainedMeshes=0;
 for(const [index,matrix] of worldMatrices){
  const node=doc.nodes[index];if(node.mesh==null)continue;
  const source=doc.meshes[node.mesh];
  const keep=[];
  for(const p of source.primitives){
   const mat=doc.materials[p.material],pbr=mat.pbrMetallicRoughness||{};
   const position=attribute(p.attributes.POSITION),indices=attribute(p.indices);
   const count=indices?.count||position.count;
   if((p.mode??4)!==4||count%3)throw Error('Expected triangle scenery');
   sourceTriangles+=count/3;
   // Keep the special ground/water/roads, transparent glows, and normal maps.
   const eligible=!/^(CampTerrain|CampRoad|MirrorLake)/.test(node.name||'') &&
    !mat.alphaMode && !mat.emissiveFactor && !mat.normalTexture && !pbr.metallicRoughnessTexture &&
    (!pbr.baseColorTexture||((pbr.baseColorTexture.texCoord||0)===0&&!pbr.baseColorTexture.extensions)) &&
    !mat.extensions?.KHR_materials_unlit;
   if(!eligible){
    const copy=structuredClone(p);for(const [name,a] of Object.entries(p.attributes))copy.attributes[name]=copyAccessor(a);
    if(p.indices!=null)copy.indices=copyAccessor(p.indices);
    copy.material=copyMaterial(p.material);keep.push(copy);outputTriangles+=count/3;continue;
   }
   const tex=pbr.baseColorTexture?textureMap.get(pbr.baseColorTexture.index):-1;
   const materialKey=tex+':'+!!mat.doubleSided;
   if(!paletteMaterials.has(materialKey)){
    const material={name:'SpatialPalette_'+(tex<0?'plain':tex)+(mat.doubleSided?'_two_sided':''),pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1}};
    if(tex>=0)material.pbrMetallicRoughness.baseColorTexture={index:tex};
    if(mat.doubleSided)material.doubleSided=true;
    paletteMaterials.set(materialKey,materials.length);materials.push(material);
   }
   const normals=attribute(p.attributes.NORMAL),uv=attribute(p.attributes.TEXCOORD_0),colors=attribute(p.attributes.COLOR_0);
   // Godot imports glTF's linear baseColorFactor into an sRGB Color. Its
   // Compatibility renderer multiplies that Color by the raw vertex color.
   const normalMatrix=new T.Matrix3().getNormalMatrix(matrix),linearFactor=pbr.baseColorFactor||[1,1,1,1];
   const factor=[...new T.Color().fromArray(linearFactor).convertLinearToSRGB().toArray(),linearFactor[3]];
   const transformed=new Map();
   function vertex(i){
    if(transformed.has(i))return transformed.get(i);
    const pos=new T.Vector3().fromArray(position.at(i)).applyMatrix4(matrix),normal=new T.Vector3().fromArray(normals.at(i)).applyNormalMatrix(normalMatrix);
    const color=colors?.at(i)||[1,1,1,1];
    const v={pos:pos.toArray(),normal:normal.toArray(),uv:uv?.at(i)||[0,0],color:[color[0]*factor[0],color[1]*factor[1],color[2]*factor[2],(color[3]??1)*factor[3]]};
    transformed.set(i,v);return v;
   }
   for(let t=0;t<count;t+=3){
    const tri=[0,1,2].map(c=>vertex(indices?indices.at(t+c)[0]:t+c));
    const x=tri.reduce((s,v)=>s+v.pos[0],0)/3,z=tri.reduce((s,v)=>s+v.pos[2],0)/3;
    const cx=Math.floor(x/48)*48+24,cz=Math.floor(z/48)*48+24,key=cx+':'+cz+':'+materialKey;
    if(!groups.has(key))groups.set(key,{cx,cz,material:paletteMaterials.get(materialKey),position:[],normal:[],uv:[],color:[],pbr:[],indices:[],vertices:new Map()});
    const g=groups.get(key);
    for(const v of tri){
     // Float32 values and attributes all participate, retaining hard edges.
     const values=[v.pos[0]-cx,v.pos[1],v.pos[2]-cz,...v.normal,...v.uv,...v.color,pbr.roughnessFactor??1,pbr.metallicFactor??1];
     const hash=values.map(Math.fround).join(',');
     if(!g.vertices.has(hash)){
      g.vertices.set(hash,g.position.length/3);g.position.push(...values.slice(0,3));g.normal.push(...v.normal);g.uv.push(...v.uv);g.color.push(...v.color);g.pbr.push(pbr.roughnessFactor??1,pbr.metallicFactor??1);
     }
     g.indices.push(g.vertices.get(hash));
    }
    outputTriangles++;
   }
   batchedSourceMeshes++;
  }
  if(keep.length){
   const n={name:node.name,matrix:matrix.toArray(),mesh:meshes.length};nodes.push(n);meshes.push({primitives:keep});retainedMeshes++;
  }
 }
 for(const g of groups.values()){
  const attrs={POSITION:newAttribute(g.position,3,'VEC3'),NORMAL:newAttribute(g.normal,3,'VEC3'),TEXCOORD_0:newAttribute(g.uv,2,'VEC2'),COLOR_0:newAttribute(g.color,4,'VEC4'),TEXCOORD_1:newAttribute(g.pbr,2,'VEC2')};
  const arr=Uint32Array.from(g.indices),ia=accessors.length;
  accessors.push({bufferView:bufferView(Buffer.from(arr.buffer),34963),componentType:5125,count:arr.length,type:'SCALAR'});
  nodes.push({name:'SceneryCell_'+g.cx+'_'+g.cz+'_'+meshes.length,translation:[g.cx,0,g.cz],mesh:meshes.length});
  meshes.push({primitives:[{mode:4,attributes:attrs,indices:ia,material:g.material}]});
 }
 if(outputTriangles!==sourceTriangles)throw Error('Scenery triangle preservation failed');
 const images=(doc.images||[]).map(im=>({...im,bufferView:copyView(im.bufferView)}));
 const output={asset:{...doc.asset,extras:{spatialPalette:true,sourceTriangles}},scenes:[{nodes:nodes.map((_,i)=>i)}],scene:0,nodes,meshes,materials,images,textures:doc.textures,samplers:doc.samplers,accessors,bufferViews:views,buffers:[{byteLength}]};
 if(doc.extensionsUsed)output.extensionsUsed=doc.extensionsUsed;
 const json=align(Buffer.from(JSON.stringify(output))),binary=Buffer.concat(chunks),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);
 // JSON padding must be spaces, rather than the binary zero padding.
 const jsonText=Buffer.from(JSON.stringify(output));json.fill(32,jsonText.length);
 header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
 binHeader.writeUInt32LE(binary.length,0);binHeader.writeUInt32LE(0x004e4942,4);
 await fs.writeFile(file,Buffer.concat([header,json,binHeader,binary]));
 const result={sourceMeshes:doc.meshes.length,batchedSourceMeshes,retainedMeshes,spatialCells:groups.size,outputMeshes:meshes.length,sharedPaletteMaterials:paletteMaterials.size,triangles:sourceTriangles,sourceBytes:raw.length,outputBytes:28+json.length+binary.length};
 console.log('Scenery batching',JSON.stringify(result));return result;
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const file=process.argv[2]||'native/assets/camp/camp-static.glb';await optimizeScenery(file);
 const manifestPath='native/assets-manifest.json',manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 const bytes=await fs.readFile(file),entry=manifest.assets.find(a=>a.file==='assets/camp/camp-static.glb');
 entry.bytes=bytes.length;entry.sha256=crypto.createHash('sha256').update(bytes).digest('hex');await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
}
