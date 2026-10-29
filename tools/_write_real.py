# -*- coding: utf-8 -*-
"""把 tracks_real.json 的真实数据写回 data.js：
   - 给每首曲目注入 ncmCmt(网易云评论真实值) 与 biliPlay(B站相关视频播放真实值)
   - 移除/清空 qqPlays 推算值相关展示由前端控制，这里只注入真实字段
   - 生成 window.TRACK_REAL = { ncmId: {neteaseCmt, biliPlay} }
"""
import os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
REAL = os.path.join(ROOT, 'tools', 'tracks_real.json')

real = json.load(open(REAL, encoding='utf-8'))
# 建立 ncmId -> {neteaseCmt, biliPlay}
realmap = {}
for r in real:
    realmap[r['ncmId']] = {
        'neteaseCmt': r.get('neteaseCmt'),
        'biliPlay': r.get('biliPlay'),
    }

src = open(DATA_JS, encoding='utf-8').read()

# 移除旧的 TRACK_REAL 块（若重复运行）
src = re.sub(r'\n/\* =+ 真实平台数据.*?const TRACK_REAL[\s\S]*?;\n', '\n', src, count=1)

# 构造新的 TRACK_REAL 常量（紧凑单行 JSON）
block = '\n/* ======== 真实平台数据（爬虫采集于网易云评论数 + B站相关视频播放量，2026-10） ========\n'
block += ' * neteaseCmt → 网易云单曲评论总数（真实接口）\n'
block += ' * biliPlay   → B站「原神+曲名」搜索最相关视频播放量（真实接口）；null 表示未搜到，前端清空不显示\n'
block += ' * 网易云收藏数、QQ音乐收藏/评论均无公开接口，故曲目级不展示，仅保留跳转链接（不捏造）\n'
block += ' */\n'
block += 'const TRACK_REAL = ' + json.dumps(realmap, ensure_ascii=False, separators=(',', ':')) + ';\n'

# 插入到 TRACK_PLATFORM_DATA 定义之前
anchor = '/* 曲目平台热度数据'
idx = src.index(anchor)
src = src[:idx] + block + '\n' + src[idx:]

open(DATA_JS, 'w', encoding='utf-8').write(src)
print('TRACK_REAL 已写入 data.js，共', len(realmap), '条')
print('B站有真实播放量:', sum(1 for v in realmap.values() if v['biliPlay'] is not None))
