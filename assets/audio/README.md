# assets/audio

BGM 已接上使用者自製曲（mp3 轉 ogg／保留 mp3 回退）。  
SFX 為 **CC0／Public Domain** 素材，經 ffmpeg（libvorbis）轉 Ogg、音量正規化。

## BGM

| 檔名 | 用途 | 曲目 | 授權 |
|------|------|------|------|
| `bgm_world.ogg` / `.mp3` | 地圖／掛機 BGM | *Beneath the Shattered Gate*（使用者自製） | 專案自有 |
| `bgm_battle.ogg` / `.mp3` | 名號對手遭遇 BGM | *Blade of the Last Emperor*（使用者自製） | 專案自有 |

| `bgm_calm.ogg` / `.mp3` | 河岸、竹林、古寺、霧島閒逛 | 使用者 2026-10-01 由 Gemini 生成之曲（`gemini_generated_video_F3D59B3D.mp4` 抽音軌，約 173 秒） | 使用者自製 |
| `bgm_road.ogg` / `.mp3` | 沙漠、斷崖、雪關閒逛 | 同上（`..._9ADC5A52.mp4`，約 178 秒） | 使用者自製 |
| `bgm_peak.ogg` / `.mp3` | 天脊雲棧閒逛 | 同上（`..._6496830F.mp4`，約 181 秒） | 使用者自製 |
| `bgm_battle2.ogg` / `.mp3` | 部分地圖的名號戰 | 同上（`..._9C22052E.mp4`，約 174 秒） | 使用者自製 |

另有兩支 mp4（`..._4BFFC171`、`..._A9C1DF8B`）超過雲端下載上限，尚未匯入。曲名未知，僅以檔名標示；音軌已去除靜音段並加淡入淡出。

`audio.js` 優先播放 `.ogg`，不支援時回退 `.mp3`。

## SFX

| 檔名 | 用途 | 來源檔 | 作者／包 | 授權 | 來源 URL |
|------|------|--------|----------|------|----------|
| `sfx_hit.ogg` | 普攻命中 | `impactMetal_medium_000.ogg` | Kenney.nl（Impact Sounds） | CC0 | https://kenney.nl/assets/impact-sounds |
| `sfx_crit.ogg` | 暴擊命中 | `impactPlate_heavy_000.ogg` | Kenney.nl（Impact Sounds） | CC0 | https://kenney.nl/assets/impact-sounds |
| `sfx_kill.ogg` | 擊殺 | `impactBell_heavy_002.ogg` | Kenney.nl（Impact Sounds） | CC0 | https://kenney.nl/assets/impact-sounds |
| `sfx_levelup.ogg` | 升級 | `jingles_PIZZI07.ogg` | Kenney.nl（Music Jingles） | CC0 | https://kenney.nl/assets/music-jingles |
| `sfx_click.ogg` | UI 點擊 | `pluck_001.ogg` | Kenney.nl（Interface Sounds） | CC0 | https://kenney.nl/assets/interface-sounds （OGA: https://opengameart.org/content/interface-sounds） |
| `sfx_tea.ogg` | 茶樓開啟 | `open_002.ogg` | Kenney.nl（Interface Sounds） | CC0 | https://kenney.nl/assets/interface-sounds |
| `sfx_rival.ogg` | 名號對手出現 | `sword-unsheathe3.wav` | artisticdude（RPG Sound Pack） | CC0 | https://opengameart.org/content/rpg-sound-pack |
| `sfx_spend.ogg` | 花俠義成功 | `handleCoins2.ogg` | Kenney.nl（RPG Audio） | CC0 | https://kenney.nl/assets/rpg-audio （OGA: https://opengameart.org/content/50-rpg-sound-effects） |
| `sfx_drop.ogg` | 掉寶 | `item_gem_03.ogg` | rubberduck（80 CC0 RPG SFX） | CC0 | https://opengameart.org/content/80-cc0-rpg-sfx |

## 處理

```bash
ffmpeg -i <source> -af "volume=…,alimiter=limit=0.89" -c:a libvorbis -q:a 5 -ar 44100 -ac 1 <out>.ogg
# BGM（立體聲）
ffmpeg -i <source>.mp3 -c:a libvorbis -q:a 5 -ar 44100 <out>.ogg
```

檔名保持不變，供 `audio.js` 直接引用。署名非強制（CC0），仍於本 README 註明出處以示感謝。
