# -*- coding: utf-8 -*-
"""读取网易云桌面客户端 Chromium Cookies（v10/v11 AES-GCM + DPAPI）中的 163.com 登录态。
仅输出到 tools/nc_cookie.json（含敏感凭证，不入库），并做有效性校验。
"""
import ctypes, ctypes.wintypes as wt
import base64, io, json, os, sqlite3, struct, sys, urllib.request

TMP = r'C:\Users\haofeng\AppData\Local\Temp\ncm_cookies'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'nc_cookie.json')

# ---------- DPAPI ----------
class DATA_BLOB(ctypes.Structure):
    _fields_ = [('cbData', wt.DWORD), ('pbData', ctypes.POINTER(ctypes.c_char))]

def dpapi_decrypt(data):
    blob_in = DATA_BLOB(len(data), ctypes.cast(ctypes.create_string_buffer(data, len(data)), ctypes.POINTER(ctypes.c_char)))
    blob_out = DATA_BLOB()
    if not ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)):
        raise OSError('CryptUnprotectData failed')
    try:
        return ctypes.string_at(blob_out.pbData, blob_out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)

# ---------- AES-GCM（纯 Python，避免外部依赖） ----------
# 用 cryptography/pycryptodome 都没有，这里用最小实现? 太复杂。
# 优先尝试 pip 安装；若无网络则回退。
def aes_gcm_decrypt(key, nonce, ct, tag):
    try:
        from Crypto.Cipher import AES
        c = AES.new(key, AES.MODE_GCM, nonce=nonce)
        return c.decrypt_and_verify(ct, tag)
    except ImportError:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        return AESGCM(key).decrypt(nonce, ct + tag, None)

def load_key():
    # NCM 客户端把 Chromium 的 os_crypt.encrypted_key 放在 LocalPrefs.json（无 Local State）
    for p in (os.path.join(TMP, 'LocalState'),
              r'C:\Users\haofeng\AppData\Local\NetEase\CloudMusic\webapp91x64\LocalPrefs.json'):
        if not os.path.exists(p):
            continue
        st = json.load(io.open(p, encoding='utf-8'))
        ek = ((st.get('os_crypt') or {}).get('encrypted_key'))
        if not ek:
            continue
        ek = base64.b64decode(ek)
        assert ek[:5] == b'DPAPI'
        return dpapi_decrypt(ek[5:])
    return None

def main():
    db = sqlite3.connect(os.path.join(TMP, 'Cookies'))
    rows = db.execute("select host_key,name,value,encrypted_value,expires_utc from cookies where host_key like '%163.com%'").fetchall()
    db.close()
    print('163.com cookies:', len(rows))
    key = load_key()
    print('local state key:', 'ok' if key else 'missing')

    jar = {}
    enc_types = set()
    for host, name, value, enc, exp in rows:
        if value:
            jar[name] = value
            continue
        if not enc:
            continue
        enc_types.add(enc[:3])
        try:
            if enc[:3] in (b'v10', b'v11') and key:
                nonce, ct, tag = enc[3:15], enc[15:-16], enc[-16:]
                jar[name] = aes_gcm_decrypt(key, nonce, ct, tag).decode('utf-8', 'ignore')
            else:
                jar[name] = dpapi_decrypt(enc).decode('utf-8', 'ignore')
        except Exception as e:
            print('decrypt fail', name, e)
    print('enc prefixes:', enc_types)
    print('names:', sorted(jar.keys()))
    if 'MUSIC_U' not in jar:
        print('未找到 MUSIC_U，客户端可能未登录')
        sys.exit(2)

    # 校验登录态：拿用户 id + 一个已知歌曲评论数
    hdr = {'User-Agent': 'Mozilla/5.0', 'Referer': 'https://music.163.com/',
           'Cookie': '; '.join('%s=%s' % kv for kv in jar.items() if kv[0] in ('MUSIC_U', '__csrf', 'NMTID', 'MUSIC_A_T', 'MUSIC_R_T'))}
    d = json.load(urllib.request.urlopen(urllib.request.Request(
        'https://music.163.com/api/v1/resource/comments/R_SO_4_347230?limit=1', headers=hdr), timeout=15))
    print('登录态校验 comment total(海阔天空):', d.get('total'))

    keep = {k: jar[k] for k in ('MUSIC_U', '__csrf', 'NMTID') if k in jar}
    json.dump(keep, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
    print('written', OUT, 'keys', list(keep.keys()))

if __name__ == '__main__':
    main()
