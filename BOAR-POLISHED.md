# Boar — small visual polish

A restrained visual revision of the existing gameplay boar. The original detailed and runtime files are preserved separately.

- Slightly flatter nasal disc, with its carved nostrils and dark inserts kept aligned.
- A subtly lowered upper eyelid for a firmer expression.
- Gentle charcoal and ivory variation in the existing 4K base-color atlas.
- A more matte coat with subtle strand tint variation, and slightly stronger existing normal detail.

Geometry remains **104,660 triangles**, five exported mesh groups and **21 bones**. The existing weights, UV layout and Idle, Walk and TuskAttack tracks are retained. No extra fur, scars or decorations were added. This is a small polish pass, not a new sculpt or retopology pass.

Open `ash-tusk-boar-polished.blend` for editing, or import the GLB/FBX. Three 4K texture maps are both packed and supplied separately; base color is sRGB, roughness and normal are linear. GLB is Y up, facing +Z, metre scale. Blender is Z up, facing −Y.

`OPEN-POLISHED-MODEL.html` embeds the actual exported GLB and offers the existing orbit and animation controls. PNGs are studio renders; `exported-strike.png` shows the re-imported GLB. The viewer embeds the checked model bytes; its UI has not been visually tested for this revision.

Checks passed for the connected head/mandible across seven poses, embedded maps, normalized skin weights, seamless walk, planted attack feet, and GLB/FBX re-import with all three animation clips. Reports are included. These checks do not establish commercial readiness or device performance.

The editable model opens independently. Rebuilding this pass with `source/polish_boar_small.py` requires the original runtime source and repository helpers. The game APK has not been rebuilt for this separate model review.

Meshes and maps were authored for this project. The viewer uses Three.js; its MIT licence is included. A distribution licence for the model itself has not yet been selected.
