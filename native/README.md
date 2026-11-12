# Asterion Sanctuary — native prototype

Open `project.godot` in **standard Godot 4.7.2**, wait for the first asset import to finish, then press **F5** and choose **Enter Sanctuary**. No Blender plug-ins are required to run it.

This checkpoint transfers the browser camp's exterior layout into Godot: the original terrain and roads, all twelve decorated temple exteriors at their unique sites, the four-door Great Hall, Wayfarer Hall, dining pavilion, training-yard structures, gardens, docks and lakeside pavilion. The playable camp spans roughly 470 metres. Temple interiors, training drills, the bow and the large deep-forest region remain to be migrated. The separate forest encounter is still a small test region.

## Included

- First-person walking, sprinting, jumping, physical roads, ramps, structures and a practice sword.
- Android controls: movement stick, right-side drag to look, Run, Jump, Strike, Map, Travel and Pause. Movement, looking and action buttons support simultaneous fingers.
- Separate camp and forest scenes with a loading screen. The previous scene is released before the next is loaded.
- The camp's existing trees, dense forest border, shrubs, flowers, grass, rocks, carved road borders and corrected animated boar assets. Repeated scenery uses shared mesh batches, spatial culling and automatic mesh LOD.
- An interactive camp map with eighteen destinations, the original road network and safe arrivals that face each temple. Open it with **M** or **Map**.
- Opaque blue lake water with animated ripples, temple inscriptions and nearby lantern light pools at night.
- Boar idle, walk and tusk attack; timed damage, health, defeat rewards and recovery at camp.
- Device-local position, health, coins, XP and clock saving. The browser save is separate.
- A 24-minute day and 8-minute night, moving sun and moon, shadows and distance fog.
- Compatibility renderer and a 30 FPS cap when using phone controls. There is one visual configuration.

On desktop, use **WASD**, **Shift**, **mouse**, **Space**, **left click**, **E**, **M** and **Esc**. The camp map includes **Deepwood Gate**, beyond the forgotten shrine. Defeating the test boar grants 15 coins and 25 XP; it respawns when you revisit the test forest. Combat is single player.

## Files and assets

The supplied `asterion-native-project.zip` contains every required asset, including the camp scenery, collision and shared-mesh GLBs, terrain maps and layout data. Extract the complete archive before importing it. Godot generates its own import and extracted-texture files on first opening.

The source repository keeps the large model binaries out of Git. For a source checkout, copy the complete `assets/` directory from the supplied native archive. Alternatively, run `node scripts/stage-native-assets.mjs` to copy the original local creature/plant files, then `node --max-old-space-size=6144 scripts/export-native-camp.mjs` to bake the camp from the browser sources. The latter uses Node and the existing project dependencies, and does not require Blender. `assets-manifest.json` records file sizes and SHA-256 hashes. The source project needs these assets to load its regions.

## Build an Android APK

The Android preset is configured for landscape, ARM64 phones, an offline game and package name `com.pmwvisuals.asterion`. An APK has **not** been built yet. The current computer still needs the Android export dependencies:

1. In Godot, open **Editor → Manage Export Templates** and install the templates matching **4.7.2**.
2. Install **OpenJDK 17** and the **Android SDK**. In **Editor → Editor Settings → Export → Android**, set their two folder paths. Follow the [Godot 4.7 Android setup instructions](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html) for the matching SDK components. An Android emulator is unnecessary for testing on a physical phone.
3. Create a `builds` folder here. Open **Project → Export → Android**, choose **Export Project**, keep **Export With Debug** checked and save the test APK there.

Real Samsung testing is still required for frame rate, memory use, touch feel, heat and background/resume behavior. The laptop preview does not establish Android performance. A store release will also need its own signing key and release preparation.

## Development checks

Replace `Godot.exe` below with your actual console executable. Run from this native directory:

```powershell
& 'Godot.exe' --headless --path . --import
& 'Godot.exe' --headless --path . --script res://tests/smoke.gd
& 'Godot.exe' --headless --path . --script res://tests/camp.gd
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/touch.gd
```

The touch test needs a real display window because Godot's headless driver does not route GUI touches as the Windows display driver does. It supplies synthetic two-finger input and tests the actual controls. Test save files live in `tests/`, are isolated from real progress and are removed at completion.

For visual previews, create `builds/` and run:

```powershell
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/preview.gd -- --touch-controls
```

See `VALIDATION.md` for the current results and limits.

`tests/camp_preview.gd` captures Arrival Ridge, the Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares, Hephaestus, the map and night lighting. Use the same preview command with that script to inspect the transferred scenery.
