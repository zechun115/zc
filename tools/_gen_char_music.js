/* 生成 js/char-music.js：官方角色视频 + 角色主题 OST 对应表
 * 数据来源：
 *  A) tools/official_videos*.json —— B站「原神」官方账号视频（标题/BV/播放）
 *  B) HOYO-MiX《闪耀的群星 The Stellar Moments》Vol.1-6 官方曲目表（"played in" 即对应 PV）
 *  C) js/data.js 的 ALBUMS —— 曲目在网易云的官方链接与实测指标
 */
const fs = require('fs');
const vm = require('vm');
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), ctx);
const G = e => vm.runInContext(e, ctx);
const CHARACTERS = G('CHARACTERS'), ALBUMS = G('ALBUMS'), TRACK_REAL = G('TRACK_REAL');
const charNames = new Set(CHARACTERS.map(c => c.name));

// ---- 表：[英文曲名, 角色中文名, 类型 demo|teaser|trailer|outfit|other] ----
const T = (en, cn, kind) => ({ en, cn, kind });
const VO = [
  // Vol.1
  T("Bard's Adventure", '温迪', 'demo'), T("Let's Go, Crimson Knight!", '可莉', 'demo'),
  T('Where the Sunlight Flees', '可莉', 'teaser'), T('Flaming Fry', '香菱', 'demo'),
  T('Ouvertüre der ewigen Nacht', '菲谢尔', 'demo'), T('Sieh an, mein Sommernachtgarten!', '菲谢尔', 'teaser'),
  T('Preserver of Fortune', '七七', 'demo'), T('Surge of Prophecies', '莫娜', 'demo'),
  T('Letter From Ajax', '达达利亚', 'demo'), T('From Snezhnaya With Boldness', '达达利亚', 'teaser'),
  T('Exclusive Specialty', '迪奥娜', 'demo'), T("Rockin' With Fire", '辛焱', 'demo'),
  T('Nimble as Lightning', '刻晴', 'demo'), T('Contemplation in Snow', '阿贝多', 'demo'),
  T('Genius of Takwin', '阿贝多', 'teaser'), T("Qilin's Prance", '甘雨', 'demo'),
  T('Rex Incognito', '钟离', 'demo'),
  // Vol.2
  T('Path of Yaksha', '魈', 'demo'), T('Broker Betwixt Life and Death', '胡桃', 'demo'),
  T('Any Last Words?', '胡桃', 'teaser'), T('Shadow of Nemesis', '罗莎莉亚', 'demo'),
  T('Marching of Xiezhi', '烟绯', 'demo'), T('The Frozen Emblem', '优菈', 'demo'),
  T('Dance of Aphros', '优菈', 'teaser'), T('Iridescent Summer Day', '芭芭拉', 'other'),
  T("Drifter's Destiny", '枫原万叶', 'demo'), T('Flow of Autumn Wind', '枫原万叶', 'teaser'),
  T('Shirasagi Princess', '神里绫华', 'demo'), T('Muji-Muji Chaos!', '早柚', 'demo'),
  T('Eternity in a Moment', '宵宫', 'demo'), T('Blossoms of Summer Night', '宵宫', 'teaser'),
  T('Will of Thunder', '九条裟罗', 'demo'), T('Good Hunting on a New Horizon', '埃洛伊', 'demo'),
  T("Tactician's Grit", '珊瑚宫心海', 'demo'), T('A Glorious Awakening', '珊瑚宫心海', 'teaser'),
  T('Devotion of the Keeper', '托马', 'demo'), T('Awake From a Nightmare', '雷电将军', 'demo'),
  T('Termination of Desires', '雷电将军', 'teaser'),
  // Vol.3
  T('Time to Shine', '荒泷一斗', 'demo'), T("The Spotlight's on Me!", '荒泷一斗', 'teaser'),
  T('Astute and Fearless Leader', '五郎', 'demo'), T('As Charming as Ever', '神里绫华', 'outfit'),
  T('Days Free of Anguish', '申鹤', 'teaser'), T('The Crane Cries', '申鹤', 'demo'),
  T('Chapter of a New Era', '云堇', 'demo'), T('As Miko Pleases', '八重神子', 'teaser'),
  T('Nothing but Trickery', '八重神子', 'demo'), T('Wishes Unspoken', '神里绫人', 'teaser'),
  T('Serene and Fathomless', '神里绫人', 'demo'), T('There Is No Escape', '夜兰', 'teaser'),
  T('Graceful Dexterity', '夜兰', 'demo'), T('Adroit Deputy', '久岐忍', 'demo'),
  T('Storm Chaser', '鹿野院平藏', 'demo'), T('Evening Luxury', '迪卢克', 'outfit'),
  T('Winding Through Avidya', '提纳里', 'demo'), T('Caprice of the Leaves', '柯莱', 'demo'),
  T('Thanks for Your Patronage!', '多莉', 'demo'), T('Chant of Nine Bows', '赛诺', 'teaser'),
  T('Order of Silence', '赛诺', 'demo'), T('Nephrite of Deshret', '坎蒂丝', 'demo'),
  T('Lotus of Haftkarsvar', '妮露', 'demo'), T('Surreal Noctivaga', '莱依拉', 'demo'),
  T('Dreamy Felicitation', '纳西妲', 'teaser'), T('Surasthana Fantasia', '纳西妲', 'demo'),
  // Vol.4
  T('Novatio Novena', '流浪者', 'demo'), T('Ashes of Anupadhisesa', '流浪者', 'teaser'),
  T('Whirling of Vairambhaka', '珐露珊', 'demo'), T('Serene Contemplation', '流浪者', 'outfit'),
  T('Immaculate Ardency', '瑶瑶', 'demo'), T('Language of Eternity', '艾尔海森', 'teaser'),
  T('Cogitation of Epochs', '艾尔海森', 'demo'), T("By the Dawn's First Radiance", '迪希雅', 'teaser'),
  T('Fervent Flare', '迪希雅', 'demo'), T('Sunfrost Breeze', '米卡', 'demo'),
  T('Empyrean Stairway', '卡维', 'demo'), T('Whisper of Verdure', '白术', 'teaser'),
  T('In the Wake of Rain', '白术', 'demo'), T("Cat's Cosy Course", '绮良良', 'demo'),
  T('Resplendent Couture', '林尼', 'outfit'), T('Illusory Truth', '林尼', 'teaser'),
  T('Lustrous Trick', '林尼', 'demo'), T('Chasing the Wind', '琳妮特', 'demo'),
  T('Frigid Reverie', '菲米尼', 'demo'), T('Eleusis Dicis Gratia', '那维莱特', 'teaser'),
  T('Parousia Diluvi', '那维莱特', 'demo'), T('Sonnet of Profundity', '莱欧斯利', 'teaser'),
  T('Nippy Bout', '莱欧斯利', 'demo'), T('Veritas Numquam Perit', '夏洛蒂', 'demo'),
  T('Chantons a plusieurs', '芙宁娜', 'teaser'), T('Se mettre sur son trente-et-un !', '芙宁娜', 'demo'),
  // Vol.5
  T('Largo alla donzella', '娜维娅', 'demo'), T('Via col vento rosato', '娜维娅', 'teaser'),
  T('Voici la grenadiere !', '夏沃蕾', 'demo'), T('Drifting Clouds, Wafting Snow', '闲云', 'outfit'),
  T('Propitious Ardor', '嘉明', 'demo'), T('Retaining Clouds Over a Clear Pool', '闲云', 'teaser'),
  T('Borrowing Winds of Harmony', '闲云', 'demo'), T('Manche de Momotsuzuri', '千织', 'teaser'),
  T('Le cramoisi coulant comme Cin', '千织', 'demo'), T('Revised Requiem', '阿蕾奇诺', 'teaser'),
  T('Offertorium of Fortuitum', '阿蕾奇诺', 'demo'), T("Menmaatre's Parade", '赛索斯', 'demo'),
  T('Possente legge e formidabil nume', '克洛琳德', 'teaser'), T('Non si levava ancor', '克洛琳德', 'demo'),
  T('Romari Time!', '希格雯', 'demo'), T('Floating Breaths of the Breeze', '娜维娅', 'outfit'),
  T('Le Souffle du Parfum', '艾梅莉埃', 'teaser'), T('Notes Aeriennes', '艾梅莉埃', 'demo'),
  T("Ho'olauna aloha!", '玛拉妮', 'teaser'), T('Hot Spring Affection', '玛拉妮', 'demo'),
  T("Pirouette of Pika's Pike", '卡齐娜', 'demo'), T('Maverick Hunter', '基尼奇', 'teaser'),
  T('Note of Effective Settlements', '基尼奇', 'demo'), T('The Antiquity of Names', '希诺宁', 'teaser'),
  T('Lights on Me', '希诺宁', 'demo'), T('This Side of Promise', '恰斯卡', 'teaser'),
  T("Viajadora's Verse", '恰斯卡', 'demo'), T('Rain of Seven Curtains', '欧洛伦', 'demo'),
  T('Plum Blossom Spring', '蓝砚', 'outfit'), T('Scorching Haze', '玛薇卡', 'teaser'),
  T('Infinite Cosmodynamics', '茜特菈莉', 'teaser'), T('Interstellar Drift', '茜特菈莉', 'demo'),
  // Vol.6
  T('Chiming Jade', '蓝砚', 'trailer'), T('In Your Vision, or in None', '梦见月瑞希', 'teaser'),
  T('Tales From the Ninety-Eight-Nights', '梦见月瑞希', 'trailer'), T('Fitness Lesson', '伊安珊', 'trailer'),
  T('The Feast of Valor', '瓦雷莎', 'teaser'), T('Valiant Duel', '瓦雷莎', 'trailer'),
  T('Healing Breeze', '伊法', 'trailer'), T('La cerise sur le gateau', '爱可菲', 'teaser'),
  T('La complexe symphonie en cuisine', '爱可菲', 'trailer'), T('The Wind-Woven Poem Upon the Waters', '塔利雅', 'trailer'),
  T('Where the Current Flows into Eternity', '丝柯克', 'teaser'), T('A Star to Every Wandering Bark', '丝柯克', 'trailer'),
  T('Ceaseless Banquet', '蓝砚', 'outfit'), T('The Way to Elysium', '奈芙尔', 'other'),
  T("Goodbye, or Another Tomorrow of Chue'q Chik", '伊涅芙', 'teaser'),
  T('War With Pepper and Fish', '伊涅芙', 'trailer'), T('Ingenious Trip', '爱诺', 'trailer'),
  T('Del Nepatekejusio Menulio', '菈乌玛', 'teaser'), T('Lumipyhaemetsaen Polkka', '菈乌玛', 'trailer'),
  T('Anekdota en Nyktí', '菲林斯', 'teaser'), T('Entombed in Pale Fire', '菲林斯', 'trailer'),
  T('Sewing Sacred Secrets', '奈芙尔', 'teaser'), T('Machination of Mehenet', '奈芙尔', 'trailer'),
  T('For Your Cash Only', '雅珂达', 'trailer'), T('Unwritten Stories', '杜林', 'teaser'),
  T('Summa Perfectionis', '杜林', 'trailer'), T('Soft as Willow Down', '杜林', 'outfit'),
  T('We Shall Sing All Night', '杜林', 'other'), T('Catching the Glow', '哥伦比娅', 'teaser'),
  T('Song to the Mirrored Moon', '哥伦比娅', 'trailer')
];

