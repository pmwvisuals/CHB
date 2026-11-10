import {Vector3} from 'three';
import {groundHeight} from './data';

export type PracticeWeapon='sword'|'bow';
export type DrillId='free'|'archery'|'combo'|'guard';
export const practiceDrills=[
 {id:'free',title:'Free practice',hint:'Explore the equipment. Targets and dummies reset automatically.'},
 {id:'archery',title:'Five-arrow accuracy',hint:'Land five arrows on the straw targets. Centre hits score highest.'},
 {id:'combo',title:'Blade rhythm',hint:'Land three light sword strikes in rhythm on a dummy.'},
 {id:'guard',title:'Read & respond',hint:'Strike a dummy, watch its wind-up, then face it and guard. Block three replies.'},
] as const;
export const insideTraining=(p:Vector3)=>p.x>-90&&p.x<-44&&p.z>-56&&p.z<-12;
export const practiceTargets=[...Array.from({length:3},(_,i)=>({id:'target-'+i,kind:'target' as const,position:new Vector3(-74+i*8,groundHeight(-74+i*8,-48.8)+1.8,-48.64),radius:1.08})),...Array.from({length:3},(_,i)=>({id:'dummy-'+i,kind:'dummy' as const,position:new Vector3(-48.5,groundHeight(-48.5,-23-i*8)+1.5,-23-i*8),radius:.58}))];
export interface PracticePose {position:Vector3;direction:Vector3}
export interface PracticeArrow {id:number;position:Vector3;velocity:Vector3;age:number;drill:boolean}
export interface PracticeEvent {type:'shot'|'swing'|'hit'|'block'|'tag'|'land'|'complete';position?:Vector3;direction?:Vector3;id?:number;target?:string;points?:number;perfect?:boolean}
export interface TrainingHUD {weapon:PracticeWeapon;stamina:number;charge:number;guard:boolean;title:string;hint:string;progress:string;score:number;combo:number;message:string;incoming:boolean;complete:boolean;best:number;sessionOnly:boolean}
type WallQuery=(origin:Vector3,direction:Vector3,distance:number)=>number;

