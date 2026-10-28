// 路上的小人物
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 路上的小人物：沿著驛道在各國之間旅行的武士・商人・神官・百姓
 *   點擊可查看旅程導航：目的、經過的國、剩餘里程與預計抵達時間
 ***********************************************************************/
const KM_PER_UNIT = 60;          // 地圖 1 單位約 60 公里
const KM_PER_RI = 3.927;         // 1 里 ≈ 3.927 公里
const WALK_SPEED = 0.2;          // 地圖上的步行速度（單位／秒）
const ROLE_INFO = {
    bushi: { label: '武士', icon: '⚔️', pace: 10, chip: 'bg-slate-100 text-slate-800 border-slate-300' },
    shonin: { label: '商人', icon: '💰', pace: 8, chip: 'bg-amber-100 text-amber-900 border-amber-300' },
    kannushi: { label: '神官', icon: '⛩️', pace: 9, chip: 'bg-red-50 text-red-800 border-red-200' },
    hyakusho: { label: '百姓', icon: '🌾', pace: 7, chip: 'bg-lime-100 text-lime-900 border-lime-300' }
};
const WALKER_DEFS = [
    { role: 'bushi', name: '榊原 左近', color: '#46536a', purposes: ['奉藩主之命，把書狀送到{dest}的城下', '為大名行列先行，安排{dest}的本陣住宿', '武者修行，前往{dest}拜訪劍術名家'] },
    { role: 'shonin', name: '近江屋 與兵衛', color: '#8a6d55', pattern: 'shima', purposes: ['背著近江麻布，到{dest}的市集販賣', '前往{dest}收購特產，再運回大坂', '一路巡迴販售富山藥材，下一站是{dest}'] },
    { role: 'kannushi', name: '白川 宗純', color: '#f6f4ee', purposes: ['帶著幣帛，前往{shrine}奉納', '巡拜諸國一之宮，下一站是{shrine}'] },
    { role: 'hyakusho', name: '田吾作', color: '#3b5f8a', pattern: 'ichimatsu', purposes: ['和村裡的人結伴，走到{dest}參拜{shrine}', '挑著年貢米送往{dest}的城下', '到{dest}探望出嫁的女兒'] },
    { role: 'bushi', name: '朝比奈 兵庫', color: '#2b2b2b', purposes: ['參勤交代結束，返回{dest}的藩邸', '受命巡察，前往{dest}查看驛道'] },
    { role: 'shonin', name: '越後屋 喜八', color: '#1e50a2', pattern: 'shima', purposes: ['把越後的米與酒運往{dest}', '到{dest}的港口與船問屋談生意'] },
    { role: 'kannushi', name: '卜部 兼親', color: '#9fc3dc', purposes: ['奉命到{shrine}協助例大祭', '前往{shrine}學習古傳的神樂'] },
    { role: 'hyakusho', name: '阿花', color: '#c53d43', pattern: 'sakura', purposes: ['跟著お陰參り的人潮，走到{dest}', '帶著自家種的蔬菜，到{dest}的市集'] },
    { role: 'bushi', name: '真壁 新之丞', color: '#745399', purposes: ['奉命護送文書到{dest}', '前往{dest}的道場比武'] },
    { role: 'shonin', name: '伊勢屋 傳兵衛', color: '#68be8d', pattern: 'ichimatsu', purposes: ['帶著伊勢的茶葉到{dest}販賣', '前往{dest}收帳，順道看看新的貨源'] },
    { role: 'kannushi', name: '度會 春彥', color: '#f3f1ea', purposes: ['巡迴各地分送伊勢神宮的神札，下一站是{dest}', '前往{shrine}交流祭祀的禮法'] },
    { role: 'hyakusho', name: '彌吉', color: '#00a3af', purposes: ['把村裡的炭運到{dest}換錢', '到{dest}學習新的種稻方法'] }
];
const walkers = [];
let selectedWalker = null;
let followWalker = false;
let walkerRouteLine = null;
let walkerDestMarker = null;

