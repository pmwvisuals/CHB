# Boar anatomy review pass

This is a separate static shape revision of the existing Ash-Tusk Boar. It strengthens the shoulder shield and limb masses, narrows the abdomen, broadens and slightly shortens the head, softens the repeated flank ridges, and revises the orbital relief and jaw opening. Raised detached brow strips have been replaced with relief in the continuous skin. This is an anatomy review, not a finished commercial creature.

The original static and animated model files are preserved separately. This revision does not yet contain retargeted walk or attack animations. It reuses the packed 4K texture maps and deforms the existing mesh fur along with the body. A new fur groom and texture refinement are later stages; the current maps can show stretching after shape changes.

Open `OPEN-ANATOMY-VIEWER.html` in a WebGL-capable browser to orbit the exported GLB. `ash-tusk-boar-anatomy.blend` contains the editable source with a body shape key named **Anatomy refinement**, and `ash-tusk-boar-anatomy.glb` is the evaluated static export. The body shape key retains its original skin coordinates; the other details have been repositioned to follow the new shape. Previous `.blend` files remain the full earlier versions.

`anatomy-clay.png` shows the source model with fur hidden and a clay material, to inspect body shape. The other images retain the existing fur/materials. `anatomy-export-check.png` is rendered from the re-imported actual GLB. All are Blender studio renders, not game screenshots. These images do not demonstrate browser performance. Automated export checks are in `anatomy-quality-report.json`; browser UI remains visually unverified because local-file browser preview is blocked by browser policy.

Rebuild from the repository root with Blender and the existing Node dependencies:

```powershell
blender --background --python scripts/blender/refine_boar_anatomy.py -- "<absolute project path>"
node scripts/check-boar-anatomy.mjs
blender --background --python scripts/blender/validate_boar_anatomy.py -- "<absolute project path>"
node scripts/build-boar-viewer.mjs --anatomy
python scripts/package-boar-anatomy.py
```

Use `--quick` on the refinement command for small shape previews. No new add-on, fur-generation pass, texture bake or changes to the camp are required for this anatomy pass.
