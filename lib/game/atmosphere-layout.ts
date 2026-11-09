import {Vector3} from 'three';
/** East is +X in the camp's navigation system. No day/night motion yet. */
export const easternSunDirection=new Vector3(1,.64,0).normalize();
export const cloudBanks=[
 {center:new Vector3(120,118,-155),size:new Vector3(108,35,70)},
 {center:new Vector3(205,135,70),size:new Vector3(120,44,80)},
 {center:new Vector3(60,112,155),size:new Vector3(98,31,65)},
 {center:new Vector3(310,150,-55),size:new Vector3(100,34,72)},
] as const;
export const cloudLobes=[
 {center:[-.24,-.06,.02],radius:[.26,.27,.38]},
 {center:[.02,.08,-.06],radius:[.25,.39,.36]},
 {center:[.28,-.01,.03],radius:[.23,.27,.36]},
 {center:[-.08,-.08,.22],radius:[.34,.24,.22]},
 {center:[.13,-.12,-.22],radius:[.31,.24,.22]},
] as const;
export function cloudFootprintSource(name:string){
 const vec=(x:number,z:number)=>`vec2(${Number.isInteger(x)?x+'.':x},${Number.isInteger(z)?z+'.':z})`;
 return `float ${name}(vec2 q){float shape=-1.;${cloudLobes.map(l=>`shape=max(shape,1.-length((q-${vec(l.center[0],l.center[2])})/${vec(l.radius[0],l.radius[2])}));`).join('')}return smoothstep(-.12,.22,shape);}`;
}
export function cloudCenter(index:number,time:number,target=new Vector3()){
 const base=cloudBanks[index].center;
 // A slow, bounded drift prevents visible jumps when the camp stays open.
 return target.copy(base).add(new Vector3(Math.sin(time*.0008)*275,0,Math.sin(time*.00065)*69));
}
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
/** CPU counterpart of the projected cloud column, useful for layout/QA tools. */
export function cloudShadowTransmission(point:Vector3,time:number){
 let transmission=1;
 for(let i=0;i<cloudBanks.length;i++){
  const center=cloudCenter(i,time);if(point.y>=center.y)continue;
  const travel=(center.y-point.y)/easternSunDirection.y;
  const x=(point.x+easternSunDirection.x*travel-center.x)/cloudBanks[i].size.x,z=(point.z-center.z)/cloudBanks[i].size.z;
  let shape=-1;for(const lobe of cloudLobes)shape=Math.max(shape,1-Math.hypot((x-lobe.center[0])/lobe.radius[0],(z-lobe.center[2])/lobe.radius[2]));
  transmission*=Math.exp(-smooth(-.12,.22,shape)*1.75);
 }return transmission;
}
