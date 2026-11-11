// 參拜與拜領御朱印・御城印
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 參拜：鏡頭拉近到神社（或城）前，旅人走進去
 *   神社：在拜殿前「二拜二拍手一拜」→ 找到境內的授與所 → 拜領御朱印
 *   城　：走到城門旁的番所 → 拜領御城印
 *   授與所／番所只在參拜時才蓋出來（282 座常駐太佔效能），位置每座固定
 ***********************************************************************/
let visit = null;
const visitV = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- 小音效（WebAudio 合成，不用音檔） ----------
let _visitAC = null;
function visitSfx(kind) {
    try {
        _visitAC = _visitAC || new (window.AudioContext || window.webkitAudioContext)();
        const ac = _visitAC, t = ac.currentTime, g = ac.createGain();
        g.connect(ac.destination);
        if (kind === 'clap') {
            // 拍手：一小段雜訊
            const buf = ac.createBuffer(1, ac.sampleRate * 0.08, ac.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
            const src = ac.createBufferSource(), f = ac.createBiquadFilter();
            f.type = 'bandpass'; f.frequency.value = 1800;
            src.buffer = buf; src.connect(f); f.connect(g);
            g.gain.value = 0.5;
            src.start(t);
        } else {
            // 蓋印：低沉的「咚」
            const o = ac.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(140, t);
            o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
            g.gain.setValueAtTime(0.6, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            o.connect(g);
            o.start(t); o.stop(t + 0.26);
        }
    } catch (e) {}
}

// ---------- 授與所（神社）／番所（城） ----------
function visitFlag(text, bg, ink) {
    const cv = document.createElement('canvas');
    cv.width = 48; cv.height = 128;
    const c2 = cv.getContext('2d');
    c2.fillStyle = bg; c2.fillRect(0, 0, 48, 128);
    c2.fillStyle = ink; c2.font = 'bold 30px "Noto Serif TC", serif'; c2.textAlign = 'center';
    [...text].forEach((ch, i) => c2.fillText(ch, 24, 36 + i * 36));
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.075, 5), new THREE.MeshStandardMaterial({ color: 0x4a3524 }));
    pole.position.y = 0.0375;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 0.038), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }));
    flag.position.set(0.008, 0.053, 0);
    g.add(pole, flag);
    g.userData.flag = flag;
    return g;
}
function buildVisitBooth(type) {
    const g = new THREE.Group();
    const M = (c, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, extra));
    const shrine = type === 'shrine';
    const wall = M(shrine ? 0xf4efe4 : 0x3a2f28), wood = M(shrine ? 0xb5452f : 0x5a4636), roof = M(shrine ? 0x5b6f5f : 0x30343a, { flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.026, 0.032), wall);
    body.position.y = 0.013;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.012, 0.002), M(0x1d1a17));
    win.position.set(0, 0.017, 0.0165);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.003, 0.008), wood);
    counter.position.set(0, 0.0105, 0.019);
    g.add(body, win, counter);
    [-1, 1].forEach(s => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.003, 0.026), roof);
        r.position.set(0, 0.033, s * 0.0105);
        r.rotation.x = s * 0.5;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.026, 0.003), wood);
        post.position.set(s * 0.0245, 0.013, 0.016);
        g.add(r, post);
    });
    // 發光的提燈：遠遠就看得到
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffb347, emissiveIntensity: 1.4 }));
    lamp.position.set(-0.03, 0.024, 0.02);
    g.add(lamp);
    const flag = visitFlag(shrine ? '御朱印' : '御城印', shrine ? '#fbf6ea' : '#1c1917', shrine ? '#b91c1c' : '#fbf6ea');
    flag.position.set(0.034, 0, 0.022);
    g.add(flag);
    g.userData = { lamp, flag: flag.userData.flag };
    // 窗口裡的巫女／番所的武士
    const keeper = buildCharacter(shrine ? { type: 'miko', color: '#ffffff', pattern: 'plain' } : { type: 'bushi', color: '#46536a', pattern: 'plain' });
    keeper.rotation.order = 'YXZ';
    keeper.scale.setScalar(0.055);
    keeper.position.set(shrine ? 0 : -0.04, 0, shrine ? 0.0 : 0.03);
    if (shrine) keeper.position.y = -0.012;   // 站在窗口後面，只露出上半身
    g.add(keeper);
    g.userData.keeper = keeper;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
}

