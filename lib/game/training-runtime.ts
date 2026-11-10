import * as T from 'three';
import type {Octree} from 'three/addons/math/Octree.js';
import {TrainingSession,practiceTargets,type PracticeEvent} from './training-combat';
import {practiceSword,practiceBow,practiceArrow} from './practice-weapons';

export class TrainingRuntime {
 session:TrainingSession;private root=new T.Group();private sword=practiceSword();private bow=practiceBow();private direction=new T.Vector3();private ray=new T.Ray();private swing=0;private heavy=false;
 private flying=new Map<number,T.Group>();private lodged:{mesh:T.Group;age:number}[]=[];private pulses:{mesh:T.Mesh;age:number}[]=[];private staff:{root:T.Group;mesh:T.Mesh;ring:T.Mesh;id:string}[]=[];
 private scene:T.Scene;private camera:T.PerspectiveCamera;private sound:(freq:number,duration:number,volume:number)=>void;
 constructor(scene:T.Scene,camera:T.PerspectiveCamera,octree:Octree,sound:(freq:number,duration:number,volume:number)=>void){
  this.scene=scene;this.camera=camera;this.sound=sound;
  this.session=new TrainingSession((origin,direction,distance)=>{this.ray.set(origin,direction);const hit=octree.rayIntersect(this.ray);return hit&&hit.distance<=distance?hit.distance:Infinity;});
  this.root.name='First-person practice equipment';this.sword.position.set(.37,-.46,-.86);this.bow.root.position.set(.34,-.20,-.85);this.root.add(this.sword,this.bow.root);camera.add(this.root);scene.add(camera);
  for(const [parent,x,y,z] of [[this.sword,0,-.14,0],[this.bow.root,0,0,-.09]] as const){const glove=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshStandardMaterial({color:'#594735',roughness:.9}));glove.scale.set(.062,.085,.065);glove.position.set(x,y,z);parent.add(glove);}
  this.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.renderOrder=1000;for(const m of Array.isArray(o.material)?o.material:[o.material])m.depthTest=false;}});this.root.visible=false;
  for(const target of practiceTargets.filter(t=>t.kind==='dummy')){
   const root=new T.Group();root.position.copy(target.position);scene.add(root);const staff=new T.Mesh(new T.CylinderGeometry(.055,.055,1.9,10),new T.MeshStandardMaterial({color:'#806448',roughness:.8}));staff.rotation.z=Math.PI/2;staff.position.set(.85,.25,.12);root.add(staff);
   const ring=new T.Mesh(new T.TorusGeometry(.71,.025,6,48),new T.MeshBasicMaterial({color:'#f0c56e',transparent:true,opacity:.8,depthWrite:false}));ring.position.z=.5;root.add(ring);ring.visible=false;this.staff.push({root,mesh:staff,ring,id:target.id});
  }
 }
 pose(){this.camera.getWorldDirection(this.direction);return {position:this.camera.position,direction:this.direction};}
 tick(dt:number){this.session.tick(dt,this.pose());for(const e of this.session.events)this.event(e);this.session.events.length=0;}
 pause(){this.session.cancelActions();}
 private event(e:PracticeEvent){
  if(e.type==='swing'){this.swing=e.points===2?.88:.43;this.heavy=e.points===2;this.sound(170,.12,.13);}
  if(e.type==='shot'){const arrow=practiceArrow();this.flying.set(e.id!,arrow);this.scene.add(arrow);this.sound(330,.09,.13);}
  if(e.type==='land'){const arrow=this.flying.get(e.id!);if(arrow){const direction=e.direction!.normalize();arrow.position.copy(e.position!).addScaledVector(direction,-.55);arrow.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),direction);this.flying.delete(e.id!);this.lodged.push({mesh:arrow,age:0});if(this.lodged.length>24)this.removeArrow(this.lodged.shift()!.mesh);}}
  if(e.type==='hit'||e.type==='block'){
   this.sound(e.type==='block'?e.perfect?780:520:e.points===100?880:390,.16,.20);
   if(e.position){const mesh=new T.Mesh(new T.TorusGeometry(.19,.018,5,24),new T.MeshBasicMaterial({color:e.type==='block'?'#81d9d1':e.points===100?'#ffd67e':'#cbeab4',transparent:true,depthWrite:false}));mesh.position.copy(e.position);mesh.lookAt(this.camera.position);this.scene.add(mesh);this.pulses.push({mesh,age:0});}
  }
  if(e.type==='complete')this.sound(990,.4,.18);if(e.type==='tag')this.sound(100,.18,.12);
 }
 private removeArrow(mesh:T.Group){mesh.removeFromParent();mesh.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
 update(dt:number){
  const hud=this.session.hud();this.root.visible=!!hud;this.sword.visible=hud?.weapon==='sword';this.bow.root.visible=hud?.weapon==='bow';this.bow.draw(hud?.charge??0);
  this.swing=Math.max(0,this.swing-dt);const duration=this.heavy?.88:.43,p=1-this.swing/duration,arc=this.swing>0?Math.sin(p*Math.PI):0;
  this.sword.rotation.set(arc*(this.heavy?-1.2:-.25),arc*-.8,(hud?.guard?-.95:-.34)+arc*-1.6);this.sword.position.set(.37-arc*.35,hud?.guard?-.23:-.46,-.86-arc*.18);
  const ids=new Set(this.session.arrows.map(a=>a.id));for(const [id,mesh] of this.flying)if(!ids.has(id)){this.removeArrow(mesh);this.flying.delete(id);}
  for(const arrow of this.session.arrows){const mesh=this.flying.get(arrow.id);if(mesh){const direction=arrow.velocity.clone().normalize();mesh.position.copy(arrow.position).addScaledVector(direction,-.7);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),direction);}}
  for(let i=this.lodged.length-1;i>=0;i--)if((this.lodged[i].age+=dt)>18){this.removeArrow(this.lodged[i].mesh);this.lodged.splice(i,1);}
  for(let i=this.pulses.length-1;i>=0;i--){const pulse=this.pulses[i];pulse.age+=dt;pulse.mesh.scale.setScalar(1+pulse.age*2);(pulse.mesh.material as T.MeshBasicMaterial).opacity=Math.max(0,1-pulse.age*2);if(pulse.age>.5){pulse.mesh.removeFromParent();pulse.mesh.geometry.dispose();(pulse.mesh.material as T.Material).dispose();this.pulses.splice(i,1);}}
  for(const staff of this.staff){const d=this.session.dummies.find(d=>d.id===staff.id)!;staff.ring.visible=this.session.inside&&d.windup>0;staff.ring.scale.setScalar(.7+(1-d.windup/1.05)*.5);(staff.ring.material as T.MeshBasicMaterial).color.set(d.windup<.35?'#f3a16f':'#e1c777');staff.mesh.rotation.y=d.windup>0?-.8*(1-d.windup/1.05):0;staff.mesh.rotation.z=d.reset>0?.3:Math.PI/2;}
 }
 dispose(){this.pause();for(const mesh of this.flying.values())this.removeArrow(mesh);this.flying.clear();for(const a of this.lodged)this.removeArrow(a.mesh);this.lodged=[];this.root.removeFromParent();this.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
}
