# Asterion Sanctuary — native prototype

Open `project.godot` in **standard Godot 4.7.2**, wait for the first asset import to finish, then press **F5** and choose **Enter Sanctuary**. No Blender plug-ins are required to run it.

This checkpoint transfers the browser camp's exterior layout into Godot: the original terrain and roads, all twelve decorated temple exteriors at their unique sites, the four-door Great Hall, Wayfarer Hall, dining pavilion, training-yard structures, gardens, docks and lakeside pavilion. The playable camp spans roughly 470 metres. Temple interiors, training drills, the bow and the large deep-forest region remain to be migrated. The separate forest encounter is still a small test region.

## Included

- First-person walking, sprinting, jumping, physical roads, ramps and structures. The practice sword equips only inside the training ground and sheathes immediately on leaving, including map travel.
- Android controls: movement stick, right-side drag to look, Run, Jump, Strike, Map, Travel and Pause. Movement, looking and action buttons support simultaneous fingers.
- Separate camp and forest scenes with a loading screen. The previous scene is released before the next is loaded.
- The camp's existing trees, dense forest border, shrubs, flowers, grass, rocks, carved road borders and corrected animated boar assets. Repeated scenery uses shared mesh batches, spatial culling and automatic mesh LOD.
- An interactive camp map with eighteen destinations, the original road network and safe arrivals that face each temple. Open it with **M** or **Map**.
- Opaque blue lake water with animated ripples, temple inscriptions and nearby lantern light pools at night.
- Combat is currently enabled only in the training-ground footprint. Sword strikes register on the three existing practice dummies. Practice hits do not award coins or XP. The forest boar is passive in this mode; its idle, walk and tusk-attack animation assets remain available for future encounters.
- Device-local position, health, coins, XP and clock saving. The browser save is separate.
- A 24-minute day and 8-minute night, moving sun and moon, shadows and distance fog.
- Compatibility renderer and a 30 FPS cap when using phone controls. There is one visual configuration.
- Cinzel headings and architectural inscriptions, with Barlow Semi Condensed for the interface. Temple names have mounted stone plaques ahead of the projecting frieze ribs; lettering fits its backing, respects depth and has a limited viewing distance. Notices wrap in compact panels and expire after a few seconds.
- Imported surfaces apply their original vertex colors, including sand, ground details and planting. Nonmetallic highlights are softened to prevent the former white wash over the training yard.

On desktop, use **WASD**, **Shift**, **mouse**, **Space**, **left click**, **E**, **M** and **Esc**. Left click practices with the sword inside the training ground. On touchscreens, **Strike** appears only there. The camp map includes **Deepwood Gate**, beyond the forgotten shrine; the forest currently supports peaceful exploration.

## Files and assets

The supplied `asterion-native-project.zip` contains every required asset, including the camp scenery, collision and shared-mesh GLBs, terrain maps and layout data. Extract the complete archive before importing it. Godot generates its own import and extracted-texture files on first opening.

The archive includes both the complete `assets/` and `fonts/` directories. For a source checkout, copy both directories from that archive. Alternatively, run `node scripts/fetch-native-fonts.mjs` for the verified original fonts; `node scripts/stage-native-assets.mjs` for the original local creature/plant files; and `node --max-old-space-size=6144 scripts/export-native-camp.mjs` to bake the camp from the browser sources. The camp exporter uses Node and the existing project dependencies, and does not require Blender. `assets-manifest.json` records art file sizes and hashes. The fonts include their original SIL Open Font License files, also included by the Android export preset.

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
& 'Godot.exe' --headless --path . --script res://tests/polish.gd
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/touch.gd
```

The touch test needs a real display window because Godot's headless driver does not route GUI touches as the Windows display driver does. It supplies synthetic two-finger input and tests the actual controls. Test save files live in `tests/`, are isolated from real progress and are removed at completion.

For visual previews, create `builds/` and run:

```powershell
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/preview.gd -- --touch-controls
```

See `VALIDATION.md` for the current results and limits.

`tests/camp_preview.gd` captures Arrival Ridge, the Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares, Hephaestus, the map and night lighting. Use the same preview command with that script to inspect the transferred scenery.

`tests/polish_preview.gd` captures the updated typography, colored training floor, fitted temple inscriptions and safe-zone weapon state. Restart the running game with F5 to load this update.