// ---- 官方视频 ----
const videos = new Map();
['tools/official_videos.json', 'tools/official_videos_all.json'].forEach(f => {
  JSON.parse(fs.readFileSync(f, 'utf8')).forEach(v => {
    const o = videos.get(v.bvid);
    if (!o || (v.play || 0) > (o.play || 0)) videos.set(v.bvid, v);
  });
});
function parseTitle(t) {
  let m;
  if ((m = t.match(/角色演示-\s*「([^：:]+)[：:](.+?)」/))) return { char: m[1].trim(), pv: m[2].trim(), type: '角色演示' };
  if ((m = t.match(/角色预告-\s*「([^：:]+)[：:](.+?)」/))) return { char: m[1].trim(), pv: m[2].trim(), type: '角色预告' };
  if ((m = t.match(/《原神》(.+?)角色PV[—-]+\s*「(.+?)」/))) return { char: m[1].trim(), pv: m[2].trim(), type: '角色PV' };
  return null;
}
const vByChar = new Map();
[...videos.values()].forEach(v => {
  const p = parseTitle(v.title);
  if (!p) return;
  if (!vByChar.has(p.char)) vByChar.set(p.char, []);
  vByChar.get(p.char).push({ ...p, bvid: v.bvid, play: v.play, title: v.title });
});

