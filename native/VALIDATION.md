# Evening atmosphere verification — 15 November 2026

The native camp now uses fixed evening light: one warm sun low in the western sky, sparse drifting clouds, cooler sky fill, six faint canopy rays, baked contact shading, softer distant haze and opaque blue water. Grass has a lighter, fresher green treatment; limestone streets are warmer and matte. The cycle, moon, celestial orbit meshes and night point-light updates remain disabled. Large scattered rock props are removed. The forest boundary is closer to Ares, Aphrodite and Hephaestus. Ares (map 5) and Hephaestus (map 9), including their forecourts, lie entirely within forest clearings. All twelve temple placements, decorative grounds, entrance paths, central landmarks and limestone roads remain.

The irregular playable outline spans approximately **409 by 394 metres** and encloses **117,935 square metres**, **46.6% less area** than the former 470-metre square. Geometry beyond it is clipped, with a small nonwalkable ground skirt beneath the back trees. Terrain, forest planting, map artwork and physical perimeter share the same outline. Old saved positions on trimmed land return safely to Arrival Ridge; coins, XP and practice records remain.

## Engine and source checks

Verified with standard **Godot 4.7.2 stable**, Windows and OpenGL Compatibility on Intel Iris Xe:

| Check | Passed assertions | Coverage |
| --- | ---: | --- |
| Gameplay smoke | 26 | Camp/forest loading and release, grounding, eye height, movement/jump, pause, passive creature, saving, healing, fixed clock and evening light |
| Camp | 57 | Twelve temple sites, eighteen safe arrivals, inscription fitting/facing, causeway height, four hall entrances, map/travel, Android Back, fixed evening light and absent night lights |
| Polish | 27 | Surface colors, bundled fonts, readable plaques, practice-only weapons and attacks, no practice economy rewards |
| Training | 44 | Physical arrow flight, scoring, obstructions, five-shot drill, sword combos, timers, pause, cancellation and records |
| Compact boundary | 14 | Legacy save migration, progression, smaller outline, physical perimeter crossings, forest-side roots, both complete temple forecourts inside the forest, retained approaches and absent celestial models |
| Graphics (display) | 32 | Balanced/High persistence, transforms, near/far tree coverage, shadow/leaf distances, resolution, retained scenery/physics, released setup data and menu rendering |
| Touch (display) | 26 | Simultaneous movement/look/action, clean release, bow drawing/shooting, map/travel and weapon restrictions |
| Creature integration | 17 | Existing three mesh levels, shared skeleton, distance switching, attack continuity, walking scale and physical grounding |
| Evening atmosphere (display) | 24 | Sky fill, comfortable exposure, western sun, one shadow pass, bounded haze/radiance cache, baked cloud coverage, exact-layout contact alignment, leaf lighting, six bounded rays, opaque water, static lighting, paused drift and unchanged draw submissions after cloud movement |

**267 assertions passed**, with no script failures. The headless backend does not establish GPU behavior; graphics and touch checks ran through the Windows display driver. Some managed launches report denied shader-cache/log-directory or certificate-store access. These host diagnostics did not prevent import, testing or display rendering; the game does not request network access.

Nine ground-level views were rendered at **1280×720** with phone controls: Arrival Ridge, Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares, Hephaestus and Aphrodite. Three additional elevated views check trees around those outer temple clearings; the interactive map was captured too. Short desktop samples were approximately 22–29 FPS while other checks/builds ran. They are not controlled benchmarks or Android results.

The preceding compact-map browser TypeScript check and complete source suite passed; browser gameplay/render code is unchanged by this native atmosphere checkpoint. Coverage includes every temple approach and trail, whole-building forest inclusion for Ares/Hephaestus, rear-tree coverage behind the three outer temples, rooted scatter, all five tree varieties, protected roads, fixed lighting, moving clouds and opaque water. The static website and portable pages rebuilt successfully; all twelve temple pages passed identity, selector, return-link and asset-path checks. This does not establish browser GPU performance.

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

