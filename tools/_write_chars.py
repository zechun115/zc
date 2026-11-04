# -*- coding: utf-8 -*-
"""把 tools/characters_real.json 中的 B站官方角色演示真实指标写回 data.js
   pv       播放量（万次，保留 1 位小数）
   fav      收藏数（千次，保留 1 位小数）
   danmaku  弹幕数（千条，保留 1 位小数）
   无官方角色演示的角色三项一律置为 null，不填充任何估算值
"""
import io, os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
SRC = os.path.join(ROOT, 'tools', 'characters_real.json')

real = {r['name']: r for r in json.load(io.open(SRC, encoding='utf-8'))}
# 合并官方空间补齐结果（只覆盖确为实测值的记录）
for fn in ('characters_official.json', 'characters_official2.json'):
    p = os.path.join(ROOT, 'tools', fn)
    if not os.path.exists(p):
        continue
    for r in json.load(io.open(p, encoding='utf-8')):
        if r.get('play') is not None and real.get(r['name'], {}).get('play') is None:
            real[r['name']] = r


def wan(v, base):
    if v is None:
        return 'null'
    return str(round(v / base, 1))


txt = io.open(DATA_JS, encoding='utf-8').read()
a = txt.index('const CHARACTERS = [')
b = txt.index('];', a) + 2
block = txt[a:b]

pat = re.compile(r'{ name:\s*"([^"]+)",\s*region:\s*"([^"]+)",\s*rarity:\s*(\d+),\s*pv:\s*(\d+),\s*netease:\s*(\d+),\s*cmt:\s*(\d+(?:\.\d+)?),')
n_ok = n_null = 0
miss = []


def repl(m):
    global n_ok, n_null
    name, region, rarity = m.group(1), m.group(2), m.group(3)
    r = real.get(name)
    if r and r.get('play') is not None:
        n_ok += 1
        pv = wan(r['play'], 10000)
        fav = wan(r['favorite'], 1000)
        dm = wan(r['danmaku'], 1000)
    else:
        n_null += 1
        miss.append(name)
        pv = fav = dm = 'null'
    return ('{ name: "%s",%s region: "%s",%s rarity: %s, pv: %s,%s fav: %s, danmaku: %s,'
            % (name, ' ' * max(1, 6 - len(name) * 2), region, ' ' * max(1, 6 - len(region) * 2),
               rarity, pv, ' ' * max(1, 5 - len(pv)), fav, dm))


new_block = pat.sub(repl, block)
if new_block == block:
    print('未匹配到任何角色行，已中止')
    sys.exit(1)

txt = txt[:a] + new_block + txt[b:]
io.open(DATA_JS, 'w', encoding='utf-8').write(txt)
print('写回完成：有真实数据 %d 人，置空 %d 人' % (n_ok, n_null))
print('置空名单:', ' '.join(miss))
