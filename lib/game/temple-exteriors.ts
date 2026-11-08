import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight } from './data';
import { templeCatalog,templePlacement,type TempleTheme } from './temple-catalog';

/** Meter-scale sacred architecture, assembled once and batched by material. */
function architecture(scene:T.Scene,collision:T.Group,name:string,x:number,z:number,rotation=0){
 const root=new T.Group();root.name=name;root.position.set(x,groundHeight(x,z),z);root.rotation.y=rotation;scene.add(root);
 const cube=new T.BoxGeometry(1,1,1),cache=new Map<string,T.MeshStandardMaterial>();
 const grain=new Uint8Array(128*128*4);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const vein=Math.sin(x*.075+Math.sin(y*.053)*2.4),n=Math.sin(x*73.17+y*19.91)*.5+.5,v=225+n*24-Math.pow(Math.abs(vein),24)*30,i=(y*128+x)*4;grain[i]=v;grain[i+1]=v;grain[i+2]=v;grain[i+3]=255;}
 const mineral=new T.DataTexture(grain,128,128);mineral.wrapS=mineral.wrapT=T.RepeatWrapping;mineral.generateMipmaps=true;mineral.minFilter=T.LinearMipmapLinearFilter;mineral.colorSpace=T.SRGBColorSpace;mineral.needsUpdate=true;
 function mat(color:string,metal=false){const key=color+metal;if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,map:metal?null:mineral,bumpMap:metal?null:mineral,bumpScale:.025,roughness:metal?.38:.77,metalness:metal?.65:0}));return cache.get(key)!;}
 function mesh(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){if(!g.getAttribute('uv')){const p=g.getAttribute('position'),uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*.15,p.getY(i)*.15+p.getZ(i)*.15);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 function solid(o:T.Mesh){o.updateWorldMatrix(true,false);const c=new T.Mesh(o.geometry);c.matrixAutoUpdate=false;c.matrix.copy(o.matrixWorld);collision.add(c);}
 function box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,collides=false){const o=mesh(cube,m,x,y,z);o.scale.set(w,h,d);if(collides)solid(o);return o;}
 function cylinder(x:number,y:number,z:number,r:number,h:number,m:T.Material,top=r,collides=false){const o=mesh(new T.CylinderGeometry(top,r,h,24),m,x,y,z);if(collides)solid(o);return o;}
 function sphere(x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material){const o=mesh(new T.SphereGeometry(1,12,8),m,x,y,z);o.scale.set(sx,sy,sz);return o;}
 function line(points:number[][],radius:number,m:T.Material){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),Math.max(8,points.length*4),radius,6,false),m);}
 function label(words:string,x:number,y:number,z:number,width:number,ink:string){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,1024,128);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='54px Georgia';ctx.fillText(words,512,68,980);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return mesh(new T.PlaneGeometry(width,width/8),new T.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:.65}),x,y,z);}
 function ramp(width:number,front:number,back:number,height:number,turn=0){const verts=[-width/2,0,front,width/2,0,front,-width/2,height,back,width/2,height,back];const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex([0,1,2,1,3,2]);g.rotateY(turn);g.computeVertexNormals();const o=mesh(g,mat('#c6bea8'));solid(o);}
 function column(x:number,z:number,height:number,m:T.Material,trim:T.Material,order:string){
  box(x,.56,z,.92,.24,.92,trim,true);cylinder(x,.78,z,.45,.20,trim);
  // Twenty actual concave flutes, with entasis rather than decorative sticks.
  const verts:number[]=[],idx:number[]=[],segments=80,rings=8;
  for(let j=0;j<=rings;j++){const t=j/rings,r=(.35-.055*t)+.025*Math.sin(t*Math.PI);for(let k=0;k<=segments;k++){const a=k/segments*Math.PI*2,flute=.018*(1+Math.cos(a*20));verts.push(x+Math.cos(a)*(r-flute),.88+t*(height-1.23),z+Math.sin(a)*(r-flute));if(j<rings&&k<segments){const n=j*(segments+1)+k;idx.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,m);
  const proxy=box(x,height/2+.3,z,.68,height,.68,m,true);proxy.removeFromParent();cylinder(x,height-.13,z,.43,.23,trim,.48);box(x,height+.06,z,1.03,.16,1.03,trim);
  if(order==='ionic')for(const s of [-1,1]){const scroll=mesh(new T.TorusGeometry(.17,.045,6,18),trim,x+s*.42,height-.06,z+.29);scroll.rotation.z=s*.3;}
  if(order==='corinthian')for(let k=0;k<8;k++){const a=k/8*Math.PI*2;sphere(x+Math.cos(a)*.34,height-.18,z+Math.sin(a)*.34,.10,.26,.065,trim);}
 }
 function finish(){root.updateWorldMatrix(true,true);const batches=new Map<T.Material,T.Mesh[]>();root.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&!o.material.transparent){const list=batches.get(o.material)||[];list.push(o);batches.set(o.material,list);}});
  for(const [m,list] of batches){const inverse=root.matrixWorld.clone().invert(),geos=list.map(o=>{const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));return g.index?g.toNonIndexed():g;});const merged=mergeGeometries(geos,false);if(!merged)throw new Error('Exterior geometry attributes mismatch');const o=new T.Mesh(merged,m);o.castShadow=o.receiveShadow=true;root.add(o);list.forEach(o=>o.removeFromParent());geos.forEach(g=>g.dispose());}
  const live=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh)live.add(o.geometry);});collision.traverse(o=>{if(o instanceof T.Mesh)live.add(o.geometry);});
  // Temporary assembly geometry is released; collision meshes keep their proxies.
  const old=new Set<T.BufferGeometry>();for(const list of batches.values())for(const o of list)old.add(o.geometry);old.add(cube);for(const g of old)if(!live.has(g))g.dispose();
  return root;
 }
 return {root,mat,mesh,box,cylinder,sphere,line,label,column,ramp,finish};
}

