# Dawnwing Pegasus

A stylized pale Pegasus with leather tack, two feathered wings and seven in-place animations.

## Open the asset

Extract the entire ZIP first. Open `Blender/DawnwingPegasus.blend` in Blender 5.2.3 or a compatible newer version. All five textures are packed into the file and also provided in `Textures`. The source scene contains the model and rig, organized into Horse and rig, Wings, and Tack collections.

Choose the rig, switch an editor to the Action Editor, select one of the seven named actions and press Play. The saved source pose has open wings. The custom skeleton has deform bones and baked FK actions.

For a game engine, import `Models/Dawnwing_Game.glb`. It contains the reduced mesh, rig, embedded textures and all seven animations. `Models/Dawnwing_Full.glb` retains the full surface. Both files are complete alternatives, so choose the one suitable for your scene. The reduced file still contains about 124,000 triangles. Measure performance in your target scene.

## Godot preview

Import the `project.godot` at the root of this folder using Godot 4.7.2, then press F5 to run the project. Choose an animation and mesh version from the controls. Drag with the left mouse button to orbit, use the wheel to zoom, and use Pause or Restart to inspect a pose. This preview loads only files in this download.

For your own Godot scene, drag the GLB into a 3D scene and use its AnimationPlayer. Set Idle, Walk, Trot, Wingbeat and Glide to loop. Play Jump and Takeoff once. The preview script demonstrates these settings.

## Animation timing

| Clip | Duration | Playback |
| --- | --- | --- |
| Idle | 3 seconds | Loop |
| Walk | 1.167 seconds | Loop, authored for 1.30 m/s |
| Trot | 0.667 seconds | Loop, authored for 2.85 m/s |
| Jump | 0.542 seconds | Once |
| Takeoff | 0.625 seconds | Once |
| Wingbeat | 1.458 seconds | Loop |
| Glide | 2 seconds | Loop |

The wings stay open and still relative to the body in the four ground clips. Takeoff and Wingbeat move them during flight. All animation is in place. Your game controller supplies travel, jumping, altitude, collision and rider attachment. The preview floats the model to display flight poses.

## Scale and materials

Units are metres. Blender forward is -Y with Z up. The glTF conversion uses +Z forward and Y up. The rig's 0.71 scale is intentional and is included in both exports. The measured dimensions, geometry counts and clip information are recorded in `Reports`.

Coat and eye color maps use sRGB. Normal maps use non-color data. Base color and normal texture channels are already connected in the GLBs and Blender source. The coat maps are 2048 pixels square, feather maps 1024, and the eye color map 256. Roughness values are stored in the materials.

The meshes are triangulated for export. The source body, wing, eye and tack parts remain separate skinned meshes. Hide the Tack collection in Blender to remove the saddle, pad, straps and fittings.

## Previews and usage

`Previews/Walking.gif` shows the open-wing walk cycle. `Previews/Flight.gif` shows the Wingbeat cycle. The PNGs are renders of the actual supplied full model. The GIFs and interactive preview show the reduced model.

The included license allows personal and commercial project use and prohibits standalone asset redistribution. Read `LICENSE.txt` for the terms. Created using AI-assisted procedural modeling, texture and animation scripts in Blender. The package was checked with Blender 5.2.3 and Godot 4.7.2 Compatibility on Windows. Unity, Unreal and physical mobile-device performance have not been tested.
