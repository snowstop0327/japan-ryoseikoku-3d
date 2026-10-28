// 工具列開關與視角控制
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 8. TOGGLES: TIME OF DAY, PREFECTURE NAMES, PINS, ROUTES
 ***********************************************************************/
const TIME_PRESETS = {
    dawn:  { bg: 0xe2b49c, fog: 0xe2b49c, water: 0x3a6f86, shallow: 0x7fa9b0, amb: 0.22, hemi: 0.4, dir: 0xffb98a, dirI: 1.1, lantern: 0.6, cloud: 0.12, exposure: 0.95 },
    day:   { bg: 0x86b4bb, fog: 0x86b4bb, water: 0x2f7d8a, shallow: 0x6fb5b0, amb: 0.24, hemi: 0.5, dir: 0xfff0d9, dirI: 1.25, lantern: 0.25, cloud: 0.18, exposure: 0.95 },
    night: { bg: 0x0f1b2c, fog: 0x0f1b2c, water: 0x15334a, shallow: 0x24505f, amb: 0.16, hemi: 0.24, dir: 0x9fb4ff, dirI: 0.38, lantern: 1.8, cloud: 0.0, exposure: 1.0 }
};

function setTimeOfDay(mode) {
    const p = TIME_PRESETS[mode];
    if (!p || !scene) return;
    scene.background.setHex(p.bg);
    scene.fog.color.setHex(p.fog);
    waterMesh.material.color.setHex(p.water);
    MATS.shallowWater.color.setHex(p.shallow);
    if (clouds[0]) clouds[0].children[0].material.emissiveIntensity = p.cloud;
    renderer.toneMappingExposure = p.exposure;
    ambientLight.intensity = p.amb;
    hemiLight.intensity = p.hemi;
    dirLight.color.setHex(p.dir);
    dirLight.intensity = p.dirI;
    MATS.lanternGlow.emissiveIntensity = p.lantern;
    document.body.style.backgroundColor = '#' + p.bg.toString(16).padStart(6, '0');
    ['dawn', 'day', 'night'].forEach(m => {
        document.getElementById('time-' + m).className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm transition ' +
            (m === mode ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-200/60');
    });
    currentTimeMode = mode;
    updateSceneNow();
}

function toggleModernPrefectureMode() {
    showModernPrefecture = !showModernPrefecture;
    document.querySelectorAll('.pref-switch').forEach(el => {
        el.dataset.on = showModernPrefecture ? 'true' : 'false';
        el.setAttribute('aria-checked', showModernPrefecture ? 'true' : 'false');
    });
    PROVINCES_DATA.forEach(p => {
        const info = provinceNodeMap.get(p.id);
        if (info) info.textEl.textContent = displayName(p);
    });
    // 換成另一種劃分方式：目前的道區／地方改用新模式下的對應區域
    if (selectedProvinceId) {
        currentRegion = provRegion(getProv(selectedProvinceId));
        fillDetailCard(getProv(selectedProvinceId));
    } else {
        currentRegion = 'all';
    }
    if (!showModernPrefecture && selectedPref) closePrefCard();
    refreshUI();
    showToast(showModernPrefecture ? '已切換為現代視角：八地方・都道府縣' : '已切換為古代視角：五畿七道・令制國');
}

function selectPrefecture(name) {
    const info = PREF_INFO[name];
    if (!info) return;
    selectedPref = name;
    selectedProvinceId = null;
    if (selectionRing) selectionRing.visible = false;
    currentRegion = info.region;
    setCardVisible('left-detail-card', false);
    hideTravelerCard();
    hideWalkerCardOnly();
    renderPrefCard(info);
    setCardVisible('pref-card', true);
    refreshUI();
    const k = info.spread;
    flyCamera(
        new THREE.Vector3(info.pos.x - 0.6, NODE_Y + 2.6 + k * 2.4, info.pos.z + 3.2 + k * 2.2),
        new THREE.Vector3(info.pos.x - 0.6, NODE_Y, info.pos.z)
    );
}

function closePrefCard() {
    setCardVisible('pref-card', false);
    selectedPref = null;
    refreshUI();
}

function renderPrefCard(info) {
    const region = getRegion(info.region);
    const pill = document.getElementById('pc-region-pill');
    pill.textContent = region.name;
    pill.style.backgroundColor = region.color;
    document.getElementById('pc-title').textContent = info.name;
    const prd = prefReading(info.name);
    document.getElementById('pc-kana').textContent = prd.kana;
    document.getElementById('pc-roma').textContent = prd.roma;
    const mainNames = info.provinces.map(id => shortOldName(getProv(id)));
    const partNames = info.partial.map(id => shortOldName(getProv(id)));
    document.getElementById('pc-summary').textContent = mainNames.length
        ? `在令制國時代，${info.name}的主要範圍屬於 ${mainNames.join('、')}${partNames.length ? `；另有部分地區屬於 ${partNames.join('、')}` : ''}。`
        : `${info.name}在令制國時代並沒有以它為主的國，範圍分屬 ${partNames.join('、')} 的一部分。`;
    const card = (id, partial) => {
        const p = getProv(id);
        const old = getRegion(p.region);
        const stamped = stampedProvinces.has(id);
        return `
            <button onclick="selectProvince('${id}')" class="w-full text-left p-3 rounded-2xl border bg-white/90 border-stone-200 hover:border-teal-400 hover:bg-white transition">
                <div class="flex items-center justify-between gap-2">
                    <span class="font-serif-jp font-black text-base text-stone-900">${shortOldName(p)}<span class="text-[11px] text-stone-500 font-sans font-bold ml-1.5">${provReading(p).kana}</span>${partial ? '<span class="text-[11px] text-stone-400 font-sans ml-1">（部分）</span>' : ''}</span>
                    <span class="flex items-center gap-1.5 shrink-0">
                        ${stamped ? '<span title="已巡拜">💮</span>' : ''}
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style="background:${old.color}">${old.shortName}</span>
                    </span>
                </div>
                <div class="text-[11px] text-stone-500 mt-1">今：${p.modernPref}</div>
                <div class="text-[11px] text-red-800 mt-1.5 truncate">⛩️ ${siteNames(p, 'shrine')}</div>
                <div class="text-[11px] text-amber-900 truncate">🏯 ${siteNames(p, 'castle')}</div>
            </button>`;
    };
    document.getElementById('pc-provinces').innerHTML =
        info.provinces.map(id => card(id, false)).join('') + info.partial.map(id => card(id, true)).join('');
}

function toggleGeoLabels() {
    showGeoLabels = !showGeoLabels;
    setToolbarBtn('btn-geo', showGeoLabels);
}

// ---------- 視角控制 ----------
// 拖拉模式：移動（地圖式）或旋轉；觸控板沒有右鍵拖拉時也能轉方向
let dragMode = 'pan';
function setDragMode(mode) {
    dragMode = mode;
    controls.mouseButtons = mode === 'pan'
        ? { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
        : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = mode === 'pan'
        ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }
        : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    ['pan', 'rotate'].forEach(m => {
        const b = document.getElementById('drag-mode-' + m);
        if (b) b.className = 'px-3 py-1.5 rounded-full text-xs font-black transition ' + (m === mode ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-200/60');
    });
}
// 以中心點為軸轉動鏡頭：dTheta 水平轉向、dPhi 俯仰
const _orbitSph = new THREE.Spherical();
function orbitBy(dTheta, dPhi) {
    camAnimActive = false;
    if (typeof followWalker !== 'undefined' && followWalker) toggleFollowWalker();
    if (typeof dog !== 'undefined' && dog.follow) toggleDogFollow();
    const off = camera.position.clone().sub(controls.target);
    _orbitSph.setFromVector3(off);
    _orbitSph.theta += dTheta;
    _orbitSph.phi = THREE.MathUtils.clamp(_orbitSph.phi + dPhi, 0.12, controls.maxPolarAngle);
    off.setFromSpherical(_orbitSph);
    camera.position.copy(controls.target).add(off);
    camera.lookAt(controls.target);
}
function resetViewAngle() {
    const off = camera.position.clone().sub(controls.target);
    _orbitSph.setFromVector3(off);
    orbitBy(-_orbitSph.theta, 0);
}
// 按住按鈕或 Q/E/R/F 鍵持續轉動
const orbitHold = { x: 0, y: 0 };
const orbitKeys = { x: 0, y: 0 };
function updateOrbitHold(dt) {
    const x = orbitHold.x + orbitKeys.x, y = orbitHold.y + orbitKeys.y;
    if (x || y) orbitBy(x * dt * 1.4, y * dt * 0.8);
}
function initViewControls() {
    setDragMode('pan');
    document.querySelectorAll('[data-orbit]').forEach(b => {
        const [x, y] = b.dataset.orbit.split(',').map(Number);
        const start = e => { e.preventDefault(); orbitHold.x = x; orbitHold.y = y; };
        const stop = () => { orbitHold.x = 0; orbitHold.y = 0; };
        b.addEventListener('pointerdown', start);
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
    });
    const map = { q: [-1, 0], e: [1, 0], r: [0, -1], f: [0, 1] };
    const typing = e => /INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '');
    window.addEventListener('keydown', e => {
        if (typing(e) || !map[e.key.toLowerCase()]) return;
        [orbitKeys.x, orbitKeys.y] = map[e.key.toLowerCase()];
    });
    window.addEventListener('keyup', e => {
        if (map[e.key.toLowerCase()]) { orbitKeys.x = 0; orbitKeys.y = 0; }
    });
}

function setToolbarBtn(id, active) {
    document.getElementById(id).dataset.on = active ? 'true' : 'false';
}
// 工具列的下拉選單（景色、圖層）
function togglePop(id, e) {
    if (e) e.stopPropagation();
    document.querySelectorAll('.tb-pop').forEach(el => { if (el.id !== id) el.classList.add('hidden'); });
    document.getElementById(id).classList.toggle('hidden');
}
document.addEventListener('click', e => {
    if (!e.target.closest('.tb-pop')) document.querySelectorAll('.tb-pop').forEach(el => el.classList.add('hidden'));
});
let currentTimeMode = 'day';
function updateSceneNow() {
    const el = document.getElementById('scene-now');
    if (!el) return;
    const ti = { dawn: '🌅', day: '☀️', night: '🌙' }[currentTimeMode];
    const se = SEASON_LIST.find(s => s.id === currentSeason);
    el.textContent = ti + (se ? se.icon : '');
}

function toggleAllProvincePins() {
    showAllProvincePins = !showAllProvincePins;
    setToolbarBtn('btn-all-pins', showAllProvincePins);
}

function toggleHighwayLines() {
    showHighwayLines = !showHighwayLines;
    if (routeLinesGroup) routeLinesGroup.visible = showHighwayLines;
    setToolbarBtn('btn-routes', showHighwayLines);
}
