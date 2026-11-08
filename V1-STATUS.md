# Version 1 development checkpoint

Implemented: a separate forest entry page, sanctuary expedition menu, three sequential quests, coins and XP, level calculation, potions, two sword upgrades, one-time first-return reward, profile export/import, saved expedition enemy/loot state, and a first combat runtime with two placeholder creatures, attacks, blocking, dodge and Athena's Insight.

Entry: open the sanctuary and choose **Quests & expeditions**. Accept the first quest before entering the forest. Find supplies east of the trail; return to the northern gate with E and claim the reward in the sanctuary menu. Quests unlock in order. Purchases and claiming rewards are unavailable during a suspended expedition.

Verification: TypeScript, production bundling, existing movement/temple/woodland tests, and progression-state tests. Browser combat, render/shader correctness, save behavior between local file pages, and visual quality still need manual review. Use HTTP hosting for reliable same-origin persistence.

This is NOT the finished Version 1 release. The requested Blender tree, bush and ground-cover family is generated and integrated; creature art remains temporary. Remaining: in-browser environment acceptance, creature animation and feedback, sanctuary physical quest/merchant/recovery stations and marked forest gate, an extended collision/AI playthrough, accessible navigation/objective markers, verified browser save/restore including mid-combat timers, and performance/visual acceptance. The development runtime is intentionally available for review while these remain open.

Blender 5.2.3 LTS and Sapling 1.0.0 are verified. The vegetation generator exports four tree variants, four bush variants and four ground-cover variants, an editable .blend and GLBs. The runtime uses compressed geometry, alpha-tested leaf clusters, instancing and two detail levels. See VEGETATION.md.

Progress is stored in a dedicated versioned profile key, leaving the existing settings/discoveries key untouched. Quest/coin mutations persist in one profile write. This single-player local profile is not an authoritative multiplayer economy.
