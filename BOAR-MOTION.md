# Boar movement prototype

This adds a walk-in-place loop and a wind-up / forward lunge / upward tusk attack to the existing model. It reuses the packed materials without rebaking them. No AI, damage detection, navigation or game encounter is added yet.

Open `OPEN-MOVEMENT-VIEWER.html` in a WebGL-capable browser. Use Walk, Rest and Tusk attack; the attack plays once and can be repeated. Save GLB downloads the animated asset. The viewer has not been visually tested in a browser in this session. The exported animation is checked directly with Three.js AnimationMixer, including its moving feet, loop closure, head rotation and whole-model bounds. Low-resolution Blender pose renders provide a separate visual check.

`ash-tusk-boar-motion.glb` contains named **Walk** and **TuskAttack** clips. Its units are metres, Y up, facing +Z. The walk lasts about 1.33 seconds. The attack lasts about 1.33 seconds and returns to its original position. Use one-shot playback for the attack and repeat for walking. Gameplay should trigger damage only around the upward strike, rather than throughout the clip.

`ash-tusk-boar-motion.blend` is the editable animation source. At 24 fps, frames 1–33 contain the walk, 49–81 contain the attack and frame 40 is the resting pose. NLA tracks are named for their exported clips.

The user subsequently allowed bones. The already-built prototype was retained to avoid restarting: it uses ten body vertex poses and object transforms for head details, fur and hooves, without a skeleton. This is a simple movement test, with stiff joints and limited foot planting; it is not the final production animation or the finished sculpt from the reference sheet. The original static asset is preserved separately. Packed texture images are included inside both model files.

Rebuild from the repository root after the static model exists:

```powershell
blender --background --python scripts/blender/animate_boar_prototype.py -- "<absolute project path>" --preview
node scripts/build-boar-viewer.mjs --motion
node scripts/check-boar-motion.mjs
python scripts/package-boar-motion.py
```
