# -*- coding: utf-8 -*-
"""
网易云客户端红心数(收藏数)爬虫
==============================
原理: CDP (Chrome DevTools Protocol) 接管网易云桌面客户端
  (需以 --remote-debugging-port=9222 启动 cloudmusic.exe)
流程(每首曲目):
  搜索框输入曲名 -> 点击搜索建议 -> 结果页 TrackCard 打分排序
  -> 双击候选卡片播放 -> localStorage.lastestRefer 校验播放的 songId == ncmId
  -> 读取迷你播放条 .red-star-comment-wrapper 的红心数(收藏数)与评论数标签
粒度: 客户端 UI 显示值 —— <1万 显示精确数字(如 6877), >=1万 显示粗粒度(如 1w+/10w+/万人)
产出: tools/tracks_fav.jsonl  每行 {ncmId, name, neteaseFav, neteaseCmtLabel, playedId, src, ts}
用法: python tools/crawl_nc_fav.py [--limit N] [--retry-failed]
"""
import json, re, sys, time, threading, urllib.request

import websocket  # pip install websocket-client

CDP_HOST = 'http://localhost:9222'
TRACKS_JSON = r'tools\tracks_real.json'
OUT_JSONL = r'tools\tracks_fav.jsonl'
HEARTBEAT = r'tools\_fav_heartbeat.json'

# -------------------- CDP 封装 --------------------
class CDP:
    def __init__(self):
        targets = json.load(urllib.request.urlopen(CDP_HOST + '/json'))
        pages = [t for t in targets if t.get('type') == 'page' and 'pub/app.html' in t['url']]
        if not pages:
            raise RuntimeError('找不到 app.html 页面 target, 请确认客户端以调试端口启动')
        self.ws = websocket.create_connection(pages[0]['webSocketDebuggerUrl'], suppress_origin=True, timeout=30)
        self.mid = 0
        self.results = {}
        self.lock = threading.Lock()
        self.alive = True
        threading.Thread(target=self._pump, daemon=True).start()

    def _pump(self):
        while self.alive:
            try:
                m = json.loads(self.ws.recv())
            except Exception:
                self.alive = False
                return
            if 'id' in m:
                self.results[m['id']] = m

    def send(self, method, params=None, timeout=25):
        with self.lock:
            self.mid += 1
            i = self.mid
            self.ws.send(json.dumps({'id': i, 'method': method, 'params': params or {}}))
        t0 = time.time()
        while time.time() - t0 < timeout:
            if not self.alive:
                raise RuntimeError('CDP 连接已断开')
            if i in self.results:
                return self.results.pop(i)
            time.sleep(0.02)
        return None

    def ev(self, expr):
        r = self.send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
        if not r:
            return None
        rr = r.get('result', {})
        if rr.get('exceptionDetails'):
            return None
        return rr.get('result', {}).get('value')

    def mouse(self, typ, x, y, clicks=1):
        self.send('Input.dispatchMouseEvent', {'type': typ, 'x': x, 'y': y, 'button': 'left', 'clickCount': clicks})

    def click(self, x, y):
        self.mouse('mousePressed', x, y); self.mouse('mouseReleased', x, y)

    def dblclick(self, x, y):
        self.mouse('mousePressed', x, y); self.mouse('mouseReleased', x, y)
        time.sleep(0.05)
        self.mouse('mousePressed', x, y, clicks=2); self.mouse('mouseReleased', x, y, clicks=2)


# -------------------- 页面操作 JS --------------------
JS_TYPE = r"""
(() => {
  const inp = document.querySelector('input.cmd-input') || document.querySelector('input');
  if (!inp) return false;
  inp.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, %s);
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()
"""

JS_SUGGEST = r"""
(() => {
  const rows = [];
  document.querySelectorAll('[class*="Content_"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.x < 200 || r.x > 1100 || r.y < 50 || r.y > 620) return;
    if (r.height < 26 || r.height > 44 || r.width < 400) return;
    const t = (el.innerText || '').trim();
    if (t && t.length < 45 && !t.includes('\n')) rows.push({ txt: t, x: r.x + r.width / 2, y: r.y + r.height / 2 });
  });
  return rows.slice(0, 6);
})()
"""

