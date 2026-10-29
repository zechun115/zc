# -*- coding: utf-8 -*-
"""全量爬取专辑曲目真实数据：
   网易云评论数（按 ncmId 直查，真实）
   B站相关视频播放量（搜索接口，真实）
   结果存 tracks_real.json，供后续写回 data.js
"""
import os, re, json, time, random, threading
import urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
OUT = os.path.join(ROOT, 'tools', 'tracks_real.json')
HDR_NC = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://music.163.com/'}
HDR_BILI = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            'Referer': 'https://search.bilibili.com/', 'Accept': 'application/json'}

def load_tracks():
    s = open(DATA_JS, encoding='utf-8').read()
    ab = s.index('const ALBUMS'); ab_end = s.index('];', ab); seg = s[ab:ab_end]
    rows = []
    for m in re.finditer(r'\{name:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?ncmId:\s*"(\d+)"', seg):
        name = m.group(1).replace('\\"', '"')
        rows.append({'name': name, 'ncmId': m.group(2)})
    # 去重（同名只取一次）
    seen = {}
    for r in rows:
        seen.setdefault(r['ncmId'], r)
    return list(seen.values())

def fetch_json(url, hdr, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=hdr)
            return json.load(urllib.request.urlopen(req, timeout=15))
        except Exception:
            time.sleep(1.5 + random.random() * 2)
    return None

def nc_comment_count(ncm_id):
    d = fetch_json('https://music.163.com/api/v1/resource/comments/R_SO_4_%s?limit=1' % ncm_id, HDR_NC)
    if d and 'total' in d:
        return d['total']
    return None

def bili_play(keyword):
    q = urllib.parse.quote(keyword)
    d = fetch_json('https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=%s&page=1&page_size=5' % q, HDR_BILI)
    if not d or d.get('code') != 0:
        return None
    res = d.get('data', {}).get('result') or []
    plays = [v.get('play', 0) for v in res if isinstance(v.get('play'), int)]
    return max(plays) if plays else 0

def main():
    tracks = load_tracks()
    print('待处理曲目:', len(tracks), flush=True)
    if os.path.exists(OUT):
        done = {r['ncmId']: r for r in json.load(open(OUT, encoding='utf-8'))}
    else:
        done = {}
    todo = [t for t in tracks if t['ncmId'] not in done]
    print('已完成:', len(done), '待爬:', len(todo), flush=True)
    lock = threading.Lock()
    cnt = [0]

    def work(t):
        cmt = nc_comment_count(t['ncmId'])
        play = bili_play('原神 ' + t['name'].split(' ')[0])
        rec = dict(t)
        rec['neteaseCmt'] = cmt
        rec['biliPlay'] = play
        with lock:
            done[t['ncmId']] = rec
            cnt[0] += 1
            if cnt[0] % 25 == 0:
                json.dump(list(done.values()), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
                print('进度 %d/%d' % (len(done), len(tracks)), flush=True)
        time.sleep(0.4 + random.random() * 0.6)

    with ThreadPoolExecutor(max_workers=6) as ex:
        list(ex.map(work, todo))
    json.dump(list(done.values()), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok_nc = sum(1 for r in done.values() if r.get('neteaseCmt') is not None)
    ok_bili = sum(1 for r in done.values() if r.get('biliPlay') is not None)
    print('完成。网易云评论命中 %d，B站播放命中 %d，共 %d' % (ok_nc, ok_bili, len(done)), flush=True)

if __name__ == '__main__':
    main()
