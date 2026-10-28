/* ==================== 角色头像 / 立绘大图 映射表 ====================
   由 tools/crawl_assets.py 从 enka.network 爬取到本地后生成。
   - AVATAR_MAP: 角色中文名 → enka 英文 ID（本地头像文件名）
   - SPLASH_MAP: 角色中文名 → enka 英文 ID（本地立绘大图文件名）
   缺失映射的角色走前端「首字母占位」兜底（沿用项目既有约定）。
   © 米哈游版权所有 · 仅供个人学习与非商业用途 · 素材来源: enka.network
   ==================================================================== */

var AVATAR_BASE = 'assets/img/avatar/';
var SPLASH_BASE = 'assets/img/splash/';
var ELEMENTS_BASE = 'assets/img/elements/';

/* 官方直下的专属头像映射（从米哈游互动地图 CDN 抓取，assets/img/avatars/）
 * 这些角色在 enka.network 暂未收录 / 仍未实装，所以走官方 PNG 专属映射。
 * 映射 key：角色中文名 → 相对路径（相对于项目根）
 */
var MHY_AVATAR_OVERRIDE = {
  "哥伦比娅": "assets/img/avatars/哥伦比娅.png",
  "桑多涅":   "assets/img/avatars/桑多涅.png",
  "茜特菈莉": "assets/img/avatars/茜特菈莉.png",
  "玛薇卡":   "assets/img/avatars/玛薇卡.png",
  "尼可":     "assets/img/avatars/尼可.png",
  "洛恩":     "assets/img/avatars/洛恩.png"
};

/**
 * 取本地角色头像 URL（优先官方直下专属，回退 enka 目录）
 */
function getLocalAvatarUrl(charName) {
  if (MHY_AVATAR_OVERRIDE && MHY_AVATAR_OVERRIDE[charName]) return MHY_AVATAR_OVERRIDE[charName];
  var id = AVATAR_MAP[charName];
  return id ? AVATAR_BASE + id + '.png' : '';
}

var AVATAR_MAP = {
  "七七":"Qiqi","丝柯克":"SkirkNew","丽莎":"Lisa","久岐忍":"Shinobu",
  "九条裟罗":"Sara","云堇":"Yunjin","五郎":"Gorou","伊安珊":"Iansan",
  "伊法":"Ifa","伊涅芙":"Ineffa","优菈":"Eula","克洛琳德":"Clorinde",
  "八重神子":"Yae","兹白":"Zibai","凝光":"Ningguang","凯亚":"Kaeya",
  "刻晴":"Keqing","北斗":"Beidou","千织":"Chiori","卡维":"Kaveh",
  "卡齐娜":"Kachina","可莉":"Klee","叶洛亚":"Illuga","哥伦比娅":"Columbina",
  "嘉明":"Gaming","坎蒂丝":"Candace","埃洛伊":"Aloy","基尼奇":"Kinich",
  "塔利雅":"mon_5854_5229","夏沃蕾":"Chevreuse","夏洛蒂":"Charlotte","多莉":"Dori",
  "夜兰":"Yelan","奈芙尔":"Nefer","妮露":"Nilou","娜维娅":"Navia",
  "安柏":"Ambor","宵宫":"Yoimiya","尼可":"Nicole","布伦妮":"Prune",
  "希格雯":"Sigewinne","希诺宁":"Xilonen","恰斯卡":"Chasca","托马":"Tohma",
  "提纳里":"Tighnari","旅行者":"PlayerGirl","早柚":"Sayu","杜林":"Durin",
  "林尼":"Liney","枫原万叶":"Kazuha","柯莱":"Collei","桑多涅":"Marionette",
  "梦见月瑞希":"Mizuki","欧洛伦":"Olorun","法尔伽":"Varka","洛恩":"Lohen",
  "流浪者":"Wanderer","温迪":"Venti","烟绯":"Feiyan","爱可菲":"Escoffier",
  "爱诺":"Aino","玛拉妮":"Mualani","玛薇卡":"Mavuika","珊瑚宫心海":"Kokomi",
  "珐露珊":"Faruzan","班尼特":"Bennett","琳妮特":"Linette","琴":"Qin",
  "瑶瑶":"Yaoyao","瓦雷莎":"Varesa","甘雨":"Ganyu","申鹤":"Shenhe",
  "白术":"Baizhuer","砂糖":"Sucrose","神里绫人":"Ayato","神里绫华":"Ayaka",
  "米卡":"Mika","纳西妲":"Nahida","绮良良":"Momoka","罗莎莉亚":"Rosaria",
  "胡桃":"Hutao","艾尔海森":"Alhatham","艾梅莉埃":"Emilie","芙宁娜":"Furina",
  "芭芭拉":"Barbara","茜特菈莉":"Citlali","荒泷一斗":"Itto","莉奈娅":"Linnea",
  "莫娜":"Mona","莱依拉":"Layla","莱欧斯利":"Wriothesley","菈乌玛":"Lauma",
  "菲林斯":"Flins","菲米尼":"Freminet","菲谢尔":"Fischl","蓝砚":"Lanyan",
  "行秋":"Xingqiu","诺艾尔":"Noel","赛索斯":"Sethos","赛诺":"Cyno",
  "辛焱":"Xinyan","达达利亚":"Tartaglia","迪卢克":"Diluc","迪奥娜":"Diona",
  "迪希亚":"Dehya","那维莱特":"Neuvillette","重云":"Chongyun","钟离":"Zhongli",
  "闲云":"Liuyun","阿蕾奇诺":"Arlecchino","阿贝多":"Albedo","雅珂达":"Jahoda",
  "雷泽":"Razor","雷电将军":"Shougun","香菱":"Xiangling","魈":"Xiao",
  "鹿野院平藏":"Heizo"
};

