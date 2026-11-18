// 名山・湖泊・河川的介紹卡
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 點地圖上的山、湖、河名牌（▲ ◍ 〰）打開介紹卡：
 *   讀音＋🔊、規模、所在、實景照片、山岳信仰、相關神社與城（點了帶過去）
 *   資料在 02d-geo-places.js
 ***********************************************************************/
let geoCardName = null;
const GEO_TYPE_LABEL = { mountain: ['⛰️', '名山・山脈', 'bg-emerald-100 text-emerald-800 border-emerald-300'], lake: ['💧', '湖泊', 'bg-sky-100 text-sky-800 border-sky-300'], river: ['🌊', '河川', 'bg-sky-100 text-sky-800 border-sky-300'] };

function openGeoCard(name) {
    const g = GEO_INFO[name], lbl = GEO_LABELS.find(x => x.name === name);
    if (!g || !lbl) return;
    if (typeof visit !== 'undefined' && visit) return;
    ['left-detail-card', 'traveler-card', 'pref-card'].forEach(id => setCardVisible(id, false));
    travelerCardOpen = false;
    hideWalkerCardOnly();
    geoCardName = name;
    renderGeoCard(name, lbl);
    setCardVisible('geo-card', true);
    document.getElementById('geo-card-scroll').scrollTop = 0;
    // 鏡頭飛過去：依山的高度拉遠，整座山才放得進畫面；湖和河從斜上方俯瞰
    const top = lbl.type === 'mountain' ? Math.max(0, lbl.y - NODE_Y) : 0;
    const up = 2.2 + top * 1.6, back = 2.8 + top * 2.2;
    flyCamera(new THREE.Vector3(lbl.x - 0.35, NODE_Y + up, lbl.z + back), new THREE.Vector3(lbl.x - 0.35, NODE_Y + 0.25, lbl.z));
    GEO_LABELS.forEach(x => x.el && x.el.classList.toggle('geo-active', x.name === name));
}
function closeGeoCard() {
    setCardVisible('geo-card', false);
    geoCardName = null;
    GEO_LABELS.forEach(x => x.el && x.el.classList.remove('geo-active'));
}

function renderGeoCard(name, lbl) {
    const g = GEO_INFO[name];
    const [icon, typeName, chip] = GEO_TYPE_LABEL[lbl.type] || GEO_TYPE_LABEL.mountain;
    // 相關神社・城：找出在介紹卡裡的位置，做成按鈕
    const links = (g.links || []).map(([provId, type, short]) => {
        const prov = getProv(provId);
        if (!prov) return '';
        const list = getSites(prov)[type === 'shrine' ? 'shrines' : 'castles'];
        const idx = list.findIndex(s => s.short === short);
        if (idx < 0) return '';
        return `<button onclick="focusSite('${provId}', '${type}', ${idx})" class="px-2.5 py-1.5 rounded-xl border text-left transition ${type === 'shrine' ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'}">
            <div class="text-xs font-black text-stone-900">${type === 'shrine' ? '⛩️' : '🏯'} ${short}</div>
            <div class="text-[10px] text-stone-500">${shortOldName(prov)}</div>
        </button>`;
    }).join('');
    document.getElementById('geo-body').innerHTML = `
        <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
                <span class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-black ${chip}">${icon} ${typeName}</span>
                <h2 class="mt-1.5 text-2xl font-serif-jp font-black text-stone-900 leading-tight">${name}</h2>
                <div class="flex items-center gap-1.5 mt-0.5">
                    <button onclick="speakJa('${g.k}', this)" class="speak-btn" title="用日文唸出來">🔊</button>
                    <span class="text-sm font-bold text-stone-600">${g.k}</span>
                    <span class="text-[11px] font-semibold text-stone-400 italic">${g.r}</span>
                </div>
            </div>
            <button onclick="closeGeoCard()" class="w-8 h-8 rounded-full hover:bg-stone-200/80 text-stone-700 flex items-center justify-center text-base font-bold transition shrink-0" title="關閉">✕</button>
        </div>
        <div class="flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span class="px-2 py-0.5 rounded-lg bg-stone-900 text-white">${g.stat}</span>
            <span class="px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-stone-600">📍 ${g.where}</span>
        </div>
        <div id="geo-photo" class="relative aspect-[16/10] rounded-2xl overflow-hidden bg-stone-200/70 animate-pulse"></div>
        ${g.faith ? `
        <div class="rounded-2xl bg-red-50/80 border border-red-200 p-3">
            <div class="text-[11px] font-black text-red-700 mb-1">⛩️ 信仰</div>
            <p class="text-xs text-stone-800 leading-relaxed">${g.faith}</p>
        </div>` : ''}
        <p class="text-xs text-stone-700 leading-relaxed bg-white/80 p-3 rounded-2xl border border-stone-200">${g.desc}</p>
        ${(g.tags || []).length ? `<div class="flex flex-wrap gap-1">${g.tags.map(t => `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">#${t}</span>`).join('')}</div>` : ''}
        ${links ? `
        <div>
            <div class="text-[11px] font-black text-stone-500 mb-1.5">相關的神社・城（點了帶你過去）</div>
            <div class="grid grid-cols-2 gap-1.5">${links}</div>
        </div>` : ''}`;
    loadGeoPhoto(name);
}

function loadGeoPhoto(name) {
    const g = GEO_INFO[name], box = document.getElementById('geo-photo');
    const done = html => { box.classList.remove('animate-pulse', 'bg-stone-200/70'); box.innerHTML = html; };
    const none = () => done(`<div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-stone-400 bg-stone-100">維基百科暫時沒有照片</div>`);
    wikiPhotos([g.w])[0].then(info => {
        if (!box.isConnected || geoCardName !== name) return;
        if (!info || !info.src) return none();
        const img = new Image();
        img.onload = () => done(`
            <img src="${info.src}" alt="${name} 實景照片" class="w-full h-full object-cover">
            <div class="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between gap-2 text-[10px] text-white/90 font-bold">
                <span>📷 照片：<a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(info.file || '')}" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">Wikimedia Commons</a></span>
                <a href="https://ja.wikipedia.org/wiki/${encodeURIComponent(info.title)}" target="_blank" rel="noopener noreferrer" class="underline hover:text-white shrink-0">維基百科 ↗</a>
            </div>`);
        img.onerror = none;
        img.src = info.src;
    }).catch(none);
}
