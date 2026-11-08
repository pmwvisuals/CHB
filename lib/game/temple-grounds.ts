import * as T from 'three';
import type {Architecture} from './temple-exteriors';
import type {TempleTheme} from './temple-catalog';

export function addTempleGrounds(a:Architecture,t:TempleTheme,time:{value:number}){
 const {box,cylinder,sphere,line,mesh,mat}=a,stone=mat(t.stone),ivory=mat(t.ivory),bronze=mat(t.metal,true),dark=mat(t.accent),green=mat('#617951'),timber=mat('#765239');
 a.root.userData.grounds=t.id;
 const basin=(x:number,z:number,w=2.2,d=8)=>{
  box(x,.12,z,w+.35,.3,d+.35,stone);for(const side of [-1,1])box(x+side*w/2,.35,z,.17,.35,d,ivory,true);for(const side of [-1,1])box(x,.35,z+side*d/2,w,.35,.17,ivory,true);
  const water=new T.MeshPhysicalMaterial({color:'#429ba7',roughness:.13,metalness:.25,transparent:true,opacity:.83,clearcoat:1});
  water.onBeforeCompile=s=>{s.uniforms.courtTime=time;s.vertexShader='uniform float courtTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(position.x*7.+courtTime)*cos(position.y*5.+courtTime*.7)*.012;');};water.customProgramCacheKey=()=> 'temple-water-v1';
  const plane=mesh(new T.PlaneGeometry(w-.2,d-.2,6,18),water,x,.33,z);plane.rotation.x=-Math.PI/2;plane.castShadow=false;plane.name=t.id+' reflecting water';return water;
 };
 const fountain=(x:number,z:number,scale=1)=>{cylinder(x,.28,z,1.25*scale,.32,stone,1.15*scale,true);cylinder(x,.51,z,1.03*scale,.12,bronze);basin(x,z,1.55*scale,1.55*scale);cylinder(x,1.05,z,.2*scale,1.3,ivory);for(const y of [1.4,2.05]){const bowl=mesh(new T.SphereGeometry(.65*scale,18,10,0,Math.PI*2,0,Math.PI/2),bronze,x,y,z);bowl.rotation.x=Math.PI;}for(const side of [-1,1])line([[x,2.1,z],[x+side*.4*scale,1.9,z],[x+side*.75*scale,.5,z]],.035,mat('#78c7ca',true));};
 const planter=(x:number,z:number,w:number,d:number,flowers=false)=>{box(x,.22,z,w,.44,d,stone,true);box(x,.46,z,w-.18,.04,d-.18,mat('#665342'));for(let i=0;i<14;i++){const px=x+(Math.sin(i*92.7)*.5)*(w-.4),pz=z+(Math.cos(i*53.1)*.5)*(d-.4);sphere(px,.64,pz,.2,.22,.16,green);if(flowers)sphere(px,.88,pz,.11,.08,.11,mat('#d8a8b8'));}};
 const pergola=(x:number,z:number,w=2.6,d=6,flowers=false)=>{for(const sx of [-1,1])for(const sz of [-1,1]){box(x+sx*w/2,1.65,z+sz*d/2,.17,3.3,.17,ivory,true);box(x+sx*w/2,3.4,z+sz*d/2,.38,.22,.38,bronze);}for(const sx of [-1,1])box(x+sx*w/2,3.38,z,.24,.2,d+.5,timber);for(let i=0;i<9;i++)box(x,3.58,z-d/2+i*d/8,w+.6,.14,.15,timber);for(let i=0;i<28;i++){const px=x+Math.sin(i*72.1)*w*.48,pz=z+Math.cos(i*38.6)*d*.48;sphere(px,3.67,pz,.3,.09,.23,green);if(flowers&&i%2===0)sphere(px,3.8,pz,.12,.08,.12,mat('#ce91ad'));}};
 const fence=(military=false)=>{
  const points=[[-2,13],[-6,13],[-9,5],[-9,-8],[9,-8],[9,5],[6,13],[2,13]];
  for(let i=0;i<points.length-1;i++){const [x,z]=points[i],[xx,zz]=points[i+1],length=Math.hypot(xx-x,zz-z),yaw=Math.atan2(xx-x,zz-z);for(const y of [.48,1.15]){const rail=box((x+xx)/2,y,(z+zz)/2,military?.14:.08,.1,length,bronze);rail.rotation.y=yaw;}
   for(let j=0;j<=Math.ceil(length/.85);j++){const u=j/Math.ceil(length/.85),px=x+(xx-x)*u,pz=z+(zz-z)*u;cylinder(px,.85,pz,.045,1.7,bronze);mesh(new T.ConeGeometry(military?.12:.07,.25,4),bronze,px,1.84,pz);}
   const proxy=box((x+xx)/2,.8,(z+zz)/2,.18,1.6,length,bronze);proxy.rotation.y=yaw;a.solid(proxy);proxy.removeFromParent();
  }
 };
 const disc=(x:number,y:number,z:number,r:number,m:T.Material)=>{const o=mesh(new T.CylinderGeometry(r,r,.10,24),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
 switch(t.id){
 case 'ares':
  fence(true);for(const side of [-1,1]){box(side*2.45,1.55,13,.72,3.1,.72,stone,true);mesh(new T.ConeGeometry(.44,.7,4),bronze,side*2.45,3.45,13);for(let k=0;k<4;k++){const z=-4+k*3;disc(side*9.12,1.1,z,.48,dark).rotation.y=Math.PI/2;const boss=sphere(side*9.2,1.1,z,.12,.18,.18,bronze);boss.rotation.y=Math.PI/2;}for(let j=0;j<3;j++){const x=side*(3.2+j*.7);cylinder(x,1.65,11.4,.04,3.3,bronze);mesh(new T.ConeGeometry(.14,.42,4),bronze,x,3.45,11.4);}}break;
 case 'poseidon':
  for(const side of [-1,1]){basin(side*7.8,-.4,2.1,13);fountain(side*7.8,-5.0,.75);for(let k=0;k<4;k++)line([[side*7, .5,-5+k*3],[side*7.4,.7,-4.5+k*3],[side*8.1,.5,-4+k*3]],.06,bronze);}box(0,.025,11.5,3.5,.05,3,ivory);break;
 case 'zeus':
  for(const side of [-1,1]){const x=side*7.9;box(x,.25,1.6,2,.5,2,stone,true);cylinder(x,2.8,1.6,.65,5,ivory,.37,true);sphere(x,5.5,1.6,.3,.48,.3,bronze);for(let wing=-1;wing<=1;wing+=2)for(let k=0;k<5;k++){const o=sphere(x+wing*(.35+k*.16),5.7+k*.06,1.6,.28,.07,.12,bronze);o.rotation.z=wing*.25;}line([[x-.2,4.7,2.3],[x+.2,4.1,2.3],[x-.2,4.1,2.3],[x+.2,3.4,2.3]],.07,bronze);}break;
 case 'hera':
  fence();for(const side of [-1,1]){pergola(side*7.7,-.5,2.3,7,true);fountain(side*5.4,10.8,.6);for(let i=0;i<7;i++){const angle=(i-3)*.28;const o=sphere(side*7.7+Math.sin(angle)*.8,2.0+Math.cos(angle)*.5,4,.13,.42,.08,bronze);o.rotation.z=-angle;sphere(side*7.7+Math.sin(angle)*.8,2.2+Math.cos(angle)*.5,4,.06,.1,.09,dark);}}break;
 case 'demeter':
  for(const side of [-1,1]){box(side*7.8,.2,-.5,2.6,.4,12,stone,true);box(side*7.8,.43,-.5,2.35,.06,11.6,mat('#755638'));for(let i=0;i<52;i++){const x=side*7.8+Math.sin(i*91.3)*.85,z=-5.9+i*.21,h=.7+(i%4)*.12;cylinder(x,.5+h*.5,z,.018,h,mat('#a9a35c'));for(let j=0;j<3;j++){const o=mesh(new T.SphereGeometry(1,8,5),mat('#c8ad61'),x,.5+h+j*.08,z);o.scale.set(.055,.12,.04);o.rotation.z=j%2?.3:-.3;}}pergola(side*5.4,11.4,1.6,2.0);}break;
 case 'athena':
  for(const side of [-1,1]){planter(side*7.8,-3,2.5,3);box(side*7.8,.5,3,2.5,.5,1.0,ivory,true);box(side*7.8,1.0,3.5,2.5,.7,.16,stone,true);cylinder(side*5.5,1.4,11.3,.4,2.8,stone,.34,true);sphere(side*5.5,3.0,11.3,.3,.48,.23,bronze);for(const eye of [-1,1]){sphere(side*5.5+eye*.14,3.23,11.5,.12,.12,.05,ivory);sphere(side*5.5+eye*.14,3.23,11.55,.045,.05,.03,dark);}}break;
 case 'apollo':
  for(const side of [-1,1]){const x=side*7.7;for(const foot of [-1,1])cylinder(x+foot*.7,1.9,0,.12,3.8,bronze,.16);line([[x-.7,3.7,0],[x,3.4,0],[x+.7,3.7,0]],.13,bronze);box(x,.6,0,1.7,.4,.8,ivory,true);for(let i=-3;i<=3;i++)line([[x+i*.16,.8,.05],[x+i*.16,3.5,.05]],.012,bronze);cylinder(x,.3,7.7,1.1,.5,stone);mesh(new T.ConeGeometry(.25,.9,3),bronze,x,.9,7.7);}
  for(let i=0;i<12;i++){const angle=i/12*Math.PI*2,ray=box(Math.sin(angle)*1.1,.025,11.5+Math.cos(angle)*1.1,.07,.035,.4,bronze);ray.rotation.y=angle;}break;
 case 'artemis':
  for(const side of [-1,1]){const x=side*7.8;box(x,.2,2,2.8,.4,2.8,stone,true);sphere(x,1.0,2,.40,.52,.85,bronze);sphere(x,1.6,1.35,.22,.42,.22,bronze);for(const dx of [-.25,.25])for(const dz of [-.5,.5])cylinder(x+dx,.55,2+dz,.045,.9,bronze);for(const antler of [-1,1]){line([[x,1.9,1.35],[x+antler*.3,2.45,1.35],[x+antler*.6,2.65,1.35]],.035,bronze);line([[x+antler*.3,2.45,1.35],[x+antler*.25,2.75,1.35]],.025,bronze);}planter(x,-3.8,2.5,3);}
  {const moon=mesh(new T.TorusGeometry(.7,.09,7,30,Math.PI*1.6),bronze,0,4.6,13);moon.rotation.z=.6;for(const side of [-1,1])cylinder(side*2.2,2.0,13,.10,4,ivory);line([[-2.2,4,13],[0,4.5,13],[2.2,4,13]],.09,ivory);}break;
 case 'hephaestus':
  {const ember=new T.MeshStandardMaterial({color:'#a64b23',emissive:'#ea692a',emissiveIntensity:1.3,roughness:.7});for(const side of [-1,1]){line([[side*7.2,.04,-6],[side*7.5,.04,-3],[side*7.0,.04,0],[side*7.4,.04,3]],.06,ember);cylinder(side*6.2,.45,9,.75,.8,stone,.65,true);const flame=mesh(new T.ConeGeometry(.32,1.0,7),ember,side*6.2,1.2,9);flame.rotation.z=side*.15;}}
  for(const side of [-1,1]){box(side*8,.55,-1,1.6,1.1,13,stone,true);for(let i=0;i<5;i++)box(side*8,1.4,-6+i*2.7,1.9,.6,1.4,stone,true);line([[side*6.9,1,-5],[side*6.9,3.6,-5],[side*5.8,3.6,-5]],.13,bronze);for(let i=0;i<3;i++){const gear=mesh(new T.TorusGeometry(.42,.14,6,12),bronze,side*7.0,1.1+i*.7,5);gear.rotation.z=i*.5;for(let k=0;k<8;k++){const angle=k/8*Math.PI*2,tooth=box(side*7+Math.sin(angle)*.51,1.1+i*.7+Math.cos(angle)*.51,5,.14,.19,.28,bronze);tooth.rotation.z=-angle;}}box(side*5.4,.6,11,1.6,1.2,1.4,stone,true);box(side*5.4,1.35,11,1.8,.3,.8,bronze);}
  break;
 case 'aphrodite':
  for(const side of [-1,1]){pergola(side*7.7,-.5,2.4,8,true);planter(side*5.5,11,2,3,true);fountain(side*7.7,6.5,.8);}break;
 case 'hermes':
  for(const side of [-1,1]){cylinder(side*6,1.6,11,.25,3.2,ivory,.25,true);for(let i=0;i<3;i++){const sign=box(side*6,2.0+i*.45,11,1.4,.25,.12,timber);sign.rotation.y=i*.6;}}
  {const o=mesh(new T.CircleGeometry(1.55,32),ivory,0,.025,11.4);o.rotation.x=-Math.PI/2;for(let i=0;i<8;i++){const angle=i/8*Math.PI*2;const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(-.18,.4);shape.lineTo(0,1.4);shape.lineTo(.18,.4);shape.closePath();const ray=mesh(new T.ShapeGeometry(shape),i%2?dark:bronze,0,.04,11.4);ray.rotation.set(-Math.PI/2,0,angle);}}break;
 case 'dionysus':
  for(const side of [-1,1]){pergola(side*7.7,0,2.6,10);for(let j=0;j<9;j++){const x=side*7.7+Math.sin(j*21)*.9,z=-4+j;for(let k=0;k<4;k++)sphere(x+k*.06,3.35-k*.13,z,.10,.11,.09,mat('#775079'));}for(let k=0;k<3;k++){const x=side*(4.8+k*.5);sphere(x,.7,11,.27,.5,.27,mat('#a97955'));cylinder(x,1.2,11,.14,.35,bronze);}}
  for(let k=0;k<3;k++)for(const side of [-1,1])box(side*5.4,.22+k*.15,13+k*.65,3.2,.3, .7,stone,true);break;
 }
}
