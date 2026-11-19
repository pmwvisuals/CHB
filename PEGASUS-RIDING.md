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

The polished rig is 71% of the original linear size. It has shorter ears, fuller cheeks, deeper-set eyes, draped reins and reshaped feathers. A shaded muzzle and subtle dappling add variation to the ivory coat. The feather maps add shaft and barb detail. The saddle, pad and fittings are separate parts in the Blender source.

Idle, Walk, Trot and Jump keep the wings tucked. Walk and trot use timed hoof contact with playback tied to movement speed. Takeoff opens the wings before the Wingbeat cycle, and Glide holds them outstretched. The flight controller blends back into the folded stance when the horse lands.

The archive contains the editable Blender project, a full GLB, the approximately 140,000-triangle Godot GLB, texture maps and rendered previews. Both GLBs use 31 bones, 12 skinned meshes and seven animation clips. The rigging script uses the original static Blender file from the project as its source.

## Validation

The Godot suite exercises ground riding, takeoff, climb, glide, landing, dismount, map travel and scene release. The Blender validator reimports the game GLB and checks skin weights, retained maps and the pose bounds for the ground and flight clips. The Android APK uses the local test key. Performance on a physical Android device remains unmeasured.
