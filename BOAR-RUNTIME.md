# Gameplay boar

One reduced version of the clean rigged boar, with roughly 86% fewer triangles. Exact revised counts are in rig-quality-report.json. The head now has a connected lower face, a closed mouth crease, a broader muzzle and rebuilt tusks seated inside the cheeks. The detached lower plate and exposed peg teeth are removed. There are no added scars or decorations.

The body and small details use reduced surfaces with their existing UVs and transferred skin weights. The coat retains 5,900 spatially distributed solid strands, including all 1,400 mane strands. Each strand has fewer segments; short strands are slightly wider to retain coverage. Fine coat density is lower than in the detailed source, so this is a practical visual tradeoff rather than a lossless conversion or hand-retopologized quad mesh.

The source `.blend`, GLB and FBX retain the 21-bone skeleton, five material groups, up to four weights per vertex and packed 4K base colour, roughness and normal maps. GLB is Y up, facing +Z, metre scale. Blender is Z up, facing −Y. Idle lasts 2 seconds; Walk and TuskAttack each last 1⅓ seconds and start at time zero. Walk repeats; attack plays once. Use approximately 0.375 metres/second travel at the default walk playback speed to match its support phase.

Open `OPEN-GAMEPLAY-MODEL.html` to inspect the actual exported GLB and play the clips. The viewer UI has not been visually tested. JSON reports contain actual Three.js skin/animation checks and Blender GLB/FBX round-trip checks. PNGs are Blender renders; exported-strike.png uses the re-imported GLB.

This pass reduces geometry and export size. Frame rate in a populated forest has not been measured, and no creature AI or game encounter has been added. The native editable Hair Curves stay hidden in rest pose; the reduced mesh coat is animated. Source topology is triangulated/decimated rather than a new quad cage. Earlier high-detail assets remain the sculpt/editing source.

Files and maps were authored for this project. The viewer uses Three.js under the included MIT licence. Choose your own model distribution licence when selling the asset. This package does not certify marketplace acceptance.

Rebuild from the repository root with the detailed rigged source present:

```powershell
blender --background --python scripts/blender/optimize_boar.py -- "<absolute project path>"
blender --background --python scripts/blender/validate_boar_head.py -- "<absolute project path>" --runtime
node scripts/build-boar-viewer.mjs --runtime
node scripts/check-rigged-boar.mjs --runtime
blender --background --python scripts/blender/validate_rigged_boar.py -- "<absolute project path>" --runtime
python scripts/package-runtime-boar.py
```
