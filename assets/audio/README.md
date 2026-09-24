# assets/audio

本目錄音訊皆為專案自行以 Python（numpy）合成後經 ffmpeg 轉為 Ogg Vorbis，**無外部商業素材**，可視為專案原創／CC0 自製迴圈。

| 檔名 | 用途 |
|------|------|
| `bgm_world.ogg` | 地圖／掛機 BGM（約 12 秒迴圈） |
| `bgm_battle.ogg` | 名號對手遭遇 BGM（約 10 秒迴圈） |
| `sfx_hit.ogg` | 普攻命中 |
| `sfx_crit.ogg` | 暴擊命中 |
| `sfx_kill.ogg` | 擊殺 |
| `sfx_levelup.ogg` | 升級 |
| `sfx_click.ogg` | UI 點擊 |
| `sfx_tea.ogg` | 茶樓開啟 |
| `sfx_rival.ogg` | 名號對手出現 |
| `sfx_spend.ogg` | 花俠義成功 |
| `sfx_drop.ogg` | 掉寶 |

生成方式：`python3` 正弦／噪音合成 → `ffmpeg -c:a libvorbis`。
