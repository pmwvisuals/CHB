# Training ground and lakeside

This art pass completes only these two main landmarks. Both remain part of the safe outdoor camp, with no combat mechanics or swimming added.

The training yard has a terrain-following sand surface, bronze sparring-circle inlays, three archery lanes and straw targets, embedded arrows, three leather-and-straw dummies, a two-gate timber boundary, animated entrance banners, seating, and a shaded equipment pavilion with spears, shields and water jars. The western gate preserves the routes to the remote temples.

Mirror Lake has an opaque blue surface with animated ripple normals, sky/cloud reflections and eastern sunlight highlights. A ramp leads onto a railed timber dock beside two hollow, moored canoes. The open boat shelter contains paddles, supplies and a bench. New shore paths connect the dock and open marble viewing pavilion; seating, lanterns, lilies and grounded reeds complete the banks. Poseidon's causeway and island access remain intact.

The training ground is a discoverable map landmark. Counts use the landmark catalog rather than a hard-coded total. Existing discovery saves remain compatible.

The geometry is authored directly in Three.js and batched with the existing camp. `landmark-layout.ts` shares planting clearance and dock spawn heights with the terrain and movement systems. Walking tests cover both training gates, the equipment pavilion, the dock in both directions, dock rail collision and the lakeside pavilion. The full gameplay suite also verifies the existing camp routes and island causeway.

## Editable study and previews

Run `node scripts/preview-main-landmarks.mjs`, then Blender with `--background --python scripts/blender/render_main_landmarks.py -- <project-directory>`. This exports the actual runtime geometry to an editable Blender scene and renders both landmarks under `assets-source/landmarks/`. These isolated geometry studies omit surrounding vegetation, the island temple and runtime-only water shading. Browser visuals and FPS remain unverified because browser preview access is unavailable.
