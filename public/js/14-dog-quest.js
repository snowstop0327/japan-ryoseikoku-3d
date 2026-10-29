// 代參犬任務
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 代參犬任務：替無法遠行的主人去參拜的狗
 *   目的地可選伊勢神宮（おかげ犬）或讚岐金刀比羅宮（こんぴら狗）
 *   玩家在每一國替牠選下一站；路上會遇到事件（見 14b-dog-encounters.js），
 *   要顧好體力與錢袋，抵達後依腳程、旅費、善意評出金・銀・銅的代參證
 ***********************************************************************/
const DOG_KEY = 'shinkoku_okage_dog_v1';
const DOG_GRADE_KEY = 'shinkoku_okage_dog_grade_v1';
const DOG_SPEED = 0.26;
const DOG_PACE = 10;            // 每日步行里數
const DOG_DESTS = {
    ise: {
        prov: 'ise', icon: '⛩️', short: '伊勢神宮', shrine: '伊勢神宮 內宮', trip: '伊勢參り', dogName: 'おかげ犬', pouch: '伊勢參宮',
        certPlace: '伊勢神宮', seal: '神宮', charm: '神宮的御札',
        arrive: '抵達伊勢神宮內宮！こまち走過宇治橋，在御正宮前替主人參拜，袋子裡放進了神宮的御札。'
    },
    konpira: {
        prov: 'sanuki', icon: '⛰️', short: '金刀比羅宮', shrine: '讚岐 金刀比羅宮', trip: '金毘羅參り', dogName: 'こんぴら狗', pouch: '金毘羅參',
        certPlace: '讚岐金毘羅大權現', seal: '金毘羅', charm: '金刀比羅宮的御守',
        arrive: '抵達讚岐琴平！こまち一口氣爬完 785 級石階，在金刀比羅宮本宮前替主人參拜，袋子裡放進了「こんぴらさん」的御守。'
    }
};
const DOG_GRADES = {
    3: { name: '金', text: 'text-amber-600', seal: 'border-amber-500 text-amber-600', note: '又快又省、處處受到照顧，完美的代參之旅！' },
    2: { name: '銀', text: 'text-slate-500', seal: 'border-slate-400 text-slate-500', note: '很不錯的旅程，離金印只差一點！' },
    1: { name: '銅', text: 'text-orange-800', seal: 'border-orange-700 text-orange-800', note: '辛苦的旅程，但こまち還是完成了代參！' }
};
const DOG_STARTS = [
    { id: 'hokkaido_ezo', label: '蝦夷地（松前）', owner: '松前城下的昆布問屋' },
    { id: 'mutsu_aomori', label: '陸奧國（弘前）', owner: '弘前城下的漆器師傅' },
    { id: 'rikuzen', label: '陸前國（仙台）', owner: '仙台城下的味噌屋' },
    { id: 'echigo', label: '越後國（新潟）', owner: '新潟港的船問屋' },
    { id: 'musashi', label: '武藏國（江戶）', owner: '江戶神田的米屋老闆' },
    { id: 'shinano', label: '信濃國（善光寺）', owner: '善光寺門前的蕎麥麵店' },
    { id: 'kaga', label: '加賀國（金澤）', owner: '金澤的金箔師傅' },
    { id: 'owari', label: '尾張國（名古屋）', owner: '名古屋的瀨戶物商' },
    { id: 'yamashiro', label: '山城國（京都）', owner: '京都西陣的織布師傅' },
    { id: 'settsu', label: '攝津國（大坂）', owner: '大坂船場的藥種商' },
    { id: 'izumo', label: '出雲國（松江）', owner: '松江的老茶屋' },
    { id: 'aki', label: '安藝國（廣島）', owner: '廣島的牡蠣船主' },
    { id: 'tosa', label: '土佐國（高知）', owner: '高知城下的鰹節屋' },
    { id: 'chikuzen', label: '筑前國（博多）', owner: '博多的織物商' },
    { id: 'higo', label: '肥後國（熊本）', owner: '熊本城下的刀匠' },
    { id: 'satsuma', label: '薩摩國（鹿兒島）', owner: '鹿兒島城下的鍛冶師傅' },
    { id: 'ryukyu', label: '琉球（那霸）', owner: '那霸港的泡盛酒造' },
    { id: 'ise', label: '伊勢國（松阪）', owner: '松阪的木棉商' },
    { id: 'sanuki', label: '讚岐國（丸龜）', owner: '丸龜的團扇師傅' }
];
let dogDestChoice = 'ise';
const dog = {
    active: false, phase: 'idle', group: null, at: null, from: null, start: null, owner: '', dest: 'ise',
    waypoints: [], wpIndex: 0, legLen: 0, history: [], days: 0, ri: 0, money: 200, kindness: 0,
    stamina: 100, collapses: 0, best: 1, grade: null, legSea: false, lostBack: false,
    log: [], follow: false, labelEl: null, anchor: new THREE.Vector3(), hint: null, camYaw: undefined, done: 0,
    encAt: null, encSeen: [], encCount: 0, encRainy: '', lift: 0, wag: 0   // 途中遭遇（見 14b-dog-encounters.js）
};
try { dog.done = parseInt(localStorage.getItem(DOG_KEY) || '0', 10) || 0; } catch (e) {}

