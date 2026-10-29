// ==================== 提瓦特地图（Leaflet 动态瓦片 + 降级） ====================
// 渲染策略：
//   1. 首选 Leaflet + L.tileLayer 从米哈游CDN加载官方瓦片（无限缩放，高清）
//   2. 瓦片CDN不可用时降级到 L.imageOverlay 使用本地拼接大图
//   3. Leaflet 未加载 → 降级到旧版单图 CSS Transform 实现
// 坐标系：
//   瓦片模式：像素坐标 (0-8192) 映射到 CRS.Simple lat/lng
//   降级模式：百分比 (0-100) 映射到 imageOverlay 边界
(function () {
  // 归一化 Leaflet 全局：部分构建暴露 window.leaflet 而非 window.L
  if (typeof window.L === 'undefined' && typeof window.leaflet !== 'undefined') {
    window.L = window.leaflet;
  }

  const container = document.querySelector('.teyvat-map-container');
  if (!container) return;

  function updateContainerSize() {
    // 容器完全填充父元素，确保地图内容填满整个展示区域
    const parent = container.parentElement;
    if (parent) {
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.transform = 'none';
    }
    // 通知 Leaflet 重新计算尺寸
    if (typeof leafletMap !== 'undefined' && leafletMap) {
      leafletMap.invalidateSize({ animate: false });
    }
  }

  function hideMapLoading() {
    const loadingEl = document.getElementById('mapLoading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
  }

  // 官方世界地图图片（降级方案）
  const MAP_IMAGE_URL = "vendor/teyvat-map.png";
  const MAP_RATIO = 22016 / 14592; // ≈1.5088 图片宽高比
  // 地图实际内容（白线内）在图片中的边距，用于精确匹配地图边缘
  // 基于新地图图片像素分析：非黑色区域 top=2776/14592, bottom=11933/14592, left=2294/22016, right=21857/22016
  // 转换为当前坐标系（height=100, width=100*MAP_RATIO）
  const MAP_CONTENT_MARGIN = {
    top: 2776 / 14592 * 100,                          // 19.02 (y方向)
    bottom: (14592 - 11933) / 14592 * 100,            // 18.22 (y方向)
    left: 2294 / 22016 * (100 * MAP_RATIO),           // 15.72 (x方向单位)
    right: (22016 - 21857) / 22016 * (100 * MAP_RATIO)  // 1.09 (x方向单位)
  };

  // ═══════ 本地瓦片源（空荧酒馆 v3 瓦片 1:1 复刻）═══════
  // 视图配置见 js/map-presets.js
  // 瓦片地址：tiles/<code>/<z>/<x>_<y>.<ext>，其中 z = Leaflet 缩放级别 + 13
  // 原生层级 p10~p12 对应 Leaflet z = -3~-1，更高缩放由 Leaflet 放大原生瓦片
  const PRESETS = window.MAP_PRESETS || [];
  const TILE_SIZE = 256;
  const TILE_ZOOM_OFFSET = 13;
  const NATIVE_MIN = -3;
  const NATIVE_MAX = -1;

  function findPreset(key) {
    return PRESETS.find(p => p.key === key) || PRESETS[0] || null;
  }

  // 重建站点坐标系：project(latlng) = Point(lat + origin[0], lng + origin[1])
  function buildCrs(preset) {
    const o = preset.origin;
    return L.Util.extend({}, L.CRS.Simple, {
      transformation: new L.Transformation(1, 0, 1, 0),
      projection: {
        project: ll => new L.Point(ll.lat + o[0], ll.lng + o[1]),
        unproject: pt => new L.LatLng(pt.x - o[0], pt.y - o[1])
      },
      bounds: L.bounds(L.point(0, 0), L.point(preset.size[0], preset.size[1]))
    });
  }

  // 瓦片图层的有效范围
  // 优先使用爬取到的实际覆盖范围（preset.cover，point 像素坐标），收紧视野、避免空白边
  function tileLayerBounds(preset) {
    const o = preset.origin, c = preset.cover;
    if (c) {
      return L.latLngBounds([c[0] - o[0], c[1] - o[1]], [c[2] - o[0], c[3] - o[1]]);
    }
    const h = preset.offset, s = preset.size;
    return L.latLngBounds(
      [-o[0] + h[0], -o[1] + h[1]],
      [s[0] - o[0] + h[0], s[1] - o[1] + h[1]]
    );
  }

  // 本地瓦片图层：索引规则与站点 getTileUrl 完全相同（延迟定义，避免 Leaflet 未加载时报错）
  let LocalTileLayerClass = null;
  function getLocalTileLayerClass() {
    if (!LocalTileLayerClass) {
      LocalTileLayerClass = L.TileLayer.extend({
        getTileUrl(coords) {
          const p = coords.z + TILE_ZOOM_OFFSET;
          return 'tiles/' + this.options._code + '/' + p + '/' + coords.x + '_' + coords.y + '.' + this.options._ext;
        }
      });
    }
    return LocalTileLayerClass;
  }

  // 地区 id → 地图视图 key（用于右侧地区标签的飞行定位）
  const REGION_VIEW = {
    mondstadt: 'mondstadt', liyue: 'liyue', inazuma: 'inazuma1',
    sumeru: 'sumeru', fontaine: 'fontaine', natlan: 'natlan',
    nodkrai: 'nodkrai', snezhnaya: 'snezhnaya'
  };

  // 地区点击区域（百分比坐标系，适配观测枢完整地图 22016x14592）
  // bounds 高度=100，宽度=100*MAP_RATIO≈150.9，x 方向可超过 100
  // 基于地图图片像素分析精确校准：图片百分比坐标 → 百分比坐标系
  // 挪德卡莱(左上群岛)→枫丹(中上)→蒙德(右上)→璃月(右中)→须弥(中央)→纳塔(左下)→稻妻(右下)
  const REGION_POSITIONS = {
    nodkrai: { x: 36.0, y: 21.4, width: 16.7, height: 13.4 },  // nodkrai：中心(44.4,28.1) 左移
    fontaine: { x: 73.5, y: 26.0, width: 16.7, height: 10.7 },  // fontaine：中心(81.8,31.4) 左上移
    mondstadt: { x: 110.3, y: 29.5, width: 22.3, height: 14.7 },  // mondstadt：中心(121.5,36.9) 上移
    liyue: { x: 99.0, y: 45.5, width: 25.1, height: 10.7 },  // 璃月：中心(111.5,50.8) img(73.9%,50.8%)
    sumeru: { x: 65.4, y: 46.2, width: 25.1, height: 14.7 },  // 须弥：中心(78.0,53.5) img(51.7%,53.5%)
    natlan: { x: 41.8, y: 60.5, width: 16.7, height: 8.0 },  // natlan：中心(50.1,64.5) 下移
    inazuma: { x: 126.8, y: 66.0, width: 19.5, height: 12.0 },  // inazuma：中心(136.6,72.0) 下移
    // 至冬（7.0 全域开放）：位于大陆北部、蒙德与枫丹以北；坐标按底图北部空域推断，可用截图微调
    snezhnaya: { x: 96.0, y: 10.0, width: 22.0, height: 14.0 },  // snezhnaya：中心(107.0,17.0)
  };

  // 角色地图位置（百分比，适配观测枢完整地图 22016x14592）
  // 坐标已按角色出身/活动区域重新分布，确保同一城市/岛屿的角色聚集
  // 根据官方互动地图截图校准各地区中心位置
  const CHAR_MAP_POS = {
    // ═══════ 蒙德（中心约121,41，上移）═══════
    // 蒙德城（西风骑士团/教会/冒险家协会）
    "温迪": { x: 120.5, y: 32.8 }, "琴": { x: 121.5, y: 32.2 }, "安柏": { x: 121.0, y: 33.8 },
    "凯亚": { x: 122.5, y: 32.2 }, "丽莎": { x: 121.9, y: 34.1 }, "芭芭拉": { x: 121.1, y: 34.8 },
    "诺艾尔": { x: 122.9, y: 33.8 }, "砂糖": { x: 120.1, y: 35.2 }, "班尼特": { x: 123.5, y: 35.1 },
    "罗莎莉亚": { x: 120.5, y: 36.1 }, "法尔伽": { x: 122.1, y: 31.2 },
    // 晨曦酒庄
    "迪卢克": { x: 123.5, y: 39.1 }, "迪奥娜": { x: 124.5, y: 39.5 },
    // 龙脊雪山
    "阿贝多": { x: 119.0, y: 36.8 }, "优菈": { x: 118.5, y: 39.1 }, "米卡": { x: 116.9, y: 38.8 },
    // 奔狼领
    "雷泽": { x: 118.4, y: 36.6 },
    // 清泉镇/星落湖
    "可莉": { x: 125.9, y: 31.2 }, "莫娜": { x: 126.7, y: 32.5 }, "菲谢尔": { x: 125.5, y: 33.2 },
    // 蒙德郊外/6.x新角色
    "洛恩": { x: 120.0, y: 30.5 }, "布伦妮": { x: 121.0, y: 31.7 }, "尼可": { x: 127.3, y: 33.8 },
    "塔利雅": { x: 127.5, y: 37.1 }, "杜林": { x: 124.5, y: 30.0 },

    // ═══════ 璃月（中心约111,51）═══════
    // 璃月港
    "钟离": { x: 111.5, y: 51.1 }, "胡桃": { x: 109.7, y: 49.9 }, "刻晴": { x: 110.9, y: 51.9 },
    "凝光": { x: 112.5, y: 51.9 }, "香菱": { x: 110.3, y: 52.9 }, "行秋": { x: 111.9, y: 53.2 },
    "重云": { x: 113.1, y: 53.2 }, "北斗": { x: 114.1, y: 50.9 }, "辛焱": { x: 109.3, y: 54.1 },
    "烟绯": { x: 113.5, y: 54.2 }, "夜兰": { x: 114.9, y: 52.2 }, "嘉明": { x: 108.9, y: 55.5 },
    "蓝砚": { x: 110.5, y: 54.9 }, "云堇": { x: 112.9, y: 50.2 },
    // 绝云间/仙人洞府
    "甘雨": { x: 116.1, y: 48.5 }, "申鹤": { x: 117.1, y: 47.5 }, "闲云": { x: 117.9, y: 48.9 }, "兹白": { x: 116.5, y: 49.6 },
    // 无妄坡/轻策庄/不卜庐
    "白术": { x: 106.7, y: 56.8 }, "七七": { x: 116.6, y: 58.6 }, "瑶瑶": { x: 107.6, y: 57.0 },
    // 层岩巨渊
    "魈": { x: 116.3, y: 58.5 },

    // ═══════ 稻妻（中心约136,67，下移）═══════
    // 鸣神岛（稻妻城/鸣神大社）
    "雷电将军": { x: 137.2, y: 66.4 }, "神里绫人": { x: 136.0, y: 68.0 }, "神里绫华": { x: 137.0, y: 68.6 },
    "八重神子": { x: 138.6, y: 67.2 }, "宵宫": { x: 134.6, y: 69.4 }, "托马": { x: 136.0, y: 69.8 },
    "九条裟罗": { x: 139.0, y: 69.0 }, "早柚": { x: 137.8, y: 69.6 }, "绮良良": { x: 133.8, y: 67.8 },
    "千织": { x: 138.2, y: 70.6 }, "梦见月瑞希": { x: 136.4, y: 71.6 },
    // 神无冢
    "枫原万叶": { x: 132.0, y: 69.6 },
    // 八酝岛
    "荒泷一斗": { x: 136.4, y: 73.6 }, "久岐忍": { x: 137.4, y: 74.2 }, "鹿野院平藏": { x: 135.4, y: 75.0 },
    // 海祇岛
    "珊瑚宫心海": { x: 138.4, y: 76.4 }, "五郎": { x: 139.2, y: 77.2 },

    // ═══════ 须弥（中心约78,54）═══════
    // 须弥城/雨林
    "纳西妲": { x: 78.6, y: 51.2 }, "艾尔海森": { x: 76.8, y: 52.4 }, "妮露": { x: 80.4, y: 50.6 },
    "提纳里": { x: 79.6, y: 48.8 }, "柯莱": { x: 78.0, y: 49.6 }, "多莉": { x: 81.2, y: 51.8 },
    "珐露珊": { x: 82.4, y: 50.2 }, "莱依拉": { x: 79.6, y: 53.0 }, "卡维": { x: 77.2, y: 53.2 },
    "赛索斯": { x: 80.6, y: 54.2 },
    // 沙漠
    "赛诺": { x: 73.6, y: 57.2 }, "坎蒂丝": { x: 74.8, y: 58.2 }, "迪希亚": { x: 75.8, y: 59.4 },
    // 流浪者（曾在须弥活动）
    "流浪者": { x: 75.6, y: 53.8 },

    // ═══════ 枫丹（中心约86,35，左上移）═══════
    // 枫丹廷
    "芙宁娜": { x: 82.3, y: 30.4 }, "那维莱特": { x: 83.7, y: 31.0 }, "娜维娅": { x: 85.1, y: 30.0 },
    "克洛琳德": { x: 81.5, y: 31.8 }, "夏洛蒂": { x: 80.3, y: 31.1 }, "林尼": { x: 84.3, y: 29.6 },
    "琳妮特": { x: 85.5, y: 31.0 }, "菲米尼": { x: 82.9, y: 32.4 }, "爱可菲": { x: 86.3, y: 32.1 },
    "夏沃蕾": { x: 87.5, y: 31.4 }, "艾梅莉埃": { x: 85.9, y: 33.6 }, "希格雯": { x: 82.7, y: 34.0 },
    // 梅洛彼得堡
    "莱欧斯利": { x: 78.3, y: 35.8 },

    // ═══════ 纳塔（中心约50,61，下移）═══════
    // 各部族区域
    "玛薇卡": { x: 50.1, y: 64.5 }, "玛拉妮": { x: 46.7, y: 61.9 }, "基尼奇": { x: 52.7, y: 66.5 },
    "伊安珊": { x: 48.5, y: 63.5 }, "卡齐娜": { x: 50.9, y: 62.5 }, "茜特菈莉": { x: 44.9, y: 67.5 },
    "恰斯卡": { x: 54.3, y: 63.7 }, "伊法": { x: 49.3, y: 67.5 }, "瓦雷莎": { x: 51.7, y: 69.9 },
    "希诺宁": { x: 42.1, y: 64.1 }, "欧洛伦": { x: 53.5, y: 68.3 },
    // 阿蕾奇诺（愚人众执行官，5.1 登场；7.0 起归入至冬坐标系）
    "阿蕾奇诺": { x: 103.0, y: 19.5 },

    // ═══════ 挪德卡莱（中心约49,28，左移）═══════
    // 霜月之子
    "菈乌玛": { x: 45.0, y: 25.7 },
    // 执灯人
    "菲林斯": { x: 48.4, y: 29.9 }, "叶洛亚": { x: 51.6, y: 32.1 },
    // 月之少女/愚人众
    "哥伦比娅": { x: 50.0, y: 27.9 },
    // 其他据点
    "伊涅芙": { x: 46.8, y: 22.1 }, "爱诺": { x: 43.6, y: 30.1 }, "奈芙尔": { x: 49.4, y: 24.1 },
    "雅珂达": { x: 46.0, y: 34.1 }, "莉奈娅": { x: 51.0, y: 36.1 }, "丝柯克": { x: 55.0, y: 34.3 },

    // ═══════ 至冬（7.0 开放 · 7.1 续章）═══════
    "达达利亚": { x: 112.0, y: 16.5 }, "桑多涅": { x: 107.5, y: 18.0 },
    "奥黛塔": { x: 110.0, y: 20.0 }, "阿罗夏": { x: 105.5, y: 21.5 },
    "薇斯纳": { x: 114.5, y: 19.0 }, "沃雅妮莎": { x: 109.0, y: 14.5 },

    // ═══════ 其他 ═══════
    "旅行者": { x: 61.1, y: 37.0 }, "旅行者·冰": { x: 62.5, y: 38.0 }, "埃洛伊": { x: 60.1, y: 37.5 }
  };

  // 地图容器只保留地图底图本身；所有 UI 控件均位于容器外部
  container.innerHTML = '';

  const detailPanel = document.getElementById('mapDetailPanel');
  const fullscreenBtn = document.getElementById('mapFullscreenBtn');
  const heatmapToggle = document.getElementById('heatmapToggle');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const zoomReset = document.getElementById('zoomReset');
  const zoomLevel = document.getElementById('zoomLevel');
  const mapCoords = document.getElementById('mapCoordsDisplay');
  // 覆盖式浮层元素（空荧酒馆式布局）
  const mapStage = document.getElementById('mapStage');
  const mrbName = document.getElementById('mrbName');
  const mrbAreas = document.getElementById('mrbAreas');
  const regionSwitchBtn = document.getElementById('regionSwitchBtn');
  const regionSwitchPanel = document.getElementById('regionSwitchPanel');
  const layerCharsToggle = document.getElementById('layerCharsToggle');
  const mfpTree = document.getElementById('mfpTree');
  let charMarkersRefs = [];   // [{name, region, marker, pos}] —— 跨实现共享
  let activeImpl = null;       // 'leaflet' | 'legacy'
  let heatmapActive = false;   // 热力图层开关状态
  let fitBaseZoom = null;      // fitToFullMap 完成时的缩放级别（缩放百分比 100% 基准）

  // 安全访问元素配色（兼容自动化测试等隔离上下文）
  const EC = (typeof ELEMENT_COLORS !== 'undefined') ? ELEMENT_COLORS : {};

  // 本地数字格式化：统一使用中文单位（亿/万），避免 k/w 混用
  // 输入为实际数字（如 177020000），输出如 "1.77亿"、"7.8万"、"0.8万"
  function fmtCN(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    if (n >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, '') + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    if (n >= 1000) return (n / 10000).toFixed(1) + '万';
    return Math.round(n).toString();
  }

  // ----- 共享：角色详情渲染到地图外部面板 -----
  function renderCharDetail(char) {
    charMarkersRefs.forEach(m => {
      if (m.name === char.name) m.markerEl?.classList.add('selected');
      else m.markerEl?.classList.remove('selected');
    });

    const color = EC[char.element] || rColor(char.region);
    detailPanel.innerHTML = `
      <div class="map-detail-char">
        <button class="mdf-close" title="关闭">×</button>
        <div class="map-detail-header">
          <div class="map-detail-avatar" style="background:linear-gradient(135deg, ${color}44, ${color}22);color:${color};border:2px solid ${color}66;overflow:hidden;">
            ${(() => {
              const au = (typeof getLocalAvatarUrl === 'function') ? getLocalAvatarUrl(char.name) : '';
              return au
                ? `<img src="${au}" alt="${char.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';" />`
                : char.name[0];
            })()}
          </div>
          <div>
            <div class="map-detail-title">${char.name}</div>
            <div class="map-detail-meta">${rName(char.region)} · v${char.version} · ${char.rarity}星 · ${char.element}元素</div>
          </div>
        </div>
        <div class="map-detail-stats">
          <div class="map-detail-stat"><div class="v">${fmtCN(char.pv * 10000)}</div><div class="l">PV播放</div></div>
          <div class="map-detail-stat"><div class="v">${fmtCN(char.netease * 1000)}</div><div class="l">网易云收藏</div></div>
          <div class="map-detail-stat"><div class="v">${fmtCN(char.cmt * 1000)}</div><div class="l">网易云评论</div></div>
          <div class="map-detail-stat"><div class="v">${fmtCN(char.qq * 1000)}</div><div class="l">QQ音乐收藏</div></div>
        </div>
        <div class="map-detail-actions">
          <a href="character-detail.html?name=${encodeURIComponent(char.name)}" class="map-detail-btn primary">查看详情页 →</a>
          <a href="character-detail.html?name=${encodeURIComponent(char.name)}#music" class="map-detail-btn"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/> 音乐</a>
        </div>
      </div>
    `;
    detailPanel.classList.add('open');
  }

  function clearDetailPanel() {
    charMarkersRefs.forEach(m => m.markerEl?.classList.remove('selected'));
    detailPanel.classList.remove('open');
    detailPanel.innerHTML = `
      <div class="map-detail-empty">
        <div class="map-detail-icon"><img src="assets/img/icons/传送锚点.png" style="width:32px;height:32px;object-fit:contain;" onerror="this.style.display='none'"/></div>
        <div class="map-detail-title">提瓦特大陆</div>
        <div class="map-detail-desc">点击地图上的国家区域或角色标记，在此处查看详情</div>
      </div>
    `;
  }

  // 获取该地区播放量/热度最高的音乐（按 fav 为主、cmt 为辅排序）
  // 曲目真实指标（网易云评论数 + B站相关视频播放量），无真实数据返回 null
  function trackRealOf(t) {
    const r = (typeof getRealByName === 'function') ? getRealByName(t.name) : null;
    if (!r || (typeof r.neteaseCmt !== 'number' && typeof r.biliPlay !== 'number')) return null;
    return r;
  }

  function getRegionTopTrack(rid) {
    const tracks = REGION_TRACKS[rid] || [];
    if (!tracks.length) return null;
    // 仅按真实指标排序：统一使用全站热度分（对数归一 + 权重归一，避免量级差异直接相加）
    return tracks.map(t => {
      const r = trackRealOf(t);
      const score = (r && typeof getTrackHeatScore === 'function') ? getTrackHeatScore(r) : -1;
      return { t, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score)[0]?.t || null;
  }

  // ----- 共享：选中国家（渲染角色列表 + 高亮标记 + 代表音乐）-----
  function selectRegion(rid) {
    if (rid === 'all') { clearRegion(); return; }
    const region = REGIONS.find(r => r.id === rid);
    // 「全部地图」视图按钮等非地区 id 直接忽略，避免 region 为空时报错
    if (!region) return;
    const chars = CHARACTERS.filter(c => c.region === rid);
    const tracks = REGION_TRACKS[rid] || [];
    const topTrack = getRegionTopTrack(rid);
    const topTrackReal = topTrack ? trackRealOf(topTrack) : null;
    // pv 字段已是"万"为单位，直接累加；netease/cmt/qq 字段为"千"为单位
    const totalPv = chars.reduce((s, c) => s + c.pv, 0);
    const totalNetease = chars.reduce((s, c) => s + c.netease, 0);
    const totalQq = chars.reduce((s, c) => s + c.qq, 0);
    const totalFav = totalNetease + totalQq;
    // 曲目级只用真实数据：网易云评论数 / B站相关视频播放量（绝对值）
    const trackCmt = tracks.reduce((s, t) => { const r = trackRealOf(t); return s + (r && r.neteaseCmt || 0); }, 0);
    const trackPlay = tracks.reduce((s, t) => { const r = trackRealOf(t); return s + (r && r.biliPlay || 0); }, 0);

    // 元素分布统计
    const elementCounts = {};
    chars.forEach(c => { elementCounts[c.element] = (elementCounts[c.element] || 0) + 1; });
    const elementList = Object.entries(elementCounts).sort((a, b) => b[1] - a[1]);
    const star5Count = chars.filter(c => c.rarity === 5).length;

    const topTrackHtml = topTrack ? `
      <div class="region-top-track" style="cursor:pointer;margin:12px 0;padding:14px;background:linear-gradient(135deg, ${region.color}22, ${region.color}08);border:1px solid ${region.color}66;border-radius:var(--radius);transition:all 0.2s;" onmouseenter="this.style.borderColor='${region.color}';this.style.transform='translateX(4px)'" onmouseleave="this.style.borderColor='${region.color}66';this.style.transform='translateX(0)'" onclick="window.location.href='album.html'">
        <div style="font-size:11px;color:${region.color};font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:6px;"><img src="assets/img/deco/UI_ItemIcon_211.png" style="width:14px;height:14px;vertical-align:-2px;" onerror="this.style.display='none'"/> 该地区播放量最高音乐</div>
        <div style="font-size:16px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${topTrack.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;display:flex;gap:12px;">
          <span>v${topTrack.version}</span>
          ${topTrackReal ? `<span><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/> 评${fmtCN(topTrackReal.neteaseCmt || 0)}</span>
          <span><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/> 播${fmtCN(topTrackReal.biliPlay || 0)}</span>` : ''}
        </div>
      </div>
    ` : '';

    // 元素分布条形图
    const elementBarHtml = elementList.map(([el, cnt]) => {
      const elColor = EC[el] || '#9B8E7B';
      const pct = (cnt / chars.length * 100).toFixed(0);
      return `
        <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
          <span style="width:16px;text-align:center;font-size:12px;color:${elColor};font-weight:600;">${el}</span>
          <div style="flex:1;height:14px;background:var(--surface-muted);border-radius:7px;overflow:hidden;position:relative;">
            <div style="width:${pct}%;height:100%;background:${elColor};opacity:0.7;border-radius:7px;"></div>
            <span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:var(--text-primary);font-weight:500;mix-blend-mode:difference;">${pct}%</span>
          </div>
          <span style="font-size:11px;color:var(--text-tertiary);width:36px;text-align:right;">${cnt}人</span>
        </div>
      `;
    }).join('');

    detailPanel.innerHTML = `
      <div class="map-detail-region" style="border-color:${region.color}">
      <button class="mdf-close" title="关闭">×</button>
      <div class="rip-title"><div class="rip-dot" style="background:${region.color}"></div>${region.name} <span style="font-size:12px;color:var(--text-tertiary);font-weight:400;">· v${region.version}</span></div>
      <div style="font-size:13px;color:var(--text-secondary);">${chars.length} 位角色（${star5Count}位5星）· ${tracks.length} 首地区音乐</div>
      ${region.areas ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${region.areas.map(a => `<span style="padding:2px 7px;border-radius:10px;background:${region.color}18;color:var(--text-secondary);font-size:11px;">${a}</span>`).join('')}</div>` : ''}
      ${topTrackHtml}
      <div class="rip-stats">
        <div class="rip-stat">角色PV总播放 <span class="v">${fmtCN(totalPv * 10000)}</span></div>
        <div class="rip-stat">角色音乐收藏 <span class="v">${fmtCN(totalFav * 1000)}</span></div>
        <div class="rip-stat">曲目网易云评论 <span class="v">${trackCmt > 0 ? fmtCN(trackCmt) : '—'}</span></div>
        <div class="rip-stat">曲目B站播放 <span class="v">${trackPlay > 0 ? fmtCN(trackPlay) : '—'}</span></div>
        <div class="rip-stat">热门角色 <span class="v">${chars.sort((a, b) => b.pv - a.pv)[0]?.name || '-'}</span></div>
      </div>
      ${elementList.length > 1 ? `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <div style="font-size:12px;font-weight:500;color:var(--text-secondary);margin-bottom:4px;">元素分布</div>
        ${elementBarHtml}
      </div>` : ''}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <div style="font-size:12px;font-weight:500;color:var(--text-secondary);margin-bottom:6px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px;" onerror="this.style.display='none'"/> 地区音乐 TOP3（按综合热度分）</div>
        ${tracks.map(t => ({ t, r: trackRealOf(t) }))
          .filter(x => x.r)
          .sort((a, b) => {
            const ha = (typeof getTrackHeatScore === 'function') ? getTrackHeatScore(a.r) : 0;
            const hb = (typeof getTrackHeatScore === 'function') ? getTrackHeatScore(b.r) : 0;
            return hb - ha;
          })
          .slice(0, 3).map(({ t, r }) => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;">
            <span style="color:var(--text-tertiary);font-size:10px;">v${t.version}</span>
            <span style="flex:1;color:var(--text-primary);">${t.name}</span>
            <span style="color:var(--text-tertiary);font-size:11px;">网易云评${fmtCN(r.neteaseCmt || 0)} · B站播${fmtCN(r.biliPlay || 0)}</span>
          </div>
        `).join('') || '<div style="font-size:11px;color:var(--text-quaternary);">暂无真实平台数据</div>'}
      </div>
      <div class="region-char-list">
        <div class="rcl-title">全部角色（点击查看详情）→</div>
        <div style="max-height:220px;overflow-y:auto;">
          ${chars.sort((a, b) => b.pv - a.pv).map(c => {
            const color = EC[c.element] || rColor(c.region);
            const au = (typeof getLocalAvatarUrl === 'function') ? getLocalAvatarUrl(c.name) : '';
            const elIcon = (typeof ELEMENT_CDN_MAP !== 'undefined' && ELEMENT_CDN_MAP[c.element]) ? `<img src="assets/img/elements/${ELEMENT_CDN_MAP[c.element]}" style="width:12px;height:12px;vertical-align:-1px;" onerror="this.style.display='none'"/>` : '';
            return `
            <div class="rcl-item" onclick="window.location.href='character-detail.html?name=${encodeURIComponent(c.name)}'" style="display:flex;align-items:center;gap:10px;padding:6px 0;cursor:pointer;" onmouseenter="this.style.background='${color}11'" onmouseleave="this.style.background='transparent'">
              ${au
                ? `<img src="${au}" alt="${c.name}" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:2px solid ${color}66;object-fit:cover;background:var(--surface);" onerror="this.style.display='none';var n=this.nextElementSibling;if(n){n.style.display='flex';}" /><div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:2px solid ${color}66;display:none;align-items:center;justify-content:center;color:${color};font-size:12px;font-weight:700;background:linear-gradient(135deg, ${color}33, ${color}11);">${c.name[0]}</div>`
                : `<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:2px solid ${color}66;display:flex;align-items:center;justify-content:center;color:${color};font-size:12px;font-weight:700;background:linear-gradient(135deg, ${color}33, ${color}11);">${c.name[0]}</div>`}
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:500;color:var(--text-primary);">${c.name} ${c.rarity === 5 ? '★' : ''}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">${elIcon}${c.element} · ${c.weapon} · v${c.version}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:13px;font-weight:600;color:${color};">${c.pv.toLocaleString()}万</div>
                <div style="font-size:10px;color:var(--text-tertiary);">网易云 ${fmtCN(c.netease * 1000)}</div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;">
        <a href="region.html?r=${rid}" style="flex:1;text-align:center;padding:8px;background:${region.color};color:#fff;border-radius:8px;font-size:13px;font-weight:500;">查看地区详情 →</a>
      </div>
      </div>
    `;

    charMarkersRefs.forEach(m => {
      if (!m.markerEl) return;
      if (m.region === rid) { m.markerEl.style.opacity = '1'; }
      else { m.markerEl.style.opacity = '0.15'; }
    });
    applyMarkerVisibility();
    // 更新顶部区域横幅与地区标签选中态，展开详情浮层
    updateBanner(region);
    syncRegionTabs(rid);
    detailPanel.classList.add('open');
    // 地区范围框已移除，地图上不再绘制地区高亮
    // 地图飞行到选中地区
    flyToRegion(rid);
  }

  // 地图飞行到指定地区：切到对应地图视图的默认相机
  function flyToRegion(rid) {
    if (activeImpl !== 'leaflet') return;
    const key = REGION_VIEW[rid];
    const target = key ? findPreset(key) : null;
    if (!target) return;
    if (!leafletMap || !currentPreset || target.code !== currentPreset.code) {
      switchMapView(target.key);
      return;
    }
    currentPreset = target;
    leafletMap.flyTo(target.center, target.zoom, { duration: 0.6 });
  }

  // 恢复默认视图：铺满当前地图的完整瓦片范围
  function fitToFullMap() {
    if (activeImpl !== 'leaflet' || !leafletMap || !currentPreset) return;
    leafletMap.fitBounds(tileLayerBounds(currentPreset), { animate: false, padding: [0, 0] });
    // 记录适配视图的缩放级别，作为缩放百分比显示的 100% 基准
    fitBaseZoom = leafletMap.getZoom();
    if (zoomLevel) zoomLevel.textContent = '100%';
  }

  // 兼容旧引用
  const fitToMondstadt = fitToFullMap;

  function clearRegion() {
    detailPanel.classList.remove('open');
    detailPanel.innerHTML = `
      <div class="map-detail-empty">
        <div class="map-detail-icon"><img src="assets/img/icons/传送锚点.png" style="width:32px;height:32px;object-fit:contain;" onerror="this.style.display='none'"/></div>
        <div class="map-detail-title">提瓦特大陆</div>
        <div class="map-detail-desc">点击地图上的国家区域或角色标记，在此处查看详情</div>
        <div class="rip-stats" style="margin-top:14px;text-align:left;">
          <div class="rip-stat">角色总数 <span class="v">${CHARACTERS.length}</span></div>
          <div class="rip-stat">地区数 <span class="v">${REGIONS.length}</span></div>
          <div class="rip-stat">剧情音乐 <span class="v">${STORY_TRACKS.length}</span></div>
          <div class="rip-stat">地区音乐 <span class="v">${Object.values(REGION_TRACKS).flat().length}</span></div>
        </div>
      </div>
    `;
    charMarkersRefs.forEach(m => {
      if (!m.markerEl) return;
      m.markerEl.style.opacity = '1';
    });
    applyMarkerVisibility();
    // 恢复顶部横幅为全大陆，地区标签回到「全大陆」
    updateBanner(null);
    syncRegionTabs('all');
    // 恢复全图默认视图
    if (activeImpl === 'leaflet' && leafletMap) fitToFullMap();
  }

  // ----- 全屏（共享）：对整个舞台全屏，保留浮层 UI -----
  const fullscreenTarget = mapStage || container;
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        fullscreenTarget.requestFullscreen?.().catch(err => console.log('Fullscreen error:', err));
      } else {
        document.exitFullscreen();
      }
    });
  }
  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement === fullscreenTarget;
    if (fullscreenBtn) {
      // 仅更新文字，保留按钮内游戏图标
      const label = isFullscreen ? '退出' : '全屏';
      const img = fullscreenBtn.querySelector('img');
      fullscreenBtn.innerHTML = '';
      if (img) fullscreenBtn.appendChild(img);
      fullscreenBtn.appendChild(document.createTextNode(label));
    }
    fullscreenTarget.classList.toggle('fullscreen', isFullscreen);
    if (activeImpl === 'leaflet' && window._leafletMap) {
      setTimeout(() => window._leafletMap.invalidateSize(), 200);
    }
  });

  // ============================================================
  //  实现 A：Leaflet + imageOverlay（首选）
  // ============================================================
  let leafletRegions = [];   // 保留变量名供热力图层等旧逻辑兼容（当前不再绘制地区框）
  let leafletMap = null;
  let currentPreset = null;  // 当前地图视图（js/map-presets.js 中的一项）
  let tileLayer = null;      // 当前本地瓦片图层

  // ----- 计算各地区音乐热度（用于热力图层）-----
  function getRegionMusicHeat() {
    const heats = {};
    REGIONS.forEach(r => {
      const chars = CHARACTERS.filter(c => c.region === r.id);
      const tracks = REGION_TRACKS[r.id] || [];
      const storyT = STORY_TRACKS.filter(t => t.region === r.id);
      // 综合热度 = 角色网易云收藏（千）+ 地区曲目真实评论数（÷1000 折算千）+ 剧情曲目真实评论数（千）
      const charFav = chars.reduce((s, c) => s + c.netease, 0);
      const trackFav = tracks.reduce((s, t) => {
        const r = (typeof getRealByName === 'function') ? getRealByName(t.name) : null;
        return s + ((r && typeof r.neteaseCmt === 'number') ? r.neteaseCmt / 1000 : 0);
      }, 0);
      const storyFav = storyT.reduce((s, t) => s + (t.netease || 0), 0);
      heats[r.id] = charFav + trackFav + storyFav;
    });
    const maxHeat = Math.max(...Object.values(heats), 1);
    // 归一化到 0-1
    Object.keys(heats).forEach(k => heats[k] = heats[k] / maxHeat);
    return heats;
  }

  function applyHeatmap() {
    const heats = getRegionMusicHeat();
    if (activeImpl === 'leaflet') {
      leafletRegions.forEach(r => {
        const rid = r.options._rid;
        const intensity = heats[rid] || 0;
        // 热度越高，填充越浓
        const fillOp = 0.15 + intensity * 0.55;
        r.setStyle({
          weight: 2,
          color: rColor(rid),
          fillColor: rColor(rid),
          fillOpacity: fillOp,
          opacity: 1
        });
      });
    } else if (activeImpl === 'legacy') {
      document.querySelectorAll('.map-region-hitbox').forEach(el => {
        const rid = el.dataset.region;
        const intensity = heats[rid] || 0;
        const fillOp = Math.round((0.08 + intensity * 0.5) * 255).toString(16).padStart(2, '0');
        el.style.background = rColor(rid) + fillOp;
        el.style.borderColor = rColor(rid) + 'AA';
      });
    }
  }

  function removeHeatmap() {
    if (activeImpl === 'leaflet') {
      resetLeafletRegions();
    } else if (activeImpl === 'legacy') {
      document.querySelectorAll('.map-region-hitbox').forEach(el => {
        const rid = el.dataset.region;
        el.style.background = rColor(rid) + '08';
        el.style.borderColor = rColor(rid) + '66';
      });
    }
  }

  // 热度图层依赖地区范围框着色，地区框已移除，故隐藏此开关避免出现无效控件
  if (heatmapToggle) heatmapToggle.hidden = true;

  function highlightLeafletRegion(rid) {
    leafletRegions.forEach(r => {
      const style = (r.options._rid === rid)
        ? { weight: 3, color: rColor(rid), fillColor: rColor(rid), fillOpacity: 0.25, opacity: 1 }
        : { weight: 2, color: rColor(r.options._rid) + '66', fillColor: rColor(r.options._rid), fillOpacity: 0.05, opacity: 1 };
      r.setStyle(style);
    });
  }
  function resetLeafletRegions() {
    leafletRegions.forEach(r => {
      const c = rColor(r.options._rid);
      r.setStyle({ weight: 2, color: c + '66', fillColor: c, fillOpacity: 0.05, opacity: 1 });
    });
  }

  function initLeafletMap(presetKey) {
    activeImpl = 'leaflet';
    currentPreset = findPreset(presetKey || 'twt');

    updateContainerSize();

    const preset = currentPreset;

    leafletMap = L.map(container, {
      crs: buildCrs(preset),
      minZoom: -5,
      maxZoom: 1,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      // ── 拖动交互优化 ──
      inertia: true,                  // 惯性拖动：松手后地图继续滑动
      inertiaDeceleration: 3400,      // 减速度（默认3000，稍大更快停下）
      inertiaMaxSpeed: 2500,          // 最大惯性速度
      inertiaThreshold: 18,           // 触发惯性的最小拖动距离
      // ── 缩放交互优化 ──
      scrollWheelZoom: true,          // 滚轮缩放
      scrollWheelZoomOptions: {
        animate: true,                // 滚轮缩放带动画
        duration: 0.25                // 缩放动画时长
      },
      wheelDebounceTime: 40,          // 滚轮防抖（毫秒），更流畅
      smoothWheelZooming: true,       // 平滑滚轮缩放（Leaflet 1.9+）
      wheelPxPerZoomLevel: 80,        // 每级缩放所需滚动像素（默认60，稍大更细腻）
      // ── 其他交互 ──
      doubleClickZoom: true,          // 双击放大
      touchZoom: true,                // 触摸缩放
      boxZoom: true,                  // 框选缩放
      keyboard: true,                 // 键盘导航
      zoomAnimation: true,            // 缩放动画
      zoomAnimationThreshold: 4,      // 跨级缩放动画阈值
      fadeAnimation: true,            // 瓦片淡入动画
      markerZoomAnimation: true,      // 标记随缩放动画
      // maxBounds 在 fitToFullMap 中动态设置，避免初始化时的偏移问题
    });
    window._leafletMap = leafletMap;
    window.teyvatMap = leafletMap;

    // 本地瓦片图层：索引规则与站点一致，实现 1:1 复刻
    tileLayer = new (getLocalTileLayerClass())('', {
      _code: preset.code,
      _ext: preset.ext,
      tileSize: TILE_SIZE,
      minZoom: -6,
      maxZoom: 10,
      minNativeZoom: NATIVE_MIN,
      maxNativeZoom: NATIVE_MAX,
      bounds: tileLayerBounds(preset),
      noWrap: true,
      keepBuffer: 2
    }).addTo(leafletMap);
    window._tileLayer = tileLayer;

    // 初始相机：世界总图自适应铺满，各分区按站点记录的默认中心与缩放
    if (preset.zoom === 'fit') fitToFullMap();
    else leafletMap.setView(preset.center, preset.zoom, { animate: false });

    // 地区范围框与地区文字标注已按需求移除，地图仅保留 1:1 的站点瓦片底图
    // 地区切换仍可通过右上角「更换地区」面板与「全部地图」视图列表完成

    // 角色标记已按需求移除：右侧面板通过展开国家查看角色列表
    // Object.entries(CHAR_MAP_POS).forEach(([charName, pos]) => { ... });

    leafletMap.on('click', () => { clearDetailPanel(); clearRegion(); });
    leafletMap.on('zoom move', () => {
      const zoom = leafletMap.getZoom();
      const zoomPercent = Math.round(Math.pow(2, zoom - (fitBaseZoom || 0)) * 100);
      if (zoomLevel) zoomLevel.textContent = zoomPercent + '%';

      charMarkersRefs.forEach(m => {
        if (m.markerEl) {
          if (zoom >= 1) {
            m.markerEl.style.opacity = '1';
            m.markerEl.style.transform = 'translate(-50%, -50%)';
          } else if (zoom >= 0) {
            m.markerEl.style.opacity = '0.7';
            m.markerEl.style.transform = 'translate(-50%, -50%) scale(0.8)';
          } else {
            m.markerEl.style.opacity = '0.4';
            m.markerEl.style.transform = 'translate(-50%, -50%) scale(0.6)';
          }
        }
      });
      
    });
    leafletMap.on('mousemove', (e) => {
      const ll = e.latlng;
      const o = preset.origin;
      // 与站点一致：像素坐标 = (lat + origin[0], lng + origin[1])
      if (mapCoords) mapCoords.textContent = `(${Math.round(ll.lat + o[0])}, ${Math.round(ll.lng + o[1])})`;
    });

    if (zoomIn) zoomIn.onclick = () => leafletMap.zoomIn(0.5, { animate: true, duration: 0.3 });
    if (zoomOut) zoomOut.onclick = () => leafletMap.zoomOut(0.5, { animate: true, duration: 0.3 });
    if (zoomReset) zoomReset.onclick = () => { fitToFullMap(); };

    setTimeout(() => {
      const zoom = leafletMap.getZoom();
      const zoomPercent = Math.round(Math.pow(2, zoom - (fitBaseZoom || 0)) * 100);
      if (zoomLevel) zoomLevel.textContent = zoomPercent + '%';
    }, 150);

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        fitToFullMap();
      }, 200);
    });

    clearRegion();
    hideMapLoading();
    // clearRegion 会回到全图适配，这里按预设相机再校正一次
    setTimeout(() => {
      if (!leafletMap) return;
      if (preset.zoom === 'fit') {
        fitToFullMap();
      } else {
        leafletMap.setView(preset.center, preset.zoom, { animate: false });
        fitBaseZoom = leafletMap.getZoom();
        if (zoomLevel) zoomLevel.textContent = '100%';
      }
    }, 200);
  }

  // 切换地图视图：同一瓦片金字塔内直接飞行，跨金字塔时重建地图
  function switchMapView(key) {
    const target = findPreset(key);
    if (!target) return;
    if (activeImpl === 'leaflet' && leafletMap && currentPreset && target.code === currentPreset.code) {
      currentPreset = target;
      leafletMap.flyTo(target.center, target.zoom, { duration: 0.6 });
      fitBaseZoom = target.zoom === 'fit' ? fitBaseZoom : target.zoom;
      return;
    }
    if (leafletMap) {
      try { leafletMap.remove(); } catch (e) {}
      leafletMap = null;
      tileLayer = null;
      leafletRegions = [];
    }
    activeImpl = null;
    initLeafletMap(target.key);
  }
  window.switchMapView = switchMapView;

  // 「全部地图」视图列表（右上角更换地区面板内）
  function renderMapViewTabs() {
    const host = document.getElementById('mapViewTabs');
    if (!host || !PRESETS.length) return;
    host.innerHTML = PRESETS.map(p =>
      `<button class="region-tab" data-view="${p.key}" style="--rc:#C9A227">${p.name}</button>`
    ).join('');
    host.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      host.querySelectorAll('.region-tab').forEach(b => b.classList.toggle('active', b === btn));
      switchMapView(btn.dataset.view);
      if (regionSwitchPanel) regionSwitchPanel.hidden = true;
    });
  }
  renderMapViewTabs();

  // ============================================================
  //  实现 B：旧版单图 CSS Transform（降级回退）
  // ============================================================
  function initLegacyMap() {
    activeImpl = 'legacy';
    // 在容器内插入旧版结构（覆盖层已存在，仅追加地图视图）
    const viewerHtml = `
      <div class="map-viewer" id="mapViewer" style="position:absolute;inset:0;">
        <div class="map-scroll-container" id="mapScrollContainer">
          <div class="map-content" id="mapContent">
            <img src="${MAP_IMAGE_URL}" class="map-base-image" draggable="false">
            <div class="map-regions-layer" id="mapRegionsLayer"></div>
            <div class="map-markers-layer" id="mapMarkersLayer"></div>
          </div>
        </div>
      </div>`;
    // 插到地图容器内，保证覆盖层浮于其上
    container.insertAdjacentHTML('beforeend', viewerHtml);

    const scrollContainer = document.getElementById('mapScrollContainer');
    const mapContent = document.getElementById('mapContent');
    const regionsLayer = document.getElementById('mapRegionsLayer');
    const markersLayer = document.getElementById('mapMarkersLayer');

    let scale = 1, translateX = 0, translateY = 0;
    let isDragging = false, startX = 0, startY = 0, startTX = 0, startTY = 0;
    const W = 1800, H = 1350;

    function updateTransform() {
      mapContent.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      if (zoomLevel) zoomLevel.textContent = Math.round(scale * 100) + '%';
    }
    function clampPosition() {
      const r = scrollContainer.getBoundingClientRect();
      const cw = W * scale, ch = H * scale;
      translateX = Math.max(Math.min(translateX, r.width - cw), Math.min(r.width - cw, 0));
      translateY = Math.max(Math.min(translateY, r.height - ch), Math.min(r.height - ch, 0));
      if (cw < r.width) translateX = (r.width - cw) / 2;
      if (ch < r.height) translateY = (r.height - ch) / 2;
      updateTransform();
    }
    function zoom(factor, cx, cy) {
      const old = scale;
      scale = Math.max(0.25, Math.min(3, scale * factor));
      if (cx !== undefined) {
        const r = scrollContainer.getBoundingClientRect();
        const rx = cx - r.left, ry = cy - r.top;
        translateX = rx - (rx - translateX) * (scale / old);
        translateY = ry - (ry - translateY) * (scale / old);
      }
      clampPosition();
    }

    // 地区范围框与文字标注已按需求移除（降级实现同样不再绘制）

    // 角色标记已按需求移除：右侧面板通过展开国家查看角色列表
    // Object.entries(CHAR_MAP_POS).forEach(([charName, pos]) => { ... });

    scrollContainer.addEventListener('click', (e) => {
      if (e.target === scrollContainer || e.target === mapContent) { clearDetailPanel(); clearRegion(); }
    });
    scrollContainer.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        startTX = translateX; startTY = translateY;
        scrollContainer.style.cursor = 'grabbing';
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      translateX = startTX + (e.clientX - startX);
      translateY = startTY + (e.clientY - startY);
      updateTransform();
    });
    window.addEventListener('mouseup', () => { isDragging = false; scrollContainer.style.cursor = 'grab'; });
    scrollContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 0.9;
      zoom(f, e.clientX, e.clientY);
    }, { passive: false });
    scrollContainer.addEventListener('mousemove', (e) => {
      const r = scrollContainer.getBoundingClientRect();
      const x = ((e.clientX - r.left - translateX) / scale / W * 100).toFixed(1);
      const y = ((e.clientY - r.top - translateY) / scale / H * 100).toFixed(1);
      if (mapCoords) mapCoords.textContent = `(${x}%, ${y}%)`;
    });

    if (zoomIn) zoomIn.onclick = () => zoom(1.2);
    if (zoomOut) zoomOut.onclick = () => zoom(0.8);
    if (zoomReset) zoomReset.onclick = () => { scale = 1; translateX = 0; translateY = 0; clampPosition(); };

    clampPosition();
    clearRegion();
    window.addEventListener('resize', () => { clampPosition(); clearDetailPanel(); });
  }

  // ============================================================
  //  覆盖式浮层 UI 逻辑（空荧酒馆式布局）
  // ============================================================
  // 标记显隐状态：按地区 / 按角色两级隐藏集合
  const hiddenRegionSet = new Set();
  const hiddenCharSet = new Set();

  function isMarkerHidden(m) {
    return hiddenRegionSet.has(m.region) || hiddenCharSet.has(m.name);
  }
  // Leaflet 需操作标记外层 wrapper，旧版直接操作标记元素
  function setMarkerVisible(m, visible) {
    const el = (activeImpl === 'leaflet' && m.marker) ? (m.marker.getElement() || m.markerEl) : m.markerEl;
    if (el) el.style.display = visible ? '' : 'none';
  }
  function applyMarkerVisibility() {
    charMarkersRefs.forEach(m => setMarkerVisible(m, !isMarkerHidden(m)));
  }

  // 顶部横幅：显示当前区域名 + 子区域胶囊
  function updateBanner(region) {
    if (!mrbName || !mrbAreas) return;
    if (region) {
      mrbName.innerHTML = `<span class="mrb-dot" style="background:${region.color};box-shadow:0 0 8px ${region.color}"></span>${region.name}<span class="mrb-ver">v${region.version}</span>`;
      mrbAreas.innerHTML = (region.areas || []).map(a => `<span class="mrb-area">${a}</span>`).join('');
    } else {
      mrbName.innerHTML = `<img src="assets/img/icons/传送锚点.png" alt="" onerror="this.style.display='none'"/>提瓦特大陆`;
      mrbAreas.innerHTML = '';
    }
  }

  // 同步「更换地区」面板中的标签选中态（点击地图区域时也能联动）
  function syncRegionTabs(rid) {
    document.querySelectorAll('.region-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.region === rid);
    });
  }

  // 飞行定位到角色标记
  function flyToChar(name) {
    const pos = CHAR_MAP_POS[name];
    if (!pos) return;
    if (activeImpl === 'leaflet' && leafletMap) {
      leafletMap.flyTo([100 - pos.y, pos.x], Math.max(leafletMap.getZoom(), 1.2), { duration: 0.6 });
    }
  }

  // 右侧面板：按地区分组，点击国家展开该国角色列表（accordion）
  function renderFilterTree() {
    if (!mfpTree) return;
    mfpTree.innerHTML = REGIONS.map(r => {
      const chars = CHARACTERS.filter(c => c.region === r.id);
      if (!chars.length) return '';
      return `<div class="mft-group collapsed" data-region="${r.id}">
        <div class="mft-group-head">
          <span class="mft-caret">▸</span>
          <span class="mft-name" data-fly="${r.id}" style="color:${r.color}" title="点击展开 ${r.name} 角色并飞行定位">${r.name}</span>
          <span class="mft-count">${chars.length}</span>
        </div>
        <div class="mft-items" hidden>${chars.map(c => `
          <div class="mft-item" data-char="${c.name}" title="查看 ${c.name} 详情">
            <span class="mft-item-name">${c.name}</span>${c.rarity === 5 ? '<span class="mft-star">★</span>' : ''}
          </div>`).join('')}
        </div>
      </div>`;
    }).join('');
  }
  renderFilterTree();

  // 右侧面板事件：点击地区头 → 展开角色 + 地图飞行；点击角色 → 弹出角色详情浮层
  if (mfpTree) {
    mfpTree.addEventListener('click', (e) => {
      // 点击地区头部任意位置（箭头/国名/人数）均触发展开与飞行
      const headEl = e.target.closest('.mft-group-head');
      if (headEl) {
        const flyEl = headEl.querySelector('[data-fly]');
        if (!flyEl) return;
        const rid = flyEl.dataset.fly;
        const group = headEl.parentElement;
        if (group) {
          const collapsed = group.classList.toggle('collapsed');
          const caret = group.querySelector('.mft-caret');
          if (caret) caret.textContent = collapsed ? '▸' : '▾';
          const items = group.querySelector('.mft-items');
          if (items) items.hidden = collapsed;
        }
        // 飞行到该地区并更新顶部横幅与地区标签，不弹出详情浮层覆盖
        const region = REGIONS.find(r => r.id === rid);
        if (region) {
          updateBanner(region);
          syncRegionTabs(rid);
        }
        flyToRegion(rid);
        return;
      }
      const itemEl = e.target.closest('.mft-item');
      if (itemEl) {
        const name = itemEl.dataset.char;
        const char = CHARACTERS.find(c => c.name === name);
        if (char) renderCharDetail(char);
      }
    });
  }

  // 右上角「更换地区」面板开合：点击外部或选中地区后自动收起
  if (regionSwitchBtn && regionSwitchPanel) {
    regionSwitchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      regionSwitchPanel.hidden = !regionSwitchPanel.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!regionSwitchPanel.hidden && !e.target.closest('.map-ctl-topright')) {
        regionSwitchPanel.hidden = true;
      }
    });
    regionSwitchPanel.addEventListener('click', (e) => {
      if (e.target.closest('.region-tab')) {
        setTimeout(() => { regionSwitchPanel.hidden = true; }, 60);
      }
    });
  }

  // 「角色标记」总开关已随地图标点一同移除，仅保留热度图层开关

  // 详情浮层关闭按钮（委托，渲染内容会被反复覆盖）
  if (detailPanel) {
    detailPanel.addEventListener('click', (e) => {
      if (e.target.closest('.mdf-close')) { clearDetailPanel(); clearRegion(); }
    });
  }

  // 动态计算舞台高度：视口减去导航与页头横幅，保证浮层控件完整落在首屏内
  function fitStageHeight() {
    if (!mapStage) return;
    const nav = document.querySelector('nav');
    const hero = document.querySelector('.page-hero');
    let occupied = 0;
    if (nav) occupied += nav.getBoundingClientRect().height;
    if (hero) occupied += hero.getBoundingClientRect().height;
    mapStage.style.height = Math.max(420, window.innerHeight - occupied) + 'px';
    if (activeImpl === 'leaflet' && leafletMap) leafletMap.invalidateSize({ animate: false });
  }
  window.addEventListener('resize', fitStageHeight);
  fitStageHeight();

  // 暴露给页面其他脚本（如地区标签、详情页返回等）
  window.selectRegion = selectRegion;

  // ============================================================
  //  启动：Leaflet 可用则用 Leaflet，否则降级
  // ============================================================
  function doInitMap() {
    if (typeof L !== 'undefined') {
      try {
        initLeafletMap();
      } catch (err) {
        console.warn('[map] Leaflet 初始化异常，降级到旧版:', err);
        charMarkersRefs = [];
        leafletRegions = [];
        try { leafletMap && leafletMap.remove(); } catch (e) {}
        initLegacyMap();
      }
    } else {
      console.warn('[map] Leaflet 未加载，使用旧版单图实现');
      initLegacyMap();
    }
  }

  // 如果容器在视口内直接初始化，否则懒加载
  const mapRect = container.getBoundingClientRect();
  if (mapRect.top < window.innerHeight && mapRect.bottom > 0) {
    doInitMap();
  } else if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          doInitMap();
          lazyObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '150px 0px' });
    lazyObserver.observe(container);
  } else {
    doInitMap(); // 降级
  }
})();
