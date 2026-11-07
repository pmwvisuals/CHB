import * as T from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildSacredTemple(){
 const scene=new T.Scene();scene.background=new T.Color('#b4c5cc');scene.fog=new T.Fog('#19363c',45,100);
 const collision=new T.Group(), stone=new T.MeshStandardMaterial({color:'#c9c5b0',roughness:.72}), ivory=new T.MeshStandardMaterial({color:'#ece2c9',roughness:.6}), blue=new T.MeshStandardMaterial({color:'#163d50',roughness:.5}), gold=new T.MeshStandardMaterial({color:'#b38a46',metalness:.72,roughness:.32}), bronze=new T.MeshStandardMaterial({color:'#84724a',metalness:.65,roughness:.43}), wood=new T.MeshStandardMaterial({color:'#463a32',roughness:.86});
 const cube=new T.BoxGeometry(1,1,1), animated:T.Object3D[]=[];
 function mesh(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,parent:T.Object3D=scene){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,solid=false){const o=mesh(cube,m,x,y,z);o.scale.set(w,h,d);if(solid){o.updateMatrix();const c=new T.Mesh(cube);c.matrixAutoUpdate=false;c.matrix.copy(o.matrix);collision.add(c);}return o;}
 function cyl(x:number,y:number,z:number,r:number,h:number,m:T.Material,top=r){return mesh(new T.CylinderGeometry(top,r,h,32),m,x,y,z);}
 function ring(x:number,y:number,z:number,r:number,t:number,m:T.Material){const o=mesh(new T.TorusGeometry(r,t,8,64),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
 function label(words:string,x:number,y:number,z:number,w:number){const c=document.createElement('canvas');c.width=1024;c.height=128;const p=c.getContext('2d')!;p.fillStyle='#183946';p.fillRect(0,0,1024,128);p.fillStyle='#dfc58d';p.font='36px Georgia';p.textAlign='center';p.fillText(words,512,78,980);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(new T.PlaneGeometry(w,w/8),new T.MeshStandardMaterial({map:t}),x,y,z);}
 // Continuous floor, twelve fluted columns, and a high coffered timber roof.
 box(0,-.25,0,19,.5,42,stone,true);
 for(let x=-8;x<=8;x+=2)for(let z=-19;z<=19;z+=2)box(x,.008,z,1.97,.012,1.97,(x+z)%4===0?ivory:stone);
 for(const x of [-3.7,3.7]){box(x,.025,-1,.09,.015,34,gold);box(x*2.3,.025,-1,.12,.015,35,blue);}
 for(let z=-16;z<17;z+=1){for(const x of [-4.1,4.1]){box(x,.025,z,.45,.015,.08,blue);box(x+.2,.025,z+.2,.08,.015,.45,blue);}}
 box(0,6,-19,19,12,.65,blue,true);
 for(const x of [-9.3,9.3]){box(x,6,0,.6,12,38,stone,true);box(x*.977,1.2,0,.2,2.4,38,blue);for(const y of [.2,2.4,9.6,11.4])box(x*.97,y,0,.25,.18,38,gold);}
 for(const x of [-6.15,6.15])for(const z of [-14,-8,-2,4,10,16]){
  box(x,.18,z,1.55,.36,1.55,ivory,true);cyl(x,.5,z,.7,.3,stone);
  cyl(x,4.7,z,.56,8.2,ivory,.46);box(x,4.7,z,.92,8.4,.92,ivory,true).visible=false;
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2;cyl(x+Math.cos(a)*.51,4.7,z+Math.sin(a)*.51,.026,7.8,stone,.023);}
  cyl(x,8.92,z,.73,.3,stone,.65);box(x,9.2,z,1.65,.3,1.65,ivory);box(x,9.45,z,1.8,.15,1.8,gold);
 }
 for(const x of [-6.15,6.15]){box(x,9.8,1,1.6,.6,34,ivory);box(x,10.2,1,1.7,.14,34,blue);}
 box(0,12,0,19,.5,39,wood);
 for(let z=-17;z<=17;z+=3.4){box(0,11.7,z,19,.55,.26,gold);for(let x=-7.5;x<=7.5;x+=3){box(x,11.8,z+1.7,2.7,.15,3.05,blue);const rosette=mesh(new T.TorusGeometry(.35,.065,6,16),gold,x,11.68,z+1.7);rosette.rotation.x=Math.PI/2;}}
 for(let x=-9;x<=9;x+=3)box(x,11.7,0,.24,.55,38,ivory);
 // Entrance opens onto a small sacred forecourt; its altar lies on the statue axis.
 for(const x of [-6.4,6.4])box(x,6,19,6,12,.65,stone,true);
 box(0,9.6,19,6.8,4.8,.65,stone,true);
 for(const x of [-3.3,3.3]){box(x,4,19, .35,8,.9,gold);const door=box(x*1.3,3.65,20,2.5,7.3,.18,bronze,true);door.rotation.y=x>0?-.8:.8;for(const y of [1,3.5,6])box(x*1.3,y,20.12,2.1,.08,.05,gold);}
 box(0,-.25,24,12,.5,10,ivory,true);
 for(const x of [-6,6])box(x,1,24,.35,2,10,stone,true);
 box(0,.6,26.5,3.6,1.2,2,stone,true);box(0,1.28,26.5,4,.2,2.4,ivory);box(0,1.39,26.5,3.2,.025,1.7,gold);
 label('RETURN TO ASTERION',0,5,19.4,4).rotation.y=Math.PI;
 // Raised cult statue, framed by sea-coloured panels and relief ornament.
 box(0,.65,-13.4,6.2,1.3,4.6,stone,true);box(0,1.4,-13.4,6.6,.2,5,ivory,true);box(0,.85,-10.98,5.7,.5,.04,blue);
 label('POSEIDON  ·  LORD OF THE SEA',0,.85,-10.94,5.2);
 for(const x of [-5,-2.5,0,2.5,5]){box(x,6,-18.6,2.3,9,.08,blue);for(let j=0;j<9;j++){const wave=mesh(new T.TorusGeometry(.32,.045,6,22,Math.PI*1.5),gold,x,2.1+j*.85,-18.48);wave.rotation.z=.2;}}
 const statue=new T.Group();statue.position.set(0,1.51,-13.4);statue.scale.setScalar(1.55);scene.add(statue);
 function ell(x:number,y:number,z:number,sx:number,sy:number,sz:number,m=bronze){const o=mesh(new T.SphereGeometry(1,24,16),m,x,y,z,statue);o.scale.set(sx,sy,sz);return o;}
 function limb(a:number[],b:number[],r1:number,r2:number,m=bronze){const v=new T.Vector3(...a as [number,number,number]),w=new T.Vector3(...b as [number,number,number]);const o=mesh(new T.CylinderGeometry(r2,r1,v.distanceTo(w),20),m,0,0,0,statue);o.position.copy(v.add(w).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b as [number,number,number]).sub(new T.Vector3(...a as [number,number,number])).normalize());return o;}
 // Sculpted torso profile, articulated limbs, facial planes and layered drapery.
 const profile=[[.43,1.75],[.54,2.05],[.43,2.45],[.54,2.85],[.75,3.25],[.76,3.48],[.48,3.65],[.22,3.78]].map(([x,y])=>new T.Vector2(x,y));
 const torso=mesh(new T.LatheGeometry(profile,48),bronze,0,0,0,statue);torso.scale.z=.67;
 for(const s of [-1,1]){ell(s*.32,3.22,.28,.34,.22,.13);ell(s*.17,2.75,.26,.15,.21,.07);limb([s*.3,1.85,0],[s*.36,.95,.08],.27,.21);limb([s*.36,.95,.08],[s*.4,.18,.12],.21,.13);ell(s*.4,.15,.26,.21,.16,.4);}
 ell(0,3.78,0,.21,.3,.2);ell(0,4.15,0,.35,.48,.31);ell(0,4.08,.29,.1,.19,.11);
 for(const s of [-1,1]){ell(s*.15,4.24,.25,.15,.055,.065);ell(s*.14,4.18,.286,.055,.027,.025,gold);ell(s*.32,4.12,0,.07,.14,.1);}
 for(let i=0;i<22;i++){const a=i/22*Math.PI*2;ell(Math.cos(a)*.32,4.4+Math.sin(i*2)*.045,Math.sin(a)*.25,.1,.13,.1);}
 for(let i=0;i<13;i++){const x=(i-6)*.045;ell(x,3.94-Math.sqrt(Math.max(0,1-(x/.34)**2))*.15,.28,.065,.18,.085);}
 limb([-.68,3.4,0],[-1,2.95,.15],.24,.19);limb([-1,2.95,.15],[-1.4,3.15,.48],.19,.12);ell(-1.48,3.15,.5,.19,.09,.19);
 limb([.68,3.4,0],[1,2.95,0],.24,.18);limb([1,2.95,0],[1.15,3.3,.16],.18,.11);ell(1.17,3.35,.16,.13,.18,.12);
 for(let i=0;i<5;i++)limb([-1.55+i*.065,3.15,.5],[-1.6+i*.07,3.12,.72],.035,.023);
 const clothPoints=[];for(let i=0;i<=20;i++){const y=.35+i*.09;clothPoints.push(new T.Vector2(.45+(y/2)*.1,y));}
 const cloth=new T.LatheGeometry(clothPoints,64);const pos=cloth.attributes.position;
 for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getX(i),pos.getZ(i)),r=1+Math.sin(a*14+pos.getY(i)*.7)*.065;pos.setX(i,pos.getX(i)*r);pos.setZ(i,pos.getZ(i)*r*.8);}cloth.computeVertexNormals();mesh(cloth,bronze,0,0,0,statue);
 limb([1.2,.05,.18],[1.2,5.05,.18],.055,.045,gold);limb([.7,4.65,.18],[1.7,4.65,.18],.05,.05,gold);
 for(const x of [.7,1.2,1.7]){limb([x,4.65,.18],[x,5.35,.18],.05,.035,gold);mesh(new T.ConeGeometry(.13,.34,4),gold,x,5.5,.18,statue);}
 // Offering table, oil lamps, votive ship models, vessels and garlands.
 box(0,.6,-7,2.8,1.2,1.1,blue,true);box(0,1.3,-7,3.4,.2,1.5,ivory);
 function vase(x:number,y:number,z:number,size:number,m:T.Material){const points=[[.22,0],[.29,.08],[.4,.42],[.29,.68],[.12,.8],[.12,.95],[.18,1]].map(([a,b])=>new T.Vector2(a*size,b*size));return mesh(new T.LatheGeometry(points,24),m,x,y,z);}
 vase(-.85,1.4,-7,.65,gold);vase(.85,1.4,-7,.5,bronze);cyl(0,1.45,-7,.32,.08,gold);
 const flameMat=new T.MeshBasicMaterial({color:'#ffd493'});
 for(const x of [-4,4])for(const z of [-10,5,15]){cyl(x,1.2,z,.14,2.4,bronze);cyl(x,.15,z,.5,.3,bronze);vase(x,2.2,z,.7,gold);const f=mesh(new T.SphereGeometry(.16,12,8),flameMat,x,2.9,z);f.scale.y=2.4;animated.push(f);const lamp=new T.PointLight('#ffb965',9,9,2);lamp.position.set(x,3,z);scene.add(lamp);}
 for(const s of [-1,1])for(let k=0;k<5;k++){const x=s*8,z=12-k*6;box(x,.6,z,1.2,1.2,1.8,blue,true);box(x,1.24,z,1.4,.12,2,ivory);if(k%2){vase(x,1.3,z,1.4,bronze);ring(x,2.1,z,.53,.06,gold);}else{const hull=mesh(new T.SphereGeometry(1,20,12),wood,x,1.48,z);hull.scale.set(.3,.23,.8);box(x,2,z,.05,1.2,.05,gold);const sail=mesh(new T.PlaneGeometry(.65,.65),ivory,x+.25,2.1,z);sail.rotation.y=Math.PI/2;}}
 label('OFFERINGS OF THE SEAFARERS',0,10,-18.55,8);
 // Subtle architectural illumination; only one shadow map is needed.
 scene.add(new T.HemisphereLight('#c6e3e9','#56402d',1.15));const sun=new T.DirectionalLight('#ffe4ba',3);sun.position.set(-3,10,26);sun.target.position.set(0,3,-12);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:20,bottom:-15,near:1,far:70});sun.shadow.normalBias=.04;
 const key=new T.SpotLight('#b6dfdf',160,45,.45,.7,1.2);key.position.set(-5,10,-5);key.target.position.set(0,5,-13);scene.add(key,key.target);
 const fill=new T.PointLight('#ffdc9b',70,20,1.5);fill.position.set(2,7,-11);scene.add(fill);
 const dustGeo=new T.BufferGeometry(),dust:number[]=[];for(let i=0;i<130;i++)dust.push(Math.sin(i*18.13)*8,1+(i%23)*.42,Math.cos(i*13.7)*17);dustGeo.setAttribute('position',new T.Float32BufferAttribute(dust,3));const particles=new T.Points(dustGeo,new T.PointsMaterial({color:'#f9e7ba',size:.025,transparent:true,opacity:.38}));scene.add(particles);
 // Batch static decoration; keep collision proxies independent of visual detail.
 scene.updateMatrixWorld(true);const batches=new Map<T.Material,T.Mesh[]>();scene.traverse(o=>{if(o instanceof T.Mesh&&o.visible&&!animated.includes(o)&&!Array.isArray(o.material)){const list=batches.get(o.material)||[];list.push(o);batches.set(o.material,list);}});
 for(const [m,list]of batches){if(list.length<3)continue;const gs=list.map(o=>{const g=o.geometry.clone().applyMatrix4(o.matrixWorld);return g.index?g.toNonIndexed():g;});const merged=mergeGeometries(gs);if(merged){const o=mesh(merged,m);list.forEach(o=>o.removeFromParent());}gs.forEach(g=>g.dispose());}
 const octree=new Octree().fromGraphNode(collision);
 return {scene,octree,sun,update(time:number){animated.forEach((f,i)=>{f.scale.y=2.2+Math.sin(time*5+i)*.3;});particles.rotation.y=Math.sin(time*.03)*.012;},dispose(){const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});collision.traverse(o=>{if(o instanceof T.Mesh)geos.add(o.geometry);});geos.forEach(g=>g.dispose());mats.forEach(m=>{(m as T.MeshStandardMaterial).map?.dispose();m.dispose();});sun.shadow.map?.dispose();}};
}
