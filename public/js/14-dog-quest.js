// 代參犬任務
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 代參犬任務（おかげ犬）：替無法遠行的主人前往伊勢神宮參拜的狗
 *   玩家在每一國替牠選下一站，沿途發生事件，抵達伊勢神宮內宮後取得代參證
 ***********************************************************************/
const DOG_KEY = 'shinkoku_okage_dog_v1';
const DOG_SPEED = 0.26;
const DOG_PACE = 10;            // 每日步行里數
const DOG_STARTS = [
    { id: 'musashi', label: '江戶（武藏國）', owner: '江戶神田的米屋老闆' },
    { id: 'mutsu_aomori', label: '陸奧國', owner: '弘前城下的漆器師傅' },
    { id: 'satsuma', label: '薩摩國', owner: '鹿兒島城下的鍛冶師傅' },
    { id: 'izumo', label: '出雲國', owner: '松江的老茶屋' },
    { id: 'ryukyu', label: '琉球（那霸）', owner: '那霸港的泡盛酒造' }
];
const dog = {
    active: false, phase: 'idle', group: null, at: null, from: null, start: null, owner: '',
    waypoints: [], wpIndex: 0, legLen: 0, history: [], days: 0, ri: 0, money: 200, kindness: 0,
    log: [], follow: false, labelEl: null, anchor: new THREE.Vector3(), hint: null, camYaw: undefined, done: 0
};
try { dog.done = parseInt(localStorage.getItem(DOG_KEY) || '0', 10) || 0; } catch (e) {}

// 柴犬：橘色身體、白色腹部與口鼻、捲尾、紅項圈與「伊勢參宮」小袋
function buildDog() {
    const g = new THREE.Group();
    const sm = (c, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, extra));
    const fur = sm(0xc9773a), white = sm(0xf6efe4), dark = sm(0x1b1b1f), red = sm(0xc0392b);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 14), fur);
    body.scale.set(1.05, 0.95, 1.7);
    body.position.y = 0.2;
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), white);
    belly.scale.set(0.9, 0.7, 1.4);
    belly.position.set(0, 0.165, 0.02);
    g.add(body, belly);
    // 四條腿：前左＋後右、前右＋後左交替擺動
    const legs = [[-0.055, 0.1], [0.055, 0.1], [-0.055, -0.1], [0.055, -0.1]].map(([x, z]) => {
        const leg = new THREE.Group();
        leg.position.set(x, 0.17, z);
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.11, 8), fur);
        upper.position.y = -0.06;
        const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.06, 8), white);
        sock.position.y = -0.14;
        leg.add(upper, sock);
        g.add(leg);
        return leg;
    });
    // 頭
    const head = new THREE.Group();
    head.position.set(0, 0.32, 0.17);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 14), fur);
    skull.scale.set(1.05, 0.95, 1);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), white);
    cheek.scale.set(1.2, 0.75, 1);
    cheek.position.set(0, -0.03, 0.04);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), white);
    muzzle.scale.set(1, 0.8, 1.2);
    muzzle.position.set(0, -0.02, 0.085);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), dark);
    nose.position.set(0, -0.005, 0.13);
    head.add(skull, cheek, muzzle, nose);
    [-1, 1].forEach(s => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), dark);
        eye.position.set(s * 0.035, 0.02, 0.075);
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), fur);
        ear.position.set(s * 0.045, 0.085, -0.01);
        ear.rotation.z = -s * 0.25;
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.035, 4), white);
        inner.position.set(s * 0.045, 0.08, 0.004);
        inner.rotation.z = -s * 0.25;
        head.add(eye, ear, inner);
    });
    g.add(head);
    // 捲尾
    const tail = new THREE.Group();
    tail.position.set(0, 0.29, -0.16);
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.018, 8, 16, Math.PI * 1.5), fur);
    curl.rotation.y = Math.PI / 2;
    tail.add(curl);
    g.add(tail);
    // 紅項圈＋白色小袋（伊勢參宮）
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 18), red);
    collar.position.set(0, 0.27, 0.12);
    collar.rotation.x = Math.PI / 2 - 0.5;
    g.add(collar);
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 96;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#fbf8f0'; c2.fillRect(0, 0, 64, 96);
    c2.fillStyle = '#1f2937'; c2.font = 'bold 20px "Noto Serif TC", serif'; c2.textAlign = 'center';
    ['伊', '勢', '參', '宮'].forEach((ch, i) => c2.fillText(ch, 32, 22 + i * 20));
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), [white, white, white, white, new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv) }), white]);
    pouch.position.set(0, 0.21, 0.19);
    g.add(pouch);
    g.userData = { legs, head, tail };
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
}