// ---------- 開始／結束 ----------
function startVisit(provId, type, idx) {
    if (visit) return;
    if (typeof enc !== 'undefined' && enc) return showToast('こまち正在路上遇到事情，先幫牠處理完吧');
    const prov = getProv(provId);
    const site = getSites(prov)[type === 'shrine' ? 'shrines' : 'castles'][idx];
    const P = prov._sitePos && prov._sitePos[type][idx];
    if (!site || !P) return;
    const k = idx === 0 ? 1 : 0.27 / 0.34;            // 附屬地台上的模型比較小
    const y = NODE_Y + (idx === 0 ? 0.08 : 0.06);     // 地台面
    // 授與所放在參道的左或右：主地台上神社在左、城在右，往外側放；其餘依名稱固定
    const hash = [...(provId + site.short)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const side = idx === 0 ? (type === 'shrine' ? -1 : 1) : (hash % 2 ? 1 : -1);
    const stage = new THREE.Group();
    // 地台是圓的：超出地台邊緣的地方踩在一般地面上
    const moundC = idx === 0 ? visitV(prov.mapX, 0, prov.mapZ) : P, moundR = idx === 0 ? 0.37 : 0.21;
    const gy = p => Math.hypot(p.x - moundC.x, p.z - moundC.z) < moundR ? y : NODE_Y;
    const at = (x, z) => { const p = visitV(P.x + x * k, y, P.z + z * k); p.y = gy(p); return p; };
    // 參拜位置：有樓門的神社站在樓門前（門後空間太窄、會被擋住），其餘站在拜殿與鳥居之間
    const romon = type === 'shrine' && ((site.m && site.m[4]) || '').split(',').includes('romon');
    const spotZ = type !== 'shrine' ? 0.2 : romon ? 0.205 : 0.1;

    const chara = buildCharacter(traveler.outfit);
    chara.rotation.order = 'YXZ';
    chara.scale.setScalar(0.065 * k);
    chara.position.copy(at(0, spotZ + 0.14));
    chara.rotation.y = Math.PI;
    stage.add(chara);

    const booth = buildVisitBooth(type);
    booth.scale.setScalar(k * 1.15);
    booth.position.copy(at(side * (0.115 + (hash % 3) * 0.008), (romon ? 0.2 : 0.15) + (hash % 5) * 0.012));
    // 授與所一定要在地台上：超出邊緣就往地台中心拉回來，才不會掉到台下被擋住
    const bd = Math.hypot(booth.position.x - moundC.x, booth.position.z - moundC.z), bmax = moundR - 0.065 * k;
    if (bd > bmax) {
        booth.position.x = moundC.x + (booth.position.x - moundC.x) * bmax / bd;
        booth.position.z = moundC.z + (booth.position.z - moundC.z) * bmax / bd;
    }
    booth.position.y = y;
    booth.rotation.y = -side * 0.45;
    stage.add(booth);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.07), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(booth.position);
    hit.position.y += 0.03;
    hit.userData.visitBooth = true;
    stage.add(hit);
    clickableMeshes.push(hit);
    scene.add(stage);

    // 鏡頭：從正前方偏上往下看；右邊索引會蓋住畫面，把舞台移到空白處中間
    const look = visitV(P.x + side * 0.04 * k, y + 0.04, P.z + (romon ? 0.15 : 0.1) * k);
    const dir = visitV(-side * 0.18, 0.62, 1).normalize();
    const idxEl = document.getElementById('right-index-panel');
    const W = window.innerWidth, R = idxEl && idxEl.offsetWidth ? idxEl.offsetLeft : W;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = tanV * camera.aspect;
    const dist = THREE.MathUtils.clamp(0.5 * k / (2 * halfW * R / W), 0.6, 1.3);
    const camPos = look.clone().addScaledVector(dir, dist);
    const right = dir.clone().negate().cross(visitV(0, 1, 0)).normalize();
    const up = right.clone().cross(dir.clone().negate()).normalize();
    const sx = -(R / W - 1) * halfW * dist;
    // 下方有引導列與工具列，舞台往上移一點
    const sy = -(170 / window.innerHeight) * tanV * dist;
    camPos.addScaledVector(right, sx).addScaledVector(up, sy);
    look.addScaledVector(right, sx).addScaledVector(up, sy);
    scene.updateMatrixWorld();
    // 清掉擋在鏡頭與神社之間、鏡頭與授與所之間的樹和建築
    const keep = [stage, prov._siteGroup && prov._siteGroup[type][idx]].filter(Boolean);
    const hidden = encClearView(look, camPos, keep);
    const h2 = encClearView(booth.position.clone().setY(y + 0.02), camPos, keep);
    hidden.meshes.push(...h2.meshes);
    hidden.inst.push(...h2.inst);
    document.body.classList.add('enc-focus');
    setCardVisible('left-detail-card', false);
    if (typeof dog !== 'undefined' && dog.follow) toggleDogFollow();
    controls.minDistance = 0.25;
    flyCamera(camPos, look);

    visit = {
        prov, provId, type, idx, site, P, k, y, side, at, gy, stage, chara, booth, hit, hidden,
        step: 'enter', clock: 0, t0: 0, from: chara.position.clone(), to: at(0, spotZ),
        found: false, hint: 0, labels: []
    };
    visit.pinEl = visitLabel('', () => visitBoothClick());
    visit.hallEl = visitLabel('🙏 在拜殿前參拜', () => visitWorship());
    renderVisitHud();
}

