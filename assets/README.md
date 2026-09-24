# assets

- `hero_attack_sheet.png`：7 幀嚴格等寬攻擊表（由原始 sheet 去黑底、依內容分格置中；無提亮／厚描邊）
- `hero_attack_sheet_display.png`：同上，縮至單格 328×400（總 2296×400）供舞台顯示
- `hero_idle_frame.png`：第 0 幀裁切（可選；實際 idle 以 sheet 的 background-position 第 0 幀為主）
- `sword.svg`：舊版小圖示

**注意：** 已停用大型半身／全身立繪。戰鬥舞台左側只顯示此小全身連招 sprite（高度約 180px，寬高比＝單格 328:400）：idle = 第 0 幀；攻擊時依序播放 7 幀後回第 0 幀。容器 `overflow: hidden`，不得露隔壁格。
