# Asterion Sanctuary

A single-player first-person browser game inspired by ancient Greek mythology, built with TypeScript, Three.js and React. All scenery is generated locally by code; no external art or audio downloads are required during play.

The twelve temples now occupy distinct landscapes across the map, each with its own decorative grounds. The Great Hall anchors the central camp, and Wayfarer Hall has a new guild-house exterior and beacon tower. Press **M** and select a temple marker to visit its grounds. See [TEMPLE-EXTERIORS.md](TEMPLE-EXTERIORS.md) for designs and validation.

The sandy road network now has chamfered Greek-key limestone borders and open junctions. Modelled daisies, poppies and lavender replace the geometric flower placeholders, with matching garden borders and a smoother lake bank. See [LANDSCAPE-POLISH.md](LANDSCAPE-POLISH.md) for the landscape changes and verification limits.

## Play

Extract every file in `asterion-playable.zip` to the same folder and open `asterion-sanctuary.html` in Chrome or Edge. The package contains the sanctuary and twelve separate temple pages plus the development forest expedition. Keep all fourteen pages together so navigation works.

Choose **Explore the twelve temples** on the welcome screen, or walk through a temple doorway in the sanctuary. Each temple also has a selector for visiting another. Use the menu or press **E** near the exit to return outside that temple.

Use **WASD** to walk, **Shift** to sprint, **Space** to jump and the mouse to look. Click and drag to look if mouse capture is unavailable. **Esc** pauses. Outdoors, **M** opens the map and **E** reads nearby discoveries. High graphics quality is always enabled. Sensitivity and walking motion are adjustable. Settings use browser storage; storage sharing for local file URLs depends on the browser.

## Twelve sacred interiors

Each page instantiates one hall, with a deity statue, offering table, columned approach, coffered ceiling, votive displays and forecourt altar. These are original stylized interpretations, not archaeological reconstructions. There are no sleeping chambers or lounges.

| Temple | Sacred decoration |
| --- | --- |
| Zeus | Thunderbolt relief, eagle, ivory stone and blue standards |
| Hera | Crowned statue, peacock fans, plum and gold |
| Poseidon | Bronze statue and trident, wave relief and ship offerings |
| Demeter | Wheat sheaves, leafy decoration and harvest colors |
| Ares | Helmet, spear, shields and crimson standards |
| Athena | Owl shield, olive branches and pale marble |
| Apollo | Lyres, laurel and a monumental sunburst |
| Artemis | Bow, silver crescent, stars and sacred deer |
| Hephaestus | Hammer, anvils, forge glow and basalt piers |
| Aphrodite | Scallop shell, doves, roses and pearl-colored sculpture |
| Hermes | Caduceus, winged sandals and compass rings |
| Dionysus | Thyrsus, vines, grapes and theater masks |

Temple pages share rendering code but create only the selected scene. Static decoration is batched by material to reduce draw calls, and temple GPU resources are released on page exit. Separate pages reduce active scene memory; they do not remove the assets' download or disk-storage cost. Performance still depends on the device and browser.

## Development

Requires Node.js 22.18 or newer; Node.js 24 is recommended.

```sh
npm ci
npm run dev
```

Open the local HTTP address printed by the development server.

```sh
npm run typecheck
npm test
npm run build
node scripts/check-pages.mjs
```

`dist/` contains the deployable static website. The build also generates fourteen self-contained HTML pages at the project root. Serve `dist/` through any static HTTP host; preserve its assets directory and all temple HTML files.

## Source map

- `components/camp/Camp.tsx`: welcome screen, temple selector, HUD, map and menus.
- `lib/game/world.ts`: outdoor architecture, terrain, foliage and collision scene.
- `lib/game/engine.ts`: outdoor rendering, controls and doorway navigation.
- `lib/game/temple-catalog.ts`: deity themes, entry locations and return points.
- `lib/game/sacred-temple.ts`: shared sacred architecture and Poseidon's sculpture.
- `lib/game/deity-art.ts`: eleven deity sculptures, attributes and decoration.
- `temple.ts`: isolated interior runtime and resource lifecycle.
- `scripts/temple-pages.mjs`: themed HTML generation.
- `lib/game/physics.ts`: capsule movement and collision response.
- `tests/game.test.ts`: movement, portal, collision and geometry-budget checks.

The game has no accounts, multiplayer or swimming. Combat, quests and progression are in development; see V1-STATUS.md. Temple ambient audio is not implemented. Append `?debug=1` outdoors for frame-rate and position diagnostics.

## Woodland realism sample

Choose **Visit the woodland sample** on the welcome screen to arrive at the forest shrine approach, or **Visit the camp gardens** for the smaller ornamental trees. The whole camp and expedition now share rolling terrain, worn paths, bare-earth clearings, clustered planting and weathered blocky rocks. Leaves follow their branch attachments with folded surfaces and species-specific silhouettes. Grass uses spatial patches, distance culling and distance-dependent density in the woodland. The vegetation includes a Blender/Sapling family of four trees, four bushes and four ground-cover assets, with full and reduced geometry. See VEGETATION.md for models and rebuild instructions. Browser visual review and GPU performance measurements remain pending because the local preview connection was unavailable.


## Version 1 development

Choose **Quests & expeditions** from the welcome screen or pause menu. This opens the quest board, supplies and progress controls; the separate forest page is an early combat implementation. Finished art and browser gameplay verification remain pending. See V1-STATUS.md for completed and remaining work.


