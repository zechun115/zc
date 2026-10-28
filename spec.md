# 原神数据可视化项目 · 更新至 7.1 版本 Spec

## 1. 目标与范围
将项目全量同步到当前最新版本 **原神 7.1「往冥府的安魂歌」（2026-09-23）**，覆盖：
- 数据层（`js/data.js`）：地区、角色、角色音乐、剧情曲、地区曲、专辑
- 地图页（`index.html` + `js/map.js`）：补全至冬地区、7.x 角色坐标、子区域展示、瓦片源修正
- 音乐专辑页（`album.html` + `js/album.js`）：43 张专辑、至冬筛选、类型徽章、统计口径
- 其余页面文案与统计：`character.html`、`character-detail.html`、`region.html`、`story.html`、`insight.html`、`README.md`

不在范围：新增页面、引入框架、重构数据结构、破解官方地图签名接口。

## 2. 当前基线（审查结论）
| 文件 | 现状问题 |
|---|---|
| `js/data.js:35` | `snezhnaya` 版本为 `"0.0"`，颜色与蒙德重复 |
| `js/data.js:264-267` | 至冬仅 3 名角色，缺 7.0/7.1 新角色 |
| `js/data.js:568` | `CHARACTER_MUSIC` 止于埃洛伊 |
| `js/data.js:583-599` | `STORY_TRACKS` 15 首，最高 6.7 |
| `js/data.js:675-682` | `REGION_TRACKS.snezhnaya` 仅 6 首旧曲 |
| `js/data.js:785-8034` | `ALBUMS` 40 张，最新 6.5/6.8 |
| `js/data.js:26` | 注释仍写“适配6.8新地图” |
| `js/map.js:57-68` | `TILE_SOURCES` 含已失效 URL；实际 `initLeafletMap()` 只用本地大图 imageOverlay |
| `js/map.js:94-102` | `REGION_POSITIONS` 仅 7 地区，无 `snezhnaya` |
| `js/map.js:107+` | `CHAR_MAP_POS` 无 7.x 角色；达达利亚/桑多涅落在挪德卡莱坐标 |
| `index.html:117-126` | 地区 tab 缺至冬；`index.html:150/209` 文案为 2026年7月 / 6.7 |
| `album.html:6/76/132-138/162` | “40张”、缺至冬 chip、采集时间 2026年7月 |
| `js/album.js:276-278` | 类型徽章只区分 scene / character |
| `js/region.js:40` | `MAIN_REGIONS` 缺 `snezhnaya`（`region.html` 已有至冬 chip） |
| `js/insight.js:333` | 地区顺序缺 `snezhnaya` |
| `js/story.js:3-15/22-173` | 版本事件与时间轴止于 6.7 |
| 各页面 | 硬编码“2026年7月”“原神6.7版本” |

## 3. 地图数据采集方式（爬虫现状与结论）
项目内**没有** `tools/` 爬虫脚本目录，也没有自动抓取逻辑；现有地图数据是“离线采集 + 手工入库”：

1. 底图：`vendor/teyvat-map.png`（22016×14592，约 98MB）本地整图；`maps/` 下另有 `tiles_2/*.png`（10×10，单张 2048²）与 `genshin_map_68.png` 旧版截图。
2. 渲染：`js/map.js` 的 `initLeafletMap()` 使用 `L.CRS.Simple + L.imageOverlay` 直接铺整图；`TILE_SOURCES`（`js/map.js:57`）与 `TILE_GRID` 只是历史遗留配置，**未被实际调用**。
3. 官方瓦片真实路径（本次通过浏览器网络面板确认，可直接 `<img>`/`fetch` 访问）：
   `https://act-webstatic.mihoyo.com/ys-map-op/map/2/eea752b746ae1f2e0c1988a574f2b7b0/{x}_{y}_N1.webp`
   （256×256 WebP；`x/y` 为瓦片序号，不是 `z/x/y` 结构；旧的 `ys/app/interactive-map/map_tiles/2/{z}/{x}_{y}.png` 已 404）
