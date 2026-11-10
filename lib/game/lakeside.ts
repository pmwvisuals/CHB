import * as T from 'three';
import {groundHeight} from './data';
import {dock,dockWalkHeight} from './landmark-layout';
import {landmarkKit} from './landmark-kit';
import {cloudBanks,cloudCenter,cloudFootprintSource} from './atmosphere-layout';
import {sampleDayCycle,type DayCycleState} from './day-cycle';

export function buildLakeside(scene:T.Scene,collision:T.Group){
 const k=landmarkKit(scene,collision),{box,mesh,group,cylinder,beam,stone,ivory,wood,darkWood,bronze}=k;
 let seed=1917;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const time={value:0},lakeGeo=new T.CircleGeometry(1,128);lakeGeo.rotateX(-Math.PI/2);
 const colors:number[]=[],p=lakeGeo.getAttribute('position');for(let i=0;i<p.count;i++){const radius=Math.hypot(p.getX(i),p.getZ(i)),c=new T.Color('#104d89').lerp(new T.Color('#287aaf'),radius**3);colors.push(c.r,c.g,c.b);}lakeGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const reflectionClouds=cloudBanks.map((_,i)=>cloudCenter(i,0));
 const cycle:DayCycleState=scene.userData.dayCycle??sampleDayCycle(0),cycleUniforms={lakeSunDirection:{value:cycle.sunDirection},lakeMoonDirection:{value:cycle.moonDirection},lakeSkyTop:{value:cycle.skyTop},lakeSkyHorizon:{value:cycle.skyHorizon},lakeCloudLight:{value:cycle.cloudLight},lakeSunStrength:{value:cycle.solarStrength},lakeMoonStrength:{value:cycle.lunarStrength}};
 const waterMat=new T.MeshPhysicalMaterial({vertexColors:true,color:'#ffffff',roughness:.17,metalness:0,ior:1.333,clearcoat:.35,clearcoatRoughness:.20,transparent:false,opacity:1,transmission:0,depthWrite:true});
 waterMat.onBeforeCompile=s=>{s.uniforms.lakeTime=time;Object.assign(s.uniforms,cycleUniforms);s.uniforms.lakeCloudCenters={value:reflectionClouds};s.uniforms.lakeCloudSizes={value:cloudBanks.map(c=>c.size)};
  s.vertexShader='varying vec3 lakePoint;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nlakePoint=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=`varying vec3 lakePoint;uniform float lakeTime;uniform vec3 lakeSunDirection;uniform vec3 lakeMoonDirection;uniform vec3 lakeSkyTop;uniform vec3 lakeSkyHorizon;uniform vec3 lakeCloudLight;uniform float lakeSunStrength;uniform float lakeMoonStrength;uniform vec3 lakeCloudCenters[4];uniform vec3 lakeCloudSizes[4];${cloudFootprintSource('lakeCloudMask')}\n`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
   vec2 ripple=vec2(sin(dot(lakePoint.xz,vec2(.61,.37))+lakeTime*.52),cos(dot(lakePoint.xz,vec2(-.29,.73))-lakeTime*.43))*.065;
   ripple+=vec2(sin(dot(lakePoint.xz,vec2(2.1,-1.3))-lakeTime*.82),cos(dot(lakePoint.xz,vec2(1.7,2.3))+lakeTime*.71))*.026;
   ripple+=vec2(sin(lakePoint.z*7.1+lakePoint.x*4.3+lakeTime),cos(lakePoint.x*6.3-lakePoint.z*5.7-lakeTime*.93))*.009;
   normal=normalize(normal+mat3(viewMatrix)*vec3(ripple.x,0.,ripple.y));`);
  s.fragmentShader=s.fragmentShader.replace('#include <clearcoat_normal_fragment_maps>',`#include <clearcoat_normal_fragment_maps>
   #ifdef USE_CLEARCOAT
    clearcoatNormal=normal;
   #endif`);
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   vec3 lakeView=normalize(cameraPosition-lakePoint),lakeNormal=inverseTransformDirection(normal,viewMatrix);
   vec3 lakeRay=reflect(-lakeView,lakeNormal);float lakeFresnel=.02+.98*pow(1.-max(dot(lakeView,lakeNormal),0.),5.);
   vec3 lakeSky=mix(lakeSkyHorizon,lakeSkyTop,pow(max(lakeRay.y,0.),.45));
   float lakeCloudCover=0.;
   if(lakeRay.y>.015)for(int i=0;i<4;i++){float travel=(lakeCloudCenters[i].y-lakePoint.y)/lakeRay.y;vec3 hit=lakePoint+lakeRay*travel;vec2 q=(hit.xz-lakeCloudCenters[i].xz)/lakeCloudSizes[i].xz;lakeCloudCover=max(lakeCloudCover,lakeCloudMask(q));}
   lakeSky=mix(lakeSky,lakeCloudLight,lakeCloudCover*.80);
   float lakeGlint=pow(max(dot(lakeRay,lakeSunDirection),0.),1800.)*(1.-lakeCloudCover*.8)*lakeSunStrength;
   float moonGlint=pow(max(dot(lakeRay,lakeMoonDirection),0.),1100.)*(1.-lakeCloudCover*.8)*lakeMoonStrength;
   outgoingLight=mix(outgoingLight,lakeSky,.08+lakeFresnel*.68)+vec3(1.,.91,.76)*lakeGlint*.48+vec3(.55,.70,1.)*moonGlint*.16;
   #include <opaque_fragment>`);
 };waterMat.customProgramCacheKey=()=> 'opaque-blue-lake-day-night-v3';
 const water=mesh(lakeGeo,waterMat,scene,91,.5,0);water.name='Mirror Lake · opaque blue reflective water';water.scale.set(31,1,47);water.castShadow=false;
 const bed=mesh(lakeGeo.clone(),k.mat('#536f5f'),scene,91,-1.3,0);bed.scale.set(31,1,47);bed.castShadow=false;
 // Low timber dock, a shallow approach ramp, and a rail around its outer edge.
 const deck=group('Lakeside · mooring dock',0,0,0,0);
 const ramp=new T.BufferGeometry();const y0=dockWalkHeight(dock.start,dock.z,groundHeight)!;
 ramp.setAttribute('position',new T.Float32BufferAttribute([dock.start,y0,dock.z-dock.halfWidth,dock.start,y0,dock.z+dock.halfWidth,dock.rampEnd,dock.height,dock.z-dock.halfWidth,dock.rampEnd,dock.height,dock.z+dock.halfWidth],3));ramp.setIndex([0,1,2,1,3,2]);ramp.computeVertexNormals();mesh(ramp,wood,deck,0,0,0,true);
 box(deck,67.5,dock.height-.1,dock.z,15,.2,4.2,wood,true);
 for(let i=0;i<43;i++){const x=53+i*.51;if(x>75)continue;const y=dockWalkHeight(x,dock.z,groundHeight)!;box(deck,x,y+.008,dock.z,.035,.018,4.08,darkWood);}
 for(const x of [60,65,70,75])for(const side of [-1,1]){
  cylinder(deck,x,.55,dock.z+side*2.05,.13,2.6,darkWood,true);cylinder(deck,x,1.86,dock.z+side*2.05,.17,.13,bronze);const rope=mesh(new T.TorusGeometry(.2,.04,6,16),k.mat('#ab9c74'),deck,x,1.46,dock.z+side*2.05);rope.rotation.x=Math.PI/2;
 }
 for(const side of [-1,1])for(const x of [62.5,67.5,72.5])box(deck,x,1.75,dock.z+side*2.05,5,.095,.10,wood,true);
 box(deck,75.15,1.75,dock.z,.10,.095,4.1,wood,true);box(deck,75.12,1.22,dock.z,.14,.2,4.1,wood);
 // A western boat shed: open towards the dock, with paddles and stored supplies.
 const shed=group('Lakeside · open boat shelter',48,-25);
 for(const x of [-3.4,3.4])for(const z of [-3,3]){box(shed,x,1.6,z,.28,3.2,.28,darkWood,true);cylinder(shed,x,.2,z,.35,.4,stone);}
 for(const side of [-1,1]){const roof=box(shed,0,3.48,side*1.75,8.3,.16,3.8,k.mat('#5a7f78'));roof.rotation.x=side*.22;}
 box(shed,0,3.89,0,8.6,.17,.22,bronze);box(shed,-3.5,1.25,0,.16,2.4,6.2,wood,true);
 for(let i=0;i<8;i++)box(shed,-3.39,1.3,-2.8+i*.8,.08,2.5,.10,darkWood);
 for(let i=0;i<4;i++){
  const z=-2.3+i*1.3;beam(shed,new T.Vector3(-2.9,.15,z),new T.Vector3(-2.65,2.7,z),.035,wood);const paddle=mesh(new T.SphereGeometry(.24,12,8),ivory,shed,-2.88,.55,z);paddle.scale.set(.16,1.8,1);
 }
 k.bench(shed,0,-2.5,3.8);k.urn(shed,-.8,0,1.7,1.15);k.urn(shed,.2,0,2.2,.7);
 box(shed,2,.45,-2,1.7,.9,1.2,wood,true);for(const z of [-2.4,-1.6])box(shed,2,.5,z,1.76,.12,.06,bronze);
 // Hollow canoe hulls, rim gunwales, seats, paddles and real mooring lines.
 const boats:T.Group[]=[];
 for(let i=0;i<2;i++){
  const g=group('Lakeside · moored canoe',68+i*3.5,-23.1-i*1.1,-.12+i*.3,.62);boats.push(g);
  const outline=[[-2.7,0],[-1.7,-.65],[1.55,-.68],[2.7,0],[1.55,.68],[-1.7,.65]];
  const shape=new T.Shape(outline.map(([x,z])=>new T.Vector2(x,z))),hole=new T.Path(outline.slice().reverse().map(([x,z])=>new T.Vector2(x*.78,z*.73)));shape.holes.push(hole);
  const hullGeo=new T.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.07,bevelThickness:.07});hullGeo.rotateX(-Math.PI/2);mesh(hullGeo,k.mat(i?'#9b6445':'#b99857'),g);
  const rim=new T.CatmullRomCurve3(outline.map(([x,z])=>new T.Vector3(x,.35,-z)),true);mesh(new T.TubeGeometry(rim,60,.055,6,true),darkWood,g);
  for(const x of [-.9,.9])box(g,x,.21,0,.22,.1,1.12,wood);box(g,0,.08,0,4,.06,.54,darkWood);
  beam(g,new T.Vector3(-1.9,.4,-.3),new T.Vector3(1.2,.4,.32),.03,wood);const blade=mesh(new T.SphereGeometry(.24,12,8),ivory,g,1.2,.4,.32);blade.scale.set(1.9,.13,.65);
  const ropePoints=[new T.Vector3(64+i*5,1.48,dock.z-2.05),new T.Vector3(66+i*4,.85,-21.8),new T.Vector3(68+i*3.5,.93,-23.1-i*1.1)];mesh(new T.TubeGeometry(new T.CatmullRomCurve3(ropePoints),16,.025,5,false),k.mat('#a89a75'),scene);
 }
 // Open marble belvedere on the grassy shore, with a teal tiled roof.
 const gazebo=group('Lakeside · open water pavilion',65,35);const floor=cylinder(gazebo,0,.09,0,4.8,.18,stone,true,4.8,48);
 k.ring(gazebo,4.35,.10,.19,bronze);k.ring(gazebo,3.9,.05,.19,ivory);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8,x=Math.sin(a)*4,z=Math.cos(a)*4;cylinder(gazebo,x,1.75,z,.19,3.3,ivory,true);cylinder(gazebo,x,.3,z,.34,.24,stone);cylinder(gazebo,x,3.35,z,.31,.22,ivory);}
 cylinder(gazebo,0,3.5,0,4.8,.22,ivory,false,4.8,8);mesh(new T.ConeGeometry(5.1,1.6,8),k.mat('#507d77'),gazebo,0,4.36,0);mesh(new T.SphereGeometry(.21,12,8),bronze,gazebo,0,5.3,0);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(gazebo,new T.Vector3(Math.sin(a)*5.1,3.55,Math.cos(a)*5.1),new T.Vector3(0,5.16,0),.035,bronze);}
 k.bench(gazebo,0,2.6,3);for(const x of [-2.2,2.2])k.urn(gazebo,x,.18,2.4,.8);
 // Grounded seating and small details between the two lake approaches.
 for(const [x,z,r] of [[60,14,-.6],[63,20,-.8],[60,-31,.8]] as const){const g=group('Lakeside · shoreline seat',x,z,r);k.bench(g,0,0,3.2);cylinder(g,-2.2,1.6,.2,.095,3.2,darkWood,true);k.lantern(g,-2.2,2.95,.2);k.urn(g,2.3,0,.1,.7);}
 // Lily drifts and reeds avoid both the island causeway and the dock mouth.
 for(let i=0;i<35;i++){
  const a=2.5+rand()*.65,x=91+Math.cos(a)*(27+rand()*2),z=Math.sin(a)*(40+rand()*3);if(Math.abs(z-5)<5||Math.abs(z+18)<5)continue;
  const leaf=new T.Shape();leaf.moveTo(0,0);for(let j=0;j<=30;j++){const t=.15+j/30*(Math.PI*2-.3);leaf.lineTo(Math.cos(t)*.3,Math.sin(t)*.3);}leaf.lineTo(0,0);const geo=new T.ShapeGeometry(leaf);geo.rotateX(-Math.PI/2);const pad=mesh(geo,k.mat('#3d6948'),scene,x,.518,z);pad.rotation.y=rand()*6;pad.castShadow=false;
 }
 scene.userData.lakeside={dock:true,mooredCanoes:2,boatShelter:true,viewingPavilion:true,shoreSeats:3};
 return {water,update(t:number){time.value=t;cycleUniforms.lakeSunStrength.value=cycle.solarStrength;cycleUniforms.lakeMoonStrength.value=cycle.lunarStrength;reflectionClouds.forEach((center,i)=>cloudCenter(i,t,center));boats.forEach((g,i)=>{g.position.y=.62+Math.sin(t*.65+i)*.025;g.rotation.z=Math.sin(t*.5+i)*.012;});}};
}
