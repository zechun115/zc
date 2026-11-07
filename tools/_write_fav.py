# -*- coding: utf-8 -*-
"""把 tracks_fav.jsonl 的客户端红心数(收藏数)合并进 tracks_real.json 并回写 data.js:
   - tracks_real.json 每条记录增加 neteaseFav (客户端迷你播放条显示值原文, 如 687/999+/1w+/10w+/100w+; null=未获取)
   - data.js 的 TRACK_REAL 块同步重建, 注释更新口径
口径: 2026-11-07 经 CDP 接管网易云桌面客户端 UI 实测; 播放校验 lastestRefer 的 songId 与目标 ncmId 一致才采信
粒度: <1000 精确; [1000,1万) 显示 999+; [1万,10万) 1w+; [10万,100万) 10w+; >=100万 100w+ (均为客户端原始显示, 未做估算)
"""
import os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
REAL = os.path.join(ROOT, 'tools', 'tracks_real.json')
FAVL = os.path.join(ROOT, 'tools', 'tracks_fav.jsonl')

fav = {}
for line in open(FAVL, encoding='utf-8'):
    try:
        r = json.loads(line)
    except Exception:
        continue
    fav[r['ncmId']] = r.get('neteaseFav')  # 后写覆盖先写; 失败行为 null

real = json.load(open(REAL, encoding='utf-8'))
n_fav = 0
for r in real:
    v = fav.get(r['ncmId'])
    r['neteaseFav'] = v
    if v:
        n_fav += 1
json.dump(real, open(REAL, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

realmap = {}
for r in real:
    realmap[r['ncmId']] = {
        'neteaseCmt': r.get('neteaseCmt'),
        'biliPlay': r.get('biliPlay'),
        'neteaseFav': r.get('neteaseFav'),
    }

src = open(DATA_JS, encoding='utf-8').read()
src = re.sub(r'\n/\* =+ 真实平台数据[\s\S]*?const TRACK_REAL[\s\S]*?;\n', '\n', src)

block = '\n/* ======== 真实平台数据（网易云评论数 2026-11-04 桌面客户端登录态复采；红心数 2026-11-07 客户端 UI 实测；B站相关视频播放量 2026-10 采集） ========\n'
block += ' * neteaseCmt → 网易云单曲评论总数（真实接口，精确值）\n'
block += ' * neteaseFav → 网易云单曲红心/收藏数（客户端迷你播放条 UI 显示值原文：<1000 精确；999+/1w+/10w+/100w+ 为客户端粗粒度标签，未做估算；null 表示客户端未能确认到对应曲目）\n'
block += ' * biliPlay   → B站「原神+曲名」搜索最相关视频播放量（真实接口）；null 表示未搜到，前端清空不显示\n'
block += ' */\n'
block += 'const TRACK_REAL = ' + json.dumps(realmap, ensure_ascii=False, separators=(',', ':')) + ';\n'

idx = -1
for anchor in ('/* 获取曲目完整数据（严格真实版）', '/* 曲目平台热度数据'):
    idx = src.find(anchor)
    if idx >= 0:
        break
if idx < 0:
    raise SystemExit('未找到插入锚点')
src = src[:idx] + block + '\n' + src[idx:]

open(DATA_JS, 'w', encoding='utf-8').write(src)
print('neteaseFav 已合并: %d/%d 有值' % (n_fav, len(real)))
