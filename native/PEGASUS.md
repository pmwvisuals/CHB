# Dawnwing Pegasus

Dawnwing waits in the field near Wayfarer Hall. Use **Map → Wayfarer Hall**, approach the pale Pegasus and press **E** or tap **Ride Dawnwing**.

| Action | Keyboard | Touch |
| --- | --- | --- |
| Steer | WASD | Joystick |
| Trot on the ground | Shift | Run |
| Leap or climb | Space | Jump or Climb |
| Take off, land or cancel a landing | F | Flight, Land or Cancel |
| Dismount on the ground | E | Dismount Dawnwing |

Dawnwing flies above camp and has an 18-metre altitude limit above the terrain. To land, fly over clear ground and use the flight control again. The lake, practice yard, roofs and steep ground are unsuitable for landing. Saving while mounted records the boarding position. Map travel releases the rider and returns an airborne Dawnwing to the field.

## Model and animation

The polished rig is 71% of the original linear size. Its inset almond-shaped eyes have a painted iris and sculpted eyelids. The reins and cheek straps leave the eyes visible. A shaded muzzle and subtle dappling add variation to the ivory coat. The left and right wings are separate meshes in the Blender source, with smooth shoulder shapes and rows of rounded feathers. The saddle, pad and fittings are separate parts.

Idle, Walk, Trot and Jump use the same fixed open wing pose. Walk and trot use timed hoof contact with playback tied to movement speed. Takeoff and Wingbeat animate the open wings, and Glide holds them outstretched. Landing returns the wings to the fixed open pose.

The archive contains the editable Blender project, full and reduced GLBs, texture maps and rendered previews. Both GLBs use 31 bones, 13 skinned meshes and seven animation clips. The rigging script uses the original static Blender file for the horse and tack, and builds the two wings independently.

## Validation

The Godot suite exercises ground riding, takeoff, climb, glide, landing, dismount, map travel and scene release. The Blender validator reimports the game GLB and checks skin weights, retained maps and the pose bounds for the ground and flight clips. The Android APK uses the local test key. Performance on a physical Android device remains unmeasured.
