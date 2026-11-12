import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const pairs=[
 ['assets-source/vegetation/camp_olive.glb','camp_olive.glb'],
 ['assets-source/vegetation/camp_laurel.glb','camp_laurel.glb'],
 ['assets-source/vegetation/forest_fir.glb','forest_fir.glb'],
 ['assets-source/vegetation/forest_oak.glb','forest_oak.glb'],
 ['assets-source/vegetation/forest_fern.glb','forest_fern.glb'],
 ['assets-source/creatures/ash-tusk-boar/runtime/ash-tusk-boar-runtime.glb','boar.glb'],
];
await fs.mkdir('native/assets',{recursive:true});
const assets=[];
for(const [source,name] of pairs){const bytes=await fs.readFile(source);await fs.writeFile(path.join('native/assets',name),bytes);assets.push({source,file:'assets/'+name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
await fs.writeFile('native/assets-manifest.json',JSON.stringify({assets},null,2));
console.log('Staged six existing assets:',assets.reduce((sum,a)=>sum+a.bytes,0),'bytes.');
