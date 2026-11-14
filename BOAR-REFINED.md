# Ash-Tusk Boar — coat and brow refinement

This revision continues the existing dark boar. The previous polished source and three-level game asset are preserved separately. No scars, armor or decorative features were added.

The body bristles are longer and fuller, with tapered tips and darker embedded roots. Mane lengths vary to soften their uniform outline. A shallow forehead taper and continuous brow plane refine the face while preserving the connected lower jaw and seated tusk roots. The existing 4K base-color atlas gains restrained grain and tonal variation; roughness and normal maps retain their previous content.

The model remains **104,660 triangles**, **five exported material groups**, **21 bones** and **5,900 mesh bristle strands**. Mesh topology, skin weights and the Idle, Walk and TuskAttack clips are retained. This is a bounded groom/surface refinement of the existing triangulated model, not a new sculpt or hand-retopologized cage. Further art review is still needed before presenting it as a finished commercial character.

## Included files

- `ash-tusk-boar-refined.blend`: editable rigged source with packed maps.
- `ash-tusk-boar-refined.glb`: portable skinned model with all three animations and embedded maps.
- `ash-tusk-boar-refined.fbx`: alternate animated interchange export.
- `textures/`: external 4K base-color, normal and roughness maps. Base color uses sRGB; normal and roughness are linear.
- `OPEN-MODEL.html`: self-contained viewer using the actual GLB, with orbit, animation and download controls.
- Studio previews and validation reports, including a render of the re-imported GLB during its strike.

The GLB uses Y up, facing +Z, metre scale. Blender uses Z up, facing −Y. The viewer's source scripts and embedded model bytes are checked; this revision's viewer UI has not been tested interactively.

## Verification and limits

Checks cover normalized skin weights, five skinned groups, three embedded maps, finite deformation bounds and 51 animation samples. Walk loops join continuously; the head moves during attack while support feet remain planted. Head checks confirm one connected manifold skin, a seated mouth crease and embedded tusk roots at seven rest/walk/attack poses. Both GLB and FBX are re-imported to check the skeleton, three actions and strike bounds. Texture payloads are checked separately to ensure the revised base color is actually embedded.

This is delivered as a separate model revision. The camp APK and the existing three-level game asset have not been replaced by this package. Device performance, new distance meshes for this revision and marketplace acceptance are not established by these checks. No distribution license has been selected for selling the model; the included Three.js viewer retains its MIT notice.

Rebuild from the repository with the previous polished source present:

```sh
blender --background --factory-startup --python scripts/blender/refine_boar_coat.py -- "<absolute repository path>"
node scripts/build-refined-boar-viewer.mjs
node scripts/check-rigged-boar.mjs --refined
blender --background --factory-startup --python scripts/blender/validate_boar_head.py -- "<absolute repository path>" --refined
blender --background --factory-startup --python scripts/blender/validate_rigged_boar.py -- "<absolute repository path>" --refined
python scripts/package-refined-boar.py
```

The editable model opens independently; the rebuild script depends on the previous polished source and repository export helper.