// 柴犬：橘色身體、白色腹部與口鼻、捲尾、紅項圈與參拜小袋（字依目的地，見 setPouchText）
// opts 可換毛色、拿掉項圈與小袋（遭遇裡的野狗、狐狸共用這個模型）
function buildDog(opts = {}) {
    const g = new THREE.Group();
    g.rotation.order = 'YXZ';   // 先轉方向再俯仰，坐下／趴下才不會歪
    const sm = (c, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, extra));
    const fur = sm(opts.fur || 0xc9773a), white = sm(opts.white || 0xf6efe4), dark = sm(0x1b1b1f), red = sm(0xc0392b);
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
    g.userData = { legs, head, tail };
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    if (opts.plain) return g;
    // 紅項圈＋白色小袋
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
    const pouchTex = new THREE.CanvasTexture(cv);
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), [white, white, white, white, new THREE.MeshStandardMaterial({ map: pouchTex }), white]);
    g.userData.pouchCanvas = cv;
    g.userData.pouchTex = pouchTex;
    pouch.position.set(0, 0.21, 0.19);
    g.add(pouch);
    collar.castShadow = pouch.castShadow = true;
    return g;
}

// 小袋上的四個字：換目的地時重畫
function setPouchText(text) {
    const u = dog.group && dog.group.userData;
    if (!u || !u.pouchCanvas) return;
    const c2 = u.pouchCanvas.getContext('2d');
    c2.fillStyle = '#fbf8f0'; c2.fillRect(0, 0, 64, 96);
    c2.fillStyle = '#1f2937'; c2.font = 'bold 20px "Noto Serif TC", serif'; c2.textAlign = 'center';
    [...text].forEach((ch, i) => c2.fillText(ch, 32, 22 + i * 20));
    u.pouchTex.needsUpdate = true;
}

// 島的底座往外多長出約 0.38（ExtrudeGeometry 的 bevel，見 05-seasons.js），
// 所以離海岸線 0.36 以內也算陸地，こまち才不會「坐船」鑽到地形底下
function isLand(x, z) {
    return ISLAND_POLYS.some(pl => pointInPoly(x, z, pl) || distToPoly(x, z, pl) < 0.36);
}
function distToPoly(x, z, pl) {
    let best = Infinity;
    for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) {
        const [ax, az] = pl[j], [bx, bz] = pl[i];
        const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
        const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
        best = Math.min(best, Math.hypot(x - ax - dx * k, z - az - dz * k));
    }
    return best;
}
function hopsTo(from, to) {
    const p = routeBetween(from, to);
    return p ? p.length - 1 : 99;
}
function legRi(a, b) {
    const A = getProv(a), B = getProv(b);
    return Math.hypot(A.mapX - B.mapX, A.mapZ - B.mapZ) * KM_PER_UNIT / KM_PER_RI;
}
// 兩國連線上取幾個點，只要有一點在海上（用原始海岸線判斷）就要搭渡船
function isSeaLeg(a, b) {
    const A = getProv(a), B = getProv(b);
    for (let k = 1; k < 10; k++) {
        const x = A.mapX + (B.mapX - A.mapX) * k / 10, z = A.mapZ + (B.mapZ - A.mapZ) * k / 10;
        if (!ISLAND_POLYS.some(pl => pointInPoly(x, z, pl))) return true;
    }
    return false;
}
const destInfo = () => DOG_DESTS[dog.dest] || DOG_DESTS.ise;
const destProv = () => destInfo().prov;
// 最短路線走完要幾天：評等的基準
function bestDays(from, to) {
    const p = routeBetween(from, to);
    if (!p) return 1;
    let ri = 0;
    for (let i = 0; i < p.length - 1; i++) ri += legRi(p[i], p[i + 1]);
    return Math.max(0.5, ri / DOG_PACE);
}
function addStamina(v) {
    dog.stamina = Math.max(0, Math.min(100, dog.stamina + v));
}
// 體力歸零：倒在路邊休養一天
function checkCollapse() {
    if (dog.stamina > 0) return '';
    dog.days += 1;
    dog.stamina = 45;
    dog.collapses++;
    return '　こまち累倒了……好心的路人把牠抱到屋簷下，休養了一整天（+1 日）。';
}