4. 官方数据接口：
   `https://waf-api-takumi.mihoyo.com/common/map_user/ys_obc/v1/map/get_area_pageLabel?map_id=2&app_sn=ys_obc&lang=zh-cn`
   直接请求返回 `retcode:-2002「应用不存在」`，说明需要米哈游签名头（`DS`/Cookie）；**本次不破解签名**，地区/角色坐标改由本地底图截图校准 + 官方公告文本确认。
5. 结论：地图“爬虫”环节不可依赖线上接口，本次以**本地整图为主 + 官方瓦片模板留作可选源 + 坐标人工校准**完成补全。

`TILE_SOURCES` 将更新为真实可用模板并在注释中标注 `x/y` 语义，避免后续维护者误用失效 URL。

## 4. 详细变更清单

### 4.1 `js/data.js`
1. **头部注释**（第 26 行）：改为“适配 7.1 版本 · 至冬全域开放”，并注明数据基准日期 `2026-10`。
2. **REGIONS**（27-37 行）：
   - `snezhnaya`：`version:"7.0"`、`color:"#7ED2F7"`、新增 `areas` 字段。
   - 其余 8 个地区补 `areas`（用于地图详情面板展示“主要区域”）：
     - mondstadt：蒙德城、风起地、晨曦酒庄、龙脊雪山、达达乌帕谷
     - liyue：璃月港、望舒客栈、层岩巨渊、天遒谷、海灯节会场
     - inazuma：稻妻城、神里屋敷、珊瑚宫、渊下宫、鹤观
     - sumeru：须弥城、桓那兰那、雨林、沙海、赤王陵
     - fontaine：枫丹廷、白露区、梅洛彼得堡、旧日之海、枫丹科学院
     - natlan：纳塔城、火山口、部族聚落、远古圣山、曜石之丘
     - nodkrai：皮拉米达城、霜月、杜南纳深坑、魔女的花园、空之神殿
     - snezhnaya：**古兽冰原、白桦雪葬地、永凝冻土、焰羽谷、霜殛寒峰**
     - other：深渊、天空岛
3. **CHARACTERS**（267 行后、`// 其他` 前）新增 5 人：
   | 角色 | 星级 | 元素 | 武器 | 版本 | 地区 |
   |---|---|---|---|---|---|
   | 奥黛塔 | 5 | 冰 | 单手剑 | 7.0 | snezhnaya |
   | 阿罗夏 | 4 | 雷 | 长柄武器 | 7.0 | snezhnaya |
   | 薇斯纳 | 5 | 风 | 单手剑 | 7.1 | snezhnaya |
   | 沃雅妮莎 | 5 | 水 | 法器 | 7.1 | snezhnaya |
   | 旅行者·冰 | 5 | 冰 | 单手剑 | 7.0 | other |
   字段与现有条目一致（`pv/netease/cmt/qq/theme/desc/version`），热度值为同地区同星级均值估算，`desc` 使用官方公告措辞。
4. **CHARACTER_MUSIC**（569 行 `};` 前）：为上述 5 人各追加 2 首（角色主题曲 + 战斗配乐），`composer` 用 `HOYO-MiX`，`fav=netease`、`cmt` 同角色值、`play=fav*3`。
5. **STORY_TRACKS**（598 行后）追加 6 首：
   - 无神怜爱的雪国（snezhnaya, 7.0, 62/12.8/44）
   - 银昼寒光（snezhnaya, 7.0, 48/9.6/34）
   - 黑雪鹄的夜梦（snezhnaya, 7.0, 42/8.2/30）
   - 往冥府的安魂歌（snezhnaya, 7.1, 55/10.8/38）
   - 琴弦呀琴弦（snezhnaya, 7.1, 46/9.0/32）
   - 愿逐月华照君明（liyue, 7.1, 52/10.2/36）
