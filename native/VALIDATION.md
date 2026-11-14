# Compact camp verification — 14 November 2026

The camp uses fixed daylight, with no sun/moon models, cycling sky or night point-light updates. Large scattered rock props are removed. The forest boundary is closer to Ares, Aphrodite and Hephaestus. Ares (map 5) and Hephaestus (map 9), including their forecourts, lie entirely within forest clearings. All twelve temple placements, decorative grounds, entrance paths, central landmarks and limestone roads remain.

The irregular playable outline spans approximately **409 by 394 metres** and encloses **117,935 square metres**, **46.6% less area** than the former 470-metre square. Geometry beyond it is clipped, with a small nonwalkable ground skirt beneath the back trees. Terrain, forest planting, map artwork and physical perimeter share the same outline. Old saved positions on trimmed land return safely to Arrival Ridge; coins, XP and practice records remain.

## Engine and source checks

Verified with standard **Godot 4.7.2 stable**, Windows and OpenGL Compatibility on Intel Iris Xe:

| Check | Passed assertions | Coverage |
| --- | ---: | --- |
| Gameplay smoke | 26 | Camp/forest loading and release, grounding, eye height, movement/jump, pause, passive creature, saving, healing, fixed clock and daylight |
| Camp | 57 | Twelve temple sites, eighteen safe arrivals, inscription fitting/facing, causeway height, four hall entrances, map/travel, Android Back, fixed daylight and absent night lights |
| Polish | 27 | Surface colors, bundled fonts, readable plaques, practice-only weapons and attacks, no practice economy rewards |
| Training | 44 | Physical arrow flight, scoring, obstructions, five-shot drill, sword combos, timers, pause, cancellation and records |
| Compact boundary | 14 | Legacy save migration, progression, smaller outline, physical perimeter crossings, forest-side roots, both complete temple forecourts inside the forest, retained approaches and absent celestial models |
| Graphics (display) | 32 | Balanced/High persistence, transforms, near/far tree coverage, shadow/leaf distances, resolution, retained scenery/physics, released setup data and menu rendering |
| Touch (display) | 26 | Simultaneous movement/look/action, clean release, bow drawing/shooting, map/travel and weapon restrictions |
| Creature integration | 17 | Existing three mesh levels, shared skeleton, distance switching, attack continuity, walking scale and physical grounding |

**243 assertions passed**, with no script failures. The headless backend does not establish GPU behavior; graphics and touch checks ran through the Windows display driver. Some managed launches report denied shader-cache/log-directory or certificate-store access. These host diagnostics did not prevent import, testing or display rendering; the game does not request network access.

Nine ground-level views were rendered at **1280×720** with phone controls: Arrival Ridge, Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares, Hephaestus and Aphrodite. Three additional elevated views check trees around those outer temple clearings; the interactive map was captured too. Short desktop samples were approximately 22–29 FPS while other checks/builds ran. They are not controlled benchmarks or Android results.

The browser TypeScript check and complete source test suite passed. Coverage includes every temple approach and trail, whole-building forest inclusion for Ares/Hephaestus, rear-tree coverage behind the three outer temples, rooted scatter, all five tree varieties, protected roads, fixed lighting, moving clouds and opaque water. The static website and portable pages rebuilt successfully; all twelve temple pages passed identity, selector, return-link and asset-path checks. This does not establish browser GPU performance.

## Assets and loading

| Measure | Previous untrimmed map | Compact map |
| --- | ---: | ---: |
| Placed native instances | 77,602 | 54,915 |
| Spatial batches | 4,411 | 2,518 |
| Shared prototypes | 48 | 44 |
| Scenery triangles | 985,778 | 871,272 |
| Scenery GLB bytes | 77,606,036 | 50,627,304 |
| Collision triangles | 475,218 | 233,848 |
| Physics chunks | 61 | 43 |
| Physics-only scene bytes | 4,135,917 | 1,920,702 |

The border retains 2,400 dark trees using five existing model varieties, with irregular spacing and protected temple clearings. All exported dark border trunks were audited against the shared forest-start polygon: none are on the camp side. Browser understory budgets are 34,000 grass clumps and 5,500 shrubs/ferns/litter plants in the smaller belt. Native export retains rendered source groups; these browser budgets are not a claim that all hidden browser cells load in the app.

Four palette materials and spatial groups preserve the retained architecture's surface colors, roughness and metallic finish. Directional shadows, opaque blue water and nearby model detail remain. Both graphics presets use the same assets; their resolution, distance detail and shadow ranges are unchanged. The conservative tablet-compatible 96-metre distant tree groups remain; no aggressive bulk-upload experiment is included.

Physics baking compares every retained collision face and transform against the source. Android loads the compressed physics scene without loading the collision GLB as graphics. The editable archive retains that GLB for rebuilding. Every packaged art payload is checked against the byte size and SHA-256 in `assets-manifest.json`; source payload size is not runtime RAM use.

The 99-file editable archive was extracted into a fresh directory. Every archive entry matched its current source file and every extracted art payload matched its manifest hash. The extracted project imported from scratch, then passed its 26 gameplay smoke and 14 compact-boundary assertions. Test saves are isolated from player progress.

## Android build and device limits

The normal test APK is `builds/asterion-test.apk`, **130,652,789 bytes**, version 0.1.0, package `com.pmwvisuals.asterion`. It uses the release export template with the local testing signature. Independent `apksigner` verification confirms **v2/v3 signatures**. It includes ARM32 and ARM64 libraries, with minimum API 24. This is a test build; publishing requires a store signing key. SHA-256:

`7d7366e6ff3e51a30cdc60479a39b290afe29eb0b6689f5571774b63c403d61e`

The compact build has **not been installed or benchmarked on the tablet** because the authorized SM-T515 was unavailable during final testing. No Android FPS, memory-stability or sustained-play improvement is claimed for this checkpoint. The new build has fewer placed instances and collision faces, and no cycling light/sky work; those reductions alone do not establish smooth play.

The previous untrimmed build ran on the user's SM-T515: Android 11/API 30, approximately 2 GB physical RAM and a 32-bit ARM runtime, with Mali-G71 OpenGL Compatibility. Basic camp rendering, touch movement, map travel, weapon selection and both graphics settings responded. Its last controlled Arrival Ridge sample was **3.075 FPS on Balanced** over 24 presentation intervals; PSS was 274,975 kB and swap PSS 197,492 kB in a snapshot. These are historical results for the old map, not the new build. Larger tree batching experiments previously triggered low-memory terminations and remain excluded.

Further physical-device checks are required for loading, sustained FPS, memory, heat, complete combat drills, save/lifecycle behavior and background memory pressure. Laptop rendering does not predict Android performance, nor do the old 2 GB tablet's measurements establish results for 4/8 GB phones.

## Remaining migration work

The native app includes camp exteriors and functional practice. Temple interiors, quests and the large deep-forest landscape remain to be migrated. The separate forest is a small encounter test region; its boar remains passive because combat is enabled only at the training ground. Browser volumetric clouds, localized mist, wind and advanced water reflections are not fully reproduced in Godot. Animated hands, combat audio, future creature encounters and death/charge animations remain future work.