function openDogCard() {
    ['left-detail-card', 'traveler-card', 'pref-card'].forEach(id => setCardVisible(id, false));
    travelerCardOpen = false;
    selectedPref = null;
    hideWalkerCardOnly();
    setCardVisible('dog-card', true);
    renderDogCard();
    if (dog.active && dog.group && dog.phase !== 'event') {
        const p = dog.group.position;
        flyCamera(new THREE.Vector3(p.x - 0.35, p.y + 1.4, p.z + 1.8), new THREE.Vector3(p.x - 0.35, p.y + 0.1, p.z));
    }
}
function closeDogCard() {
    setCardVisible('dog-card', false);
    if (dog.follow) toggleDogFollow();
}

function pickDogDest(id) {
    if (dog.active) return;
    dogDestChoice = id;
    renderDogCard();
}

function startDogQuest(startId) {
    endEncounter();
    const dest = DOG_DESTS[dogDestChoice] ? dogDestChoice : 'ise';
    const D = DOG_DESTS[dest];
    const pool = DOG_STARTS.filter(x => x.id !== D.prov);
    const s = pool.find(x => x.id === startId) || pool[Math.floor(Math.random() * pool.length)];
    const p = getProv(s.id);
    // 旅費依路程給：基本 120 文＋每國 16 文（約一晚的旅籠錢）
    const money0 = Math.round((120 + hopsTo(s.id, D.prov) * 16) / 10) * 10;
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
        active: true, phase: 'choose', at: s.id, from: null, start: s.id, owner: s.owner, dest,
        waypoints: [], wpIndex: 0, history: [s.id], days: 0, ri: 0, money: money0, money0, kindness: 0, hint: null,
        stamina: 100, collapses: 0, best: bestDays(s.id, D.prov), lostBack: false, grade: null,
        encSeen: [], encCount: 0, legEnc: false,
        log: [`${s.owner}的老爺子病倒了，沒辦法親自去${D.short}參拜。こまち脖子掛上寫著「${D.pouch}」的小袋（裡面有旅費 ${money0} 文和說明的紙條），從${shortOldName(p)}出發了！`]
    });
    setPouchText(D.pouch);
    dog.group.position.set(p.mapX + 0.4, NODE_Y, p.mapZ + 0.15);
    dog.group.visible = true;
    openDogCard();
    showToast(`🐕 こまち出發前往${D.short}！幫牠選下一站吧`);
}

function dogAskWay() {
    const nbs = getProv(dog.at).neighbors.filter(getProv);
    let best = null;
    nbs.forEach(n => { const h = hopsTo(n, destProv()); if (!best || h < best.h) best = { id: n, h }; });
    dog.hint = best ? best.id : null;
    dog.money = Math.max(0, dog.money - 4);
    dog.log.unshift(`驛站的人看到袋子上的「${destInfo().pouch}」，指著${shortOldName(getProv(dog.hint))}的方向說：「往那邊走！」（茶錢 4 文）`);
    renderDogCard();
}

