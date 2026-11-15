from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parent.parent;out=root/'assets-source/creatures/ash-tusk-boar/release';seller=root/'boar-seller-kit';seller.mkdir(exist_ok=True)
spec=json.loads((out/'Reports/asset-specification.json').read_text())
(out/'README.md').write_text('''# Ash-Tusk Boar — Rigged Creature 1.0.0

A stylized dark boar with curved ivory tusks, mesh bristles and three in-place animations. This download is a 3D art asset, not a complete game or enemy AI system. Authoring used AI-assisted procedural Blender workflows; previews show the actual model.

## Start here

- **Blender:** extract the entire ZIP, open `Blender/AshTuskBoar.blend` in Blender 5.2.3 or later, and use Material Preview. Only LOD0 is initially visible. Expand the Boar_LOD collections to edit a different detail level. Maps are packed and also supplied in `Textures/`. No add-ons are required.
- **Portable single model:** import `Models/Boar_LOD0.glb` for the full model with embedded textures and animations. FBX files are supplied separately for LOD0, LOD1 and LOD2. If your FBX importer does not resolve embedded images, relink the three files in `Textures/`.
- **Shared LOD model:** `Models/Boar_AllLODs.glb` has one skeleton and shared maps. Disable two levels in your engine: displaying all three together causes overlap. Configure your own engine's distance transitions. LOD0 is 104,660 triangles, LOD1 48,380 and LOD2 21,096.
- **Godot:** open `GodotDemo/project.godot` in standard Godot 4.7.2, allow import to finish and press F6/F5. The demo is self-contained and does not depend on the sanctuary game. Use 1/2/3 for Idle/Walk/TuskAttack, Q/W/E for LOD0/1/2, drag to orbit and the wheel to zoom. Demo scripts may be reused under the included asset license.

The Blender source is free of studio objects, superseded meshes and machine-local dependency files. The demonstration project contains presentation lighting and a simple floor, neither of which is part of the model exports. Source scenes are custom FK rigs; no IK control-rig system is advertised. Use the skeleton's pose bones for editing. Existing NLA tracks contain the three supplied clips.

## Animation

| Clip | Duration | Loop | Notes |
| --- | ---: | --- | --- |
| Idle | 2 s | Yes | Breathing/head motion |
| Walk | 1.333 s | Yes | In place; support movement authored for 0.375 m/s at model scale 1 |
| TuskAttack | 1.333 s | No | Planted feet, head/tusk wind-up and upward strike |

Set Walk speed from character travel speed divided by `(0.375 × model scale)`. Translate the character separately. Clip names can receive an armature prefix in an FBX importer. Root motion, run, jump, hit reaction and death are not included. No sound or combat behavior is included. The mouth is a connected closed-jaw surface, not a separate open-mouth facial rig.

## Textures and materials

The shared 4096×4096 PNG maps are BaseColor (sRGB), tangent-space Normal (+Y/OpenGL, linear) and Roughness (linear). Convert the normal green channel when your renderer expects a -Y/DirectX normal. The nonmetallic hide/ivory/hoof atlas shares one material; coat, eyes, iris and pupil are separate materials. Enable linear vertex colors for the coat's root-to-tip tint. No metallic, opacity or displacement maps are required. Bristles are solid mesh strands; no hair renderer, simulation or alpha cards are needed.

The mesh is triangulated; lower detail surfaces use decimation and retained whole bristle strands. Body surface, tusks, eyes and bristles are separate material meshes. Do not expect a subdivision-ready quad cage or watertight 3D printing file. Some UV overlap is intentional for shared/mirrored details. The coat is vertex-colored geometry and does not need atlas UVs.

## Scale and axes

Metre scale. Approximate rest dimensions: 5.29 m long, 2.62 m wide, 3.05 m tall including bristles. Blender is Z up, facing -Y; GLB is Y up, facing +Z. Feet are at ground zero. The root is at ground origin. Scale the entire rig, not individual mesh parts, to fit your game.

## Validation and support

Reports contain measured mesh/rig budgets, portable skin/animation checks and clean-file/export checks. Tested in Blender 5.2.3, a Three.js GLB loader, and Godot 4.7.2 Compatibility. Unity and Unreal packages have not been tested and are not included. Hardware FPS or mobile performance is not guaranteed by triangle counts. Automated checks complement visual inspection; they do not certify marketplace approval.

For support, contact the seller through the storefront where you purchased this asset, quoting version 1.0.0 and the file/importer involved. See `LICENSE.txt` for permitted commercial use. `SHA256SUMS.txt` verifies the included files.
''',encoding='utf-8')
(out/'LICENSE.txt').write_text('''ASH-TUSK BOAR — COMMERCIAL ASSET LICENSE v1.0
Licensor: PMW Visuals (the seller). This license accompanies a lawful purchase or an explicit grant from the seller. Receiving or viewing a promotional preview does not grant the source asset license.

1. Grant. The seller grants the purchaser a non-exclusive, worldwide, perpetual license to use, modify and incorporate the included model, textures, animations and demonstration code in personal and commercial games, applications, films, rendered images and other larger creative works. No per-project royalty is due to the seller. Attribution is appreciated but optional.

2. Project collaborators. The purchaser may provide source files to employees and contractors only to work on the purchaser's projects. Those collaborators may not retain the asset for unrelated projects or redistribute it. Separate independent studios must obtain their own license.

3. Distribution. You may distribute finished works containing the asset, including commercial games and rendered media. Where technically practicable, package source assets so end users do not receive them as a reusable asset library.

4. Restrictions. Do not resell, relicense, upload, gift or distribute the model, textures, animations, source files, or modified versions as standalone assets, stock content, asset packs, template downloads, or a competing asset service. Do not claim that you created the original asset. The license does not transfer ownership or grant exclusivity.

5. Third-party notices. Any separately identified third-party component is governed by its own license. The original art asset and demonstration code are governed by this license unless the seller specifies otherwise.

6. Limits. The asset is supplied as is. The seller does not promise a particular engine integration, frame rate, marketplace acceptance, or fitness for a specific project. Mandatory consumer rights and the storefront's applicable refund terms remain in force. Liability is limited only to the extent permitted by applicable law.

7. Termination. Material breach ends the permissions granted here unless resolved with the seller. Stop distributing reusable source files in breach of these terms. Terms attached to a lawful purchase remain applicable to that purchased version.

For purchases from a marketplace whose mandatory asset license overrides separate seller terms, that mandatory license governs to the extent of a conflict.
''',encoding='utf-8')
(out/'CHANGELOG.md').write_text('''# 1.0.0 — 15 November 2026

- First independent commercial-package candidate from the refined boar.
- Clean Blender scene with named rig, three LOD collections and relative/packed textures.
- Full-quality GLB, shared-skeleton LOD GLB and per-level animated FBX exports.
- Independent Godot preview with detail and animation controls.
- Measured specifications, source/export validation, previews and commercial usage terms.
- Preserves the existing refined model and sanctuary game files separately.
''')
(out/'THIRD-PARTY-NOTICES.txt').write_text('''The model meshes and procedural textures were authored for this project through AI-assisted Blender scripting. No downloaded third-party art, brand logos, franchise characters or reference-sheet image is included in the deliverable.

The Godot demonstration is project-authored GDScript and uses Godot primitives. Godot and Blender are tools used to inspect/edit the asset and are not redistributed in this ZIP. Their application licenses govern those applications.

The separate browser preview, when supplied, bundles Three.js under the MIT license, whose full notice is included alongside that preview. It is not required to use the model.
''')
(seller/'LISTING.md').write_text('''# Ash-Tusk Boar — Rigged 3D Creature

**Short description:** A dark stylized boar with curved tusks, three animations, three mesh detail levels and editable Blender source.

Build a mythic woodland encounter with a massive bristled boar. Includes a charcoal coat, ivory tusks and an original custom skeleton, ready to import as GLB or FBX. No hair plug-in is needed: the groom is solid mesh bristles.

### Included

- Clean Blender 5.2.3 source with packed 4K maps.
- GLB with embedded textures and Idle, Walk and TuskAttack clips.
- Three detail levels: 104,660 / 48,380 / 21,096 triangles.
- Animated FBX exports for each level, plus a shared-skeleton GLB containing all levels.
- Three 4K texture maps: base color, normal and roughness.
- 21 bones, five materials and in-place animation.
- Independent Godot 4.7.2 preview project, instructions and validation reports.
- Commercial project use under the included license; no standalone asset redistribution.

**Style:** stylized fantasy creature. **Scale:** about 5.29 m long × 2.62 m wide × 3.05 m tall, including bristles.

**Tested:** Blender, Three.js GLB loading and Godot Compatibility. Not sold as a tested Unity or Unreal engine package. Not a photorealistic scan, quad/subdivision cage, printable mesh, complete enemy AI or animation pack. Only the three named animations are included; no run/jump/death clips. Mobile performance depends on your scene and hardware.

**AI disclosure:** Created using AI-assisted procedural modeling, material and rigging scripts in Blender. Previews are renders of the supplied 3D asset, not generated concept images.

**Price:** choose before publishing. Do not use an invented discount or crossed-out former price.
''')
(seller/'ITCH-SETUP.md').write_text('''# itch.io listing preparation

Recommended route for the requested delayed payout setup: create a free account and draft an asset page. Use Assets / downloadable content, upload `ash-tusk-boar-commercial.zip`, paste LISTING.md, use Cover.jpg, and add 3–5 actual model screenshots. Set a price and review the included license before making the page public. Mark the upload as a graphical asset, not a Windows/Android executable. Add truthful AI-generation metadata.

Select **Collected by itch.io & paid later** rather than direct payments. This avoids manually connecting buyer-payment providers. Seller terms and a tax interview still apply. Payout is requested later through a supported payout method; check that the provider can receive funds in your country. Enter sensitive information only on the official service, never in this project or chat.

No account, listing or payout setup has been created by this package.

Official sources checked on 15 November 2026:
- https://itch.io/docs/creators/getting-started
- https://itch.io/docs/creators/payments
- https://itch.io/docs/creators/quality-guidelines

This is an itch.io exchange-format asset listing. It does not certify compliance with the additional project/animation requirements of a Fab Unreal character product.
''')
(seller/'RELEASE-CHECKLIST.md').write_text('''# Seller review before publishing

- Inspect Hero, Side, Head, Rear and the engine previews at full size; use wireframe in the model viewer or Blender to assess the actual topology.
- Open the clean Blender file and try each supplied animation and detail level.
- Confirm title, price, support contact/brand and the asset license reflect your intended offer.
- Do not advertise this stylized bristle model as photorealistic, hand-retopologized, subdivision-ready, tested on untested engines, or a complete combat/animation set.
- Disclose the AI-assisted procedural creation method accurately using the storefront's current metadata.
- Complete the store's seller/tax requirements and confirm a usable payout method for your country before relying on sales income.
- Upload only the buyer ZIP. Seller kit contains editable listing drafts and is not the paid asset download.
- Review the storefront preview before changing visibility to public. This project has not published or accepted any seller agreement for you.
''')
print('Wrote buyer instructions, commercial license and itch.io seller drafts')
