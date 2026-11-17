# Poseidon ash-marble sculpture and fitted trident — 17 November 2026

Imported the complete 39,891,876-byte Revopoint scan, replaced its blue finish with neutral ash-grey marble, leveled the scanned base and fitted the separately supplied trident through the lower fist with an outward lean. The assembly is one GLB with two meshes. The scan falls from 1,485,025 to 219,982 triangles; original face, beard and cloth detail remain visible in the inspected Blender and temple renders. An editable assembly is preserved under assets-source/temple-statues. Both CC BY 4.0 source attributions and adaptations are included in the asset credits and pause screen.

The 43 real-renderer temple checks pass, covering all three supplied statues, combined Poseidon/trident nodes, ash-marble material, floor contact, safe controls, return travel, scene release and all twelve entrance statuses. Player-height views were rendered on Windows OpenGL and inspected. Android performance is not measured by these checks. The new export uses the existing optimized ARM32/ARM64 template and local test signing key.

# Supplied temple sculptures — 17 November 2026

Prepared and installed the complete Zeus OBJ/textures and Ares GLB on their temple daises. Corrected Zeus source up-axis and Ares entrance orientation. Added collision, localized statue lighting, original texture adaptation and credits. The trident is prepared but not placed separately. Poseidon is blocked by a truncated 2.9 MB download whose GLB header declares 39.9 MB. The original source files are retained under assets-source/temple-statues. Ares is CC BY-NC 4.0; Zeus rights are unverified. See TEMPLES.md and the asset credits.

# Deepwood exploration contracts and discovery rewards — 17 November 2026

Four numbered stone survey marks now occupy the entrance trail, eastern ridge, wolf-grove rim and northern-hollow rim. Two optional contracts, Read the Woods and The Lost Survey, unlock independently of the hunting story after training and then the first survey respectively. The existing one-active-contract rule, camp-only acceptance/claiming and safe-return requirement remain. The Journal labels exploration contracts, names explicit prerequisites, displays saved discovery counts, offers directions before discovery and preserves site history afterward.

First discoveries grant 10/15/20/25 XP and 0/5/8/12 gold. Survey completions grant 65 XP/25 gold and 110 XP/50 gold. Unique receipts prevent re-reading, travel or reload from paying twice. Early discovery receipts populate objectives when their contracts are accepted. Session transactions save receipts, progression and rewards together; save failure restores the previous state. Save migration preserves old quests, loot, currency and supplies. The new discovery dictionary accepts only known boolean receipts.

120 checks passed: 23 exploration rules/save checks, 22 actual-scene exploration/Journal checks, 36 existing adventure-rule checks and 39 existing combat/gameplay checks. Real scene checks cover all four marker positions, terrain alignment, generous distance from automatic creature notice at the two deep sites, distance/facing limits, wall obstruction, pause/combat guards, actual Interact rewards, Journal count/history, a safe camp return, one-time claim, forest re-entry and existing caches. Player-height cairn and Expedition Record screenshots were rendered and inspected. Legacy Journal acceptance checks select the intended quest by stable metadata now that two branches can be offered.

The markers use shared low-complexity procedural meshes and ordinary materials with bounded display distances. No terrain, vegetation or external model changes are included. The complete native archive and signed ARM32/ARM64 `builds/asterion-deepwood-exploration-test.apk` include this revision. Physical Android performance and sustained play remain unmeasured for these additions.

## Earlier checkpoints

# Three ancient temple interiors — 17 November 2026

Zeus, Ares and Poseidon open from camp into separate safe interior scenes; the other nine show Coming Soon. Weathered limestone, restrained marble altars/capitals, dark timber coffers, aged bronze, clay offerings and distinct reliefs replace the initial bright palace palette. No statues are created. Forty-one focused temple/travel/UI checks and the existing camp suite pass. Three player-height views were rendered on Windows OpenGL. Mobile performance remains unmeasured for this revision. See TEMPLES.md.

# Simplified central road junction — 16 November 2026

The arrival junction around `(0,32)` uses one rectangular 30-by-26-metre paved court. Its footprint covers the small pointed grass islands and suppresses road borders inside the court. A single outside outline joins the surrounding roads with crossing openings. The court is stamped onto the actual terrain, shares walkable collision with the paving, and clears vegetation through the source reservation and road-cover mask. The compact camp boundary and structure placements are unchanged.

All 57 native camp checks and eleven physical temple-approach checks pass. The same player-height junction view from the user's screenshot was rendered and inspected: the internal triangular edging is gone. TypeScript, landscape/road geometry tests, compact-boundary checks and the browser build pass. Native scenery, surface cells, collision and contact/canopy lighting were rebuilt. The existing quest/journal/gameplay systems are retained.

Updated local deliverables are the editable native project and `builds/asterion-central-court-test.apk`. Android device performance for this layout refinement remains unmeasured.

