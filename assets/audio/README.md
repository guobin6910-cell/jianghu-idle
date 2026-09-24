# assets/audio

BGM 仍為專案自製迴圈（暫保留，待使用者雲端自製音樂替換）。  
SFX 已改為**可商用免費（CC0／Public Domain）**素材，經 ffmpeg（libvorbis）轉 Ogg、音量正規化。

## BGM（未替換）

| 檔名 | 用途 | 授權 |
|------|------|------|
| `bgm_world.ogg` | 地圖／掛機 BGM | 專案自製 |
| `bgm_battle.ogg` | 名號對手遭遇 BGM | 專案自製 |

## SFX（已替換）

| 檔名 | 用途 | 來源檔 | 作者 | 授權 | 來源 URL |
|------|------|--------|------|------|----------|
| `sfx_hit.ogg` | 普攻命中 | `blade_01.ogg` | rubberduck | CC0 | https://opengameart.org/content/80-cc0-rpg-sfx |
| `sfx_crit.ogg` | 暴擊命中 | `blade_02.ogg` | rubberduck | CC0 | https://opengameart.org/content/80-cc0-rpg-sfx |
| `sfx_kill.ogg` | 擊殺 | `metal_02.ogg` | rubberduck | CC0 | https://opengameart.org/content/80-cc0-rpg-sfx |
| `sfx_levelup.ogg` | 升級 | `Rise03.aif`（裁切約 1.35s） | WobbleBoxx Workshop (wobbleboxx) | CC0 | https://opengameart.org/content/level-up-power-up-coin-get-13-sounds |
| `sfx_click.ogg` | UI 點擊 | `click1.wav` | Kenney.nl | CC0 | https://opengameart.org/content/51-ui-sound-effects-buttons-switches-and-clicks （原包 https://kenney.nl/assets/ui-audio） |
| `sfx_tea.ogg` | 茶樓開啟 | `doorOpen_1.ogg` | Kenney.nl | CC0 | https://opengameart.org/content/50-rpg-sound-effects （原包 https://kenney.nl/assets/rpg-audio） |
| `sfx_rival.ogg` | 名號對手出現 | `sword-unsheathe2.wav` | artisticdude | CC0 | https://opengameart.org/content/rpg-sound-pack |
| `sfx_spend.ogg` | 花俠義成功 | `item_coins_01.ogg` | rubberduck | CC0 | https://opengameart.org/content/80-cc0-rpg-sfx |
| `sfx_drop.ogg` | 掉寶 | `item_gem_01.ogg` | rubberduck | CC0 | https://opengameart.org/content/80-cc0-rpg-sfx |

## 處理

```bash
ffmpeg -i <source> -af "volume=…,alimiter=limit=0.89" -c:a libvorbis -q:a 5 -ar 44100 <out>.ogg
# 或 loudnorm=I=-15:TP=-1.5（較長片段）
```

檔名保持不變，供 `audio.js` 直接引用。署名非強制（CC0），仍於本 README 註明出處以示感謝。
