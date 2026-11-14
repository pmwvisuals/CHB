# Asterion Sanctuary — native prototype

Open `project.godot` in **standard Godot 4.7.2**, wait for the first asset import to finish, then press **F5** and choose **Enter Sanctuary**. No Blender plug-ins are required to run it.

This checkpoint transfers the browser camp's exterior layout into Godot: terrain and roads, all twelve decorated temple exteriors at their unique sites, the four-door Great Hall, Wayfarer Hall, dining pavilion, training yard, gardens, docks and lakeside pavilion. The compact irregular camp spans approximately 409 by 394 metres and encloses 117,935 square metres, 46.6% less playable area than the former 470-metre square. Ares (map 5) and Hephaestus (map 9) lie fully inside forest clearings; Aphrodite is also surrounded by forest. Foundations, approach paths and temple placements are preserved. Terrain beyond the outline is removed, with a small nonwalkable skirt beneath the back trees. Old saved positions outside the new boundary return to Arrival Ridge without losing progression. Temple interiors and the large deep-forest region remain to be migrated; the separate forest encounter is a small test region.

Standing eye height is now 1.82 m above the physical walking surface. Roads and soil fit the actual terrain triangles, removing intersecting sand fragments at training and the raised bank across the lake entrance. The causeway remains continuously walkable.

## Included

The native camp now uses the supplied grass and flower-bush packs: 33,912 grass placements, 155 camp shrubs and 265 small flowering bushes. Camp grass, garden beds and lakeside planting are replaced; the dark forest trees, brambles, ferns and bracken remain. Root positions follow the hills. Materials use cutout transparency, original-resolution shared textures and GPU compression. The source packs are user-supplied third-party assets, rather than project-authored models. The plant-replacement Android candidate is `builds/asterion-plants-test.apk`; its device performance has not yet been measured.

The complete editable archive includes the prepared plant GLB, textures and compression import settings. To regenerate them from the supplied packs, run `scripts/blender/prepare_imported_plants.py`, import the native project in Godot, run `scripts/configure-imported-plant-textures.py`, import again and rerun the configuration script to refresh manifest hashes. Source files are retained in `assets-source/imported-plants/`.

- First-person walking, sprinting, jumping, physical roads, ramps and structures. The practice sword equips only inside the training ground and sheathes immediately on leaving, including map travel.
- Android controls: movement stick, right-side drag to look, Run, Jump, Strike/Draw, Sword/Bow selection, Drill, Map, Travel and Pause. Movement, looking and action buttons support simultaneous fingers.
- Separate camp and forest scenes with a loading screen. The previous scene is released before the next is loaded.
- The camp's existing trees, dense forest border, shrubs, flowers, grass, carved road borders and corrected animated boar assets. Repeated scenery uses shared mesh batches, spatial culling and automatic mesh LOD.
- An interactive camp map with eighteen destinations, the original road network and safe arrivals that face each temple. Open it with **M** or **Map**.
- Opaque blue lake water with animated ripples and fitted temple inscriptions. Large scattered rock props are removed.
- Combat is enabled only in the training-ground footprint. The sword and ash bow reuse the browser weapon designs. Sword strikes register on the three existing dummies; arrows fly with gravity and lodge in the three visible targets or the scenery. The forest boar is passive; its idle, walk and tusk-attack animation assets remain available for future encounters.
- Free sword/archery practice, three-hit combos, a 30-second sword drill and a five-arrow archery drill. Practice does not award coins or XP.
- Device-local position, health, coins, XP, practice statistics and personal-best saving. Older saves receive the new practice fields automatically. The browser save is separate.
- Fixed evening light, one warm sun low in the western sky, slowly drifting cloud banks, directional shadows and distant haze. Six subtle rays mark a few canopy openings. The day/night cycle, moon and night point-light updates remain disabled; the legacy save clock stays fixed.
- Compatibility renderer and a 30 FPS cap when using phone controls. Exactly two graphics options, **Balanced** and **High**, apply immediately and save on this device.
- Cinzel headings and architectural inscriptions, with Barlow Semi Condensed for the interface. Temple names have mounted stone plaques ahead of the projecting frieze ribs; lettering fits its backing, respects depth and has a limited viewing distance. Notices wrap in compact panels and expire after a few seconds.
- Imported surfaces apply their original vertex colors, including sand, ground details and planting. Nonmetallic highlights are softened to prevent the former white wash over the training yard.

On desktop, use **WASD**, **Shift**, **mouse**, **Space**, **left click**, **E**, **M** and **Esc**. Inside the training ground, **1** selects Sword, **2** selects Bow and **R** starts/restarts the selected drill. Click to strike; hold and release to shoot. On touchscreens, the training controls appear only there. The camp map includes **Deepwood Gate**, beyond the forgotten shrine; the forest currently supports peaceful exploration.

