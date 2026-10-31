// ==================== 空荧酒馆 v3 地图视图配置 ====================
// 数据来源：https://assets.yuanshen.site/webapp.json（site 的 tiles 配置）
// 坐标体系与站点完全一致：
//   CRS.Simple + Transformation(1,0,1,0)
//   project(latlng) = Point(lat + origin[0], lng + origin[1])
//   瓦片地址 = tiles/<code>/<leafletZoom + 13>/<x>_<y>.<ext>
// size     : 金字塔整幅像素尺寸（原生层级 p=13 时）
// offset   : 瓦片网格偏移（tilesOffset）
// origin   : 坐标原点（center 参数）
// center   : 该视图默认相机中心（站点 settings.center）
// zoom     : 该视图默认缩放（站点 settings.zoom）
// country  : 所属国家（对应 data.js REGIONS 的 id；event = 往期限时活动区域，all = 全大陆）
// label    : 展示名（对齐空荧酒馆 v3 官方子区域分组命名）
window.MAP_PRESETS = [
  // ── 提瓦特世界图（code twt672，全部分区共用同一瓦片金字塔）──
  { key: 'twt',        name: '提瓦特',        label: '全大陆',                          country: 'all',       code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [0, 1742],      zoom: 'fit' },
  // 蒙德
  { key: 'mondstadt',  name: '蒙德',        label: '蒙德',                              country: 'mondstadt', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [1438, -3333],   zoom: -2.5 },
  { key: 'xueshan',    name: '龙脊雪山',    label: '龙脊雪山',                          country: 'mondstadt', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [1568, -2269],   zoom: -0.5 },
  { key: 'fengxishan', name: '风息山',      label: '风息山',                            country: 'mondstadt', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [568, -5586],    zoom: -1.2 },
  // 璃月
  { key: 'liyue',      name: '璃月',        label: '璃月',                              country: 'liyue',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-672, -822],    zoom: -2 },
  { key: 'cengyan',    name: '层岩巨渊',    label: '层岩巨渊',                          country: 'liyue',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-1750, 126],    zoom: -1 },
  { key: 'chenyugu',   name: '沉玉谷',      label: '沉玉谷',                            country: 'liyue',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-2500, -3000],  zoom: -2 },
  // 稻妻
  { key: 'inazuma1',   name: '稻妻',        label: '鸣神岛、神无冢、八酝岛',            country: 'inazuma',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [4896, 3354],    zoom: -2 },
  { key: 'inazuma2',   name: '稻妻·离岛',   label: '清籁岛、海祇岛',                    country: 'inazuma',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [4200, 4898],    zoom: -2 },
  { key: 'heguan',     name: '鹤观',        label: '鹤观',                              country: 'inazuma',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [4380, 7022],    zoom: -2 },
  // 须弥
  { key: 'sumeru',     name: '须弥·雨林',   label: '诸法丛林',                          country: 'sumeru',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-4184, 541],    zoom: -2.5 },
  { key: 'desert1',    name: '须弥·沙漠',   label: '大赤沙海',                          country: 'sumeru',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-6112, 2266],   zoom: -2 },
  { key: 'desert2',    name: '须弥·沙漠二', label: '千壑沙地',                          country: 'sumeru',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-6112, 266],    zoom: -2 },
  { key: 'desert3',    name: '须弥·沙漠三', label: '苍漠囿土',                          country: 'sumeru',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-8112, -1566],  zoom: -2 },
  // 枫丹
  { key: 'fontaine',   name: '枫丹',        label: '枫丹廷区、白露区、苍晶区',          country: 'fontaine',  code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-6400, -4700],  zoom: -2 },
  { key: 'fontaine2',  name: '枫丹·二',     label: '枫丹动能工程科学研究院区、黎翡区',  country: 'fontaine',  code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-5200, -6590],  zoom: -2 },
  { key: 'fontaine3',  name: '枫丹·三',     label: '莫尔泰区、伊黎耶林区',              country: 'fontaine',  code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-5200, -4880],  zoom: -2 },
  { key: 'fontaine4',  name: '枫丹·四',     label: '诺思托伊区',                        country: 'fontaine',  code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-4916, -2491],  zoom: -2 },
  // 纳塔
  { key: 'natlan',     name: '纳塔',        label: '万火之瓯、坚岩隘谷、踞石山、涌流地', country: 'natlan',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-10811, 1894],  zoom: -2 },
  { key: 'natlan2',    name: '纳塔·二',     label: '镜璧山、翘枝崖、奥奇卡纳塔',        country: 'natlan',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-12932, 676],   zoom: -2 },
  { key: 'natlan5',    name: '纳塔·五',     label: '安饶之野',                          country: 'natlan',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-18731, -1806], zoom: -1.5 },
  // 挪德卡莱
  { key: 'nodkrai',    name: '挪德卡莱',    label: '伦波岛、希汐岛、帕哈岛',            country: 'nodkrai',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-13163, -4316], zoom: -2 },
  { key: 'nodkrai2',   name: '挪德卡莱·二', label: '虚海望、逐浪野、烟硌山峰',          country: 'nodkrai',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-12315, -8465], zoom: -2 },
  { key: 'nodkrai3',   name: '挪德卡莱·三', label: '杜南纳深坑',                        country: 'nodkrai',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-11431, -8513], zoom: -2 },
  // 至冬
  { key: 'snezhnaya',  name: '至冬',        label: '永凝冻土、古兽冰原、焰羽谷、白桦雪葬地、霜殛寒峰', country: 'snezhnaya', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-9760, -11529], zoom: -2 },

  // ── 独立瓦片金字塔（按官方归属归入各国家子区域；活动区域归入 event）──
  // 蒙德 · 空之神殿
  { key: 'shendian',   name: '空之神殿',       label: '空之神殿',       country: 'mondstadt', code: 'kzsd2', ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -2511],  zoom: -1.5 },
  // 璃月 · 层岩巨渊地下矿区
  { key: 'kuangqu',    name: '地下矿区',       label: '地下矿区',       country: 'liyue',     code: 'cyjy',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [1800, -500],  zoom: -3 },
  // 稻妻 · 渊下宫
  { key: 'yuanxia',    name: '渊下宫',         label: '渊下宫',         country: 'inazuma',   code: 'yxg',   ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [2000, 300],   zoom: -4 },
  // 枫丹 · 旧日之海
  { key: 'ancientsea', name: '旧日之海',       label: '旧日之海',       country: 'fontaine',  code: 'jrzh',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [-1520, -4238], zoom: -1 },
  // 纳塔 · 远古圣山
  { key: 'shengshan',  name: '远古圣山',       label: '远古圣山',       country: 'natlan',    code: 'ygss',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -2511],  zoom: -1.5 },
  // 挪德卡莱 · 霜月
  { key: 'shuangyue',  name: '霜月',           label: '霜月',           country: 'nodkrai',   code: 'moon2', ext: 'png', size: [17408, 9216],  offset: [0, 0], origin: [3568, 6286], center: [8459, -1505], zoom: -3 },
  // 往期限时活动区域（v3 已下架，本站保留瓦片存档）
  { key: 'apple16',    name: '金苹果群岛(1.6)', label: '金苹果群岛(1.6)', country: 'event',    code: 'qd1',   ext: 'jpg', size: [8192, 8192],  offset: [0, 0], origin: [3568, 6286], center: [600, -2190],  zoom: -2 },
  { key: 'apple28',    name: '金苹果群岛(2.8)', label: '金苹果群岛(2.8)', country: 'event',    code: 'qd28',  ext: 'png', size: [8192, 8192],  offset: [0, 0], origin: [3568, 6286], center: [600, -2190],  zoom: -2 },
  { key: 'veluriyam',  name: '琉形蜃境',       label: '琉形蜃境(3.8)',  country: 'event',     code: 'lxsj',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -150],   zoom: -3 },
  { key: 'simulanka',  name: '希穆兰卡',       label: '希穆兰卡(4.8)',  country: 'event',     code: 'xmlk',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -2211],  zoom: -3 }
];

// 各瓦片金字塔的实际覆盖范围（point 像素坐标 [x0, y0, x1, y1]）
// 依据本地 tiles/ 已抓取瓦片的索引边界统计，用于收紧视野、避免出现空白边与无效瓦片请求
window.MAP_COVER_BY_CODE = {
  twt672: [-17408, -10240, 12962, 16384],
  qd1:    [0, 0, 8192, 8192],
  qd28:   [0, 0, 8192, 8192],
  lxsj:   [0, 0, 12288, 12288],
  cyjy:   [0, 0, 12288, 12288],
  yxg:    [0, 0, 12288, 12288],
  xmlk:   [0, 0, 8192, 8192],
  ygss:   [0, 0, 8192, 8192],
  jrzh:   [0, 0, 4096, 4096],
  kzsd2:  [0, 0, 6144, 6144],
  moon2:  [0, 0, 17408, 9216]
};

window.MAP_PRESETS.forEach(p => { p.cover = window.MAP_COVER_BY_CODE[p.code]; });
