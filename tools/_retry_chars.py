# -*- coding: utf-8 -*-
"""对首轮未命中的角色做多关键词重试，合并回 characters_real.json"""
import io, os, re, json, time, random, http.cookiejar, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'characters_real.json')

CJ = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CJ))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
HDR = {'User-Agent': UA, 'Referer': 'https://search.bilibili.com/',
       'Accept': 'application/json', 'Accept-Language': 'zh-CN,zh;q=0.9'}


def bootstrap():
    try:
        OPENER.open(urllib.request.Request('https://www.bilibili.com/', headers={'User-Agent': UA}), timeout=15)
    except Exception:
        pass


def fetch(url, retries=5):
    for i in range(retries):
        try:
            d = json.load(OPENER.open(urllib.request.Request(url, headers=HDR), timeout=20))
            if isinstance(d, dict) and d.get('code') == 0:
                return d
        except Exception:
            pass
        time.sleep(3 + i * 2 + random.random() * 2)
    return None


def clean(t):
    return re.sub('<[^>]+>', '', t or '').replace('&quot;', '"')


def norm(s):
    return re.sub(r'[·・\s\-—_]', '', s or '')


def search(name, kw, order='totalrank', ps=30):
    u = ('https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=%s&order=%s'
         '&page=1&page_size=%d' % (urllib.parse.quote(kw), order, ps))
    d = fetch(u)
    if not d:
        return []
    out = []
    n = norm(name)
    for v in ((d.get('data') or {}).get('result') or []):
        title = clean(v.get('title'))
        if '角色演示' not in title and '角色PV' not in title:
            continue
        if n and n not in norm(title):
            continue
        if v.get('author') != '原神' or not v.get('bvid'):
            continue
        out.append({'bvid': v['bvid'], 'title': title, 'play': v.get('play')})
    return out


def view(bvid):
    d = fetch('https://api.bilibili.com/x/web-interface/view?bvid=%s' % bvid)
    if not d:
        return None
    st = (d.get('data') or {}).get('stat') or {}
    return {'play': st.get('view'), 'favorite': st.get('favorite'), 'danmaku': st.get('danmaku')}


def main():
    bootstrap()
    data = json.load(io.open(OUT, encoding='utf-8'))
    recs = {r['name']: r for r in data}
    misses = [r['name'] for r in data if r.get('play') is None]
    print('待重试:', len(misses), flush=True)

    for name in misses:
        cands = []
        for kw, order in [('%s 角色演示' % name, 'click'), ('原神 %s 角色演示' % name, 'totalrank'),
                          ('%s' % name, 'click')]:
            cands += search(name, kw, order)
            if cands:
                break
            time.sleep(3 + random.random() * 2)
        if not cands:
            print('  %s 仍无官方角色演示' % name, flush=True)
            time.sleep(2.5 + random.random() * 2)
            continue
        pick = max(cands, key=lambda c: c.get('play') or 0)
        st = view(pick['bvid'])
        recs[name].update({'bvid': pick['bvid'], 'title': pick['title'], 'src': 'official_demo_retry'})
        if st:
            recs[name].update(st)
        print('  %s -> %s | %s' % (name, recs[name].get('play'), recs[name].get('favorite')), flush=True)
        json.dump(list(recs.values()), io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        time.sleep(3 + random.random() * 2)

    json.dump(list(recs.values()), io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = sum(1 for r in recs.values() if r.get('play') is not None)
    print('最终命中 %d/%d' % (ok, len(recs)), flush=True)


if __name__ == '__main__':
    main()
