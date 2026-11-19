from pathlib import Path
import bpy,json,math
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'assets-source/creatures/dawnwing-pegasus'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'native/assets/pegasus/dawnwing.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
# Blender adds an Icosphere custom bone-display helper on import. Validate the
# actual skinned asset meshes rather than that importer-owned display object.
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers)]
assert len(arm.data.bones)==31 and len(meshes)==13
assert all(any(mesh.name.startswith(f'Dawnwing {side} Wing') for mesh in meshes) for side in ('Left','Right'))
triangles=0
for obj in meshes:
    obj.data.calc_loop_triangles();triangles+=len(obj.data.loop_triangles)
    for v in obj.data.vertices:
        assert all(math.isfinite(x) for x in v.co)
        assert 1<=len([g for g in v.groups if g.weight>0])<=4
        assert abs(sum(g.weight for g in v.groups)-1)<.015
assert triangles<150000
assert len(bpy.data.images)>=5
assert any(image.name.startswith('Dawnwing_Eye_BaseColor') and image.packed_file for image in bpy.data.images)
for part in ('Pegasus_dark_wet_eyes','Pegasus_soft_eyelid_margins'):
    surface=next(mesh for mesh in meshes if mesh.name.startswith(part))
    assert len(surface.data.polygons)>150
    for vertex in surface.data.vertices:
        assert len(vertex.groups)==1
        assert surface.vertex_groups[vertex.groups[0].group].name=='Head'
actions={}
for action in bpy.data.actions:
    for name in ['Idle','Walk','Trot','Jump','Takeoff','Wingbeat','Glide']:
        if action.name.endswith(name):actions[name]=action
assert len(actions)==7,actions.keys()
poses={}
wing_samples={}
for name,action in actions.items():
    arm.animation_data_create();arm.animation_data.action=action
    for track in arm.animation_data.nla_tracks:track.mute=True
    # Imported action slots are selected explicitly in current Blender.
    if hasattr(action,'slots') and action.slots:arm.animation_data.action_slot=action.slots[0]
    maxima=Vector((0,0,0));minima=Vector((0,0,0))
    wing_samples[name]=[]
    for t in [0,.25,.5,.75,1.0]:
        frame=action.frame_range[0]+(action.frame_range[1]-action.frame_range[0])*t
        bpy.context.scene.frame_set(int(frame),subframe=frame%1)
        deps=bpy.context.evaluated_depsgraph_get()
        points=[]
        for obj in meshes:
            posed=obj.evaluated_get(deps)
            surface=[posed.matrix_world@v.co for v in posed.data.vertices]
            points.extend(surface)
        wing_samples[name].append([
            arm.pose.bones[f'Wing.{side}.{joint}'].rotation_quaternion.copy()
            for side in ('L','R') for joint in range(1,5)
        ])
        assert all(math.isfinite(x) for p in points for x in p)
        low=Vector(tuple(min(p[i] for p in points) for i in range(3)))
        high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
        assert max(high-low)<10 and high.z<6 and low.z>-.6,(name,tuple(low),tuple(high))
        maxima=Vector(tuple(max(maxima[i],high[i]) for i in range(3)))
        minima=Vector(tuple(min(minima[i],low[i]) for i in range(3)))
    poses[name]={'min':list(minima),'max':list(maxima)}
def span(name):
    return poses[name]['max'][0]-poses[name]['min'][0]

for name in ['Idle','Walk','Trot','Jump']:
    assert span(name)>3.9,(name,span(name))
    assert poses[name]['min'][2]>-.055,(name,poses[name])
    for sample in wing_samples[name]:
        assert all(abs(first.dot(current))>.99999 for first,current in zip(wing_samples['Idle'][0],sample)),name
assert any(abs(first.dot(current))<.98 for sample in wing_samples['Wingbeat']
           for first,current in zip(wing_samples['Wingbeat'][0],sample))
assert span('Glide')>3.7 and span('Wingbeat')>3.7
assert 2.15<poses['Idle']['max'][2]<2.55,poses['Idle']
report={'bones':len(arm.data.bones),'meshes':len(meshes),'triangles':triangles,'animations':list(actions),'sampled_pose_bounds':poses,'checks':['Native GLB reimports with one 31-bone skeleton and thirteen skinned meshes','Both independent wing meshes are retained','Every vertex has one to four normalized finite skin weights','Coat and feather maps and the new iris texture are retained','Corneas and eyelid margins follow the head as rigidly attached surfaces','All seven clips have finite bounded deformation','The ground clips share one fixed open wing pose and Wingbeat animates the wings','Game model below 150k triangles'],'limitations':['Gait contact is authored on level ground','Android performance not measured']}
(BASE/'Rigged/validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('RIGGED PEGASUS VALIDATED',json.dumps(report),flush=True)
