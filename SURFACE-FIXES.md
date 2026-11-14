# Walking height and terrain surface repairs

Native standing eye height is 1.82 m above the capsule's feet, increased from 1.64 m. The capsule is 1.95 m tall, with its bottom still at the foot origin. This preserves physical grounding, jumping and weapon reach while giving the player a taller standing viewpoint. Checks measure eye height against actual raycast collision at Arrival Ridge, training and the lake, rather than only against the coarse heightfield.

Roads and decorative soil previously sampled the same continuous height function using different triangles. In the training yard, both also used the same 0.065 m lift. Their rendered planes intersected, producing the scattered triangular fragments in the screenshot. Increasing only a depth offset would conceal some flicker without fixing those intersections.

`terrain-surface.ts` clips road and soil footprints against the actual terrain mesh triangles. Both surfaces follow the identical piecewise-linear landscape. Soil overlays sit 0.025 m above it, roads at 0.11 m; rendered roads and their collision use the same resulting mesh. Whole road strips and patch boundaries avoid unnecessary subdivision. Temporary clipping data is released after world construction.

The lake bank rose above the old straight causeway ramp. The ramp now follows the larger of the bank surface and its original incline. A small clearance at the road join avoids another coplanar overlap. A physical capsule test walks from shore over the bank onto the causeway without teleportation.

The same source repairs feed browser and native assets. Temple placements, map boundaries and the evening lighting remain unchanged. The retained map has 911,338 scenery triangles, versus 871,272 before these repairs; exact collision has 276,402 faces versus 233,848. Extra triangles are concentrated at the surface fits. No device FPS improvement is claimed from a visual correctness repair.

Validation includes TypeScript, terrain-overlay geometry checks on a peaked ridge, browser build/subdirectory links, native standing-height and continuous causeway walk checks, smoke tests, temple/travel checks, practice drills and ground-level rendered views. See `native/VALIDATION.md` for the current Android artifact and verification limits.
