import * as T from 'three';
import {architecture} from './temple-exteriors';
import {groundHeight as h} from './data';
import {gardenCourts} from './camp-layout';
import type {PlantPlacement} from './vegetation';
/** Low planting frames the hall; tall trees stay to the sides of its approach. */
export function buildCampGardens(scene:T.Scene,collision:T.Group){
 const a=architecture(scene,collision,'Sanctuary garden courts',0,0),plants:PlantPlacement[]=[];
 const limestone=a.mat('#c5b99c'),bronze=a.mat('#92704a',true),wood=a.mat('#70543d'),soil=a.mat('#675b49');
 const base=h(0,0),y=(x:number,z:number)=>h(x,z)-base;
 for(const [index,g] of gardenCourts.entries()){
  const geo=new T.CircleGeometry(1,64);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=g.x+p.getX(i)*g.rx,z=g.z+p.getZ(i)*g.rz;p.setXYZ(i,x,y(x,z)+.035,z);}geo.computeVertexNormals();a.mesh(geo,soil);
  for(let i=0;i<64;i++){const t=i/64*Math.PI*2,x=g.x+Math.cos(t)*g.rx,z=g.z+Math.sin(t)*g.rz;const edge=a.box(x,y(x,z)+.12,z,.5,.24,.3,limestone);edge.rotation.y=-Math.atan2(g.rz*Math.cos(t),-g.rx*Math.sin(t));}
  for(let i=0;i<72;i++){const t=i*2.399,r=Math.sqrt((i+.5)/72)*.9,x=g.x+Math.cos(t)*g.rx*r,z=g.z+Math.sin(t)*g.rz*r;
   plants.push({id:i%5===0?'camp_myrtle':i%3===0?'camp_grass':'camp_flowers',x,y:h(x,z),z,scale:i%5===0?.35:.7,rotation:t});}
  if(index<2){const x=g.x,z=g.z;
   a.cylinder(x,y(x,z)+.22,z,1.8,.44,limestone);a.cylinder(x,y(x,z)+.46,z,1.55,.06,a.mat('#497f7a',true));
   a.cylinder(x,y(x,z)+1,z,.25,1.4,limestone);a.cylinder(x,y(x,z)+1.65,z,.85,.15,limestone);a.sphere(x,y(x,z)+1.92,z,.2,.3,.2,bronze);
   for(const s of [-1,1]){const bx=g.x+s*7.5,bz=47;
    a.box(bx,y(bx,bz)+.55,bz,.8,.18,3.5,wood,true);for(const dz of [-1.25,1.25])a.box(bx,y(bx,bz)+.25,bz+dz,.6,.5,.22,limestone);
   }
  }
 }
 // Paired arbor walks shelter the edges without obstructing the central vista.
 for(const side of [-1,1])for(let bay=0;bay<3;bay++){
  const x=side*24,z=60+bay*4.5;
  for(const dx of [-1.7,1.7]){a.box(x+dx,y(x+dx,z)+1.8,z,.25,3.6,.25,limestone,true);a.box(x+dx,y(x+dx,z)+3.55,z,.45,.22,.45,limestone);}
  a.box(x,y(x,z)+3.7,z,4.4,.22,.28,wood);
  for(const dx of [-1.3,0,1.3])a.box(x+dx,y(x,z)+3.85,z, .16,.16,4.7,wood);
  plants.push({id:bay%2?'camp_blossom':'camp_olive',x:x+side*4.5,y:h(x+side*4.5,z),z,scale:.7,rotation:bay*2});
 }
 a.finish();return plants;
}