function isLand(x, z) {
    return ISLAND_POLYS.some(pl => pointInPoly(x, z, pl));
}
function hopsTo(from, to) {
    const p = routeBetween(from, to);
    return p ? p.length - 1 : 99;
}
function legRi(a, b) {
    const A = getProv(a), B = getProv(b);
    return Math.hypot(A.mapX - B.mapX, A.mapZ - B.mapZ) * KM_PER_UNIT / KM_PER_RI;
}

function openDogCard() {
    ['left-detail-card', 'traveler-card', 'pref-card'].forEach(id => setCardVisible(id, false));
    travelerCardOpen = false;
    selectedPref = null;
    hideWalkerCardOnly();
    setCardVisible('dog-card', true);
    renderDogCard();
    if (dog.active && dog.group) {
        const p = dog.group.position;
        flyCamera(new THREE.Vector3(p.x - 0.35, p.y + 1.4, p.z + 1.8), new THREE.Vector3(p.x - 0.35, p.y + 0.1, p.z));
    }
}
function closeDogCard() {
    setCardVisible('dog-card', false);
    if (dog.follow) toggleDogFollow();
}

function startDogQuest(startId) {
    const s = DOG_STARTS.find(x => x.id === startId) || DOG_STARTS[Math.floor(Math.random() * DOG_STARTS.length)];
    const p = getProv(s.id);
    if (!dog.group) {
        dog.group = buildDog();
        dog.group.scale.setScalar(0.16);   // 約小人物的三分之一高
        const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 0.5;
        hit.userData.dog = true;
        dog.group.add(hit);
        clickableMeshes.push(hit);
        const boat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.7), new THREE.MeshStandardMaterial({ color: 0x8d5524, flatShading: true }));
        boat.position.y = -0.01;
        boat.visible = false;
        dog.group.add(boat);
        dog.boat = boat;
        scene.add(dog.group);
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        el.innerHTML = `
            <div class="map-label-inner">
                <div class="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-400 shadow text-[10px] font-black text-amber-900 whitespace-nowrap">🐕 代參犬こまち</div>
            </div>`;
        el.addEventListener('click', e => { e.stopPropagation(); openDogCard(); });
        document.getElementById('labels-container').appendChild(el);
        dog.labelEl = el;
    }
    Object.assign(dog, {
        active: true, phase: 'choose', at: s.id, from: null, start: s.id, owner: s.owner,
        waypoints: [], wpIndex: 0, history: [s.id], days: 0, ri: 0, money: 200, kindness: 0, hint: null,
        log: [`${s.owner}的老爺子病倒了，沒辦法親自去伊勢參拜。こまち脖子掛上寫著「伊勢參宮」的小袋（裡面有旅費二百文和說明的紙條），從${shortOldName(p)}出發了！`]
    });
    dog.group.position.set(p.mapX + 0.4, NODE_Y, p.mapZ + 0.15);
    dog.group.visible = true;
    openDogCard();
    showToast('🐕 代參犬こまち出發了！幫牠選下一站吧');
}

function dogAskWay() {
    const nbs = getProv(dog.at).neighbors.filter(getProv);
    let best = null;
    nbs.forEach(n => { const h = hopsTo(n, 'ise'); if (!best || h < best.h) best = { id: n, h }; });
    dog.hint = best ? best.id : null;
    dog.money = Math.max(0, dog.money - 4);
    dog.log.unshift(`驛站的人看到袋子上的「伊勢參宮」，指著${shortOldName(getProv(dog.hint))}的方向說：「往那邊走！」（茶錢 4 文）`);
    renderDogCard();
}

function dogChoose(next) {
    if (dog.phase !== 'choose') return;
    dog.from = dog.at;
    dog.phase = 'walking';
    dog.hint = null;
    dog.waypoints = buildWaypoints([dog.at, next], dog.group.position);
    dog.wpIndex = 0;
    dog.legLen = pathLength(dog.waypoints, dog.group.position);
    dog.target = next;
    const cost = (isLand((getProv(dog.at).mapX + getProv(next).mapX) / 2, (getProv(dog.at).mapZ + getProv(next).mapZ) / 2) ? 16 : 40);
    dog.money -= cost;
    if (cost > 16) dog.log.unshift(`要渡海到${shortOldName(getProv(next))}，搭了渡船（船資 40 文）。`);
    renderDogCard();
}

