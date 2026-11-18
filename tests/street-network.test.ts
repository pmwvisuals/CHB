import assert from 'node:assert/strict';
import fs from 'node:fs';
import {campRoutes,routePoints,centralCourt} from '../lib/game/camp-layout';
import {streetRectangles,streetPlan} from '../lib/game/camp-streets';
import {templeSites,sitePoint,type SiteId} from '../lib/game/sanctuary-layout';
const rectangles=streetRectangles,touch=(a:typeof rectangles[number],b:typeof rectangles[number])=>Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>=-1e-4&&Math.min(a.z1,b.z1)-Math.max(a.z0,b.z0)>=-1e-4;
for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){const a=rectangles[i],b=rectangles[j];assert.ok(Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)<1e-4||Math.min(a.z1,b.z1)-Math.max(a.z0,b.z0)<1e-4,'union has no stacked overlapping paving rectangles');}
const reached=new Set([0]);for(let again=true;again;){again=false;for(let i=0;i<rectangles.length;i++)if(!reached.has(i)&&[...reached].some(j=>touch(rectangles[i],rectangles[j]))){reached.add(i);again=true;}}
assert.equal(reached.size,rectangles.length,'all paving forms a single connected network; no floating street pieces');
const cover=(x:number,z:number)=>rectangles.some(r=>x>=r.x0-1e-4&&x<=r.x1+1e-4&&z>=r.z0-1e-4&&z<=r.z1+1e-4);
for(const [x,z,name] of [[0,109,'Arrival'],[0,11,'Great Hall'],[-55,62,'Wayfarer'],[46,52,'Dining'],[-67,-15,'Training'],[55,5,'Lake'],[65,31,'Lakeside'],[53,-18,'Dock'],[-40,-117,'Deepwood']] as const)assert.ok(cover(x,z),name+' entrance connects');
for(const id of Object.keys(templeSites) as SiteId[]){if(id==='poseidon')continue;for(const distance of [10,12,14,16]){const p=sitePoint(id,0,distance);assert.ok(cover(p.x,p.z),id+' ramp approach is paved');}assert.ok(!cover(templeSites[id].x,templeSites[id].z),id+' streets do not run through the building');}
assert.ok(!cover(0,0),'main street routes around the Great Hall instead of under it');
assert.equal(centralCourt.halfWidth,0,'no freestanding central plaza remains');
assert.equal(campRoutes.filter(r=>r.kind==='main').length,1,'exactly one primary street');
for(const r of campRoutes){const p=routePoints(r.points);for(let i=1;i<p.length;i++)assert.ok(Math.abs(p[i].x-p[i-1].x)<1e-6||Math.abs(p[i].z-p[i-1].z)<1e-6,'streets use right-angle legs');}
const plan=streetPlan();assert.equal(plan.paving.length,rectangles.length+1,'map includes every paved footprint and the island causeway');
// Measured union area of the superseded camp network, including its central court.
const beforeArea=12219.154508187601;
assert.ok(plan.area<beforeArea*.75,'review removes at least a quarter of the former paved area');
const report={beforePavedArea:beforeArea,pavedArea:plan.area,reductionPercent:100*(1-plan.area/beforeArea),connectedComponents:1,mainRoads:1,plazas:0,routeCount:campRoutes.length,footprintRectangles:rectangles.length};fs.mkdirSync('.tools',{recursive:true});fs.writeFileSync('.tools/street-review.json',JSON.stringify(report,null,2));console.log('PASS audited street network',JSON.stringify(report));
