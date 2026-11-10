import * as T from 'three';
import type {DayCycleState} from './day-cycle';
// Shared apparent size: a clearly readable 2.5-degree disc at normal game FOV.
export const celestialDiscAngularRadius=T.MathUtils.degToRad(1.25);
const celestialDistance=450;

export function buildNightSky(scene:T.Scene){
 const moonDirection={value:new T.Vector3()},brightness={value:0};
 const moon=new T.Mesh(new T.SphereGeometry(1,48,32),new T.ShaderMaterial({uniforms:{moonDirection,brightness},vertexShader:`varying vec3 moonNormal;varying vec3 moonLocal;
  void main(){moonNormal=normalize(mat3(modelMatrix)*normal);moonLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 moonNormal;varying vec3 moonLocal;uniform vec3 moonDirection;uniform float brightness;
   float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   void main(){vec3 n=normalize(moonLocal);float maria=.5+.25*sin(n.x*11.+sin(n.y*7.))+ .2*sin(n.z*9.-n.y*5.);float craters=0.;
    for(int i=0;i<18;i++){float f=float(i);vec3 c=normalize(vec3(sin(f*73.1),cos(f*29.3),sin(f*47.7+.8)));float r=.05+hash(vec3(f,2.,1.))*.12;float d=length(n-c)/r;craters+=.17*exp(-d*d*3.)-.12*exp(-pow((d-.85)*7.,2.));}
    float relief=clamp(.76+maria*.17-craters+(hash(floor(n*340.))-.5)*.035,.35,1.);
    float limb=.35+.65*sqrt(max(dot(normalize(moonNormal),-moonDirection),0.));gl_FragColor=vec4(vec3(.72,.79,.91)*relief*limb*brightness,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));moon.scale.setScalar(celestialDistance*Math.sin(celestialDiscAngularRadius));moon.name='Moving cratered moon';moon.renderOrder=-900;scene.add(moon);
 const positions:number[]=[],colors:number[]=[],sizes:number[]=[];let seed=52031;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1300;i++){const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y),warm=random();positions.push(Math.cos(a)*r*570,y*570,Math.sin(a)*r*570);colors.push(1,.80+warm*.20,.70+warm*.30);sizes.push(.85+Math.pow(random(),4)*1.5);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('starSize',new T.Float32BufferAttribute(sizes,1));
 const starFade={value:0},starTime={value:0};const stars=new T.Points(geometry,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{starFade,starTime},vertexShader:`attribute vec3 color;attribute float starSize;varying vec3 starColor;varying float horizon;uniform float starTime;
  void main(){vec3 direction=mat3(modelMatrix)*position;horizon=smoothstep(.015,.18,normalize(direction).y);starColor=color;gl_PointSize=starSize*(1.+.08*sin(starTime*.6+position.x));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 starColor;varying float horizon;uniform float starFade;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.||horizon<.001)discard;gl_FragColor=vec4(starColor,(1.-smoothstep(.1,1.,r))*starFade*horizon);}` }));stars.name='Night star field';stars.frustumCulled=false;stars.renderOrder=-800;scene.add(stars);
 return {moon,stars,update(state:DayCycleState,time:number,camera=new T.Vector3()){
  moonDirection.value.copy(state.moonDirection);moon.position.copy(camera).addScaledVector(state.moonDirection,celestialDistance);moon.visible=state.moonDirection.y>-Math.sin(celestialDiscAngularRadius);brightness.value=.55+.45*(1-state.daylight);
  stars.position.copy(camera);stars.rotation.z=-(state.hour-12)/24*Math.PI*2;starFade.value=state.stars;starTime.value=time;stars.visible=state.stars>.001;
 }};
}
