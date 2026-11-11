// 備份與移轉：匯出／匯入、移轉碼、QR code
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 紀錄只存在這個瀏覽器裡（localStorage），換裝置或清除資料就會不見，
 * 所以提供三種搬法，都不用註冊、也不經過任何伺服器：
 *   備份檔：下載一個 .json，之後在任何裝置選這個檔案還原
 *   移轉碼：一串文字，貼到 LINE／記事本，在另一台裝置貼上
 *   QR code：手機掃描直接打開網站並帶入紀錄（資料放在網址 # 後面，不會傳到伺服器）
 * 匯入時可以「合併」（兩邊的印都留下）或「取代」。
 ***********************************************************************/
const BACKUP_AT_KEY = 'shinkoku_backup_at';
const BACKUP_APP = 'shinkoku-3d';
const QR_MAX_URL = 2200;                  // 網址再長，手機就不好掃了
let backupPending = null;                 // 讀進來、等使用者決定合併或取代的備份
let backupNudged = false;

// ---------- 打包／解包 ----------
// 印章依「拜領日期｜季節」分組，比照原樣存小很多（移轉碼、QR code 才放得下）
function backupPayload() {
    const store = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('shinkoku_')) continue;
        if ([SITE_STAMP_KEY, STAMP_META_KEY, STORAGE_KEY, BACKUP_AT_KEY].includes(k)) continue;
        store[k] = localStorage.getItem(k);
    }
    const stamps = {};
    stampedSites.forEach(key => {
        const m = stampMeta[key];
        const g = m ? `${m.d || ''}|${m.s || ''}` : '';
        (stamps[g] = stamps[g] || []).push(key.replace('|shrine|', '|s|').replace('|castle|', '|c|'));
    });
    return { app: BACKUP_APP, v: 1, at: new Date().toISOString(), stamps, store };
}
function unpackStamps(p) {
    const keys = new Set(), meta = {};
    Object.entries(p.stamps || {}).forEach(([g, list]) => {
        const [d, s] = g.split('|');
        list.forEach(k => {
            const key = k.replace('|s|', '|shrine|').replace('|c|', '|castle|');
            keys.add(key);
            if (d) meta[key] = s ? { d, s } : { d };
        });
    });
    return { keys, meta };
}
const b64url = bytes => btoa(Array.from(bytes, c => String.fromCharCode(c)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function streamBytes(bytes, stream) {
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
// 移轉碼：SK1. ＋壓縮後的 JSON（瀏覽器不支援壓縮時用 SK0. 不壓縮）
async function encodeTransfer(p) {
    const raw = new TextEncoder().encode(JSON.stringify(p));
    if (typeof CompressionStream === 'undefined') return 'SK0.' + b64url(raw);
    return 'SK1.' + b64url(await streamBytes(raw, new CompressionStream('deflate-raw')));
}
async function decodeTransfer(code) {
    code = code.trim().replace(/\s+/g, '');
    const m = code.match(/#import=(.+)$/);
    if (m) code = decodeURIComponent(m[1]);
    const [ver, body] = code.split('.');
    let bytes = unb64url(body || '');
    if (ver === 'SK1') bytes = await streamBytes(bytes, new DecompressionStream('deflate-raw'));
    else if (ver !== 'SK0') throw new Error('不是這個網站的移轉碼');
    return JSON.parse(new TextDecoder().decode(bytes));
}

// ---------- 摘要 ----------
function backupSummary(keys, store) {
    const n = { shrine: 0, castle: 0 };
    keys.forEach(k => { const t = k.split('|')[1]; if (n[t] !== undefined) n[t]++; });
    const dogDone = parseInt((store && store[DOG_KEY]) || '0', 10) || 0;
    return `⛩️ 御朱印 ${n.shrine} 枚・🏯 御城印 ${n.castle} 枚・🐕 代參 ${dogDone} 次`;
}
function daysAgo(iso) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d <= 0 ? '今天' : `${d} 天前`;
}
function lastBackupText() {
    let at = null;
    try { at = localStorage.getItem(BACKUP_AT_KEY); } catch (e) {}
    return at ? `上次備份：${daysAgo(at)}` : '還沒有備份過';
}
function markBackedUp() {
    try { localStorage.setItem(BACKUP_AT_KEY, new Date().toISOString()); } catch (e) {}
    renderBackupStatus();
}

// ---------- 請瀏覽器不要自動清掉這個網站的資料 ----------
async function requestPersist() {
    try {
        if (!navigator.storage || !navigator.storage.persist) return null;
        if (await navigator.storage.persisted()) return true;
        return await navigator.storage.persist();
    } catch (e) { return null; }
}

// ---------- 視窗 ----------
function ensureBackupModal() {
    let m = document.getElementById('backup-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'backup-modal';
    m.className = 'fixed inset-0 z-[65] bg-stone-950/60 backdrop-blur-sm hidden items-center justify-center p-4';
    m.addEventListener('click', e => { if (e.target === m) closeBackupModal(); });
    m.innerHTML = `
        <div class="cream-card rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-stone-300 space-y-4">
            <div class="flex items-center justify-between border-b border-stone-200 pb-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg">💾</span>
                    <div>
                        <h3 class="text-lg font-serif-jp font-black text-stone-900">備份與移轉</h3>
                        <p class="text-xs text-stone-500">紀錄只存在這個瀏覽器裡。換手機、換電腦前，先在這裡備份。</p>
                    </div>
                </div>
                <button onclick="closeBackupModal()" class="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold">✕</button>
            </div>
            <div id="backup-status" class="rounded-2xl bg-white border border-stone-200 p-3 text-xs text-stone-600 space-y-1"></div>
            <div class="grid sm:grid-cols-2 gap-3">
                <div class="rounded-2xl bg-white border border-stone-200 p-4 space-y-2.5">
                    <div class="text-sm font-black text-stone-900">📤 帶走這台的紀錄</div>
                    <button onclick="backupDownload()" class="w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-white text-xs font-black">📥 下載備份檔</button>
                    <button onclick="backupCopyCode()" class="w-full py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-black">📋 複製移轉碼</button>
                    <div id="backup-qr" class="pt-1 text-center"></div>
                </div>
                <div class="rounded-2xl bg-white border border-stone-200 p-4 space-y-2.5">
                    <div class="text-sm font-black text-stone-900">📥 搬進別台的紀錄</div>
                    <label class="block w-full py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-black text-center cursor-pointer">
                        📂 選擇備份檔<input type="file" accept=".json,application/json" class="hidden" onchange="backupReadFile(this)">
                    </label>
                    <textarea id="backup-code-in" rows="3" placeholder="或在這裡貼上移轉碼" class="w-full rounded-xl border border-stone-300 bg-stone-50 p-2 text-[11px] font-mono text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300"></textarea>
                    <button onclick="backupReadCode()" class="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black">讀取移轉碼</button>
                    <div id="backup-preview"></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(m);
    return m;
}
async function openBackupModal() {
    const m = ensureBackupModal();
    backupPending = null;
    document.getElementById('backup-preview').innerHTML = '';
    document.getElementById('backup-code-in').value = '';
    m.classList.remove('hidden');
    m.classList.add('flex');
    renderBackupStatus();
    renderBackupQR();
}
function closeBackupModal() {
    const m = document.getElementById('backup-modal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
}
async function renderBackupStatus() {
    const box = document.getElementById('backup-status');
    if (!box) return;
    const keys = new Set(stampedSites);
    const store = {}; try { store[DOG_KEY] = localStorage.getItem(DOG_KEY); } catch (e) {}
    const persisted = await requestPersist();
    box.innerHTML = `
        <div class="font-black text-stone-900">這台裝置的紀錄：${backupSummary(keys, store)}</div>
        <div>${lastBackupText()}</div>
        <div>${persisted === true ? '✅ 這個瀏覽器已同意保留這個網站的資料，比較不會被自動清掉。' : '⚠️ 這個瀏覽器沒有保證保留資料（iPhone／Mac 的 Safari 超過 7 天沒打開可能會清掉），建議定期備份。'}</div>`;
}
async function renderBackupQR() {
    const box = document.getElementById('backup-qr');
    if (!box) return;
    if (!stampedSites.size) { box.innerHTML = '<p class="text-[11px] text-stone-400">還沒有任何紀錄可以搬。</p>'; return; }
    try {
        const code = await encodeTransfer(backupPayload());
        const url = `${location.origin}${location.pathname}#import=${code}`;
        if (url.length > QR_MAX_URL || !window.QRCode) {
            box.innerHTML = '<p class="text-[11px] text-stone-500 leading-relaxed">紀錄太多，QR code 放不下。請改用「複製移轉碼」或「下載備份檔」。</p>';
            return;
        }
        const img = await window.QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 1, width: 260, color: { dark: '#1c1917', light: '#ffffff' } });
        // 本機開發（localhost）的網址，手機掃了也連不到
        const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
        box.innerHTML = `<img src="${img}" alt="移轉用 QR code" class="mx-auto w-40 h-40 rounded-lg border border-stone-200"><p class="mt-1 text-[11px] text-stone-500 leading-relaxed">用另一支手機的相機掃描，會打開這個網站並帶入紀錄。</p>${local ? '<p class="text-[10px] text-amber-700">（現在是本機預覽，手機連不到；放上 GitHub Pages 後才掃得到）</p>' : ''}`;
    } catch (e) {
        box.innerHTML = '<p class="text-[11px] text-stone-500">這個瀏覽器做不出 QR code，請改用移轉碼。</p>';
    }
}

// ---------- 匯出 ----------
function backupDownload() {
    const p = backupPayload();
    const blob = new Blob([JSON.stringify(p, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `令制國探索島-御朱印帳備份-${p.at.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    markBackedUp();
    showToast('📥 已下載備份檔，請收好');
}
async function backupCopyCode() {
    const code = await encodeTransfer(backupPayload());
    try {
        await navigator.clipboard.writeText(code);
        showToast('📋 已複製移轉碼，可以貼到 LINE 或記事本');
    } catch (e) {
        // 剪貼簿被擋時，放進輸入框讓使用者自己複製
        const ta = document.getElementById('backup-code-in');
        ta.value = code;
        ta.select();
        showToast('請按 ⌘C／Ctrl+C 複製輸入框裡的移轉碼');
    }
    markBackedUp();
}

// ---------- 匯入 ----------
function backupReadFile(input) {
    const f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    f.text().then(t => backupPreview(JSON.parse(t))).catch(() => backupError('讀不懂這個檔案，請確認是這個網站下載的備份檔。'));
}
async function backupReadCode() {
    const v = document.getElementById('backup-code-in').value;
    if (!v.trim()) return backupError('請先貼上移轉碼。');
    try { backupPreview(await decodeTransfer(v)); }
    catch (e) { backupError('讀不懂這串移轉碼，請確認有完整複製（開頭是 SK1.）。'); }
}
function backupError(msg) {
    backupPending = null;
    const box = document.getElementById('backup-preview');
    if (box) box.innerHTML = `<p class="text-xs font-bold text-red-700">${msg}</p>`;
}
function backupPreview(p) {
    if (!p || p.app !== BACKUP_APP) return backupError('這不是這個網站的備份。');
    const { keys } = unpackStamps(p);
    backupPending = p;
    document.getElementById('backup-preview').innerHTML = `
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
            <div class="text-xs font-black text-amber-900">備份內容（${p.at ? p.at.slice(0, 10) : '日期不明'}）</div>
            <div class="text-xs text-stone-700">${backupSummary(keys, p.store)}</div>
            <button onclick="backupApply('merge')" class="w-full py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-black">合併到這台的紀錄（兩邊的印都留下）</button>
            <button onclick="backupApply('replace')" class="w-full py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold">用備份取代這台的紀錄</button>
        </div>`;
}
function backupApply(mode) {
    const p = backupPending;
    if (!p) return;
    if (mode === 'replace' && !confirm('這台裝置目前的紀錄會被備份整個取代，確定嗎？')) return;
    const { keys, meta } = unpackStamps(p);
    const store = p.store || {};
    const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const set = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
    if (mode === 'replace') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('shinkoku_') && k !== BACKUP_AT_KEY) localStorage.removeItem(k);
        }
        Object.entries(store).forEach(([k, v]) => set(k, v));
        set(SITE_STAMP_KEY, JSON.stringify([...keys]));
        set(STAMP_META_KEY, JSON.stringify(meta));
    } else {
        // 合併：印取聯集、拜領日期留較早的；代參次數取多的、評等取好的；其他設定這台沒有才帶入
        const mine = new Set(JSON.parse(get(SITE_STAMP_KEY) || '[]'));
        const myMeta = JSON.parse(get(STAMP_META_KEY) || '{}');
        keys.forEach(k => mine.add(k));
        Object.entries(meta).forEach(([k, m]) => { if (!myMeta[k] || (m.d && m.d < (myMeta[k].d || '9'))) myMeta[k] = m; });
        set(SITE_STAMP_KEY, JSON.stringify([...mine]));
        set(STAMP_META_KEY, JSON.stringify(myMeta));
        Object.entries(store).forEach(([k, v]) => {
            if (k === DOG_KEY) set(k, String(Math.max(parseInt(get(k) || '0', 10) || 0, parseInt(v || '0', 10) || 0)));
            else if (k === DOG_GRADE_KEY) {
                const a = JSON.parse(get(k) || '{}'), b = JSON.parse(v || '{}');
                Object.keys(b).forEach(d => { a[d] = Math.max(a[d] || 0, b[d]); });
                set(k, JSON.stringify(a));
            } else if (get(k) === null) set(k, v);
        });
    }
    showToast(mode === 'replace' ? '已用備份取代紀錄，重新載入中…' : '已合併紀錄，重新載入中…');
    setTimeout(() => location.reload(), 900);
}

// ---------- 掃 QR code 打開網站時，自動帶入 ----------
async function checkHashImport() {
    const m = location.hash.match(/^#import=(.+)$/);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);   // 網址列不留紀錄
    try {
        const p = await decodeTransfer(decodeURIComponent(m[1]));
        await openBackupModal();
        backupPreview(p);
        showToast('📲 收到移轉的紀錄，請選擇合併或取代');
    } catch (e) {
        showToast('移轉的網址不完整，請重新掃描或改用移轉碼');
    }
}
window.addEventListener('load', () => setTimeout(checkHashImport, 1200));

// ---------- 備份提醒：蓋了 5 枚以上、超過兩週沒備份，每次開網頁最多提醒一次 ----------
function maybeNudgeBackup() {
    if (backupNudged || stampedSites.size < 5) return;
    let at = null;
    try { at = localStorage.getItem(BACKUP_AT_KEY); } catch (e) {}
    if (at && Date.now() - new Date(at).getTime() < 14 * 86400000) return;
    backupNudged = true;
    setTimeout(() => showToast('💾 已經蓋了不少印，記得到御朱印帳「備份與移轉」存一份'), 3600);
}
