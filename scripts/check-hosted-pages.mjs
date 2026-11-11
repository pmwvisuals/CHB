import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'),base=new URL('https://pmwvisuals.com/CHB/');
let resources=0;
async function check(reference,from){
 if(/^(data:|https?:|#)/.test(reference))return;
 const url=new URL(reference,from);assert.equal(url.origin,base.origin);
 assert(url.pathname.startsWith(base.pathname),'Asset escaped /CHB/: '+url);
 const file=path.resolve(root,'.'+url.pathname.slice(base.pathname.length-1));
 assert(file.startsWith(root+path.sep),'Invalid asset path');assert((await stat(file)).isFile(),'Missing '+url);resources++;
}
for(const file of (await readdir(root)).filter(n=>n.endsWith('.html'))){
 const html=await readFile(path.join(root,file),'utf8'),from=new URL(file,base);
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g))await check(match[1],from);
}
for(const file of (await readdir(path.join(root,'assets'))).filter(n=>n.endsWith('.js'))){
 const js=await readFile(path.join(root,'assets',file),'utf8'),from=new URL('assets/'+file,base);
 for(const match of js.matchAll(/(?:from\s*|import\s*\(\s*)["'](\.\.?\/[^"']+)["']/g))await check(match[1],from);
}
console.log('PASS /CHB/ hosted pages and module chunks:',resources,'local resource references resolve inside deployment');