// 抵達一國時的旅途事件
function dogArrive() {
    const p = getProv(dog.at);
    const ri = legRi(dog.from, dog.at);
    dog.ri += ri;
    dog.days += ri / DOG_PACE;
    dog.history.push(dog.at);
    const w = typeof weatherOn !== 'undefined' && weatherOn && weatherData[dog.at];
    const rainy = w ? ['rain', 'drizzle', 'thunder', 'snow'].includes(wmoInfo(w.code).kind) : Math.random() < 0.15;
    const ichi = ichiNames(p);
    const events = [
        () => { dog.kindness++; return `茶屋的老闆娘請こまち吃了一串糰子 🍡，還摸摸牠的頭。`; },
        () => { dog.kindness++; dog.money += 50; return `同路的旅人看到「伊勢參宮」的袋子，往裡面添了 50 文 💰：「替我也拜一下吧！」`; },
        () => { dog.kindness++; return `こまち在${ichi}前討了水喝，神社的人幫牠把袋子的繩子重新綁好。`; },
        () => { dog.days += 0.5; return `被野狗追著跑，繞了一大段遠路（多花半日）。`; },
        () => { dog.kindness++; dog.money += 20; return `旅籠的女中讓こまち在廚房睡了一晚，還在袋裡放了 20 文。`; }
    ];
    let msg = rainy
        ? (dog.days += 0.5, `${w ? '正在' + wmoInfo(w.code).label : '下起了雨'}，こまち在屋簷下躲了半日。`)
        : events[Math.floor(Math.random() * events.length)]();
    if (dog.money < 0) { dog.money = 0; dog.kindness++; msg += '　錢不夠了…好心的旅籠讓牠免費過夜。'; }
    dog.log.unshift(`【${shortOldName(p)}】${msg}`);
    if (dog.at === 'ise') {
        dog.phase = 'done';
        dog.done++;
        try { localStorage.setItem(DOG_KEY, String(dog.done)); } catch (e) {}
        dog.log.unshift('抵達伊勢神宮內宮！こまち走過宇治橋，在御正宮前替主人參拜，袋子裡放進了神宮的御札。');
        showToast('🎉 こまち抵達伊勢神宮，完成代參！');
        showDogCertificate();
    } else {
        dog.phase = 'choose';
    }
    renderDogCard();
}

function updateDog(dt, t) {
    if (!dog.active || !dog.group) return;
    const u = dog.group.userData;
    if (dog.phase === 'walking') {
        const target = dog.waypoints[dog.wpIndex];
        if (!target) {
            dog.at = dog.target;
            dogArrive();
        } else {
            const d = target.p.clone().sub(dog.group.position);
            d.y = 0;
            const dist = d.length(), step = DOG_SPEED * dt;
            if (dist <= step) {
                dog.group.position.x = target.p.x;
                dog.group.position.z = target.p.z;
                dog.wpIndex++;
            } else {
                d.normalize();
                dog.group.position.addScaledVector(d, step);
                dog.group.rotation.y = Math.atan2(d.x, d.z);
            }
            const sw = Math.sin(t * 16) * 0.6;
            u.legs[0].rotation.x = sw; u.legs[3].rotation.x = sw;
            u.legs[1].rotation.x = -sw; u.legs[2].rotation.x = -sw;
            u.head.rotation.x = Math.sin(t * 16) * 0.05;
        }
    } else {
        u.legs.forEach(l => { l.rotation.x = 0; });
        u.head.rotation.y = Math.sin(t * 1.2) * 0.4;
    }
    u.tail.rotation.z = Math.sin(t * (dog.phase === 'walking' ? 14 : 8)) * 0.35;
    const land = isLand(dog.group.position.x, dog.group.position.z);
    dog.boat.visible = !land;
    const dy0 = land ? NODE_Y + (dog.phase === 'walking' ? Math.abs(Math.sin(t * 16)) * 0.004 : 0) : WATER_Y + 0.03 + Math.sin(t * 2) * 0.008;
    dog.group.position.y += (dy0 - dog.group.position.y) * Math.min(1, dt * 8);
    dog.anchor.copy(dog.group.position);
    dog.anchor.y += 0.1;
    if (dog.follow) {
        const p = dog.group.position;
        const yaw = dog.group.rotation.y;
        if (dog.camYaw === undefined) dog.camYaw = yaw;
        let dy = yaw - dog.camYaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        dog.camYaw += dy * 0.05;
        const fx = Math.sin(dog.camYaw), fz = Math.cos(dog.camYaw);
        camera.position.lerp(new THREE.Vector3(p.x - fx * 0.4, p.y + 0.2, p.z - fz * 0.4), 0.1);
        controls.target.lerp(new THREE.Vector3(p.x + fx * 0.4, p.y + 0.03, p.z + fz * 0.4), 0.1);
    }
    if (dog.phase === 'walking' && Math.floor(t * 4) !== dog._tick) {
        dog._tick = Math.floor(t * 4);
        const bar = document.getElementById('dog-leg-progress');
        if (bar) bar.style.width = (100 * Math.min(1, 1 - pathLength(dog.waypoints.slice(dog.wpIndex), dog.group.position) / dog.legLen)).toFixed(0) + '%';
    }
}
function placeDogLabel() {
    if (!dog.labelEl) return;
    placeLabel(dog.labelEl, dog.anchor, dog.active && !dog.follow && camera.position.distanceTo(dog.group.position) < 14);
}
function toggleDogFollow() {
    dog.follow = !dog.follow;
    controls.minDistance = dog.follow ? 0.3 : 1.2;
    camAnimActive = false;
    dog.camYaw = dog.group ? dog.group.rotation.y : undefined;
    const b = document.getElementById('dog-follow');
    if (b) b.textContent = dog.follow ? '🎥 停止跟隨' : '🎥 跟隨こまち';
}

