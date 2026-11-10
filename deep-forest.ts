import * as T from 'three';
import {Octree} from 'three/addons/math/Octree.js';
import {Capsule} from 'three/addons/math/Capsule.js';
import {buildDeepForest} from './lib/game/deep-forest';
import {deepForest,deepForestHeight as h} from './lib/game/deep-forest-layout';
import {buildAtmosphere} from './lib/game/atmosphere';
import {dayCycleSeconds,skyStateLabel} from './lib/game/day-cycle';
import {ForestMist} from './lib/game/forest-mist';
import {simulatePlayer} from './lib/game/physics';
import {readSave} from './lib/game/data';

/** Landscape-only exploration. Does not create an expedition or write its save. */
export function startDeepForest(){
 const $=(id:string)=>document.getElementById(id)!,menu=$('menu');let active=false,disposed=false,drag=false,pitch=-.08,clock=0,frame=0,last=performance.now(),accumulator=0,lastHud=0;
 const settings=readSave().settings,scene=new T.Scene(),collision=new T.Group();scene.background=new T.Color('#24392f');scene.fog=new T.FogExp2('#32483e',.0025);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.toneMapping=T.ACESFilmicToneMapping;$('scene').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','First-person exploration beneath the deep forest canopy');
 const camera=new T.PerspectiveCamera(68,1,.1,650);camera.rotation.order='YXZ';const atmosphere=buildAtmosphere(scene,{clock:dayCycleSeconds,ambientScale:.78}),forest=buildDeepForest(scene,collision),mist=new ForestMist('deep');
 Object.assign(atmosphere.sun.shadow.camera,{left:-105,right:105,top:105,bottom:-105});atmosphere.sun.shadow.camera.updateProjectionMatrix();atmosphere.applyCloudShadows();collision.updateMatrixWorld(true);const octree=new Octree().fromGraphNode(collision);
 const player={keys:new Set<string>(),yaw:0,grounded:false,jumpQueued:false,velocity:new T.Vector3(),collider:new Capsule(new T.Vector3(),new T.Vector3(),.32)};
 function reset(){const {x,z}=deepForest.spawn,y=h(x,z);player.collider.start.set(x,y+.36,z);player.collider.end.set(x,y+1.66,z);player.velocity.set(0,0,0);player.grounded=false;player.yaw=0;pitch=-.08;}reset();
 document.title='The Deep Forest · Asterion';menu.querySelector('small')!.textContent='ASTERION · THE DEEP FOREST';menu.querySelector('h1')!.textContent='Under the old canopy.';
 $('intro').textContent='Tall, dark trees. Winding earth trails. Mist gathering in the hollows. Explore the forest landscape before its creatures and encounters arrive.';
 $('controls').textContent='WASD walk · Shift sprint · Space jump\nMouse look, or hold left mouse and drag\nEsc pause · R return to the forest entrance · E return to camp';
 $('retreat-cost').hidden=true;$('journal').textContent='A large woodland to explore freely. Follow the worn trail, or leave it and wander beneath the crowns.';$('warning').textContent='';$('retreat').textContent='Return to sanctuary';$('start').textContent='Explore the forest';
 function pause(){active=false;drag=false;player.keys.clear();player.jumpQueued=false;player.velocity.set(0,0,0);menu.hidden=false;if(document.pointerLockElement)document.exitPointerLock();}
 function leave(){dispose();location.href=location.protocol==='file:'?'asterion-sanctuary.html':'index.html';}
 const removers:(()=>void)[]=[];function on(target:EventTarget,name:string,handler:EventListener){target.addEventListener(name,handler);removers.push(()=>target.removeEventListener(name,handler));}
 on(window,'keydown',((e:KeyboardEvent)=>{if(e.code==='Escape'){pause();return;}if(!active||e.ctrlKey||e.metaKey)return;if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyR','KeyE'].includes(e.code))e.preventDefault();player.keys.add(e.code);if(e.code==='Space'&&!e.repeat)player.jumpQueued=true;if(e.code==='KeyR'&&!e.repeat)reset();if(e.code==='KeyE'&&!e.repeat)leave();}) as EventListener);
 on(window,'keyup',((e:KeyboardEvent)=>{player.keys.delete(e.code);}) as EventListener);
 on(renderer.domElement,'mousedown',((e:MouseEvent)=>{if(active&&e.button===0){drag=true;try{void renderer.domElement.requestPointerLock()?.catch(()=>{});}catch{}}}) as EventListener);on(window,'mouseup',()=>{drag=false;});
 on(document,'mousemove',((e:MouseEvent)=>{if(!active||(!document.pointerLockElement&&!drag))return;player.yaw-=e.movementX*.002*settings.sensitivity;pitch=T.MathUtils.clamp(pitch-e.movementY*.002*settings.sensitivity,-1.4,1.4);}) as EventListener);
 on(window,'blur',pause);on(document,'visibilitychange',()=>{if(document.hidden)pause();});on(document,'pointerlockchange',()=>{if(!document.pointerLockElement&&active)pause();});on(window,'pagehide',()=>dispose());
 on(renderer.domElement,'webglcontextlost',((e:Event)=>{e.preventDefault();pause();$('warning').textContent='The graphics connection was interrupted. Reload to explore again.';}) as EventListener);
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}on(window,'resize',resize);resize();
 $('start').onclick=()=>{active=true;menu.hidden=true;last=performance.now();accumulator=0;try{void renderer.domElement.requestPointerLock()?.catch(()=>{});}catch{}};$('retreat').onclick=leave;
 const forestTint=new T.Color('#9daea1'),fogTint=new T.Color('#263d34');
 function loop(now:number){if(disposed)return;frame=requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.06);last=now;clock+=dt;
  if(active){accumulator+=dt;while(accumulator>=1/120){simulatePlayer(player,octree,1/120);accumulator-=1/120;}if(player.collider.end.y<-20||!Number.isFinite(player.collider.end.y))reset();}else accumulator=0;
  camera.position.copy(player.collider.end);camera.rotation.set(pitch,player.yaw,0);forest.update(clock,camera.position);
  const x=Math.round(camera.position.x/16)*16,z=Math.round(camera.position.z/16)*16;atmosphere.sun.target.position.set(x,h(x,z),z);atmosphere.update(clock,camera.position);atmosphere.ambient.color.multiply(forestTint);atmosphere.ambient.intensity+=(1-atmosphere.state.daylight)*.18;scene.fog!.color.lerp(fogTint,.72);atmosphere.prepareRenderer(renderer);
  mist.render(renderer,scene,camera,clock,atmosphere.state.daylight);
  if(now-lastHud>180){lastHud=now;const heading=((T.MathUtils.radToDeg(-player.yaw)%360)+360)%360,directions=['N','NE','E','SE','S','SW','W','NW'];$('hud').textContent=`THE DEEP FOREST · ${skyStateLabel(atmosphere.state)} · ${directions[Math.round(heading/45)%8]}`;$('message').textContent='R · Forest entrance     E · Return to sanctuary';}
 }
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);removers.forEach(remove=>remove());forest.dispose();atmosphere.dispose();mist.dispose();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Line){geometries.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material]){materials.add(material);for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);}}});collision.traverse(o=>{if(o instanceof T.Mesh)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();collision.clear();octree.clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 frame=requestAnimationFrame(loop);
}
