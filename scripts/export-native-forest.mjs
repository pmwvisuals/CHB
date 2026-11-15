import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {build} from 'esbuild';
import {Scene} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {installCanvas,png} from './native-canvas.mjs';

installCanvas();
globalThis.ProgressEvent ??= class { constructor(type,options={}) {this.type=type;Object.assign(this,options);} };
const out='native/assets/deep-forest';
await fs.mkdir(out,{recursive:true});
await build({entryPoints:['lib/game/deep-forest-layout.ts'],outfile:'.tools/native-forest-layout.mjs',bundle:true,platform:'node',format:'esm'});
const source=await import('../.tools/native-forest-layout.mjs');
const ids=['forest_oak','forest_hornbeam','forest_cedar','forest_fir','forest_spruce','forest_litter','forest_fern','forest_bracken','forest_bramble'];
const root=new Scene();
for(const id of ids){
 const bytes=await fs.readFile('assets-source/vegetation/'+id+'.glb');
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
 root.add(gltf.scene);
}
const exported=await new GLTFExporter().parseAsync(root,{binary:true});
await fs.writeFile(out+'/prototypes.glb',Buffer.from(exported));
const placements=source.deepForestPlacements();
const encode=p=>[ids.indexOf(p.id),p.x,p.y,p.z,p.scale,p.rotation].map(v=>Math.round(v*10000)/10000);
const size=241,spacing=3,origin=-360,heights=[];
for(let z=0;z<size;z++)for(let x=0;x<size;x++)heights.push(source.deepForestHeight(origin+x*spacing,origin+z*spacing));
const data={version:1,radius:275,sceneryRadius:source.deepForest.sceneryRadius,spawn:[0,216],gate:[0,224],ids,trees:placements.trees.map(encode),floor:placements.floor.map(encode),clearings:source.forestClearings,mist:source.forestMistPockets,trails:source.forestTrails.map(path=>path.map(p=>[p.x,p.z])),heightfield:{size,spacing,origin,values:heights}};
await fs.writeFile(out+'/layout.json',JSON.stringify(data));
const maskSize=513,mask=new Uint8Array(maskSize*maskSize*4);
for(let z=0;z<maskSize;z++)for(let x=0;x<maskSize;x++){
 const xx=origin+x/(maskSize-1)*720,zz=origin+z/(maskSize-1)*720,i=(z*maskSize+x)*4;
 const trail=1-Math.min(1,Math.max(0,(source.forestTrailDistance(xx,zz)-1.4)/1.6));
 const opening=1-source.forestCanopyCover(xx,zz);
 mask[i]=Math.round(trail*255);
 mask[i+1]=Math.round((.5+.5*opening)*255);
 mask[i+2]=Math.round(source.forestPatchNoise(xx*.038,zz*.038)*255);
 mask[i+3]=Math.round(Math.min(1,Math.max(0,(source.deepForestHeight(xx,zz)+6)/32))*255);
}
await fs.writeFile(out+'/habitat.png',png(maskSize,maskSize,mask));
// A small seamless noise tile supplies soft world-anchored mist pockets.
const n=128,fog=new Uint8Array(n*n*4),soilNoise=new Uint8Array(n*n*4);
function tileNoise(x,z,period){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
 const hash=(a,b)=>{const value=Math.sin(((a%period+period)%period)*127.1+((b%period+period)%period)*311.7)*43758.5453;return value-Math.floor(value);};
 return (hash(ix,iz)*(1-u)+hash(ix+1,iz)*u)*(1-v)+(hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u)*v;
}
for(let z=0;z<n;z++)for(let x=0;x<n;x++){
 const u=x/n*Math.PI*2,v=z/n*Math.PI*2,i=(z*n+x)*4;
 const noise=.5+.19*Math.sin(u+Math.sin(v*2))+.14*Math.cos(v*3-u*2)+.09*Math.sin(u*5+v*4);
 fog[i]=fog[i+1]=fog[i+2]=255;
 const edge=Math.max(0,1-((x/(n-1)-.5)*2)**2-((z/(n-1)-.5)*2)**2);
 fog[i+3]=Math.round(Math.max(0,noise)*edge*edge*255);
 const grain=tileNoise(x/n*8,z/n*8,8)*.25+tileNoise(x/n*32,z/n*32,32)*.4+tileNoise(x/n*64,z/n*64,64)*.35;
 soilNoise[i]=soilNoise[i+1]=soilNoise[i+2]=Math.round(grain*255);
 soilNoise[i+3]=255;
}
await fs.writeFile(out+'/mist.png',png(n,n,fog));
await fs.writeFile(out+'/soil-noise.png',png(n,n,soilNoise));
const manifestPath='native/assets-manifest.json',manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
manifest.assets=manifest.assets.filter(a=>!a.file.startsWith('assets/deep-forest/'));
for(const name of ['prototypes.glb','layout.json','habitat.png','mist.png','soil-noise.png']){
 const bytes=await fs.readFile(out+'/'+name);
 manifest.assets.push({file:'assets/deep-forest/'+name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),source:'scripts/export-native-forest.mjs; existing forest layout and project-authored vegetation'});
}
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('FOREST EXPORT',placements.trees.length,'trees,',placements.floor.length,'floor plants,',data.trails.length,'trails');