function renderDogCard() {
    const box = document.getElementById('dog-body');
    if (!box) return;
    const stats = `
        <div class="grid grid-cols-4 gap-1.5 text-center">
            ${[['經過', `${Math.max(0, dog.history.length - 1)} 國`], ['里程', `${dog.ri.toFixed(0)} 里`], ['天數', `${dog.days.toFixed(1)} 日`], ['錢袋', `${dog.money} 文`]].map(([k, v]) => `
                <div class="rounded-xl bg-white border border-amber-200 py-1.5"><div class="text-[10px] font-bold text-stone-400">${k}</div><div class="text-sm font-black text-stone-900">${v}</div></div>`).join('')}
        </div>`;
    const log = `
        <div>
            <div class="text-[11px] font-black text-stone-500 mb-1">旅途日誌</div>
            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">${dog.log.slice(0, 12).map((l, i) => `<p class="text-xs leading-relaxed ${i === 0 ? 'text-stone-900 font-bold' : 'text-stone-500'}">${l}</p>`).join('')}</div>
        </div>`;
    if (!dog.active) {
        box.innerHTML = `
            <p class="text-sm text-stone-700 leading-relaxed">江戶時代，沒辦法親自遠行的人，會讓家裡的狗脖子掛上寫著「伊勢參宮」的小袋，代替自己前往伊勢神宮參拜。沿途的旅人、茶屋與旅籠會照顧牠、替牠指路，這樣的狗被稱為「代參犬」或「おかげ犬」。</p>
            <p class="text-sm font-bold text-amber-900">請幫柴犬「こまち」選路，帶牠走到伊勢神宮內宮！</p>
            <div class="text-[11px] font-black text-stone-500">選擇出發地</div>
            <div class="grid grid-cols-2 gap-2">
                ${DOG_STARTS.map(s => `<button onclick="startDogQuest('${s.id}')" class="px-3 py-2 rounded-2xl bg-white border border-amber-300 hover:bg-amber-50 text-left"><div class="text-sm font-black text-stone-900">${s.label}</div><div class="text-[10px] text-stone-500">距伊勢 ${hopsTo(s.id, 'ise')} 國</div></button>`).join('')}
            </div>
            <button onclick="startDogQuest('random')" class="w-full py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black">🎲 隨機出發地</button>
            ${dog.done ? `<p class="text-xs font-bold text-red-700">💮 你已經幫代參犬完成 ${dog.done} 次伊勢參拜</p>` : ''}`;
        return;
    }
    const here = getProv(dog.at);
    let main = '';
    if (dog.phase === 'choose') {
        const nbs = here.neighbors.filter(getProv);
        main = `
            <div class="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-amber-900">📍 こまち在${shortOldName(here)}，下一站往哪裡？</span>
                    <button onclick="dogAskWay()" class="px-2 py-0.5 rounded-full bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100">💡 問路</button>
                </div>
                <div class="text-[11px] text-stone-500">目前距伊勢：${hopsTo(dog.at, 'ise')} 國</div>
                <div class="grid grid-cols-2 gap-1.5">
                    ${nbs.map(n => {
                        const np = getProv(n), h = hopsTo(n, 'ise');
                        const hinted = dog.hint === n;
                        return `<button onclick="dogChoose('${n}')" class="px-2.5 py-1.5 rounded-xl border text-left transition ${hinted ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-300' : 'bg-white border-stone-200 hover:border-amber-400'}">
                            <div class="text-sm font-black text-stone-900">${hinted ? '⭐ ' : ''}${shortOldName(np)}<span class="text-[10px] text-stone-400 font-bold ml-1">${provReading(np).short}</span></div>
                            <div class="text-[10px] text-stone-500">${legRi(dog.at, n).toFixed(0)} 里・距伊勢 ${h} 國</div>
                        </button>`;
                    }).join('')}
                </div>
            </div>`;
    } else if (dog.phase === 'walking') {
        main = `
            <div class="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div class="text-xs font-black text-amber-900">🐾 正從${shortOldName(getProv(dog.from))}走向${shortOldName(getProv(dog.target))}（${legRi(dog.from, dog.target).toFixed(0)} 里）</div>
                <div class="h-2 rounded-full bg-amber-100 overflow-hidden"><div id="dog-leg-progress" class="h-full bg-gradient-to-r from-amber-500 to-orange-500" style="width:0%"></div></div>
            </div>`;
    } else {
        main = `
            <div class="rounded-2xl bg-red-50 border border-red-200 p-3 text-center space-y-2">
                <div class="text-2xl">⛩️🐕💮</div>
                <div class="text-sm font-black text-red-800">代參完成！こまち帶著神宮的御札，準備回家了。</div>
                <div class="flex gap-2 justify-center">
                    <button onclick="showDogCertificate()" class="px-3 py-1.5 rounded-xl bg-red-700 text-white text-xs font-black">📜 查看代參證</button>
                    <button onclick="resetDogQuest()" class="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold">再出發一次</button>
                </div>
            </div>`;
    }
    box.innerHTML = `
        <div class="text-xs text-stone-500">主人：${dog.owner}</div>
        ${main}
        <div class="flex items-center justify-between">
            <span class="text-[11px] font-black text-stone-500">旅程紀錄</span>
            <button id="dog-follow" onclick="toggleDogFollow()" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-white hover:bg-stone-700">${dog.follow ? '🎥 停止跟隨' : '🎥 跟隨こまち'}</button>
        </div>
        ${stats}
        <div class="flex flex-wrap gap-1">${dog.history.map((id, i) => `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${i === dog.history.length - 1 ? 'bg-amber-500 text-white' : 'bg-white border border-stone-200 text-stone-600'}">${shortOldName(getProv(id))}</span>`).join('<span class="text-stone-300 text-[10px]">›</span>')}</div>
        ${log}`;
}

function resetDogQuest() {
    dog.active = false;
    dog.phase = 'idle';
    if (dog.group) dog.group.visible = false;
    if (dog.follow) toggleDogFollow();
    renderDogCard();
}

function showDogCertificate() {
    const start = getProv(dog.start);
    document.getElementById('dog-cert-body').innerHTML = `
        <div class="text-center space-y-1">
            <div class="text-xs font-black tracking-[0.4em] text-red-700">伊勢參宮</div>
            <div class="text-3xl font-serif-jp font-black text-stone-900">代參證</div>
            <div class="text-xs text-stone-500">おかげ犬　こまち</div>
        </div>
        <div class="my-4 text-sm leading-loose text-stone-800 font-serif-jp">
            右之犬、${dog.owner}之代理トシテ、<br>
            ${shortOldName(start)}ヨリ遙々伊勢神宮ヘ參拜ヲ果タシタルコトヲ證ス。
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
            ${[['出發地', shortOldName(start)], ['經過', `${dog.history.length - 1} 國`], ['里程', `約 ${dog.ri.toFixed(0)} 里`], ['天數', `約 ${dog.days.toFixed(1)} 日`], ['收到的善意', `${dog.kindness} 次`], ['剩下的旅費', `${dog.money} 文`]].map(([k, v]) => `<div class="rounded-xl bg-white/80 border border-red-200 px-3 py-2"><div class="text-[10px] text-stone-400 font-bold">${k}</div><div class="font-black text-stone-900">${v}</div></div>`).join('')}
        </div>
        <div class="mt-3 text-[11px] text-stone-500">路線：${dog.history.map(id => shortOldName(getProv(id))).join(' → ')}</div>
        <div class="mt-4 flex items-center justify-between">
            <span class="text-xs font-bold text-red-700">💮 累計完成 ${dog.done} 次代參</span>
            <span class="w-14 h-14 rounded-full border-2 border-red-600 text-red-600 font-serif-jp font-black text-xs flex items-center justify-center rotate-12">神宮<br>參拜</span>
        </div>`;
    showModal('dog-cert-modal');
}