export function buildTempleExteriors(scene:T.Scene,collision:T.Group){
 const roots:T.Group[]=[];
 for(const theme of templeCatalog){const p=templePlacement(theme.id),a=architecture(scene,collision,`${theme.name} temple exterior`,p.x,p.z,p.rotation);const {box,cylinder,sphere,line,mesh,mat}=a;
  const stone=mat(theme.stone),ivory=mat(theme.ivory),accent=mat(theme.accent),metal=mat(theme.metal,true),roof=mat(theme.id==='poseidon'?'#527d79':theme.id==='artemis'?'#526979':theme.id==='hephaestus'?'#4b4540':theme.id==='hera'?'#665067':theme.id==='aphrodite'?'#b1817d':theme.id==='athena'?'#697b70':'#9b7053');
  const order=['hera','aphrodite','dionysus'].includes(theme.id)?'corinthian':['poseidon','athena','hermes','artemis'].includes(theme.id)?'ionic':'doric';
  const H=theme.id==='zeus'?7.2:theme.id==='ares'?6.5:6.9,door=p.threshold-.4;
  const tileLight=mat('#'+roof.color.clone().lerp(new T.Color('#ffffff'),.055).getHexString()),tileDark=mat('#'+roof.color.clone().multiplyScalar(.91).getHexString());
  a.root.userData={templeId:theme.id,order,door,exterior:true};
  // Three low crepidoma courses, with a continuous central processional ramp.
  box(0,-.07,0,13.0,.3,15.8,stone);box(0,.12,0,12.7,.22,15.5,stone);box(0,.33,0,12.4,.22,15.2,ivory,true);
  for(let k=0;k<3;k++)for(const side of [-1,1])box(side*3.8,.06+k*.13,8.4-k*.35,4.4,.13,.8,stone);
  a.ramp(3.15,10.0,7.3,.44);
  // A clear 2.6m door; the actual sacred hall remains on its own page.
  box(-4.0,3.45,-.6, .42,6.0,12.7,stone,true);box(4.0,3.45,-.6,.42,6.0,12.7,stone,true);box(0,3.45,-6.75,8.3,6,.4,stone,true);
  for(const side of [-1,1]){box(side*2.7,3.45,door,2.8,6,.46,stone,true);box(side*1.48,2.9,door+.3,.27,4.9,.38,ivory,true);box(side*2.9,.88,-.6,2.2,.75,11.6,accent);}
  box(0,5.8,door,3.25,1.3,.5,stone,true);box(0,5.3,door+.28,3.6,.30,.65,ivory);box(0,5.55,door+.35,3.85,.15,.75,metal);
  for(const side of [-1,1])box(side*4.0,(6.45+H+.65)/2,-.6,.42,H+.65-6.45,12.7,stone);
  box(0,(6.45+H+.65)/2,-6.75,8.3,H+.65-6.45,.4,stone);box(0,(6.45+H+.65)/2,door,8.3,H+.65-6.45,.46,stone);box(0,H+.65,-.6,8.3,.16,12.7,stone);
  const darkness=mat('#252d2b');box(0,2.85,door-1.7,2.65,4.8,.12,darkness,true);
  for(const side of [-1,1]){const leaf=box(side*1.34,2.85,door-.55,.12,4.7,1.1,metal);leaf.rotation.y=side*.12;for(let y=1.2;y<5;y+=.65)box(side*1.39,y,door-.30,.08,.35,.42,accent);}
  // Six-column silhouette at the front, side colonnades and a rear porch.
  const outer=5.45;
  for(const x of [-outer,-3.3,3.3,outer])a.column(x,6.5,H,ivory,stone,order);
  for(const x of [-outer,outer])for(const z of [2.45,-1.6,-5.65])a.column(x,z,H,ivory,stone,order);
  for(const x of [-3.3,3.3])a.column(x,-5.65,H,ivory,stone,order);
  // Continuous architrave, carved metopes and deep-shadow dentils.
  for(const side of [-1,1]){box(side*outer,H+.37,.4,1.04,.45,13.5,stone);box(side*outer,H+.73,.4,1.16,.24,13.8,accent);box(side*outer,H+.96,.4,1.35,.20,14.1,ivory);}
  for(const z of [6.5,-5.65]){box(0,H+.37,z,11.9,.45,1.05,stone);box(0,H+.73,z,12.05,.24,1.18,accent);box(0,H+.96,z,12.6,.20,1.4,ivory);
   for(let x=-5.5;x<5.6;x+=.5)box(x,H+.87,z+(z>0?.65:-.65),.17,.19,.17,ivory);
   for(let x=-5.1;x<5.2;x+=1.25){box(x,H+.35,z+(z>0?.55:-.55),.16,.35,.12,metal);box(x+.18,H+.35,z+(z>0?.55:-.55),.07,.35,.12,metal);}
  }
  // Sculpted pediments and hundreds of individual terracotta/marble roof tiles.
  const eave=H+1.1,rise=2.1,half=6.5;
  for(const z of [-6.6,7.3]){const shape=new T.Shape();shape.moveTo(-half,0);shape.lineTo(half,0);shape.lineTo(0,rise);shape.closePath();const pediment=mesh(new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false}),ivory,0,eave,z);if(z<0)pediment.rotation.y=Math.PI;
   line([[-half,eave,z+.25],[0,eave+rise,z+.25],[half,eave,z+.25]],.14,stone);line([[-half,eave+.15,z+.28],[0,eave+rise-.18,z+.28],[half,eave+.15,z+.28]],.045,metal);
  }
  const slope=Math.atan2(rise,half),len=Math.hypot(half,rise);
  for(const side of [-1,1]){const panel=box(side*half/2,eave+rise/2,.35,len,.20,14.5,roof);panel.rotation.z=-side*slope;
   for(let row=0;row<6;row++)for(let k=0;k<22;k++){const x=side*(.56+row*1.06),z=-6.55+k*.65,n=Math.sin(row*73.7+k*19.3+side*3);const tile=box(x,eave+rise-Math.abs(x)/half*rise+.16,z,1.07,.08,.63,n>.4?tileLight:n<-.5?tileDark:roof);tile.rotation.z=-side*slope;}
  }
  cylinder(0,eave+rise+.12,.4,.14,14.5,metal).rotation.x=Math.PI/2;
  for(const side of [-1,1]){sphere(side*6.35,eave+.35,7.3,.18,.38,.12,metal);line([[side*6.35,eave+.30,7.3],[side*6.10,eave+.75,7.3],[side*5.87,eave+.42,7.3]],.055,metal);}
  a.label(theme.name.toUpperCase(),0,H+.42,7.08,5.5,theme.metal);
  // Bas-relief in the tympanum, sculpted in geometry rather than printed symbols.
  emblem(a,theme,0,eave+.88,7.64,.68);
  for(const side of [-1,1]){
   box(side*4.0,.67,8.65,1.15,.5,1.15,stone);cylinder(side*4.0,1.18,8.65,.24,.55,ivory,.18);
   const bowl=mesh(new T.SphereGeometry(.54,16,10,0,Math.PI*2,0,Math.PI/2),metal,side*4,1.5,8.65);bowl.rotation.x=Math.PI;
   const glow=new T.MeshStandardMaterial({color:theme.light,emissive:theme.light,emissiveIntensity:.8,roughness:.6});sphere(side*4,1.53,8.65,.30,.07,.30,glow);
   // Recessed sidewall panels and sculpted bronze medallions.
   for(const z of [-4.8,-1.8,1.2]){box(side*4.25,3.1,z,.05,2.7,2.0,accent);const ring=mesh(new T.TorusGeometry(.52,.045,6,24),metal,side*4.29,3.3,z);ring.rotation.y=Math.PI/2;}
  }
  if(['demeter','dionysus','aphrodite'].includes(theme.id))for(const side of [-1,1])for(let k=0;k<18;k++){const y=.8+k*.30,x=side*5.45+Math.sin(k*.8)*.35;line([[x,y,6.5],[x+.1,y+.25,6.5]],.028,mat('#4b6241'));sphere(x+.18,y+.15,6.55,.15,.07,.04,mat(theme.id==='aphrodite'?'#c68e9c':'#647648'));if(theme.id==='dionysus'&&k%3===0)for(let j=0;j<4;j++)mesh(new T.IcosahedronGeometry(.078,1),mat('#6e4d73'),x+j*.06,y-.06*j,6.7);}
  if(theme.id==='poseidon')for(const side of [-1,1]){box(side*2.9,.50,3.0,2.0,.10,3.5,accent);box(side*2.9,.57,3.0,1.75,.025,3.25,mat('#519b9b',true));}
  if(theme.id==='ares')for(const side of [-1,1]){const cloth=box(side*4.65,4.7,6.55,.72,2.8,.07,accent);cloth.rotation.z=side*.03;emblem(a,theme,side*4.65,4.8,6.65,.30);}
  if(theme.id==='hephaestus')for(const side of [-1,1]){box(side*3.15,7.8,-4.6,.9,3.5,.9,stone);box(side*3.15,9.6,-4.6,1.1,.25,1.1,metal);}
  roots.push(a.finish());
 }
 return {roots,update(_time:number){}};
}

