(() => {
  const SAVE_KEY = 'jianghu-idle-v1';
  const Audio = () => (typeof window !== 'undefined' && window.JianghuAudio) || null;
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

  function getSchoolSkills(schoolId) {
    return SCHOOL_SKILLS[schoolId] || SCHOOL_SKILLS.cangjian;
  }

  function calcPower(stats) {
    return Math.floor((stats.atk || 0) * 2 + (stats.def || 0) + (stats.spd || 0) * 3);
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
      base +
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

  const ZONES = [
    {
      id: 'inn',
      name: '邊城客棧外',
      flavor: '刀光酒氣裡，總有人試新人深淺。',
      minLv: 1,
      mobs: [
        { name: '醉拳混混', hp: 28, atk: 4, def: 1, exp: 6, silver: [3, 7] },
        { name: '馬賊探子', hp: 34, atk: 5, def: 1, exp: 8, silver: [4, 9] },
        { name: '賭坊打手', hp: 32, atk: 5, def: 2, exp: 7, silver: [5, 10] },
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
        { name: '黑衣追踪者', hp: 62, atk: 9, def: 2, exp: 16, silver: [9, 16] },
        { name: '碼頭鏢師', hp: 58, atk: 8, def: 3, exp: 15, silver: [10, 15] },
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
        { name: '駝鈴刺客', hp: 88, atk: 15, def: 3, exp: 30, silver: [18, 28] },
        { name: '狂沙刀客', hp: 102, atk: 14, def: 4, exp: 32, silver: [20, 30] },
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
        { name: '竹林伏兵', hp: 140, atk: 20, def: 6, exp: 45, silver: [28, 40] },
        { name: '白衣劍客', hp: 155, atk: 22, def: 5, exp: 50, silver: [30, 45] },
        { name: '青衣鏢客', hp: 148, atk: 21, def: 7, exp: 48, silver: [32, 42] },
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
        { name: '崖魔護法', hp: 220, atk: 30, def: 9, exp: 75, silver: [45, 65] },
        { name: '無名老怪', hp: 260, atk: 34, def: 10, exp: 90, silver: [55, 80] },
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
        { name: '傘下刺客', hp: 280, atk: 44, def: 10, exp: 118, silver: [75, 100] },
        { name: '茶攤眼線', hp: 265, atk: 38, def: 11, exp: 105, silver: [65, 90] },
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
        { name: '白刃戍衛', hp: 410, atk: 50, def: 17, exp: 160, silver: [100, 140] },
        { name: '凍傷隱士', hp: 360, atk: 56, def: 13, exp: 155, silver: [98, 135] },
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
        { name: '破戒刀僧', hp: 490, atk: 74, def: 18, exp: 220, silver: [145, 195] },
        { name: '影廊行者', hp: 540, atk: 70, def: 20, exp: 230, silver: [150, 200] },
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
        { name: '霧中刀影', hp: 650, atk: 94, def: 24, exp: 315, silver: [210, 280] },
        { name: '孤嶼船主', hp: 720, atk: 90, def: 28, exp: 330, silver: [220, 300] },
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
        { name: '絕嶺瞎子', hp: 860, atk: 120, def: 30, exp: 440, silver: [290, 380] },
        { name: '天風老叟', hp: 980, atk: 118, def: 36, exp: 460, silver: [310, 400] },
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
      bestDrop: { id: 'broken_inn_blade', name: '斷刃客棧刀', slot: 'weapon', atk: 4, rare: 0.72 },
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
      bestDrop: { id: 'tide_soft_armor', name: '潮痕軟甲', slot: 'armor', def: 4, spd: 1, rare: 0.7 },
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
      bestDrop: { id: 'sandstorm_cloak', name: '狂沙披風', slot: 'armor', def: 5, atk: 1, rare: 0.68 },
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
      bestDrop: { id: 'bamboo_slim_sword', name: '竹海細劍', slot: 'weapon', atk: 6, spd: 2, rare: 0.65 },
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
      bestDrop: { id: 'cliff_rope_hook', name: '斷雲繩鉤', slot: 'boots', spd: 3, def: 1, rare: 0.62 },
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
      bestDrop: { id: 'umbrella_bone_spike', name: '夜雨傘骨刺', slot: 'weapon', atk: 8, spd: 2, rare: 0.6 },
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
      bestDrop: { id: 'frost_pass_armor', name: '寒關戍甲', slot: 'armor', def: 9, atk: 2, rare: 0.58 },
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
      bestDrop: { id: 'broken_bell_beads', name: '殘鐘念珠', slot: 'ring', atk: 4, def: 4, rare: 0.55 },
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
      bestDrop: { id: 'isle_tide_blade', name: '孤嶼潮刃', slot: 'weapon', atk: 13, spd: 2, rare: 0.52 },
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
      bestDrop: { id: 'skywind_cloak', name: '天風披氅', slot: 'armor', def: 12, atk: 3, spd: 1, rare: 0.5 },
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

  function buffedStats(base) {
    const s = { ...base };
    const b = state.combatBuff;
    if (!b || b.kind === 'soften') return s;
    if (b.kind === 'atk') s.atk = Math.floor(s.atk * (1 + (b.pct || 0)));
    if (b.kind === 'def') s.def = Math.floor(s.def * (1 + (b.pct || 0)));
    if (b.kind === 'spd') s.spd = Math.floor(s.spd * (1 + (b.pct || 0)));
    if (b.spd) s.spd = Math.floor(s.spd * (1 + b.spd));
    return s;
  }

  function incomingDmgFactor() {
    let f = 1;
    if (state.softenLeft > 0 && state.softenPct > 0) f *= 1 - state.softenPct;
    const b = state.combatBuff;
    if (b && b.vuln) f *= 1 + b.vuln;
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
      atk += it.atk || 0;
      def += it.def || 0;
      spd += it.spd || 0;
    }
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
      skillCd: [0, 0, 0, 0],
      nextAtkBonus: 0,
      skillSoftLeft: 0,
    };
  }

  function save() {
    if (!state) return;
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

  function ensureMobs() {
    if (!state) return;
    if (!Array.isArray(state.mobs)) state.mobs = [];
    if (aliveMobs().length) {
      syncPrimaryMob();
      return;
    }
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
    if (rival && canSpawnRival(zone.id, now)) {
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
        Audio().playBgm('battle');
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
    };

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
    state.zoneBossFlags[zid] = true;
    refreshRivalDay();
    state.rivalDaily[zid] = (state.rivalDaily[zid] || 0) + 1;
    state.rivalCooldownUntil[zid] = Date.now() + 4 * 60 * 60 * 1000;
    if (rival) {
      state._lastRivalDrop = rival.bestDrop;
      pushLog('名號已破！可於俠客頁花俠義解鎖傳聞「' + rival.loreTitle + '」', 'rival');
      pushEventLog('擊敗名號「' + rival.name + '」（' + (ZONES.find((z) => z.id === zid) || {}).name + '）', 'rival');
    }
    state.chivalry += 5;
    pushLog('名號對手敗退，俠義 +5', 'rival');
    if (Audio()) Audio().playBgm('world');
  }

  function tickCombat() {
    if (!state || !state.hunting) return;
    if (modalOpen) return;
    tryTriggerEvent(Date.now());
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
    const hitRoll = rand(-1, 2);
    let dmg = Math.max(1, stats.atk - mob.def + hitRoll);
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
    const hitChance = Math.max(0.35, 0.85 - (stats.spd - 5) * 0.02);
    if (Math.random() < hitChance) {
      let mdmg = Math.max(1, foe.atk - stats.def + rand(-1, 1));
      mdmg = Math.max(1, Math.floor(mdmg * incomingDmgFactor()));
      if (state.skillSoftLeft > 0) {
        mdmg = Math.max(1, Math.floor(mdmg * 0.7));
        state.skillSoftLeft -= 1;
      }
      if (mdmg >= stats.def + 6 && Math.random() < 0.15) {
        const lose = Math.min(state.silver, rand(1, 3));
        state.silver -= lose;
        pushLog('「' + foe.name + '」狠狠一擊，銀兩散落 -' + lose);
        setTimeout(() => fxEnemyAttack('heavy', mobSlotIndex(foe)), 160);
      } else {
        pushLog('「' + foe.name + '」攻來，你側身化解');
        setTimeout(() => fxEnemyAttack('block', mobSlotIndex(foe)), 160);
      }
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
    state.silver += sil;
    state.kills += 1;
    bumpZoneKill();
    const gotExp = Math.floor(mob.exp * bonusExp);
    gainExp(gotExp);
    const wasRival = !!mob.isRival;
    if (wasRival) onRivalDefeated(mob);
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
    renderCombatBars();
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
    if (!state.skillCd) state.skillCd = [0, 0, 0, 0];
    state.skillCd[idx] = Date.now() + ms;
  }

  function castSkill(idx, opts) {
    opts = opts || {};
    if (!state || !state.hunting) return false;
    if (modalOpen) return false;
    ensureMobs();
    const mob = syncPrimaryMob();
    if (!mob || mob.hp <= 0) return false;
    if (!skillReady(idx)) return false;
    const skills = getSchoolSkills(state.school);
    const sk = skills[idx];
    if (!sk) return false;

    setSkillCd(idx, sk.cd || 5000);
    spawnFloat(sk.name, 'skill-name', mobSlotIndex(mob));
    pulseClass(document.querySelector('.skill-slot[data-skill="' + idx + '"]'), 'flash', 280);

    if (sk.kind === 'buff') {
      state.nextAtkBonus = 0.35;
      state.skillSoftLeft = Math.max(state.skillSoftLeft || 0, 2);
      spawnFloat('運功', 'heal');
      pushLog('施展「' + sk.name + '」：下招威力↑，短暫護體', 'loot');
      if (Audio()) Audio().sfx('click');
      renderSkillBar();
      save();
      return true;
    }

    const stats = buffedStats(calcStats(state));
    const hits = sk.hits || 1;
    let total = 0;
    const slot = mobSlotIndex(mob);
    for (let i = 0; i < hits; i++) {
      const roll = rand(0, 2);
      let dmg = Math.max(1, Math.floor((stats.atk - mob.def + roll) * (sk.mult || 1.3)));
      total += dmg;
      mob.hp -= dmg;
    }
    const isCrit = (sk.mult || 1) >= 1.6 || hits >= 3;
    pushLog('「' + sk.name + '」對「' + mob.name + '」額外 -' + total, 'loot');
    spawnFloat('-' + total, isCrit ? 'crit skill' : 'skill', slot);
    spawnSlash(!!isCrit, true, slot);
    const slotEl = $('enemy-slot-' + slot);
    pulseClass(slotEl, 'hit', 300);
    pulseClass($('battle-stage'), 'shake', isCrit ? 340 : 240);
    if (Audio()) Audio().sfx(isCrit ? 'crit' : 'hit');
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
    for (let i = 0; i < 3; i++) {
      if (skillReady(i)) {
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
      root.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true">' +
        '<div class="modal-card level-modal">' +
        '<h3>恭喜升級</h3>' +
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
    if (state.lv < zone.minLv) {
      pushLog(`等級不足，需 Lv.${zone.minLv} 才能掛此處`);
      return;
    }
    if (Audio()) {
      Audio().unlock();
      Audio().sfx('click');
      const prim = state.mob || (Array.isArray(state.mobs) && state.mobs[0]);
      const want = (prim && prim.isRival) ? 'battle' : 'world';
      Audio().playBgm(want);
    }
    state.hunting = true;
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
      Audio().playBgm('world');
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
    const jitterX = rand(-8, 10);
    const jitterY = rand(-6, 10);
    el.style.left = (pos.left + jitterX) + '%';
    el.style.top = (pos.top + jitterY) + '%';
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
      if (!mob || mob.hp <= 0) {
        slot.classList.add('empty');
        const g = slot.querySelector('[data-glyph]');
        if (g) g.textContent = i === 0 ? '？' : '';
        const lab = slot.querySelector('[data-label]');
        if (lab) lab.textContent = i === 0 && !primary ? '等待開打' : '';
        const hp = $('mob-hp-' + i);
        if (hp) hp.style.width = '0%';
        continue;
      }
      slot.classList.add('look-' + (mob.look || 'bandit'));
      if (state.hunting) slot.classList.add('idle');
      if (mob.isRival) slot.classList.add('named-rival');
      if (primary && primary.uid === mob.uid) slot.classList.add('primary-target');
      const g = slot.querySelector('[data-glyph]');
      if (g) g.textContent = mob.glyph || '👤';
      const lab = slot.querySelector('[data-label]');
      if (lab) lab.textContent = (mob.isRival ? '名號·' : '') + mob.name;
      const hp = $('mob-hp-' + i);
      if (hp) hp.style.width = Math.max(0, (mob.hp / mob.maxHp) * 100) + '%';
    }
  }

  // 斜角占位剪影：暫不用七幀橫版 sheet。等創意「斜角 Q 版」圖到再換回幀動畫。
  const HERO_ATK_MS = 280;
  let heroAtkTimer = null;

  function playHeroAttackAnim() {
    const art = $('hero-art');
    if (!art) return;
    if (heroAtkTimer) {
      clearTimeout(heroAtkTimer);
      heroAtkTimer = null;
    }
    art.classList.add('attacking');
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
    pulseClass($('battle-stage'), 'shake', isCrit ? 340 : 240);
    spawnFloat('-' + dmg, isCrit ? 'crit' : '', s);
    spawnSlash(!!isCrit, false, s);
  }

  function fxEnemyAttack(kind, slot) {
    const s = slot == null ? 0 : slot;
    pulseClass($('enemy-slot-' + s), 'attacking', 280);
    pulseClass($('fighter-hero'), 'hit', 280);
    if (kind === 'miss') spawnFloat('閃', 'miss enemy-hit');
    else if (kind === 'block') spawnFloat('化', 'miss enemy-hit');
    else spawnFloat('-!', 'enemy-hit');
  }

  function fxMobDefeat(slot) {
    const s = slot == null ? 0 : slot;
    const enemyF = $('enemy-slot-' + s);
    if (!enemyF) return;
    enemyF.classList.add('dying');
    spawnFloat('破！', 'kill', s);
    setTimeout(() => enemyF.classList.remove('dying'), 420);
  }

  function renderCombatBars() {
    if (!state) return;
    if (!Array.isArray(state.mobs)) state.mobs = [];
    const primary = syncPrimaryMob();
    for (let i = 0; i < 3; i++) {
      const mob = state.mobs[i];
      const hp = $('mob-hp-' + i);
      if (!hp) continue;
      if (!mob || mob.hp <= 0) hp.style.width = '0%';
      else hp.style.width = Math.max(0, (mob.hp / mob.maxHp) * 100) + '%';
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
    $('hero-meta').textContent = school ? school.name : '';
    const powerEl = $('stat-power');
    if (powerEl) powerEl.textContent = String(calcPower(stats));
    const av = $('hud-avatar');
    if (av) {
      const look = state.look || 'a';
      av.className = 'hud-avatar school-' + (state.school || 'cangjian') + ' look-' + look;
      const lookDef = LOOKS.find((x) => x.id === look);
      av.textContent = lookDef ? lookDef.glyph : (state.name || '俠').charAt(0);
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
    renderStage();
    renderZoneProgress();
    renderLog();
    renderSkillBar();
    syncAutoBtn();
    renderZones();
    renderBag();
    renderHero();
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
    const skills = getSchoolSkills(state.school);
    const now = Date.now();
    if (!state.skillCd) state.skillCd = [0, 0, 0, 0];
    // 初次建立按鈕
    if (!wrap.dataset.bound || wrap.dataset.school !== state.school) {
      wrap.dataset.bound = '1';
      wrap.dataset.school = state.school || '';
      const short = schoolShort(state.school);
      wrap.innerHTML = [0, 1, 2, 3]
        .map((i) => {
          const sk = skills[i];
          const label = sk ? sk.name : short;
          const sub = sk ? '' : '<span class="sk-school">' + escapeHtml(short) + '</span>';
          return (
            '<button type="button" class="skill-slot" data-skill="' +
            i +
            '" title="' +
            escapeHtml(label) +
            '">' +
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
      const cdMs = (sk && sk.cd) || 5000;
      const mask = btn.querySelector('.cd-mask');
      const cdText = btn.querySelector('.cd-text');
      if (left > 0) {
        btn.classList.add('on-cd');
        btn.disabled = true;
        if (mask) mask.style.height = Math.min(100, (left / cdMs) * 100) + '%';
        if (cdText) cdText.textContent = Math.ceil(left / 1000);
      } else {
        btn.classList.remove('on-cd');
        btn.disabled = !state.hunting;
        if (mask) mask.style.height = '0%';
        if (cdText) cdText.textContent = '';
      }
    });
  }

  function renderZones() {
    const el = $('panel-zones');
    const now = Date.now();
    refreshRivalDay();
    el.innerHTML =
      '<h3>行走地圖</h3>' +
      ZONES.map((z) => {
        const locked = state.lv < z.minLv;
        const active = state.zoneId === z.id;
        const rival = ZONE_RIVALS[z.id];
        const beaten = !!(state.zoneBossFlags && state.zoneBossFlags[z.id]);
        const used = rivalDailyUsed(z.id);
        const cd = rivalCooldownLeft(z.id, now);
        let rivalLine = '';
        if (rival) {
          const status = beaten
            ? '<span class="badge beaten">已破</span>'
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
    el.querySelectorAll('[data-zone]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-zone');
        const z = ZONES.find((x) => x.id === id);
        if (!z || state.lv < z.minLv) return;
        if (state.hunting) stopHunt();
        else if (Audio()) Audio().sfx('click');
        state.zoneId = id;
        state.mob = null;
        state.mobs = [];
        pushLog('來到「' + z.name + '」');
        renderAll();
        save();
      });
    });
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
          '<div class="row eq-row ' +
          qm.cls +
          '"><span>' +
          labels[slot] +
          '</span><span>' +
          escapeHtml(it.name) +
          '<span class="q-badge">' +
          qm.label +
          '</span></span></div>'
        );
      })
      .join('');
    const bagLines = state.bag.length
      ? state.bag
          .map((it) => {
            const qm = qualityMeta(it.quality);
            const bonus = [
              it.atk ? '攻+' + it.atk : '',
              it.def ? '防+' + it.def : '',
              it.spd ? '速+' + it.spd : '',
            ]
              .filter(Boolean)
              .join(' ');
            const keepTag = it.fromRival || it.keep ? ' · 名號珍藏' : '';
            return (
              '<div class="bag-item ' +
              qm.cls +
              '">' +
              '<div><strong>' +
              escapeHtml(it.name) +
              '</strong><span class="q-badge">' +
              qm.label +
              '</span><div class="muted">' +
              escapeHtml((bonus || '雜物') + keepTag) +
              '</div></div>' +
              '<div>' +
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
      eqLines +
      '<h3 style="margin-top:12px">行囊</h3>' +
      bagLines;
    el.querySelectorAll('[data-eq]').forEach((b) =>
      b.addEventListener('click', () => equipItem(b.getAttribute('data-eq')))
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

  function renderLore() {
    const el = $('panel-lore');
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

    el.innerHTML =
      '<h3>江湖閒談</h3><div class="lore">' +
      LORE.map(
        (x) => '<p><strong>' + escapeHtml(x.title) + '</strong><br/>' + escapeHtml(x.body) + '</p>'
      ).join('') +
      '<h3 style="margin-top:12px">名號傳聞</h3>' +
      rivalLore +
      '<h3 style="margin-top:12px">閒談日誌</h3>' +
      (events || '<p class="muted">尚無事件紀錄。</p>') +
      '<p class="muted">內容為原創閑話，致敬武俠氛圍，不引用小說原文。</p></div>';
  }

  function showGame() {
    $('screen-create').classList.add('hidden');
    $('screen-game').classList.remove('hidden');
    renderAll();
    if (state.hunting) {
      state.hunting = false;
      startHunt();
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
        Audio().playBgm('world');
      }
      syncMuteBtn();
      save();
      showGame();
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
        ['zones', 'bag', 'hero', 'lore'].forEach((p) => {
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
          if (!A.getCurrentBgm()) A.playBgm('world');
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
        ['zones', 'bag', 'hero', 'lore'].forEach((p) => {
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
    if (!Array.isArray(saved.log)) saved.log = [];
    if (!Array.isArray(saved.eventLog)) saved.eventLog = [];
    if (!saved.zoneBossFlags || typeof saved.zoneBossFlags !== 'object') saved.zoneBossFlags = {};
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
    if (!Array.isArray(saved.skillCd) || saved.skillCd.length !== 4) {
      saved.skillCd = [0, 0, 0, 0];
    }
    if (typeof saved.nextAtkBonus !== 'number') saved.nextAtkBonus = 0;
    if (typeof saved.skillSoftLeft !== 'number') saved.skillSoftLeft = 0;
    return saved;
  }

  function boot() {
    renderChoices();
    bind();
    const saved = migrateSave(load());
    if (saved) {
      state = saved;
      if (Audio() && state.settings) Audio().applySettings(state.settings);
      syncMuteBtn();
      showGame();
    } else {
      showCreate();
    }
  }

  boot();
})();