## Earlier checkpoints

# Continuous limestone road outline — 16 November 2026

Individual Greek-key road blocks are replaced by a continuous low bevelled limestone ribbon. Adjacent sections share vertices; the outline follows the original route curves and terrain. Spatial road queries leave crossings open. Short rectangular returns connect nearby outline ends at tight triangular grass-island tips, avoiding pointed decorative wedges. No legacy road-block batches remain in the exported camp. The former garden courts stay removed.

TypeScript, road/landscape geometry checks, browser build and all temple-page checks pass. The existing 57 camp checks and eleven physical temple-approach checks passed before the final corner-return adjustment; only the decorative outline changed in that adjustment. Native player-height junction views were inspected. Quest, journal, economy and forest gameplay from the current checkpoint are retained. Native collision, surface cells and contact/canopy lighting were regenerated.

The editable archive and `builds/asterion-road-outline-test.apk` contain this revision. Android device performance has not been measured for this edging change.

## Earlier checkpoints

# First playable adventure chapter — 16 November 2026

See [ADVENTURE.md](ADVENTURE.md). The native game now includes three story quests, one repeatable hunting contract, level progression, gold, healing inventory/shop, three persistent one-time caches, and four forest PvE encounters using the existing models. Camp and the woodland entrance stay safe. The imported mantis guards the northern hollow so danger increases deeper in the forest.

Rule tests cover the economy, quest ordering, duplicate reward protection, early-cache story recovery, level growth, malformed values, save/reload and save-failure rollback. The scene integration test uses real camp/forest travel, creature models, melee visibility and physical arrows; it covers wind-up/dodging, pause, rewards, healing, journal controls, a safe quest return, saved respawn suppression and defeat recovery without progress loss. Existing training and landscape/travel tests are retained. Model-patrol tests explicitly isolate combat when checking authored animation routes.

Validation passed: 36 rules/save/economy assertions, 39 complete-scene gameplay assertions under Windows OpenGL, 44 existing physical training assertions and 33 landscape/travel assertions. The headless gameplay suite also passed before the final UI-button checks were added. Forest combat and Journal captures were inspected. The real-renderer cooldown test extends its fixture timestamp because loading/rendering on this development laptop can outlast the normal ninety-second cooldown; production cooldown duration remains ninety seconds.

The new Android development APK uses the optimized engine template, existing package identity and local test signing key. ARM64 and ARM32 are included, minimum API is 24, and v2/v3 signatures verify. No fresh phone result is claimed: the Xiaomi was disconnected. Known low FPS and intermittent High startup crashes are still unresolved; this chapter changes gameplay rather than performance or landscape design.

# Forgotten Shrine moved into the boundary forest — 16 November 2026

The shrine now stands at `(-92,-155)`, rotated toward the camp, inside the northwestern boundary forest between Zeus and Hephaestus. Its small level clearing has an 8.5-metre radius. The narrow 1.65-width source approach, discovery coordinates, inscription and sign share the new site. Nearby tree roots leave 4.5 metres of approach clearance so crowns do not obstruct the view. The native export records the same shrine metadata. The former shrine at `(-40,-108)` and its bespoke woodland overlay are removed from the camp; the normal grass and scattered planting fill that area. Deepwood Gate and the rounded 125,186-square-metre map outline remain unchanged. The legacy standalone browser woodland page retains its own builder.

Native scenery, physics, surface cells, habitat and contact/canopy lighting were rebuilt. All 92 native checks passed: 57 camp regressions, nine shrine relocation checks, ten plant checks and sixteen boundary checks. Physical rays verify that the new foundation collides at the visible platform and the old altar has disappeared. Player-height approach, forecourt and former-site views were rendered and inspected. Source checks verify forest placement, level foundations, surrounding trees, unobstructed planting, continuous road coverage and the unchanged boundary. TypeScript, the browser build, forest/boundary tests and all twelve temple pages pass.

The remaining camp planting uses 21,501 imported grass clumps, 103 shrubs and 204 small flowering bushes. The grass budget check now allows removal of the old dense grove. The boundary test limits its celestial-sphere check to high-altitude objects so local forge flames do not produce a false failure.

The updated candidate is `builds/asterion-shrine-relocation-test.apk`. Android device performance for this change remains unmeasured. The complete editable project includes the prepared camp assets and scripts.

## Earlier checkpoints

# Camp road joins and temple approaches — 16 November 2026

All eleven land temple approaches now extend from their former 16-metre endpoints to local z=9.8, overlapping the entrance ramp at z=10. A waypoint at z=16 aligns the final approach. Browser rendering, walkable collision, vegetation road masks and exported map routes share these extensions. Poseidon retains its dedicated causeway. Road terminal footprints receive rounded caps, and road-border junction rejection uses the full paved width plus block clearance. The four circular flower courts are temporarily removed, including soil overlays, planting, fountains and edging; arbor walks remain.