function emblem(a:ReturnType<typeof architecture>,theme:TempleTheme,x:number,y:number,z:number,s:number){
 const metal=a.mat(theme.metal,true),pale=a.mat(theme.ivory),dark=a.mat(theme.accent),green=a.mat('#5a7150');
 const b=(px:number,py:number,w:number,h:number)=>a.box(x+px*s,y+py*s,z,w*s,h*s,.12*s,metal);
 const ball=(px:number,py:number,sx:number,sy:number,m:T.Material=metal)=>a.sphere(x+px*s,y+py*s,z,sx*s,sy*s,.14*s,m);
 const path=(points:number[][],r=.05,m:T.Material=metal)=>a.line(points.map(([px,py,dz=0])=>[x+px*s,y+py*s,z+dz*s]),r*s,m);
 const arc=(radius:number,start=0,end=Math.PI*2)=>path(Array.from({length:21},(_,i)=>[Math.sin(start+i/20*(end-start))*radius,Math.cos(start+i/20*(end-start))*radius]));
 const wings=()=>{for(const side of [-1,1])for(let i=0;i<6;i++){const o=ball(side*(.3+i*.18),.16+i*.055,.34,.09);o.rotation.z=side*(.15+i*.1);}};
 const wreath=()=>{for(const side of [-1,1]){path([[side*.1,-.7],[side*.76,-.25],[side*.73,.45],[side*.4,.85]],.035,green);for(let i=0;i<6;i++){const t=i/5*Math.PI*.7;const o=ball(side*(.18+Math.sin(t)*.6),-.6+i*.25,.16,.065,green);o.rotation.z=side*.6;}}};
 switch(theme.id){
 case 'zeus':wings();ball(0,0,.22,.38);ball(.03,.42,.14,.14);path([[-.05,.9],[-.4,.25],[.13,.25],[-.16,-.8],[.43,.05],[-.05,.05]],.07);break;
 case 'hera':for(let i=0;i<9;i++){const angle=(i-4)*.24,px=Math.sin(angle)*.95,py=Math.cos(angle)*.6;const o=ball(px,py,.14,.38);o.rotation.z=-angle;ball(px,py+.11,.065,.12,dark);}b(0,-.47,.8,.22);for(const px of [-.32,0,.32])path([[px,-.4],[px,.02],[px+.13,-.22]],.045);break;
 case 'poseidon':b(0,-.05,.10,1.65);path([[-.63,.72],[-.63,.13],[0,-.1],[.63,.13],[.63,.72]],.065);for(const px of [-.63,0,.63])path([[px-.10,.63],[px,.94],[px+.1,.63]],.045);for(const side of [-1,1])path([[side*.3,-.7],[side*.7,-.55],[side*1.1,-.7]],.04);break;
 case 'demeter':for(const px of [-.50,0,.50]){path([[px,-.85],[px,.62]],.035);for(let i=0;i<5;i++)for(const side of [-1,1]){const o=ball(px+side*.12,-.23+i*.18,.10,.16);o.rotation.z=-side*.45;}}break;
 case 'ares':arc(.64);ball(0,0,.56,.63,dark);path([[-.9,-.72],[.8,.85]],.065);path([[.9,-.72],[-.8,.85]],.065);ball(0,.08,.28,.42);b(0,-.25,.46,.15);break;
 case 'athena':wreath();ball(0,-.1,.38,.52);for(const side of [-1,1]){ball(side*.21,.25,.24,.24,pale);ball(side*.21,.25,.09,.10,dark);path([[side*.12,.4],[side*.34,.72],[side*.36,.29]],.04);}path([[-.09,.05],[0,-.12],[.09,.05]],.04);break;
 case 'apollo':arc(.38);ball(0,0,.33,.33);for(let i=0;i<12;i++){const t=i/12*Math.PI*2;path([[Math.sin(t)*.52,Math.cos(t)*.52],[Math.sin(t)*.85,Math.cos(t)*.85]],.045);}break;
 case 'artemis':arc(.73,-.35,Math.PI*1.30);path([[-.64,-.66],[-.45,0],[-.64,.66]],.04);path([[-.64,-.66],[-.64,.66]],.018);path([[-.92,-.45],[.8,.6]],.03);ball(.43,.4,.10,.10,pale);break;
 case 'hephaestus':path([[-.68,-.65],[.6,.65]],.1);const hammer=b(.5,.62,.85,.38);hammer.rotation.z=.7;path([[.75,-.65],[-.55,.65]],.075);b(0,-.3,1.0,.24);b(0,-.65,.55,.20);break;
 case 'aphrodite':for(let i=0;i<11;i++){const angle=(i-5)*.19;path([[0,-.5],[Math.sin(angle)*.65,.25],[Math.sin(angle)*1.05,Math.cos(angle)*.80]],.045);}ball(0,-.43,.56,.16,pale);for(const side of [-1,1]){ball(side*.82,-.55,.20,.12,pale);path([[side*.78,-.48],[side*1.05,-.20],[side*.64,-.37]],.045);}break;
 case 'hermes':wings();b(0,0,.08,1.6);for(const side of [-1,1])path([[side*.23,-.7],[-side*.18,-.3],[side*.18,.15],[-side*.22,.55]],.04);ball(0,.78,.13,.13);break;
 case 'dionysus':wreath();for(let row=0;row<4;row++)for(let j=0;j<4-row;j++)ball((j-(3-row)/2)*.22,.36-row*.23,.14,.15,a.mat('#79536e'));path([[0,.55],[.12,.82],[.5,.7]],.045);break;
 }
}

