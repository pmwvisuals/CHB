# Three sacred halls

Only Zeus, Ares and Poseidon have open interiors in the native game. Use Map to travel to one, then use Interact / E at the approach to enter. The other nine temple exteriors remain on the landscape, with Coming Soon on their map entries and entrance prompts. They cannot open an unfinished interior.

The halls use ancient Greek architecture: fluted Doric columns, limestone walls and staggered stone flags, dark timber coffers, restrained aged bronze fittings and clay vessels. Marble is limited to selected capitals, altar tops, bases and trims. There are no living quarters or lounges.

The supplied Zeus and Ares sculptures now stand on the rear daises, grounded, scaled to six and 4.8 metres respectively and lit with a restrained local spotlight. They retain their original texture maps, resized to a maximum of 2048 pixels; dense mesh parts are simplified for the game. Ares faces the entrance. The scan-based model is marked CC BY-NC 4.0 and is for noncommercial prototype use; Zeus's archive contains no author/license statement. Credits are included in `assets/temple-statues/CREDITS.txt` and the pause screen.

Poseidon is still pending. The supplied `Unconfirmed 673757.crdownload` contains only 2,870,766 of the GLB's declared 39,891,876 bytes. It cannot be imported. The separate complete trident is prepared and attributed, ready to attach to Poseidon once the completed statue file is supplied. No substitute or broken partial mesh is placed in the temple.

- Zeus: muted storm pigment, three thunderbolt relief panels, a radial floor inlay and a stone offering altar.
- Ares: warm weathered stone, muted crimson standards, wall-mounted bronze shields, crossed spear reliefs and a processional strip.
- Poseidon: sea-green details, trident reliefs, wave bands, opaque blue side pools and seafarers' offerings.

All three have an open central aisle, twelve columns, a rear ceremonial dais, six visible oil lamps and local warm lighting. Architecture is assembled into six shared material meshes rather than hundreds of individual draws. The side pools reuse the opaque blue water shader. Lamps add no point-light shadow maps. Collision covers the continuous floor, columns, walls, altar and side fixtures. Standing eye height stays at 1.82 metres. The entrance returns to the saved camp approach.

The temple loads as its own scene after releasing camp. Leaving it releases the hall before camp loads. The visit is a safe zone: weapons stay sheathed, health recovers, and Journal remains available. Camp shopping, quest acceptance and reward collection still require camp. The camp map does not open inside an interior. Saves retain the selected temple ID and can reopen that hall without treating its local coordinates as camp coordinates.

`tests/temples.gd` verifies all three scenes, floor contact, material batching, lamps, safe weapons, Journal, exit travel, scene release, shop restrictions and all twelve entrance statuses. Pass `-- --capture` for player-height screenshots. This is a designed first native interior pass; it does not add temple-specific powers, quest NPCs, statues or a separate temple economy.
