import { build, context } from 'esbuild';
import { mkdir, copyFile, readFile, rm } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const dev=process.argv.includes('--serve');
const output=path.resolve('dist');
if(path.dirname(output)!==process.cwd())throw new Error('Invalid build output path');
await rm(output,{recursive:true,force:true});
await mkdir('dist/assets',{recursive:true});
await copyFile('index.html','dist/index.html');await copyFile('public/favicon.svg','dist/favicon.svg');
const options={entryPoints:['main.tsx'],bundle:true,format:'esm',splitting:true,outdir:'dist/assets',entryNames:'[name]',chunkNames:'[name]-[hash]',minify:!dev,sourcemap:dev,target:'es2022',alias:{'@':process.cwd()},define:{'process.env.NODE_ENV':JSON.stringify(dev?'development':'production')},logLevel:'info'};
if(dev){const ctx=await context(options);await ctx.watch();const root=path.resolve('dist');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.map':'application/json'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const requested=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(requested!==root&&!requested.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(requested);res.writeHead(200,{'Content-Type':mime[path.extname(requested)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});server.listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));process.on('SIGINT',async()=>{server.close();await ctx.dispose();process.exit(0);});}
else { await build(options); await import('./export-portable.mjs'); }