/** Central assembly hall: four real open doorways and a clear crossing inside. */
export function buildGreatHall(scene:T.Scene,collision:T.Group){
 const a=architecture(scene,collision,'Great Hall',0,0),{box,cylinder,mesh,mat}=a;
 const stone=mat('#c6beac'),ivory=mat('#ece4ce'),bronze=mat('#b69b63',true),roof=mat('#52716c'),dark=mat('#344b49');
 a.root.userData={greatHall:true,doors:['north','east','south','west']};
 box(0,.08,0,17.0,.16,17.0,stone);box(0,.30,0,16.5,.28,16.5,ivory,true);
 for(let i=0;i<4;i++)a.ramp(3.4,11.0,8.0,.44,i*Math.PI/2);
 for(const x of [-7.35,7.35])for(const z of [-7.35,-3.6,3.6,7.35])a.column(x,z,7.5,ivory,stone,'ionic');
 for(const z of [-7.35,7.35])for(const x of [-3.6,3.6])a.column(x,z,7.5,ivory,stone,'ionic');
 // Wall sections rotate together; each cardinal axis has a 3.4m opening.
 for(let side=0;side<4;side++){
  const face=new T.Group();a.root.add(face);face.rotation.y=side*Math.PI/2;
  const parts:T.Mesh[]=[];
  for(const sign of [-1,1])parts.push(box(sign*4.0,3.65,5.65,4.6,6.4,.42,stone));
  parts.push(box(0,6.15,5.65,3.45,1.4,.45,stone));
  for(const o of parts){a.root.remove(o);face.add(o);}
  // Explicit rotated collision proxies share the visual wall positions.
  face.updateWorldMatrix(true,true);for(const o of parts){const c=new T.Mesh(o.geometry);c.matrixAutoUpdate=false;c.matrix.copy(o.matrixWorld);collision.add(c);}
  const outer=new T.Group();a.root.add(outer);outer.rotation.y=side*Math.PI/2;
  const decorate=(o:T.Mesh)=>{a.root.remove(o);outer.add(o);return o;};
  for(const sign of [-1,1])decorate(box(sign*1.86,3.0,5.97,.28,5.05,.4,ivory));
  decorate(box(0,5.55,5.97,4.2,.27,.6,bronze));
  decorate(box(0,7.82,7.35,15.8,.5,.9,stone));decorate(box(0,8.16,7.35,16.1,.18,1.05,bronze));
  for(let j=-7;j<=7;j++)decorate(box(j,8.33,7.48,.24,.24,.24,ivory));
  const plaque=a.label(side===0?'THE GREAT HALL':['','EAST PORTICO','NORTH PORTICO','WEST PORTICO'][side],0,6.42,5.92,4.7,'#b69b63');decorate(plaque);
  // Triangular ceremonial entrance canopy on each face.
  const shape=new T.Shape();shape.moveTo(-3.0,0);shape.lineTo(3,0);shape.lineTo(0,1.1);shape.closePath();decorate(mesh(new T.ExtrudeGeometry(shape,{depth:.35,bevelEnabled:false}),ivory,0,6.9,6.0));
 }
 // Broad hipped roof with an octagonal lantern and a bronze crown.
 const roofGeo=new T.ConeGeometry(12.1,3.15,4,1,false);roofGeo.rotateY(Math.PI/4);mesh(roofGeo,roof,0,9.85,0);
 for(let side=0;side<4;side++){const angle=side*Math.PI/2;for(let i=-6;i<=6;i++){
  const p1=new T.Vector3(i,8.3,8.3),p2=new T.Vector3(i*.16,11.12,1.3);p1.applyAxisAngle(new T.Vector3(0,1,0),angle);p2.applyAxisAngle(new T.Vector3(0,1,0),angle);a.line([p1.toArray(),p2.toArray()],.045,bronze);
 }}
 cylinder(0,11.35,0,1.65,.9,stone);cylinder(0,11.83,0,1.85,.14,bronze);const cap=mesh(new T.ConeGeometry(2.05,1.1,8),bronze,0,12.43,0);cap.rotation.y=Math.PI/8;
 for(let i=0;i<8;i++){const angle=i/8*Math.PI*2;box(Math.sin(angle)*1.6,11.37,Math.cos(angle)*1.6,.12,.75,.12,bronze);}
 a.sphere(0,13.10,0,.25,.35,.25,bronze);
 // A restrained mosaic border; the four-way circulation remains unobstructed.
 for(const sign of [-1,1]){box(sign*4.8,.447,0,.12,.008,9.6,bronze);box(0,.447,sign*4.8,9.6,.008,.12,bronze);}
 box(0,7.2,0,11.2,.15,11.2,dark);
 for(let x=-4;x<=4;x+=2)for(let z=-4;z<=4;z+=2){box(x,7.05,z,1.75,.08,1.75,ivory);box(x,7.0,z,1.45,.04,1.45,dark);}
 return a.finish();
}
