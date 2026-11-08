import * as T from 'three';
import {architecture} from './temple-exteriors';

/** Travelers' guild house, with a generous entrance and sheltered open loggias. */
export function buildWayfarerHall(scene:T.Scene,collision:T.Group){
 const a=architecture(scene,collision,'Wayfarer Hall',-55,50),{mat,box,cylinder,mesh,sphere,line}=a;
 const stone=mat('#b8b2a0'),cream=mat('#e9ddc1'),blue=mat('#668c96'),bronze=mat('#bb9a5e',true),wood=mat('#745941'),roof=mat('#536d74');
 a.root.userData.wayfarer=true;
 box(0,.22,0,25,.44,19,stone,true);box(0,.45,0,24.4,.05,18.4,cream);a.ramp(4.6,12,8.8,.44);
 // Two substantial wings frame a central, open entrance rather than domestic cabin windows.
 for(const side of [-1,1]){
  box(side*8.8,3.6,-1,.42,6.4,12.8,stone,true);box(side*5.5,3.6,5.4,6.6,6.4,.4,blue,true);
  box(side*5.5,1.05,5.68,6.5,1.25,.15,stone);box(side*5.5,6.75,5.4,6.9,.25,.7,cream);
  for(const x of [side*3.7,side*6.9]){box(x,3.35,5.65,1.65,2.75,.17,cream);box(x,3.35,5.77,1.35,2.42,.08,mat('#375a61',true));for(const dx of [-.4,0,.4])box(x+dx,3.35,5.84,.045,2.45,.05,bronze);box(x,1.9,5.85,1.9,.16,.35,cream);}
  for(const z of [-5,0,7])a.column(side*10.8,z,5.9,cream,stone,'ionic');
  box(side*10.8,6.3,1.0,1.1,.45,14.5,cream);box(side*10.8,6.63,1,1.35,.18,15.1,bronze);
  for(const z of [-4.3,-1.8,.7,3.2]){box(side*10.8,1.0,z,2.5,.6,.65,wood,true);box(side*11.65,1.55,z,.14,1.2,1.5,blue);}
  // Broad side canopies, luggage plinths and lanterns create a recognizable travelers' port.
  const canopy=box(side*9.9,7.0,.7,5.6,.2,15.1,roof);canopy.rotation.z=-side*.18;
  box(side*3.1,1.1,8.0,1.0,1.4,1.0,stone,true);cylinder(side*3.1,2.0,8,.20,.45,bronze);sphere(side*3.1,2.35,8,.27,.38,.27,mat('#e9c790'));box(side*3.1,2.78,8,.6,.12,.6,bronze);
  for(let j=0;j<3;j++){box(side*(4.7+j*.72),.66,8,.58,.44,.65,wood);box(side*(4.7+j*.72),.9,8,.08,.06,.7,bronze);}
 }
 box(0,3.6,-7.2,18,6.4,.4,stone,true);box(0,6.15,5.4,4.5,1.3,.42,stone,true);
 for(const side of [-1,1]){box(side*2.25,3.0,5.73,.28,5.05,.38,cream,true);a.column(side*3.1,7.4,6.6,cream,stone,'ionic');}
 box(0,6.95,7.4,8.2,.45,1.1,cream);box(0,7.3,7.4,8.6,.2,1.3,bronze);a.label('WAYFARER HALL',0,6.95,8.01,6.2,'#435e65');
 const triangle=new T.Shape();triangle.moveTo(-4.4,0);triangle.lineTo(4.4,0);triangle.lineTo(0,1.65);triangle.closePath();mesh(new T.ExtrudeGeometry(triangle,{depth:.22,bevelEnabled:false}),cream,0,7.5,7.9);
 // The compass relief is shared visually with the travelers' crossroads, but the hall is secular.
 const ring=mesh(new T.TorusGeometry(.58,.055,7,30),bronze,0,8.1,8.2);for(let i=0;i<8;i++){const angle=i/8*Math.PI*2;line([[Math.sin(angle)*.18,8.1+Math.cos(angle)*.18,8.21],[Math.sin(angle)*.78,8.1+Math.cos(angle)*.78,8.21]],.04,bronze);}ring.name='Wayfarer compass';
 const rise=2.5,slope=Math.atan2(rise,9.3),len=Math.hypot(9.3,rise);
 for(const side of [-1,1]){const panel=box(side*4.65,8.2,-.4,len,.23,14.8,roof);panel.rotation.z=-side*slope;for(let row=0;row<8;row++)for(let k=0;k<20;k++){const x=side*(.6+row*1.12),tile=box(x,9.45-Math.abs(x)/9.3*rise+.14,-7.25+k*.72,1.14,.07,.7,roof);tile.rotation.z=-side*slope;}}
 cylinder(0,9.6,-.4,.15,15,bronze).rotation.x=Math.PI/2;
 // Beacon tower: a distinct landmark above the roofline, with a copper roof and open lantern.
 box(-6.3,8.0,-4.4,3.0,4.8,3.0,stone);for(const x of [-7.5,-5.1])for(const z of [-5.6,-3.2])cylinder(x,11.0,z,.12,1.5,bronze);
 box(-6.3,11.8,-4.4,3.1,.2,3.1,cream);const cap=mesh(new T.ConeGeometry(2.3,1.7,4),roof,-6.3,12.75,-4.4);cap.rotation.y=Math.PI/4;sphere(-6.3,11.0,-4.4,.42,.62,.42,mat('#efca83'));
 // Interior remains a simple welcoming room, with a clear entry corridor.
 box(-4,.9,-2,4,.3,1.7,wood,true);for(const x of [-5.5,-2.5])box(x,.6,-2,.16,1.2,1.5,wood);
 box(4,2,-6.7,5,3,.35,wood,true);for(let i=0;i<4;i++)box(4,.8+i*.7,-6.4,4.8,.08,.5,bronze);
 box(0,6.8,-1,17,.15,11,cream);
 return a.finish();
}
