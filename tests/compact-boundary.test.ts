import assert from 'node:assert/strict';
import {boundaryContour,insideCamp,insideCampTerrain} from '../lib/game/camp-boundary';
import {forestDepth} from '../lib/game/forest-border-layout';
import {forestBorderPlacements} from '../lib/game/forest-border';
import {templeSites,sitePoint,templeTrails,type SiteId} from '../lib/game/sanctuary-layout';
const outline=boundaryContour();let area=0;
outline.forEach(([x,z],i)=>{const [nx,nz]=outline[(i+1)%outline.length];area+=x*nz-z*nx;});area=Math.abs(area)/2;
assert.ok(area<235*235*4*.7,'unused outer land is substantially reduced');
assert.ok(Math.max(...outline.flat().map(Math.abs))<220,'perimeter moves inward');
for(const id of Object.keys(templeSites) as SiteId[]){
 for(const x of [-10.5,10.5])for(const z of [-10,16]){const p=sitePoint(id,x,z);assert.ok(insideCamp(p.x,p.z),id+' decorative grounds remain walkable');}
 const approach=sitePoint(id,0,17);assert.ok(insideCamp(approach.x,approach.z),id+' approach retained');
 for(const [x,z] of templeTrails[id])assert.ok(insideCamp(x,z),id+' path retained');
}
for(const id of ['ares','aphrodite','hephaestus'] as const){const s=templeSites[id];assert.ok(forestDepth(s.x,s.z)>12&&forestDepth(s.x,s.z)<35,id+' sits inside the forest belt');}
for(const id of ['ares','hephaestus'] as const){
 for(const x of [-10.5,10.5])for(const z of [-10,16]){const p=sitePoint(id,x,z);assert.ok(forestDepth(p.x,p.z)>4,id+' whole building and forecourt lie past the forest start');}
}
assert.ok(forestDepth(templeSites.aphrodite.x,templeSites.aphrodite.z)>12,'Aphrodite sits inside the forest belt');
const trees=forestBorderPlacements();assert.ok(trees.filter(p=>forestDepth(p.x,p.z)<3).length>180,'the first trunks visibly define the forest start');
for(const id of ['ares','aphrodite','hephaestus'] as const){
 const s=templeSites[id],r=Math.hypot(s.x,s.z),x=s.x/r,z=s.z/r;
 const behind=trees.filter(p=>p.x*x+p.z*z>r+18&&Math.abs(p.x*z-p.z*x)<8&&Math.hypot(p.x-s.x,p.z-s.z)<40);
 assert.ok(behind.length>=2,id+' has trees behind its protected clearing');
}
for(const p of trees){assert.ok(forestDepth(p.x,p.z)>=.35);assert.ok(insideCampTerrain(p.x,p.z,-2),'every root stays on retained terrain');}
console.log('PASS compact boundary:',Math.round(area),'square metres; all twelve sites, paths and forest-side roots retained');
