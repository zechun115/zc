# -*- coding: utf-8 -*-
"""抓取 B站「原神」官方账号(uid 401742377) 空间内所有「角色演示/角色PV/角色预告」视频标题，
再按角色名（含称号别名）本地匹配，取播放量最高的一条，读取真实播放/收藏/弹幕。

输出：
  tools/official_videos.json    官方账号全部三类角色视频（原始）
  tools/characters_official.json 仅补齐 characters_real.json 中缺失的角色
"""
import io, os, re, json, time, random, hashlib, http.cookiejar, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'characters_official.json')
RAW = os.path.join(ROOT, 'tools', 'official_videos.json')
MID = '401742377'

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
HDR = {'User-Agent': UA, 'Referer': 'https://space.bilibili.com/%s/video' % MID, 'Accept': 'application/json',
       'Accept-Language': 'zh-CN,zh;q=0.9'}
CJ = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CJ))

MIXIN_TAB = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
             33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
             26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
             20, 34, 44, 52]

ALIAS = {
    '达达利亚': ['公子'],
    '阿蕾奇诺': ['仆人'],
    '流浪者': ['散兵'],
    '芙宁娜': ['芙卡洛斯'],
    '旅行者·冰': ['旅行者'],
}
TYPES = ['角色演示', '角色PV', '角色预告']


def bootstrap():
    try:
        OPENER.open(urllib.request.Request('https://www.bilibili.com/', headers={'User-Agent': UA}), timeout=15)
    except Exception:
        pass
    try:
        spi = json.load(OPENER.open(urllib.request.Request('https://api.bilibili.com/x/frontend/finger/spi', headers=HDR), timeout=15))
        for k, v in (('buvid3', spi['data']['b_3']), ('buvid4', spi['data']['b_4'])):
            CJ.set_cookie(http.cookiejar.Cookie(0, k, v, None, False, '.bilibili.com', False, False, '/', True, False, None, None, None, None, {}))
    except Exception:
        pass


def wbi_keys():
    for _ in range(6):
        try:
            d = json.load(OPENER.open(urllib.request.Request('https://api.bilibili.com/x/web-interface/nav', headers=HDR), timeout=20))
            img = d['data']['wbi_img']['img_url'].rsplit('/', 1)[-1].split('.')[0]
            sub = d['data']['wbi_img']['sub_url'].rsplit('/', 1)[-1].split('.')[0]
            raw = img + sub
            return ''.join(raw[i] for i in MIXIN_TAB)[:32]
        except Exception:
            time.sleep(3)
    return None


def sign(params, mk):
    params['wts'] = int(time.time())
    q = urllib.parse.urlencode(sorted(params.items()))
    params['w_rid'] = hashlib.md5((q + mk).encode()).hexdigest()
    return urllib.parse.urlencode(sorted(params.items()))


def get(url, retries=8):
    """返回 (ok, data)。ok=False 仅代表请求彻底失败，不表示空结果。"""
    for i in range(retries):
        try:
            d = json.load(OPENER.open(urllib.request.Request(url, headers=HDR), timeout=20))
            if d.get('code') == 0:
                return True, d
            # -352 / -412 风控：拉长间隔重试
            time.sleep(6 + i * 3 + random.random() * 4)
        except Exception:
            time.sleep(4 + i * 3 + random.random() * 4)
    return False, None


def clean(t):
    return re.sub('<[^>]+>', '', t or '').replace('&quot;', '"').replace('&amp;', '&')


def norm(s):
    return re.sub(r'[·・\s\-—_「」『』:：]', '', s or '')


def crawl_type(kw, mk, max_page=25):
    items, page = [], 1
    while page <= max_page:
        qs = sign({'mid': MID, 'ps': '30', 'pn': str(page), 'keyword': kw, 'order': 'pubdate',
                   'platform': 'web', 'web_location': '1550101', 'order_avoided': 'true'}, mk)
        ok, d = get('https://api.bilibili.com/x/space/wbi/arc/search?' + qs)
        if not ok:
            print('  [%s] pn=%d 请求失败，跳过该页' % (kw, page), flush=True)
            page += 1
            continue
        data = d.get('data') or {}
        vl = ((data.get('list') or {}).get('vlist')) or []
        total = ((data.get('page') or {}).get('count')) or 0
        for v in vl:
            title = clean(v.get('title'))
            vt = next((t for t in TYPES if t in title), None)
            if not vt or not v.get('bvid'):
                continue
            items.append({'bvid': v['bvid'], 'title': title, 'videoType': vt,
                          'play': v.get('play'), 'pubdate': v.get('pubdate')})
        print('  [%s] pn=%d 取 %d 条（总 %d）' % (kw, page, len(vl), total), flush=True)
        if not vl or len(items) >= total or total == 0:
            break
        page += 1
        time.sleep(5 + random.random() * 4)
    return items


def view(bvid):
    ok, d = get('https://api.bilibili.com/x/web-interface/view?bvid=%s' % bvid)
    if not ok:
        return None
    st = (d.get('data') or {}).get('stat') or {}
    return {'play': st.get('view'), 'favorite': st.get('favorite'), 'danmaku': st.get('danmaku')}


def main():
    bootstrap()
    mk = wbi_keys()
    if not mk:
        print('wbi 获取失败，中止', flush=True)
        return

    videos = []
    for kw in TYPES:
        print('\n抓取关键词 %s' % kw, flush=True)
        videos += crawl_type(kw, mk)

    # 去重（同一视频可能被多个关键词命中）
    uniq = {}
    for v in videos:
        uniq.setdefault(v['bvid'], v)
    videos = [uniq[k] for k in uniq]
    print('\n官方三类角色视频共 %d 条（去重后）' % len(videos), flush=True)
    json.dump(videos, io.open(RAW, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    names = [r['name'] for r in json.load(io.open(os.path.join(ROOT, 'tools', 'characters_real.json'), encoding='utf-8'))]
    existing = {}
    real_path = os.path.join(ROOT, 'tools', 'characters_real.json')
    for r in json.load(io.open(real_path, encoding='utf-8')):
        existing[r['name']] = r

    recs = {}
    missing = [n for n in names if existing.get(n, {}).get('play') is None]
    print('待补齐角色 %d 名' % len(missing), flush=True)

    for name in missing:
        cands = []
        nm = [norm(n) for n in ([name] + ALIAS.get(name, [])) if n]
        for v in videos:
            if any(n in norm(v['title']) for n in nm):
                cands.append(v)
        if not cands:
            recs[name] = {'name': name, 'play': None, 'favorite': None, 'danmaku': None,
                          'bvid': None, 'title': None, 'videoType': None}
            print('  %s 无官方角色视频' % name, flush=True)
            continue
        pick = max(cands, key=lambda c: c.get('play') or 0)
        st = view(pick['bvid'])
        recs[name] = {'name': name, 'bvid': pick['bvid'], 'title': pick['title'],
                      'videoType': pick['videoType'],
                      'play': st.get('play', pick.get('play')) if st else pick.get('play'),
                      'favorite': (st or {}).get('favorite'),
                      'danmaku': (st or {}).get('danmaku')}
        print('  %s -> %s | %s | %s | %s' % (name, recs[name]['videoType'], recs[name]['title'],
                                             recs[name]['play'], recs[name]['favorite']), flush=True)
        time.sleep(4 + random.random() * 3)

    json.dump([recs[n] for n in missing], io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = sum(1 for r in recs.values() if r.get('play') is not None)
    print('\n补齐命中 %d/%d' % (ok, len(missing)), flush=True)


if __name__ == '__main__':
    main()
