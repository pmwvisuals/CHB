import * as T from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {cloudBanks,cloudLobes,cloudCenter,cloudFootprintSource} from './atmosphere-layout';
import {sampleDayCycle,updateDayCycle,dayCycleDuration} from './day-cycle';
import {buildNightSky} from './celestial-sky';

const glslVec=(values:readonly number[])=>'vec3('+values.map(v=>Number.isInteger(v)?v+'.':String(v)).join(',')+')';
const cloudShapeGLSL=`float cloudShape(vec3 q){float shape=-1.;${cloudLobes.map(l=>`shape=max(shape,1.-length((q-${glslVec(l.center)})/${glslVec(l.radius)}));`).join('')}return shape;}`;
const cloudFootprintGLSL=cloudFootprintSource('cloudFootprint');
const cloudNoiseGLSL=`
 float cloudHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float cloudNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(cloudHash(i),cloudHash(i+vec3(1,0,0)),f.x),mix(cloudHash(i+vec3(0,1,0)),cloudHash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(cloudHash(i+vec3(0,0,1)),cloudHash(i+vec3(1,0,1)),f.x),mix(cloudHash(i+vec3(0,1,1)),cloudHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;

export function buildAtmosphere(scene:T.Scene,options:{clock?:()=>number;ambientScale?:number}={}){
 const state=sampleDayCycle(options.clock?.()??0),nightSky=buildNightSky(scene),nightLights:T.PointLight[]=[];
 // One shadow atlas follows the dominant sun/moon source, avoiding two complete
 // forest shadow renders. Both bodies fade to zero direct light at the horizon.
 const sun=new T.DirectionalLight('#fff0d8',2.9);sun.name='Moving solar and lunar shadow light';sun.position.copy(state.lightDirection).multiplyScalar(350);sun.castShadow=true;
 sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-250,right:250,top:250,bottom:-250,near:1,far:800});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
 const ambient=new T.HemisphereLight('#c4ddf3','#69734d',1.65);ambient.name='Cool sky fill';scene.add(ambient);
 const sky=new Sky();sky.name='Cycling atmospheric sky and solar disc';sky.scale.setScalar(10000);sky.renderOrder=-1000;sky.frustumCulled=false;
 const skyMaterial=sky.material as T.ShaderMaterial,u=skyMaterial.uniforms;u.turbidity.value=3.6;u.rayleigh.value=2.3;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;u.sunPosition.value.copy(state.sunDirection).multiplyScalar(450000);
 u.cycleDaylight={value:state.daylight};skyMaterial.fragmentShader='uniform float cycleDaylight;\n'+skyMaterial.fragmentShader;skyMaterial.fragmentShader=skyMaterial.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );',`vec3 nightColor=mix(vec3(.008,.015,.033),vec3(.0015,.0035,.012),pow(max(direction.y,0.),.45));
  gl_FragColor=vec4(mix(nightColor,retColor,cycleDaylight),1.);`);scene.add(sky);
 const centers=cloudBanks.map((_,i)=>cloudCenter(i,0)),sizes=cloudBanks.map(c=>c.size.clone()),clock={value:0};
 const cube=new T.BoxGeometry(1,1,1),clouds:T.Mesh[]=[];
 for(let index=0;index<cloudBanks.length;index++){
  const material=new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,uniforms:{cloudCenter:{value:centers[index]},cloudSize:{value:sizes[index]},sunDirection:{value:state.lightDirection},cloudShade:{value:state.cloudShade},cloudLight:{value:state.cloudLight},cloudDirectStrength:{value:state.solarStrength},cloudTime:clock},
   vertexShader:'varying vec3 volumePoint;void main(){volumePoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec3 volumePoint;uniform vec3 cloudCenter;uniform vec3 cloudSize;uniform vec3 sunDirection;uniform vec3 cloudShade;uniform vec3 cloudLight;uniform float cloudDirectStrength;uniform float cloudTime;
    ${cloudNoiseGLSL}${cloudShapeGLSL}
    float density(vec3 world){vec3 q=(world-cloudCenter)/cloudSize;float shape=cloudShape(q);if(shape<-.22)return 0.;
     vec3 drift=q*11.+vec3(cloudTime*.0007,0.,0.);float billow=cloudNoise(drift)*.65+cloudNoise(drift*2.07)*.35;
     float body=smoothstep(-.10,.20,shape+(billow-.5)*.29);
     float edgeFade=1.-smoothstep(.43,.5,max(abs(q.x),abs(q.z)));
     return body*edgeFade*smoothstep(-.44,-.24,q.y)*(1.-smoothstep(.39,.5,q.y));}
    float lightDensity(vec3 world){vec3 q=(world-cloudCenter)/cloudSize;return smoothstep(-.03,.17,cloudShape(q))*smoothstep(-.44,-.24,q.y);}
    void main(){
     vec3 ray=normalize((volumePoint-(cameraPosition-cloudCenter)/cloudSize)*cloudSize);
     vec3 ro=cameraPosition-cloudCenter,halfSize=cloudSize*.5;
     vec3 safeRay=mix(vec3(.00001),ray,step(vec3(.00001),abs(ray)));vec3 inv=1./safeRay;vec3 a=(-halfSize-ro)*inv,b=(halfSize-ro)*inv;
     vec3 lo=min(a,b),hi=max(a,b);float near=max(0.,max(lo.x,max(lo.y,lo.z))),far=min(hi.x,min(hi.y,hi.z));if(far<=near)discard;
     float stepSize=(far-near)/36.,jitter=cloudHash(vec3(gl_FragCoord.xy,3.));float transmission=1.;vec3 light=vec3(0.);
     for(int i=0;i<36;i++){
      vec3 p=cameraPosition+ray*(near+(float(i)+jitter)*stepSize);float d=density(p);
      if(d>.002){float sunDepth=lightDensity(p+sunDirection*5.)*.9+lightDensity(p+sunDirection*13.)*.7+lightDensity(p+sunDirection*24.)*.45;
       float direct=exp(-sunDepth*1.15),height=clamp((p.y-cloudCenter.y)/cloudSize.y+.5,0.,1.);
       vec3 shade=mix(cloudShade,cloudLight,.28+.72*direct*cloudDirectStrength);
       shade*=.85+.15*height;float silver=pow(max(dot(ray,sunDirection),0.),8.)*direct*.20*cloudDirectStrength;shade+=cloudLight*silver;
       float alpha=1.-exp(-d*stepSize*.11);light+=transmission*alpha*shade;transmission*=1.-alpha;
      }
      if(transmission<.012)break;
     }
     float alpha=1.-transmission;if(alpha<.003)discard;gl_FragColor=vec4(light/max(alpha,.001),alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  const cloud=new T.Mesh(cube,material);cloud.name='Slow volumetric cumulus '+(index+1);cloud.position.copy(centers[index]);cloud.scale.copy(sizes[index]);cloud.castShadow=false;clouds.push(cloud);scene.add(cloud);
 }
 function applyCloudShadows(){
  const seen=new Set<T.Material>();scene.traverse(o=>{if(!(o instanceof T.Mesh)||!o.receiveShadow)return;for(const material of Array.isArray(o.material)?o.material:[o.material]){
   if(seen.has(material)||!(material instanceof T.MeshStandardMaterial))continue;seen.add(material);const previous=material.onBeforeCompile,cache=material.customProgramCacheKey();
   material.onBeforeCompile=(s,renderer)=>{previous.call(material,s,renderer);s.uniforms.cloudCenters={value:centers};s.uniforms.cloudSizes={value:sizes};s.uniforms.cloudSun={value:state.lightDirection};
    s.vertexShader='varying vec3 cloudShadowWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
     vec4 cloudLocal=vec4(transformed,1.);
     #ifdef USE_INSTANCING
      cloudLocal=instanceMatrix*cloudLocal;
     #endif
     cloudShadowWorld=(modelMatrix*cloudLocal).xyz;`);
    s.fragmentShader=`varying vec3 cloudShadowWorld;uniform vec3 cloudCenters[4];uniform vec3 cloudSizes[4];uniform vec3 cloudSun;${cloudFootprintGLSL}
     float cloudTransmission(vec3 p){if(cloudSun.y<.025)return 1.;float visibility=1.;for(int i=0;i<4;i++){if(p.y>=cloudCenters[i].y)continue;float travel=(cloudCenters[i].y-p.y)/cloudSun.y;vec3 hit=p+cloudSun*travel;vec2 q=(hit.xz-cloudCenters[i].xz)/cloudSizes[i].xz;visibility*=exp(-cloudFootprint(q)*1.75);}return mix(1.,visibility,smoothstep(.025,.15,cloudSun.y));}
     `+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',T.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );\n directLight.color*=cloudTransmission(cloudShadowWorld);'));
   };material.customProgramCacheKey=()=>cache+'-celestial-cloud-shadows-v2';material.needsUpdate=true;
  }});
 }
 scene.userData.dayCycle=state;scene.userData.atmosphere={cloudBanks:4,sunMotion:true,moonMotion:true,cycleSeconds:dayCycleDuration,cloudShadowMode:'moving solar/lunar projected columns on scene materials'};
 let lastShadow=-Infinity,shadowDirty=true;
 function update(time:number,camera?:T.Vector3){
  const seconds=options.clock?.()??time;updateDayCycle(state,seconds);clock.value=time;
  sun.position.copy(sun.target.position).addScaledVector(state.lightDirection,350);sun.color.copy(state.lightColor);sun.intensity=state.lightIntensity;
  ambient.color.copy(state.ambientSky);ambient.groundColor.copy(state.ambientGround);ambient.intensity=state.ambientIntensity*(options.ambientScale??1);
  u.sunPosition.value.copy(state.sunDirection).multiplyScalar(450000);u.cycleDaylight.value=state.daylight;nightSky.update(state,time,camera);
  if(scene.fog)scene.fog.color.copy(state.fogColor);if(scene.background instanceof T.Color)scene.background.copy(state.fogColor);
  nightLights.forEach(light=>light.intensity=light.userData.nightIntensity*state.nightLights);
  clouds.forEach((cloud,i)=>{cloudCenter(i,time,centers[i]);cloud.position.copy(centers[i]);(cloud.material as T.ShaderMaterial).uniforms.cloudDirectStrength.value=state.sunDirection.y>=0?state.solarStrength:state.lunarStrength;});if(camera)sky.position.copy(camera);
  if(Math.abs(seconds-lastShadow)>=.1){shadowDirty=true;lastShadow=seconds;}
 }
 update(0);
 return {sun,ambient,sky,clouds,state,moon:nightSky.moon,stars:nightSky.stars,applyCloudShadows,update,
  registerNightLight(light:T.PointLight){light.userData.nightIntensity=light.intensity;light.intensity*=state.nightLights;nightLights.push(light);},
  prepareRenderer(renderer:T.WebGLRenderer){renderer.toneMappingExposure=1.03+(1-state.daylight)*.08;if(shadowDirty){renderer.shadowMap.needsUpdate=true;shadowDirty=false;}},
  dispose(){sun.shadow.dispose();nightSky.stars.geometry.dispose();(nightSky.stars.material as T.Material).dispose();nightLights.length=0;},
 };
}
