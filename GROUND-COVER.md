# Grass and moss ground cover

The sanctuary's gentle terrain and rounded hills now have dark, mottled garden cover. Shadier woodland shifts toward moss. Roads, true cliff faces, the lake edge and the forge's scorched ground remain exposed.

Blender sources: `assets-source/ground-cover/asterion-ground-cover.blend` and `asterion-garden-grass.blend`. Rebuild the surface with `build_ground_cover.py`, and the folded blades with `build_garden_grass.py`. The grass builder exports dense garden clumps, taller loose wisps, GLBs and compressed runtime geometry. The material uses two differently rotated world-space samples and broad colour mottling to hide repeating tiles.

The terrain shader blends the grass/moss maps using world coordinates. A shared slope and road mask also controls planting, so blades stay off the roads and only fade from terrain near true cliff angles. Each clump aligns to the local terrain normal. Uneven probability, height, width and scattered wisps keep the garden from reading as a sports field. All graphics continue at the existing High setting.

Checks cover the material bytes, shader integration, grass on gentle terrain, bare steep faces/roads/shore, and walking routes. Browser rendering and FPS remain unverified because the local preview endpoint times out.
