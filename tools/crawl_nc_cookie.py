# -*- coding: utf-8 -*-
"""使用本机网易云音乐桌面客户端的登录态（tools/nc_cookie.json，由 _nc_cookie_extract.py 提取）
重新逐首抓取全部曲目的网易云评论总数，刷新 tracks_real.json 中的 neteaseCmt 字段。
biliPlay 字段保持不变（网易云客户端不提供 B站数据）。
仅更新能取到真实值的曲目；取不到的保留原值。
"""
import os, re, json, time, random, io, sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
REAL = os.path.join(ROOT, 'tools', 'tracks_real.json')
COOKIE = os.path.join(ROOT, 'tools', 'nc_cookie.json')

jar = json.load(io.open(COOKIE, encoding='utf-8'))
COOKIE_STR = '; '.join('%s=%s' % kv for kv in jar.items())
HDR = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
       'Referer': 'https://music.163.com/', 'Cookie': COOKIE_STR}


def load_track_ids():
    s = io.open(DATA_JS, encoding='utf-8').read()
    ab = s.index('const ALBUMS'); ab_end = s.index('];', ab); seg = s[ab:ab_end]
    ids, seen = [], set()
    for m in re.finditer(r'ncmId:\s*"(\d+)"', seg):
        if m.group(1) not in seen:
            seen.add(m.group(1))
            ids.append(m.group(1))
    return ids


def nc_comment_count(ncm_id, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(
                'https://music.163.com/api/v1/resource/comments/R_SO_4_%s?limit=1' % ncm_id,
                headers=HDR)
            d = json.load(urllib.request.urlopen(req, timeout=15))
            if isinstance(d, dict) and 'total' in d:
                return d['total']
        except Exception:
            pass
        time.sleep(2 + i * 2 + random.random() * 2)
    return None


def main():
    ids = load_track_ids()
    print('专辑曲目 ncmId 数:', len(ids), flush=True)
    real = {r['ncmId']: r for r in json.load(io.open(REAL, encoding='utf-8'))}
    todo = [i for i in ids if i in real]
    print('tracks_real 覆盖:', len(todo), flush=True)

    n_ok = n_fail = 0
    for idx, ncm in enumerate(todo, 1):
        cmt = nc_comment_count(ncm)
        if cmt is not None:
            real[ncm]['neteaseCmt'] = cmt
            n_ok += 1
        else:
            n_fail += 1
        if idx % 50 == 0:
            json.dump(list(real.values()), io.open(REAL, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            print('进度 %d/%d（更新 %d，失败 %d）' % (idx, len(todo), n_ok, n_fail), flush=True)
        time.sleep(0.5 + random.random() * 0.7)

    json.dump(list(real.values()), io.open(REAL, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('完成：更新 %d，失败 %d，总计 %d' % (n_ok, n_fail, len(real)), flush=True)


if __name__ == '__main__':
    main()
