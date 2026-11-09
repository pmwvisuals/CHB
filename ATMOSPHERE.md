# Eastern light atmosphere pass

The sun stays due east (+X), at an elevation of approximately 32.6 degrees. There is no sun orbit or time-of-day cycle. The solar disc, halo and blue sky use Three.js's atmospheric-scattering Sky shader, with the directional light aligned to the same fixed direction. Camp and expedition forest share this atmosphere. Cool sky fill balances the warm sun. Static scene shadows use a 4096-pixel map covering the camp.

Four large cumulus banks replace the old small flattened cloud meshes. Each is a world-space volume: five overlapping lobes, two scales of 3D billow noise, height falloff and a 36-step optical-depth integration. Broad sunlight samples shade their interiors. Their slow, bounded drift starts at about 0.22 metres per second and has no wrap jump.

Soft cloud shadows use the same moving centres, sizes and lobe footprints, projected along the fixed sunlight direction. The effect attenuates directional sunlight on terrain, plants, water and architecture; it does not darken point lights or emissive objects. Projected shadows are an approximation of cloud columns rather than a separate per-frame shadow-map render. The forest mist remains a separate depth-aware effect.

Mirror Lake is opaque blue: `transparent=false`, `opacity=1`, `transmission=0`, `depthWrite=true`. It uses a physical surface material with water's refractive index, several wave-normal scales, grazing-angle sky/cloud reflections and a highlight aligned to the eastern sun. The old ring decals and underwater caustic colour pattern are removed. Cloud reflections share the same bank positions and drift as the sky. There is no see-through lake surface.

`atmosphere-layout.ts` shares the light direction and cloud field with shading, reflections and CPU diagnostics. Tests verify the fixed sun, cloud count/scale/speed, shaded and clear ground samples, moving shadow coverage, material hooks and fully opaque water. Full game checks cover routes, landmarks and temple access. Runtime WebGL appearance and FPS remain unverified because browser preview access is unavailable.
