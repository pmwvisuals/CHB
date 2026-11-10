import { MathUtils, Vector2, Vector3 } from 'three';
import type { Capsule } from 'three/addons/math/Capsule.js';
import type { Octree } from 'three/addons/math/Octree.js';
export interface PlayerState { keys:Set<string>; yaw:number; grounded:boolean; jumpQueued:boolean; velocity:Vector3; collider:Capsule }
export const standingEyeHeight=1.78;
// Capsule end is the centre of the rounded head, rather than the eye position.
export function playerEyePosition(collider:Capsule,target:Vector3){target.copy(collider.end);target.y+=.16;return target;}
export function simulatePlayer(p:PlayerState,octree:Octree,dt:number){
  const forward=Number(p.keys.has('KeyW'))-Number(p.keys.has('KeyS')),side=Number(p.keys.has('KeyD'))-Number(p.keys.has('KeyA'));
  const input=new Vector2(side,forward);if(input.lengthSq()>1)input.normalize();const speed=p.keys.has('ShiftLeft')||p.keys.has('ShiftRight')?8.2:4.6;
  const targetX=(input.x*Math.cos(p.yaw)-input.y*Math.sin(p.yaw))*speed,targetZ=(-input.x*Math.sin(p.yaw)-input.y*Math.cos(p.yaw))*speed;
  const smoothing=1-Math.exp(-14*dt);p.velocity.x=MathUtils.lerp(p.velocity.x,targetX,smoothing);p.velocity.z=MathUtils.lerp(p.velocity.z,targetZ,smoothing);
  if(p.jumpQueued&&p.grounded){p.velocity.y=7.2;p.grounded=false;}p.jumpQueued=false;p.velocity.y-=22*dt;
  p.collider.translate(p.velocity.clone().multiplyScalar(dt));p.grounded=false;
  for(let i=0;i<3;i++){const hit=octree.capsuleIntersect(p.collider);if(!hit)break;p.grounded=p.grounded||hit.normal.y>.5;const inward=hit.normal.dot(p.velocity);if(inward<0)p.velocity.addScaledVector(hit.normal,-inward);p.collider.translate(hit.normal.multiplyScalar(hit.depth));}
}
