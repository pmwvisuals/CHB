import assert from 'node:assert/strict';
import * as T from 'three';
import {terrainSurface} from '../lib/game/terrain-surface';
// A peaked, piecewise-linear ridge whose two slopes cross an overlay triangle.
const base=new T.BufferGeometry();base.setAttribute('position',new T.Float32BufferAttribute([-2,0,-2,2,0,-2,2,0,2,-2,0,2,0,2,0],3));base.setIndex([0,4,1,1,4,2,2,4,3,3,4,0]);
const shape=new T.PlaneGeometry(3,3);shape.rotateX(-Math.PI/2);
const surface=terrainSurface(base),road=surface.stamp(shape,.11),sand=surface.stamp(shape,.025);
for(const [geometry,lift] of [[road,.11],[sand,.025]] as const){const a=geometry.getAttribute('position');assert(a.count>6,'overlay splits at terrain edges');for(let i=0;i<a.count;i++){const expected=2-Math.max(Math.abs(a.getX(i)),Math.abs(a.getZ(i)));assert(Math.abs(a.getY(i)-expected-lift)<1e-5,'overlay follows the actual terrain triangles');}}
assert.equal(road.getAttribute('position').count,sand.getAttribute('position').count);
for(let i=0;i<road.getAttribute('position').count;i++)assert(road.getAttribute('position').getY(i)>sand.getAttribute('position').getY(i)+.08,'paving has a definite layer above sand');
console.log('PASS conforming terrain overlays: ridge coverage, shared topology and distinct road/sand heights');
