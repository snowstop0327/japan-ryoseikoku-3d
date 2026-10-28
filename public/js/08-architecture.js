// 神社與城郭建模
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 3b. ARCHITECTURE KIT：依各國一之宮實際社殿樣式＋代表城郭實際外觀建模
 *     神社：流造／春日造／神明造／大社造／住吉造／八幡造／權現造／
 *           入母屋／比翼入母屋（吉備津）／淺間造／入蜻蛉（土佐）／
 *           無本殿（大神・諏訪）／海上社殿（嚴島）
 *     城郭：望樓型・層塔型・唐造天守、白壁／黑漆下見板／鐵板張、
 *           連立式、石垣（高石垣・段石垣・武者返）、水堀、海城、
 *           御殿、櫓、城門、城跡、土造障子堀、星形稜堡、古代山城
 ***********************************************************************/
let ARCH_READY = false;
function initArchMaterials() {
    if (ARCH_READY) return;
    ARCH_READY = true;
    const m = (color, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, flatShading: true }, extra));
    MATS.cypressRoof = m(0x5e4334, { roughness: 0.85 });
    MATS.copperGreen = m(0x6fa596, { roughness: 0.55 });
    MATS.thatch = m(0x9c7b4f, { roughness: 0.95 });
    MATS.slateTile = m(0x44505d, { roughness: 0.55 });
    MATS.leadRoof = m(0xb4bcc0, { roughness: 0.45 });
    MATS.stoneRoof = m(0x857a6c, { roughness: 0.8 });
    MATS.redRoof = m(0x9c3b2e, { roughness: 0.55 });
    MATS.plainWood = m(0xcfae80);
    MATS.ironPlate = m(0x3d4247, { metalness: 0.3, roughness: 0.5 });
    MATS.greenStone = m(0x7d9a88, { roughness: 0.85 });
    MATS.rock = m(0x8a8378, { roughness: 0.9 });
    MATS.sand = m(0xf2ecdc, { roughness: 0.95 });
    MATS.pondWater = new THREE.MeshStandardMaterial({ color: 0x4f9ea8, roughness: 0.25, metalness: 0.1 });
    MATS.grass = m(0x7aa65a, { roughness: 0.9, flatShading: false });
    MATS.hillGreen = m(0x6b9a52, { roughness: 0.9, flatShading: false });
    MATS.leafDark = m(0x3f7442, { flatShading: false, roughness: 0.85 });
    MATS.leafPink = m(0xf2b3c6, { flatShading: false, roughness: 0.8 });
    regSeason(MATS.grass, 'grass');
    regSeason(MATS.hillGreen, 'hillGreen');
    regSeason(MATS.leafDark, 'leafDark');
    regSeason(MATS.leafPink, 'sakura');
    MATS.bronze = m(0x56655a, { metalness: 0.4, roughness: 0.45 });
    MATS.windowDark = m(0x2b2622);
    MATS.cloudWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.15, transparent: true, opacity: 0.88 });
}

// ---------- 基礎幾何小工具（y 參數皆為底部高度） ----------
function bx(w, h, d, mat, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    return mesh;
}
function cy(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 8) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    mesh.position.set(x, y + h / 2, z);
    return mesh;
}
function sp(r, mat, x = 0, y = 0, z = 0, seg = 12) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), mat);
    mesh.position.set(x, y, z);
    return mesh;
}
// 斷面輪廓（u = 前後 z，v = 高度 y）沿 x 方向擠出
function profileMesh(pts, width, mat) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
    g.translate(0, 0, -width / 2);
    const mesh = new THREE.Mesh(g, mat);
    mesh.rotation.y = -Math.PI / 2;
    return mesh;
}
// 切妻屋頂（屋脊沿 x；rotY=π/2 則變成妻入）
function gable(w, d, h, mat, y = 0, ov = 0.04) {
    const r = profileMesh([[-d / 2 - ov, -0.02], [0, h], [d / 2 + ov, -0.02], [d / 2 + ov, -0.05], [-d / 2 - ov, -0.05]], w + ov * 2, mat);
    r.position.y = y;
    return r;
}
// 寄棟／入母屋屋頂
function hipRoof(w, d, h, mat, y = 0, topRatio = 0.25) {
    const g = new THREE.CylinderGeometry(0.5 * topRatio, 0.5, 1, 4, 1);
    g.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(g, mat);
    mesh.scale.set(w / 0.707, h, d / 0.707);
    mesh.position.y = y + h / 2;
    return mesh;
}
function irimoya(w, d, h, mat, y = 0) {
    const g = new THREE.Group();
    g.add(hipRoof(w, d, h * 0.55, mat, y, 0.5));
    g.add(gable(w * 0.42, d * 0.36, h * 0.5, mat, y + h * 0.5, 0.02));
    return g;
}
// 千木＋鰹木
function chigiKatsuogi(group, len, y, mat = MATS.plainWood, katsuo = 3, alongZ = false) {
    [-1, 1].forEach(sgn => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.2, 0.025), mat);
        if (alongZ) { c.position.set(0, y + 0.05, sgn * len / 2); c.rotation.x = sgn * 0.5; }
        else { c.position.set(sgn * len / 2, y + 0.05, 0); c.rotation.z = -sgn * 0.5; }
        group.add(c);
    });
    for (let i = 0; i < katsuo; i++) {
        const t = katsuo === 1 ? 0 : (i / (katsuo - 1) - 0.5) * len * 0.6;
        const k = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 6), MATS.gold);
        if (alongZ) { k.rotation.z = Math.PI / 2; k.position.set(0, y + 0.01, t); }
        else { k.rotation.x = Math.PI / 2; k.position.set(t, y + 0.01, 0); }
        group.add(k);
    }
}
function stoneBase(w, d, h = 0.06, mat = MATS.stone) {
    return bx(w, h, d, mat);
}
function steps(group, z, y, w = 0.14, n = 3) {
    for (let i = 0; i < n; i++) group.add(bx(w, 0.025, 0.05, MATS.stone, 0, y - (i + 1) * 0.025, z + i * 0.05));
}

// ---------- 鳥居 ----------
function torii(type = 'v', size = 0.5) {
    const t = new THREE.Group();
    if (type === '-' ) return t;
    if (type === 'm') {
        // 三輪鳥居（三ツ鳥居）：中央大鳥居＋兩側小鳥居相連
        const c = torii('v', size);
        t.add(c);
        [-1, 1].forEach(s => {
            const side = torii('v', size * 0.66);
            side.position.x = s * size * 0.62;
            t.add(side);
        });
        return t;
    }
    const big = type === 'B' || type === 'R' || type === 'P' || type === 'G';
    // G：熊野本宮大齋原的日本最大鳥居（深灰色）；P：明治神宮等的巨大素木鳥居
    const sz = type === 'G' ? size * 1.9 : big ? size * 1.4 : size;
    const mat = { v: MATS.vermilion, B: MATS.vermilion, R: MATS.vermilion, r: MATS.vermilion, p: MATS.plainWood, P: MATS.plainWood, n: MATS.plainWood, s: MATS.stone, k: MATS.blackLacquer, G: MATS.ironPlate }[type] || MATS.vermilion;
    const half = sz * 0.32;
    [-half, half].forEach(x => t.add(cy(0.022 * sz / 0.5, 0.027 * sz / 0.5, sz, mat, x, 0, 0, 8)));
    if (type === 'n') {
        // 神明鳥居：圓木笠木、筆直不反
        const kasa = new THREE.Mesh(new THREE.CylinderGeometry(0.022 * sz / 0.5, 0.022 * sz / 0.5, sz * 0.86, 8), mat);
        kasa.rotation.z = Math.PI / 2;
        kasa.position.y = sz + 0.01;
        t.add(kasa, bx(sz * 0.66, 0.025, 0.03, mat, 0, sz * 0.74));
    } else {
        // 明神鳥居：反り笠木（黑色笠木）＋島木＋額束
        const topMat = (type === 's' || type === 'p' || type === 'P' || type === 'G') ? mat : MATS.blackLacquer;
        const kasa = bx(sz * 1.02, 0.04, 0.06, topMat, 0, sz);
        t.add(kasa);
        [-1, 1].forEach(s => {
            const tip = bx(0.08, 0.035, 0.06, topMat, s * sz * 0.53, sz + 0.012);
            tip.rotation.z = s * 0.25;
            t.add(tip);
        });
        t.add(bx(sz * 0.9, 0.03, 0.05, mat, 0, sz - 0.03));
        t.add(bx(sz * 0.8, 0.025, 0.035, mat, 0, sz * 0.72));
        t.add(bx(0.04, sz * 0.2, 0.02, mat, 0, sz * 0.75));
    }
    if (type === 'r' || type === 'R') {
        // 兩部鳥居：前後稚兒柱
        [-half, half].forEach(x => [-1, 1].forEach(s => {
            t.add(cy(0.016, 0.02, sz * 0.5, mat, x, 0, s * 0.09));
            t.add(bx(0.02, 0.02, 0.18, mat, x, sz * 0.42, 0));
        }));
    }
    return t;
}

