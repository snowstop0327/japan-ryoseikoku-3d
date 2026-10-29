// 代參犬的途中遭遇
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 途中遭遇：こまち走到半路會停下來，路邊演一段 3D 小劇場
 *   玩家替牠做選擇 → 播放對應的動畫 → 結果記進旅途日誌，再繼續上路
 *   每段路約七成機率遇到；同一種遭遇不會連續出現
 ***********************************************************************/
const ENC_CHANCE = 0.75;
let enc = null;   // 進行中的遭遇

// ---------- 小工具 ----------
const encClamp = x => Math.max(0, Math.min(1, x));
const encEase = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
// 時間軸上 a～b 秒之間的進度（0～1，已加緩動）
const seg = (e, a, b) => encEase(encClamp((e - a) / (b - a)));
const encM = (c, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, extra));

// 以こまち停下的位置為原點：f 往前、sd 往右
function encAt(f, sd = 0) {
    const s = enc;
    return new THREE.Vector3(s.P.x + s.fwd.x * f + s.side.x * sd, s.y, s.P.z + s.fwd.z * f + s.side.z * sd);
}
function encFace(o, p, k = 1) {
    let d = Math.atan2(p.x - o.position.x, p.z - o.position.z) - o.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    o.rotation.y += d * k;
}
// 從 a 走到 b（只改水平位置），k 為進度；走動中會面向 b
function encSlide(o, a, b, k) {
    o.position.x = a.x + (b.x - a.x) * k;
    o.position.z = a.z + (b.z - a.z) * k;
    if (k > 0 && k < 1) encFace(o, b, 0.25);
}
function dogLegs(g, t, on, spd = 16, amp = 0.6) {
    const u = g.userData, sw = on ? Math.sin(t * spd) * amp : 0;
    u.legs[0].rotation.x = sw; u.legs[3].rotation.x = sw;
    u.legs[1].rotation.x = -sw; u.legs[2].rotation.x = -sw;
}
function npcLegs(c, t, on, spd = 10) {
    const u = c.userData, sw = on ? Math.sin(t * spd) * 0.5 : 0;
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
    u.armL.rotation.x = -sw * 0.6; u.armR.rotation.x = sw * 0.6;
}

// ---------- 登場角色與道具 ----------
function encNpc(type, color, pattern = 'plain') {
    const c = buildCharacter({ type, color, pattern });
    c.scale.setScalar(0.15);
    c.userData.top = 0.17;
    return c;
}
function encAnimal(fur, white, scale = 0.17) {
    const g = buildDog({ fur, white, plain: true });
    g.scale.setScalar(scale);
    g.userData.top = 0.075;
    return g;
}
function encFox() {
    const g = encAnimal(0xe07b2e, 0xfff7ee, 0.15);
    // 換成蓬鬆的大尾巴，尾尖白色
    const u = g.userData;
    u.tail.clear();
    const brush = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), encM(0xe07b2e));
    brush.scale.set(0.8, 0.8, 2.2);
    brush.position.set(0, 0.03, -0.08);
    brush.rotation.x = -0.6;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), encM(0xfff7ee));
    tip.position.set(0, 0.1, -0.17);
    u.tail.add(brush, tip);
    u.head.children.filter(m => m.geometry && m.geometry.type === 'ConeGeometry').forEach(m => m.scale.set(1.1, 1.5, 1.1));
    return g;
}
// 茶屋：紅毛氈長椅、野點傘、「茶」字旗
function encTeaStall() {
    const g = new THREE.Group();
    const wood = encM(0x8b5a2b), red = encM(0xc0392b);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.04), red);
    bench.position.y = 0.03;
    g.add(bench);
    [[-0.048, -0.014], [0.048, -0.014], [-0.048, 0.014], [0.048, 0.014]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.03, 0.006), wood);
        leg.position.set(x, 0.015, z);
        g.add(leg);
    });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.17, 6), wood);
    pole.position.set(0.035, 0.085, -0.03);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.04, 20, 1, true), encM(0xd9383a, { side: THREE.DoubleSide }));
    canopy.position.set(0.035, 0.17, -0.03);
    g.add(pole, canopy);
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 64;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#f6efe2'; c2.fillRect(0, 0, 32, 64);
    c2.fillStyle = '#b91c1c'; c2.font = 'bold 26px serif'; c2.textAlign = 'center';
    c2.fillText('茶', 16, 40);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.05), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }));
    flag.position.set(-0.05, 0.09, -0.02);
    const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.12, 5), wood);
    fpole.position.set(-0.064, 0.06, -0.02);
    g.add(flag, fpole);
    g.userData.flag = flag;
    return g;
}
// 三色糰子
function encDango() {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.04, 4), encM(0xd8b98a));
    g.add(stick);
    [0xf4a7b9, 0xfaf6ee, 0x8cc26a].forEach((c, i) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), encM(c));
        b.position.y = 0.01 - i * 0.011;
        g.add(b);
    });
    return g;
}
function encCoin() {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.0015, 14), encM(0xd4a72c, { metalness: 0.6, roughness: 0.3 }));
    m.rotation.x = Math.PI / 2;
    return m;
}
function encPurse() {
    const g = new THREE.Group();
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), encM(0x7b2d8b));
    bag.scale.set(1, 0.8, 0.7);
    bag.position.y = 0.008;
    const knot = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0015, 5, 10), encM(0xd4a72c));
    knot.position.y = 0.017;
    g.add(bag, knot);
    return g;
}
function encOnigiri() {
    const g = new THREE.Group();
    const rice = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.016, 3), encM(0xfbfaf5));
    rice.rotation.x = Math.PI / 2;
    rice.position.y = 0.008;
    const nori = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.0105), encM(0x1f2a1f));
    nori.position.set(0, 0.004, 0);
    g.add(rice, nori);
    return g;
}
// 小鳥居（稻荷）
function encTorii() {
    const g = new THREE.Group();
    const red = encM(0xd9383a), black = encM(0x1c1917);
    [-1, 1].forEach(s => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0035, 0.06, 6), red);
        p.position.set(s * 0.018, 0.03, 0);
        g.add(p);
    });
    const kasa = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.007), black);
    kasa.position.y = 0.062;
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.004, 0.005), red);
    nuki.position.y = 0.05;
    g.add(kasa, nuki);
    return g;
}
// 地藏堂：四根柱子、斜屋頂、紅圍兜的石地藏
function encJizoHut() {
    const g = new THREE.Group();
    const wood = encM(0x6b4a2e), roof = encM(0x4b4f55, { flatShading: true });
    [[-0.04, -0.03], [0.04, -0.03], [-0.04, 0.03], [0.04, 0.03]].forEach(([x, z]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.07, 5), wood);
        p.position.set(x, 0.035, z);
        g.add(p);
    });
    [-1, 1].forEach(s => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.004, 0.05), roof);
        r.position.set(0, 0.082, s * 0.019);
        r.rotation.x = s * 0.5;
        g.add(r);
    });
    const stone = encM(0x9a9a92);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.026, 10), stone);
    body.position.set(0, 0.013, -0.018);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 8), stone);
    head.position.set(0, 0.032, -0.018);
    const bib = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.012, 10, 1, true), encM(0xc0392b, { side: THREE.DoubleSide }));
    bib.position.set(0, 0.021, -0.018);
    g.add(body, head, bib);
    return g;
}
// 河：會流動的水面＋蓮台；tint 決定水色（清水藍、暴漲的泥黃）
function encRiver(tint = 0x5fb8f0) {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#d6d6d6'; c2.fillRect(0, 0, 64, 64);
    c2.strokeStyle = 'rgba(255,255,255,.8)'; c2.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        c2.beginPath();
        const y = 6 + i * 10;
        c2.moveTo(i * 9 % 64, y); c2.lineTo(i * 9 % 64 + 18, y);
        c2.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 1.5);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.14), new THREE.MeshStandardMaterial({ map: tex, color: tint, transparent: true, opacity: 0.92, roughness: 0.2 }));
    water.rotation.x = -Math.PI / 2;
    // 外層轉向：寬邊沿著左右、窄邊沿著前進方向
    const g = new THREE.Group();
    g.add(water);
    g.userData.tex = tex;
    return g;
}
function encRendai() {
    const g = new THREE.Group();
    const wood = encM(0xb08350);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.004, 0.04), wood);
    g.add(deck);
    [-1, 1].forEach(s => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.13, 5), wood);
        pole.rotation.x = Math.PI / 2;
        pole.position.set(s * 0.02, -0.002, 0);
        g.add(pole);
    });
    return g;
}
function encDolphin() {
    const g = new THREE.Group();
    const m = encM(0x6f8fa8, { roughness: 0.35 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), m);
    body.scale.set(0.7, 0.7, 2.2);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.02, 4), m);
    fin.position.set(0, 0.016, -0.005);
    fin.rotation.x = -0.4;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.002, 0.01), m);
    tail.position.z = -0.045;
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), encM(0xe9eef2));
    belly.scale.set(0.6, 0.5, 1.9);
    belly.position.y = -0.005;
    g.add(body, fin, tail, belly);
    return g;
}
// 局部的雨
function encRain() {
    const N = 160, pos = new Float32Array(N * 6), seeds = [];
    for (let i = 0; i < N; i++) seeds.push([Math.random() - 0.5, Math.random(), Math.random() - 0.5]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xbcd3e6, transparent: true, opacity: 0.7 }));
    lines.frustumCulled = false;
    lines.userData = { seeds, pos };
    return lines;
}
function updateEncRain(r, center, t, strength = 1) {
    const { seeds, pos } = r.userData;
    seeds.forEach(([x, y0, z], i) => {
        const y = ((y0 - t * 1.6) % 1 + 1) % 1;
        const X = center.x + x * 0.55, Z = center.z + z * 0.55, Y = center.y + y * 0.32;
        pos.set([X, Y, Z, X - 0.004, Y - 0.025, Z], i * 6);
    });
    r.geometry.attributes.position.needsUpdate = true;
    r.material.opacity = 0.7 * strength;
}
// 水花：一圈慢慢擴大的漣漪
function encRipple(p) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.006, 0.009, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.copy(p);
    m.position.y += 0.002;
    m.userData.born = enc.clock;
    enc.stage.add(m);
    enc.ripples.push(m);
}

/***********************************************************************
 * 遭遇清單
 *   where：land 陸路／sea 渡海；build 擺角色；idle 等玩家選擇時的動作
 *   choices[].pick 回傳 { text, d:{money,days,kindness,stamina}, after, anim(e,t) → 播完回傳 true }
 *   after：'back' 表示迷路，繼續上路時折返出發的國
 ***********************************************************************/
