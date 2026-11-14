import * as T from 'three';
import {deepForestMistDensityGLSL} from './deep-forest-layout';
import {forestEdgeGLSL,forestEdgeSamples} from './camp-boundary';

/** Depth-aware, world-space participating mist. Integrates only the air between
 * the camera and the visible surface, including the sky, so foreground objects
 * occlude it and walking into the woods changes the optical depth naturally. */
export class ForestMist {
 private target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});
 private pass=new T.Scene();private camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
 private material:T.ShaderMaterial;private quad:T.Mesh;
 constructor(field:'camp'|'deep'='camp'){
  this.target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{
   sceneColor:{value:this.target.texture},sceneDepth:{value:this.target.depthTexture},
   inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},
   eye:{value:new T.Vector3()},mistTime:{value:0},mistDaylight:{value:1},compactForestEdge:{value:forestEdgeSamples},
  },vertexShader:'varying vec2 mistUV;void main(){mistUV=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
   varying vec2 mistUV;uniform sampler2D sceneColor;uniform sampler2D sceneDepth;
   uniform mat4 inverseProjection;uniform mat4 cameraWorld;uniform vec3 eye;uniform float mistTime;uniform float mistDaylight;
   ${forestEdgeGLSL}
   float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
   float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float density(vec3 p){
    float angle=atan(p.z,p.x),edge=campForestEdge(angle);
    float depth=length(p.xz)-edge;
    float belt=smoothstep(-9.,13.,depth);if(belt<.001)return 0.;
    vec3 drift=p*vec3(.065,.16,.065)+vec3(mistTime*.012,0.,mistTime*.007);
    float billow=noise3(drift)+.35*noise3(drift*2.13);
    float ground=.45+.32*sin(p.x*.035)*sin(p.z*.03);
    float ceiling=6.+billow*5.+smoothstep(35.,100.,depth)*5.;
    float height=1.-smoothstep(ground+1.5,ground+ceiling,p.y);
    float pockets=smoothstep(.22,.9,billow);
    return belt*height*(.014+.057*pockets)*mix(1.,2.8,smoothstep(20.,105.,depth));
   }
   void main(){
    vec3 surface=texture2D(sceneColor,mistUV).rgb;
    float depth=texture2D(sceneDepth,mistUV).x;
    vec4 view=inverseProjection*vec4(mistUV*2.-1.,depth*2.-1.,1.);view/=view.w;
    vec3 world=(cameraWorld*vec4(view.xyz,1.)).xyz;
    vec3 ray=normalize(world-eye);float distanceToSurface=min(length(world-eye),520.);
    // Clip the integration to the low atmospheric layer before taking samples.
    float start=0.,finish=distanceToSurface;
    if(abs(ray.y)>.0001){float a=(-3.-eye.y)/ray.y,b=(20.-eye.y)/ray.y;start=max(0.,min(a,b));finish=min(finish,max(a,b));}
    float stepSize=max(0.,finish-start)/32.;float transmission=1.;vec3 scattering=vec3(0.);
    float jitter=hash(vec3(gl_FragCoord.xy,1.));
    for(int i=0;i<32;i++){
     vec3 p=eye+ray*(start+(float(i)+jitter)*stepSize);float amount=1.-exp(-density(p)*stepSize);
     float light=.75+.25*noise3(p*.045+vec3(0.,1.,0.));
     vec3 color=mix(mix(vec3(.008,.016,.029),vec3(.038,.060,.095),light),mix(vec3(.18,.255,.24),vec3(.47,.55,.49),light),mistDaylight);
     scattering+=transmission*amount*color;transmission*=1.-amount;
    }
    gl_FragColor=vec4(surface*transmission+scattering,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
  if(field==='deep')this.material.fragmentShader=this.material.fragmentShader.replace(/float density\(vec3 p\)\{[\s\S]*?\n   \}/,deepForestMistDensityGLSL).replace('(-3.-eye.y)','(-12.-eye.y)').replace('(20.-eye.y)','(34.-eye.y)').replaceAll('/32.','/48.').replace('i<32','i<48');
  this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.material);this.quad.frustumCulled=false;this.pass.add(this.quad);
 }
 render(renderer:T.WebGLRenderer,scene:T.Scene,camera:T.PerspectiveCamera,time:number,daylight=1){
  const size=renderer.getDrawingBufferSize(new T.Vector2());if(this.target.width!==size.x||this.target.height!==size.y)this.target.setSize(size.x,size.y);
  camera.updateMatrixWorld();const u=this.material.uniforms;u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);u.eye.value.copy(camera.position);u.mistTime.value=time;u.mistDaylight.value=daylight;
  renderer.setRenderTarget(this.target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(this.pass,this.camera);
 }
 dispose(){this.target.dispose();this.quad.geometry.dispose();this.material.dispose();this.pass.clear();}
}
