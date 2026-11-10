# Playable training ground

Walk into the training yard or use **Esc → Training ground** to travel to its open north entrance. Free practice starts automatically. Ordinary ash bows and simple swords are shown in the equipment pavilion and as first-person practice weapons. Borrowed weapons are available only in the practice area; the rest of camp remains safe.

| Control | Practice action |
| --- | --- |
| 1 / 2 | Equip sword / bow |
| Left mouse, sword | Light strike |
| F, sword | Slower heavy strike |
| Hold right mouse, sword | Guard; raise it just before impact for perfect timing |
| Hold / release left mouse, bow | Draw / release arrow |
| R | Start the next drill; cycles back to free practice |
| WASD / Shift / Space | Existing movement, sprint and jump |

Click-drag looking still works when pointer lock is unavailable. Pausing, losing focus or switching weapons cancels a drawn bow and held guard. Simulation pauses with the game. Leaving the yard resets the current attempt and clears flying arrows.

## Techniques

- **Five-arrow accuracy:** five shots at the existing straw targets. Centre, inner, middle and outer hits score 100, 70, 40 and 20. Misses use an attempt. Arrows have charge-dependent speed and gravity, with swept target-plane tests to avoid skipping a target between frames. The scene collision octree stops arrows at walls, terrain and the backstop.
- **Blade rhythm:** three successive light strikes against one dummy, within 1.05 seconds of each other. Heavy strikes do not count towards the chain. Sword strikes respect reach, facing, recovery, stamina and scenery occlusion.
- **Read & respond:** hitting a dummy triggers its 1.05-second counterstrike telegraph. Face it and guard within reach. Three blocks finish the drill; raising guard within the last 0.36 seconds scores a perfect guard. Replies provide safe practice feedback rather than damaging the player's expedition profile. Stepping out of range avoids a reply.

Stamina recovers between actions. Dummies reset after being cleared. Arrow draws, sword swings, incoming-strike rings, impact pulses, arrows left in targets, sound cues, scores and controls provide feedback. Personal bests use the separate `asterion-training-v1` storage key. Practice does not award or modify XP, coins, quest progress or expedition inventory. A storage failure leaves the drills playable with session-only bests.

## Extension points and checks

`training-combat.ts` contains deterministic rules and drill definitions. `training-runtime.ts` maps input events to visible projectiles, weapon animations and feedback. `practice-weapons.ts` supplies the shared original models for the rack and hands. The engine supplies camera aim and the scene's collision query. Forest expedition combat retains its existing rules for now; the training rules can be integrated there in a later combat pass.

Tests cover target scoring, gravity, occlusion by a real octree wall, sword reach/facing/recovery, combos, timed guards, stamina, missed attempts, saved bests, reward isolation, cancellation and runtime projectile creation. Existing full-game route checks cover yard access and the equipment pavilion. Type checking, build and portable-page checks are release checks. Actual browser interaction, WebGL appearance and FPS remain unverified here because local preview access is unavailable; Blender renders are not used to claim runtime verification.