// 驛道圖上的最短路徑（BFS）
function routeBetween(a, b) {
    const prev = { [a]: null };
    const q = [a];
    while (q.length) {
        const cur = q.shift();
        if (cur === b) break;
        getProv(cur).neighbors.forEach(n => {
            if (!(n in prev) && getProv(n)) { prev[n] = cur; q.push(n); }
        });
    }
    if (!(b in prev)) return null;
    const path = [];
    for (let x = b; x; x = prev[x]) path.unshift(x);
    return path;
}
// 把國與國之間的路線轉成實際行走的點：沿地台外緣繞過社殿與城郭
function buildWaypoints(path, startPos) {
    const R = 0.46;
    const pts = [];
    const c = id => new THREE.Vector3(getProv(id).mapX, NODE_Y, getProv(id).mapZ);
    const arc = (center, fromAng, toAng) => {
        let d = toAng - fromAng;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const n = Math.max(1, Math.ceil(Math.abs(d) / 0.45));
        for (let k = 1; k <= n; k++) {
            const a = fromAng + d * (k / n);
            pts.push({ p: new THREE.Vector3(center.x + Math.cos(a) * R, NODE_Y, center.z + Math.sin(a) * R), node: null });
        }
    };
    const ang = (center, p) => Math.atan2(p.z - center.z, p.x - center.x);
    for (let i = 0; i < path.length - 1; i++) {
        const A = c(path[i]), B = c(path[i + 1]);
        const exitAng = ang(A, B);
        if (i === 0) arc(A, ang(A, startPos), exitAng);
        else arc(A, pts.length ? ang(A, pts[pts.length - 1].p) : exitAng, exitAng);
        const entry = new THREE.Vector3(B.x + Math.cos(ang(B, A)) * R, NODE_Y, B.z + Math.sin(ang(B, A)) * R);
        pts.push({ p: entry, node: path[i + 1] });
    }
    return pts;
}
function pathLength(points, from) {
    let len = 0, prev = from;
    points.forEach(w => { len += prev.distanceTo(w.p); prev = w.p; });
    return len;
}

function walkerRand(w) {
    w.seed = (w.seed * 16807) % 2147483647;
    return w.seed / 2147483647;
}
function planJourney(w) {
    const ids = PROVINCES_DATA.map(p => p.id);
    for (let tries = 0; tries < 40; tries++) {
        const dest = ids[Math.floor(walkerRand(w) * ids.length)];
        if (dest === w.at) continue;
        const path = routeBetween(w.at, dest);
        if (path && path.length >= 3 && path.length <= 7) {
            w.path = path;
            w.dest = dest;
            w.origin = w.at;
            w.waypoints = buildWaypoints(path, w.group.position);
            w.wpIndex = 0;
            w.totalLen = pathLength(w.waypoints, w.group.position);
            const destProv = getProv(dest);
            const tpl = w.def.purposes[Math.floor(walkerRand(w) * w.def.purposes.length)];
            w.purpose = tpl.replace('{dest}', shortOldName(destProv)).replace('{shrine}', getSites(destProv).shrines[0].short);
            w.passed = [w.at];
            w.waiting = 0;
            return;
        }
    }
}

function createWalkers() {
    const container = document.getElementById('labels-container');
    const boatMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.7, flatShading: true });
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    WALKER_DEFS.forEach((def, i) => {
        const style = { type: def.role, color: def.color, pattern: def.pattern || 'plain' };
        const group = buildCharacter(style);
        group.scale.setScalar(0.17);
        const w = { def, style, group, seed: 1000 + i * 7919, info: ROLE_INFO[def.role] };
        const startIds = PROVINCES_DATA.map(p => p.id);
        w.at = startIds[(i * 7 + 3) % startIds.length];
        const sp = getProv(w.at);
        group.position.set(sp.mapX + 0.46, NODE_Y, sp.mapZ);
        // 渡海時腳下出現的小渡船
        const boat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.6), boatMat);
        boat.position.y = -0.02;
        boat.visible = false;
        group.add(boat);
        w.boat = boat;
        const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 8), hitMat);
        hit.position.y = 0.45;
        hit.userData.walker = i;
        group.add(hit);
        clickableMeshes.push(hit);
        scene.add(group);
        // 名牌（靠近時顯示）
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        el.innerHTML = `
            <div class="map-label-inner">
                <div class="px-2 py-0.5 rounded-full bg-white/95 border border-stone-300 shadow text-[10px] font-bold text-stone-800 whitespace-nowrap">${w.info.icon} ${w.info.label}・${def.name}</div>
            </div>`;
        el.addEventListener('click', e => { e.stopPropagation(); openWalkerCard(i); });
        container.appendChild(el);
        w.labelEl = el;
        w.anchor = new THREE.Vector3();
        planJourney(w);
        // 一開始讓大家分散在旅途的不同位置
        const skip = Math.floor(walkerRand(w) * Math.max(1, w.waypoints.length - 2));
        for (let k = 0; k < skip; k++) {
            group.position.copy(w.waypoints[k].p);
            if (w.waypoints[k].node) w.passed.push(w.waypoints[k].node);
        }
        w.wpIndex = skip;
        walkers.push(w);
    });
}

