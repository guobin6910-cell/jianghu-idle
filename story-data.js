/* 《江湖閒談錄》章回劇情資料（第一章：青石風雲）
 * 結構：節點 node = { id, bg, place, pages[], choices[], next, battle }
 * pages 元素可為字串或 {t, who}；choices[].e 為效果；next 可為函式 (c)=>節點 id。
 * 條件 c：c.f(flag) c.r(npc) c.did(actionId) c.has(intelId) c.n 已完成行動數。
 * 關係值：資料裡寫的是「點」，引擎 ×10 轉成 -100~100。
 */
(function () {
  const S = {};
  S.CHAPTERS = {
    1: { id: 1, title: '第一章・青石風雲', sub: '雨落青石，少年入局。' },
    2: { id: 2, title: '第二章・洛陽舊事', sub: '十五年前，洛陽城。', locked: true },
  };
  S.PORTRAIT = {
    qinghe: 'portrait_shen_qinghe', old: 'portrait_old_swordsman', woman: 'portrait_white_lady', bf: 'portrait_blackfeather',
  };
  S.PEOPLE = {
    qinghe: { name: '沈青河', img: 'portrait_shen_qinghe', desc: '雨夜撞上你的少年。身世只透露了一半。' },
    oldSwordsman: { name: '獨臂老人', img: 'portrait_old_swordsman', desc: '醉仙樓二樓獨酌的老人，桌邊放著一柄斷劍。' },
    mysteriousWoman: { name: '戴斗笠的白衣女子', img: 'portrait_white_lady', desc: '倚窗看雨的女子，似乎也在等一個人。' },
    blackfeather: { name: '黑羽盟', img: 'portrait_blackfeather', desc: '左手戴黑護腕、以黑羽為記的神秘勢力。' },
  };
  S.INTEL = {
    blackfeather: ['黑羽盟', '三名黑衣人左手皆戴黑色護腕。黑羽為記，是一個神秘勢力。'],
    bf_code: ['黑羽盟暗號', '「羽落無聲，雨過留痕。」黑羽盟的人以此相認。'],
    heifeng: ['黑風嶺', '黑風嶺昨夜死了四個人，第四個是黑羽盟的人。'],
    old_suspect: ['可疑人物：獨臂老人', '虎口厚繭，斷劍不離身，劍柄刻著「沈」字。'],
    shen_mark: ['同一個「沈」字', '醉仙樓後院柴房的木板上，刻著與老人斷劍相同的「沈」字。'],
    bf_note: ['黑羽盟交貨', '黑羽盟的人提過：三日後，醉仙樓後院交貨。'],
    bf_in_zx: ['醉仙樓裡的黑羽', '醉仙樓角落坐著兩個左手戴黑護腕的人。'],
    heifeng_truth: ['黑風嶺真相（一角）', '死者並非同夥內鬨，現場有第三方的痕跡。'],
    jade_back: ['玉佩背面的小字', '「十五年前，洛陽城。」'],
  };
  S.ITEMS = {
    jade: ['染血玉佩', '沈青河留下的玉佩，血跡未乾。'],
    bf_token: ['黑羽令', '黑羽盟的信物，沉甸甸的黑鐵牌。'],
    rain_tube: ['「雨停了」竹筒', '白衣女子託你轉交的小竹筒。'],
    bracer: ['黑護腕', '從黑風嶺死者腕上取下的黑護腕。'],
  };
  S.GEAR = {
    charm: { id: 'story_charm', name: '青石護符', slot: 'ring', def: 2, spd: 1 },
    bfring: { id: 'story_bfring', name: '黑羽指環', slot: 'ring', atk: 2, spd: 1 },
    oldblade: { id: 'story_oldblade', name: '斷劍殘鋒', slot: 'weapon', atk: 5 },
  };
  S.RELNAME = { qinghe: '沈青河', oldSwordsman: '獨臂老人', mysteriousWoman: '神秘女子', blackfeather: '黑羽盟' };

  const Q = (s) => s; // 標記用
  const N = {};
  S.NODES = N;

  N.prologue = {
    bg: null, place: '江湖',
    pages: [
      '江湖很大。\n\n有人仗劍天涯。\n有人藏身市井。\n有人為了一壺酒拔劍。\n也有人為了一句承諾，追尋半生。',
      '你原本只是個無名之輩。\n\n沒有顯赫身世。\n沒有驚世武功。\n更沒有名震天下的師門。\n\n直到那一日——\n你走進了青石鎮。\n\n從此，你的名字開始出現在江湖之中。',
    ],
    choices: [{ label: '踏入江湖', next: 'rain1' }],
  };

  N.rain1 = {
    bg: 'scene_qingshi_rain', place: '青石鎮・雨夜',
    pages: [
      '夜雨打在青石街上。\n屋簷上的雨水連成一線。\n\n你牽著馬走進青石鎮。\n今日的鎮子似乎有些異樣。\n街上的行人走得很快，就連平日熱鬧的酒樓，也早早關了半扇門。',
      { t: '就在此時——\n一名少年突然從巷子裡衝出。\n他撞上你的肩膀。\n\n「對不起……」\n\n少年抬頭看了你一眼，臉色突然變了。\n「你……不是他們的人？」', who: 'qinghe' },
      { t: '遠處，傳來三聲馬蹄。\n\n少年壓低聲音：\n「求你……別把我交出去。」', who: 'qinghe' },
    ],
    choices: [
      {
        label: '上前護住少年', next: 'bf_arrive',
        e: { f: ['saved_qinghe', 'met_qinghe'], r: { qinghe: 1, blackfeather: -1 }, t: { xiayi: 1 } },
        res: ['你沒有多問。\n只是側身一步，將少年擋在身後。\n\n「躲好。」\n「剩下的，我來處理。」'],
      },
      {
        label: '先問清楚事情原委', next: 'bf_arrive',
        e: { f: ['investigated_qinghe', 'met_qinghe'], r: { qinghe: 1 }, t: { insight: 1 } },
        res: ['你沒有拔劍。\n只是看著少年。\n\n「先告訴我。」\n「他們為什麼要抓你？」\n\n少年愣了一下。\n「你……不怕惹禍上身？」'],
      },
      {
        label: '側身讓開', next: 'bf_arrive',
        e: { f: ['abandoned_qinghe', 'met_qinghe'], r: { qinghe: -1 }, t: { cold: 1 } },
        res: ['你沒有拔劍。\n只是淡淡地說：\n\n「你的麻煩，與我無關。」\n\n少年咬了咬牙。\n「我明白了。」\n\n他退進牆角的暗影裡，沒再出聲。'],
      },
      {
        label: '暗中觀察', next: 'bf_arrive',
        e: { f: ['noticed_blackfeather', 'met_qinghe'], t: { insight: 1 }, intel: ['blackfeather'] },
        res: ['你沒有立即回答。\n只是望向遠處。\n\n三名黑衣人策馬而來。\n他們沒有佩刀。可每個人的左手，都戴著黑色護腕。\n\n你忽然想起一個江湖傳聞。\n黑羽為記。\n\n這些人……很可能來自一個神秘勢力。',
          '【解鎖情報：黑羽盟】'],
      },
    ],
  };

  N.bf_arrive = {
    bg: 'scene_qingshi_rain', place: '青石鎮・雨夜',
    pages: [
      { t: '三名黑衣人勒馬停在街心，雨水順著斗笠邊緣滴落。\n\n領頭者低頭看你：\n「小子。」\n「可曾看見一名少年從這裡經過？」', who: 'bf' },
    ],
    choices: [
      {
        label: '說沒看見', e: { f: ['lied_to_bf', 'bf_met'], r: { blackfeather: -1 } },
        res: (c) => c.f('saved_qinghe')
          ? ['「沒看見。」\n\n他瞇起眼，目光越過你的肩，落在你身後那一小塊不自然的陰影上。\n「看來，你也不太會說謊。」']
          : ['「沒看見。」\n\n他盯了你片刻，未再多問。\n「最好是真的。」\n\n馬蹄聲在雨裡遠去。'],
        next: (c) => (c.f('saved_qinghe') ? 'bf_fight' : 'qh_leave'),
      },
      {
        label: '指向少年', show: (c) => !c.f('saved_qinghe'),
        e: { f: ['betrayed_qinghe', 'blackfeather_favor', 'bf_met'], r: { qinghe: -3, blackfeather: 1 }, silver: 60, t: { cold: 1 } },
        res: ['你抬手，指向牆角。\n\n少年的臉在暗影裡白了一瞬。\n黑衣人翻身下馬，伸手去拽——少年卻猛地掙開，撞翻了一旁的竹筐，身影沒入巷弄。\n\n「他跑不遠。」領頭者丟給你一小袋銀兩，「算你識相。」\n\n奔逃前，少年回頭看你的那一眼，你很久都忘不掉。'],
        next: 'qh_leave',
      },
      {
        label: '亮出兵器', show: (c) => c.f('saved_qinghe'),
        e: { f: ['defied_blackfeather', 'bf_met'], r: { blackfeather: -2 } },
        res: ['你的手按在兵器上，沒有說話。\n\n領頭者的視線掃過你身後，低低笑了一聲。\n「原來如此。」'],
        next: 'bf_fight',
      },
      {
        label: '反問對方身份', e: { f: ['bf_met'] },
        res: (c) => c.f('noticed_blackfeather')
          ? ['你不看他的臉，只看他的左手。\n\n「黑羽為記……閣下腰牌上沒有，護腕上卻有。是『黑羽盟』的人吧？」\n\n雨聲裡，領頭者沉默了很久。\n「你知道得不少。」他壓低聲音，念了一句只有自己人才懂的話：\n\n「羽落無聲，雨過留痕。」\n\n你記住了。他似乎也記住了你。\n「今夜，算你運氣。」\n\n三騎調轉馬頭，消失在雨幕深處。',
            '【解鎖情報：黑羽盟暗號】']
          : ['「閣下又是什麼人？」\n\n領頭者笑了。\n「多管閒事的人，通常不長命。」'],
        eFn: (c) => (c.f('noticed_blackfeather')
          ? { f: ['asked_blackfeather_code'], intel: ['bf_code'], r: { blackfeather: 1 } }
          : { r: { blackfeather: -1 } }),
        next: (c) => (c.f('noticed_blackfeather') ? 'qh_leave' : (c.f('saved_qinghe') ? 'bf_fight' : 'qh_leave')),
      },
      {
        label: '保持沉默', e: { f: ['bf_met', 'silent_to_bf'] },
        res: (c) => c.f('saved_qinghe')
          ? ['你不答。雨聲淹沒了所有話。\n\n領頭者的視線慢慢落到你身後。\n沉默，有時候也是一種答案。']
          : ['你不答。雨聲淹沒了所有話。\n\n領頭者等了片刻，低哼一聲，撥轉馬頭。\n「走。」'],
        next: (c) => (c.f('saved_qinghe') ? 'bf_fight' : 'qh_leave'),
      },
    ],
  };

  N.bf_fight = {
    bg: 'scene_qingshi_rain', place: '青石鎮・雨夜',
    pages: [
      { t: '黑衣人拔刀。\n\n「看來今日又多了一個多管閒事的人。」\n\n刀光劃過雨幕。\n你握緊手中的兵器。', who: 'bf' },
    ],
    battle: { count: 3, name: '黑羽追兵', win: 'bf_after', lose: 'bf_after_lose', label: '戰鬥開始' },
  };
  N.bf_after = {
    bg: 'scene_qingshi_rain', place: '青石鎮・雨夜',
    e: { f: ['fought_bf'], r: { blackfeather: -1 } },
    pages: ['最後一名黑衣人倒下，刀「噹」的一聲落在青石上。\n\n雨還在下。\n你喘了口氣，發覺手心全是汗。', '倖存的人翻身上馬，頭也不回地逃進夜色。\n\n巷口的暗影動了動。'],
    next: 'qh_leave',
  };
  N.bf_after_lose = {
    bg: 'scene_qingshi_rain', place: '青石鎮・雨夜',
    e: { f: ['fought_bf', 'lost_to_bf'], r: { qinghe: 1 } },
    pages: ['你單膝跪進積水裡，眼前一黑。\n\n黑衣人收刀，低頭看了你一眼。「只是個路過的。」\n馬蹄聲遠去。\n\n過了不知多久，一雙手把你拖到屋簷下。'],
    next: 'qh_leave',
  };

  // 離別：依前面的選擇有四種版本
  function cat(c) {
    if (c.f('betrayed_qinghe')) return 'betrayed';
    if (c.f('saved_qinghe') || c.f('investigated_qinghe')) return 'friendly';
    if (c.f('abandoned_qinghe')) return 'cold';
    return 'wary';
  }
  S.cat = cat;
  N.qh_leave = {
    bg: 'scene_qingshi_rain', place: '青石鎮・雨夜',
    pages: (c) => {
      const k = cat(c);
      if (k === 'friendly') return [
        { t: '少年從暗處走出，渾身濕透，卻挺直了背。\n\n「我叫沈青河。」\n\n他從懷裡摸出一枚染了血的玉佩，塞進你手裡。\n「這個，先替我收著。」', who: 'qinghe' },
        { t: '「如果你真的想知道。」\n「三日後。」\n「醉仙樓。」\n「我會告訴你。」\n\n他說完，轉身消失在巷子盡頭。', who: 'qinghe' },
      ];
      if (k === 'wary') return [
        { t: '黑衣人走遠之後，少年才從巷口慢慢探出身子。\n\n「你沒有把我交出去……也沒有幫我。為什麼？」\n\n你沒有回答。他想了想，把一枚染血的玉佩放進你手裡。\n「我叫沈青河。這個，先替我收著。」', who: 'qinghe' },
        { t: '「如果你真的想知道。」\n「三日後。」\n「醉仙樓。」\n「我會告訴你。」', who: 'qinghe' },
      ];
      if (k === 'cold') return [
        { t: '少年從牆角站起來，看著你，眼神裡沒有責怪，只有一種過早學會的疲倦。\n\n「我叫沈青河。記住這個名字，也許哪天，你會後悔。」', who: 'qinghe' },
        { t: '他轉身奔向巷尾，有東西從他衣襟裡掉在青石板上。\n你彎腰撿起——是一枚染血的玉佩。\n\n遠處他的聲音飄回來：\n「三日後，醉仙樓。你若還有一點良心——來。」', who: 'qinghe' },
      ];
      return [
        { t: '巷弄深處，少年的聲音隔著雨傳來，冷得像刀：\n\n「我記住你了。」\n「三日後，醉仙樓——我要你親眼看看，你做了什麼。」', who: 'qinghe' },
        '你低頭，發現腳邊有一枚染血的玉佩。大概是他掙脫時掉的。\n\n你撿了起來。',
      ];
    },
    e: { f: ['has_jade', 'qh_leave_done'], item: ['jade'], people: ['qinghe', 'blackfeather'], phase: 'waiting' },
    tail: ['雨漸漸小了。\n三日之期，不算長，也不算短。\n\n【任務更新：前往醉仙樓】\n（掛機擊敗 30 名對手，算作三日之期。）'],
    choices: [{ label: '繼續趕路', next: '__close' }],
  };

  // ===== 醉仙樓 =====
  N.zx_enter = {
    bg: 'scene_zuixian', place: '醉仙樓',
    pages: ['三日一晃。\n\n醉仙樓的燈籠在雨後的風裡輕輕搖著，酒香、人聲、碗筷碰撞聲混在一起。\n樓上樓下，各坐著各的心事。\n\n你推門走了進去。'],
    next: 'zx_hub', e: { f: ['zx_entered'], phase: 'zuixian' },
  };
  S.ZX_AREAS = ['一樓', '二樓', '後院'];
  S.ZX_ACTIONS = [
    {
      id: 'waiter', area: '一樓', label: '找小二',
      pages: (c) => ['小二擦著桌子，頭也不抬。\n\n「客官打尖還是住店？……尋人？哪位？」\n「沈公子？嘖，前兩日還在這坐著，今兒個倒是沒見人影。」\n\n他壓低聲音：「這幾天樓裡來的生面孔多，您留神。」'],
    },
    {
      id: 'listen', area: '一樓', label: '聽鄰桌談話',
      pages: ['鄰桌兩個商販模樣的人，腦袋湊得很近。\n\n「聽說了嗎？」\n「青石鎮外，黑風嶺昨夜死了三個人。」\n「三個？」\n「不。」\n\n說話的人壓低聲音。\n「是四個。」\n「第四個……是黑羽盟的人。」', '【江湖情報：黑風嶺】'],
      e: { f: ['heard_heifeng'], intel: ['heifeng'] },
    },
    {
      id: 'drunks', area: '一樓', label: '觀察酒客',
      pages: (c) => {
        if (c.f('asked_blackfeather_code')) return ['角落坐著兩個人，左手都戴著黑護腕。\n\n你走過去，用指節在桌面輕敲兩下，低聲念出那句暗號。\n兩人互看一眼，其中一個把一小袋銀子推到你面前。\n\n「自己人。喝一杯。」'];
        if (c.f('noticed_blackfeather')) return ['你的目光掃過人群，在角落停住——兩個人，左手戴著黑護腕。\n\n他們察覺了你的視線，其中一人慢慢轉過頭來。你不動聲色地移開眼，端起了酒杯。', '【記下：醉仙樓裡的黑羽】'];
        return ['酒客形形色色。有人划拳，有人伏桌睡去，有人對著空碗發呆。\n\n角落那兩個人話很少，只低頭喝酒，護腕黑得有點扎眼——你沒多想。'];
      },
      eFn: (c) => (c.f('asked_blackfeather_code') ? { silver: 120, r: { blackfeather: 1 } } : (c.f('noticed_blackfeather') ? { intel: ['bf_in_zx'] } : {})),
    },
    {
      id: 'drink', area: '一樓', label: '喝酒（-30 銀）',
      cost: 30,
      pages: ['你要了一壺燒刀子。\n\n酒很烈，嗆得喉嚨發燙，三杯下肚，雨夜裡那股冷勁才慢慢散了。\n\n傷也不那麼疼了。'],
      e: { f: ['drank_zx'], silver: -30, heal: true },
    },
    {
      id: 'woman', area: '二樓', label: '查看神秘女子',
      pages: (c) => c.f('saved_qinghe')
        ? [{ t: '窗邊，一名戴斗笠的白衣女子正看著雨。\n你剛靠近，她便開了口，沒有回頭：\n\n「你就是雨夜裡，護著那孩子的人。」', who: 'woman' },
          { t: '「青石鎮的雨很大。肯為陌生人擋雨的人，不多。」\n\n她將一個小竹筒推到桌邊。\n「他若問起，就說——雨停了。」', who: 'woman' },
          '【獲得：「雨停了」竹筒】']
        : [{ t: '一名戴斗笠的白衣女子正在窗邊看雨。她似乎也在等一個人。\n\n「這位客官，座位有人了。」\n\n她說完便轉回頭去，直到你離開，都沒再說第二句話。', who: 'woman' }],
      eFn: (c) => (c.f('saved_qinghe')
        ? { f: ['helped_mysterious_woman', 'talked_woman'], r: { mysteriousWoman: 2 }, item: ['rain_tube'], people: ['mysteriousWoman'] }
        : { f: ['seen_woman'], people: ['mysteriousWoman'] }),
    },
    {
      id: 'old', area: '二樓', label: '觀察獨臂老人',
      pages: [{ t: '老人獨自喝酒。\n酒杯從未離手。\n\n他的左手虎口滿是厚繭，右邊的衣袖卻空空垂著。\n桌邊放著一柄斷劍。\n\n你忽然注意到——\n劍柄上刻著一個字。\n\n「沈」。', who: 'old' }, '【可疑人物：獨臂老人】'],
      e: { f: ['watched_old_swordsman'], r: { oldSwordsman: 1 }, intel: ['old_suspect'], people: ['oldSwordsman'] },
    },
    {
      id: 'quiet', area: '二樓', label: '尋找安靜位置',
      pages: (c) => c.f('noticed_blackfeather')
        ? ['你挑了靠欄杆的角落。隔著一道屏風，兩個壓低的聲音飄過來。\n\n「後院的貨，今夜之前務必送到。」\n「……三日之約，一個都不能少。」\n\n你不動聲色地喝茶，把這幾句話一字不漏記了下來。', '【記下：黑羽盟交貨】']
        : ['你挑了個靠欄杆的位置坐下。\n\n樓下的喧鬧隔了一層木板，變得悶悶的。偶爾有幾句「洛陽」「舊案」從別桌飄來，轉眼又被笑聲蓋過。'],
      eFn: (c) => (c.f('noticed_blackfeather') ? { f: ['knows_handover'], intel: ['bf_note'] } : {}),
    },
    {
      id: 'horse', area: '後院', label: '查看馬匹',
      pages: (c) => c.f('fought_bf')
        ? ['後院拴著三匹馬。鞍上烙著一枚小小的羽印。\n\n你認得——那是雨夜裡追兵的馬。馬鞍袋裡還有半袋乾糧與碎銀，你沒客氣。']
        : ['後院拴著幾匹馬。其中三匹的鞍上烙著一枚小小的羽印，毛色被雨水洗得發亮。\n\n馬在打響鼻，像在等主人。'],
      eFn: (c) => (c.f('fought_bf') ? { silver: 40, f: ['saw_horses'] } : { f: ['saw_horses'] }),
    },
    {
      id: 'trace', area: '後院', label: '搜尋可疑痕跡',
      pages: (c) => {
        const out = ['泥地裡有拖拽的痕跡，延伸到柴房後。雨水沖淡了血，但沖不乾淨。'];
        if (c.f('watched_old_swordsman')) out.push('柴房的木板上，有人用劍尖刻過一個字：「沈」。\n筆勢和老人斷劍上的字，一模一樣。', '【記下：同一個「沈」字】');
        if (c.f('knows_handover')) out.push('你循著屏風後那幾句話找去，在柴堆縫裡摸到一塊沉甸甸的黑鐵牌。\n\n【獲得：黑羽令】');
        if (out.length === 1) out.push('你翻找了一圈，只找到幾枚生鏽的鐵釘，和一小串銅錢。');
        return out;
      },
      eFn: (c) => {
        const e = { f: ['searched_yard'] };
        if (c.f('watched_old_swordsman')) { e.f.push('linked_old_to_shen'); e.intel = ['shen_mark']; e.r = { oldSwordsman: 1 }; }
        if (c.f('knows_handover')) { e.item = ['bf_token']; e.f.push('got_bf_token'); }
        if (!c.f('watched_old_swordsman') && !c.f('knows_handover')) e.silver = 20;
        return e;
      },
    },
  ];

  // ===== 赴約 =====
  N.qh_meet = {
    bg: 'scene_zuixian', place: '醉仙樓・後院',
    pages: (c) => {
      const k = cat(c);
      if (k === 'friendly' || k === 'wary') return [
        { t: (k === 'friendly' ? '後門被輕輕推開，沈青河渾身是雨，卻笑了一下。\n\n「你真的來了。」' : '後門吱呀一聲，沈青河站在門口，看了你很久。\n\n「你……來了。」'), who: 'qinghe' },
        { t: '「我不是什麼名門之後。我只是替人送一樣東西。」\n\n他看向你手裡的玉佩。\n「那枚玉佩，不是我的。是一個人臨死前，塞進我手裡的。」\n\n「黑羽盟要的，不是我——是它。」', who: 'qinghe' },
        { t: '「我想請你，去黑風嶺看看。」\n「那個人，是在那裡倒下的。」', who: 'qinghe' },
      ];
      if (k === 'cold') return [
        { t: '他來了，卻站在門口，沒有進來。\n\n「我不是來求你的。」', who: 'qinghe' },
        { t: '「雨夜裡你讓開了路。我不怪你——但我也不再信你。」\n\n他看了一眼你手裡的玉佩。\n「那東西，我欠它一個交代。你若真想知道它是什麼，黑風嶺，自己去看。」', who: 'qinghe' },
      ];
      return [
        '後院的門沒有被推開。\n\n沈青河沒有來。桌上多了一張字條，筆跡陌生——\n「識時務者，黑羽盟不虧待。今夜醉仙樓後院。」',
        { t: '一個穿黑衣的人從柴堆後走出，左手黑護腕在燈下泛著冷光。\n\n「我家主人欣賞識時務的人。」\n「那枚玉佩，你拿著，比在別人手裡，更有價值。」', who: 'bf' },
      ];
    },
    choices: [
      {
        label: '答應他的請託', show: (c) => cat(c) === 'friendly' || cat(c) === 'wary',
        e: { f: ['accepted_qinghe_request', 'meet_done'], r: { qinghe: 2 }, gear: ['charm'], phase: 'heifeng' },
        res: ['沈青河從腕上解下一枚小小的青石護符，放進你手裡。\n\n「保平安的。不貴重，是我娘留下的。」\n\n【獲得：青石護符】\n【任務更新：沈青河的請託・查探黑風嶺】'],
        next: '__close',
      },
      {
        label: '讓我先想想', show: (c) => cat(c) === 'friendly' || cat(c) === 'wary',
        e: { f: ['hesitated_qinghe', 'meet_done'], phase: 'heifeng' },
        res: ['沈青河點點頭，沒有勉強。\n\n「我等你。黑風嶺就在鎮外，隨時都能去。」\n\n【任務更新：查探黑風嶺】'],
        next: '__close',
      },
      {
        label: '向他道歉', show: (c) => cat(c) === 'cold',
        e: { f: ['apologized_qinghe', 'meet_done'], r: { qinghe: 2 }, phase: 'heifeng' },
        res: ['「那天晚上，是我錯了。」\n\n沈青河沉默了很久，終於輕輕嘆了口氣。\n「……黑風嶺。如果你還想知道，就去。」\n\n【任務更新：查探黑風嶺】'],
        next: '__close',
      },
      {
        label: '不作聲', show: (c) => cat(c) === 'cold',
        e: { f: ['silent_qinghe', 'meet_done'], phase: 'heifeng' },
        res: ['你什麼也沒說。\n沈青河等了一會兒，轉身消失在雨裡。\n\n【任務更新：查探黑風嶺】'],
        next: '__close',
      },
      {
        label: '接受邀請', show: (c) => cat(c) === 'betrayed',
        e: { f: ['joined_bf_invite', 'meet_done'], r: { blackfeather: 3 }, gear: ['bfring'], silver: 200, t: { ambition: 1 }, phase: 'heifeng' },
        res: ['你把玉佩在掌心轉了一圈，點了點頭。\n\n黑衣人從袖中取出一枚黑羽指環。\n「黑風嶺，自會有人與你接頭。」\n\n【獲得：黑羽指環】\n【任務更新：黑羽盟的邀請・黑風嶺】'],
        next: '__close',
      },
      {
        label: '婉拒', show: (c) => cat(c) === 'betrayed',
        e: { f: ['refused_bf_invite', 'meet_done'], r: { blackfeather: -1 }, phase: 'heifeng' },
        res: ['「我不替別人辦事。」\n\n黑衣人看了你片刻，笑意收了。\n「黑風嶺的路，你自己走。別怪沒人提醒你。」\n\n【任務更新：查探黑風嶺】'],
        next: '__close',
      },
    ],
  };

  // ===== 黑風嶺 =====
  N.hf_enter = {
    bg: 'scene_moonroad', place: '黑風嶺',
    pages: (c) => {
      const out = ['山風從嶺口灌下來，帶著濕土和血的味道。\n\n你沿著山道往上，月色被雲吃了一半。'];
      if (c.f('joined_bf_invite')) out.push('山道轉角，一個戴黑護腕的人靠在石上等你。\n\n「來了。」他不多說，只指了指前方，「自己看吧。」');
      return out;
    },
    next: (c) => (c.r('blackfeather') <= -20 ? 'hf_ambush' : 'hf_scene'),
  };
  N.hf_ambush = {
    bg: 'scene_moonroad', place: '黑風嶺',
    pages: [{ t: '路邊的樹影忽然動了。\n\n「雨夜那一筆，黑羽盟還沒算。」\n\n三個黑衣人從樹後走出，擋住了去路。', who: 'bf' }],
    battle: { count: 3, name: '黑羽追兵', win: 'hf_scene', lose: 'hf_scene_lose', label: '戰鬥開始' },
  };
  N.hf_scene_lose = {
    bg: 'scene_moonroad', place: '黑風嶺', e: { f: ['lost_at_heifeng'] },
    pages: ['你被擊倒在山道上。\n\n黑衣人翻了翻你的行囊，什麼也沒拿，只丟下一句：「滾回去。」\n\n過了很久，你才撐起身子，繼續往上走。'],
    next: 'hf_scene',
  };
  N.hf_scene = {
    bg: 'scene_moonroad', place: '黑風嶺',
    pages: ['山道盡頭是一片亂石坡。\n\n三具屍體橫在坡下，衣著各異，傷口都在背後。第四個倒在最遠處，左腕上，是黑色的護腕。\n\n黑羽盟的人。\n\n風停了一瞬，山裡安靜得像有人在聽。'],
    choices: [
      {
        label: '仔細搜查屍體', next: 'hf_end', e: { f: ['searched_bodies'], intel: ['heifeng_truth'], t: { insight: 1 } },
        resFn: (c) => c.f('linked_old_to_shen')
          ? ['你在最近一具屍體的衣襟下，摸到半截斷劍刃，刃根刻著一個「沈」字。\n\n與醉仙樓裡那個老人的斷劍，一模一樣。\n\n【獲得：斷劍殘鋒】']
          : ['你在最近一具屍體的衣襟下，摸到半截斷劍刃，刃根刻著一個「沈」字。\n\n你把它收了起來。\n\n【獲得：斷劍殘鋒】'],
        eFn: (c) => ({ gear: ['oldblade'], r: c.f('linked_old_to_shen') ? { oldSwordsman: 1 } : {} }),
      },
      {
        label: '查看四周足跡', next: 'hf_end', e: { f: ['followed_trail'], t: { insight: 1 } },
        res: ['亂石坡上的足跡很雜，但有一行特別深——往東，朝著洛陽的方向。\n\n人是從那邊來的，也是往那邊去的。'],
      },
      {
        label: '取下死者的黑護腕', next: 'hf_end', e: { f: ['took_bracer'], item: ['bracer'], r: { blackfeather: -1 }, t: { cold: 1 } },
        res: ['你蹲下身，取下那隻黑護腕。\n\n內側繡著一個極小的字，是個編號。\n\n【獲得：黑護腕】'],
      },
    ],
  };
  N.hf_end = {
    bg: 'scene_moonroad', place: '黑風嶺',
    e: { f: ['heifeng_done'], phase: 'ending' },
    pages: (c) => {
      const out = ['你在三具屍身下，找到一塊被血浸透的油布，包著半張沒燒完的紙。\n\n字跡模糊，只剩一行能辨：\n\n「……玉不可落於……手。」'];
      if (c.f('joined_bf_invite')) out.push('接頭的黑衣人在背後輕輕拍了拍你的肩。\n「看見了？他們說，是『那邊』的人下的手。」\n\n你沒有回答。話太乾淨，反而讓人起疑。');
      else if (c.f('accepted_qinghe_request') || c.f('apologized_qinghe')) out.push('你忽然想起沈青河說過的話——那個人，是在這裡倒下的。\n\n他沒有說謊。');
      return out;
    },
    next: 'ending',
  };

  // ===== 章末 =====
  N.ending = {
    bg: 'scene_moonroad', place: '青石鎮外',
    pages: (c) => {
      const out = [
        '夜深。\n你站在青石鎮外。\n遠處山脈被月色染成一片黑。\n\n你低頭看著手中的染血玉佩。\n\n玉佩背面，不知何時多了一行小字：\n\n「十五年前，洛陽城。」\n\n你皺起眉頭。',
        { t: '身後忽然傳來馬蹄聲。\n你回頭。\n\n那名戴斗笠的女子站在雨中。\n她看著你手中的玉佩。\n\n沉默良久。', who: 'woman' },
      ];
      if (c.f('helped_mysterious_woman')) out.push({ t: '「雨停了，是嗎？」\n\n她輕輕說，像在對你，也像在對很久以前的什麼人。', who: 'woman' });
      out.push({ t: '「原來……它真的選中了你。」', who: 'woman' });
      out.push('畫面淡出。');
      return out;
    },
    e: { f: ['saw_jade_back'], intel: ['jade_back'], people: ['mysteriousWoman'] },
    choices: [{ label: '完', next: 'chapter_end' }],
  };
  N.chapter_end = {
    bg: 'scene_moonroad', place: '', center: true,
    pages: ['【第一章・青石風雲】\n\n【完】\n\n※ 下一章：《第二章・洛陽舊事》'],
    e: { f: ['chapter1_done'], phase: 'done', complete: 'ch1' },
    choices: [{ label: '繼續江湖', next: '__close' }],
  };

  // ===== 履歷（只記錄做過什麼，不評斷） =====
  S.RESUME = [
    ['saved_qinghe', '曾在雨夜救下沈青河'], ['investigated_qinghe', '曾在雨夜先問清沈青河的來歷'],
    ['abandoned_qinghe', '曾在雨夜側身讓開'], ['noticed_blackfeather', '曾看出黑羽為記'],
    ['betrayed_qinghe', '曾向黑羽追兵指出沈青河的去向'], ['asked_blackfeather_code', '曾問出黑羽盟的暗號'],
    ['fought_bf', '曾與黑羽追兵交手'], ['watched_old_swordsman', '曾調查獨臂老人'],
    ['linked_old_to_shen', '曾看出斷劍與柴房上的同一個「沈」字'], ['helped_mysterious_woman', '曾與白衣女子說過話'],
    ['accepted_qinghe_request', '曾答應沈青河的請託'], ['apologized_qinghe', '曾向沈青河道歉'],
    ['joined_bf_invite', '曾接受黑羽盟的邀請'], ['refused_bf_invite', '曾婉拒黑羽盟的邀請'],
    ['heifeng_done', '曾踏上黑風嶺'],
  ];
  S.RESUME_PENDING = [['heifeng_done', '黑風嶺真相'], ['chapter1_done', '洛陽舊事（第二章）']];

  // ===== 卷宗（任務清單） =====
  S.QUESTS = [
    { id: 'q_meet', text: '遇見沈青河', done: (c) => c.f('qh_leave_done') || c.f('met_qinghe') && c.f('bf_met') },
    { id: 'q_bf', text: '黑羽追兵', done: (c) => c.f('bf_met') },
    { id: 'q_zx', text: '前往醉仙樓（三日之期）', show: (c) => c.f('qh_leave_done'), done: (c) => c.f('zx_entered') },
    { id: 'q_qh', text: '沈青河的請託', show: (c) => c.f('accepted_qinghe_request'), done: (c) => c.f('heifeng_done') },
    { id: 'q_bfinv', text: '黑羽盟的邀請', show: (c) => c.f('joined_bf_invite'), done: (c) => c.f('heifeng_done') },
    { id: 'q_hf', text: '查探黑風嶺', show: (c) => c.f('meet_done'), done: (c) => c.f('heifeng_done') },
    { id: 'q_jade', text: '找出染血玉佩的秘密', show: (c) => c.f('qh_leave_done'), done: (c) => c.f('chapter1_done') },
  ];

  // ===== 掛機江湖事件（低機率，不連續彈窗） =====
  S.EVENTS = [
    {
      id: 'ev_fight', title: '林中兵器聲', when: () => true,
      pages: ['你行走山道時，忽然聽見林中傳來兵器交擊聲。'],
      choices: [
        { label: '前往查看', res: '你撥開灌木，只見兩個漢子為了一匹馬打得鼻青臉腫。你勸開了他們，其中一人塞給你幾兩碎銀。', e: { silver: 40, chivalry: 1, t: { xiayi: 1 } } },
        { label: '繞道而行', res: '你繞了遠路。聲響漸漸遠去，山林恢復安靜。', e: {} },
        { label: '暗中觀察', res: '你伏在樹後看了一陣，確定只是尋常爭執，悄悄退走，順手拾到對方掉落的一枚銅錢袋。', e: { silver: 15, t: { insight: 1 } } },
      ],
    },
    {
      id: 'ev_bfscout', title: '黑羽探子', when: (c) => c.f('qh_leave_done') && (c.r('blackfeather') <= -10 || c.f('noticed_blackfeather')),
      pages: ['路旁茶棚裡，一個左手戴黑護腕的人正不動聲色地打量你。'],
      choices: [
        { label: '上前搭話', res: (c) => (c.f('asked_blackfeather_code') ? '你低聲念出暗號。對方神色一鬆，推過來一小袋銀子：「自己人，辛苦。」' : '你剛開口，對方便起身離去，桌上只留下一碗涼茶。'), eFn: (c) => (c.f('asked_blackfeather_code') ? { silver: 80, r: { blackfeather: 1 } } : { r: { blackfeather: -1 } }) },
        { label: '假裝沒看見', res: '你低頭喝茶，直到那人走遠，才發覺後背全是汗。', e: {} },
      ],
    },
    {
      id: 'ev_qhhelp', title: '沈青河的求援', when: (c) => c.f('saved_qinghe') && c.f('qh_leave_done') && !c.f('betrayed_qinghe'),
      pages: ['驛差送來一張字條，筆跡倉促：\n「青河：黑羽盟追得緊，借你一程路。」'],
      choices: [
        { label: '前往接應', res: '你趕到時，沈青河正躲在廢棄的磨坊裡。他塞給你一小袋碎銀：「路上用。」', e: { silver: 90, r: { qinghe: 1 }, chivalry: 2 } },
        { label: '婉拒', res: '你把字條收了起來。夜裡，風聲很大。', e: { r: { qinghe: -1 } } },
      ],
    },
    {
      id: 'ev_qhfoe', title: '沈青河攔路', when: (c) => c.f('betrayed_qinghe') && c.f('qh_leave_done'),
      pages: ['山路中央，沈青河靜靜站著，眼睛很亮，也很冷。\n\n「我說過，會讓你看見。」'],
      choices: [
        { label: '向他道歉', res: '他沒回答，轉身走了。但他沒有拔刀。', e: { r: { qinghe: 1 } } },
        { label: '冷眼相對', res: '「你這樣的人，我見過。」他說完便消失在林中。', e: { r: { qinghe: -1 }, t: { cold: 1 } } },
      ],
    },
    {
      id: 'ev_old', title: '酒旗下的老人', when: (c) => c.f('watched_old_swordsman'),
      pages: ['路邊酒旗下，那個獨臂老人又獨自坐著。這次他先抬了頭：\n「小子，你看得很仔細。」'],
      choices: [
        { label: '坐下喝一杯', res: '老人一言不發，倒了半碗酒推過來。喝完，他說：「別問，問了你會想知道更多。」', e: { r: { oldSwordsman: 2 }, silver: -10 } },
        { label: '點頭致意', res: '老人收回目光，低頭看著自己的空袖。', e: { r: { oldSwordsman: 1 } } },
      ],
    },
  ];
  S.OFFLINE_LINES = [
    '青石鎮的雨停了，說書先生把「雨夜追兵」講成了三個版本。',
    '醉仙樓的二樓換了一批客人，窗邊那個位置卻一直空著。',
    '有人在黑風嶺口擺了一碗清水，也不知是祭誰。',
    '鎮外來了一隊鏢車，領頭的人左手戴著黑色護腕。',
    '獨臂老人在酒旗下坐了一整天，酒沒喝完。',
    '一封寫給「沈」的信，被驛差退了回去。',
  ];

  window.JH_STORY = S;
})();
