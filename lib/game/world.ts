import {buildForestBorder,forestAtmosphere} from './forest-border';
import * as T from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight as h, landmarks } from './data';
import { buildWoodland, inWoodland } from './woodland';
import type { Settings } from './data';
import { gardenGrass, plantCollection, forestTreeIds, type PlantPlacement } from './vegetation';
import { terrainGeometry,groundMaterial,groundHabitat,weatheredRockGeometry,weatheredRockMaterial } from './landscape';
import {limestoneRoadMaterial,pavedRoadGeometry} from './road-paving';
import { buildTempleExteriors,buildGreatHall } from './temple-exteriors';
import { templeCatalog,templePlacement } from './temple-catalog';
import {sanctuaryExtent,templeTrails,insideTempleGrounds,templeSites,sitePoint} from './sanctuary-layout';
import {campRoutes,routePoints,inGardenCourt} from './camp-layout';
import {buildCampGardens} from './camp-gardens';
import {buildWayfarerHall} from './wayfarer';
import {buildTrainingGround} from './training-ground';
import {buildLakeside} from './lakeside';
import {inMainLandmark} from './landmark-layout';
import {buildAtmosphere} from './atmosphere';
import {buildFlowers,type FlowerPlacement} from './flowers';
import {buildRoadBorders} from './road-borders';
import {dayCycleSeconds} from './day-cycle';
import {buildCampLighting} from './camp-lighting';