// 原地休息一天：補體力
function dogRest() {
    if (dog.phase !== 'choose') return;
    dog.days += 1;
    const paid = dog.money >= 16;
    if (paid) dog.money -= 16;
    addStamina(paid ? 45 : 25);
    dog.log.unshift(paid ? `在${shortOldName(getProv(dog.at))}的旅籠多住了一晚，好好睡了一覺（-16 文，體力 +45）。` : `沒錢住旅籠，在${shortOldName(getProv(dog.at))}的神社屋簷下窩了一天（體力 +25）。`);
    renderDogCard();
}

function dogChoose(next) {
    if (dog.phase !== 'choose') return;
    const sea = isSeaLeg(dog.at, next);
    // 渡海要 40 文船資；不夠的話只能拜託漁夫，一半機率被拒絕、在港口白等一天
    if (sea && dog.money < 40) {
        if (Math.random() < 0.5) {
            dog.days += 1;
            addStamina(10);
            dog.log.unshift(`船資不夠……在港口拜託了一整天，沒有船肯載こまち去${shortOldName(getProv(next))}（+1 日）。`);
            showToast('⛵ 船資不夠，今天沒有船肯載牠');
            renderDogCard();
            return;
        }
        dog.log.unshift(`船資不夠，好心的漁夫讓こまち免費搭了便船去${shortOldName(getProv(next))}。`);
    } else if (sea) {
        dog.money -= 40;
        dog.log.unshift(`要渡海到${shortOldName(getProv(next))}，搭了渡船（船資 40 文）。`);
    }
    dog.from = dog.at;
    dog.phase = 'walking';
    dog.hint = null;
    dog.waypoints = buildWaypoints([dog.at, next], dog.group.position);
    dog.wpIndex = 0;
    dog.legLen = pathLength(dog.waypoints, dog.group.position);
    dog.target = next;
    dog.legSea = sea;
    dog.legEnc = false;
    planEncounter();
    renderDogCard();
}

// 迷路時折返：沿原路走回出發的國
function dogTurnBack() {
    const back = dog.from, P = getProv(back), pos = dog.group.position;
    const a = Math.atan2(pos.z - P.mapZ, pos.x - P.mapX);
    dog.target = back;
    dog.waypoints = [{ p: new THREE.Vector3(P.mapX + Math.cos(a) * 0.46, NODE_Y, P.mapZ + Math.sin(a) * 0.46), node: back }];
    dog.wpIndex = 0;
    dog.legLen = pathLength(dog.waypoints, pos);
    dog.encAt = null;
}

// 抵達一國：住宿、體力、沒有遭遇時的小插曲
function dogArrive() {
    const p = getProv(dog.at);
    const back = dog.lostBack;
    dog.lostBack = false;
    const ri = back ? 0 : legRi(dog.from, dog.at);
    dog.ri += ri;
    dog.days += ri / DOG_PACE * (dog.stamina < 30 ? 1.3 : 1);
    dog.history.push(dog.at);
    addStamina(-Math.round(ri * 0.6));
    const ichi = ichiNames(p);
    const events = [
        () => { dog.kindness++; addStamina(10); return `茶屋的老闆娘請こまち吃了一串糰子 🍡，還摸摸牠的頭。`; },
        () => { dog.kindness++; dog.money += 30; return `同路的旅人看到「${destInfo().pouch}」的袋子，往裡面添了 30 文 💰：「替我也拜一下吧！」`; },
        () => { dog.kindness++; return `こまち在${ichi}前討了水喝，神社的人幫牠把袋子的繩子重新綁好。`; },
        () => { addStamina(-8); return `山路又陡又長，こまち走得氣喘吁吁。`; }
    ];
    let msg = back
        ? '在山裡繞了一大圈，結果又回到了這裡……'
        : dog.legEnc ? 'こまち平安抵達。' : events[Math.floor(Math.random() * events.length)]();
    // 住宿：有錢住旅籠補體力，沒錢只能野宿
    if (dog.at !== destProv()) {
        if (dog.legSea) msg += '（在船上過了一夜）';
        else if (dog.money >= 16) { dog.money -= 16; addStamina(15); msg += '　晚上住進旅籠（-16 文）。'; }
        else { addStamina(-6); msg += '　沒錢住旅籠，只好在路邊野宿，睡得不太好。'; }
    }
    msg += checkCollapse();
    dog.log.unshift(`【${shortOldName(p)}】${msg}`);
    if (dog.at === destProv()) {
        const D = destInfo();
        dog.phase = 'done';
        dog.done++;
        const g = dogGrade();
        dog.grade = g;
        try {
            localStorage.setItem(DOG_KEY, String(dog.done));
            const best = JSON.parse(localStorage.getItem(DOG_GRADE_KEY) || '{}');
            if (!best[dog.dest] || g.rank > best[dog.dest]) best[dog.dest] = g.rank;
            localStorage.setItem(DOG_GRADE_KEY, JSON.stringify(best));
        } catch (e) {}
        dog.log.unshift(D.arrive);
        showToast(`🎉 こまち抵達${D.short}，完成代參！`);
        showDogCertificate();
    } else {
        dog.phase = 'choose';
    }
    renderDogCard();
}

