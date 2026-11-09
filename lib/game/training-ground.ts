import * as T from 'three';
import {groundHeight} from './data';
import {landmarkKit} from './landmark-kit';

export function buildTrainingGround(scene:T.Scene,collision:T.Group){
 const k=landmarkKit(scene,collision),{box,mesh,group,cylinder,beam,stone,ivory,wood,darkWood,bronze,iron,cloth}=k;
 const flags:T.Mesh[]=[];
 k.groundPatch(-67,-34,22,21,'#b6a47c');
 const ring=group('Training · sand sparring court',-64,-31);
 k.ring(ring,8.9,.34,.095,stone,true);k.ring(ring,8.5,.065,.10,bronze,true);k.ring(ring,6.9,.05,.09,k.mat('#827c62'),true);
 // Four laurel-like bronze ticks and a central shield mosaic in the sand.
 for(let i=0;i<16;i++){const a=i*Math.PI/8,m=box(ring,Math.sin(a)*8.65,.08,Math.cos(a)*8.65,.10,.025,.34,bronze);m.rotation.y=a;}
 k.ring(ring,1.5,1.5,.10,k.mat('#827c62'),true);k.ring(ring,1.3,.065,.11,ivory,true);
 const shieldMark=box(ring,0,.13,0,.45,.015,1.7,bronze);shieldMark.rotation.y=.65;
 const spearMark=box(ring,0,.13,0,.12,.015,2.2,ivory);spearMark.rotation.y=-.65;
 // The north gate and western passage remain open to the shared camp routes.
 for(let i=0;i<36;i++){
  const a=i/36*Math.PI*2,x=-67+Math.sin(a)*21,z=-34+Math.cos(a)*20;
  if((z>-18&&Math.abs(x+67)<6)||(x<-84&&z>-38&&z<-25))continue;
  const g=group('Training · timber perimeter',x,z,a);cylinder(g,0,.48,0,.34,.96,stone,true);box(g,0,1.12,0,.19,1.35,.19,darkWood,true);
  for(const y of [.65,1.25])box(g,0,y,0,3.7,.11,.13,wood);mesh(new T.ConeGeometry(.18,.24,4),bronze,g,0,1.91,0);
 }
 for(const side of [-1,1]){
  const g=group('Training · bronze entrance pier',-67+side*7,-16);box(g,0,.25,0,1.15,.5,1.1,stone,true);box(g,0,1.85,0,.75,2.7,.75,ivory,true);box(g,0,3.25,0,1.05,.22,1.05,stone);k.lantern(g,0,3.65,0);
  const shield=mesh(new T.SphereGeometry(.48,20,12,0,Math.PI*2,0,Math.PI/2),bronze,g,0,1.8,.41);shield.rotation.x=Math.PI/2;shield.scale.y=.25;
  const flagGeo=new T.PlaneGeometry(1,2,6,12);flagGeo.translate(.5,-1,0);const flag=mesh(flagGeo,cloth,g,side*.65,3.2,0);flag.material=(flag.material as T.MeshStandardMaterial).clone();(flag.material as T.MeshStandardMaterial).side=T.DoubleSide;flag.material.transparent=true;flags.push(flag);
 }
 // Archery backstop, individual straw rings and embedded practice arrows.
 const back=group('Training · archery backstop',-66,-51);box(back,0,1.8,-.65,22,3.6,.35,darkWood,true);
 for(let i=0;i<24;i++)box(back,-10.6+i*.92,1.8,-.42,.12,3.5,.12,wood);
 for(let lane=0;lane<3;lane++){
  const x=-74+lane*8,g=group('Training · archery lane '+(lane+1),x,-48.8);
  for(const side of [-1,1])beam(g,new T.Vector3(side*.65,0,-.3),new T.Vector3(side*.25,2.2,0),.085,wood);
  cylinder(g,0,1.8,0,1.13,.25,k.mat('#baa66c')).rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const t=mesh(new T.CircleGeometry(1.04-i*.25,48),k.mat(['#d5c9a0','#794738','#c5b985','#364d48'][i]),g,0,1.8,.14+i*.008);}
  for(let i=0;i<3;i++){const x=(i-1)*.23,y=1.65+i*.14;beam(g,new T.Vector3(x,y,.18),new T.Vector3(x+.1,y+.06,.92),.016,wood);const feather=box(g,x+.1,y+.06,.86,.09,.025,.22,ivory);feather.rotation.z=.4;}
  for(const side of [-1,1]){const stripe=box(g,side*1.25,.06,4.3,.06,.025,5.5,k.mat('#867c60'));stripe.castShadow=false;}
  box(g,0,.07,7.2,2.8,.025,.11,ivory);
 }
 // A roofed equipment pavilion, with clear front access and solid posts.
 const armory=group('Training · open equipment pavilion',-82,-43);
 box(armory,0,.08,0,9.5,.16,10,stone);
 for(const x of [-4.2,4.2])for(const z of [-4.3,4.3]){box(armory,x,1.75,z,.32,3.5,.32,wood,true);box(armory,x,.25,z,.65,.5,.65,stone);}
 box(armory,0,3.5,0,9.8,.24,10.2,darkWood);
 for(const side of [-1,1]){const roof=box(armory,side*2.45,4.02,0,5.2,.18,10.6,k.mat('#6b6f59'));roof.rotation.z=-side*.20;}
 for(let i=0;i<12;i++)box(armory,0,4.64,-5.1+i*.92,.22,.16,.16,bronze);
 for(const x of [-3.7,3.7]){
  box(armory,x,1.1,0,.2,2.2,5.8,darkWood,true);
  for(let i=0;i<5;i++){
   const z=-2+i,shaft=beam(armory,new T.Vector3(x,.22,z),new T.Vector3(x-.15,2.7,z),.028,wood);
   const tip=mesh(new T.ConeGeometry(.10,.34,4),iron,armory,x-.15,2.88,z);tip.scale.z=.35;
  }
 }
 for(let i=0;i<3;i++){
  const shield=mesh(new T.CylinderGeometry(.58,.58,.13,32),i%2?bronze:k.mat('#66715c'),armory,-2+i*2,1.35,-4.1);shield.rotation.x=Math.PI/2;
  mesh(new T.SphereGeometry(.18,12,8),bronze,armory,-2+i*2,1.35,-3.99).scale.z=.5;
 }
 k.bench(armory,0,2.2,5.5);k.urn(armory,-2.7,.15,2.3,.85);k.urn(armory,2.8,.15,2.2,.65);
 // Leather-and-straw practice dummies occupy a separate lane east of the ring.
 for(let i=0;i<3;i++){
  const g=group('Training · practice dummy',-48.5,-23-i*8,-.3+i*.3);cylinder(g,0,.14,0,.65,.28,stone,true);box(g,0,1.28,0,.17,2.3,.17,wood,true);box(g,0,1.75,0,1.65,.14,.15,wood);
  const body=mesh(new T.CylinderGeometry(.43,.31,.95,10),k.mat('#9b8c59'),g,0,1.48,0,true);mesh(new T.SphereGeometry(.29,16,12),k.mat('#bea66b'),g,0,2.22,0);
  for(const y of [1.15,1.5,1.8])cylinder(g,0,y,0,.44,.045,darkWood);box(g,0,1.5,.43,.11,.48,.035,cloth);
  for(const side of [-1,1])mesh(new T.SphereGeometry(.14,10,8),k.mat('#a89667'),g,side*.83,1.75,0);
 }
 const rest=group('Training · spectators bench',-79,-21);k.bench(rest,0,0,5);k.urn(rest,-3.1,0,0,1);k.lantern(rest,3.2,1.1,0);
 scene.userData.trainingGround={archeryLanes:3,dummies:3,entrances:2,equipmentPavilion:true};
 return {update(time:number){for(let i=0;i<flags.length;i++){const p=flags[i].geometry.getAttribute('position');for(let j=0;j<p.count;j++){const x=p.getX(j);p.setZ(j,Math.sin(time*1.5+x*4+p.getY(j)*1.3+i)*.12*x);}p.needsUpdate=true;flags[i].geometry.computeVertexNormals();}}};
}
