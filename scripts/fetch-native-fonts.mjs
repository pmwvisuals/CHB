import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const root='https://raw.githubusercontent.com/google/fonts/main/ofl/';
const fonts=[
 {file:'Cinzel.ttf',source:'cinzel/Cinzel%5Bwght%5D.ttf',sha256:'f4d83d34d1f6c741193e4acf4b3dff9531e5a67b6aa65228d00a7db72a4e0f34',license:'cinzel/OFL.txt',licenseFile:'OFL-Cinzel.txt'},
 {file:'BarlowSemiCondensed-Medium.ttf',source:'barlowsemicondensed/BarlowSemiCondensed-Medium.ttf',sha256:'4998b693a190b76f2b11315844345a8546c1e2e6a320905507a9eed04edf8b48',license:'barlowsemicondensed/OFL.txt',licenseFile:'OFL-Barlow.txt'},
];
await fs.mkdir('native/fonts',{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function download(source){const response=await fetch(root+source);if(!response.ok)throw Error('Font download failed: '+response.status);return Buffer.from(await response.arrayBuffer());}
for(const font of fonts){
 const file='native/fonts/'+font.file;
 let bytes=await fs.readFile(file).catch(()=>null);
 if(!bytes||hash(bytes)!==font.sha256){bytes=await download(font.source);if(hash(bytes)!==font.sha256)throw Error('Font version changed upstream: '+font.file);await fs.writeFile(file,bytes);}
 const license='native/fonts/'+font.licenseFile;
 if(!await fs.stat(license).then(()=>true).catch(()=>false))await fs.writeFile(license,await download(font.license));
 console.log('Verified',font.file);
}
