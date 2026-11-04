# -*- coding: utf-8 -*-
"""移除 STORY_TRACKS / REGION_TRACKS 中硬编码的虚构指标
   （运行时一律由 getRealByName 读取真实实测值，这些硬编码值从未被展示）"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, 'js', 'data.js')
s = io.open(p, encoding='utf-8').read()

a = s.index('const STORY_TRACKS = [')
b = s.index('];', a)
seg = s[a:b]
seg2 = re.sub(r'netease:\s*\d+,\s*cmt:\s*\d+(?:\.\d+)?,\s*', '', seg)
print('STORY_TRACKS 清理字段数:', len(re.findall(r'netease:\s*\d+', seg)))
s = s[:a] + seg2 + s[b:]

a = s.index('const REGION_TRACKS = {')
b = s.index('\n};', a)
seg = s[a:b]
print('REGION_TRACKS 清理字段数:', len(re.findall(r'fav:\s*\d+', seg)))
seg2 = re.sub(r'fav:\s*\d+,\s*cmt:\s*\d+(?:\.\d+)?,\s*', '', seg)
s = s[:a] + seg2 + s[b:]

io.open(p, 'w', encoding='utf-8').write(s)
print('done')
