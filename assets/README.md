# assets

- `hero_idle.png`：主角全身立繪（近黑底已轉透明，寬約 440px）
- `hero_attack_sheet.png`：7 幀橫向攻擊表（總寬 1750，每格 250×385）
- `sword.svg`：舊版小圖示

戰鬥舞台左側以 CSS background 顯示 idle；攻擊時由 game.js 以 background-position 切換 7 幀。
