import * as T from 'three';
import {plantCollection} from './vegetation';
import {groundMaterial,trailMaterial,weatheredRockGeometry,weatheredRockMaterial} from './landscape';
import {deepForest,deepForestHeight as h,deepForestPlacements,forestPatchNoise,forestTrails,forestTrailDistance,forestClearings,deepForestHeightGLSL} from './deep-forest-layout';
import {sampleDayCycle,type DayCycleState} from './day-cycle';

export function deepForestTerrain(size=deepForest.terrainSize,spacing=2.4){
 const geo=new T.PlaneGeometry(size,size,Math.ceil(size/spacing),Math.ceil(size/spacing));geo.rotateX(-Math.PI/2);const p=geo.getAttribute('position'),colors:number[]=[],cover:number[]=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),patch=forestPatchNoise(x*.04,z*.04),fine=forestPatchNoise(x*.3,z*.3),c=new T.Color('#514a3b').lerp(new T.Color('#344134'),patch*.7);p.setY(i,h(x,z));c.multiplyScalar(.84+fine*.22);colors.push(c.r,c.g,c.b);cover.push(.12+patch*.35,.95);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('groundCover',new T.Float32BufferAttribute(cover,2));geo.computeVertexNormals();return geo;
}

/** Canopy absorption affects light, without altering visibility or washing out trees. */
export function deepCanopyShading(scene:T.Scene){
 const state:DayCycleState=scene.userData.dayCycle??sampleDayCycle(0),strength={value:state.solarStrength},time={value:0};
 const seen=new Set<T.Material>();scene.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(!(m instanceof T.MeshStandardMaterial)||seen.has(m))continue;seen.add(m);const previous=m.onBeforeCompile,cache=m.customProgramCacheKey();
  m.onBeforeCompile=(s,r)=>{previous.call(m,s,r);s.uniforms.deepSunStrength=strength;s.uniforms.deepSunDirection={value:state.sunDirection};s.uniforms.deepSunColor={value:state.lightColor};s.uniforms.deepTime=time;s.vertexShader='varying vec3 deepWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 deepLocal=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    deepLocal=instanceMatrix*deepLocal;
   #endif
   deepWorld=(modelMatrix*deepLocal).xyz;`);
   s.fragmentShader=`varying vec3 deepWorld;uniform vec3 deepSunDirection;uniform vec3 deepSunColor;uniform float deepSunStrength;uniform float deepTime;
    float deepHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float deepNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(deepHash(i),deepHash(i+vec2(1,0)),f.x),mix(deepHash(i+vec2(0,1)),deepHash(i+vec2(1,1)),f.x),f.y);}
    `+deepForestHeightGLSL+'\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    float opening=0.;${forestClearings.map(c=>`opening=max(opening,1.-smoothstep(${(c.r-5).toFixed(2)},${(c.r+7).toFixed(2)},length(deepWorld.xz-vec2(${c.x.toFixed(1)},${c.z.toFixed(1)}))));`).join('')}
    float belowCanopy=1.-smoothstep(8.,14.,deepWorld.y-forestGround(deepWorld.xz));reflectedLight.directDiffuse*=mix(1.,mix(.45,.82,opening),belowCanopy);reflectedLight.indirectDiffuse*=mix(1.,.90,belowCanopy);
    // A small leaf-transmission term survives overlapping opaque crown shadows.
    // Project along sunlight so the scattered light patches follow the moving sun.
    vec2 deepProjected=deepWorld.xz-deepWorld.y*deepSunDirection.xz/max(deepSunDirection.y,.15);
    vec2 deepDrift=vec2(sin(deepTime*.08),cos(deepTime*.06))*.08;
    float sunfleck=smoothstep(.64,.84,deepNoise(deepProjected*.27+deepDrift)*.7+deepNoise(deepProjected*.67)*.3);
    float leafTransmission=.035+.22*sunfleck;
    float leafFacing=max(0.,dot(normal,normalize(mat3(viewMatrix)*deepSunDirection)));
    reflectedLight.directDiffuse+=diffuseColor.rgb*deepSunColor*deepSunStrength*leafTransmission*leafFacing*belowCanopy*(1.-opening*.65);`);
  };m.customProgramCacheKey=()=>cache+'-deep-canopy-v2';m.needsUpdate=true;
 }});
 return (seconds:number)=>{strength.value=state.solarStrength;time.value=seconds;};
}

