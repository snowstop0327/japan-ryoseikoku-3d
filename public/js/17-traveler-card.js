// 旅人介紹卡
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 7b. TRAVELER CARD（旅人介紹卡）
 ***********************************************************************/
let travelerCardOpen = false;
let lastTravelerCardTick = -1;

// 左側兩張卡片（令制國介紹／旅人介紹）統一由此切換顯示，避免顯示與隱藏的 class 同時存在而互相打架
function setCardVisible(id, visible) {
    const card = document.getElementById(id);
    card.classList.remove('translate-x-0', 'opacity-100');
    card.classList.toggle('-translate-x-[120%]', !visible);
    card.classList.toggle('opacity-0', !visible);
    card.classList.toggle('pointer-events-none', !visible);
    if (visible && id !== 'dog-card') {
        const dc = document.getElementById('dog-card');
        if (dc && !dc.classList.contains('opacity-0')) closeDogCard();
    }
}

function openTravelerCard() {
    setCardVisible('left-detail-card', false);
    setCardVisible('pref-card', false);
    hideWalkerCardOnly();
    setCardVisible('traveler-card', true);
    travelerCardOpen = true;
    renderTravelerCard();
    // 鏡頭靠近旅人
    const p = avatarGroup.position;
    flyCamera(new THREE.Vector3(p.x - 0.4, p.y + 1.3, p.z + 1.8), new THREE.Vector3(p.x - 0.4, p.y + 0.1, p.z));
}

function hideTravelerCard() {
    travelerCardOpen = false;
    setCardVisible('traveler-card', false);
}

function closeTravelerCard() {
    hideTravelerCard();
    if (selectedProvinceId) setCardVisible('left-detail-card', true);
}

function onTravelerArrived() {
    traveler.arrived = true;
    traveler.at = traveler.to;
    if (traveler.footprints[traveler.footprints.length - 1] !== traveler.at) {
        traveler.footprints.push(traveler.at);
        if (traveler.footprints.length > 8) traveler.footprints.shift();
    }
    if (travelerCardOpen) renderTravelerCard();
}

function travelerQuote(prov) {
    const virtue = getSites(prov).shrines[0].v.split('・')[0];
    const sight = prov.geoFeature.split('・')[0];
    return `「今日來到${shortOldName(prov)}，先往${ichiNames(prov)}參拜，祈求${virtue}；再眺望${sight}，遙想數百年後將在此築起的${siteNames(prov, 'castle')}。」`;
}

function updateTravelerLive() {
    const to = getProv(traveler.to);
    const walking = !traveler.arrived;
    const dist = avatarGroup.position.distanceTo(avatarTargetPos);
    const pct = walking ? Math.max(0, Math.min(1, 1 - dist / traveler.startDist)) : 1;
    document.getElementById('tc-progress').style.width = (pct * 100).toFixed(0) + '%';
    document.getElementById('tc-progress-label').textContent = walking ? `前往途中 ${(pct * 100).toFixed(0)}%` : '已抵達';
    document.getElementById('tc-doing').textContent = walking ? '趕路' : '巡拜';
    document.getElementById('tc-status').textContent = walking
        ? `正在前往 ${shortOldName(to)}（${ichiNames(to)}）`
        : `已抵達 ${shortOldName(to)}，正在參拜 ${ichiNames(to)}`;
    document.getElementById('tc-status-dot').className = 'w-2 h-2 rounded-full shrink-0 ' + (walking ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500');
}

function renderTravelerCard() {
    if (traveler.portrait) document.getElementById('tc-portrait').src = traveler.portrait;
    const odef = OUTFIT_TYPES[traveler.outfit.type];
    document.getElementById('tc-tag-era').textContent = odef.tags[0];
    document.getElementById('tc-tag-outfit').textContent = odef.tags[1];
    const cName = (WA_COLORS.find(cl => cl.hex === traveler.outfit.color) || {}).name;
    const pName = traveler.outfit.pattern !== 'plain' ? (WA_PATTERNS.find(pt => pt.id === traveler.outfit.pattern) || {}).name : '';
    document.getElementById('tc-costume').innerHTML =
        `<p class="text-[11px] font-bold text-orange-700">今日穿搭：${odef.name}${cName ? '・' + cName : ''}${pName ? '・' + pName + '紋' : ''}</p>` +
        odef.desc.map(([k, v]) => `<p><b class="text-stone-900">${k}</b>　${v}</p>`).join('');
    const to = getProv(traveler.to);
    const from = traveler.from ? getProv(traveler.from) : null;
    document.getElementById('tc-from').textContent = from ? shortOldName(from) : '平安京';
    document.getElementById('tc-to').textContent = shortOldName(to);
    document.getElementById('tc-stamps').textContent = `巡拜印 ${stampedProvinces.size} / ${PROVINCES_DATA.length}`;
    document.getElementById('tc-quote').textContent = travelerQuote(to);
    const fp = document.getElementById('tc-footprints');
    fp.innerHTML = '';
    traveler.footprints.slice().reverse().forEach((id, i) => {
        const p = getProv(id);
        const b = document.createElement('button');
        b.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold border transition ' +
            (i === 0 ? 'bg-orange-50 border-orange-300 text-orange-800' : 'bg-white border-stone-200 text-stone-600 hover:border-orange-300');
        b.textContent = (i === 0 ? '📍 ' : '') + shortOldName(p);
        b.onclick = () => selectProvince(id);
        fp.appendChild(b);
    });
    document.getElementById('tc-open-detail').onclick = () => selectProvince(traveler.to);
    updateTravelerLive();
}

function switchDetailTab(tab) {
    currentDetailTab = tab;
    const base = 'py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ';
    document.getElementById('tab-btn-shrine').className = base + (tab === 'shrine' ? 'bg-white text-red-700 shadow-sm' : 'text-stone-600 hover:text-stone-900');
    document.getElementById('tab-btn-castle').className = base + (tab === 'castle' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-600 hover:text-stone-900');
    document.getElementById('tab-panel-shrine').classList.toggle('hidden', tab !== 'shrine');
    document.getElementById('tab-panel-castle').classList.toggle('hidden', tab !== 'castle');
}

function focusRegion(regionId) {
    const r = getRegion(regionId);
    currentRegion = r.id;
    if (selectedPref) {
        selectedPref = null;
        setCardVisible('pref-card', false);
    }
    if (selectedProvinceId) {
        selectedProvinceId = null;
        setCardVisible('left-detail-card', false);
        if (selectionRing) selectionRing.visible = false;
    }
    refreshUI();
    flyCamera(new THREE.Vector3(r.cam.x, r.cam.y, r.cam.z), new THREE.Vector3(r.center.x, NODE_Y, r.center.z));
}

function focusCurrentRegion() {
    focusRegion(currentRegion);
}

function resetToAllRegions() {
    focusRegion('all');
}

function flyToRegionCenter(regionId) {
    if (regionId === 'tosando_north') {
        focusRegion('tosando');
        flyCamera(new THREE.Vector3(7.8, 13, 6.5), new THREE.Vector3(7.8, NODE_Y, -2.6));
        showToast('🧭 鏡頭移至東北奧羽');
        return;
    }
    focusRegion(regionId);
}

function flyToCustomCoord(x, z, label) {
    flyCamera(new THREE.Vector3(x, 11.5, z + 10.5), new THREE.Vector3(x, NODE_Y, z));
    if (label) showToast(`🧭 飛往 ${label}`);
}
