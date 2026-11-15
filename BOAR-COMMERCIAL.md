# Ash-Tusk Boar commercial package — 1.0.0

Prepared for sale as a **stylized rigged creature asset**, with a separate itch.io listing kit. This preparation does not publish a product or guarantee acceptance or sales. The prior refined art, current sanctuary model and Android APK remain separate.

## Deliverables

- `ash-tusk-boar-commercial.zip`: customer download containing clean Blender source, GLB/FBX exports, three mesh detail levels, three in-place clips, 4K maps, a standalone Godot demo, model viewer, previews, usage license and integrity hashes.
- `ash-tusk-boar-seller-kit.zip`: editable listing copy, itch.io setup notes, seller review checklist, cover/gallery images and the buyer ZIP checksum. Upload the customer ZIP as the paid asset; this seller kit is for preparing the page.

## Measured specification

| Item | Included |
| --- | --- |
| Full / middle / distant mesh | 104,660 / 48,380 / 21,096 triangles |
| Mesh/material groups | Five per level |
| Rig | One 21-bone custom FK skeleton |
| Animations | Idle 2 s; Walk 1.333 s; TuskAttack 1.333 s |
| Textures | Three shared 4096×4096 maps: base color, normal, roughness |
| Dimensions | About 5.29 m long × 2.62 m wide × 3.05 m tall |
| Blender source | 16 objects: 15 detail meshes and one rig; clean collections, identity transforms, packed/relative maps |
| Standalone formats | Full-quality GLB, shared-skeleton LOD GLB, per-level animated FBX |
| Engine demonstration | Independent Godot 4.7.2 project; no sanctuary files required |

The original refined close mesh is retained byte-for-byte in the portable exports. Lower meshes use decimation and retained whole bristle strands. This is triangulated mesh fur, not a new subdivision-ready quad cage, a printable mesh or photorealistic hair simulation. Only the three named clips are included; no enemy AI, root motion, running, jumping or death animation is advertised.

## Verification

- Clean Blender source, relative texture resolution and packed-map equality checked.
- All three FBX exports re-import with their expected mesh/bone/triangle counts and three animation clips; 27 sampled deformation poses checked.
- Portable checks sample 99 animation poses over all three levels (297 pose/level checks), with normalized weights, one skin and shared maps/materials.
- Nineteen standalone Godot assertions verify imports, exclusive detail visibility, animation continuity, playback and keyboard/mouse preview controls.
- Actual hero, side, head, rear, engine, cover and structural-wireframe previews are provided. The wireframe image hides the coat explicitly for readability.
- Customer ZIP file hashes and embedded viewer model are checked after extraction. The Blender source and Godot demo are tested from the extracted customer directory.

No Unity/Unreal-specific package or mobile performance guarantee is claimed. These technical checks do not replace the seller's final visual review or storefront review.

## Storefront choice

itch.io was selected for the requested delayed-payout workflow. See the seller kit's setup notes and the official [page setup](https://itch.io/docs/creators/getting-started), [payment](https://itch.io/docs/creators/payments) and [quality](https://itch.io/docs/creators/quality-guidelines) guides. The prepared listing identifies the AI-assisted procedural creation method and the tested formats accurately. Price remains a seller choice; no listing or payment agreement has been submitted.

Review the supplied commercial-use license, price and seller profile before publishing. The terms allow use in larger commercial projects and prohibit standalone asset redistribution. For a storefront with its own mandatory license, that storefront's governing terms take precedence as described in the license.

## Rebuild

With the prior refined source present in the repository:

```sh
blender --background --factory-startup --python scripts/blender/prepare_boar_release.py -- "<absolute repository path>"
node scripts/check-boar-release.mjs
blender --background --factory-startup --python scripts/blender/validate_boar_release.py -- "<absolute repository path>"
blender --background --factory-startup --python scripts/blender/render_boar_release.py -- "<absolute repository path>"
blender --background --factory-startup --python scripts/blender/render_boar_release_technical.py -- "<absolute repository path>"
python scripts/create-boar-release-demo.py
Godot.exe --headless --path assets-source/creatures/ash-tusk-boar/release/GodotDemo --import
Godot.exe --path assets-source/creatures/ash-tusk-boar/release/GodotDemo --script res://validate.gd
python scripts/write-boar-release-docs.py
python scripts/package-boar-release.py
```

The customer Blender model opens independently. Rebuilding the release scripts requires the refined source and existing repository viewer, which are not dependencies for using the customer asset.