## Training ground

Travel to **Training Ground** on the map. The straw dummies occupy the eastern side of the yard; the three round archery targets face the marked firing lanes along the northern backstop. There is no need to load another scene.

- **Sword:** move within striking distance and face a dummy. Three clean hits, each within 1.35 seconds of the previous hit, complete a combo. A miss or a longer gap breaks the sequence. The timed drill awards 10 points per hit and a further 20 for every completed combo.
- **Bow:** draw for up to 1.2 seconds, then release. Short draws have less speed and more drop. The target rings award **10 / 7 / 4 / 1** points, from the centre outward. A five-arrow drill ends after every shot has landed or missed; the maximum is 50 points.
- **Records:** completed drills save their personal best on this device. Free practice also records arrows fired, target hits, sword hits and combos. Practice cannot generate gold or XP.

Pause freezes arrows and the drill timer. Opening the map cancels a held draw; switching weapons or leaving the yard cancels the current drill and removes its arrows. Shots cannot pass through a wall at the muzzle, and hitting a target from behind gives no points. At most sixteen arrows remain in the scene, and lodged arrows are removed after fourteen seconds.

## Graphics settings

Choose **Graphics** on the welcome screen, or **Pause → Graphics** during play. Both options use the same camp, models, textures, nearby planting and gameplay. High retains more distant leaf detail and longer shadows. Balanced reduces distant detail and the 3D rendering resolution while keeping the interface at full resolution.

| Setting | Balanced | High |
| --- | --- | --- |
| 3D resolution per axis | 80% | 100% |
| Detailed leaf cells | 55 m | 85 m |
| Nearby trunk/crown cells | 80 m | 112 m |
| Directional shadow distance | 45 m | 65 m |

Distant trunks and crowns retain their original placements and shapes, grouped into 96-metre shared cells. Fine cells retain nearby details. The conservative tree batching remains compatible with the physical tablet; larger forest submissions were not retained after device testing.

Opaque architecture shares four palette materials and spatial groups. After trimming unused outer ground and removing the large rock props, scenery contains 911,338 triangles in a 54,919,360-byte GLB. Vertex data retains surface color, roughness and metallic finish; identical stone textures share a draw material. Automatic architecture LOD prioritizes nearby details. Ground, paved roads, water, transparent effects and emissive decorations retain their own materials. The compact camp contains 54,915 placed instances in 2,518 batches using 44 prototypes, including 2,400 border trees. Tree roots begin on the forest side of the same edge used by terrain, map and physical perimeter; roads and temple grounds retain clearances.

The device loads 43 physics chunks containing 276,402 collision triangles directly from a compressed 2,364,437-byte scene. The bake compares every retained face and transform with the collision source. It does not load a second graphics mesh copy to construct collision. The collision GLB remains in the editable archive and is excluded from the APK. Full-screen menus and loading screens stop drawing covered scenery. Packed loading references and converted placement arrays are released after setup. Fixed evening lighting eliminates the former clock, orbit, sky-transition and night-light updates. A 128-pixel sky radiance cache supplies directional ambient light and reflections. Cloud drift uses a global phase instead of invalidating that cache. A shared baked contact/canopy field grounds vegetation and structures without a real-time volume or screen-space AO pass. Both presets receive the same atmosphere, 2× MSAA and a 2048-pixel directional shadow map. Grass has a fresher, lighter green treatment; limestone streets retain their stone texture with a warmer tint and very low specular response.

On first launch, mobile devices with less than 6 GiB physical memory or a 32-bit runtime receive Balanced; other devices receive High. This is a conservative starting recommendation, not a GPU benchmark or minimum-requirements guarantee. Players can override it, and the choice persists. The SM-T515 receives Balanced automatically. Further optimization is still needed for comfortable play on this old 2 GB tablet.

## Files and assets

The supplied `asterion-native-project.zip` contains every required asset, including the camp scenery, collision and shared-mesh GLBs, terrain maps and layout data. Extract the complete archive before importing it. Godot generates its own import and extracted-texture files on first opening.

