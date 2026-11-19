"""Render the actual skinned Dawnwing asset in its studio scene."""
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
RIGGED = ROOT / "assets-source/creatures/dawnwing-pegasus/Rigged"
PREVIEWS = RIGGED / "Previews"
PREVIEWS.mkdir(exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=str(RIGGED / "DawnwingPegasus-Rigged.blend"))
scene = bpy.context.scene
armature = bpy.data.objects["PegasusRig"]
camera = scene.camera
scene.render.resolution_x = 1200
scene.render.resolution_y = 840
scene.render.resolution_percentage = 100
scene.cycles.samples = 16
scene.cycles.use_denoising = True

views = [
    ("Folded", "Idle", 9, (4.65, -5.4, 2.85), (0, -.08, 1.18), 64, 0),
    ("Walking", "Walk", 6, (6.45, -2.1, 2.62), (0, -.05, 1.12), 65, 0),
    ("Flight", "Wingbeat", 8, (4.1, -8.6, 5.8), (0, -.06, 2.18), 52, 1.1),
    ("Portrait", "Idle", 9, (2.35, -3.9, 2.52), (0, -1.04, 1.96), 100, 0),
]
for label, name, frame, viewpoint, target, focal_length, lift in views:
    action = bpy.data.actions[name]
    armature.animation_data.action = action
    armature.animation_data.action_slot = action.slots[0]
    armature.location.z = lift
    scene.frame_set(frame)
    camera.location = viewpoint
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = focal_length
    scene.render.filepath = str(PREVIEWS / f"{label}.png")
    bpy.ops.render.render(write_still=True)
