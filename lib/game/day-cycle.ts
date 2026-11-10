import {Color,Vector3,MathUtils} from 'three';

export const dayCycleDuration=24*60;
export const startingHour=8.2;
const smooth=(a:number,b:number,x:number)=>MathUtils.smoothstep(x,a,b);
export function sampleDayCycle(seconds:number){
 const hour=((startingHour+seconds/dayCycleDuration*24)%24+24)%24,angle=(hour/24-.25)*Math.PI*2;
 const sunDirection=new Vector3(Math.cos(angle),Math.sin(angle)*.94,Math.sin(angle)*.34).normalize(),moonDirection=sunDirection.clone().negate();
 const daylight=smooth(-.12,.20,sunDirection.y),solarStrength=smooth(0,.17,sunDirection.y),lunarStrength=(1-daylight)*smooth(0,.20,moonDirection.y);
 const warmth=1-smooth(.02,.42,sunDirection.y),twilight=(1-smooth(.02,.25,Math.abs(sunDirection.y)))*smooth(-.20,-.03,sunDirection.y);
 const sunColor=new Color('#fff0d8').lerp(new Color('#ffa867'),warmth),moonColor=new Color('#a8c4ef');
 return {hour,sunDirection,moonDirection,lightDirection:(sunDirection.y>=0?sunDirection:moonDirection).clone(),daylight,solarStrength,lunarStrength,twilight,
  lightColor:(sunDirection.y>=0?sunColor:moonColor),lightIntensity:2.9*solarStrength+.30*lunarStrength,
  skyTop:new Color('#050d28').lerp(new Color('#2160a4'),daylight),skyHorizon:new Color('#18243e').lerp(new Color('#a2bdce'),daylight).lerp(new Color('#d68b68'),twilight*.55),
  cloudShade:new Color('#101a30').lerp(new Color('#607b9a'),daylight),cloudLight:new Color('#3b4c6a').lerp(new Color('#f2f7ff'),daylight).lerp(new Color('#ffd2a0'),twilight*.6),
  fogColor:new Color('#18263e').lerp(new Color('#9bafba'),daylight).lerp(new Color('#b79b8d'),twilight*.35),
  ambientSky:new Color('#60799c').lerp(new Color('#c4ddf3'),daylight),ambientGround:new Color('#252c3b').lerp(new Color('#69734d'),daylight),ambientIntensity:.18+1.47*daylight,
  stars:1-smooth(-.20,-.04,sunDirection.y),nightLights:1-smooth(-.06,.18,sunDirection.y),
  label:daylight<.15?'NIGHT':hour<7.5?'DAWN':hour<16.5?'DAYLIGHT':hour<19.2?'DUSK':'NIGHT'};
}
export type DayCycleState=ReturnType<typeof sampleDayCycle>;
export function updateDayCycle(state:DayCycleState,seconds:number){
 const next=sampleDayCycle(seconds);for(const key of Object.keys(next) as (keyof DayCycleState)[]){const a=state[key],b=next[key];if(a instanceof Vector3&&b instanceof Vector3)a.copy(b);else if(a instanceof Color&&b instanceof Color)a.copy(b);else (state as any)[key]=b;}return state;
}
export function cycleSecondsAtHour(hour:number){return (hour-startingHour)/24*dayCycleDuration;}
/** Share the sky between camp, expeditions and returns from temple pages. */
export function createDayCycleClock(storage:()=>Pick<Storage,'getItem'|'setItem'>=()=>localStorage){
 let rememberedEpoch:number|undefined;return (now=Date.now())=>{
 if(rememberedEpoch===undefined){
  try{const saved=Number(storage().getItem('asterion-sky-epoch'));if(Number.isFinite(saved)&&saved>0&&saved<=now)rememberedEpoch=saved;}catch{/* In-memory time works when storage is blocked. */}
  if(rememberedEpoch===undefined){rememberedEpoch=now;try{storage().setItem('asterion-sky-epoch',String(now));}catch{}}
 }
 return Math.max(0,(now-rememberedEpoch)/1000);
 };
}
export const dayCycleSeconds=createDayCycleClock();
export function skyStateLabel(state:DayCycleState){const minutes=Math.floor(state.hour*60)%1440;return `${state.label} · ${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