The original camp was regenerated with updated collision and contact/canopy shading. All 57 camp regression assertions, ten imported-plant checks and eleven physical ray checks along the former temple gaps passed. Ray checks sample four positions on every extended land approach and confirm a raised walkable paved surface. Rendered views of Hera, Athena, Ares, training, Wayfarer, arrival and the former flower courts were inspected. The terrain-overlay and road-border/browser tests, TypeScript checking, browser build and all twelve temple-page checks passed.

The editable project and `builds/asterion-road-repairs-test.apk` contain these changes. Android device frame rate and sustained play for this revision remain unmeasured.

## Earlier checkpoints

# Rendering profiling — 16 November 2026

See [RENDER-OPTIMIZATION.md](RENDER-OPTIMIZATION.md) for the controlled comparisons, retained terrain/surface improvements and unresolved High startup crashes. The normal playable checkpoint measures 4.74 FPS at Arrival Ridge; that remains below smooth play. Later art changes below are retained in source.

# Giant fern removal and shrine clearing — 16 November 2026

The giant woodland fern (`forest_fern`, 1.7-metre source asset) is retired from every plant collection and from the camp, forest-belt and Deep Forest placement outputs. The native forest prototype export excludes it, and the unused standalone GLB and manifest entry are removed. Its original authoring source remains archived outside the game. All other Deep Forest floor placements retain their transforms: 15,435 litter, low bracken and bramble placements remain after removing 4,565 giant ferns. All 5,200 forest trees remain.

The Forgotten Shrine has no tall bramble or bracken within twelve metres, and woodland olive trunks stand at least thirteen metres from the shrine. Short grass remains in the forecourt, with density fading outward into the surrounding woodland. Within twenty metres, woodland grass falls from 5,140 to 2,393 placements (53.4% fewer). Runtime camp totals are 31,174 imported grass clumps, 156 shrubs and 264 small flowering bushes. Collision and the contact/canopy shading maps were rebuilt from the current source layout.

107 native assertions passed: 57 camp checks, 33 forest checks, 10 imported-plant checks and seven focused shrine/fern checks. Two player-height shrine views were rendered and inspected using Windows OpenGL. Checks confirm no giant-fern camp draws, no Deep Forest fern prototype or placement, the open shrine forecourt, grounded replacement plants, working map travel and repeated forest entry. TypeScript checking, forest/boundary tests, the browser build and all twelve temple-page checks also passed.

The updated editable archive and `builds/asterion-shrine-vegetation-test.apk` are local test deliverables. Android device performance for this revision has not been measured. Existing creature materials, peaceful behaviour, campfire and Balanced/High settings are preserved.

## Earlier woodland creature material refinement — 16 November 2026

The three supplied creatures now use local non-emissive, nonmetallic material overrides, roughness 0.94 and specular response 0.08. Roughness/metallic texture slots are cleared so their values cannot reintroduce gloss from the imported packed maps. Clearcoat and rim lighting are disabled. The wolf receives a muted grey-blue woodland tint `(0.68,0.72,0.67)`, and the blue boar receives `(0.85,0.88,0.83)`. Diffuse and normal textures continue to provide their source detail. Material overrides keep the original imported resources intact.

All 14 focused material assertions passed across initial forest entry and re-entry. Checks cover emission, metallic response, roughness, specular limits, clearcoat/rim flags, wolf tint and matching original diffuse/normal texture references. Three idle creature views, walking wolf/boar views and the credits screen were rendered through the Windows display driver and inspected in the actual forest lighting. This change adjusts the supplied animals' materials. Device frame rate and memory remain untested for this revision. The current Android candidate is `builds/asterion-creature-materials-test.apk`.

## Earlier three supplied forest creatures — 15 November 2026

One Magic Wolf, mutant mantis and fantasy blue boar now accompany the original Ash-Tusk Boar in separate Deepwood clearings. Source skin poses are measured once during setup to normalize their scales and align the feet. Target overall heights are 2.1 m, 2.8 m and 1.6 m respectively. Wolf and blue boar follow short routes with idle pauses; the mantis uses its single supplied animation at the ridge. The placement pass retains peaceful behaviour. Model rendering hides beyond 105 m and returns below 95 m. Animation and actor simulation suspend beyond 75 m and while paused.

The wolf retains 24,059 triangles and 15 source clips (including its initial pose), the mantis 6,784 triangles and one loop, and the converted textured blue boar 4,584 triangles and seven clips. Runtime material corrections give the mantis and blue boar a nonmetallic surface. The FBX boar's supplied diffuse texture is connected during conversion. Large differences between bind-pose boxes and animated surfaces are resolved through skin-pose measurement rather than raw mesh bounds. Local material overrides preserve the imported resources across repeated forest entry.

