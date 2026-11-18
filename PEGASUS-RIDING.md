# Dawnwing — first ground-riding prototype

Dawnwing now waits in the field near Wayfarer Hall. Use **Map → Wayfarer Hall**; arrival faces toward the companion. Walk up and choose **Ride Dawnwing / E**. Normal movement controls steer the horse, **Run / Shift** selects a trot, **Jump / Space** performs a short leap, and **Interact / E** dismounts after landing. Touch uses the existing joystick, Run, Jump and interaction controls.

Mounting raises the first-person eye position to 3.15 metres and disables the on-foot collision body while the Pegasus's physical body handles movement. Dismounting raycasts to walkable ground and checks space for the player's capsule. If there is no open position or the horse is airborne, dismount is refused. The normal 1.82-metre eye height and collision return afterward. Pause freezes movement and animation. Map travel and scene changes release the rider. Saving while mounted records the safe boarding position, so a resumed player does not appear inside the horse.

This prototype stays on safe camp land. It rejects the training yard, lake, narrow causeway and map exterior. Mounting equips no combat weapons. The horse returns to its home field whenever camp is reconstructed; its roaming position is not persisted. The full wings remain moderately open, and feathers can overlap scenery: a finished ground-fold pose and wing-aware obstacle avoidance remain future refinement.

## Rig and animation files

The static model is retained. New files under `assets-source/creatures/dawnwing-pegasus/Rigged/` include:

- `DawnwingPegasus-Rigged.blend`: the full original surface with explicit 31-bone deform skeleton and five Blender actions.
- `DawnwingPegasus-Rigged.glb`: the full skinned model and clips.
- `rig-report.json` and `validation.json`: clip timing and export/weight/pose checks.

The game uses `native/assets/pegasus/dawnwing.glb`, one 139,991-triangle mesh set shared by both graphics presets. It retains twelve skinned parts, the baked coat/feather maps and removable tack. Distant geometry culls at 100 metres, and an unmounted horse stops animation past 55 metres. The controller and skeletal model leave scene memory when camp is released.

| Clip | Purpose |
| --- | --- |
| Idle | Breathing, head/ear/tail motion, moderately raised wings |
| Walk | Initial ground gait |
| Trot | Faster diagonal gait |
| Jump | Leg tuck and a partial wing opening during the physical leap |
| Wingbeat | Standalone animation for later flight development |

The actions are a first animation pass, not commercial-quality final animation. Gait contact and feather overlap need further artistic refinement. Wingbeat does not provide flight locomotion, and this version has no takeoff, aerial controls or flying quests. Android smoothness and startup reliability are not established by desktop testing.

## Verification

The native riding suite checks grounded spawning, all five imported clips, distance/zone restrictions, mounting, rider height/collision, safe saving, physical walk/trot/leap, landing, solid-wall collision, pause, dismount, remount, map travel and scene release. The existing camp and training suites are also run. The export validator reimports the game GLB, verifies normalized one-to-four-bone weights, texture retention and sample pose bounds across all five actions. Isolated idle/walk/wingbeat views and first-person camp views are rendered with the actual Godot Compatibility renderer.

Rebuild with `scripts/blender/rig_pegasus.py`, then `scripts/blender/validate_rigged_pegasus.py`. Run Godot with `--path native --script tests/pegasus.gd` for gameplay checks and `tests/pegasus_preview.gd` for pose images. `scripts/package-rigged-pegasus.py` creates the checked model archive. The complete editable native project also contains the runtime model and controller.