// ---------- 神社附屬景物 ----------
function romonGate(mat, roofMat) {
    const g = new THREE.Group();
    g.add(bx(0.46, 0.04, 0.22, MATS.stone));
    [-0.18, -0.06, 0.06, 0.18].forEach(x => g.add(bx(0.035, 0.2, 0.035, mat, x, 0.04, 0.07), bx(0.035, 0.2, 0.035, mat, x, 0.04, -0.07)));
    g.add(bx(0.44, 0.04, 0.2, mat, 0, 0.24));
    g.add(hipRoof(0.56, 0.3, 0.06, roofMat, 0.27, 0.6));
    g.add(bx(0.32, 0.13, 0.15, mat, 0, 0.32));
    [-0.1, 0.1].forEach(x => g.add(bx(0.03, 0.13, 0.155, MATS.whiteWall, x, 0.32)));
    g.add(irimoya(0.5, 0.28, 0.2, roofMat, 0.44));
    return g;
}
function bigTree(x, z, s = 1) {
    const g = new THREE.Group();
    g.add(cy(0.035 * s, 0.06 * s, 0.32 * s, MATS.wood, 0, 0, 0, 6));
    [[0, 0.42, 0, 0.22], [0.13, 0.36, 0.06, 0.16], [-0.13, 0.36, -0.04, 0.17], [0.02, 0.5, -0.1, 0.15]].forEach(([px, py, pz, r]) =>
        g.add(sp(r * s, MATS.leafDark, px * s, py * s, pz * s, 12)));
    g.position.set(x, 0, z);
    return g;
}
function sakuraTree(x, z, s = 1) {
    const g = new THREE.Group();
    g.add(cy(0.025 * s, 0.04 * s, 0.22 * s, MATS.wood, 0, 0, 0, 6));
    [[0, 0.3, 0, 0.15], [0.09, 0.26, 0.04, 0.11], [-0.09, 0.27, -0.03, 0.12]].forEach(([px, py, pz, r]) =>
        g.add(sp(r * s, MATS.leafPink, px * s, py * s, pz * s, 10)));
    g.position.set(x, 0, z);
    return g;
}
function pineTree(x, z, s = 1) {
    const g = new THREE.Group();
    g.add(cy(0.02 * s, 0.03 * s, 0.14 * s, MATS.wood, 0, 0, 0, 5));
    for (let i = 0; i < 3; i++) g.add(cy(0.0, (0.16 - i * 0.04) * s, 0.16 * s, MATS.leafDark, 0, (0.1 + i * 0.1) * s, 0, 7));
    g.position.set(x, 0, z);
    return g;
}
function sacredMountain(snow, x = 0, z = -0.55, h = 0.75) {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, h, 10), MATS.hillGreen);
    cone.position.y = h / 2;
    g.add(cone);
    if (snow) {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.17, h * 0.4, 10), MATS.whiteWall);
        cap.position.y = h - h * 0.2 + 0.005;
        g.add(cap);
    }
    g.position.set(x, 0, z);
    return g;
}
function stoneLantern(x, z) {
    const g = new THREE.Group();
    g.add(cy(0.03, 0.04, 0.02, MATS.stone, 0, 0, 0, 6), cy(0.012, 0.014, 0.1, MATS.stone, 0, 0.02, 0, 6));
    g.add(bx(0.05, 0.04, 0.05, MATS.lanternGlow, 0, 0.12), cy(0, 0.045, 0.04, MATS.stone, 0, 0.16, 0, 6));
    g.position.set(x, 0, z);
    return g;
}
function addShrineExtras(g, extras, ctx) {
    const has = k => extras.includes(k);
    if (has('tatesuna')) [-0.1, 0.1].forEach(x => g.add(cy(0, 0.05, 0.08, MATS.sand, x, 0.06, 0.3, 10)));
    if (has('bigtree')) g.add(bigTree(-0.42, -0.2, 1.05));
    if (has('mountain') || has('snowmtn')) g.add(sacredMountain(has('snowmtn')));
    if (has('lanterns')) [-0.22, 0.22].forEach(x => g.add(stoneLantern(x, 0.34)));
    if (has('deer')) [[-0.3, 0.42], [-0.36, 0.3]].forEach(([x, z]) => {
        const d = new THREE.Group();
        d.add(bx(0.07, 0.035, 0.03, MATS.wood, 0, 0.05), bx(0.02, 0.05, 0.02, MATS.wood, 0.035, 0.07), bx(0.03, 0.025, 0.025, MATS.wood, 0.05, 0.11));
        [[-0.025, -0.01], [0.025, -0.01], [-0.025, 0.01], [0.025, 0.01]].forEach(([lx, lz]) => d.add(bx(0.008, 0.05, 0.008, MATS.darkWood, lx, 0, lz)));
        d.position.set(x, 0, z);
        d.rotation.y = x * 3;
        g.add(d);
    });
    if (has('pagoda')) {
        // 羽黑山五重塔（素木）
        const p = new THREE.Group();
        p.add(bx(0.2, 0.04, 0.2, MATS.stone));
        for (let i = 0; i < 5; i++) {
            const s = 1 - i * 0.1;
            p.add(bx(0.12 * s, 0.08, 0.12 * s, MATS.plainWood, 0, 0.04 + i * 0.12));
            p.add(hipRoof(0.22 * s, 0.22 * s, 0.04, MATS.cypressRoof, 0.12 + i * 0.12, 0.3));
        }
        p.add(cy(0.006, 0.01, 0.16, MATS.gold, 0, 0.64));
        p.position.set(-0.42, 0, -0.18);
        g.add(p);
    }
    if (has('steps')) {
        for (let i = 0; i < 5; i++) g.add(bx(0.16, 0.03, 0.06, MATS.stone, 0, 0, 0.3 + i * 0.06 - 0.03));
    }
    if (has('senbon')) {
        // 伏見稻荷：沿山坡往後延伸的千本鳥居隧道
        for (let i = 0; i < 12; i++) {
            const tr = torii('v', 0.2);
            tr.position.set(-0.42 + i * 0.008, i * 0.025, 0.32 - i * 0.065);
            g.add(tr);
        }
    }
    if (has('nachi')) {
        // 那智瀑布＋青岸渡寺朱紅三重塔
        const cliff = bx(0.42, 0.95, 0.16, MATS.rock, -0.05, 0, -0.62);
        g.add(cliff);
        // 瀑布：捲動的水流貼圖（前後兩層、速度不同）＋底部水花與漣漪
        const fx = waterfallFx();
        const back = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.92), fx.matBack);
        back.position.set(-0.05, 0.47, -0.538);
        const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.92), fx.matFront);
        fall.position.set(-0.05, 0.47, -0.533);
        g.add(back, fall);
        g.add(cy(0.12, 0.14, 0.02, MATS.pondWater, -0.05, 0, -0.48, 14));
        for (let k = 0; k < 7; k++) {
            const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), fx.matSplash);
            s.userData.splash = { x: -0.05 + (k - 3) * 0.018, z: -0.5 + (k % 2) * 0.02, ph: k / 7 };
            s.position.set(s.userData.splash.x, 0.03, s.userData.splash.z);
            g.add(s);
            fx.splashes.push(s);
        }
        for (let k = 0; k < 3; k++) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 20), fx.matRing.clone());
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(-0.05, 0.022, -0.49);
            ring.userData.ph = k / 3;
            g.add(ring);
            fx.rings.push(ring);
        }
        const tou = new THREE.Group();
        tou.add(bx(0.16, 0.03, 0.16, MATS.stone));
        for (let i = 0; i < 3; i++) {
            const s = 1 - i * 0.12;
            tou.add(bx(0.1 * s, 0.08, 0.1 * s, MATS.vermilion, 0, 0.03 + i * 0.12));
            tou.add(hipRoof(0.2 * s, 0.2 * s, 0.04, MATS.cypressRoof, 0.11 + i * 0.12, 0.3));
        }
        tou.add(cy(0.006, 0.01, 0.12, MATS.gold, 0, 0.39));
        tou.position.set(-0.4, 0, -0.25);
        g.add(tou);
    }
    if (has('ujibashi')) {
        // 伊勢神宮宇治橋：五十鈴川上的木橋，兩端立大鳥居
        g.add(bx(0.6, 0.012, 0.16, MATS.pondWater, 0, 0, 0.78));
        g.add(bx(0.13, 0.025, 0.42, MATS.plainWood, 0, 0.03, 0.78));
        [-1, 1].forEach(s => g.add(bx(0.008, 0.04, 0.42, MATS.plainWood, s * 0.065, 0.05, 0.78)));
        [0.56, 1.0].forEach(z => { const tr = torii('n', 0.34); tr.position.z = z; g.add(tr); });
    }
    if (has('soribashi')) {
        g.add(bx(0.5, 0.01, 0.16, MATS.pondWater, 0, 0, 0.64));
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 14, Math.PI), MATS.vermilion);
        arch.rotation.y = Math.PI / 2;
        arch.scale.set(1, 0.55, 1);
        arch.position.set(0, 0, 0.64);
        g.add(arch);
    }
    if (has('kagura')) {
        // 神樂殿與巨型注連繩
        const k = new THREE.Group();
        k.add(bx(0.4, 0.04, 0.2, MATS.stone), bx(0.34, 0.14, 0.16, MATS.plainWood, 0, 0.04));
        k.add(gable(0.4, 0.24, 0.1, MATS.copperGreen, 0.18));
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.36, 10), MATS.rope);
        rope.rotation.z = Math.PI / 2;
        rope.position.set(0, 0.17, 0.1);
        k.add(rope);
        [-0.1, 0, 0.1].forEach(x => k.add(bx(0.018, 0.06, 0.01, MATS.whiteWall, x, 0.09, 0.12)));
        k.position.set(0, 0, 0.42);
        g.add(k);
    }
    if (has('thatchgate')) {
        const tg = new THREE.Group();
        [-0.1, 0.1].forEach(x => tg.add(bx(0.03, 0.18, 0.03, MATS.plainWood, x)));
        tg.add(gable(0.3, 0.18, 0.12, MATS.thatch, 0.18));
        tg.position.z = 0.44;
        g.add(tg);
    }
    if (has('corridor')) {
        // 吉備津神社長迴廊
        const c = new THREE.Group();
        for (let i = 0; i < 6; i++) c.add(bx(0.02, 0.1, 0.02, MATS.plainWood, -0.3 + i * 0.12, 0, 0));
        c.add(gable(0.66, 0.1, 0.05, MATS.slateTile, 0.1, 0.02));
        c.position.set(-0.05, 0, 0.36);
        c.rotation.y = 0.25;
        g.add(c);
    }
    if (has('onbashira')) [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.28], [0.3, 0.28]].forEach(([x, z]) => {
        g.add(cy(0.025, 0.032, 0.62, MATS.plainWood, x, 0, z, 8));
        g.add(cy(0, 0.03, 0.06, MATS.plainWood, x, 0.62, z, 4));
    });
    if (has('sea')) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.015, 20), MATS.pondWater);
        w.position.set(0, 0.0, 0.32);
        w.scale.set(1, 1, 0.55);
        g.add(w);
    }
}

// ---------- 社殿本體 ----------
function shrineCtx(spec) {
    const roof = { h: MATS.cypressRoof, c: MATS.copperGreen, t: MATS.thatch, g: MATS.slateTile, r: ryukyuMats().tile }[spec.r] || MATS.cypressRoof;
    const b = spec.b;
    return {
        roof,
        wall: b === 'v' ? MATS.whiteWall : b === 'p' ? MATS.plainWood : b === 'k' ? MATS.blackLacquer : MATS.vermilion,
        pillar: b === 'p' ? MATS.plainWood : b === 'k' ? MATS.blackLacquer : MATS.vermilion,
        trim: b === 'k' || b === 'c' ? MATS.gold : b === 'v' ? MATS.vermilion : MATS.wood,
        gateMat: b === 'p' ? MATS.plainWood : MATS.vermilion
    };
}