**108 assertions passed**, comprising 34 supplied-creature checks, 33 forest checks, 15 original-boar checks and 26 gameplay smoke checks. Checks cover actual pose-relative foot alignment, physical floor contact, texture presence, full walking routes, player proximity, pause, distant rendering/animation suspension, credits, region release and repeated entry. Trail tests exclude the live creature actors when measuring the static trunk corridor. Actual Windows/Godot views were inspected for all three creatures, walking wolf/boar poses and the pause-screen credits.

The wolf metadata declares alice.duarte13 and CC BY 4.0. The mantis metadata declares LostBoyz2078 and CC BY-NC 4.0, restricting this asset to noncommercial prototype use until additional permission or replacement. The fantasy-boar archive contains no creator or license statement, leaving distribution rights unverified. Source links, known terms and adaptations are in the packaged `assets/forest-creatures/CREDITS.txt` and the pause screen. Supplied art files remain local and are not committed to GitHub.

The Android candidate is `builds/asterion-forest-creatures-test.apk`, 182,035,657 bytes, with independently verified v2/v3 signatures under the local test key. Both ARM32 and ARM64 and the existing Android Compatibility MSAA workaround are retained. SHA-256 is `006ef1d8d3b5b3430de7be7cc99216edcce20987db96c43ebe7bfb62e9f6876c`. Device frame rate, memory and sustained play for the added models remain untested. This checkpoint is a local prototype.

## Earlier flowing campfire motion — 15 November 2026

The amphitheatre fire now combines independent curling and stretching of thirteen subdivided flame cards with upward-moving texture distortion. The roots stay anchored. Each card stores its own atlas rectangle, keeping animated sampling inside its flame image. Phase offsets avoid synchronized swaying, and the warm local light varies gently between energy 3.02 and 3.38. The original source disappearing animation remains replaced. The supplied flame texture, stone ring and logs are retained. Flame geometry is one shared draw with 1,274 triangles.

The display-driven campfire checks confirm continuous orange flame coverage across four times, a visibly changing silhouette and internal texture, bounded warm illumination and pause freezing both movement and light. In the final run, 4,855 of 9,321 sampled bright flame pixels changed by the motion threshold between two frames. This measures visible animation rather than a uniform change alone. A 60-frame, two-second GIF records actual Godot output. Camp/travel checks also pass. The updated Android candidate is `builds/asterion-fire-motion-test.apk`, 171,923,307 bytes, with independently verified v2/v3 signatures using the local testing key and both ARM32/ARM64 architectures. Its SHA-256 is `8c90b999c3d2cfc606059ee9458ba933cd1967ed44c69260a6329b0ef14f8cb2`. Device performance remains untested for this revision.

## Earlier roaming forest boar — 15 November 2026

The normal native forest entry creates one Ash-Tusk Boar using the existing rigged game model. Its six-point walking route lies inside the first clearing, approximately 90 metres along the main trail from arrival. It walks at 0.55 m/s, turns smoothly, alternates walking and idle pauses, and pauses within 2.8 metres of the player. Activity pauses farther than 65 metres from the player. Existing distance mesh levels and visual culling remain. A blocked movement timer advances the route after a pause. Returning to camp frees the actor, and entering the forest recreates it. A player saved beside the usual spawn gets an alternative boar spawn in the same clearing.

The controller uses a separate passive movement override. Forest behaviour stays peaceful during this creature-placement step. The existing rig, clips, mesh levels, textures, capsule and combat implementation remain available. No creature art is rebuilt by this integration.

**91 assertions passed**, comprising 15 forest-boar checks, 17 base creature checks, 26 gameplay smoke checks and 33 forest checks. The roaming test covers a simulated two-minute route, all six waypoints, physical ground contact, smooth turns, idle/walk transitions, proximity pausing, paused animation, distance culling, return to camp, repeated entry and safe spawning beside a saved player position. Three actual forest views show the approach, idle pose and walking pose. Android frame rate and memory for this integration remain untested. The candidate is `builds/asterion-forest-boar-test.apk`. It retains ARM32/ARM64 support and the existing Android Compatibility MSAA workaround, and passes independent v2/v3 signature verification using the local test key. SHA-256 is `f48c52c4e2fc37c539f1ea104a2427e68083d792e544ab629abef3f0559fff19`.

## Earlier Xiaomi device validation — 15 November 2026

See [XIAOMI-TEST.md](XIAOMI-TEST.md) for the High-only physical-device run, crash evidence, Android MSAA workaround and remaining performance limits. High loads and controls work; approximately 2.8 FPS remains unplayable.

# Darker forest trees and irregular groves — 15 November 2026

The native forest's tree materials now multiply their linear colour by `(0.48, 0.58, 0.46)`, producing darker bark and deep evergreen foliage. Relocation uses a repeatable mixture of grove candidates and loose background candidates, with variable minimum separation. Source species, sizes and all 5,200 tree instances are retained. Root heights are resampled after relocation. The normal trail and clearing exclusions apply to every new tree position.

