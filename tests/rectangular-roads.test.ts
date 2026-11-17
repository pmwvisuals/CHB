import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {campRoutes,routePoints} from '../lib/game/camp-layout';
import {rectangleOutline,roadRectangles} from '../lib/game/rectangular-roads';
for(const route of campRoutes){const p=routePoints(route.points);assert.equal(p.length,161);for(let i=1;i<p.length;i++)assert.ok(Math.abs(p[i].x-p[i-1].x)<1e-6||Math.abs(p[i].z-p[i-1].z)<1e-6,route.name+' uses straight orthogonal legs');}
const r=[{x0:-10,x1:10,z0:-2,z1:2},{x0:-2,x1:2,z0:-10,z1:10}],inside=(x:number,z:number)=>r.some(a=>x>a.x0&&x<a.x1&&z>a.z0&&z<a.z1);
for(const e of rectangleOutline(r)){const t=(e.a+e.b)/2,a=e.horizontal?inside(t,e.fixed-.01):inside(e.fixed-.01,t),b=e.horizontal?inside(t,e.fixed+.01):inside(e.fixed+.01,t);assert.notEqual(a,b,'outline follows the outside union, never an internal road junction');}
assert.ok(roadRectangles([new Vector3(0,0,0),new Vector3(10,0,0),new Vector3(5,0,0)],2).some(r=>r.x1>10),'reversing a straight approach preserves its furthest endpoint');
console.log('PASS rectangular camp roads: all sampled legs are axis-aligned and crossing borders follow the exposed union');
