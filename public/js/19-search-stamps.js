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
    if (stamped) return `<span class="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black ${isShrine ? 'bg-red-700 text-white' : 'bg-stone-900 text-white'}">${isShrine ? '💮 已領取御朱印' : '🏯 已領取御城印'}<span class="font-bold opacity-70">（再點一下取消）</span></span>`;
    return `<span class="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black border-2 border-dashed ${isShrine ? 'border-red-300 text-red-700 hover:bg-red-100/60' : 'border-amber-400 text-amber-900 hover:bg-amber-100/60'} transition">${isShrine ? '⛩️ 領取御朱印' : '🏯 領取御城印'}</span>`;
}
function refreshSiteStampButtons(prov) {
    const st = getSites(prov);
    ['shrine', 'castle'].forEach(type => (type === 'shrine' ? st.shrines : st.castles).forEach((s, i) => {
        const el = document.getElementById(`stamp-${type}-${i}`);
        if (el) el.innerHTML = siteStampButtonHTML(type, stampedSites.has(siteStampKey(prov.id, type, s)));
    }));
}
function toggleSiteStamp(provId, type, idx) {
    const prov = getProv(provId);
    const site = getSites(prov)[type === 'shrine' ? 'shrines' : 'castles'][idx];
    const key = siteStampKey(provId, type, site);
    const label = type === 'shrine' ? '御朱印' : '御城印';
    if (stampedSites.has(key)) {
        stampedSites.delete(key);
        showToast(`已取消 ${site.short} 的${label}`);
    } else {
        stampedSites.add(key);
        showToast(`${type === 'shrine' ? '💮' : '🏯'} 領取了 ${site.short} 的${label}！`);
    }
    saveStamps();
    refreshSiteStampButtons(prov);
    updateStampButton();
    refreshStampMarks();
    renderIndexList();
    if (!document.getElementById('goshuin-modal').classList.contains('hidden')) renderGoshuinGrid();
}

// 御朱印帳：分「神社御朱印」與「城郭御城印」兩冊
let goshuinTab = 'shrine';
function switchGoshuinTab(type) {
    goshuinTab = type;
    renderGoshuinGrid();
}
function stampSeal(type, site, prov) {
    // 御朱印：朱紅方印＋墨書社名；御城印：墨書城名＋朱印、和紙底
    const name = site.short.replace(/\s/g, '');
    const vertical = name.length <= 6 ? name.split('').join('<br>') : name;
    if (type === 'shrine') return `
        <div class="relative w-full aspect-[3/4] rounded-lg bg-[#fbf6ea] border border-stone-200 flex items-center justify-center overflow-hidden">
            <span class="absolute top-1.5 right-2 text-[9px] font-serif-jp text-stone-500 [writing-mode:vertical-rl]">奉拜</span>
            <span class="absolute w-14 h-14 rounded-md border-[3px] border-red-600/80 rotate-6 flex items-center justify-center text-red-600/80 font-serif-jp font-black text-[10px] leading-tight text-center">${shortOldName(prov).replace('國', '')}<br>${site.r && site.r !== '一之宮' ? '名社' : '一宮'}</span>
            <span class="relative font-serif-jp font-black text-stone-900 text-base leading-tight text-center ${name.length > 6 ? 'text-xs px-1' : ''}">${vertical}</span>
            <span class="absolute bottom-1.5 left-2 text-[8px] font-serif-jp text-stone-500 [writing-mode:vertical-rl]">令和八年</span>
        </div>`;
    return `
        <div class="relative w-full aspect-[3/4] rounded-lg bg-[#f4ecd8] border-2 border-stone-700/70 flex items-center justify-center overflow-hidden">
            <span class="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest text-stone-600">登城記念</span>
            <span class="relative font-serif-jp font-black text-stone-900 text-base leading-tight text-center ${name.length > 6 ? 'text-xs px-1' : ''}">${vertical}</span>
            <span class="absolute bottom-2 right-2 w-9 h-9 border-2 border-red-600/80 text-red-600/80 font-serif-jp font-black text-[8px] leading-tight flex items-center justify-center text-center -rotate-6">${(site.l || '').split(/[、・（]/)[0].slice(0, 4) || '城主'}</span>
            <span class="absolute bottom-1.5 left-2 text-[8px] font-serif-jp text-stone-500">${shortOldName(prov)}</span>
        </div>`;
}
function renderGoshuinGrid() {
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
                ${stamped ? stampSeal(type, site, prov) : `<div class="w-full aspect-[3/4] rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-300"><span class="text-2xl">${type === 'shrine' ? '⛩️' : '🏯'}</span><span class="text-[10px] font-bold">未領取</span></div>`}
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
