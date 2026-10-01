(() => {
  const SAVE_KEY = 'jianghu-idle-v1';
  // 驗收用：網址加 ?debug=boss → 每次遇敵必出該區名號頭目、不受每日／冷卻限制、各區免等級限制（不影響正式玩法）
  const DEBUG_BOSS = /[?&]debug=boss\b/.test(location.search);
  let audioSilent = false;
  const Audio = () => (audioSilent ? null : (typeof window !== 'undefined' && window.JianghuAudio) || null);
  function syncMuteBtn() {
    const btn = document.getElementById('btn-mute');
    if (!btn || !Audio()) return;
    const m = Audio().isMuted();
    btn.textContent = m ? '🔇' : '🔊';
    btn.setAttribute('aria-pressed', m ? 'true' : 'false');
    btn.title = m ? '取消靜音' : '靜音';
  }
  function persistAudioSettings() {
    if (!state) return;
    const A = Audio();
    if (!A) return;
    const audio = A.getSettings();
    const prev = state.settings || {};
    state.settings = {
      muted: audio.muted,
      bgmVol: audio.bgmVol,
      sfxVol: audio.sfxVol,
      autoSell: prev.autoSell || 'fan',
      bulkSell: prev.bulkSell === 'fan_liang' ? 'fan_liang' : 'fan',
    };
  }

  const SCHOOLS = [
    { id: 'cangjian', name: '蒼山劍門', desc: '劍意清正，攻高防平', atk: 3, def: 1, spd: 2 },
    { id: 'tiandao', name: '天刀門', desc: '刀勢沉猛，攻防均衡', atk: 2, def: 2, spd: 1 },
    { id: 'wuzong', name: '無踪樓', desc: '身法飄忽，速度出眾', atk: 2, def: 0, spd: 4 },
    { id: 'chanwu', name: '禪武院', desc: '外剛內定，防高耐打', atk: 1, def: 4, spd: 1 },
  ];

  const WEAPONS = [
    { id: 'jian', name: '長劍', atk: 2, spd: 1 },
    { id: 'dao', name: '單刀', atk: 3, spd: 0 },
    { id: 'qiang', name: '長槍', atk: 2, def: 1 },
    { id: 'anqi', name: '暗器', atk: 1, spd: 3 },
  ];

  const LOOKS = [
    { id: 'a', glyph: '劍' },
    { id: 'b', glyph: '刀' },
    { id: 'c', glyph: '武' },
    { id: 'd', glyph: '禪' },
  ];
  const SCHOOL_GLYPH = { cangjian: '劍', tiandao: '刀', wuzong: '影', chanwu: '禪' };
  const SCHOOL_SHORT = { cangjian: '蒼山', tiandao: '天刀', wuzong: '無踪', chanwu: '禪武' };
  const ZONE_KILL_GOAL = 20;

  const SCHOOL_SKILLS = {
    cangjian: [
      { id: 'pokong', name: '破空', cd: 4500, mult: 1.35 },
      { id: 'lianzhan', name: '連斬', cd: 6500, mult: 0.85, hits: 2 },
      { id: 'yujian', name: '御劍', cd: 8000, mult: 1.7 },
      { id: 'ningqi', name: '凝氣', cd: 10000, kind: 'buff' },
    ],
    tiandao: [
      { id: 'liefeng', name: '裂風', cd: 4500, mult: 1.4 },
      { id: 'bengshan', name: '崩山', cd: 7000, mult: 1.85 },
      { id: 'xueren', name: '血刃', cd: 8000, mult: 1.55 },
      { id: 'ningqi', name: '凝氣', cd: 10000, kind: 'buff' },
    ],
    wuzong: [
      { id: 'yingxi', name: '影襲', cd: 4000, mult: 1.25 },
      { id: 'lianhuan', name: '連環', cd: 6000, mult: 0.75, hits: 3 },
      { id: 'dunying', name: '遁影', cd: 7500, mult: 1.5 },
      { id: 'ningqi', name: '凝氣', cd: 10000, kind: 'buff' },
    ],
    chanwu: [
      { id: 'tiebi', name: '鐵壁', cd: 5000, mult: 1.2 },
      { id: 'chanzhang', name: '禪掌', cd: 6500, mult: 1.6 },
      { id: 'dingxin', name: '定心', cd: 8000, mult: 1.45 },
      { id: 'ningqi', name: '凝氣', cd: 10000, kind: 'buff' },
    ],
  };

  // ===== 武學系統（門派被動／Lv.10・20・30 二選一／Lv.50 絕學／重選）=====
  // 文案與數值來自創意提供者。※遊戲目前沒有玩家血條，「生命／回血／受傷」類效果換算成防禦、減傷與護體次數（real 欄說明）。
  const MARTIAL_TIERS = [10, 20, 30];
  const MARTIAL_ULT_LV = 50;
  const MARTIAL_RESPEC_BASE = 1000;
  const MARTIAL = {
    cangjian: {
      tag: '攻擊型', slogan: '劍出如虹，快攻搶先。',
      passive: { name: '劍出如虹', desc: '戰鬥開始前 3 秒，攻擊 +10%。', fx: { opening: 0.1 } },
      tiers: {
        10: [
          { id: 'c10a', name: '連斬強化', desc: '連斬多一段傷害 +30%。', fx: { skillMul: { lianzhan: 0.3 } } },
          { id: 'c10b', name: '御劍疾', desc: '御劍冷卻 −20%。', fx: { cdMul: { yujian: -0.2 } } },
        ],
        20: [
          { id: 'c20a', name: '破空穿甲', desc: '破空無視 15% 防禦。', fx: { ignoreDef: { pokong: 0.15 } } },
          { id: 'c20b', name: '凝氣綿長', desc: '凝氣增益時間 +30%。', real: '護體次數 2→3', fx: { ningDur: 0.3 } },
        ],
        30: [
          { id: 'c30a', name: '暴風劍意', desc: '連擊時攻擊每次 +3%（最多 5 層）。', real: '每次施放招式疊一層，8 秒內有效', fx: { storm: 5 } },
          { id: 'c30b', name: '劍心不亂', desc: '受傷 −10%。', fx: { takenMul: -0.1 } },
        ],
      },
      ult: { id: 'wanjian', name: '萬劍歸宗', short: '萬劍', cd: 45000, desc: '一次打出所有劍招傷害的 2.5 倍。' },
    },
    tiandao: {
      tag: '均衡型', slogan: '一刀斬斷，不留後路。',
      passive: { name: '斬草除根', desc: '對血量低於 50% 的敵人，傷害 +12%。', fx: { lowHp: 0.12 } },
      tiers: {
        10: [
          { id: 't10a', name: '裂風強化', desc: '裂風傷害 +25%。', fx: { skillMul: { liefeng: 0.25 } } },
          { id: 't10b', name: '血刃回氣', desc: '血刃回復傷害的 10% 生命。', fx: { healDmg: { xueren: 0.1 } } },
        ],
        20: [
          { id: 't20a', name: '崩山必暴', desc: '崩山必定暴擊一次。', real: '崩山每次施放必暴擊（傷害 ×1.5）', fx: { critSkill: { bengshan: 1.5 } } },
          { id: 't20b', name: '凝氣護體', desc: '凝氣同時加防禦 10%。', real: '施放凝氣後 10 秒防禦 +10%', fx: { ningDef: 0.1 } },
        ],
        30: [
          { id: 't30a', name: '殺氣', desc: '每擊殺 5 隻怪攻擊 +5%（可疊 3 層）。', real: '停止掛機後層數清空', fx: { killStack: 3 } },
          { id: 't30b', name: '刀魂', desc: '生命 +10%。', fx: { hpPct: 0.1 } },
        ],
      },
      ult: { id: 'tiandaozhan', name: '天刀斬', short: '天刀', cd: 30000, desc: '單次 3 倍傷害，打首領時再 +20%。' },
    },
    wuzong: {
      tag: '身法型', slogan: '來去無影，快到對手摸不著。',
      passive: { name: '來去無影', desc: '速度 +10%，第一擊必中。', real: '每場戰鬥第一擊必定暴擊', fx: { spdPct: 0.1, firstCrit: 1 } },
      tiers: {
        10: [
          { id: 'w10a', name: '連環再一段', desc: '連環多一段。', fx: { hitsPlus: { lianhuan: 1 } } },
          { id: 'w10b', name: '影襲疾', desc: '影襲冷卻 −25%。', fx: { cdMul: { yingxi: -0.25 } } },
        ],
        20: [
          { id: 'w20a', name: '遁影蓄勢', desc: '遁影後下一擊 +50%。', fx: { nextBonus: { dunying: 0.5 } } },
          { id: 'w20b', name: '遁影綿長', desc: '遁影持續時間 +40%。', real: '施放遁影獲得 2 次護體（減傷）', fx: { guard: { dunying: 2 } } },
        ],
        30: [
          { id: 'w30a', name: '暗器如雨', desc: '連擊傷害 +20%。', real: '所有多段招式傷害 +20%', fx: { multiHit: 0.2 } },
          { id: 'w30b', name: '幻步', desc: '閃避 +8%。', fx: { dodge: 0.08 } },
        ],
      },
      ult: { id: 'wuying', name: '無影百殺', short: '百殺', cd: 40000, desc: '連續 6 擊，每擊 60% 攻擊，速度越高越強。' },
    },
    chanwu: {
      tag: '防禦型', slogan: '以靜制動，穩到最後。',
      passive: { name: '以靜制動', desc: '生命 +12%，受到的傷害 −6%。', fx: { hpPct: 0.12, takenMul: -0.06 } },
      tiers: {
        10: [
          { id: 'h10a', name: '鐵壁綿長', desc: '鐵壁持續 +40%。', real: '施放鐵壁獲得 2 次護體（減傷）', fx: { guard: { tiebi: 2 } } },
          { id: 'h10b', name: '禪掌養氣', desc: '禪掌回復 8% 生命。', fx: { healPct: { chanzhang: 0.08 } } },
        ],
        20: [
          { id: 'h20a', name: '定心守一', desc: '定心讓下一次受傷 −30%。', fx: { nextHitReduce: { dingxin: 0.3 } } },
          { id: 'h20b', name: '凝氣回元', desc: '凝氣同時回血 5%。', fx: { healPct: { ningqi: 0.05 } } },
        ],
        30: [
          { id: 'h30a', name: '金鐘罩', desc: '防禦 +15%。', fx: { defPct: 0.15 } },
          { id: 'h30b', name: '佛心', desc: '戰鬥中每秒回血 1%。', fx: { regenCombat: 0.01 } },
        ],
      },
      ult: { id: 'luohan', name: '羅漢金身', short: '金身', cd: 40000, desc: '8 秒內傷害減半並反彈 20% 傷害。' },
    },
  };
  function martialState(hero) {
    if (!hero.martial || typeof hero.martial !== 'object') hero.martial = { pick: {}, respec: 0 };
    if (!hero.martial.pick) hero.martial.pick = {};
    return hero.martial;
  }
  function martialPickedNodes(hero) {
    const M = MARTIAL[hero.school];
    if (!M) return [];
    const ms = martialState(hero);
    const out = [];
    MARTIAL_TIERS.forEach((t) => {
      const i = ms.pick[t];
      if (hero.lv >= t && (i === 0 || i === 1) && M.tiers[t][i]) out.push(M.tiers[t][i]);
    });
    return out;
  }
  function mergeFx(into, src) {
    Object.keys(src).forEach((k) => {
      const v = src[k];
      if (v && typeof v === 'object') {
        into[k] = into[k] || {};
        Object.keys(v).forEach((kk) => { into[k][kk] = (into[k][kk] || 0) + v[kk]; });
      } else into[k] = (into[k] || 0) + v;
    });
  }
  function martialFx(hero) {
    const fx = {};
    const M = MARTIAL[hero.school];
    if (!M) return fx;
    mergeFx(fx, M.passive.fx);
    martialPickedNodes(hero).forEach((n) => mergeFx(fx, n.fx));
    return fx;
  }
  function martialUlt(hero) {
    const M = MARTIAL[hero.school];
    return M && hero.lv >= MARTIAL_ULT_LV ? Object.assign({ kind: 'ult', mult: 1 }, M.ult) : null;
  }
  function respecCost() { return MARTIAL_RESPEC_BASE * Math.pow(2, martialState(state).respec || 0); }
  function pickMartial(tier, idx) {
    if (!state || state.lv < tier) return;
    const ms = martialState(state);
    if (ms.pick[tier] === idx) return;
    if (ms.pick[tier] === 0 || ms.pick[tier] === 1) { pushLog('該境界已選定，需「重選武學」才能更換。'); renderAll(); return; }
    ms.pick[tier] = idx;
    const n = MARTIAL[state.school].tiers[tier][idx];
    pushLog('領悟武學「' + n.name + '」！', 'rival');
    if (Audio()) Audio().sfx('levelup');
    renderAll();
    save();
  }
  function respecMartial() {
    const ms = martialState(state);
    if (!Object.keys(ms.pick).length) return;
    const cost = respecCost();
    if (state.silver < cost) { pushLog('重選武學需 ' + cost + ' 銀，銀兩不足。'); renderAll(); return; }
    state.silver -= cost;
    ms.pick = {};
    ms.respec = (ms.respec || 0) + 1;
    pushLog('散去功力、重選武學（−' + cost + ' 銀）。', 'loot');
    if (Audio()) Audio().sfx('spend');
    renderAll();
    save();
  }
  function martialHtml() {
    const M = MARTIAL[state.school];
    if (!M) return '';
    const ms = martialState(state);
    const ult = M.ult;
    let h = '<h3 style="margin-top:12px">武學</h3><div class="martial-box">' +
      '<div class="martial-head"><img class="school-badge" src="assets/icons/school_' + state.school + '.webp" alt="" onerror="this.remove()">' +
      '<div><strong>' + escapeHtml(schoolShort(state.school)) + '・' + M.tag + '</strong><div class="muted">' + escapeHtml(M.slogan) + '</div></div></div>' +
      '<div class="martial-passive"><strong>被動「' + escapeHtml(M.passive.name) + '」</strong><div class="muted">' + escapeHtml(M.passive.desc) + (M.passive.real ? '（實裝：' + escapeHtml(M.passive.real) + '）' : '') + '</div></div>';
    MARTIAL_TIERS.forEach((t) => {
      const locked = state.lv < t;
      h += '<div class="martial-tier"><div class="muted">' + (locked ? '🔒 ' : '') + 'Lv.' + t + ' 二選一' + (locked ? '（等級未到）' : '') + '</div><div class="martial-opts">';
      M.tiers[t].forEach((n, i) => {
        const sel = ms.pick[t] === i;
        const taken = (ms.pick[t] === 0 || ms.pick[t] === 1) && !sel;
        h += '<button type="button" class="martial-node' + (sel ? ' sel' : '') + (taken ? ' taken' : '') + (locked ? ' lockd' : '') + '" data-mpick="' + t + ':' + i + '"' + (locked || taken ? ' disabled' : '') + '>' +
          '<strong>' + (sel ? '✓ ' : locked ? '🔒 ' : '') + escapeHtml(n.name) + (taken ? '（已選另一個）' : '') + '</strong><span>' + escapeHtml(n.desc) + (n.real ? '<em>（實裝：' + escapeHtml(n.real) + '）</em>' : '') + '</span></button>';
      });
      h += '</div></div>';
    });
    const ultOn = state.lv >= MARTIAL_ULT_LV;
    h += '<div class="martial-ult' + (ultOn ? ' on' : '') + '"><strong>Lv.' + MARTIAL_ULT_LV + ' 絕學「' + escapeHtml(ult.name) + '」' + (ultOn ? '（已領悟，技能列第 5 格）' : '（未達）') + '</strong><div class="muted">' + escapeHtml(ult.desc) + '</div></div>';
    const picked = Object.keys(ms.pick).length;
    h += '<button type="button" class="btn ghost" id="btn-respec"' + (picked ? '' : ' disabled') + '>' + (picked ? '重選武學（' + respecCost() + ' 銀）' : '尚未選擇武學') + '</button></div>';
    return h;
  }

  function getSchoolSkills(schoolId) {
    return SCHOOL_SKILLS[schoolId] || SCHOOL_SKILLS.cangjian;
  }
  /** 含已領悟絕學（第 5 格）。 */
  function heroSkills() {
    const base = getSchoolSkills(state.school);
    const u = martialUlt(state);
    return u ? base.concat([u]) : base;
  }
  function skillCdMs(sk) {
    if (!sk) return 5000;
    const f = ((martialFx(state).cdMul || {})[sk.id]) || 0;
    return Math.max(1500, Math.floor((sk.cd || 5000) * (1 + f)));
  }

  function calcPower(stats, hp) {
    return Math.floor((stats.atk || 0) * 4 + (stats.def || 0) * 3 + (stats.spd || 0) * 5 + (hp || 0) / 5);
  }

  const QUALITY_META = {
    fan: { id: 'fan', label: '凡', cls: 'q-fan' },
    liang: { id: 'liang', label: '良', cls: 'q-liang' },
    zhen: { id: 'zhen', label: '珍', cls: 'q-zhen' },
    jue: { id: 'jue', label: '絕', cls: 'q-jue' },
  };

  function qualityMeta(q) {
    return QUALITY_META[q] || QUALITY_META.fan;
  }


  // ===== 裝備系統（強化／詞條／套裝／首領專屬武器）=====
  // ※ 所有數字集中在這裡；目前為暫訂值，創意提供者的數值表到了只改這一區。
  const ENH_MAX = 10;
  const ENH_COST = [200, 300, 450, 680, 1020, 1540, 2320, 3500, 5300, 8000]; // 第 n 次強化（+n）基礎銀兩
  const ENH_QUALITY_MULT = { fan: 1, liang: 2, zhen: 4, jue: 8 }; // 品質倍率（乘在銀兩上）
  const ENH_RATE = [1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]; // 基礎成功率
  const ENH_PITY_STEP = 0; // 保底：只用「連敗 4 次必成」
  const ENH_PITY_GUARANTEE = 4;
  const ENH_STAT_PCT = 0.08; // 每 +1 提升該件基礎屬性 8%（至少每 2 級 +1）
  const AFFIX_DEFS = {
    atk: { name: '鋒銳', unit: '攻擊', zhen: [5, 12], jue: [5, 12] },
    def: { name: '堅韌', unit: '防禦', zhen: [5, 12], jue: [5, 12] },
    spd: { name: '迅捷', unit: '速度', zhen: [2, 6], jue: [2, 6] },
    silver: { name: '貪財', unit: '銀兩掉落', zhen: [5, 15], jue: [5, 15] },
    exp: { name: '悟性', unit: '經驗', zhen: [5, 15], jue: [5, 15] },
    drop: { name: '福緣', unit: '掉落率', zhen: [5, 15], jue: [5, 15] },
  };
  const AFFIX_COUNT = { fan: 0, liang: 0, zhen: 1, jue: 2 };
  const EQUIP_SETS = {
    yanyu: {
      name: '煙雨套',
      pieces: ['umbrella_bone_spike', 'lantern_cloak', 'boots', 'pearl_ring'],
      bonus: [
        { n: 2, spd: 5, text: '速度 +5%' },
        { n: 4, def: 8, text: '防禦再 +8%' },
      ],
    },
    lieren: {
      name: '烈刃套',
      pieces: ['frost_blade', 'temple_armor', 'snow_boots', 'bell_ring'],
      bonus: [
        { n: 2, atk: 6, text: '攻擊 +6%' },
        { n: 4, atk: 10, text: '攻擊累計 +16%' },
      ],
    },
  };
  function setOfItem(item) {
    if (!item) return null;
    for (const k of Object.keys(EQUIP_SETS)) if (EQUIP_SETS[k].pieces.indexOf(item.id) >= 0) return k;
    return null;
  }
  function enhLv(it) { return (it && it.enh) || 0; }
  function itemBase(it, key) {
    const b = (it && it[key]) || 0;
    if (!b) return 0;
    const lv = enhLv(it);
    return b + Math.max(Math.floor(lv / 2), Math.round(b * ENH_STAT_PCT * lv));
  }
  function itemDisplayName(it) {
    return it.name + (enhLv(it) > 0 ? ' +' + enhLv(it) : '');
  }
  function nameHtml(it) {
    const lv = enhLv(it);
    return '<span class="' + (lv >= 10 ? 'enh-glow enh-10' : lv >= 5 ? 'enh-glow' : '') + '">' + escapeHtml(itemDisplayName(it)) + '</span>';
  }
  const ICON_ITEMS = ['lantern_cloak', 'boots', 'pearl_ring', 'frost_blade', 'temple_armor', 'snow_boots', 'bell_ring'];
  const ICON_WEAPONS = ['broken_inn_blade', 'liu_short_spike', 'sandstorm_scimitar', 'bamboo_slim_sword', 'cliff_rope_hook', 'umbrella_bone_spike', 'frost_pass_blade', 'broken_bell_staff', 'isle_tide_blade', 'skywind_sword'];
  function iconHtml(it) {
    let f = null;
    if (it.bossWeapon && ICON_WEAPONS.indexOf(it.id) >= 0) f = 'weapon_' + it.id;
    else if (ICON_ITEMS.indexOf(it.id) >= 0) f = 'item_' + it.id;
    else if (it.id === 'umbrella_bone_spike' && ICON_WEAPONS.indexOf(it.id) >= 0) f = 'weapon_' + it.id;
    if (!f) return '<span class="item-ico-ph"></span>';
    return '<span class="item-ico"><img src="assets/icons/' + f + '.webp" alt="" onerror="var p=this.parentNode;if(p)p.remove()"><img class="frame" src="assets/icons/frame_' + (it.quality || 'fan') + '.webp" alt="" onerror="this.remove()"></span>';
  }
  function rollAffixes(q) {
    const n = AFFIX_COUNT[q] || 0;
    const keys = Object.keys(AFFIX_DEFS);
    const out = [];
    while (out.length < n && keys.length) {
      const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0];
      const rg = AFFIX_DEFS[k][q === 'jue' ? 'jue' : 'zhen'];
      out.push({ k: k, v: rand(rg[0], rg[1]) });
    }
    return out;
  }
  function affixText(it) {
    return (it.affixes || []).map((a) => {
      const d = AFFIX_DEFS[a.k];
      return d ? d.name + ' ' + d.unit + '+' + a.v + '%' : '';
    }).filter(Boolean).join('、');
  }
  function activeSets(hero) {
    const cnt = {};
    for (const it of Object.values((hero && hero.equip) || {})) {
      const sid = setOfItem(it);
      if (sid) cnt[sid] = (cnt[sid] || 0) + 1;
    }
    return cnt;
  }
  /** 詞條＋套裝合計（百分比整數） */
  function gearPct(hero) {
    const t = { atk: 0, def: 0, spd: 0, silver: 0, exp: 0, drop: 0 };
    for (const it of Object.values((hero && hero.equip) || {})) {
      if (!it) continue;
      for (const a of it.affixes || []) if (t[a.k] != null) t[a.k] += a.v;
    }
    const cnt = activeSets(hero);
    for (const sid of Object.keys(cnt)) {
      for (const b of EQUIP_SETS[sid].bonus) {
        if (cnt[sid] >= b.n) for (const k of Object.keys(t)) t[k] += b[k] || 0;
      }
    }
    return t;
  }
  function enhRate(it) {
    const lv = enhLv(it);
    if (lv >= ENH_MAX) return 0;
    const streak = it.enhFail || 0;
    if (streak >= ENH_PITY_GUARANTEE) return 1;
    return Math.min(1, ENH_RATE[lv] + streak * ENH_PITY_STEP);
  }
  function enhCost(it) { return ENH_COST[Math.min(ENH_MAX - 1, enhLv(it))] * (ENH_QUALITY_MULT[it.quality] || 1); }
  function findOwnedItem(uid) {
    const b = state.bag.find((x) => x.uid === uid);
    if (b) return b;
    for (const sl of Object.keys(state.equip)) if (state.equip[sl] && state.equip[sl].uid === uid) return state.equip[sl];
    return null;
  }
  function enhanceItem(uid) {
    const it = findOwnedItem(uid);
    if (!it || !it.slot) return;
    if (enhLv(it) >= ENH_MAX) { pushLog('「' + it.name + '」已強化至極限。'); renderBag(); return; }
    const cost = enhCost(it);
    if (state.silver < cost) { pushLog('銀兩不足，強化「' + it.name + '」需 ' + cost + ' 銀。'); renderBag(); return; }
    const rate = enhRate(it);
    state.silver -= cost;
    bumpQuest('enh');
    const qm = qualityMeta(it.quality);
    if (Math.random() < rate) {
      const _a = achStats();
      if ((it.enhFail || 0) >= ENH_PITY_GUARANTEE) _a.pityHit += 1;
      it.enh = enhLv(it) + 1;
      it.enhFail = 0;
      _a.enhOk += 1;
      _a.maxEnh = Math.max(_a.maxEnh, it.enh);
      addRumor('enh1');
      if (it.enh >= 5) addRumor('enh5');
      if (it.enh >= 10) addRumor('enh10');
      if (_a.pityHit > 0) addRumor('pity');
      pushLog('強化成功！「' + it.name + '」→ +' + it.enh + '（−' + cost + ' 銀）', 'loot ' + qm.cls);
      if (it.enh === 5 || it.enh === 10) {
        pushLog('✨「' + it.name + '」強化到 +' + it.enh + '，名號生輝！', 'loot ' + qm.cls);
      }
      if (Audio()) Audio().sfx('levelup');
    } else {
      it.enhFail = (it.enhFail || 0) + 1;
      pushLog('強化失敗，「' + it.name + '」未受損（−' + cost + ' 銀，保底 ' + it.enhFail + '/' + ENH_PITY_GUARANTEE + '）', 'loot');
      if (Audio()) Audio().sfx('click');
    }
    renderAll();
    save();
  }

  /** 稀有度越低（越難掉）→ 高品質機率越高；名號至少珍 */
  function rollQuality(rare, opts) {
    opts = opts || {};
    if (opts.fromRival) {
      return Math.random() < 0.58 ? 'jue' : 'zhen';
    }
    const r = typeof rare === 'number' ? rare : 0.22;
    const inv = 1 - Math.min(0.95, Math.max(0.04, r));
    const roll = Math.random();
    const pJue = 0.004 + inv * 0.045;
    const pZhen = 0.025 + inv * 0.12;
    const pLiang = 0.2 + inv * 0.22;
    if (roll < pJue) return 'jue';
    if (roll < pJue + pZhen) return 'zhen';
    if (roll < pJue + pZhen + pLiang) return 'liang';
    return 'fan';
  }

  function qualitySellPrice(item) {
    const q = (item && item.quality) || 'fan';
    const ranges = {
      fan: [8, 15],
      liang: [25, 40],
      zhen: [60, 95],
      jue: [120, 180],
    };
    const rg = ranges[q] || ranges.fan;
    const base = rand(rg[0], rg[1]);
    return (
      base + enhLv(item) * 30 +
      (item.atk || 0) * 4 +
      (item.def || 0) * 3 +
      (item.spd || 0) * 3
    );
  }

  function junkSilverWithQuality(base, q) {
    const mult = { fan: 1, liang: 1.35, zhen: 1.9, jue: 2.8 }[q] || 1;
    return Math.max(1, Math.floor((base || 0) * mult));
  }

  function getAutoSellMode() {
    const m = state && state.settings && state.settings.autoSell;
    if (m === 'off' || m === 'fan' || m === 'fan_liang') return m;
    return 'fan';
  }

  // 自動售出僅由 grantDropItem 在「尚未 bag.push」時呼叫；禁止對行囊舊物批次販售。
  function shouldAutoSell(item) {
    if (!item) return false;
    if (item.keep || item.fromRival) return false;
    const mode = getAutoSellMode();
    if (mode === 'off') return false;
    const q = item.quality || 'fan';
    if (mode === 'fan') return q === 'fan';
    if (mode === 'fan_liang') return q === 'fan' || q === 'liang';
    return false;
  }

  function isItemEquipped(uid) {
    if (!state || !state.equip) return false;
    return Object.keys(state.equip).some((slot) => {
      const it = state.equip[slot];
      return it && it.uid === uid;
    });
  }

  const ZONE_LOOK = {
    inn: 'bandit', river: 'water', desert: 'sand', bamboo: 'bamboo', cliff: 'cliff',
    nightmarket: 'night', snowpass: 'snow', oldtemple: 'temple', mistisle: 'mist', skyridge: 'sky',
  };

  const MOB_GLYPH = [
    [/犬|狼/, '🐺'], [/狐/, '🦊'], [/魂|魄|紙紮/, '👻'], [/獅/, '🦁'], [/海妖/, '🦑'], [/鼠/, '🐀'], [/蛟|鮫/, '🐊'], [/蟹/, '🦀'], [/蠍/, '🦂'], [/鷲|鷹|鳥/, '🦅'], [/蛇|竹葉青/, '🐍'], [/魈|猿/, '🐒'], [/岩魔|石/, '🪨'],
    [/醉|賭|混/, '🥴'], [/馬賊|沙盜|盜/, '🗡️'], [/水|潮|船|碼頭/, '🌊'],
    [/黑衣|刺客|影|追踪/, '🥷'], [/劍/, '⚔️'], [/刀/, '🔪'], [/僧|寺|禪/, '🥋'],
    [/雪|寒|凍/, '❄️'], [/崖|絕|風|雲|天/, '🦅'], [/傘|夜|街/, '🌂'],
    [/老怪|老叟|瞎子/, '🧙'], [/護法|戍|衛/, '🛡️'], [/騎/, '🐴'],
  ];

  function mobGlyph(name) {
    for (const [re, g] of MOB_GLYPH) if (re.test(name)) return g;
    return '👤';
  }

  function mobLook(zoneId, name) {
    if (/僧|寺/.test(name)) return 'temple';
    if (/雪|寒|凍/.test(name)) return 'snow';
    if (/水|潮|船/.test(name)) return 'water';
    return ZONE_LOOK[zoneId] || 'bandit';
  }

  const ENEMY_SPRITES = ['drunk', 'pirate', 'bandit'];
  // 各幀尺寸（已縮半後像素），換算成固定顯示比例，腳底對齊
  const SPRITE_SIZES = {
    drunk: { idle: [268, 338], attack: [267, 319], hurt: [300, 328], down: [360, 284] },
    pirate: { idle: [229, 316], attack: [297, 320], hurt: [235, 316], down: [312, 264] },
    bandit: { idle: [240, 336], attack: [238, 339], hurt: [259, 326], down: [360, 266] },
    hero: { idle: [174, 334], attack: [344, 299], hurt: [230, 340], down: [320, 284] },
  };
  const SPRITE_SCALE = { hero: 0.383, enemy: 0.3 };

  // —— 專屬敵人／名號首領圖：檔名 enemy_<kind>_<idle|attack|hurt|down>.webp，放 assets/combat/sprites/ ——
  // 圖到位（idle 載得到）就自動啟用，沒有的暫用 drunk／pirate／bandit 三隻加色調區別。
  const MOB_KIND = {
    '醉拳混混': 'inn_drunk', '疤面惡犬': 'inn_dog', '碩鼠': 'inn_rat',
    '水盜刀客': 'river_pirate', '河蛟': 'river_croc', '巨鉗蟹': 'river_crab',
    '沙盜頭目': 'desert_chief', '沙蠍': 'desert_scorpion', '禿鷲': 'desert_vulture',
    '竹葉青': 'bamboo_snake', '白衣劍客': 'bamboo_white', '山魈': 'bamboo_ape',
    '岩魔': 'cliff_golem', '崖鷹': 'cliff_eagle', '風聲劍侍': 'cliff_wind',
    '夜行刀客': 'night_blade', '紙紮鬼': 'night_paper', '狐妖': 'night_fox',
    '雪原騎客': 'snow_rider', '雪狼': 'snow_wolf', '冰魄': 'snow_wraith',
    '守殿棍僧': 'temple_monk', '石獅精': 'temple_lion', '遊魂': 'temple_ghost',
    '潮汐劍客': 'mist_tide', '海妖': 'mist_kraken', '霧鮫': 'mist_shark',
    '雲棧護法': 'sky_guard', '雷鳥': 'sky_thunderbird', '雲蛟': 'sky_wyvern',
  };
  const RIVAL_KIND = {
    rival_inn: 'boss_inn', rival_river: 'boss_river', rival_desert: 'boss_desert', rival_bamboo: 'boss_bamboo',
    rival_cliff: 'boss_cliff', rival_night: 'boss_night', rival_snow: 'boss_snow', rival_temple: 'boss_temple',
    rival_mist: 'boss_mist', rival_sky: 'boss_sky',
  };
  const SPRITE_READY = {};
  const KIND_SCALE = {}; // 專屬圖：以待機圖高度定出統一縮放，四幀共用，腳底對齊
  function probeSprites() {
    const kinds = Object.keys(MOB_KIND).map((k) => MOB_KIND[k]).concat(Object.keys(RIVAL_KIND).map((k) => RIVAL_KIND[k]));
    kinds.forEach((kind) => {
      const im = new Image();
      im.onload = () => {
        SPRITE_READY[kind] = true;
        const targetH = /^boss_/.test(kind) ? 122 : 100;
        KIND_SCALE[kind] = Math.min(targetH / Math.max(1, im.naturalHeight), 150 / Math.max(1, im.naturalWidth));
        ['attack', 'hurt', 'down'].forEach((po) => { const p = new Image(); p.src = spriteUrl(kind, po); });
        if (state && !$('screen-game').classList.contains('hidden')) { try { renderStage(); } catch (e) { /* ignore */ } }
      };
      im.src = spriteUrl(kind, 'idle');
    });
  }
  function strHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function spriteUrl(kind, pose) {
    return 'assets/combat/sprites/' + (kind === 'hero' ? 'hero_' : 'enemy_' + kind + '_') + pose + '.webp';
  }
  // 敵人血條貼頭：精靈框固定 120px、圖腳底對齊，血條依實際圖高下移
  function setHpGap(img, h) {
    const slot = img.closest && img.closest('.enemy-slot');
    const bar = slot && slot.querySelector('.hpb');
    if (bar) bar.style.setProperty('--hpdy', Math.max(-40, 120 - h - 4) + 'px');
  }
  function applySprite(img, kind, pose) {
    if (!img) return;
    const sc = kind === 'hero' ? SPRITE_SCALE.hero : SPRITE_SCALE.enemy;
    img.dataset.kind = kind;
    img.dataset.pose = pose;
    img.dataset.sized = '1';
    if (SPRITE_SIZES[kind]) {
      const sz = SPRITE_SIZES[kind][pose] || SPRITE_SIZES[kind].idle;
      img.src = spriteUrl(kind, pose);
      img.style.width = Math.round(sz[0] * sc) + 'px';
      img.style.height = Math.round(sz[1] * sc) + 'px';
      if (kind !== 'hero' && pose === 'idle') setHpGap(img, Math.round(sz[1] * sc));
    } else {
      // 專屬圖：依圖檔實際尺寸換算；缺幀退回該怪待機圖
      img.onerror = () => { img.onerror = null; if (pose !== 'idle') img.src = spriteUrl(kind, 'idle'); };
      img.onload = () => {
        if (img.dataset.kind !== kind) return;
        const k = KIND_SCALE[kind] || sc;
        img.style.maxWidth = 'none';
        img.style.width = Math.round(img.naturalWidth * k) + 'px';
        img.style.height = Math.round(img.naturalHeight * k) + 'px';
        if (kind !== 'hero' && pose === 'idle') setHpGap(img, Math.round(img.naturalHeight * k));
      };
      img.src = spriteUrl(kind, pose);
    }
  }
  // 各敵槽暫時姿勢（受擊／倒地），renderAll 重繪時要保留
  const slotPose = [null, null, null];
  function slotPoseNow(i) {
    const sp = slotPose[i];
    if (sp && Date.now() < sp.until) return sp.pose;
    return null;
  }
  function setSlotPose(i, pose, ms) {
    slotPose[i] = { pose, until: Date.now() + ms };
    const slot = $('enemy-slot-' + i);
    const spr = slot && slot.querySelector('[data-sprite]');
    const kind = spr && spr.dataset.kind;
    if (spr && kind) applySprite(spr, kind, pose);
    setTimeout(() => {
      if (slotPose[i] && Date.now() >= slotPose[i].until) {
        slotPose[i] = null;
        const s2 = slot && slot.querySelector('[data-sprite]');
        if (s2 && s2.dataset.kind && !slot.classList.contains('empty')) applySprite(s2, s2.dataset.kind, 'idle');
      }
    }, ms + 20);
  }
  const ENEMY_SPRITE_BY_LOOK = {
    bandit: ENEMY_SPRITES[2],
    sand: ENEMY_SPRITES[2],
    cliff: ENEMY_SPRITES[2],
    water: ENEMY_SPRITES[1],
    mist: ENEMY_SPRITES[1],
    sky: ENEMY_SPRITES[1],
    night: ENEMY_SPRITES[0],
    bamboo: ENEMY_SPRITES[0],
    snow: ENEMY_SPRITES[0],
    temple: ENEMY_SPRITES[0],
  };

  function hashPick(s) { return strHash(String(s)) % ENEMY_SPRITES.length; }
  function enemySpriteSrc(mob, slotIndex) {
    const name = (mob && mob.name) || '';
    const own = mob && (mob.isRival ? RIVAL_KIND[mob.rivalId] : MOB_KIND[name]);
    if (own && SPRITE_READY[own]) return own;
    if (mob && mob.isRival && !/醉|混|賭/.test(name)) return ENEMY_SPRITES[hashPick(mob.rivalId || name)];
    if (name && MOB_KIND[name]) return ENEMY_SPRITES[hashPick(name)];
    if (/醉|混|賭/.test(name)) return ENEMY_SPRITES[0];
    if (/水|潮|船|碼頭|雨|海賊|浪/.test(name)) return ENEMY_SPRITES[1];
    if (/馬賊|沙|盜|賊|匪|探子|打手/.test(name)) return ENEMY_SPRITES[2];
    const byLook = mob && ENEMY_SPRITE_BY_LOOK[mob.look];
    if (byLook) return byLook;
    return ENEMY_SPRITES[(slotIndex || 0) % ENEMY_SPRITES.length];
  }

  const ZONES = [
    {
      id: 'inn',
      name: '邊城客棧外',
      flavor: '刀光酒氣裡，總有人試新人深淺。',
      minLv: 1,
      mobs: [
        { name: '醉拳混混', hp: 28, atk: 4, def: 1, exp: 6, silver: [3, 7] },
        { name: '疤面惡犬', hp: 34, atk: 5, def: 1, exp: 8, silver: [4, 9] },
        { name: '碩鼠', hp: 32, atk: 5, def: 2, exp: 7, silver: [5, 10] },
      ],
      drops: [
        { id: 'cloth', name: '粗布勁裝', slot: 'armor', def: 1, rare: 0.32 },
        { id: 'wine', name: '燒刀子', type: 'junk', silver: 5, rare: 0.38 },
        { id: 'dice', name: '缺角骰子', type: 'junk', silver: 4, rare: 0.28 },
      ],
    },
    {
      id: 'river',
      name: '煙雨碼頭',
      flavor: '艄公不說話，浪花卻會告密。',
      minLv: 3,
      mobs: [
        { name: '水盜刀客', hp: 55, atk: 8, def: 2, exp: 14, silver: [8, 14] },
        { name: '河蛟', hp: 62, atk: 9, def: 2, exp: 16, silver: [9, 16] },
        { name: '巨鉗蟹', hp: 58, atk: 8, def: 3, exp: 15, silver: [10, 15] },
      ],
      drops: [
        { id: 'boots', name: '軟底快靴', slot: 'boots', spd: 1, rare: 0.28 },
        { id: 'pearl', name: '雨打珠', type: 'junk', silver: 12, rare: 0.24 },
        { id: 'rope', name: '浸水麻繩', type: 'junk', silver: 8, rare: 0.3 },
      ],
    },
    {
      id: 'desert',
      name: '黃沙驛道',
      flavor: '熱風捲旗，俠客與亡命徒共用一口井。',
      minLv: 6,
      mobs: [
        { name: '沙盜頭目', hp: 95, atk: 13, def: 4, exp: 28, silver: [16, 26] },
        { name: '沙蠍', hp: 88, atk: 15, def: 3, exp: 30, silver: [18, 28] },
        { name: '禿鷲', hp: 102, atk: 14, def: 4, exp: 32, silver: [20, 30] },
      ],
      drops: [
        { id: 'scarf', name: '沙紋披風', slot: 'armor', def: 3, atk: 1, rare: 0.22 },
        { id: 'jade', name: '殘缺玉佩', type: 'junk', silver: 22, rare: 0.2 },
        { id: 'sand_blade', name: '黃沙短刃', slot: 'weapon', atk: 3, rare: 0.16 },
      ],
    },
    {
      id: 'bamboo',
      name: '青碧竹海',
      flavor: '竹響三聲，不是風，是人。',
      minLv: 10,
      mobs: [
        { name: '竹葉青', hp: 140, atk: 20, def: 6, exp: 45, silver: [28, 40] },
        { name: '白衣劍客', hp: 155, atk: 22, def: 5, exp: 50, silver: [30, 45] },
        { name: '山魈', hp: 148, atk: 21, def: 7, exp: 48, silver: [32, 42] },
      ],
      drops: [
        { id: 'bamboo_sword', name: '青筠劍', slot: 'weapon', atk: 5, spd: 1, rare: 0.18 },
        { id: 'manual', name: '殘頁劍譜', type: 'junk', chivalry: 2, rare: 0.15 },
        { id: 'bamboo_ring', name: '竹節戒', slot: 'ring', atk: 1, spd: 1, rare: 0.14 },
      ],
    },
    {
      id: 'cliff',
      name: '斷雲絕壁',
      flavor: '崖上有碑，碑上無名，只寫：過客慢行。',
      minLv: 15,
      mobs: [
        { name: '岩魔', hp: 220, atk: 30, def: 9, exp: 75, silver: [45, 65] },
        { name: '崖鷹', hp: 260, atk: 34, def: 10, exp: 90, silver: [55, 80] },
        { name: '風聲劍侍', hp: 240, atk: 32, def: 8, exp: 82, silver: [50, 72] },
      ],
      drops: [
        { id: 'ring', name: '斷雲戒', slot: 'ring', atk: 3, def: 2, rare: 0.12 },
        { id: 'scroll', name: '絕壁殘簡', type: 'junk', chivalry: 5, rare: 0.1 },
        { id: 'cliff_boots', name: '踏雲履', slot: 'boots', spd: 2, def: 1, rare: 0.11 },
      ],
    },
    {
      id: 'nightmarket',
      name: '夜雨長街',
      flavor: '燈火未滅，人影已換。傘下藏刀，傘外賣茶。',
      minLv: 18,
      mobs: [
        { name: '夜行刀客', hp: 300, atk: 40, def: 12, exp: 110, silver: [70, 95] },
        { name: '紙紮鬼', hp: 280, atk: 44, def: 10, exp: 118, silver: [75, 100] },
        { name: '狐妖', hp: 265, atk: 38, def: 11, exp: 105, silver: [65, 90] },
      ],
      drops: [
        { id: 'lantern_cloak', name: '雨巷披氅', slot: 'armor', def: 5, spd: 1, rare: 0.14 },
        { id: 'night_dagger', name: '燈影匕首', slot: 'weapon', atk: 7, spd: 1, rare: 0.12 },
        { id: 'tea_token', name: '半盞茶籌', type: 'junk', silver: 40, rare: 0.22 },
        { id: 'street_note', name: '街巷密箋', type: 'junk', chivalry: 4, rare: 0.12 },
      ],
    },
    {
      id: 'snowpass',
      name: '寒關雪徑',
      flavor: '雪埋舊路，蹄聲猶在。誰先出關，誰先低頭。',
      minLv: 22,
      mobs: [
        { name: '雪原騎客', hp: 380, atk: 52, def: 15, exp: 150, silver: [95, 130] },
        { name: '雪狼', hp: 410, atk: 50, def: 17, exp: 160, silver: [100, 140] },
        { name: '冰魄', hp: 360, atk: 56, def: 13, exp: 155, silver: [98, 135] },
      ],
      drops: [
        { id: 'frost_blade', name: '霜痕長刀', slot: 'weapon', atk: 9, def: 1, rare: 0.11 },
        { id: 'snow_boots', name: '踏雪靴', slot: 'boots', spd: 3, def: 2, rare: 0.12 },
        { id: 'ice_jade', name: '寒玉碎片', type: 'junk', silver: 55, rare: 0.18 },
        { id: 'pass_seal', name: '關隘舊印', type: 'junk', chivalry: 6, rare: 0.1 },
      ],
    },
    {
      id: 'oldtemple',
      name: '殘鐘古寺',
      flavor: '鐘不響，心卻響。香灰未冷，刀劍先涼。',
      minLv: 28,
      mobs: [
        { name: '守殿棍僧', hp: 520, atk: 68, def: 22, exp: 210, silver: [140, 185] },
        { name: '石獅精', hp: 490, atk: 74, def: 18, exp: 220, silver: [145, 195] },
        { name: '遊魂', hp: 540, atk: 70, def: 20, exp: 230, silver: [150, 200] },
      ],
      drops: [
        { id: 'temple_armor', name: '灰袍戎衣', slot: 'armor', def: 8, atk: 2, rare: 0.1 },
        { id: 'bell_ring', name: '殘鐘戒', slot: 'ring', atk: 4, def: 3, rare: 0.09 },
        { id: 'incense', name: '斷香一炷', type: 'junk', silver: 70, rare: 0.16 },
        { id: 'sutra_scrap', name: '經頁殘角', type: 'junk', chivalry: 8, rare: 0.09 },
      ],
    },
    {
      id: 'mistisle',
      name: '霧隱孤嶼',
      flavor: '潮退見礁，霧起見人。島上無路標，只有歸與不歸。',
      minLv: 35,
      mobs: [
        { name: '潮汐劍客', hp: 680, atk: 88, def: 26, exp: 300, silver: [200, 270] },
        { name: '海妖', hp: 650, atk: 94, def: 24, exp: 315, silver: [210, 280] },
        { name: '霧鮫', hp: 720, atk: 90, def: 28, exp: 330, silver: [220, 300] },
      ],
      drops: [
        { id: 'tide_sword', name: '汐聲劍', slot: 'weapon', atk: 12, spd: 2, rare: 0.09 },
        { id: 'mist_cloak', name: '霧隱氅', slot: 'armor', def: 10, spd: 2, rare: 0.08 },
        { id: 'pearl_ring', name: '潮珠戒', slot: 'ring', atk: 5, spd: 2, rare: 0.08 },
        { id: 'isle_map', name: '半張島圖', type: 'junk', silver: 95, rare: 0.14 },
        { id: 'wave_letter', name: '浪邊書簡', type: 'junk', chivalry: 10, rare: 0.08 },
      ],
    },
    {
      id: 'skyridge',
      name: '天脊雲棧',
      flavor: '棧道臨空，一步一雲。上頭有人笑，下頭無回聲。',
      minLv: 42,
      mobs: [
        { name: '雲棧護法', hp: 900, atk: 112, def: 34, exp: 420, silver: [280, 360] },
        { name: '雷鳥', hp: 860, atk: 120, def: 30, exp: 440, silver: [290, 380] },
        { name: '雲蛟', hp: 980, atk: 118, def: 36, exp: 460, silver: [310, 400] },
      ],
      drops: [
        { id: 'sky_boots', name: '雲步履', slot: 'boots', spd: 5, def: 3, rare: 0.08 },
        { id: 'ridge_blade', name: '脊骨刀', slot: 'weapon', atk: 15, def: 2, rare: 0.07 },
        { id: 'cloud_armor', name: '天風甲', slot: 'armor', def: 12, atk: 3, rare: 0.07 },
        { id: 'sky_jade', name: '雲紋玉', type: 'junk', silver: 130, rare: 0.12 },
        { id: 'ridge_note', name: '棧上殘札', type: 'junk', chivalry: 14, rare: 0.07 },
      ],
    },
  ];

  const LORE = [
    {
      title: '開篇',
      body: '中原武林向來多傳聞。有人說劍高一尺，有人說刀快一寸；真正活下來的，多半先學會聽風、看路、少開口。',
    },
    {
      title: '門派閒談',
      body: '蒼山重劍德，天刀重氣勢，無踪樓不求揚名，禪武院只管心定。你選哪條路，江湖都會還你一程風雨。',
    },
    {
      title: '古龍氣',
      body: '有人走路像風，說話像刀。杯酒未涼，勝負已定——這類故事，茶樓說書人最愛講。',
    },
    {
      title: '金庸意',
      body: '家國、師門、情義纏在一塊，打的不只是招式。掛機打怪只管熟手勁；俠客二字，還得自己認。',
    },
    {
      title: '夜雨長街',
      body: '長街上賣茶的未必賣茶，撐傘的未必怕雨。過客若聽得見傘骨輕響，便該換條巷子走。',
    },
    {
      title: '寒關舊事',
      body: '出關的人多，回關的人少。雪會蓋住蹄印，卻蓋不住刀痕——關吏說，那是給後來人看的路標。',
    },
    {
      title: '古寺鐘聲',
      body: '鐘碎了，僧還在。有人來求佛，有人來求刀；佛不答，刀倒常答。香火錢與兵器錢，原是同一櫃。',
    },
    {
      title: '孤嶼與雲棧',
      body: '島外是霧，棧上是雲。兩處都像沒路，卻都有人住——住得久了，便分不清自己是過客還是看守。',
    },
  ];

  const ZONE_RIVALS = {
    inn: {
      id: 'rival_inn',
      name: '「醉裡抽刀」馬三刀',
      desc: '酒氣紅臉、斷刀背肩',
      mult: { hp: 2.4, atk: 1.55, def: 1.35, exp: 2.8, silver: 2.2 },
      bestDrop: { id: 'broken_inn_blade', name: '斷刃客棧刀', slot: 'weapon', atk: 5, spd: 1, rare: 0.72, bossWeapon: true, affix: { k: 'atk', v: 6 } },
      loreId: 'rival_inn',
      loreTitle: '客棧後院的交易',
      loreBody: '後院燈火未熄，銀兩與刀鞘同時換手。有人說那不是買賣，是約——約好了誰先出聲，誰就先死。',
      glyph: '🍺',
    },
    river: {
      id: 'rival_river',
      name: '「濕衣不乾」柳七',
      desc: '蓑衣遮臉、袖藏短刺',
      mult: { hp: 2.3, atk: 1.6, def: 1.3, exp: 2.7, silver: 2.1 },
      bestDrop: { id: 'liu_short_spike', name: '濕衣短刺', slot: 'weapon', atk: 5, spd: 2, rare: 0.7, bossWeapon: true, affix: { k: 'spd', v: 4 } },
      loreId: 'rival_river',
      loreTitle: '雨夜運過什麼貨',
      loreBody: '雨大得像幕，船卻偏偏不泊碼頭。艙裡響過一聲輕咔，像鎖，又像牙——第二天潮退，岸上只剩半截濕繩。',
      glyph: '🌧️',
    },
    desert: {
      id: 'rival_desert',
      name: '「駝鈴聲斷」沙滿倉',
      desc: '黃巾裹頭、駝鈴腰墜',
      mult: { hp: 2.35, atk: 1.58, def: 1.4, exp: 2.75, silver: 2.15 },
      bestDrop: { id: 'sandstorm_scimitar', name: '狂沙彎刀', slot: 'weapon', atk: 5, def: 1, rare: 0.68, bossWeapon: true, affix: { k: 'silver', v: 8 } },
      loreId: 'rival_desert',
      loreTitle: '驛道失蹤的鏢車',
      loreBody: '駝鈴忽然齊啞，沙丘換了一個形狀。鏢旗還在，車轍沒有；有人說貨進了風裡，有人說風進了貨裡。',
      glyph: '🐪',
    },
    bamboo: {
      id: 'rival_bamboo',
      name: '「一葉蔽目」青娘',
      desc: '白衣青帶、竹葉半臉',
      mult: { hp: 2.25, atk: 1.65, def: 1.25, exp: 2.8, silver: 2.1 },
      bestDrop: { id: 'bamboo_slim_sword', name: '竹海細劍', slot: 'weapon', atk: 6, spd: 2, rare: 0.65, bossWeapon: true, affix: { k: 'atk', v: 8 } },
      loreId: 'rival_bamboo',
      loreTitle: '竹海裡誰在練刀',
      loreBody: '竹響三聲後還有第四聲，更輕，更準。葉落處不見人影，只見一道青痕貼地而過，像有人把風也練進刀裡。',
      glyph: '🍃',
    },
    cliff: {
      id: 'rival_cliff',
      name: '「崖邊無影」無名',
      desc: '灰袍無徽、腳步無聲',
      mult: { hp: 2.5, atk: 1.6, def: 1.45, exp: 2.9, silver: 2.3 },
      bestDrop: { id: 'cliff_rope_hook', name: '斷雲鉤鐮', slot: 'weapon', atk: 6, spd: 3, rare: 0.62, bossWeapon: true, affix: { k: 'spd', v: 5 } },
      loreId: 'rival_cliff',
      loreTitle: '絕壁上的舊盟約',
      loreBody: '碑陰另有一行小字，被風雨啃得只剩半句。有人對過誓言，有人對過刀；到後來，誓言與刀都成了風聲。',
      glyph: '🌑',
    },
    nightmarket: {
      id: 'rival_night',
      name: '「傘下無聲」阿雨',
      desc: '黑傘半開、靴底無泥',
      mult: { hp: 2.3, atk: 1.7, def: 1.3, exp: 2.85, silver: 2.2 },
      bestDrop: { id: 'umbrella_bone_spike', name: '夜雨傘骨刺', slot: 'weapon', atk: 9, spd: 3, rare: 0.6, bossWeapon: true, affix: { k: 'drop', v: 8 } },
      loreId: 'rival_night',
      loreTitle: '長街第三盞燈',
      loreBody: '前兩盞照路，第三盞照人。燈油將盡時，傘骨會輕輕一顫——懂的人換巷，不懂的人換命。',
      glyph: '🌂',
    },
    snowpass: {
      id: 'rival_snow',
      name: '「白刃不凍」關北',
      desc: '鐵盔結霜、刀上無雪',
      mult: { hp: 2.4, atk: 1.62, def: 1.5, exp: 2.9, silver: 2.25 },
      bestDrop: { id: 'frost_pass_blade', name: '寒關戍刀', slot: 'weapon', atk: 11, def: 2, rare: 0.58, bossWeapon: true, affix: { k: 'atk', v: 10 } },
      loreId: 'rival_snow',
      loreTitle: '誰守過這道關',
      loreBody: '名冊上最後一個名字被雪蓋住。關吏換過三任，刀卻還是那把——刃上不掛雪的人，心裡未必不掛事。',
      glyph: '⚔️',
    },
    oldtemple: {
      id: 'rival_temple',
      name: '「鐘響無人」空戒',
      desc: '破袈裟、棍纏舊鈴',
      mult: { hp: 2.45, atk: 1.58, def: 1.55, exp: 3.0, silver: 2.3 },
      bestDrop: { id: 'broken_bell_staff', name: '殘鐘禪杖', slot: 'weapon', atk: 11, def: 3, rare: 0.55, bossWeapon: true, affix: { k: 'def', v: 10 } },
      loreId: 'rival_temple',
      loreTitle: '古寺半夜為什麼響鐘',
      loreBody: '鐘樓無人，鐘繩卻動。有的僧說是風，有的僧說是債；債若會走路，多半穿破袈裟。',
      glyph: '🔔',
    },
    mistisle: {
      id: 'rival_mist',
      name: '「潮來即走」島主阿嵐',
      desc: '斗笠遮眼、袖有鹽花',
      mult: { hp: 2.4, atk: 1.68, def: 1.4, exp: 3.0, silver: 2.35 },
      bestDrop: { id: 'isle_tide_blade', name: '孤嶼潮刃', slot: 'weapon', atk: 15, spd: 3, rare: 0.52, bossWeapon: true, affix: { k: 'exp', v: 10 } },
      loreId: 'rival_mist',
      loreTitle: '霧裡那艘不靠岸的船',
      loreBody: '船影在霧裡停了很久，始終不落錨。岸上有人招手，船上有人搖頭——潮一漲，雙方都成了傳聞。',
      glyph: '⛵',
    },
    skyridge: {
      id: 'rival_sky',
      name: '「雲上獨行」老叟',
      desc: '白鬚、杖當劍',
      mult: { hp: 2.55, atk: 1.72, def: 1.5, exp: 3.2, silver: 2.5 },
      bestDrop: { id: 'skywind_sword', name: '天風長劍', slot: 'weapon', atk: 19, def: 2, spd: 3, rare: 0.5, bossWeapon: true, affix: { k: 'atk', v: 12 } },
      loreId: 'rival_sky',
      loreTitle: '雲棧盡頭有沒有路',
      loreBody: '棧盡處雲厚如牆。有人退了，有人笑著進去；出來的人少，帶話回來的更少——只說：路在腳下，也在回頭。',
      glyph: '🧙',
    },
  };


  const TITLE_POOL = [
    '邊城過客', '雨巷聽聲', '沙上留名', '竹海一葉', '崖邊無名',
    '傘下行人', '關外白刃', '鐘前立者', '霧中來客', '雲棧行腳',
  ];

  const CHIVALRY_COST = { title: 80, lore: 50, soften: 30 };

  const TEAHOUSE_EVENTS = [
    {
      id: 'T01',
      theme: '多聽江湖謠',
      left: { label: '聽', text: '謠傳入耳，俠義微增；下一場掉落也略豐。', buff: { kind: 'chivalry', flat: 5, drop: 0.05, fights: 1 } },
      right: { label: '不聽', text: '耳根清淨，過耳不留。', buff: {} },
    },
    {
      id: 'T02',
      theme: '烈酒',
      left: { label: '接', text: '酒勁上湧，出手更狠，也更疏忽。', buff: { kind: 'atk', pct: 0.08, fights: 2, vuln: 0.05 } },
      right: { label: '拒', text: '留半分清醒，明日再說。', buff: {} },
    },
    {
      id: 'T03',
      theme: '口信',
      left: { label: '帶', text: '成人之美，銀兩與俠義都有著落。', buff: { kind: 'chivalry', flat: 3, silver: 12 } },
      right: { label: '不帶', text: '少惹是非，袖手旁觀。', buff: {} },
    },
    {
      id: 'T04',
      theme: '盯梢',
      left: { label: '換座', text: '換了位子，接下來幾場遇敵略稀。', buff: { kind: 'encounter', pct: -0.1, fights: 3 } },
      right: { label: '不理', text: '由他盯去，你自喝茶。', buff: {} },
    },
    {
      id: 'T05',
      theme: '水路',
      left: { label: '會一點', text: '水路熟些，今日本區銀兩略豐。', buff: { kind: 'zoneSilver', pct: 0.1, hours: 24 } },
      right: { label: '不會', text: '陸路也走得通。', buff: {} },
    },
    {
      id: 'T06',
      theme: '口角',
      left: { label: '勸和', text: '一場口角平息，俠義＋8。', buff: { kind: 'chivalry', flat: 8 } },
      right: { label: '走開', text: '事不關己，喝茶去。', buff: {} },
    },
    {
      id: 'T07',
      theme: '傷藥',
      left: { label: '收', text: '藥味苦，下一場疼得輕些。', buff: { kind: 'soften', pct: 0.15, fights: 1 } },
      right: { label: '婉拒', text: '不破財，也不依賴藥。', buff: {} },
    },
    {
      id: 'T08',
      theme: '說書收尾',
      left: { label: '補', text: '你補了一句收尾——說書人笑了。', buff: { kind: 'flavor', line: '說書人補白：刀未出鞘，勝負已在茶香裡。' } },
      right: { label: '搖頭', text: '故事到此為止也好。', buff: {} },
    },
    {
      id: 'T09',
      theme: '借傘',
      left: { label: '借', text: '傘去人留情，俠義＋5。', buff: { kind: 'chivalry', flat: 5 } },
      right: { label: '不借', text: '雨大，自己也要用。', buff: {} },
    },
    {
      id: 'T10',
      theme: '賭坊',
      left: { label: '勸收手', text: '勸人收手，俠義＋6。', buff: { kind: 'chivalry', flat: 6 } },
      right: { label: '裝沒看見', text: '骰聲自去，你喝茶自醉。', buff: {} },
    },
    {
      id: 'T11',
      theme: '避刀符',
      left: { label: '買', text: '符紙灼手，接下來幾場受創略減。', buff: { kind: 'soften', pct: 0.05, fights: 5, silver: -18 } },
      right: { label: '不買', text: '全靠自己，不信這個。', buff: {} },
    },
    {
      id: 'T12',
      theme: '往北或往南',
      left: { label: '指北', text: '往北的人多問名號——一時之間，本區名號更易遇上。', buff: { kind: 'rivalChance', pct: 0.01, hours: 1 } },
      right: { label: '指南', text: '往南亦然；路標一指，機緣相同。', buff: { kind: 'rivalChance', pct: 0.01, hours: 1 } },
    },
  ];




  let state = null;
  let huntTimer = null;
  let selectedSchool = SCHOOLS[0].id;
  let selectedLook = 'a';
  let selectedWeapon = WEAPONS[0].id;

  const $ = (id) => document.getElementById(id);

  /** 微調：中後期略快於舊版，早期接近，舊存檔仍可用 */
  function expToNext(lv) {
    return Math.floor(36 + lv * lv * 16 + lv * 10);
  }

  const REALMS = [
    [1, '初窺門徑'], [10, '後天境'], [20, '先天境'], [30, '宗師境'], [40, '大宗師'], [50, '武林名宿'],
  ];
  const BREAKTHROUGH_TEXT = {
    10: '氣走小周天，出手總算有了章法。',
    20: '一招一式不再靠蠻力，旁人開始記住你的名字。',
    30: '刀劍入手如臂使指，這一關，多少人卡了十年。',
    40: '心靜，招自然。你已不看對手，只聽風聲。',
    50: '天地一線開。從今天起，你有了壓箱底的一招。',
  };
  /** 境界：每境界十級內分 初成（前3）／小成（中4）／圓滿（後3）；Lv.1~9 與 Lv.50 以上固定名稱 */
  function realmName(lv) {
    let idx = 0;
    for (let i = 0; i < REALMS.length; i++) if (lv >= REALMS[i][0]) idx = i;
    const name = REALMS[idx][1];
    if (idx === 0 || idx === REALMS.length - 1) return name;
    const into = lv - REALMS[idx][0];
    return name + '・' + (into < 3 ? '初成' : into < 7 ? '小成' : '圓滿');
  }

  function rand(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function dayKey(ts) {
    const d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function pushEventLog(msg, kind) {
    if (!state) return;
    state.eventLog.unshift({ t: Date.now(), msg, kind: kind || 'event' });
    state.eventLog = state.eventLog.slice(0, 60);
  }

  function refreshRivalDay() {
    const k = dayKey();
    if (state.rivalDayKey !== k) {
      state.rivalDayKey = k;
      state.rivalDaily = {};
    }
  }

  function refreshTeaDay() {
    const k = dayKey();
    if (state.teaDayKey !== k) {
      state.teaDayKey = k;
      state.teaDailyCount = 0;
    }
  }

  function rivalDailyUsed(zoneId) {
    refreshRivalDay();
    return state.rivalDaily[zoneId] || 0;
  }

  function canSpawnRival(zoneId, now) {
    refreshRivalDay();
    if ((state.rivalDaily[zoneId] || 0) >= 1) return false;
    const until = state.rivalCooldownUntil[zoneId] || 0;
    if (now < until) return false;
    return true;
  }

  function rivalCooldownLeft(zoneId, now) {
    const until = state.rivalCooldownUntil[zoneId] || 0;
    return Math.max(0, until - now);
  }

  function formatDuration(ms) {
    if (ms <= 0) return '可遇';
    const m = Math.ceil(ms / 60000);
    if (m >= 60) return Math.ceil(m / 60) + '時後';
    return m + '分後';
  }

  let modalOpen = false;

  function applyCombatBuff(buff) {
    if (!buff) return;
    // 軟化類與茶樓 soften 不疊加，取較新
    if (buff.kind === 'soften') {
      state.softenPct = buff.pct || 0.1;
      state.softenLeft = buff.fights || 8;
      state.combatBuff = {
        kind: 'soften',
        at: Date.now(),
        remaining: state.softenLeft,
        pct: state.softenPct,
        label: '受創減免',
      };
      return;
    }
    const fights = buff.fights || 0;
    state.combatBuff = {
      kind: buff.kind,
      at: Date.now(),
      remaining: fights,
      pct: buff.pct || 0,
      flat: buff.flat || 0,
      vuln: buff.vuln || 0,
      spd: buff.spd || 0,
      label: buff.label || buff.kind,
    };
  }

  function consumeFightBuff() {
    if (state.softenLeft > 0) {
      state.softenLeft -= 1;
      if (state.combatBuff && state.combatBuff.kind === 'soften') {
        state.combatBuff.remaining = state.softenLeft;
        if (state.softenLeft <= 0) {
          state.softenPct = 0;
          state.combatBuff = null;
        }
      }
    } else if (state.combatBuff && state.combatBuff.kind !== 'soften') {
      if (typeof state.combatBuff.remaining === 'number') {
        state.combatBuff.remaining -= 1;
        if (state.combatBuff.remaining <= 0) state.combatBuff = null;
      }
    }
  }

  function martialDynamic(s) {
    const fx = martialFx(state);
    const now = Date.now();
    let am = 1;
    if (fx.opening && state.fightStartAt && now - state.fightStartAt < 3000) am += fx.opening;
    if (fx.storm && now < (state.stormUntil || 0)) am += 0.03 * Math.min(fx.storm, state.stormStacks || 0);
    if (fx.killStack) am += 0.05 * Math.min(fx.killStack, state.killStacks || 0);
    s.atk = Math.floor(s.atk * am);
    if (fx.ningDef && now < (state.defBuffUntil || 0)) s.def = Math.floor(s.def * (1 + fx.ningDef));
    return s;
  }
  function buffedStats(base) {
    const s = martialDynamic({ ...base });
    const b = state.combatBuff;
    if (!b || b.kind === 'soften') return s;
    if (b.kind === 'atk') s.atk = Math.floor(s.atk * (1 + (b.pct || 0)));
    if (b.kind === 'def') s.def = Math.floor(s.def * (1 + (b.pct || 0)));
    if (b.kind === 'spd') s.spd = Math.floor(s.spd * (1 + (b.pct || 0)));
    if (b.spd) s.spd = Math.floor(s.spd * (1 + b.spd));
    return s;
  }

  // ===== 生命／內力 =====
  const EXHAUST_MS = 3000;
  function heroMaxHp(h) {
    const st = calcStats(h);
    const mf = martialFx(h);
    return Math.max(50, Math.floor((60 + h.lv * 15 + st.def * 3) * (1 + (mf.hpPct || 0))));
  }
  function heroMaxMp(h) { return 60 + h.lv * 3; }
  function mpCost(sk) {
    const pct = sk && sk.kind === 'ult' ? 0.15 : sk && sk.kind === 'buff' ? 0.04 : 0.06;
    return Math.ceil(heroMaxMp(state) * pct);
  }
  function ensureVitals() {
    if (!state) return;
    const mh = heroMaxHp(state);
    const mm = heroMaxMp(state);
    if (typeof state.hp !== 'number' || isNaN(state.hp)) state.hp = mh;
    if (typeof state.mp !== 'number' || isNaN(state.mp)) state.mp = mm;
    state.hp = Math.min(mh, Math.max(0, state.hp));
    state.mp = Math.min(mm, Math.max(0, state.mp));
    if (typeof state.exhaustUntil !== 'number') state.exhaustUntil = 0;
    if (typeof state.lastHurtAt !== 'number') state.lastHurtAt = 0;
  }
  function isExhausted() { return !!state && (state.exhaustUntil || 0) > Date.now(); }
  function healHero(n, quiet) {
    if (!state || n <= 0) return;
    ensureVitals();
    const mh = heroMaxHp(state);
    const before = state.hp;
    state.hp = Math.min(mh, state.hp + n);
    const got = Math.round(state.hp - before);
    if (got > 0 && !quiet) spawnFloat('+' + got, 'heal');
  }
  function heroHurt(dmg) {
    ensureVitals();
    state.hp -= dmg;
    state.lastHurtAt = Date.now();
    if (state.hp <= 0) {
      state.hp = 0;
      state.exhaustUntil = Date.now() + EXHAUST_MS;
      state.mobs = [];
      state.mob = null;
      state.skillSoftLeft = 0;
      state.goldBodyUntil = 0;
      pushLog('你力竭倒地，調息 3 秒後起身（不損失任何東西）。', 'rival');
      addRumor('exhaust');
      stOnLose();
      setHeroPose('hurt', EXHAUST_MS);
      renderStage();
    }
    renderHeroStatus();
  }
  function vitalsTick() {
    if (!state || $('screen-game').classList.contains('hidden')) return;
    ensureVitals();
    const now = Date.now();
    const dt = Math.min(1, (now - (state._vt || now)) / 1000);
    state._vt = now;
    if (state.exhaustUntil) {
      if (now >= state.exhaustUntil) {
        state.exhaustUntil = 0;
        achStats().standUps += 1;
        state.hp = Math.floor(heroMaxHp(state) / 2);
        pushLog('調息完畢，回復半血，繼續上路。', 'win');
        setHeroPose('idle', 10);
        renderStage();
      }
    } else {
      const fx = martialFx(state);
      let rate = now - state.lastHurtAt > 3000 ? 0.01 : 0;
      if (state.hunting) rate += fx.regenCombat || 0;
      if (rate > 0) state.hp = Math.min(heroMaxHp(state), state.hp + heroMaxHp(state) * rate * dt);
      const mm = heroMaxMp(state);
      state.mp = Math.min(mm, state.mp + mm * (state.hunting ? 0.04 : 0.08) * dt);
    }
    renderHeroStatus();
  }

  function incomingDmgFactor() {
    let f = 1;
    if (state.softenLeft > 0 && state.softenPct > 0) f *= 1 - state.softenPct;
    const b = state.combatBuff;
    if (b && b.vuln) f *= 1 + b.vuln;
    const fx = martialFx(state);
    if (fx.takenMul) f *= Math.max(0.3, 1 + fx.takenMul);
    if (Date.now() < (state.goldBodyUntil || 0)) f *= 0.5;
    return f;
  }


  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function calcStats(hero) {
    const school = SCHOOLS.find((s) => s.id === hero.school) || SCHOOLS[0];
    const weapon = WEAPONS.find((w) => w.id === hero.weaponPath) || WEAPONS[0];
    let atk = 8 + hero.lv * 2 + (school.atk || 0) + (weapon.atk || 0);
    let def = 3 + hero.lv + (school.def || 0) + (weapon.def || 0);
    let spd = 5 + Math.floor(hero.lv / 2) + (school.spd || 0) + (weapon.spd || 0);
    for (const it of Object.values(hero.equip || {})) {
      if (!it) continue;
      atk += itemBase(it, 'atk');
      def += itemBase(it, 'def');
      spd += itemBase(it, 'spd');
    }
    const gp = gearPct(hero);
    const mf = martialFx(hero);
    atk = Math.floor(atk * (1 + gp.atk / 100));
    def = Math.floor(def * (1 + gp.def / 100 + (mf.defPct || 0)));
    spd = Math.floor(spd * (1 + gp.spd / 100 + (mf.spdPct || 0)));
    return { atk, def, spd };
  }

  function defaultHero(name, school, weaponPath, look) {
    return {
      name,
      school,
      weaponPath,
      look: look || 'a',
      lv: 1,
      exp: 0,
      silver: 20,
      chivalry: 0,
      chivalrySpent: 0,
      zoneId: 'inn',
      hunting: false,
      bag: [],
      equip: { weapon: null, armor: null, boots: null, ring: null },
      kills: 0,
      zoneKills: {},
      mobs: [],
      log: [],
      eventLog: [],
      zoneBossFlags: {},
      zoneChallengeAt: {},
      forceRival: false,
      unlockedLore: {},
      rivalCooldownUntil: {},
      rivalDaily: {},
      rivalDayKey: '',
      titlesOwned: [],
      activeTitle: '',
      titleOffer: [],
      softenLeft: 0,
      softenPct: 0,
      combatBuff: null,
      dropBonusPct: 0,
      dropBonusLeft: 0,
      encounterReducePct: 0,
      encounterReduceLeft: 0,
      zoneSilverBonus: null,
      rivalChanceBonus: null,
      teaDayKey: '',
      teaDailyCount: 0,
      teaCooldownUntil: 0,
      eventLogSeen: 0,
      settings: { muted: false, bgmVol: 0.28, sfxVol: 0.55, autoSell: 'fan', bulkSell: 'fan' },
      skillCd: [0, 0, 0, 0, 0],
      nextAtkBonus: 0,
      skillSoftLeft: 0,
      story: stNorm({}),
    };
  }

  function save() {
    if (!state) return;
    state.lastSeen = Date.now();
    state.wasHunting = !!state.hunting;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function pushLog(msg, cls) {
    if (!state) return;
    state.log.unshift({ t: Date.now(), msg, cls: cls || '' });
    state.log = state.log.slice(0, 40);
    renderLog();
  }

  function renderLog() {
    const el = $('combat-log');
    if (!el || !state) return;
    el.innerHTML = state.log
      .slice(0, 4)
      .map((x) => `<div class="${x.cls || ''}">${escapeHtml(x.msg)}</div>`)
      .join('');
  }

  function currentZone() {
    return ZONES.find((z) => z.id === state.zoneId) || ZONES[0];
  }

  function schoolShort(schoolId) {
    return SCHOOL_SHORT[schoolId] || '江湖';
  }

  function aliveMobs() {
    if (!state || !Array.isArray(state.mobs)) return [];
    return state.mobs.filter((m) => m && m.hp > 0);
  }

  function getPrimaryMob() {
    const alive = aliveMobs();
    return alive.length ? alive[0] : null;
  }

  function syncPrimaryMob() {
    if (!state) return null;
    state.mob = getPrimaryMob();
    return state.mob;
  }

  function getZoneKillCount() {
    if (!state) return 0;
    if (!state.zoneKills || typeof state.zoneKills !== 'object') state.zoneKills = {};
    return state.zoneKills[state.zoneId] || 0;
  }

  function bumpZoneKill() {
    if (!state) return;
    if (!state.zoneKills || typeof state.zoneKills !== 'object') state.zoneKills = {};
    const z = state.zoneId;
    state.zoneKills[z] = (state.zoneKills[z] || 0) + 1;
  }

  function buildMobFromBase(base, scale, extras) {
    extras = extras || {};
    const hp = Math.floor((base.hp || 30) * scale * (extras.hpMult || 1));
    return {
      uid: 'm' + Date.now().toString(36) + Math.random().toString(16).slice(2, 6),
      name: extras.name || base.name,
      maxHp: hp,
      hp,
      atk: Math.floor((base.atk || 4) * scale * (extras.atkMult || 1)),
      def: Math.floor((base.def || 1) * (extras.defMult || 1)),
      exp: Math.floor((base.exp || 6) * scale * (extras.expMult || 1)),
      silver: extras.silver || base.silver || [1, 3],
      glyph: extras.glyph || mobGlyph(extras.name || base.name),
      look: extras.look || mobLook(extras.zoneId || state.zoneId, extras.name || base.name),
      isRival: !!extras.isRival,
      rivalId: extras.rivalId || null,
      zoneId: extras.zoneId || state.zoneId,
      desc: extras.desc || '',
      bestDrop: extras.bestDrop || null,
      loreId: extras.loreId || null,
    };
  }

  function ensureMob() {
    ensureMobs();
  }

  // 依地圖挑 BGM：地圖閒逛各區不同，名號戰兩首輪替
  const ZONE_WORLD_BGM = {
    inn: 'world', river: 'calm', desert: 'road', bamboo: 'calm', cliff: 'road',
    nightmarket: 'world', snowpass: 'road', oldtemple: 'calm', mistisle: 'calm', skyridge: 'peak',
  };
  const ZONE_BATTLE_BGM = {
    inn: 'battle', river: 'battle2', desert: 'battle', bamboo: 'battle2', cliff: 'battle',
    nightmarket: 'battle2', snowpass: 'battle', oldtemple: 'battle2', mistisle: 'battle', skyridge: 'battle2',
  };
  function worldBgm(zid) { return ZONE_WORLD_BGM[zid || (state && state.zoneId)] || 'world'; }
  function battleBgm(zid) { return ZONE_BATTLE_BGM[zid || (state && state.zoneId)] || 'battle'; }

  function ensureMobs() {
    if (!state) return;
    if (!Array.isArray(state.mobs)) state.mobs = [];
    if (aliveMobs().length) {
      syncPrimaryMob();
      return;
    }
    if (stBattleOn() && stSpawnBattleMobs()) return;
    const zone = currentZone();
    const scale = 1 + Math.max(0, state.lv - zone.minLv) * 0.05;
    const now = Date.now();
    // 茶樓「換座」：接下來幾次生成有機率空過（遇敵略稀）
    if (state.encounterReduceLeft > 0) {
      const pct = state.encounterReducePct || 0.1;
      state.encounterReduceLeft -= 1;
      if (state.encounterReduceLeft <= 0) state.encounterReducePct = 0;
      if (Math.random() < pct) {
        state.mobs = [];
        state.mob = null;
        pushLog('這一路安靜，暫未遇敵。', 'event');
        return;
      }
    }
    const rival = ZONE_RIVALS[zone.id];
    let spawnRival = false;
    if (rival && (DEBUG_BOSS || state.forceRival)) {
      state.forceRival = false;
      spawnRival = true;
    } else if (rival && canSpawnRival(zone.id, now)) {
      let chance = 0.03 + Math.random() * 0.02; // 3%～5%
      const rcb = state.rivalChanceBonus;
      if (rcb && rcb.zoneId === state.zoneId && now < (rcb.until || 0)) {
        chance += rcb.pct || 0.01;
      } else if (rcb && now >= (rcb.until || 0)) {
        state.rivalChanceBonus = null;
      }
      if (Math.random() < chance) spawnRival = true;
    }
    if (spawnRival && rival) {
      const avg = zone.mobs.reduce(
        (a, m) => ({
          hp: a.hp + m.hp,
          atk: a.atk + m.atk,
          def: a.def + m.def,
          exp: a.exp + m.exp,
          s0: a.s0 + m.silver[0],
          s1: a.s1 + m.silver[1],
        }),
        { hp: 0, atk: 0, def: 0, exp: 0, s0: 0, s1: 0 }
      );
      const n = zone.mobs.length;
      const m = rival.mult;
      const fakeBase = {
        name: rival.name,
        hp: avg.hp / n,
        atk: avg.atk / n,
        def: avg.def / n,
        exp: avg.exp / n,
        silver: [Math.floor((avg.s0 / n) * m.silver), Math.floor((avg.s1 / n) * m.silver)],
      };
      const boss = buildMobFromBase(fakeBase, scale, {
        name: rival.name,
        hpMult: m.hp,
        atkMult: m.atk,
        defMult: m.def,
        expMult: m.exp,
        silver: fakeBase.silver,
        glyph: rival.glyph || mobGlyph(rival.name),
        look: mobLook(zone.id, rival.name),
        isRival: true,
        rivalId: rival.id,
        zoneId: zone.id,
        desc: rival.desc,
        bestDrop: rival.bestDrop,
        loreId: rival.loreId,
      });
      state.mobs = [boss];
      syncPrimaryMob();
      pushLog('【名號】遇上「' + rival.name + '」！', 'rival');
      pushEventLog('遭遇名號對手「' + rival.name + '」於「' + zone.name + '」', 'rival');
      if (Audio()) {
        Audio().sfx('rival');
        Audio().playBgm(battleBgm(zone.id));
      }
      return;
    }
    // 掛機一般遇敵：1～3 隻（權重偏 1～2）
    const roll = Math.random();
    const count = roll < 0.55 ? 1 : roll < 0.88 ? 2 : 3;
    const pack = [];
    for (let i = 0; i < count; i++) {
      const base = pick(zone.mobs);
      // 多怪時略降單隻血量，避免碾壓
      const packScale = count === 1 ? 1 : count === 2 ? 0.85 : 0.72;
      pack.push(
        buildMobFromBase(base, scale * packScale, {
          zoneId: zone.id,
        })
      );
    }
    state.mobs = pack;
    syncPrimaryMob();
  }

  function gainExp(n) {
    state.exp += n;
    let ups = 0;
    const fromLv = state.lv;
    while (state.exp >= expToNext(state.lv)) {
      state.exp -= expToNext(state.lv);
      state.lv += 1;
      ups += 1;
    }
    if (ups) {
      pushLog(`升級！目前 Lv.${state.lv}`, 'win');
      state.hp = heroMaxHp(state);
      state.mp = heroMaxMp(state);
      if (Audio()) Audio().sfx('levelup');
      openLevelUpModal(fromLv, state.lv);
    }
    return ups;
  }

  function grantDropItem(d, tag, opts) {
    opts = opts || {};
    const fromRival = !!opts.fromRival || tag === '名號最佳掉落';
    const q = rollQuality(d.rare, { fromRival: fromRival });
    const qm = qualityMeta(q);

    if (d.type === 'junk') {
      if (d.silver) {
        const sil = junkSilverWithQuality(d.silver, q);
        state.silver += sil;
        pushLog('撿到「' + d.name + '」（' + qm.label + '），換得銀兩 ' + sil, 'loot ' + qm.cls);
        if (Audio()) Audio().sfx('drop');
      }
      if (d.chivalry) {
        state.chivalry += d.chivalry;
        pushLog('悟得「' + d.name + '」（' + qm.label + '），俠義 +' + d.chivalry, 'loot ' + qm.cls);
        if (Audio()) Audio().sfx('drop');
      }
      return null;
    }

    const item = {
      uid: d.id + '-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6),
      id: d.id,
      name: d.name,
      slot: d.slot,
      atk: d.atk || 0,
      def: d.def || 0,
      spd: d.spd || 0,
      quality: q,
      keep: fromRival,
      fromRival: fromRival,
      enh: 0,
      affixes: d.affix ? [{ k: d.affix.k, v: d.affix.v }] : rollAffixes(q),
      bossWeapon: !!d.bossWeapon,
    };

    if (q === 'zhen') { achStats().gotZhen += 1; addRumor('zhen'); }
    if (q === 'jue') { achStats().gotJue += 1; addRumor('jue'); addRumor('zhen'); }
    if (shouldAutoSell(item)) {
      const price = qualitySellPrice(item);
      state.silver += price;
      pushLog('自動售出「' + item.name + '」（' + qm.label + '）＋' + price + ' 銀', 'loot ' + qm.cls);
      if (Audio()) Audio().sfx('drop');
      return null;
    }

    state.bag.push(item);
    pushLog((tag || '掉落') + '「' + item.name + '」（' + qm.label + '）', 'loot ' + qm.cls);
    if (Audio()) Audio().sfx('drop');
    const bits = [];
    if (item.atk) bits.push('攻+' + item.atk);
    if (item.def) bits.push('防+' + item.def);
    if (item.spd) bits.push('速+' + item.spd);
    if (item.affixes && item.affixes.length) bits.push(affixText(item));
    bits.unshift(qm.label);
    return {
      name: item.name,
      icon: '⚔️',
      meta: (tag || '裝備') + (bits.length ? ' · ' + bits.join(' ') : ''),
      quality: q,
    };
  }

  function tryDrop(fromRival) {
    const got = [];
    if (fromRival && state._lastRivalDrop) {
      const d = state._lastRivalDrop;
      if (Math.random() < (d.rare == null ? 0.7 : d.rare)) {
        const loot = grantDropItem(d, '名號最佳掉落', { fromRival: true });
        if (loot) got.push(loot);
        state._lastRivalDrop = null;
        return got;
      }
      state._lastRivalDrop = null;
    }
    const zone = currentZone();
    let dropBonus = 0;
    if (state.dropBonusLeft > 0 && state.dropBonusPct) {
      dropBonus = state.dropBonusPct;
      state.dropBonusLeft -= 1;
      if (state.dropBonusLeft <= 0) state.dropBonusPct = 0;
    }
    dropBonus += gearPct(state).drop / 100;
    for (const d of zone.drops) {
      const rare = Math.min(0.95, (d.rare || 0) + dropBonus);
      if (Math.random() > rare) continue;
      const loot = grantDropItem(d, '掉落');
      if (loot) got.push(loot);
      return got;
    }
    return got;
  }

  function onRivalDefeated(mob) {
    const zid = mob.zoneId || state.zoneId;
    const rival = ZONE_RIVALS[zid];
    const firstClear = !state.zoneBossFlags[zid];
    state.zoneBossFlags[zid] = true;
    refreshRivalDay();
    state.rivalDaily[zid] = (state.rivalDaily[zid] || 0) + 1;
    state.rivalCooldownUntil[zid] = Date.now() + 4 * 60 * 60 * 1000;
    if (rival) {
      state._lastRivalDrop = firstClear ? Object.assign({}, rival.bestDrop, { rare: 1 }) : rival.bestDrop;
      if (firstClear) pushLog('首次征服「' + (ZONES.find((z) => z.id === zid) || {}).name + '」！必掉首領專屬武器「' + rival.bestDrop.name + '」', 'rival');
      pushLog('名號已破！可於俠客頁花俠義解鎖傳聞「' + rival.loreTitle + '」', 'rival');
      pushEventLog('擊敗名號「' + rival.name + '」（' + (ZONES.find((z) => z.id === zid) || {}).name + '）', 'rival');
    }
    state.chivalry += 5;
    pushLog('名號對手敗退，俠義 +5', 'rival');
    if (Audio()) Audio().playBgm(worldBgm());
  }

  function tickCombat() {
    if (!state || !state.hunting) return;
    if (modalOpen) return;
    ensureVitals();
    if (isExhausted()) return;
    tryTriggerEvent(Date.now());
    if (modalOpen) return;
    stMaybeEvent(Date.now());
    if (modalOpen) return;
    ensureMobs();
    const stats = buffedStats(calcStats(state));
    const mob = syncPrimaryMob();
    if (!mob) {
      renderCombatBars();
      renderStage();
      return;
    }
    let bonusExp = 1;
    if (state.combatBuff && state.combatBuff.kind === 'exp') {
      bonusExp += state.combatBuff.pct || 0;
    }
    const mfx = martialFx(state);
    let hitRoll = rand(-1, 2);
    let forcedCrit = false;
    if (!state.firstHitDone) {
      state.firstHitDone = true;
      if (mfx.firstCrit) { forcedCrit = true; hitRoll = 2; }
    }
    let dmg = Math.max(1, stats.atk - mob.def + hitRoll);
    if (forcedCrit) dmg = Math.floor(dmg * 1.5);
    dmg = Math.max(1, Math.floor(dmg * lowHpMul(mob)));
    if (state.nextAtkBonus > 0) {
      dmg = Math.max(1, Math.floor(dmg * (1 + state.nextAtkBonus)));
      state.nextAtkBonus = 0;
    }
    const isCrit = hitRoll >= 2;
    mob.hp -= dmg;
    const tag = mob.isRival ? '【名號】' : '';
    pushLog(tag + '你對「' + mob.name + '」造成 ' + dmg + ' 傷害' + (isCrit ? '（暴擊）' : ''), mob.isRival ? 'rival' : '');
    fxHeroAttack(dmg, isCrit, mobSlotIndex(mob));
    if (Audio()) Audio().sfx(isCrit ? 'crit' : 'hit');
    renderCombatBars();

    if (mob.hp > 0) {
      tryAutoSkills(stats);
    }

    // 技能可能已結算擊殺
    const still = syncPrimaryMob();
    if (!still) return;
    if (mob.hp <= 0) {
      finishMobKill(mob, bonusExp);
      return;
    }

    // 場上存活敵人輪流／主目標反擊
    const attackers = aliveMobs();
    const foe = attackers[0] || mob;
    const hitChance = Math.max(0.2, 0.85 - (stats.spd - 5) * 0.02 - (mfx.dodge || 0));
    if (Math.random() < hitChance) {
      let mdmg = Math.max(1, Math.ceil(foe.atk * 0.25), foe.atk - stats.def + rand(-1, 1));
      mdmg = Math.max(1, Math.floor(mdmg * incomingDmgFactor()));
      if (state.nextHitReduce > 0) { mdmg = Math.max(1, Math.floor(mdmg * (1 - state.nextHitReduce))); state.nextHitReduce = 0; }
      if (Date.now() < (state.goldBodyUntil || 0)) {
        const refl = Math.max(1, Math.floor(foe.atk * 0.2));
        foe.hp -= refl;
        pushLog('金身反震，「' + foe.name + '」受創 -' + refl, 'loot');
        if (foe.hp <= 0) { finishMobKill(foe, 1); return; }
      }
      if (state.skillSoftLeft > 0) {
        mdmg = Math.max(1, Math.floor(mdmg * 0.7));
        state.skillSoftLeft -= 1;
      }
      const heavy = Math.random() < 0.15;
      if (heavy) mdmg = Math.floor(mdmg * 1.5);
      if (heavy && state.silver > 0) {
        const lose = Math.min(state.silver, rand(1, 3));
        state.silver -= lose;
      }
      pushLog('「' + foe.name + '」' + (heavy ? '重重一擊' : '攻來') + '，你受創 -' + mdmg, heavy ? 'rival' : '');
      setTimeout(() => fxEnemyAttack(heavy ? 'heavy' : 'hit', mobSlotIndex(foe), mdmg), 160);
      heroHurt(mdmg);
      if (isExhausted()) { save(); return; }
    } else {
      pushLog('你身法一閃，避過「' + foe.name + '」');
      setTimeout(() => fxEnemyAttack('miss', mobSlotIndex(foe)), 160);
    }
    renderSkillBar();
    save();
  }

  function finishMobKill(mob, bonusExp) {
    let sil = rand(mob.silver[0], mob.silver[1]);
    const zsb = state.zoneSilverBonus;
    if (zsb && zsb.zoneId === state.zoneId && Date.now() < (zsb.until || 0)) {
      sil = Math.floor(sil * (1 + (zsb.pct || 0)));
    } else if (zsb && Date.now() >= (zsb.until || 0)) {
      state.zoneSilverBonus = null;
    }
    const _gp = gearPct(state);
    if (_gp.silver) sil = Math.floor(sil * (1 + _gp.silver / 100));
    state.silver += sil;
    state.kills += 1;
    bumpQuest('kill');
    healHero(heroMaxHp(state) * 0.08, true);
    const _kfx = martialFx(state);
    if (_kfx.killStack) {
      state.killProg = (state.killProg || 0) + 1;
      if (state.killProg >= 5) { state.killProg = 0; state.killStacks = Math.min(_kfx.killStack, (state.killStacks || 0) + 1); }
    }
    bumpZoneKill();
    const gotExp = Math.floor(mob.exp * bonusExp * (1 + _gp.exp / 100));
    gainExp(gotExp);
    const wasRival = !!mob.isRival;
    if (wasRival) { onRivalDefeated(mob); bumpQuest('rival'); }
    pushLog('擊敗「' + mob.name + '」！經驗 +' + gotExp + '，銀兩 +' + sil, wasRival ? 'rival' : 'win');
    if (Audio()) Audio().sfx('kill');
    const lootGot = tryDrop(wasRival);
    // 掛機自動打：普通掉寶只進背包＋日誌，不彈窗要確認；名號稀有掉落仍可彈
    if (lootGot && lootGot.length) {
      if (wasRival || !state.hunting) openLootModal(lootGot);
    }
    consumeFightBuff();
    fxMobDefeat(mobSlotIndex(mob));
    // 自陣列移除，其餘補位（陣列前移即為主目標）
    if (Array.isArray(state.mobs)) {
      state.mobs = state.mobs.filter((m) => m && m.uid !== mob.uid && m.hp > 0);
    }
    syncPrimaryMob();
    stOnKill(mob);
    renderCombatBars();
    renderHeroStatus();
    renderStage();
    renderZoneProgress();

    if (aliveMobs().length) {
      // 還有怪：續打，不整場重置
      save();
      return;
    }

    state.mobs = [];
    state.mob = null;
    setTimeout(() => {
      if (!state || !state.hunting) return;
      resetFightMarks();
      ensureMobs();
      renderAll();
      save();
    }, 280);
  }

  function skillReady(idx) {
    if (!state || !Array.isArray(state.skillCd)) return true;
    return Date.now() >= (state.skillCd[idx] || 0);
  }

  function setSkillCd(idx, ms) {
    if (!state.skillCd) state.skillCd = [0, 0, 0, 0, 0];
    state.skillCd[idx] = Date.now() + ms;
  }

  function lowHpMul(mob) {
    const f = martialFx(state).lowHp || 0;
    return f && mob.hp < mob.maxHp * 0.5 ? 1 + f : 1;
  }
  function resetFightMarks() {
    state.fightStartAt = Date.now();
    state.firstHitDone = false;
  }

  function castSkill(idx, opts) {
    opts = opts || {};
    if (!state || !state.hunting) return false;
    if (modalOpen) return false;
    ensureMobs();
    const mob = syncPrimaryMob();
    if (!mob || mob.hp <= 0) return false;
    if (isExhausted()) return false;
    if (!skillReady(idx)) return false;
    const skills = heroSkills();
    const sk = skills[idx];
    if (!sk) return false;
    ensureVitals();
    const mpNeed = mpCost(sk);
    if (state.mp < mpNeed) {
      if (!opts.auto) { pushLog('內力不足（需 ' + mpNeed + '）'); spawnFloat('內力不足', 'miss'); }
      return false;
    }
    state.mp -= mpNeed;
    bumpQuest('cast');
    const fx = martialFx(state);
    const now = Date.now();

    setSkillCd(idx, skillCdMs(sk));
    spawnFloat(sk.name, 'skill-name', mobSlotIndex(mob));
    pulseClass(document.querySelector('.skill-slot[data-skill="' + idx + '"]'), 'flash', 280);

    if (sk.kind === 'buff') {
      state.nextAtkBonus = 0.35;
      const soft = 2 + (fx.ningDur ? 1 : 0) + ((fx.guard && fx.guard.ningqi) || 0);
      state.skillSoftLeft = Math.max(state.skillSoftLeft || 0, soft);
      if (fx.ningDef) state.defBuffUntil = now + 10000;
      if (fx.healPct && fx.healPct[sk.id]) healHero(heroMaxHp(state) * fx.healPct[sk.id]);
      spawnFloat('運功', 'heal');
      pushLog('施展「' + sk.name + '」：下招威力↑，短暫護體', 'loot');
      if (Audio()) Audio().sfx('qi');
      renderSkillBar();
      save();
      return true;
    }

    const stats = buffedStats(calcStats(state));
    const slot = mobSlotIndex(mob);
    let total = 0;
    let isCrit = false;

    if (sk.kind === 'ult' && sk.id === 'luohan') {
      state.goldBodyUntil = now + 8000;
      state.skillSoftLeft = Math.max(state.skillSoftLeft || 0, 3);
      spawnFloat('金身', 'heal');
      pushLog('施展絕學「' + sk.name + '」：8 秒內受創減半，並反彈部分傷害！', 'rival');
      if (Audio()) Audio().sfx('rival');
      renderSkillBar();
      save();
      return true;
    }

    const eff = Math.max(1, stats.atk - mob.def);
    if (sk.kind === 'ult') {
      if (sk.id === 'wanjian') {
        const sw = getSchoolSkills(state.school).filter((x) => x.kind !== 'buff');
        const sum = sw.reduce((a, x) => a + (x.mult || 1) * (x.hits || 1), 0);
        total = Math.max(1, Math.floor(eff * sum * 2.5));
      } else if (sk.id === 'tiandaozhan') {
        total = Math.max(1, Math.floor(eff * 3 * (mob.isRival ? 1.2 : 1)));
      } else if (sk.id === 'wuying') {
        const per = 0.6 * (1 + stats.spd * 0.01);
        for (let i = 0; i < 6; i++) total += Math.max(1, Math.floor(eff * per));
      }
      total = Math.floor(total * lowHpMul(mob));
      mob.hp -= total;
      isCrit = true;
      pushLog('絕學「' + sk.name + '」對「' + mob.name + '」造成 -' + total, 'rival');
    } else {
      let hits = (sk.hits || 1) + ((fx.hitsPlus && fx.hitsPlus[sk.id]) || 0);
      let mul = 1 + ((fx.skillMul && fx.skillMul[sk.id]) || 0);
      if (hits > 1 && fx.multiHit) mul *= 1 + fx.multiHit;
      const dEff = mob.def * (1 - ((fx.ignoreDef && fx.ignoreDef[sk.id]) || 0));
      const critMul = (fx.critSkill && fx.critSkill[sk.id]) || 1;
      if (fx.storm) {
        state.stormStacks = (now < (state.stormUntil || 0) ? state.stormStacks || 0 : 0) + 1;
        state.stormUntil = now + 8000;
      }
      for (let i = 0; i < hits; i++) {
        const roll = rand(0, 2);
        let dmg = Math.max(1, Math.floor((stats.atk - dEff + roll) * (sk.mult || 1.3) * mul * critMul * lowHpMul(mob)));
        total += dmg;
        mob.hp -= dmg;
      }
      isCrit = (sk.mult || 1) >= 1.6 || hits >= 3 || critMul > 1;
      pushLog('「' + sk.name + '」對「' + mob.name + '」額外 -' + total, 'loot');
      if (fx.healDmg && fx.healDmg[sk.id]) healHero(total * fx.healDmg[sk.id]);
      if (fx.healPct && fx.healPct[sk.id]) healHero(heroMaxHp(state) * fx.healPct[sk.id]);
      const g = fx.guard && fx.guard[sk.id];
      if (g) state.skillSoftLeft = Math.max(state.skillSoftLeft || 0, g);
      if (fx.nextBonus && fx.nextBonus[sk.id]) state.nextAtkBonus = (state.nextAtkBonus || 0) + fx.nextBonus[sk.id];
      if (fx.nextHitReduce && fx.nextHitReduce[sk.id]) state.nextHitReduce = fx.nextHitReduce[sk.id];
    }
    spawnFloat('-' + total, isCrit ? 'crit skill' : 'skill', slot);
    spawnSlash(!!isCrit, true, slot);
    const slotEl = $('enemy-slot-' + slot);
    pulseClass(slotEl, 'hit', 300);
    pulseClass($('battle-stage'), 'shake', isCrit ? 340 : 240);
    if (Audio()) Audio().sfx('skill');
    renderCombatBars();
    renderSkillBar();

    if (mob.hp <= 0) {
      let bonusExp = 1;
      if (state.combatBuff && state.combatBuff.kind === 'exp') bonusExp += state.combatBuff.pct || 0;
      finishMobKill(mob, bonusExp);
    }
    save();
    return true;
  }

  function tryAutoSkills(stats) {
    // 前 3 格掛機自動施放（冷卻好就放，每次 tick 最多一招）
    if (martialUlt(state) && skillReady(4) && state.mp >= mpCost(martialUlt(state))) {
      if (castSkill(4, { auto: true })) return;
    }
    const _sks = heroSkills();
    for (let i = 0; i < 3; i++) {
      if (skillReady(i) && _sks[i] && state.mp >= mpCost(_sks[i])) {
        castSkill(i, { auto: true });
        return;
      }
    }
  }

  function tryTriggerEvent(now) {
    if (!state || !state.hunting || modalOpen) return;
    refreshTeaDay();
    if (state.teaDailyCount >= 6) return;
    if (now < (state.teaCooldownUntil || 0)) return;
    // 低機率；掛機中段觸發（彈窗開啟時略過，避免堆佇列）
    if (Math.random() > 0.045) return;
    openTeahouseModal();
  }

  function ensureModalRoot() {
    let root = document.getElementById('modal-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
    return root;
  }

  const modalQueue = [];

  function closeModal() {
    modalOpen = false;
    document.body.classList.remove('modal-open');
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
    if (modalQueue.length) {
      const next = modalQueue.shift();
      setTimeout(() => next && next(), 40);
    }
  }

  function enqueueModal(fn) {
    if (modalOpen) modalQueue.push(fn);
    else fn();
  }

  function openLevelUpModal(fromLv, toLv) {
    enqueueModal(() => {
      if (modalOpen) {
        modalQueue.push(() => openLevelUpModal(fromLv, toLv));
        return;
      }
      modalOpen = true;
      const root = ensureModalRoot();
      const gained = toLv - fromLv;
      let bt = 0;
      Object.keys(BREAKTHROUGH_TEXT).forEach((k) => { if (fromLv < +k && toLv >= +k) bt = Math.max(bt, +k); });
      root.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true">' +
        '<div class="modal-card level-modal">' +
        '<h3>' + (bt ? '突破！' : '恭喜升級') + '</h3>' +
        (bt ? '<p style="text-align:center;color:#ffd986;margin:4px 0"><b>' + realmName(toLv) + '</b><br/>' + BREAKTHROUGH_TEXT[bt] + '</p>' : '') +
        '<p class="muted" style="text-align:center">Lv.' + fromLv + ' → Lv.' + toLv +
        (gained > 1 ? '（連升 ' + gained + ' 級）' : '') + '</p>' +
        '<div class="level-delta">' +
        '攻防速與氣血隨等級成長。<br/>' +
        '目前等級 <b>Lv.' + toLv + '</b>，戰力請見頂欄。' +
        '</div>' +
        '<button type="button" class="btn primary full" data-close>知道了</button>' +
        '</div></div>';
      root.querySelector('[data-close]').onclick = () => {
        if (Audio()) Audio().sfx('click');
        closeModal();
        renderAll();
      };
    });
  }

  function openLootModal(items) {
    if (!items || !items.length) return;
    enqueueModal(() => {
      if (modalOpen) {
        modalQueue.push(() => openLootModal(items));
        return;
      }
      modalOpen = true;
      const root = ensureModalRoot();
      const rows = items.map((it) => {
        const meta = it.meta || '';
        const qcls = it.quality ? qualityMeta(it.quality).cls : '';
        return (
          '<div class="loot-row' + (qcls ? ' ' + qcls : '') + '">' +
          '<div class="loot-icon">' + (it.icon || '🎒') + '</div>' +
          '<div><div class="loot-name">' + escapeHtml(it.name) + '</div>' +
          (meta ? '<div class="loot-meta">' + escapeHtml(meta) + '</div>' : '') +
          '</div></div>'
        );
      }).join('');
      root.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true">' +
        '<div class="modal-card loot-modal">' +
        '<h3>獲得物品</h3>' +
        '<div class="loot-list">' + rows + '</div>' +
        '<button type="button" class="btn primary full" data-close>收下</button>' +
        '</div></div>';
      root.querySelector('[data-close]').onclick = () => {
        if (Audio()) Audio().sfx('click');
        closeModal();
        renderAll();
      };
    });
  }

  function openTeahouseModal() {
    enqueueModal(() => {
      if (modalOpen) {
        modalQueue.push(() => openTeahouseModal());
        return;
      }
      const ev = pick(TEAHOUSE_EVENTS);
      modalOpen = true;
      if (Audio()) Audio().sfx('tea');
      const root = ensureModalRoot();
      root.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true">' +
        '<div class="modal-card">' +
        '<h3>茶樓一敘</h3>' +
        '<p class="muted">茶博士低聲提起——「' + escapeHtml(ev.theme) + '」</p>' +
        '<p class="tea-body">過客在茶桌兩側各執一詞，你要聽哪邊？</p>' +
        '<div class="tea-actions">' +
        '<button type="button" class="btn primary" data-tea="left">' + escapeHtml(ev.left.label) + '</button>' +
        '<button type="button" class="btn primary" data-tea="right">' + escapeHtml(ev.right.label) + '</button>' +
        '<button type="button" class="btn" data-tea="skip">先掛著（跳過）</button>' +
        '</div></div></div>';

      const finish = (side) => {
        if (Audio()) Audio().sfx('click');
        refreshTeaDay();
        state.teaDailyCount += 1;
        const cdMin = 15 + Math.floor(Math.random() * 6); // 15～20 分
        state.teaCooldownUntil = Date.now() + cdMin * 60 * 1000;
        if (side === 'skip') {
          pushLog('茶樓一敘：你先掛著，過耳不留。', 'event');
          pushEventLog('茶樓「' + ev.theme + '」：跳過', 'tea');
        } else {
          const choice = side === 'left' ? ev.left : ev.right;
          applyTeaChoice(ev, choice);
          pushLog('茶樓一敘（' + ev.theme + '）·' + choice.label + '：' + choice.text, 'event');
          pushEventLog('茶樓「' + ev.theme + '」→' + choice.label, 'tea');
        }
        closeModal();
        renderAll();
        save();
      };
      root.querySelector('[data-tea="left"]').onclick = () => finish('left');
      root.querySelector('[data-tea="right"]').onclick = () => finish('right');
      root.querySelector('[data-tea="skip"]').onclick = () => finish('skip');
    });
  }

  function applyTeaChoice(ev, choice) {
    const b = choice.buff || {};
    if (b.silver) state.silver = Math.max(0, state.silver + b.silver);
    if (b.kind === 'silver' && b.flat) state.silver = Math.max(0, state.silver + b.flat);
    if (b.kind === 'chivalry' && b.flat) state.chivalry += b.flat;
    if (b.drop) {
      state.dropBonusPct = b.drop;
      state.dropBonusLeft = b.fights || 1;
    }
    if (b.kind === 'encounter') {
      state.encounterReducePct = Math.abs(b.pct || 0.1);
      state.encounterReduceLeft = b.fights || 3;
    }
    if (b.kind === 'zoneSilver') {
      state.zoneSilverBonus = {
        zoneId: state.zoneId,
        pct: b.pct || 0.1,
        until: Date.now() + (b.hours || 24) * 3600 * 1000,
      };
    }
    if (b.kind === 'rivalChance') {
      state.rivalChanceBonus = {
        zoneId: state.zoneId,
        pct: b.pct || 0.01,
        until: Date.now() + (b.hours || 1) * 3600 * 1000,
      };
    }
    if (b.kind === 'flavor' && b.line) {
      pushLog(b.line, 'event');
      pushEventLog(b.line, 'tea');
    }
    if (b.kind === 'gamble') {
      const win = Math.random() < 0.45;
      const n = rand(8, 28);
      if (win) {
        state.silver += n;
        pushLog('賭坊小試：贏了 ' + n + ' 銀', 'loot');
      } else {
        const lose = Math.min(state.silver, n);
        state.silver -= lose;
        pushLog('賭坊小試：輸了 ' + lose + ' 銀');
      }
      return;
    }
    if (b.kind === 'soften') {
      applyCombatBuff({ kind: 'soften', pct: b.pct || 0.1, fights: b.fights || 8 });
      return;
    }
    if (b.kind === 'atk' || b.kind === 'def' || b.kind === 'spd' || b.kind === 'exp') {
      applyCombatBuff({
        kind: b.kind,
        pct: b.pct || 0,
        fights: b.fights || 5,
        vuln: b.vuln || 0,
        spd: b.spd || 0,
        label: ev.theme,
      });
      return;
    }
    if (b.spd && b.fights) {
      applyCombatBuff({ kind: 'spd', pct: b.spd, fights: b.fights, label: ev.theme });
    }
  }

  function rollTitleOffer() {
    const owned = new Set(state.titlesOwned || []);
    const left = TITLE_POOL.filter((t) => !owned.has(t));
    const pool = left.length ? left : TITLE_POOL.slice();
    const offer = [];
    const copy = pool.slice();
    while (offer.length < 3 && copy.length) {
      const i = Math.floor(Math.random() * copy.length);
      offer.push(copy.splice(i, 1)[0]);
    }
    // 若不足 3，從全池補（但仍不可買已擁有）
    while (offer.length < 3) {
      const t = TITLE_POOL[offer.length % TITLE_POOL.length];
      if (!offer.includes(t)) offer.push(t);
      else break;
    }
    state.titleOffer = offer;
  }

  function spendChivalryTitle(title) {
    if ((state.titlesOwned || []).includes(title)) {
      pushLog('此稱號已擁有，不可重複購買');
      return;
    }
    if (state.chivalry < CHIVALRY_COST.title) {
      pushLog('俠義不足（需 ' + CHIVALRY_COST.title + '）');
      return;
    }
    state.chivalry -= CHIVALRY_COST.title;
    state.chivalrySpent += CHIVALRY_COST.title;
    state.titlesOwned.push(title);
    state.activeTitle = title;
    rollTitleOffer();
    pushLog('取得稱號「' + title + '」', 'loot');
    pushEventLog('俠義換稱號「' + title + '」', 'chivalry');
    if (Audio()) Audio().sfx('spend');
    renderAll();
    save();
  }

  function spendChivalryLore(zoneId) {
    const rival = ZONE_RIVALS[zoneId];
    if (!rival) return;
    if (!state.zoneBossFlags[zoneId]) {
      pushLog('須先擊敗該區名號對手');
      return;
    }
    if (state.unlockedLore[rival.loreId]) {
      pushLog('此則傳聞已解鎖');
      return;
    }
    if (state.chivalry < CHIVALRY_COST.lore) {
      pushLog('俠義不足（需 ' + CHIVALRY_COST.lore + '）');
      return;
    }
    state.chivalry -= CHIVALRY_COST.lore;
    state.chivalrySpent += CHIVALRY_COST.lore;
    state.unlockedLore[rival.loreId] = true;
    pushLog('以俠義解鎖傳聞「' + rival.loreTitle + '」', 'loot');
    pushEventLog('俠義解鎖傳聞「' + rival.loreTitle + '」', 'chivalry');
    if (Audio()) Audio().sfx('spend');
    renderAll();
    save();
  }

  function spendChivalrySoften() {
    if (state.chivalry < CHIVALRY_COST.soften) {
      pushLog('俠義不足（需 ' + CHIVALRY_COST.soften + '）');
      return;
    }
    state.chivalry -= CHIVALRY_COST.soften;
    state.chivalrySpent += CHIVALRY_COST.soften;
    applyCombatBuff({ kind: 'soften', pct: 0.1, fights: 8 });
    pushLog('俠義護身：接下來 8 場受創 -10%', 'loot');
    pushEventLog('俠義軟化：8 場受創-10%', 'chivalry');
    if (Audio()) Audio().sfx('spend');
    renderAll();
    save();
  }

  function startHunt() {
    if (!state) return;
    const zone = currentZone();
    if (!DEBUG_BOSS && state.lv < zone.minLv) {
      pushLog(`等級不足，需 Lv.${zone.minLv} 才能掛此處`);
      return;
    }
    if (Audio()) {
      Audio().unlock();
      Audio().sfx('click');
      const prim = state.mob || (Array.isArray(state.mobs) && state.mobs[0]);
      const want = (prim && prim.isRival) ? battleBgm(prim.zoneId || zone.id) : worldBgm();
      Audio().playBgm(want);
    }
    state.hunting = true;
    resetFightMarks();
    ensureMobs();
    pushLog(`在「${zone.name}」開始掛機…（自動戰鬥中）`);
    const bh = $('btn-hunt');
    const bs = $('btn-stop');
    if (bh) bh.disabled = true;
    if (bs) bs.disabled = false;
    if (huntTimer) clearInterval(huntTimer);
    const stats = calcStats(state);
    const ms = Math.max(650, 1400 - stats.spd * 40);
    huntTimer = setInterval(tickCombat, ms);
    if (!window.__skillCdUiTimer) {
      window.__skillCdUiTimer = setInterval(() => {
        if (state) renderSkillBar();
      }, 250);
    }
    renderAll();
    save();
  }

  function stopHunt() {
    if (!state) return;
    state.hunting = false;
    state.killStacks = 0;
    state.killProg = 0;
    if (huntTimer) {
      clearInterval(huntTimer);
      huntTimer = null;
    }
    const bh = $('btn-hunt');
    const bs = $('btn-stop');
    if (bh) bh.disabled = false;
    if (bs) bs.disabled = true;
    pushLog('停手歇息。');
    if (Audio()) {
      Audio().sfx('click');
      Audio().playBgm(worldBgm());
    }
    renderAll();
    save();
  }

  function equipItem(uid) {
    const idx = state.bag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const item = state.bag[idx];
    if (!item.slot) return;
    const prev = state.equip[item.slot];
    state.equip[item.slot] = item;
    state.bag.splice(idx, 1);
    if (prev) state.bag.push(prev);
    pushLog(`裝備「${item.name}」`, 'loot');
    renderAll();
    save();
  }

  // 手動單件售出（玩家主動點一件）；不是自動、也不是一鍵清空。
  function sellItem(uid) {
    const idx = state.bag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const item = state.bag[idx];
    if (isItemEquipped(uid)) return;
    const qm = qualityMeta(item.quality);
    const price = qualitySellPrice(item);
    state.silver += price;
    bumpQuest('sell');
    state.bag.splice(idx, 1);
    pushLog('手動售出「' + item.name + '」（' + qm.label + '）＋' + price + ' 銀', 'loot ' + qm.cls);
    renderAll();
    save();
  }

  function getBulkSellMode() {
    const m = state && state.settings && state.settings.bulkSell;
    if (m === 'fan' || m === 'fan_liang') return m;
    return 'fan';
  }

  function setBulkSellMode(mode) {
    if (!state) return;
    if (mode !== 'fan' && mode !== 'fan_liang') return;
    if (!state.settings) state.settings = { muted: false, bgmVol: 0.28, sfxVol: 0.55, autoSell: 'fan', bulkSell: 'fan' };
    state.settings.bulkSell = mode;
    renderBag();
    save();
  }

  /** 一鍵販售：只賣行囊內勾選品質；名號／珍／絕不進；不動已裝備。 */
  function canBulkSellItem(item) {
    if (!item) return false;
    if (item.keep || item.fromRival) return false;
    const q = item.quality || 'fan';
    if (q === 'zhen' || q === 'jue') return false;
    if (isItemEquipped(item.uid)) return false;
    const mode = getBulkSellMode();
    if (mode === 'fan') return q === 'fan';
    if (mode === 'fan_liang') return q === 'fan' || q === 'liang';
    return false;
  }

  function oneClickSellBag() {
    if (!state || !Array.isArray(state.bag)) return;
    const mode = getBulkSellMode();
    const keep = [];
    let sold = 0;
    let silverGain = 0;
    for (const item of state.bag) {
      if (canBulkSellItem(item)) {
        const price = qualitySellPrice(item);
        silverGain += price;
        sold += 1;
      } else {
        keep.push(item);
      }
    }
    if (!sold) {
      pushLog('一鍵販售：沒有符合條件的物品（名號／珍絕／已裝備不會賣）。');
      renderBag();
      return;
    }
    state.bag = keep;
    bumpQuest('sell', sold);
    state.silver += silverGain;
    const label = mode === 'fan_liang' ? '凡＋良' : '凡';
    pushLog('一鍵販售（' + label + '）出 ' + sold + ' 件，＋' + silverGain + ' 銀', 'loot');
    if (Audio()) Audio().sfx('drop');
    renderAll();
    save();
  }

  function setAutoSell(mode) {
    if (!state) return;
    if (mode !== 'off' && mode !== 'fan' && mode !== 'fan_liang') return;
    if (!state.settings) state.settings = { muted: false, bgmVol: 0.28, sfxVol: 0.55, autoSell: 'fan' };
    state.settings.autoSell = mode;
    renderBag();
    save();
  }


  function pulseClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 300);
  }

  function mobSlotIndex(mob) {
    if (!state || !mob || !Array.isArray(state.mobs)) return 0;
    const idx = state.mobs.findIndex((m) => m && m.uid === mob.uid);
    return idx < 0 ? 0 : Math.min(2, idx);
  }

  // 斜角戰場座標（%）：敵左上沿斜線、我右下。與 CSS data-slot 站位對齊。
  function slotIsoPos(slot) {
    const map = {
      0: { left: 32, top: 28 },
      1: { left: 16, top: 42 },
      2: { left: 44, top: 16 },
    };
    return map[slot] != null ? map[slot] : map[0];
  }
  function heroIsoPos() {
    return { left: 70, top: 56 };
  }
  function slotLeftPercent(slot) {
    return slotIsoPos(slot).left;
  }

  function spawnFloat(text, kind, slot) {
    const fx = $('stage-fx');
    if (!fx) return;
    const el = document.createElement('div');
    const kinds = (kind || '').trim();
    el.className = 'dmg-float' + (kinds ? ' ' + kinds : '');
    el.textContent = text;
    const onHero = /enemy-hit|heal/.test(kinds);
    const pos = onHero ? heroIsoPos() : slotIsoPos(slot == null ? 0 : slot);
    const sideX = /skill-name/.test(kinds) ? 0 : (onHero ? 14 : 9);
    const jitterX = rand(-4, 6) + sideX;
    const jitterY = rand(-6, 10);
    el.style.left = (pos.left + jitterX) + '%';
    el.style.top = (pos.top + jitterY + (onHero ? 12 : 10)) + '%';
    fx.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function spawnSlash(isCrit, isSkill, slot) {
    const fx = $('stage-fx');
    if (!fx) return;
    const pos = slotIsoPos(slot == null ? 0 : slot);
    const baseLeft = pos.left - 2;
    const baseTop = pos.top + 6;
    const mk = (extra) => {
      const el = document.createElement('div');
      el.className = 'fx-slash' + (isCrit ? ' crit' : '') + (isSkill ? ' skill' : '') + (extra ? ' ' + extra : '');
      el.style.left = (baseLeft + rand(-3, 6)) + '%';
      el.style.top = (baseTop + rand(-4, 8)) + '%';
      fx.appendChild(el);
      setTimeout(() => el.remove(), isCrit ? 400 : 340);
    };
    mk('');
    if (isCrit || isSkill) mk('twin');
    const spark = document.createElement('div');
    spark.className = 'fx-spark';
    spark.style.left = (baseLeft + 5 + rand(-3, 5)) + '%';
    spark.style.top = (baseTop + 2 + rand(-4, 6)) + '%';
    fx.appendChild(spark);
    setTimeout(() => spark.remove(), 260);
    if (isCrit) {
      const spark2 = document.createElement('div');
      spark2.className = 'fx-spark';
      spark2.style.left = (baseLeft - 2 + rand(-2, 4)) + '%';
      spark2.style.top = (baseTop + 8 + rand(-3, 5)) + '%';
      fx.appendChild(spark2);
      setTimeout(() => spark2.remove(), 280);
    }
  }

  function renderZoneProgress() {
    if (!state) return;
    const n = getZoneKillCount();
    const label = $('zone-kill-label');
    if (label) label.textContent = '本區擊殺 ' + n;
    const bar = $('bar-zone-prog');
    if (bar) {
      const pct = ((n % ZONE_KILL_GOAL) / ZONE_KILL_GOAL) * 100;
      // 剛好整段時顯示滿格再歸零視覺：有擊殺時至少一點
      bar.style.width = (n > 0 && pct === 0 ? 100 : pct) + '%';
    }
  }

  function renderStage() {
    if (!state) return;
    const stage = $('battle-stage');
    const heroF = $('fighter-hero');
    if (!stage || !heroF) return;

    const zone = currentZone();
    const shaking = stage.classList.contains('shake');
    stage.className =
      'battle-stage zone-' + zone.id + (state.hunting ? ' hunting' : '') + (shaking ? ' shake' : '');

    heroF.className = 'fighter hero-side school-' + (state.school || 'cangjian') + (state.hunting ? ' idle' : '');
    const hLabel = $('hero-stage-label');
    if (hLabel) hLabel.textContent = state.name || '俠客';

    const autoStatus = $('auto-status');
    if (autoStatus) {
      autoStatus.classList.toggle('hidden', !state.hunting);
      autoStatus.textContent = '自動戰鬥中…';
    }

    if (!Array.isArray(state.mobs)) state.mobs = [];
    const primary = syncPrimaryMob();
    for (let i = 0; i < 3; i++) {
      const slot = $('enemy-slot-' + i);
      if (!slot) continue;
      const mob = state.mobs[i];
      slot.className = 'fighter enemy-side enemy-slot slot-' + i;
      const spr = slot.querySelector('[data-sprite]');
      if (!mob || mob.hp <= 0) {
        slot.classList.add('empty');
        if (spr) {
          const keepKind = spr.dataset.kind && spr.dataset.kind !== 'hero' ? spr.dataset.kind : ENEMY_SPRITES[i % ENEMY_SPRITES.length];
          const dp = slotPoseNow(i);
          applySprite(spr, keepKind, dp || 'idle');
          spr.alt = '';
        }
        const lab = slot.querySelector('[data-label]');
        if (lab) lab.textContent = i === 0 && !primary ? '等待開打' : '';
        const hp = $('mob-hp-' + i);
        if (hp) hp.style.width = '0%';
        const hn0 = $('hpname-' + i); if (hn0) hn0.textContent = '';
        continue;
      }
      slot.classList.add('look-' + (mob.look || 'bandit'));
      {
        const ownKind = mob.isRival ? RIVAL_KIND[mob.rivalId] : MOB_KIND[mob.name];
        const tintKey = ownKind && SPRITE_READY[ownKind] ? null : (mob.isRival ? mob.rivalId : mob.name);
        const h = tintKey ? strHash(tintKey) : 0;
        slot.style.setProperty('--hue', tintKey ? ((h % 12) * 30) + 'deg' : '0deg');
        slot.style.setProperty('--sat', tintKey ? String(0.85 + (h % 5) * 0.08) : '1');
        slot.style.setProperty('--sz', tintKey ? (mob.isRival ? '1.28' : String(0.92 + (strHash(mob.name || '') % 4) * 0.05)) : '1');
      }
      if (state.hunting) slot.classList.add('idle');
      if (mob.isRival) {
        slot.classList.add('named-rival');
        slot.classList.add('gold-outline');
      }
      if (primary && primary.uid === mob.uid) slot.classList.add('primary-target');
      if (spr) {
        applySprite(spr, enemySpriteSrc(mob, i), slotPoseNow(i) || 'idle');
        spr.alt = mob.name || '';
      }
      const lab = slot.querySelector('[data-label]');
      if (lab) lab.textContent = (mob.isRival ? '名號·' : '') + mob.name;
      const hp = $('mob-hp-' + i);
      if (hp) hp.style.width = Math.max(0, (mob.hp / mob.maxHp) * 100) + '%';
      const hbox = $('hpb-' + i);
      if (hbox) {
        hbox.classList.toggle('hpb-boss', !!mob.isRival);
        hbox.classList.toggle('hpb-enemy', !mob.isRival);
        const fr = $('hpf-' + i);
        const small = !mob.isRival && window.innerWidth <= 480;
        hbox.classList.toggle('hpb-small', small);
        const want = 'assets/ui/hpframe_' + (mob.isRival ? 'boss' : (small ? 'enemy_small' : 'enemy')) + '.webp';
        if (fr && fr.getAttribute('src') !== want) fr.setAttribute('src', want);
        const hn = $('hpname-' + i);
        if (hn) hn.textContent = mob.isRival ? mob.name : '';
      }
    }
  }

  // 斜角 Q 版：攻擊僅套 attacking class（斜衝 CSS），不再播橫版 sheet。
  const HERO_ATK_MS = 280;
  let heroAtkTimer = null;

  let heroPoseTimer = null;
  function setHeroPose(pose, ms) {
    const art = $('hero-art');
    if (!art) return;
    if (heroPoseTimer) { clearTimeout(heroPoseTimer); heroPoseTimer = null; }
    applySprite(art, 'hero', pose);
    if (pose !== 'idle' && ms) {
      heroPoseTimer = setTimeout(() => {
        applySprite(art, 'hero', 'idle');
        heroPoseTimer = null;
      }, ms);
    }
  }
  // 預載四幀避免切換閃爍
  ['hero', 'drunk', 'pirate', 'bandit'].forEach((k) => ['idle', 'attack', 'hurt', 'down'].forEach((po) => { const i = new Image(); i.src = spriteUrl(k, po); }));

  function playHeroAttackAnim() {
    const art = $('hero-art');
    if (!art) return;
    if (heroAtkTimer) {
      clearTimeout(heroAtkTimer);
      heroAtkTimer = null;
    }
    art.classList.add('attacking');
    setHeroPose('attack', 320);
    heroAtkTimer = setTimeout(() => {
      art.classList.remove('attacking');
      heroAtkTimer = null;
    }, HERO_ATK_MS);
  }

  function fxHeroAttack(dmg, isCrit, slot) {
    pulseClass($('fighter-hero'), 'attacking', HERO_ATK_MS);
    playHeroAttackAnim();
    const s = slot == null ? 0 : slot;
    pulseClass($('enemy-slot-' + s), 'hit', 300);
    setSlotPose(s, 'hurt', 280);
    pulseClass($('battle-stage'), 'shake', isCrit ? 340 : 240);
    spawnFloat('-' + dmg, isCrit ? 'crit' : '', s);
    spawnSlash(!!isCrit, false, s);
  }

  function fxEnemyAttack(kind, slot, dmg) {
    const s = slot == null ? 0 : slot;
    pulseClass($('enemy-slot-' + s), 'attacking', 280);
    setSlotPose(s, 'attack', 300);
    pulseClass($('fighter-hero'), 'hit', 280);
    if (kind !== 'miss' && kind !== 'block') setHeroPose('hurt', 300);
    if (kind === 'miss') spawnFloat('閃', 'miss enemy-hit');
    else if (kind === 'block') spawnFloat('化', 'miss enemy-hit');
    else spawnFloat(dmg ? '-' + dmg : '-!', 'enemy-hit' + (kind === 'heavy' ? ' hit-crit' : ''));
  }

  function fxMobDefeat(slot) {
    const s = slot == null ? 0 : slot;
    const enemyF = $('enemy-slot-' + s);
    if (!enemyF) return;
    // 倒地用殘影：敵人陣列隨即前移補位，不能直接改槽內那張圖
    const spr = enemyF.querySelector('[data-sprite]');
    if (spr && spr.dataset.kind && spr.dataset.kind !== 'hero') {
      const ghost = document.createElement('img');
      ghost.className = 'combat-sprite ghost-down';
      ghost.alt = '';
      ghost.draggable = false;
      applySprite(ghost, spr.dataset.kind, 'down');
      (spr.parentElement || enemyF).appendChild(ghost);
      setTimeout(() => ghost.remove(), 700);
    }
    spawnFloat('破！', 'kill', s);
  }

  function setBar(fill, pct) {
    if (!fill) return;
    const p = Math.max(0, Math.min(100, pct));
    fill.style.width = p + '%';
    const gh = fill.previousElementSibling;
    if (gh && gh.classList.contains('hpb-ghost')) gh.style.width = p + '%';
  }
  function renderHeroVitals() {
    const mh = heroMaxHp(state);
    const pct = (state.hp / mh) * 100;
    setBar($('hero-hp-fill'), pct);
    const num = $('hero-hp-num');
    if (num) num.textContent = isExhausted() ? '力竭' : Math.ceil(state.hp) + '/' + mh;
    const hb = $('hpb-hero');
    if (hb) hb.classList.toggle('low', pct < 30 && !isExhausted());
    const mp = $('hero-mp-fill');
    if (mp) mp.style.width = Math.min(100, (state.mp / heroMaxMp(state)) * 100) + '%';
    const ex = $('hero-exhaust');
    if (ex) ex.classList.toggle('hidden', !isExhausted());
  }
  function renderHeroStatus() {
    const box = $('hero-status');
    if (!box || !state) return;
    const stats = buffedStats(calcStats(state));
    const need = expToNext(state.lv);
    const now = Date.now();
    const chips = [];
    if (now < (state.goldBodyUntil || 0)) chips.push('金身 ' + Math.ceil((state.goldBodyUntil - now) / 1000) + 's');
    if (state.skillSoftLeft > 0) chips.push('護體×' + state.skillSoftLeft);
    if (state.nextAtkBonus > 0) chips.push('蓄勢');
    { const _f = martialFx(state); if (_f.opening && state.fightStartAt && now - state.fightStartAt < 3000) chips.push('先手'); }
    if (now < (state.defBuffUntil || 0)) chips.push('防↑');
    if (state.killStacks > 0) chips.push('殺氣×' + state.killStacks);
    if (state.stormStacks > 0 && now < (state.stormUntil || 0)) chips.push('疾風×' + state.stormStacks);
    $('hs-name').textContent = state.name + '  Lv.' + state.lv + '・' + realmName(state.lv);
    ensureVitals();
    $('hs-stats').textContent = '血 ' + Math.ceil(state.hp) + '/' + heroMaxHp(state) + '  攻 ' + stats.atk + '  防 ' + stats.def + '  速 ' + stats.spd;
    renderHeroVitals();
    $('hs-exp').style.width = Math.min(100, (state.exp / need) * 100) + '%';
    $('hs-buffs').innerHTML = chips.length ? chips.map((c) => '<span class="hs-chip">' + escapeHtml(c) + '</span>').join('') : '<span class="hs-none">無狀態</span>';
  }
  function renderCombatBars() {
    if (!state) return;
    if (!Array.isArray(state.mobs)) state.mobs = [];
    const primary = syncPrimaryMob();
    for (let i = 0; i < 3; i++) {
      const mob = state.mobs[i];
      const hp = $('mob-hp-' + i);
      if (!hp) continue;
      const num = $('hpn-' + i);
      const box = $('hpb-' + i);
      if (!mob || mob.hp <= 0) { setBar(hp, 0); if (num) num.textContent = ''; if (box) box.classList.remove('low'); }
      else {
        const pc = (mob.hp / mob.maxHp) * 100;
        setBar(hp, pc);
        if (num) num.textContent = Math.max(0, Math.ceil(mob.hp)) + '/' + mob.maxHp;
        if (box) box.classList.toggle('low', pc < 30);
      }
    }
    // 相容：若還有舊元素就不報錯
    const nameEl = $('mob-name');
    if (nameEl) {
      if (primary) {
        nameEl.textContent =
          (primary.isRival ? '【名號】' : '') +
          primary.name +
          '  ' +
          Math.max(0, primary.hp) +
          '/' +
          primary.maxHp;
      } else {
        nameEl.textContent = '等待開打';
      }
    }
    const bar = $('bar-mob');
    if (bar) {
      if (primary) bar.style.width = Math.max(0, (primary.hp / primary.maxHp) * 100) + '%';
      else bar.style.width = '0%';
    }
  }

  function renderAll() {
    if (!state) return;
    const school = SCHOOLS.find((s) => s.id === state.school);
    const stats = calcStats(state);
    const need = expToNext(state.lv);
    const titleBit = state.activeTitle ? '「' + state.activeTitle + '」' : '';
    $('hero-name').textContent = titleBit + state.name;
    const lvEl = $('hero-lv');
    if (lvEl) lvEl.textContent = 'Lv.' + state.lv;
    $('hero-meta').textContent = (school ? school.name : '') + '・' + realmName(state.lv);
    const powerEl = $('stat-power');
    if (powerEl) powerEl.textContent = String(calcPower(stats, heroMaxHp(state)));
    const av = $('hud-avatar');
    if (av) {
      const look = state.look || 'a';
      av.className = 'hud-avatar school-' + (state.school || 'cangjian') + ' look-' + look;
      const lookDef = LOOKS.find((x) => x.id === look);
      const glyph = lookDef ? lookDef.glyph : (state.name || '俠').charAt(0);
      av.textContent = glyph;
      const bimg = document.createElement('img');
      bimg.className = 'hud-badge-img';
      bimg.alt = '';
      bimg.src = 'assets/icons/school_' + (state.school || 'cangjian') + '.webp';
      bimg.onerror = function () { bimg.remove(); };
      bimg.onload = function () { av.textContent = ''; av.appendChild(bimg); };
    }
    $('stat-silver').textContent = String(state.silver);
    $('stat-chivalry').textContent = String(state.chivalry);
    $('stat-lv').textContent = String(state.lv);
    $('stat-atk').textContent = String(stats.atk);
    $('stat-def').textContent = String(stats.def);
    $('stat-spd').textContent = String(stats.spd);
    $('stat-exp-label').textContent = `${state.exp} / ${need}`;
    $('bar-exp').style.width = Math.min(100, (state.exp / need) * 100) + '%';

    const zone = currentZone();
    $('zone-name').textContent = zone.name;
    $('zone-flavor').textContent = zone.flavor;
    renderCombatBars();
    renderHeroStatus();
    renderStage();
    renderZoneProgress();
    renderLog();
    renderSkillBar();
    syncAutoBtn();
    renderZones();
    renderBag();
    renderHero();
    checkRumors();
    renderQuest();
    renderLore();

    const bh = $('btn-hunt');
    const bs = $('btn-stop');
    if (bh) bh.disabled = !!state.hunting;
    if (bs) bs.disabled = !state.hunting;
  }

  function syncAutoBtn() {
    const btn = $('btn-auto');
    if (!btn || !state) return;
    btn.setAttribute('aria-pressed', state.hunting ? 'true' : 'false');
  }

  function renderSkillBar() {
    const wrap = $('skill-slots');
    if (!wrap || !state) return;
    const skills = heroSkills();
    const now = Date.now();
    if (!state.skillCd) state.skillCd = [0, 0, 0, 0, 0];
    // 初次建立按鈕
    const wkey = (state.school || '') + ':' + skills.length + ':5';
    if (!wrap.dataset.bound || wrap.dataset.school !== wkey) {
      wrap.dataset.bound = '1';
      wrap.dataset.school = wkey;
      wrap.style.gridTemplateColumns = 'repeat(5, 1fr)';
      const short = schoolShort(state.school);
      wrap.innerHTML = [0, 1, 2, 3, 4]
        .map((i) => {
          const sk = skills[i];
          if (!sk && i === 4) {
            return '<button type="button" class="skill-slot locked-slot" data-skill="4" disabled title="Lv.' + MARTIAL_ULT_LV + ' 解鎖絕學"><span class="sk-lock">🔒</span><span class="sk-name sk-lv">' + MARTIAL_ULT_LV + '</span></button>';
          }
          const label = sk ? (sk.short || sk.name) : short;
          const sub = sk ? '' : '<span class="sk-school">' + escapeHtml(short) + '</span>';
          return (
            '<button type="button" class="skill-slot' + (sk && sk.id ? ' has-ico' : '') + '" data-skill="' +
            i +
            '" title="' +
            escapeHtml(sk ? sk.name : label) +
            '">' +
            (sk && sk.id ? '<img class="sk-ico" src="assets/icons/skill_' + sk.id + '.webp" alt="" onerror="this.remove()">' : '') +
            '<span class="sk-name">' +
            escapeHtml(label) +
            '</span>' +
            sub +
            '<span class="cd-mask"></span>' +
            '<span class="cd-text"></span>' +
            '</button>'
          );
        })
        .join('');
      wrap.querySelectorAll('[data-skill]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-skill'));
          if (Audio()) Audio().sfx('click');
          if (!state.hunting) {
            pushLog('先開始掛機或開啟「自動」再施招');
            return;
          }
          if (!skillReady(idx)) return;
          castSkill(idx);
        });
      });
    }
    wrap.querySelectorAll('[data-skill]').forEach((btn) => {
      const idx = Number(btn.getAttribute('data-skill'));
      const until = state.skillCd[idx] || 0;
      const left = Math.max(0, until - now);
      const sk = skills[idx];
      const cdMs = sk ? skillCdMs(sk) : 1;
      const mask = btn.querySelector('.cd-mask');
      const cdText = btn.querySelector('.cd-text');
      if (left > 0) {
        btn.classList.add('on-cd');
        btn.disabled = true;
        if (mask) mask.style.height = Math.min(100, (left / cdMs) * 100) + '%';
        if (cdText) cdText.textContent = Math.ceil(left / 1000);
      } else {
        btn.classList.remove('on-cd');
        btn.disabled = !state.hunting || !sk;
        if (mask) mask.style.height = '0%';
        if (cdText) cdText.textContent = '';
      }
    });
  }

  function challengeReady(zid) {
    const total = (state.zoneKills && state.zoneKills[zid]) || 0;
    const last = (state.zoneChallengeAt && state.zoneChallengeAt[zid]) || 0;
    return total - last >= ZONE_KILL_GOAL;
  }
  function challengeLeft(zid) {
    const total = (state.zoneKills && state.zoneKills[zid]) || 0;
    const last = (state.zoneChallengeAt && state.zoneChallengeAt[zid]) || 0;
    return Math.max(0, ZONE_KILL_GOAL - (total - last));
  }
  function startBossChallenge(zid) {
    const z = ZONES.find((x) => x.id === zid);
    if (!z || !ZONE_RIVALS[zid]) return;
    if (!DEBUG_BOSS && state.lv < z.minLv) return;
    if (!challengeReady(zid) && !DEBUG_BOSS) {
      pushLog('再擊殺 ' + challengeLeft(zid) + ' 隻，才能挑戰「' + ZONE_RIVALS[zid].name + '」');
      renderAll();
      return;
    }
    state.zoneChallengeAt[zid] = (state.zoneKills && state.zoneKills[zid]) || 0;
    if (state.hunting) stopHunt();
    state.zoneId = zid;
    state.mob = null;
    state.mobs = [];
    state.forceRival = true;
    pushLog('向「' + ZONE_RIVALS[zid].name + '」下戰帖！', 'rival');
    startHunt();
  }

  function renderZones() {
    const el = $('panel-zones');
    const now = Date.now();
    refreshRivalDay();
    el.innerHTML =
      '<h3>行走地圖</h3>' +
      ZONES.map((z) => {
        const locked = !DEBUG_BOSS && state.lv < z.minLv;
        const active = state.zoneId === z.id;
        const rival = ZONE_RIVALS[z.id];
        const beaten = !!(state.zoneBossFlags && state.zoneBossFlags[z.id]);
        const used = rivalDailyUsed(z.id);
        const cd = rivalCooldownLeft(z.id, now);
        let rivalLine = '';
        if (rival) {
          const status = beaten
            ? '<span class="badge beaten">已征服</span>'
            : '<span class="badge pending">未破</span>';
          let avail;
          if (locked) avail = '區未開';
          else if (used >= 1) avail = '今日已遇';
          else if (cd > 0) avail = formatDuration(cd);
          else avail = '今日可遇';
          rivalLine =
            '<div class="rival-line">名號：' +
            escapeHtml(rival.name) +
            ' ' +
            status +
            ' · ' +
            avail +
            '</div>';
          if (!locked) {
            const ready = challengeReady(z.id);
            rivalLine +=
              '<div class="rival-line"><button type="button" class="btn small boss-challenge" data-challenge="' + z.id + '" ' +
              (ready ? '' : 'disabled') + '>' +
              (ready ? '⚔ 挑戰首領' : '挑戰首領（再擊殺 ' + challengeLeft(z.id) + '）') +
              '</button></div>';
          }
        }
        return (
          '<div class="zone-item ' +
          (active ? 'active' : '') +
          (beaten ? ' boss-cleared' : '') +
          '">' +
          '<div>' +
          '<strong>' +
          escapeHtml(z.name) +
          '</strong>' +
          '<div class="muted">需 Lv.' +
          z.minLv +
          ' · ' +
          escapeHtml(z.flavor) +
          '</div>' +
          rivalLine +
          '</div>' +
          '<button type="button" class="btn" data-zone="' +
          z.id +
          '" ' +
          (locked ? 'disabled' : '') +
          '>' +
          (active ? '目前' : locked ? '未開' : '前往') +
          '</button></div>'
        );
      }).join('');
    el.querySelectorAll('[data-challenge]').forEach((btn) => {
      btn.addEventListener('click', () => startBossChallenge(btn.getAttribute('data-challenge')));
    });
    el.querySelectorAll('[data-zone]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-zone');
        const z = ZONES.find((x) => x.id === id);
        if (!z || (!DEBUG_BOSS && state.lv < z.minLv)) return;
        if (state.hunting) stopHunt();
        else if (Audio()) Audio().sfx('click');
        state.zoneId = id;
        state.mob = null;
        state.mobs = [];
        if (Audio() && Audio().getCurrentBgm()) Audio().playBgm(worldBgm(id));
        pushLog('來到「' + z.name + '」');
        renderAll();
        save();
      });
    });
  }


  function gearLine(it) {
    const bits = [];
    const sid = setOfItem(it);
    if (sid) bits.push('【' + EQUIP_SETS[sid].name + '】');
    const a = affixText(it);
    if (a) bits.push(a);
    return bits.join(' ');
  }
  function enhBtn(it) {
    if (!it || !it.slot) return '';
    const lv = enhLv(it);
    if (lv >= ENH_MAX) return '<button type="button" class="btn" disabled>強化已滿</button>';
    const pct = Math.round(enhRate(it) * 100);
    const pity = it.enhFail ? '·保底' + it.enhFail + '/' + ENH_PITY_GUARANTEE : '';
    return '<button type="button" class="btn" data-enh="' + it.uid + '"' + (state.silver < enhCost(it) ? ' title="銀兩不足"' : '') +
      '>強化+' + (lv + 1) + '（' + enhCost(it) + '銀·' + pct + '%' + pity + '）</button>';
  }
  function setSummaryHtml() {
    const cnt = activeSets(state);
    let h = '';
    for (const sid of Object.keys(EQUIP_SETS)) {
      const S = EQUIP_SETS[sid];
      const n = cnt[sid] || 0;
      const lines = S.bonus.map((b) => '<div class="muted' + (n >= b.n ? '' : ' set-off') + '">' + b.n + ' 件：' + b.text + (n >= b.n ? ' ✓' : '') + '</div>').join('');
      h += '<div class="set-box"><strong>' + S.name + '（' + n + '/4）</strong>' + lines + '</div>';
    }
    return '<h3 style="margin-top:12px">套裝</h3>' + h;
  }

  function renderBag() {
    const el = $('panel-bag');
    const eq = state.equip;
    const mode = getAutoSellMode();
    const bulkMode = getBulkSellMode();
    const asBar =
      '<div class="autosell-bar">' +
      '<span class="label">自動售出</span>' +
      '<button type="button" class="as-btn' + (mode === 'off' ? ' active' : '') + '" data-autosell="off">關</button>' +
      '<button type="button" class="as-btn' + (mode === 'fan' ? ' active' : '') + '" data-autosell="fan">只賣凡</button>' +
      '<button type="button" class="as-btn' + (mode === 'fan_liang' ? ' active' : '') + '" data-autosell="fan_liang">凡＋良</button>' +
      '<span class="autosell-hint">只處理新掉落；行囊內既有物品不會被自動賣掉。</span>' +
      '</div>' +
      '<div class="bulksell-bar">' +
      '<span class="label">一鍵販售</span>' +
      '<button type="button" class="as-btn' + (bulkMode === 'fan' ? ' active' : '') + '" data-bulksell-mode="fan">凡</button>' +
      '<button type="button" class="as-btn' + (bulkMode === 'fan_liang' ? ' active' : '') + '" data-bulksell-mode="fan_liang">凡＋良</button>' +
      '<button type="button" class="btn primary" id="btn-bulk-sell" title="手動一鍵販售行囊符合品質；名號／珍絕／已裝備不賣">一鍵販售</button>' +
      '<span class="autosell-hint">按了才賣包裡的；名號與珍絕預設不進。</span>' +
      '</div>';
    const eqLines = ['weapon', 'armor', 'boots', 'ring']
      .map((slot) => {
        const labels = { weapon: '兵器', armor: '護甲', boots: '靴履', ring: '飾物' };
        const it = eq[slot];
        if (!it) {
          return '<div class="row"><span>' + labels[slot] + '</span><span>（空）</span></div>';
        }
        const qm = qualityMeta(it.quality);
        return (
          '<div class="row eq-row ' + qm.cls + '"><span class="eq-left">' + iconHtml(it) + '<span class="eq-lab">' + labels[slot] + '</span></span><span class="eq-right">' +
          nameHtml(it) + '<span class="q-badge">' + qm.label + '</span>' +
          (it.bossWeapon ? '<span class="q-badge">首領專屬</span>' : '') +
          (gearLine(it) ? '<div class="muted">' + escapeHtml(gearLine(it)) + '</div>' : '') +
          enhBtn(it) + '</span></div>'
        );
      })
      .join('');
    const bagLines = state.bag.length
      ? state.bag
          .map((it) => {
            const qm = qualityMeta(it.quality);
            const bonus = [
              it.atk ? '攻+' + itemBase(it, 'atk') : '',
              it.def ? '防+' + itemBase(it, 'def') : '',
              it.spd ? '速+' + itemBase(it, 'spd') : '',
            ]
              .filter(Boolean)
              .join(' ');
            const keepTag = it.fromRival || it.keep ? ' · 名號珍藏' : '';
            return (
              '<div class="bag-item ' +
              qm.cls +
              '">' +
              '<div><strong>' +
              iconHtml(it) + nameHtml(it) +
              '</strong><span class="q-badge">' +
              qm.label +
              '</span>' + (it.bossWeapon ? '<span class="q-badge">首領專屬</span>' : '') + '<div class="muted">' +
              escapeHtml((bonus || '雜物') + keepTag) +
              '</div>' + (gearLine(it) ? '<div class="muted">' + escapeHtml(gearLine(it)) + '</div>' : '') + '</div>' +
              '<div>' + (it.slot ? enhBtn(it) : '') +
              (it.slot ? '<button type="button" class="btn" data-eq="' + it.uid + '">裝上</button>' : '') +
              '<button type="button" class="btn" data-sell="' +
              it.uid +
              '" title="手動單件售出（非自動、非一鍵清空）">手動出售</button>' +
              '</div></div>'
            );
          })
          .join('')
      : '<p class="muted">行囊空空，去掛機碰碰運氣。</p>';
    el.innerHTML =
      asBar +
      '<h3>已裝備</h3>' +
      eqLines + setSummaryHtml() +
      '<h3 style="margin-top:12px">行囊</h3>' +
      bagLines;
    el.querySelectorAll('[data-eq]').forEach((b) =>
      b.addEventListener('click', () => equipItem(b.getAttribute('data-eq')))
    );
    el.querySelectorAll('[data-enh]').forEach((b) =>
      b.addEventListener('click', () => enhanceItem(b.getAttribute('data-enh')))
    );
    el.querySelectorAll('[data-sell]').forEach((b) =>
      b.addEventListener('click', () => sellItem(b.getAttribute('data-sell')))
    );
    el.querySelectorAll('[data-autosell]').forEach((b) =>
      b.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        setAutoSell(b.getAttribute('data-autosell'));
      })
    );
    el.querySelectorAll('[data-bulksell-mode]').forEach((b) =>
      b.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        setBulkSellMode(b.getAttribute('data-bulksell-mode'));
      })
    );
    const bulkBtn = el.querySelector('#btn-bulk-sell');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        oneClickSellBag();
      });
    }
  }

  function renderHero() {
    const el = $('panel-hero');
    const school = SCHOOLS.find((s) => s.id === state.school);
    const weapon = WEAPONS.find((w) => w.id === state.weaponPath);
    const stats = buffedStats(calcStats(state));
    if (!state.titleOffer || state.titleOffer.length < 3) rollTitleOffer();
    const owned = state.titlesOwned || [];
    const titleRows = (state.titleOffer || [])
      .map((t) => {
        const has = owned.includes(t);
        return (
          '<button type="button" class="btn title-pick" data-title="' +
          escapeHtml(t) +
          '" ' +
          (has || state.chivalry < CHIVALRY_COST.title ? 'disabled' : '') +
          '>' +
          (has ? '已有·' : '') +
          escapeHtml(t) +
          '（' +
          CHIVALRY_COST.title +
          '俠）</button>'
        );
      })
      .join('');

    const loreBtns = ZONES.map((z) => {
      const rival = ZONE_RIVALS[z.id];
      if (!rival) return '';
      const beaten = !!state.zoneBossFlags[z.id];
      const unlocked = !!state.unlockedLore[rival.loreId];
      let label;
      let disabled = true;
      if (!beaten) {
        label = '先遇上名號對手';
      } else if (unlocked) {
        label = '已聞·' + rival.loreTitle;
      } else if (state.chivalry < CHIVALRY_COST.lore) {
        label = '解鎖「' + rival.loreTitle + '」（俠不足）';
      } else {
        label = '解鎖「' + rival.loreTitle + '」（' + CHIVALRY_COST.lore + '俠）';
        disabled = false;
      }
      return (
        '<button type="button" class="btn lore-buy" data-lore-zone="' +
        z.id +
        '" ' +
        (disabled ? 'disabled' : '') +
        '>' +
        escapeHtml(label) +
        '</button>'
      );
    }).join('');

    const softDisabled = state.chivalry < CHIVALRY_COST.soften;
    const buffLine = state.combatBuff
      ? '當前buff：' +
        (state.combatBuff.label || state.combatBuff.kind) +
        (state.combatBuff.remaining != null ? '（餘' + state.combatBuff.remaining + '場）' : '')
      : state.softenLeft > 0
        ? '軟化中：受創-' + Math.round(state.softenPct * 100) + '%（餘' + state.softenLeft + '場）'
        : '無戰鬥buff';

    el.innerHTML =
      '<h3>俠客檔案</h3>' +
      '<div class="row"><span>名號</span><strong>' +
      escapeHtml(state.name) +
      '</strong></div>' +
      '<div class="row"><span>稱號</span><span>' +
      (state.activeTitle ? escapeHtml(state.activeTitle) : '（無）') +
      '</span></div>' +
      '<div class="row"><span>門派</span><span>' +
      (school ? school.name : '') +
      '</span></div>' +
      '<div class="row"><span>路數</span><span>' +
      (weapon ? weapon.name : '') +
      '</span></div>' +
      '<div class="row"><span>等級</span><span>Lv.' +
      state.lv +
      '（' + realmName(state.lv) + '）' +
      '</span></div>' +
      '<div class="row"><span>戰績</span><span>擊敗 ' +
      state.kills +
      ' 人</span></div>' +
      '<div class="row"><span>綜合</span><span>攻' +
      stats.atk +
      '／防' +
      stats.def +
      '／速' +
      stats.spd +
      '</span></div>' +
      '<div class="row"><span>俠義已花</span><span>' +
      state.chivalrySpent +
      '</span></div>' +
      '<p class="muted" style="margin-top:8px">' +
      escapeHtml(buffLine) +
      '</p>' +
      martialHtml() +
      '<h3 style="margin-top:12px">俠義可花</h3>' +
      '<p class="muted">稱號 ' +
      CHIVALRY_COST.title +
      '／解鎖傳聞 ' +
      CHIVALRY_COST.lore +
      '／軟化 ' +
      CHIVALRY_COST.soften +
      '（不賣戰力）</p>' +
      '<div class="spend-block"><div class="muted">A. 換稱號（三選一輪換）</div><div class="title-grid">' +
      titleRows +
      '</div>' +
      '<button type="button" class="btn ghost" id="btn-reroll-titles">換一批候選</button></div>' +
      '<div class="spend-block"><div class="muted">B. 解鎖傳聞（需該區已破名號）</div><div class="lore-buy-grid">' +
      loreBtns +
      '</div></div>' +
      '<div class="spend-block"><div class="muted">C. 軟化：接下來 8 場受創 -10%</div>' +
      '<button type="button" class="btn" id="btn-soften" ' +
      (softDisabled ? 'disabled' : '') +
      '>消耗 ' +
      CHIVALRY_COST.soften +
      ' 俠義</button></div>' +
      '<p class="muted" style="margin-top:10px">掛機依速度加快出手。地圖 ' +
      ZONES.length +
      ' 區；名號對手日限 1、同區冷卻 4 時。</p>';

    el.querySelectorAll('[data-mpick]').forEach((b) =>
      b.addEventListener('click', () => { const [t, i] = b.getAttribute('data-mpick').split(':'); pickMartial(Number(t), Number(i)); })
    );
    const respecBtn = el.querySelector('#btn-respec');
    if (respecBtn) respecBtn.addEventListener('click', respecMartial);
    el.querySelectorAll('[data-title]').forEach((b) =>
      b.addEventListener('click', () => spendChivalryTitle(b.getAttribute('data-title')))
    );
    const reroll = el.querySelector('#btn-reroll-titles');
    if (reroll)
      reroll.addEventListener('click', () => {
        rollTitleOffer();
        renderAll();
        save();
      });
    el.querySelectorAll('[data-lore-zone]').forEach((b) =>
      b.addEventListener('click', () => spendChivalryLore(b.getAttribute('data-lore-zone')))
    );
    const soft = el.querySelector('#btn-soften');
    if (soft) soft.addEventListener('click', spendChivalrySoften);
  }


  // ===== 2026-10-01 每日任務（每天 05:00 重置，一天 5 個；獎勵 × (1 + 等級/20)） =====
  const DAILY_QUESTS = [
    { id: 'kill', name: '活動筋骨', desc: '擊殺 30 隻怪', goal: 30, silver: 800, exp: 0 },
    { id: 'rival', name: '討個說法', desc: '擊敗 1 次區域名號', goal: 1, silver: 600, exp: 800 },
    { id: 'enh', name: '鍛一把好刀', desc: '強化裝備 3 次（成敗都算）', goal: 3, silver: 1000, exp: 0 },
    { id: 'cast', name: '招式不能生', desc: '施放武學 20 次', goal: 20, silver: 0, exp: 600 },
    { id: 'sell', name: '行囊清一清', desc: '賣出 10 件雜物（手動賣出與一鍵販售）', goal: 10, silver: 500, exp: 0 },
  ];
  const DAILY_BONUS = { name: '今日收工', desc: '五個任務全部領取', silver: 2000, exp: 2000 };
  function uiIco(n, cls) { return '<img class="ui-ico' + (cls ? ' ' + cls : '') + '" src="assets/ui/' + n + '.webp" alt="" onerror="this.remove()">'; }
  const QUEST_ICO = { kill: 'quest_kill', rival: 'quest_boss', enh: 'quest_forge', cast: 'quest_skill', sell: 'quest_sell' };
  const ACH_ICO = { '等級': 'ach_level', '擊殺': 'ach_kill', '名號': 'ach_boss', '強化': 'ach_enhance', '裝備': 'ach_rare', '稱號': 'ach_title' };
  let questSub = 'daily';
  let questSig = '';

  function questDayKey() { return dayKey(Date.now() - 5 * 3600 * 1000); }
  function ensureQuests() {
    if (!state) return null;
    const k = questDayKey();
    if (!state.quests || state.quests.day !== k) {
      state.quests = { day: k, prog: {}, claimed: {}, bonus: false };
    }
    if (!state.quests.prog) state.quests.prog = {};
    if (!state.quests.claimed) state.quests.claimed = {};
    return state.quests;
  }
  function bumpQuest(id, n) {
    const q = ensureQuests();
    if (!q) return;
    q.prog[id] = (q.prog[id] || 0) + (n || 1);
  }
  function questScale() { return 1 + (state.lv || 1) / 20; }
  function questReward(def, mult) {
    const m = mult == null ? questScale() : mult;
    return { silver: Math.floor(def.silver * m), exp: Math.floor(def.exp * m) };
  }
  function questDone(def) {
    const q = ensureQuests();
    return (q.prog[def.id] || 0) >= def.goal;
  }
  function questAllClaimed() {
    const q = ensureQuests();
    return DAILY_QUESTS.every((d) => q.claimed[d.id]);
  }
  function questClaimable() {
    if (!state) return 0;
    const q = ensureQuests();
    let n = achClaimable() + DAILY_QUESTS.filter((d) => questDone(d) && !q.claimed[d.id]).length;
    if (questAllClaimed() && !q.bonus) n += 1;
    return n;
  }
  function giveReward(r, label) {
    if (r.silver) state.silver += r.silver;
    const bits = [];
    if (r.silver) bits.push('銀兩 +' + r.silver);
    if (r.exp) bits.push('經驗 +' + r.exp);
    pushLog('領取〈' + label + '〉：' + bits.join('，'), 'win');
    if (r.exp) gainExp(r.exp);
    if (Audio()) Audio().sfx('drop');
  }
  function claimQuest(id) {
    const q = ensureQuests();
    if (id === 'bonus') {
      if (q.bonus || !questAllClaimed()) return;
      q.bonus = true;
      giveReward(questReward(DAILY_BONUS), DAILY_BONUS.name);
      pushEventLog('今天沒白跑。', 'event');
    } else {
      const def = DAILY_QUESTS.find((d) => d.id === id);
      if (!def || q.claimed[id] || !questDone(def)) return;
      q.claimed[id] = true;
      giveReward(questReward(def), def.name);
    }
    questSig = '';
    renderAll();
    save();
  }
  function questResetText() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(5, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const ms = next - now;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return '距重置 ' + h + ' 小時 ' + m + ' 分';
  }
  function renderQuest(force) {
    const el = $('panel-quest');
    const tab = $('tab-quest');
    if (!el || !state) return;
    const q = ensureQuests();
    const dot = questClaimable();
    if (tab) tab.classList.toggle('has-dot', dot > 0);
    const sig = [questSub, q.day, state.lv, (state.rumors || []).length, q.bonus ? 1 : 0, DAILY_QUESTS.map((d) => Math.min(d.goal, q.prog[d.id] || 0) + (q.claimed[d.id] ? 'c' : '')).join(','), achSig(), stSig()].join('|');
    if (!force && sig === questSig) {
      const t = el.querySelector('#quest-reset');
      if (t) t.textContent = questResetText();
      return;
    }
    questSig = sig;
    let body = '';
    if (questSub === 'daily') {
      const rows = DAILY_QUESTS.map((d) => {
        const p = Math.min(d.goal, q.prog[d.id] || 0);
        const r = questReward(d);
        const rw = [r.silver ? r.silver + ' 銀兩' : '', r.exp ? r.exp + ' 經驗' : ''].filter(Boolean).join(' + ');
        const done = p >= d.goal;
        const claimed = !!q.claimed[d.id];
        return '<div class="quest-row' + (claimed ? ' claimed' : '') + '">' + uiIco(QUEST_ICO[d.id], 'q') + (claimed ? uiIco('badge_done', 'done') : '') +
          '<div class="quest-main"><strong>〈' + escapeHtml(d.name) + '〉</strong> <span class="muted">' + escapeHtml(d.desc) + '</span>' +
          '<div class="bar-wrap thin quest-bar"><div class="bar" style="width:' + (p / d.goal * 100) + '%"></div></div>' +
          '<div class="quest-meta"><span>' + p + ' / ' + d.goal + '</span><span class="muted">獎勵：' + rw + '</span></div></div>' +
          '<button type="button" class="btn' + (done && !claimed ? ' primary' : '') + '" data-claim="' + d.id + '"' + (done && !claimed ? '' : ' disabled') + '>' + (claimed ? '已領取' : '領取') + '</button></div>';
      }).join('');
      const allOk = questAllClaimed();
      const br = questReward(DAILY_BONUS);
      body = '<div class="quest-head"><span class="muted">每天早上 5 點重置，獎勵隨等級放大（×' + questScale().toFixed(2) + '）</span><span id="quest-reset" class="muted">' + questResetText() + '</span></div>' +
        rows +
        '<div class="quest-row bonus' + (q.bonus ? ' claimed' : '') + '">' + uiIco('quest_alldone', 'q') + (q.bonus ? uiIco('badge_done', 'done') : '') + '<div class="quest-main"><strong>〈' + DAILY_BONUS.name + '〉</strong> <span class="muted">' + DAILY_BONUS.desc + '</span>' +
        '<div class="quest-meta"><span class="muted">獎勵：' + br.silver + ' 銀兩 + ' + br.exp + ' 經驗</span></div></div>' +
        '<button type="button" class="btn' + (allOk && !q.bonus ? ' primary' : '') + '" data-claim="bonus"' + (allOk && !q.bonus ? '' : ' disabled') + '>' + (q.bonus ? '已領取' : '領取') + '</button></div>';
    } else if (questSub === 'story') {
      body = stQuestHtml();
    } else if (questSub === 'rumor') {
      body = renderRumorBody();
    } else {
      body = renderAchBody();
    }
    el.innerHTML = '<div class="subtabs"><button type="button" class="subtab' + (questSub === 'daily' ? ' active' : '') + '" data-sub="daily">' + uiIco('tab_quest') + '每日任務</button>' +
      '<button type="button" class="subtab' + (questSub === 'ach' ? ' active' : '') + '" data-sub="ach">' + uiIco('tab_achieve') + '成就</button>' +
      '<button type="button" class="subtab' + (questSub === 'rumor' ? ' active' : '') + '" data-sub="rumor">' + uiIco('tab_rumor') + '傳聞錄</button>' +
      '<button type="button" class="subtab' + (questSub === 'story' ? ' active' : '') + '" data-sub="story">卷宗</button></div>' + body;
    el.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => {
      if (Audio()) Audio().sfx('click');
      questSub = b.getAttribute('data-sub');
      renderQuest(true);
    }));
    el.querySelectorAll('[data-claim]').forEach((b) => b.addEventListener('click', () => claimQuest(b.getAttribute('data-claim'))));
    el.querySelectorAll('[data-ach]').forEach((b) => b.addEventListener('click', () => claimAch(b.getAttribute('data-ach'))));
  }
  // ===== 傳聞錄（事件觸發解鎖，最多 50 則；名號傳聞沿用 loreTitle） =====
  const RUMORS = {
    enh1: '聽說有人在鐵匠鋪敲了一夜，火星濺到天亮。',
    enh5: '有人把兵器鍛到 +5，劍鞘裡開始有聲音。',
    enh10: '刃上光華隱隱，連掌櫃都不敢收那把刀。',
    pity: '鐵匠搖頭說「天意」，下一爐卻成了。',
    zhen: '行囊裡多了件好東西，賣不賣，是個問題。',
    jue: '傳說這件兵器，只在最安靜的夜裡出現過。',
    exhaust: '有人倒在路邊，歇了三息，又笑著站了起來。',
    rival1: '馬三刀的酒壺空了，江湖裡少了一個說話大聲的人。',
    rival5: '半個江湖都在傳你的名字，另外半個在打聽。',
    rival10: '十地名號盡落你手，茶館先生把這段書，多收了兩文錢。',
    set: '兩件舊物湊在一起，竟像是本來就屬於同一個人。',
    lv50: '那一天的雲棧，據說連風都停了片刻。',
  };
  const RUMOR_ORDER = ['enh1', 'enh5', 'enh10', 'pity', 'zhen', 'jue', 'exhaust', 'rival1', 'rival5', 'rival10', 'set', 'lv50'];
  const RUMOR_HINT = {
    enh1: '強化成功一次後聞得', enh5: '把裝備強化到 +5 後聞得', enh10: '把裝備強化到 +10 後聞得', pity: '強化連敗後觸發保底聞得',
    zhen: '首次得到「珍」品後聞得', jue: '首次得到「絕」品後聞得', exhaust: '首次力竭後聞得', rival1: '擊敗第 1 個名號後聞得',
    rival5: '擊敗 5 個名號後聞得', rival10: '十個名號全部擊敗後聞得', set: '湊齊套裝 2 件效果後聞得', lv50: '突破 Lv.50 後聞得',
  };
  function addRumor(id) {
    if (!state || !RUMORS[id]) return;
    if (!Array.isArray(state.rumors)) state.rumors = [];
    if (state.rumors.some((r) => r.id === id)) return;
    state.rumors.unshift({ t: Date.now(), id: id });
    state.rumors = state.rumors.slice(0, 50);
    pushLog('📜 新傳聞：' + RUMORS[id], 'rival');
    questSig = '';
  }
  function checkRumors() {
    if (!state) return;
    const n = rivalCount();
    if (n >= 1) addRumor('rival1');
    if (n >= 5) addRumor('rival5');
    if (n >= 10) addRumor('rival10');
    if (state.lv >= 50) addRumor('lv50');
    const c = activeSets(state);
    if (Object.keys(c).some((k) => c[k] >= 2)) addRumor('set');
  }
  function renderRumorBody() {
    const got = (state.rumors || []);
    const have = new Set(got.map((r) => r.id));
    const list = got.map((r) => {
      const d = new Date(r.t);
      return '<div class="rumor-line"><span class="muted">' + (d.getMonth() + 1) + '/' + d.getDate() + '</span> ' + escapeHtml(RUMORS[r.id] || '') + '</div>';
    }).join('');
    const locked = RUMOR_ORDER.filter((id) => !have.has(id)).map((id) => '<div class="rumor-line locked">？？？<span class="muted">（' + RUMOR_HINT[id] + '）</span></div>').join('');
    return '<div class="quest-head"><span class="muted">已聞 ' + got.length + ' / ' + RUMOR_ORDER.length + ' 則（最多保留最新 50 則）；名號傳聞請見「閒談」頁</span></div>' +
      (list || '<p class="muted">尚未聽聞任何傳聞，多走動走動。</p>') + locked;
  }

  // ===== 成就（17 個；無對應系統的獎勵改為銀兩） =====
  function achStats() {
    if (!state.ach || typeof state.ach !== 'object') state.ach = {};
    const a = state.ach;
    if (!a.claimed) a.claimed = {};
    ['enhOk', 'maxEnh', 'pityHit', 'gotZhen', 'gotJue', 'setHit', 'standUps'].forEach((k) => { if (typeof a[k] !== 'number') a[k] = 0; });
    return a;
  }
  function rivalCount() { return Object.keys(state.zoneBossFlags || {}).filter((k) => state.zoneBossFlags[k]).length; }
  const ACHS = [
    { id: 'a1', cat: '等級', name: '初出茅廬', desc: '等級達到 5', goal: 5, val: () => state.lv, silver: 500 },
    { id: 'a2', cat: '等級', name: '小有名氣', desc: '等級達到 20', goal: 20, val: () => state.lv, silver: 3000 },
    { id: 'a3', cat: '等級', name: '江湖老手', desc: '等級達到 50', goal: 50, val: () => state.lv, silver: 2000, note: '（洗武學券未開放，改發銀兩）' },
    { id: 'a4', cat: '擊殺', name: '百人斬', desc: '累計擊殺 100 隻', goal: 100, val: () => state.kills, silver: 1000 },
    { id: 'a5', cat: '擊殺', name: '千人斬', desc: '累計擊殺 1000 隻', goal: 1000, val: () => state.kills, silver: 2000, note: '（保底符未開放，改發銀兩）' },
    { id: 'a6', cat: '擊殺', name: '萬人敵', desc: '累計擊殺 10000 隻', goal: 10000, val: () => state.kills, title: '萬人敵' },
    { id: 'a7', cat: '名號', name: '討債人', desc: '擊敗第 1 個名號', goal: 1, val: rivalCount, silver: 2000 },
    { id: 'a8', cat: '名號', name: '半壁江湖', desc: '擊敗 5 個名號', goal: 5, val: rivalCount, title: '半壁' },
    { id: 'a9', cat: '名號', name: '十地俱服', desc: '十個區域名號全部擊敗', goal: 10, val: rivalCount, title: '十地俱服' },
    { id: 'a10', cat: '強化', name: '試試手氣', desc: '強化成功 1 次', goal: 1, val: () => achStats().enhOk, silver: 300 },
    { id: 'a11', cat: '強化', name: '鐵杵成針', desc: '強化到 +5', goal: 5, val: () => achStats().maxEnh, title: '鐵杵' },
    { id: 'a12', cat: '強化', name: '刃上光華', desc: '強化到 +10', goal: 10, val: () => achStats().maxEnh, title: '光華' },
    { id: 'a13', cat: '強化', name: '福禍相依', desc: '強化連敗 4 次後觸發保底', goal: 1, val: () => achStats().pityHit, silver: 500 },
    { id: 'a14', cat: '裝備', name: '珍藏', desc: '得到 1 件「珍」品質裝備', goal: 1, val: () => achStats().gotZhen + achStats().gotJue, silver: 1000 },
    { id: 'a15', cat: '裝備', name: '絕世', desc: '得到 1 件「絕」品質裝備', goal: 1, val: () => achStats().gotJue, title: '藏鋒' },
    { id: 'a16', cat: '裝備', name: '成套', desc: '湊齊任一套裝 2 件效果', goal: 1, val: () => { const c = activeSets(state); if (Object.keys(c).some((k) => c[k] >= 2)) achStats().setHit = 1; return achStats().setHit; }, silver: 2000 },
    { id: 'a17', cat: '稱號', name: '力竭而起', desc: '力竭後起身 10 次', goal: 10, val: () => achStats().standUps, title: '不倒' },
  ];
  function achDone(d) { return d.val() >= d.goal; }
  function achClaimed(d) { return !!achStats().claimed[d.id]; }
  function achClaimable() { return state ? ACHS.filter((d) => achDone(d) && !achClaimed(d)).length : 0; }
  function achSig() { return ACHS.map((d) => Math.min(d.goal, d.val()) + (achClaimed(d) ? 'c' : '')).join(','); }
  function achRewardText(d) { return d.title ? '稱號「' + d.title + '」' : d.silver + ' 銀兩'; }
  function claimAch(id) {
    const d = ACHS.find((x) => x.id === id);
    if (!d || !achDone(d) || achClaimed(d)) return;
    achStats().claimed[id] = true;
    if (d.title) {
      if (!state.titlesOwned.includes(d.title)) state.titlesOwned.push(d.title);
      pushLog('成就〈' + d.name + '〉達成，獲得稱號「' + d.title + '」', 'rival');
    } else {
      state.silver += d.silver;
      pushLog('成就〈' + d.name + '〉達成，銀兩 +' + d.silver, 'rival');
    }
    if (Audio()) Audio().sfx('levelup');
    questSig = '';
    renderAll();
    save();
  }
  function renderAchBody() {
    const done = ACHS.filter(achClaimed).length;
    let cat = '';
    const rows = ACHS.map((d) => {
      const head = d.cat !== cat ? '<div class="ach-cat">' + d.cat + '</div>' : '';
      cat = d.cat;
      const p = Math.min(d.goal, d.val());
      const ok = p >= d.goal;
      const cl = achClaimed(d);
      return head + '<div class="quest-row' + (cl ? ' claimed' : '') + '">' + uiIco(ACH_ICO[d.cat], 'q') + (cl ? uiIco('badge_done', 'done') : '') + '<div class="quest-main"><strong>〈' + escapeHtml(d.name) + '〉</strong> <span class="muted">' + escapeHtml(d.desc) + '</span>' +
        (d.goal > 1 ? '<div class="bar-wrap thin quest-bar"><div class="bar" style="width:' + (p / d.goal * 100) + '%"></div></div>' : '') +
        '<div class="quest-meta"><span>' + (d.goal > 1 ? p + ' / ' + d.goal : (ok ? '已達成' : '未達成')) + '</span><span class="muted">獎勵：' + achRewardText(d) + (d.note ? d.note : '') + '</span></div></div>' +
        '<button type="button" class="btn' + (ok && !cl ? ' primary' : '') + '" data-ach="' + d.id + '"' + (ok && !cl ? '' : ' disabled') + '>' + (cl ? '已領取' : '領取') + '</button></div>';
    }).join('');
    return '<div class="quest-head"><span class="muted">已領取 ' + done + ' / ' + ACHS.length + '</span></div>' + rows;
  }

  function loreOldHtml() {
    const rivalLore = ZONES.map((z) => {
      const rival = ZONE_RIVALS[z.id];
      if (!rival) return '';
      const open = !!(state.unlockedLore && state.unlockedLore[rival.loreId]);
      if (open) {
        return (
          '<p><strong>' +
          escapeHtml(rival.loreTitle) +
          '</strong><br/>' +
          escapeHtml(rival.loreBody) +
          '<br/><span class="muted">——擊敗「' +
          escapeHtml(rival.name) +
          '」後聞得</span></p>'
        );
      }
      const beaten = !!state.zoneBossFlags[z.id];
      const hint = beaten
        ? '名號已破，請至俠客頁花俠義解鎖'
        : '？？？（先擊敗「' + escapeHtml(z.name) + '」名號對手）';
      return (
        '<p class="lore-locked"><strong>' +
        escapeHtml(rival.loreTitle) +
        '</strong><br/>' +
        hint +
        '</p>'
      );
    }).join('');

    const events = (state.eventLog || [])
      .slice(0, 12)
      .map((x) => {
        const d = new Date(x.t);
        const t =
          d.getMonth() +
          1 +
          '/' +
          d.getDate() +
          ' ' +
          String(d.getHours()).padStart(2, '0') +
          ':' +
          String(d.getMinutes()).padStart(2, '0');
        return '<div class="event-line"><span class="muted">' + t + '</span> ' + escapeHtml(x.msg) + '</div>';
      })
      .join('');

    return '<div class="lore-old">' +
      LORE.map(
        (x) => '<p><strong>' + escapeHtml(x.title) + '</strong><br/>' + escapeHtml(x.body) + '</p>'
      ).join('') +
      '<h3 style="margin-top:12px">名號傳聞</h3>' +
      rivalLore +
      '<h3 style="margin-top:12px">閒談日誌</h3>' +
      (events || '<p class="muted">尚無事件紀錄。</p>') +
      '<p class="muted">內容為原創閑話，致敬武俠氛圍，不引用小說原文。</p></div>';
  }
  // ===================== 章回劇情系統（資料見 story-data.js） =====================
  const ST = window.JH_STORY || null;
  const WHO_NAME = { qinghe: '沈青河', old: '獨臂老人', woman: '白衣女子', bf: '黑衣人' };
  function stNorm(s) {
    if (!s || typeof s !== 'object') s = {};
    ['flags', 'rel', 'did', 'traits', 'evDone'].forEach((k) => { if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {}; });
    ['completed', 'unlocked', 'history', 'intel', 'items', 'people'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = []; });
    if (typeof s.chapter !== 'number') s.chapter = 1;
    if (!s.unlocked.length) s.unlocked = [1];
    if (typeof s.cur !== 'string') s.cur = null;
    if (typeof s.entered !== 'string') s.entered = '';
    if (typeof s.phase !== 'string') s.phase = '';
    if (typeof s.evCool !== 'number') s.evCool = 0;
    if (typeof s.waitUntil !== 'number') s.waitUntil = 0;
    if (typeof s.offlineEvents !== 'number') s.offlineEvents = 0;
    if (!s.battle || typeof s.battle !== 'object') s.battle = null;
    s.open = !!s.open;
    s.started = !!s.started;
    s.stopAfter = !!s.stopAfter;
    return s;
  }
  function stEnsure() {
    if (!state || !ST) return null;
    state.story = stNorm(state.story);
    return state.story;
  }
  function stBattleOn() { return !!(state && state.story && state.story.battle); }
  function stCtx() {
    const s = stEnsure();
    return {
      f: (k) => !!s.flags[k],
      r: (k) => s.rel[k] || 0,
      did: (k) => !!s.did[k],
      has: (k) => s.intel.indexOf(k) >= 0,
      t: (k) => s.traits[k] || 0,
      n: Object.keys(s.did).length,
    };
  }
  function stRelWord(v) {
    if (v <= -60) return '死敵';
    if (v <= -20) return '敵視';
    if (v >= 60) return '親近';
    if (v >= 30) return '信任';
    if (v >= 10) return '略有好感';
    return '陌生';
  }
  function stGrantGear(key) {
    const g = ST.GEAR[key];
    if (!g) return;
    const has = state.bag.concat(Object.keys(state.equip).map((k) => state.equip[k])).some((x) => x && x.id === g.id);
    if (has) return;
    state.bag.push({
      uid: g.id + '-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6),
      id: g.id, name: g.name, slot: g.slot, atk: g.atk || 0, def: g.def || 0, spd: g.spd || 0,
      quality: 'liang', keep: true, fromRival: false, enh: 0, affixes: [], story: true,
    });
    pushLog('得到劇情裝備「' + g.name + '」', 'loot q-liang');
  }
  function stApply(e) {
    if (!e) return;
    const s = stEnsure();
    (e.f || []).forEach((k) => { s.flags[k] = true; });
    Object.keys(e.r || {}).forEach((k) => { s.rel[k] = Math.max(-100, Math.min(100, (s.rel[k] || 0) + e.r[k] * 10)); });
    Object.keys(e.t || {}).forEach((k) => { s.traits[k] = (s.traits[k] || 0) + e.t[k]; });
    (e.intel || []).forEach((k) => {
      if (s.intel.indexOf(k) < 0) { s.intel.push(k); const it = ST.INTEL[k]; if (it) pushEventLog('得知情報：' + it[0], 'story'); }
    });
    (e.item || []).forEach((k) => { if (s.items.indexOf(k) < 0) s.items.push(k); });
    (e.gear || []).forEach(stGrantGear);
    (e.people || []).forEach((k) => { if (s.people.indexOf(k) < 0) s.people.push(k); });
    if (e.silver) state.silver = Math.max(0, state.silver + e.silver);
    if (e.chivalry) state.chivalry += e.chivalry;
    if (e.heal) { ensureVitals(); state.hp = heroMaxHp(state); }
    if (e.phase) {
      s.phase = e.phase;
      if (e.phase === 'waiting') s.waitUntil = state.kills + 30;
    }
    if (e.complete && s.completed.indexOf(e.complete) < 0) s.completed.push(e.complete);
  }
  function stHist(place, text) {
    const s = stEnsure();
    s.history.push({ t: Date.now(), ch: s.chapter, place: place || '', text });
    if (s.history.length > 80) s.history = s.history.slice(-80);
  }
  const stRes = (v, c) => (typeof v === 'function' ? v(c) : v);
  const stSfx = () => { if (Audio()) Audio().sfx('click'); };

  function stModal(fn) {
    enqueueModal(() => {
      if (modalOpen) { modalQueue.push(() => stModal(fn)); return; }
      modalOpen = true;
      document.body.classList.add('modal-open');
      fn();
    });
  }
  function stPaint(inner, bind) {
    const root = ensureModalRoot();
    root.innerHTML = '<div class="modal-backdrop st-backdrop" role="dialog" aria-modal="true"><div class="modal-card st-card">' + inner + '</div></div>';
    const card = root.querySelector('.st-card');
    if (bind) bind(card);
  }
  function stSceneHtml(bg, place, img) {
    if (!bg && !place && !img) return '';
    return '<div class="st-scene' + (bg ? '' : ' st-nobg') + '">' +
      (bg ? '<div class="st-bg" style="background-image:url(assets/story/' + bg + '.webp)"></div>' : '') +
      (place ? '<span class="st-place">' + escapeHtml(place) + '</span>' : '') +
      (img ? '<img class="st-portrait" src="assets/story/' + img + '.webp" alt="" onerror="this.remove()">' : '') + '</div>';
  }
  function stBtns(btns) {
    return btns.map((b, k) => '<button type="button" class="btn ' + (b.cls || 'primary') + '" data-b="' + k + '"' + (b.dis ? ' disabled' : '') + '>' + escapeHtml(b.label) + '</button>').join('');
  }
  function stBindBtns(card, btns) {
    card.querySelectorAll('[data-b]').forEach((el) => {
      el.addEventListener('click', () => { stSfx(); const b = btns[+el.getAttribute('data-b')]; if (b && b.fn) b.fn(); });
    });
  }
  function stDraw(m, i) {
    const pg = m.pages[i];
    const p = typeof pg === 'string' ? { t: pg } : pg;
    const last = i >= m.pages.length - 1;
    const img = p.who && ST.PORTRAIT[p.who] ? ST.PORTRAIT[p.who] : '';
    const btns = last ? m.buttons : [{ label: '繼續', fn: () => stDraw(m, i + 1) }];
    const inner = stSceneHtml(m.bg, m.place, img) +
      '<div class="st-body">' + (p.who && WHO_NAME[p.who] ? '<div class="st-who">' + WHO_NAME[p.who] + '</div>' : '') +
      '<div class="st-text' + (m.center ? ' st-center' : '') + '">' + escapeHtml(p.t || '') + '</div></div>' +
      '<div class="st-foot">' + (m.pages.length > 1 ? '<span class="st-pg">' + (i + 1) + ' / ' + m.pages.length + '</span>' : '') + stBtns(btns) + '</div>';
    stPaint(inner, (card) => stBindBtns(card, btns));
  }
  function stClose() {
    const s = stEnsure();
    closeModal();
    if (s && s.stopAfter && !s.cur && !s.battle) {
      s.stopAfter = false;
      if (state.hunting) stopHunt();
    }
    save();
    renderAll();
  }
  function stResume() {
    const s = stEnsure();
    if (!s || !s.cur || s.battle) return;
    stModal(() => stGoto(s.cur));
  }
  function stBegin() {
    const s = stEnsure();
    s.started = true; s.cur = 'prologue'; s.entered = ''; s.open = true;
    save();
    stResume();
  }
  function stGoto(id) {
    const s = stEnsure();
    if (!id || id === '__close') { s.cur = null; s.open = false; stClose(); return; }
    s.cur = id; s.open = true;
    if (id === 'zx_hub') { s.entered = id; save(); stDrawHub(); return; }
    const n = ST.NODES[id];
    if (!n) { s.cur = null; stClose(); return; }
    if (s.entered !== id) { stApply(n.e); s.entered = id; }
    save();
    const c = stCtx();
    const pages = (typeof n.pages === 'function' ? n.pages(c) : n.pages).concat(n.tail || []);
    let buttons;
    if (n.battle) {
      buttons = [{ label: n.battle.label || '戰鬥開始', fn: () => stStartBattle(n) }];
    } else if (n.choices) {
      buttons = n.choices.filter((ch) => !ch.show || ch.show(c)).map((ch) => ({ label: ch.label, fn: () => stChoose(n, ch) }));
    } else {
      const nx = typeof n.next === 'function' ? n.next(c) : n.next;
      buttons = [{ label: '繼續', fn: () => stGoto(nx) }];
    }
    stDraw({ bg: n.bg, place: n.place, center: n.center, pages, buttons }, 0);
  }
  function stChoose(n, ch) {
    const s = stEnsure();
    const c0 = stCtx();
    const e = ch.eFn ? ch.eFn(c0) : ch.e;
    const res = ch.resFn ? ch.resFn(c0) : stRes(ch.res, c0);
    stApply(e);
    stHist(n.place, n.place ? n.place + '：' + ch.label : ch.label);
    const c = stCtx();
    const nx = ch.next !== undefined ? (typeof ch.next === 'function' ? ch.next(c) : ch.next) : (typeof n.next === 'function' ? n.next(c) : n.next);
    s.cur = (!nx || nx === '__close') ? null : nx;
    save();
    if (res && res.length) {
      stDraw({ bg: n.bg, place: n.place, pages: res, buttons: [{ label: '繼續', fn: () => stGoto(nx) }] }, 0);
    } else stGoto(nx);
  }

  // ---- 戰鬥節點（沿用既有自動戰鬥） ----
  function stStartBattle(n) {
    const s = stEnsure();
    s.battle = { count: n.battle.count, left: n.battle.count, name: n.battle.name, win: n.battle.win, lose: n.battle.lose };
    s.cur = null; s.open = false;
    const was = !!state.hunting;
    s.stopAfter = !was;
    save();
    closeModal();
    state.mobs = []; state.mob = null;
    if (!was) {
      startHunt();
      if (!state.hunting) { state.zoneId = 'inn'; startHunt(); }
    } else ensureMobs();
    pushLog('【劇情】' + n.battle.name + '攔住了去路！', 'rival');
    renderAll();
    save();
  }
  function stSpawnBattleMobs() {
    const s = state && state.story;
    if (!s || !s.battle || s.battle.left <= 0) return false;
    const zone = currentZone();
    const k = zone.mobs.length;
    const avg = zone.mobs.reduce((a, m) => ({ hp: a.hp + m.hp, atk: a.atk + m.atk, def: a.def + m.def, exp: a.exp + m.exp, s0: a.s0 + m.silver[0], s1: a.s1 + m.silver[1] }), { hp: 0, atk: 0, def: 0, exp: 0, s0: 0, s1: 0 });
    const base = { name: s.battle.name, hp: avg.hp / k, atk: avg.atk / k * 1.1, def: avg.def / k, exp: avg.exp / k * 1.5, silver: [Math.floor(avg.s0 / k), Math.floor(avg.s1 / k) + 3] };
    const scale = (1 + Math.max(0, state.lv - zone.minLv) * 0.05) * 0.75;
    const pack = [];
    const cnt = Math.min(3, s.battle.left);
    for (let i = 0; i < cnt; i++) {
      const m = buildMobFromBase(base, scale, { zoneId: zone.id, glyph: '羽', look: 'bandit', desc: '黑羽盟的追兵。' });
      m.uid += 's' + i;
      m.storyBattle = true;
      pack.push(m);
    }
    state.mobs = pack;
    syncPrimaryMob();
    return true;
  }
  function stOnKill(mob) {
    const s = stEnsure();
    if (!s) return;
    if (mob && mob.storyBattle && s.battle) {
      s.battle.left -= 1;
      if (s.battle.left <= 0) {
        s.cur = s.battle.win; s.open = true; s.entered = ''; s.battle = null;
        save();
        setTimeout(stResume, 900);
      }
      return;
    }
    stCheck();
  }
  function stOnLose() {
    const s = stEnsure();
    if (!s || !s.battle) return;
    s.cur = s.battle.lose; s.open = true; s.entered = ''; s.battle = null;
    save();
    setTimeout(stResume, 1200);
  }
  // 三日之期（以擊敗數計）到了 → 自動帶出醉仙樓
  function stCheck() {
    const s = stEnsure();
    if (!s || s.cur || s.battle || s.phase !== 'waiting') return;
    if (state.kills < s.waitUntil) return;
    s.cur = 'zx_enter'; s.open = true; s.entered = '';
    pushEventLog('三日之期已到，醉仙樓之約。', 'story');
    save();
    setTimeout(stResume, 700);
  }

  // ---- 醉仙樓 hub ----
  let stArea = '一樓';
  function stDrawHub(area) {
    const s = stEnsure();
    if (area) stArea = area;
    const c = stCtx();
    const acts = ST.ZX_ACTIONS.filter((a) => a.area === stArea);
    const need = 3;
    const ready = c.n >= need;
    const btns = [
      { label: ready ? '赴約（後院）' : '再留意幾處（' + c.n + ' / ' + need + '）', fn: () => stGoto('qh_meet'), dis: !ready },
      { label: '先離開', cls: 'ghost', fn: () => { s.open = false; save(); stClose(); } },
    ];
    const inner = stSceneHtml('scene_zuixian', '醉仙樓', '') +
      '<div class="st-body"><div class="st-hub-tabs">' + ST.ZX_AREAS.map((a) => '<button type="button" class="subtab' + (a === stArea ? ' active' : '') + '" data-area="' + a + '">' + a + '</button>').join('') + '</div>' +
      '<div class="st-acts">' + acts.map((a) => '<button type="button" class="btn st-act' + (s.did[a.id] ? ' seen' : '') + '" data-act="' + a.id + '">' + (s.did[a.id] ? '✓ ' : '') + escapeHtml(a.label) + '</button>').join('') + '</div>' +
      '<div class="muted st-hint">' + (ready ? '你已摸清不少線索，也可以隨時赴約。' : '先在樓裡走走看看，至少留意三處再赴約。') + '</div></div>' +
      '<div class="st-foot">' + stBtns(btns) + '</div>';
    stPaint(inner, (card) => {
      stBindBtns(card, btns);
      card.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { stSfx(); stDrawHub(b.getAttribute('data-area')); }));
      card.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { stSfx(); stDoAction(b.getAttribute('data-act')); }));
    });
  }
  function stDoAction(id) {
    const s = stEnsure();
    const a = ST.ZX_ACTIONS.find((x) => x.id === id);
    if (!a) return;
    const c0 = stCtx();
    const back = [{ label: '返回', fn: () => stDrawHub() }];
    if (a.cost && !s.did[id] && state.silver < a.cost) {
      stDraw({ bg: 'scene_zuixian', place: '醉仙樓・' + a.area, pages: ['你摸了摸錢袋，銀兩不夠。'], buttons: back }, 0);
      return;
    }
    const pages = typeof a.pages === 'function' ? a.pages(c0) : a.pages;
    if (!s.did[id]) {
      const e = a.eFn ? a.eFn(c0) : a.e;
      stApply(e);
      s.did[id] = true;
      stHist('醉仙樓', '醉仙樓・' + a.area + '：' + a.label.replace(/（.*?）/, ''));
      save();
    }
    stDraw({ bg: 'scene_zuixian', place: '醉仙樓・' + a.area, pages, buttons: back }, 0);
  }

  // ---- 掛機江湖事件 ----
  function stMaybeEvent(now) {
    const s = stEnsure();
    if (!s || !s.flags.qh_leave_done || s.battle || modalOpen) return;
    if (!s.evCool) { s.evCool = now + 4 * 60000; return; }
    if (now < s.evCool) return;
    if (Math.random() > 0.03) return;
    const c = stCtx();
    const pool = ST.EVENTS.filter((ev) => (ev.id === 'ev_fight' || !s.evDone[ev.id]) && ev.when(c));
    if (!pool.length) { s.evCool = now + 5 * 60000; return; }
    s.evCool = now + (12 + Math.random() * 10) * 60000;
    stOpenEvent(pick(pool));
  }
  function stOpenEvent(ev) {
    const s = stEnsure();
    stModal(() => {
      const c = stCtx();
      const pages = typeof ev.pages === 'function' ? ev.pages(c) : ev.pages;
      const btns = ev.choices.map((ch) => ({
        label: ch.label,
        cls: 'primary',
        fn: () => {
          const c1 = stCtx();
          const e = ch.eFn ? ch.eFn(c1) : ch.e;
          const res = stRes(ch.res, c1);
          stApply(e);
          s.evDone[ev.id] = true;
          stHist('江湖事件', ev.title + '：' + ch.label);
          pushEventLog('江湖事件「' + ev.title + '」：' + ch.label, 'story');
          save();
          stDraw({ place: ev.title, pages: [res || '你繼續趕路。'], buttons: [{ label: '收下', fn: stClose }] }, 0);
        },
      }));
      stDraw({ place: '江湖事件・' + ev.title, pages: pages || [''], buttons: btns }, 0);
    });
  }
  function stOffline(usedMs) {
    const s = stEnsure();
    if (!s || !s.flags.qh_leave_done || usedMs < 20 * 60000) return null;
    const n = Math.min(6, Math.floor(usedMs / 3600000) + 1);
    const pool = ST.OFFLINE_LINES.slice();
    const lines = [];
    for (let i = 0; i < Math.min(3, n) && pool.length; i++) lines.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    s.offlineEvents += n;
    lines.forEach((l) => pushEventLog(l, 'story'));
    return { n, lines };
  }

  // ---- 介面：江湖閒談 / 卷宗 ----
  let loreSub = 'now';
  function stLeftKills() {
    const s = stEnsure();
    return Math.max(0, s.waitUntil - state.kills);
  }
  function stNowHtml() {
    const s = stEnsure();
    const ch = ST.CHAPTERS[s.chapter];
    let status = '';
    let act = '';
    if (s.battle) status = '眼前正有一場惡戰，先打完再說。';
    else if (s.cur) { status = '故事停在半途，繼續吧。'; act = '<button type="button" class="btn primary full" data-st="resume">繼續故事</button>'; }
    else if (!s.started && !s.flags.qh_leave_done) { status = '一段江湖故事正等著你。'; act = '<button type="button" class="btn primary full" data-st="begin">踏入江湖（序章）</button>'; }
    else if (s.phase === 'waiting') status = '「三日後，醉仙樓。」還需擊敗 ' + stLeftKills() + ' 名對手，約定之日就到了。';
    else if (s.phase === 'heifeng') { status = '黑風嶺就在鎮外，隨時能去看看。'; act = '<button type="button" class="btn primary full" data-st="hf">前往黑風嶺</button>'; }
    else if (s.phase === 'done') status = '第一章已完。第二章《洛陽舊事》尚在路上。';
    else status = '江湖暫時平靜。';
    const recent = (state.eventLog || []).slice(0, 5).map((x) => '<div class="event-line">' + escapeHtml(x.msg) + '</div>').join('');
    return '<div class="st-now"><img class="st-now-ico" src="assets/story/icon_juanzong.webp" alt="" onerror="this.remove()"><div><strong>' + escapeHtml(ch.title) + '</strong><br/><span class="muted">' + escapeHtml(ch.sub) + '</span></div></div>' +
      '<p class="st-status">' + status + '</p>' + act +
      (s.offlineEvents ? '<p class="muted">離線期間，江湖共發生過 ' + s.offlineEvents + ' 件事。</p>' : '') +
      '<h4 class="st-h">近日江湖</h4>' + (recent || '<p class="muted">尚無事件。</p>');
  }
  function stPeopleHtml() {
    const s = stEnsure();
    if (!s.people.length) return '<p class="muted">還沒遇見值得記下的人。</p>';
    return s.people.map((k) => {
      const p = ST.PEOPLE[k];
      if (!p) return '';
      const v = s.rel[k] || 0;
      return '<div class="st-person"><img src="assets/story/' + p.img + '.webp" alt="" onerror="this.remove()"><div><strong>' + escapeHtml(p.name) + '</strong> <span class="st-rel r' + (v >= 10 ? 'pos' : v <= -20 ? 'neg' : 'neu') + '">' + stRelWord(v) + '</span><br/><span class="muted">' + escapeHtml(p.desc) + '</span></div></div>';
    }).join('');
  }
  function stIntelHtml() {
    const s = stEnsure();
    const rows = s.intel.map((k) => {
      const it = ST.INTEL[k];
      return it ? '<p><strong>' + escapeHtml(it[0]) + '</strong><br/>' + escapeHtml(it[1]) + '</p>' : '';
    }).join('');
    return '<h4 class="st-h">江湖情報</h4>' + (rows || '<p class="muted">暫無情報。多聽、多看，自會有所得。</p>') + '<h4 class="st-h">舊聞軼事</h4>' + loreOldHtml();
  }
  function stChaptersHtml() {
    const s = stEnsure();
    return Object.keys(ST.CHAPTERS).map((k) => {
      const ch = ST.CHAPTERS[k];
      const done = s.completed.indexOf('ch' + k) >= 0;
      const open = s.unlocked.indexOf(+k) >= 0 && !ch.locked;
      return '<div class="st-ch' + (open ? '' : ' locked') + '"><strong>' + escapeHtml(ch.title) + '</strong> <span class="muted">' + (done ? '已完' : open ? (s.started || s.flags.qh_leave_done ? '進行中' : '未開始') : '敬請期待') + '</span><br/><span class="muted">' + (open ? escapeHtml(ch.sub) : '？？？') + '</span></div>';
    }).join('');
  }
  function stResumeHtml() {
    const s = stEnsure();
    const rows = ST.RESUME.filter((r) => s.flags[r[0]]).map((r) => '<li>' + escapeHtml(r[1]) + '</li>').join('');
    const pend = ST.RESUME_PENDING.filter((r) => !s.flags[r[0]]).map((r) => '<li class="muted">？？？（' + escapeHtml(r[1]) + '）</li>').join('');
    const items = s.items.map((k) => { const it = ST.ITEMS[k]; return it ? '<li>' + escapeHtml(it[0]) + '：<span class="muted">' + escapeHtml(it[1]) + '</span></li>' : ''; }).join('');
    const hist = s.history.slice(-12).reverse().map((h) => '<li>' + escapeHtml(h.text) + '</li>').join('');
    return '<p class="muted">這裡只記下你做過的事，不評對錯。</p>' +
      '<h4 class="st-h">江湖履歷</h4><ul class="st-list">' + (rows || '<li class="muted">尚無。</li>') + pend + '</ul>' +
      '<h4 class="st-h">重要物品</h4><ul class="st-list">' + (items || '<li class="muted">尚無。</li>') + '</ul>' +
      '<h4 class="st-h">你的抉擇</h4><ul class="st-list">' + (hist || '<li class="muted">尚無。</li>') + '</ul>';
  }
  function renderLore() {
    const el = $('panel-lore');
    if (!el || !state) return;
    const s = stEnsure();
    const tab = $('tab-lore');
    if (tab) tab.classList.toggle('has-dot', !!(s.cur && !s.battle) || (!s.started && !s.flags.qh_leave_done && !s.cur) || s.phase === 'heifeng');
    const subs = [['now', '正在發生'], ['ppl', '人物'], ['rum', '傳聞'], ['ch', '章回'], ['res', '履歷']];
    let body;
    if (loreSub === 'ppl') body = stPeopleHtml();
    else if (loreSub === 'rum') body = stIntelHtml();
    else if (loreSub === 'ch') body = stChaptersHtml();
    else if (loreSub === 'res') body = stResumeHtml();
    else body = stNowHtml();
    el.innerHTML = '<h3>江湖閒談</h3><div class="subtabs st-subs">' +
      subs.map((x) => '<button type="button" class="subtab' + (loreSub === x[0] ? ' active' : '') + '" data-lsub="' + x[0] + '">' + x[1] + '</button>').join('') +
      '</div><div class="lore">' + body + '</div>';
    el.querySelectorAll('[data-lsub]').forEach((b) => b.addEventListener('click', () => { stSfx(); loreSub = b.getAttribute('data-lsub'); renderLore(); }));
    el.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => {
      stSfx();
      const k = b.getAttribute('data-st');
      if (k === 'begin') stBegin();
      else if (k === 'resume') { s.open = true; stResume(); }
      else if (k === 'hf') { s.cur = 'hf_enter'; s.open = true; s.entered = ''; save(); stResume(); }
    }));
  }
  function stQuestHtml() {
    const s = stEnsure();
    const c = stCtx();
    const rows = ST.QUESTS.filter((q) => !q.show || q.show(c)).map((q) => {
      const d = !!q.done(c);
      return '<div class="quest-row' + (d ? ' claimed' : '') + '"><div class="quest-main"><strong>〈' + escapeHtml(q.text) + '〉</strong></div><span class="st-q ' + (d ? 'done' : 'doing') + '">' + (d ? '已了結' : '進行中') + '</span></div>';
    }).join('');
    return '<div class="quest-head"><span class="muted">' + escapeHtml(ST.CHAPTERS[s.chapter].title) + '</span></div>' + (rows || '<p class="muted">尚無卷宗。到「江湖閒談」踏入江湖吧。</p>');
  }
  function stSig() {
    const s = state && state.story;
    if (!s) return '';
    return Object.keys(s.flags).length + ':' + s.phase + ':' + (s.cur || '');
  }

  // __END_ENGINE__

  function showGame() {
    $('screen-create').classList.add('hidden');
    $('screen-game').classList.remove('hidden');
    ensureVitals();
    if (!window.__vitalsTimer) window.__vitalsTimer = setInterval(vitalsTick, 250);
    renderAll();
    if (state.hunting) {
      state.hunting = false;
      startHunt();
    }
    if (ST) {
      const s = stEnsure();
      if (s.cur && !s.battle) stResume();
      else if (!s.started && !s.flags.qh_leave_done) stBegin();
      else stCheck();
    }
  }

  function showCreate() {
    $('screen-game').classList.add('hidden');
    $('screen-create').classList.remove('hidden');
  }

  function renderChoices() {
    const lookEl = $('look-list');
    if (lookEl) {
      lookEl.innerHTML = LOOKS.map(
        (L) => `<button type="button" class="look-opt look-${L.id} ${selectedLook === L.id ? 'selected' : ''}" data-look="${L.id}" aria-label="外貌 ${L.glyph}">${L.glyph}</button>`
      ).join('');
      lookEl.querySelectorAll('[data-look]').forEach((b) =>
        b.addEventListener('click', () => {
          if (Audio()) Audio().sfx('click');
          selectedLook = b.getAttribute('data-look');
          renderChoices();
        })
      );
    }

    const sEl = $('school-list');
    sEl.innerHTML = SCHOOLS.map(
      (s) => `<button type="button" class="choice ${selectedSchool === s.id ? 'selected' : ''}" data-school="${s.id}">
        <span class="school-glyph">${SCHOOL_GLYPH[s.id] || '俠'}</span>
        ${s.name}<small>${s.desc}</small></button>`
    ).join('');
    sEl.querySelectorAll('[data-school]').forEach((b) =>
      b.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        selectedSchool = b.getAttribute('data-school');
        renderChoices();
      })
    );

    const wEl = $('weapon-list');
    wEl.innerHTML = WEAPONS.map(
      (w) => `<button type="button" class="choice ${selectedWeapon === w.id ? 'selected' : ''}" data-weapon="${w.id}">
        ${w.name}<small>攻${w.atk || 0} 防${w.def || 0} 速${w.spd || 0}</small></button>`
    ).join('');
    wEl.querySelectorAll('[data-weapon]').forEach((b) =>
      b.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        selectedWeapon = b.getAttribute('data-weapon');
        renderChoices();
      })
    );
  }

  function bind() {
    $('create-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('name-input').value.trim();
      if (!name) return;
      state = defaultHero(name, selectedSchool, selectedWeapon, selectedLook);
      pushLog(`「${name}」踏入江湖。`);
      if (Audio()) {
        Audio().applySettings(state.settings);
        Audio().unlock();
        Audio().sfx('click');
        Audio().playBgm(worldBgm());
      }
      syncMuteBtn();
      save();
      showGame();
      if (ST) stBegin();
    });

    const huntBtn = $('btn-hunt');
    const stopBtn = $('btn-stop');
    if (huntBtn) huntBtn.addEventListener('click', startHunt);
    if (stopBtn) stopBtn.addEventListener('click', stopHunt);
    const autoBtn = $('btn-auto');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        if (!state) return;
        if (state.hunting) stopHunt();
        else startHunt();
      });
    }
    const bagBtn = $('btn-bag');
    if (bagBtn) {
      bagBtn.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        document.querySelectorAll('.tab').forEach((t) => {
          const on = t.getAttribute('data-tab') === 'bag';
          t.classList.toggle('active', on);
        });
        ['zones', 'bag', 'hero', 'quest', 'lore'].forEach((p) => {
          const el = $('panel-' + p);
          if (el) el.classList.toggle('hidden', p !== 'bag');
        });
      });
    }
    const muteBtn = $('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const A = Audio();
        if (!A) return;
        A.unlock();
        A.setMuted(!A.isMuted());
        persistAudioSettings();
        syncMuteBtn();
        save();
        if (!A.isMuted()) {
          A.sfx('click');
          if (!A.getCurrentBgm()) A.playBgm(worldBgm());
        }
      });
    }
    $('btn-reset').addEventListener('click', () => {
      if (!confirm('確定重置角色？本機進度會清除。')) return;
      if (Audio()) Audio().sfx('click');
      if (state) {
        state.hunting = false;
        if (huntTimer) {
          clearInterval(huntTimer);
          huntTimer = null;
        }
      }
      if (Audio()) Audio().stopBgm();
      localStorage.removeItem(SAVE_KEY);
      state = null;
      showCreate();
    });

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        if (Audio()) Audio().sfx('click');
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const id = tab.getAttribute('data-tab');
        ['zones', 'bag', 'hero', 'quest', 'lore'].forEach((p) => {
          $('panel-' + p).classList.toggle('hidden', p !== id);
        });
      });
    });
  }

  function migrateSave(saved) {
    if (!saved || typeof saved !== 'object') return null;
    if (!saved.name) return null;
    if (!saved.equip || typeof saved.equip !== 'object') {
      saved.equip = { weapon: null, armor: null, boots: null, ring: null };
    }
    if (!Array.isArray(saved.bag)) saved.bag = [];
    saved.story = stNorm(saved.story);
    const _fix = (it) => { if (it && typeof it === 'object') { if (typeof it.enh !== 'number') it.enh = 0; if (!Array.isArray(it.affixes)) it.affixes = []; } };
    saved.bag.forEach(_fix);
    Object.keys(saved.equip).forEach((k) => _fix(saved.equip[k]));
    if (!Array.isArray(saved.log)) saved.log = [];
    if (!Array.isArray(saved.eventLog)) saved.eventLog = [];
    if (!saved.zoneBossFlags || typeof saved.zoneBossFlags !== 'object') saved.zoneBossFlags = {};
    if (!saved.zoneChallengeAt || typeof saved.zoneChallengeAt !== 'object') saved.zoneChallengeAt = {};
    saved.forceRival = false;
    if (!saved.unlockedLore || typeof saved.unlockedLore !== 'object') saved.unlockedLore = {};
    if (!saved.rivalCooldownUntil || typeof saved.rivalCooldownUntil !== 'object') saved.rivalCooldownUntil = {};
    if (!saved.rivalDaily || typeof saved.rivalDaily !== 'object') saved.rivalDaily = {};
    if (typeof saved.rivalDayKey !== 'string') saved.rivalDayKey = '';
    if (!Array.isArray(saved.titlesOwned)) saved.titlesOwned = [];
    if (typeof saved.activeTitle !== 'string') saved.activeTitle = '';
    if (!Array.isArray(saved.titleOffer)) saved.titleOffer = [];
    if (typeof saved.chivalrySpent !== 'number') saved.chivalrySpent = 0;
    if (typeof saved.softenLeft !== 'number') saved.softenLeft = 0;
    if (typeof saved.softenPct !== 'number') saved.softenPct = 0;
    if (!saved.combatBuff || typeof saved.combatBuff !== 'object') saved.combatBuff = null;
    if (typeof saved.dropBonusPct !== 'number') saved.dropBonusPct = 0;
    if (typeof saved.dropBonusLeft !== 'number') saved.dropBonusLeft = 0;
    if (typeof saved.encounterReducePct !== 'number') saved.encounterReducePct = 0;
    if (typeof saved.encounterReduceLeft !== 'number') saved.encounterReduceLeft = 0;
    if (!saved.zoneSilverBonus || typeof saved.zoneSilverBonus !== 'object') saved.zoneSilverBonus = null;
    if (!saved.rivalChanceBonus || typeof saved.rivalChanceBonus !== 'object') saved.rivalChanceBonus = null;
    if (!saved.ach || typeof saved.ach !== 'object') saved.ach = {};
    if (!Array.isArray(saved.rumors)) saved.rumors = [];
    if (typeof saved.teaDayKey !== 'string') saved.teaDayKey = '';
    if (typeof saved.teaDailyCount !== 'number') saved.teaDailyCount = 0;
    if (typeof saved.teaCooldownUntil !== 'number') saved.teaCooldownUntil = 0;
    if (!saved.settings || typeof saved.settings !== 'object') {
      saved.settings = { muted: false, bgmVol: 0.28, sfxVol: 0.55, autoSell: 'fan' };
    } else {
      if (typeof saved.settings.muted !== 'boolean') saved.settings.muted = false;
      if (typeof saved.settings.bgmVol !== 'number') saved.settings.bgmVol = 0.28;
      if (typeof saved.settings.sfxVol !== 'number') saved.settings.sfxVol = 0.55;
      if (saved.settings.bulkSell !== 'fan' && saved.settings.bulkSell !== 'fan_liang') {
        saved.settings.bulkSell = 'fan';
      }
      if (
        saved.settings.autoSell !== 'off' &&
        saved.settings.autoSell !== 'fan' &&
        saved.settings.autoSell !== 'fan_liang'
      ) {
        saved.settings.autoSell = 'fan';
      }
    }
    saved.bag.forEach((it) => {
      if (!it || typeof it !== 'object') return;
      if (!it.quality || !QUALITY_META[it.quality]) it.quality = 'fan';
    });
    ['weapon', 'armor', 'boots', 'ring'].forEach((slot) => {
      const it = saved.equip[slot];
      if (it && typeof it === 'object' && (!it.quality || !QUALITY_META[it.quality])) {
        it.quality = 'fan';
      }
    });
    if (typeof saved.lv !== 'number') saved.lv = 1;
    if (typeof saved.exp !== 'number') saved.exp = 0;
    if (typeof saved.silver !== 'number') saved.silver = 20;
    if (typeof saved.chivalry !== 'number') saved.chivalry = 0;
    if (typeof saved.kills !== 'number') saved.kills = 0;
    const zoneOk = ZONES.some((z) => z.id === saved.zoneId);
    if (!zoneOk) saved.zoneId = 'inn';
    saved.hunting = false;
    saved.mob = null;
    saved.mobs = [];
    if (!saved.zoneKills || typeof saved.zoneKills !== 'object') saved.zoneKills = {};
    if (!Array.isArray(saved.skillCd)) saved.skillCd = [0, 0, 0, 0, 0];
    while (saved.skillCd.length < 5) saved.skillCd.push(0);
    if (!saved.martial || typeof saved.martial !== 'object') saved.martial = { pick: {}, respec: 0 };
    saved.hp = null; saved.mp = null; saved.exhaustUntil = 0; saved.lastHurtAt = 0;
    if (typeof saved.nextAtkBonus !== 'number') saved.nextAtkBonus = 0;
    if (typeof saved.skillSoftLeft !== 'number') saved.skillSoftLeft = 0;
    return saved;
  }


  // —— 離線收益 ——
  const OFFLINE_CAP_MS = 8 * 3600 * 1000; // 最多結算 8 小時
  const OFFLINE_MIN_MS = 90 * 1000; // 離開不足 90 秒不結算
  const OFFLINE_EFFICIENCY = 0.4; // 離線效率 40%（不含名號對手與茶樓事件）
  const OFFLINE_MAX_DROP_ROLLS = 400;

  function fmtDuration(ms) {
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? h + ' 小時 ' + (m % 60) + ' 分' : m + ' 分鐘';
  }

  // 以區域怪物平均值估算離線期間的擊殺，回傳收益摘要（已套用到存檔）
  function settleOffline(awayMs) {
    if (!state || awayMs < OFFLINE_MIN_MS) return null;
    const usedMs = Math.min(awayMs, OFFLINE_CAP_MS);
    const zone = currentZone();
    const stats = calcStats(state);
    const scale = 1 + Math.max(0, state.lv - zone.minLv) * 0.05;
    const n = zone.mobs.length;
    const avg = zone.mobs.reduce(
      (a, m) => ({
        hp: a.hp + m.hp * scale,
        def: a.def + m.def,
        exp: a.exp + m.exp * scale,
        s: a.s + (m.silver[0] + m.silver[1]) / 2,
      }),
      { hp: 0, def: 0, exp: 0, s: 0 }
    );
    avg.hp /= n; avg.def /= n; avg.exp /= n; avg.s /= n;
    const dmg = Math.max(1, stats.atk - avg.def + 0.5);
    const ticksPerKill = Math.ceil(avg.hp / dmg) + 3; // 含刷新與走位空檔
    const tickMs = Math.max(650, 1400 - stats.spd * 40);
    const kills = Math.min(3000, Math.floor((usedMs * OFFLINE_EFFICIENCY) / (ticksPerKill * tickMs)));
    if (kills < 1) return null;

    const fromLv = state.lv;
    // 等級遠高於此區時收益遞減（鼓勵換地圖）
    const gapMult = 1 / (1 + Math.max(0, state.lv - zone.minLv) * 0.06);
    const expGain = Math.floor(kills * avg.exp * gapMult);
    let silGain = Math.floor(kills * avg.s * gapMult);
    state.exp += expGain;
    while (state.exp >= expToNext(state.lv)) {
      state.exp -= expToNext(state.lv);
      state.lv += 1;
    }
    state.kills += kills;
    if (!state.zoneKills || typeof state.zoneKills !== 'object') state.zoneKills = {};
    state.zoneKills[state.zoneId] = (state.zoneKills[state.zoneId] || 0) + kills;

    // 掉落：沿用現有掉落／自動售出規則，最多擲 400 次，避免背包暴增
    const silBefore = state.silver;
    const bagBefore = state.bag.length;
    audioSilent = true;
    const logBackup = state.log.slice();
    let rolls = Math.min(kills, OFFLINE_MAX_DROP_ROLLS);
    let loots = [];
    try {
      for (let i = 0; i < rolls; i++) {
        const got = tryDrop(false);
        if (got && got.length) loots = loots.concat(got);
      }
    } finally {
      audioSilent = false;
      state.log = logBackup;
    }
    const dropSilver = state.silver - silBefore; // 雜物與自動售出所得
    state.silver += silGain;
    const bagAdded = state.bag.length - bagBefore;
    const byQ = {};
    loots.forEach((it) => { byQ[it.quality] = (byQ[it.quality] || 0) + 1; });
    state.lastSeen = Date.now();
    pushLog('離線 ' + fmtDuration(usedMs) + '，擊敗約 ' + kills + ' 名對手', 'event');
    return {
      awayMs, usedMs, capped: awayMs > OFFLINE_CAP_MS,
      kills, expGain, silver: silGain + dropSilver,
      fromLv, toLv: state.lv, bagAdded, byQ,
      zoneName: zone.name,
      story: stOffline(usedMs),
    };
  }

  function openOfflineModal(r) {
    enqueueModal(() => {
      if (modalOpen) {
        modalQueue.push(() => openOfflineModal(r));
        return;
      }
      modalOpen = true;
      document.body.classList.add('modal-open');
      const root = ensureModalRoot();
      const rare = [];
      if (r.byQ.zhen > 0) rare.push('珍品 ×' + r.byQ.zhen);
      if (r.byQ.jue > 0) rare.push('絕品 ×' + r.byQ.jue);
      let btOff = 0;
      Object.keys(BREAKTHROUGH_TEXT).forEach((k) => { if (r.fromLv < +k && r.toLv >= +k) btOff = Math.max(btOff, +k); });
      const bye = pick(['江湖路遠，明日再戰。', '茶還熱著，你就回來了。', '這一覺，江湖沒閒著。']);
      root.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true">' +
        '<div class="modal-card offline-modal">' +
        '<h3>歡迎回來</h3>' +
        '<p class="muted" style="text-align:center">你在「' + escapeHtml(r.zoneName) + '」閉關 ' + fmtDuration(r.usedMs) +
        (r.capped ? '（已達 8 小時上限）' : '') + '</p>' +
        '<div class="offline-grid">' +
        '<div><span>擊敗</span><b>' + r.kills + '</b></div>' +
        '<div><span>經驗</span><b>+' + r.expGain + '</b></div>' +
        '<div><span>銀兩</span><b>+' + r.silver + '</b></div>' +
        '</div>' +
        (btOff ? '<p style="text-align:center;color:#ffd986;margin:4px 0"><b>突破！' + realmName(r.toLv) + '</b><br/>' + BREAKTHROUGH_TEXT[btOff] + '</p>' : '') +
        '<div class="level-delta">等級　Lv.' + r.fromLv + ' → <b>Lv.' + r.toLv + '</b>' + (r.toLv > r.fromLv ? '（' + realmName(r.toLv) + '）' : '') + '</div>' +
        '<div class="level-delta">' + (r.bagAdded > 0 ? '獲得裝備 ' + r.bagAdded + ' 件' : '沒有撿到新裝備') +
        (rare.length ? '<br/><b style="color:#ffd23a">其中 ' + rare.join('、') + '</b>' : '') +
        '<br/><span class="muted">離線效率 ' + Math.round(OFFLINE_EFFICIENCY * 100) + '%，高於此區等級收益遞減；不含名號對手與茶樓事件。</span></div>' +
        (r.story ? '<div class="level-delta st-off"><b>你離線期間，江湖發生了 ' + r.story.n + ' 件事</b><br/>' + r.story.lines.map(escapeHtml).join('<br/>') + '</div>' : '') +
        '<p class="muted" style="text-align:center;margin:6px 0">' + bye + '</p>' +
        '<button type="button" class="btn primary full" data-close>收下</button>' +
        '</div></div>';
      root.querySelector('[data-close]').onclick = () => {
        if (Audio()) Audio().sfx('click');
        closeModal();
        renderAll();
      };
      if (Audio()) Audio().sfx('levelup');
    });
  }

  // 回到分頁（掛機中被瀏覽器節流）時補算
  function onReturnVisible() {
    if (!state || !state.hunting || $('screen-game').classList.contains('hidden')) return;
    const away = Date.now() - (state.lastSeen || Date.now());
    const r = settleOffline(away);
    if (r) {
      save();
      renderAll();
      openOfflineModal(r);
    }
  }

  function boot() {
    if (DEBUG_BOSS) {
      const tag = document.createElement('div');
      tag.textContent = '驗收模式：只出名號首領（網址去掉 ?debug=boss 即恢復正常）';
      tag.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#a33;color:#fff;font-size:12px;text-align:center;padding:2px 4px;pointer-events:none';
      document.body.appendChild(tag);
    }
    renderChoices();
    bind();
    const saved = migrateSave(load());
    if (saved) {
      state = saved;
      if (Audio() && state.settings) Audio().applySettings(state.settings);
      syncMuteBtn();
      showGame();
      if (saved.wasHunting && saved.lastSeen) {
        const r = settleOffline(Date.now() - saved.lastSeen);
        if (r) {
          save();
          renderAll();
          openOfflineModal(r);
        }
        startHunt();
      }
      stCheck();
    } else {
      showCreate();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') save();
      else onReturnVisible();
    });
    window.addEventListener('pagehide', save);
  }

  probeSprites();
  boot();
})();