JS_CARDS = r"""
(() => {
  const cards = [];
  document.querySelectorAll('[class*="TrackCardWrapper"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.y < 100) return;
    const lines = (el.innerText || '').split('\n').map(s => s.trim()).filter(Boolean);
    cards.push({ lines, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), y0: Math.round(r.y) });
  });
  cards.sort((a, b) => a.y0 - b.y0);
  return cards;
})()
"""

JS_SINGLE_TAB = r"""
(() => {
  const els = [...document.querySelectorAll('*')].filter(el => el.children.length === 0 && (el.innerText || '').trim() === '单曲');
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.y > 100 && r.y < 250) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }
  return null;
})()
"""

JS_ROWS = r"""
(() => {
  const rows = [];
  document.querySelectorAll('.tr').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 400 || r.height < 40 || r.height > 90 || r.y < 150) return;
    const t = (el.innerText || '');
    if (t.includes('无音源')) return;
    const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
    rows.push({ lines, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), y0: Math.round(r.y) });
  });
  rows.sort((a, b) => a.y0 - b.y0);
  return rows.slice(0, 10);
})()
"""

JS_HEART = r"""
(() => {
  const w = document.querySelector('.red-star-comment-wrapper');
  if (!w) return null;
  function btnText(iconSel) {
    const icon = w.querySelector(iconSel);
    if (!icon) return '';
    const btn = icon.closest('button') || icon.parentElement;
    if (!btn) return '';
    const spans = [...btn.querySelectorAll('span')].filter(s => (s.innerText || '').trim());
    const t = spans.length ? spans[spans.length - 1].innerText.trim() : (btn.innerText || '').trim();
    return t.replace(/\s+/g, '');
  }
  return { heart: btnText('.cmd-icon-like_number'), cmt: btnText('.cmd-icon-comment_number') };
})()
"""

JS_PLAYED_ID = r"""
(() => {
  const ref = localStorage.getItem('lastestRefer') || '';
  const m = [...ref.matchAll(/(\d{5,}):song::/g)];
  return m.length ? m[m.length - 1][1] : null;
})()
"""


# -------------------- 辅助 --------------------
def zh_part(name):
    for i, ch in enumerate(name):
        if ch.isascii() and ch.isalpha():
            return name[:i].strip(' ·-—')
    return name.strip()


def score_card(lines, name, zh):
    text = '|'.join(lines)
    s = 0
    if '原唱' in lines:
        s += 3
    if any(a in text for a in ('陈致逸', 'HOYO-MiX', 'HOYO-MIX', 'HOYO', '原神', 'Hoyo', 'hoyo')):
        s += 2
    title = lines[0] if lines else ''
    if zh and zh in title:
        s += 2
    elif any(len(p) > 3 and p in title for p in name.split()):
        s += 1
    return s


