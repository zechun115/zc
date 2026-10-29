# -*- coding: utf-8 -*-
"""把 tracks_extra.json 写入 data.js 的 TRACK_EXTRA（按曲名索引）"""
import os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
EXTRA = os.path.join(ROOT, 'tools', 'tracks_extra.json')

extra = json.load(open(EXTRA, encoding='utf-8'))
out = {}
for name, v in extra.items():
    cmt = v.get('neteaseCmt')
    play = v.get('biliPlay')
    if cmt is None and play is None:
        continue
    out[name] = {'ncmId': v.get('ncmId'), 'neteaseCmt': cmt, 'biliPlay': play}

src = open(DATA_JS, encoding='utf-8').read()
src = re.sub(r'\n/\* =+ 补充真实数据[\s\S]*?const TRACK_EXTRA[^\n]*\n', '\n', src, count=1)

block = '\n/* ======== 补充真实数据（按曲名索引：网易云评论数 + B站相关视频播放量，2026-10 爬取） ========\n'
block += ' * 用于 STORY_TRACKS / REGION_TRACKS 中未纳入专辑曲目库的曲名\n'
block += ' */\n'
block += 'const TRACK_EXTRA = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'

anchor = '/* ======== 真实平台数据'
idx = src.index(anchor)
src = src[:idx] + block.lstrip('\n') + '\n' + src[idx:]
open(DATA_JS, 'w', encoding='utf-8').write(src)
print('TRACK_EXTRA 写入', len(out), '条')
