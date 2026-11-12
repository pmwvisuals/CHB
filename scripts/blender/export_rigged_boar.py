"""Shared export step; can re-export the saved rig without rebuilding or rendering."""
import bpy,sys
from pathlib import Path

def export_rig(scene,parts,arm,out):
 scene.frame_set(40)
 for pb in arm.pose.bones:pb.matrix_basis.identity()
 bpy.context.view_layer.update()
 export=bpy.data.collections.new('TEMP · skinned mesh export');scene.collection.children.link(export);groups={}
 for ob in parts:
  copy=ob.copy();copy.data=ob.data.copy();export.objects.link(copy);groups.setdefault(copy.data.materials[0].name,[]).append(copy)
 selected=[]
 for mat,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for ob in objects:ob.select_set(True)
  bpy.context.view_layer.objects.active=objects[0]
  if len(objects)>1:bpy.ops.object.join()
  ob=bpy.context.object;ob.name='Skinned '+mat;selected.append(ob)
 bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
 for ob in selected:ob.select_set(True)
 bpy.context.view_layer.objects.active=arm
 bpy.ops.export_scene.gltf(filepath=str(out/'ash-tusk-boar-rigged.glb'),export_format='GLB',use_selection=True,export_apply=False,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_def_bones=False,export_all_influences=False)
 bpy.ops.export_scene.fbx(filepath=str(out/'ash-tusk-boar-rigged.fbx'),use_selection=True,object_types={'MESH','ARMATURE'},use_mesh_modifiers=False,add_leaf_bones=False,axis_forward='-Z',axis_up='Y',bake_anim=True,bake_anim_use_nla_strips=True,bake_anim_use_all_actions=False,path_mode='COPY',embed_textures=True)
 count=len(selected)
 for ob in list(export.objects):bpy.data.objects.remove(ob,do_unlink=True)
 bpy.data.collections.remove(export)
 return count

if __name__=='__main__':
 root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'assets-source/creatures/ash-tusk-boar/rigged'
 bpy.ops.wm.open_mainfile(filepath=str(out/'ash-tusk-boar-rigged.blend'))
 parts=[o for o in bpy.data.collections['ASSET · Rigged clean boar'].objects if o.type=='MESH']
 print('RE-EXPORTED',export_rig(bpy.context.scene,parts,bpy.data.objects['BoarRig'],out),flush=True)