Measured nearest-neighbour spacing variation increased from 0.105 to 0.189, and tree-density variation across interior 40-metre squares increased from 0.145 to 0.300. These coefficients verify greater variation in spacing and density. A direct data comparison confirms the terrain, paths, clearing definitions, map boundary and 20,000 floor placements retain their previous data. The shader applies the new darkening to tree materials specifically. Saved positions overlapping a relocated trunk recover to nearby open ground.

The forest checks pass all 33 assertions, supported by a 32-assertion display run and seven inspected player-height views. The final added floor-palette assertion also passes. Coverage includes density variation, darker tree materials, the separate floor palette, relocated-trunk recovery, all trail floors and trunk clearances, saved progression, graphics switching and repeated entry. The current Android candidate is `builds/asterion-forest-polish-test.apk`. Device frame rate and memory remain untested for this revision.

## Earlier native deep forest landscape — 15 November 2026

The first native forest landscape replaces the small woodland test area with a 550-metre playable diameter, surrounded by tree scenery to radius 330 m. It reuses the browser forest's rolling terrain, hollows, four connected trails and six clearings. Shared spatial batches place all five existing dark tree types across 5,200 placements, plus 20,000 leaf-litter, fern, bracken and bramble placements. Terrain and collision share 36 chunks of the same triangle grid. Tree roots follow the terrain. Detailed leaves have bounded distances, distant crowns reuse the existing streamer, and nearby trunk collision is created and released as the player moves.

Canopy shadows and cool ambient fill keep the forest readable. Twelve world-space, depth-tested soft mist pockets use fading edges. Peripheral haze hides the outer scenery boundary while the interior keeps its longer view distance. Original tree geometry supplies the canopy. The existing boar remains passive at the first clearing. The return gate leads to camp, and the old test-forest position migrates once without discarding coins, XP or practice records.

**112 assertions passed** for this checkpoint, comprising 29 forest checks through the Windows display driver, 26 gameplay smoke and 57 camp/travel checks. Forest checks include both graphics settings, all four trail floors and trunk clearances, source tree grounding, boundary mist, migration, restored exploration positions and a complete forest after repeated entry. A reload check caught shared material mutation during development. The loader now duplicates mesh resources before assigning region materials. The final repeated-entry run has no script errors. Seven player-height views were rendered and inspected, including the entrance, trail, first clearing, hollow, ridge, deep clearing and outer edge.

Desktop preview samples after warm-up were roughly 38–49 FPS on Intel Iris Xe. These short samples establish appearance and functioning rendering. Android installation, sustained frame rate, memory and heat remain untested for the new forest. The optimized ARM32/ARM64 test APK is `builds/asterion-deep-forest-test.apk`, 173,250,087 bytes, signed with the local test key and independently verified with APK v2/v3 signatures. Its SHA-256 is `e43d5ffb398756a689b641f4a9ba617482978d8366b88863f1886e7013e84516`.

Rebuild prepared native forest assets with `node scripts/export-native-forest.mjs`, then import in Godot. The editable archive contains the prepared GLB, layout and texture maps. Large forest prototype geometry loads during region setup after the previous region is released. Existing camp content and fixed evening lighting remain available through the same entry points.

## Earlier Hephaestus oil lamps — 15 November 2026

Exactly two brass hurricane oil lamps flank the temple entrance on raised plinths. Warm local lights (15 m radius, strength 4.5, no shadows, distance fade at 35–50 m) illuminate the shaded columns, porch, entrance surround and nameplate. The central ramp stays open, and global evening lighting is retained. Both instances share a prepared 15,997-triangle model and 1024 px maps, reduced from the supplied 499,988-triangle lantern. Identical source UV layers were consolidated so Godot uses the correct maps. Flames use a small animated emissive mesh.

Seven rendered forge checks and 57 camp/travel checks passed. The rendered central-facade luminance rises from approximately 0.105 to 0.246 with the lamps enabled at the same camera pose. This is an image comparison on the laptop, not an Android performance benchmark. The existing amphitheatre campfire remains separate. The pause screen and packaged attribution file credit Galaxy Abundant under CC BY 4.0 and link the original model and license.

The current optimized ARM32/ARM64 candidate is `builds/asterion-forge-test.apk`, 165,744,964 bytes, with independently verified v2/v3 signatures using the local testing key. SHA-256: `eb041fd6430202e019d7688bd0f2e4475f6d3a807039523644542b9363b7405b`. The APK includes the attribution text. Device installation, frame rate and memory for this change remain untested.

# Campfire replacement â€” 15 November 2026

The native amphitheatre replaces its seven orange cone flames with thirteen merged flame cards from the supplied campfire asset. The supplied flame atlas retains its original resolution and pixels. Stable visible poses replace the source animation that carries flame pieces below the base and shrinks them away. Bounded vertex movement animates the flame tips while opacity and light energy remain steady. Warm orange/yellow flames use transparent unlit shading, with one short-range shadowless light. The existing stone ring, logs and seating remain.

