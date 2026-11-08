import * as T from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';
import { buildWorld } from './world';
import { groundHeight, landmarks, poseidonTemple, type Settings } from './data';
import { findTemple, templeAtEntrance, templeReturnPoint } from './temple-catalog';
import { CampAudio } from './audio';
import { simulatePlayer } from './physics';

export interface GameHUD { x:number; z:number; heading:number; nearest:string|null; zone:string; fps:number; grounded:boolean }
export interface Events { hud:(v:GameHUD)=>void; pause:()=>void; map:()=>void; inspect:(id:string)=>void; error:(message:string)=>void }
export class CampEngine {
  renderer:T.WebGLRenderer; camera=new T.PerspectiveCamera(68,1,.1,650); world:ReturnType<typeof buildWorld>;
  collider=new Capsule(new T.Vector3(),new T.Vector3(),.32); velocity=new T.Vector3(); audio=new CampAudio();
  keys=new Set<string>(); settings:Settings; active=false; started=false; grounded=false; yaw=0; pitch=-.07; nearest:string|null=null;
  jumpQueued=false;
  private disposed=false;private frame=0;private previous=0;private accumulator=0;private lastHud=0;private time=0;private frames=0;private fps=60;private fpsStart=0;private dragging=false;private resizeObserver:ResizeObserver;private removers:(()=>void)[]=[];
  constructor(private host:HTMLElement,settings:Settings,private events:Events){
    this.settings=settings;this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','First-person view of Asterion Sanctuary');this.world=buildWorld();this.camera.rotation.order='YXZ';this.reset();const returning=findTemple(new URLSearchParams(location.search).get('return'));if(returning){const p=templeReturnPoint(returning.id);this.teleport(p.x,p.z);this.yaw=p.yaw;this.started=true;}this.applySettings(settings);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
    const listen=(target:EventTarget,name:string,fn:EventListener)=>{target.addEventListener(name,fn);this.removers.push(()=>target.removeEventListener(name,fn));};
    listen(window,'keydown',((e:KeyboardEvent)=>{if(!this.active)return;if(['Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','KeyM','KeyE','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){this.pause();this.events.pause();return;}if(e.code==='KeyM'&&!e.repeat){this.pause();this.events.map();return;}if(e.code==='KeyE'&&!e.repeat&&this.nearest){this.pause();this.events.inspect(this.nearest);return;}if(e.code==='Space'&&!e.repeat)this.jumpQueued=true;this.keys.add(e.code);}) as EventListener);
    listen(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.code);}) as EventListener);
    listen(document,'mousemove',((e:MouseEvent)=>{if(!this.active||(!document.pointerLockElement&&!this.dragging))return;this.yaw-=e.movementX*.002*this.settings.sensitivity;this.pitch=T.MathUtils.clamp(this.pitch-e.movementY*.002*this.settings.sensitivity,-1.45,1.45);}) as EventListener);
    listen(this.renderer.domElement,'mousedown',(()=>{if(this.active){this.dragging=true;this.lock();}}) as EventListener);listen(window,'mouseup',(()=>{this.dragging=false;}) as EventListener);
    listen(document,'pointerlockchange',(()=>{if(!document.pointerLockElement&&this.active){this.pause();this.events.pause();}}) as EventListener);
    listen(window,'blur',(()=>{if(this.active){this.pause();this.events.pause();}}) as EventListener);
    listen(document,'visibilitychange',(()=>{if(document.hidden&&this.active){this.pause();this.events.pause();}}) as EventListener);
    listen(this.renderer.domElement,'webglcontextlost',((e:Event)=>{e.preventDefault();this.pause();this.events.error('The graphics connection was interrupted. Reload the camp to continue.');}) as EventListener);
    this.frame=requestAnimationFrame(this.loop);
    const query=new URLSearchParams(location.search);
    if(query.has('debug')){(window as unknown as {__camp:CampEngine}).__camp=this;
      const views:Record<string,[number,number,number]>={courtyard:[0,15,0],lake:[60,5,-Math.PI/2],house:[-55,59,0],interior:[-55,52,0],forest:[-40,-99,0],fire:[0,-53,0],arena:[-65,-15,0]};
      const view=views[query.get('view')||''];if(view){this.teleport(view[0],view[1]);this.yaw=view[2];this.pitch=-.07;this.started=true;this.syncCamera();}
    }
  }
  reset(){this.teleport(0,113);this.yaw=0;this.pitch=-.14;}
  teleport(x:number,z:number){const y=groundHeight(x,z)+.12;this.collider.start.set(x,y+.32,z);this.collider.end.set(x,y+1.62,z);this.velocity.set(0,0,0);this.grounded=false;this.syncCamera();}
  private lock(){try{const result=this.renderer.domElement.requestPointerLock();if(result)void result.catch(()=>{});}catch{/* Click-drag looking remains available when embedding blocks pointer lock. */}}
  start(){this.active=true;this.started=true;this.keys.clear();this.previous=performance.now();this.accumulator=0;this.audio.start(this.settings.volume);this.audio.volume(this.settings.volume);this.lock();}
  pause(){this.active=false;this.keys.clear();this.jumpQueued=false;this.velocity.set(0,0,0);this.dragging=false;this.audio.pause();if(document.pointerLockElement)document.exitPointerLock();}
  applySettings(settings:Settings){this.settings=settings;const q=settings.quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='low'?1:q==='medium'?1.4:1.8));this.renderer.shadowMap.enabled=q!=='low';this.world.sun.shadow.mapSize.setScalar(q==='high'?2048:1024);this.world.sun.shadow.map?.dispose();this.world.sun.shadow.map=null;this.renderer.shadowMap.needsUpdate=true;this.world.foliage[0].visible=q!=='low';this.world.setQuality(q);this.audio.volume(settings.volume);this.resize();}
  private resize(){const w=this.host.clientWidth,h=this.host.clientHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  private syncCamera(){this.camera.position.copy(this.collider.end);if(this.settings.headBob&&this.grounded&&this.velocity.lengthSq()>.5)this.camera.position.y+=Math.sin(this.time*12)*.035;this.camera.rotation.set(this.pitch,this.yaw,0);}
  step(dt:number){
    simulatePlayer(this,this.world.octree,dt);
    if(this.collider.end.y<-20||!Number.isFinite(this.collider.end.y))this.reset();
    this.syncCamera();
    const entry=templeAtEntrance(this.collider.start.x,this.collider.start.z);
    if(this.active&&entry){this.pause();this.dispose();location.href=`${entry.id}.html`;}
  }
  private loop=(now:number)=>{this.frame=requestAnimationFrame(this.loop);const dt=Math.min((now-(this.previous||now))/1000,.08);this.previous=now;this.time+=dt;
    if(this.active){this.accumulator+=dt;while(this.accumulator>=1/120){this.step(1/120);this.accumulator-=1/120;}}
    else if(!this.started){this.camera.position.set(0,groundHeight(0,113)+2.5,113);this.camera.rotation.set(-.17,Math.sin(this.time*.06)*.035,0);}
    if(this.disposed)return;this.world.update(this.time,this.camera.position);this.renderer.render(this.world.scene,this.camera);this.frames++;
    if(now-this.fpsStart>1000){this.fps=Math.round(this.frames*1000/(now-this.fpsStart));this.frames=0;this.fpsStart=now;}
    if(now-this.lastHud>180){this.lastHud=now;const {x,z}=this.camera.position;const nearest=landmarks.find(l=>Math.hypot(x-l.x,z-l.z)<7);this.nearest=nearest?.id||null;
      let zone='Asterion Sanctuary';if(z>88)zone='Arrival Ridge';else if(x>57)zone='Mirror Lake';else if(z<-82)zone='The Whispering Woods';else if(z<-48&&Math.abs(x)<25)zone='The Amphitheatre';else if(x<-43&&z>30)zone='The Wayfarer Hall';else if(x<-43&&z<0)zone='Training Grounds';else if(x>30&&z>25)zone='Dining Pavilion';else if(Math.hypot(x,z)<42)zone='The Temple Courts';if(x>25&&x<51&&z>-2&&z<23)zone='Poseidon · Hall of the Tides';
      this.events.hud({x,z,heading:((T.MathUtils.radToDeg(-this.yaw)%360)+360)%360,nearest:this.nearest,zone,fps:this.fps,grounded:this.grounded});
      if(this.active)this.audio.update(x,z,this.grounded&&Math.hypot(this.velocity.x,this.velocity.z)>.6,this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'));
    }
  };
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.removers.forEach(f=>f());this.resizeObserver.disconnect();this.audio.dispose();this.world.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
