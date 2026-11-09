# Grass and moss ground cover

The sanctuary's gentle terrain now has continuous meadow cover. Shadier woodland shifts toward moss. Roads, steep banks, the lake edge and the forge's scorched ground remain exposed.

Blender source: `assets-source/ground-cover/asterion-ground-cover.blend`. Rebuild with `blender --background --python scripts/blender/build_ground_cover.py -- <project-directory>`. The script authors two seamless 512-pixel tiles, each representing two metres, with colour, tangent normal and roughness maps. It exports the original PNGs, an editable material study and compressed runtime data. No external images or add-ons are required.

The terrain shader blends the grass/moss maps using world coordinates. A shared slope and road mask also controls planting, so short grass stays off the roads and exposed faces. Ground cover adds no terrain displacement or collision changes. Short instanced grass adds nearby depth. All graphics continue at the existing High setting.

Checks cover the material bytes, shader integration, grass on gentle terrain, bare steep faces/roads/shore, and walking routes. Browser rendering and FPS remain unverified because the local preview endpoint times out.