/** Deterministic combat rules, independent of rendering, input devices and rewards. */
export class TrainingSession {
 inside=false;weapon:PracticeWeapon='sword';stamina=100;charge=0;guard=false;combo=0;score=0;drill:DrillId='free';complete=false;events:PracticeEvent[]=[];arrows:PracticeArrow[]=[];
 dummies=practiceTargets.filter(t=>t.kind==='dummy').map(t=>({id:t.id,hp:100,reset:0,windup:0}));
 private pose:PracticePose={position:new Vector3(),direction:new Vector3(0,0,-1)};
 private clock=0;private nextId=0;private cooldown=0;private attack:{remaining:number;heavy:boolean}|null=null;private drawing=false;private guardSince=0;private lastHit=-Infinity;private lastDummy='';private fired=0;private resolved=0;private blocks=0;private message='';private messageUntil=0;
 best:Record<string,number>={};sessionOnly=false;
 private wall:WallQuery;
 constructor(wall:WallQuery=()=>Infinity){this.wall=wall;try{const raw=JSON.parse(localStorage.getItem('asterion-training-v1')||'{}');for(const id of ['archery','combo','guard'])if(Number.isSafeInteger(raw[id])&&raw[id]>=0&&raw[id]<=100000)this.best[id]=raw[id];}catch{this.sessionOnly=true;}}
 private say(message:string){this.message=message;this.messageUntil=this.clock+4;}
 setWeapon(weapon:PracticeWeapon){this.cancelActions();this.weapon=weapon;this.combo=0;this.say(weapon==='bow'?'Hold left mouse to draw; release to shoot. Arrows are unlimited.':'Left mouse: light strike. F: heavy strike. Right mouse: guard.');}
 cancelActions(){this.drawing=false;this.charge=0;this.guard=false;this.attack=null;}
 nextDrill(){const index=practiceDrills.findIndex(d=>d.id===this.drill);this.startDrill(practiceDrills[(index+1)%practiceDrills.length].id);}
 startDrill(id:DrillId){this.cancelActions();this.cooldown=0;this.drill=id;this.complete=false;this.score=0;this.combo=0;this.fired=this.resolved=this.blocks=0;this.lastHit=-Infinity;this.arrows=[];this.dummies.forEach(d=>{d.hp=100;d.reset=d.windup=0;});this.stamina=100;if(id!=='free')this.weapon=id==='archery'?'bow':'sword';this.say(practiceDrills.find(d=>d.id===id)!.hint);}
 primaryDown(){if(!this.inside)return;if(this.weapon==='sword')this.swing(false);else if(this.cooldown<=0&&this.stamina>=8&&this.arrows.length<12&&!(this.drill==='archery'&&this.fired>=5)){this.drawing=true;this.charge=0;}}
 primaryUp(){if(!this.drawing)return;this.drawing=false;if(!this.inside||this.charge<.12){this.charge=0;return;}const strength=Math.min(1,this.charge/1.15),arrow={id:++this.nextId,position:this.pose.position.clone(),velocity:this.pose.direction.clone().normalize().multiplyScalar(28+strength*32),age:0,drill:this.drill==='archery'&&!this.complete};this.arrows.push(arrow);if(arrow.drill)this.fired++;this.stamina-=8;this.cooldown=.32;this.events.push({type:'shot',id:arrow.id,position:arrow.position.clone(),direction:arrow.velocity.clone()});this.charge=0;}
 setGuard(value:boolean){if(!this.inside||this.weapon!=='sword')return;if(value&&!this.guard)this.guardSince=this.clock;this.guard=value;}
 swing(heavy:boolean){if(!this.inside||this.weapon!=='sword'||this.guard||this.attack||this.cooldown>0)return;const cost=heavy?26:10;if(this.stamina<cost){this.say('Recover your stamina before striking.');return;}this.stamina-=cost;this.attack={remaining:heavy?.32:.12,heavy};this.cooldown=heavy?.88:.43;this.events.push({type:'swing',points:heavy?2:1});}
 private finish(){if(this.complete)return;this.complete=true;const best=Math.max(this.best[this.drill]||0,this.score);this.best[this.drill]=best;try{localStorage.setItem('asterion-training-v1',JSON.stringify(this.best));}catch{this.sessionOnly=true;}this.events.push({type:'complete',points:this.score});this.say('Drill complete! Press R for the next technique.');}
 private impact(target:typeof practiceTargets[number],point:Vector3,points:number,heavy=false){
  this.events.push({type:'hit',target:target.id,position:point.clone(),points});
  if(target.kind==='dummy'){const dummy=this.dummies.find(d=>d.id===target.id)!;dummy.hp-=heavy?55:25;
   if(dummy.hp<=0){dummy.hp=0;dummy.reset=2.5;dummy.windup=0;this.say('Dummy cleared — resetting.');}else{if(dummy.windup<=0)dummy.windup=1.05;this.say('Dummy winding up! Face it and guard its reply.');}}
 }
 tick(dt:number,pose:PracticePose){
  this.pose={position:pose.position.clone(),direction:pose.direction.clone().normalize()};const entered=insideTraining(pose.position);
  if(!entered){if(this.inside)this.startDrill('free');this.inside=false;return;}
  if(!this.inside){this.inside=true;this.say('Practice weapons ready · 1 sword · 2 bow · R next drill');}
  this.clock+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.stamina=Math.min(100,this.stamina+dt*(this.guard?8:21));if(this.drawing)this.charge=Math.min(1.4,this.charge+dt);if(this.clock-this.lastHit>1.05)this.combo=0;
  // Counterstrikes are telegraphed and harmless outside the practice area.
  for(const dummy of this.dummies){if(dummy.reset>0){dummy.reset-=dt;if(dummy.reset<=0)dummy.hp=100;}if(dummy.windup<=0)continue;dummy.windup-=dt;if(dummy.windup>0)continue;
   const target=practiceTargets.find(t=>t.id===dummy.id)!,to=target.position.clone().sub(this.pose.position);to.y=0;const distance=to.length();
   if(distance>3.25)continue;const facing=this.pose.direction.clone().setY(0).normalize().dot(to.normalize());
   if(this.guard&&facing>.45&&this.stamina>=14){this.stamina-=14;const perfect=this.clock-this.guardSince<.36;this.events.push({type:'block',target:dummy.id,perfect,position:target.position.clone()});this.say(perfect?'Perfect guard! You read the strike.':'Blocked. Raise your guard later for a perfect timing.');if(this.drill==='guard'&&!this.complete){this.blocks++;this.score+=perfect?100:60;if(this.blocks>=3)this.finish();}}
   else{this.events.push({type:'tag',target:dummy.id});this.say('Practice strike tagged you. Face the dummy and hold right mouse to guard.');this.combo=0;}
  }
  if(this.attack){this.attack.remaining-=dt;if(this.attack.remaining<=0){const heavy=this.attack.heavy;this.attack=null;
   const candidates=practiceTargets.filter(t=>t.kind==='dummy'&&this.dummies.find(d=>d.id===t.id)!.reset<=0).map(t=>({target:t,to:t.position.clone().sub(this.pose.position)})).filter(v=>v.to.length()<2.85&&v.to.clone().normalize().dot(this.pose.direction)>.68).sort((a,b)=>a.to.lengthSq()-b.to.lengthSq());
   const hit=candidates.find(v=>this.wall(this.pose.position,v.to.clone().normalize(),v.to.length())>=v.to.length()-.65);
   if(hit){const t=hit.target;this.combo=heavy?0:this.clock-this.lastHit<=1.05&&this.lastDummy===t.id?this.combo+1:1;this.lastHit=this.clock;this.lastDummy=t.id;this.impact(t,t.position,heavy?55:25,heavy);if(this.drill==='combo'&&!this.complete){this.score=Math.max(this.score,this.combo*100);if(this.combo>=3&&!heavy)this.finish();}}
   else{this.combo=0;this.say('Out of reach. Step closer and face a dummy.');}
  }}
  for(let i=this.arrows.length-1;i>=0;i--){const a=this.arrows[i],old=a.position.clone();a.velocity.y-=9.81*dt;a.position.addScaledVector(a.velocity,dt);a.age+=dt;const step=a.position.clone().sub(old),length=step.length(),direction=step.clone().normalize(),wallDistance=this.wall(old,direction,length);
   let hit:typeof practiceTargets[number]|undefined,hitPoint:Vector3|undefined,best=Infinity;
   for(const target of practiceTargets){if(target.kind!=='target')continue;const dz=a.position.z-old.z;if(Math.abs(dz)<1e-8||direction.z>=0)continue;const u=(target.position.z-old.z)/dz;if(u<0||u>1)continue;const point=old.clone().lerp(a.position,u),r=Math.hypot(point.x-target.position.x,point.y-target.position.y),distance=length*u;if(r<target.radius&&distance<best&&distance<wallDistance){hit=target;hitPoint=point;best=distance;}}
   const expired=a.age>4||a.position.y<groundHeight(a.position.x,a.position.z)||!insideTraining(a.position)||wallDistance<=length;
   if(hit&&hitPoint){const radius=hitPoint.distanceTo(hit.position),points=radius<.2?100:radius<.5?70:radius<.8?40:20;this.impact(hit,hitPoint,points);this.say(points===100?'Bullseye! 100 points.':`Target hit · ${points} points`);if(a.drill)this.score+=points;this.events.push({type:'land',id:a.id,position:hitPoint.clone(),direction:a.velocity.clone(),target:hit.id});}
   if(hit||expired){if(a.drill)this.resolved++;if(!hit)this.events.push({type:'land',id:a.id,position:a.position.clone(),direction:a.velocity.clone()});this.arrows.splice(i,1);if(this.drill==='archery'&&this.resolved>=5)this.finish();}
  }
 }
 hud():TrainingHUD|null{if(!this.inside)return null;const drill=practiceDrills.find(d=>d.id===this.drill)!;return {weapon:this.weapon,stamina:this.stamina,charge:Math.min(1,this.charge/1.15),guard:this.guard,title:drill.title,hint:drill.hint,progress:this.drill==='archery'?`${this.fired}/5 arrows`:this.drill==='combo'?`${Math.min(this.combo,3)}/3 linked strikes`:this.drill==='guard'?`${this.blocks}/3 replies blocked`:'Unlimited practice',score:this.score,combo:this.combo,message:this.clock<this.messageUntil?this.message:'',incoming:this.dummies.some(d=>d.windup>0&&practiceTargets.find(t=>t.id===d.id)!.position.distanceTo(this.pose.position)<4),complete:this.complete,best:this.best[this.drill]||0,sessionOnly:this.sessionOnly};}
}
