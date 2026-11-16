import assert from 'node:assert/strict';
import {forgottenShrine as shrine,shrinePoint,shrineDistance,shrineApproachDistance} from '../lib/game/shrine-layout';
import {landmarks,groundHeight} from '../lib/game/data';
import {insideCamp} from '../lib/game/camp-boundary';
import {forestDepth} from '../lib/game/forest-border-layout';
import {forestBorderPlacements} from '../lib/game/forest-border';
import {forestUnderstoryPlacements} from '../lib/game/forest-understory';
import {campRoutes,routePoints} from '../lib/game/camp-layout';
import {roadCover} from '../lib/game/ground-surface';
assert.ok(forestDepth(shrine.x,shrine.z)>15&&insideCamp(shrine.x,shrine.z,-15),'small clearing sits inside the existing boundary forest');
const discovery=landmarks.find(l=>l.id==='shrine')!;assert.equal(discovery.x,shrine.x);assert.equal(discovery.z,shrine.z);
for(const x of [-4,0,4])for(const z of [-3,0,3]){const p=shrinePoint(x,z);assert.ok(Math.abs(groundHeight(p.x,p.z)-shrine.height)<1e-5,'shrine foundation is level');}
const trees=forestBorderPlacements();assert.ok(trees.length>2000&&trees.every(p=>shrineDistance(p.x,p.z)>=shrine.clearingRadius&&shrineApproachDistance(p.x,p.z)>=4.5),'tree belt preserves a clear shrine footprint');
assert.ok(trees.filter(p=>shrineDistance(p.x,p.z)<22).length>12,'shrine stays surrounded by dark forest trees');
const floor=forestUnderstoryPlacements();assert.ok([...floor.plants,...floor.grass].every(p=>shrineDistance(p.x,p.z)>=shrine.clearingRadius),'tall forest understory stays outside the clearing');
const trail=campRoutes.find(r=>r.name==='Shrine trail')!,points=routePoints(trail.points);for(const p of points)assert.ok(insideCamp(p.x,p.z)&&roadCover(p.x,p.z)>.95,'continuous narrow shrine approach stays inside the camp');
console.log('PASS boundary-forest shrine: shared discovery, level foundation, surrounding trees, clear footprint, connected approach and unchanged camp outline');
