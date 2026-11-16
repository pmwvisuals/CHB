# First playable adventure chapter

The native Godot game now has an offline, device-local gameplay loop. Open **Journal** (desktop **J**) in camp to accept **A Steady Hand**, then use **Map → Training Ground**. Three sword hits on a dummy and one successful target shot complete its objectives. Return to Journal in camp to claim the reward and unlock the first woodland contract. Only one contract can be active.

## Quests and progression

| Contract | Objectives after acceptance | Reward |
| --- | --- | --- |
| A Steady Hand | Three training sword hits, one archery target hit | 40 XP, 25 gold |
| Beyond the Gate | Enter Deepwood, defeat Ash-Tusk, return safely | 80 XP, 45 gold |
| Echoes in Deepwood | Defeat two creatures, open the northern hollow cache, return | 140 XP, 80 gold |
| Warden's Watch | Defeat three creatures and return; repeatable | 60 XP, 30 gold |

Regular practice does not generate money or XP. The introductory contract rewards its objectives once. Story rewards have saved receipts; the repeatable contract must be accepted again and starts with fresh objectives. Returning before completing the hunt cannot pre-complete a return objective. Opening the unique northern cache early is credited when its story quest becomes available.

XP comes from creature victories, caches and quests. Level 2 starts at 100 cumulative XP; level 3 starts at 250, with progressively wider thresholds up to level 10. Each level adds ten maximum vitality and two sword/bow damage. The HUD shows level, vitality, gold, total XP, a level progress bar and the next active quest objective.

## Forest PvE

Camp is safe outside the existing practice ground. The forest entrance beyond the stone gate is also safe; weapons equip beyond the gameplay boundary at z=196 toward the interior (decreasing z). The southern outskirts have boars, the central groves have a wolf, and the northern hollow is guarded by the mantis. Existing models, scale, textures and animations are reused. This chapter has four bounded habitat encounters rather than an endless spawn system.

| Creature | Habitat | Vitality | Strike | XP / gold |
| --- | --- | --- | --- | --- |
| Ash-Tusk Boar | First clearing, around (6, 118) | 90 | 12 | 22 / 10 |
| Briar Boar | Western outskirts, around (-130, 90) | 110 | 15 | 28 / 12 |
| Grove Wolf | Central grove, around (-65, -45) | 135 | 18 | 40 / 18 |
| Hollow Mantis | Northern hollow, around (48, -182) | 170 | 22 | 55 / 24 |

Creatures notice a visible player within fourteen metres. They pursue within a bounded home range, wind up for 0.75 seconds, commit to a direction and apply one strike if the player remains in range, in front and unobstructed. Sidestepping avoids the strike. A recovery interval separates attacks. Losing the player or reaching the entrance causes a return home and health reset. A blocked pursuit eventually disengages. Movement uses existing physical ground/trunks; this first version does not implement a navigation-mesh path planner.

Sword strikes use reach, facing and a physics visibility check. Arrows use the existing gravity projectile and collide with creatures, ground and walls. Full bow charge deals 42 base damage; weak draws deal less. There are at most twelve field arrows, with expiry and scene cleanup. Training statistics are separate from field combat. The Drill control appears only at the training ground. Enemy name, vitality and wind-up warning appear when aimed at nearby targets.

Defeated creatures reward once, lose collision, and disappear after three active seconds. A saved ninety-second cooldown prevents farming by leaving and immediately re-entering. Respawning waits until the player is at least forty metres away. There are never more than the four habitat residents. Pause freezes combat, projectiles and encounter actions. A menu return to camp is blocked while pursued or for six seconds after taking damage; the physical entrance gate remains a safe way home.

## Supplies, loot and defeat

Three one-time caches supply gold, XP and one healing draught up to the carrying limit. They are near the first clearing, the wolf grove and the northern hollow. Move within 2.5 metres and use **Interact / E**; a cache cannot be opened during an encounter. A permanent receipt prevents repeated loot after saving, travelling or reloading.

Players start with two healing draughts. **Heal / H** consumes one to restore up to forty vitality, with a two-second reuse delay. It cannot consume an item at full vitality or revive a defeated player. Journal's camp supplies shop sells draughts for twelve gold, up to five carried. The shop and quest acceptance/claiming work only in camp. Normal camp recovery restores vitality for free.

Defeat rescues the player to Arrival Ridge at full vitality. Earned XP, gold, cache receipts and quest progress remain. The dangerous forest position is cleared. Rescue does not count as a successful quest return. There is no currency loss or real-money purchase system in this first chapter.

## Saves and verification

The existing version-1 device save receives a new `adventure` dictionary containing contracts, objective progress, claim counts, healing supplies, cache receipts, defeat count and creature respawn timestamps. Existing coins, XP, training records, positions and graphics choice remain. Known numeric fields are bounded and nonfinite values rejected. Save writes retain the temporary-file/rename path; explicit quest and shop transactions roll back in memory if saving fails. No player save was reset during development tests. Browser progression is still separate.

`tests/adventure_rules.gd` covers economy, quest ordering, receipt protection, repeat contracts, early-cache recovery, level growth, malformed input, save/reload and save-failure rollback. `tests/adventure_game.gd` uses the actual forest/camp scenes, models and physical projectiles to check sword reach/cooldown/facing, wall blocking, attack wind-up/dodge, pause, rewards, loot, healing, journal/back, safe return, saved respawn suppression and a real defeat/recovery transition. `tests/training.gd` preserves the original physical training checks; `tests/deep_forest.gd` checks landscape and travel independently of AI. Authored patrol/model suites explicitly isolate the combat brain when checking their original animation routes.

The desktop gameplay and touch-interface checks do not establish Android performance. Existing low frame rate and intermittent High loading crashes remain unresolved; visual/performance work was paused at the user's request. The new APK is a development gameplay build. The Xiaomi phone was disconnected when this chapter was prepared, so no new physical-phone validation is claimed.

This checkpoint passed 36 rule/economy/save checks, 39 real-renderer scene/gameplay checks, 44 existing training checks and 33 landscape/travel checks. The APK contains the optimized ARM32/ARM64 engine libraries and verifies with v2/v3 signatures. `builds/asterion-adventure.apk` is 181,204,948 bytes; SHA-256: `2136732d0582f79a412ed5faab19b2596d758cfa167ba171367cd9ceb81a3cd4`.