// ---- 官方投稿补充核实（tools/official_videos_patch.json）----
// 站内搜索/空间接口未收录的早期官方投稿，逐条经 bilibili view API 核实
// owner.mid = 401742377（原神官方）后人工录入；play 为核实当日实测值。
// 香菱《烈火急烹》无对应条目：官方从未发布香菱角色演示（"Pyro Chapter" 仅发布于
// YouTube 宣发渠道，B站官方号无投稿，B站「勺起百味」「万民百味」均为同人作品），
// 故该曲目 pvMatched 保持 false，不补录、不推测。
let videoPatch = [];
try { videoPatch = JSON.parse(fs.readFileSync('tools/official_videos_patch.json', 'utf8')); } catch (e) {}
videoPatch.forEach(p => {
  if (!videos.has(p.bvid)) videos.set(p.bvid, { bvid: p.bvid, play: p.play, title: p.title });
  if (!vByChar.has(p.char)) vByChar.set(p.char, []);
  if (!vByChar.get(p.char).some(x => x.bvid === p.bvid)) {
    vByChar.get(p.char).push({ char: p.char, type: p.type, pv: p.pv, bvid: p.bvid, play: p.play, title: p.title });
  }
});

// ---- 曲目索引：英文名 → 曲目 ----
const allTracks = [];
ALBUMS.forEach(a => a.tracks.forEach(t => allTracks.push({ ...t, album: a.name, albumType: a.type, albumVersion: a.version })));
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
const trackIndex = allTracks.map(t => ({ t, key: norm(t.name) }));

