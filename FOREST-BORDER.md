# Surrounding forest

The compact playable outline spans approximately 409 by 394 metres and encloses 117,935 square metres, 46.6% less than the former 470-metre square. Unused outer terrain and large scattered rock props are removed. A small ground skirt supports back trees outside the physical perimeter.

Ares (map 5) and Hephaestus (map 9), including their forecourts, sit completely beyond the forest start. Aphrodite (map 10) is also embedded in forest. All buildings retain their locations, decorative grounds and walkable approach roads. Protected clearings prevent trunks from entering architecture. Overlapping crowns and 2,400 irregularly scattered border trees enclose those clearings; an adaptive rear layer follows the actual outer outline instead of stopping before the temple bulges.

Five existing dark Blender tree varieties retain their model detail. Roots sample nearby soil and embed their bark bases. The shared `camp-boundary.ts` outline drives terrain clipping, physical walls, map artwork, forest planting and browser mist/shading. All dark border trunks begin on its forest side. Interior placements either use camp trees or are restricted to the true belt, eliminating misleading stray front trees.

The browser floor contains 34,000 grass clumps and 5,500 shrubs, ferns and litter plants inside the smaller belt, with roads and temple grounds protected. It retains wind, distance-aware mist and canopy shading. The native version currently uses distance fog; browser volumetric mist is not fully ported. Native exports include currently rendered source placement groups and retain the conservative tablet-compatible streamer.

This border is scenery for the surrounding PvE forest; the separate development forest is unchanged. See `native/VALIDATION.md` for engine tests, views and performance limits.
