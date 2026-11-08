# Temple courts and Great Hall

The twelve outdoor temple buildings are rebuilt as sacred architecture, with fluted columns, three architectural orders, pediments, sculpted emblems, layered cornices, tiled roofs, bronze doors, ceremonial bowls and small planted approaches. Existing deity interiors continue to load on separate pages.

| Temple | Exterior identity |
| --- | --- |
| Zeus | Ivory and blue-grey stone, Doric columns, eagle and thunderbolt |
| Hera | Royal plum, Corinthian capitals, peacock and crown |
| Poseidon | Sea-green roof, Ionic columns, trident and reflecting basins |
| Demeter | Harvest stone, wheat relief and climbing greenery |
| Ares | Dark stone, crimson standards, bronze shield and crossed weapons |
| Athena | Olive-grey marble, Ionic capitals, owl and olive wreath |
| Apollo | Warm limestone, golden sunburst and terracotta roof |
| Artemis | Cool marble, silver crescent and sculpted bow |
| Hephaestus | Basalt colours, copper trim, hammer relief and forge stacks |
| Aphrodite | Rose stone, Corinthian capitals, scallop and doves |
| Hermes | Green bronze accents, Ionic columns and winged staff |
| Dionysus | Plum accents, Corinthian columns, ivy and grape clusters |

The Great Hall stands at map coordinate (0, 0), inside the ring of temples. Four open entrances and porticoes face the cardinal directions. All four approaches have continuous ramps, a central crossing and real wall collisions. Its exterior combines a marble colonnade, copper-green hipped roof, bronze seams and roof lantern. The floor and coffered ceiling provide a simple walk-through shell; detailed hall furnishings are a later design task.

Choose **Visit the Great Hall** on the welcome screen. Temple entrances remain accessible by walking; return positions are now outside the processional ramps. The illustrated map marks the central hall.

Source: `lib/game/temple-exteriors.ts`. Geometry is assembled and merged by material once per building. Nearby architecture uses the same full geometry throughout; there are no graphics presets. Collision proxies retain the column, wall, terrace and ramp shapes. Tests cover all twelve entrances, walls, exterior geometry budgets and all four complete routes through the Great Hall. Legacy outdoor residential-Poseidon geometry is no longer loaded; the dedicated Poseidon interior remains available.

Blender renders are design checks of exported game geometry, not browser screenshots. Browser graphics and FPS still require verification on the target device.
