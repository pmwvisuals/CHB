# Dawnwing Pegasus — first static companion model

The static files described below are the original checkpoint. The current rig, fixed open wings and native flight controls are documented in [PEGASUS-RIDING.md](PEGASUS-RIDING.md).

The standalone buyer download is dawnwing-pegasus-buyer.zip. It contains a clean Blender scene, full and reduced GLBs, five texture maps, usage terms, an import guide and walking/flight GIFs. Its independent Godot preview plays all seven clips. The buyer guide and usage terms are maintained under scripts/pegasus-buyer. Preparation, validation and packaging use scripts/blender/prepare_pegasus_release.py, scripts/blender/validate_pegasus_release.py and scripts/package-pegasus-release.py. Both models and the Blender file were reopened from an extracted package; the standalone Godot checks also pass from that extraction.

An original pale Pegasus for a future rideable companion. This checkpoint covers the model: horse anatomy, ivory coat, silver flax mane and tail, two layered feather wings, slate hooves and removable leather/linen/bronze tack. It is not yet rigged, animated, rideable or placed in the live camp.

The horse's skin is one welded mesh. Feather vanes are closed geometry with overlapping coverts and their own texture. Body color and short-coat normal detail are baked into 2048-pixel maps; feathers share a 1024-pixel map. All art is authored in this project without downloaded meshes or third-party textures.

Files are under `assets-source/creatures/dawnwing-pegasus/`:

- `Blender/DawnwingPegasus.blend`: editable model, packed textures, studio lights and camera. Hide the `TACK` collection for a bare Pegasus.
- `Models/DawnwingPegasus.glb`: engine-neutral static model with actual textures and three separately removable tack meshes. Studio objects are excluded.
- `Textures/`: standalone PNG maps.
- `Previews/Exported-*.png`: actual re-imported GLB renders.
- `Reports/`: dimensions, mesh counts and validation results.

Source uses metres, Z up, with the horse facing negative Y. Wingspan is about 6.6 metres; the ears reach approximately 3.5 metres. The model uses a moderately raised open-wing pose so the feather layers and attachment can be reviewed. Folding the wings, mounting, walking and flight still require a rig, skinning and animation. This first surface pass needs further anatomy and feather refinement for photorealistic or marketplace use; it is not described as a finished commercial asset. It has not been performance-tested on Android.

Rebuild with Blender 5.2 using `scripts/blender/build_pegasus.py`; append `-- --no-previews` to skip studio renders. Then run `scripts/blender/validate_pegasus.py` to check closed body topology, textures, export structure, grounding and dimensions, and render the re-imported GLB. Run `scripts/package-pegasus.py` for the checked portable archive.