export interface World { scene: T.Scene; octree: Octree; water: T.Mesh; fire: T.Group; embers: T.Points; sun: T.DirectionalLight; atmosphere:ReturnType<typeof buildAtmosphere>; foliage: T.InstancedMesh[]; setQuality:(quality:Settings['quality'])=>void; update: (time: number, camera?:T.Vector3) => void; dispose: () => void }
export function buildWorld(): World {
  const scene = new T.Scene(); scene.background = new T.Color('#9dbed8'); scene.fog = new T.FogExp2('#9bafba', .0013);
  const collision = new T.Group();
  const flowerPlacements:FlowerPlacement[]=[];
  let seed = 721;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const materials = new Map<string,T.MeshStandardMaterial>();
  function mat(color: string, roughness= .85) { const key = color+roughness; if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({color,roughness})); return materials.get(key)!; }
  const wood = mat('#775139'), trim = mat('#e7d5ac'), stone = mat('#a7a58d'), brass = mat('#c9984e',.4);
  const grainCanvas=document.createElement('canvas');grainCanvas.width=128;grainCanvas.height=128;const grain=grainCanvas.getContext('2d')!;grain.fillStyle='#dfcfac';grain.fillRect(0,0,128,128);for(let i=0;i<200;i++){grain.strokeStyle=`rgba(65,47,25,${.02+rand()*.12})`;grain.beginPath();const y=rand()*128;grain.moveTo(0,y);grain.bezierCurveTo(32,y+rand()*5,80,y-rand()*5,128,y);grain.stroke();}const woodTexture=new T.CanvasTexture(grainCanvas);woodTexture.colorSpace=T.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=T.RepeatWrapping;wood.map=woodTexture;
  const boxGeo = new T.BoxGeometry(1,1,1);
  function mesh(geo: T.BufferGeometry, material: T.Material, parent: T.Object3D, x=0,y=0,z=0) { const m = new T.Mesh(geo,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; }
  function box(parent: T.Object3D,x:number,y:number,z:number,w:number,ht:number,d:number, material: T.Material, solid=false) {
    const m=mesh(boxGeo,material,parent,x,y,z); m.scale.set(w,ht,d);
    if(solid) { parent.updateWorldMatrix(true,false); const c=new T.Mesh(boxGeo); c.matrixAutoUpdate=false; m.updateWorldMatrix(true,false); c.matrix.copy(m.matrixWorld); collision.add(c); }
    return m;
  }
  function cyl(parent:T.Object3D,x:number,y:number,z:number,r:number,ht:number,material:T.Material,top=r) { return mesh(new T.CylinderGeometry(top,r,ht,10),material,parent,x,y,z); }
  function group(x:number,z:number,rotation=0,dy=0) { const g=new T.Group(); g.position.set(x,h(x,z)+dy,z); g.rotation.y=rotation; scene.add(g); return g; }
  function text(text:string, width:number, color='#f2e4bf', background='#304b43') {
    const c=document.createElement('canvas'); c.width=1024; c.height=256; const ctx=c.getContext('2d')!;
    ctx.fillStyle=background; ctx.fillRect(0,0,1024,256); ctx.strokeStyle='#b7a171'; ctx.lineWidth=6; ctx.strokeRect(12,12,1000,232);
    ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='52px Georgia'; ctx.fillText(text,512,132,950);
    const tex=new T.CanvasTexture(c); tex.colorSpace=T.SRGBColorSpace;
    return new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshStandardMaterial({map:tex,roughness:.9,side:T.DoubleSide}));
  }
  function sign(label:string,x:number,z:number,rot=0,width=4) { const g=group(x,z,rot); box(g,0,1,0,.16,2,.16,wood,true); const p=text(label,width); p.position.y=2; g.add(p); return g; }
  function lantern(parent:T.Object3D,x:number,y:number,z:number) {
    box(parent,x,y,z,.3,.48,.3,brass); box(parent,x,y,z+.16,.22,.3,.01,new T.MeshStandardMaterial({color:'#ffe0a0',emissive:'#ffbc5a',emissiveIntensity:1.3}));
    const cap=mesh(new T.ConeGeometry(.3,.25,4),brass,parent,x,y+.36,z); cap.rotation.y=Math.PI/4;
    const light=new T.PointLight('#ffba70',18,22,2);light.position.set(x,y,z);parent.add(light);atmosphere.registerNightLight(light);
  }
  // Broad, softly rolling landscape with a raised arrival hill.
  const terrain=terrainGeometry();
  const ground=mesh(terrain,groundMaterial(),scene);ground.name='Rolling sanctuary terrain';ground.castShadow=false;
  collision.add(new T.Mesh(terrain));
  // Scenery outside the playable square needs terrain, but no collision octree.
  for(const [w,d,x,z] of [[700,100,0,300],[700,100,0,-300],[100,500,300,0],[100,500,-300,0]]){const outer=mesh(terrainGeometry(w,d,x,z,5),ground.material,scene);outer.castShadow=false;}
  const atmosphere=buildAtmosphere(scene,{clock:dayCycleSeconds}),sun=atmosphere.sun;
  const campLighting=buildCampLighting(scene,atmosphere.state);
  // Preserve the accepted, seeded camp planting when replacing the old clouds.
  for(let i=0;i<144;i++)rand();
  const paths: { points:T.Vector3[]; width:number }[]=[];
  const paving=limestoneRoadMaterial();
  function path(coords:readonly (readonly number[])[],width=3.5){const points=routePoints(coords);paths.push({points,width});
    const geo=pavedRoadGeometry(points,width),road=mesh(geo,paving,scene);road.name='Walkable limestone road';road.castShadow=false;collision.add(new T.Mesh(geo));
  }
  for(const route of campRoutes)path(route.points,route.width);
  function circleGround(x:number,z:number,r:number,color:string){ const geo=new T.CircleGeometry(r,64);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,h(x+p.getX(i),z+p.getZ(i))+.075);const m=mesh(geo,mat(color),scene,x,0,z);m.castShadow=false;return m; }
  // The communal green shares the living terrain, rather than two flat coloured discs.

  // Twelve individually decorated cabins face the communal green.
  function roof(g:T.Object3D,w:number,d:number,y:number,color:string){const rise=2.1,len=Math.hypot(w/2,rise); for(const side of [-1,1]){const r=box(g,side*w/4,y+rise/2,0,len+.4,.24,d+1.1,mat(color));r.rotation.z=-side*Math.atan2(rise,w/2);
    for(let j=0;j<8;j++){const rib=box(g,side*w/4,y+rise/2+.13,-d/2+j*d/7,len+.4,.045,.055,mat('#514e43'));rib.rotation.z=r.rotation.z;}}
    const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();for(const side of [-1,1]){const tri=mesh(new T.ShapeGeometry(shape),mat(color),g,0,y,side*(d/2));tri.material=new T.MeshStandardMaterial({color,side:T.DoubleSide});}
  }
  function windowAt(g:T.Object3D,x:number,z:number,dy=0){box(g,x,2.2+dy,z,1.45,1.65,.12,trim);box(g,x,2.2+dy,z+.08,1.2,1.4,.08,mat('#6d9e9e',.25));box(g,x,2.2+dy,z+.14,.06,1.4,.07,trim);box(g,x,2.2+dy,z+.14,1.2,.06,.07,trim);box(g,x,1.3+dy,z+.2,1.75,.15,.55,wood);}
  function bench(g:T.Object3D,x:number,z:number,w=3){box(g,x,.65,z,w,.18,.7,wood,true);for(const s of [-1,1])box(g,x+s*(w/2-.25),.3,z,.15,.6,.55,wood);}
  const templeExteriors=buildTempleExteriors(scene,collision);buildGreatHall(scene,collision);
  templeCatalog.filter(theme=>theme.id!=='poseidon').forEach(theme=>{const endpoint=sitePoint(theme.id,0,16);path([...templeTrails[theme.id],[endpoint.x,endpoint.z]],2.8);});
  buildWayfarerHall(scene,collision);
  // Dining pavilion with columns, garlands and communal tables.
  const pavilion=group(46,43);box(pavilion,0,.08,0,20,.16,16,stone,true);
  for(const x of [-9,9])for(const z of [-7,0,7]){cyl(pavilion,x,2.8,z,.35,5.6,trim);box(pavilion,x,2.8,z,.6,5.6,.6,trim,true);box(pavilion,x,.3,z,1,.4,1,stone);box(pavilion,x,5.4,z,1,.4,1,trim);}
  roof(pavilion,20,16,5.7,'#a2684e');for(const z of [-4,0,4]){box(pavilion,0,1.2,z,12,.22,1.7,wood,true);for(const x of [-4,4])box(pavilion,x,.6,z,.25,1.2,1.3,wood);bench(pavilion,0,z-1.5,12);bench(pavilion,0,z+1.5,12);for(let x=-4;x<=4;x+=2)cyl(pavilion,x,1.34,z,.32,.035,trim);}
  sign('DINING PAVILION',46,53,0,5);
  const trainingGround=buildTrainingGround(scene,collision),lakeside=buildLakeside(scene,collision),water=lakeside.water;
  // Invisible barrier follows the shore, leaving the dock walkable.
  for(let i=0;i<80;i++){const a=i/80*Math.PI*2;const x=91+Math.cos(a)*30,z=Math.sin(a)*46;if(x<75&&(Math.abs(z-5)<3||Math.abs(z+18)<3))continue;const b=new T.Mesh(boxGeo);b.matrixAutoUpdate=false;b.matrix.copy(new T.Matrix4().compose(new T.Vector3(x,1,z),new T.Quaternion(),new T.Vector3(3,3,3)));collision.add(b);}
  // Stone causeway leads from the western shore to Poseidon's island.
  {const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([55,h(55,5)+.05,3.2,55,h(55,5)+.05,6.8,64,1.15,3.2,64,1.15,6.8],3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();mesh(g,stone,scene);collision.add(new T.Mesh(g));}
  for(let i=0;i<38;i++){const x=64+i*.55,g=new T.Group();g.position.set(x,1.09,5);scene.add(g);box(g,0,0,0,.57,.12,3.6,stone,true);if(i%5===0)for(const side of [-1,1]){box(g,0,.65,side*1.8,.22,1.3,.22,trim,true);}}
  for(let i=0;i<44;i++){const angle=i/44*Math.PI*2,x=94+Math.cos(angle)*14.5,z=5+Math.sin(angle)*14.5;if(x<84&&Math.abs(z-5)<3)continue;const c=new T.Mesh(new T.BoxGeometry(2.3,3,2.3));c.position.set(x,2,z);collision.add(c);}
  // Surface waves are shaded continuously; preserve the old decal random stream.
  for(let i=0;i<112;i++)rand();
  // Amphitheatre seating and animated fire.
  circleGround(0,-62,15,'#ada58a');const fire=group(0,-62);
  for(let i=0;i<15;i++){const a=i/15*Math.PI*2;mesh(new T.DodecahedronGeometry(.55),stone,fire,Math.sin(a)*2,.25,Math.cos(a)*2);}
  for(let i=0;i<5;i++){const log=box(fire,0,.4,0,.38,.38,3.5,wood);log.rotation.y=i*.8;}
  const flames=new T.Group();fire.add(flames);
  for(let i=0;i<7;i++){const m=mesh(new T.ConeGeometry(.3+rand()*.45,1.4+rand()*1.8,7),new T.MeshBasicMaterial({color:i%2?'#ffbf53':'#ed793c',transparent:true,opacity:.85}),flames,(rand()-.5)*1.2,1.1,(rand()-.5)*1.2);m.userData.phase=rand()*6;}
  for(let r=0;r<3;r++)for(let i=0;i<10;i++){const a=Math.PI*.17+i/9*Math.PI*1.66;const b=box(fire,Math.sin(a)*(7+r*2.6),.4+r*.17,Math.cos(a)*(7+r*2.6),3.4,.7,1.2,wood,true);b.rotation.y=a;}
  const firelight=new T.PointLight('#ff9d4e',18,15,2);firelight.position.set(0,2,-62);scene.add(firelight);
  const ep:number[]=[];for(let i=0;i<65;i++)ep.push((rand()-.5)*3,rand()*6,(rand()-.5)*3);
  const eg=new T.BufferGeometry();eg.setAttribute('position',new T.Float32BufferAttribute(ep,3));const embers=new T.Points(eg,new T.PointsMaterial({color:'#ffcc73',size:.09,transparent:true,opacity:.8}));embers.position.set(0,1,-62);scene.add(embers);
  // Forest shrine, flowering terraces and entrance architecture.
  const shrine=group(-40,-108);box(shrine,0,.12,0,7,.24,6,stone,true);for(const x of [-2.7,2.7]){cyl(shrine,x,2.3,-1,.3,4.3,trim);box(shrine,x,2.3,-1,.5,4.3,.5,trim,true);}roof(shrine,7,4,4.4,'#939d8b');box(shrine,0,.6,-.6,2,1.2,1.2,stone,true);const shrineMark=text('REMEMBER THE GODS',3);shrineMark.position.set(0,3.7,.9);shrine.add(shrineMark);
  for(let row=0;row<7;row++)for(let j=0;j<32;j++){
   const x=-81+row*2.4+Math.sin(j*2.399+row)*.5,z=68.5+j*.48+Math.cos(row*2.4+j)*.14;
   flowerPlacements.push({x,z,scale:.95+(j%4)*.12,rotation:j*2.399,kind:row%3===0?'lavender':row%3===1?'daisy':'poppy'});
  }
  sign('THE TERRACED GARDENS',-73,87,0,5);
  // Small human details give the paths and gathering spaces a sense of use.
  for(const [x,z] of [[-5,76],[7,58],[-26,40],[28,38],[57,22],[-38,-10],[-6,-43],[-25,-88]]){const g=group(x,z);box(g,0,1.55,0,.15,3.1,.15,wood,true);box(g,.3,3,0,.7,.1,.12,wood);lantern(g,.55,2.7,0);}
  for(const x of [-16,16]){const g=group(x,8);bench(g,0,0,4);for(const s of [-1,1]){cyl(g,s*2.7,.3,0,.48,.6,mat('#ab7855'));for(let j=0;j<4;j++)flowerPlacements.push({x:x+s*2.7+Math.cos(j*2.399)*.15,z:8+Math.sin(j*2.399)*.15,y:h(x,8)+.59,scale:.65,rotation:j*2.399,kind:x<0?'lavender':'daisy'});}}
  buildRoadBorders(scene,paths);
  // Keep accepted seeded trees/rocks in place after removing the old 650 stones.
  for(let i=0;i<2600;i++)rand();
  const gate=group(0,98);for(const x of [-4.5,4.5]){box(gate,x,3.4,0,.55,6.8,.55,wood,true);lantern(gate,x,4, .4);}box(gate,0,6.3,0,10.5,.6,.55,wood);const gs=text('ASTERION SANCTUARY',9);gs.position.set(0,6.3,.31);gate.add(gs);
  // Paths are kept clear; all vegetation is deterministic and instanced.
  function nearPath(x:number,z:number,extra=0){return paths.some(p=>p.points.some(q=>Math.hypot(q.x-x,q.z-z)<p.width*.75+extra));}
  function reserved(x:number,z:number){return inMainLandmark(x,z,1)||inGardenCourt(x,z,1) || insideTempleGrounds(x,z,2) || Math.hypot(x,z)<14 || Math.hypot(x+55,z-50)<16 || Math.hypot(x-46,z-43)<17 || Math.hypot(x,z+62)<18 || Math.hypot(x+40,z+108)<7 || ((x-91)/36)**2+(z/52)**2<1 || (x>-88&&x<-60&&z>65&&z<88) || (Math.abs(x)<9&&z>95);}
  const plants:PlantPlacement[]=buildCampGardens(scene,collision,flowerPlacements),planted:{x:number;z:number}[]=[];
  for(let i=0;i<520;i++){const x=(rand()-.5)*290,z=(rand()-.5)*290;if(inWoodland(x,z)||reserved(x,z)||nearPath(x,z,4)||planted.some(p=>Math.hypot(p.x-x,p.z-z)<10))continue;if(Math.abs(x)<40&&z>-35&&z<95)continue;if(z>-65&&Math.abs(x)<105&&rand()>.28)continue;
   const forest=z<-65||Math.abs(x)>105,scale=forest?.9+rand()*.1:.84+rand()*.16;planted.push({x,z});plants.push({id:forest?forestTreeIds[Math.floor(rand()*forestTreeIds.length)]:(i%2?'camp_olive':'camp_blossom'),x,y:h(x,z),z,scale,rotation:rand()*6.28});
   const c=new T.Mesh(new T.CylinderGeometry(.12,.19,2.5,8));c.position.set(x,h(x,z)+1.2,z);collision.add(c);
  }
  for(let i=0;i<2600;i++){const x=(rand()-.5)*220,z=(rand()-.5)*250;if(inWoodland(x,z)||nearPath(x,z,.8)||rand()>groundHabitat(x,z).bush*.85)continue;const forest=z<-72||Math.abs(x)>103;if(reserved(x,z))continue;plants.push({id:forest?(i%3===0?'forest_bramble':i%3===1?'forest_fern':'forest_bracken'):(i%4===0?'camp_laurel':i%4===1?'camp_myrtle':i%4===2?'camp_grass':'camp_flowers'),x,y:h(x,z),z,scale:.6+rand()*.45,rotation:rand()*6.28});}
  for(const theme of templeCatalog){const p=templePlacement(theme.id);for(const side of [-1,1]){const lx=side*5.4,lz=9.2,x=p.x+Math.cos(p.rotation)*lx+Math.sin(p.rotation)*lz,z=p.z-Math.sin(p.rotation)*lx+Math.cos(p.rotation)*lz;plants.push({id:theme.id==='aphrodite'||theme.id==='hera'?'camp_myrtle':'camp_laurel',x,y:h(x,z),z,scale:.28,rotation:p.rotation});}}
  for(const id of ['ares','artemis','dionysus'] as const){const site=templeSites[id],grove:{x:number;z:number}[]=[];for(let i=0;i<110&&grove.length<48;i++){const angle=rand()*Math.PI*2,r=Math.sqrt(24**2+rand()*(44**2-24**2)),x=site.x+Math.sin(angle)*r,z=site.z+Math.cos(angle)*r;if(nearPath(x,z,3)||insideTempleGrounds(x,z,2)||grove.some(p=>Math.hypot(p.x-x,p.z-z)<3))continue;grove.push({x,z});plants.push({id:forestTreeIds[Math.floor(rand()*forestTreeIds.length)],x,y:h(x,z),z,scale:.86+rand()*.14,rotation:rand()*Math.PI*2});const c=new T.Mesh(new T.CylinderGeometry(.12,.19,2.5,8));c.position.set(x,h(x,z)+1.2,z);collision.add(c);}}
  for(const [i,p] of plants.entries())if(p.id==='camp_flowers')flowerPlacements.push({x:p.x,z:p.z,scale:p.scale,rotation:p.rotation,kind:i%3===0?'lavender':i%3===1?'daisy':'poppy'});
  const planting=plantCollection(scene,plants.filter(p=>p.id!=='camp_flowers'));const forestBorder=buildForestBorder(scene,collision);
  const dummy=new T.Object3D();
  const meadow=gardenGrass(),grass=new T.InstancedMesh(meadow.garden,meadow.material,18000),wisps=new T.InstancedMesh(meadow.wisps,meadow.material,3200);let gi=0,wi=0;
  let fi=0;
  const up=new T.Vector3(0,1,0),normal=new T.Vector3(),tilt=new T.Quaternion(),turn=new T.Quaternion();
  for(let i=0;i<145000&&(gi<18000||wi<3200);i++){
   const x=(rand()-.5)*340,z=(rand()-.5)*340,habitat=groundHabitat(x,z);if(inWoodland(x,z)||Math.hypot(x,z)<12.5||nearPath(x,z,.45)||(reserved(x,z)&&Math.hypot(x,z)>12.5)||rand()>habitat.grass*(.42+.48*habitat.patch))continue;
   const d=.35;normal.set(h(x-d,z)-h(x+d,z),d*2,h(x,z-d)-h(x,z+d)).normalize();tilt.setFromUnitVectors(up,normal);turn.setFromAxisAngle(up,rand()*Math.PI*2);dummy.position.set(x,h(x,z)+.006,z);dummy.quaternion.copy(tilt).multiply(turn);
   const tuft=.68+rand()*.72;dummy.scale.set(tuft*(.78+rand()*.38),tuft*(.72+rand()*.64),tuft*(.78+rand()*.38));dummy.updateMatrix();
   if(gi<18000)grass.setMatrixAt(gi++,dummy.matrix);
   if(wi<3200&&rand()<.17&&habitat.patch>.44){dummy.scale.multiplyScalar(.7+rand()*.75);dummy.updateMatrix();wisps.setMatrixAt(wi++,dummy.matrix);}
   if(fi<1800&&rand()<.055){const scale=.75+rand()*.6;fi++;flowerPlacements.push({x,z,scale,rotation:fi*2.399,kind:fi%3===0?'lavender':fi%3===1?'daisy':'poppy'});}
  }
  grass.count=gi;wisps.count=wi;grass.receiveShadow=wisps.receiveShadow=true;scene.add(grass,wisps);
  const flowers=buildFlowers(scene,flowerPlacements);
  const rocks=new T.InstancedMesh(weatheredRockGeometry(),weatheredRockMaterial(),180);for(let i=0;i<180;i++){const a=rand()*Math.PI*2;let x=91+Math.cos(a)*(33+rand()*3),z=Math.sin(a)*(49+rand()*3);if(i>85){x=(rand()-.5)*290;z=(rand()-.5)*290;}if(inMainLandmark(x,z,1)||nearPath(x,z,1)||(i>85&&reserved(x,z))){i--;continue;}dummy.position.set(x,h(x,z)+.12,z);dummy.rotation.set((rand()-.5)*.3,rand()*6,(rand()-.5)*.25);dummy.scale.set(.5+rand()*1.3,.5+rand()*.9,.5+rand());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);const solid=new T.Mesh(rocks.geometry);solid.matrixAutoUpdate=false;solid.matrix.copy(dummy.matrix);collision.add(solid);}rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
  const reedGeo=new T.CylinderGeometry(.025,.04,1.8,5),reeds=new T.InstancedMesh(reedGeo,mat('#49633c'),300);let reedCount=0;for(let i=0;i<300;i++){const a=rand()*Math.PI*2,x=91+Math.cos(a)*(32+rand()),z=Math.sin(a)*(48+rand()),scale=.7+rand()*.6,lean=(rand()-.5)*.2;if(inMainLandmark(x,z,.5)||Math.abs(z-5)<3)continue;dummy.position.set(x,Math.max(h(x,z),.18)+.85*scale,z);dummy.scale.setScalar(scale);dummy.rotation.set(.1,0,lean);dummy.updateMatrix();reeds.setMatrixAt(reedCount++,dummy.matrix);}reeds.count=reedCount;scene.add(reeds);
  const woodland=buildWoodland(scene,collision,(x,z,pad)=>reserved(x,z)||nearPath(x,z,pad)||(Math.abs(x+40)<2+pad&&z>-108&&z<-92));
  // Rock outcrops frame the remote ridge, crater and pearl terrace.
  for(const id of ['zeus','hephaestus','aphrodite'] as const){const site=templeSites[id],geo=weatheredRockGeometry(3),m=weatheredRockMaterial();if(id==='hephaestus')m.color.set('#66615e');const outcrops=new T.InstancedMesh(geo,m,28);let count=0;
   for(let i=0;i<40&&count<28;i++){const angle=i*2.399,r=23+(i%4)*3,x=site.x+Math.sin(angle)*r,z=site.z+Math.cos(angle)*r;if(nearPath(x,z,3))continue;dummy.position.set(x,h(x,z)-.2,z);dummy.rotation.set(.12,angle,.14);dummy.scale.set(1.5+(i%3)*.8,1.3+(i%4)*.45,1.6);dummy.updateMatrix();outcrops.setMatrixAt(count++,dummy.matrix);const c=new T.Mesh(geo);c.matrixAutoUpdate=false;c.matrix.copy(dummy.matrix);collision.add(c);}outcrops.count=count;outcrops.castShadow=outcrops.receiveShadow=true;scene.add(outcrops);
  }
  // Discovery plaques sit at the shared map coordinates.
  for(const l of landmarks){const x=l.id==='cabins'?12:l.id==='lake'?54.5:l.id==='training'?-58:l.x+2.5,z=l.id==='cabins'?12:l.id==='lake'?9:l.id==='training'?-13:l.z;const s=sign(l.name.toUpperCase(),x,z,0,3.5);s.userData.landmark=l.id;}
  // Natural outer bounds prevent leaving the terrain.
  for(const axis of [0,1])for(const side of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(axis?sanctuaryExtent*2:2,80,axis?2:sanctuaryExtent*2));b.position.set(axis?0:side*sanctuaryExtent,20,axis?side*sanctuaryExtent:0);collision.add(b);}
  // Batch stationary architecture by material to keep draw calls low.
  scene.updateMatrixWorld(true);const batches=new Map<string,{material:T.Material;meshes:T.Mesh[]}>();
  scene.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||!(o.material instanceof T.MeshStandardMaterial)||o.material.transparent||o===water)return;const key=o.material.uuid+Object.keys(o.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{material:o.material,meshes:[]});batches.get(key)!.meshes.push(o);});
  for(const batch of batches.values()){if(batch.meshes.length<3)continue;const pieces=batch.meshes.map(m=>{const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);return geo.index?geo.toNonIndexed():geo;});const merged=mergeGeometries(pieces,false);if(merged){const m=new T.Mesh(merged,batch.material);m.castShadow=batch.meshes.some(o=>o.castShadow);m.receiveShadow=true;scene.add(m);batch.meshes.forEach(m=>m.removeFromParent());}pieces.forEach(g=>g.dispose());}
  forestAtmosphere(scene);
  atmosphere.applyCloudShadows();
  collision.updateMatrixWorld(true);const octree=new Octree().fromGraphNode(collision);
  const foliage=[grass,wisps];
  return {scene,octree,water,fire,embers,sun,atmosphere,foliage,setQuality:q=>{woodland.setQuality(q);planting.setQuality(q);},update(time,camera){
    atmosphere.update(time,camera);campLighting.update(camera);trainingGround.update(time);lakeside.update(time);forestBorder.update(time,camera);templeExteriors.update(time);woodland.update(time,camera);planting.update(time,camera);flowers.update(time,camera);
    flames.children.forEach((f,i)=>{f.scale.y=1+Math.sin(time*5+i)*.18;f.rotation.y=time*.3+i;});firelight.intensity=16+Math.sin(time*8)*2;
    const p=eg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,(ep[i*3+1]+time*.8)%6);p.needsUpdate=true;
    (water.material as T.MeshStandardMaterial).roughness=.17+Math.sin(time*.4)*.012;
    meadow.update(time);
  },dispose(){atmosphere.dispose();forestBorder.dispose();woodland.dispose();planting.dispose();flowers.dispose();const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Line){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const value of Object.values(m)){if(value instanceof T.Texture)textures.add(value);}}}});collision.traverse(o=>{if(o instanceof T.Mesh)geos.add(o.geometry);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();collision.clear();octree.clear();}};
}