# -------------------- 单曲抓取 --------------------
def crawl_track(cdp, name, ncmId):
    zh = zh_part(name) or name
    played_before = cdp.ev(JS_PLAYED_ID)

    # 1. 输入
    if not cdp.ev(JS_TYPE % json.dumps(zh)):
        return None, 'no-input'
    # 2. 等建议并点击
    sug = None
    t0 = time.time()
    while time.time() - t0 < 6:
        rows = cdp.ev(JS_SUGGEST) or []
        cand = [r for r in rows if zh[:3] in r['txt']]
        if cand:
            sug = cand[0]
            break
        if rows and time.time() - t0 > 2.5:  # 下拉已稳定但不匹配, 点第一行
            sug = rows[0]
            break
        time.sleep(0.35)
    if not sug:
        return None, 'no-suggest'
    cdp.click(sug['x'], sug['y'])

    # 3. 等卡片
    cards = []
    t0 = time.time()
    while time.time() - t0 < 4:
        cards = cdp.ev(JS_CARDS) or []
        if cards:
            break
        time.sleep(0.4)

    candidates = []
    if cards:
        scored = sorted(((score_card(c['lines'], name, zh), c) for c in cards), key=lambda x: -x[0])
        candidates = [c for s, c in scored if s >= 2][:4]

    # 4. 双击候选播放并校验 id
    def try_play(cands):
        for c in cands:
            cdp.dblclick(c['x'], c['y'])
            t0 = time.time()
            while time.time() - t0 < 7:
                pid = cdp.ev(JS_PLAYED_ID)
                if pid and pid != played_before:
                    if pid == str(ncmId):
                        time.sleep(0.8)  # 等红心数刷新
                        return pid
                    break  # 播了别的歌, 换下一个候选
                time.sleep(0.4)
        return None

    pid = try_play(candidates)

    # 5. 回退: 单曲 tab 行列表
    if not pid:
        tab = cdp.ev(JS_SINGLE_TAB)
        if tab:
            cdp.click(tab['x'], tab['y'])
            rows = []
            t0 = time.time()
            while time.time() - t0 < 3.5:
                rows = cdp.ev(JS_ROWS) or []
                if rows:
                    break
                time.sleep(0.4)
            scored = sorted(((score_card(r['lines'], name, zh), r) for r in rows), key=lambda x: -x[0])
            pid = try_play([r for s, r in scored if s >= 1][:6])

    if not pid:
        return None, 'no-match'

    # 6. 读红心数
    hv = cdp.ev(JS_HEART)
    if not hv or not hv.get('heart'):
        time.sleep(1.2)
        hv = cdp.ev(JS_HEART)
    if not hv or not hv.get('heart'):
        return None, 'no-heart-read'
    return {'neteaseFav': hv['heart'], 'neteaseCmtLabel': hv.get('cmt', ''), 'playedId': pid, 'src': 'client_minibar'}, None


# -------------------- 主流程 --------------------
def main():
    import os
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])

    tracks = json.load(open(TRACKS_JSON, encoding='utf-8'))
    done = {}
    if os.path.exists(OUT_JSONL):
        for line in open(OUT_JSONL, encoding='utf-8'):
            try:
                r = json.loads(line)
                if r.get('neteaseFav'):
                    done[r['ncmId']] = r
            except Exception:
                pass
    queue = [t for t in tracks if t['ncmId'] not in done]
    if limit:
        queue = queue[:limit]
    total = len(tracks)
    print('总曲目 %d, 已完成 %d, 待抓 %d' % (total, len(done), len(queue)))

    cdp = CDP()
    n_done = len(done)
    fw = open(OUT_JSONL, 'a', encoding='utf-8')
    try:
        for i, t in enumerate(queue):
            name, nid = t['name'], t['ncmId']
            rec, err = None, None
            for attempt in range(2):
                try:
                    rec, err = crawl_track(cdp, name, nid)
                except Exception as e:
                    err = 'exc:%r' % e
                if rec:
                    break
                time.sleep(1.0)
            out = {'ncmId': nid, 'name': name, 'neteaseFav': rec and rec['neteaseFav'],
                   'neteaseCmtLabel': rec and rec.get('neteaseCmtLabel'),
                   'playedId': rec and rec.get('playedId'), 'src': rec and rec.get('src'),
                   'err': None if rec else err, 'ts': int(time.time())}
            fw.write(json.dumps(out, ensure_ascii=False) + '\n')
            fw.flush()
            n_done += 1
            tag = out['neteaseFav'] if rec else ('FAIL:' + str(err))
            print('[%d/%d] %s -> %s' % (n_done, total, name[:40], tag), flush=True)
            json.dump({'done': n_done, 'total': total, 'last': name, 'fav': out['neteaseFav'], 'ts': int(time.time())},
                      open(HEARTBEAT, 'w', encoding='utf-8'), ensure_ascii=False)
            time.sleep(0.6)
    except KeyboardInterrupt:
        print('\n手动中断, 已保存 %d 条' % n_done)
    finally:
        fw.close()


if __name__ == '__main__':
    main()