The archive includes both the complete `assets/` and `fonts/` directories. For a source checkout, copy both directories from that archive. Alternatively, run `node scripts/fetch-native-fonts.mjs` for the verified original fonts; `node scripts/stage-native-assets.mjs` for the original local creature/plant files; `node --max-old-space-size=6144 scripts/export-native-camp.mjs` to bake and rebatch the camp; and `node scripts/export-native-weapons.mjs` for the sword, bow and arrow GLBs. After regenerating the camp, import it in Godot and run `scripts/bake-native-physics.gd` with the native project as `--path` and the script's absolute path as `--script`. This produces the required physics-only scene and updates the asset manifest. The mesh exporters use Node and the existing project dependencies; physics baking uses Godot. After regenerating the camp, also run `blender --background --factory-startup --python scripts/bake-native-atmosphere.py` from the repository root, then reimport the native project. This bakes the original cloud shapes and contact shading against the current layout, and updates the asset manifest. NumPy is bundled inside Blender; no plug-in or download is required. The atmosphere assets are already included in the complete archive, so Blender is only needed to rebuild them. `assets-manifest.json` records art file sizes and hashes. The fonts include their original SIL Open Font License files, also included by the Android export preset.

## Build an Android APK

The Android preset is configured for landscape, ARM32 and ARM64 devices, an offline game and package name `com.pmwvisuals.asterion`. The connected SM-T515 reports Android 11 (API 30), roughly 2 GB RAM and only `armeabi-v7a,armeabi` app support, so ARM32 is required for this tablet.

The current test APK is `builds/asterion-test.apk`, version 0.1.0. It uses the optimized export template and local testing key; it is not a store-signed release. Minimum Android API is 24. Its size, checksum and verification results are recorded in `VALIDATION.md`. The APK is separate from the editable project ZIP and is not committed to Git. The original debug build remains an earlier diagnostic artifact.

The previous untrimmed build was tested on the physical SM-T515: camp, map, travel, joystick movement, weapon selection and both graphics choices responded. Its Arrival Ridge sample measured **3.07 FPS on Balanced**, which does not meet comfortable-play performance and does not predict performance on stronger phones. The new compact map has fewer instances, scenery triangles and collision faces, but has not yet been timed on Android. Larger forest batching experiments did not load reliably on this device and remain excluded.

For another computer, set up the export dependencies:

1. In Godot, open **Editor → Manage Export Templates** and install the templates matching **4.7.2**.
2. Install **OpenJDK 17** and the **Android SDK**. In **Editor → Editor Settings → Export → Android**, set their two folder paths. Follow the [Godot 4.7 Android setup instructions](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html) for the matching SDK components. An Android emulator is unnecessary for testing on a physical phone.
3. Create a `builds` folder here. Open **Project → Export → Android**, choose **Export Project**, keep **Export With Debug** checked and save the test APK there.

Further Samsung testing is required after optimization, including sustained frame rate, memory, input latency, heat and background/resume behavior. The first physical run confirms basic functionality but fails the performance target. The laptop preview does not establish Android performance. A store release will also need its own signing key and release preparation.

The restored local setup uses the existing Android Studio Java runtime, verified Android Build Tools 35.0.1 and Android Platform 35. Godot's template targets API 36 and reports a Build Tools version fallback; APK signing verification and installation on Android 11 nevertheless succeeded. No NDK or emulator was needed for this prebuilt-template export.

## Development checks

Replace `Godot.exe` below with your actual console executable. Run from this native directory:

```powershell
& 'Godot.exe' --headless --path . --import
& 'Godot.exe' --headless --path . --script res://tests/smoke.gd
& 'Godot.exe' --headless --path . --script res://tests/camp.gd
& 'Godot.exe' --headless --path . --script res://tests/boundary.gd
& 'Godot.exe' --path . --script res://tests/lighting.gd
& 'Godot.exe' --headless --path . --script res://tests/polish.gd
& 'Godot.exe' --headless --path . --script res://tests/training.gd
& 'Godot.exe' --path . --script res://tests/graphics.gd
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/touch.gd
```

The touch test needs a real display window because Godot's headless driver does not route GUI touches as the Windows display driver does. It supplies synthetic two-finger input and tests the actual controls. Run the graphics test with a display to exercise the actual renderers instance transforms. Headless mode uses a dummy rendering backend and does not establish GPU behavior. Test save files live in `tests/`, are isolated from real progress and are removed at completion.

For visual previews, create `builds/` and run:

```powershell
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/preview.gd -- --touch-controls
```

See `VALIDATION.md` for the current results and limits.

`tests/camp_preview.gd` captures Arrival Ridge, the Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares, Hephaestus, the map and night lighting. Use the same preview command with that script to inspect the transferred scenery.

`tests/polish_preview.gd` captures the updated typography, colored training floor, fitted temple inscriptions and safe-zone weapon state. Restart the running game with F5 to load this update.

`tests/training_preview.gd` captures a sword combo, the drawn bow and a completed archery drill, using the actual renderer.

`tests/graphics_preview.gd` captures the same Arrival Ridge and training views under both graphics choices. `tests/graphics.gd -- --capture` also captures the settings screen.
