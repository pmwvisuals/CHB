import * as T from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { temples, groundHeight as h, landmarks } from './data';
import { buildPoseidonTemple } from './poseidon';

export interface World { scene: T.Scene; octree: Octree; water: T.Mesh; fire: T.Group; embers: T.Points; sun: T.DirectionalLight; foliage: T.InstancedMesh[]; update: (time: number) => void; dispose: () => void }
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
  const terrain = new T.PlaneGeometry(320,320,120,120); terrain.rotateX(-Math.PI/2);
  const pos=terrain.attributes.position; const colors=[];
  for(let i=0;i<pos.count;i++) { const x=pos.getX(i),z=pos.getZ(i); pos.setY(i,h(x,z)); const c=new T.Color().setHSL(.235+rand()*.035,.30+rand()*.12,.32+rand()*.055); c.convertSRGBToLinear(); colors.push(c.r,c.g,c.b); }
  terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3)); terrain.computeVertexNormals();
  const ground = mesh(terrain,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),scene); ground.castShadow=false;
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
  function path(coords:number[][],width=3.5){const curve=new T.CatmullRomCurve3(coords.map(([x,z])=>new T.Vector3(x,0,z)));const points=curve.getPoints(100);paths.push({points,width});const verts:number[]=[],indices:number[]=[];
    points.forEach((p,i)=>{const dir=points[Math.min(i+1,100)].clone().sub(points[Math.max(i-1,0)]).normalize();for(const s of [-1,1]){const x=p.x+dir.z*width*.5*s,z=p.z-dir.x*width*.5*s;verts.push(x,h(x,z)+.06,z);}if(i<100){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,mat('#c9b48a'),scene).castShadow=false;
  }
  path([[0,122],[0,96],[8,76],[3,53],[0,0]],5);
  path([[-56,48],[-34,42],[0,32],[48,40],[61,22],[64,5]],4);
  path([[-68,-35],[-50,-25],[-30,0],[0,0],[30,0],[62,5]],4);
  path([[0,0],[0,-35],[0,-62],[-18,-79],[-40,-108]],3.5);
  path([[-40,-108],[-67,-95],[-84,-62],[-68,-35]],2.3);
  path([[-55,48],[-77,61],[-78,85],[-43,83],[0,96]],2.4);
  function circleGround(x:number,z:number,r:number,color:string){ const geo=new T.CircleGeometry(r,64);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,h(x+p.getX(i),z+p.getZ(i))+.075);const m=mesh(geo,mat(color),scene,x,0,z);m.castShadow=false;return m; }
  circleGround(0,0,23,'#b3ae79'); circleGround(0,0,17.5,'#829658');
  // Twelve individually decorated cabins face the communal green.
  function roof(g:T.Object3D,w:number,d:number,y:number,color:string){const rise=2.1,len=Math.hypot(w/2,rise); for(const side of [-1,1]){const r=box(g,side*w/4,y+rise/2,0,len+.4,.24,d+1.1,mat(color));r.rotation.z=-side*Math.atan2(rise,w/2);
    for(let j=0;j<8;j++){const rib=box(g,side*w/4,y+rise/2+.13,-d/2+j*d/7,len+.4,.045,.055,mat('#514e43'));rib.rotation.z=r.rotation.z;}}
    const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();for(const side of [-1,1]){const tri=mesh(new T.ShapeGeometry(shape),mat(color),g,0,y,side*(d/2));tri.material=new T.MeshStandardMaterial({color,side:T.DoubleSide});}
  }
  function windowAt(g:T.Object3D,x:number,z:number,dy=0){box(g,x,2.2+dy,z,1.45,1.65,.12,trim);box(g,x,2.2+dy,z+.08,1.2,1.4,.08,mat('#6d9e9e',.25));box(g,x,2.2+dy,z+.14,.06,1.4,.07,trim);box(g,x,2.2+dy,z+.14,1.2,.06,.07,trim);box(g,x,1.3+dy,z+.2,1.75,.15,.55,wood);}
  function bench(g:T.Object3D,x:number,z:number,w=3){box(g,x,.65,z,w,.18,.7,wood,true);for(const s of [-1,1])box(g,x+s*(w/2-.25),.3,z,.15,.6,.55,wood);}
  function furnish(g:T.Object3D,athena:boolean){
    for(const x of [-2.6,2.6]){box(g,x,.43,-1.4,1.5,.7,3,wood,true);box(g,x,.86,-1.4,1.45,.2,2.9,mat('#d8c9a4'));box(g,x,.99,-1,1.46,.06,1.9,mat(athena?'#868562':'#448a8b'));box(g,x,1,-2.4,1.1,.2,.55,trim);}
    box(g,0,.85,-2.8,2,.15,1,wood,true);for(const x of [-.8,.8])box(g,x,.4,-2.8,.1,.8,.7,wood);
    if(athena){box(g,0,2,-3.9,3.8,3,.35,wood,true);for(let r=0;r<4;r++)for(let j=0;j<10;j++)box(g,-1.65+j*.35,1+r*.58,-3.65,.23,.38,.3,mat(['#ae7e50','#586c64','#a3936b'][j%3]));}
    else {const rug=box(g,0,.16,.2,3,.02,3,mat('#457f83'));rug.castShadow=false; const s=text('THE SEA REMEMBERS',2.5);s.position.set(0,2.8,-3.76);g.add(s);}
  }
  const poseidon = buildPoseidonTemple(scene, collision);
  temples.forEach(([name,color,roofColor,symbol],i)=>{
    if(i===2)return;
    const a=(i/12)*Math.PI*2+Math.PI/12;const x=Math.sin(a)*33,z=Math.cos(a)*33; const g=group(x,z,Math.atan2(-x,-z));const open=true;
    box(g,0,.08,0,9,.16,9.6,stone,true);box(g,-4.1,2.2,0,.3,4.4,8.4,mat(color),true);box(g,4.1,2.2,0,.3,4.4,8.4,mat(color),true);box(g,0,2.2,-4.1,8.4,4.4,.3,mat(color),true);
    for(const side of [-1,1]){box(g,side*2.65,2.2,4.1,3.1,4.4,.3,mat(color),true);windowAt(g,side*2.65,4.3);box(g,side*4.2,2.2,4.3,.2,4.5,.2,trim);}
    box(g,0,3.95,4.1,2.2,.9,.3,mat(color),true);if(!open)box(g,0,1.65,4.16,2.1,3.3,.2,wood,true);
    for(let k=1;k<11;k++)for(const side of [-1,1])box(g,side*2.65,k*.38,4.28,3.1,.025,.02,mat(roofColor));
    roof(g,8.7,8.7,4.4,roofColor); const plaque=text(`${String(i+1).padStart(2,'0')}  ${name.toUpperCase()}`,4);plaque.position.set(0,4.65,4.55);g.add(plaque);
    const crest=text(symbol,1.4,'#e9d7a3',roofColor);crest.position.set(0,5.55,4.6);g.add(crest);
    if(i===0||i===1||i===5){for(const x of [-3.8,3.8]){cyl(g,x,2.3,5,.28,4.6,trim);box(g,x,2.3,5,.45,4.6,.45,trim,true);box(g,x,4.5,5,.8,.3,.8,trim);}box(g,0,4.75,5,8.4,.28,.7,trim);}
    if(i===2){for(const x of [-3.7,3.7]){const shell=mesh(new T.SphereGeometry(.5,8,6,0,Math.PI),mat('#d4d4ac'),g,x,4.5,4.6);shell.scale.set(1,.7,.45);}const trident=box(g,0,7.2,0,.12,2,.12,brass);for(const x of [-.6,.6]){box(g,x,7.5,0,.1,1,.1,brass);box(g,x*.5,7,0,.6,.1,.1,brass);}}
    if(i===3||i===11){for(const x of [-4.6,4.6])for(let j=0;j<6;j++){mesh(new T.DodecahedronGeometry(.35),mat('#6e8548'),g,x+Math.sin(j)*.2,.5+j*.65,4.4);if(i===11)mesh(new T.IcosahedronGeometry(.19),mat('#78627d'),g,x+.2,.7+j*.65,4.7);}}
    if(i===4){for(const x of [-3.7,3.7]){cyl(g,x,3.2,5,.055,5,wood);mesh(new T.ConeGeometry(.2,.6,4),stone,g,x,5.9,5);}for(let j=0;j<5;j++)box(g,-3.2+j*1.6,4.8,-4.3,.7,.9,.7,mat('#864d3d'));}
    if(i===6){const sunCrest=mesh(new T.SphereGeometry(.65,12,8),brass,g,0,7,0);sunCrest.scale.z=.22;for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const ray=box(g,Math.sin(a)*1.05,7+Math.cos(a)*1.05,0,.08,.5,.06,brass);ray.rotation.z=-a;}}
    if(i===7){const moon=mesh(new T.TorusGeometry(.8,.14,6,24,Math.PI*1.55),trim,g,0,7.1,0);moon.rotation.z=.65;}
    if(i===8){box(g,-2.5,5.7,-2,1.1,4,1.1,mat('#725e51'),true);box(g,-2.5,7.7,-2,1.4,.25,1.4,stone);for(let j=0;j<5;j++)box(g,-2.5,5.8+j*.35,-1.43,1.12,.04,.025,mat('#c5aa83'));}
    if(i===9){for(const x of [-1.5,1.5])box(g,x,2,4.6,.1,4,.1,trim);const arch=mesh(new T.TorusGeometry(1.5,.09,6,20,Math.PI),trim,g,0,3.7,4.6);for(let j=0;j<7;j++){const a=j/6*Math.PI;mesh(new T.IcosahedronGeometry(.25),mat('#d5a5ac'),g,Math.cos(a)*1.5,3.7+Math.sin(a)*1.5,4.65);}}
    if(i===10){box(g,-5.6,1.5,-1,2.7,3,4,mat(color),true);box(g,-5.6,3.1,-1,3,.2,4.5,mat(roofColor));const parcel=box(g,3.3,.4,5.1,.65,.7,.7,mat('#ac8b58'));box(g,3.3,.76,5.1,.12,.03,.72,trim);}
    lantern(g,-1.35,2.6,4.4);lantern(g,1.35,2.6,4.4);bench(g,-2.6,5.4,2);
    for(const side of [-1,1]){cyl(g,side*4.8,.45,4.5,.5,.8,mat('#a87853'));mesh(new T.DodecahedronGeometry(.65),mat(i===9?'#c08eaf':'#6d8849'),g,side*4.8,1.1,4.5);}
    // Detailed sacred interiors are loaded on their own pages.
    path([[x*.76,z*.76],[x*.58,z*.58]],2);
  });
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
  const pathStones=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat('#b6ac8a'),650);const stoneDummy=new T.Object3D();let stoneCount=0;
  for(const path of paths)for(let i=2;i<path.points.length-2;i+=3)for(const side of [-1,1]){if(stoneCount>=650)break;const p=path.points[i],dir=path.points[i+1].clone().sub(path.points[i-1]).normalize();const x=p.x+dir.z*(path.width*.5+.12)*side,z=p.z-dir.x*(path.width*.5+.12)*side;stoneDummy.position.set(x,h(x,z)+.06,z);stoneDummy.scale.set(.16+rand()*.14,.08+rand()*.05,.15+rand()*.12);stoneDummy.rotation.y=rand()*6;stoneDummy.updateMatrix();pathStones.setMatrixAt(stoneCount++,stoneDummy.matrix);}pathStones.count=stoneCount;pathStones.receiveShadow=true;scene.add(pathStones);
  const gate=group(0,98);for(const x of [-4.5,4.5]){box(gate,x,3.4,0,.55,6.8,.55,wood,true);lantern(gate,x,4, .4);}box(gate,0,6.3,0,10.5,.6,.55,wood);const gs=text('ASTERION SANCTUARY',9);gs.position.set(0,6.3,.31);gate.add(gs);
  // Paths are kept clear; all vegetation is deterministic and instanced.
  function nearPath(x:number,z:number,extra=0){return paths.some(p=>p.points.some((q,i)=>i%3===0&&Math.hypot(q.x-x,q.z-z)<p.width*.6+extra));}
  function reserved(x:number,z:number){return Math.hypot(x-38,z-10)<17 || Math.hypot(x,z)<43 || Math.hypot(x+55,z-50)<16 || Math.hypot(x-46,z-43)<17 || Math.hypot(x+67,z+34)<20 || Math.hypot(x,z+62)<18 || Math.hypot(x+40,z+108)<7 || ((x-91)/36)**2+(z/52)**2<1 || (x>-88&&x<-60&&z>65&&z<88) || (Math.abs(x)<9&&z>95);}
  const treePoints:{x:number;z:number;s:number;pine:boolean}[]=[];
  for(let i=0;i<1050;i++){const x=(rand()-.5)*295,z=(rand()-.5)*295;if(reserved(x,z)||nearPath(x,z,3))continue;if(z>-75&&Math.abs(x)<100&&rand()>.25)continue;treePoints.push({x,z,s:.75+rand()*.9,pine:rand()>.42});}
  treePoints.push({x:-12,z:110,s:2.4,pine:true});
  const trunkGeo=new T.CylinderGeometry(.25,.45,1,7),pineGeo=new T.ConeGeometry(1,1,9),leafGeo=new T.IcosahedronGeometry(1,1);
  const trunks=new T.InstancedMesh(trunkGeo,wood,treePoints.length);const leaves=new T.InstancedMesh(pineGeo,mat('#416b50'),treePoints.length*3);const crowns=new T.InstancedMesh(leafGeo,mat('#6e914f'),treePoints.length*3);const dummy=new T.Object3D();let pi=0,ci=0;
  treePoints.forEach((p,i)=>{const y=h(p.x,p.z),ht=8*p.s;dummy.position.set(p.x,y+ht*.45,p.z);dummy.scale.set(p.s,ht*.9,p.s);dummy.rotation.set(0,rand()*6,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);const c=new T.Mesh(new T.BoxGeometry(.65*p.s,ht,.65*p.s));c.position.set(p.x,y+ht*.5,p.z);collision.add(c);
    for(let j=0;j<3;j++){dummy.position.set(p.x+(p.pine?0:(rand()-.5)*3*p.s),y+ht*(.65+j*.17),p.z+(p.pine?0:(rand()-.5)*3*p.s));dummy.scale.setScalar((p.pine?3.5-j*.8:2.7)*p.s);if(p.pine)dummy.scale.y=4*p.s;dummy.updateMatrix();(p.pine?leaves:crowns).setMatrixAt(p.pine?pi++:ci++,dummy.matrix);}
  });leaves.count=pi;crowns.count=ci;[trunks,leaves,crowns].forEach(m=>{m.castShadow=true;m.receiveShadow=true;scene.add(m);});
  const grassGeo=new T.ConeGeometry(.16,.75,3);const grass=new T.InstancedMesh(grassGeo,mat('#899954'),11000);let gi=0;
  const flowerGeo=new T.IcosahedronGeometry(.12,0),flowers=new T.InstancedMesh(flowerGeo,mat('#e7d6a0'),1800);let fi=0;
  for(let i=0;i<16000&&gi<11000;i++){const x=(rand()-.5)*270,z=(rand()-.5)*270;if(reserved(x,z)||nearPath(x,z,.3))continue;dummy.position.set(x,h(x,z)+.28,z);dummy.rotation.set(0,rand()*6,(rand()-.5)*.4);dummy.scale.setScalar(.6+rand());dummy.updateMatrix();grass.setMatrixAt(gi++,dummy.matrix);if(fi<1800&&rand()<.23){dummy.position.y+=.36;dummy.scale.setScalar(.7+rand());dummy.updateMatrix();flowers.setMatrixAt(fi++,dummy.matrix);flowers.setColorAt(fi-1,new T.Color(['#e9d2a3','#e5e0ca','#b399bb'][fi%3]));}}
  grass.count=gi;flowers.count=fi;scene.add(grass,flowers);
  const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat('#9b9c88'),180);for(let i=0;i<180;i++){const a=rand()*Math.PI*2;let x=91+Math.cos(a)*(33+rand()*3),z=Math.sin(a)*(49+rand()*3);if(i>85){x=(rand()-.5)*290;z=(rand()-.5)*290;if(reserved(x,z)||nearPath(x,z,1)){i--;continue;}}dummy.position.set(x,h(x,z)+.2,z);dummy.rotation.set(rand(),rand()*6,rand());dummy.scale.set(.5+rand()*1.3,.4+rand()*.7,.5+rand());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
  const reedGeo=new T.CylinderGeometry(.025,.04,1.8,4),reeds=new T.InstancedMesh(reedGeo,mat('#798951'),300);for(let i=0;i<300;i++){const a=rand()*Math.PI*2;dummy.position.set(91+Math.cos(a)*(32+rand()),1,Math.sin(a)*(48+rand()));dummy.scale.setScalar(.7+rand()*.6);dummy.rotation.set(.1,0,(rand()-.5)*.2);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);}scene.add(reeds);
  // Discovery plaques sit at the shared map coordinates.
  for(const l of landmarks){const s=sign(l.name.toUpperCase(),l.x+2.5,l.z,0,3.5);s.userData.landmark=l.id;}
  // Natural outer bounds prevent leaving the terrain.
  for(const axis of [0,1])for(const side of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(axis?310:2,80,axis?2:310));b.position.set(axis?0:side*150,20,axis?side*150:0);collision.add(b);}
  // Batch stationary architecture by material to keep draw calls low.
  scene.updateMatrixWorld(true);const batches=new Map<string,{material:T.Material;meshes:T.Mesh[]}>();
  scene.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||!(o.material instanceof T.MeshStandardMaterial)||o.material.transparent||o===water)return;const key=o.material.uuid+Object.keys(o.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{material:o.material,meshes:[]});batches.get(key)!.meshes.push(o);});
  for(const batch of batches.values()){if(batch.meshes.length<3)continue;const pieces=batch.meshes.map(m=>{const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);return geo.index?geo.toNonIndexed():geo;});const merged=mergeGeometries(pieces,false);if(merged){const m=new T.Mesh(merged,batch.material);m.castShadow=true;m.receiveShadow=true;scene.add(m);batch.meshes.forEach(m=>m.removeFromParent());}pieces.forEach(g=>g.dispose());}
  collision.updateMatrixWorld(true);const octree=new Octree().fromGraphNode(collision);
  const foliage=[grass,flowers];
  return {scene,octree,water,fire,embers,sun,foliage,update(time){
    poseidon.update(time);
    flames.children.forEach((f,i)=>{f.scale.y=1+Math.sin(time*5+i)*.18;f.rotation.y=time*.3+i;});firelight.intensity=16+Math.sin(time*8)*2;
    const p=eg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,(ep[i*3+1]+time*.8)%6);p.needsUpdate=true;
    ripples.forEach((r,i)=>{r.position.y=.54+Math.sin(time*.7+i)*.008;r.rotation.z=Math.sin(time*.15+i)*.1;});
    (water.material as T.MeshStandardMaterial).roughness=.28+Math.sin(time*.4)*.04;
    grass.rotation.z=Math.sin(time*.8)*.0004;
  },dispose(){const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if((m as T.MeshStandardMaterial).map)textures.add((m as T.MeshStandardMaterial).map!);}}});collision.traverse(o=>{if(o instanceof T.Mesh)geos.add(o.geometry);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}