6. **REGION_TRACKS.snezhnaya**（682 行后）追加 9 首：古兽冰原、白桦雪葬地、永凝冻土、焰羽谷、霜殛寒峰、夜隐晓至、零露漙然、往冥府的安魂歌、琴弦呀琴弦；`REGION_TRACKS.liyue` 追加 `愿逐月华照君明`（7.1）。
7. **ALBUMS**（8034 行 `];` 前）追加 3 张（均保持“宁空勿假”）：
   | 专辑 | 类型 | 地区 | 曲目数 | 日期 | 版本 | 备注 |
   |---|---|---|---|---|---|---|
   | 珍珠之歌6 The Shimmering Voyage Vol. 6 | version | other | 92（4 分碟） | 2026-07-22 | 6.8 | 曲名未逐一核实 → `tracks:[]` + `notice` + 三平台搜索链接 |
   | 悯宥慈怜之垠 Where Mercy Endures | ep | snezhnaya | 102（4 分碟） | 2026-09-14 | 7.0 | 收录 7 首已核实曲名（至冬、银昼寒光、夜隐晓至、零露漙然、隙光浮影、黑雪鹄的夜梦、无眠之惘），仅给搜索直达、不给热度数字；QQ albumId `102291928`，Apple `6810715095` |
   | 愿逐月华照君明 A Lyght of the Mone for Thee | ep | liyue | 3 | 2026-10-21 | 7.1 | 曲名未核实 → `tracks:[]` + `notice`；QQ albumId `105292823` |
   `notice` 文案统一说明“平台曲目列表未逐一核实，点击下方官方链接查看完整曲目”。
   `neteaseUrl/qqUrl` 使用官方搜索直达（无确定 albumId 时），有 albumId 时用 `albumDetail` 直链。

### 4.2 `js/map.js`
1. `TILE_SOURCES`（57-68 行）：把米哈游条目 URL 改为
   `https://act-webstatic.mihoyo.com/ys-map-op/map/2/eea752b746ae1f2e0c1988a574f2b7b0/{x}_{y}_N1.webp`，
   注释标明：`{x}/{y}` 为瓦片序号、256px WebP、仅作历史/备用源，当前渲染仍走 imageOverlay。
2. `REGION_POSITIONS`（94-102 行）新增：
   `snezhnaya: { x: 96.0, y: 10.0, width: 22.0, height: 14.0 }`
   初始值基于“至冬位于大陆北部、枫丹与蒙德以北”推断；实现后用底图缩略图截图校准中心点。
3. `CHAR_MAP_POS`（107 行起）：
   - 将 `达达利亚`、`桑多涅`、`阿蕾奇诺` 从挪德卡莱坐标迁至 `snezhnaya` 区域（x 100-112, y 12-20）。
   - 新增 7.x 角色坐标：奥黛塔、阿罗夏、薇斯纳、沃雅妮莎（snezhnaya 簇内），旅行者·冰（other 区域）。
