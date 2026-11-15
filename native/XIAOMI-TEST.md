# Xiaomi High-only test — 15 November 2026

Device: M2010J19SG, MIUI V12.0.7.0, Android 10/API 29, 3,805,716 kB RAM, ARM64, Adreno 610. MIUI blocks injected taps; the user performed entry and gameplay. No device security settings changed. Balanced testing was abandoned at the user's request.

The initial forge APK crashed with native GL-thread SIGSEGV/null memcpy after an Adreno GPU command failure. The user reported another crash entering with Balanced, then successfully loaded High. The cause has not been isolated to one setting.

Original High, stationary Arrival Ridge: two 127-presentation samples gave 2.35 and 2.37 FPS over about 53 seconds each. Process PSS rose through 605,880, 752,803, 913,950 and 989,746 kB.

The app now disables 3D MSAA on Android Compatibility before applying render scale. Godot 4.7.2 has a confirmed Android MSAA/intermediate-buffer allocation issue, including Adreno reports: https://github.com/godotengine/godot/issues/124258 . Desktop rendering, models, textures, lighting and distance presets remain. Android edge smoothing changes. The menu still offers both quality choices; this device test covers High only.

The compatibility build loaded High. At the same stationary view, 127-presentation samples gave 2.85 FPS over 44.19 s (median 350.08 ms, p95 366.61 ms) and 2.75 FPS over 45.81 s. PSS snapshots were 577,840, 563,594 and 581,185 kB, with Graphics around 350–351 MB. The process remained running, and the retained current-app log had no matching script errors, fatal signals or Adreno command errors. This supports improved memory behaviour during the sampled run; it does not prove long-term stability. The new APK also includes intervening forest updates, so this is not a strict single-variable comparison.

The user confirmed walking, jumping and map travel and reported lag. About 2.8 FPS is not playable performance. Battery snapshots were 40.4–40.5 C while charging, not a controlled thermal test. Forest FPS, full combat drills, repeated cold starts and sustained lifecycle behaviour remain untested. Further rendering optimization is required while preserving visual design.

All 32 display-driven graphics regression assertions passed on Windows. The installed optimized ARM32/ARM64 build is builds/asterion-android-compat-test.apk, 173,250,087 bytes. Independent v2/v3 signature verification passes with the local testing key. SHA-256: 12d315c46204558ad10c82ce80765cf04936061ca81e4bf7d2d3a27f8056c832 . Raw timing, memory and app logs remain locally in .tools/xiaomi-*; captures are in native/builds/xiaomi-*.