function walkerRemaining(w) {
    return pathLength(w.waypoints.slice(w.wpIndex), w.group.position);
}
function currentLeg(w) {
    // 目前正走向的下一國
    for (let k = w.wpIndex; k < w.waypoints.length; k++) if (w.waypoints[k].node) return w.waypoints[k].node;
    return w.dest;
}

function updateWalkers(dt, t) {
    walkers.forEach((w, i) => {
        const u = w.group.userData;
        if (w.waiting > 0) {
            w.waiting -= dt;
            u.legL.rotation.x = u.legR.rotation.x = 0;
            if (w.waiting <= 0) planJourney(w);
        } else {
            const target = w.waypoints[w.wpIndex];
            if (!target) {
                // 抵達目的地：休息一下再出發
                w.at = w.dest;
                w.waiting = 3 + (i % 3);
                if (selectedWalker === i) renderWalkerCard();
            } else {
                const d = target.p.clone().sub(w.group.position);
                d.y = 0;
                const dist = d.length();
                const step = WALK_SPEED * dt;
                if (dist <= step) {
                    w.group.position.x = target.p.x;
                    w.group.position.z = target.p.z;
                    if (target.node) { w.passed.push(target.node); w.at = target.node; }
                    w.wpIndex++;
                } else {
                    d.normalize();
                    w.group.position.addScaledVector(d, step);
                    w.group.rotation.y = Math.atan2(d.x, d.z);
                }
                const swing = Math.sin(t * 10 + i) * 0.5;
                u.legL.rotation.x = swing;
                u.legR.rotation.x = -swing;
                u.armL.rotation.x = -swing * 0.6;
                u.armR.rotation.x = swing * 0.6;
            }
        }
        const onLand = ISLAND_POLYS.some(pl => pointInPoly(w.group.position.x, w.group.position.z, pl));
        w.boat.visible = !onLand;
        const wy = onLand ? NODE_Y + Math.abs(Math.sin(t * 10 + i)) * 0.006 : WATER_Y + 0.03 + Math.sin(t * 2 + i) * 0.008;
        w.group.position.y += (wy - w.group.position.y) * Math.min(1, dt * 8);
        w.anchor.copy(w.group.position);
        w.anchor.y += 0.2;
    });
    if (selectedWalker !== null) {
        const w = walkers[selectedWalker];
        if (followWalker) {
            // 第三人稱跟拍：鏡頭貼在小人物背後偏上，朝前進方向看；轉彎時平順地繞到背後
            const p = w.group.position;
            const yaw = w.group.rotation.y;
            if (w._camYaw === undefined) w._camYaw = yaw;
            let dYaw = yaw - w._camYaw;
            while (dYaw > Math.PI) dYaw -= Math.PI * 2;
            while (dYaw < -Math.PI) dYaw += Math.PI * 2;
            w._camYaw += dYaw * 0.05;
            const fx = Math.sin(w._camYaw), fz = Math.cos(w._camYaw);
            camera.position.lerp(new THREE.Vector3(p.x - fx * 0.75, p.y + 0.42, p.z - fz * 0.75), 0.1);
            controls.target.lerp(new THREE.Vector3(p.x + fx * 0.5, p.y + 0.12, p.z + fz * 0.5), 0.1);
        }
        if (Math.floor(t * 4) !== w._tick) {
            w._tick = Math.floor(t * 4);
            updateWalkerLive();
            drawWalkerRoute();
        }
        if (walkerDestMarker) walkerDestMarker.position.y = NODE_Y + 0.75 + Math.sin(t * 3) * 0.05;
    }
}