const chance = p => Math.random() < p;
const DOG_ENCOUNTERS = [
    {
        id: 'dango', icon: '🍡', title: '路邊的茶屋', where: 'land',
        intro: () => '山路旁有一間撐著紅傘的茶屋，老闆娘正在烤糰子，甜甜的香味飄過來了……',
        build(s) {
            s.add('stall', encTeaStall(), encAt(0.19, 0.08));
            s.add('obaa', encNpc('hyakusho', '#7a5a44', 'shima'), encAt(0.14, 0.05));
            encFace(s.a.stall, encAt(0.1, -0.1));
            encFace(s.a.obaa, s.P);
            s.say('obaa', '哎呀，好可愛的狗狗！', 0.3, 3);
        },
        idle(e, t) {
            const o = enc.a.obaa;
            o.userData.armR.rotation.x = -1.6 + Math.sin(t * 6) * 0.35;   // 招手
            enc.a.stall.userData.flag.rotation.y = Math.sin(t * 2) * 0.3;
            dog.group.userData.head.rotation.x = -0.15 + Math.sin(t * 5) * 0.05;   // 抬頭聞香
            dog.wag = 14;
        },
        choices: [
            {
                label: '🐾 乖乖坐下，討一串糰子',
                pick(s) {
                    const near = encAt(0.095, 0.03), from = dog.group.position.clone();
                    const dango = encDango();
                    s.stage.add(dango);
                    dango.visible = false;
                    s.say('dog', '汪！', 1.0, 1.8);
                    s.say('obaa', '要替主人好好參拜喔！', 2.8, 4.6);
                    return {
                        text: 'こまち端端正正地坐下，老闆娘笑著拿了一串糰子給牠，還摸摸牠的頭。',
                        d: { kindness: 1, days: 0.1, stamina: 15 },
                        anim(e, t) {
                            const g = dog.group, o = s.a.obaa;
                            encSlide(g, from, near, seg(e, 0, 0.8));
                            dogLegs(g, t, e < 0.8);
                            if (e > 0.8) { encFace(g, o.position, 0.2); g.rotation.x = -0.35 * seg(e, 0.8, 1.2); dog.lift = 0.006 * seg(e, 0.8, 1.2); }
                            o.userData.armR.rotation.x = -1.1 * seg(e, 1.2, 1.6) * (1 - seg(e, 2.6, 3));
                            const k = seg(e, 1.6, 2.5);
                            dango.visible = e > 1.4 && e < 4.2;
                            const hand = o.position.clone().add(new THREE.Vector3(0, 0.1, 0)), mouth = g.position.clone().add(new THREE.Vector3(0, 0.07, 0));
                            dango.position.lerpVectors(hand, mouth, k);
                            dango.position.y += Math.sin(k * Math.PI) * 0.03;
                            dango.rotation.z = k * 4;
                            dango.scale.setScalar(1 - seg(e, 2.6, 4.1) * 0.9);
                            if (e > 2.5 && e < 4.1) g.userData.head.rotation.x = 0.25 + Math.sin(t * 18) * 0.15;   // 大口吃
                            dog.wag = 22;
                            if (e > 3) o.rotation.x = Math.sin(seg(e, 3, 3.6) * Math.PI) * 0.15;
                            return e > 4.8;
                        }
                    };
                }
            },
            {
                label: '💨 聞聞香味就好，繼續趕路',
                pick(s) {
                    const from = dog.group.position.clone(), to = encAt(0.32, -0.04);
                    s.say('obaa', '真是隻乖狗狗～', 0.6, 2.4);
                    return {
                        text: 'こまち吞了吞口水，頭也不回地往前走，省下了一點時間。',
                        d: { days: -0.1, stamina: -3 },
                        anim(e, t) {
                            encSlide(dog.group, from, to, seg(e, 0, 2));
                            dogLegs(dog.group, t, e < 2);
                            s.a.obaa.userData.armR.rotation.x = -1.8 + Math.sin(t * 8) * 0.4;
                            encFace(s.a.obaa, dog.group.position, 0.1);
                            return e > 2.4;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'nora', icon: '🐺', title: '野狗擋路', where: 'land',
        intro: () => '一隻灰色的野狗擋在路中間，壓低身子朝こまち汪汪大叫，不讓牠過去！',
        build(s) {
            s.add('nora', encAnimal(0x6b6258, 0xb9b0a3, 0.19), encAt(0.15, 0.01));
            encFace(s.a.nora, s.P);
            s.say('nora', '汪汪汪！', 0.2, 99);
        },
        idle(e, t) {
            const n = enc.a.nora, u = n.userData;
            const bark = Math.max(0, Math.sin(t * 9));
            u.head.rotation.x = -bark * 0.3;
            n.position.y = enc.y + bark * 0.006;
            u.tail.rotation.z = 0;
            const g = dog.group;
            g.rotation.x = 0.12;          // こまち縮著身子
            g.userData.head.rotation.y = Math.sin(t * 3) * 0.2;
            dog.wag = 2;
        },
        choices: [
            {
                label: '🏃 拔腿就跑，繞遠路',
                pick(s) { return dogFlee(s, 'こまち轉身就跑，野狗追了好一段才放棄。繞了一大圈遠路，多花了半天。'); }
            },
            {
                label: '🐶 搖尾巴打招呼',
                pick(s) {
                    if (!chance(0.6)) return dogFlee(s, 'こまち搖著尾巴靠過去，野狗卻叫得更兇了！只好轉身逃跑，繞路多花了半天。');
                    const n = s.a.nora, from = dog.group.position.clone(), meet = encAt(0.09, 0.0);
                    const nFrom = n.position.clone(), nAway = encAt(0.2, 0.32);
                    s.clearSay('nora');
                    s.say('nora', '……嗚？', 0.8, 1.8);
                    s.say('nora', '汪♪', 2.2, 3.4);
                    return {
                        text: 'こまち搖著尾巴慢慢靠過去，兩隻狗互相聞了聞——野狗也開始搖尾巴，還送牠走了一小段路。',
                        d: { kindness: 1 },
                        anim(e, t) {
                            const g = dog.group;
                            encSlide(g, from, meet, seg(e, 0, 1.2));
                            dogLegs(g, t, e < 1.2, 10, 0.4);
                            dog.wag = 24;
                            n.userData.head.rotation.x = e < 1.6 ? 0.25 : 0;
                            n.userData.tail.rotation.z = e > 1.8 ? Math.sin(t * 22) * 0.4 : 0;
                            if (e > 1.4 && e < 2.2) { g.userData.head.rotation.x = 0.2; }
                            if (e > 2) n.position.y = enc.y + Math.abs(Math.sin(t * 10)) * 0.008 * (1 - seg(e, 3.4, 3.6));
                            encSlide(n, nFrom, nAway, seg(e, 3.6, 5.2));
                            dogLegs(n, t, e > 3.6 && e < 5.2, 14);
                            n.visible = e < 5.3;
                            return e > 5.4;
                        }
                    };
                }
            },
            {
                label: '📣 汪！大聲吠回去',
                hint: () => `成功率 ${Math.round(Math.min(0.85, 0.35 + dog.kindness * 0.1) * 100)}%（收到的善意越多越有勇氣）`,
                pick(s) {
                    if (!chance(Math.min(0.85, 0.35 + dog.kindness * 0.1))) return dogFlee(s, 'こまち汪了一聲，可是野狗叫得更大聲……只好轉身逃跑，繞路多花了半天。');
                    const n = s.a.nora, nFrom = n.position.clone(), nAway = encAt(0.15, 0.4);
                    s.clearSay('nora');
                    s.say('dog', '汪！！', 0.2, 1.4);
                    s.say('nora', '嗷嗚…', 1.2, 2.2);
                    return {
                        text: 'こまち鼓起勇氣汪了一聲，野狗嚇了一跳，夾著尾巴跑掉了！',
                        d: {},
                        anim(e, t) {
                            const g = dog.group;
                            dog.lift = Math.sin(seg(e, 0.1, 0.6) * Math.PI) * 0.025;
                            g.userData.head.rotation.x = e < 1 ? -0.35 : 0;
                            dog.wag = e > 2 ? 20 : 0;
                            n.position.y = enc.y + Math.sin(seg(e, 0.4, 0.8) * Math.PI) * 0.015;
                            if (e < 1.1) { const b = encAt(0.19, 0.01); encSlide(n, nFrom, b, seg(e, 0.4, 1)); n.rotation.y = Math.atan2(s.P.x - n.position.x, s.P.z - n.position.z); }
                            else { encSlide(n, encAt(0.19, 0.01), nAway, seg(e, 1.1, 2.4)); dogLegs(n, t, e < 2.4, 20, 0.7); }
                            n.visible = e < 2.5;
                            return e > 2.8;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'kawa', icon: '🌊', title: '川越渡口', where: 'land',
        intro: () => '前面是一條沒有橋的大河。河邊的川越人足喊著：「過河一趟 30 文，坐蓮台不會濕喔！」',
        build(s) {
            const w = encRiver();
            w.position.copy(encAt(0.16, 0));
            w.position.y = s.y + 0.002;
            w.rotation.y = Math.atan2(s.fwd.x, s.fwd.z);
            s.stage.add(w);
            s.a.water = w;
            s.add('r', encRendai(), encAt(0.06, 0));
            s.a.r.position.y = s.y + 0.012;
            s.a.r.rotation.y = Math.atan2(s.fwd.x, s.fwd.z);
            s.add('p1', encNpc('hyakusho', '#3b5f8a', 'ichimatsu'), encAt(0.06 + 0.06, 0.012));
            s.add('p2', encNpc('hyakusho', '#3b5f8a', 'ichimatsu'), encAt(0.06 - 0.06, -0.012));
            [s.a.p1, s.a.p2].forEach(p => { p.rotation.y = Math.atan2(s.fwd.x, s.fwd.z); });
            s.say('p1', '過河一趟 30 文唷！', 0.3, 3.2);
        },
        idle(e, t) {
            enc.a.water.userData.tex.offset.x = t * 0.25;
            dog.group.userData.head.rotation.y = Math.sin(t * 1.5) * 0.4;
        },
        choices: [
            {
                label: '💰 付 30 文，坐蓮台過河', req: () => dog.money >= 30, reqText: '錢不夠',
                pick(s) {
                    const r = s.a.r, p1 = s.a.p1, p2 = s.a.p2;
                    const from = dog.group.position.clone(), on = encAt(0.06, 0);
                    const off = 0.2, land = encAt(0.31, 0);
                    const r0 = r.position.clone(), q1 = p1.position.clone(), q2 = p2.position.clone();
                    s.say('p1', '嘿咻！', 1.2, 2.2);
                    s.say('p2', '嘿咻！', 2.2, 3.2);
                    s.say('dog', '汪～♪', 3.6, 4.6);
                    return {
                        text: 'こまち付了 30 文，乖乖趴在蓮台上，被兩位人足穩穩地扛過了河。',
                        d: { money: -30 },
                        anim(e, t) {
                            const g = dog.group, k = seg(e, 1, 3.6), lift = 0.03 * seg(e, 0.8, 1.1) * (1 - seg(e, 3.6, 3.9));
                            const dx = s.fwd.x * off * k, dz = s.fwd.z * off * k;
                            r.position.set(r0.x + dx, s.y + 0.012 + lift, r0.z + dz);
                            p1.position.set(q1.x + dx, s.y, q1.z + dz);
                            p2.position.set(q2.x + dx, s.y, q2.z + dz);
                            npcLegs(p1, t, e > 1 && e < 3.6, 8);
                            npcLegs(p2, t, e > 1 && e < 3.6, 8);
                            [p1, p2].forEach(p => { p.userData.armL.rotation.x = p.userData.armR.rotation.x = -1.2; });
                            if (e < 0.8) { encSlide(g, from, on, seg(e, 0, 0.8)); dogLegs(g, t, true); }
                            else if (e < 3.9) {
                                g.position.x = r.position.x; g.position.z = r.position.z;
                                dog.lift = r.position.y - s.y - 0.006;
                                g.rotation.x = 0; dogLegs(g, t, false);
                                g.userData.head.rotation.y = Math.sin(t * 2) * 0.5;
                            } else { encSlide(g, r.position.clone(), land, seg(e, 3.9, 4.5)); dogLegs(g, t, e < 4.5); }
                            dog.wag = 16;
                            s.a.water.userData.tex.offset.x = t * 0.25;
                            return e > 4.8;
                        }
                    };
                }
            },
            {
                label: '🏊 自己游過去',
                pick(s) {
                    const lost = chance(0.35);
                    const from = dog.group.position.clone(), a = encAt(0.09, 0), b = encAt(0.23, -0.02), land = encAt(0.29, -0.02);
                    s.say('p1', '哇，好會游！', 1.6, 3.2);
                    if (lost) s.say('dog', '嗚…錢！', 3.4, 4.6);
                    return {
                        text: lost ? 'こまち撲通一聲跳進河裡，奮力游到對岸——可是袋子進了水，被沖走了 10 文，還花了一點時間把毛甩乾。' : 'こまち撲通一聲跳進河裡，狗爬式游到了對岸，用力把毛甩乾。',
                        d: { days: 0.3, money: lost ? -10 : 0, stamina: -12 },
                        anim(e, t) {
                            const g = dog.group;
                            if (e < 0.6) { encSlide(g, from, a, seg(e, 0, 0.6)); dogLegs(g, t, true); }
                            else if (e < 3) {
                                encSlide(g, a, b, (e - 0.6) / 2.4);
                                dog.lift = -0.014 + Math.sin(t * 6) * 0.002;
                                dogLegs(g, t, true, 20, 0.9);
                                if (Math.floor(e * 4) !== s._rip) { s._rip = Math.floor(e * 4); encRipple(g.position.clone().setY(s.y)); }
                            } else if (e < 3.4) { encSlide(g, b, land, seg(e, 3, 3.4)); dogLegs(g, t, true); }
                            else g.rotation.z = Math.sin(t * 40) * 0.25 * (1 - seg(e, 3.4, 4.4));   // 甩水
                            s.a.water.userData.tex.offset.x = t * 0.25;
                            return e > 4.7;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'junrei', icon: '🧳', title: '同路的參拜者', where: 'land',
        intro: () => `一位要去${destInfo().short}參拜的旅人看到こまち脖子上的小袋，蹲下來仔細讀：「${destInfo().pouch}……？」`,
        build(s) {
            s.add('tabi', encNpc('shonin', '#8a6d55', 'shima'), encAt(0.13, 0.04));
            encFace(s.a.tabi, s.P);
            s.say('tabi', '你是代參犬吧！', 0.4, 3.2);
        },
        idle(e, t) {
            enc.a.tabi.rotation.x = 0.2 + Math.sin(t * 2) * 0.03;   // 彎腰看小袋
            dog.group.userData.head.rotation.x = -0.25;
            dog.wag = 12;
        },
        choices: [
            {
                label: '🚶 跟著旅人一起走一段',
                pick(s) {
                    const tb = s.a.tabi, coin = encCoin();
                    s.stage.add(coin);
                    const gFrom = dog.group.position.clone(), gTo = encAt(0.42, -0.02);
                    const tFrom = tb.position.clone(), tTo = encAt(0.44, 0.05);
                    s.say('tabi', '替我也拜一下吧！', 0.4, 2);
                    s.say('tabi', '一起走吧～', 2.4, 4);
                    return {
                        text: '旅人往袋子裡放了 50 文，還帶こまち抄了一條近路，一路有說有笑。',
                        d: { money: 50, kindness: 1, days: -0.2 },
                        anim(e, t) {
                            const g = dog.group;
                            tb.rotation.x = 0.25 * (1 - seg(e, 1.4, 1.8));
                            const k = seg(e, 0.4, 1.3);
                            coin.visible = e > 0.3 && e < 1.35;
                            coin.position.lerpVectors(tb.position.clone().setY(s.y + 0.1), g.position.clone().setY(s.y + 0.035), k);
                            coin.position.y += Math.sin(k * Math.PI) * 0.03;
                            coin.rotation.z = t * 10;
                            dog.wag = 20;
                            const w = seg(e, 1.8, 5);
                            encSlide(g, gFrom, gTo, w);
                            encSlide(tb, tFrom, tTo, w);
                            dogLegs(g, t, w > 0 && w < 1);
                            npcLegs(tb, t, w > 0 && w < 1);
                            return e > 5.3;
                        }
                    };
                }
            },
            {
                label: '🙇 低頭行個禮',
                pick(s) {
                    const tb = s.a.tabi, coin = encCoin();
                    s.stage.add(coin);
                    s.say('tabi', '真有禮貌，拿去買糰子吧！', 1.6, 3.6);
                    return {
                        text: 'こまち低下頭行了兩次禮，旅人笑出聲來，摸摸牠的頭，往袋子裡放了 20 文。',
                        d: { money: 20, kindness: 1 },
                        anim(e, t) {
                            const g = dog.group, bow = Math.max(0, Math.sin(seg(e, 0, 1.4) * Math.PI * 2));
                            g.userData.head.rotation.x = bow * 0.6;
                            g.rotation.x = bow * 0.15;
                            tb.rotation.x = 0.25;
                            tb.userData.armR.rotation.x = -1.3 * seg(e, 1.4, 1.8) * (1 - seg(e, 2.8, 3.2));
                            const k = seg(e, 2.2, 3);
                            coin.visible = e > 2.1 && e < 3.05;
                            coin.position.lerpVectors(tb.position.clone().setY(s.y + 0.1), g.position.clone().setY(s.y + 0.035), k);
                            coin.position.y += Math.sin(k * Math.PI) * 0.025;
                            coin.rotation.z = t * 10;
                            dog.wag = e > 1.6 ? 22 : 10;
                            return e > 3.8;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'kitsune', icon: '🦊', title: '盯上錢袋的狐狸', where: 'land',
        intro: () => '稻荷小鳥居旁，一隻狐狸壓低身子，眼睛直直盯著こまち脖子上的錢袋，一步一步靠過來……',
        build(s) {
            s.add('torii', encTorii(), encAt(0.22, 0.12));
            encFace(s.a.torii, s.P);
            s.add('fox', encFox(), encAt(0.17, 0.09));
            encFace(s.a.fox, s.P);
            s.a.fox.userData.from = s.a.fox.position.clone();
            s.say('fox', '（盯——）', 0.4, 99);
        },
        idle(e, t) {
            const f = enc.a.fox;
            const k = Math.min(1, e / 6) * 0.35;
            const p = f.userData.from.clone().lerp(dog.group.position, k);
            f.position.x = p.x; f.position.z = p.z;
            f.rotation.x = 0.15;
            dogLegs(f, t, true, 4, 0.25);
            f.userData.tail.rotation.z = Math.sin(t * 2) * 0.2;
            dog.group.userData.head.rotation.y = Math.sin(t * 0.8) * 0.3;
            dog.wag = 6;
        },
        choices: [
            {
                label: '📣 汪！把牠嚇跑',
                pick(s) {
                    const f = s.a.fox, fFrom = f.position.clone(), hide = s.a.torii.position.clone();
                    s.clearSay('fox');
                    s.say('dog', '汪！', 0.1, 1.2);
                    s.say('fox', '咿！', 0.5, 1.4);
                    return {
                        text: '狐狸嚇得跳起來，一溜煙鑽進稻荷的小鳥居後面不見了。錢袋保住了！',
                        d: {},
                        anim(e, t) {
                            dog.lift = Math.sin(seg(e, 0, 0.5) * Math.PI) * 0.02;
                            dog.group.userData.head.rotation.x = e < 1 ? -0.35 : 0;
                            f.rotation.x = 0;
                            f.position.y = enc.y + Math.sin(seg(e, 0.4, 0.8) * Math.PI) * 0.03;
                            encSlide(f, fFrom, hide, seg(e, 0.6, 1.8));
                            dogLegs(f, t, e > 0.6 && e < 1.8, 22, 0.8);
                            f.scale.setScalar(0.15 * (1 - seg(e, 1.6, 2)));
                            dog.wag = e > 2 ? 18 : 0;
                            return e > 2.6;
                        }
                    };
                }
            },
            {
                label: '😴 假裝睡覺，不理牠',
                pick(s) {
                    const f = s.a.fox, fFrom = f.position.clone(), coin = encCoin();
                    s.clearSay('fox');
                    s.stage.add(coin);
                    coin.visible = false;
                    const steal = chance(0.5);
                    const nearDog = encAt(0.045, 0.03), away = encAt(0.3, 0.3);
                    if (steal) {
                        s.say('fox', '嘿嘿♪', 2.4, 3.4);
                        s.say('dog', '汪！？', 3.4, 4.6);
                    } else {
                        s.say('fox', '呼啊～', 2.4, 3.6);
                        s.say('dog', 'zzZ', 3.8, 5.4);
                    }
                    return {
                        text: steal ? '狐狸趁こまち閉上眼睛，從袋子裡叼走了 30 文跑掉了！下次要小心……' : '狐狸繞著こまち聞了聞，覺得沒意思，竟然在旁邊捲成一團睡著了。兩隻一起睡了個午覺（多花一點時間）。',
                        d: steal ? { money: -30 } : { days: 0.3, kindness: 1, stamina: 20 },
                        anim(e, t) {
                            const g = dog.group, lie = seg(e, 0, 0.6);
                            dog.lift = -0.008 * lie;
                            g.userData.legs.forEach((l, i) => { l.rotation.x = (i < 2 ? -1.3 : 1.3) * lie; });
                            g.userData.head.rotation.x = 0.3 * lie;
                            dog.wag = 1;
                            f.rotation.x = 0.1;
                            encSlide(f, fFrom, nearDog, seg(e, 0.4, 2.2));
                            dogLegs(f, t, e > 0.4 && e < 2.2, 6, 0.3);
                            if (steal) {
                                coin.visible = e > 2.4 && e < 4.4;
                                coin.position.copy(f.position).setY(s.y + 0.04);
                                if (e > 2.6) { encSlide(f, nearDog, away, seg(e, 2.6, 4.4)); dogLegs(f, t, e < 4.4, 22, 0.8); f.rotation.x = 0; }
                                f.visible = e < 4.4;
                                if (e > 3.3) { g.userData.legs.forEach(l => { l.rotation.x = 0; }); dog.lift = Math.sin(seg(e, 3.3, 3.7) * Math.PI) * 0.02; g.userData.head.rotation.x = 0; dog.wag = 0; encFace(g, f.position, 0.2); }
                                return e > 5;
                            }
                            if (e > 2.2) {
                                const c = seg(e, 2.2, 3);
                                f.rotation.z = c * 1.2;   // 側躺
                                f.position.y = enc.y - 0.006 * c;
                                f.userData.tail.rotation.z = Math.sin(t * 1.5) * 0.15;
                            }
                            return e > 5.6;
                        }
                    };
                }
            },
            {
                label: '🍙 把飯糰分給牠',
                pick(s) {
                    const f = s.a.fox, oni = encOnigiri(), from = dog.group.position.clone().setY(s.y);
                    s.stage.add(oni);
                    s.clearSay('fox');
                    s.say('fox', '……謝謝。', 2.4, 3.8);
                    return {
                        text: 'こまち把袋子裡的飯糰推給狐狸。狐狸吃完朝牠點點頭，鑽進稻荷的鳥居不見了——聽說稻荷神的使者會保佑旅人一路平安。',
                        d: { kindness: 2 },
                        anim(e, t) {
                            const fp = f.position.clone().setY(s.y);
                            const k = seg(e, 0.2, 1.2);
                            oni.position.lerpVectors(from, fp.clone().lerp(from, 0.3), k);
                            oni.rotation.z = -k * 6;
                            oni.visible = e < 2.4;
                            oni.scale.setScalar(1 - seg(e, 1.4, 2.3));
                            f.rotation.x = 0;
                            if (e > 1.3 && e < 2.3) f.userData.head.rotation.x = 0.35 + Math.sin(t * 16) * 0.12;
                            else f.userData.head.rotation.x = e > 2.6 && e < 3.4 ? Math.sin(seg(e, 2.6, 3.4) * Math.PI) * 0.5 : 0;
                            const hide = s.a.torii.position;
                            if (e > 3.6) { encSlide(f, s._fp || (s._fp = f.position.clone()), hide, seg(e, 3.6, 4.6)); dogLegs(f, t, e < 4.6, 12); f.scale.setScalar(0.15 * (1 - seg(e, 4.4, 4.8))); }
                            dog.wag = 18;
                            return e > 5.1;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'saifu', icon: '👛', title: '路上的錢包', where: 'land',
        intro: () => 'こまち在路邊聞到一個紫色的錢包。前面一位商人正東張西望：「咦……我的錢包呢？」',
        build(s) {
            s.add('purse', encPurse(), encAt(0.07, 0.02));
            s.add('owner', encNpc('shonin', '#1e50a2', 'shima'), encAt(0.34, -0.06));
            encFace(s.a.owner, encAt(0.6, -0.08));
            s.say('owner', '咦…我的錢包呢？', 0.5, 99);
        },
        idle(e, t) {
            const o = enc.a.owner;
            o.rotation.y += Math.sin(t * 1.2) * 0.01;   // 東張西望
            dog.group.userData.head.rotation.x = 0.35 + Math.sin(t * 8) * 0.06;   // 低頭聞
            dog.wag = 8;
        },
        choices: [
            {
                label: '🐕 叼起錢包追上去',
                pick(s) {
                    const p = s.a.purse, o = s.a.owner, from = dog.group.position.clone(), grab = encAt(0.055, 0.02), meet = encAt(0.3, -0.05);
                    const coin = encCoin();
                    s.stage.add(coin);
                    coin.visible = false;
                    s.clearSay('owner');
                    s.say('dog', '汪！', 1.6, 2.4);
                    s.say('owner', '我的錢包！謝謝你！', 2.8, 4.6);
                    return {
                        text: 'こまち叼起錢包追了上去。商人感激得一直鞠躬，往牠的袋子裡放了 30 文當謝禮。',
                        d: { kindness: 2, money: 30, days: 0.1, stamina: -5 },
                        anim(e, t) {
                            const g = dog.group;
                            encSlide(g, from, grab, seg(e, 0, 0.5));
                            if (e > 0.6) { encSlide(g, grab, meet, seg(e, 0.6, 2.2)); dogLegs(g, t, e < 2.2, 20, 0.7); }
                            else dogLegs(g, t, true);
                            const mouth = g.position.clone().add(new THREE.Vector3(Math.sin(g.rotation.y) * 0.03, 0.035, Math.cos(g.rotation.y) * 0.03));
                            if (e > 0.5 && e < 2.8) p.position.copy(mouth);
                            if (e > 2.8) { p.position.lerpVectors(mouth, o.position.clone().setY(s.y + 0.08), seg(e, 2.8, 3.1)); p.visible = e < 3.2; }
                            if (e > 1.6) encFace(o, g.position, 0.15);
                            o.rotation.x = e > 3.2 ? Math.max(0, Math.sin((e - 3.2) * 6)) * 0.3 * (1 - seg(e, 4.4, 4.6)) : 0;
                            const k = seg(e, 4.4, 5);
                            coin.visible = e > 4.3 && e < 5.05;
                            coin.position.lerpVectors(o.position.clone().setY(s.y + 0.1), g.position.clone().setY(s.y + 0.035), k);
                            coin.position.y += Math.sin(k * Math.PI) * 0.025;
                            coin.rotation.z = t * 10;
                            dog.wag = 20;
                            return e > 5.4;
                        }
                    };
                }
            },
            {
                label: '👃 不是自己的，繼續趕路',
                pick(s) {
                    const from = dog.group.position.clone(), to = encAt(0.25, 0.08);
                    return {
                        text: 'こまち聞了聞，覺得不是自己的東西，就繼續趕路了。（後來錢包被驛站的人送了回去）',
                        d: {},
                        anim(e, t) {
                            encSlide(dog.group, from, to, seg(e, 0, 1.8));
                            dogLegs(dog.group, t, e < 1.8);
                            return e > 2.1;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'ame', icon: '⛈️', title: '突然的雷雨', where: 'land',
        intro: () => dog.encRainy ? `${dog.encRainy}，天空一下子暗了下來，雨點啪嗒啪嗒地打下來！路邊剛好有一座小小的地藏堂。` : '天空一下子暗了下來，大雨啪嗒啪嗒地打下來！路邊剛好有一座小小的地藏堂。',
        build(s) {
            s.add('hut', encJizoHut(), encAt(0.1, 0.1));
            encFace(s.a.hut, s.P);
            s.a.hut.rotation.y += Math.PI;
            s.a.rain = encRain();
            s.stage.add(s.a.rain);
            s.say('dog', '嗚……', 0.6, 2);
        },
        idle(e, t) {
            updateEncRain(enc.a.rain, dog.group.position, t);
            dog.group.rotation.z = Math.sin(t * 30) * 0.04 * (Math.sin(t * 1.3) > 0.7 ? 1 : 0);
            dog.wag = 0;
            dog.group.userData.head.rotation.x = 0.15;
        },
        choices: [
            {
                label: '⛩️ 躲進地藏堂的屋簷下',
                pick(s) {
                    const from = dog.group.position.clone(), under = s.a.hut.position.clone(), out = encAt(0.2, 0.02);
                    s.say('dog', '（地藏菩薩保佑…）', 1.2, 3);
                    s.say('dog', '汪♪', 4.6, 5.4);
                    return {
                        text: 'こまち鑽進地藏堂的屋簷下，剛好容得下一隻狗。雨停時，來供奉的婆婆把供品分了一點給牠。（躲雨多花半天）',
                        d: { days: 0.5, kindness: 1, stamina: 10 },
                        anim(e, t) {
                            const g = dog.group;
                            if (e < 0.8) { encSlide(g, from, under, seg(e, 0, 0.8)); dogLegs(g, t, true, 20); }
                            else if (e < 4.2) { encFace(g, s.P, 0.1); g.rotation.x = -0.35; dog.lift = 0.006; dogLegs(g, t, false); }
                            else { encSlide(g, under, out, seg(e, 4.2, 5)); dogLegs(g, t, e < 5); }
                            updateEncRain(s.a.rain, s.a.hut.position.clone().setY(s.y), t, 1 - seg(e, 2.6, 4));
                            dog.wag = e > 4 ? 18 : 0;
                            return e > 5.4;
                        }
                    };
                }
            },
            {
                label: '🌧️ 冒雨衝過去',
                pick(s) {
                    const cold = chance(0.4), from = dog.group.position.clone(), to = encAt(0.36, -0.03);
                    if (cold) s.say('dog', '哈啾！', 2.6, 3.6);
                    return {
                        text: cold ? 'こまち一口氣衝過大雨，可是全身濕透著了涼，在下一個驛站休息了一整天。' : 'こまち一口氣衝過大雨，到了屋簷下用力把水甩乾——一點時間都沒浪費！',
                        d: { days: cold ? 1 : 0, stamina: cold ? -20 : -5 },
                        anim(e, t) {
                            const g = dog.group;
                            encSlide(g, from, to, seg(e, 0, 2));
                            dogLegs(g, t, e < 2, 22, 0.8);
                            if (e > 2.1) g.rotation.z = Math.sin(t * 40) * 0.25 * (1 - seg(e, 2.1, 2.7));
                            if (cold && e > 2.6) g.userData.head.rotation.x = Math.sin(seg(e, 2.6, 3) * Math.PI) * 0.5;
                            updateEncRain(s.a.rain, g.position, t);
                            return e > 3.8;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'iruka', icon: '🐬', title: '海豚伴游', where: 'sea',
        intro: () => '渡船開到海中央，一群海豚從船邊躍出水面，跟著船一起游！船夫說：「這可是吉兆啊！」',
        build(s) {
            s.dol = [0, 1, 2].map(i => {
                const d = encDolphin();
                s.stage.add(d);
                return d;
            });
            s.say('dog', '汪？', 0.6, 1.8);
        },
        idle(e, t) { encDolphins(t, 1); dog.wag = 14; dog.group.userData.head.rotation.y = Math.sin(t * 1.4) * 0.6; },
        choices: [
            {
                label: '🐬 在船頭汪汪打招呼',
                pick(s) {
                    s.say('dog', '汪！汪！', 0.1, 1.6);
                    s.say('dog', '汪♪', 2.6, 3.6);
                    return {
                        text: 'こまち在船頭汪汪叫，海豚跳得更高了！船夫高興地說是好兆頭，往袋子裡放了 10 文。',
                        d: { money: 10, kindness: 1 },
                        anim(e, t) {
                            dog.lift = Math.abs(Math.sin(e * 7)) * 0.012 * (1 - seg(e, 1.4, 1.8));
                            encDolphins(t, 1.8);
                            dog.wag = 24;
                            return e > 4;
                        }
                    };
                }
            },
            {
                label: '🐟 跟船夫討魚乾吃',
                pick(s) {
                    s.say('dog', '（嚼嚼）', 1.2, 3);
                    return {
                        text: '船夫笑著分了一條魚乾給こまち。牠一邊吃，一邊看著海豚在浪裡翻滾。',
                        d: { kindness: 1, stamina: 10 },
                        anim(e, t) {
                            dog.group.userData.head.rotation.x = e > 0.8 && e < 3 ? 0.25 + Math.sin(t * 16) * 0.12 : 0;
                            encDolphins(t, 1);
                            dog.wag = 18;
                            return e > 3.6;
                        }
                    };
                }
            }
        ]
    },
    // ===================== 偏凶的遭遇 =====================
    {
        id: 'gomanohai', w: 1.3, icon: '👺', title: '好心的陌生人？', where: 'land',
        intro: () => '一個笑咪咪的男人蹲下來搭話：「小狗，路上壞人多，錢袋我先幫你保管吧？」——他的眼睛一直盯著袋子。',
        build(s) {
            s.add('thief', encNpc('shonin', '#4a4a4a', 'shima'), encAt(0.13, 0.05));
            encFace(s.a.thief, s.P);
            s.say('thief', '我幫你保管錢袋吧？', 0.3, 3.6);
        },
        idle(e, t) {
            const th = enc.a.thief;
            th.rotation.x = 0.18 + Math.sin(t * 2) * 0.04;
            th.userData.armR.rotation.x = -0.9 + Math.sin(t * 3) * 0.2;   // 伸手
            dog.group.userData.head.rotation.z = 0.25;                     // 歪頭
            dog.wag = 6;
        },
        choices: [
            {
                label: '🤝 讓他幫忙保管',
                pick(s) {
                    const th = s.a.thief, loss = Math.min(dog.money, Math.max(40, Math.round(dog.money * 0.5)));
                    const coins = [0, 1, 2].map(() => { const c = encCoin(); s.stage.add(c); c.visible = false; return c; });
                    const from = th.position.clone(), away = encAt(0.08, 0.55);
                    s.say('thief', '嘿嘿，謝啦！', 1.6, 3);
                    s.say('dog', '汪！？', 2.3, 3.6);
                    return {
                        text: `那人接過錢袋，抓了一大把錢就跑——原來是專騙旅人的「護摩の灰」！（被騙走 ${loss} 文）`,
                        d: { money: -loss },
                        anim(e, t) {
                            const g = dog.group;
                            th.rotation.x = 0.3 * (1 - seg(e, 1.6, 1.9));
                            th.userData.armR.rotation.x = -1.2 * (1 - seg(e, 1.6, 1.9));
                            coins.forEach((c, i) => {
                                const k = seg(e, 0.8 + i * 0.25, 1.3 + i * 0.25);
                                c.visible = k > 0 && k < 1;
                                c.position.lerpVectors(g.position.clone().setY(s.y + 0.035), th.position.clone().setY(s.y + 0.1), k);
                                c.position.y += Math.sin(k * Math.PI) * 0.02;
                                c.rotation.z = t * 12;
                            });
                            encSlide(th, from, away, seg(e, 1.9, 3.3));
                            npcLegs(th, t, e > 1.9 && e < 3.3, 16);
                            th.visible = e < 3.3;
                            if (e > 2.3) { encFace(g, th.position, 0.2); dog.lift = Math.sin(seg(e, 2.3, 2.7) * Math.PI) * 0.02; }
                            dog.wag = 0;
                            return e > 4;
                        }
                    };
                }
            },
            {
                label: '📣 汪汪大叫，引人過來',
                pick(s) {
                    const th = s.a.thief, tFrom = th.position.clone(), away = encAt(0.1, 0.55);
                    const ok = chance(0.55);
                    s.say('dog', '汪汪汪！', 0, 1.4);
                    if (ok) {
                        const gd = s.add('guard', encNpc('bushi', '#46536a'), encAt(-0.12, -0.35));
                        const gFrom = gd.position.clone(), gTo = encAt(0.04, -0.08);
                        s.say('guard', '喂！站住！', 1.2, 2.6);
                        s.say('guard', '好狗，你沒事吧？', 3.2, 4.6);
                        return {
                            text: 'こまち汪汪大叫，驛站的役人跑了過來，那個男人嚇得拔腿就逃——原來他是扒手！役人誇こまち是聰明的狗。',
                            d: { kindness: 1 },
                            anim(e, t) {
                                dog.lift = Math.abs(Math.sin(e * 8)) * 0.012 * (1 - seg(e, 1.2, 1.4));
                                dog.group.userData.head.rotation.x = e < 1.4 ? -0.3 : 0;
                                encSlide(gd, gFrom, gTo, seg(e, 0.5, 2));
                                npcLegs(gd, t, e > 0.5 && e < 2, 14);
                                gd.userData.armR.rotation.x = e > 1.2 && e < 2.6 ? -2.2 : 0;
                                encSlide(th, tFrom, away, seg(e, 1.5, 2.9));
                                npcLegs(th, t, e > 1.5 && e < 2.9, 16);
                                th.visible = e < 2.9;
                                if (e > 3) { encFace(gd, dog.group.position, 0.2); dog.wag = 20; }
                                return e > 4.8;
                            }
                        };
                    }
                    const coin = encCoin();
                    s.stage.add(coin);
                    const loss = Math.min(20, dog.money);
                    s.say('thief', '吵死了！', 0.8, 2);
                    return {
                        text: `こまち汪汪大叫，可是附近沒有人……男人一把抓走了 ${loss} 文，頭也不回地跑了。`,
                        d: { money: -loss },
                        anim(e, t) {
                            dog.lift = Math.abs(Math.sin(e * 8)) * 0.012 * (1 - seg(e, 1.2, 1.4));
                            const k = seg(e, 0.8, 1.2);
                            coin.visible = e > 0.8 && e < 2.8;
                            if (e < 1.2) coin.position.lerpVectors(dog.group.position.clone().setY(s.y + 0.035), th.position.clone().setY(s.y + 0.1), k);
                            else coin.position.copy(th.position).setY(s.y + 0.1);
                            encSlide(th, tFrom, away, seg(e, 1.2, 2.8));
                            npcLegs(th, t, e > 1.2 && e < 2.8, 16);
                            th.visible = e < 2.8;
                            dog.wag = 0;
                            return e > 3.4;
                        }
                    };
                }
            },
            {
                label: '💨 夾緊錢袋，快跑離開',
                pick(s) {
                    const th = s.a.thief, from = dog.group.position.clone(), mid = encAt(0.1, -0.13), to = encAt(0.36, -0.06);
                    s.say('thief', '嘖……', 1.2, 2.6);
                    return {
                        text: 'こまち覺得不對勁，夾緊錢袋一路狂奔，跑得上氣不接下氣，總算甩掉了那個男人。',
                        d: { stamina: -15 },
                        anim(e, t) {
                            const g = dog.group;
                            if (e < 0.8) encSlide(g, from, mid, seg(e, 0, 0.8));
                            else encSlide(g, mid, to, seg(e, 0.8, 2));
                            dogLegs(g, t, e < 2, 24, 0.8);
                            encFace(th, g.position, 0.1);
                            th.rotation.x = 0;
                            dog.wag = 0;
                            return e > 2.8;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'sekisho', w: 1.3, icon: '🚧', title: '關所盤查', where: 'land',
        intro: () => '前面是一座關所，守關的武士攔住了こまち：「站住！沒有通行手形，誰都不准過！」',
        build(s) {
            const gate = s.add('gate', encGate(), encAt(0.17, 0));
            gate.rotation.y = Math.atan2(s.fwd.x, s.fwd.z);
            s.add('guard', encNpc('bushi', '#2b2b2b'), encAt(0.12, 0.07));
            encFace(s.a.guard, s.P);
            s.say('guard', '通行手形拿出來！', 0.3, 3.4);
        },
        idle(e, t) {
            enc.a.guard.userData.armR.rotation.x = -0.6 + Math.sin(t * 2) * 0.1;
            dog.group.userData.head.rotation.x = -0.2;
            dog.group.rotation.x = 0.08;
            dog.wag = 3;
        },
        choices: [
            {
                label: '📜 給他看袋裡的說明紙條',
                pick(s) {
                    if (chance(0.6)) {
                        s.say('guard', '原來是代參犬啊！', 1.6, 3);
                        s.say('guard', '過去吧，路上小心。', 3, 4.4);
                        return sekishoPass(s, '守關的武士讀了袋裡的紙條，笑著說：「原來是代參犬，過去吧！」', { kindness: 1 }, 1.2);
                    }
                    const gd = s.a.guard, from = dog.group.position.clone(), near = encAt(0.07, 0.03), back = encAt(-0.18, -0.02);
                    s.say('guard', '狗不准過！回去回去！', 1.6, 3.6);
                    s.say('dog', '嗚……', 3, 4);
                    return {
                        text: '武士看都不看紙條就把こまち趕走了。只好繞一大段山路，從別的路口過去。',
                        d: { days: 1, stamina: -12 },
                        anim(e, t) {
                            const g = dog.group;
                            if (e < 0.8) { encSlide(g, from, near, seg(e, 0, 0.8)); dogLegs(g, t, true); }
                            else if (e < 2.6) { encFace(g, gd.position, 0.2); g.rotation.x = -0.3; }
                            else { encSlide(g, near, back, seg(e, 2.6, 4)); dogLegs(g, t, e < 4, 10, 0.4); g.userData.head.rotation.x = 0.35; }
                            gd.userData.armR.rotation.x = e > 1.6 && e < 3.6 ? -1.6 + Math.sin(t * 12) * 0.5 : -0.4;
                            dog.wag = 0;
                            return e > 4.4;
                        }
                    };
                }
            },
            {
                label: '💰 付 30 文通融一下', req: () => dog.money >= 30, reqText: '錢不夠',
                pick(s) {
                    const coin = encCoin();
                    s.stage.add(coin);
                    s.say('guard', '……咳，過去吧。', 1.4, 2.8);
                    const r = sekishoPass(s, 'こまち叼出 30 文放在武士腳邊，武士咳了一聲，把柵欄拉了起來。', { money: -30 }, 1.2);
                    const base = r.anim;
                    r.anim = (e, t) => {
                        const k = seg(e, 0.9, 1.4);
                        coin.visible = e > 0.85 && e < 1.45;
                        coin.position.lerpVectors(dog.group.position.clone().setY(s.y + 0.03), s.a.guard.position.clone().setY(s.y + 0.08), k);
                        coin.position.y += Math.sin(k * Math.PI) * 0.02;
                        coin.rotation.z = t * 10;
                        return base(e, t);
                    };
                    return r;
                }
            },
            {
                label: '🤫 趁武士不注意，偷溜過去',
                pick(s) {
                    const gd = s.a.guard, ok = chance(0.5);
                    const from = dog.group.position.clone(), edge = encAt(0.12, -0.2), past = encAt(0.3, -0.2), out = encAt(0.36, -0.05);
                    if (ok) {
                        s.say('dog', '（躡手躡腳…）', 0.3, 2);
                        return {
                            text: 'こまち壓低身子沿著柵欄邊緣溜了過去，武士完全沒發現。省下一大段時間！',
                            d: { days: -0.2 },
                            anim(e, t) {
                                const g = dog.group;
                                if (e < 1.2) encSlide(g, from, edge, seg(e, 0, 1.2));
                                else if (e < 2.6) encSlide(g, edge, past, seg(e, 1.2, 2.6));
                                else encSlide(g, past, out, seg(e, 2.6, 3.4));
                                dogLegs(g, t, e < 3.4, 8, 0.35);
                                g.rotation.x = e < 2.6 ? 0.15 : 0;
                                dog.lift = e < 2.6 ? -0.004 : 0;
                                gd.rotation.y += 0.01;   // 武士看向別處
                                dog.wag = e > 3.4 ? 18 : 0;
                                return e > 3.8;
                            }
                        };
                    }
                    const gFrom = gd.position.clone();
                    const loss = Math.min(20, dog.money);
                    s.say('guard', '抓到了！', 1.6, 2.8);
                    s.say('dog', '嗚汪！', 1.9, 2.8);
                    return {
                        text: `こまち想沿著柵欄溜過去，被武士一把抓住！罰了 ${loss} 文，還被趕回去繞遠路。`,
                        d: { money: -loss, days: 1, stamina: -10 },
                        anim(e, t) {
                            const g = dog.group;
                            if (e < 1.5) { encSlide(g, from, edge, seg(e, 0, 1.5)); dogLegs(g, t, true, 8, 0.35); g.rotation.x = 0.15; dog.lift = -0.004; }
                            else if (e < 2.8) { encFace(g, gd.position, 0.2); dog.lift = Math.sin(seg(e, 1.6, 2) * Math.PI) * 0.02; }
                            else { encSlide(g, edge, encAt(-0.18, -0.1), seg(e, 2.8, 4)); dogLegs(g, t, e < 4, 18, 0.6); }
                            encSlide(gd, gFrom, edge.clone().addScaledVector(s.side, 0.06), seg(e, 1.3, 1.9));
                            npcLegs(gd, t, e > 1.3 && e < 1.9, 16);
                            gd.userData.armR.rotation.x = e > 1.7 && e < 2.8 ? -1.6 : -0.4;
                            dog.wag = 0;
                            return e > 4.4;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'mayoi', w: 1.3, icon: '🌫️', title: '山中起霧', where: 'land',
        intro: () => '山裡突然起了大霧，伸手不見五指。眼前是一個岔路口，道標上的字被霧氣模糊得看不清楚……',
        build(s) {
            s.wrong = chance(0.5) ? 0 : 1;   // 哪一條是錯的路（玩家看不到）
            s.add('post', encSignpost(), encAt(0.13, 0));
            s.a.post.rotation.y = Math.atan2(s.fwd.x, s.fwd.z);
            s.fog = [];
            for (let i = 0; i < 14; i++) {
                const m = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xf4f4f0, transparent: true, opacity: 0, depthWrite: false }));
                m.userData.base = encAt(Math.random() * 0.5 - 0.15, Math.random() * 0.6 - 0.3).setY(s.y + 0.02 + Math.random() * 0.06);
                m.userData.ph = Math.random() * 6;
                s.stage.add(m);
                s.fog.push(m);
            }
            s.fogK = 1;
            s.say('dog', '……？', 0.8, 2.4);
        },
        idle(e, t) {
            encFogUpdate(t, Math.min(1, e / 1.2));
            dog.group.userData.head.rotation.x = 0.3 + Math.sin(t * 7) * 0.08;   // 低頭聞
            dog.group.userData.head.rotation.y = Math.sin(t * 1.3) * 0.5;
            dog.wag = 2;
        },
        choices: [
            { label: '↖️ 走左邊的山路', pick: s => mayoiGo(s, 0, s.wrong === 0) },
            { label: '↗️ 走右邊的山路', pick: s => mayoiGo(s, 1, s.wrong === 1) },
            { label: '👃 低頭聞地上的味道找路', pick: s => mayoiGo(s, s.wrong === 0 ? 1 : 0, chance(0.25), true) }
        ]
    },
    {
        id: 'kawadome', w: 1.3, icon: '🚫', title: '川止め・河水暴漲', where: 'land',
        intro: () => '連日大雨，河水漲成了混濁的急流，渡口掛出了「川止」的牌子。川越人足說：「今天封河，誰都不准過！」',
        build(s) {
            const w = encRiver(0x9a6a3a);
            w.position.copy(encAt(0.16, 0));
            w.position.y = s.y + 0.002;
            w.rotation.y = Math.atan2(s.fwd.x, s.fwd.z);
            s.stage.add(w);
            s.a.water = w;
            s.add('sign', encSign('川止'), encAt(0.06, 0.17));
            encFace(s.a.sign, s.P);
            s.add('p1', encNpc('hyakusho', '#3b5f8a', 'ichimatsu'), encAt(0.04, 0.08));
            encFace(s.a.p1, s.P);
            s.say('p1', '今天封河！誰都不准過！', 0.4, 3.6);
            s.flow = 0.9;
        },
        idle(e, t) {
            enc.a.water.userData.tex.offset.x = t * enc.flow;
            if (Math.floor(e * 3) !== enc._rip) { enc._rip = Math.floor(e * 3); encRipple(encAt(0.12 + Math.random() * 0.08, Math.random() * 0.4 - 0.2)); }
            dog.group.userData.head.rotation.y = Math.sin(t * 1.5) * 0.4;
            dog.wag = 2;
        },
        choices: [
            {
                label: '⏳ 乖乖等河水退去',
                pick(s) {
                    const w = s.a.water, mat = w.children[0].material, from = dog.group.position.clone(), a = encAt(0.09, 0), b = encAt(0.23, 0), land = encAt(0.3, 0);
                    const c0 = mat.color.clone(), c1 = new THREE.Color(0x6fb7e6);
                    const pay = Math.min(32, dog.money);
                    s.say('dog', 'zzZ', 0.8, 3.2);
                    s.say('p1', '開河囉——！', 3.4, 4.6);
                    return {
                        text: `こまち在渡口的茶屋等了兩天，河水終於退了。睡飽了精神很好，只是多花了住宿錢${pay ? `（-${pay} 文）` : ''}。`,
                        d: { days: 2, stamina: 25, money: -pay },
                        anim(e, t) {
                            const g = dog.group, k = seg(e, 0.6, 3.4);
                            mat.color.copy(c0).lerp(c1, k);
                            s.flow = 0.9 - 0.65 * k;
                            w.userData.tex.offset.x = t * s.flow;
                            if (e < 3.6) {
                                const lie = seg(e, 0, 0.5) * (1 - seg(e, 3.3, 3.6));
                                dog.lift = -0.008 * lie;
                                g.userData.legs.forEach((l, i) => { l.rotation.x = (i < 2 ? -1.3 : 1.3) * lie; });
                                g.userData.head.rotation.x = 0.3 * lie;
                            } else if (e < 4.1) { encSlide(g, from, a, seg(e, 3.6, 4.1)); dogLegs(g, t, true); }
                            else if (e < 5.3) { encSlide(g, a, b, seg(e, 4.1, 5.3)); dogLegs(g, t, true); dog.lift = -0.006; }
                            else { encSlide(g, b, land, seg(e, 5.3, 5.8)); dogLegs(g, t, e < 5.8); }
                            dog.wag = e > 3.4 ? 16 : 0;
                            return e > 6;
                        }
                    };
                }
            },
            {
                label: '🏊 冒險游過去',
                pick(s) {
                    const ok = chance(0.35);
                    const from = dog.group.position.clone(), a = encAt(0.09, 0);
                    const b = ok ? encAt(0.23, -0.07) : encAt(0.23, -0.3), land = ok ? encAt(0.3, -0.07) : encAt(0.3, -0.32);
                    const loss = ok ? 0 : Math.min(40, dog.money);
                    s.say('p1', '危險啊！', 0.5, 1.8);
                    s.say('dog', ok ? '呼…呼…' : '嗚哇——！', 1.6, 3.2);
                    return {
                        text: ok ? 'こまち咬緊牙關衝進急流，被沖歪了好一段，總算爬上對岸——累得半死。' : `急流一下子就把こまち沖走了！漂了好遠才抓到岸邊的樹根爬上來，袋子進水，${loss} 文被沖走了……`,
                        d: ok ? { stamina: -25 } : { stamina: -32, money: -loss, days: 0.5 },
                        anim(e, t) {
                            const g = dog.group;
                            s.a.water.userData.tex.offset.x = t * s.flow;
                            if (e < 0.6) { encSlide(g, from, a, seg(e, 0, 0.6)); dogLegs(g, t, true); }
                            else if (e < 3.4) {
                                const k = (e - 0.6) / 2.8;
                                g.position.x = a.x + (b.x - a.x) * k; g.position.z = a.z + (b.z - a.z) * k;
                                encFace(g, encAt(0.3, 0), 0.2);
                                dog.lift = -0.015 + Math.sin(t * 7) * 0.004;
                                g.rotation.z = ok ? 0 : Math.sin(t * 5) * 0.3;
                                dogLegs(g, t, true, 24, 1);
                                if (Math.floor(e * 5) !== s._rip) { s._rip = Math.floor(e * 5); encRipple(g.position.clone().setY(s.y)); }
                            } else if (e < 3.9) { encSlide(g, b, land, seg(e, 3.4, 3.9)); dogLegs(g, t, true, 8, 0.3); }
                            else { g.rotation.z = Math.sin(t * 40) * 0.25 * (1 - seg(e, 3.9, 4.8)); g.userData.head.rotation.x = 0.3; }
                            dog.wag = 0;
                            return e > 5;
                        }
                    };
                }
            },
            {
                label: '🚶 找上游的淺灘繞過去',
                pick(s) {
                    const pts = [dog.group.position.clone(), encAt(0.06, 0.32), encAt(0.27, 0.32), encAt(0.32, 0.05)];
                    return {
                        text: 'こまち沿著河岸往上游走了好久，找到水淺的地方才過了河，多花了一天。',
                        d: { days: 1, stamina: -10 },
                        anim(e, t) {
                            const g = dog.group, k = seg(e, 0, 3.6) * 3, i = Math.min(2, Math.floor(k));
                            encSlide(g, pts[i], pts[i + 1], Math.min(1, k - i));
                            dogLegs(g, t, e < 3.6, 12, 0.5);
                            s.a.water.userData.tex.offset.x = t * s.flow;
                            dog.wag = 6;
                            return e > 4;
                        }
                    };
                }
            }
        ]
    },
    {
        id: 'shike', icon: '🌊', title: '海上暴風雨（時化）', where: 'sea',
        intro: () => '渡船開到一半，天色忽然變黑，狂風捲起大浪，船身劇烈搖晃！船夫大喊：「抓緊了！」',
        build(s) {
            s.a.rain = encRain();
            s.stage.add(s.a.rain);
            s.say('dog', '嗚嗚……', 0.8, 2.4);
        },
        idle(e, t) {
            encRock(t, 1);
            updateEncRain(enc.a.rain, dog.group.position, t);
            if (Math.floor(e * 2) !== enc._rip) { enc._rip = Math.floor(e * 2); encRipple(encAt(Math.random() * 0.4 - 0.2, Math.random() * 0.4 - 0.2).setY(WATER_Y)); }
            dog.group.rotation.x = 0.15;
            dog.wag = 0;
        },
        choices: [
            {
                label: '🫣 緊緊趴在船底',
                pick(s) {
                    s.say('dog', '（發抖）', 0.6, 2.6);
                    return {
                        text: 'こまち緊緊趴在船底，一整夜被浪打得渾身濕透。天亮時風浪終於平息，船也被吹偏了航道，多花了半天。',
                        d: { days: 0.5, stamina: -12 },
                        anim(e, t) {
                            const calm = seg(e, 2.4, 4);
                            encRock(t, 1 - calm * 0.85);
                            updateEncRain(s.a.rain, dog.group.position, t, 1 - calm);
                            const g = dog.group;
                            dog.lift = -0.008;
                            g.userData.legs.forEach((l, i) => { l.rotation.x = i < 2 ? -1.3 : 1.3; });
                            g.userData.head.rotation.x = 0.3;
                            dog.wag = e > 4 ? 10 : 0;
                            return e > 4.6;
                        }
                    };
                }
            },
            {
                label: '🪢 幫船夫叼住纜繩',
                pick(s) {
                    const ok = chance(0.55);
                    const loss = ok ? 0 : Math.min(20, dog.money);
                    s.say('dog', ok ? '嗯——！' : '噗哈！', ok ? 0.4 : 1.6, ok ? 2.4 : 3);
                    if (ok) s.say('dog', '汪♪', 3.6, 4.6);
                    return {
                        text: ok ? 'こまち咬住纜繩死命往後拉，幫船夫把帆收了下來！船夫感動地說：「好狗！」還塞了 10 文給牠。' : `一個大浪打來，こまち被甩進海裡！船夫趕緊把牠撈上船，可是袋子進了水，${loss} 文沉到海底了……`,
                        d: ok ? { kindness: 1, money: 10, stamina: -8 } : { stamina: -30, money: -loss, days: 0.5 },
                        anim(e, t) {
                            const g = dog.group, calm = seg(e, 2.8, 4.2);
                            encRock(t, 1 - calm * 0.85);
                            updateEncRain(s.a.rain, g.position, t, 1 - calm);
                            if (ok) {
                                g.rotation.x = e < 2.8 ? -0.35 : 0;   // 往後拉
                                g.userData.head.rotation.x = e < 2.8 ? -0.3 + Math.sin(t * 10) * 0.08 : 0;
                                dogLegs(g, t, e < 2.8, 10, 0.3);
                                dog.wag = e > 3.4 ? 22 : 0;
                            } else {
                                // 被甩出船外再撈回來
                                const out = Math.sin(seg(e, 0.8, 3.4) * Math.PI);
                                g.position.x = s.P.x + s.side.x * 0.14 * out;
                                g.position.z = s.P.z + s.side.z * 0.14 * out;
                                dog.lift = (e > 0.8 && e < 1.2 ? Math.sin(seg(e, 0.8, 1.2) * Math.PI) * 0.03 : 0) - 0.04 * seg(e, 1.1, 1.4) * (1 - seg(e, 3, 3.4));
                                dogLegs(g, t, e > 1.3 && e < 3, 24, 1);
                                if (e > 1.2 && e < 3 && Math.floor(e * 5) !== s._rip) { s._rip = Math.floor(e * 5); encRipple(g.position.clone().setY(WATER_Y)); }
                                if (e > 3.6) g.rotation.z = Math.sin(t * 40) * 0.25 * (1 - seg(e, 3.6, 4.4));
                                dog.wag = 0;
                            }
                            return e > 4.8;
                        }
                    };
                }
            }
        ]
    }
];

// 三隻海豚輪流躍出水面，繞著渡船畫弧
function encDolphins(t, height) {
    const s = enc;
    s.dol.forEach((d, i) => {
        const ph = (t * 0.55 + i / 3) % 1;
        const ang = i * 2.1 + t * 0.3;
        const r = 0.24 + i * 0.05;
        const cx = dog.group.position.x + Math.cos(ang) * r, cz = dog.group.position.z + Math.sin(ang) * r;
        const jump = ph < 0.45 ? Math.sin(ph / 0.45 * Math.PI) : 0;
        d.visible = ph < 0.5;
        d.position.set(cx + Math.sin(ang) * (ph - 0.22) * 0.12, WATER_Y - 0.01 + jump * 0.05 * height, cz - Math.cos(ang) * (ph - 0.22) * 0.12);
        d.rotation.y = ang + Math.PI;
        d.rotation.x = -Math.cos(ph / 0.45 * Math.PI) * 0.9;
        if (ph < 0.02 || (ph > 0.44 && ph < 0.46)) {
            if (!d.userData.splashed) { d.userData.splashed = true; encRipple(d.position.clone().setY(WATER_Y)); }
        } else d.userData.splashed = false;
    });
}

// 被追著逃跑：往旁邊繞一大圈再回到路上
function dogFlee(s, text) {
    const n = s.a.nora, nFrom = n.position.clone();
    const pts = [dog.group.position.clone(), encAt(-0.04, 0.16), encAt(0.14, 0.26), encAt(0.32, 0.1)];
    s.clearSay('nora');
    s.say('nora', '汪汪汪汪！', 0, 2);
    s.say('dog', '嗚哇～', 0.3, 1.6);
    return {
        text, d: { days: 0.5, stamina: -15 },
        anim(e, t) {
            const g = dog.group, k = seg(e, 0, 3) * 3, i = Math.min(2, Math.floor(k));
            encSlide(g, pts[i], pts[i + 1], Math.min(1, k - i));
            dogLegs(g, t, e < 3, 24, 0.8);
            dog.wag = 0;
            // 野狗追一小段就停下來繼續叫
            const chaseTo = encAt(0.02, 0.12);
            encSlide(n, nFrom, chaseTo, seg(e, 0.2, 1.4));
            dogLegs(n, t, e > 0.2 && e < 1.4, 22, 0.7);
            if (e > 1.4) { encFace(n, g.position, 0.2); n.position.y = enc.y + Math.max(0, Math.sin(t * 9)) * 0.006; }
            return e > 3.4;
        }
    };
}

// 關所：兩根門柱、屋頂、左右柵欄、可以抬起的紅白遮斷桿
function encGate() {
    const g = new THREE.Group();
    const wood = encM(0x5a3b22), dark = encM(0x2d2a26), white = encM(0xe9e2d0), red = encM(0xd9383a);
    [-1, 1].forEach(sx => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.1, 0.008), wood);
        post.position.set(sx * 0.055, 0.05, 0);
        const fence = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.004), white);
        fence.position.set(sx * 0.105, 0.022, 0);
        const fpost = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.05, 0.006), wood);
        fpost.position.set(sx * 0.155, 0.025, 0);
        g.add(post, fence, fpost);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.008, 0.01), dark);
    beam.position.y = 0.1;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.006, 0.04), dark);
    roof.position.y = 0.108;
    g.add(beam, roof);
    const pivot = new THREE.Group();
    pivot.position.set(-0.048, 0.035, 0);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.005, 0.005), red);
    bar.position.x = 0.0475;
    pivot.add(bar);
    g.add(pivot);
    g.userData.bar = pivot;
    return g;
}
// 寫字的小木牌
function encBoard(text, w, h, color = '#1f2937') {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = Math.round(128 * h / w);
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#e8d6b0'; c2.fillRect(0, 0, cv.width, cv.height);
    c2.strokeStyle = '#7a5530'; c2.lineWidth = 6; c2.strokeRect(3, 3, cv.width - 6, cv.height - 6);
    c2.fillStyle = color; c2.font = `bold ${Math.round(cv.height * 0.55)}px "Noto Serif TC", serif`;
    c2.textAlign = 'center'; c2.textBaseline = 'middle';
    c2.fillText(text, cv.width / 2, cv.height / 2 + 2);
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.003), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv) }));
}
// 「川止」的告示牌
function encSign(text) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.07, 5), encM(0x6b4a2e));
    post.position.y = 0.035;
    const board = encBoard(text, 0.05, 0.025, '#b91c1c');
    board.position.y = 0.065;
    g.add(post, board);
    return g;
}
// 岔路口的道標：兩塊箭頭木牌，字被霧弄得看不清
function encSignpost() {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 6), encM(0x6b4a2e));
    post.position.y = 0.045;
    g.add(post);
    [[1, 0.075, '？？ →'], [-1, 0.06, '← ？？']].forEach(([s, y, txt]) => {
        const b = encBoard(txt, 0.045, 0.012);
        b.position.set(s * 0.02, y, 0);
        b.rotation.y = -s * 0.35;
        g.add(b);
    });
    return g;
}
// 霧：k=0 沒有霧，1 濃霧，超過 1 更濃更大
function encFogUpdate(t, k) {
    (enc.fog || []).forEach((m, i) => {
        const b = m.userData.base;
        m.position.set(b.x + Math.sin(t * 0.4 + m.userData.ph) * 0.04, b.y + Math.sin(t * 0.7 + i) * 0.01, b.z + Math.cos(t * 0.3 + m.userData.ph) * 0.04);
        m.material.opacity = 0.42 * Math.min(1, Math.max(0, k));
        m.scale.setScalar(1 + Math.max(0, k - 1) * 0.8);
    });
}
// 迷路：dir 0 左、1 右；wrong 走錯就折返出發的國
function mayoiGo(s, dir, wrong, sniff = false) {
    const from = dog.group.position.clone(), fork = encAt(0.08, 0);
    const end = encAt(0.34, dir === 0 ? 0.17 : -0.17);
    const t0 = sniff ? 1.6 : 0;
    if (sniff) s.say('dog', '（嗅嗅…）', 0, 1.6);
    s.say('dog', wrong ? '……？？' : '汪♪', t0 + 2.3, t0 + 3.6);
    const backName = shortOldName(getProv(dog.from));
    return {
        text: wrong
            ? `${sniff ? 'こまち低頭聞了聞，選了一條路……可是' : ''}霧越來越濃，こまち在山裡越走越不對勁。繞了一整天，結果又走回了${backName}！`
            : `${sniff ? 'こまち低頭聞了聞，' : ''}選的路是對的！霧散開時，遠方已經看得到下一個驛站了。`,
        d: wrong ? { days: 1, stamina: -15 } : { stamina: -3 },
        after: wrong ? 'back' : null,
        anim(e, t) {
            const g = dog.group;
            if (sniff && e < t0) {
                g.userData.head.rotation.x = 0.45;
                g.userData.head.rotation.y = Math.sin(t * 4) * 0.6;
                encSlide(g, from, fork, seg(e, 0, t0));
                dogLegs(g, t, true, 6, 0.25);
            } else {
                const k = seg(e, t0, t0 + 2.2);
                encSlide(g, sniff ? fork : from, end, k);
                dogLegs(g, t, k < 1);
                if (wrong && k >= 1) g.userData.head.rotation.y = Math.sin(t * 3) * 0.6;
            }
            encFogUpdate(t, wrong ? 1 + seg(e, t0, t0 + 2) * 0.6 : 1 - seg(e, t0 + 1, t0 + 2.6));
            dog.wag = wrong ? 0 : 14;
            return e > t0 + 3.8;
        }
    };
}
// 關所放行：走到武士面前坐好 → 柵欄抬起 → 走過去
function sekishoPass(s, text, d, wait) {
    const gate = s.a.gate, gd = s.a.guard, from = dog.group.position.clone(), near = encAt(0.07, 0.02), through = encAt(0.34, 0);
    return {
        text, d,
        anim(e, t) {
            const g = dog.group;
            if (e < 0.8) { encSlide(g, from, near, seg(e, 0, 0.8)); dogLegs(g, t, true); }
            else if (e < wait + 1.4) { encFace(g, gd.position, 0.2); g.rotation.x = -0.3; dog.lift = 0.005; }
            else { encSlide(g, near, through, seg(e, wait + 1.4, wait + 2.8)); dogLegs(g, t, e < wait + 2.8); }
            gd.rotation.x = e > 0.9 && e < wait + 0.9 ? 0.25 : 0;
            gate.userData.bar.rotation.z = 1.3 * seg(e, wait + 0.8, wait + 1.3);
            dog.wag = e > wait + 0.9 ? 18 : 4;
            return e > wait + 3.1;
        }
    };
}
// 暴風雨中搖晃的渡船（amp 0～1）
function encRock(t, amp) {
    const r = Math.sin(t * 2.6) * 0.22 * amp, p = Math.sin(t * 1.9 + 1) * 0.12 * amp, h = Math.sin(t * 3.1) * 0.012 * amp;
    if (enc.boat) { enc.boat.rotation.z = r; enc.boat.rotation.x = p; enc.boat.position.y += h; }
    dog.group.rotation.z += r;
    dog.group.rotation.x += p;
    dog.lift += h;
}

/***********************************************************************
 * 清場：鏡頭和舞台之間的樹木、建築先藏起來，結束後再放回去
 *   樹木是 InstancedMesh，只把擋到的那幾棵縮成 0
 ***********************************************************************/
const _encM4 = new THREE.Matrix4(), _encV = new THREE.Vector3(), _encS = new THREE.Sphere();
const ENC_ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function encBlocks(p, r, A, B) {
    // 水平面上，物件到「舞台→鏡頭」線段的距離
    const dx = B.x - A.x, dz = B.z - A.z, L2 = dx * dx + dz * dz;
    const k = Math.max(-0.35, Math.min(1.1, ((p.x - A.x) * dx + (p.z - A.z) * dz) / L2));
    const qx = A.x + dx * k, qz = A.z + dz * k;
    return Math.hypot(p.x - qx, p.z - qz) < 0.09 + r * 0.7 && p.y + r > A.y;
}
function encClearView(A, B) {
    const hidden = { meshes: [], inst: [] };
    const skip = new Set([enc.stage, dog.group]);
    scene.traverse(o => {
        if (!o.isMesh || !o.visible) return;
        for (let q = o; q; q = q.parent) if (skip.has(q)) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        if (o.isInstancedMesh) {
            const r0 = o.geometry.boundingSphere.radius;
            for (let i = 0; i < o.count; i++) {
                o.getMatrixAt(i, _encM4);
                _encV.setFromMatrixPosition(_encM4).applyMatrix4(o.matrixWorld);
                const sc = _encM4.getMaxScaleOnAxis() * o.matrixWorld.getMaxScaleOnAxis();
                if (encBlocks(_encV, r0 * sc, A, B)) {
                    hidden.inst.push([o, i, _encM4.clone()]);
                    o.setMatrixAt(i, ENC_ZERO);
                    o.instanceMatrix.needsUpdate = true;
                }
            }
            return;
        }
        _encS.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
        if (_encS.radius > 1.2) return;   // 地形、海面等大物件不動
        if (encBlocks(_encS.center, _encS.radius, A, B)) {
            o.visible = false;
            hidden.meshes.push(o);
        }
    });
    return hidden;
}
// 鏡頭方向：先試左側、再試右側、再拉高，挑一個不會被地形（島嶼、山）擋住的角度
// （小物件之後會被 encClearView 藏起來，這裡只看大型地形）
function encPickDir(look, dist) {
    scene.updateMatrixWorld();
    const rc = new THREE.Raycaster();
    const skip = new Set([enc.stage, dog.group]);
    // 從鏡頭位置往舞台打射線（反過來打會碰到地形背面，單面材質偵測不到）
    const terrainHit = dir => {
        rc.set(look.clone().addScaledVector(dir, dist * 1.15), dir.clone().negate());
        rc.far = dist * 1.15 - 0.05;
        return rc.intersectObjects(scene.children, true).some(h => {
            const o = h.object;
            if (!o.visible || !o.isMesh) return false;
            for (let q = o; q; q = q.parent) if (skip.has(q)) return false;
            if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
            return o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() > 1.2;
        });
    };
    const up = new THREE.Vector3(0, 1, 0);
    const tries = [[-1, 0.34], [1, 0.34], [-1, 0.7], [1, 0.7], [0, 1.2]].map(([sd, h]) =>
        new THREE.Vector3().addScaledVector(enc.side, -0.44 * sd || 0).addScaledVector(enc.fwd, -0.2).addScaledVector(up, h).normalize());
    return tries.find(d => !terrainHit(d)) || tries[tries.length - 1];
}
function encRestoreView(h) {
    if (!h) return;
    h.meshes.forEach(o => { o.visible = true; });
    h.inst.forEach(([o, i, m]) => { o.setMatrixAt(i, m); o.instanceMatrix.needsUpdate = true; });
}

/***********************************************************************
 * 遭遇的流程
 ***********************************************************************/
// 走每段路前決定這段會不會遇到事件，以及在路程的哪裡發生
function planEncounter() {
    const first = dog.history.length <= 1;
    dog.encAt = first || chance(ENC_CHANCE) ? 0.35 + Math.random() * 0.25 : null;
    // 目的地正在下雨：大多會遇到雷雨
    const w = typeof weatherOn !== 'undefined' && weatherOn && weatherData[dog.target];
    dog.encRainy = w && ['rain', 'drizzle', 'thunder', 'snow'].includes(wmoInfo(w.code).kind) ? `${shortOldName(getProv(dog.target))}正在${wmoInfo(w.code).label}` : '';
}

function startEncounter() {
    const g = dog.group;
    const onLand = isLand(g.position.x, g.position.z);
    const recent = dog.encSeen.slice(-3);
    let pool = DOG_ENCOUNTERS.filter(d => d.where === (onLand ? 'land' : 'sea'));
    if (onLand && dog.encRainy && chance(0.8)) pool = pool.filter(d => d.id === 'ame' || d.id === 'kawadome');
    else {
        const fresh = pool.filter(d => !recent.includes(d.id));
        if (fresh.length) pool = fresh;
    }
    if (!pool.length) return;
    // 偏凶的遭遇權重高一點
    let roll = Math.random() * pool.reduce((a, d) => a + (d.w || 1), 0);
    const def = pool.find(d => (roll -= d.w || 1) < 0) || pool[0];
    dog.encSeen.push(def.id);
    dog.encCount = (dog.encCount || 0) + 1;

    const ry = g.rotation.y;
    enc = {
        def, mode: 'intro', clock: 0, t0: 0, a: {}, ripples: [], bubbles: [], result: null, ready: false, choice: -1,
        P: g.position.clone(), y: onLand ? NODE_Y : WATER_Y + 0.03,
        fwd: new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)),
        side: new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)),
        stage: new THREE.Group()
    };
    enc.P.y = enc.y;
    // 海上遭遇：渡船改放在舞台上，こまち才能在船上走動、被甩出船外
    if (!onLand) {
        enc.boat = new THREE.Mesh(dog.boat.geometry, dog.boat.material);
        enc.boat.rotation.order = 'YXZ';
        enc.boat.rotation.y = ry;
        enc.boat.scale.setScalar(0.16);
        enc.boat.position.copy(enc.P);
        enc.stage.add(enc.boat);
    }
    enc.add = (key, obj, pos) => { obj.position.copy(pos); enc.stage.add(obj); enc.a[key] = obj; obj.scale.multiplyScalar(0.001); obj.userData.pop = obj.scale.x * 1000; return obj; };
    enc.say = (who, text, from, to) => {
        const el = document.createElement('div');
        el.className = 'map-label enc-bubble';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.innerHTML = `<div class="map-label-inner"><div class="relative px-2.5 py-1 rounded-2xl bg-white border-2 border-stone-800 text-[11px] font-black text-stone-900 shadow-md whitespace-nowrap">${text}<span class="absolute left-1/2 -bottom-[6px] -ml-[5px] w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-stone-800 rotate-45"></span></div></div>`;
        document.getElementById('labels-container').appendChild(el);
        enc.bubbles.push({ who, el, from: enc.clock + from, to: enc.clock + to, anchor: new THREE.Vector3() });
    };
    enc.clearSay = who => enc.bubbles.forEach(b => { if (b.who === who) b.to = Math.min(b.to, enc.clock); });
    scene.add(enc.stage);
    def.build(enc);

    dog.phase = 'event';
    if (document.getElementById('dog-card').classList.contains('opacity-0')) {
        ['left-detail-card', 'traveler-card', 'pref-card'].forEach(id => setCardVisible(id, false));
        hideWalkerCardOnly();
        setCardVisible('dog-card', true);
    }
    // 鏡頭從側前方拍こまち跟對方。左邊任務卡、右邊索引會蓋住畫面：
    // 量出兩者之間的空白，鏡頭拉遠到舞台放得下，再把舞台移到空白處的中間
    // （用 offset 量版面位置，卡片滑入動畫中也量得準）
    document.body.classList.add('enc-focus');
    const card = document.getElementById('dog-card'), idx = document.getElementById('right-index-panel');
    const W = window.innerWidth, H = window.innerHeight;
    let L = card.offsetWidth ? card.offsetLeft + card.offsetWidth : 0;
    let R = idx && idx.offsetWidth ? idx.offsetLeft : W;
    let T = 0, B = H;
    // 手機：任務卡幾乎佔滿寬度，遭遇時卡片移到 52vh 以下（見 style.css，卡片位置有轉場所以不直接量），
    // 舞台放在上方標題卡與任務卡之間
    if (R - L < 220) {
        L = 0; R = W; B = H * 0.52;
        const brand = document.getElementById('brand-card');
        T = brand && brand.offsetHeight ? Math.min(B - 160, brand.offsetTop + brand.offsetHeight) : 0;
    }
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = tanV * camera.aspect;
    // 海上：以渡船為中心、拍遠一點，海豚才拍得到
    const sea = def.where === 'sea';
    const need = Math.max((sea ? 0.6 : 0.3) / (2 * halfW * (R - L) / W), (sea ? 0.4 : 0.2) / (2 * tanV * (B - T) / H));
    const dist = THREE.MathUtils.clamp(need, sea ? 0.9 : 0.5, sea ? 1.8 : 1.3);
    const look = encAt(sea ? 0 : 0.12, sea ? 0 : 0.02).add(new THREE.Vector3(0, 0.04, 0));
    const dir = encPickDir(look, dist);
    const camPos = look.clone().addScaledVector(dir, dist);
    const fwdCam = dir.clone().negate();
    const right = fwdCam.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    const up = right.clone().cross(fwdCam).normalize();
    const sx = -((L + R) / W - 1) * halfW * dist;
    const sy = -(1 - (T + B) / H) * tanV * dist;
    camPos.addScaledVector(right, sx).addScaledVector(up, sy);
    look.addScaledVector(right, sx).addScaledVector(up, sy);
    // 中間擋到的樹與建築先藏起來
    scene.updateMatrixWorld();
    enc.hidden = encClearView(encAt(0.12, 0.02), camPos);
    controls.minDistance = 0.25;
    flyCamera(camPos, look);
    showToast(`${def.icon} 途中遭遇：${def.title}`);
    renderDogCard();
}

function encChoose(i) {
    if (!enc || enc.mode !== 'intro') return;
    const c = enc.def.choices[i];
    if (c.req && !c.req()) return;
    enc.bubbles.forEach(b => { b.to = Math.min(b.to, enc.clock); });
    enc.choice = i;
    enc.mode = 'anim';
    enc.t0 = enc.clock;
    // say() 用的時間以動畫開始為 0
    const r = c.pick(enc);
    const d = r.d || {};
    dog.money = Math.max(0, dog.money + (d.money || 0));
    dog.days = Math.max(0, dog.days + (d.days || 0));
    dog.kindness += d.kindness || 0;
    addStamina(d.stamina || 0);
    enc.result = r;
    // 標籤：good 綠／黃，bad 紅（天數變多是壞事）
    const chips = [];
    const sg = v => (v > 0 ? '+' : '') + v;
    if (d.money) chips.push({ t: `${sg(d.money)} 文`, bad: d.money < 0 });
    if (d.days) chips.push({ t: `${sg(d.days)} 日`, bad: d.days > 0 });
    if (d.kindness) chips.push({ t: `善意 +${d.kindness}`, kind: true });
    if (d.stamina) chips.push({ t: `體力 ${sg(d.stamina)}`, bad: d.stamina < 0 });
    enc.chips = chips;
    const fell = checkCollapse();
    if (fell) { chips.push({ t: '累倒 +1 日', bad: true }); r.text += fell; }
    dog.log.unshift(`${enc.def.icon}【途中・${enc.def.title}】${r.text}`);
    renderDogCard();
}

function encContinue() {
    if (!enc) return;
    const after = enc.result && enc.result.after;
    endEncounter();
    dog.phase = 'walking';
    if (after === 'back') { dog.lostBack = true; dogTurnBack(); }
    if (!dog.follow) {
        const p = dog.group.position;
        flyCamera(new THREE.Vector3(p.x - 0.35, p.y + 1.4, p.z + 1.8), new THREE.Vector3(p.x - 0.35, p.y + 0.1, p.z));
    }
    renderDogCard();
}
// 收掉舞台與對話框，こまち恢復站姿
function endEncounter() {
    if (!enc) return;
    scene.remove(enc.stage);
    enc.bubbles.forEach(b => b.el.remove());
    encRestoreView(enc.hidden);
    document.body.classList.remove('enc-focus');
    enc = null;
    dog.encAt = null;
    dog.lift = 0;
    dog.wag = 0;
    if (dog.group) {
        dog.group.rotation.x = dog.group.rotation.z = 0;
        dog.group.userData.head.rotation.set(0, 0, 0);
        dogLegs(dog.group, 0, false);
    }
    controls.minDistance = dog.follow ? 0.3 : 1.2;
}

// 每幀由 updateDog 呼叫
function updateEncounter(dt, t) {
    if (!enc) return;
    enc.clock += dt;
    const g = dog.group;
    // 每幀先回到預設姿勢，再由 idle／anim 擺動作
    g.rotation.x = g.rotation.z = 0;
    g.userData.head.rotation.set(0, 0, 0);
    dogLegs(g, t, false);
    dog.lift = 0;
    dog.wag = 8;
    if (enc.boat) {
        enc.boat.position.y = WATER_Y + 0.03 - 0.0016 + Math.sin(t * 2) * 0.008;
        enc.boat.rotation.x = enc.boat.rotation.z = 0;
    }
    // 登場：角色從小彈出來
    Object.values(enc.a).forEach(o => {
        if (!o.userData.pop) return;
        const k = encClamp(enc.clock / 0.45);
        const s = o.userData.pop * (k < 1 ? 1 + Math.sin(k * Math.PI) * 0.25 : 1) * Math.max(0.001, k);
        if (k < 1) o.scale.setScalar(s);
        else if (!o.userData.popped) { o.userData.popped = true; o.scale.setScalar(o.userData.pop); }
    });
    if (enc.mode === 'intro') {
        if (enc.def.idle) enc.def.idle(enc.clock, t);
    } else if (enc.result) {
        const done = enc.result.anim(enc.clock - enc.t0, t);
        if (done && !enc.ready) {
            enc.ready = true;
            renderDogCard();
            // 卡片關著時自動繼續上路
            if (document.getElementById('dog-card').classList.contains('opacity-0')) setTimeout(() => { if (enc && enc.ready) encContinue(); }, 1200);
        }
    }
    enc.ripples = enc.ripples.filter(r => {
        const k = (enc.clock - r.userData.born) / 1.2;
        if (k >= 1) { enc.stage.remove(r); return false; }
        r.scale.setScalar(1 + k * 4);
        r.material.opacity = 0.8 * (1 - k);
        return true;
    });
}

function placeEncounterBubbles() {
    if (!enc) return;
    enc.bubbles.forEach(b => {
        const on = enc.clock >= b.from && enc.clock < b.to;
        const o = b.who === 'dog' ? dog.group : enc.a[b.who];
        if (!o || !o.visible) return placeLabel(b.el, b.anchor, false);
        b.anchor.copy(o.position);
        b.anchor.y += b.who === 'dog' ? 0.075 + (dog.lift || 0) : (o.userData.top || 0.1);
        placeLabel(b.el, b.anchor, on);
        b.el.style.pointerEvents = 'none';
    });
}

function renderEncounterCard() {
    const d = enc.def;
    const head = `
        <div class="flex items-start gap-2.5">
            <div class="w-11 h-11 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center text-2xl shrink-0">${d.icon}</div>
            <div class="min-w-0">
                <div class="text-[10px] font-black tracking-widest text-orange-600">途中遭遇・第 ${dog.encCount} 回</div>
                <div class="text-base font-serif-jp font-black text-stone-900 leading-tight">${d.title}</div>
            </div>
        </div>`;
    if (enc.mode === 'intro') {
        return `
            <div class="rounded-2xl bg-amber-50 border-2 border-amber-300 p-3 space-y-2.5">
                ${head}
                <p class="text-sm text-stone-800 leading-relaxed">${d.intro()}</p>
                <div class="text-[11px] font-black text-amber-900">こまち該怎麼做？</div>
                <div class="space-y-1.5">
                    ${d.choices.map((c, i) => {
                        const ok = !c.req || c.req();
                        return `<button onclick="encChoose(${i})" ${ok ? '' : 'disabled'} class="w-full px-3 py-2 rounded-xl border text-left transition ${ok ? 'bg-white border-amber-300 hover:bg-amber-100 hover:border-amber-500' : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'}">
                            <div class="text-sm font-black ${ok ? 'text-stone-900' : ''}">${c.label}${ok ? '' : `<span class="ml-1 text-[10px]">（${c.reqText}）</span>`}</div>
                            ${c.hint ? `<div class="text-[10px] text-stone-500">${c.hint()}</div>` : ''}
                        </button>`;
                    }).join('')}
                </div>
            </div>`;
    }
    return `
        <div class="rounded-2xl bg-amber-50 border-2 border-amber-300 p-3 space-y-2.5">
            ${head}
            <div class="text-[11px] font-bold text-stone-500">你選了：${d.choices[enc.choice].label}</div>
            <p class="text-sm text-stone-900 font-bold leading-relaxed">${enc.result.text}</p>
            ${enc.chips.length ? `<div class="flex flex-wrap gap-1">${enc.chips.map(c => `<span class="px-2 py-0.5 rounded-full text-[11px] font-black ${c.bad ? 'bg-red-100 text-red-700' : c.kind ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">${c.t}</span>`).join('')}</div>` : ''}
            <button onclick="encContinue()" ${enc.ready ? '' : 'disabled'} class="w-full py-2 rounded-2xl text-sm font-black transition ${enc.ready ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-amber-200 text-amber-700 cursor-wait'}">${enc.ready ? '🐾 繼續上路' : '……'}</button>
        </div>`;
}