// Fandom 术语与中文官方命名的对应：
//   Character Demo = 角色演示 / Character Teaser = 角色PV / Character Trailer = 角色预告
const TYPE_CN = { demo: '角色演示', teaser: '角色PV', trailer: '角色预告', outfit: '服装预告', other: '其他' };
const out = { CHAR_THEME_MUSIC: {}, CHAR_OFFICIAL_VIDEOS: {} };
const miss = { char: [], track: [], video: [] };

VO.forEach(row => {
  // 服装/地区印象等预告不归属单一角色，直接跳过，避免推断
  if (row.kind === 'outfit' || row.kind === 'other') return;
  if (!charNames.has(row.cn)) { miss.char.push(row.cn); return; }
  const key = norm(row.en);
  const hit = trackIndex.find(x => x.key.includes(key));
  if (!hit) { miss.track.push(`${row.en} (${row.cn})`); return; }
  const t = hit.t;
  const r = TRACK_REAL[t.ncmId] || {};
  const vids = vByChar.get(row.cn) || [];
  const want = TYPE_CN[row.kind];
  // 只接受同类型视频；5.0 起官方把「角色演示」改称「角色预告」，
  // 仅当该角色没有「角色演示」条目时才允许这一条等价回退，其余一律留空。
  let v = vids.find(x => x.type === want) || null;
  if (!v && want === '角色演示' && !vids.some(x => x.type === '角色演示')) {
    v = vids.find(x => x.type === '角色预告' && /角色预告/.test(x.title)) || null;
  }
  if (!v) miss.video.push(`${row.cn}/${want}`);

  if (!out.CHAR_THEME_MUSIC[row.cn]) out.CHAR_THEME_MUSIC[row.cn] = [];
  out.CHAR_THEME_MUSIC[row.cn].push({
    track: t.name,
    en: row.en,
    album: t.album,
    albumVersion: t.albumVersion,
    ncmId: t.ncmId,
    neteaseUrl: t.neteaseUrl || null,
    biliSearchUrl: t.bilibiliUrl || null,
    cmt: typeof r.neteaseCmt === 'number' ? r.neteaseCmt : null,
    fav: typeof r.neteaseFav === 'string' ? r.neteaseFav : null,
    play: typeof r.biliPlay === 'number' ? r.biliPlay : null,
    kind: row.kind,
    kindCN: TYPE_CN[row.kind],
    pvMatched: !!v,
    pvName: v ? v.pv : null,
    pvType: v ? v.type : null,
    bvid: v ? v.bvid : null,
    pvPlay: v ? v.play : null
  });
});

