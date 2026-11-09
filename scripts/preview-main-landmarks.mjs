// Export the real landmark geometry for offline visual inspection in Blender.
import {registerHooks} from 'node:module';import {extname} from 'node:path';import fs from 'node:fs';
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!extname(s)?s+'.ts':s,c);}});
const T=await import('three'),{buildTrainingGround}=await import('../lib/game/training-ground.ts'),{buildLakeside}=await import('../lib/game/lakeside.ts'),{terrainGeometry}=await import('../lib/game/landscape.ts');
const scene=new T.Scene(),collision=new T.Group();buildTrainingGround(scene,collision);buildLakeside(scene,collision);
for(const [x,z,w,d] of [[-67,-34,75,65],[74,5,90,100]])scene.add(new T.Mesh(terrainGeometry(w,d,x,z,1.6),new T.MeshStandardMaterial({vertexColors:true})));
scene.updateMatrixWorld(true);const geometries={},materials={},objects=[];
scene.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;const g=o.geometry,m=o.material;geometries[g.uuid]??={p:Array.from(g.attributes.position.array),i:g.index?Array.from(g.index.array):null,c:g.attributes.color?Array.from(g.attributes.color.array):null};materials[m.uuid]??={color:m.color.toArray(),colors:m.vertexColors,metalness:m.metalness,roughness:m.roughness,opacity:m.opacity};objects.push({name:o.parent?.name||o.name,geometry:g.uuid,material:m.uuid,matrix:o.matrixWorld.toArray()});});
const out=new URL('../assets-source/landmarks/',import.meta.url);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(new URL('main-landmarks-preview.json',out),JSON.stringify({geometries,materials,objects}));console.log('Exported',objects.length,'landmark meshes for Blender inspection.');
