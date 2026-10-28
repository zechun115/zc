# -*- coding: utf-8 -*-
"""
空荧酒馆 v3 互动地图瓦片抓取器（1:1 复刻到本地 tiles/ 目录）

瓦片规范（依据 https://v3.yuanshen.site 前端 bundle 反解）：
    https://assets.yuanshen.site/tiles_<code>/<z>/<x>_<y>.<ext>
    - <code> 为地图代码（如 twt672 为提瓦特世界图）
    - z = Leaflet 缩放级别 + 13，原生层级 p = 10..13 对应 Leaflet z = -3..0
    - 单张瓦片 256x256，金字塔整幅尺寸为 W x H（z = 0 即 p = 13 时的像素尺寸）
    - x / y 取值范围：0 .. ceil(W / (256 * 2^(p-13))) - 1

输出：
    tiles/<code>/<p>/<x>_<y>.<ext>
"""

import math
import os
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://assets.yuanshen.site/tiles_"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ROOT = os.path.join(ROOT, "tiles")

# 下载层级：p10(概览) / p11 / p12。需要原生最高清（p13）时把 13 加进 LEVELS
LEVELS = [10, 11, 12]

TILE = 256
WORKERS = 32
RETRY = 3
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

# (code, 扩展名, W, H, offsetX, offsetY)
# offset 为站点 tilesOffset：提瓦特世界图有负偏移，瓦片索引因此出现负值（如 -10_2）
PYRAMIDS = [
    ("twt672", "png", 30370, 26624, -17408, -10240),
    ("qd1",    "jpg",  8192,  8192,  0, 0),
    ("qd28",   "png",  8192,  8192,  0, 0),
    ("lxsj",   "png", 12288, 12288,  0, 0),
    ("xmlk",   "png", 12288, 12288,  0, 0),
    ("kzsd2",  "png", 12288, 12288,  0, 0),
    ("cyjy",   "png", 12288, 12288,  0, 0),
    ("yxg",    "png", 12288, 12288,  0, 0),
    ("jrzh",   "png", 12288, 12288,  0, 0),
    ("ygss",   "png", 12288, 12288,  0, 0),
    ("moon2",  "png", 17408,  9216,  0, 0),
]


def tile_bounds(size, offset, p, margin=2):
    """该层级下瓦片索引区间（含负值）；margin 用于覆盖视口外溢出的边缘瓦片"""
    scale = 2.0 ** (p - 13)
    lo = int(math.floor(offset * scale / TILE)) - margin
    hi = int(math.floor((size + offset) * scale / TILE)) + margin
    return lo, hi


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://v3.yuanshen.site/"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def download_one(code, ext, p, x, y):
    """下载单张瓦片；返回 (状态, 字节数)"""
    path = os.path.join(OUT_ROOT, code, str(p), f"{x}_{y}.{ext}")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return "skip", 0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    url = f"{BASE}{code}/{p}/{x}_{y}.{ext}"
    for attempt in range(RETRY):
        try:
            data = fetch(url)
            if not data:
                return "empty", 0
            with open(path, "wb") as f:
                f.write(data)
            return "ok", len(data)
        except urllib.error.HTTPError as e:
            # 404 表示该位置无瓦片（地图留白区），直接跳过
            if e.code == 404:
                return "404", 0
            time.sleep(0.5 * (attempt + 1))
        except Exception:
            time.sleep(0.5 * (attempt + 1))
    return "fail", 0


def main():
    jobs = []
    for code, ext, w, h, ox, oy in PYRAMIDS:
        for p in LEVELS:
            x0, x1 = tile_bounds(w, ox, p)
            y0, y1 = tile_bounds(h, oy, p)
            for x in range(x0, x1 + 1):
                for y in range(y0, y1 + 1):
                    jobs.append((code, ext, p, x, y))
            print(f"[plan] {code} p={p} -> x {x0}~{x1} ({x1-x0+1}), y {y0}~{y1} ({y1-y0+1})")

    print(f"[plan] 总瓦片任务 {len(jobs)} 张，并发 {WORKERS}")
    ok = skip = miss = fail = 0
    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = [pool.submit(download_one, *j) for j in jobs]
        for f in as_completed(futs):
            status, _ = f.result()
            done += 1
            if status == "ok":
                ok += 1
            elif status == "skip":
                skip += 1
            elif status == "fail":
                fail += 1
            else:
                miss += 1
            if done % 200 == 0:
                el = time.time() - t0
                print(f"[{done}/{len(jobs)}] 新下载={ok} 已存在={skip} 无瓦片={miss} 失败={fail} 用时={el:.0f}s", flush=True)

    print(f"[done] 新下载={ok} 已存在={skip} 无瓦片={miss} 失败={fail} 总用时={time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
