# Supplied grass and flowering bushes — native camp replacement

The native Godot camp now uses the two user-supplied GLB packs. The Android test build for this checkpoint is `native/builds/asterion-plants-test.apk`; the existing APK is preserved separately. Browser vegetation has not been replaced in this pass.

## Placement

- 33,912 existing grass/ground-cover placements now use fresh, aged or dry grass from the supplied pack, with heights of approximately 18–30 cm. Occasional taller grass/reeds mark the lake bank.
- 155 camp shrubs replace the old multipart myrtle/laurel models. Each shrub is instantiated once instead of separately drawing its old trunk, leaves, crown and blossoms.
- 265 small flowering bushes replace the dense old individual-flower placements in garden beds. Broad-leaf flowering plants are reserved for lakeside beds.
- The habitat mask excludes flowering bushes from the dark forest. Every original dark forest tree and bramble trunk placement remains. Original ferns, bracken, camp trees, buildings, roads and collision remain.
- Source placement X/Z coordinates are reused. Root heights are sampled from the camp's terrain, with a 2.5 cm inset to avoid visible floating roots. Prototypes are normalized to unit height before instance scaling. There is no plant collision.

The original ground-cover batches are not edited on disk: the native loader replaces them at setup, merges compatible variants into shared cells and releases the temporary prototypes. Detail distances remain 60 m for grass and 110 m for bushes, shared by both graphics settings.

## Materials and source

The source packs are `grass_pack_lowpoly_game-ready.glb` and `lowpoly_flower_bushes.glb`. Original copies and hashes are retained under `assets-source/imported-plants/`. They are user-supplied third-party assets, not original project-authored meshes. Any original author/licence information should accompany distribution.

The extraction produces 15 grass variants and two complete bushes. Display/checker geometry and the human scale reference are excluded. The two bush assemblies are merged by material, rather than importing individual leaf cards as separate draw objects.

Materials use alpha cutout at 0.38, two-sided leaves and alpha-to-coverage with the game's antialiasing. Metallic response is disabled and highlights softened. Grass tint is slightly darker/greener. Original 1024/2048 texture resolutions are preserved; all nine shared maps use GPU-compressed desktop and Android imports with mipmaps. The PNGs and their import settings are included in the editable archive so a fresh import retains that configuration.

## Checks

Ten display-driven plant checks pass: prototype completeness, rooted unit scale, textured cutout materials, replacement population, exact prepared-instance count, terrain-following roots, forest exclusion, removal of old camp shrub pieces and preservation of all original dark tree/bramble trunk counts. The camp's 57 loading/travel/map/collision checks pass after replacement. Both graphics settings and a small sample patch were rendered in Godot for inspection.

Initial full-camp laptop samples at 1280×720 were Arrival Balanced 28 FPS / High 26 FPS, and training Balanced 28 FPS / High 27 FPS. These are short Iris Xe samples, not controlled comparisons or Android results. A performance improvement on the tablet has not been established; low triangle counts alone do not eliminate texture, overdraw and shadow costs.

## Rebuild

With the two original packs in Downloads or the retained source folder:

```powershell
blender --background --python scripts/blender/prepare_imported_plants.py -- "<absolute repository path>"
Godot.exe --headless --path native --import
python scripts/configure-imported-plant-textures.py
Godot.exe --headless --path native --import
python scripts/configure-imported-plant-textures.py
Godot.exe --path native --script res://tests/imported_plants.gd
```

The final configuration step records the extracted texture hashes after import. Mutable Godot import metadata is packaged as configuration rather than hashed as an art payload. `scripts/package-native-project.py` checks every asset size/hash before packaging.