// 代參證評等：腳程、剩下的旅費、收到的善意
function dogGrade() {
    const ratio = dog.days / dog.best;
    const speed = ratio <= 1.3 ? 3 : ratio <= 1.7 ? 2 : ratio <= 2.3 ? 1 : 0;
    const left = dog.money / (dog.money0 || 200);
    const money = left >= 0.45 ? 2 : left >= 0.2 ? 1 : 0;
    const kind = dog.kindness >= 6 ? 2 : dog.kindness >= 3 ? 1 : 0;
    const total = speed + money + kind - Math.min(2, dog.collapses);
    const rank = total >= 6 ? 3 : total >= 4 ? 2 : 1;
    // 提示最弱的一項
    const weak = [[speed / 3, '走快一點（少繞路、少休息）'], [money / 2, '省一點旅費'], [kind / 2, '多接受路上的善意']].sort((a, b) => a[0] - b[0])[0];
    const note = rank === 3 ? DOG_GRADES[3].note : `${DOG_GRADES[rank].note}下次試試${weak[1]}。`;
    return { rank, speed, money, kind, ratio, ...DOG_GRADES[rank], note };
}

function updateDog(dt, t) {
    if (!dog.active || !dog.group) return;
    const u = dog.group.userData;
    if (dog.phase === 'walking' && dog.encAt !== null && dog.legLen > 0
        && 1 - pathLength(dog.waypoints.slice(dog.wpIndex), dog.group.position) / dog.legLen >= dog.encAt) {
        dog.encAt = null;
        dog.legEnc = true;
        startEncounter();
    }
    if (dog.phase === 'event') {
        updateEncounter(dt, t);
    } else if (dog.phase === 'walking') {
        const target = dog.waypoints[dog.wpIndex];
        if (!target) {
            dog.at = dog.target;
            dogArrive();
        } else {
            const d = target.p.clone().sub(dog.group.position);
            d.y = 0;
            // 體力不足時走得慢
            const dist = d.length(), step = DOG_SPEED * (dog.stamina < 30 ? 0.65 : 1) * dt;
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
    const wag = dog.phase === 'event' ? dog.wag : dog.phase === 'walking' ? 14 : 8;
    u.tail.rotation.z = Math.sin(t * wag) * (wag ? 0.35 : 0);
    const land = isLand(dog.group.position.x, dog.group.position.z);
    dog.boat.visible = !land && !(enc && enc.boat);   // 海上遭遇時渡船改由舞台顯示
    const dy0 = (dog.phase === 'event' ? dog.lift : 0) + (land ? NODE_Y + (dog.phase === 'walking' ? Math.abs(Math.sin(t * 16)) * 0.004 : 0) : WATER_Y + 0.03 + Math.sin(t * 2) * 0.008);
    dog.group.position.y += (dy0 - dog.group.position.y) * Math.min(1, dt * (dog.phase === 'event' ? 30 : 8));
    dog.anchor.copy(dog.group.position);
    dog.anchor.y += 0.1;
    if (dog.follow && dog.phase !== 'event') {
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
    placeEncounterBubbles();
    placeLabel(dog.labelEl, dog.anchor, dog.active && !dog.follow && dog.phase !== 'event' && camera.position.distanceTo(dog.group.position) < 14);
}
function toggleDogFollow() {
    dog.follow = !dog.follow;
    controls.minDistance = dog.follow ? 0.3 : 1.2;
    camAnimActive = false;
    dog.camYaw = dog.group ? dog.group.rotation.y : undefined;
    const b = document.getElementById('dog-follow');
    if (b) b.textContent = dog.follow ? '🎥 停止跟隨' : '🎥 跟隨こまち';
}

// 卡片標題跟著目的地變
function renderDogHeader() {
    const D = DOG_DESTS[dog.active ? dog.dest : dogDestChoice] || DOG_DESTS.ise;
    const t = document.getElementById('dog-title'), s = document.getElementById('dog-subtitle'), k = document.getElementById('dog-kind');
    if (t) t.textContent = `こまちの${D.trip}`;
    if (s) s.textContent = `目的地：${D.shrine}`;
    if (k) k.textContent = `代參犬任務・${D.dogName}`;
}

function staminaBar() {
    const v = Math.round(dog.stamina);
    const c = v < 30 ? 'from-red-500 to-rose-500' : v < 60 ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-lime-500';
    return `
        <div>
            <div class="flex items-center justify-between text-[11px] font-black text-stone-500 mb-0.5">
                <span>🐾 體力</span><span class="${v < 30 ? 'text-red-600' : 'text-stone-700'}">${v} / 100${v < 30 ? '・累了，走得比較慢' : ''}</span>
            </div>
            <div class="h-2 rounded-full bg-stone-200 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r ${c} transition-all duration-500" style="width:${v}%"></div></div>
        </div>`;
}

function renderDogCard() {
    renderDogHeader();
    const box = document.getElementById('dog-body');
    if (!box) return;
    if (!dog.active) {
        const D = DOG_DESTS[dogDestChoice];
        let best = {};
        try { best = JSON.parse(localStorage.getItem(DOG_GRADE_KEY) || '{}'); } catch (e) {}
        const starts = DOG_STARTS.filter(s => s.id !== D.prov).map(s => ({ ...s, h: hopsTo(s.id, D.prov) })).sort((a, b) => a.h - b.h);
        box.innerHTML = `
            <p class="text-sm text-stone-700 leading-relaxed">江戶時代，沒辦法親自遠行的人，會讓家裡的狗脖子掛上小袋，代替自己去參拜。沿途的旅人、茶屋與旅籠會照顧牠、替牠指路——去伊勢神宮的叫「おかげ犬」，去讚岐金刀比羅宮的叫「こんぴら狗」。</p>
            <div class="text-[11px] font-black text-stone-500">選擇目的地</div>
            <div class="grid grid-cols-2 gap-2">
                ${Object.entries(DOG_DESTS).map(([id, d]) => `
                    <button onclick="pickDogDest('${id}')" class="px-3 py-2 rounded-2xl border-2 text-left transition ${id === dogDestChoice ? 'bg-amber-100 border-amber-500' : 'bg-white border-stone-200 hover:border-amber-300'}">
                        <div class="text-sm font-black text-stone-900">${d.icon} ${d.short}</div>
                        <div class="text-[10px] text-stone-500">${d.dogName}・小袋「${d.pouch}」</div>
                        ${best[id] ? `<div class="text-[10px] font-black ${DOG_GRADES[best[id]].text}">最佳：${DOG_GRADES[best[id]].name}</div>` : ''}
                    </button>`).join('')}
            </div>
            <div class="text-[11px] font-black text-stone-500">選擇出發地（越遠越難）</div>
            <div class="grid grid-cols-2 gap-1.5">
                ${starts.map(s => `<button onclick="startDogQuest('${s.id}')" class="px-2.5 py-1.5 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 hover:border-amber-400 text-left"><div class="text-[13px] font-black text-stone-900">${s.label}</div><div class="text-[10px] text-stone-500">距${D.short} ${s.h} 國・${s.h >= 9 ? '⭐⭐⭐' : s.h >= 5 ? '⭐⭐' : '⭐'}</div></button>`).join('')}
            </div>
            <button onclick="startDogQuest('random')" class="w-full py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black">🎲 隨機出發地</button>
            ${dog.done ? `<p class="text-xs font-bold text-red-700">💮 你已經幫代參犬完成 ${dog.done} 次代參</p>` : ''}`;
        return;
    }
    const D = destInfo();
    const here = getProv(dog.at);
    let main = '';
    if (dog.phase === 'event' && enc) {
        main = renderEncounterCard();
    } else if (dog.phase === 'choose') {
        const nbs = here.neighbors.filter(getProv);
        main = `
            <div class="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-black text-amber-900">📍 こまち在${shortOldName(here)}，下一站往哪裡？</span>
                    <button onclick="dogAskWay()" class="shrink-0 px-2 py-0.5 rounded-full bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100">💡 問路</button>
                </div>
                <div class="text-[11px] text-stone-500">目前距${D.short}：${hopsTo(dog.at, D.prov)} 國</div>
                <div class="grid grid-cols-2 gap-1.5">
                    ${nbs.map(n => {
                        const np = getProv(n), h = hopsTo(n, D.prov);
                        const hinted = dog.hint === n, sea = isSeaLeg(dog.at, n);
                        return `<button onclick="dogChoose('${n}')" class="px-2.5 py-1.5 rounded-xl border text-left transition ${hinted ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-300' : 'bg-white border-stone-200 hover:border-amber-400'}">
                            <div class="text-sm font-black text-stone-900">${hinted ? '⭐ ' : ''}${shortOldName(np)}<span class="text-[10px] text-stone-400 font-bold ml-1">${provReading(np).short}</span></div>
                            <div class="text-[10px] text-stone-500">${legRi(dog.at, n).toFixed(0)} 里・距${D.short} ${h} 國${sea ? `・<span class="${dog.money < 40 ? 'text-red-600 font-bold' : 'text-sky-700'}">⛵ 船資 40 文</span>` : ''}</div>
                        </button>`;
                    }).join('')}
                </div>
                <button onclick="dogRest()" class="w-full py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-xs font-black text-emerald-800">🛌 在這裡休息一天（體力 +${dog.money >= 16 ? 45 : 25}${dog.money >= 16 ? '，住宿 16 文' : '，沒錢只能睡屋簷下'}）</button>
            </div>`;
    } else if (dog.phase === 'walking') {
        main = `
            <div class="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div class="text-xs font-black text-amber-900">🐾 ${dog.lostBack ? `迷了路，正折返${shortOldName(getProv(dog.target))}` : `正從${shortOldName(getProv(dog.from))}走向${shortOldName(getProv(dog.target))}（${legRi(dog.from, dog.target).toFixed(0)} 里）`}</div>
                <div class="h-2 rounded-full bg-amber-100 overflow-hidden"><div id="dog-leg-progress" class="h-full bg-gradient-to-r from-amber-500 to-orange-500" style="width:0%"></div></div>
            </div>`;
    } else {
        const g = dog.grade || dogGrade();
        main = `
            <div class="rounded-2xl bg-red-50 border border-red-200 p-3 text-center space-y-2">
                <div class="text-2xl">⛩️🐕💮</div>
                <div class="text-sm font-black text-red-800">代參完成！こまち帶著${D.charm}，準備回家了。</div>
                <div class="text-xs font-black ${g.text}">評等：${g.name}</div>
                <div class="flex gap-2 justify-center">
                    <button onclick="showDogCertificate()" class="px-3 py-1.5 rounded-xl bg-red-700 text-white text-xs font-black">📜 查看代參證</button>
                    <button onclick="resetDogQuest()" class="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold">再出發一次</button>
                </div>
            </div>`;
    }
    const stats = `
        <div class="grid grid-cols-4 gap-1.5 text-center">
            ${[['經過', `${Math.max(0, dog.history.length - 1)} 國`], ['里程', `${dog.ri.toFixed(0)} 里`], ['天數', `${dog.days.toFixed(1)} 日`], ['錢袋', `${dog.money} 文`]].map(([k, v]) => `
                <div class="rounded-xl bg-white border ${k === '錢袋' && dog.money < 40 ? 'border-red-300' : 'border-amber-200'} py-1.5"><div class="text-[10px] font-bold text-stone-400">${k}</div><div class="text-sm font-black ${k === '錢袋' && dog.money < 40 ? 'text-red-600' : 'text-stone-900'}">${v}</div></div>`).join('')}
        </div>`;
    const log = `
        <div>
            <div class="text-[11px] font-black text-stone-500 mb-1">旅途日誌</div>
            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">${dog.log.slice(0, 14).map((l, i) => `<p class="text-xs leading-relaxed ${i === 0 ? 'text-stone-900 font-bold' : 'text-stone-500'}">${l}</p>`).join('')}</div>
        </div>`;
    box.innerHTML = `
        <div class="text-xs text-stone-500">主人：${dog.owner}・最短約 ${dog.best.toFixed(1)} 日可到</div>
        ${main}
        ${staminaBar()}
        <div class="flex items-center justify-between">
            <span class="text-[11px] font-black text-stone-500">旅程紀錄</span>
            <button id="dog-follow" onclick="toggleDogFollow()" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-white hover:bg-stone-700">${dog.follow ? '🎥 停止跟隨' : '🎥 跟隨こまち'}</button>
        </div>
        ${stats}
        <div class="flex flex-wrap gap-1">${dog.history.map((id, i) => `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${i === dog.history.length - 1 ? 'bg-amber-500 text-white' : 'bg-white border border-stone-200 text-stone-600'}">${shortOldName(getProv(id))}</span>`).join('<span class="text-stone-300 text-[10px]">›</span>')}</div>
        ${log}`;
}

function resetDogQuest() {
    endEncounter();
    dog.active = false;
    dog.phase = 'idle';
    if (dog.group) dog.group.visible = false;
    if (dog.follow) toggleDogFollow();
    renderDogCard();
}

function showDogCertificate() {
    const start = getProv(dog.start), D = destInfo();
    const g = dog.grade || dogGrade();
    const star = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, (n > 2 ? 3 : 2) - n));
    document.getElementById('dog-cert-body').innerHTML = `
        <div class="text-center space-y-1">
            <div class="text-xs font-black tracking-[0.4em] text-red-700">${D.pouch}</div>
            <div class="text-3xl font-serif-jp font-black text-stone-900">代參證</div>
            <div class="text-xs text-stone-500">${D.dogName}　こまち</div>
        </div>
        <div class="my-4 text-sm leading-loose text-stone-800 font-serif-jp">
            右之犬、${dog.owner}之代理トシテ、<br>
            ${shortOldName(start)}ヨリ遙々${D.certPlace}ヘ參拜ヲ果タシタルコトヲ證ス。
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
            ${[['出發地', shortOldName(start)], ['經過', `${dog.history.length - 1} 國`], ['里程', `約 ${dog.ri.toFixed(0)} 里`], ['天數', `約 ${dog.days.toFixed(1)} 日（最短 ${dog.best.toFixed(1)} 日）`], ['收到的善意', `${dog.kindness} 次`], ['途中遭遇', `${dog.encCount || 0} 回`], ['剩下的旅費', `${dog.money}／${dog.money0} 文`], ['累倒', `${dog.collapses} 次`]].map(([k, v]) => `<div class="rounded-xl bg-white/80 border border-red-200 px-3 py-2"><div class="text-[10px] text-stone-400 font-bold">${k}</div><div class="font-black text-stone-900">${v}</div></div>`).join('')}
        </div>
        <div class="mt-3 rounded-xl bg-white/80 border border-red-200 px-3 py-2 text-xs text-stone-600 grid grid-cols-3 gap-1 text-center">
            <div>腳程<div class="font-black text-amber-600">${star(g.speed)}</div></div>
            <div>旅費<div class="font-black text-amber-600">${star(g.money)}</div></div>
            <div>善意<div class="font-black text-amber-600">${star(g.kind)}</div></div>
        </div>
        <div class="mt-3 text-[11px] text-stone-500">路線：${dog.history.map(id => shortOldName(getProv(id))).join(' → ')}</div>
        <div class="mt-4 flex items-center justify-between">
            <div>
                <div class="text-xs font-bold text-red-700">💮 累計完成 ${dog.done} 次代參</div>
                <div class="text-[11px] text-stone-500">${g.note}</div>
            </div>
            <span class="w-16 h-16 rounded-full border-[3px] ${g.seal} font-serif-jp font-black text-xs flex flex-col items-center justify-center rotate-12 leading-tight">${D.seal}<span class="text-sm">${g.name}</span></span>
        </div>`;
    showModal('dog-cert-modal');
}