function placeWalkerLabels() {
    walkers.forEach((w, i) => {
        const near = camera.position.distanceTo(w.group.position) < 6;
        // 跟拍中的那位不顯示名牌，免得擋住前方視線
        const filming = followWalker && selectedWalker === i;
        placeLabel(w.labelEl, w.anchor, (near || selectedWalker === i) && !filming);
    });
}

// 在地圖上畫出剩餘路線與目的地旗幟
function drawWalkerRoute() {
    const w = walkers[selectedWalker];
    if (!w) return;
    const pts = [w.group.position.clone()].concat(w.waypoints.slice(w.wpIndex).map(x => x.p.clone()));
    pts.forEach(p => { p.y = NODE_Y + 0.03; });
    if (walkerRouteLine) {
        scene.remove(walkerRouteLine);
        walkerRouteLine.geometry.dispose();
    }
    if (pts.length < 2) return;
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    walkerRouteLine = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xea580c, dashSize: 0.08, gapSize: 0.05, linewidth: 2 }));
    walkerRouteLine.computeLineDistances();
    scene.add(walkerRouteLine);
    if (!walkerDestMarker) {
        walkerDestMarker = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x5b4636 }));
        pole.position.y = -0.15;
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.09), new THREE.MeshStandardMaterial({ color: 0xea580c, side: THREE.DoubleSide }));
        flag.position.set(0.07, -0.05, 0);
        walkerDestMarker.add(pole, flag);
        scene.add(walkerDestMarker);
    }
    const dp = getProv(w.dest);
    walkerDestMarker.position.x = dp.mapX;
    walkerDestMarker.position.z = dp.mapZ;
    walkerDestMarker.visible = true;
}

function formatTravelTime(days) {
    if (days < 1) return `約 ${Math.max(1, Math.round(days * 12))} 個時辰`;
    const d = Math.floor(days), h = Math.round((days - d) * 12);
    return h ? `約 ${d} 日又 ${h} 個時辰` : `約 ${d} 日`;
}

function openWalkerCard(i) {
    selectedWalker = i;
    followWalker = false;
    ['left-detail-card', 'traveler-card', 'pref-card'].forEach(id => setCardVisible(id, false));
    travelerCardOpen = false;
    setCardVisible('walker-card', true);
    renderWalkerCard();
    drawWalkerRoute();
    const p = walkers[i].group.position;
    flyCamera(new THREE.Vector3(p.x - 0.4, p.y + 1.6, p.z + 2.0), new THREE.Vector3(p.x - 0.4, p.y + 0.1, p.z));
}
function closeWalkerCard() {
    setCardVisible('walker-card', false);
    selectedWalker = null;
    followWalker = false;
    controls.minDistance = 1.2;
    if (walkerRouteLine) { scene.remove(walkerRouteLine); walkerRouteLine = null; }
    if (walkerDestMarker) walkerDestMarker.visible = false;
}
function hideWalkerCardOnly() {
    if (selectedWalker !== null) closeWalkerCard();
}
function toggleFollowWalker() {
    followWalker = !followWalker;
    document.getElementById('wk-follow').textContent = followWalker ? '🎥 停止跟隨' : '🎥 鏡頭跟隨';
    if (followWalker) {
        camAnimActive = false;
        controls.minDistance = 0.3;   // 跟拍時允許鏡頭貼近
        const w = walkers[selectedWalker];
        if (w) w._camYaw = w.group.rotation.y;
    } else {
        controls.minDistance = 1.2;
    }
}