function visitLabel(text, onClick) {
    const el = document.createElement('div');
    el.className = 'map-label enc-bubble';
    el.style.opacity = '0';
    el.innerHTML = `<div class="map-label-inner"><div class="px-2.5 py-1 rounded-full bg-white border-2 border-orange-500 text-[11px] font-black text-orange-700 shadow-md whitespace-nowrap">${text}</div></div>`;
    el.addEventListener('click', e => { e.stopPropagation(); onClick(); });
    document.getElementById('labels-container').appendChild(el);
    return el;
}

function endVisit(reopenCard = true) {
    if (!visit) return;
    const v = visit;
    visit = null;
    scene.remove(v.stage);
    const i = clickableMeshes.indexOf(v.hit);
    if (i >= 0) clickableMeshes.splice(i, 1);
    encRestoreView(v.hidden);
    v.pinEl.remove();
    v.hallEl.remove();
    document.body.classList.remove('enc-focus');
    document.getElementById('visit-hud').classList.add('hidden');
    controls.minDistance = 1.2;
    flyCamera(visitV(v.P.x - 0.35, NODE_Y + 1.5, v.P.z + 1.9), visitV(v.P.x - 0.35, NODE_Y + 0.1, v.P.z));
    if (reopenCard && selectedProvinceId === v.provId) {
        setCardVisible('left-detail-card', true);
        refreshSiteStampButtons(v.prov);
    }
}

// ---------- 步驟 ----------
function visitWorship() {
    if (!visit || visit.step !== 'worship') return;
    visit.step = 'worshipping';
    visit.t0 = visit.clock;
    renderVisitHud();
}
function visitBoothClick() {
    const v = visit;
    if (!v) return;
    if (v.step === 'worship' || v.step === 'worshipping' || v.step === 'enter') {
        if (v.type === 'shrine') return showToast('先到拜殿前參拜，再來授與所唷 🙏');
        return;
    }
    if (v.step !== 'receive') return;
    v.found = true;
    v.step = 'walking';
    v.t0 = v.clock;
    v.from = v.chara.position.clone();
    const b = v.booth.position;
    v.to = visitV(b.x + Math.sin(v.booth.rotation.y) * 0.05 * v.k, b.y, b.z + Math.cos(v.booth.rotation.y) * 0.05 * v.k);
    renderVisitHud();
}
// 找不到授與所時的提示：在它頭上亮一下標籤
function visitHint() {
    if (!visit) return;
    visit.hint = visit.clock + 4;
}

