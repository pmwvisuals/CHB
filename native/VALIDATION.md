# Native checkpoint verification

Verified using Godot **4.7.2 stable**, Windows and the **OpenGL Compatibility** renderer on **Intel Iris Xe**.

- All six GLBs imported in the actual engine. The boar exposes Idle, Walk and TuskAttack clips.
- **26 gameplay assertions passed**: camp/forest loading, physical grounding and eye height, walking, jumping and landing, pause, gate range, previous-region release, animation presence, sword facing/range, timed tusk damage, one hit per strike, rewards, enemy release, saving and reloading, return to camp, one active world, healing and the 24/8-minute cycle boundaries.
- **9 display-driven touch assertions passed**: all three main buttons are inside the viewport; the stick requests movement; the second finger controls the camera while the first moves; releasing over a button releases the camera finger; joystick release clears movement; Jump and Strike request their actions.
- The menu, camp and forest were rendered and inspected at **1280 × 720** with phone controls. After warm-up, both preview views reached the configured **30 FPS cap**. This is a short check at two camera positions, not a sustained performance benchmark or a phone result.
- Source model payload: **25,188,468 bytes**, before Godot import/texture processing. This is neither runtime RAM use nor APK size.
- Android export preflight finds the preset, but export cannot proceed: matching export templates, Java SDK and Android SDK are missing. No installable APK is included.
- Save serialization and file replacement were tested with an isolated file inside the project. This agent could not create the normal Windows app-data folder with its current access, so that destination and actual Android device storage still need a normal local run.

## Current limits

The two 96-metre test regions use simplified architecture and terrain. They are a gameplay foundation rather than the full finished camp. Grass detail, the twelve temples and main landmarks remain in the browser source for later migration. The sword is a simple practice mesh. The test boar pursues directly and can be blocked by a trunk; navigation around obstacles and death/charge animations are future work.

No physical Samsung, Android lifecycle or APK test has been performed. Release signing, store publishing and production performance acceptance remain outstanding.