// 角色 → 官方视频全列表
const charVideos = {};
vByChar.forEach((list, name) => {
  if (!charNames.has(name)) return;
  charVideos[name] = list
    .sort((a, b) => (b.play || 0) - (a.play || 0))
    .map(v => ({ type: v.type, pv: v.pv, bvid: v.bvid, play: v.play, title: v.title }));
});
out.CHAR_OFFICIAL_VIDEOS = charVideos;

const allEntries = Object.values(out.CHAR_THEME_MUSIC).flat();
console.log('角色音乐条目:', allEntries.length, '覆盖角色:', Object.keys(out.CHAR_THEME_MUSIC).length);
console.log('其中 PV 精确对上:', allEntries.filter(e => e.pvMatched).length, '仅曲目无 PV 号:', allEntries.filter(e => !e.pvMatched).length);
console.log('官方视频覆盖角色:', Object.keys(charVideos).length, '视频条数:', Object.values(charVideos).reduce((s, a) => s + a.length, 0));
console.log('缺角色:', [...new Set(miss.char)].join('、') || '无');
console.log('缺曲目:', miss.track.join(' / ') || '无');
console.log('缺同类型视频（只展示曲目）:', miss.video.join('、') || '无');

const banner = `/* ════════════════════════════════════════════════════════════════
 * 官方角色视频（PV）与角色主题 OST 对应表
 * 由 tools/_gen_char_music.js 生成，请勿手改。
 *
 * 数据来源（全部可外部核实）：
 *  ① CHAR_OFFICIAL_VIDEOS：B站「原神」官方账号（uid 401742377）视频，
 *     字段 type/pv/bvid/play 均来自官方投稿页；bvid 可直接在 bilibili 打开。
 *  ② CHAR_THEME_MUSIC：HOYO-MiX《闪耀的群星 The Stellar Moments》Vol.1–6
 *     官方曲目表（曲目 → 对应角色演示/预告/角色PV），曲目链接指向网易云官方专辑。
 *  ③ 角色级播放量 CHARACTERS.pv 与该角色官方视频中某一条的播放量一一对应
 *     （已逐条核对，误差 < 1%）。
 *
 * 注意：曲名不等于 PV 名（如钟离演示「听书人」的曲目是《尘世闲游 Rex Incognito》），
 * 因此本表同时保留 pvName（官方 PV 标题）与 track（曲目名），二者不可混用。
 * ════════════════════════════════════════════════════════════════ */
`;
fs.writeFileSync('js/char-music.js', banner + 'const CHAR_OFFICIAL_VIDEOS = ' + JSON.stringify(out.CHAR_OFFICIAL_VIDEOS, null, 0) + ';\n\nconst CHAR_THEME_MUSIC = ' + JSON.stringify(out.CHAR_THEME_MUSIC, null, 0) + ';\n');
console.log('已写出 js/char-music.js');
