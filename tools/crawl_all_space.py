# -*- coding: utf-8 -*-
"""抓取 B站「原神」官方账号(uid 401742377) 全部投稿（755 条），从中筛出
角色演示/角色PV/角色预告 三类，再本地匹配角色名，补齐 characters_real.json 中缺失的角色。

输出：
  tools/official_videos_all.json
  tools/characters_official2.json
"""
import io, os, json, time, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import crawl_official_space as C

ROOT = C.ROOT
RAW = os.path.join(ROOT, 'tools', 'official_videos_all.json')
OUT = os.path.join(ROOT, 'tools', 'characters_official2.json')


def main():
    C.bootstrap()
    mk = C.wbi_keys()
    if not mk:
        print('wbi 获取失败'); return

    videos, page, total = [], 1, None
    while page <= 30:
        qs = C.sign({'mid': C.MID, 'ps': '30', 'pn': str(page), 'order': 'pubdate',
                     'platform': 'web', 'web_location': '1550101', 'order_avoided': 'true'}, mk)
        ok, d = C.get('https://api.bilibili.com/x/space/wbi/arc/search?' + qs)
        if not ok:
            print('  pn=%d 请求失败，跳过' % page, flush=True)
            page += 1
            continue
        data = d.get('data') or {}
        vl = ((data.get('list') or {}).get('vlist')) or []
        total = ((data.get('page') or {}).get('count')) or total
        for v in vl:
            title = C.clean(v.get('title'))
            vt = next((t for t in C.TYPES if t in title), None)
            if vt and v.get('bvid'):
                videos.append({'bvid': v['bvid'], 'title': title, 'videoType': vt,
                               'play': v.get('play'), 'pubdate': v.get('pubdate')})
        print('  pn=%d 取 %d 条（总 %s，累计角色视频 %d）' % (page, len(vl), total, len(videos)), flush=True)
        if not vl or (total and page * 30 >= total):
            break
        page += 1
        time.sleep(4 + random.random() * 3)

    uniq = {}
    for v in videos:
        uniq.setdefault(v['bvid'], v)
    videos = [uniq[k] for k in uniq]
    print('\n全部投稿中筛出角色视频 %d 条' % len(videos), flush=True)
    json.dump(videos, io.open(RAW, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    real = json.load(io.open(os.path.join(ROOT, 'tools', 'characters_real.json'), encoding='utf-8'))
    names = [r['name'] for r in real]
    existing = {r['name']: r for r in real}

    # 已补齐的部分（上一次按关键词抓取的结果）也纳入已有集合
    first = os.path.join(ROOT, 'tools', 'characters_official.json')
    if os.path.exists(first):
        for r in json.load(io.open(first, encoding='utf-8')):
            if r.get('play') is not None:
                existing[r['name']] = r

    missing = [n for n in names if existing.get(n, {}).get('play') is None]
    print('仍缺角色 %d 名' % len(missing), flush=True)

    recs = {}
    for name in missing:
        nm = [C.norm(n) for n in ([name] + C.ALIAS.get(name, [])) if n]
        cands = [v for v in videos if any(n in C.norm(v['title']) for n in nm)]
        if not cands:
            recs[name] = {'name': name, 'play': None, 'favorite': None, 'danmaku': None,
                          'bvid': None, 'title': None, 'videoType': None}
            print('  %s 无官方角色视频' % name, flush=True)
            continue
        pick = max(cands, key=lambda c: c.get('play') or 0)
        st = C.view(pick['bvid'])
        recs[name] = {'name': name, 'bvid': pick['bvid'], 'title': pick['title'],
                      'videoType': pick['videoType'],
                      'play': (st or {}).get('play') or pick.get('play'),
                      'favorite': (st or {}).get('favorite'),
                      'danmaku': (st or {}).get('danmaku')}
        print('  %s -> %s | %s | %s | %s' % (name, recs[name]['videoType'], recs[name]['title'],
                                             recs[name]['play'], recs[name]['favorite']), flush=True)
        time.sleep(3 + random.random() * 3)

    # 只写出仍然缺失的（已有数据的不覆盖）
    json.dump([recs[n] for n in missing], io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('\n本轮命中 %d/%d' % (sum(1 for r in recs.values() if r.get('play')), len(missing)), flush=True)


if __name__ == '__main__':
    main()
