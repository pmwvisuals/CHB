import * as T from 'three';
import type { TempleTheme, TempleId } from './temple-catalog';

/** Shared sculpting tools; each deity gets its own attributes and sanctuary decoration. */
function sculpt(parent:T.Object3D,detail=12){
 const mesh=(geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const ell=(x:number,y:number,z:number,a:number,b:number,c:number,m:T.Material)=>{const o=mesh(new T.SphereGeometry(1,detail,Math.max(6,Math.round(detail*.6))),m,x,y,z);o.scale.set(a,b,c);return o;};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const o=mesh(new T.BoxGeometry(w,h,d),m,x,y,z);return o;};
 const rod=(a:number[],b:number[],r:number,m:T.Material,end=r)=>{const from=new T.Vector3(a[0],a[1],a[2]),to=new T.Vector3(b[0],b[1],b[2]),dir=to.clone().sub(from);const o=mesh(new T.CylinderGeometry(end,r,dir.length(),12),m);o.position.copy(from.add(to).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return o;};
 const curve=(points:number[][],r:number,m:T.Material)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],p[2]))),28,r,6,false),m);
 const ring=(x:number,y:number,z:number,r:number,t:number,m:T.Material,arc=Math.PI*2)=>mesh(new T.TorusGeometry(r,t,8,40,arc),m,x,y,z);
 return {mesh,ell,box,rod,curve,ring};
}

function emblem(id:TempleId,parent:T.Object3D,metal:T.Material,accent:T.Material){
 const s=sculpt(parent);
 const wing=(sign:number,x=0,y=0,z=0)=>{for(let i=0;i<7;i++){const feather=s.ell(x+sign*(.25+i*.13),y+.15+i*.07,z,.09,.55-i*.035,.04,metal);feather.rotation.z=-sign*(.8+i*.07);}};
 if(id==='zeus'){
  const shape=new T.Shape();shape.moveTo(.15,1.3);shape.lineTo(-.6,-.1);shape.lineTo(-.05,-.1);shape.lineTo(-.35,-1.3);shape.lineTo(.65,.3);shape.lineTo(.12,.3);shape.closePath();s.mesh(new T.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:2,steps:1}),metal);return;
 }
 if(id==='hera'){
  for(let i=0;i<11;i++){const a=-1.25+i*.25,x=Math.sin(a),y=Math.cos(a);s.rod([0,-.6,0],[x,y,0],.025,metal);const f=s.ell(x,y,0,.18,.35,.045,metal);f.rotation.z=-a;const eye=s.ell(x,y,.06,.09,.15,.02,accent);eye.rotation.z=-a;}
  s.ell(0,-.4,.1,.22,.43,.15,metal);s.curve([[0,-.35,.1],[.1,.1,.1],[.3,.2,.1]],.06,metal);s.ell(.3,.2,.1,.1,.11,.09,metal);return;
 }
 if(id==='demeter'){
  for(let j=-2;j<=2;j++){s.rod([j*.07,-1,0],[j*.24,.9-Math.abs(j)*.1,0],.025,metal);for(let k=0;k<5;k++)for(const d of [-1,1]){const grain=s.ell(j*.24+d*.065,.3+k*.13-Math.abs(j)*.1,.025,.07,.12,.045,metal);grain.rotation.z=d*.65;}}s.ring(0,-.35,0,.22,.055,accent).rotation.x=Math.PI/2;return;
 }
 if(id==='ares'||id==='athena'){
  s.ell(0,0,0,.75,.85,.13,metal);s.ring(0,0,.1,.68,.04,accent);s.ell(0,0,.2,.22,.22,.12,metal);
  s.rod([.85,-1.4,-.1],[.85,1.3,-.1],.035,metal);s.mesh(new T.ConeGeometry(.13,.5,4),metal,.85,1.45,-.1);
  if(id==='athena'){s.ell(0,.05,.33,.25,.35,.08,accent);for(const d of [-1,1]){s.ring(d*.13,.2,.43,.105,.025,metal);s.ell(d*.13,.2,.44,.035,.04,.02,metal);}}
  return;
 }
 if(id==='apollo'){
  s.curve([[-.6,1,0],[-.7,-.6,0],[0,-1,0],[.7,-.6,0],[.6,1,0]],.09,metal);s.rod([-.65,.8,0],[.65,.8,0],.07,metal);for(let i=-3;i<=3;i++)s.rod([i*.14,-.65,0],[i*.14,.8,0],.012,accent);return;
 }
 if(id==='artemis'){
  s.curve([[0,1.3,0],[.65,.7,0],[.7,0,0],[.65,-.7,0],[0,-1.3,0]],.06,metal);s.rod([0,1.3,0],[0,-1.3,0],.015,accent);s.rod([-.4,0,0],[1.2,0,0],.025,metal);const tip=s.mesh(new T.ConeGeometry(.09,.3,3),metal,1.3,0,0);tip.rotation.z=-Math.PI/2;return;
 }
 if(id==='hephaestus'){
  s.rod([0,-1.2,0],[0,.65,0],.075,accent);s.box(0,.7,0,1.25,.5,.48,metal);s.box(-.45,.7,0,.1,.55,.54,accent);return;
 }
 if(id==='aphrodite'){
  for(let i=0;i<13;i++){const a=-1.4+i*2.8/12;const rib=s.ell(Math.sin(a)*.45,Math.cos(a)*.5,0,.18,.9,.09,metal);rib.rotation.z=-a;}s.ell(0,-.45,.05,.45,.15,.14,accent);return;
 }
 if(id==='hermes'){
  s.rod([0,-1.3,0],[0,1,0],.045,metal);s.ell(0,1.05,0,.1,.1,.1,metal);
  for(const sign of [-1,1]){const points=[];for(let j=0;j<20;j++){const y=-.95+j*.085;points.push([Math.sin(j*.65)*.22*sign,y,Math.cos(j*.65)*.04]);}s.curve(points,.035,metal);wing(sign,0,.7,0);}return;
 }
 if(id==='dionysus'){
  s.rod([0,-1.3,0],[0,.9,0],.055,metal);s.ell(0,1,0,.22,.35,.18,metal);
  for(let row=0;row<4;row++)for(let j=0;j<4-row;j++)s.ell(-.35+j*.2+row*.1,.3-row*.2,.13,.13,.14,.13,accent);
  for(const sign of [-1,1]){const leaf=s.ell(sign*.35,.65,0,.34,.15,.05,metal);leaf.rotation.z=sign*.4;}return;
 }
}

