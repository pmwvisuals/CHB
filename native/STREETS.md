# Camp street review — 18 November 2026

The camp now has one primary street and only the access branches needed to reach destinations. The former promenade loop, duplicate temple approaches, disconnected road pads and freestanding central square are removed. Building positions and the compact forest boundary remain unchanged.

## Problems corrected

- Several independent systems previously drew roads: shared camp routes, separate temple trails and a central court. They created redundant paving, oversized intersections and inconsistent map lines.
- All pavement now comes from one authored route network. Its non-overlapping union also supplies continuous limestone edging, grass exclusion, walking collision and map footprints.
- The main street passes around the Great Hall and its seating. It leads from Arrival Ridge to Deepwood Gate, with a short hall entrance rather than a road through the building.
- West/east access lanes serve the temples and halls. Training, the campfire, shrine, lake pavilion and dock receive only their required approaches. No ornamental street loop or spare square remains.
- Small rectangular landings connect the rotated temple ramps. They are entrance connections, not separate plazas. The Poseidon causeway is retained.
- The lake path stays outside the hall and on the shore. The dining sign has been moved off its walking line.

## Measured footprint

| Measure | Reviewed layout |
| --- | ---: |
| Dry paved area before | 12,219.2 m² |
| Dry paved area now | 5,664.5 m² |
| Paving removed | 53.6% |
| Connected road networks | 1 |
| Primary streets | 1 |
| Freestanding plazas | 0 |
| Authored street/access routes | 24 |

Areas measure the union of dry paving, including entrance landings; the unchanged island causeway is shown on the map separately. Route count includes each required destination branch, not 24 main roads. The main paved width is about 4.6 m; most access paths are 2.6–3.2 m wide.

## Review on the map

Press **M** or tap **MAP**. The default street-plan view shows the actual paved widths and rectangular footprints, with the primary street in gold, access paths in cream and building footprints in grey. The lake, training yard, campfire, shrine, dock and forest gate identify every destination. **SHOW PLACE NUMBERS** restores the numbered overlay; the destination travel buttons remain available in both views.

The browser map also uses the same paving footprints. Native exports carry those footprints in `camp-layout.json`, rather than maintaining a separate hand-drawn street diagram.

## Validation

The source suite passes movement, all 11 named service-road traversals, all 12 temple entrances, the island causeway in both directions, grounded road collision, standing eye clearance and jump landing checks. Geometry checks verify a single connected paving union, orthogonal legs, every dry temple approach, no road through temple centres or the hall, and the reduced area. Other camp, forest, training and progression checks pass.

The rebuilt Godot camp passes 39 street/map checks, 57 camp checks and 4 surface-render checks. Physical support is checked along every exported route and all 11 dry temple ramps. Map overlay switching and travel remain functional. Actual Windows renders of Arrival Ridge, the hall, lakeside, gate and map were inspected. `tests/street_review.gd` regenerates these views and a 1600×1600 plan in `builds/camp-street-plan.png`.

The browser production build, hosted/portable-page checks and TypeScript checks pass. The local Android candidate is `builds/asterion-street-review-test.apk`; this revision has not been benchmarked on a physical Android device.
