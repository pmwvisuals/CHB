"""Prepare a portable buyer scene from Dawnwing's approved open-wing model."""
from pathlib import Path
import hashlib
import json
import shutil

import bpy

ROOT = Path(__file__).resolve().parents[2]
ASSET = ROOT / "assets-source/creatures/dawnwing-pegasus"
SOURCE = ASSET / "Rigged"
RELEASE = ASSET / "release"
for directory in ("Blender", "Models", "Textures", "Previews", "Reports"):
    (RELEASE / directory).mkdir(parents=True, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=str(SOURCE / "DawnwingPegasus-Rigged.blend"))
rig = bpy.data.objects["PegasusRig"]
parts = [obj for obj in bpy.data.objects if obj.type == "MESH"
         and any(modifier.type == "ARMATURE" and modifier.object == rig for modifier in obj.modifiers)]
assert len(parts) == 13
for obj in list(bpy.data.objects):
    if obj not in parts and obj != rig:
        bpy.data.objects.remove(obj, do_unlink=True)
for track in rig.animation_data.nla_tracks:
    track.mute = True
rig.animation_data.action = None
for bone in rig.pose.bones:
    bone.matrix_basis.identity()

scene = bpy.context.scene
scene.camera = None
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1
scene.render.fps = 24
scene.frame_start = 0
scene.frame_end = 72
scene.frame_set(0)
for action in bpy.data.actions:
    action.use_fake_user = True

names = {
    "PEGASUS | original static companion": "Horse and rig",
    "TACK | optional removable riding equipment": "Tack",
    "WINGS | separate feather assemblies": "Wings",
}
for collection in list(bpy.data.collections):
    if collection.name in names:
        collection.name = names[collection.name]
    elif not collection.objects:
        bpy.data.collections.remove(collection)
for obj in [rig, *parts]:
    obj.hide_render = False
    obj.hide_viewport = False
    obj.hide_set(False)

used_images = set()
for obj in parts:
    for material in obj.data.materials:
        if material is None:
            continue
        for node in material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image and any(output.is_linked for output in node.outputs):
                used_images.add(node.image)
assert len(used_images) == 5
image_report = []
for image in used_images:
    original = SOURCE / "Textures" / (image.name + ".png")
    if not original.exists():
        original = ASSET / "Textures" / (image.name + ".png")
    assert original.is_file(), image.name
    destination = RELEASE / "Textures" / original.name
    shutil.copy2(original, destination)
    if image.packed_file:
        image.unpack(method="REMOVE")
    image.filepath = str(destination)
    image.reload()
    image.pack()
    assert hashlib.sha256(bytes(image.packed_file.data)).digest() == hashlib.sha256(destination.read_bytes()).digest()
    image.filepath = "//../Textures/" + destination.name
    for packed in image.packed_files:
        packed.filepath = image.filepath
    image_report.append({"file": destination.name, "size": list(image.size),
                         "color_space": image.colorspace_settings.name})
for material in bpy.data.materials:
    if material.use_nodes:
        for node in list(material.node_tree.nodes):
            if node.type == "TEX_IMAGE" and node.image not in used_images:
                material.node_tree.nodes.remove(node)
for image in list(bpy.data.images):
    if image not in used_images:
        bpy.data.images.remove(image)

bpy.context.view_layer.update()
bpy.ops.object.select_all(action="DESELECT")
for obj in [rig, *parts]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = rig
counts = []
for obj in parts:
    obj.data.calc_loop_triangles()
    counts.append({"name": obj.name, "vertices": len(obj.data.vertices),
                   "triangles": len(obj.data.loop_triangles)})
bounds = [obj.matrix_world @ vertex.co for obj in parts for vertex in obj.data.vertices]
low = [min(point[axis] for point in bounds) for axis in range(3)]
high = [max(point[axis] for point in bounds) for axis in range(3)]
scene.view_settings.view_transform = "AgX"
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_distance = 7
            area.spaces.active.region_3d.view_location = (0, 0, 1.2)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(RELEASE / "Blender/DawnwingPegasus.blend"), relative_remap=False)

shutil.copy2(SOURCE / "DawnwingPegasus-Rigged.glb", RELEASE / "Models/Dawnwing_Full.glb")
shutil.copy2(ROOT / "native/assets/pegasus/dawnwing.glb", RELEASE / "Models/Dawnwing_Game.glb")
for name in ("Standing", "Walking", "Flight", "Portrait", "Wings"):
    shutil.copy2(SOURCE / "Previews" / (name + ".png"), RELEASE / "Previews" / (name + ".png"))
rig_report = json.loads((SOURCE / "rig-report.json").read_text(encoding="utf-8"))
report = {
    "name": "Dawnwing Pegasus", "version": "1.0.0", "units": "metres",
    "blender_forward": "-Y", "gltf_forward": "+Z", "bones": len(rig.data.bones),
    "mesh_count": len(parts), "source_meshes": counts, "bounds_min": low, "bounds_max": high,
    "dimensions_xyz_metres": [high[axis] - low[axis] for axis in range(3)],
    "clips": rig_report["clips"], "textures": sorted(image_report, key=lambda item: item["file"]),
    "ground_wings": "Fixed open pose", "animation_type": "In-place, custom FK deform skeleton",
    "creation": "AI-assisted procedural Blender modeling, texturing and animation",
}
(RELEASE / "Reports/specification.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("BUYER BLENDER PREPARED", sum(item["triangles"] for item in counts), flush=True)
