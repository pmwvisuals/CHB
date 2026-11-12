# Native camp checkpoint verification — 13 November 2026

Verified using Godot **4.7.2 stable**, Windows and the **OpenGL Compatibility** renderer on **Intel Iris Xe**.

- The original camp scenery, collision and shared-mesh GLBs import in the actual engine. The separate boar still exposes Idle, Walk and TuskAttack clips.
- **26 gameplay assertions passed**: camp/forest loading, physical grounding and eye height, walking, jumping and landing, pause, gate range, previous-region release, animation presence, sword facing/range, timed tusk damage, one hit per strike, rewards, enemy release, saving and reloading, return to camp, one active world, healing and the 24/8-minute cycle boundaries.
- **57 camp assertions passed**: twelve temple sites, the full camp extent, original instanced planting, the native water material, safe arrivals at eighteen destinations, twelve inscriptions and correct camera facing, Poseidon's causeway height, four open Great Hall doorways, map pause/travel/close behavior, Android Back handling and night/day lamp switching.
- **17 display-driven touch assertions passed**: five main controls fit the viewport; joystick movement and simultaneous camera look; camera release over a button; jumping, striking and running while movement stays held; clean release; action taps; touch map opening and touch travel to Poseidon.
- **100 assertions passed in total**, with zero script errors or exit leak warnings in the final gameplay, camp and touch checks. Region scripts are compiled on the main thread before heavy resources load in the background; this removed a reproducible six-instance warning in Godot 4.7.2's threaded script-loading path.
- Eight camp views were rendered and inspected at **1280 × 720** with phone controls: Arrival Ridge, Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares and Hephaestus. Each reached the configured **30 FPS cap** after warm-up in the final run. The interactive map and night lighting were also captured. These short samples are not a sustained benchmark or Android result.
- Shared plant/detail prototypes were reduced from **91 to 48** by comparing geometry and material content. All **77,602** source instance placements remain, grouped into **4,411** spatial batches. Nearby undergrowth remains detailed; distance culling and automatic mesh LOD control rendering cost. Zero-energy night lights are hidden during daytime.
- Asset byte sizes and SHA-256 hashes are recorded in `assets-manifest.json`. These are source payload sizes, not runtime RAM usage or APK size.
- The Android preset includes the layout JSON explicitly. Android export was previously blocked by missing matching export templates and Java/Android SDK configuration; the user is setting these up. No installable APK is included in this checkpoint.
- Save serialization and file replacement were tested using isolated project files. Android device storage and actual pause/resume behavior still require a physical-device run.

## Current limits

The camp exterior layout is transferred, including the original hills, paved paths, twelve decorated temples, Great Hall, Wayfarer Hall, dining pavilion, gardens, training-yard structures, lake, dock, pavilion, causeway and planting. Temple interiors, training drills/bow, quests and the large deep-forest landscape remain to be migrated. The separate 96-metre forest remains an encounter test region. Browser-specific volumetric clouds, localized mist shaders, plant wind and advanced water reflections are not yet fully reproduced in Godot.

The sword remains a simple practice mesh. The test boar pursues directly and can be blocked by a trunk; navigation around obstacles and death/charge animations are future work.

No physical Samsung, Android lifecycle or APK test has been performed. Release signing, store publishing and production performance acceptance remain outstanding.
