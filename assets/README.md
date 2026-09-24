# assets

- `hero_attack_sheet.png`：7 幀橫向連續攻擊表（黑底轉透明、微提亮／淡描邊；原圖約 3200×800）
- `hero_attack_sheet_display.png`：同上，縮至約 1792×400 供舞台顯示
- `hero_idle_frame.png`：第 1 幀裁切（可選；實際 idle 以 sheet 的 background-position 第 0 幀為主）
- `sword.svg`：舊版小圖示

**注意：** 已停用大型半身／全身立繪（`hero_idle.png` / `hero_idle_display.png`）。
戰鬥舞台左側只顯示此小全身連招 sprite（高度約 180px）：idle = 第 1 幀；攻擊時依序播放 7 幀後回第 1 幀。