// ---------- 每幀 ----------
function updateVisit(dt, t) {
    const v = visit;
    if (!v) return;
    v.clock += dt;
    const c = v.chara, u = c.userData, e = v.clock - v.t0;
    const walk = (on) => {
        const sw = on ? Math.sin(t * 14) * 0.55 : 0;
        u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
        u.armL.rotation.x = -sw * 0.6; u.armR.rotation.x = sw * 0.6;
    };
    const ease = x => { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
    c.rotation.x = 0;
    u.armL.rotation.z = u.armR.rotation.z = 0;
    // 授與所的旗子飄動、提燈明滅
    v.booth.userData.flag.rotation.y = Math.sin(t * 3) * 0.5;
    v.booth.userData.lamp.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.5;
    const keeper = v.booth.userData.keeper;
    keeper.rotation.x = 0;

    if (v.step === 'enter') {
        // 走進參道
        const kk = ease(e / 1.6);
        c.position.lerpVectors(v.from, v.to, kk);
        walk(kk < 1);
        if (kk >= 1) { v.step = v.type === 'shrine' ? 'worship' : 'receive'; renderVisitHud(); }
    } else if (v.step === 'worshipping') {
        // 二拜（0～1.8）・二拍手（1.8～2.9）・一拜（2.9～3.9）
        walk(false);
        const bow = (a, b) => Math.sin(ease((e - a) / (b - a)) * Math.PI) * 0.75;
        if (e < 0.9) c.rotation.x = bow(0, 0.9);
        else if (e < 1.8) c.rotation.x = bow(0.9, 1.8);
        else if (e < 2.9) {
            u.armL.rotation.x = u.armR.rotation.x = -1.35;
            const open = (Math.sin((e - 1.8) / 1.1 * Math.PI * 4 - Math.PI / 2) + 1) / 2;   // 兩次開合
            u.armL.rotation.z = -0.1 - open * 0.35;
            u.armR.rotation.z = 0.1 + open * 0.35;
            const beat = Math.floor((e - 1.8) / 0.55);
            if (open < 0.08 && v._clap !== beat) { v._clap = beat; visitSfx('clap'); }
        } else if (e < 3.9) c.rotation.x = bow(2.9, 3.9);
        else {
            v.step = 'receive';
            showToast('🙏 參拜完成！找找境內的授與所，拜領御朱印吧');
            renderVisitHud();
        }
    } else if (v.step === 'walking') {
        const kk = ease(e / 1.5);
        c.position.lerpVectors(v.from, v.to, kk);
        if (kk < 1) c.rotation.y = Math.atan2(v.to.x - v.from.x, v.to.z - v.from.z);
        else c.rotation.y = Math.atan2(v.booth.position.x - c.position.x, v.booth.position.z - c.position.z);
        walk(kk < 1);
        if (e > 1.5) {
            // 互相行禮後開始蓋印
            const b = Math.sin(ease((e - 1.5) / 0.9) * Math.PI) * 0.5;
            c.rotation.x = b;
            keeper.rotation.x = b;
        }
        if (e > 2.5) { v.step = 'ceremony'; openStampCeremony(v); renderVisitHud(); }
    } else walk(false);
    c.position.y += (v.gy(c.position) - c.position.y) * Math.min(1, dt * 10);   // 上下地台
}

function placeVisitLabels() {
    const v = visit;
    if (!v) return;
    const a = v.to.clone();
    a.y = v.y + 0.09 * v.k;
    placeLabel(v.hallEl, a, v.step === 'worship');
    const b = v.booth.position.clone();
    b.y += 0.085 * v.k;
    const show = v.step === 'receive' && v.clock < v.hint;
    v.pinEl.firstElementChild.firstElementChild.textContent = v.type === 'shrine' ? '📖 授與所在這裡！' : '📖 番所在這裡！';
    placeLabel(v.pinEl, b, show);
}

// ---------- 畫面下方的引導列 ----------
function renderVisitHud() {
    let hud = document.getElementById('visit-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'visit-hud';
        hud.className = 'fixed bottom-20 inset-x-3 z-40 flex justify-center pointer-events-none hidden';
        document.body.appendChild(hud);
    }
    const v = visit;
    if (!v) return hud.classList.add('hidden');
    const shrine = v.type === 'shrine';
    const steps = shrine ? [['worship', '① 參拜'], ['receive', '② 拜領御朱印']] : [['receive', '① 到番所拜領御城印']];
    const cur = ['enter', 'worship', 'worshipping'].includes(v.step) ? (shrine ? 'worship' : 'receive') : 'receive';
    const msg = {
        enter: shrine ? '穿過鳥居，走進參道……' : '走向城門……',
        worship: '點拜殿前的「🙏 在拜殿前參拜」，或按右邊的按鈕。',
        worshipping: '二拜・二拍手・一拜',
        receive: shrine ? '境內有一間掛著「御朱印」旗子、亮著提燈的授與所——找到它，點一下。' : '城門旁有一間掛著「御城印」旗子的番所——找到它，點一下。',
        walking: shrine ? '走向授與所，把御朱印帳交給巫女……' : '走向番所，請武士蓋御城印……',
        ceremony: '拜領中……'
    }[v.step];
    const btn = v.step === 'worship'
        ? `<button onclick="visitWorship()" class="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-black whitespace-nowrap">🙏 參拜</button>`
        : v.step === 'receive' ? `<button onclick="visitHint()" class="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold whitespace-nowrap">💡 找不到？</button>` : '';
    hud.innerHTML = `
        <div class="pointer-events-auto cream-card rounded-2xl border border-stone-300 shadow-xl px-4 py-3 max-w-[560px] w-full flex items-center gap-3">
            <div class="text-2xl shrink-0">${shrine ? '⛩️' : '🏯'}</div>
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-sm font-serif-jp font-black text-stone-900">${v.site.short}</span>
                    ${steps.map(([id, label]) => `<span class="px-2 py-0.5 rounded-full text-[10px] font-black ${id === cur ? 'bg-orange-600 text-white' : 'bg-stone-200 text-stone-500'}">${label}</span>`).join('')}
                </div>
                <div class="text-xs text-stone-600 mt-0.5 leading-snug">${msg}</div>
            </div>
            ${btn}
            <button onclick="endVisit()" class="shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-200/70 whitespace-nowrap">離開</button>
        </div>`;
    hud.classList.remove('hidden');
}

// ---------- 蓋印儀式 ----------
function openStampCeremony(v) {
    let m = document.getElementById('stamp-ceremony');
    if (!m) {
        m = document.createElement('div');
        m.id = 'stamp-ceremony';
        m.className = 'fixed inset-0 z-[70] bg-stone-950/70 backdrop-blur-sm hidden items-center justify-center p-4';
        document.body.appendChild(m);
    }
    const shrine = v.type === 'shrine';
    const meta = { d: new Date().toISOString().slice(0, 10), s: currentSeason };
    v.meta = meta;
    m.innerHTML = `
        <div class="flex flex-col items-center gap-4 w-full max-w-[300px]">
            <div class="text-amber-100 text-xs font-black tracking-[0.3em]">${shrine ? '御朱印 拜領' : '御城印 拜領'}</div>
            <div class="gs-paper gs-anim w-full shadow-2xl">${goshuinFace(v.type, v.site, v.prov, meta)}</div>
            <div class="text-center text-amber-50">
                <div class="text-lg font-serif-jp font-black">${v.site.short}</div>
                <div class="text-[11px] opacity-80">${shortOldName(v.prov)}・${reiwaDate(meta.d)}</div>
            </div>
            <button id="stamp-ceremony-ok" onclick="finishStampCeremony()" class="gs-ok px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-sm font-black shadow-lg">📖 收進${shrine ? '御朱印帳' : '御城印帳'}</button>
        </div>`;
    m.classList.remove('hidden');
    m.classList.add('flex');
    setTimeout(() => visitSfx('stamp'), 620);
}
function finishStampCeremony() {
    const v = visit;
    const m = document.getElementById('stamp-ceremony');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    if (!v) return;
    const key = siteStampKey(v.provId, v.type, v.site);
    const before = new Set(manganDone().map(s => s.id));
    stampedSites.add(key);
    stampMeta[key] = v.meta;
    saveStamps();
    showToast(`${v.type === 'shrine' ? '💮' : '🏯'} 拜領了 ${v.site.short} 的${v.type === 'shrine' ? '御朱印' : '御城印'}！`);
    // 剛好集滿一套：滿願！
    const fresh = manganDone().filter(s => !before.has(s.id));
    if (fresh.length) setTimeout(() => showToast(`🏅 滿願：${fresh.map(s => s.name).join('、')}！御朱印帳多了一頁大印`), 2400);
    requestPersist();
    maybeNudgeBackup();
    endVisit();
    updateStampButton();
    refreshStampMarks();
    renderIndexList();
}