The 116-file editable archive includes the new baked maps and shader include as well as the original camp assets. Every entry matched its current source file, and every extracted art payload matched the manifest hash. A fresh extraction imported successfully and passed 26 gameplay smoke, 14 boundary and 23 headless lighting assertions: 63 additional archive checks. Test saves are isolated from player progress. The managed launch first stopped while importing a font; completing the import with access to Godot's normal font/editor cache folders succeeded.

## Evening atmosphere budget

Cloud volume lighting is baked offline into one 2048×1024 panorama containing four sparse banks. A global phase moves their visible positions; the shader uses no built-in clock/camera inputs or changing material uniforms. An actual display test measured **605 → 605 draw submissions** after changing that phase, confirming that cloud drift did not submit a new sky-radiance bake. This comparison is specific to the tested viewport, not an Android benchmark.

The sky supplies ambient light/reflections through a 128-pixel cache. One 2048-pixel directional shadow map, 2× MSAA and a restrained filmic exposure are shared by both presets. A 1536×1536 RGBA field approximates root/foundation contact, canopy light/ambient visibility and terrain height. It is tied to the current layout hash and all 3,470 retained tree placements; this is not full global illumination. Turf and grass blades use a small material ambient term to preserve freshness in shade without raising road exposure.

Six transparent, depth-tested shafts fade at their ends and are culled beyond 38 metres. They add no point lights, collision or shadow passes. Distant haze begins at 78 metres in camp; it does not cover the nearby scene or sky. No screen-space AO, volumetric fog or full-screen raymarch is enabled. This is a deliberate lighting approximation for the existing Compatibility renderer.

The source cloud panorama and ground field add about 1.9 MB before engine import. That compressed file size is not GPU memory use. Larger shadow buffers, antialiasing, field lookups, leaf backlighting and rays have runtime costs; no claim of unchanged Android performance is made.

## Android build and device limits

The normal test APK is `builds/asterion-test.apk`, **131,477,087 bytes**, version 0.1.0, package `com.pmwvisuals.asterion`. It uses the release export template with the local testing signature. Independent `apksigner` verification confirms **v2/v3 signatures**. It includes ARM32 and ARM64 libraries, with minimum API 24. This is a test build; publishing requires a store signing key. SHA-256:

`b63567e1c45d55ae3c78d0f851bd43292b2ac68c5dc555847e07ea9958d76265`

The evening-atmosphere build has **not been installed or benchmarked on the tablet** because the authorized SM-T515 was unavailable during final testing. No Android FPS, memory-stability or sustained-play improvement is claimed for this checkpoint. The new build has fewer placed instances and collision faces, and no cycling light/sky work; the new atmosphere has additional bounded rendering costs, so the earlier reductions alone do not establish smooth play.

The previous untrimmed build ran on the user's SM-T515: Android 11/API 30, approximately 2 GB physical RAM and a 32-bit ARM runtime, with Mali-G71 OpenGL Compatibility. Basic camp rendering, touch movement, map travel, weapon selection and both graphics settings responded. Its last controlled Arrival Ridge sample was **3.075 FPS on Balanced** over 24 presentation intervals; PSS was 274,975 kB and swap PSS 197,492 kB in a snapshot. These are historical results for the old map, not the new build. Larger tree batching experiments previously triggered low-memory terminations and remain excluded.

Further physical-device checks are required for loading, sustained FPS, memory, heat, complete combat drills, save/lifecycle behavior and background memory pressure. Laptop rendering does not predict Android performance, nor do the old 2 GB tablet's measurements establish results for 4/8 GB phones.

## Remaining migration work

The native app includes camp exteriors and functional practice. Temple interiors, quests and the large deep-forest landscape remain to be migrated. The separate forest is a small encounter test region; its boar remains passive because combat is enabled only at the training ground. The native baked cloud panorama and limited canopy rays approximate the browser atmosphere. Full browser volumetric clouds, localized mist, wind and advanced water reflections are not fully reproduced in Godot. Animated hands, combat audio, future creature encounters and death/charge animations remain future work.
