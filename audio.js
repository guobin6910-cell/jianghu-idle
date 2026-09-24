/* 江湖閒談錄｜音訊模組（HTMLAudioElement） */
(function (global) {
  const BASE = 'assets/audio/';
  const BGM_SRC = {
    world: BASE + 'bgm_world.ogg',
    battle: BASE + 'bgm_battle.ogg',
  };
  const SFX_SRC = {
    hit: BASE + 'sfx_hit.ogg',
    crit: BASE + 'sfx_crit.ogg',
    kill: BASE + 'sfx_kill.ogg',
    levelup: BASE + 'sfx_levelup.ogg',
    click: BASE + 'sfx_click.ogg',
    tea: BASE + 'sfx_tea.ogg',
    rival: BASE + 'sfx_rival.ogg',
    spend: BASE + 'sfx_spend.ogg',
    drop: BASE + 'sfx_drop.ogg',
  };

  let muted = false;
  let bgmVol = 0.35;
  let sfxVol = 0.5;
  let unlocked = false;
  let currentBgmId = null;
  let bgmEl = null;
  let fadeTimer = null;
  const sfxPool = {};

  function makeAudio(src, loop) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.loop = !!loop;
    return a;
  }

  function ensureBgmEl() {
    if (!bgmEl) {
      bgmEl = new Audio();
      bgmEl.preload = 'auto';
      bgmEl.loop = true;
    }
    return bgmEl;
  }

  function clearFade() {
    if (fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }

  function fadeTo(el, target, ms, onDone) {
    clearFade();
    if (!el) {
      if (onDone) onDone();
      return;
    }
    const steps = Math.max(4, Math.floor(ms / 40));
    const start = el.volume;
    let i = 0;
    fadeTimer = setInterval(() => {
      i += 1;
      const t = i / steps;
      el.volume = Math.max(0, Math.min(1, start + (target - start) * t));
      if (i >= steps) {
        clearFade();
        el.volume = target;
        if (onDone) onDone();
      }
    }, 40);
  }

  function effectiveBgmVol() {
    return muted ? 0 : bgmVol;
  }

  function effectiveSfxVol() {
    return muted ? 0 : sfxVol;
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    // 輕觸解鎖：播極短靜音再停
    try {
      const a = ensureBgmEl();
      a.muted = true;
      const p = a.play();
      if (p && p.then) {
        p.then(() => {
          a.pause();
          a.muted = false;
          a.currentTime = 0;
        }).catch(() => {
          a.muted = false;
        });
      } else {
        a.muted = false;
      }
    } catch (_) {
      /* ignore */
    }
  }

  function playBgm(id) {
    if (!BGM_SRC[id]) return;
    unlock();
    const el = ensureBgmEl();
    if (currentBgmId === id && !el.paused) {
      el.volume = effectiveBgmVol();
      return;
    }
    const src = BGM_SRC[id];
    const switchTo = () => {
      currentBgmId = id;
      el.src = src;
      el.loop = true;
      el.volume = 0;
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
      fadeTo(el, effectiveBgmVol(), 500);
    };
    if (currentBgmId && !el.paused) {
      fadeTo(el, 0, 350, () => {
        el.pause();
        switchTo();
      });
    } else {
      switchTo();
    }
  }

  function stopBgm() {
    const el = bgmEl;
    if (!el) return;
    fadeTo(el, 0, 400, () => {
      el.pause();
      currentBgmId = null;
    });
  }

  function sfx(id) {
    if (!SFX_SRC[id] || muted) return;
    unlock();
    try {
      let pool = sfxPool[id];
      if (!pool) {
        pool = sfxPool[id] = [];
      }
      let a = pool.find((x) => x.paused || x.ended);
      if (!a) {
        a = makeAudio(SFX_SRC[id], false);
        pool.push(a);
        if (pool.length > 6) pool.shift();
      }
      a.volume = effectiveSfxVol();
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (_) {
      /* ignore */
    }
  }

  function setMuted(bool) {
    muted = !!bool;
    const el = bgmEl;
    if (el) {
      if (muted) {
        el.volume = 0;
      } else if (currentBgmId) {
        el.volume = bgmVol;
        if (el.paused && unlocked) {
          const p = el.play();
          if (p && p.catch) p.catch(() => {});
        }
      }
    }
  }

  function setVolume(bgm, sfxV) {
    if (typeof bgm === 'number') bgmVol = Math.max(0, Math.min(1, bgm));
    if (typeof sfxV === 'number') sfxVol = Math.max(0, Math.min(1, sfxV));
    if (bgmEl && !muted) bgmEl.volume = bgmVol;
  }

  function applySettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    if (typeof settings.muted === 'boolean') muted = settings.muted;
    if (typeof settings.bgmVol === 'number') bgmVol = settings.bgmVol;
    if (typeof settings.sfxVol === 'number') sfxVol = settings.sfxVol;
    if (bgmEl) bgmEl.volume = effectiveBgmVol();
  }

  function getSettings() {
    return { muted, bgmVol, sfxVol };
  }

  function isMuted() {
    return muted;
  }

  function isUnlocked() {
    return unlocked;
  }

  function getCurrentBgm() {
    return currentBgmId;
  }

  // 預載
  Object.keys(SFX_SRC).forEach((k) => {
    const a = makeAudio(SFX_SRC[k], false);
    sfxPool[k] = [a];
  });

  global.JianghuAudio = {
    playBgm,
    stopBgm,
    sfx,
    setMuted,
    setVolume,
    applySettings,
    getSettings,
    isMuted,
    isUnlocked,
    unlock,
    getCurrentBgm,
  };
})(typeof window !== 'undefined' ? window : globalThis);
