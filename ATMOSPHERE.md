# Fixed daylight atmosphere

The camp now uses fixed daylight. The day/night cycle, visible sun and moon, star field and night-light updates are disabled. A directional key still casts natural shadows; ambient fill keeps shaded places readable. Older native saves keep their progression, while their legacy clock field is normalized to the fixed daytime value.

The browser retains four slow drifting cumulus banks, with volume noise, soft projected shadows and matching lake reflections. Its atmospheric-scattering sky has no solar disc. Mirror Lake remains opaque blue: no transmission, transparency or see-through surface. Cloud, water and shadow animation continues independently of the removed game clock.

Godot uses its fixed procedural sky, directional lighting, distance fog and opaque rippled lake shader. Browser volumetric clouds and localized forest mist are not yet fully reproduced in the native renderer. Removing the cycle does not mean removing directional lighting or shadows.

`atmosphere.ts` exposes one constant lighting state to browser terrain, clouds and water. The old `day-cycle.ts` and `celestial-sky.ts` utilities remain available in source, but active exterior atmospheres do not advance a lighting cycle or instantiate celestial models. Native `world.gd` constructs a fixed key with `SKY_MODE_LIGHT_ONLY`, suppressing the procedural sun as well as removing the former sphere models.

Source checks verify fixed lighting after long updates, absence of celestial objects and shader discs, moving cloud shadows and opaque blue water. Engine checks verify that old night clock values cannot move the light or darken the sky, and that no sun/moon spheres or night point lights remain. See `native/VALIDATION.md` for rendering and Android verification limits.
