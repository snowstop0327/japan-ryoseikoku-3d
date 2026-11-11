// 搜尋、御朱印帳、彈窗
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 9. SEARCH, STAMPS, MODALS & TOAST
 ***********************************************************************/
function clearSearch() {
    const input = document.getElementById('search-input');
    input.value = '';
    searchQuery = '';
    document.getElementById('clear-search-btn').classList.add('hidden');
    renderIndexList();
}

function refreshStampMarks() {
    PROVINCES_DATA.forEach(p => {
        const info = provinceNodeMap.get(p.id);
        if (info) info.stampEl.classList.toggle('hidden', !stampedProvinces.has(p.id));
    });
}

// 介紹卡底部：本國的收集進度＋打開御朱印帳
function updateStampButton() {
    const btn = document.getElementById('dc-stamp-btn');
    const txt = document.getElementById('dc-stamp-text');
    if (!selectedProvinceId) return;
    const prov = getProv(selectedProvinceId), st = getSites(prov);
    const got = (type, list) => list.filter(s => stampedSites.has(siteStampKey(prov.id, type, s))).length;
    const a = got('shrine', st.shrines), b = got('castle', st.castles);
    const all = a === st.shrines.length && b === st.castles.length;
    btn.className = 'flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 text-white ' +
        (all ? 'bg-red-700 hover:bg-red-600' : 'bg-stone-900 hover:bg-stone-700');
    txt.textContent = `打開御朱印帳（本國 ⛩️ ${a}/${st.shrines.length}・🏯 ${b}/${st.castles.length}）`;
}
function toggleCurrentStamp() {
    openGoshuinModal(currentDetailTab === 'castle' ? 'castle' : 'shrine');
}

function siteStampButtonHTML(type, stamped) {
    const isShrine = type === 'shrine';
    if (stamped) return `<span class="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black ${isShrine ? 'bg-red-700 text-white' : 'bg-stone-900 text-white'}">${isShrine ? '💮 已拜領御朱印' : '🏯 已拜領御城印'}<span class="font-bold opacity-70">（看御朱印帳）</span></span>`;
    return `<span class="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black border-2 border-dashed ${isShrine ? 'border-red-300 text-red-700 hover:bg-red-100/60' : 'border-amber-400 text-amber-900 hover:bg-amber-100/60'} transition">${isShrine ? '⛩️ 前往參拜・拜領御朱印' : '🏯 登城・拜領御城印'}</span>`;
}
function refreshSiteStampButtons(prov) {
    const st = getSites(prov);
    ['shrine', 'castle'].forEach(type => (type === 'shrine' ? st.shrines : st.castles).forEach((s, i) => {
        const el = document.getElementById(`stamp-${type}-${i}`);
        if (el) el.innerHTML = siteStampButtonHTML(type, stampedSites.has(siteStampKey(prov.id, type, s)));
    }));
}
// 介紹卡的按鈕：還沒拜領就前往參拜（見 19b-visit.js），拜領過就打開御朱印帳
function toggleSiteStamp(provId, type, idx) {
    const prov = getProv(provId);
    const site = getSites(prov)[type === 'shrine' ? 'shrines' : 'castles'][idx];
    if (stampedSites.has(siteStampKey(provId, type, site))) openGoshuinModal(type);
    else startVisit(provId, type, idx);
}

