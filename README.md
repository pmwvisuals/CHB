# Asterion Sanctuary

A single-player, first-person browser exploration game, built with TypeScript, Three.js, and React. The browser-only game is packaged as a static Sites deployment.

## Play

After running `npm ci` and `npm run build`, open `asterion-sanctuary.html` in Chrome or Edge for the self-contained version. No server or installation is needed to play that file. The `dist` directory contains the deployable website; `npm run build` regenerates both versions.

Click **Enter camp**. Use **WASD** to walk, **Shift** to sprint, **Space** to jump, and the mouse to look. If your browser embedding does not allow mouse capture, click and drag to look. **E** reads a nearby discovery, **M** opens the illustrated camp map, and **Esc** pauses.

Settings include Low/Medium/High graphics, mouse sensitivity, ambient volume, and optional walking motion. Settings and six landmark discoveries are saved in local browser storage. Each visit starts at Arrival Ridge. The pause menu includes **Return to entrance**.

The Wayfarer Hall, Poseidon's residential temple and the early Athena residence are open. Poseidon has a columned portico, twin reflecting pools, an open courtyard and furnished sleeping quarters. Other temple residences remain early designs. The lake is bounded; swimming is not implemented. Use **Visit Poseidon's temple** on the welcome screen to start at its entrance.

## Development

Requires Node.js 22.15 or newer and npm (Node.js 24 recommended).

```
npm ci
npm run dev
```

```
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/test-game.mjs
npm run build
```

## Structure

- `components/camp/Camp.tsx`: entry screen, HUD, map, journal, pause menu, settings.
- `lib/game/world.ts`: deterministic terrain, architecture, foliage, collision scene and animation.
- `lib/game/engine.ts`: rendering, input, lifecycle and fixed-timestep simulation.
- `lib/game/physics.ts`: capsule controller and collision response, shared with tests.
- `lib/game/data.ts`: landmarks, cabin palette, terrain height and resilient persistence.
- `lib/game/audio.ts`: synthesized ambient sound and footsteps; starts only on user interaction.

Architecture is kept separate from the website UI to support future application packaging. There are no player accounts, networking, cloud saves, combat, powers, or NPC quests in this first release.

## Diagnostics

Append `?debug=1` to show frame rate and player coordinates. The diagnostic build exposes `window.__camp` only with this flag for development inspection. It does not enable networking or access private data.

All scenery and audio are generated locally by code. No remote asset CDN, image downloads, or audio requests are required during play. Asterion is an original setting inspired by ancient Greek mythology.