Nine campfire checks passed through the Windows display driver, including removal of all old cones, one merged flame mesh, no disappearing source animation, visible orange flame coverage at four times across more than one former source-animation cycle, steady illumination and paused movement. Actual camp renders were inspected. All 26 gameplay smoke assertions also passed, including camp/forest transitions, movement, jumping and saving. The optimized ARM32/ARM64 Android APK passes independent v2/v3 signature verification using the local test key. Android performance for the new fire remains untested. The current candidate is `builds/asterion-campfire-test.apk`, with an accompanying SHA-256 file.

## Earlier ridge standing-view follow-up â€” 15 November 2026

The native Arrival Ridge landing moves four metres forward to `(0,109)`, on the camp-facing side of the crest. Old saves within 75 cm of the former arrival recover there. Spawn, map travel and saved-position recovery use the actual physical walking surface; resume queries stop just above the saved feet to avoid selecting a roof. Standing eye height remains 1.82 m. Paving uses approximately 40 cm stones and shallow normal-map relief, replacing the roughly 90 cm pattern that exaggerated the low viewpoint. Browser paving uses the same scale.

**104 assertions passed**: 17 hill checks through the Windows display driver, 4 surface checks, 57 camp/travel checks and 26 gameplay smoke checks. The hill suite compares rendered road triangles, collision rays and settled eyes at ten positions across both slopes, walks uphill across the crest, and checks legacy arrival recovery, indoor/jump saves and map teleportation. The final ground-level Arrival Ridge render was inspected. TypeScript, the browser build, twelve temple-page checks and 66 hosted resource references also passed.

Terrain, collision meshes, plants, temple sites, map boundaries and lighting assets are unchanged from the rounded-boundary revision below. No geometry or new effect is added by this repair. This is a viewpoint/placement correction; it does not establish a frame-rate improvement.

The current Android candidate is `builds/asterion-height-test.apk`, **158,939,311 bytes**, ARM32/ARM64, version 0.1.0. Independent verification passes v2/v3 signing using the local testing key. SHA-256: `332a40c689161e67bacecd572cee95500a8c9023868e6415be659b968ccc3a73`. The tablet's local debugging service was unavailable, so this revision has not been installed or checked on the SM-T515. The editable project archive includes the repair and regression test.

## Rounded camp boundary verification â€” 15 November 2026

The perimeter now follows a rounded convex loop, filling the sharp inward notches around the outer temples. The inner forest line uses smooth broad arcs. Terrain, planting, habitat, map artwork and physical collision were regenerated from the shared boundary source. Contact and canopy shading were rebaked against the new layout hash.

The outline encloses **125,186 square metres**, **6.1% more** than the earlier 117,935-square-metre compact map. Its maximum dimensions are approximately **405 by 392 metres**. Temple placements and approach paths are retained. Source checks verify rooted tree scatter, clear roads and trees behind Ares, Aphrodite and Hephaestus. Both complete Ares and Hephaestus forecourts remain in the forest belt.

**83 native assertions passed** on this revision, comprising 16 boundary, 57 camp/travel and 10 plant checks. The plant checks ran through the Windows display driver. Nine ground-level views, three elevated temple/forest views and the camp map were rendered and inspected. TypeScript, the focused boundary/forest source suites, the website build, twelve temple-page checks and 66 hosted resource references passed. The complete browser suite was stopped after loading the earlier curve revision. Its results are excluded from this verification.

The export contains 917,280 scenery triangles, 55,067 source instances across 2,585 spatial batches, 2,400 border trees and 284,872 exact collision triangles across 44 chunks. Runtime remapping produces 33,908 imported grass clumps, 156 camp shrubs and 264 small flowering bushes. The Android candidate is `builds/asterion-boundary-test.apk`. Tablet installation, sustained frame rate and memory remain untested for this revision.

The optimized ARM32/ARM64 APK is 158,939,311 bytes and passes independent v2/v3 signing verification using the local testing key. SHA-256 is `a3153ccc828bbb25a12be0ebf0d8e93988ac941564871981260e12c17a67b883`. A direct data comparison confirms all twelve temple placements, road routes and terrain elevation samples match the previous camp. Plant GPU-compression settings are retained.

## Earlier evening atmosphere verification â€” 15 November 2026

The current surface revision raises standing eye height from 1.64 m to **1.82 m**, with a 1.95 m physical capsule. Road/soil footprints are fitted to the actual terrain triangles, with distinct layers. The lake ramp follows the bank where needed, keeping the original incline elsewhere and avoiding a coplanar seam at the road join. Geometry and exact collision were rebuilt; the atmosphere field was rebaked against the new layout hash.



