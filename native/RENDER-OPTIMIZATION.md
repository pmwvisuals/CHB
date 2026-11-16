# Rendering optimization pass — 16 November 2026

High graphics was profiled on the Xiaomi M2010J19SG / Adreno 610 at the fixed Arrival Ridge landing. Nine cases isolate categories with a 5-second settling interval and a 15-second timed interval. The full scene is measured first and last. The diagnostic build uses an isolated save, blocks input while measuring, then restores visibility, materials, shadows and controls. Normal builds do not enable the diagnostic feature.

## Measurements

| Configuration | Full scene, first / repeat | Visible submitted triangles, approximate |
| --- | --- | --- |
| Starting point | 2.95 / 2.99 FPS | 790,000 |
| Terrain shader optimization | 3.79 / 3.92 FPS | 790,000 |
| Plus surface cells and no road shadow casting | 4.70 / 4.73 FPS | 591,000 |
| Larger tree groups, discarded | 3.75 / 3.77 FPS | 734,000 |

The normal playable APK then measured **4.736 FPS** over 126 presentation intervals (26.60 seconds) at Arrival Ridge, after the user loaded the game and switched to High. Median frame interval was 216.43 ms, p95 217.07 ms. This is about 60% above this pass's initial controlled result; it remains far below smooth gameplay. These runs occurred across sessions and are not a controlled thermal benchmark. Forest and combat performance are not established by this overview sample.

The starting diagnostic gave 3.00 FPS without grass, 4.09 without all instanced scenery, 3.73 without directional shadows, 5.75 with flat materials, and 4.72 with a flat ground material. This points to combined rendering costs, not grass alone. Recorded physics time was sub-millisecond to approximately 1.4 ms across the runs, while frames took hundreds of milliseconds. This does not independently separate CPU graphics-driver time from GPU time. In the raw JSON, the original `no_trees` case hid all non-grass MultiMesh instances (including road borders/understory); `no_vegetation` hid all MultiMesh instances. The harness now names these cases accurately. Hiding cases are diagnostic only and are not present as gameplay settings. Machine-readable case results are in RENDER-PROFILE.json.

## Retained changes

The terrain samples slow-changing habitat/contact fields per vertex on its existing grid. Color maps and their two blended orientations remain. Nearby normal/roughness detail is unchanged through 14 m, fading to a matte distant surface by 26 m. This reduces distant texture reads without replacing the turf color with a flat fill. Architecture, cloud motion, opaque water, lamps, trees, grass and the fixed evening light remain.

Terrain and roads are split into 48 m cells. The splitter checks every triangle's full attribute bytes before and after grouping; neither triangle winding, materials, position, UV nor normal is changed. A sorted triangle-attribute hash is recorded. Physics meshes and player eye height are untouched. Thin roads continue to receive shadows but no longer render into the shadow map. The benchmark's draw calls rose from about 491 to 570 while submitted triangles fell: fewer draw calls alone would not describe this improvement.

The exporter now automatically runs scripts/split-native-surfaces.py after spatial architecture batching. ASTERION_PYTHON can specify an interpreter; on this Windows setup Blender's bundled Python is detected. A standalone rerun is idempotent. The current source report in assets/camp/surface-cells.json records the latest art rebuild's cell/triangle counts. Concurrent fern/shrine authoring updates were retained; the installed APK's timing predates those later art updates. Its geometry checkpoint had 192,042 surface triangles; the current source has 194,889, both across 111 cells.

The tree-group experiment preserved every transform but increased rendered geometry and was reverted. No forest thinning is retained.

## Startup limitation

High startup is still intermittent on this phone. The normal APK crashed twice after Enter Sanctuary, with the same native GL-thread null-pointer stack as earlier builds. The user reported loading successfully on the third attempt after selecting Balanced for loading, then switching to High without a crash. The root cause is unresolved; loading-time resource pressure is a hypothesis. Runtime MSAA disabling is retained and a `.mobile=0` project override disables it from engine initialization, but these settings do not establish a crash fix. Balanced benchmarking remains abandoned as requested. No data reset, reinstall-with-wipe or phone security changes were used.

## Validation and delivery

The retained revision passed 50 hill checks (including fitted road/collision eye clearance), 57 camp/travel checks, 32 display-driven graphics checks, 10 display-driven imported-plant checks and 24 display-driven evening-lighting checks. A new four-check surface suite validates bounded cells, source triangle counts, paving maps and diagnostics disabled in normal runs. Ground-level Arrival/training/lake captures were inspected. Some interim checks read an asset while another authoring task rebuilt it; those failing interim results were rerun against the complete prepared asset and are not claimed as passes. Headless plant-transform results are excluded because the dummy rendering backend does not expose the actual instance transforms.

The installed normal candidate is builds/asterion-render-optimized-test.apk, 181,617,662 bytes, ARM32/ARM64, local testing signature verified using v2/v3. SHA-256: 4008f3b466a905e37d62c519a03fd2c34d18a8a68d27b481eec87cbbb551bf2a . It retains the user's progress and has no automatic benchmark. Later source art updates remain in the editable project. Further optimization and repeatable startup reliability are required before this can be considered playable on the test phone.