// 御朱印帳：分「神社御朱印」與「城郭御城印」兩冊
let goshuinTab = 'shrine';
function switchGoshuinTab(type) {
    goshuinTab = type;
    goshuinSpread = 0;
    renderGoshuinGrid();
}
// 日期 → 「令和八年十一月十日」
function reiwaDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const K = '〇一二三四五六七八九';
    const num = n => n < 10 ? K[n] : n < 20 ? '十' + (n % 10 ? K[n % 10] : '') : K[Math.floor(n / 10)] + '十' + (n % 10 ? K[n % 10] : '');
    const ry = y - 2018;
    return `令和${ry === 1 ? '元' : num(ry)}年${num(m)}月${num(d)}日`;
}
const SEASON_SEAL = { spring: '春詣', summer: '夏詣', autumn: '秋詣', winter: '冬詣' };
// 一枚御朱印／御城印的版面（尺寸全用容器寬度換算，格子裡的小圖和蓋印時的大圖共用）
//   御朱印：右上「奉拜」、中央墨書社名、朱色神紋＋國名方印、左下日期、左上季節印
//   御城印：上方「登城記念」、中央朱色家紋＋墨書城名、右下城主方印、左下日期
function goshuinFace(type, site, prov, meta) {
    const name = site.short.replace(/\s/g, '');
    const mon = SITE_MON[prov.id + '|' + site.short];
    const crest = mon ? `<span class="gs-mon gs-seal" style="-webkit-mask-image:url(kamon/${mon}.png);mask-image:url(kamon/${mon}.png)"></span>` : '';
    const date = meta && meta.d ? reiwaDate(meta.d) : '';
    const season = meta && meta.s ? `<span class="gs-season gs-seal">${SEASON_SEAL[meta.s]}</span>` : '';
    const size = name.length <= 3 ? 2.6 : name.length <= 4 ? 2.2 : name.length <= 6 ? 1.7 : name.length <= 9 ? 1.3 : 1.0;
    if (type === 'shrine') return `
        <div class="gs-face gs-shrine ${mon ? 'has-mon' : ''}"><div class="gs-in">
            <span class="gs-hohai gs-ink">奉拜</span>
            ${season}
            ${crest}
            <span class="gs-square gs-seal">${shortOldName(prov).replace(/國$/, '')}<br>國</span>
            <span class="gs-name gs-ink" style="font-size:${size}em">${name}</span>
            <span class="gs-date gs-ink">${date}</span>
        </div></div>`;
    // 方印：有家紋就寫同一家的家名，否則取第一位城主
    const lord = SITE_HOUSE[prov.id + '|' + site.short] || (site.l || '').split(/[、・／\/（(]/)[0].trim().slice(0, 4);
    return `
        <div class="gs-face gs-castle ${mon ? 'has-mon' : ''}"><div class="gs-in">
            <span class="gs-tojo gs-ink">登城記念</span>
            ${crest}
            <span class="gs-name gs-ink" style="font-size:${size}em">${name}</span>
            <span class="gs-lord gs-seal">${lord || '登城'}</span>
            <span class="gs-date gs-ink">${date}</span>
            <span class="gs-prov gs-ink">${shortOldName(prov)}</span>
        </div></div>`;
}
// 一覽：全部神社／城的格子（總繪製 renderGoshuinGrid 在 19c-goshuin-book.js）
function renderGoshuinList() {
    const type = goshuinTab;
    ['shrine', 'castle'].forEach(k => {
        const b = document.getElementById('gs-tab-' + k);
        if (b) b.className = 'px-4 py-2 rounded-2xl text-sm font-black transition flex items-center gap-2 ' +
            (k === type ? (k === 'shrine' ? 'bg-red-700 text-white shadow' : 'bg-stone-900 text-white shadow') : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50');
    });
    const n = stampCounts(type);
    document.getElementById('goshuin-progress-label').textContent = type === 'shrine'
        ? `神社御朱印：已收集 ${n.got} / ${n.total} 枚（一之宮＋名社）`
        : `城郭御城印：已收集 ${n.got} / ${n.total} 枚`;
    let html = '', lastRegion = null;
    allStampSites(type).forEach(({ prov, site, idx, key }) => {
        if (prov.region !== lastRegion) {
            lastRegion = prov.region;
            const r = getRegion(prov.region);
            html += `<div class="col-span-full pt-2 text-[11px] font-black tracking-wider" style="color:${r.color}">${r.name}</div>`;
        }
        const stamped = stampedSites.has(key);
        html += `
            <button onclick="closeGoshuinModal(); focusSite('${prov.id}', '${type}', ${idx})" class="text-left p-2 rounded-2xl border-2 transition ${stamped ? (type === 'shrine' ? 'border-red-300 bg-red-50/70' : 'border-stone-400 bg-amber-50/70') : 'border-dashed border-stone-300 bg-white/50 hover:border-orange-300'}">
                ${stamped ? goshuinFace(type, site, prov, stampMeta[key]) : `<div class="w-full aspect-[3/4] rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-300"><span class="text-2xl">${type === 'shrine' ? '⛩️' : '🏯'}</span><span class="text-[10px] font-bold">未領取</span></div>`}
                <div class="mt-1.5 text-[11px] font-black text-stone-800 truncate">${site.short}</div>
                <div class="text-[10px] text-stone-400 truncate">${shortOldName(prov)}${type === 'shrine' && site.r ? '・' + site.r : ''}</div>
            </button>`;
    });
    document.getElementById('goshuin-grid').innerHTML = html;
}

function showModal(id) {
    const m = document.getElementById(id);
    m.classList.remove('hidden');
    m.classList.add('flex');
}
function hideModal(id) {
    const m = document.getElementById(id);
    m.classList.add('hidden');
    m.classList.remove('flex');
}
function openGoshuinModal(type) {
    if (type === 'shrine' || type === 'castle') goshuinTab = type;
    renderGoshuinGrid();
    showModal('goshuin-modal');
}
function closeGoshuinModal() {
    hideModal('goshuin-modal');
}
function openSourceModal() {
    showModal('source-modal');
}
function closeSourceModal() {
    hideModal('source-modal');
}

function clearAllStamps() {
    if (!confirm('確定要清除所有巡拜紀錄嗎？')) return;
    stampedSites.clear();
    saveStamps();
    if (selectedProvinceId) refreshSiteStampButtons(getProv(selectedProvinceId));
    refreshStampMarks();
    renderGoshuinGrid();
    renderIndexList();
    updateStampButton();
    showToast('已重置所有巡拜紀錄');
}

let toastTimer = null;
function showToast(text) {
    const box = document.getElementById('toast-box');
    document.getElementById('toast-text').textContent = text;
    box.classList.remove('opacity-0', 'translate-y-3');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.add('opacity-0', 'translate-y-3'), 2200);
}
