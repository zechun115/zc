# 原神 7.1 版本更新 · Checklist

## 数据层
- [x] `REGIONS` 共 9 个地区，每个地区均有 `areas` 数组；`snezhnaya` 版本为 `7.0`、色值 `#7ED2F7`
- [x] `CHARACTERS` 共 122 位，含奥黛塔、阿罗夏、薇斯纳、沃雅妮莎、旅行者·冰
- [x] `CHARACTER_MUSIC` 为上述 5 位新角色各提供 2 首曲目
- [x] `STORY_TRACKS` 共 21 首，含 6 首 7.0/7.1 曲目
- [x] `REGION_TRACKS.snezhnaya` 共 15 首（含古兽冰原…霜殛寒峰、往冥府的安魂歌、琴弦呀琴弦）
- [x] `ALBUMS` 共 43 张，新增珍珠之歌6、悯宥慈怜之垠、愿逐月华照君明

## 地图
- [x] `js/map.js` 瓦片源指向 `ys-map-op/map/2/eea752b746ae1f2e0c1988a574f2b7b0/{x}_{y}_N1.webp` 并注明采集方式
- [x] `REGION_POSITIONS` 包含 `snezhnaya`，地图可定位至冬
- [x] `CHAR_MAP_POS` 包含至冬角色簇与 7.x 新角色
- [x] 地区详情面板渲染 `areas` 子区域标签（至冬 5 项）

## 页面
- [x] `index.html` 含至冬 tab、日期 2026年10月、版本 7.1
- [x] `region.html` 含至冬，曲目 15 首且「往冥府的安魂歌」可见
- [x] `insight.html` KPI 显示 122 人 / 1909 首，矩阵含至冬行
- [x] `story.html` 时间轴含 7.0「无神怜爱的雪国」与 7.1「往冥府的安魂歌」
- [x] `album.html` 43 张专辑、EP专辑/版本合集统计卡、至冬筛选可用
- [x] 《悯宥慈怜之垠》同时显示 notice 提示框与 7 首已核实曲名
- [x] `character.html` 总角色 122，可检索 7.x 新角色
- [x] `character-detail.html` 正常渲染，无未定义空白

## 回归
- [x] 7 个页面 console 无 SyntaxError / TypeError
- [x] 全站无 `2026年7月` / `6.7版本` 残留
- [x] `README.md` 数据版本行已更新为 7.1 / 2026-10 / 43 专辑 / 122 角色 / 9 地区