var SPLASH_MAP = {
  "七七":"Qiqi","丝柯克":"SkirkNew","丽莎":"Lisa","久岐忍":"Shinobu",
  "九条裟罗":"Sara","云堇":"Yunjin","五郎":"Gorou","伊安珊":"Iansan",
  "伊法":"Ifa","伊涅芙":"Ineffa","优菈":"Eula","克洛琳德":"Clorinde",
  "八重神子":"Yae","兹白":"Zibai","凝光":"Ningguang","凯亚":"Kaeya",
  "刻晴":"Keqing","北斗":"Beidou","千织":"Chiori","卡维":"Kaveh",
  "卡齐娜":"Kachina","可莉":"Klee","叶洛亚":"Illuga","哥伦比娅":"Columbina",
  "嘉明":"Gaming","坎蒂丝":"Candace","埃洛伊":"Aloy","基尼奇":"Kinich",
  "塔利雅":"mon_5854_5229","夏沃蕾":"Chevreuse","夏洛蒂":"Charlotte","多莉":"Dori",
  "夜兰":"Yelan","奈芙尔":"Nefer","妮露":"Nilou","娜维娅":"Navia",
  "安柏":"Ambor","宵宫":"Yoimiya","尼可":"Nicole","布伦妮":"Prune",
  "希格雯":"Sigewinne","希诺宁":"Xilonen","恰斯卡":"Chasca","托马":"Tohma",
  "提纳里":"Tighnari","旅行者":"PlayerGirl","早柚":"Sayu","杜林":"Durin",
  "林尼":"Liney","枫原万叶":"Kazuha","柯莱":"Collei","桑多涅":"Marionette",
  "梦见月瑞希":"Mizuki","欧洛伦":"Olorun","法尔伽":"Varka","洛恩":"Lohen",
  "流浪者":"Wanderer","温迪":"Venti","烟绯":"Feiyan","爱可菲":"Escoffier",
  "爱诺":"Aino","玛拉妮":"Mualani","玛薇卡":"Mavuika","珊瑚宫心海":"Kokomi",
  "珐露珊":"Faruzan","班尼特":"Bennett","琳妮特":"Linette","琴":"Qin",
  "瑶瑶":"Yaoyao","瓦雷莎":"Varesa","甘雨":"Ganyu","申鹤":"Shenhe",
  "白术":"Baizhuer","砂糖":"Sucrose","神里绫人":"Ayato","神里绫华":"Ayaka",
  "米卡":"Mika","纳西妲":"Nahida","绮良良":"Momoka","罗莎莉亚":"Rosaria",
  "胡桃":"Hutao","艾尔海森":"Alhatham","艾梅莉埃":"Emilie","芙宁娜":"Furina",
  "芭芭拉":"Barbara","茜特菈莉":"Citlali","荒泷一斗":"Itto","莉奈娅":"Linnea",
  "莫娜":"Mona","莱依拉":"Layla","莱欧斯利":"Wriothesley","菈乌玛":"Lauma",
  "菲林斯":"Flins","菲米尼":"Freminet","菲谢尔":"Fischl","蓝砚":"Lanyan",
  "行秋":"Xingqiu","诺艾尔":"Noel","赛索斯":"Sethos","赛诺":"Cyno",
  "辛焱":"Xinyan","达达利亚":"Tartaglia","迪卢克":"Diluc","迪奥娜":"Diona",
  "迪希亚":"Dehya","那维莱特":"Neuvillette","重云":"Chongyun","钟离":"Zhongli",
  "闲云":"Liuyun","阿蕾奇诺":"Arlecchino","阿贝多":"Albedo","雅珂达":"Jahoda",
  "雷泽":"Razor","雷电将军":"Shougun","香菱":"Xiangling","魈":"Xiao",
  "鹿野院平藏":"Heizo"
};

/**
 * 取本地立绘大图 URL；无映射返回 ''
 */
function getLocalSplashUrl(charName) {
  var id = SPLASH_MAP[charName];
  return id ? SPLASH_BASE + id + '.png' : '';
}

/**
 * 生成角色头像 HTML（真实头像 + 首字母兜底）
 * @param {string} name 角色中文名
 * @param {string} color 元素色（用于兜底占位）
 * @param {string} extraClass 额外 class（如 'char-card-avatar-img'）
 * @param {number} size 头像尺寸（占位用）
 * @return {string} HTML
 */
function avatarHtml(name, color, extraClass, size) {
  color = color || '#C9A227';
  size = size || 80;
  var url = getLocalAvatarUrl(name);
  var cls = extraClass ? (' ' + extraClass) : '';
  var bgGradient = 'linear-gradient(135deg,' + color + '33,' + color + '11)';
  var imgPart = url
    ? '<img src="' + url + '" alt="' + name + '" class="real-avatar' + cls + '" style="width:' + size + 'px;height:' + size + 'px;" onerror="this.style.display=\'none\';var n=this.nextElementSibling;if(n){n.style.display=\'flex\';}" />'
    : '';
  var placeholderDisplay = url ? 'display:none;' : '';
  var placeholderPart =
    '<div class="avatar-placeholder' + cls + '" style="color:' + color + ';background:' + bgGradient + ';border-color:' + color + '44;' + placeholderDisplay + 'width:' + size + 'px;height:' + size + 'px;">' +
      '<span class="avatar-initials">' + name[0] + '</span>' +
    '</div>';
  return imgPart + placeholderPart;
}
