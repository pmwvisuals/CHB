import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { installCanvas } from './native-canvas.mjs';
installCanvas();
await fs.mkdir('.tools/native-export',{recursive:true});
await fs.mkdir('native/assets/weapons',{recursive:true});
await build({stdin:{contents:"export * from './lib/game/practice-weapons';",resolveDir:process.cwd()},outfile:'.tools/native-export/weapons.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const source=await import(pathToFileURL(path.resolve('.tools/native-export/weapons.mjs')).href);
const bow=source.practiceBow().root;
for(const child of [...bow.children])if(child.isLine||child.name==='Practice arrow')bow.remove(child);
const exporter=new GLTFExporter(),assets=[];
for(const [name,model] of [['practice-sword',source.practiceSword()],['practice-bow',bow],['practice-arrow',source.practiceArrow()]]){
 const scene=new T.Scene();scene.add(model);
 const bytes=Buffer.from(await exporter.parseAsync(scene,{binary:true}));
 const file='assets/weapons/'+name+'.glb';
 await fs.writeFile(path.join('native',file),bytes);
 assets.push({source:'lib/game/practice-weapons.ts',file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
const manifest=JSON.parse(await fs.readFile('native/assets-manifest.json','utf8'));
manifest.assets=manifest.assets.filter(a=>!a.file.startsWith('assets/weapons/')).concat(assets);
await fs.writeFile('native/assets-manifest.json',JSON.stringify(manifest,null,2));
console.log('Exported existing weapon designs:',assets.map(a=>({file:a.file,bytes:a.bytes})));