function hallNagare(c, bays = 1) {
    // 流造：前坡延伸成向拜的不對稱切妻屋頂（全國最常見）
    const g = new THREE.Group();
    const W = 0.36 + (bays - 1) * 0.1;
    g.add(stoneBase(W + 0.16, 0.44, 0.06));
    g.add(bx(W, 0.06, 0.32, c.pillar, 0, 0.06, -0.02));
    g.add(bx(W - 0.04, 0.2, 0.24, c.wall, 0, 0.12, -0.05));
    const nP = 2 + bays;
    for (let i = 0; i < nP; i++) {
        const x = -W / 2 + (W / (nP - 1)) * i;
        g.add(bx(0.03, 0.2, 0.03, c.pillar, x, 0.12, 0.07), bx(0.025, 0.14, 0.025, c.pillar, x, 0.12, 0.2));
    }
    g.add(bx(W, 0.025, 0.03, c.trim, 0, 0.31, 0.07));
    g.add(profileMesh([[-0.22, 0.29], [-0.04, 0.47], [0.3, 0.24], [0.3, 0.21], [-0.04, 0.43], [-0.22, 0.26]], W + 0.12, c.roof));
    g.add(bx(W + 0.12, 0.02, 0.025, c.roof, 0, 0.46, -0.04));
    steps(g, 0.22, 0.12);
    return g;
}
function hallKasuga(c, n = 1) {
    // 春日造：妻入小社殿、正面附向拜，常數棟並列
    const g = new THREE.Group();
    const sc = n === 1 ? 1.35 : 1;
    const gap = 0.2;
    g.add(stoneBase(n * gap + 0.12, 0.4, 0.05));
    for (let i = 0; i < n; i++) {
        const h = new THREE.Group();
        h.add(bx(0.13, 0.04, 0.17, c.pillar, 0, 0.05));
        h.add(bx(0.11, 0.13, 0.13, c.wall, 0, 0.09, -0.01));
        [[-0.055, 0.06], [0.055, 0.06], [-0.055, -0.07], [0.055, -0.07]].forEach(([x, z]) => h.add(bx(0.02, 0.13, 0.02, c.pillar, x, 0.09, z)));
        const r = gable(0.2, 0.16, 0.1, c.roof, 0.22, 0.03);
        r.rotation.y = Math.PI / 2;
        h.add(r);
        h.add(profileMesh([[0.08, 0.22], [0.2, 0.15], [0.2, 0.13], [0.08, 0.2]], 0.16, c.roof));
        const ck = new THREE.Group();
        chigiKatsuogi(ck, 0.2, 0.3, MATS.gold, 2, true);
        h.add(ck);
        h.scale.setScalar(sc);
        h.position.x = (i - (n - 1) / 2) * gap;
        g.add(h);
    }
    return g;
}
function hallShinmei(c) {
    // 神明造：高床素木、平入、千木與鰹木
    const g = new THREE.Group();
    g.add(bx(0.66, 0.05, 0.52, MATS.sand));
    [[-0.3, 0], [0.3, 0]].forEach(([x]) => g.add(bx(0.015, 0.1, 0.5, MATS.plainWood, x, 0.05)));
    g.add(bx(0.6, 0.1, 0.015, MATS.plainWood, 0, 0.05, -0.25), bx(0.6, 0.1, 0.015, MATS.plainWood, 0, 0.05, 0.25));
    [[-0.17, -0.11], [-0.17, 0.11], [0.17, -0.11], [0.17, 0.11]].forEach(([x, z]) => g.add(cy(0.018, 0.018, 0.16, MATS.plainWood, x, 0.05, z, 6)));
    g.add(bx(0.44, 0.03, 0.3, MATS.plainWood, 0, 0.18));
    g.add(bx(0.36, 0.17, 0.22, MATS.plainWood, 0, 0.21));
    g.add(bx(0.46, 0.015, 0.32, MATS.plainWood, 0, 0.21, 0)); // 高欄
    g.add(gable(0.44, 0.3, 0.2, c.roof, 0.38, 0.05));
    chigiKatsuogi(g, 0.52, 0.6, MATS.plainWood, 5);
    [-0.24, 0.24].forEach(x => g.add(cy(0.02, 0.02, 0.36, MATS.plainWood, x, 0.05, 0, 6))); // 棟持柱
    return g;
}
function hallTaisha(c, big = true) {
    // 大社造／大鳥造：妻入、高床、陡階梯
    const g = new THREE.Group();
    const s = big ? 1 : 0.8;
    g.add(bx(0.5 * s, 0.05, 0.5 * s, MATS.stone));
    g.add(bx(0.42 * s, 0.14 * s, 0.42 * s, c.pillar, 0, 0.05));
    g.add(bx(0.38 * s, 0.26 * s, 0.38 * s, c.wall, 0, 0.05 + 0.14 * s));
    g.add(bx(0.48 * s, 0.02, 0.48 * s, c.pillar, 0, 0.05 + 0.14 * s));
    const r = gable(0.5 * s, 0.46 * s, 0.26 * s, c.roof, 0.05 + 0.4 * s, 0.05);
    r.rotation.y = Math.PI / 2;
    g.add(r);
    const ck = new THREE.Group();
    chigiKatsuogi(ck, 0.56 * s, 0.05 + 0.66 * s, MATS.plainWood, 3, true);
    g.add(ck);
    // 正面斜向長階梯＋階隱屋根
    const stair = bx(0.1, 0.02, 0.32, MATS.plainWood, 0.08 * s, 0.05, 0.3 * s);
    stair.rotation.x = 0.55;
    g.add(stair);
    g.add(gable(0.14, 0.12, 0.05, c.roof, 0.05 + 0.24 * s, 0.01).translateX(0.08 * s).translateZ(0.24 * s));
    return g;
}
function hallSumiyoshi(c, n = 1) {
    // 住吉造：妻入、直線屋頂、朱柱白壁，四本殿如船隊縱列
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
        const h = new THREE.Group();
        h.add(bx(0.2, 0.05, 0.36, MATS.stone));
        h.add(bx(0.16, 0.16, 0.3, MATS.whiteWall, 0, 0.05));
        [[-0.08, 0.15], [0.08, 0.15], [-0.08, 0], [0.08, 0], [-0.08, -0.15], [0.08, -0.15]].forEach(([x, z]) => h.add(bx(0.024, 0.16, 0.024, MATS.vermilion, x, 0.05, z)));
        const r = gable(0.38, 0.22, 0.16, c.roof, 0.21, 0.03);
        r.rotation.y = Math.PI / 2;
        h.add(r);
        const ck = new THREE.Group();
        chigiKatsuogi(ck, 0.38, 0.38, MATS.gold, 5, true);
        h.add(ck);
        h.scale.setScalar(n === 1 ? 1.4 : 0.75);
        const layout = [[-0.13, -0.18], [0.13, -0.18], [-0.13, 0.18], [0.13, 0.18]][i] || [0, 0];
        if (n > 1) h.position.set(layout[0], 0, layout[1]);
        g.add(h);
    }
    return g;
}
function hallHachiman(c) {
    // 八幡造：前後兩棟切妻屋頂並列，中間以「相之間」相連
    const g = new THREE.Group();
    g.add(stoneBase(0.62, 0.52, 0.06));
    g.add(bx(0.48, 0.2, 0.42, c.wall, 0, 0.06));
    [-0.24, -0.08, 0.08, 0.24].forEach(x => [0.21, -0.21].forEach(z => g.add(bx(0.026, 0.2, 0.026, c.pillar, x, 0.06, z))));
    [0.12, -0.12].forEach(z => {
        const r = gable(0.56, 0.22, 0.15, c.roof, 0.26, 0.03);
        r.position.z = z;
        g.add(r);
    });
    g.add(bx(0.56, 0.025, 0.04, MATS.gold, 0, 0.26, 0));
    steps(g, 0.26, 0.06);
    return g;
}
function hallIrimoya(c, opts = {}) {
    const g = new THREE.Group();
    const s = opts.scale || 1;
    g.add(stoneBase(0.6 * s, 0.48 * s, 0.06));
    g.add(bx(0.46 * s, 0.22, 0.34 * s, c.wall, 0, 0.06));
    [-0.23, -0.08, 0.08, 0.23].forEach(x => g.add(bx(0.03, 0.22, 0.03, c.pillar, x * s, 0.06, 0.17 * s)));
    g.add(bx(0.48 * s, 0.025, 0.36 * s, c.trim, 0, 0.27));
    g.add(irimoya(0.62 * s, 0.5 * s, 0.32, c.roof, 0.28));
    if (opts.kara) {
        const kara = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12, Math.PI), c.roof);
        kara.position.set(0, 0.3, 0.27 * s);
        kara.scale.set(1.2, 0.6, 1);
        g.add(kara);
    }
    steps(g, 0.26 * s, 0.06);
    return g;
}
function hallGongen(c) {
    // 權現造：拜殿＋石之間＋本殿呈「工」字形，黑漆或極彩色金飾
    const g = new THREE.Group();
    g.add(stoneBase(0.64, 0.66, 0.06));
    const hai = new THREE.Group();
    hai.add(bx(0.48, 0.2, 0.24, c.wall, 0, 0.06));
    hai.add(bx(0.5, 0.025, 0.26, MATS.gold, 0, 0.25));
    hai.add(irimoya(0.6, 0.36, 0.26, c.roof, 0.26));
    const kara = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 14, Math.PI), c.roof);
    kara.position.set(0, 0.27, 0.16);
    kara.scale.set(1.15, 0.6, 1);
    hai.add(kara, bx(0.2, 0.012, 0.01, MATS.gold, 0, 0.27, 0.17));
    hai.position.z = 0.14;
    g.add(hai);
    g.add(bx(0.22, 0.16, 0.16, c.wall, 0, 0.06, -0.08), gable(0.26, 0.18, 0.08, c.roof, 0.22, 0.01).translateZ(-0.08));
    const hon = new THREE.Group();
    hon.add(bx(0.4, 0.22, 0.2, c.wall, 0, 0.08));
    hon.add(bx(0.42, 0.025, 0.22, MATS.gold, 0, 0.29));
    hon.add(irimoya(0.5, 0.32, 0.26, c.roof, 0.3));
    hon.position.z = -0.22;
    g.add(hon);
    return g;
}
function hallKibitsu(c) {
    // 吉備津造（比翼入母屋造）：一座本殿上並列兩個入母屋屋脊
    const g = new THREE.Group();
    g.add(bx(0.7, 0.1, 0.48, MATS.whiteWall));
    g.add(bx(0.6, 0.2, 0.38, MATS.whiteWall, 0, 0.1));
    [-0.28, -0.14, 0, 0.14, 0.28].forEach(x => g.add(bx(0.026, 0.2, 0.026, MATS.vermilion, x, 0.1, 0.19)));
    g.add(hipRoof(0.74, 0.52, 0.12, c.roof, 0.3, 0.7));
    [-0.16, 0.16].forEach(x => g.add(gable(0.18, 0.2, 0.14, c.roof, 0.42, 0.02).translateX(x)));
    return g;
}
function hallSengen(c) {
    // 淺間造：入母屋殿上再疊一座流造，形成二層社殿
    const g = new THREE.Group();
    g.add(stoneBase(0.6, 0.48, 0.06));
    g.add(bx(0.48, 0.2, 0.36, c.wall, 0, 0.06));
    [-0.24, -0.08, 0.08, 0.24].forEach(x => g.add(bx(0.03, 0.2, 0.03, MATS.vermilion, x, 0.06, 0.18)));
    g.add(hipRoof(0.62, 0.5, 0.12, c.roof, 0.26, 0.55));
    g.add(bx(0.22, 0.14, 0.16, c.wall, 0, 0.36));
    g.add(profileMesh([[-0.12, 0.5], [0, 0.6], [0.16, 0.48], [0.16, 0.46], [0, 0.57], [-0.12, 0.48]], 0.3, c.roof));
    g.add(bx(0.24, 0.015, 0.18, MATS.gold, 0, 0.49));
    return g;
}
function hallMiwa(c) {
    // 大神神社：無本殿，以拜殿＋三ツ鳥居遙拜神體山
    const g = new THREE.Group();
    g.add(sacredMountain(false, 0, -0.6, 0.9));
    const mt = torii('m', 0.3);
    mt.position.z = -0.22;
    g.add(mt);
    g.add(bx(0.5, 0.04, 0.26, MATS.stone, 0, 0, 0.1));
    g.add(bx(0.44, 0.16, 0.2, MATS.plainWood, 0, 0.04, 0.1));
    g.add(irimoya(0.58, 0.32, 0.24, c.roof, 0.2).translateZ(0.1));
    const kara = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12, Math.PI), c.roof);
    kara.position.set(0, 0.22, 0.27);
    kara.scale.set(1.2, 0.6, 1);
    g.add(kara);
    return g;
}
function hallSuwa(c) {
    // 諏訪大社：無本殿，幣拜殿＋四隅御柱
    const g = new THREE.Group();
    g.add(bx(0.4, 0.04, 0.3, MATS.stone));
    g.add(bx(0.32, 0.18, 0.2, MATS.plainWood, 0, 0.04));
    g.add(bx(0.12, 0.1, 0.22, MATS.plainWood, 0, 0.22));
    g.add(gable(0.4, 0.3, 0.14, c.roof, 0.22, 0.04));
    g.add(gable(0.18, 0.26, 0.08, c.roof, 0.32, 0.02));
    return g;
}
function hallItsukushima(c) {
    // 嚴島神社：海上朱漆寢殿造回廊
    const g = new THREE.Group();
    const sea = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.015, 24), MATS.pondWater);
    sea.scale.set(1, 1, 1.1);
    g.add(sea);
    g.add(bx(0.62, 0.03, 0.12, MATS.plainWood, 0, 0.06, -0.02));
    g.add(bx(0.12, 0.03, 0.4, MATS.plainWood, -0.25, 0.06, -0.2));
    g.add(bx(0.12, 0.03, 0.4, MATS.plainWood, 0.25, 0.06, -0.2));
    for (let i = 0; i < 6; i++) g.add(bx(0.015, 0.06, 0.015, MATS.vermilion, -0.3 + i * 0.12, 0, -0.02));
    g.add(gable(0.62, 0.12, 0.05, c.roof, 0.14, 0.02).translateZ(-0.02));
    const hall = new THREE.Group();
    hall.add(bx(0.36, 0.04, 0.24, MATS.plainWood, 0, 0.05));
    hall.add(bx(0.3, 0.14, 0.18, MATS.whiteWall, 0, 0.09));
    [-0.15, -0.05, 0.05, 0.15].forEach(x => hall.add(bx(0.024, 0.14, 0.024, MATS.vermilion, x, 0.09, 0.09)));
    hall.add(irimoya(0.46, 0.32, 0.22, c.roof, 0.23));
    hall.position.z = -0.28;
    g.add(hall);
    const ot = torii('r', 0.42);
    ot.position.z = 0.4;
    g.add(ot);
    return g;
}
// 那智瀑布的流水：共用一張可捲動的水流貼圖，在動畫迴圈裡往下捲
let _waterfallFx = null;
function waterfallFx() {
    if (_waterfallFx) return _waterfallFx;
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 256;
    const c = cv.getContext('2d');
    const grd = c.createLinearGradient(0, 0, 64, 0);
    grd.addColorStop(0, 'rgba(190,225,240,0.55)');
    grd.addColorStop(0.5, 'rgba(235,248,255,0.95)');
    grd.addColorStop(1, 'rgba(190,225,240,0.55)');
    c.fillStyle = grd;
    c.fillRect(0, 0, 64, 256);
    // 直向水絲：長短不一的白線，上下連續可無縫捲動
    for (let i = 0; i < 90; i++) {
        const x = Math.random() * 64, y = Math.random() * 256, len = 20 + Math.random() * 70;
        c.strokeStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.6})`;
        c.lineWidth = 1 + Math.random() * 2.5;
        [0, -256, 256].forEach(o => { c.beginPath(); c.moveTo(x, y + o); c.lineTo(x + (Math.random() - 0.5) * 2, y + len + o); c.stroke(); });
    }
    for (let i = 0; i < 40; i++) {
        c.fillStyle = 'rgba(120,175,200,0.25)';
        const x = Math.random() * 64, y = Math.random() * 256;
        c.fillRect(x, y, 1.5, 10 + Math.random() * 30);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2.5);
    const tex2 = tex.clone();
    tex2.needsUpdate = true;
    tex2.repeat.set(1.4, 1.8);
    _waterfallFx = {
        tex, tex2, splashes: [], rings: [],
        matFront: new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
        matBack: new THREE.MeshBasicMaterial({ map: tex2, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
        matSplash: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }),
        matRing: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
    };
    return _waterfallFx;
}
function updateWaterfalls(dt, t) {
    const fx = _waterfallFx;
    if (!fx) return;
    fx.tex.offset.y += dt * 1.1;
    fx.tex2.offset.y += dt * 0.75;
    fx.splashes.forEach(s => {
        const u = s.userData.splash;
        const k = (t * 1.6 + u.ph) % 1;
        s.position.y = 0.03 + Math.sin(k * Math.PI) * 0.06;
        s.position.x = u.x + (u.x + 0.05) * k * 1.5;
        s.scale.setScalar(0.6 + k * 0.9);
    });
    fx.rings.forEach(r => {
        const k = (t * 0.6 + r.userData.ph) % 1;
        r.scale.setScalar(1 + k * 2.4);
        r.material.opacity = 0.6 * (1 - k);
    });
}

// 琉球：赤瓦（以漆喰固定的紅瓦）與琉球石灰岩
function ryukyuMats() {
    if (!MATS.ryukyuTile) {
        MATS.ryukyuTile = new THREE.MeshStandardMaterial({ color: 0xc4553e, roughness: 0.7, flatShading: true });
        MATS.limestone = new THREE.MeshStandardMaterial({ color: 0xe4d6b4, roughness: 0.9, flatShading: true });
    }
    return { tile: MATS.ryukyuTile, stone: MATS.limestone };
}
function hallUtaki(c) {
    // 齋場御嶽：兩塊相倚的巨大石灰岩形成三角形岩隙，四周是亞熱帶林，沒有社殿
    const g = new THREE.Group();
    const stone = ryukyuMats().stone;
    [-1, 1].forEach(s => {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.26), stone);
        slab.position.set(s * 0.11, 0.22, -0.08);
        slab.rotation.z = s * 0.38;
        g.add(slab);
    });
    g.add(bx(0.12, 0.03, 0.08, stone, 0, 0.015, 0.06));
    const leaf = new THREE.MeshStandardMaterial({ color: 0x3f7f3a, roughness: 0.8, flatShading: true });
    [[-0.34, -0.2, 0.13], [0.34, -0.18, 0.12], [-0.3, 0.16, 0.1], [0.3, 0.18, 0.11], [0, -0.36, 0.14]].forEach(([x, z, r]) => {
        g.add(cy(0.018, 0.024, 0.16, MATS.darkWood, x, 0.08, z));
        g.add(sp(r, leaf, x, 0.2 + r * 0.6, z, 7));
    });
    return g;
}
function hallRock(c) {
    // 湯殿山神社：不設社殿，以湧出溫泉的赤褐色巨岩為神體
    const g = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.8, flatShading: true });
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), rockMat);
    rock.scale.set(1.2, 0.8, 1);
    rock.position.set(0, 0.18, -0.12);
    g.add(rock);
    g.add(bx(0.5, 0.012, 0.3, MATS.pondWater, 0, 0, 0.14));
    [-0.2, 0.2].forEach(x => g.add(sp(0.08, rockMat, x, 0.04, -0.02, 6)));
    return g;
}
function hallTombo(c) {
    // 土佐神社「入蜻蛉造」：本殿與幣殿、拜殿組成十字形
    const g = new THREE.Group();
    g.add(stoneBase(0.62, 0.62, 0.06));
    g.add(bx(0.22, 0.2, 0.5, c.wall, 0, 0.06));
    const roof1 = irimoya(0.3, 0.6, 0.24, c.roof, 0.26);
    roof1.rotation.y = Math.PI / 2;
    g.add(roof1);
    g.add(bx(0.56, 0.16, 0.18, c.wall, 0, 0.06, 0.06));
    g.add(irimoya(0.66, 0.26, 0.2, c.roof, 0.22).translateZ(0.06));
    return g;
}

// 各國一之宮社殿規格：[樣式, 社殿色(v朱柱白壁/p素木/k黑漆/c極彩朱塗), 屋頂(h檜皮/c銅板/t茅葺/g瓦), 鳥居, 附屬景物, 數量]
const SHRINE_SPECS = {
    yamashiro: ['nagare', 'v', 'h', 'v', 'romon,tatesuna'],
    yamato: ['miwa', 'p', 'h', '-', ''],
    kawachi: ['kasuga', 'v', 'h', 'v', 'deer', 4],
    izumi: ['otori', 'p', 'h', 'v', 'bigtree'],
    settsu: ['sumiyoshi', 'v', 'h', 'v', 'soribashi', 4],
    iga: ['nagare', 'v', 'h', 'v', 'lanterns'],
    ise: ['shinmei', 'p', 'c', 'n', 'bigtree'],
    shima: ['shinmei', 'p', 't', 'n', 'sea'],
    owari: ['shinmei', 'p', 'c', 'n', 'lanterns'],
    mikawa: ['irimoya', 'p', 'c', 'v', 'mountain'],
    totomi: ['nagare', 'p', 'h', 'p', 'bigtree'],
    suruga: ['sengen', 'c', 'h', 'v', 'romon'],
    izu: ['irimoya', 'p', 'c', 'p', 'romon'],
    kai: ['nagare', 'v', 'c', 'v', 'mountain'],
    sagami: ['nagare', 'p', 'c', 'p', 'kagura'],
    musashi: ['nagare', 'v', 'c', 'B', 'romon'],
    awa_chiba: ['shinmei', 'p', 'c', 'n', 'mountain'],
    kazusa: ['gongen', 'k', 'c', 'v', ''],
    shimosa: ['nagare', 'k', 'h', 's', 'romon'],
    hitachi: ['nagare', 'c', 'c', 'p', 'romon,deer'],
    omi: ['nagare', 'p', 'h', 'v', 'lanterns'],
    mino: ['irimoya', 'c', 'h', 'v', 'romon'],
    hida: ['nagare', 'p', 'c', 'p', 'snowmtn'],
    shinano: ['suwa', 'p', 'h', 'p', 'onbashira'],
    kozuke: ['irimoya', 'c', 'c', 'v', 'romon,steps'],
    shimotsuke: ['gongen', 'c', 'c', 'v', 'snowmtn'],
    iwaki: ['nagare', 'p', 'h', 'p', ''],
    iwashiro: ['irimoya', 'p', 'c', 'p', 'snowmtn'],
    rikuzen: ['nagare', 'c', 'h', 'v', 'romon,steps'],
    rikuchu: ['nagare', 'p', 'c', 'p', 'mountain'],
    mutsu_aomori: ['gongen', 'k', 'c', 'v', 'romon,snowmtn'],
    uzen: ['irimoya', 'c', 't', 'v', 'pagoda'],
    ugo: ['nagare', 'p', 'c', 'p', 'snowmtn'],
    wakasa: ['nagare', 'p', 'h', 'p', 'romon'],
    echizen: ['nagare', 'v', 'c', 'R', ''],
    kaga: ['nagare', 'p', 'c', 'p', 'snowmtn'],
    noto: ['nagare', 'p', 'h', '-', 'thatchgate'],
    etchu: ['nagare', 'p', 'c', 'v', 'snowmtn'],
    echigo: ['shinmei', 'p', 'c', 'B', 'mountain'],
    sado: ['nagare', 'p', 'h', 'p', 'sea'],
    tanba: ['nagare', 'p', 'h', 'p', 'mountain'],
    tango: ['shinmei', 'p', 'h', 'n', 'sea'],
    tajima: ['nagare', 'v', 'h', 'v', ''],
    inaba: ['nagare', 'p', 'c', 's', 'lanterns'],
    hoki: ['irimoya', 'p', 'h', 'p', 'steps'],
    izumo: ['taisha', 'p', 'h', '-', 'kagura'],
    iwami: ['kasuga', 'v', 'h', 'v', '', 1],
    oki: ['kasuga', 'p', 't', 'p', '', 1],
    harima: ['nagare', 'p', 'h', 'p', 'bigtree'],
    mimasaka: ['irimoya-kara', 'p', 'h', 'p', ''],
    bizen: ['nagare', 'p', 'c', 's', 'lanterns,mountain'],
    bitchu: ['kibitsu', 'v', 'h', 'v', 'corridor'],
    bingo: ['irimoya', 'v', 'h', 'v', ''],
    aki: ['itsukushima', 'v', 'h', '-', ''],
    suo: ['nagare', 'p', 'c', 'p', ''],
    nagato: ['nagare', 'p', 'h', 'v', '', 5],
    kii: ['shinmei', 'p', 'c', 'n', 'bigtree'],
    awaji: ['irimoya', 'p', 'c', 'v', 'bigtree'],
    awa_tokushima: ['nagare', 'p', 'c', 's', 'bigtree'],
    sanuki: ['nagare', 'c', 'c', 'v', 'lanterns'],
    iyo: ['nagare', 'p', 'h', 's', 'bigtree,romon'],
    tosa: ['tombo', 'p', 'h', 'p', ''],
    chikuzen: ['sumiyoshi', 'v', 'h', 'v', '', 1],
    chikugo: ['gongen', 'c', 'c', 's', 'mountain'],
    buzzen: ['hachiman', 'c', 'h', 'v', 'romon'],
    bungo: ['hachiman', 'c', 'c', 'v', 'steps'],
    hizen: ['nagare', 'v', 'c', 's', ''],
    higo: ['nagare', 'p', 'h', '-', 'romon'],
    hyuga: ['nagare', 'p', 'c', 'v', ''],
    osumi: ['gongen', 'c', 'c', 'v', ''],
    satsuma: ['gongen', 'c', 'c', 'v', 'mountain'],
    iki: ['nagare', 'p', 'h', 's', 'steps'],
    tsushima: ['nagare', 'p', 'h', 's', 'sea'],
    hokkaido_ezo: ['shinmei', 'p', 'c', 'n', 'snowmtn']
};

function buildShrineFor(prov) {
    return buildShrineModel(getSites(prov).shrines[0].m);
}
function buildShrineModel(rawSpec) {
    initArchMaterials();
    const raw = rawSpec || ['nagare', 'v', 'c', 'v', ''];
    const [arch, b, r, t, ex, n] = raw;
    const spec = { b, r };
    const c = shrineCtx(spec);
    const extras = ex ? ex.split(',') : [];
    const g = new THREE.Group();
    let hall;
    switch (arch) {
        case 'kasuga': hall = hallKasuga(c, n || 1); break;
        case 'shinmei': hall = hallShinmei(c); break;
        case 'taisha': hall = hallTaisha(c, true); break;
        case 'otori': hall = hallTaisha(c, false); break;
        case 'sumiyoshi': hall = hallSumiyoshi(c, n || 1); break;
        case 'hachiman': hall = hallHachiman(c); break;
        case 'gongen': hall = hallGongen(c); break;
        case 'irimoya': hall = hallIrimoya(c); break;
        case 'irimoya-kara': hall = hallIrimoya(c, { kara: true }); break;
        case 'kibitsu': hall = hallKibitsu(c); break;
        case 'sengen': hall = hallSengen(c); break;
        case 'miwa': hall = hallMiwa(c); break;
        case 'suwa': hall = hallSuwa(c); break;
        case 'itsukushima': hall = hallItsukushima(c); break;
        case 'tombo': hall = hallTombo(c); break;
        case 'rock': hall = hallRock(c); break;
        case 'utaki': hall = hallUtaki(c); break;
        default: hall = hallNagare(c, n || 1);
    }
    g.add(hall);
    if (extras.includes('romon')) {
        const rm = romonGate(c.gateMat, c.roof === MATS.thatch ? MATS.cypressRoof : c.roof);
        rm.position.z = 0.46;
        g.add(rm);
        if (['B', 'P', 'G'].includes(t)) {
            const big = torii(t, 0.42);
            big.position.z = 0.82;
            g.add(big);
        }
    } else if (t !== '-') {
        const tr = torii(t, 0.42);
        tr.position.z = extras.includes('tatesuna') ? 0.5 : 0.44;
        g.add(tr);
    }
    addShrineExtras(g, extras, c);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
}

// ---------- 城郭 ----------
function roofMatFor(r) {
    return { s: MATS.slateTile, c: MATS.copperGreen, r: MATS.redRoof, t: MATS.stoneRoof, l: MATS.leadRoof }[r] || MATS.slateTile;
}
function windowsOn(g, w, d, y, mat = MATS.windowDark) {
    const n = Math.max(2, Math.round(w / 0.09));
    for (let i = 0; i < n; i++) {
        const x = -w / 2 + (w / n) * (i + 0.5);
        g.add(bx(0.03, 0.035, 0.008, mat, x, y, d / 2 + 0.002));
        g.add(bx(0.03, 0.035, 0.008, mat, x, y, -d / 2 - 0.002));
    }
}
function shachi(g, y, w, big = false) {
    [-1, 1].forEach(s => {
        const f = new THREE.Mesh(new THREE.ConeGeometry(big ? 0.028 : 0.018, big ? 0.08 : 0.055, 5), MATS.gold);
        f.position.set(s * w * 0.42, y + (big ? 0.04 : 0.028), 0);
        f.rotation.z = s * 0.4;
        g.add(f);
    });
}
// 天守：tiers 層數、wall(w白/b黑漆/m下黑上白/i鐵板)、roof、form(b望樓/s層塔/k唐造)
// 天守：n 層數、wall（w白壁／b黑漆下見板／m下黑上白／i北面鐵板張／t白壁＋最上層黑漆金飾＝大坂城）
//       roof、f（b望樓型／s層塔型／k唐造）、w0 一層寬、dz 進深比、shrink 每層收分、th 層高
function tenshu(o) {
    const g = new THREE.Group();
    const roof = roofMatFor(o.r);
    const n = o.n || 3;
    const w0 = o.w0 || 0.4, d0 = w0 * (o.dz || 0.82);
    const shrink = o.shrink || (n >= 5 ? 0.1 : 0.13);
    const th = o.th || 0.11;
    let y = 0;
    for (let i = 0; i < n; i++) {
        const last = i === n - 1;
        let s = o.f === 'b' ? (i === 0 ? 1 : 0.84 - (i - 1) * shrink) : 1 - i * shrink;
        if (o.f === 'k' && last) s = (1 - (i - 1) * shrink) * 1.1;
        const w = w0 * s, d = d0 * s;
        const h = i === 0 && o.f === 'b' ? th * 1.35 : th;
        const goldTop = o.wall === 't' && last;
        const dark = o.wall === 'b' || o.wall === 'i' || (o.wall === 'm' && i < Math.ceil(n / 2)) || goldTop;
        g.add(bx(w, h, d, dark ? MATS.blackLacquer : MATS.whiteWall, 0, y));
        if (dark && !goldTop) g.add(bx(w + 0.004, 0.022, d + 0.004, MATS.whiteWall, 0, y + h - 0.022));
        if (goldTop) {
            // 大坂城最上層：黑漆壁面＋金色伏虎與鶴的浮雕帶
            g.add(bx(w + 0.006, 0.02, d + 0.006, MATS.gold, 0, y + h * 0.62));
            g.add(bx(w + 0.006, 0.012, d + 0.006, MATS.gold, 0, y + 0.01));
        }
        if (o.wall === 'i') g.add(bx(w + 0.006, h * 0.8, 0.01, MATS.ironPlate, 0, y + 0.01, -d / 2 - 0.004));
        windowsOn(g, w, d, y + h * 0.42, dark ? (goldTop ? MATS.gold : MATS.whiteWall) : MATS.windowDark);
        y += h;
        if (last) {
            g.add(irimoya(w + 0.11, d + 0.09, 0.2, roof, y));
            if (o.balcony || goldTop) g.add(bx(w + 0.05, 0.016, d + 0.05, goldTop ? MATS.gold : MATS.darkWood, 0, y - 0.035));
            shachi(g, y + 0.19, w * 0.42 + 0.1, o.gold);
            y += 0.2;
        } else {
            const big = o.f === 'b' && i === 0;
            const ew = w + 0.12, ed = d + 0.1;
            g.add(big ? irimoya(ew + 0.02, ed + 0.02, 0.17, roof, y) : hipRoof(ew, ed, 0.06, roof, y, 0.72));
            // 千鳥破風：大型天守每層正面與側面加裝三角山牆
            if (o.hafu && (i % 2 === 1 || w0 >= 0.5)) {
                [[0, d / 2 + 0.03, Math.PI / 2], [w / 2 + 0.03, 0, 0]].forEach(([hx, hz, rot]) => {
                    const hf = gable(0.13 * Math.max(1, w0 / 0.45), 0.08, 0.065, roof, y + 0.015, 0.01);
                    hf.rotation.y = rot;
                    hf.position.x = hx;
                    hf.position.z = hz;
                    g.add(hf);
                });
            }
            if (o.gold) g.add(bx(ew + 0.01, 0.01, ed + 0.01, MATS.gold, 0, y));
            y += big ? 0.1 : 0.05;
        }
    }
    g.userData.h = y;
    g.userData.w = w0;
    return g;
}

// 各天守的實際比例：寬胖的大天守（名古屋、大坂、熊本、姬路、岡山）與細高（松本、廣島）、小巧（犬山、丸龜、備中松山）的天守區分開來
const TENSHU_SHAPES = {
    '大坂城': { w0: 0.58, dz: 0.88, shrink: 0.1, wall: 't', r: 'c', gold: 1, hafu: 1 },
    '名古屋城': { w0: 0.64, dz: 0.86, shrink: 0.11, gold: 1, hafu: 1 },
    '熊本城': { w0: 0.58, dz: 0.86, shrink: 0.13, hafu: 1 },
    '姬路城': { w0: 0.56, dz: 0.78, shrink: 0.1 },
    '岡山城': { w0: 0.56, dz: 0.68, shrink: 0.13 },
    '松江城': { w0: 0.54, dz: 0.84, shrink: 0.12 },
    '會津若松城': { w0: 0.52, dz: 0.86, shrink: 0.1 },
    '小倉城': { w0: 0.52, dz: 0.86, shrink: 0.07 },
    '彥根城': { w0: 0.5, dz: 0.6, shrink: 0.16 },
    '福山城': { w0: 0.48, dz: 0.84, shrink: 0.1 },
    '小田原城': { w0: 0.46, dz: 0.84, shrink: 0.12 },
    '島原城': { w0: 0.44, dz: 0.84, shrink: 0.1 },
    '伏見城': { w0: 0.44, dz: 0.82, shrink: 0.11, gold: 1 },
    '松本城': { w0: 0.42, dz: 0.82, shrink: 0.08, th: 0.125 },
    '廣島城': { w0: 0.42, dz: 0.86, shrink: 0.08, th: 0.125 },
    '和歌山城': { w0: 0.42, shrink: 0.12 },
    '岡崎城': { w0: 0.4, shrink: 0.12 },
    '今治城': { w0: 0.4, shrink: 0.1 },
    '丸岡城': { w0: 0.4, dz: 0.76, th: 0.13 },
    '伊賀上野城': { w0: 0.4, shrink: 0.12 },
    '高知城': { w0: 0.38, dz: 0.82, shrink: 0.1, th: 0.12 },
    '伊予松山城': { w0: 0.38, shrink: 0.13 },
    '岸和田城': { w0: 0.38, shrink: 0.14 },
    '中津城': { w0: 0.36, shrink: 0.1 },
    '岩國城': { w0: 0.34, shrink: 0.08 },
    '犬山城': { w0: 0.34, dz: 0.86, shrink: 0.18 },
    '白河小峰城': { w0: 0.3, shrink: 0.14 },
    '館山城': { w0: 0.3 },
    '弘前城': { w0: 0.28, th: 0.12 },
    '備中松山城': { w0: 0.28, dz: 0.8 },
    '宇和島城': { w0: 0.28 },
    '洲本城': { w0: 0.26 },
    '丸龜城': { w0: 0.24 }
};

function castleBase(type) {
    const g = new THREE.Group();
    let top = 0.16;
    const stoneMat = type === 'g' ? MATS.greenStone : MATS.stone;
    const frustum = (rt, rb, h, mat, y) => {
        const geo = new THREE.CylinderGeometry(rt, rb, h, 4, 1);
        geo.rotateY(Math.PI / 4);
        const m = new THREE.Mesh(geo, mat);
        m.position.y = y + h / 2;
        return m;
    };
    if (type === 'e') {
        g.add(frustum(0.36, 0.46, 0.14, MATS.grass, 0));
        top = 0.14;
    } else if (type === 'x') {
        // 段石垣（丸龜城、津山城）
        g.add(frustum(0.42, 0.48, 0.14, MATS.stone, 0), frustum(0.34, 0.39, 0.13, MATS.stone, 0.14), frustum(0.27, 0.31, 0.13, MATS.stone, 0.27));
        g.add(frustum(0.38, 0.42, 0.006, MATS.grass, 0.14), frustum(0.31, 0.34, 0.006, MATS.grass, 0.27));
        top = 0.4;
    } else if (type === 'c' || type === 'M' || type === 'm') {
        const hillH = type === 'm' ? 0.18 : type === 'M' ? 0.4 : 0.26;
        const hill = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.5, hillH, 9, 2), type === 'c' ? MATS.rock : MATS.hillGreen);
        hill.position.y = hillH / 2;
        g.add(hill);
        if (type === 'c') [[-0.3, 0.2], [0.28, 0.25], [0.1, -0.35]].forEach(([x, z]) => g.add(sp(0.12, MATS.rock, x, 0.06, z, 6)));
        g.add(frustum(0.22, 0.26, 0.08, MATS.stone, hillH));
        top = hillH + 0.08;
    } else if (type === 'v') {
        // 武者返：下緩上陡的弧形石垣（熊本城）
        const geo = new THREE.CylinderGeometry(0.3, 0.48, 0.3, 4, 6);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const yy = pos.getY(i) + 0.15;
            const k = 1 + Math.pow(1 - yy / 0.3, 2) * 0.25;
            pos.setX(i, pos.getX(i) * k);
            pos.setZ(i, pos.getZ(i) * k);
        }
        geo.computeVertexNormals();
        geo.rotateY(Math.PI / 4);
        const m = new THREE.Mesh(geo, MATS.stone);
        m.position.y = 0.15;
        g.add(m);
        top = 0.3;
    } else if (type === 'round') {
        // 鳥取城「天球丸」球面卷石垣
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), MATS.stone);
        g.add(ball);
        top = 0.28;
    } else {
        const h = type === 'T' ? 0.42 : type === 't' ? 0.3 : 0.18;
        g.add(frustum(0.32, 0.42, h, stoneMat, 0));
        top = h;
    }
    g.userData.top = top;
    return g;
}
function moatRing(g, r = 0.56, wd = 0.1) {
    [[0, r, r * 2 + wd, wd], [0, -r, r * 2 + wd, wd], [r, 0, wd, r * 2], [-r, 0, wd, r * 2]].forEach(([x, z, w, d]) => g.add(bx(w, 0.015, d, MATS.pondWater, x, 0, z)));
}
function yagura(levels = 2, w = 0.2, roof = MATS.slateTile, dark = false) {
    const g = new THREE.Group();
    let y = 0;
    for (let i = 0; i < levels; i++) {
        const s = 1 - i * 0.2;
        g.add(bx(w * s, 0.1, w * 0.8 * s, dark ? MATS.blackLacquer : MATS.whiteWall, 0, y));
        windowsOn(g, w * s, w * 0.8 * s, y + 0.04);
        y += 0.1;
        g.add(i === levels - 1 ? irimoya(w * s + 0.07, w * 0.8 * s + 0.06, 0.12, roof, y) : hipRoof(w * s + 0.07, w * 0.8 * s + 0.06, 0.05, roof, y, 0.7));
        y += i === levels - 1 ? 0.12 : 0.04;
    }
    return g;
}
function yaguraGate(w = 0.3, roof = MATS.slateTile, big = false) {
    const g = new THREE.Group();
    const s = big ? 1.3 : 1;
    [-1, 1].forEach(sd => g.add(bx(0.1 * s, 0.12 * s, 0.14 * s, MATS.stone, sd * w * 0.38 * s)));
    g.add(bx(w * s, 0.1 * s, 0.14 * s, big ? MATS.darkWood : MATS.whiteWall, 0, 0.12 * s));
    g.add(bx(w * 0.36 * s, 0.12 * s, 0.1 * s, MATS.darkWood, 0, 0, 0.0));
    g.add(irimoya(w * s + 0.08, 0.22 * s, 0.12 * s, roof, 0.22 * s));
    if (big) shachi(g, 0.34 * s, w * s, true);
    return g;
}
function palaceHall(w, d, roof = MATS.slateTile) {
    const g = new THREE.Group();
    g.add(bx(w, 0.03, d, MATS.stone));
    g.add(bx(w - 0.04, 0.1, d - 0.04, MATS.whiteWall, 0, 0.03));
    for (let i = 0; i < Math.round(w / 0.06); i++) g.add(bx(0.012, 0.1, 0.012, MATS.darkWood, -w / 2 + 0.03 + i * 0.06, 0.03, d / 2 - 0.02));
    g.add(irimoya(w + 0.06, d + 0.06, 0.14, roof, 0.13));
    return g;
}
function flagBanner(text, color = '#f8fafc', ink = '#111827') {
    const g = new THREE.Group();
    g.add(cy(0.008, 0.01, 0.6, MATS.darkWood, 0, 0, 0, 5));
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 128;
    const ctx2 = cv.getContext('2d');
    ctx2.fillStyle = color; ctx2.fillRect(0, 0, 64, 128);
    ctx2.fillStyle = ink; ctx2.font = 'bold 54px "Noto Serif TC", serif';
    ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillText(text, 32, 64);
    const tex = new THREE.CanvasTexture(cv);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.22), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
    flag.position.set(0.06, 0.46, 0);
    g.add(flag, bx(0.13, 0.008, 0.008, MATS.darkWood, 0.06, 0.57));
    return g;
}
function addCastleExtras(g, x, o, top) {
    const has = k => x.includes(k);
    const roof = roofMatFor(o.r);
    if (has('sakura')) [[-0.42, 0.3], [0.42, 0.32], [0.4, -0.3], [-0.38, -0.34]].forEach(([px, pz]) => g.add(sakuraTree(px, pz, 0.9)));
    if (has('pines')) [[-0.4, 0.3], [0.4, -0.25], [0.35, 0.35]].forEach(([px, pz]) => g.add(pineTree(px, pz, 1)));
    if (has('trees') || has('cedar')) [[-0.4, 0.28], [0.42, 0.2], [-0.36, -0.32], [0.3, -0.38]].forEach(([px, pz]) => g.add(has('cedar') ? pineTree(px, pz, 1.4) : bigTree(px, pz, 0.6)));
    if (has('yagura')) g.add(yagura(2, 0.16, roof).translateX(0.3).translateZ(0.28).translateY(top * 0.6));
    if (has('goten')) g.add(palaceHall(0.36, 0.2, roof).translateX(-0.2).translateZ(0.34));
    if (has('gate')) g.add(yaguraGate(0.28, roof).translateZ(0.44));
    if (has('garden')) {
        g.add(bx(0.26, 0.012, 0.18, MATS.sand, -0.32, 0, 0.36));
        [[-0.38, 0.33], [-0.28, 0.4], [-0.33, 0.3]].forEach(([px, pz], i) => g.add(sp(0.025 + i * 0.008, MATS.rock, px, 0.02, pz, 6)));
    }
    if (has('lake')) g.add(bx(1.0, 0.012, 0.22, MATS.pondWater, 0, 0, -0.62));
    if (has('river')) g.add(bx(1.1, 0.012, 0.16, MATS.pondWater, 0, 0, -0.58));
    if (has('tsukimi')) {
        // 松本城月見櫓：朱漆欄杆
        const t = new THREE.Group();
        t.add(bx(0.16, 0.1, 0.14, MATS.blackLacquer));
        t.add(bx(0.18, 0.025, 0.16, MATS.vermilion, 0, 0.1));
        t.add(hipRoof(0.22, 0.2, 0.06, roof, 0.125, 0.6));
        t.position.set(0.26, top, 0.08);
        g.add(t);
    }
    if (has('redbridge')) {
        const b = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 5, 12, Math.PI), MATS.vermilion);
        b.scale.set(1, 0.4, 1);
        b.rotation.y = Math.PI / 2;
        b.position.set(0, 0, 0.56);
        g.add(b);
    }
    if (has('nijubashi')) {
        const b = new THREE.Group();
        [-0.06, 0.06].forEach(px => {
            const a = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 5, 10, Math.PI), MATS.stone);
            a.position.x = px;
            b.add(a);
        });
        b.add(bx(0.26, 0.015, 0.06, MATS.stone, 0, 0.05));
        b.rotation.y = Math.PI / 2;
        b.position.set(0, 0, 0.56);
        g.add(b);
    }
    if (has('kintai')) {
        // 錦帶橋：五連木造拱橋
        g.add(bx(1.2, 0.012, 0.2, MATS.pondWater, 0, 0, 0.6));
        for (let i = 0; i < 5; i++) {
            const a = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 4, 10, Math.PI), MATS.plainWood);
            a.scale.set(1, 0.55, 2.2);
            a.position.set(-0.4 + i * 0.2, 0, 0.6);
            g.add(a);
        }
    }
    if (has('cloud')) {
        // 竹田城雲海
        for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2;
            const puff = sp(0.11 + (i % 3) * 0.03, MATS.cloudWhite, Math.cos(a) * 0.5, 0.16, Math.sin(a) * 0.5, 10);
            puff.scale.y = 0.55;
            g.add(puff);
        }
    }
    if (has('flagbi')) g.add(flagBanner('毘').translateX(0.22).translateY(top).translateZ(0.06));
    if (has('flag')) g.add(flagBanner('菊', '#f8fafc', '#1d4ed8').translateX(0.22).translateY(top).translateZ(0.06));
    if (has('statue')) {
        // 伊達政宗騎馬像
        const s = new THREE.Group();
        s.add(bx(0.12, 0.05, 0.08, MATS.stone));
        s.add(bx(0.12, 0.05, 0.04, MATS.bronze, 0, 0.09), bx(0.03, 0.06, 0.03, MATS.bronze, 0.07, 0.12));
        [[-0.04, -0.012], [0.04, -0.012], [-0.04, 0.012], [0.04, 0.012]].forEach(([lx, lz]) => s.add(bx(0.012, 0.04, 0.012, MATS.bronze, lx, 0.05, lz)));
        s.add(bx(0.03, 0.06, 0.03, MATS.bronze, 0, 0.14), cy(0, 0.03, 0.03, MATS.bronze, 0, 0.2, 0, 6));
        s.position.set(0.24, top, 0.18);
        g.add(s);
    }
    if (has('jinpukaku')) {
        // 仁風閣：白色洋館
        const j = new THREE.Group();
        j.add(bx(0.26, 0.14, 0.14, MATS.whiteWall), hipRoof(0.3, 0.18, 0.08, MATS.copperGreen, 0.14, 0.3));
        windowsOn(j, 0.26, 0.14, 0.05);
        j.position.set(-0.24, 0, 0.36);
        g.add(j);
    }
    if (has('ridge')) [-0.42, 0.42].forEach(px => g.add(bx(0.3, 0.1, 0.12, MATS.stone, px, 0, -0.1)));
    if (has('noborii')) [-0.18, 0.18].forEach(px => {
        const w = bx(0.05, 0.08, 0.6, MATS.stone, px, 0, 0.3);
        w.rotation.x = 0.35;
        g.add(w);
    });
    if (has('tamon')) g.add(palaceHall(0.6, 0.1, roof).translateZ(0.42));
    if (has('karamon')) {
        // 二條城唐門：黑漆金飾、唐破風
        const k = new THREE.Group();
        [-0.07, 0.07].forEach(px => k.add(bx(0.03, 0.14, 0.03, MATS.blackLacquer, px)));
        k.add(bx(0.18, 0.03, 0.08, MATS.gold, 0, 0.14));
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12, Math.PI), MATS.cypressRoof);
        arc.position.y = 0.16;
        arc.scale.set(1, 0.5, 1.3);
        k.add(arc);
        k.position.z = 0.42;
        g.add(k);
    }
}

// 各國代表城郭規格
const CASTLE_SPECS = {
    yamashiro: { k: 'G', moat: 1, x: 'karamon' },
    yamato: { k: 'R', base: 't', x: 'yagura,trees' },
    kawachi: { k: 'R', base: 'M', x: 'flag,trees' },
    izumi: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 's', moat: 1, x: 'garden' },
    settsu: { k: 'T', n: 5, wall: 'w', r: 'c', f: 's', base: 't', moat: 1, gold: 1 },
    iga: { k: 'T', n: 3, wall: 'w', r: 's', f: 's', base: 'T', moat: 1 },
    ise: { k: 'R', base: 's', x: 'pines' },
    shima: { k: 'R', base: 's', sea: 1, x: 'yagura' },
    owari: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 'c', balcony: 1 },
    mikawa: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 's', moat: 1, x: 'sakura' },
    totomi: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 'm', w0: 0.32, x: 'goten' },
    suruga: { k: 'Y', moat: 1, x: 'gate' },
    izu: { k: 'E' },
    kai: { k: 'R', base: 'T', x: 'yagura' },
    sagami: { k: 'T', n: 3, wall: 'w', r: 's', f: 's', base: 't', x: 'gate' },
    musashi: { k: 'Y', moat: 1, x: 'nijubashi', levels: 3 },
    awa_chiba: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 'm', w0: 0.32, x: 'pines' },
    kazusa: { k: 'T', n: 3, wall: 'w', r: 's', f: 's', base: 'm', w0: 0.34 },
    shimosa: { k: 'R', base: 'e', moat: 1, x: 'sakura' },
    hitachi: { k: 'Gate', base: 'e', x: 'yagura,trees' },
    omi: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 's', moat: 1, hafu: 1, x: 'lake' },
    mino: { k: 'T', n: 3, wall: 'w', r: 's', f: 'b', base: 'M', w0: 0.3 },
    hida: { k: 'R', base: 'M', x: 'trees' },
    shinano: { k: 'T', n: 5, wall: 'b', r: 's', f: 's', base: 's', moat: 1, sub: 1, x: 'tsukimi' },
    kozuke: { k: 'R', base: 'm', x: 'gate,trees' },
    shimotsuke: { k: 'Yk' },
    iwaki: { k: 'T', n: 3, wall: 'w', r: 's', f: 's', base: 't', w0: 0.32 },
    iwashiro: { k: 'T', n: 5, wall: 'w', r: 'r', f: 's', base: 's', moat: 1 },
    rikuzen: { k: 'R', base: 'c', x: 'statue,yagura' },
    rikuchu: { k: 'R', base: 't', x: 'sakura' },
    mutsu_aomori: { k: 'T', n: 3, wall: 'w', r: 'c', f: 's', base: 's', moat: 1, w0: 0.3, x: 'sakura,redbridge' },
    uzen: { k: 'Gate', base: 's', moat: 1 },
    ugo: { k: 'Y', base: 'e', levels: 3, x: 'trees' },
    wakasa: { k: 'R', base: 's', sea: 1 },
    echizen: { k: 'T', n: 2, wall: 'm', r: 't', f: 'b', base: 's', w0: 0.34, x: 'pines' },
    kaga: { k: 'N' },
    noto: { k: 'R', base: 'M', x: 'pines' },
    etchu: { k: 'R', base: 'e', moat: 1, x: 'trees' },
    echigo: { k: 'R', base: 'M', x: 'flagbi' },
    sado: { k: 'B' },
    tanba: { k: 'R', base: 't', moat: 1, x: 'goten' },
    tango: { k: 'Y', moat: 1, levels: 2, x: 'gate' },
    tajima: { k: 'R', base: 'M', x: 'cloud' },
    inaba: { k: 'R', base: 'round', x: 'jinpukaku' },
    hoki: { k: 'R', base: 'c', x: 'pines' },
    izumo: { k: 'T', n: 4, wall: 'b', r: 's', f: 'b', base: 's', moat: 1, hafu: 1 },
    iwami: { k: 'R', base: 'M', x: 'ridge' },
    oki: { k: 'O' },
    harima: { k: 'T', n: 5, wall: 'w', r: 's', f: 'b', base: 't', sub: 3, hafu: 1 },
    mimasaka: { k: 'R', base: 'x', x: 'yagura' },
    bizen: { k: 'T', n: 4, wall: 'b', r: 's', f: 'b', base: 's', gold: 1, x: 'river' },
    bitchu: { k: 'T', n: 2, wall: 'm', r: 's', f: 'b', base: 'c', w0: 0.3 },
    bingo: { k: 'T', n: 5, wall: 'i', r: 's', f: 's', base: 's', x: 'yagura' },
    aki: { k: 'T', n: 5, wall: 'b', r: 's', f: 'b', base: 's', moat: 1 },
    suo: { k: 'T', n: 4, wall: 'w', r: 's', f: 'k', base: 'M', w0: 0.3, x: 'kintai' },
    nagato: { k: 'R', base: 's', sea: 1, x: 'pines' },
    kii: { k: 'T', n: 3, wall: 'w', r: 's', f: 's', base: 'g', sub: 1 },
    awaji: { k: 'T', n: 2, wall: 'w', r: 's', f: 's', base: 'M', w0: 0.28, x: 'noborii' },
    awa_tokushima: { k: 'R', base: 'g', x: 'gate,garden' },
    sanuki: { k: 'T', n: 3, wall: 'w', r: 's', f: 's', base: 'x', w0: 0.26 },
    iyo: { k: 'T', n: 3, wall: 'm', r: 's', f: 's', base: 'M', sub: 2, w0: 0.3 },
    tosa: { k: 'T', n: 4, wall: 'w', r: 's', f: 'b', base: 's', x: 'goten' },
    chikuzen: { k: 'R', base: 'T', x: 'tamon' },
    chikugo: { k: 'R', base: 't', x: 'river,trees' },
    buzzen: { k: 'T', n: 5, wall: 'w', r: 's', f: 'k', base: 's', moat: 1 },
    bungo: { k: 'R', base: 'c', x: 'sakura' },
    hizen: { k: 'G', moat: 1, x: 'gate' },
    higo: { k: 'T', n: 3, wall: 'b', r: 's', f: 'b', base: 'v', sub: 1 },
    hyuga: { k: 'Gate', base: 's', x: 'cedar' },
    osumi: { k: 'R', base: 'M', x: 'trees' },
    satsuma: { k: 'Gate', base: 's', moat: 1, big: 1 },
    iki: { k: 'R', base: 'm', sea: 1 },
    tsushima: { k: 'A' },
    hokkaido_ezo: { k: 'S' }
};

function buildCastleFor(prov) {
    return buildCastleModel(getSites(prov).castles[0].m, prov.castle.hasTenshu);
}
function buildCastleModel(spec, hasTenshu = false) {
    initArchMaterials();
    const o = spec || { k: hasTenshu ? 'T' : 'R', n: 3, wall: 'w', r: 's', f: 'b', base: 's' };
    const x = o.x ? o.x.split(',') : [];
    const g = new THREE.Group();
    const roof = roofMatFor(o.r);
    if (o.sea) {
        const sea = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.012, 22), MATS.pondWater);
        g.add(sea);
    }
    if (o.moat) moatRing(g);

    if (o.k === 'T') {
        const base = castleBase(o.base || 's');
        // 石垣台座依天守寬度放大，胖天守不會懸空
        const baseK = Math.max(1, ((o.w0 || 0.4) + 0.12) / 0.45);
        base.scale.set(baseK, 1, baseK);
        g.add(base);
        const t = tenshu(o);
        t.position.y = base.userData.top;
        g.add(t);
        // 連立式小天守
        const subs = o.sub || 0;
        const subPos = [[0.26, -0.18], [-0.26, -0.18], [0.0, -0.3]];
        for (let i = 0; i < subs; i++) {
            const st = tenshu({ n: 2, wall: o.wall, r: o.r, f: 's', w0: 0.2 });
            st.position.set(subPos[i][0], base.userData.top * 0.85, subPos[i][1]);
            g.add(st);
            g.add(bx(Math.abs(subPos[i][0]) + 0.05, 0.08, 0.06, o.wall === 'b' ? MATS.blackLacquer : MATS.whiteWall, subPos[i][0] / 2, base.userData.top * 0.85, subPos[i][1] / 2));
        }
        addCastleExtras(g, x, o, base.userData.top);
    } else if (o.k === 'R') {
        const base = castleBase(o.base || 's');
        g.add(base);
        // 城跡：天守台＋石垣上的草地與殘存石
        g.add(bx(0.16, 0.05, 0.16, MATS.stone, -0.04, base.userData.top, -0.06));
        if (o.base !== 'round') g.add(bx(0.36, 0.006, 0.36, MATS.grass, 0, base.userData.top));
        if (o.base === 'round') g.add(castleBase('t').translateX(0.32).translateZ(-0.2));
        addCastleExtras(g, x, o, base.userData.top);
    } else if (o.k === 'G') {
        // 御殿：二條城二之丸御殿／佐賀城本丸御殿
        g.add(bx(0.8, 0.06, 0.6, MATS.stone));
        g.add(palaceHall(0.46, 0.2, MATS.cypressRoof).translateX(-0.08).translateZ(-0.12).translateY(0.06));
        g.add(palaceHall(0.3, 0.18, MATS.cypressRoof).translateX(0.2).translateZ(0.08).translateY(0.06));
        g.add(palaceHall(0.22, 0.16, MATS.cypressRoof).translateX(-0.22).translateZ(0.14).translateY(0.06));
        addCastleExtras(g, x, o, 0.06);
    } else if (o.k === 'Y') {
        const base = castleBase(o.base || 's');
        g.add(base);
        g.add(yagura(o.levels || 2, 0.24, roof).translateY(base.userData.top));
        g.add(bx(0.5, 0.08, 0.03, MATS.whiteWall, 0.1, base.userData.top, 0.22));
        addCastleExtras(g, x, o, base.userData.top);
    } else if (o.k === 'Gate') {
        const base = castleBase(o.base || 's');
        base.scale.set(1.1, 0.7, 0.7);
        g.add(base);
        const top = base.userData.top * 0.7;
        g.add(yaguraGate(0.34, roof, !!o.big).translateY(top).translateZ(0.06));
        [-1, 1].forEach(s => g.add(bx(0.22, 0.08, 0.03, MATS.whiteWall, s * 0.36, top, 0.06)));
        addCastleExtras(g, x, o, top);
    } else if (o.k === 'Yk') {
        // 足利氏館：方形土壘＋水堀＋鑁阿寺本堂
        moatRing(g, 0.5, 0.08);
        [[0, 0.42, 0.84, 0.08], [0, -0.42, 0.84, 0.08], [0.42, 0, 0.08, 0.84], [-0.42, 0, 0.08, 0.84]].forEach(([px, pz, w, d]) => g.add(bx(w, 0.07, d, MATS.grass, px, 0, pz)));
        const hall = new THREE.Group();
        hall.add(bx(0.4, 0.04, 0.3, MATS.stone), bx(0.34, 0.14, 0.24, MATS.plainWood, 0, 0.04));
        hall.add(irimoya(0.5, 0.4, 0.22, MATS.slateTile, 0.18));
        g.add(hall);
        const br = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 10, Math.PI), MATS.vermilion);
        br.rotation.y = Math.PI / 2;
        br.position.z = 0.5;
        g.add(br);
    } else if (o.k === 'N') {
        // 金澤城：海鼠壁＋鉛瓦的石川門與五十間長屋
        g.add(castleBase('s'));
        const nag = new THREE.Group();
        nag.add(bx(0.7, 0.12, 0.14, MATS.whiteWall));
        for (let i = 0; i < 10; i++) {
            const d = bx(0.03, 0.03, 0.005, MATS.slateTile, -0.31 + i * 0.07, 0.02, 0.072);
            d.rotation.z = Math.PI / 4;
            nag.add(d);
        }
        nag.add(bx(0.7, 0.1, 0.14, MATS.whiteWall, 0, 0.12));
        windowsOn(nag, 0.7, 0.14, 0.15);
        nag.add(irimoya(0.78, 0.22, 0.12, MATS.leadRoof, 0.22));
        nag.position.set(0, 0.18, -0.06);
        g.add(nag);
        g.add(yagura(2, 0.2, MATS.leadRoof).translateX(0.32).translateY(0.18).translateZ(0.16));
        g.add(yaguraGate(0.28, MATS.leadRoof).translateZ(0.42));
    } else if (o.k === 'E') {
        // 山中城：無石垣的土造城郭＋障子堀
        const hill = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 0.16, 10, 1), MATS.grass);
        hill.position.y = 0.08;
        g.add(hill);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.add(bx(0.12, 0.012, 0.1, MATS.wood, -0.21 + i * 0.14, 0.16, 0.12 + j * 0.13));
        g.add(bx(0.2, 0.06, 0.16, MATS.plainWood, 0.1, 0.16, -0.18), gable(0.24, 0.2, 0.08, MATS.thatch, 0.22).translateX(0.1).translateZ(-0.18));
        g.add(pineTree(-0.3, -0.2, 1));
    } else if (o.k === 'B') {
        // 佐渡奉行所＋道遊之割戶
        [-1, 1].forEach(s => {
            const half = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), MATS.rock);
            half.position.set(s * 0.17, 0.3, -0.28);
            half.scale.set(0.8, 1, 1);
            g.add(half);
        });
        g.add(bx(0.62, 0.04, 0.4, MATS.stone, 0, 0, 0.12));
        g.add(palaceHall(0.44, 0.2, MATS.slateTile).translateY(0.04).translateZ(0.06));
        g.add(yaguraGate(0.24, MATS.slateTile).translateZ(0.34));
    } else if (o.k === 'O') {
        // 隱岐：黑木御所（後醍醐天皇行在所）茅葺小御殿
        g.add(bx(0.56, 0.04, 0.44, MATS.sand));
        g.add(bx(0.32, 0.12, 0.2, MATS.darkWood, 0, 0.04), gable(0.38, 0.28, 0.16, MATS.thatch, 0.16));
        [-0.26, 0.26].forEach(px => g.add(bx(0.02, 0.07, 0.4, MATS.plainWood, px, 0.04)));
        g.add(pineTree(0.3, -0.25, 1.1), pineTree(-0.32, 0.25, 0.9));
    } else if (o.k === 'A') {
        // 金田城：古代朝鮮式山城石壘沿稜線蜿蜒
        const hill = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 0.3, 9, 1), MATS.hillGreen);
        hill.position.y = 0.15;
        g.add(hill);
        for (let i = 0; i < 9; i++) {
            const a = -0.6 + i * 0.18;
            const w = bx(0.16, 0.07, 0.05, MATS.rock, Math.cos(a) * 0.4, 0.04 + Math.sin(i) * 0.02, Math.sin(a) * 0.4 - 0.05);
            w.rotation.y = -a + Math.PI / 2;
            g.add(w);
        }
        g.add(bx(0.06, 0.1, 0.06, MATS.rock, -0.12, 0.3, 0), bx(0.06, 0.1, 0.06, MATS.rock, 0.02, 0.3, 0));
        const sea = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.012, 22), MATS.pondWater);
        g.add(sea);
    } else if (o.k === 'Kofu') {
        // 多賀城：古代國府的朱紅南門＋築地塀
        g.add(bx(0.86, 0.03, 0.5, MATS.sand));
        const gate = romonGate(MATS.vermilion, MATS.slateTile);
        gate.position.z = 0.1;
        g.add(gate);
        [-1, 1].forEach(s => g.add(bx(0.24, 0.12, 0.05, MATS.creamWall, s * 0.38, 0, 0.1), gable(0.26, 0.08, 0.04, MATS.slateTile, 0.12).translateX(s * 0.38).translateZ(0.1)));
        g.add(palaceHall(0.4, 0.18, MATS.slateTile).translateZ(-0.22));
    } else if (o.k === 'Town') {
        // 一乘谷：復原武家屋敷與町家街道
        g.add(bx(0.86, 0.02, 0.62, MATS.sand));
        for (let i = 0; i < 3; i++) [-1, 1].forEach(s => {
            const h = new THREE.Group();
            h.add(bx(0.18, 0.1, 0.14, MATS.creamWall), gable(0.22, 0.18, 0.08, i % 2 ? MATS.cypressRoof : MATS.slateTile, 0.1));
            h.position.set(-0.26 + i * 0.26, 0.02, s * 0.17);
            g.add(h);
        });
        g.add(bx(0.86, 0.006, 0.1, MATS.paver, 0, 0.02, 0));
        g.add(sacredMountain(false, 0, -0.55, 0.5));
    } else if (o.k === 'Tera') {
        // 國分寺：瓦葺本堂＋鐘樓
        g.add(bx(0.7, 0.04, 0.5, MATS.stone));
        const hall = new THREE.Group();
        hall.add(bx(0.36, 0.16, 0.24, MATS.plainWood), irimoya(0.5, 0.38, 0.24, MATS.slateTile, 0.16));
        hall.position.set(-0.06, 0.04, -0.04);
        g.add(hall);
        const bell = new THREE.Group();
        [[-0.05, -0.05], [0.05, -0.05], [-0.05, 0.05], [0.05, 0.05]].forEach(([x, z]) => bell.add(bx(0.015, 0.14, 0.015, MATS.wood, x, 0, z)));
        bell.add(cy(0.03, 0.035, 0.06, MATS.bronze, 0, 0.07), hipRoof(0.16, 0.16, 0.06, MATS.slateTile, 0.14, 0.2));
        bell.position.set(0.24, 0.04, 0.14);
        g.add(bell, pineTree(0.28, -0.2, 0.9));
    } else if (o.k === 'Dyke') {
        // 水城：長土壘＋外側水濠
        const dyke = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 1.0, 4, 1), MATS.grass);
        dyke.rotation.z = Math.PI / 2;
        dyke.rotation.x = Math.PI / 4;
        dyke.scale.set(1, 1, 0.9);
        dyke.position.y = 0.06;
        g.add(dyke);
        g.add(bx(1.0, 0.012, 0.16, MATS.pondWater, 0, 0, 0.24));
        [-0.3, 0.1, 0.36].forEach(x => g.add(bigTree(x, -0.24, 0.45)));
    } else if (o.k === 'Yayoi') {
        // 吉野ヶ里：環濠＋木柵＋物見櫓＋竪穴住居
        const moat = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 4, 28), MATS.pondWater);
        moat.rotation.x = Math.PI / 2;
        g.add(moat);
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            g.add(bx(0.015, 0.08, 0.015, MATS.wood, Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38));
        }
        const tower = new THREE.Group();
        [[-0.05, -0.05], [0.05, -0.05], [-0.05, 0.05], [0.05, 0.05]].forEach(([x, z]) => tower.add(bx(0.015, 0.3, 0.015, MATS.wood, x, 0, z)));
        tower.add(bx(0.14, 0.02, 0.14, MATS.wood, 0, 0.3), gable(0.16, 0.16, 0.08, MATS.thatch, 0.34));
        tower.position.set(0.12, 0, -0.08);
        g.add(tower);
        [[-0.18, 0.1], [-0.1, -0.18], [0.05, 0.2]].forEach(([x, z]) => {
            const hut = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 8), MATS.thatch);
            hut.position.set(x, 0.06, z);
            g.add(hut);
        });
    } else if (o.k === 'Gusuku' || o.k === 'Shuri') {
        // グスク：琉球石灰岩的曲線城牆（相方積），沿地形起伏；首里城另有朱紅正殿與守禮門
        const { tile, stone } = ryukyuMats();
        const v = o.v || '';
        const hill = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, v === 'tier' ? 0.1 : 0.06, 14), MATS.grass);
        hill.position.y = v === 'tier' ? 0.05 : 0.03;
        g.add(hill);
        const baseY = v === 'tier' ? 0.1 : 0.06;
        // 沿閉合曲線排列短牆段，做出弧形城牆
        const wall = (rx, rz, h, y0, cx = 0, cz = 0, gap = -1, wave = 0, n = 34) => {
            for (let i = 0; i < n; i++) {
                if (gap >= 0 && Math.abs(i - gap) < 1.5) continue;
                const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
                const x0 = Math.cos(a0) * rx * (1 + 0.12 * Math.sin(a0 * 3)), z0 = Math.sin(a0) * rz;
                const x1 = Math.cos(a1) * rx * (1 + 0.12 * Math.sin(a1 * 3)), z1 = Math.sin(a1) * rz;
                const len = Math.hypot(x1 - x0, z1 - z0) + 0.006;
                const hh = h * (1 + wave * Math.sin(am * 4));
                const seg = bx(len, hh, 0.035, stone, cx + (x0 + x1) / 2, y0, cz + (z0 + z1) / 2);
                seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
                g.add(seg);
            }
        };
        const archGate = (x, z, y0, rotY = 0) => {
            const gate = new THREE.Group();
            gate.add(bx(0.05, 0.12, 0.06, stone, -0.055, 0), bx(0.05, 0.12, 0.06, stone, 0.055, 0));
            const arch = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.022, 6, 10, Math.PI), stone);
            arch.position.y = 0.11;
            arch.scale.z = 1.4;
            gate.add(arch, bx(0.16, 0.035, 0.06, stone, 0, 0.15));
            gate.position.set(x, y0, z);
            gate.rotation.y = rotY;
            g.add(gate);
        };
        if (o.k === 'Shuri') {
            wall(0.44, 0.34, 0.1, baseY, 0, 0, 25);
            wall(0.3, 0.22, 0.09, baseY + 0.02, 0, -0.03, 25);
            archGate(0, 0.33, baseY);
            // 正殿：朱紅漆、二層、赤瓦歇山頂＋正面唐破風
            const sd = new THREE.Group();
            sd.add(bx(0.4, 0.04, 0.22, stone, 0, 0));
            sd.add(bx(0.36, 0.12, 0.18, MATS.vermilion, 0, 0.04));
            sd.add(irimoya(0.42, 0.24, 0.07, tile, 0.16));
            sd.add(bx(0.3, 0.07, 0.14, MATS.vermilion, 0, 0.21));
            sd.add(irimoya(0.36, 0.2, 0.09, tile, 0.28));
            const kara = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 12, Math.PI), tile);
            kara.scale.set(1.1, 0.6, 1.6);
            kara.position.set(0, 0.17, 0.12);
            sd.add(kara);
            sd.add(bx(0.03, 0.1, 0.03, MATS.gold, -0.06, 0.06, 0.1), bx(0.03, 0.1, 0.03, MATS.gold, 0.06, 0.06, 0.1));
            sd.position.set(0, baseY + 0.02, -0.07);
            g.add(sd);
            // 前方廣場「御庭」的紅白條紋
            for (let k = 0; k < 5; k++) g.add(bx(0.03, 0.004, 0.16, k % 2 ? MATS.whiteWall : MATS.vermilion, -0.06 + k * 0.03, baseY + 0.004, 0.14));
            // 守禮門：朱紅柱、上下兩重赤瓦屋頂
            const sr = new THREE.Group();
            [-0.09, -0.03, 0.03, 0.09].forEach(x => sr.add(bx(0.018, 0.1, 0.018, MATS.vermilion, x, 0)));
            sr.add(hipRoof(0.24, 0.07, 0.035, tile, 0.1, 0.5), bx(0.12, 0.03, 0.04, MATS.vermilion, 0, 0.135), hipRoof(0.16, 0.06, 0.035, tile, 0.15, 0.4));
            sr.position.set(0, 0.0, 0.5);
            g.add(sr);
        } else if (v === 'multi') {
            wall(0.3, 0.2, 0.09, baseY, -0.14, -0.04, 8);
            wall(0.22, 0.16, 0.08, baseY, 0.22, 0.06, 26, 0, 26);
            wall(0.16, 0.12, 0.07, baseY, -0.2, 0.24, -1, 0, 22);
            archGate(0.02, 0.16, baseY, 0.3);
        } else if (v === 'wave') {
            wall(0.46, 0.3, 0.09, baseY, 0, 0, 25, 0.45);
            wall(0.22, 0.14, 0.08, baseY + 0.02, -0.06, -0.06, -1, 0.3, 24);
            // 寒緋櫻
            const sak = new THREE.MeshStandardMaterial({ color: 0xe35d8a, roughness: 0.8, flatShading: true });
            [[0.3, 0.32], [-0.32, 0.3]].forEach(([x, z]) => {
                g.add(cy(0.012, 0.016, 0.1, MATS.darkWood, x, 0.05, z));
                g.add(sp(0.06, sak, x, 0.13, z, 6));
            });
        } else if (v === 'arch') {
            wall(0.36, 0.26, 0.11, baseY, 0, 0, 25);
            wall(0.2, 0.15, 0.1, baseY + 0.01, 0, -0.04, 25);
            archGate(0, 0.26, baseY);
            archGate(0, 0.11, baseY + 0.01);
        } else {
            // tier：階梯狀曲輪
            [[0.46, 0.32, 0], [0.32, 0.22, 0.07], [0.18, 0.13, 0.14]].forEach(([rx, rz, dy], k) => {
                const tierHill = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(rx, rz) * 0.95, Math.max(rx, rz), 0.07, 14), MATS.grass);
                tierHill.scale.z = rz / rx;
                tierHill.position.set(-0.04 * k, baseY + dy + 0.035 - 0.07, -0.05 * k);
                if (k) g.add(tierHill);
                wall(rx, rz, 0.08, baseY + dy, -0.04 * k, -0.05 * k, 25 - k);
            });
        }
        if (o.k === 'Shuri' || v === 'wave' || v === 'tier') {
            const sea = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.012, 22), MATS.pondWater);
            g.add(sea);
        }
    } else if (o.k === 'Chashi') {
        // 根室チャシ：海岸台地上的半圓形壕溝
        const hill = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.16, 12), MATS.grass);
        hill.position.y = 0.08;
        g.add(hill);
        const trench = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 4, 20, Math.PI * 1.2), MATS.wood);
        trench.rotation.x = Math.PI / 2;
        trench.position.y = 0.165;
        g.add(trench);
        const sea = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.012, 22), MATS.pondWater);
        g.add(sea);
    } else if (o.k === 'S') {
        // 五稜郭：星形稜堡＋水堀＋箱館奉行所
        const star = (rOut, rIn, depth, mat, y) => {
            const s = new THREE.Shape();
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? rOut : rIn;
                const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
                if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            s.closePath();
            const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
            const m = new THREE.Mesh(geo, mat);
            m.rotation.x = -Math.PI / 2;
            m.position.y = y;
            return m;
        };
        g.add(star(0.6, 0.38, 0.012, MATS.pondWater, 0));
        g.add(star(0.5, 0.3, 0.1, MATS.stone, 0));
        g.add(star(0.46, 0.27, 0.012, MATS.grass, 0.1));
        const bug = new THREE.Group();
        bug.add(bx(0.3, 0.1, 0.16, MATS.whiteWall), irimoya(0.36, 0.22, 0.12, MATS.slateTile, 0.1));
        bug.add(bx(0.08, 0.06, 0.08, MATS.whiteWall, 0, 0.2), hipRoof(0.12, 0.12, 0.05, MATS.slateTile, 0.26, 0.2));
        bug.position.y = 0.1;
        g.add(bug);
        [[-0.25, 0.18], [0.26, 0.15]].forEach(([px, pz]) => g.add(sakuraTree(px, pz, 0.6).translateY(0.1)));
    }
    g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
}