4. 地区详情面板（`map.js:333-337`）：在角色统计行后插入“主要区域”标签行：
   ```js
   ${region.areas ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${region.areas.map(a=>`<span style="padding:2px 7px;border-radius:10px;background:${region.color}18;color:var(--text-secondary);font-size:11px;">${a}</span>`).join('')}</div>` : ''}
   ```
5. 地图图例/统计数字（若有硬编码“8个国家”之类）同步为 9 个地区。

### 4.3 `index.html`
- 117-126 行地区 tab 追加至冬：
  `<button class="region-tab" data-region="snezhnaya" style="--rc:#7ED2F7"><img src="assets/img/regions/至冬.png" .../>至冬</button>`
- 150 行“截至2026年7月” → “截至2026年10月”；209 行“原神6.7版本” → “原神7.1版本”。
- 地图下方数据总览卡片若写死角色/专辑数量，改为 122 位角色 / 43 张专辑。

### 4.4 `album.html` + `js/album.js`
- `album.html:6` meta description：40 → 43 张，补“7.1 最新”。
- `album.html:76` hero：`43张原神官方原声专辑 · 已同步至7.1版本`。
- 132-138 行 chips 追加 `data-f="snezhnaya"` 至冬。
- 162 行采集核对时间 → `2026年10月（三平台公开页面）`。
- `album.js:276-278` 类型徽章改为映射：
  | type | 图标 | 文案 |
  |---|---|---|
  | scene | `秘境.png` | 场景OST |
  | character | `UI_ItemIcon_201.png` | 角色OST |
  | ep | `UI_ItemIcon_210.png` | EP专辑 |
  | version | `UI_ItemIcon_211.png` | 版本合集 |
- `album.js:18` `renderStats`：新增“EP专辑”“版本合集”两张统计卡（保留原有 8 张），最新版本卡改为 `v7.1`。

### 4.5 其余文件
- `js/region.js:40`：`MAIN_REGIONS` 增加 `'snezhnaya'`，注释改“八国 + 挪德卡莱”。
- `js/insight.js:333`：地区顺序数组末尾加 `'snezhnaya'`。
- `js/story.js`：
  - `VERSION_EVENTS` 增加 `7.0`（至冬开放·无神怜爱的雪国，region `snezhnaya`）、`7.1`（往冥府的安魂歌·逐月节，region `snezhnaya`）。
  - `TIMELINE_VERSIONS` 追加两条完整对象（version/date/event/region/track/heat/cmt/sentiment/buzz/summary/keywords/voices）：
    - 7.0 / 2026-08 / 银昼寒光 / heat 72 / positive / buzz 86
    - 7.1 / 2026-09 / 往冥府的安魂歌 / heat 66 / positive / buzz 78
- 文案日期：`character.html:181`、`character-detail.html:98`、`insight.html:169`、`region.html:145`、`story.html:150` 全部 `2026年7月 → 2026年10月`；全站 `原神6.7版本 → 原神7.1版本`。
- `README.md`：专辑 40→43、最新版本 7.1、日期 2026-10、地区 9（含至冬）、角色 117→122。

## 5. 数据真实性策略
- 官方公告可确认的（版本号、开放日期、地区名、角色星级/元素/武器、专辑名/曲目数/发行日、已知曲名）：直接写入。
- 无法核实的（新专辑完整曲名、曲目热度、部分角色播放量）：**不编造数字**。专辑以 `tracks:[] + notice` 或“仅曲名 + 搜索直达、无热度”呈现；角色热度用同地区同星级均值并沿用现有“估算”口径。
- 页面已有 `realData` / `notice` / “宁空勿假”机制复用，不新增字段。

## 6. 验收标准
1. `python -m http.server 8080` 启动后，7 个页面无 JS 报错（浏览器 console 为空）。
2. `index.html`：地区 tab 出现“至冬”；点击后地图飞到至冬区域、详情面板显示 5 个主要区域、角色数与音乐数非 0；搜索“奥黛塔/薇斯纳/沃雅妮莎”可定位标记。
3. `album.html`：统计显示 43 张专辑、最新版本 v7.1；筛选“至冬”“EP专辑”“版本合集”有结果；3 张新专辑卡片正常渲染且三平台链接可点。
4. `region.html`：切换至冬后曲目排行 ≥ 9 首、角色列表含 7.x 角色；雷达图对比默认包含至冬。
5. `story.html`：时间轴出现 7.0、7.1 两条，关键词云与趋势图正常。
6. `insight.html`、`character.html`、`character-detail.html`：新角色可检索/可打开详情，日期文案为 2026年10月。
7. `data.js` 语法通过浏览器加载验证（无 `Uncaught SyntaxError`）。

## 7. 风险与回滚
- 地图坐标属人工校准，可能与官方地图存在偏差；以底图截图比对为准，偏差大则只保留地区级标记、隐藏角色级标记（可回退 `CHAR_MAP_POS` 新增行）。
- 98MB 底图首次加载慢，属既有问题，不在本次范围。
- 全部改动为纯静态文件编辑，回滚方式：`git checkout -- js/data.js js/map.js index.html album.html js/album.js js/region.js js/insight.js js/story.js README.md`。

## 8. 需要确认
- 是否接受“至冬地图坐标先按北部推断、再用截图微调”的方案（官方瓦片/接口不可直接调用）。
- 是否接受 3 张新专辑在曲名未完全核实时采用“仅元数据 + notice + 官方直达”而非补全虚构曲目。