export function addDeityArt(theme:TempleTheme,scene:T.Scene){
 const mat=(color:string,metalness=0,roughness=.6)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const skin=mat(theme.statue,.45,.43),metal=mat(theme.metal,.7,.32),accent=mat(theme.accent,.1,.65),pale=mat(theme.ivory),leaf=mat(theme.id==='dionysus'?'#536744':'#6d7950'),fruit=mat('#6b416b');
 const statue=new T.Group();statue.name=`${theme.name} cult statue`;statue.position.set(0,1.51,-13.4);statue.scale.setScalar(1.55);scene.add(statue);const s=sculpt(statue,24);
 const female=theme.female;
 const profile=(female?[[.42,1.5],[.49,1.9],[.38,2.35],[.48,2.9],[.53,3.25],[.44,3.55],[.2,3.72]]:[[.43,1.75],[.54,2.05],[.43,2.45],[.54,2.85],[.75,3.25],[.76,3.48],[.48,3.65],[.22,3.78]]).map(([x,y])=>new T.Vector2(x,y));
 const torso=s.mesh(new T.LatheGeometry(profile,40),skin);torso.scale.z=.67;
 for(const sign of [-1,1]){s.rod([sign*.3,1.85,0],[sign*.36,.95,.08],.27,skin,.21);s.rod([sign*.36,.95,.08],[sign*.4,.18,.12],.21,skin,.13);s.ell(sign*.4,.15,.26,.21,.16,.4,skin);}
 const clothPoints=[];for(let i=0;i<=22;i++){const y=.25+i*(female?3.1:1.9)/22;clothPoints.push(new T.Vector2(female?.7-y*.07:.48+y*.04,y));}
 const cloth=new T.LatheGeometry(clothPoints,56);const pos=cloth.attributes.position;for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getX(i),pos.getZ(i)),r=1+Math.sin(a*16+pos.getY(i)*.8)*.06;pos.setX(i,pos.getX(i)*r);pos.setZ(i,pos.getZ(i)*r*.8);}cloth.computeVertexNormals();s.mesh(cloth,skin);
 s.ell(0,3.75,0,.2,.3,.18,skin);s.ell(0,4.12,0,.33,.45,.29,skin);s.ell(0,4.06,.28,.08,.16,.09,skin);
 for(const sign of [-1,1]){s.ell(sign*.13,4.21,.25,.13,.045,.04,skin);s.ell(sign*.13,4.16,.278,.04,.024,.018,metal);s.ell(sign*.31,4.1,0,.06,.12,.08,skin);}
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;s.ell(Math.cos(a)*.3,4.36+Math.sin(i*2)*.04,Math.sin(a)*.24,.095,.13,.095,skin);if(female||theme.id==='dionysus')s.ell(Math.cos(a)*.31,4.05,Math.sin(a)*.26-.09,.08,.32,.07,skin);}
 if(theme.beard)for(let i=0;i<11;i++){const x=(i-5)*.05;s.ell(x,3.9-Math.sqrt(Math.max(0,1-(x/.32)**2))*.13,.27,.06,.18,.08,skin);}
 const shoulder=female?.47:.68;
 s.rod([-shoulder,3.4,0],[-.85,2.9,.08],.19,skin,.14);s.rod([-.85,2.9,.08],[-1.3,3.1,.4],.14,skin,.1);s.ell(-1.35,3.1,.43,.17,.08,.16,skin);
 s.rod([shoulder,3.4,0],[.92,2.95,0],.2,skin,.15);s.rod([.92,2.95,0],[1.1,3.3,.16],.15,skin,.1);s.ell(1.1,3.3,.16,.11,.16,.11,skin);
 const attribute=new T.Group();attribute.name=`${theme.id} sacred attribute`;attribute.position.set(theme.id==='ares'||theme.id==='athena'?-1.25:1.2,theme.id==='ares'||theme.id==='athena'?2.1:3.2,.4);attribute.scale.setScalar(theme.id==='artemis'?.9:.66);statue.add(attribute);emblem(theme.id,attribute,metal,accent);
 if(theme.id==='hera'){s.ring(0,4.48,0,.34,.06,metal).rotation.x=Math.PI/2;for(let j=0;j<7;j++){const a=j/7*Math.PI*2;s.mesh(new T.ConeGeometry(.065,.27,4),metal,Math.cos(a)*.3,4.6,Math.sin(a)*.3);}}
 if(theme.id==='ares'||theme.id==='athena'){s.mesh(new T.SphereGeometry(.39,24,12,0,Math.PI*2,0,Math.PI*.52),metal,0,4.25,0);s.box(0,4.17,.32,.09,.46,.08,metal);for(const sign of [-1,1])s.box(sign*.3,4.03,.12,.1,.36,.23,metal);s.box(0,4.65,-.02,.14,.3,.72,accent);}
 if(theme.id==='hermes'){for(const sign of [-1,1])for(let j=0;j<5;j++){const feather=s.ell(sign*(.58+j*.065),.3+j*.07,.08,.04,.22,.025,metal);feather.rotation.z=-sign*.6;}s.mesh(new T.CylinderGeometry(.47,.47,.07,32),metal,0,4.43,0);}
 if(['apollo','demeter','dionysus'].includes(theme.id)){for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const l=s.ell(Math.cos(a)*.33,4.42,Math.sin(a)*.28,.055,.13,.03,metal);l.rotation.z=a;}}
 if(theme.id==='artemis'){const moon=s.ring(0,4.65,0,.24,.055,metal,Math.PI*1.5);moon.rotation.z=-.8;}
 const back=new T.Group();back.name=`${theme.id} monumental relief`;back.position.set(0,6.2,-18.3);scene.add(back);
 if(theme.id==='apollo'){
  const b=sculpt(back);b.ell(0,0,0,2,2,.2,metal);for(let j=0;j<24;j++){const a=j/24*Math.PI*2;const ray=b.box(Math.sin(a)*2.8,Math.cos(a)*2.8,0,.1,1.2,.13,metal);ray.rotation.z=-a;}
 }else if(theme.id==='artemis'){
  const b=sculpt(back);b.ring(0,1,0,2.7,.24,metal,Math.PI*1.55).rotation.z=-.85;for(let j=0;j<20;j++){const x=Math.sin(j*13)*7,y=Math.cos(j*7)*4;b.ell(x,y,.05,.05,.05,.04,pale);}
 }else {back.scale.setScalar(theme.id==='aphrodite'?3.7:2.5);emblem(theme.id,back,metal,accent);}
 const d=sculpt(scene);
 // Distinct sacred displays occupy the side aisles without obstructing the main approach.
 for(const sign of [-1,1])for(let k=0;k<5;k++){
  const x=sign*8,z=12-k*6;d.box(x,.6,z,1.2,1.2,1.8,accent);d.box(x,1.24,z,1.4,.12,2,pale);
  const offering=new T.Group();offering.name=`${theme.id} offering ${sign} ${k}`;offering.position.set(x,2.05,z);offering.scale.setScalar(.55);scene.add(offering);emblem(theme.id,offering,metal,accent);
 }
 if(['ares','hera','zeus'].includes(theme.id))for(const sign of [-1,1])for(const z of [-11,1,13]){
  d.rod([sign*8.9,8,z-1],[sign*8.9,8,z+1],.06,metal);const banner=d.box(sign*8.85,6.3,z,.045,3.3,1.65,accent);for(const y of [4.75,7.85])d.box(sign*8.81,y,z,.02,.1,1.65,metal);
 }
 if(['demeter','athena','dionysus','aphrodite'].includes(theme.id))for(const sign of [-1,1])for(const z of [-14,-8,-2,4,10,16]){
  for(let j=0;j<8;j++){const a=j*.8,x=sign*6.15+Math.sin(a)*.65,y=1+j*.9,zz=z+Math.cos(a)*.65;d.ell(x,y,zz,.22,.09,.12,leaf).rotation.z=a;
   if(theme.id==='dionysus')for(let n=0;n<4;n++)d.ell(x+n%2*.09,y-.12-Math.floor(n/2)*.1,zz,.08,.09,.08,fruit);
   if(theme.id==='aphrodite')for(let n=0;n<5;n++){const angle=n/5*Math.PI*2;d.ell(x+Math.cos(angle)*.12,y+Math.sin(angle)*.12,zz+.06,.1,.1,.04,pale);}
  }
 }
 if(theme.id==='hephaestus')for(const sign of [-1,1]){
  d.box(sign*4.6,.6,-14,1.6,1.2,2,accent);d.box(sign*4.6,1.3,-14,2.4,.3,1,metal);d.mesh(new T.ConeGeometry(.5,1.1,4),metal,sign*4.6+.8,1.3,-14).rotation.z=Math.PI/2;
  const glow=new T.MeshStandardMaterial({color:'#ff8a38',emissive:'#ff6b22',emissiveIntensity:1});d.box(sign*4.6,.6,-12.97,.85,.4,.04,glow);
 }
 if(theme.id==='hermes')for(const r of [1.4,2,2.3])d.ring(0,.035,5,r,.035,metal).rotation.x=Math.PI/2;
 if(theme.id==='hera')for(const sign of [-1,1]){const fan=new T.Group();fan.position.set(sign*4,2.5,-15);fan.scale.setScalar(1.3);scene.add(fan);emblem('hera',fan,metal,accent);}
 if(theme.id==='zeus'){
  // Eagle silhouette above the thunderbolt relief.
  d.ell(0,10,-18,.4,.55,.15,metal);for(const sign of [-1,1])for(let j=0;j<9;j++){const f=d.ell(sign*(.35+j*.24),10.15+j*.06,-18,.16,.6-j*.025,.07,metal);f.rotation.z=-sign*1.05;}
 }
 if(theme.id==='artemis')for(const sign of [-1,1]){
  const deer=new T.Group();deer.name='Sacred deer';deer.position.set(sign*4.3,.2,-13);deer.rotation.y=-sign*.35;scene.add(deer);const a=sculpt(deer);
  a.ell(0,1.05,0,.38,.5,.85,metal);a.rod([0,1.3,-.55],[0,2,-.85],.22,metal,.16);a.ell(0,2.08,-1,.22,.28,.4,metal);
  for(const side of [-1,1]){a.ell(side*.23,2.3,-.82,.12,.25,.06,metal).rotation.z=-side*.5;for(const z of [-.5,.5])a.rod([side*.23,.95,z],[side*.28,.02,z+.1],.075,metal,.05);
   a.curve([[side*.15,2.3,-.85],[side*.3,2.65,-.7],[side*.55,3,-.6]],.035,metal);for(let j=0;j<3;j++)a.rod([side*(.25+j*.1),2.55+j*.15,-.7],[side*(.4+j*.15),2.8+j*.16,-.82],.025,metal,.01);}
 }
 if(theme.id==='aphrodite')for(const sign of [-1,1]){
  const dove=new T.Group();dove.name='Dove of Aphrodite';dove.position.set(sign*3.7,2.3,-14);scene.add(dove);const a=sculpt(dove);
  a.ell(0,0,0,.32,.32,.58,pale);a.ell(0,.35,-.35,.22,.24,.22,pale);a.rod([0,.35,-.5],[0,.32,-.73],.1,metal,0);
  for(const side of [-1,1])for(let j=0;j<6;j++){const feather=a.ell(side*(.3+j*.12),.2+j*.07,.12,.12,.44-j*.025,.08,pale);feather.rotation.z=-side*.8;}
 }
 if(theme.id==='dionysus')for(const sign of [-1,1]){
  const mask=new T.Group();mask.name=sign<0?'Comedy mask':'Tragedy mask';mask.position.set(sign*4,4,-18.2);scene.add(mask);const a=sculpt(mask);
  a.ell(0,0,0,.8,1,.18,metal);for(const side of [-1,1])a.ell(side*.3,.25,.19,.15,.12,.025,accent);
  a.curve([[-.4,-.35,.2],[0,sign<0?-.65:-.15,.2],[.4,-.35,.2]],.07,accent);
 }
 return {statue,relief:back};
}
