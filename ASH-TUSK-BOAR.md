# Ash-Tusk Boar — static creature review

An original Calydonian-boar-inspired creature, developed against the user's supplied concept sheet. This version is unrigged and contains no animation clips. It is delivered for visual review; it is still more stylized than the reference illustration and is not represented as a finished marketplace asset.

The design uses a heavy shoulder hump, low broad head, four curved aged-ivory tusks, a slightly open toothed jaw, small amber eyes, dark cloven hooves, recessed healed flank scars, and an irregular charcoal mane with muted rust tips. The mane, beard and guard hairs are mesh geometry, rather than a Blender-only particle system.

## Open the asset

- `ash-tusk-boar.blend`: editable source, packed maps, materials and studio lights. The visible model is in the ASSET collection. The hidden SOURCE collection preserves the original continuous quad modelling cage. The STUDIO collection is excluded from exports.
- `ash-tusk-boar.glb`: portable textured static model; textures are embedded. This is the preferred preview/interchange file.
- `ash-tusk-boar.fbx`: static mesh interchange with embedded textures and vertex colours. Some importers require reconnecting the fur vertex-colour attribute to the material base colour.
- `OPEN-MODEL-VIEWER.html`: standalone Three.js viewer of the actual GLB. Open it in a WebGL-capable desktop browser, then drag to orbit and scroll to zoom. The turntable rotates the preview camera; it is not a creature animation.
- `textures/`: 4096 × 4096 base colour, tangent-space normal and roughness PNG maps. Base colour is sRGB; normal and roughness are non-colour data. Fur uses vertex colour, and eyes use separate standard materials.
- PNG previews: Blender studio renders. `exported-glb-three-quarter.png` is rendered from the re-imported GLB, so it checks the exported geometry and materials rather than merely the source scene. These are not game screenshots.

## Scale and geometry

Units are metres. Blender uses Z up and the creature faces −Y; glTF uses Y up and faces +Z. The feet sit at ground level. The creature is deliberately larger than a natural boar, around 2.8 m at the shoulder. Exact bounds, final triangle count, file size and import checks are recorded in `quality-report.json`; the count includes the individual mesh fur strands.

The high-detail static export groups the visible parts by material. The source keeps the parts separate for editing. Its torso, head and four legs form one continuous predominantly quad surface with a preserved low-resolution cage. Separate eyes, tusks, jaw, fur and other details remain independent. The entire assembly is not a single watertight print mesh, and the fur geometry is not suitable for direct deformation without further preparation.

No browser combat integration, skeleton, skin weights, animation, collision mesh or lower-detail variant is included. The game's existing forest and gameplay remain unchanged. Runtime performance with multiple creatures has not been measured. The standalone viewer source is type-checked; the browser UI has not been visually verified in this session.

## Provenance and production status

Geometry and materials were generated in Blender for this project. No downloaded mesh, stock texture or paid add-on is required. The supplied concept sheet guided the visual direction; it is not packaged or used as a model texture.

Before selling this as a production asset, the remaining work is artistic approval against the concept, further sculpt and texture refinement, UV/seam inspection in the intended engine, geometry optimisation for the intended use, and the target marketplace's submission checks. The included automated checks establish export integrity, not marketplace acceptance or a visual match to the reference.

## Rebuild from the repository

Requires Blender with its built-in glTF/FBX exporters, Node.js and the repository's dependencies. No new Blender add-on is needed.

```powershell
blender --background --python scripts/blender/build_calydonian_boar.py -- "<absolute project path>"
blender --background --python scripts/blender/validate_calydonian_boar.py -- "<absolute project path>"
node scripts/build-boar-viewer.mjs
python scripts/package-boar.py
```

Run from the repository root. A quick shape review can be generated with `--draft --quick`; draft files are excluded from the delivery ZIP. The generator stores all temporary exporter files beneath the asset's `scratch` directory.
