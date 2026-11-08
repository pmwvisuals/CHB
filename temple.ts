import * as T from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';
import { buildSacredTemple } from './lib/game/sacred-temple';
import { simulatePlayer } from './lib/game/physics';
import { readSave, writeSave } from './lib/game/data';
import { findTemple } from './lib/game/temple-catalog';
import './app/temple.css';
const theme=findTemple(document.body.dataset.temple)||findTemple('poseidon')!;
const returnURL=()=>`${location.protocol==='file:'?'asterion-sanctuary.html':'index.html'}?return=${theme.id}`;
document.querySelector<HTMLAnchorElement>('header a')!.href=returnURL();
document.querySelector<HTMLSelectElement>('#temple-select')?.addEventListener('change',e=>{const next=findTemple((e.target as HTMLSelectElement).value);if(next)location.href=`${next.id}.html`;});

const host=document.querySelector<HTMLElement>('#scene')!, status=document.querySelector<HTMLElement>('#status')!, overlay=document.querySelector<HTMLElement>('#overlay')!;
const saved=readSave();let active=false,disposed=false,frame=0,previous=0,acc=0,time=0,pitch=-.08,dragging=false;
const player={keys:new Set<string>(),yaw:0,grounded:false,jumpQueued:false,velocity:new T.Vector3(),collider:new Capsule(new T.Vector3(0,.33,16),new T.Vector3(0,1.63,16),.32)};
try{
const world=buildSacredTemple(theme.id),renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'}),camera=new T.PerspectiveCamera(65,1,.1,120);camera.rotation.order='YXZ';renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label',`First-person view of ${theme.name}'s temple`);
function quality(){renderer.setPixelRatio(Math.min(devicePixelRatio,saved.settings.quality==='high'?1.8:saved.settings.quality==='low'?1:1.35));renderer.shadowMap.enabled=saved.settings.quality!=='low';renderer.shadowMap.needsUpdate=true;}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}quality();resize();
function pause(){active=false;player.keys.clear();player.jumpQueued=false;player.velocity.set(0,0,0);overlay.hidden=false;if(document.pointerLockElement)document.exitPointerLock();}
function start(){active=true;overlay.hidden=true;previous=performance.now();acc=0;try{void renderer.domElement.requestPointerLock()?.catch(()=>{});}catch{}}
function leave(){dispose();location.href=returnURL();}
const listeners:Array<()=>void>=[];function on(target:EventTarget,name:string,fn:EventListener){target.addEventListener(name,fn);listeners.push(()=>target.removeEventListener(name,fn));}
on(window,'resize',resize);on(window,'keydown',((e:KeyboardEvent)=>{if(e.code==='Escape'){pause();return;}if(!active)return;if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyE'].includes(e.code))e.preventDefault();if(e.code==='Space'&&!e.repeat)player.jumpQueued=true;if(e.code==='KeyE'&&player.collider.start.z>17){leave();return;}player.keys.add(e.code);}) as EventListener);
on(window,'keyup',((e:KeyboardEvent)=>{player.keys.delete(e.code);}) as EventListener);
on(document,'mousemove',((e:MouseEvent)=>{if(!active||(!document.pointerLockElement&&!dragging))return;player.yaw-=e.movementX*.002*saved.settings.sensitivity;pitch=T.MathUtils.clamp(pitch-e.movementY*.002*saved.settings.sensitivity,-1.45,1.45);}) as EventListener);
on(renderer.domElement,'mousedown',()=>{dragging=true;});on(window,'mouseup',()=>{dragging=false;});on(window,'blur',pause);on(document,'visibilitychange',()=>{if(document.hidden)pause();});on(document,'pointerlockchange',()=>{if(!document.pointerLockElement&&active)pause();});
on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();pause();status.textContent='Graphics connection interrupted. Reload this page to continue.';});
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);listeners.forEach(f=>f());world.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
on(window,'pagehide',dispose);window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.querySelector('#enter')!.addEventListener('click',start);document.querySelector('#exit')!.addEventListener('click',leave);document.querySelector('#menu')!.addEventListener('click',pause);
const select=document.querySelector<HTMLSelectElement>('#quality')!;select.value=saved.settings.quality;select.addEventListener('change',()=>{saved.settings.quality=select.value as typeof saved.settings.quality;writeSave(saved.settings,saved.discoveries);quality();});
const prompt=document.querySelector<HTMLElement>('#prompt')!;
function loop(now:number){if(disposed)return;frame=requestAnimationFrame(loop);const dt=Math.min((now-(previous||now))/1000,.08);previous=now;time+=dt;if(active){acc+=dt;while(acc>=1/120){simulatePlayer(player,world.octree,1/120);acc-=1/120;}if(player.collider.start.z>28){leave();return;}if(player.collider.start.y<-5){player.collider.start.set(0,.33,16);player.collider.end.set(0,1.63,16);player.velocity.set(0,0,0);}}camera.position.copy(player.collider.end);if(saved.settings.headBob&&player.grounded&&player.velocity.lengthSq()>.5)camera.position.y+=Math.sin(time*12)*.035;camera.rotation.set(pitch,player.yaw,0);world.update(time);renderer.render(world.scene,camera);prompt.hidden=!active||player.collider.start.z<17;}
status.textContent='The sacred hall is ready.';document.querySelector<HTMLButtonElement>('#enter')!.disabled=false;frame=requestAnimationFrame(loop);
}catch(e){status.textContent=`Unable to open the temple: ${e instanceof Error?e.message:'WebGL is unavailable'}.`;document.querySelector('#exit')!.addEventListener('click',()=>{location.href=returnURL();});}
