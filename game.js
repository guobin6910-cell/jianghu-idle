(() => {
  const SAVE_KEY = 'jianghu-idle-v1';

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

  const ZONES = [
    {
      id: 'inn',
      name: '邊城客棧外',
      flavor: '刀光酒氣裡，總有人試新人深淺。',
      minLv: 1,
      mobs: [
        { name: '醉拳混混', hp: 28, atk: 4, def: 1, exp: 6, silver: [3, 7] },
        { name: '馬賊探子', hp: 34, atk: 5, def: 1, exp: 8, silver: [4, 9] },
      ],
      drops: [
        { id: 'cloth', name: '粗布勁裝', slot: 'armor', def: 1, rare: 0.35 },
        { id: 'wine', name: '燒刀子', type: 'junk', silver: 5, rare: 0.4 },
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
      ],
      drops: [
        { id: 'boots', name: '軟底快靴', slot: 'boots', spd: 1, rare: 0.3 },
        { id: 'pearl', name: '雨打珠', type: 'junk', silver: 12, rare: 0.25 },
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
      ],
      drops: [
        { id: 'scarf', name: '沙紋披風', slot: 'armor', def: 3, atk: 1, rare: 0.22 },
        { id: 'jade', name: '殘缺玉佩', type: 'junk', silver: 22, rare: 0.2 },
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
      ],
      drops: [
        { id: 'bamboo_sword', name: '青筠劍', slot: 'weapon', atk: 5, spd: 1, rare: 0.18 },
        { id: 'manual', name: '殘頁劍譜', type: 'junk', chivalry: 2, rare: 0.15 },
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
      ],
      drops: [
        { id: 'ring', name: '斷雲戒', slot: 'ring', atk: 3, def: 2, rare: 0.12 },
        { id: 'scroll', name: '絕壁殘簡', type: 'junk', chivalry: 5, rare: 0.1 },
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
  ];

  let state = null;
  let huntTimer = null;
  let selectedSchool = SCHOOLS[0].id;
  let selectedWeapon = WEAPONS[0].id;

  const $ = (id) => document.getElementById(id);

  function expToNext(lv) {
    return Math.floor(40 + lv * lv * 18);
  }

  function rand(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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

  function defaultHero(name, school, weaponPath) {
    return {
      name,
      school,
      weaponPath,
      lv: 1,
      exp: 0,
      silver: 20,
      chivalry: 0,
      zoneId: 'inn',
      hunting: false,
      bag: [],
      equip: { weapon: null, armor: null, boots: null, ring: null },
      kills: 0,
      log: [],
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
      .slice(0, 12)
      .map((x) => `<div class="${x.cls || ''}">${escapeHtml(x.msg)}</div>`)
      .join('');
  }

  function currentZone() {
    return ZONES.find((z) => z.id === state.zoneId) || ZONES[0];
  }

  function ensureMob() {
    if (state.mob && state.mob.hp > 0) return;
    const zone = currentZone();
    const base = pick(zone.mobs);
    const scale = 1 + Math.max(0, state.lv - zone.minLv) * 0.05;
    state.mob = {
      name: base.name,
      maxHp: Math.floor(base.hp * scale),
      hp: Math.floor(base.hp * scale),
      atk: Math.floor(base.atk * scale),
      def: base.def,
      exp: Math.floor(base.exp * scale),
      silver: base.silver,
    };
  }

  function gainExp(n) {
    state.exp += n;
    let ups = 0;
    while (state.exp >= expToNext(state.lv)) {
      state.exp -= expToNext(state.lv);
      state.lv += 1;
      ups += 1;
    }
    if (ups) pushLog(`升級！目前 Lv.${state.lv}`, 'win');
  }

  function tryDrop() {
    const zone = currentZone();
    for (const d of zone.drops) {
      if (Math.random() > d.rare) continue;
      if (d.type === 'junk') {
        if (d.silver) {
          state.silver += d.silver;
          pushLog(`撿到「${d.name}」，換得銀兩 ${d.silver}`, 'loot');
        }
        if (d.chivalry) {
          state.chivalry += d.chivalry;
          pushLog(`悟得「${d.name}」，俠義 +${d.chivalry}`, 'loot');
        }
        return;
      }
      const item = {
        uid: `${d.id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        id: d.id,
        name: d.name,
        slot: d.slot,
        atk: d.atk || 0,
        def: d.def || 0,
        spd: d.spd || 0,
      };
      state.bag.push(item);
      pushLog(`掉落裝備「${item.name}」`, 'loot');
      return;
    }
  }

  function tickCombat() {
    if (!state || !state.hunting) return;
    ensureMob();
    const stats = calcStats(state);
    const mob = state.mob;
    const dmg = Math.max(1, stats.atk - mob.def + rand(-1, 2));
    mob.hp -= dmg;
    pushLog(`你對「${mob.name}」造成 ${dmg} 傷害`);

    if (mob.hp <= 0) {
      const sil = rand(mob.silver[0], mob.silver[1]);
      state.silver += sil;
      state.kills += 1;
      gainExp(mob.exp);
      pushLog(`擊敗「${mob.name}」！經驗 +${mob.exp}，銀兩 +${sil}`, 'win');
      tryDrop();
      state.mob = null;
      ensureMob();
      renderAll();
      save();
      return;
    }

    const hitChance = Math.max(0.35, 0.85 - (stats.spd - 5) * 0.02);
    if (Math.random() < hitChance) {
      const mdmg = Math.max(1, mob.atk - stats.def + rand(-1, 1));
      if (mdmg >= stats.def + 6 && Math.random() < 0.15) {
        const lose = Math.min(state.silver, rand(1, 3));
        state.silver -= lose;
        pushLog(`「${mob.name}」狠狠一擊，銀兩散落 -${lose}`);
      } else {
        pushLog(`「${mob.name}」攻來，你側身化解`);
      }
    } else {
      pushLog(`你身法一閃，避過「${mob.name}」`);
    }
    renderCombatBars();
    save();
  }

  function startHunt() {
    if (!state) return;
    const zone = currentZone();
    if (state.lv < zone.minLv) {
      pushLog(`等級不足，需 Lv.${zone.minLv} 才能掛此處`);
      return;
    }
    state.hunting = true;
    ensureMob();
    pushLog(`在「${zone.name}」開始掛機…`);
    $('btn-hunt').disabled = true;
    $('btn-stop').disabled = false;
    if (huntTimer) clearInterval(huntTimer);
    const stats = calcStats(state);
    const ms = Math.max(650, 1400 - stats.spd * 40);
    huntTimer = setInterval(tickCombat, ms);
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
    $('btn-hunt').disabled = false;
    $('btn-stop').disabled = true;
    pushLog('停手歇息。');
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

  function sellItem(uid) {
    const idx = state.bag.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const item = state.bag[idx];
    const price = 8 + (item.atk || 0) * 6 + (item.def || 0) * 5 + (item.spd || 0) * 5;
    state.silver += price;
    state.bag.splice(idx, 1);
    pushLog(`售出「${item.name}」＋${price} 銀`, 'loot');
    renderAll();
    save();
  }

  function renderCombatBars() {
    if (!state) return;
    const mob = state.mob;
    if (mob) {
      $('mob-name').textContent = `${mob.name}  ${Math.max(0, mob.hp)}/${mob.maxHp}`;
      $('bar-mob').style.width = Math.max(0, (mob.hp / mob.maxHp) * 100) + '%';
    } else {
      $('mob-name').textContent = '等待開打';
      $('bar-mob').style.width = '0%';
    }
  }

  function renderAll() {
    if (!state) return;
    const school = SCHOOLS.find((s) => s.id === state.school);
    const stats = calcStats(state);
    const need = expToNext(state.lv);
    $('hero-name').textContent = state.name;
    $('hero-meta').textContent = ` · ${school ? school.name : ''} · Lv.${state.lv}`;
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
    renderLog();
    renderZones();
    renderBag();
    renderHero();
    renderLore();

    $('btn-hunt').disabled = !!state.hunting;
    $('btn-stop').disabled = !state.hunting;
  }

  function renderZones() {
    const el = $('panel-zones');
    el.innerHTML =
      `<h3>行走地圖</h3>` +
      ZONES.map((z) => {
        const locked = state.lv < z.minLv;
        const active = state.zoneId === z.id;
        return `<div class="zone-item ${active ? 'active' : ''}">
        <div>
          <strong>${escapeHtml(z.name)}</strong>
          <div class="muted">需 Lv.${z.minLv} · ${escapeHtml(z.flavor)}</div>
        </div>
        <button type="button" class="btn" data-zone="${z.id}" ${locked ? 'disabled' : ''}>${
          active ? '目前' : locked ? '未開' : '前往'
        }</button>
      </div>`;
      }).join('');
    el.querySelectorAll('[data-zone]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-zone');
        const z = ZONES.find((x) => x.id === id);
        if (!z || state.lv < z.minLv) return;
        if (state.hunting) stopHunt();
        state.zoneId = id;
        state.mob = null;
        pushLog(`來到「${z.name}」`);
        renderAll();
        save();
      });
    });
  }

  function renderBag() {
    const el = $('panel-bag');
    const eq = state.equip;
    const eqLines = ['weapon', 'armor', 'boots', 'ring']
      .map((slot) => {
        const labels = { weapon: '兵器', armor: '護甲', boots: '靴履', ring: '飾物' };
        const it = eq[slot];
        return `<div class="row"><span>${labels[slot]}</span><span>${
          it ? escapeHtml(it.name) : '（空）'
        }</span></div>`;
      })
      .join('');
    const bagLines = state.bag.length
      ? state.bag
          .map((it) => {
            const bonus = [
              it.atk ? `攻+${it.atk}` : '',
              it.def ? `防+${it.def}` : '',
              it.spd ? `速+${it.spd}` : '',
            ]
              .filter(Boolean)
              .join(' ');
            return `<div class="bag-item">
              <div><strong>${escapeHtml(it.name)}</strong><div class="muted">${bonus || '雜物'}</div></div>
              <div>
                ${it.slot ? `<button type="button" class="btn" data-eq="${it.uid}">裝上</button>` : ''}
                <button type="button" class="btn" data-sell="${it.uid}">出售</button>
              </div>
            </div>`;
          })
          .join('')
      : `<p class="muted">行囊空空，去掛機碰碰運氣。</p>`;
    el.innerHTML = `<h3>已裝備</h3>${eqLines}<h3 style="margin-top:12px">行囊</h3>${bagLines}`;
    el.querySelectorAll('[data-eq]').forEach((b) =>
      b.addEventListener('click', () => equipItem(b.getAttribute('data-eq')))
    );
    el.querySelectorAll('[data-sell]').forEach((b) =>
      b.addEventListener('click', () => sellItem(b.getAttribute('data-sell')))
    );
  }

  function renderHero() {
    const el = $('panel-hero');
    const school = SCHOOLS.find((s) => s.id === state.school);
    const weapon = WEAPONS.find((w) => w.id === state.weaponPath);
    const stats = calcStats(state);
    el.innerHTML = `<h3>俠客檔案</h3>
      <div class="row"><span>名號</span><strong>${escapeHtml(state.name)}</strong></div>
      <div class="row"><span>門派</span><span>${school ? school.name : ''}</span></div>
      <div class="row"><span>路數</span><span>${weapon ? weapon.name : ''}</span></div>
      <div class="row"><span>等級</span><span>Lv.${state.lv}</span></div>
      <div class="row"><span>戰績</span><span>擊敗 ${state.kills} 人</span></div>
      <div class="row"><span>綜合</span><span>攻${stats.atk}／防${stats.def}／速${stats.spd}</span></div>
      <p class="muted" style="margin-top:10px">掛機時依速度加快出手；裝備可再堆屬性。</p>`;
  }

  function renderLore() {
    const el = $('panel-lore');
    el.innerHTML =
      `<h3>江湖閒談</h3><div class="lore">` +
      LORE.map((x) => `<p><strong>${escapeHtml(x.title)}</strong><br/>${escapeHtml(x.body)}</p>`).join('') +
      `<p class="muted">內容為原創閑話，向金庸的家國情義與古龍的刀光酒氣致敬，不引用小說原文。</p></div>`;
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
    const sEl = $('school-list');
    sEl.innerHTML = SCHOOLS.map(
      (s) => `<button type="button" class="choice ${selectedSchool === s.id ? 'selected' : ''}" data-school="${s.id}">
        ${s.name}<small>${s.desc}</small></button>`
    ).join('');
    sEl.querySelectorAll('[data-school]').forEach((b) =>
      b.addEventListener('click', () => {
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
      state = defaultHero(name, selectedSchool, selectedWeapon);
      pushLog(`「${name}」踏入江湖。`);
      save();
      showGame();
    });

    $('btn-hunt').addEventListener('click', startHunt);
    $('btn-stop').addEventListener('click', stopHunt);
    $('btn-reset').addEventListener('click', () => {
      if (!confirm('確定重置角色？本機進度會清除。')) return;
      stopHunt();
      localStorage.removeItem(SAVE_KEY);
      state = null;
      showCreate();
    });

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const id = tab.getAttribute('data-tab');
        ['zones', 'bag', 'hero', 'lore'].forEach((p) => {
          $('panel-' + p).classList.toggle('hidden', p !== id);
        });
      });
    });
  }

  function boot() {
    renderChoices();
    bind();
    const saved = load();
    if (saved && saved.name) {
      state = saved;
      state.hunting = false;
      showGame();
    } else {
      showCreate();
    }
  }

  boot();
})();
