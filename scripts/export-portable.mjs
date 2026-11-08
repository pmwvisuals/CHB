import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { templeCatalog, templePage } from './temple-pages.mjs';
const result=await build({entryPoints:['main.tsx'],bundle:true,format:'iife',write:false,outfile:'.sites-runtime/portable.js',minify:true,target:'es2022',alias:{'@':process.cwd()},define:{'process.env.NODE_ENV':'"production"'}});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replaceAll('</script','<\\/script');
const css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
let html=await readFile('index.html','utf8');
const favicon=await readFile('public/favicon.svg','utf8');
html=html.replace('href="/favicon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`).replace('<link rel="stylesheet" href="/assets/main.css"/>',`<style>${css}</style>`).replace('<script type="module" src="/assets/main.js"></script>',()=>`<script>${js}</script>`);
await writeFile('asterion-sanctuary.html',html);
await writeFile('camp-half-blood.html',html);
console.log('Portable game exported: asterion-sanctuary.html');
const temple=await build({entryPoints:['temple.ts'],bundle:true,format:'iife',write:false,outfile:'.sites-runtime/temple.js',minify:true,target:'es2022'});
const templeJS=temple.outputFiles.find(f=>f.path.endsWith('.js')).text.replaceAll('</script','<\\/script');
const templeCSS=temple.outputFiles.find(f=>f.path.endsWith('.css')).text;
const templeTemplate=await readFile('poseidon-page.html','utf8');
for(const theme of templeCatalog){
let templeHTML=templePage(templeTemplate,theme);
templeHTML=templeHTML.replace('href="./favicon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`).replace('<link rel="stylesheet" href="./assets/temple.css">',()=>`<style>${templeCSS}</style>`).replace('<script type="module" src="./assets/temple.js"></script>',()=>`<script>${templeJS}</script>`).replace('href="./index.html?return=poseidon"','href="./asterion-sanctuary.html?return=poseidon"');
templeHTML=templeHTML.replaceAll('./index.html?return=', './asterion-sanctuary.html?return=');
await writeFile(`${theme.id}.html`,templeHTML);
}
console.log('Exported all twelve standalone temple pages.');
