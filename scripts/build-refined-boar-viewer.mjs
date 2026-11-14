import fs from 'node:fs/promises';
const bytes=await fs.readFile('assets-source/creatures/ash-tusk-boar/refined/ash-tusk-boar-refined.glb');
let html=await fs.readFile('asterion-boar-runtime.html','utf8');
html=html.replace(/(window.__BOAR_GLB__=)"[^"]*"/,(_,prefix)=>prefix+JSON.stringify(bytes.toString('base64'))).replaceAll('ash-tusk-boar-runtime.glb','ash-tusk-boar-refined.glb').replaceAll('Gameplay Boar','Refined Boar').replace('Reduced gameplay boar ·','Refined coat and brow ·');
await fs.writeFile('asterion-boar-refined.html',html);
console.log('Refined viewer embeds actual model:',bytes.length,'bytes');
