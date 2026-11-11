# Clean static boar asset

A dark, stylized mythic boar with the refined anatomy, a swept natural coat, fresh neutral hide/ivory/keratin materials and no decorative scar treatment. The old scar-colour attributes were removed and their recessed skin regions locally smoothed. Earlier static, anatomy and motion files are preserved separately.

## Files

- `ash-tusk-boar-clean.blend`: standalone editable source with packed textures and a separate studio collection. The visible ASSET collection contains the model. Unhide the GROOM collection to access the editable native Blender Hair Curves; hide the visible mesh coat while editing the curves. The native centre lines and visible export mesh are separate representations, so edits to curves require regenerating their mesh representation for GLB export.
- `ash-tusk-boar-clean.glb`: static model with embedded PBR textures and mesh fur, Y up, facing +Z. This is the preferred portable preview file.
- `ash-tusk-boar-clean.fbx`: static mesh interchange with embedded maps. Depending on the importing application, connect the fur's BristleTint vertex colour attribute to the material base colour.
- `textures/`: fresh 4096 × 4096 base colour (sRGB), roughness (linear) and tangent-space normal (linear, +Y) maps. The fur uses vertex colour and geometry, not transparency or a Blender-only hair shader.
- `OPEN-MODEL.html`: standalone Three.js viewer loading the actual GLB. Drag to orbit and scroll to zoom. Save GLB downloads the model. The turntable rotates the inspection camera, not the creature.
- PNG images are Blender studio renders. `exported-model.png` uses the re-imported GLB. They are not game screenshots.
- `quality-report.json` gives exact geometry, scale, groom and export-check results.

## Use and scope

Units are metres. Blender source is Z up and faces −Y. This is the large mythic scale used by the project; adjust object scale for another game. It is a high-detail static model, not a rigged or animated product. The previous walk/attack prototype remains in its earlier package and is not included or retargeted here. No creature AI or game integration was added.

The editable skin, jaw, eyes, tusks, hooves and groom remain separate in the source; export parts are grouped by material. The skin is manifold, but the entire fur assembly is not a single watertight printing mesh. Native hair curves require conversion for portable mesh export. Runtime performance with multiple creatures has not been measured. The browser viewer UI has not been visually verified; geometry and files are checked directly, and the GLB is re-imported for its final rendered inspection.

No downloaded mesh, texture pack or reference-sheet image is included. All model geometry and material maps were generated for this project. The included viewer uses Three.js; its MIT licence is included in THIRD-PARTY-NOTICES.txt. Choose the distribution licence and listing terms when selling the asset. The structural checks do not certify marketplace acceptance or photorealism.

## Rebuild tools

The included finish script is part of the repository pipeline: it needs the previous anatomy `.blend` input and the shared bake function in `build_calydonian_boar.py`. The delivered clean `.blend` itself opens independently and contains all its visible geometry, groom centre lines and packed maps. No extra paid add-on or application is needed.

```powershell
blender --background --python scripts/blender/finish_clean_boar.py -- "<absolute project path>"
blender --background --python scripts/blender/validate_clean_boar.py -- "<absolute project path>"
node scripts/build-boar-viewer.mjs --clean
python scripts/package-clean-boar.py
```