**131 surface-revision assertions passed**: 4 surface checks (actual collision-relative eye height at Arrival/training/lake and a physical continuous shore-to-causeway walk), 26 smoke, 57 camp/travel and 44 training checks. After the final small ramp clearance adjustment, the 4 surface and 26 smoke assertions passed again. TypeScript, a peaked-ridge overlay geometry test, the browser build and 66 subdirectory resource references passed. All nine exterior views were checked, followed by final captures at Arrival, training and lake: the broken sand/road fragments and exposed bank are absent. The signed APK verifies v2/v3 signatures. Android performance has not been retested for this repair.



Extra surface-fit triangles increase retained scenery from 871,272 to 911,338 and collision from 233,848 to 276,402. Temporary terrain clipping data is released after construction. These correctness changes do not establish a performance improvement.





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



**267 assertions passed at the preceding lighting checkpoint**, with no script failures. The headless backend does not establish GPU behavior; graphics and touch checks ran through the Windows display driver. Some managed launches report denied shader-cache/log-directory or certificate-store access. These host diagnostics did not prevent import, testing or display rendering; the game does not request network access.



Nine ground-level views were rendered at **1280Ã—720** with phone controls: Arrival Ridge, Great Hall, Wayfarer Hall, training yard, lakeside, Poseidon, Ares, Hephaestus and Aphrodite. Three additional elevated views check trees around those outer temple clearings; the interactive map was captured too. Short desktop samples were approximately 22â€“29 FPS while other checks/builds ran. They are not controlled benchmarks or Android results.



The preceding compact-map browser TypeScript check and complete source suite passed; browser gameplay/render code is unchanged by this native atmosphere checkpoint. Coverage includes every temple approach and trail, whole-building forest inclusion for Ares/Hephaestus, rear-tree coverage behind the three outer temples, rooted scatter, all five tree varieties, protected roads, fixed lighting, moving clouds and opaque water. The static website and portable pages rebuilt successfully; all twelve temple pages passed identity, selector, return-link and asset-path checks. This does not establish browser GPU performance.



## Assets and loading



| Measure | Previous untrimmed map | Compact map |

| --- | ---: | ---: |

| Placed native instances | 77,602 | 54,915 |

| Spatial batches | 4,411 | 2,518 |

| Shared prototypes | 48 | 44 |

| Scenery triangles | 985,778 | 911,338 |

| Scenery GLB bytes | 77,606,036 | 54,919,360 |

| Collision triangles | 475,218 | 276,402 |

| Physics chunks | 61 | 43 |

| Physics-only scene bytes | 4,135,917 | 2,364,437 |



The border retains 2,400 dark trees using five existing model varieties, with irregular spacing and protected temple clearings. All exported dark border trunks were audited against the shared forest-start polygon: none are on the camp side. Browser understory budgets are 34,000 grass clumps and 5,500 shrubs/ferns/litter plants in the smaller belt. Native export retains rendered source groups; these browser budgets are not a claim that all hidden browser cells load in the app.



Four palette materials and spatial groups preserve the retained architecture's surface colors, roughness and metallic finish. Directional shadows, opaque blue water and nearby model detail remain. Both graphics presets use the same assets; their resolution, distance detail and shadow ranges are unchanged. The conservative tablet-compatible 96-metre distant tree groups remain; no aggressive bulk-upload experiment is included.



Physics baking compares every retained collision face and transform against the source. Android loads the compressed physics scene without loading the collision GLB as graphics. The editable archive retains that GLB for rebuilding. Every packaged art payload is checked against the byte size and SHA-256 in `assets-manifest.json`; source payload size is not runtime RAM use.



The prior lighting checkpoint's 116-file editable archive includes the new baked maps and shader include as well as the original camp assets. Every entry matched its current source file, and every extracted art payload matched the manifest hash. A fresh extraction imported successfully and passed 26 gameplay smoke, 14 boundary and 23 headless lighting assertions: 63 additional archive checks. Test saves are isolated from player progress. The managed launch first stopped while importing a font; completing the import with access to Godot's normal font/editor cache folders succeeded.



## Evening atmosphere budget



Cloud volume lighting is baked offline into one 2048Ã—1024 panorama containing four sparse banks. A global phase moves their visible positions; the shader uses no built-in clock/camera inputs or changing material uniforms. An actual display test measured **605 â†’ 605 draw submissions** after changing that phase, confirming that cloud drift did not submit a new sky-radiance bake. This comparison is specific to the tested viewport, not an Android benchmark.



The sky supplies ambient light/reflections through a 128-pixel cache. One 2048-pixel directional shadow map, 2Ã— MSAA and a restrained filmic exposure are shared by both presets. A 1536Ã—1536 RGBA field approximates root/foundation contact, canopy light/ambient visibility and terrain height. It is tied to the current layout hash and all 3,470 retained tree placements; this is not full global illumination. Turf and grass blades use a small material ambient term to preserve freshness in shade without raising road exposure.



