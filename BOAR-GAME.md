# Ash-Tusk Boar — game preparation

The polished creature is integrated into the native game's existing forest creature. Its close-up mesh is unchanged. The original polished and high-detail source assets are preserved separately.

| Detail level | Triangles | Selection |
| --- | ---: | --- |
| LOD0 | 104,660 | Close view; returns below 14 m |
| LOD1 | 48,380 | Leaves LOD0 above 18 m |
| LOD2 | 21,096 | Selected above 40 m; returns to LOD1 below 32 m |

Visuals hide beyond 100 m and return below 90 m. These are automatic distance levels shared by both graphics settings. Hysteresis reduces boundary flicker. Far meshes do not draw dynamic shadows. Only one mesh level is visible at a time; switches retain the playing animation and its time.

All three levels share **one 21-bone skeleton, five materials and three embedded 4K texture maps**. They do not load three copies of the textures. LOD0 position, normal, UV, color and skin-weight/index attributes match the polished GLB byte-for-byte after matching material groups. Lower meshes use decimated surfaces and whole-strand fur sampling, preserving root weights; this is not a new hand-retopologized quad cage.

The existing Idle, Walk and TuskAttack clips remain. Walk playback now derives from actual travel speed, the authored 0.375 m/s support phase and the game's 0.65 model scale. A horizontal capsule provides simple body collision; no fur or triangle-mesh physics is used. Its lowest point matches the model's foot plane. Combat permissions and rewards are unchanged; the current forest remains peaceful exploration.

## Package

- `ash-tusk-boar-game.blend`: editable source with the three mesh collections, packed maps, original skeleton and clips. LOD0 is initially visible; lower collections can be unhidden for editing.
- `Godot/assets/boar.glb`: portable GLB with all three levels, skeleton, maps and clips. It can also be imported into other glTF-capable engines. Those engines need their own LOD selection setup.
- `Godot/scenes/boar.tscn` and `Godot/scripts/boar.gd`: Godot 4.7 prefab/controller for the native game, using its existing `Session` autoload. Set its `player` reference when spawning. The existing game's world already supplies this reference and uses the newly staged GLB.
- `textures/`: external copies of the polished 4K maps; base color is sRGB, normal and roughness are linear.
- `previews/`: actual Godot captures of the three levels at the same close camera position and the attack pose. Lower levels are deliberately shown closer than their intended distances for inspection.
- `game-report.json`, `game-validation.json`: measured counts and portable export checks.

To add the module to an existing native project, copy the contents of `Godot/` into that project's root and let Godot import the GLB. The complete camp project is not included in this creature module. The current workspace's forest already references the updated asset. No Android APK was rebuilt for this model-preparation checkpoint.

## Validation and limits

The portable GLB passed checks for all three triangle budgets, unchanged close-up attributes, a single skin, shared maps/materials, normalized weights and 51 sampled animation poses across all three mesh levels. **17 Godot assertions passed**, including actual imported geometry, one live skeleton, exclusive visibility, distance hysteresis, culling/return, attack playback continuity, scale-correct walking and physical ground contact. Godot rendered all three detail levels and an attack pose for visual inspection.

The broader world smoke test passed its 24 creature/gameplay/loading/save checks; its two day/night boundary checks fail because the current world now uses fixed daylight. This module does not change that lighting work. Android frame rate, multiple simultaneous creatures and sustained memory use have not been measured for the new model. The older tablet's camp performance is not solved by this creature preparation.

The source and model are original project assets. Choose distribution terms before selling. These files do not certify commercial readiness or marketplace acceptance.

Rebuild from the repository with the polished source present:

```powershell
blender --background --python scripts/blender/prepare_boar_game.py -- "<absolute repository path>"
node scripts/check-game-boar.mjs
node scripts/stage-native-assets.mjs
Godot.exe --headless --path native --import
Godot.exe --path native --script res://tests/boar.gd
python scripts/package-game-boar.py
```
