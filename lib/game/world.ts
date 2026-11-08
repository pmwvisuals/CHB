import * as T from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight as h, landmarks } from './data';
import { buildWoodland, inWoodland } from './woodland';
import type { Settings } from './data';
import { meadowGrass, plantCollection, type PlantPlacement } from './vegetation';
import { terrainGeometry,groundMaterial,trailMaterial,groundHabitat,weatheredRockGeometry,weatheredRockMaterial } from './landscape';
import { buildTempleExteriors,buildGreatHall } from './temple-exteriors';
import { templeCatalog,templePlacement } from './temple-catalog';

export interface World { scene: T.Scene; octree: Octree; water: T.Mesh; fire: T.Group; embers: T.Points; sun: T.DirectionalLight; foliage: T.InstancedMesh[]; setQuality:(quality:Settings['quality'])=>void; update: (time: number, camera?:T.Vector3) => void; dispose: () => void }
export function buildWorld(): World {
  const scene = new T.Scene(); scene.background = new T.Color('#b8d5d5'); scene.fog = new T.FogExp2('#c4d5c1', .0037);
  const collision = new T.Group();
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
  }
  // Broad, softly rolling landscape with a raised arrival hill.
  const terrain=terrainGeometry();
  const ground=mesh(terrain,groundMaterial(),scene);ground.name='Rolling sanctuary terrain';ground.castShadow=false;
  collision.add(new T.Mesh(terrain));
  const hemi=new T.HemisphereLight('#d7ecf4','#6f7142',2.1); scene.add(hemi);
  const sun=new T.DirectionalLight('#ffdda2',3.1); sun.position.set(-80,115,65); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:300}); sun.shadow.bias=-.0004; sun.shadow.normalBias=.06; scene.add(sun);
  // Sky gradient and distant forested ridgelines.
  const sky=mesh(new T.SphereGeometry(480,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#77b9d1')},bottom:{value:new T.Color('#f1dec0')}},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v; uniform vec3 top;uniform vec3 bottom;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(-.04,.75,normalize(v).y)),1.);}'}),scene); sky.castShadow=false;
  const disc=mesh(new T.SphereGeometry(12,24,16),new T.MeshBasicMaterial({color:'#fff2c6',fog:false}),scene,-230,205,-250); disc.castShadow=false;
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2; const m=mesh(new T.ConeGeometry(35+rand()*35,35+rand()*45,7),mat(i%2?'#78998b':'#8fa89a'),scene,Math.sin(a)*235,5,Math.cos(a)*235);m.rotation.y=rand()*3; m.castShadow=false;}
  const cloudMat=new T.MeshBasicMaterial({color:'#fff0d7',transparent:true,opacity:.38,depthWrite:false});
  for(let i=0;i<24;i++){const c=mesh(new T.SphereGeometry(1,8,5),cloudMat,scene,(rand()-.5)*550,85+rand()*50,(rand()-.5)*500);c.scale.set(20+rand()*40,2+rand()*3,6+rand()*10);c.castShadow=false;}
  const paths: { points:T.Vector3[]; width:number }[]=[];
  function path(coords:number[][],width=3.5){const curve=new T.CatmullRomCurve3(coords.map(([x,z])=>new T.Vector3(x,0,z)));const points=curve.getPoints(100);paths.push({points,width});const verts:number[]=[],indices:number[]=[],uvs:number[]=[];
    points.forEach((p,i)=>{const dir=points[Math.min(i+1,100)].clone().sub(points[Math.max(i-1,0)]).normalize();for(let j=0;j<5;j++){const side=(j/4-.5)*2,edge=width*.72*(1+.055*Math.sin(i*.47));const x=p.x+dir.z*edge*side,z=p.z-dir.x*edge*side;verts.push(x,h(x,z)+.065,z);uvs.push(j/4,i/100);}if(i<100)for(let j=0;j<4;j++){const a=i*5+j;indices.push(a,a+5,a+1,a+1,a+5,a+6);}});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,trailMaterial(),scene).castShadow=false;
  }
  path([[0,122],[0,96],[8,76],[3,53],[0,0]],5);
  path([[-56,48],[-34,42],[0,32],[48,40],[61,22],[64,5]],4);
  path([[-68,-35],[-50,-25],[-30,0],[0,0],[30,0],[62,5]],4);
  path([[0,0],[0,-35],[0,-62],[-18,-79],[-40,-108]],3.5);
  path([[-40,-108],[-67,-95],[-84,-62],[-68,-35]],2.3);
  path([[-55,48],[-77,61],[-78,85],[-43,83],[0,96]],2.4);
  function circleGround(x:number,z:number,r:number,color:string){ const geo=new T.CircleGeometry(r,64);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,h(x+p.getX(i),z+p.getZ(i))+.075);const m=mesh(geo,mat(color),scene,x,0,z);m.castShadow=false;return m; }
  // The communal green shares the living terrain, rather than two flat coloured discs.
  path(Array.from({length:17},(_,i)=>[Math.sin(i/16*Math.PI*2)*20.5,Math.cos(i/16*Math.PI*2)*20.5]),2.2);
  // Twelve individually decorated cabins face the communal green.
  function roof(g:T.Object3D,w:number,d:number,y:number,color:string){const rise=2.1,len=Math.hypot(w/2,rise); for(const side of [-1,1]){const r=box(g,side*w/4,y+rise/2,0,len+.4,.24,d+1.1,mat(color));r.rotation.z=-side*Math.atan2(rise,w/2);
    for(let j=0;j<8;j++){const rib=box(g,side*w/4,y+rise/2+.13,-d/2+j*d/7,len+.4,.045,.055,mat('#514e43'));rib.rotation.z=r.rotation.z;}}
    const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();for(const side of [-1,1]){const tri=mesh(new T.ShapeGeometry(shape),mat(color),g,0,y,side*(d/2));tri.material=new T.MeshStandardMaterial({color,side:T.DoubleSide});}
  }
  function windowAt(g:T.Object3D,x:number,z:number,dy=0){box(g,x,2.2+dy,z,1.45,1.65,.12,trim);box(g,x,2.2+dy,z+.08,1.2,1.4,.08,mat('#6d9e9e',.25));box(g,x,2.2+dy,z+.14,.06,1.4,.07,trim);box(g,x,2.2+dy,z+.14,1.2,.06,.07,trim);box(g,x,1.3+dy,z+.2,1.75,.15,.55,wood);}
  function bench(g:T.Object3D,x:number,z:number,w=3){box(g,x,.65,z,w,.18,.7,wood,true);for(const s of [-1,1])box(g,x+s*(w/2-.25),.3,z,.15,.6,.55,wood);}
  buildTempleExteriors(scene,collision);buildGreatHall(scene,collision);
  templeCatalog.forEach(theme=>{const p=templePlacement(theme.id);path([[p.x*.73,p.z*.73],[p.x*.58,p.z*.58]],2.4);});
  // Big House: porch, open ground floor, reading room and staircase silhouette.
  const house=group(-55,50,0); const blue=mat('#729eae');
  box(house,0,.08,0,18,.16,16,stone,true);for(const x of [-7.5,7.5])box(house,x,3,0,.35,6,12,blue,true);box(house,0,3,-6,15,6,.35,blue,true);
  for(const x of [-4.7,4.7]){box(house,x,3,6,5.6,6,.35,blue,true);windowAt(house,x,6.25);windowAt(house,x,6.26,2.5);}
  box(house,0,4.9,6,3.8,2.2,.35,blue,true);roof(house,16,13,6,'#657781');
  for(const x of [-8,-4,4,8]){box(house,x,1.9,8,.2,3.8,.2,trim,true);box(house,x,3.85,7, .3,.18,3,trim);}
  box(house,0,3.95,7,17,.2,3,mat('#637a7a'));for(const x of [-8,8])box(house,x,.8,7,.15,.1,2,trim);
  const houseSign=text('WAYFARER HALL',6);houseSign.position.set(0,4.8,6.3);house.add(houseSign);
  box(house,-4, .65,-2,4,1.2,1.6,mat('#a6b08a'),true);box(house,-4,1.3,-2.7,4,.9,.2,mat('#657d6e'),true);
  box(house,0,.6,-1,2,.2,3,wood,true);for(const s of [-1,1])box(house,s*.8,.25,-1,.1,.5,2.5,wood);
  box(house,3,1.4,-5.5,5,2.8,.4,wood,true);for(let r=0;r<3;r++)for(let j=0;j<15;j++)box(house,.9+j*.3,.6+r*.7,-5.2,.2,.48,.3,mat(['#8b6a4a','#646f63','#a9946b'][j%3]));
  const rug=box(house,0,.18,0,9,.02,7,mat('#9a6851'));rug.castShadow=false;bench(house,-5,7,4);bench(house,5,7,4);lantern(house,-2.1,3,6.3);lantern(house,2.1,3,6.3);
  // Dining pavilion with columns, garlands and communal tables.
  const pavilion=group(46,43);box(pavilion,0,.08,0,20,.16,16,stone,true);
  for(const x of [-9,9])for(const z of [-7,0,7]){cyl(pavilion,x,2.8,z,.35,5.6,trim);box(pavilion,x,2.8,z,.6,5.6,.6,trim,true);box(pavilion,x,.3,z,1,.4,1,stone);box(pavilion,x,5.4,z,1,.4,1,trim);}
  roof(pavilion,20,16,5.7,'#a2684e');for(const z of [-4,0,4]){box(pavilion,0,1.2,z,12,.22,1.7,wood,true);for(const x of [-4,4])box(pavilion,x,.6,z,.25,1.2,1.3,wood);bench(pavilion,0,z-1.5,12);bench(pavilion,0,z+1.5,12);for(let x=-4;x<=4;x+=2)cyl(pavilion,x,1.34,z,.32,.035,trim);}
  sign('DINING PAVILION',46,53,0,5);
  // Arena and archery range.
  circleGround(-67,-34,17,'#c7ae7d');const arena=group(-67,-34);
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2;if(Math.cos(a)>.85)continue;box(arena,Math.sin(a)*17,1,Math.cos(a)*17,.2,2,.2,wood,true);const rail=box(arena,Math.sin(a)*17,.85,Math.cos(a)*17,4.6,.12,.12,wood);rail.rotation.y=a;}
  for(let i=0;i<3;i++){const g=group(-75+i*7,-43);box(g,0,1.3,0,.2,2.6,.2,wood,true);for(let r=3;r>0;r--){const target=mesh(new T.CylinderGeometry(r*.4,r*.4,.08,32),mat(['#ae5a43','#dfd2ae','#426b71'][r-1]),g,0,2, .1+(3-r)*.06);target.rotation.x=Math.PI/2;}}
  for(const x of [-72,-62]){const g=group(x,-30);box(g,0,1.3,0,.3,2.6,.3,wood,true);box(g,0,1.8,0,2.1,.25,.25,wood);mesh(new T.SphereGeometry(.38,12,8),mat('#c4ae77'),g,0,2.8,0);box(g,0,1.8,0,.8,1,.6,mat('#b2a172'));}
  sign('TRAINING GROUNDS',-65,-15,0,5);
  // Lake, dock, canoes, reeds and rocks.
  const lakeGeo=new T.CircleGeometry(1,96);lakeGeo.rotateX(-Math.PI/2);
  const water=mesh(lakeGeo,new T.MeshStandardMaterial({color:'#489e9d',metalness:.28,roughness:.28,transparent:true,opacity:.91}),scene,91,.5,0);water.scale.set(31,1,47);water.castShadow=false;
  const lakebed=mesh(lakeGeo,mat('#7baf9a'),scene,91,.25,0);lakebed.scale.set(33,1,49);lakebed.castShadow=false;
  // Invisible barrier follows the shore, leaving the dock walkable.
  for(let i=0;i<80;i++){const a=i/80*Math.PI*2;const x=91+Math.cos(a)*30,z=Math.sin(a)*46;if(x<75&&Math.abs(z-5)<3)continue;const g=group(x,z,a);const c=box(g,0,1,0,3,3,3,stone);g.remove(c);c.updateWorldMatrix(true,false);const b=new T.Mesh(boxGeo);b.matrixAutoUpdate=false;b.matrix.copy(new T.Matrix4().compose(new T.Vector3(x,1,z),new T.Quaternion(),new T.Vector3(3,3,3)));collision.add(b);}
  const dock=group(71,5,0);for(let i=0;i<25;i++)box(dock,-9+i*.65,.55,0,.61,.2,4,wood,true);for(const x of [-9,-2,6])for(const z of [-2,2]){cyl(dock,x,.4,z,.13,2.2,wood);box(dock,x,1.25,z,.3,.08,.3,trim);}box(dock,7,.95,0,.15,.7,4,wood,true);
  for(const z of [-2,2])box(dock,0,.95,z,15,.65,.1,wood,true);
  for(let i=0;i<2;i++){const g=group(70+i*3,-.5-i*2,.2+i*.2,.7);const boat=mesh(new T.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),mat(i?'#a26845':'#c4a25a'),g);boat.rotation.x=Math.PI;boat.scale.set(.8,.5,2.6);box(g,0,.05,0,1.1,.12,.4,wood);box(g,0,.05,1.1,1.1,.12,.3,wood);}
  const rippleMat=new T.MeshBasicMaterial({color:'#d5e5cc',transparent:true,opacity:.16,side:T.DoubleSide});const ripples:T.Mesh[]=[];
  for(let i=0;i<28;i++){const x=91+(rand()-.5)*40,z=(rand()-.5)*68;const m=mesh(new T.RingGeometry(.9,1,32),rippleMat,scene,x,.52,z);m.rotation.x=-Math.PI/2;m.scale.set(1+rand()*3,.4+rand(),1);m.castShadow=false;ripples.push(m);}
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
  // Forest shrine, strawberry beds and entrance architecture.
  const shrine=group(-40,-108);box(shrine,0,.12,0,7,.24,6,stone,true);for(const x of [-2.7,2.7]){cyl(shrine,x,2.3,-1,.3,4.3,trim);box(shrine,x,2.3,-1,.5,4.3,.5,trim,true);}roof(shrine,7,4,4.4,'#939d8b');box(shrine,0,.6,-.6,2,1.2,1.2,stone,true);const shrineMark=text('REMEMBER THE GODS',3);shrineMark.position.set(0,3.7,.9);shrine.add(shrineMark);
  for(let row=0;row<7;row++){const g=group(-81+row*2.4,76);box(g,0,.08,0,1.5,.15,16,mat('#806344'));for(let j=0;j<16;j++){mesh(new T.DodecahedronGeometry(.4),mat('#536d38'),g,0,.4,-7.5+j);mesh(new T.IcosahedronGeometry(.12),mat('#b95343'),g,.25,.55,-7.5+j);}}
  sign('THE TERRACED GARDENS',-73,87,0,5);
  // Small human details give the paths and gathering spaces a sense of use.
  for(const [x,z] of [[-5,76],[7,58],[-26,40],[28,38],[57,22],[-38,-10],[-6,-43],[-25,-88]]){const g=group(x,z);box(g,0,1.55,0,.15,3.1,.15,wood,true);box(g,.3,3,0,.7,.1,.12,wood);lantern(g,.55,2.7,0);}
  for(const x of [-12,12]){const g=group(x,8);bench(g,0,0,4);for(const s of [-1,1]){cyl(g,s*2.7,.3,0,.48,.6,mat('#ab7855'));mesh(new T.DodecahedronGeometry(.5),mat('#b8a66d'),g,s*2.7,.85,0);}}
  const pathStones=new T.InstancedMesh(weatheredRockGeometry(1),weatheredRockMaterial(),650);const stoneDummy=new T.Object3D();let stoneCount=0;
  for(const path of paths)for(let i=2;i<path.points.length-2;i+=3)for(const side of [-1,1]){if(stoneCount>=650)break;const p=path.points[i],dir=path.points[i+1].clone().sub(path.points[i-1]).normalize();const x=p.x+dir.z*(path.width*.5+.12)*side,z=p.z-dir.x*(path.width*.5+.12)*side;stoneDummy.position.set(x,h(x,z)+.06,z);stoneDummy.scale.set(.16+rand()*.14,.08+rand()*.05,.15+rand()*.12);stoneDummy.rotation.y=rand()*6;stoneDummy.updateMatrix();pathStones.setMatrixAt(stoneCount++,stoneDummy.matrix);}pathStones.count=stoneCount;pathStones.receiveShadow=true;scene.add(pathStones);
  const gate=group(0,98);for(const x of [-4.5,4.5]){box(gate,x,3.4,0,.55,6.8,.55,wood,true);lantern(gate,x,4, .4);}box(gate,0,6.3,0,10.5,.6,.55,wood);const gs=text('ASTERION SANCTUARY',9);gs.position.set(0,6.3,.31);gate.add(gs);
  // Paths are kept clear; all vegetation is deterministic and instanced.
  function nearPath(x:number,z:number,extra=0){return paths.some(p=>p.points.some((q,i)=>i%3===0&&Math.hypot(q.x-x,q.z-z)<p.width*.6+extra));}
  function reserved(x:number,z:number){return Math.hypot(x-38,z-10)<17 || Math.hypot(x,z)<43 || Math.hypot(x+55,z-50)<16 || Math.hypot(x-46,z-43)<17 || Math.hypot(x+67,z+34)<20 || Math.hypot(x,z+62)<18 || Math.hypot(x+40,z+108)<7 || ((x-91)/36)**2+(z/52)**2<1 || (x>-88&&x<-60&&z>65&&z<88) || (Math.abs(x)<9&&z>95);}
  const plants:PlantPlacement[]=[],planted:{x:number;z:number}[]=[];
  for(let i=0;i<520;i++){const x=(rand()-.5)*290,z=(rand()-.5)*290;if(inWoodland(x,z)||reserved(x,z)||nearPath(x,z,4)||planted.some(p=>Math.hypot(p.x-x,p.z-z)<10))continue;if(z>-65&&Math.abs(x)<105&&rand()>.28)continue;
   const forest=z<-65||Math.abs(x)>105,scale=forest?.65+rand()*.4:.65+rand()*.25;planted.push({x,z});plants.push({id:forest?(i%2?'forest_oak':'forest_fir'):(i%2?'camp_olive':'camp_blossom'),x,y:h(x,z),z,scale,rotation:rand()*6.28});
   const c=new T.Mesh(new T.CylinderGeometry(forest?.65:.2,forest?.9:.35,forest?12:4,8));c.position.set(x,h(x,z)+(forest?6:2),z);collision.add(c);
  }
  // A deliberate ornamental grove inside the sanctuary, clear of entrances and paths.
  for(const [i,[x,z]] of [[-15,15],[15,15],[-15,-15],[15,-15],[-23,59],[-31,64],[22,62],[31,65]].entries()){if(nearPath(x,z,3)||Math.hypot(x,z)<20)continue;plants.push({id:i%2?'camp_blossom':'camp_olive',x,y:h(x,z),z,scale:.8,rotation:i*1.7});const c=new T.Mesh(new T.CylinderGeometry(.25,.4,4,8));c.position.set(x,h(x,z)+2,z);collision.add(c);}
  for(let i=0;i<2600;i++){const x=(rand()-.5)*220,z=(rand()-.5)*250;if(inWoodland(x,z)||nearPath(x,z,.8)||rand()>groundHabitat(x,z).bush*.85)continue;const forest=z<-72||Math.abs(x)>103;if(reserved(x,z)&&!(Math.hypot(x,z)>18&&Math.hypot(x,z)<23))continue;plants.push({id:forest?(i%3===0?'forest_bramble':i%3===1?'forest_fern':'forest_bracken'):(i%4===0?'camp_laurel':i%4===1?'camp_myrtle':i%4===2?'camp_grass':'camp_flowers'),x,y:h(x,z),z,scale:.6+rand()*.45,rotation:rand()*6.28});}
  for(const theme of templeCatalog){const p=templePlacement(theme.id);for(const side of [-1,1]){const lx=side*5.4,lz=9.2,x=p.x+Math.cos(p.rotation)*lx+Math.sin(p.rotation)*lz,z=p.z-Math.sin(p.rotation)*lx+Math.cos(p.rotation)*lz;plants.push({id:theme.id==='aphrodite'||theme.id==='hera'?'camp_myrtle':'camp_laurel',x,y:h(x,z),z,scale:.28,rotation:p.rotation});}}
  const planting=plantCollection(scene,plants);
  const dummy=new T.Object3D();
  const meadow=meadowGrass();const grass=new T.InstancedMesh(meadow.geometry,meadow.material,6000);let gi=0;
  const flowerGeo=new T.IcosahedronGeometry(.12,0),flowers=new T.InstancedMesh(flowerGeo,mat('#e7d6a0'),1800);let fi=0;
  for(let i=0;i<45000&&gi<6000;i++){const x=(rand()-.5)*270,z=(rand()-.5)*270;if(inWoodland(x,z)||Math.hypot(x,z)<12.5||nearPath(x,z,.6)||(reserved(x,z)&&Math.hypot(x,z)>17.5)||rand()>groundHabitat(x,z).grass*.8)continue;dummy.position.set(x,h(x,z)+.01,z);dummy.rotation.set(0,rand()*6,(rand()-.5)*.4);dummy.scale.setScalar(.6+rand());dummy.updateMatrix();grass.setMatrixAt(gi++,dummy.matrix);if(fi<1800&&rand()<.23){dummy.position.y+=.36;dummy.scale.setScalar(.7+rand());dummy.updateMatrix();flowers.setMatrixAt(fi++,dummy.matrix);flowers.setColorAt(fi-1,new T.Color(['#e9d2a3','#e5e0ca','#b399bb'][fi%3]));}}
  grass.count=gi;grass.receiveShadow=true;flowers.count=fi;scene.add(grass,flowers);
  const rocks=new T.InstancedMesh(weatheredRockGeometry(),weatheredRockMaterial(),180);for(let i=0;i<180;i++){const a=rand()*Math.PI*2;let x=91+Math.cos(a)*(33+rand()*3),z=Math.sin(a)*(49+rand()*3);if(i>85){x=(rand()-.5)*290;z=(rand()-.5)*290;if(reserved(x,z)||nearPath(x,z,1)){i--;continue;}}dummy.position.set(x,h(x,z)+.12,z);dummy.rotation.set((rand()-.5)*.3,rand()*6,(rand()-.5)*.25);dummy.scale.set(.5+rand()*1.3,.5+rand()*.9,.5+rand());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);const solid=new T.Mesh(rocks.geometry);solid.matrixAutoUpdate=false;solid.matrix.copy(dummy.matrix);collision.add(solid);}rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
  const reedGeo=new T.CylinderGeometry(.025,.04,1.8,4),reeds=new T.InstancedMesh(reedGeo,mat('#798951'),300);for(let i=0;i<300;i++){const a=rand()*Math.PI*2;dummy.position.set(91+Math.cos(a)*(32+rand()),1,Math.sin(a)*(48+rand()));dummy.scale.setScalar(.7+rand()*.6);dummy.rotation.set(.1,0,(rand()-.5)*.2);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);}scene.add(reeds);
  const woodland=buildWoodland(scene,collision,(x,z,pad)=>reserved(x,z)||nearPath(x,z,pad)||(Math.abs(x+40)<2+pad&&z>-108&&z<-92));
  // Discovery plaques sit at the shared map coordinates.
  for(const l of landmarks){const s=sign(l.name.toUpperCase(),l.id==='cabins'?12:l.x+2.5,l.id==='cabins'?12:l.z,0,3.5);s.userData.landmark=l.id;}
  // Natural outer bounds prevent leaving the terrain.
  for(const axis of [0,1])for(const side of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(axis?310:2,80,axis?2:310));b.position.set(axis?0:side*150,20,axis?side*150:0);collision.add(b);}
  // Batch stationary architecture by material to keep draw calls low.
  scene.updateMatrixWorld(true);const batches=new Map<string,{material:T.Material;meshes:T.Mesh[]}>();
  scene.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||!(o.material instanceof T.MeshStandardMaterial)||o.material.transparent||o===water)return;const key=o.material.uuid+Object.keys(o.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{material:o.material,meshes:[]});batches.get(key)!.meshes.push(o);});
  for(const batch of batches.values()){if(batch.meshes.length<3)continue;const pieces=batch.meshes.map(m=>{const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);return geo.index?geo.toNonIndexed():geo;});const merged=mergeGeometries(pieces,false);if(merged){const m=new T.Mesh(merged,batch.material);m.castShadow=true;m.receiveShadow=true;scene.add(m);batch.meshes.forEach(m=>m.removeFromParent());}pieces.forEach(g=>g.dispose());}
  collision.updateMatrixWorld(true);const octree=new Octree().fromGraphNode(collision);
  const foliage=[grass,flowers];
  return {scene,octree,water,fire,embers,sun,foliage,setQuality:q=>{woodland.setQuality(q);planting.setQuality(q);},update(time,camera){
    woodland.update(time,camera);planting.update(time,camera);
    flames.children.forEach((f,i)=>{f.scale.y=1+Math.sin(time*5+i)*.18;f.rotation.y=time*.3+i;});firelight.intensity=16+Math.sin(time*8)*2;
    const p=eg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,(ep[i*3+1]+time*.8)%6);p.needsUpdate=true;
    ripples.forEach((r,i)=>{r.position.y=.54+Math.sin(time*.7+i)*.008;r.rotation.z=Math.sin(time*.15+i)*.1;});
    (water.material as T.MeshStandardMaterial).roughness=.28+Math.sin(time*.4)*.04;
    meadow.update(time);
  },dispose(){woodland.dispose();planting.dispose();const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const value of Object.values(m)){if(value instanceof T.Texture)textures.add(value);}}}});collision.traverse(o=>{if(o instanceof T.Mesh)geos.add(o.geometry);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}



