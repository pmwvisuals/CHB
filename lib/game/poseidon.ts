import * as T from 'three';
import { groundHeight, poseidonTemple } from './data';

/** A residential sanctuary, measured in metres. Local +Z faces the central green. */
export function buildPoseidonTemple(scene: T.Scene, collision: T.Group) {
  const root = new T.Group();
  root.position.set(poseidonTemple.x, groundHeight(poseidonTemple.x, poseidonTemple.z), poseidonTemple.z);
  root.rotation.y = poseidonTemple.rotation;
  root.name = 'Poseidon residential temple';
  scene.add(root);
  const material = (color: string, roughness = .85, metalness = 0) => new T.MeshStandardMaterial({color, roughness, metalness});
  const limestone = material('#d0c8ad'), edge = material('#e6dcc0'), darkStone = material('#989b8d');
  const teal = material('#397e7b'), roofMat = material('#496f70'), bronze = material('#a98243', .36, .65);
  const timber = material('#785639'), linen = material('#e4d8bb'), blanket = material('#538e8b');
  // Small, deterministic mineral flecks provide surface detail without external assets.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ddd7c5'; ctx.fillRect(0,0,256,256);
  let seed = 37;
  for(let i=0;i<2400;i++) { seed=(seed*1664525+1013904223)>>>0; const x=seed%256; seed=(seed*1664525+1013904223)>>>0; const y=seed%256; ctx.fillStyle=i%3?'#c8c1ac':'#ece5d4'; ctx.fillRect(x,y,1+(i%3),1); }
  const texture = new T.CanvasTexture(canvas); texture.colorSpace=T.SRGBColorSpace; texture.wrapS=texture.wrapT=T.RepeatWrapping;
  limestone.map=texture;
  const cube = new T.BoxGeometry(1,1,1);
  function mesh(geometry:T.BufferGeometry, mat:T.Material, x:number,y:number,z:number) {
    const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;
  }
  function solid(m:T.Mesh) { m.updateWorldMatrix(true,false);const c=new T.Mesh(m.geometry);c.matrixAutoUpdate=false;c.matrix.copy(m.matrixWorld);collision.add(c); }
  function box(x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,collides=false) {const m=mesh(cube,mat,x,y,z);m.scale.set(w,h,d);if(collides)solid(m);return m;}
  function cylinder(x:number,y:number,z:number,r:number,h:number,mat:T.Material,top=r,collides=false) {const m=mesh(new T.CylinderGeometry(top,r,h,20),mat,x,y,z);if(collides)solid(m);return m;}
  function label(words:string,x:number,y:number,z:number,width:number) {
    const c=document.createElement('canvas');c.width=1024;c.height=128;const p=c.getContext('2d')!;
    p.fillStyle='#326462';p.fillRect(0,0,1024,128);p.fillStyle='#f1dfb5';p.font='42px Georgia';p.textAlign='center';p.textBaseline='middle';p.fillText(words,512,66,970);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
    return mesh(new T.PlaneGeometry(width,width/8),new T.MeshStandardMaterial({map:t}),x,y,z);
  }
  // Low continuous foundation keeps the entrance accessible without jumping.
  box(0,-.1,1,14.8,.5,23, darkStone);
  box(0,.08,1,14.4,.16,23, limestone,true);
  box(0,.08,13,4.6,.16,3, limestone,true);
  for(let z=-9;z<=12;z+=1.5)box(0,.165,z,14,.008,.025,darkStone);
  for(let x=-6;x<=6;x+=1.5)box(x,.165,1,.025,.008,22,darkStone);
  // Rear living hall, with a generous central doorway and recessed windows.
  for(const s of [-1,1]) {
    box(s*6.7,3,-4.5,.4,6,9,limestone,true);
    box(s*4.15,3,0,5.1,6,.4,limestone,true);
    box(s*4.15,2.8,.22,2.1,2.7,.12,timber);
    box(s*4.15,2.8,.3,1.8,2.4,.08,teal);
    for(const dx of [-.6,0,.6])box(s*4.15+dx,2.8,.36,.065,2.5,.07,bronze);
    box(s*4.15,1.45,.4,2.4,.18,.5,edge);
  }
  box(0,3,-9,13.8,6,.4,limestone,true);
  box(0,4.75,0,3.2,2.5,.4,limestone,true);
  for(const s of [-1,1])box(s*1.7,1.85,.25,.22,3.7,.28,edge);
  box(0,3.75,.25,3.6,.24,.28,edge);
  label('HALL OF THE TIDES',0,4.5,.24,3.6);
  // Roofed portico and open-air court. Fluted columns have real collision shapes.
  function column(x:number,z:number) {
    box(x,.28,z,1.15,.24,1.15,edge,true);
    cylinder(x,.52,z,.52,.24,edge);
    cylinder(x,3.15,z,.39,5.1,limestone,.32);
    // A continuous proxy avoids seams between the shaft and stepped capital/base.
    const proxy=box(x,3,z,.72,6,.72,limestone,true);proxy.removeFromParent();
    for(let k=0;k<12;k++){const a=k/12*Math.PI*2;cylinder(x+Math.cos(a)*.355,3.15,z+Math.sin(a)*.355,.027,4.8,edge,.025);}
    cylinder(x,5.75,z,.48,.22,edge);
    box(x,5.98,z,1.08,.25,1.08,edge);
  }
  for(const x of [-6.15,6.15])for(const z of [1.4,5.5,10])column(x,z);
  for(const x of [-2.8,2.8])column(x,10);
  for(const s of [-1,1]){box(s*6.15,6.22,5.7,1.12,.38,10,edge);box(s*6.15,6.48,5.7,1.3,.15,10.4,teal);}
  box(0,6.22,10,13.6,.4,1.2,edge);
  box(0,6.57,10,14,.32,1.25,teal);
  label('P O S E I D O N',0,6.57,10.64,6.2);
  function roof(z:number,depth:number,y:number) {
    const slope=Math.atan2(2.3,7.3),len=Math.hypot(7.3,2.3);
    for(const s of [-1,1]) {
      const panel=box(s*3.65,y+1.15,z,len,.22,depth,roofMat);panel.rotation.z=-s*slope;
      for(let row=0;row<6;row++)for(let k=0;k<Math.ceil(depth/.6);k++) {
        const x=s*(.6+row*1.2),yy=y+2.3-Math.abs(x)/7.3*2.3;
        const tile=box(x,yy+.15,z-depth/2+.3+k*.6,1.22,.07,.55,k%3?roofMat:teal);tile.rotation.z=-s*slope;
      }
    }
    const shape=new T.Shape();shape.moveTo(-7.3,0);shape.lineTo(7.3,0);shape.lineTo(0,2.3);shape.closePath();
    for(const s of [-1,1]) {const m=mesh(new T.ShapeGeometry(shape),edge,0,y,z+s*depth/2);if(s<0)m.rotation.y=Math.PI;}
    box(0,y+2.4,z,.28,.24,depth+.3,bronze);
  }
  roof(-4.5,10,6.35);roof(10,3.2,6.85);
  // Bronze wave relief and a single sculptural trident give the façade its identity.
  for(const x of [-5,-3.9,-2.8,2.8,3.9,5]){const wave=mesh(new T.TorusGeometry(.35,.055,6,16,Math.PI*1.4),bronze,x,7.3,11.63);wave.rotation.z=.2;}
  box(0,9.8,10,.14,2.1,.14,bronze);box(0,10.1,10,1.2,.12,.14,bronze);
  for(const x of [-.6,0,.6]){box(x,10.5,10,.12,.85,.12,bronze);mesh(new T.ConeGeometry(.16,.38,4),bronze,x,11.1,10);}
  // Twin reflecting pools keep a 3 m central route open from porch to living hall.
  const waterMat=new T.MeshStandardMaterial({color:'#46a5a0',roughness:.19,metalness:.35,transparent:true,opacity:.72});
  const rings:T.Mesh[]=[];
  for(const s of [-1,1]) {
    box(s*3.8,.175,5.5,3.1,.02,5.4,teal);
    const water=mesh(new T.PlaneGeometry(3,5.3),waterMat,s*3.8,.205,5.5);water.rotation.x=-Math.PI/2;water.castShadow=false;
    for(const dx of [-1.65,1.65])box(s*3.8+dx,.28,5.5,.18,.24,5.8,edge,true);
    for(const z of [2.65,8.35])box(s*3.8,.28,z,3.45,.24,.18,edge,true);
    for(let j=0;j<3;j++){const ring=mesh(new T.RingGeometry(.32,.34,40),new T.MeshBasicMaterial({color:'#d6f0d5',transparent:true,opacity:.35,side:T.DoubleSide}),s*3.8,.214,5.5);ring.rotation.x=-Math.PI/2;ring.castShadow=false;rings.push(ring);}
    cylinder(s*3.8,.5,5.5,.38,.6,darkStone,.3,true);
    const bowl=mesh(new T.SphereGeometry(.7,24,12,0,Math.PI*2,0,Math.PI/2),bronze,s*3.8,.8,5.5);bowl.rotation.x=Math.PI;
    cylinder(s*3.8,.84,5.5,.58,.025,waterMat);
    // Terracotta pots, silver-green foliage and sheltered benches.
    for(const z of [1.3,10.4]){cylinder(s*5,.6,z,.4,.85,material('#aa7955'),.55,true);for(let j=0;j<4;j++){const leaf=mesh(new T.IcosahedronGeometry(.42,1),material('#7e9470'),s*5+Math.sin(j*2)*.3,1.2+j*.16,z+Math.cos(j*2)*.2);leaf.scale.y=.7;}}
    box(s*6.1,.65,3.5,.65,.15,2.6,timber,true);box(s*6.4,1.1,3.5,.1,.8,2.6,timber);
  }
  // Four beds, woven rugs, storage, lamps, shelves and a communal table.
  for(const s of [-1,1])for(const z of [-3,-6.5]) {
    box(s*4.8,.49,z,2,.65,2.7,timber,true);
    box(s*4.8,.88,z,1.9,.2,2.55,linen);
    box(s*4.8,1,z+.35,1.92,.07,1.8,blanket);
    box(s*4.8,1.05,z-.85,1.4,.2,.55,linen);
    box(s*4.8,1.08,z-1.3,2.1,1.1,.14,timber,true);
    box(s*6,.55,z+1.25,.7,.75,.65,timber,true);
    for(let k=0;k<3;k++)box(s*4.8-.6+k*.6,.32,z+1.4,.4,.08,.16,bronze);
  }
  box(0,.175,-3.4,5,.018,5.5,teal);
  for(const s of [-1,1])box(s*2.3,.187,-3.4,.08,.01,5.2,bronze);
  box(0,1,-5.4,2.3,.16,2.6,timber,true);
  for(const x of [-.9,.9])for(const z of [-6.4,-4.4])box(x,.55,z,.13,.9,.13,timber);
  for(const s of [-1,1])box(s*1.8,.65,-5.4,.65,.18,2.4,timber,true);
  for(const x of [-.65,0,.65])cylinder(x,1.1,-5.3,.2,.03,edge);
  box(0,1.13,-6,.9,.08,.5,linen);
  for(const s of [-1,1]){box(s*3,1.8,-8.6,2.3,3,.4,timber,true);for(let row=0;row<4;row++){box(s*3,.5+row*.7,-8.3,2.3,.1,.6,timber);for(let j=0;j<6;j++)box(s*3-.8+j*.32,.78+row*.7,-8.2,.2,.42,.25,j%2?teal:linen);}}
  const glow=new T.MeshStandardMaterial({color:'#ffe7ad',emissive:'#ffcb7d',emissiveIntensity:1.3});
  for(const x of [-2.1,2.1])for(const z of [.4,-8.5]){box(x,2.5,z,.3,.55,.3,bronze);box(x,2.5,z+.17,.2,.35,.02,glow);}
  const light=new T.PointLight('#ffddaa',12,15,2);light.position.set(0,4,-4);root.add(light);
  label('A HOME BETWEEN EARTH AND SEA',0,3.4,-8.76,5.2);
  return { update(time:number){rings.forEach((r,i)=>{const phase=(time*.22+i%3/3)%1;r.scale.setScalar(.6+phase*3);(r.material as T.MeshBasicMaterial).opacity=(1-phase)*.3;});} };
}