export function buildDeepForest(scene:T.Scene,collision:T.Group){
 const terrain=deepForestTerrain(),ground=new T.Mesh(terrain,groundMaterial());ground.name='Old forest soil and rolling hollows';ground.receiveShadow=true;scene.add(ground);collision.add(new T.Mesh(terrain));
 const placements=deepForestPlacements(),trees=plantCollection(scene,placements.trees,{range:460,detailedRange:72,cellSize:48,widthScale:1.2}),floor=plantCollection(scene,placements.floor,{range:100,detailedRange:32,cellSize:32});trees.setQuality('high');floor.setQuality('high');
 const trunk=new T.CylinderGeometry(1,1,1,8);
 for(const p of placements.trees){if(Math.hypot(p.x,p.z)>deepForest.radius+10)continue;const solid=new T.Mesh(trunk);solid.position.set(p.x,h(p.x,p.z)+2.2,p.z);solid.scale.set(.20*p.scale*1.2,4.8,.20*p.scale*1.2);collision.add(solid);}
 const pathMat=trailMaterial();pathMat.color.set('#59513f');
 for(const points of forestTrails){const vertices:number[]=[],indices:number[]=[],uv:number[]=[];points.forEach((p,i)=>{const d=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize(),width=1.8+.2*Math.sin(i*.2);for(let j=0;j<5;j++){const t=(j/4-.5)*2,x=p.x+d.z*width*t,z=p.z-d.x*width*t;vertices.push(x,h(x,z)+.045,z);uv.push(j/4,i/(points.length-1));}if(i<points.length-1)for(let j=0;j<4;j++){const a=i*5+j;indices.push(a,a+5,a+1,a+1,a+5,a+6);}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,pathMat);mesh.name='Unmarked woodland trail';mesh.receiveShadow=true;scene.add(mesh);}
 const rockGeo=weatheredRockGeometry(6),rockMat=weatheredRockMaterial();rockMat.color.set('#8a8b7d');const rocks=new T.InstancedMesh(rockGeo,rockMat,170),dummy=new T.Object3D();let count=0,seed=1883;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let attempt=0;attempt<2000&&count<170;attempt++){const a=random()*Math.PI*2,r=Math.sqrt(random())*280,x=Math.cos(a)*r,z=Math.sin(a)*r;if(forestTrailDistance(x,z)<4||Math.hypot(x,z-216)<10)continue;dummy.position.set(x,h(x,z)-.18,z);dummy.rotation.set((random()-.5)*.2,random()*Math.PI*2,(random()-.5)*.14);const scale=.4+random()*1.6;dummy.scale.set(scale*1.3,scale*.8,scale);dummy.updateMatrix();rocks.setMatrixAt(count++,dummy.matrix);const solid=new T.Mesh(rockGeo);solid.matrixAutoUpdate=false;solid.matrix.copy(dummy.matrix);collision.add(solid);}
 rocks.count=count;rocks.castShadow=rocks.receiveShadow=true;rocks.computeBoundingSphere();scene.add(rocks);
 // Boundary collision is buried in the outer ridge and dense scenery, never shown as walls.
 const boundary=new T.BoxGeometry(1,1,1);for(let i=0;i<96;i++){const a=i/96*Math.PI*2,b=new T.Mesh(boundary);b.position.set(Math.sin(a)*270,20,Math.cos(a)*270);b.rotation.y=a;b.scale.set(19,80,2);collision.add(b);}
 const updateCanopy=deepCanopyShading(scene);scene.userData.deepForest={trees:placements.trees.length,floorPlants:placements.floor.length,span:deepForest.radius*2,varieties:5,clearings:forestClearings.length,rocks:count};
 return {stats:scene.userData.deepForest,update(time:number,camera:T.Vector3){updateCanopy(time);trees.update(time,camera);floor.update(time,camera);},dispose(){trees.dispose();floor.dispose();}};
}