Six transparent, depth-tested shafts fade at their ends and are culled beyond 38 metres. They add no point lights, collision or shadow passes. Distant haze begins at 78 metres in camp; it does not cover the nearby scene or sky. No screen-space AO, volumetric fog or full-screen raymarch is enabled. This is a deliberate lighting approximation for the existing Compatibility renderer.



The source cloud panorama and ground field add about 1.9 MB before engine import. That compressed file size is not GPU memory use. Larger shadow buffers, antialiasing, field lookups, leaf backlighting and rays have runtime costs; no claim of unchanged Android performance is made.



## Android build and device limits



The normal test APK is `builds/asterion-test.apk`, **133,414,495 bytes**, version 0.1.0, package `com.pmwvisuals.asterion`. It uses the release export template with the local testing signature. Independent `apksigner` verification confirms **v2/v3 signatures**. It includes ARM32 and ARM64 libraries, with minimum API 24. This is a test build; publishing requires a store signing key. SHA-256:



`43d1b9ab949381cc9700220d84822857483b9e09610dca2020caa5dbc7013fea`



The evening-atmosphere build has **not been installed or benchmarked on the tablet** because the authorized SM-T515 was unavailable during final testing. No Android FPS, memory-stability or sustained-play improvement is claimed for this checkpoint. The new build has fewer placed instances and collision faces, and no cycling light/sky work; the new atmosphere has additional bounded rendering costs, so the earlier reductions alone do not establish smooth play.



The previous untrimmed build ran on the user's SM-T515: Android 11/API 30, approximately 2 GB physical RAM and a 32-bit ARM runtime, with Mali-G71 OpenGL Compatibility. Basic camp rendering, touch movement, map travel, weapon selection and both graphics settings responded. Its last controlled Arrival Ridge sample was **3.075 FPS on Balanced** over 24 presentation intervals; PSS was 274,975 kB and swap PSS 197,492 kB in a snapshot. These are historical results for the old map, not the new build. Larger tree batching experiments previously triggered low-memory terminations and remain excluded.



Further physical-device checks are required for loading, sustained FPS, memory, heat, complete combat drills, save/lifecycle behavior and background memory pressure. Laptop rendering does not predict Android performance, nor do the old 2 GB tablet's measurements establish results for 4/8 GB phones.



## Remaining migration work



The native app includes camp exteriors and functional practice. Temple interiors, quests and the large deep-forest landscape remain to be migrated. The separate forest is a small encounter test region; its boar remains passive because combat is enabled only at the training ground. The native baked cloud panorama and limited canopy rays approximate the browser atmosphere. Full browser volumetric clouds, localized mist, wind and advanced water reflections are not fully reproduced in Godot. Animated hands, combat audio, future creature encounters and death/charge animations remain future work.



## Supplied planting replacement â€” 15 November 2026



The native camp now replaces its ground-cover grass and multipart camp myrtle/laurel shrubs using the two supplied GLB packs. Fifteen rooted grass variants and two whole bushes are prepared. There are 33,912 grass placements, 155 camp shrubs and 265 sparse flowering-bed bushes; flowering bushes are excluded by the forest habitat mask. All original dark forest and bramble trunk counts are preserved. Root heights follow terrain with a 2.5 cm inset. Buildings, roads and collision data remain unchanged.



The new materials use alpha cutout rather than alpha blending, two-sided leaves, alpha-to-coverage and softened highlights. Nine shared maps retain their original 1024/2048 resolution; their import settings generate desktop S3TC and Android ETC2 compression with mipmaps. Source PNGs and import metadata are included in the editable package. The original input packs are retained separately with hashes and are documented as user-supplied third-party assets.



Ten display-driven plant assertions, 57 camp assertions and 32 display-driven graphics assertions passed. The plant checks cover rooted scale, cutout textures, population, exclusive replacement counts, terrain contact, forest exclusion and preservation. Godot captures include a small sample patch, garden and lakeside close views, Arrival Ridge and training under both graphics settings. Initial laptop samples were 26â€“28 FPS at 1280x720, depending on view/preset; these are short samples rather than a controlled performance comparison.



The separate Android candidate is builds/asterion-plants-test.apk. Its v2/v3 signatures verify. Physical-device frame rate, memory use and loading stability have not been tested for this planting change. The previous default test APK is retained. See the repositorys IMPORTED-PLANTS.md for source files and rebuild steps.



The 144-file editable planting archive was extracted into a separate directory, imported from scratch, and passed all ten display-driven plant checks. All nine plant texture import configurations are included and retain GPU compression. The final planting APK is 158,693,551 bytes; independent verification confirms v2/v3 signatures. SHA-256: 5e9ac2d0c329a2e64c9c900dca8897cc2cbfe5580e75f777dc5423cd836133f4. It has not been installed on the tablet in this pass.

