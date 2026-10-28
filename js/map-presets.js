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
window.MAP_PRESETS = [
  // ── 提瓦特世界图（code twt672，全部分区共用同一瓦片金字塔）──
  { key: 'twt',        name: '提瓦特',      code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [0, 1742],      zoom: 'fit' },
  { key: 'mondstadt',  name: '蒙德',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [1438, -3333],   zoom: -2.5 },
  { key: 'xueshan',    name: '龙脊雪山',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [1568, -2269],   zoom: -0.5 },
  { key: 'fengxishan', name: '风息山',      code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [568, -5586],    zoom: -1.2 },
  { key: 'liyue',      name: '璃月',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-672, -822],    zoom: -2 },
  { key: 'cengyan',    name: '层岩巨渊',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-1750, 126],    zoom: -1 },
  { key: 'chenyugu',   name: '沉玉谷',      code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-2500, -3000],  zoom: -2 },
  { key: 'inazuma1',   name: '稻妻',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [4896, 3354],    zoom: -2 },
  { key: 'inazuma2',   name: '稻妻·离岛',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [4200, 4898],    zoom: -2 },
  { key: 'heguan',     name: '鹤观',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [4380, 7022],    zoom: -2 },
  { key: 'sumeru',     name: '须弥·雨林',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-4184, 541],    zoom: -2.5 },
  { key: 'desert1',    name: '须弥·沙漠',   code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-6112, 2266],   zoom: -2 },
  { key: 'desert2',    name: '须弥·沙漠二', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-6112, 266],    zoom: -2 },
  { key: 'desert3',    name: '须弥·沙漠三', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-8112, -1566],  zoom: -2 },
  { key: 'fontaine',   name: '枫丹',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-6400, -4700],  zoom: -2 },
  { key: 'fontaine2',  name: '枫丹·二',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-5200, -6590],  zoom: -2 },
  { key: 'fontaine3',  name: '枫丹·三',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-5200, -4880],  zoom: -2 },
  { key: 'fontaine4',  name: '枫丹·四',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-4916, -2491],  zoom: -2 },
  { key: 'natlan',     name: '纳塔',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-10811, 1894],  zoom: -2 },
  { key: 'natlan2',    name: '纳塔·二',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-12932, 676],   zoom: -2 },
  { key: 'natlan5',    name: '纳塔·五',     code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-18731, -1806], zoom: -1.5 },
  { key: 'nodkrai',    name: '挪德卡莱',    code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-13163, -4316], zoom: -2 },
  { key: 'nodkrai2',   name: '挪德卡莱·二', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-12315, -8465], zoom: -2 },
  { key: 'nodkrai3',   name: '挪德卡莱·三', code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-11431, -8513], zoom: -2 },
  { key: 'snezhnaya',  name: '至冬',        code: 'twt672', ext: 'png', size: [30370, 26624], offset: [-17408, -10240], origin: [3568, 6969], center: [-9760, -11529], zoom: -2 },

  // ── 独立瓦片金字塔 ──
  { key: 'apple16',    name: '金苹果群岛(1.6)', code: 'qd1',   ext: 'jpg', size: [8192, 8192],  offset: [0, 0], origin: [3568, 6286], center: [600, -2190],  zoom: -2 },
  { key: 'apple28',    name: '金苹果群岛(2.8)', code: 'qd28',  ext: 'png', size: [8192, 8192],  offset: [0, 0], origin: [3568, 6286], center: [600, -2190],  zoom: -2 },
  { key: 'veluriyam',  name: '琉形蜃境',       code: 'lxsj',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -150],   zoom: -3 },
  { key: 'simulanka',  name: '希穆兰卡',       code: 'xmlk',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -2211],  zoom: -3 },
  { key: 'shendian',   name: '空之神殿',       code: 'kzsd2', ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -2511],  zoom: -1.5 },
  { key: 'kuangqu',    name: '地下矿区',       code: 'cyjy',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [1800, -500],  zoom: -3 },
  { key: 'yuanxia',    name: '渊下宫',         code: 'yxg',   ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [2000, 300],   zoom: -4 },
  { key: 'ancientsea', name: '旧日之海',       code: 'jrzh',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [-1520, -4238], zoom: -1 },
  { key: 'shengshan',  name: '远古圣山',       code: 'ygss',  ext: 'png', size: [12288, 12288], offset: [0, 0], origin: [3568, 6286], center: [500, -2511],  zoom: -1.5 },
  { key: 'shuangyue',  name: '霜月',           code: 'moon2', ext: 'png', size: [17408, 9216],  offset: [0, 0], origin: [3568, 6286], center: [8459, -1505], zoom: -3 }
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
