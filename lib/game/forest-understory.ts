import * as T from 'three';
import {groundHeight} from './data';
import {insideTempleGrounds} from './sanctuary-layout';
import {roadCover} from './ground-surface';
import {forestDepth,forestEdge,forestPatch} from './forest-border-layout';
import {gardenGrass,plantCollection,type PlantPlacement} from './vegetation';
import {insideCamp} from './camp-boundary';

export function forestUnderstoryPlacements(){
 let seed=91871;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const plants:PlantPlacement[]=[],grass:PlantPlacement[]=[];
 // Both layers share the same patch field: thickets contain shrubs and taller
 // grass, with fern drifts between them and occasional bare woodland floor.
 for(let attempt=0;attempt<115000&&(grass.length<34000||plants.length<5500);attempt++){
  const angle=random()*Math.PI*2,inner=forestEdge(angle),radius=Math.sqrt(inner*inner+random()*((inner+34)**2-inner*inner)),x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  const patch=forestPatch(x,z);if(forestDepth(x,z)<0||!insideCamp(x,z,3)||insideTempleGrounds(x,z,1)||roadCover(x,z)>.025||random()>.32+.68*patch)continue;
  const y=groundHeight(x,z),rotation=random()*Math.PI*2;
  if(grass.length<34000)grass.push({id:patch>.6&&random()<.33?'forest_bracken':'camp_grass',x,y,z,rotation,scale:.65+random()*.85});
  if(plants.length<5500&&random()<.23){const choice=random(),id=patch>.48&&choice<.24?'forest_bramble':choice<.58?'forest_fern':choice<.9?'forest_bracken':'forest_litter';plants.push({id,x,y:y-.025,z,rotation,scale:id==='forest_bramble'?.42+random()*.42:.6+random()*.85});}
 }
 return {plants,grass};
}

export function buildForestUnderstory(scene:T.Scene){
 const placements=forestUnderstoryPlacements(),shrubs=plantCollection(scene,placements.plants,{range:125,detailedRange:32});shrubs.setQuality('high');
 const blades=gardenGrass(),cells=new Map<string,PlantPlacement[]>();
 for(const p of placements.grass){const key=`${Math.floor(p.x/20)}:${Math.floor(p.z/20)}`;const list=cells.get(key)||[];list.push(p);cells.set(key,list);}
 const batches:{group:T.Group;center:T.Vector3}[]=[],dummy=new T.Object3D(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),tilt=new T.Quaternion(),turn=new T.Quaternion();
 for(const list of cells.values()){
  const group=new T.Group();group.name='Dense forest grasses';const short=list.filter(p=>p.id==='camp_grass'),tall=list.filter(p=>p.id!=='camp_grass');
  for(const [points,geometry] of [[short,blades.garden],[tall,blades.wisps]] as const){if(!points.length)continue;const mesh=new T.InstancedMesh(geometry,blades.material,points.length);mesh.name='Forest floor grass';
   points.forEach((p,i)=>{const d=.3;normal.set(groundHeight(p.x-d,p.z)-groundHeight(p.x+d,p.z),d*2,groundHeight(p.x,p.z-d)-groundHeight(p.x,p.z+d)).normalize();tilt.setFromUnitVectors(up,normal);turn.setFromAxisAngle(up,p.rotation);dummy.quaternion.copy(tilt).multiply(turn);dummy.position.set(p.x,p.y-.012,p.z);dummy.scale.set(p.scale,p.scale*(p.id==='camp_grass'?1:1.2),p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
   mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
  }
  const center=new T.Vector3();list.forEach(p=>center.add(new T.Vector3(p.x,p.y,p.z)));center.divideScalar(list.length);group.visible=false;scene.add(group);batches.push({group,center});
 }
 return {stats:{bushes:placements.plants.filter(p=>p.id==='forest_bramble').length,ferns:placements.plants.filter(p=>p.id==='forest_fern'||p.id==='forest_bracken').length,grassClumps:placements.grass.length},update(time:number,camera?:T.Vector3){shrubs.update(time,camera);blades.update(time);if(camera)for(const b of batches)b.group.visible=Math.hypot(camera.x-b.center.x,camera.z-b.center.z)<78;},dispose(){shrubs.dispose();}};
}
