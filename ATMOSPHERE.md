# Exterior atmosphere

The browser camp uses fixed daylight. The day/night cycle, visible sun and moon, star field and night-light updates are disabled. A directional key still casts natural shadows; ambient fill keeps shaded places readable. Older native saves keep their progression, while their legacy clock field is normalized to the fixed daytime value.

The browser retains four slow drifting cumulus banks, with volume noise, soft projected shadows and matching lake reflections. Its atmospheric-scattering sky has no solar disc. Mirror Lake remains opaque blue: no transmission, transparency or see-through surface. Cloud, water and shadow animation continues independently of the removed game clock.

The native app uses a **fixed evening** with a comfortable warm key, cooler directional sky fill and one modest sun low in the west. The sun stays fixed; the day/night cycle and moon remain disabled. The sky has four sparse cloud banks baked from the original volume shapes. They drift slowly through a global shader phase while the 128-pixel lighting/reflection cache stays unchanged. Six faint, depth-tested shafts appear only near selected canopy openings and disappear beyond 38 metres. These use no extra light or shadow passes and are not a screen overlay.

Native depth haze begins 78 metres away in camp, leaving nearby objects clear. A 1536-pixel shared atlas supplies root/foundation contact shading, canopy ambient occlusion, sunlight visibility and terrain height for the current 3,470 retained tree placements. The source layout hash is checked. Nearby leaves receive restrained backlighting; grass is lifted separately from exposure, and roads use matte warm limestone. Water remains opaque blue, with softer specular response and sky reflections. Both graphics presets share this atmosphere, 2× MSAA and a 2048-pixel directional shadow map. This is a baked approximation of contact and canopy lighting, not full global illumination or real-time volumetric fog.

`atmosphere.ts` exposes one constant lighting state to browser terrain, clouds and water. The old `day-cycle.ts` and `celestial-sky.ts` utilities remain available in source, but active exterior atmospheres do not advance a lighting cycle or instantiate celestial models. Native `world.gd` uses `SKY_MODE_LIGHT_ONLY` to prevent a duplicate engine sun; its authored sky shader draws the single fixed western disc. The old orbit meshes remain absent.

Source checks verify fixed lighting after long updates, absence of celestial objects and shader discs, moving cloud shadows and opaque blue water. Engine checks verify that old night clock values cannot move the light or darken the sky, and that orbit meshes and night point lights stay absent. Display checks confirm that cloud drift leaves draw submissions unchanged instead of rebaking sky lighting. See `native/VALIDATION.md` for rendering and Android verification limits.


Rebuild native atmosphere assets after exporting a changed camp layout:

```sh
blender --background --factory-startup --python scripts/bake-native-atmosphere.py
```

The complete native archive already includes the baked textures and shaders. Original shapes and all bake code are project-owned; no new external art or plug-in is required. The renderer keeps its existing compatibility backend. See Godot's [sky shader cache guidance](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/sky_shader.html) and [environment documentation](https://docs.godotengine.org/en/stable/tutorials/3d/environment_and_post_processing.html) for the underlying APIs. Actual support was checked in the installed Godot build.
