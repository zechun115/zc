# 原神 7.1 版本更新 · Tasks

> 依赖顺序执行；每完成一项即用 TodoWrite 标记。所有改动均在 `c:\Users\haofeng\Documents\新建文件夹`。

## T1 数据层 · 地区与角色
- [x] `js/data.js:26` 注释改为“适配 7.1 版本 · 至冬全域开放”，标注数据基准 2026-10
- [x] `REGIONS`：`snezhnaya` 版本 `0.0→7.0`、颜色 `#4A90D9→#7ED2F7`
- [x] `REGIONS`：9 个地区补 `areas` 数组（至冬含古兽冰原、白桦雪葬地、永凝冻土、焰羽谷、霜殛寒峰）
- [x] `CHARACTERS`：新增 奥黛塔、阿罗夏、薇斯纳、沃雅妮莎（snezhnaya）与 旅行者·冰（other）
- [x] `CHARACTER_MUSIC`：为上述 5 人各补 2 首主题曲/战斗曲
- **验收**：浏览器加载 `data.js` 无语法错误；`CHARACTERS.length === 122`

## T2 数据层 · 剧情与地区曲
- [x] `STORY_TRACKS` 追加 6 首 7.0/7.1 曲目（无神怜爱的雪国、银昼寒光、黑雪鹄的夜梦、往冥府的安魂歌、琴弦呀琴弦、愿逐月华照君明）
- [x] `REGION_TRACKS.snezhnaya` 追加 9 首；`REGION_TRACKS.liyue` 追加 1 首
- **验收**：`REGION_TRACKS.snezhnaya.length >= 15`；`STORY_TRACKS.length === 21`

## T3 数据层 · 专辑
- [x] `ALBUMS` 末尾追加《珍珠之歌6》（version/other/92/2026-07-22/6.8，tracks:[] + notice）
- [x] 追加《悯宥慈怜之垠》（ep/snezhnaya/102/2026-09-14/7.0，7 首已核实曲名仅给直达链接，QQ 102291928 / Apple 6810715095）
- [x] 追加《愿逐月华照君明》（ep/liyue/3/2026-10-21/7.1，tracks:[] + notice，QQ 105292823）
- **验收**：`ALBUMS.length === 43`；三张卡片三平台按钮均可点击

## T4 地图 · 至冬补全
- [x] `js/map.js:57` `TILE_SOURCES` 米哈游条目替换为 `ys-map-op/map/2/eea752b746ae1f2e0c1988a574f2b7b0/{x}_{y}_N1.webp` 并加注释
- [x] `REGION_POSITIONS` 新增 `snezhnaya`（初始 x96 y10 w22 h14）
- [x] `CHAR_MAP_POS`：迁入 达达利亚/桑多涅/阿蕾奇诺；新增 5 名 7.x 角色坐标
- [x] `map.js:333` 地区详情插入 `areas` 标签行
- **验收**：至冬 tab 可飞到区域，详情面板列出 5 个子区域；搜索新角色有标记

## T5 地图页与导航
- [x] `index.html:117-126` 追加至冬 tab（`--rc:#7ED2F7`，`assets/img/regions/至冬.png`）
- [x] `index.html:150` 日期 → 2026年10月；`:209` 版本 → 原神7.1版本
- [x] `js/region.js:40` `MAIN_REGIONS` 增加 `snezhnaya`
- [x] `js/insight.js:333` 地区顺序增加 `snezhnaya`
- **验收**：地图/地区/洞察页面均出现至冬且无报错

## T6 专辑页完善
- [x] `album.html:6` meta 40→43
- [x] `album.html:76` hero 文案 43 张 + 7.1
- [x] `album.html:132-138` 增加 `data-f="snezhnaya"` 至冬 chip
- [x] `album.html:162` 采集时间 → 2026年10月
- [x] `js/album.js:276` 类型徽章支持 ep/version
- [x] `js/album.js:18` 统计新增 EP专辑 / 版本合集两卡
- [x] `js/album.js`：notice 与曲目列表并存（《悯宥慈怜之垠》显示 7 首已核实曲名 + 提示框）
- **验收**：43 张专辑全部渲染；4 类徽章正确；至冬筛选非空

## T7 剧情时间轴
- [x] `js/story.js` `VERSION_EVENTS` 增加 7.0、7.1
- [x] `TIMELINE_VERSIONS` 追加 7.0、7.1 完整对象（含 keywords/voices）
- **验收**：时间轴出现两条新版本，词云与趋势图正常

## T8 全站文案与 README
- [x] `character.html:181`、`character-detail.html:98`、`insight.html:169`、`region.html:145`、`story.html:150` 日期 → 2026年10月
- [x] 全站 `原神6.7版本` → `原神7.1版本`
- [x] `README.md`：43 张专辑 / 122 角色 / 9 地区 / 2026-10 / 7.1
- **验收**：`grep "2026年7月" *.html` 无结果

## T9 验证与回归
- [x] `python -m http.server 8080`（项目根）
- [x] 浏览器逐页检查：index / character / character-detail / story / region / insight / album
- [x] 检查 console 无 `SyntaxError` / `TypeError`
- [x] 截图存档至临时目录（不写入项目）
- [x] 修复 `js/region.js` 去重键导致基础曲目被误删（至冬 15 首曲目全部可见）
- **验收**：spec.md 第 6 节 7 条全部通过
