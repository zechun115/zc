# -*- coding: utf-8 -*-
"""爬取角色级真实指标：仅取 B 站「原神」官方账号发布的角色演示视频
   play     播放量（次）
   favorite 收藏数（次）
   danmaku  弹幕数（条）
   结果存 tools/characters_real.json，供写回 data.js
"""
import io, os, re, json, time, random, threading, http.cookiejar, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
OUT = os.path.join(ROOT, 'tools', 'characters_real.json')

CJ = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CJ))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
HDR = {'User-Agent': UA, 'Referer': 'https://search.bilibili.com/',
       'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'zh-CN,zh;q=0.9'}
LOCK = threading.Lock()


def bootstrap():
    try:
        OPENER.open(urllib.request.Request('https://www.bilibili.com/', headers={'User-Agent': UA}), timeout=15)
    except Exception as e:
        print('bootstrap err', e, flush=True)
    try:
        d = json.load(OPENER.open(urllib.request.Request('https://api.bilibili.com/x/frontend/finger/spi', headers=HDR), timeout=15))
        data = d.get('data') or {}
        for k, v in (('buvid3', data.get('b_3')), ('buvid4', data.get('b_4'))):
            if v:
                CJ.set_cookie(http.cookiejar.Cookie(0, k, v, None, False, '.bilibili.com', True,
                                                   False, '/', True, False, None, True, None, None, {}))
        print('buvid:', bool(data.get('b_3')), flush=True)
    except Exception as e:
        print('finger err', e, flush=True)


def fetch(url, retries=6):
    for i in range(retries):
        try:
            d = json.load(OPENER.open(urllib.request.Request(url, headers=HDR), timeout=20))
            if isinstance(d, dict) and d.get('code') == 0:
                return d
            print('   code=%s %s' % (d.get('code') if isinstance(d, dict) else '?', url[:60]), flush=True)
        except Exception as e:
            print('   err(%d) %s' % (i + 1, str(e)[:40]), flush=True)
        time.sleep(3.5 + i * 2.5 + random.random() * 3)
    return None


def clean(t):
    return re.sub('<[^>]+>', '', t or '').replace('&quot;', '"')


def norm(s):
    return re.sub(r'[·・\s\-—_]', '', s or '')


def search(name, kw, order='totalrank'):
    u = ('https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=%s&order=%s'
         '&page=1&page_size=20' % (urllib.parse.quote(kw), order))
    d = fetch(u)
    if not d:
        return []
    res = (d.get('data') or {}).get('result') or []
    n = norm(name)
    out = []
    for v in res:
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


def load_chars():
    s = io.open(DATA_JS, encoding='utf-8').read()
    a = s.index('const CHARACTERS = [')
    b = s.index('];', a)
    return re.findall(r'{ name:\s*"([^"]+)"', s[a:b])


def main():
    bootstrap()
    names = load_chars()
    print('角色数:', len(names), flush=True)
    done = {}
    if os.path.exists(OUT):
        done = {r['name']: r for r in json.load(io.open(OUT, encoding='utf-8'))}
    todo = [n for n in names if n not in done]
    print('待爬:', len(todo), flush=True)

    def work(name):
        rec = {'name': name, 'bvid': None, 'title': None, 'play': None,
               'favorite': None, 'danmaku': None, 'src': None}
        cands = search(name, '《原神》角色演示 %s' % name)
        if not cands:
            cands = search(name, '%s 角色演示' % name, 'click')
        if cands:
            pick = max(cands, key=lambda c: c.get('play') or 0)
            st = view(pick['bvid'])
            rec.update({'bvid': pick['bvid'], 'title': pick['title'], 'src': 'official_demo'})
            if st:
                rec.update(st)
        with LOCK:
            done[name] = rec
            json.dump(list(done.values()), io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            n_ok = sum(1 for r in done.values() if r.get('play') is not None)
            print('[%d/%d ok=%d] %s -> %s' % (len(done), len(names), n_ok, name,
                  ('%s | %s' % (rec['play'], rec['favorite'])) if rec['play'] else '无官方角色演示'), flush=True)
        time.sleep(3 + random.random() * 3)

    with ThreadPoolExecutor(max_workers=2) as ex:
        list(ex.map(work, todo))

    ok = [r for r in done.values() if r.get('play') is not None]
    print('\n完成：%d/%d 命中官方角色演示' % (len(ok), len(done)), flush=True)
    print('未命中:', ' '.join(r['name'] for r in done.values() if r.get('play') is None), flush=True)


if __name__ == '__main__':
    main()