function renderWalkerCard() {
    const w = walkers[selectedWalker];
    if (!w) return;
    const info = w.info;
    document.getElementById('wk-portrait').src = renderPortraitFor(w.style);
    document.getElementById('wk-role').textContent = `${info.icon} ${info.label}`;
    document.getElementById('wk-role').className = 'px-2 py-0.5 rounded-full text-[10px] font-bold border ' + info.chip;
    document.getElementById('wk-name').textContent = w.def.name;
    document.getElementById('wk-purpose').textContent = w.purpose;
    document.getElementById('wk-from').textContent = shortOldName(getProv(w.origin));
    document.getElementById('wk-to').textContent = shortOldName(getProv(w.dest));
    const stepsEl = document.getElementById('wk-steps');
    stepsEl.innerHTML = w.path.map((id, k) => {
        const p = getProv(id);
        const done = w.passed.includes(id) && id !== currentLeg(w);
        const isNext = !w.waiting && id === currentLeg(w);
        const legKm = k === 0 ? 0 : Math.hypot(p.mapX - getProv(w.path[k - 1]).mapX, p.mapZ - getProv(w.path[k - 1]).mapZ) * KM_PER_UNIT;
        const dot = done ? 'bg-teal-600 text-white' : isNext ? 'bg-orange-500 text-white animate-pulse' : 'bg-white text-stone-400 border border-stone-300';
        return `
            <button onclick="selectProvince('${id}')" class="w-full flex items-center gap-2.5 text-left py-1 group">
                <span class="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${dot}">${done ? '✓' : k + 1}</span>
                <span class="flex-1 min-w-0">
                    <span class="font-serif-jp font-black text-sm ${done ? 'text-stone-400' : 'text-stone-900'} group-hover:text-orange-600">${shortOldName(p)}</span>
                    <span class="text-[10px] text-stone-400 font-bold ml-1">${provReading(p).short}</span>
                </span>
                <span class="text-[10px] font-bold text-stone-400 shrink-0">${k === 0 ? '出發' : `${(legKm / KM_PER_RI).toFixed(0)} 里`}</span>
            </button>`;
    }).join('');
    updateWalkerLive();
}

function updateWalkerLive() {
    const w = walkers[selectedWalker];
    if (!w) return;
    const remain = w.waiting > 0 ? 0 : walkerRemaining(w);
    const pct = w.totalLen ? Math.max(0, Math.min(1, 1 - remain / w.totalLen)) : 1;
    const km = remain * KM_PER_UNIT, ri = km / KM_PER_RI;
    const days = ri / w.info.pace;
    const next = getProv(currentLeg(w));
    document.getElementById('wk-progress').style.width = (pct * 100).toFixed(0) + '%';
    document.getElementById('wk-now').textContent = w.waiting > 0 ? shortOldName(getProv(w.dest)) : `往${shortOldName(next)}途中`;
    if (w.waiting > 0) {
        document.getElementById('wk-status').textContent = `已抵達${shortOldName(getProv(w.dest))}，正在休息，準備下一段旅程`;
        document.getElementById('wk-remain').textContent = '剩餘 0 里';
        document.getElementById('wk-eta').textContent = '已抵達';
        document.getElementById('wk-map-eta').textContent = '休息中';
    } else {
        const toNext = pathLength(w.waypoints.slice(w.wpIndex, w.waypoints.findIndex((x, k) => k >= w.wpIndex && x.node) + 1), w.group.position);
        document.getElementById('wk-status').textContent = `下一站：${shortOldName(next)}，還有 ${(toNext * KM_PER_UNIT / KM_PER_RI).toFixed(0)} 里`;
        document.getElementById('wk-remain').textContent = `剩餘 ${ri.toFixed(0)} 里（約 ${km.toFixed(0)} 公里）`;
        document.getElementById('wk-eta').textContent = `徒步${formatTravelTime(days)}`;
        document.getElementById('wk-map-eta').textContent = `地圖上約 ${Math.ceil(remain / WALK_SPEED)} 秒後抵達`;
    }
    document.getElementById('wk-pace').textContent = `以${w.info.label}每日步行 ${w.info.pace} 里計算`;
}

// 小人物的大頭照（與換裝預覽共用渲染器）
const _portraitCache = {};
function renderPortraitFor(style) {
    const key = style.type + style.color + style.pattern;
    if (_portraitCache[key]) return _portraitCache[key];
    try {
        const w = getWardrobeRenderer();
        const prevChar = w.char;
        if (prevChar) w.scene.remove(prevChar);
        const ch = buildCharacter(style);
        ch.rotation.y = -0.35;
        w.scene.add(ch);
        w.renderer.setSize(160, 160, false);
        w.scene.background = new THREE.Color(0xf3e7d3);
        w.camera.aspect = 1;
        w.camera.position.set(0, 0.62, 1.4);
        w.camera.lookAt(0, 0.52, 0);
        w.camera.updateProjectionMatrix();
        w.renderer.render(w.scene, w.camera);
        _portraitCache[key] = w.renderer.domElement.toDataURL('image/png');
        w.scene.remove(ch);
        if (prevChar) w.scene.add(prevChar);
    } catch (e) {
        _portraitCache[key] = '';
    }
    return _portraitCache[key];
}
