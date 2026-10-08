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
    2: { id: 2, title: '第二章・洛陽舊事', sub: '十五年前，有些事情不該被忘記。' },
    3: { id: 3, title: '第三章・沈家舊門', sub: '有些門，十五年來從未真正關上。' },
    4: { id: 4, title: '第四章・白石橋', sub: '橋下流水依舊，橋上的人卻早已不在。' },
    5: { id: 5, title: '第五章・無名客', sub: '江湖上沒有人知道他的名字，卻有人記得他的故事。' },
    6: { id: 6, title: '第六章・沈雲川', sub: '一個已經死去十五年的人，為什麼還有人在找他？' },
    7: { id: 7, title: '第七章・聽風渡', sub: '十五年前最後見過沈雲川的人，還活著嗎？', locked: true },
  };
  S.PORTRAIT = {
    qinghe: 'portrait_shen_qinghe', old: 'portrait_old_swordsman', woman: 'portrait_white_lady', bf: 'portrait_blackfeather', su: 'portrait_su_wantang', ruolan: 'portrait_shen_ruolan', ruolan_anon: 'portrait_shen_ruolan',
    baishi: 'portrait_baishi_old',
    wumingke: 'portrait_wumingke', wumingke_anon: 'portrait_wumingke',
  };
  S.PEOPLE = {
    qinghe: { name: '沈青河', img: 'portrait_shen_qinghe', desc: '雨夜撞上你的少年。身世只透露了一半。' },
    oldSwordsman: { name: '獨臂老人', img: 'portrait_old_swordsman', desc: '醉仙樓二樓獨酌的老人，桌邊放著一柄斷劍。' },
    mysteriousWoman: { name: '戴斗笠的白衣女子', img: 'portrait_white_lady', desc: '倚窗看雨的女子，似乎也在等一個人。' },
    suWantang: { name: '蘇晚棠', img: 'portrait_su_wantang', norel: true, desc: '洛陽舊書坊的掌櫃。安靜、話少，看見玉佩時神色變了。' },
    shenRuolan: { name: '沈若蘭', img: 'portrait_shen_ruolan', norel: true, desc: '在沈家舊宅後院遇見的女子。自稱來替故人收拾東西，別的什麼都沒說。' },
    baishiOld: { name: '白石老人', img: 'portrait_baishi_old', norel: true, desc: '在白石橋等你的老人。' },
    wumingke: { name: '無名客', img: 'portrait_wumingke', norel: true, desc: '聽雨巷無名茶館裡，穿灰色長衫的中年人。沒有人知道他的名字。' },
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
    ch3_name_yunchuan: ['沈雲川', '沈家舊宅廳堂的家族畫像上，唯一沒被刮掉臉的年輕男子。'],
    ch3_luoshui: ['洛水不忘', '沈家枯井井壁上刻得很深的四個字。意思不明。'],
    ch3_true_killer: ['真正的兇手……', '後院暗格裡殘信的最後半行。後面被撕掉了。'],
    ch3_baishi: ['白石橋', '沈家舊簪內側刻著：「洛水以北，白石橋。」'],
    ch4_mark: ['奇怪的刻痕', '白石橋正中央一塊白石上，有一道很淡的刀痕，旁邊刻著「十五」。'],
    ch4_three: ['三個人走過白石橋', '白石老人說：十五年前那天晚上，有三個人從橋上走過。其中兩個再也沒有回來，第三個活了下來。'],
    ch5_dock15: ['碼頭老人知道十五年前的事情', '城南碼頭的船夫一聽到「十五年前」，臉色就變了。'],
    ch5_tingyu: ['聽雨巷', '舊市集賣舊書的老人說：如果真想找無名客，去聽雨巷。'],
    ch5_bf_hunt: ['黑羽盟在找玉佩的主人', '茶棚裡聽來的：黑羽盟不是在找東西，是在找一個人——手裡有一枚玉佩的人。'],
    ch5_old_scroll: ['洛陽城舊卷・沈雲川', '無名客給的殘紙上只有幾個字：「洛陽城舊卷」「沈雲川」「十五年前」。他說，下一個要找的是沈雲川。'],
    ch6_seeker: ['有人也在找沈雲川', '舊城門的守門老人說：前幾天，有個戴斗笠的人來問過同樣的名字。'],
    ch6_record: ['沈雲川死亡記錄疑點', '舊冊上寫著「十五年前失蹤」，旁邊「後確認死亡」四個字，筆跡和其他字完全不同，是後來才加上去的。'],
    ch6_alive: ['沈雲川可能還活著', '城西舊書坊書櫃後面找到的小紙條：「沈雲川沒有死。」不知道是誰留的。'],
    ch6_watched: ['黑羽盟在盯著你', '書坊外那個戴斗笠的人，袖口有黑羽盟的印記。'],
    ch6_street: ['老街的舊事', '老街賣糖的老婦人說：沈家大公子小時候常來，後來就再沒見過。前些日子，有人在沈家舊鋪子門口站了很久。'],
    ch6_backyard: ['井底', '沈若蘭說：沈家舊宅後院，你漏了一樣東西——不是枯井，是井底。'],
    ch6_linked: ['此人與十五年前之事有關', '黑羽密函的最後一句。你不知道，這句話說的為什麼會是你。'],
    ch6_tingfeng: ['聽風渡', '沈若蘭說：洛陽城外有一座叫「聽風渡」的渡口，十五年前最後見過沈雲川的人，就在那裡。'],
    ch4_wumingke: ['無名客', '白石老人說：如果想知道十五年前的事，去找一個叫「無名客」的人。沒有人知道他在哪。'],
  };
  S.ITEMS = {
    jade: ['染血玉佩', '沈青河留下的玉佩，血跡未乾。', 'icon_jade_pendant'],
    bf_token: ['黑羽令', '黑羽盟的信物，沉甸甸的黑鐵牌。', 'icon_blackfeather'],
    rain_tube: ['「雨停了」竹筒', '白衣女子託你轉交的小竹筒。'],
    bf_shard: ['黑羽殘片', '洛陽夜巷中，黑羽追兵身上掉落的一小片黑鐵羽片。', 'icon_blackfeather_shard'],
    shen_note: ['沈家舊宅紙條', '「沈家舊宅，洛水之畔。」', 'icon_old_note'],
    broken_letter: ['殘信', '「若有人看到這封信……不要相信當晚留下來的人。沈家並沒有……真正的兇手……」後半被撕掉了。', 'icon_broken_letter'],
    shen_hairpin: ['沈家舊簪', '一枚銀色髮簪，簪身極細。對著光看，裡面刻著一行小字：「洛水以北，白石橋。」', 'icon_shen_hairpin'],
    shen_coin: ['沈家舊錢', '一枚發綠的舊銅錢，背面刻著一個「沈」字。', 'icon_shen_coin'],
    bf_order: ['黑羽密令', '黑底細紙，只剩幾行字：「確認玉佩出現。」「目標已找到。」「立即通知洛陽。」', 'icon_bf_order'],
    bf_warrant: ['黑羽追查令', '「目標確認。持有沈家玉佩。不得擅自處置。活捉。」末尾有一個看不清的印記。', 'icon_bf_warrant'],
    shen_half_tablet: ['沈家半枚玉牌', '從沈家舊宅井底暗格找到的半枚玉牌，背面刻著「雲川」。靠近染血玉佩時，兩者會微微發熱。', 'icon_shen_half_tablet'],
    bf_letter: ['黑羽密函', '「沈雲川若現身，立即回報。若玉佩出現，不得搶奪，確認持有人身分。此人與十五年前之事有關。」', 'icon_bf_letter'],
    bf_cloth: ['黑羽衣角', '巷口撿到的一小塊黑布，旁邊落著一根黑色羽毛。', 'icon_bf_cloth'],
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

  // ===== 第二章・洛陽舊事（小幅版：沿用同一套節點、戰鬥與存檔） =====
  N.ch2_open = {
    bg: 'scene_luoyang', place: '洛陽城',
    pages: [
      '離開青石鎮後，你一路向北。',
      '幾日後，洛陽城出現在眼前。\n\n這座城比你想像中更熱鬧。',
      '叫賣聲、車馬聲、酒肆裡的笑聲，混成一片。\n\n可是當你從懷裡摸出那枚玉佩時，心裡卻忽然沉了一下。\n\n說不出的不安。',
      '你決定先去哪裡？',
    ],
    e: { f: ['ch2_started'], chapter: 2, phase: 'ch2' },
    choices: [
      { label: '前往客棧', next: 'ch2_inn' },
      { label: '前往茶樓', next: 'ch2_tea_in_a' },
      { label: '在城中四處走走', next: 'ch2_walk' },
    ],
  };
  N.ch2_inn = {
    bg: 'scene_luoyang', place: '洛陽・悅來客棧',
    pages: [
      '客棧不大，櫃檯後的小二正在打瞌睡。\n\n你要了一間房，順口問了句：「這城裡，有沒有什麼老事可聽？」',
      '小二一下子清醒了，上下打量你。\n\n「客官，老事這種東西，客棧裡聽不到。」\n\n他壓低聲音，朝街對面努了努嘴。\n\n「想聽，去對面茶樓。坐一個下午，比我說十句都多。」',
    ],
    choices: [{ label: '走去茶樓', next: 'ch2_tea_in_b' }],
  };
  N.ch2_walk = {
    bg: 'scene_luoyang', place: '洛陽・街市',
    pages: [
      '你沿著街慢慢走。\n\n賣糖人的、補鍋的、說書的……每一樣都熱鬧。\n\n只有城東那面老告示牆，被人刮得乾乾淨淨，一個字也不剩。',
      '你在牆前站了一會兒。\n\n旁邊賣餛飩的老漢瞥你一眼：「別看了，十幾年前就這樣。」\n\n他沒再往下說，只把湯勺在鍋沿敲了兩下。',
      '你抬頭，看見街角那間茶樓的門簾被風掀起，裡頭傳來低低的說話聲。',
    ],
    choices: [{ label: '走進茶樓', next: 'ch2_tea_in_c' }],
  };
  N.ch2_tea_in_a = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: ['你推門進了茶樓。\n\n樓下坐了七八桌，茶香混著瓜子味。你挑了靠窗的位置坐下。'],
    next: 'ch2_tea',
  };
  N.ch2_tea_in_b = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: ['你照小二的話，走進對面茶樓。\n\n茶博士端上一壺熱茶，沒多問，像是早就見慣了打聽事情的人。'],
    next: 'ch2_tea',
  };
  N.ch2_tea_in_c = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: ['你掀簾進去。\n\n方才聽到的低語，是從裡頭傳來的。你挑了離聲音最近的位置坐下。'],
    next: 'ch2_tea',
  };
  N.ch2_tea = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: [
      '鄰桌兩名江湖人士正在低聲說話。',
      '「十五年前的洛陽，你聽過嗎？」',
      '另一人立刻按住酒杯，聲音壓得更低：\n\n「別提那件事。」',
    ],
    choices: [
      { label: '上前詢問十五年前的事', next: 'ch2_tea_ask' },
      { label: '假裝沒聽見', next: 'ch2_tea_ignore' },
      { label: '先觀察兩人', next: 'ch2_tea_watch' },
    ],
  };
  N.ch2_tea_ask = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: [
      '你端著茶走過去。\n\n「兩位剛才說的十五年前，是什麼事？」',
      '兩人同時抬頭。\n\n其中一人的手，已經悄悄移到腰邊。\n\n「這位朋友，喝茶就好。」',
      '你沒有退。\n\n沉默了幾息，另一人終於嘆了口氣，低聲丟下三個字：\n\n「沈家的事。」\n\n說完，兩人起身走了，連茶錢都沒收拾。',
    ],
    e: { f: ['ch2_clue_shen'] },
    next: 'ch2_bookshop_hint_a',
  };
  N.ch2_tea_ignore = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: [
      '你低頭喝茶，像什麼也沒聽見。\n\n兩人也很快換了話題，聊起今年的雨水和米價。',
      '你付了茶錢，起身離開。\n\n走到門口，才發現袖口被什麼壓著——\n\n一張折成小方塊的紙條，不知什麼時候落在你桌邊。',
      '紙條上只有一行字：\n\n「想知道洛陽舊事，去找舊書坊。」',
    ],
    e: { f: ['ch2_clue_bookshop'] },
    next: 'ch2_bookshop',
  };
  N.ch2_tea_watch = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: (c) => [
      '你沒有出聲，只是把茶杯轉了半圈，目光落在那兩人身上。',
      '其中一人伸手去拿花生時，袖口往上滑了一寸。\n\n袖內側，繡著一根黑色羽毛。',
      c.f('noticed_blackfeather')
        ? '你認得那個標記。\n\n和青石鎮那晚三名黑衣人護腕上的黑羽，一模一樣。'
        : '你隱約覺得那個標記有些熟悉，卻一時想不起在哪裡見過。',
      '那人察覺到視線，立刻放下袖子，起身結帳離開。\n\n另一人多看了你一眼，也走了。\n\n桌上留著半碟沒吃完的花生。',
      '你想起店門口曾有人說，這附近有間舊書坊，專收老事老書。',
    ],
    e: { f: ['ch2_clue_bookshop'] },
    next: 'ch2_bookshop',
  };
  N.ch2_bookshop_hint_a = {
    bg: 'scene_luoyang', place: '洛陽・茶樓',
    pages: ['你坐著想了很久。\n\n沈家。這個姓，你在雨夜裡聽過。\n\n茶博士收杯子時，像是順口提了一句：\n\n「想翻舊事，去西巷舊書坊。」'],
    e: { f: ['ch2_clue_bookshop'] },
    next: 'ch2_bookshop',
  };
  N.ch2_bookshop = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: [
      '你推開舊書坊的門。\n\n門後沒有掌櫃熱情的招呼。\n\n只有一股紙張和舊墨的味道。',
      { t: '一名女子從書堆後抬起頭。\n\n她看了你一眼，目光落到你手中的玉佩上。\n\n原本平靜的神色，第一次有了變化。', who: 'su' },
      { t: '「……這東西，你從哪裡得到的？」', who: 'su' },
    ],
    choices: [
      { label: '說實話', next: 'ch2_su_truth' },
      { label: '隱瞞來源', next: 'ch2_su_hide' },
      { label: '反問她認不認識', next: 'ch2_su_ask' },
      { label: '不回答', next: 'ch2_su_silent' },
    ],
  };
  N.ch2_su_truth = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: (c) => [
      '「青石鎮的一個雨夜。有人把它留在我手上。」\n\n你把事情說了大概。',
      c.f('saved_qinghe')
        ? { t: '「那個少年……他叫什麼？」\n\n你說：「沈青河。」\n\n她垂下眼，手指在櫃檯上輕輕停住。', who: 'su' }
        : { t: '蘇晚棠聽完，沒有追問。\n\n「你說得很直。這在洛陽，不常見。」', who: 'su' },
    ],
    next: 'ch2_su_info',
  };
  N.ch2_su_hide = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: [
      { t: '「路上撿的。」\n\n蘇晚棠看了你很久。\n\n「路上撿的東西，不會讓人手指發白。」', who: 'su' },
      '她沒有拆穿。只是把櫃檯上的燈芯撥亮了些。',
    ],
    next: 'ch2_su_info',
  };
  N.ch2_su_ask = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: [
      { t: '「你認得它？」\n\n蘇晚棠沒有回答。\n\n過了一會兒，她才說：\n\n「我認得的，不是它。是刻它的人。」', who: 'su' },
      '她停住，像是說多了。',
    ],
    next: 'ch2_su_info',
  };
  N.ch2_su_silent = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: [
      '你沒有開口。\n\n蘇晚棠也沒有再問。\n\n書坊裡只剩雨後屋簷滴水的聲音。',
      { t: '良久，她才輕輕說：\n\n「不說也好。有些事，本來就不該站在門口說。」', who: 'su' },
    ],
    next: 'ch2_su_info',
  };
  N.ch2_su_info = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: [
      { t: '「十五年前，洛陽有一個沈家。」', who: 'su' },
      { t: '「一夜之間，人沒了，宅子空了。官府沒有留下完整的記錄。」', who: 'su' },
      { t: '「江湖上也很少有人再提。」', who: 'su' },
      { t: '「有人希望所有人，都忘記沈家。」', who: 'su' },
    ],
    e: { f: ['ch2_clue_shen'], people: ['suWantang'] },
    choices: [
      { label: '追問下去', next: 'ch2_su_more' },
      { label: '向她道謝，離開', next: 'ch2_night' },
    ],
  };
  N.ch2_su_more = {
    bg: 'scene_bookshop', place: '洛陽・舊書坊',
    pages: [{ t: '蘇晚棠把書合上。\n\n「知道得越多，麻煩越多。」\n\n她停了停，又補了半句：\n\n「今晚，別走大路。」', who: 'su' }],
    e: { f: ['ch2_su_more'] },
    next: 'ch2_night',
  };
  N.ch2_night = {
    bg: 'scene_luoyang_night', place: '洛陽・夜巷',
    pages: [
      '離開舊書坊時，天已經黑了。\n\n街上的燈一盞接一盞熄滅，原本熱鬧的人聲，像被誰一把掐斷。',
      '太靜了。\n\n你停下腳步。',
      { t: '三道黑影從巷口兩側走出來。\n\n「把東西交出來。」', who: 'bf' },
      '你知道他們要的是什麼。\n\n你握緊手中的兵器。',
    ],
    battle: { count: 3, name: '黑羽追兵', win: 'ch2_after', lose: 'ch2_after_lose', label: '戰鬥開始' },
  };
  N.ch2_after = {
    bg: 'scene_luoyang_night', place: '洛陽・夜巷',
    pages: [
      { t: '最後一名黑衣人倒下時，腰間掉出一小片黑鐵羽片。\n\n你撿起來：【黑羽殘片】。', icon: 'icon_blackfeather_shard' },
      { t: '他的衣襟裡還夾著一張紙，被雨氣潤得半濕。\n\n紙上只有一行字：\n\n「沈家舊宅，洛水之畔。」', icon: 'icon_old_note' },
      '洛水。\n\n你不知道洛水邊哪一處是沈家舊宅。\n\n但你知道，有人比你更早知道。',
    ],
    e: { item: ['bf_shard', 'shen_note'], f: ['ch2_fought_bf'] },
    next: 'ch2_end',
  };
  N.ch2_after_lose = {
    bg: 'scene_luoyang_night', place: '洛陽・夜巷',
    pages: [
      '你被逼退幾步，肩上吃了一刀。\n\n就在最後一刻，遠處傳來更夫的梆子聲，黑衣人互看一眼，轉身消失在巷子盡頭。',
      { t: '地上留下一張被雨浸濕的紙。\n\n「沈家舊宅，洛水之畔。」', icon: 'icon_old_note' },
      '洛水。\n\n你把紙塞進懷裡。',
    ],
    e: { item: ['shen_note'], f: ['ch2_fought_bf'] },
    next: 'ch2_end',
  };
  N.ch2_end = {
    bg: 'scene_luoyang_night', place: '洛陽・客棧',
    pages: [
      '你回到客棧，關上房門。\n\n窗外的雨又下了起來。',
      '你拿出玉佩，放在桌上。\n\n月光穿過窗紙，照在玉佩上。',
      '玉佩上原本模糊的紋路，忽然變得清晰。\n\n你看到了兩個字：\n\n「沈家」。',
      '原來十五年前的洛陽，真的有人活了下來。',
      '……\n\n而那個人，也許正在等你。',
    ],
    e: { f: ['chapter2Completed'], phase: 'done_ch2', complete: 'ch2' },
    choices: [{ label: '完', next: 'ch2_final' }],
  };
  N.ch2_final = {
    bg: 'scene_luoyang_night', place: '', center: true,
    pages: ['【第二章・洛陽舊事　完】\n\n【第三章・沈家舊門】\n已解鎖\n\n「有些門，十五年來從未真正關上。」'],
    choices: [{ label: '繼續江湖', next: '__close' }],
  };

  // ===== 第三章・沈家舊門（輕量：同一套節點、show、battle、e） =====
  const B3 = { ruins: 'scene_shen_ruins', hall: 'scene_shen_hall', yard: 'scene_shen_backyard', rain: 'scene_shen_ruins_rain' };
  S.B3 = B3;
  N.ch3_title = {
    bg: B3.ruins, place: '', center: true,
    pages: ['【第三章・沈家舊門】\n\n「有些門，十五年來從未真正關上。」'],
    e: { f: ['chapter3Started'], chapter: 3, phase: 'ch3' },
    next: 'ch3_open',
  };
  N.ch3_open = {
    bg: B3.ruins, place: '洛水之畔',
    pages: (c) => [
      '洛陽城外，天色將暗。\n\n你沿著洛水一路向南。',
      '十五年前，這裡曾經有一座宅院。\n\n如今，只剩下荒草與斷牆。',
      '沒有人願意提起那個地方。\n\n你問過兩個船夫，兩個人都把頭轉開了。',
      '懷裡那張半濕的紙條，你已經看了很多遍。\n\n「沈家舊宅，洛水之畔。」',
    ].concat(c.f('ch2_su_more') ? ['你想起蘇晚棠那句話。\n\n「知道得越多，麻煩越多。」\n\n你還是來了。'] : [])
      .concat(['但你手中的玉佩，卻讓你不得不走下去。']),
    next: 'ch3_yard',
  };
  N.ch3_yard = {
    bg: B3.ruins, place: '沈家舊宅',
    pages: (c) => [(c.f('ch3_gate') || c.f('ch3_hall') || c.f('ch3_well_seen'))
      ? '風從斷牆的缺口吹進來。\n\n還有哪裡沒看？'
      : '斷牆圍著一片荒院。\n\n大門半倒，廳堂的屋頂塌了一角，院子邊有一口枯井，再往裡是後院。\n\n你要先看哪裡？'],
    choices: [
      { label: '大門', next: 'ch3_gate', show: (c) => !c.f('ch3_gate') },
      { label: '破舊廳堂', next: 'ch3_hall', show: (c) => !c.f('ch3_hall') },
      { label: '枯井', next: 'ch3_well', show: (c) => !c.f('ch3_well_mark') },
      { label: '後院', next: (c) => (c.f('ch3_hall') ? 'ch3_back' : 'ch3_hall_pass') },
    ],
  };
  N.ch3_gate = {
    bg: B3.ruins, place: '沈家舊宅・大門',
    pages: [
      '兩扇木門只剩一扇還掛在門框上。\n\n門板中間有一道家徽，被雨水和年月磨得幾乎看不出形狀。',
      '你把玉佩拿近一點。\n\n「喀。」',
      '很輕的一聲。玉佩在你掌心裡微微一震。\n\n你等了一會兒。\n\n什麼都沒有發生。',
      '玉佩與沈家，似乎有某種關聯。',
    ],
    e: { f: ['ch3_gate'] },
    next: 'ch3_yard',
  };
  const HALL = [
    '廳堂裡的桌椅早就被搬空，地上全是碎瓦。\n\n正牆上還掛著一幅家族畫像，畫軸已經發黑。',
    '畫上五個人，前四個人的臉全被刮掉了。\n\n刮得很用力，連底下的絹都破了。',
    '只有最右邊一個年輕男子，臉還完好。\n\n他看起來很普通，甚至有點像在忍笑。',
    '畫像角落有一行小字：\n\n「沈雲川。」',
    '【獲得線索：沈雲川】',
  ];
  N.ch3_hall = { bg: B3.hall, place: '沈家舊宅・廳堂', pages: HALL, e: { f: ['ch3_hall'], intel: ['ch3_name_yunchuan'] }, next: 'ch3_yard' };
  N.ch3_hall_pass = {
    bg: B3.hall, place: '沈家舊宅・廳堂',
    pages: ['要到後院，得先穿過廳堂。\n\n' + HALL[0]].concat(HALL.slice(1)),
    e: { f: ['ch3_hall'], intel: ['ch3_name_yunchuan'] },
    next: 'ch3_back',
  };
  N.ch3_well = {
    bg: B3.yard, place: '沈家舊宅・枯井',
    // ch3_well_seen 改在選項上設：節點 e 會在算 pages 前套用，放 e 會讓第一次就顯示重訪句
    pages: (c) => (c.f('ch3_well_seen')
      ? ['你又走回枯井邊。\n\n井口的青苔上，還留著你剛才的手印。']
      : ['井口長滿青苔，往下看只有黑。\n\n你丟了一顆小石子，很久才聽到一聲悶響。', '什麼都沒有。']),
    choices: [{ label: '仔細查看', next: 'ch3_well_look', e: { f: ['ch3_well_seen'] } }, { label: '離開', next: 'ch3_yard', e: { f: ['ch3_well_seen'] } }],
  };
  N.ch3_well_look = {
    bg: B3.yard, place: '沈家舊宅・枯井',
    pages: [
      '你趴在井沿，伸手摸井壁。\n\n離井口一臂深的地方，指尖碰到一道刻痕。',
      '你點起火摺子。\n\n四個字，刻得很深：\n\n「洛水不忘。」',
      '你不知道這句話是什麼意思。\n\n但你知道，刻字的人當時一定很用力。',
      '【獲得線索：洛水不忘】',
    ],
    e: { f: ['ch3_well_mark'], intel: ['ch3_luoshui'] },
    next: 'ch3_yard',
  };
  N.ch3_back = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '後院中間有一棵大樹，早就枯死了，枝幹像伸向天空的手。',
      '樹下鋪著一塊石板，邊緣長滿了草。',
      '你走近時，懷裡的玉佩又震了一下。\n\n這一次，石板底下也傳來「喀」的一聲。',
      '你撬開石板。\n\n下面是一個小暗格。',
      '裡面沒有金銀，也沒有秘笈。\n\n只有一封信，被油布包著，邊角已經爛了。',
    ],
    next: 'ch3_letter',
  };
  N.ch3_letter = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '「若有人看到這封信……」',
      '「不要相信當晚留下來的人。」',
      '「沈家並沒有……」\n\n後面的字被撕掉了。',
      '信紙最下面，只剩半行：\n\n「真正的兇手……」\n\n然後就斷了。',
      '你把信看了三遍。\n\n當年那一夜發生的事，也許不是外面傳的那樣。',
      { t: '【獲得：殘信】', icon: 'icon_broken_letter' },
    ],
    e: { f: ['ch3_letter'], item: ['broken_letter'], intel: ['ch3_true_killer'] },
    next: 'ch3_meet',
  };
  N.ch3_meet = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: (c) => {
      const out = [
        '「你不該來這裡。」',
        '你回頭。\n\n枯樹旁站著一個女子，約莫二十五、六歲，衣著樸素，頭髮只用一根銀簪挽著。',
        '她的神情很冷靜，像是早就在那裡站了很久。',
        { t: '「別緊張。我只是來替故人收拾一些東西。」', who: 'ruolan_anon' },
        '她說她姓沈，叫若蘭。\n\n只說了名字，沒說別的。',
      ];
      if (c.f('ch2_fought_bf')) {
        out.push('她的目光落在你手臂上那道還沒好全的刀傷。');
        out.push({ t: '「你已經和他們交過手了？」', who: 'ruolan' });
      }
      out.push({ t: '「你為什麼來這裡？」', who: 'ruolan' });
      return out;
    },
    e: { people: ['shenRuolan'] },
    choices: [
      { label: '「我在找沈家。」', next: 'ch3_ans_find' },
      { label: '「我只是偶然經過。」', next: 'ch3_ans_pass' },
      { label: '「有人告訴我這裡有秘密。」', next: 'ch3_ans_told' },
      { label: '「這枚玉佩帶我來的。」', next: 'ch3_ans_jade' },
    ],
  };
  N.ch3_ans_find = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      { t: '「沈家？」\n\n她輕輕笑了一下。\n\n「沈家早就沒了。你找的只是一片荒地。」', who: 'ruolan' },
      '她說這話的時候，沒有看你，而是看著那棵枯樹。',
      '然後，她看見了你腰間露出的玉佩。',
    ],
    next: 'ch3_demand',
  };
  N.ch3_ans_pass = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      { t: '「偶然經過，會撬開別人家的石板？」', who: 'ruolan' },
      '你一時答不上來。',
      '她的視線往下移，停在你腰間的玉佩上。',
    ],
    next: 'ch3_demand',
  };
  N.ch3_ans_told = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      { t: '「誰？」', who: 'ruolan' },
      '她問得很快，快得不像隨口一問。',
      '你沒有回答。她也沒有再問，因為她已經看見你腰間的玉佩。',
    ],
    next: 'ch3_demand',
  };
  N.ch3_ans_jade = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: ['你把玉佩拿出來。', '她的臉色第一次變了。', { t: '「你……從哪裡得到它？」', who: 'ruolan' }],
    e: { f: ['ch3_said_jade'] },
    choices: [{ label: '「你認識它？」', next: 'ch3_ans_jade2' }],
  };
  N.ch3_ans_jade2 = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: ['她沒有回答。\n\n風吹過枯樹，樹枝互相敲出細碎的聲音。', { t: '過了很久，她才開口。\n\n「這不是你的東西。」', who: 'ruolan' }],
    next: 'ch3_demand',
  };
  N.ch3_demand = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: ['她朝你伸出手。', { t: '「把玉佩給我。」', who: 'ruolan' }],
    choices: [
      { label: '交給她', next: 'ch3_give' },
      { label: '拒絕', next: 'ch3_refuse' },
      { label: '追問她是誰', next: 'ch3_ask' },
      { label: '準備拔劍', next: 'ch3_draw' },
    ],
  };
  N.ch3_give = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '你把玉佩放在她掌心。',
      '她低頭看了很久，拇指在玉佩背面按了一下。\n\n「喀。」',
      { t: '她把玉佩還給你。\n\n「謝謝。」', who: 'ruolan' },
      '她轉身走進斷牆的陰影裡，腳步很輕，一下子就看不見了。',
      '你低頭看玉佩。\n\n背面靠邊的地方，少了一小塊。\n\n切口很平整，像是本來就可以拆下來。',
    ],
    e: { f: ['ch3_gave_jade'] },
    next: 'ch3_pin',
  };
  N.ch3_refuse = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: ['你把玉佩收回懷裡。', { t: '她沒有生氣，只是把手放下。\n\n「那你最好活得久一點。」', who: 'ruolan' }, '她轉身離開，走過大門時，連頭都沒有回。'],
    e: { f: ['ch3_refused'] },
    next: 'ch3_pin',
  };
  N.ch3_ask = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '「你到底是誰？」',
      { t: '「十五年前死掉的人，已經沒有名字。」', who: 'ruolan' },
      { t: '「活下來的人，也不一定有名字。」', who: 'ruolan' },
      '她說完就走了。\n\n你沒有攔她，因為你不知道該用什麼理由攔。',
    ],
    e: { f: ['ch3_asked_name'] },
    next: 'ch3_pin',
  };
  N.ch3_draw = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '你的手按上了兵器。',
      { t: '她往後退了一步。\n\n「我不想與你動手。」', who: 'ruolan' },
      '話還沒說完，斷牆上傳來瓦片碎裂的聲音。',
      { t: '三道黑影從牆頭跳下來。\n\n「東西和人，一起帶走。」', who: 'bf' },
      '你和她同時轉頭。\n\n要對付的不是彼此。',
    ],
    e: { f: ['ch3_drew_sword'] },
    battle: { count: 3, name: '黑羽追兵', win: 'ch3_after_fight', lose: 'ch3_after_fight_lose', label: '戰鬥開始' },
  };
  N.ch3_after_fight = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: ['最後一個黑衣人翻過斷牆逃走了。', '你回頭找她。\n\n枯樹下已經沒有人。', '地上留著一枚銀色髮簪，是剛才挽在她頭上的那一根。'],
    e: { f: ['ch3_fought_bf'] },
    next: 'ch3_pin_fight',
  };
  N.ch3_after_fight_lose = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '你被逼到枯樹邊，眼看刀就要落下。',
      '一道銀光從旁邊掠過，黑衣人慘叫一聲，三個人互看一眼，翻牆退走。',
      '等你站穩，她已經不見了。\n\n地上留著一枚銀色髮簪。',
    ],
    e: { f: ['ch3_fought_bf'] },
    next: 'ch3_pin_fight',
  };
  N.ch3_pin = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: ['你正要離開，腳邊有東西反了一下光。', '是一枚銀色髮簪，剛才挽在她頭上的那一根。\n\n不知道是掉的，還是故意留下的。'],
    next: 'ch3_pin_fight',
  };
  N.ch3_pin_fight = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [{ t: '【獲得：沈家舊簪】', icon: 'icon_shen_hairpin' }],
    e: { item: ['shen_hairpin'] },
    choices: [{ label: '查看舊簪', next: 'ch3_pin_look' }],
  };
  N.ch3_pin_look = {
    bg: B3.yard, place: '沈家舊宅・後院',
    pages: [
      '簪身很細，對著天光轉一圈，你發現裡面是空的。',
      '簪子內側刻著一行比米粒還小的字：\n\n「洛水以北，白石橋。」',
      '白石橋。\n\n你沒聽過這個地方。',
      '【獲得線索：白石橋】',
    ],
    e: { intel: ['ch3_baishi'] },
    next: 'ch3_end',
  };
  N.ch3_end = {
    bg: B3.rain, place: '沈家舊宅・門口',
    pages: (c) => {
      const out = ['你走回沈家舊宅門口。\n\n天開始下雨。', '十五年前。\n\n沈家一夜消失。', '有人說他們死了。\n\n有人說他們逃了。', '而現在，你遇見了一個不願承認自己與沈家有關的人。'];
      if (c.f('ch3_gave_jade')) out.push('你摸了摸玉佩上缺掉的那一角。\n\n她拿走的，到底是什麼？');
      if (c.f('ch3_well_mark')) out.push('井壁上那四個字，又在你腦中浮了出來。\n\n洛水不忘。');
      out.push('你看著手中的舊簪。');
      out.push('如果沈家真的已經不存在……\n\n那麼，她又是誰？');
      return out;
    },
    e: { f: ['chapter3Completed'], phase: 'done_ch3', complete: 'ch3' },
    choices: [{ label: '完', next: 'ch3_final' }],
  };
  N.ch3_final = {
    bg: B3.rain, place: '', center: true,
    pages: ['【第三章・沈家舊門　完】\n\n【第四章・白石橋】\n已解鎖\n\n「橋下流水依舊，橋上的人卻早已不在。」'],
    choices: [{ label: '繼續江湖', next: '__close' }],
  };

  // ===== 第四章・白石橋（輕量：同一套節點、show、battle、e） =====
  const B4 = { bridge: 'scene_baishi_bridge', under: 'scene_baishi_under', dusk: 'scene_baishi_dusk' };
  S.B4 = B4;
  const BAI = (t) => ({ t, who: 'baishi' });
  const LAN = (t) => ({ t, who: 'ruolan' });
  N.ch4_title = {
    bg: B4.bridge, place: '', center: true,
    pages: ['【第四章・白石橋】\n\n「橋下流水依舊，橋上的人卻早已不在。」'],
    e: { f: ['chapter4Started'], chapter: 4, phase: 'ch4' },
    next: 'ch4_open',
  };
  N.ch4_open = {
    bg: B4.bridge, place: '洛水以北',
    pages: (c) => [
      '第二日清晨。\n\n你沿著洛水往北。',
      '遠遠看見一座白石砌成的古橋。\n\n橋不長。\n\n卻很舊。',
      '橋下流水緩緩而過。',
      '十五年前，沈家的人曾經走過這座橋。\n\n如今，只有風還記得。',
    ].concat(c.f('ch3_letter') ? ['你摸了摸懷裡那封殘信。\n\n「不要相信當晚留下來的人。」\n\n你不知道，今天會在這裡遇見誰。'] : [])
      .concat(['橋上沒有人。']),
    next: 'ch4_bridge',
  };
  N.ch4_bridge = {
    bg: B4.bridge, place: '白石橋',
    pages: (c) => [(c.f('ch4_deck') || c.f('ch4_under')) ? '河面上起了一點風。' : '橋上空蕩蕩的，只有你自己的腳步聲。\n\n你要做什麼？'],
    choices: [
      { label: '查看橋面', next: 'ch4_deck', show: (c) => !c.f('ch4_deck') },
      { label: '查看橋下', next: 'ch4_under', show: (c) => !c.f('ch4_under') },
      { label: '等待', next: 'ch4_wait' },
    ],
  };
  N.ch4_deck = {
    bg: B4.bridge, place: '白石橋・橋面',
    pages: [
      '你沿著橋面慢慢走。\n\n正中央有一塊白石，比旁邊的顏色深一點。',
      '石面上有一道很淡的刀痕，斜斜的，像是有人在這裡收過刀。',
      '刀痕旁邊刻著兩個字：\n\n「十五。」',
      '【獲得提示：奇怪的刻痕】',
    ],
    e: { f: ['ch4_deck'], intel: ['ch4_mark'] },
    next: 'ch4_bridge',
  };
  N.ch4_under = {
    bg: B4.under, place: '白石橋・橋下',
    pages: [
      '你順著石階走到橋下。\n\n水聲一下子變得很近。',
      '橋墩旁卡著一個小木盒，木頭已經爛得發黑。',
      '你打開它。\n\n裡面只有一枚舊銅錢。',
      '你把銅錢翻過來。\n\n背面刻著一個字：\n\n「沈」。',
      { t: '【獲得：沈家舊錢】', icon: 'icon_shen_coin' },
    ],
    e: { f: ['ch4_under', 'obtainedShenOldCoin'], item: ['shen_coin'] },
    next: 'ch4_bridge',
  };
  N.ch4_wait = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '你沒有做任何事情。\n\n只是站在橋上。',
      '太陽一點一點爬高。\n\n直到日上三竿。',
      { t: '身後傳來一個聲音：\n\n「你比我想像中有耐心。」', who: 'baishi_anon' },
      '你回頭。\n\n一個六十多歲的老人站在橋頭，衣著普通，手裡拄著一根舊竹杖。',
      '他看起來就像隨處可見的老人家。\n\n只有那雙眼睛，亮得讓人不太敢直視。',
      BAI('「你是來找沈家的人？」'),
    ],
    e: { people: ['baishiOld'] },
    choices: [
      { label: '「你知道沈家？」', next: 'ch4_ans_know' },
      { label: '「你是誰？」', next: 'ch4_ans_who' },
      { label: '「有人讓我來這裡。」', next: 'ch4_ans_sent' },
      { label: '「我只是路過。」', next: 'ch4_ans_pass' },
    ],
  };
  N.ch4_ans_know = {
    bg: B4.bridge, place: '白石橋',
    pages: [BAI('「洛陽城裡，誰不知道沈家？」'), BAI('「只是知道的人，大多不願意說。」')],
    e: { f: ['ch4_ask_know'] },
    next: 'ch4_secret',
  };
  N.ch4_ans_who = {
    bg: B4.bridge, place: '白石橋',
    pages: [BAI('「一個每天來橋上站一站的老頭子。」'), '他說得很輕鬆，好像這個問題他已經回答過很多次。'],
    e: { f: ['ch4_ask_who'] },
    next: 'ch4_secret',
  };
  N.ch4_ans_sent = {
    bg: B4.bridge, place: '白石橋',
    pages: [BAI('「讓你來的人，」他的目光在你身上停了一下，「是不是沒告訴你，來了之後要做什麼？」'), '你沒有回答。他也不像在等你回答。'],
    e: { f: ['ch4_ask_sent'] },
    next: 'ch4_secret',
  };
  N.ch4_ans_pass = {
    bg: B4.bridge, place: '白石橋',
    pages: [BAI('「路過的人，不會在橋上站一整個早上。」'), BAI('他用竹杖點了點地。\n\n「坐吧。反正你也不急著走。」')],
    e: { f: ['ch4_ask_pass'] },
    next: 'ch4_secret',
  };
  N.ch4_secret = {
    bg: B4.bridge, place: '白石橋',
    pages: (c) => (c.f('obtainedShenOldCoin') ? [BAI('他看了一眼你手上的銅錢。\n\n「那東西在橋下躺了很多年。你倒是撿得順手。」')] : []).concat([
      '老人望著橋下的河水，很久沒有說話。',
      BAI('「十五年前，我也站在這座橋上。」'),
      BAI('「那天晚上，有三個人從橋上走過。」'),
      BAI('「其中兩個，再也沒有回來。」'),
    ]),
    choices: [{ label: '「第三個呢？」', next: 'ch4_third' }],
  };
  N.ch4_third = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '老人沉默了。\n\n風從河面吹上來，把他的衣角吹得一動一動。',
      BAI('「第三個人，活了下來。」'),
      '你還想再問。\n\n他卻搖了搖頭。',
      '【獲得線索：三個人走過白石橋】',
    ],
    e: { intel: ['ch4_three'] },
    next: 'ch4_ruolan',
  };
  N.ch4_ruolan = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '橋的另一頭，傳來腳步聲。',
      '你轉頭。\n\n沈若蘭站在那裡。',
      '她沒有看你。\n\n她在看老人。',
      LAN('「你果然還活著。」'),
      BAI('「你也一樣。」'),
      LAN('「十五年了。」'),
      BAI('「你還是回來了。」'),
      LAN('「有些事情，總要有個結果。」'),
      BAI('「結果？」\n\n「你真的相信，十五年前的事情還能有結果？」'),
      '沈若蘭沒有回答。\n\n橋上安靜得只剩下水聲。',
    ],
    choices: [
      { label: '「你們到底在說什麼？」', next: 'ch4_q_talk' },
      { label: '「沈家當年到底發生了什麼？」', next: 'ch4_q_what' },
      { label: '「十五年前活下來的人是誰？」', next: 'ch4_q_who' },
      { label: '「我只想知道玉佩的秘密。」', next: 'ch4_q_jade' },
    ],
  };
  N.ch4_q_talk = {
    bg: B4.bridge, place: '白石橋',
    pages: [LAN('「在說一些跟你無關的舊事。」'), BAI('「跟他有沒有關係，還很難說。」'), '老人說完，目光落在你腰間的玉佩上。'],
    e: { f: ['ch4_q_talk'] },
    next: 'ch4_jade',
  };
  N.ch4_q_what = {
    bg: B4.bridge, place: '白石橋',
    pages: [BAI('「外面怎麼傳，你就怎麼聽吧。」'), LAN('「外面傳的都是錯的。」'), '兩個人說完，又同時不說話了。\n\n老人的目光，慢慢落到你腰間的玉佩上。'],
    e: { f: ['ch4_q_what'] },
    next: 'ch4_jade',
  };
  N.ch4_q_who = {
    bg: B4.bridge, place: '白石橋',
    pages: ['沈若蘭的肩膀微微一緊。', BAI('「這個問題，」老人說，「你最好別在別人面前問。」'), '他的目光往下，落在你腰間的玉佩上。'],
    e: { f: ['ch4_q_who'] },
    next: 'ch4_jade',
  };
  N.ch4_q_jade = {
    bg: B4.bridge, place: '白石橋',
    pages: ['你把玉佩拿了出來。'],
    e: { f: ['ch4_q_jade'] },
    next: 'ch4_jade',
  };
  N.ch4_jade = {
    bg: B4.bridge, place: '白石橋',
    pages: (c) => [
      '老人看見玉佩的那一刻，臉色變了。',
      '他握著竹杖的手，緊了一下。',
      BAI('「原來它真的回來了。」'),
      '「什麼叫回來？」',
      BAI('「這東西十五年前就應該消失。」'),
      BAI('「沒想到十五年後，又落到了另一個人手裡。」'),
    ].concat(c.f('ch3_gave_jade') ? ['他的手指停在玉佩缺掉的那一角。\n\n他看了沈若蘭一眼。\n\n沈若蘭把臉轉開了。'] : [])
      .concat(['你還想追問。\n\n遠處，傳來馬蹄聲。']),
    next: 'ch4_bf',
  };
  N.ch4_bf = {
    bg: B4.bridge, place: '白石橋',
    pages: (c) => [BAI('「來得比我想的快。」')]
      .concat(c.f('ch3_drew_sword') ? [LAN('沈若蘭低聲說：\n\n「又是他們。」')] : [])
      .concat(['三名黑衣人從河岸的樹林裡走出來，翻身下馬。', { t: '「把玉佩交出來。」', who: 'bf' }, '你往前站了一步。']),
    battle: { count: 3, name: '黑羽追兵', win: 'ch4_after', lose: 'ch4_after_lose', label: '戰鬥開始' },
  };
  N.ch4_after = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '最後一個黑衣人倒在橋欄邊。',
      '他的袖口掉出一卷黑色的細紙，用一根黑羽毛綁著。',
      { t: '【獲得：黑羽密令】', icon: 'icon_bf_order' },
    ],
    e: { f: ['ch4_fought_bf', 'obtainedBlackFeatherOrder'], item: ['bf_order'] },
    next: 'ch4_order',
  };
  N.ch4_after_lose = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '你被逼到橋欄邊，手臂一陣發麻。',
      '一根竹杖從旁邊伸過來，輕輕一點。\n\n黑衣人手腕一軟，刀掉進了河裡。',
      '三個人互看一眼，上馬就走。\n\n跑在最後的那個人，掉了一卷黑色的細紙。',
      { t: '【獲得：黑羽密令】', icon: 'icon_bf_order' },
    ],
    e: { f: ['ch4_fought_bf', 'obtainedBlackFeatherOrder'], item: ['bf_order'] },
    next: 'ch4_order',
  };
  N.ch4_order = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '你把黑羽毛拆開。\n\n紙上只剩幾行字：',
      '「確認玉佩出現。」',
      '「目標已找到。」',
      '「立即通知洛陽。」',
      '目標。\n\n你又看了一遍這兩個字。',
      '他們要找的，到底是玉佩……\n\n還是你？',
    ],
    next: 'ch4_old_hurt',
  };
  N.ch4_old_hurt = {
    bg: B4.bridge, place: '白石橋',
    pages: [
      '老人靠著橋欄坐下。\n\n他的左臂多了一道口子，血滲進了袖子裡。',
      BAI('你想替他包紮。\n\n他擺擺手。\n\n「老骨頭了，不值得浪費你的布。」'),
      BAI('「如果你真的想知道十五年前的事情。」'),
      BAI('「不要再查沈家。」'),
      '他停了很久。',
      BAI('「去找一個叫『無名客』的人。」'),
      '「他在哪？」',
      BAI('「沒有人知道。」\n\n「因為他本來就沒有名字。」'),
      '【獲得線索：無名客】',
    ],
    e: { intel: ['ch4_wumingke'] },
    next: 'ch4_ruolan_leave',
  };
  N.ch4_ruolan_leave = {
    bg: B4.bridge, place: '白石橋',
    pages: ['沈若蘭轉身往橋的另一頭走。'],
    choices: [
      { label: '「你到底是不是沈家的人？」', next: 'ch4_ruolan_ask', e: { f: ['ch4_asked_ruolan'] } },
      { label: '看著她離開', next: 'ch4_ruolan_quiet' },
    ],
  };
  N.ch4_ruolan_ask = {
    bg: B4.bridge, place: '白石橋',
    pages: ['沈若蘭停下。\n\n她沒有回頭。', LAN('「如果我是。」'), LAN('「你還敢繼續查嗎？」'), '她走了。\n\n你站在原地，沒有回答。'],
    next: 'ch4_end',
  };
  N.ch4_ruolan_quiet = {
    bg: B4.bridge, place: '白石橋',
    pages: ['你沒有叫住她。\n\n她卻自己停了下來，背對著你。', LAN('「你想問我，是不是沈家的人。」'), LAN('「如果我是。」\n\n「你還敢繼續查嗎？」'), '她走了。\n\n你站在原地，沒有回答。'],
    next: 'ch4_end',
  };
  N.ch4_end = {
    bg: B4.dusk, place: '白石橋・黃昏',
    pages: [
      '你站在白石橋上。\n\n夕陽落下。',
      '老人不知道什麼時候已經走了，橋頭只剩下一道竹杖點過的淺印。',
      '橋下的水，仍然往洛陽的方向流。',
      '你原本以為，自己只是找到了一座舊宅。',
      '後來才發現。\n\n十五年前的事情，從來沒有真正結束。',
      '沈家有人活了下來。\n\n黑羽盟也一直在尋找。',
      '而現在……\n\n他們似乎找到了你。',
    ],
    e: { f: ['chapter4Completed'], phase: 'done_ch4', complete: 'ch4' },
    choices: [{ label: '完', next: 'ch4_final' }],
  };
  N.ch4_final = {
    bg: B4.dusk, place: '', center: true,
    pages: ['【第四章・白石橋　完】\n\n【第五章・無名客】\n已解鎖\n\n「江湖上沒有人知道他的名字。」\n「但也許，他知道十五年前的真相。」'],
    choices: [{ label: '繼續江湖', next: '__close' }],
  };

  // ===== 第五章・無名客（輕量：同一套節點、show、battle、e） =====
  const B5 = {
    city: 'scene_luoyang',
    dock: 'scene_luoyang_dock',
    market: 'scene_luoyang_oldmarket',
    tea: 'scene_luoyang_teashed',
    lane: 'scene_tingyu_lane',
    inn: 'scene_wuming_teahouse',
    night: 'scene_luoyang_night',
  };
  S.B5 = B5;
  const WMK = (t) => ({ t, who: 'wumingke' });
  const WMK_ANON = (t) => ({ t, who: 'wumingke_anon' });
  N.ch5_title = {
    bg: B5.city, place: '', center: true,
    pages: ['【第五章・無名客】\n\n「江湖上沒有人知道他的名字，卻有人記得他的故事。」'],
    e: { f: ['chapter5Started'], chapter: 5, phase: 'ch5' },
    next: 'ch5_open',
  };
  N.ch5_open = {
    bg: B4.dusk, place: '白石橋',
    pages: [
      '白石老人最後那幾句話，一直在你耳邊。',
      '「去找一個叫『無名客』的人。」',
      '「沒有人知道。」\n\n「因為他本來就沒有名字。」',
      '你低頭看著懷裡的玉佩。\n\n沈青河把它塞進你手裡的那個雨夜，好像已經是很久以前的事了。',
    ],
    next: 'ch5_luoyang',
  };
  N.ch5_luoyang = {
    bg: B5.city, place: '洛陽城',
    pages: [
      '你又回到了洛陽。',
      '城還是一樣熱鬧。\n\n只是這一次，你知道人群裡，可能有人正看著你。',
      '一個沒有名字的人。\n\n要去哪裡找？',
    ],
    next: 'ch5_city',
  };

  // ---- 尋人樞紐：三處都能去、都能跳過；拿到聽雨巷才出現前往 ----
  N.ch5_city = {
    bg: B5.city, place: '洛陽城',
    pages: (c) => [c.has('ch5_tingyu') ? '聽雨巷。\n\n你記下了這個名字。' : '你站在街口，想了想該從哪裡問起。'],
    choices: [
      { label: '去城南碼頭', next: 'ch5_dock', show: (c) => !c.f('ch5_dock') },
      { label: '去城北舊市集', next: 'ch5_market', show: (c) => !c.has('ch5_tingyu') },  // 沒拿到線索可以一直回去
      { label: '去城中茶棚', next: 'ch5_tea', show: (c) => !c.f('ch5_tea') },
      { label: '【前往聽雨巷】', next: 'ch5_lane', show: (c) => c.has('ch5_tingyu') },
    ],
  };

  N.ch5_dock = {
    bg: B5.dock, place: '洛陽・城南碼頭',
    pages: [
      '碼頭邊停著幾條貨船。\n\n一個老船夫蹲在船頭補網。',
      '你問他，認不認得一個叫「無名客」的人。',
      '「無名客？」',
      '「這名字倒是聽過。」',
      '「有人說他每天都來碼頭。」',
      '「也有人說，那個人已經死了十幾年。」',
    ],
    e: { f: ['ch5_dock'] },
    choices: [
      { label: '繼續追問', next: 'ch5_dock_more' },
      { label: '不再多問', next: 'ch5_dock_leave' },
      { label: '詢問十五年前', next: 'ch5_dock_15' },
    ],
  };
  N.ch5_dock_more = {
    bg: B5.dock, place: '洛陽・城南碼頭',
    pages: [
      '「他長什麼樣子？」',
      '船夫手上的梭子停了一下。',
      '「沒看清楚過。」\n\n「只知道一下雨，他就不來碼頭。」',
      '他低下頭，繼續補網，不再說話。',
    ],
    e: { f: ['ch5_dock_more'] },
    next: 'ch5_city',
  };
  N.ch5_dock_leave = {
    bg: B5.dock, place: '洛陽・城南碼頭',
    pages: ['你道了聲謝。\n\n船夫沒抬頭，只揮了揮手。'],
    next: 'ch5_city',
  };
  N.ch5_dock_15 = {
    bg: B5.dock, place: '洛陽・城南碼頭',
    pages: [
      '「十五年前，這碼頭有沒有發生過什麼事？」',
      '船夫的手停住了。\n\n他慢慢抬起頭，往左右看了一眼。',
      '「客人，這種事情……別問。」',
      '他把網一收，跳回船艙裡。\n\n可是你看見了——他剛才往碼頭最舊的那根木樁看了一眼。',
      '【獲得線索：碼頭老人知道十五年前的事情】',
    ],
    e: { intel: ['ch5_dock15'] },
    next: 'ch5_city',
  };

  N.ch5_market = {
    bg: B5.market, place: '洛陽・城北舊市集',
    pages: (c) => [c.f('ch5_market')
      ? '賣舊書的老人還坐在那裡。\n\n那本舊冊已經不在桌上了。'
      : '舊市集裡擺滿了破銅爛鐵、舊衣舊鞋。\n\n角落有個賣舊書的老人，正在整理一本殘破的舊冊。'],
    // ch5_market 改在選項上設：節點 e 會在算 pages 前套用，放 e 會讓第一次就顯示「還坐在那裡」
    choices: [
      { label: '湊近看那本舊冊', next: 'ch5_market_peek', show: (c) => !c.f('ch5_market_peeked'), e: { f: ['ch5_market'] } },
      { label: '開口詢問', next: 'ch5_market_ask', e: { f: ['ch5_market'] } },
    ],
  };
  N.ch5_market_peek = {
    bg: B5.market, place: '洛陽・城北舊市集',
    pages: [
      '你低頭一看。\n\n泛黃的書頁上，有兩個字：\n\n【沈家】',
      '還沒看清下一行，老人已經把書合上，收進懷裡。',
      '「年輕人。」',
      '「有些書，翻開容易。」',
      '「合上……就不一定了。」',
    ],
    e: { f: ['ch5_market_peeked'] },
    next: 'ch5_market_ask',
  };
  N.ch5_market_ask = {
    bg: B5.market, place: '洛陽・城北舊市集',
    pages: ['老人看著你，等你開口。'],
    choices: [
      { label: '詢問沈家', next: 'ch5_market_shen', show: (c) => !c.f('ch5_market_shen') },
      { label: '詢問無名客', next: 'ch5_market_wmk' },
      { label: '不再追問', next: 'ch5_market_leave' },
    ],
  };
  N.ch5_market_shen = {
    bg: B5.market, place: '洛陽・城北舊市集',
    pages: (c) => [
      '「沈家？」',
      '老人把懷裡的書按緊了一點。',
      '「洛陽姓沈的人家很多。」\n\n「你要問的那一家……十五年來，早就沒人敢問了。」',
    ].concat(c.f('ch2_clue_shen') ? ['他看了你一眼。\n\n「舊書坊那位掌櫃，跟你說過了吧？」\n\n「她說的，已經比我敢說的多。」'] : []),
    e: { f: ['ch5_market_shen'] },
    next: 'ch5_market_ask',
  };
  N.ch5_market_wmk = {
    bg: B5.market, place: '洛陽・城北舊市集',
    pages: [
      '「我在找一個叫『無名客』的人。」',
      '老人沉默了一會兒。',
      '「他不喜歡別人找他。」',
      '「但如果你真的想找……」',
      '「去聽雨巷。」',
      '【獲得線索：聽雨巷】',
    ],
    e: { intel: ['ch5_tingyu'] },
    next: 'ch5_city',
  };
  N.ch5_market_leave = {
    bg: B5.market, place: '洛陽・城北舊市集',
    pages: ['你沒有再問。\n\n老人也沒有留你。'],
    next: 'ch5_city',
  };

  N.ch5_tea = {
    bg: B5.tea, place: '洛陽・城中茶棚',
    pages: [
      '你在茶棚坐下，要了一碗粗茶。',
      '隔壁桌兩個佩刀的江湖人，聲音壓得很低。',
      '「最近黑羽盟的人好像在找什麼。」',
      '「不是找東西。」',
      '「是在找一個人。」',
    ],
    e: { f: ['ch5_tea'] },
    choices: [
      { label: '繼續聽', next: 'ch5_tea_listen' },
      { label: '起身離開', next: 'ch5_city' },
    ],
  };
  N.ch5_tea_listen = {
    bg: B5.tea, place: '洛陽・城中茶棚',
    pages: (c) => [
      '「什麼人？」',
      '「不知道長相，也不知道名字。」',
      '「聽說那人手裡，有一枚玉佩。」',
      '你端著茶碗的手，停在半空。',
    ].concat(c.f('obtainedBlackFeatherOrder') ? ['你想起黑羽密令上那一行字。\n\n「目標已找到。」'] : [])
      .concat(['兩人付了錢，起身走了。\n\n你低頭看著碗裡的茶，一口也沒喝。', '【獲得線索：黑羽盟在找玉佩的主人】']),
    e: { intel: ['ch5_bf_hunt'] },
    next: 'ch5_city',
  };

  N.ch5_lane = {
    bg: B5.lane, place: '洛陽・聽雨巷',
    pages: (c) => [
      '聽雨巷很窄。\n\n雨剛停，石板上還積著水。',
      '兩旁的舊屋門窗都關著，看起來已經很多年沒人住了。',
    ].concat(c.f('ch5_dock_more') ? ['你想起船夫的話——\n\n「一下雨，他就不來碼頭。」'] : [])
      .concat(['巷子盡頭，有一間很小的茶館。\n\n招牌上只有兩個字：\n\n【無名】', '你推門進去。', '店裡沒有客人。\n\n只有一個穿灰色長衫的中年人，坐在角落。']),
    next: 'ch5_meet',
  };
  N.ch5_meet = {
    bg: B5.inn, place: '無名茶館',
    pages: [
      WMK_ANON('他沒有抬頭。\n\n「找我的人，通常有兩種。」'),
      WMK_ANON('「一種是想知道我知道什麼。」'),
      WMK_ANON('「另一種，是想知道我為什麼還活著。」'),
    ],
    choices: [
      { label: '「我來問十五年前的事。」', next: 'ch5_ans_15' },
      { label: '「白石老人叫我來。」', next: 'ch5_ans_baishi' },
      { label: '「我只是想知道玉佩的秘密。」', next: 'ch5_ans_jade' },
      { label: '「我不知道自己為什麼來。」', next: 'ch5_ans_unsure' },
    ],
  };
  N.ch5_ans_15 = {
    bg: B5.inn, place: '無名茶館',
    pages: ['男子第一次抬起頭。', WMK_ANON('「十五年。」\n\n「這兩個字，洛陽很久沒人敢在我面前說了。」'), '他的目光落在你身上的玉佩。', WMK('「……你真的帶著它。」')],
    e: { f: ['ch5_ans_15'], people: ['wumingke'] },
    next: 'ch5_reveal',
  };
  N.ch5_ans_baishi = {
    bg: B5.inn, place: '無名茶館',
    pages: ['男子第一次抬起頭。', '他停了一下。', WMK_ANON('「原來是他。」'), '他的目光落在你身上的玉佩。', WMK('「……你真的帶著它。」')],
    e: { f: ['ch5_ans_baishi'], people: ['wumingke'] },
    next: 'ch5_reveal',
  };
  N.ch5_ans_jade = {
    bg: B5.inn, place: '無名茶館',
    pages: ['男子第一次抬起頭。', '他看向你身上的玉佩。', WMK('「你真的帶著它。」')],
    e: { f: ['ch5_ans_jade'], people: ['wumingke'] },
    next: 'ch5_reveal',
  };
  N.ch5_ans_unsure = {
    bg: B5.inn, place: '無名茶館',
    pages: ['男子第一次抬起頭。', WMK_ANON('「不知道為什麼來，卻還是走到了這裡。」'), '他的目光落在你身上的玉佩。', WMK('「……那就是它帶你來的。」')],
    e: { f: ['ch5_ans_unsure'], people: ['wumingke'] },
    next: 'ch5_reveal',
  };
  N.ch5_reveal = {
    bg: B5.inn, place: '無名茶館',
    pages: (c) => ['【無名客】']
      .concat(c.f('ch3_gave_jade') ? ['他看見玉佩缺了一角。\n\n他沒有問是誰拿走的。\n\n好像他早就知道。'] : [])
      .concat(c.f('obtainedShenOldCoin') ? ['你把那枚發綠的舊銅錢放在桌上。\n\n他看了一眼，推回你面前。', WMK('「收著。這種錢，在洛陽已經花不出去了。」')] : [])
      .concat([
        WMK('「十五年前，我曾經見過沈家。」'),
        WMK('「那一夜之後，沈家消失。」'),
        WMK('「但不是所有人都死了。」'),
        '你想起白石老人的話。\n\n三個人走過白石橋，第三個活了下來。',
      ]),
    next: 'ch5_q_hub',
  };

  // ---- 四個追問：至少問一個，之後可以停 ----
  N.ch5_q_hub = {
    bg: B5.inn, place: '無名茶館',
    pages: (c) => [(c.f('ch5_q_who') || c.f('ch5_q_what') || c.f('ch5_q_jade') || c.f('ch5_q_bf')) ? '無名客替自己倒了一杯茶。\n\n他在等你下一個問題。' : '你要問什麼？'],
    choices: [
      { label: '「誰活下來？」', next: 'ch5_q_who', show: (c) => !c.f('ch5_q_who') },
      { label: '「沈家到底發生了什麼？」', next: 'ch5_q_what', show: (c) => !c.f('ch5_q_what') },
      { label: '「玉佩到底是什麼？」', next: 'ch5_q_jade', show: (c) => !c.f('ch5_q_jade') },
      { label: '「黑羽盟為什麼一直追查？」', next: 'ch5_q_bf', show: (c) => !c.f('ch5_q_bf') },
      { label: '沒有別的要問了', next: 'ch5_choice', show: (c) => c.f('ch5_q_who') || c.f('ch5_q_what') || c.f('ch5_q_jade') || c.f('ch5_q_bf') },
    ],
  };
  N.ch5_q_who = {
    bg: B5.inn, place: '無名茶館',
    pages: ['「誰活下來？」', WMK('「一個人。」'), '他停了很久。', WMK('「也可能是兩個。」'), '他沒有再說下去。'],
    e: { f: ['ch5_q_who'] },
    next: 'ch5_q_hub',
  };
  N.ch5_q_what = {
    bg: B5.inn, place: '無名茶館',
    pages: ['「沈家到底發生了什麼？」', WMK('「你以為那是一場滅門。」'), WMK('「其實不是。」'), WMK('「真正可怕的，是有人希望所有人都相信那是一場滅門。」')],
    e: { f: ['ch5_q_what'] },
    next: 'ch5_q_hub',
  };
  N.ch5_q_jade = {
    bg: B5.inn, place: '無名茶館',
    pages: ['「玉佩到底是什麼？」', WMK('「它不是寶物。」'), WMK('「也不是武林秘籍。」'), WMK('「它只是一把鑰匙。」'), '「開什麼？」', WMK('「一個十五年前就應該被埋掉的秘密。」')],
    e: { f: ['ch5_q_jade'] },
    next: 'ch5_q_hub',
  };
  N.ch5_q_bf = {
    bg: B5.inn, place: '無名茶館',
    pages: ['「黑羽盟為什麼一直追查？」', WMK('「因為他們怕有人想起來。」'), WMK('「而你……」'), WMK('「已經讓他們想起來了。」')],
    e: { f: ['ch5_q_bf'] },
    next: 'ch5_q_hub',
  };

  // ---- 重要選擇（三個隱藏標記，不顯示） ----
  N.ch5_choice = {
    bg: B5.inn, place: '無名茶館',
    pages: [
      '無名客放下茶杯。',
      WMK('「你現在還想繼續查嗎？」'),
      '這句話，你好像在哪裡聽過。\n\n白石橋上，沈若蘭背對著你，也問過差不多的話。',
    ],
    choices: [
      { label: '「我要查到底。」', next: 'ch5_c_shen', nohist: true },
      { label: '「我只想知道自己的玉佩。」', next: 'ch5_c_jade', nohist: true },
      { label: '「我想知道你隱瞞了什麼。」', next: 'ch5_c_doubt', nohist: true },
    ],
  };
  N.ch5_c_shen = {
    bg: B5.inn, place: '無名茶館',
    pages: [WMK('「那你最好做好失去一些東西的準備。」')],
    e: { f: ['ch5_trace_shen'] },
    next: 'ch5_bf',
  };
  N.ch5_c_jade = {
    bg: B5.inn, place: '無名茶館',
    pages: [WMK('「那就只查玉佩。」'), WMK('「不要碰沈家。」')],
    e: { f: ['ch5_trace_jade'] },
    next: 'ch5_bf',
  };
  N.ch5_c_doubt = {
    bg: B5.inn, place: '無名茶館',
    pages: ['無名客第一次露出笑容。', WMK('「很好。」'), WMK('「至少你不是個只會問問題的人。」')],
    e: { f: ['ch5_doubt_wumingke'] },
    next: 'ch5_bf',
  };

  // ---- 黑羽追兵×3（沿用現有戰鬥；贏輸都拿追查令） ----
  N.ch5_bf = {
    bg: B5.lane, place: '洛陽・聽雨巷',
    pages: [
      '你起身要走。\n\n門外的積水裡，傳來很輕的腳步聲。',
      WMK('「他們來了。」'),
      '「誰？」',
      WMK('「找你的。」'),
      '三個左手戴黑護腕的人，堵在巷口。',
      { t: '「人在這裡。」', who: 'bf' },
    ],
    battle: { count: 3, name: '黑羽追兵', win: 'ch5_after', lose: 'ch5_after_lose', label: '戰鬥開始' },
  };
  N.ch5_after = {
    bg: B5.lane, place: '洛陽・聽雨巷',
    pages: [
      '最後一個黑衣人倒在積水裡。',
      '他的懷裡露出一張摺好的紙，紙角壓著黑羽的印。',
      { t: '【獲得：黑羽追查令】', icon: 'icon_bf_warrant' },
    ],
    e: { f: ['ch5_fought_bf', 'obtainedBlackFeatherWarrant'], item: ['bf_warrant'] },
    next: 'ch5_warrant',
  };
  N.ch5_after_lose = {
    bg: B5.lane, place: '洛陽・聽雨巷',
    pages: [
      '你被逼到牆邊，刀鋒已經到了眼前。',
      '一隻茶杯從茶館裡飛出來，正好打在那人的手腕上。',
      '三個黑衣人互看一眼，沒有再上前，退出了巷子。\n\n其中一人走得太急，掉了一張摺好的紙。',
      { t: '【獲得：黑羽追查令】', icon: 'icon_bf_warrant' },
    ],
    e: { f: ['ch5_fought_bf', 'obtainedBlackFeatherWarrant'], item: ['bf_warrant'] },
    next: 'ch5_warrant',
  };
  N.ch5_warrant = {
    bg: B5.lane, place: '洛陽・聽雨巷',
    pages: [
      '你把紙攤開。',
      '「目標確認。」',
      '「持有沈家玉佩。」',
      '「不得擅自處置。」',
      '「活捉。」',
      '最後有一個模糊的印記，看不出是什麼。',
      '你又看了一遍。\n\n不是「奪回玉佩」。\n\n是「活捉」。',
      '他們要的，不是玉佩。\n\n是你。',
    ],
    next: 'ch5_last',
  };
  N.ch5_last = {
    bg: B5.inn, place: '無名茶館',
    pages: (c) => [
      '你回到茶館。\n\n無名客還坐在原來的位置，好像什麼都沒發生過。',
      WMK('「你現在知道了。」'),
      WMK('「他們不是想要你的玉佩。」'),
      WMK('「他們想知道……」'),
      WMK('「玉佩為什麼會選你。」'),
      '「什麼意思？」',
      '他沒有回答。\n\n只從桌下拿出一張殘破的紙，推到你面前。',
      '紙上只有幾個字：\n\n【洛陽城舊卷】\n\n【沈雲川】\n\n【十五年前】',
    ].concat(c.has('ch3_name_yunchuan')
        ? ['沈雲川。\n\n你想起沈家舊宅廳堂那幅畫像——唯一沒被刮掉臉的那個年輕人。']
        : ['沈雲川。\n\n這個名字，你好像在哪裡見過。'])
      .concat([
        WMK('「如果你真的想知道真相。」'),
        WMK('「下一個要找的，不是我。」'),
        WMK('「是沈雲川。」'),
        '【獲得線索：洛陽城舊卷・沈雲川】',
      ]),
    e: { intel: ['ch5_old_scroll'] },
    next: 'ch5_end',
  };
  N.ch5_end = {
    bg: B5.night, place: '洛陽・夜',
    pages: [
      '你走出聽雨巷的時候，天已經黑了。',
      '十五年前。',
      '沈家消失。',
      '有人活了下來。',
      '有人選擇沉默。',
      '也有人，從未放棄尋找真相。',
      '而現在。',
      '黑羽盟已經知道你是誰。',
      '沈家舊案，也再次被人翻開。',
      '【沈雲川……究竟是誰？】',
    ],
    e: { f: ['chapter5Completed'], phase: 'done_ch5', complete: 'ch5' },
    choices: [{ label: '完', next: 'ch5_final' }],
  };
  N.ch5_final = {
    bg: B5.night, place: '', center: true,
    pages: ['【第五章・無名客　完】\n\n【第六章・沈雲川】\n已解鎖\n\n「一個已經死去十五年的人，為什麼還有人在找他？」'],
    choices: [{ label: '繼續江湖', next: '__close' }],
  };

  // ===== 第六章・沈雲川（同一套節點、show、battle、e；不加新系統） =====
  // 背景用最終檔名；美術還沒到的，由 S.ART_FALLBACK 自動退回舊圖（檔案放進 assets/story/ 就會換上）
  const B6 = {
    city: 'scene_luoyang',
    gate: 'scene_luoyang_oldgate',
    street: 'scene_luoyang_teashed',
    book: 'scene_luoyang_westbook',
    alley: 'scene_tingyu_lane',
    yard: 'scene_shen_backyard',
    well: 'scene_shen_well_bottom',
    night: 'scene_luoyang_night',
  };
  S.B6 = B6;
  N.ch6_title = {
    bg: B6.city, place: '', center: true,
    pages: ['【第六章・沈雲川】\n\n「一個已經死去十五年的人，為什麼還有人在找他？」'],
    e: { f: ['chapter6Started'], chapter: 6, phase: 'ch6' },
    next: 'ch6_open',
  };
  N.ch6_open = {
    bg: B6.city, place: '洛陽城',
    pages: (c) => [
      '你攤開無名客給的那張殘紙。\n\n【洛陽城舊卷】\n【沈雲川】\n【十五年前】',
      '沈雲川。',
      '這個名字，十五年前就應該消失。',
      '可是現在，卻有三個不同的人，都曾經提過這個名字。',
    ].concat(c.f('ch5_trace_jade') ? ['你答應過無名客，只查玉佩，不碰沈家。\n\n可是玉佩的另一頭，偏偏連著沈家。'] : [])
      .concat(c.f('ch5_trace_shen') ? ['你說過要查到底。\n\n現在，是時候了。'] : [])
      .concat(c.f('ch5_doubt_wumingke') ? ['你想起無名客那一笑。\n\n他把這張紙交給你，真的只是好意嗎？'] : [])
      .concat(['你往城中舊衙門的方向走去。']),
    next: 'ch6_city',
  };
  N.ch6_city = {
    bg: B6.city, place: '洛陽・舊衙門附近',
    pages: (c) => [(c.f('ch6_gate') || c.f('ch6_street')) ? '你回到舊衙門前的街口。' : '舊衙門早就廢了，門前的石獅缺了半張臉。\n\n要從哪裡問起？'],
    choices: [
      { label: '舊城門', next: 'ch6_gate', show: (c) => !c.f('ch6_gate') },
      { label: '城中老街', next: 'ch6_street', show: (c) => !c.f('ch6_street') },
      { label: '城西舊書坊', next: 'ch6_book' },
    ],
  };
  N.ch6_gate = {
    bg: B6.gate, place: '洛陽・舊城門',
    pages: [
      '舊城門下，一個守門老人靠著牆打盹。',
      '「沈雲川。」\n\n你說出這個名字。',
      '老人睜開眼，沉默了很久。',
      '「十五年前？」\n\n「那個人不是早就死了嗎？」',
      '「你見過他？」',
      '「見過。」\n\n「但不是十五年前。」',
      '你一愣。',
      '老人立刻別過頭。\n\n「我年紀大了，記錯了。」',
    ],
    e: { f: ['ch6_gate'] },
    choices: [
      { label: '繼續追問', next: 'ch6_gate_press' },
      { label: '暫時離開', next: 'ch6_city' },
      { label: '問他最近有沒有人提過沈雲川', next: 'ch6_gate_recent' },
    ],
  };
  N.ch6_gate_press = {
    bg: B6.gate, place: '洛陽・舊城門',
    pages: ['「不是十五年前，那是什麼時候？」', '老人把帽子拉低，蓋住了眼睛。\n\n「城門要關了，客人請回吧。」', '天色還早。\n\n城門不會關。'],
    next: 'ch6_city',
  };
  N.ch6_gate_recent = {
    bg: B6.gate, place: '洛陽・舊城門',
    pages: (c) => [
      '「最近有沒有人，也來問過這個名字？」',
      '老人往左右看了一眼，壓低聲音：',
      '「前幾天，有個戴斗笠的人來問過同樣的名字。」',
    ].concat(c.f('helped_mysterious_woman') || c.f('seen_woman') ? ['戴斗笠。\n\n你想起青石鎮醉仙樓窗邊，那個看雨的白衣女子。\n\n——是她嗎？還是別人？'] : [])
      .concat(['【獲得線索：有人也在找沈雲川】']),
    e: { intel: ['ch6_seeker'] },
    next: 'ch6_city',
  };
  N.ch6_street = {
    bg: B6.street, place: '洛陽・城中老街',
    pages: [
      '老街很窄，兩旁是賣糖、賣燈籠的小攤。',
      '你問賣糖的老婦人，記不記得沈家。',
      '「沈家大公子？」\n\n她手裡的糖勺停了一下。',
      '「小時候常來，總是買兩支，一支給自己，一支帶回去。」',
      '「後來沈家出事，就再沒見過了。」',
      '她想了想，又低聲補了一句：\n\n「前些日子，倒是有個人，在沈家舊鋪子門口站了很久。我沒看清臉。」',
      '【獲得線索：老街的舊事】',
    ],
    e: { f: ['ch6_street'], intel: ['ch6_street'] },
    next: 'ch6_city',
  };
  N.ch6_book = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: (c) => []
      .concat(c.f('ch2_clue_shen') ? ['你想過去找蘇晚棠。\n\n可她說過：「知道得越多，麻煩越多。」\n\n你不想再把她扯進來。'] : [])
      .concat([
        '城西這間書坊比你想的還破，門板斜著，屋裡一股霉味。',
        '店主是個中年男子，正在補一本書的封皮。',
        '你把那張殘紙放在櫃檯上。',
        '他看了一眼，臉色變了。',
        '「沈雲川？」',
        '「你從哪裡拿到這東西？」',
      ]),
    e: { f: ['ch6_book'] },
    // 這四句會留下之後章節用的隱藏旗標，不進履歷
    choices: [
      { label: '「無名客給我的。」', next: 'ch6_book_wmk', nohist: true },
      { label: '「在沈家舊宅找到的。」', next: 'ch6_book_lie', nohist: true },
      { label: '「不告訴你。」', next: 'ch6_book_no', nohist: true },
      { label: '「我只想知道沈雲川是誰。」', next: 'ch6_book_who', nohist: true },
    ],
  };
  N.ch6_book_wmk = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['店主的手停住了。\n\n他很久沒有說話。', '「原來……是他。」', '他沒有再問，起身把門閂上。'],
    e: { f: ['ch6_said_wmk'] },
    next: 'ch6_record',
  };
  N.ch6_book_lie = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['店主盯著你看了一會兒。', '「沈家舊宅裡，可找不到這種紙。」', '他沒有拆穿，只是起身把門閂上。'],
    next: 'ch6_record',
  };
  N.ch6_book_no = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['「不告訴我也好。」', '「知道的人越少，活得越久。」', '他起身把門閂上。'],
    next: 'ch6_record',
  };
  N.ch6_book_who = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['「是誰？」\n\n店主苦笑了一下。', '「這個問題，十五年來沒有人敢大聲問。」', '他起身把門閂上。'],
    next: 'ch6_record',
  };
  N.ch6_record = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: [
      '店主從書架最底層，抽出一本殘破的舊冊。',
      '他翻到其中一頁，推到你面前。',
      '【沈雲川】\n【洛陽沈家長子】\n【十五年前失蹤】',
      '旁邊卻還有一行字：\n\n【後確認死亡】',
      '你湊近看。\n\n「確認死亡」這四個字，筆跡和其他字完全不同。',
      '「誰改的？」',
      '「不知道。」\n\n「但這幾個字，是後來才加上去的。」',
      '【獲得線索：沈雲川死亡記錄疑點】',
    ],
    e: { intel: ['ch6_record'] },
    next: 'ch6_torn',
  };
  N.ch6_torn = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: (c) => [c.f('ch6_book_asked')
      ? '你又看了一眼那半句殘字。'
      : '你翻到下一頁。\n\n原本應該記著沈家其他人的地方，整頁被撕掉了。\n\n只剩下半句：\n\n「沈家當夜……」'],
    choices: [
      { label: '仔細找找缺掉的那頁', next: 'ch6_search' },
      { label: '詢問店主', next: 'ch6_ask_owner', show: (c) => !c.f('ch6_book_asked') },
      { label: '先記下內容', next: 'ch6_note' },
    ],
  };
  N.ch6_ask_owner = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['「這頁是誰撕的？」', '店主搖頭。', '「這本冊子到我手上的時候，就已經是這樣了。」\n\n「撕掉它的人，比你我都早來。」'],
    e: { f: ['ch6_book_asked'] },
    next: 'ch6_torn',
  };
  N.ch6_search = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: [
      '你把書架一層一層看過去。',
      '最後在書櫃和牆的縫隙裡，摸到一小張摺得很緊的紙。',
      '紙上只有一句：\n\n「沈雲川沒有死。」',
      '你抬頭看店主。\n\n他看起來比你還驚訝。',
      '【獲得線索：沈雲川可能還活著】',
    ],
    e: { intel: ['ch6_alive'] },
    next: 'ch6_leave_book',
  };
  N.ch6_note = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['你把「沈家當夜……」這半句，和那行改過的字，一起記在心裡。'],
    next: 'ch6_leave_book',
  };
  N.ch6_leave_book = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['店主把舊冊收回去，拉開門閂。', '「出去的時候，走慢一點。」\n\n「走太快，像是在逃。」'],
    next: 'ch6_out',
  };
  N.ch6_out = {
    bg: B6.city, place: '洛陽・城西街口',
    pages: ['你走出書坊。', '街的另一頭，站著一個戴斗笠的人。', '你往前走了兩步。\n\n他轉身就走。'],
    choices: [
      { label: '追上去', next: 'ch6_chase' },
      { label: '留在原地觀察', next: 'ch6_watch' },
      { label: '返回書坊', next: 'ch6_back' },
    ],
  };
  N.ch6_chase = {
    bg: B6.alley, place: '洛陽・窄巷',
    pages: ['你追進巷子。\n\n斗笠在前面一晃，轉進了岔路。'],
    e: { f: ['ch6_out_chase'] },
    choices: [
      { label: '往左邊追', next: 'ch6_chase_end' },
      { label: '往右邊追', next: 'ch6_chase_end' },
    ],
  };
  N.ch6_chase_end = {
    bg: B6.alley, place: '洛陽・窄巷',
    pages: [
      '你繞過兩個轉角，眼前只剩一堵牆。',
      '人不見了。',
      '巷口的地上，落著一根黑色羽毛。\n\n旁邊還有一小塊被牆釘勾破的黑布。',
      { t: '【獲得：黑羽衣角】', icon: 'icon_bf_cloth' },
    ],
    e: { item: ['bf_cloth'] },
    next: 'ch6_lan',
  };
  N.ch6_watch = {
    bg: B6.city, place: '洛陽・城西街口',
    pages: [
      '你沒有動。',
      '那人走到街角，抬手壓了壓斗笠。\n\n袖口翻起來的那一瞬間，你看見了——黑羽的印記。',
      '他好像也知道你看見了。\n\n下一刻，人已經不在街角。',
      '【獲得線索：黑羽盟在盯著你】',
    ],
    e: { f: ['ch6_out_watch'], intel: ['ch6_watched'] },
    next: 'ch6_lan',
  };
  N.ch6_back = {
    bg: B6.book, place: '洛陽・城西舊書坊',
    pages: ['你退回書坊。', '店主看見你，沒有一點意外。', '「你已經被盯上了。」', '「誰？」', '「你心裡應該已經有答案。」', '他把門關上了。'],
    e: { f: ['ch6_out_back'] },
    next: 'ch6_lan',
  };
  N.ch6_lan = {
    bg: B6.city, place: '洛陽・街角',
    pages: ['你再走出來的時候，街角站著一個人。', '是沈若蘭。', '她看見你，卻沒有走過來。'],
    choices: [
      { label: '叫住沈若蘭', next: 'ch6_lan_call', nohist: true },
      { label: '跟上她', next: 'ch6_lan_follow', nohist: true },
      { label: '假裝沒看到她', next: 'ch6_lan_ignore', nohist: true },
    ],
  };
  N.ch6_lan_call = {
    bg: B6.city, place: '洛陽・街角',
    pages: ['「沈姑娘。」\n\n她停下。', '「你知道沈雲川嗎？」', '她沉默了很久。', LAN('「知道。」'), '「他死了嗎？」', LAN('「你真的想知道？」'), '「是。」', LAN('「那就不要再相信你看到的死亡。」')],
    e: { f: ['ch6_lan_call'] },
    next: 'ch6_lan_hint',
  };
  N.ch6_lan_follow = {
    bg: B6.city, place: '洛陽・廢院',
    pages: ['你遠遠跟在她後面。', '她走進一間廢棄的院子，從懷裡拿出一張舊紙。', '紙上畫的，看起來像是一座宅子的格局——\n\n沈家舊宅。', '她忽然轉身。', LAN('「你跟著我做什麼？」')],
    e: { f: ['ch6_lan_follow'] },
    choices: [
      { label: '「我在找沈雲川。」', next: 'ch6_lan_f1', nohist: true },
      { label: '「我想知道你是誰。」', next: 'ch6_lan_f2', nohist: true },
      { label: '「我只是路過。」', next: 'ch6_lan_f3', nohist: true },
    ],
  };
  N.ch6_lan_f1 = { bg: B6.city, place: '洛陽・廢院', pages: [LAN('「那你找錯方向了。」'), '她把紙收起來。'], next: 'ch6_lan_hint' };
  N.ch6_lan_f2 = { bg: B6.city, place: '洛陽・廢院', pages: [LAN('「我說過我的名字。」'), LAN('「其他的，你還不需要知道。」')], next: 'ch6_lan_hint' };
  N.ch6_lan_f3 = { bg: B6.city, place: '洛陽・廢院', pages: [LAN('「路過到廢院裡來？」'), '她居然笑了一下。'], next: 'ch6_lan_hint' };
  N.ch6_lan_ignore = {
    bg: B6.city, place: '洛陽・街角',
    pages: ['你移開目光，從她身邊走過去。', '走出十幾步，身後傳來她的聲音。', LAN('「你變聰明了。」'), LAN('「知道什麼事情不該追。」'), '「但你還是跟著我。」', LAN('「因為有些事情。」'), LAN('「不是你想不追，就能不追。」')],
    e: { f: ['ch6_lan_ignore'] },
    next: 'ch6_lan_hint',
  };
  N.ch6_lan_hint = {
    bg: B6.city, place: '洛陽・街角',
    pages: [
      LAN('「你上次在沈家舊宅後院看到的那個地方。」'),
      LAN('「你漏了一樣東西。」'),
      '「什麼？」',
      LAN('「井。」'),
      LAN('「不是枯井。」'),
      LAN('「是井底。」'),
      '她說完就走了。',
      '【獲得線索：井底】',
    ],
    e: { intel: ['ch6_backyard'] },
    next: 'ch6_return',
  };
  N.ch6_return = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: (c) => ['你又一次走進沈家舊宅。', '後院還是老樣子。\n\n那口枯井就在角落。']
      .concat(c.f('ch3_well_mark') ? ['井壁上「洛水不忘」那四個字，你還記得。'] : []),
    next: 'ch6_well',
  };
  N.ch6_well = {
    bg: B6.yard, place: '沈家舊宅・枯井',
    pages: ['你站在井邊。'],
    choices: [
      // 節點的 e 會在算頁面之前生效，所以「有沒有洛水不忘」要在選項這裡先看（ch6_well_luoshui＝這次才補給）
      { label: '查看井口', next: 'ch6_well_top', show: (c) => !c.f('ch6_well_top'), eFn: (c) => (c.has('ch3_luoshui') ? { f: ['ch6_well_top'] } : { f: ['ch6_well_top', 'ch6_well_luoshui'], intel: ['ch3_luoshui'] }) },
      { label: '下井', next: 'ch6_down' },
      { label: '離開', next: 'ch6_well_leave' },
    ],
  };
  N.ch6_well_top = {
    bg: B6.yard, place: '沈家舊宅・枯井',
    pages: (c) => (c.f('ch6_well_luoshui')
      ? ['井壁上刻著四個字，刻得很深：\n\n「洛水不忘」', '【獲得線索：洛水不忘】']
      : ['井口的青苔被人踩過。\n\n不是你。'])
      .concat(['井邊的石頭上，綁著一條舊繩，看起來還結實。']),
    next: 'ch6_well',
  };
  N.ch6_well_leave = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: ['你走到後院門口，又停了下來。', '若蘭那句話還在耳邊——「是井底。」', '你轉身走回井邊。'],
    next: 'ch6_well',
  };
  N.ch6_down = {
    bg: B6.well, place: '沈家舊宅・井底',
    pages: [
      '你抓著繩子，一點一點往下。',
      '井底沒有水。\n\n只有乾掉的泥，和一股很久沒見過天日的氣味。',
      '你蹲下來，用手撥開泥土。',
      '下面是一塊石板。\n\n石板中央，刻著一個「沈」字。',
      '石板邊緣有一道細縫。你用刀尖一撬，翻開了一個很小的暗格。',
    ],
    next: 'ch6_tablet',
  };
  N.ch6_tablet = {
    bg: B6.well, place: '沈家舊宅・井底',
    pages: (c) => [
      '暗格裡放著半枚玉牌。',
      '你剛把它拿起來，懷裡的染血玉佩，忽然微微發熱。',
    ].concat(c.f('ch3_gave_jade') ? ['玉佩缺掉的那一角，熱得最厲害。'] : [])
      .concat([
        '你把兩樣東西拿近。',
        '兩枚玉牌彼此呼應。',
        { t: '【獲得：沈家半枚玉牌】', icon: 'icon_shen_half_tablet' },
        '你翻過玉牌。\n\n背面刻著兩個字：\n\n「雲川。」',
        '你的手停在半空。',
        '沈雲川。\n\n這枚玉牌，和你身上的玉佩，是同一個人的東西。',
      ]),
    e: { f: ['obtainedShenHalfTablet'], item: ['shen_half_tablet'] },
    choices: [
      { label: '沈雲川到底留下了什麼？', next: 'ch6_t1' },
      { label: '玉佩為什麼會選中我？', next: 'ch6_t2' },
      { label: '沈若蘭知道多少？', next: 'ch6_t3' },
      { label: '黑羽盟為什麼害怕這東西？', next: 'ch6_t4' },
    ],
  };
  N.ch6_t1 = { bg: B6.well, place: '沈家舊宅・井底', pages: ['你把半枚玉牌翻來覆去地看。', '它只有一半。\n\n有些答案，需要另一半玉牌。'], next: 'ch6_bf' };
  N.ch6_t2 = { bg: B6.well, place: '沈家舊宅・井底', pages: ['玉佩還在發熱，像在回答你。', '可是你聽不懂。\n\n你現在知道得還不夠。'], next: 'ch6_bf' };
  N.ch6_t3 = { bg: B6.well, place: '沈家舊宅・井底', pages: ['她知道井底有東西。\n\n她卻沒有自己下來拿。', '為什麼？'], next: 'ch6_bf' };
  N.ch6_t4 = { bg: B6.well, place: '沈家舊宅・井底', pages: ['一枚玉牌，能讓人怕成什麼樣子？', '你很快就會知道了。'], next: 'ch6_bf' };
  N.ch6_bf = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: [
      '井口上方，傳來一個聲音。',
      { t: '「下面的人。」\n\n「把東西交出來。」', who: 'bf' },
      '你爬上井口。',
      '後院四周，已經站滿了左手戴黑護腕的人。',
      '為首的那個，腰間掛的不是黑羽令，而是一塊刻字的木牌——旁人叫他「執事」。',
      { t: '「黑羽執事有令，拿下。」', who: 'bf' },
    ],
    battle: { count: 3, name: '黑羽追兵', win: 'ch6_after', lose: 'ch6_after_lose', label: '戰鬥開始' },
  };
  N.ch6_after = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: [
      '最後一個黑衣人倒下。',
      '黑羽執事見勢不對，翻牆走了。\n\n倉皇之間，從他懷裡掉出一封封了黑蠟的信。',
      { t: '【獲得：黑羽密函】', icon: 'icon_bf_letter' },
    ],
    e: { f: ['ch6_fought_bf', 'obtainedBlackFeatherLetter'], item: ['bf_letter'] },
    next: 'ch6_letter',
  };
  N.ch6_after_lose = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: [
      '你被逼到井邊，退無可退。',
      '一道細細的銀光從牆頭飛來，釘在黑羽執事腳前——\n\n是一枚銀簪。',
      '執事臉色一變，揮手帶人撤了。\n\n走得太急，懷裡掉出一封封了黑蠟的信。',
      { t: '【獲得：黑羽密函】', icon: 'icon_bf_letter' },
    ],
    e: { f: ['ch6_fought_bf', 'obtainedBlackFeatherLetter'], item: ['bf_letter'] },
    next: 'ch6_letter',
  };
  N.ch6_letter = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: [
      '你拆開黑蠟。',
      '「沈雲川若現身。」\n\n「立即回報。」',
      '「若玉佩出現。」\n\n「不得搶奪。」',
      '「確認持有人身分。」',
      '最後一句：\n\n「此人與十五年前之事有關。」',
      '你把信看了三遍。',
      '十五年前，你在哪裡？\n\n你記得的，只有很小很小的時候。',
      '為什麼……會跟沈家有關？',
      '【獲得線索：此人與十五年前之事有關】',
    ],
    e: { intel: ['ch6_linked'] },
    next: 'ch6_lan_last',
  };
  N.ch6_lan_last = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: ['沈若蘭從牆頭落下來。', '她的目光，落在你手裡的半枚玉牌上。', '你第一次看見，她的神情變了。', LAN('「你在哪裡找到的？」')],
    choices: [
      { label: '「井底。」', next: 'ch6_l1', nohist: true },
      { label: '「沈雲川留下的。」', next: 'ch6_l2', nohist: true },
      { label: '「你先告訴我你是誰。」', next: 'ch6_l3', nohist: true },
      { label: '「不告訴你。」', next: 'ch6_l4', nohist: true },
    ],
  };
  N.ch6_l1 = { bg: B6.yard, place: '沈家舊宅・後院', pages: ['「井底。」', '她看著那口井，很久沒有說話。'], e: { f: ['ch6_told_lan_well'] }, next: 'ch6_tingfeng' };
  N.ch6_l2 = { bg: B6.yard, place: '沈家舊宅・後院', pages: ['「沈雲川留下的。」', LAN('「……你知道自己在說什麼嗎？」'), '她的聲音很輕，輕得幾乎在發抖。'], next: 'ch6_tingfeng' };
  N.ch6_l3 = { bg: B6.yard, place: '沈家舊宅・後院', pages: ['「你先告訴我，你是誰。」', '沈若蘭沉默了。', LAN('「我的名字，是真的。」'), LAN('「但我的身分，不一定。」')], e: { f: ['ch6_asked_lan_who'] }, next: 'ch6_tingfeng' };
  N.ch6_l4 = { bg: B6.yard, place: '沈家舊宅・後院', pages: ['「不告訴你。」', LAN('「也好。」'), LAN('「這種東西，知道它在哪裡的人越少越好。」')], e: { f: ['ch6_hid_tablet'] }, next: 'ch6_tingfeng' };
  N.ch6_tingfeng = {
    bg: B6.yard, place: '沈家舊宅・後院',
    pages: [
      LAN('「你想找沈雲川。」'),
      LAN('「那就去洛陽城外。」'),
      LAN('「找一座叫『聽風渡』的渡口。」'),
      '「那裡有沈雲川？」',
      LAN('「不知道。」'),
      '她停了一下。',
      LAN('「但十五年前最後見過他的人。」'),
      LAN('「就在那裡。」'),
      '【獲得線索：聽風渡】',
    ],
    e: { intel: ['ch6_tingfeng'] },
    next: 'ch6_end',
  };
  N.ch6_end = {
    bg: B6.night, place: '洛陽・夜',
    pages: [
      '沈雲川沒有死？',
      '沈家當年的死亡記錄，有人改過。',
      '黑羽盟害怕玉佩出現。',
      '而玉佩……似乎正在回應你。',
      '【如果沈雲川真的活著。】',
      '【那麼十五年前，他究竟去了哪裡？】',
    ],
    e: { f: ['chapter6Completed'], phase: 'done_ch6', complete: 'ch6' },
    choices: [{ label: '完', next: 'ch6_final' }],
  };
  N.ch6_final = {
    bg: B6.night, place: '', center: true,
    pages: ['【第六章・沈雲川　完】\n\n【第七章・聽風渡】\n🔒 尚未解鎖\n\n「十五年前最後見過沈雲川的人，還活著嗎？」'],
    choices: [{ label: '繼續江湖', next: '__close' }],
  };

  // ===== 美術未到時自動退回的舊圖（新檔放進 assets/story/ 就會蓋過去；到齊後可刪掉對應這行） =====
  S.ART_FALLBACK = {
    scene_luoyang_oldgate: 'scene_luoyang',
    scene_luoyang_westbook: 'scene_bookshop',
    scene_shen_well_bottom: 'scene_shen_backyard',
    icon_shen_half_tablet: 'icon_jade_pendant',
    icon_bf_letter: 'icon_bf_order',
    icon_bf_cloth: 'icon_blackfeather',
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
    { id: 'q_bf', text: '黑羽追兵', done: (c) => c.f('bf_met') || c.f('qh_leave_done') },
    { id: 'q_zx', text: '前往醉仙樓（三日之期）', show: (c) => c.f('qh_leave_done'), done: (c) => c.f('zx_entered') },
    { id: 'q_qh', text: '沈青河的請託', show: (c) => c.f('accepted_qinghe_request'), done: (c) => c.f('heifeng_done') },
    { id: 'q_bfinv', text: '黑羽盟的邀請', show: (c) => c.f('joined_bf_invite'), done: (c) => c.f('heifeng_done') },
    { id: 'q_hf', text: '查探黑風嶺', show: (c) => c.f('meet_done'), done: (c) => c.f('heifeng_done') },
    { id: 'q_jade', text: '找出染血玉佩的秘密', show: (c) => c.f('qh_leave_done'), done: (c) => c.f('chapter1_done') },
    { id: 'q_ch2', ch: 2, text: (c) => (c.f('chapter2Completed') ? '第二章・洛陽舊事　完' : '第二章・洛陽舊事：查玉佩背後的十五年前'), show: (c) => c.f('chapter1_done'), done: (c) => c.f('chapter2Completed') },
    { id: 'q_ch3', ch: 3, text: (c) => (c.f('chapter3Completed') ? '第三章・沈家舊門　完' : '第三章・沈家舊門：到洛水邊找沈家舊宅'), show: (c) => c.f('chapter2Completed'), done: (c) => c.f('chapter3Completed') },
    { id: 'q_ch4', ch: 4, text: (c) => (c.f('chapter4Completed') ? '第四章・白石橋　完' : '第四章・白石橋：到洛水以北找白石橋'), show: (c) => c.f('chapter3Completed'), done: (c) => c.f('chapter4Completed') },
    { id: 'q_ch5', ch: 5, text: (c) => (c.f('chapter5Completed') ? '第五章・無名客　完' : '第五章・無名客：在洛陽城裡找到無名客'), show: (c) => c.f('chapter4Completed'), done: (c) => c.f('chapter5Completed') },
    { id: 'q_ch6', ch: 6, text: (c) => (c.f('chapter6Completed') ? '第六章・沈雲川　完（第七章・聽風渡 鎖定）' : '第六章・沈雲川：查出沈雲川的下落'), show: (c) => c.f('chapter5Completed'), done: (c) => c.f('chapter6Completed') },
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
