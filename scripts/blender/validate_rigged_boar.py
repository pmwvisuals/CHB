"""Round-trip rigged GLB and FBX, evaluate a strike and render the actual GLB."""
import bpy,sys,json
import numpy as np
from pathlib import Path
runtime='--runtime' in sys.argv or '--polished' in sys.argv;variant='polished' if '--polished' in sys.argv else 'runtime' if runtime else 'rigged'
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar'/variant;stem='ash-tusk-boar-'+variant;source=out/(stem+'.blend')
def curves(action):
 return [fc for layer in action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]
def imported(fmt):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if fmt=='fbx':bpy.ops.import_scene.fbx(filepath=str(out/(stem+'.fbx')))
 else:bpy.ops.import_scene.gltf(filepath=str(out/(stem+'.glb')),disable_bone_shape=True)
 scene=bpy.context.scene;arms=[o for o in scene.objects if o.type=='ARMATURE'];assert len(arms)==1;arm=arms[0];assert len(arm.data.bones)==21
 meshes=[o for o in scene.objects if o.type=='MESH'];assert len(meshes)==5,[(o.name,len(o.data.vertices)) for o in meshes]
 assert all(any(m.type=='ARMATURE' and m.object==arm for m in o.modifiers) for o in meshes)
 actions=list(bpy.data.actions);assert len(actions)==3
 for name in ['Idle','Walk','TuskAttack']:assert any(name in a.name for a in actions)
 triangles=0
 for ob in meshes:ob.data.calc_loop_triangles();triangles+=len(ob.data.loop_triangles)
 assert (70000<triangles<120000) if runtime else triangles==json.loads((out/'rig-quality-report.json').read_text()).get('triangles',790996)
 action=next(a for a in actions if 'TuskAttack' in a.name)
 if not arm.animation_data:arm.animation_data_create()
 for track in arm.animation_data.nla_tracks:track.mute=True
 arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
 lo,hi=action.frame_range;scene.frame_set(round(lo+(hi-lo)*.53));bpy.context.view_layer.update()
 deps=bpy.context.evaluated_depsgraph_get();bounds_lo=np.full(3,np.inf);bounds_hi=-bounds_lo
 for ob in meshes:
  ev=ob.evaluated_get(deps);data=ev.to_mesh();p=np.array([tuple(ev.matrix_world@v.co) for v in data.vertices]);assert np.isfinite(p).all();bounds_lo=np.minimum(bounds_lo,p.min(axis=0));bounds_hi=np.maximum(bounds_hi,p.max(axis=0));ev.to_mesh_clear()
 size=bounds_hi-bounds_lo;assert 2<size[0]<4 and 4<size[1]<6.8 and 2.5<size[2]<4.5;assert bounds_lo[2]>-.06
 return {'bones':len(arm.data.bones),'meshes':len(meshes),'triangles':triangles,'actions':[a.name for a in actions],'strike_bounds_blender_m':[bounds_lo.tolist(),bounds_hi.tolist()]}
fbx=imported('fbx');print('FBX VALIDATED',json.dumps(fbx),flush=True);glb=imported('glb')
with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.collections=['STUDIO · excluded from exports'];dst.worlds=['Neutral studio']
scene=bpy.context.scene;scene.collection.children.link(dst.collections[0]);scene.world=dst.worlds[0];scene.camera=next(o for o in dst.collections[0].objects if o.type=='CAMERA');scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_x=1024;scene.render.resolution_y=768;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'exported-strike.png');bpy.ops.render.render(write_still=True)
(out/'interchange-checks.json').write_text(json.dumps({'fbx':fbx,'glb':glb,'render':'Actual re-imported GLB, sampled at upward strike','browserUIVisuallyTested':False},indent=2));print('ROUND TRIP PASS',flush=True)
