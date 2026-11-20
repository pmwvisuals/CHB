"""Check the buyer scene and both exports, including from an extracted ZIP."""
from pathlib import Path
import hashlib
import json
import math
import struct
import sys

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
folder = Path(sys.argv[sys.argv.index("--") + 1]) if "--" in sys.argv else ROOT / "assets-source/creatures/dawnwing-pegasus/release"
bpy.ops.wm.open_mainfile(filepath=str(folder / "Blender/DawnwingPegasus.blend"))
rig = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
assert len(bpy.data.objects) == 14 and len(meshes) == 13
assert len(rig.data.bones) == 31
assert set(collection.name for collection in bpy.data.collections) == {"Horse and rig", "Wings", "Tack"}
assert len(bpy.data.actions) == 7
assert len(bpy.data.images) == 5
assert all(image.packed_file and image.filepath.replace("\\", "/").startswith("//../Textures/")
           for image in bpy.data.images)
for image in bpy.data.images:
    resolved = Path(bpy.path.abspath(image.filepath)).resolve()
    assert resolved.is_relative_to(folder.resolve())
    assert hashlib.sha256(bytes(image.packed_file.data)).digest() == hashlib.sha256(resolved.read_bytes()).digest()
source = {"passed": True, "objects": 14, "meshes": 13, "bones": 31,
          "packed_and_external_texture_matches": 5, "relative_texture_paths": True,
          "only_asset_collections": True, "actions": sorted(action.name for action in bpy.data.actions)}
reports = folder / "Reports"
(reports / "source-validation.json").write_text(json.dumps(source, indent=2) + "\n", encoding="utf-8")

models = {}
for filename in ("Dawnwing_Full.glb", "Dawnwing_Game.glb"):
    file = folder / "Models" / filename
    raw = file.read_bytes()
    json_size = struct.unpack_from("<I", raw, 12)[0]
    gltf = json.loads(raw[20:20 + json_size])
    triangles = sum(gltf["accessors"][primitive["indices"]]["count"] // 3
                    for mesh in gltf["meshes"] for primitive in mesh["primitives"])
    assert len(gltf["skins"]) == 1 and len(gltf["skins"][0]["joints"]) == 31
    assert len(gltf["images"]) == 5 and all("bufferView" in image and "uri" not in image for image in gltf["images"])
    assert all("uri" not in buffer for buffer in gltf["buffers"])
    assert len(gltf["meshes"]) == 13
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(file))
    rig = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"
              and any(modifier.type == "ARMATURE" for modifier in obj.modifiers)]
    for obj in meshes:
        textured = any(node.type == "TEX_IMAGE" for material in obj.data.materials if material
                       for node in material.node_tree.nodes)
        assert obj.data.uv_layers or not textured
        for vertex in obj.data.vertices:
            assert 1 <= len(vertex.groups) <= 4
            assert abs(sum(group.weight for group in vertex.groups) - 1) < .015
    animation_names = {action.name: action for action in bpy.data.actions}
    assert set(animation_names) == {"Idle", "Walk", "Trot", "Jump", "Takeoff", "Wingbeat", "Glide"}
    wing_reference = None
    sampled_frames = 0
    for name, action in animation_names.items():
        rig.animation_data_create()
        rig.animation_data.action = action
        rig.animation_data.action_slot = action.slots[0]
        for track in rig.animation_data.nla_tracks:
            track.mute = True
        for fraction in np.linspace(0, 1, 9):
            frame = action.frame_range[0] + fraction * (action.frame_range[1] - action.frame_range[0])
            bpy.context.scene.frame_set(math.floor(frame), subframe=frame % 1)
            deps = bpy.context.evaluated_depsgraph_get()
            for obj in meshes:
                posed = obj.evaluated_get(deps)
                vertices = np.empty(len(posed.data.vertices) * 3, np.float32)
                posed.data.vertices.foreach_get("co", vertices)
                assert np.isfinite(vertices).all() and np.abs(vertices).max() < 12
            if name in {"Idle", "Walk", "Trot", "Jump"}:
                wing_pose = [rig.pose.bones[f"Wing.{side}.{joint}"].rotation_quaternion.copy()
                             for side in ("L", "R") for joint in range(1, 5)]
                if wing_reference is None:
                    wing_reference = wing_pose
                assert all(abs(first.dot(current)) > .99999 for first, current in zip(wing_reference, wing_pose))
            sampled_frames += 1
    models[filename] = {"triangles": triangles, "mesh_groups": len(meshes), "bones": 31,
                        "animations": sorted(animation_names), "sampled_animation_frames": sampled_frames,
                        "embedded_maps": 5, "normalized_weights": True, "ground_wings_open": True}
assert models["Dawnwing_Game.glb"]["triangles"] < models["Dawnwing_Full.glb"]["triangles"]
assert models["Dawnwing_Game.glb"]["triangles"] == 124126
report = {"passed": True, "models": models, "tested_importers": ["Blender 5.2.3 glTF"]}
(reports / "gltf-validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("DAWNWING BUYER FILES VALIDATED", json.dumps(report), flush=True)
