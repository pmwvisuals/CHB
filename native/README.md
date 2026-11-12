# Asterion Sanctuary — native prototype

Open `project.godot` in **standard Godot 4.7.2**, wait for the first asset import to finish, then press **F5** and choose **Enter Sanctuary**. No Blender plug-ins are required to run it.

This is the first playable native migration checkpoint. Its small camp and forest are test regions. The browser game's full camp, twelve temples, training yard, landscape detail, quests and bow still need to be transferred. They have not been replaced in the browser project.

## Included

- First-person walking, jumping, terrain and trunk collision, and a practice sword.
- Android controls: left movement stick, right-side drag to look, Jump, Strike, Travel and Pause. Two fingers can move and look together.
- Separate camp and forest scenes with a loading screen. The previous scene is released before the next is loaded.
- Existing olive, laurel, fir, oak, fern and corrected animated boar assets.
- Boar idle, walk and tusk attack; timed damage, health, defeat rewards and recovery at camp.
- Device-local position, health, coins, XP and clock saving. The browser save is separate.
- A 24-minute day and 8-minute night, moving sun and moon, shadows and distance fog.
- Compatibility renderer and a 30 FPS cap when using phone controls. There is one visual configuration.

On desktop, use **WASD**, **mouse**, **Space**, **left click**, **E** and **Esc**. The woodland gate is at the northern end of the camp trail. Defeating the test boar grants 15 coins and 25 XP; it respawns when you revisit the test forest. Combat is single player.

## Files and assets

The supplied `asterion-native-project.zip` contains all six GLB files. Extract the complete archive before importing it. Godot generates its own texture and import files on first opening; these do not need to be downloaded separately.

The source repository keeps the large model binaries out of Git. When using a source checkout, copy the six GLBs from the supplied native archive into this folder's `assets/` directory. Alternatively, if the original local `assets-source` files are present, run `node scripts/stage-native-assets.mjs` from the repository root. `assets-manifest.json` records their sizes and SHA-256 hashes. The source project alone cannot load the regions without these assets.

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
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/touch.gd
```

The touch test needs a real display window because Godot's headless driver does not route GUI touches as the Windows display driver does. It supplies synthetic two-finger input and tests the actual controls. Test save files live in `tests/`, are isolated from real progress and are removed at completion.

For visual previews, create `builds/` and run:

```powershell
& 'Godot.exe' --path . --resolution 1280x720 --script res://tests/preview.gd -- --touch-controls
```

See `VALIDATION.md` for the current results and limits.
