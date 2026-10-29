# -*- coding: utf-8 -*-
"""补充爬取：STORY_TRACKS / REGION_TRACKS 中未能匹配到专辑 ncmId 的曲目。
   通过网易云搜索按曲名匹配 → 取歌曲 id → 取真实评论数；B站搜索取相关视频播放量。
   输出 tools/tracks_extra.json: { name: {ncmId, neteaseCmt, biliPlay} }
"""
import os, re, json, time, random, threading
import urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
OUT = os.path.join(ROOT, 'tools', 'tracks_extra.json')
HDR_NC = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://music.163.com/'}
HDR_BILI = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            'Referer': 'https://search.bilibili.com/', 'Accept': 'application/json'}

def fetch_json(url, hdr, retries=3):
    for _ in range(retries):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=hdr), timeout=15))
        except Exception:
            time.sleep(1.2 + random.random() * 2)
    return None

def load_names_and_known():
    s = open(DATA_JS, encoding='utf-8').read()
    # 所有曲名（STORY + REGION）
    names = []
    for kw in ('const STORY_TRACKS', 'const REGION_TRACKS'):
        i = s.index(kw); j = s.index('\n];', i) if kw == 'const STORY_TRACKS' else s.index('\n};', i)
        seg = s[i:j]
        names += re.findall(r'name:\s*"([^"]+)"', seg)
    names = list(dict.fromkeys(names))
    # 专辑中已有 ncmId 的曲名
    ab = s.index('const ALBUMS'); ab_end = s.index('];', ab); seg2 = s[ab:ab_end]
    pairs = re.findall(r'\{name:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?ncmId:\s*"(\d+)"', seg2)
    known = set()
    for nm, _ in pairs:
        nm = nm.replace('\\"', '"')
        known.add(nm); known.add(nm.split(' ')[0])
    return [n for n in names if n not in known and n.split(' ')[0] not in known]

def nc_search(name):
    q = urllib.parse.quote(name)
    d = fetch_json('https://music.163.com/api/search/get?s=%s&type=1&limit=5&offset=0' % q, HDR_NC)
    if not d:
        return None
    songs = (d.get('result') or {}).get('songs') or []
    best = None
    for sg in songs:
        nm = sg.get('name', '')
        if name == nm or name in nm or nm in name:
            best = sg; break
    if not best:
        return None
    return str(best['id'])

def nc_cmt(sid):
    d = fetch_json('https://music.163.com/api/v1/resource/comments/R_SO_4_%s?limit=1' % sid, HDR_NC)
    return d.get('total') if d and 'total' in d else None

def bili_play(name):
    q = urllib.parse.quote('原神 ' + name)
    d = fetch_json('https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=%s&page=1&page_size=5' % q, HDR_BILI)
    if not d or d.get('code') != 0:
        return None
    res = d.get('data', {}).get('result') or []
    plays = [v.get('play') for v in res if isinstance(v.get('play'), int)]
    return max(plays) if plays else None

def main():
    todo = load_names_and_known()
    print('待补充曲目:', len(todo), todo, flush=True)
    lock = threading.Lock()
    out = {}

    def work(name):
        sid = nc_search(name)
        cmt = nc_cmt(sid) if sid else None
        play = bili_play(name)
        with lock:
            out[name] = {'ncmId': sid, 'neteaseCmt': cmt, 'biliPlay': play}
            print('%-22s ncm=%-12s cmt=%-8s bili=%s' % (name, sid, cmt, play), flush=True)
        time.sleep(0.4 + random.random() * 0.5)

    with ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(work, todo))
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('完成。命中评论数:', sum(1 for v in out.values() if v['neteaseCmt'] is not None))

if __name__ == '__main__':
    main()
