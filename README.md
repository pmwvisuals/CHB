# Asterion Sanctuary

A single-player first-person browser game inspired by ancient Greek mythology, built with TypeScript, Three.js and React. All scenery is generated locally by code; no external art or audio downloads are required during play.

## Play

Extract every file in `asterion-playable.zip` to the same folder and open `asterion-sanctuary.html` in Chrome or Edge. The package contains the sanctuary and twelve separate temple pages. Keep all thirteen pages together so navigation works.

Choose **Explore the twelve temples** on the welcome screen, or walk through a temple doorway in the sanctuary. Each temple also has a selector for visiting another. Use the menu or press **E** near the exit to return outside that temple.

Use **WASD** to walk, **Shift** to sprint, **Space** to jump and the mouse to look. Click and drag to look if mouse capture is unavailable. **Esc** pauses. Outdoors, **M** opens the map and **E** reads nearby discoveries. Graphics quality, sensitivity and walking motion are adjustable. Settings use browser storage; storage sharing for local file URLs depends on the browser.

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

`dist/` contains the deployable static website. The build also generates the thirteen self-contained HTML pages at the project root. Serve `dist/` through any static HTTP host; preserve its assets directory and all temple HTML files.

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

The game has no accounts, multiplayer, combat, powers, NPC quests or swimming. Temple ambient audio is not implemented. Append `?debug=1` outdoors for frame-rate and position diagnostics.

## Woodland realism sample

Choose **Visit the woodland sample** on the welcome screen to arrive at the forest shrine approach. This first procedural art pass adds branching trees with individual leaves, curved wind-animated grass, mottled ground materials and irregular stones inside a roughly 58-metre-wide area. Grass uses spatial patches, distance culling and quality-dependent density. The FPS readout appears while exploring this area. Compare Medium and High on your own device before extending this detail over the map. These assets are code-generated, not scanned models; there are no new asset downloads or rigged vegetation. Browser visual review and GPU performance measurements remain pending because the local preview connection was unavailable.
