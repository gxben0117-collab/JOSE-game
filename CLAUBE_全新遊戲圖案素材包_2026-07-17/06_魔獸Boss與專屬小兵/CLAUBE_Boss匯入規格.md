# CLAUBE Boss 匯入規格

## 建議資料結構

```text
BossDefinition {
  id, nameZh, element, portraitPath,
  maxHpScale, armorParts, phaseThresholds,
  skills[], summonUnitId, summonLimit,
  onPhaseChangeEvent, onDeathEvent, rewardTableId
}

MinionDefinition {
  id, nameZh, element, portraitPath,
  ownerBossId, role, skills[],
  onSpawnEvent, onDeathEvent, despawnWithOwner
}
```

## 固定配對

| Boss ID | 小兵 ID | Boss 路徑 | 小兵路徑 |
|---|---|---|---|
| `boss_ash_crown_tyrant` | `minion_crown_cinderling` | `01_Boss/B01_ash_crown_tyrant.png` | `02_專屬小兵/M01_crown_cinderling.png` |
| `boss_furnace_colossus` | `minion_slag_hound` | `01_Boss/B02_furnace_colossus.png` | `02_專屬小兵/M02_slag_hound.png` |
| `boss_blightwood_sovereign` | `minion_rotcap_rootling` | `01_Boss/B03_blightwood_sovereign.png` | `02_專屬小兵/M03_rotcap_rootling.png` |
| `boss_thorn_hive_queen` | `minion_thorn_pollen_drone` | `01_Boss/B04_thorn_hive_queen.png` | `02_專屬小兵/M04_thorn_pollen_drone.png` |
| `boss_abyssal_kraken_emperor` | `minion_pearl_lantern_fry` | `01_Boss/B05_abyssal_kraken_emperor.png` | `02_專屬小兵/M05_pearl_lantern_fry.png` |
| `boss_glacier_leviathan` | `minion_glacier_shellcrab` | `01_Boss/B06_glacier_leviathan.png` | `02_專屬小兵/M06_glacier_shellcrab.png` |
| `boss_solar_seraph_chimera` | `minion_prism_wing_cub` | `01_Boss/B07_solar_seraph_chimera.png` | `02_專屬小兵/M07_prism_wing_cub.png` |
| `boss_cathedral_titan` | `minion_rosewindow_sentinel` | `01_Boss/B08_cathedral_titan.png` | `02_專屬小兵/M08_rosewindow_sentinel.png` |
| `boss_eclipse_bone_wyrm` | `minion_crescent_rib_whelp` | `01_Boss/B09_eclipse_bone_wyrm.png` | `02_專屬小兵/M09_crescent_rib_whelp.png` |
| `boss_void_devourer` | `minion_singularity_mite` | `01_Boss/B10_void_devourer.png` | `02_專屬小兵/M10_singularity_mite.png` |

## 事件實作原則

- 階段切換應由血量門檻觸發一次，不要每次補血跨越門檻都重複觸發。
- 召喚前先檢查 `summonLimit` 與可用空格；無空格時轉換為 Boss 能量或護盾，避免事件卡死。
- 小兵死亡事件與 Boss 部位破壞事件應使用獨立 ID，方便戰鬥記錄與任務條件統計。
- Boss 對推拉、暈眩與沉默應使用遞減抗性，而不是完全免疫，保留玩家策略價值。
- 過場演出、鏡頭震動與全螢幕特效要尊重遊戲的「減少動態效果」設定。
- `_source_chroma/` 不加入正式 build；只封裝 `01_Boss/`、`02_專屬小兵/` 中的透明 PNG。

## 建議測試案例

- Boss 在場地無空格時使用召喚技能，不得鎖死回合。
- Boss 同一回合跨越兩個血量門檻，階段事件需依順序執行且各一次。
- Boss 死亡時，小兵依 `despawnWithOwner` 正確清除或失控。
- 中途存檔／讀檔後，部位血量、召喚數、潮位、感染格與階段狀態完整恢復。
- 圖鑑、戰鬥頭像與獎勵畫面使用透明圖時沒有綠／洋紅色邊緣。

