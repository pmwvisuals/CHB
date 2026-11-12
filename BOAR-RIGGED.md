# Rigged clean boar

The clean dark boar now has a 21-bone skeleton with baked **Idle**, **Walk** and **TuskAttack** clips. Its original geometry, ivory tusks, natural coat and packed 4K PBR maps are preserved. No scars, armour or other decoration were added. Earlier static and movement-prototype files are unchanged.

## Contents and playback

- `ash-tusk-boar-rigged.blend`: editable skin, parts, weights, skeleton and three NLA tracks. Blender 5.2 source, Z up, facing −Y, metre units. Bone transforms are sampled; no external rigging add-on is required. At 24 fps, Walk occupies frames 1–33, TuskAttack 49–81 and Idle 97–145. Frame 40 shows the bind pose.
- `ash-tusk-boar-rigged.glb`: five skinned mesh groups, up to four influences per vertex, embedded textures and all three named clips. Y up, facing +Z. Use this for portable playback.
- `ash-tusk-boar-rigged.fbx`: the same skeleton and sampled clips for interchange, with embedded maps. FBX take names can include the armature name. Importer material support varies; reconnect the coat's BristleTint vertex colour if necessary.
- `textures/`: base colour, roughness and tangent normal maps, copied unchanged from the clean version. Base colour is sRGB; roughness and normal are linear.
- `OPEN-ANIMATION.html`: standalone viewer of the actual animated GLB. Select Idle, Walk or Tusk attack; the attack is one-shot. Drag to orbit, scroll to zoom, Save GLB to extract the asset. The viewer UI has not been visually tested; exported animation is evaluated directly using Three.js.
- `rest.png`, `walk.png`, `strike.png`: Blender pose renders; `exported-strike.png` is rendered after re-importing the GLB.
- JSON reports contain source/export checks and sampled bone/geometry positions.

Idle lasts 2 seconds. Walk and TuskAttack each last 1⅓ seconds. Walk is an in-place four-beat cycle; gameplay supplies travel along the ground. The tusk attack has a short wind-up, forward brace, upward head sweep and recovery to rest. Play it once; damage timing and collision belong in the game's combat system. The upward strike peaks around 0.7 seconds.

## Source editing and scope

The skeleton is reusable and the weights editable. Two-segment leg solving was baked into bone transforms so the exports need no IK constraints. Support feet are held at a fixed height; the walk's recovery phase lifts each hoof. Each solid fur strand inherits skin weights sampled at its root. The hidden native Hair Curves remain editable in the rest pose; animation uses the skinned mesh coat.

This remains a **high-detail asset at 790,996 triangles**, including solid-strand fur. It is not yet a reduced game mesh or a tested crowd of creatures. No AI, navigation, damage logic or encounter was added. These first skeletal clips are a reusable animation foundation; marketplace acceptance and a final game-performance budget are not established by structural validation.

All meshes and maps were authored for this project, with no downloaded creature or texture pack included. The viewer uses Three.js; its MIT licence accompanies the package. No redistribution licence has been selected for your own model; set your listing and licence terms when distributing it.

## Rebuild

The rig script needs the clean `.blend` and its `quality-report.json`; it does not rebuild materials or fur. The delivered rigged `.blend` opens independently.

```powershell
blender --background --python scripts/blender/rig_clean_boar.py -- "<absolute project path>"
node scripts/build-boar-viewer.mjs --rigged
node scripts/check-rigged-boar.mjs
blender --background --python scripts/blender/validate_rigged_boar.py -- "<absolute project path>"
python scripts/package-rigged-boar.py
```
