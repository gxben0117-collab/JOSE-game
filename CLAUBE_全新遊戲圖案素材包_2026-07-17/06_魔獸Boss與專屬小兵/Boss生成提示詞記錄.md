# Boss 與小兵生成提示詞記錄

本輪使用 Codex 內建影像生成功能，逐張生成 10 隻 Boss 與 10 隻專屬小兵；未使用 CLI 模式。

## Boss 共用模板

```text
Use case: stylized-concept
Asset type: boss monster character render for a 2D tactical monster-collector game
Primary request: {Boss 英文概念、動物結構、屬性材質、關鍵核心與輪廓}
Style/medium: polished high-resolution retro pixel art, crisp intentional pixel clusters,
dramatic game-sprite lighting, matching the JOSE fantasy creature roster
Composition/framing: single full-body creature, three-quarter view, entire body visible,
centered with generous padding
Scene/backdrop: perfectly flat uniform solid {#00ff00 或 #ff00ff} chroma-key background
Constraints: one creature only; no minions; no text; no letters; no UI; no frame;
no cast shadow; no floor; background has no gradient, texture or lighting variation;
do not use the key color in the subject
```

Boss 概念依序為：Ash-Crown Tyrant、Furnace Colossus、Blightwood Sovereign、Thorn-Hive Queen、Abyssal Kraken Emperor、Glacier Leviathan、Solar Seraph Chimera、Cathedral Titan、Eclipse Bone Wyrm、Void Devourer。

## 小兵共用模板

```text
Use case: stylized-concept
Asset type: exclusive minion monster render for a 2D tactical monster-collector game
Primary request: {小兵概念}; clearly related to its named master but much smaller and simpler
Style/medium: polished high-resolution retro pixel art, crisp intentional pixel clusters,
dramatic game-sprite lighting, matching the JOSE fantasy creature roster
Composition/framing: single full-body small creature, three-quarter view, entire body visible,
centered with generous padding
Scene/backdrop: perfectly flat uniform solid {#00ff00 或 #ff00ff} chroma-key background
Constraints: one creature only; no boss; no text; no letters; no UI; no frame;
no cast shadow; no floor; background has no gradient, texture or lighting variation;
do not use the key color in the subject
```

小兵概念依序為：Crown Cinderling、Slag Hound、Rotcap Rootling、Thorn Pollen Drone、Pearl Lantern Fry、Glacier Shellcrab、Prism Wing Cub、Rosewindow Sentinel、Crescent Rib Whelp、Singularity Mite。

森林組使用洋紅色鍵背景，其餘使用綠色鍵背景；後製採邊界自動取色、soft matte 與 despill，最後置中於 `1536×1536` 透明畫布。

