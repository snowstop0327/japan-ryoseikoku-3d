// 山岳與城鎮小物
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 山岳：依實際山形分別建模
 *   range   山脈（飛驒・赤石・木曾・日高）：沿走向排列的鋸齒岩峰群
 *   strato  成層火山（羊蹄・岩木・鳥海・岩手・伯耆大山・男體山）：下凹山腰＋雪冠
 *   collapse 山體崩壞火山（磐梯山）：北面馬蹄形崩壞口
 *   dome    圓頂狀山塊（白山・大雪山・劍山・栗駒・安達太良）
 *   forest  森林覆蓋的神體山與山地（三輪山・大峯山）
 *   caldera 巨大破火山口（阿蘇山）：外輪山＋火口原＋冒煙的中岳
 *   cluster 火山群（霧島山）：多座火山錐、火口湖與冒煙的新燃岳
 ***********************************************************************/
const volcanoSmoke = [];
const MTN = {};
function initMountainMaterials() {
    if (MTN.ready) return;
    MTN.ready = true;
    const m = (color, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, flatShading: true }, extra));
    MTN.forest = m(0x4f7f49);
    MTN.forestLight = m(0x6a9a55);
    MTN.rock = m(0x8a877f);
    MTN.darkRock = m(0x67625c);
    MTN.volcanic = m(0x7b6152);
    MTN.ash = m(0x9a8f86);
    MTN.snow = m(0xf6f9fb, { roughness: 0.6 });
    MTN.bamboo = m(0xa3c27a);
    MTN.calderaFloor = m(0x93b46c);
    MTN.craterLake = new THREE.MeshStandardMaterial({ color: 0x4fb3b0, roughness: 0.2 });
    MTN.smoke = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 1, transparent: true, opacity: 0.7 });
    MTN.treeDark = new THREE.MeshStandardMaterial({ color: 0x3d6b3c, roughness: 0.8, flatShading: true });
}

// 下凹的火山輪廓（愈往上愈陡）
function volcanoProfile(r, h, topR = 0.06) {
    return [
        [r, 0], [r * 0.8, h * 0.12], [r * 0.6, h * 0.3], [r * 0.42, h * 0.52],
        [r * 0.27, h * 0.74], [r * Math.max(topR * 2.2, 0.13), h * 0.93], [r * topR, h], [0, h * 0.985]
    ].map(([x, y]) => new THREE.Vector2(x, y));
}
function latheMesh(pts, mat, seg = 14, phiStart = 0, phiLen = Math.PI * 2) {
    const g = new THREE.LatheGeometry(pts, seg, phiStart, phiLen);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
// 只取輪廓中高於 fromY 的部分並略為放大，當作雪冠或岩帶
function capFromProfile(pts, fromY, mat, grow = 1.025, jag = 0, seg = 14) {
    const sub = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (a.y >= fromY) sub.push(a.clone());
        else if (b.y > fromY) {
            const t = (fromY - a.y) / (b.y - a.y);
            sub.push(new THREE.Vector2(a.x + (b.x - a.x) * t, fromY));
        }
    }
    sub.push(pts[pts.length - 1].clone());
    const g = new THREE.LatheGeometry(sub.map(p => new THREE.Vector2(p.x * grow, p.y + 0.004)), seg);
    if (jag > 0) {
        // 雪線做成融雪溝紋的鋸齒狀
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y < fromY + 0.02) {
                const a = Math.atan2(pos.getZ(i), pos.getX(i));
                pos.setY(i, y - Math.abs(Math.sin(a * 5) + Math.cos(a * 3) * 0.5) * jag);
            }
        }
    }
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = true;
    return mesh;
}

function mtnStrato(p) {
    const g = new THREE.Group();
    const pts = volcanoProfile(p.r, p.h, p.topR || 0.06);
    g.add(latheMesh(pts, MTN.volcanic));
    // 森林帶只到半山腰，上半部是裸露的火山岩
    g.add(latheMesh(pts.filter(v => v.y <= p.h * 0.45).concat([new THREE.Vector2(0, p.h * 0.45)]).map(v => new THREE.Vector2(v.x * 1.035, v.y)), MTN.forest));
    if (p.snow > 0) g.add(capFromProfile(pts, p.h * (1 - p.snow), MTN.snow, 1.04, p.h * 0.07));
    if (p.tops === 3) {
        // 岩木山：山頂三峰（岩木山・鳥海山・巖鬼山）
        [[0, 0], [-p.r * 0.13, p.r * 0.06], [p.r * 0.12, p.r * 0.05]].forEach(([x, z], i) => {
            const c = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.08, p.h * (i ? 0.1 : 0.14), 7), MTN.snow);
            c.position.set(x, p.h * 0.98, z);
            g.add(c);
        });
    }
    if (p.twin) {
        // 鳥海山：新山與七高山兩個山頂
        const c = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.14, p.h * 0.18, 7), MTN.snow);
        c.position.set(p.r * 0.16, p.h * 0.9, -p.r * 0.05);
        g.add(c);
    }
    if (p.ridge) {
        // 伯耆大山：北壁的鋸齒稜線
        for (let i = 0; i < 4; i++) {
            const c = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.09, p.h * 0.16, 5), i % 2 ? MTN.rock : MTN.snow);
            c.position.set(-p.r * 0.24 + i * p.r * 0.16, p.h * 0.88, -p.r * 0.06);
            g.add(c);
        }
    }
    if (p.lake) {
        // 男體山南麓的中禪寺湖
        const lake = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.32, p.r * 0.32, 0.01, 16), MTN.craterLake);
        lake.scale.set(1.5, 1, 0.7);
        lake.position.set(p.r * 0.2, 0.065, p.r * 0.95);
        g.add(lake);
    }
    return g;
}

function mtnCollapse(p) {
    // 磐梯山：1888年大噴火造成北面山體崩壞，留下馬蹄形火口壁
    const g = new THREE.Group();
    const pts = volcanoProfile(p.r, p.h, 0.08);
    const gap = Math.PI * 0.42;
    const body = latheMesh(pts, MTN.volcanic, 16, Math.PI + gap / 2, Math.PI * 2 - gap);
    body.material = MTN.volcanic.clone();
    body.material.side = THREE.DoubleSide;
    g.add(body);
    const forestPts = pts.filter(v => v.y <= p.h * 0.4).concat([new THREE.Vector2(0, p.h * 0.4)]);
    g.add(latheMesh(forestPts.map(v => new THREE.Vector2(v.x * 1.035, v.y)), MTN.forest, 16, Math.PI + gap / 2, Math.PI * 2 - gap));
    if (p.snow > 0) {
        const cap = capFromProfile(pts, p.h * (1 - p.snow), MTN.snow, 1.04, p.h * 0.05, 16);
        g.add(cap);
    }
    // 崩壞口內的裸岩斜面與岩屑
    const floor = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.5, p.h * 0.55, 6, 1, false, Math.PI / 2, Math.PI), MTN.ash);
    floor.position.set(0, p.h * 0.27, -p.r * 0.12);
    g.add(floor);
    return g;
}

function mtnDome(p) {
    const g = new THREE.Group();
    const r = p.r, h = p.h;
    const prof = p.plateau
        // 大雪山：「北海道の屋根」高原狀台地
        ? [[r, 0], [r * 0.86, h * 0.38], [r * 0.74, h * 0.78], [r * 0.62, h * 0.95], [r * 0.3, h], [0, h]]
        : [[r, 0], [r * 0.86, h * 0.3], [r * 0.68, h * 0.62], [r * 0.48, h * 0.84], [r * 0.26, h * 0.97], [0, h]];
    const pts = prof.map(([x, y]) => new THREE.Vector2(x, y));
    g.add(latheMesh(pts, p.top === 'bamboo' ? MTN.forestLight : MTN.rock, 14));
    g.add(latheMesh(pts.filter(v => v.y <= h * 0.42).concat([new THREE.Vector2(0, h * 0.42)]).map(v => new THREE.Vector2(v.x * 1.03, v.y)), MTN.forest, 14));
    if (p.top === 'bamboo') g.add(capFromProfile(pts, h * 0.72, MTN.bamboo, 1.03)); // 劍山山頂的山白竹草原
    if (p.snow > 0) g.add(capFromProfile(pts, h * (1 - p.snow), MTN.snow, 1.035, h * 0.06));
    const bumps = p.bumps || 0;
    for (let i = 0; i < bumps; i++) {
        // 大雪山：高原狀山塊上的旭岳・白雲岳等群峰
        const a = (i / bumps) * Math.PI * 2 + 0.4;
        const big = i === 0;
        const ph = h * (big ? 0.62 : 0.32 + (i % 3) * 0.08);
        const c = new THREE.Mesh(new THREE.ConeGeometry(r * (big ? 0.2 : 0.13), ph, 7), MTN.snow);
        const rr = big ? 0 : r * (0.28 + (i % 2) * 0.16);
        c.position.set(Math.cos(a) * rr, h * 0.97 + ph / 2 - 0.02, Math.sin(a) * rr);
        g.add(c);
    }
    return g;
}

function mtnRange(p) {
    // 山脈：沿走向排列的鋸齒岩峰，下段森林、中段岩稜、頂部積雪
    const g = new THREE.Group();
    const len = p.r * 2.1, wid = p.r * 0.62;
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 10, 1), MTN.forest);
    ridge.scale.set(len * 0.55, p.h * 0.42, wid);
    ridge.position.y = p.h * 0.21;
    g.add(ridge);
    const n = p.n || 6;
    let seed = Math.round((p.x + 20) * 97 + (p.z + 20) * 31);
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5;
        const ph = p.h * (0.62 + rand() * 0.38) * (1 - Math.abs(t) * 0.35);
        const pr = wid * (p.broad ? 0.95 : 0.62) * (0.8 + rand() * 0.3);
        const peak = new THREE.Group();
        const segs = p.broad ? 7 : 5;
        const rock = new THREE.Mesh(new THREE.ConeGeometry(pr, ph, segs), MTN.rock);
        rock.position.y = ph / 2;
        const skirt = new THREE.Mesh(new THREE.ConeGeometry(pr * 1.12, ph * 0.5, segs), MTN.forest);
        skirt.position.y = ph * 0.25;
        peak.add(rock, skirt);
        if (p.snow > 0) {
            const capH = ph * p.snow;
            const cap = new THREE.Mesh(new THREE.ConeGeometry(pr * p.snow * 1.08, capH, segs), MTN.snow);
            cap.position.y = ph - capH / 2 + 0.006;
            peak.add(cap);
        }
        peak.rotation.y = rand() * Math.PI;
        peak.rotation.z = (rand() - 0.5) * 0.12;
        peak.position.set(t * len * 0.82, 0, (rand() - 0.5) * wid * 0.5);
        peak.traverse(o => { if (o.isMesh) o.castShadow = true; });
        g.add(peak);
    }
    g.rotation.y = p.angle || 0;
    return g;
}

function mtnForest(p) {
    // 森林覆蓋的圓潤山：三輪山為神體山，全山杉檜原生林
    const g = new THREE.Group();
    const humps = p.humps || 1;
    for (let k = 0; k < humps; k++) {
        const hr = p.r * (humps > 1 ? 0.55 : 1), hh = p.h * (humps > 1 ? 0.75 + (k % 2) * 0.25 : 1);
        const hx = humps > 1 ? (k - (humps - 1) / 2) * p.r * 0.62 : 0;
        const hz = humps > 1 ? (k % 2 ? 0.12 : -0.12) * p.r : 0;
        const pts = [[hr, 0], [hr * 0.85, hh * 0.35], [hr * 0.6, hh * 0.7], [hr * 0.3, hh * 0.93], [0, hh]].map(([x, y]) => new THREE.Vector2(x, y));
        const hill = latheMesh(pts, MTN.forest, 12);
        hill.position.set(hx, 0, hz);
        g.add(hill);
        // 山坡上的針葉樹
        const trees = Math.round(18 * hr / 0.5);
        for (let i = 0; i < trees; i++) {
            const a = i * 2.39996;
            const f = 0.25 + ((i * 37) % 70) / 100;
            const rr = hr * f;
            const yy = hh * (1 - Math.pow(f, 1.6)) * 0.96;
            const tree = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 5), MTN.treeDark);
            tree.position.set(hx + Math.cos(a) * rr, yy + 0.04, hz + Math.sin(a) * rr);
            g.add(tree);
        }
    }
    return g;
}

function addSmoke(group, x, y, z, scale = 1) {
    for (let i = 0; i < 4; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 10, 8), MTN.smoke.clone());
        puff.position.set(x, y, z);
        puff.userData = { x, y, z, phase: i / 4, scale };
        group.add(puff);
        volcanoSmoke.push(puff);
    }
}

function mtnCaldera(p) {
    // 阿蘇山：世界最大級破火山口；外輪山環繞火口原，中央五岳的中岳仍在冒煙
    const g = new THREE.Group();
    const R = p.r * 1.25, h = p.h;
    const rim = [[R, 0], [R * 0.9, h * 0.16], [R * 0.8, h * 0.28], [R * 0.74, h * 0.3], [R * 0.68, h * 0.2], [R * 0.64, h * 0.06], [0, h * 0.06]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(latheMesh(rim, MTN.forestLight, 18));
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.64, R * 0.64, 0.01, 18), MTN.calderaFloor);
    floor.position.y = h * 0.08 + 0.005;
    g.add(floor);
    // 中央火口丘群（高岳・中岳・根子岳…）
    // 高度以底寬換算，呈現低矮寬緩的火口丘
    [[-R * 0.05, -R * 0.05, 0.34, 0.62], [R * 0.24, -R * 0.12, 0.27, 0.46], [-R * 0.26, R * 0.1, 0.24, 0.4], [R * 0.08, R * 0.28, 0.2, 0.34]].forEach(([x, z, rr, hk], i) => {
        const cr = R * rr, chh = cr * hk * 2.2;
        const cone = latheMesh(volcanoProfile(cr, chh, 0.2), i === 1 ? MTN.ash : MTN.volcanic, 10);
        cone.position.set(x, h * 0.06, z);
        g.add(cone);
        g.add(capFromProfile(volcanoProfile(cr, chh, 0.2).filter(v => v.y <= chh * 0.45).concat([new THREE.Vector2(0, chh * 0.45)]), 0, MTN.calderaFloor, 1.04, 0, 10).translateX(x).translateY(h * 0.06).translateZ(z));
        if (i === 1) {
            const crater = new THREE.Mesh(new THREE.CylinderGeometry(cr * 0.2, cr * 0.2, 0.012, 10), MTN.craterLake);
            crater.position.set(x, h * 0.06 + chh * 0.98, z);
            g.add(crater);
            addSmoke(g, x, h * 0.06 + chh, z, 1.1);
        }
    });
    return g;
}

function mtnCluster(p) {
    // 霧島山：大小二十餘座火山聚集，有御池等火口湖，新燃岳冒煙
    const g = new THREE.Group();
    const cones = [[0, 0, 1, 0.45], [p.r * 0.5, -p.r * 0.25, 0.75, 0.34], [-p.r * 0.48, p.r * 0.2, 0.68, 0.32], [p.r * 0.2, p.r * 0.55, 0.55, 0.28], [-p.r * 0.35, -p.r * 0.45, 0.6, 0.3]];
    cones.forEach(([x, z, hh, rr], i) => {
        const cr = p.r * rr * 1.3;
        const pts = volcanoProfile(cr, Math.min(p.h * hh * 0.6, cr * 1.5), 0.2);
        const ch = pts[6].y;
        const cone = latheMesh(pts, i % 2 ? MTN.ash : MTN.volcanic, 10);
        cone.position.set(x, 0, z);
        g.add(cone);
        const skirt = capFromProfile(pts.filter(v => v.y <= ch * 0.45).concat([new THREE.Vector2(0, ch * 0.45)]), 0, MTN.forest, 1.04, 0, 10);
        skirt.position.set(x, 0, z);
        g.add(skirt);
        if (i === 2 || i === 3) {
            const lake = new THREE.Mesh(new THREE.CylinderGeometry(cr * 0.2, cr * 0.2, 0.012, 10), MTN.craterLake);
            lake.position.set(x, ch * 0.985, z);
            g.add(lake);
        }
        if (i === 1) addSmoke(g, x, ch, z, 0.9);
    });
    return g;
}

function createGreenMountainsAndForests() {
    initMountainMaterials();
    const mtnGroup = new THREE.Group();

    const peaks = [
        // 富士山：專屬微凹火山稜線與白雪鋸齒山巔
        { x: 1.8, z: 3.7, r: 0.85, h: 2.07, snow: 0.44, fuji: true, s: 0.57, name: '富士山' },
        // 日本阿爾卑斯：三條南北走向的山脈
        { x: 2.7, z: 0.9, r: 0.89, h: 1.68, snow: 0.45, kind: 'range', n: 8, angle: Math.PI / 2, name: '飛驒山脈' },
        { x: 3.4, z: 2.4, r: 0.7, h: 1.43, snow: 0.38, kind: 'range', n: 5, broad: true, angle: Math.PI / 2 + 0.2, name: '赤石山脈' },
        { x: 0.7, z: 3.2, r: 0.54, h: 1.13, snow: 0.32, kind: 'range', n: 4, angle: Math.PI / 2, name: '木曾山脈' },
        // 白山：信仰之山，殘雪期長、山頂圓潤
        { x: -1.2, z: 2.7, r: 0.67, h: 1.34, snow: 0.5, kind: 'dome', name: '白山' },
        // 男體山：日光的圓錐火山，南麓中禪寺湖
        { x: 4.9, z: 0.2, r: 1.08, h: 1.59, snow: 0.3, kind: 'strato', lake: true, name: '男體山' },
        // 東北：雪國火山群
        { x: 7.4, z: -0.8, r: 0.54, h: 1.07, snow: 0.45, kind: 'collapse', name: '磐梯山' },
        { x: 7.7, z: -2.7, r: 0.67, h: 1.35, snow: 0.55, kind: 'strato', twin: true, name: '鳥海山' },
        { x: 7.8, z: -4.7, r: 0.67, h: 1.26, snow: 0.55, kind: 'strato', tops: 3, name: '岩木山' },
        { x: 8.7, z: -4.4, r: 0.4, h: 0.98, snow: 0.55, kind: 'strato', name: '岩手山' },
        { x: 8.6, z: -2.45, r: 0.38, h: 0.78, snow: 0.6, kind: 'dome', name: '栗駒山' },
        { x: 6.8, z: 0.45, r: 0.4, h: 0.74, snow: 0.5, kind: 'dome', name: '安達太良山' },
        // 近畿：森林覆蓋的神山與紀伊山地
        { x: -3.0, z: 6.3, r: 0.64, h: 1.04, snow: 0, kind: 'forest', name: '三輪山' },
        { x: -3.3, z: 7.0, r: 0.38, h: 0.78, snow: 0, kind: 'forest', humps: 3, name: '大峯山' },
        // 伯耆大山：西看如富士、北壁鋸齒
        { x: -9.4, z: 3.7, r: 0.64, h: 1.23, snow: 0.34, kind: 'strato', ridge: true, name: '伯耆大山' },
        // 四國劍山：山頂平緩的山白竹草原
        { x: -7.4, z: 7.5, r: 0.56, h: 1.01, snow: 0, kind: 'dome', top: 'bamboo', name: '劍山' },
        // 九州火山
        { x: -12.5, z: 8.3, r: 0.4, h: 0.97, snow: 0, kind: 'caldera', name: '阿蘇山' },
        { x: -13.6, z: 9.4, r: 0.52, h: 0.95, snow: 0, kind: 'cluster', name: '霧島山' },
        // 北海道：白雪覆蓋的北國群山
        { x: 13.1, z: -8.1, r: 1.42, h: 1.0, snow: 0.8, kind: 'dome', plateau: true, bumps: 7, name: '大雪山' },
        { x: 9.8, z: -7.0, r: 1.08, h: 1.63, snow: 0.6, kind: 'strato', topR: 0.05, name: '羊蹄山' },
        { x: 11.1, z: -9.2, r: 0.8, h: 1.25, snow: 0.6, kind: 'range', n: 6, angle: -0.7, name: '日高山脈' }
    ];

    peaks.forEach(p => {
        // 成層火山高度不超過底寬約 1.9 倍，避免變成細長煙囪狀
        if (p.kind === 'strato' || p.kind === 'collapse') p.h = Math.min(p.h, p.r * 1.9);
        if (p.kind === 'cluster') p.h = Math.min(p.h, p.r * 1.2);
        let m;
        if (p.fuji) { m = buildAuthenticMtFuji(); m.scale.setScalar(p.s); }
        else if (p.kind === 'range') m = mtnRange(p);
        else if (p.kind === 'collapse') m = mtnCollapse(p);
        else if (p.kind === 'dome') m = mtnDome(p);
        else if (p.kind === 'forest') m = mtnForest(p);
        else if (p.kind === 'caldera') m = mtnCaldera(p);
        else if (p.kind === 'cluster') m = mtnCluster(p);
        else m = mtnStrato(p);
        m.position.set(p.x, 0.90, p.z);
        // 每座山用獨立材質，擋住鏡頭視線時可單獨變半透明
        const mats = [];
        const roleOf = new Map(Object.entries(MTN).filter(([, v]) => v && v.isMaterial).map(([k, v]) => [v, k]));
        m.traverse(o => {
            if (!o.isMesh || volcanoSmoke.includes(o)) return;
            const role = roleOf.get(o.material);
            o.material = o.material.clone();
            if (role) regSeason(o.material, role);
            o.material.transparent = true;
            mats.push(o.material);
        });
        const topY = p.fuji ? 2.65 * p.s : (p.kind === 'caldera' ? p.h * 0.45 : p.plateau ? p.h * 1.6 : p.h);
        GEO_LABELS.push({ type: 'mountain', name: p.name, x: p.x, z: p.z, y: 0.9 + topY + 0.12, major: !!p.fuji || p.name === '飛驒山脈' || p.name === '阿蘇山' });
        mountainOccluders.push({ x: p.x, z: p.z, r: (p.fuji ? 1.85 * p.s : p.r * (p.kind === 'range' ? 1.05 : 1)), h: (p.fuji ? 2.6 * p.s : p.h), mats, fade: 1 });
        mtnGroup.add(m);
    });

    scene.add(mtnGroup);
}

// 北國雪景：東北北部與北海道的積雪地面、雪原斑塊與飄雪
let snowfall = null;
// 季節景物：北國殘雪斑塊＋全國飄落粒子（櫻花瓣・落葉・雪）
let snowPatches = null;
let seasonParticles = null;
const PARTICLE_STYLE = {
    spring: { color: 0xf7c3d2, size: 0.055, fall: 0.22, sway: 0.25, show: true },
    summer: { show: false },
    autumn: { color: 0xd9662e, size: 0.065, fall: 0.3, sway: 0.3, show: true },
    winter: { color: 0xffffff, size: 0.05, fall: 0.38, sway: 0.08, show: true }
};
function createNorthernSnow() {
    const group = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f7f9, roughness: 0.7 });
    let seed = 4242;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let placed = 0, tries = 0;
    while (placed < 70 && tries < 3000) {
        tries++;
        const x = 6.0 + rand() * 8.6;
        const z = -10.4 + rand() * 8.2;
        if (!ISLAND_POLYS.some(pl => pointInPoly(x, z, pl))) continue;
        const inHokkaido = z < -5.9 && x > 8.7;
        if (!inHokkaido && z > -2.6) continue;
        if (PROVINCES_DATA.some(p => Math.hypot(p.mapX - x, p.mapZ - z) < 0.55)) continue;
        if (inLake(x, z, 0.1)) continue;
        const r = 0.14 + rand() * (inHokkaido ? 0.4 : 0.22);
        const patch = new THREE.Mesh(new THREE.CircleGeometry(r, 9), snowMat);
        patch.rotation.x = -Math.PI / 2;
        patch.rotation.z = rand() * Math.PI;
        patch.scale.set(1, 0.6 + rand() * 0.5, 1);
        patch.position.set(x, 0.968, z);
        patch.receiveShadow = true;
        group.add(patch);
        placed++;
    }
    scene.add(group);
    snowPatches = group;

    // 圓形粒子貼圖
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const g2 = cv.getContext('2d');
    const grad = g2.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 32, 32);
    const count = 1600;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = -16 + Math.random() * 31;
        pos[i * 3 + 1] = 1 + Math.random() * 6;
        pos[i * 3 + 2] = -11 + Math.random() * 22;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    seasonParticles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.9, depthWrite: false }));
    seasonParticles.visible = false;
    scene.add(seasonParticles);
}

function updateSnowAndSmoke(dt, t) {
    const st = PARTICLE_STYLE[currentSeason];
    if (seasonParticles && seasonParticles.visible && st.show) {
        const a = seasonParticles.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) {
            let y = a.getY(i) - dt * st.fall * (0.8 + (i % 5) * 0.12);
            if (y < 0.95) y = 7;
            a.setY(i, y);
            a.setX(i, a.getX(i) + Math.sin(t * 0.9 + i) * dt * st.sway);
            a.setZ(i, a.getZ(i) + Math.cos(t * 0.7 + i * 1.3) * dt * st.sway * 0.6);
        }
        a.needsUpdate = true;
    }
    volcanoSmoke.forEach(p => {
        const u = p.userData;
        const k = (t * 0.25 + u.phase) % 1;
        p.position.set(u.x + k * 0.12 * u.scale, u.y + k * 0.55 * u.scale, u.z - k * 0.05);
        p.scale.setScalar(0.6 + k * 1.8);
        p.material.opacity = 0.75 * (1 - k);
    });
}

function setSeason(id) {
    currentSeason = id;
    seasonTargets.forEach(({ mat, cols }) => mat.color.setHex(cols[id]));
    updateForestSeason(id);
    if (snowPatches) snowPatches.visible = id === 'winter' || id === 'spring';
    const st = PARTICLE_STYLE[id];
    if (seasonParticles) {
        // 開啟即時天氣時，降雨降雪改由實際天氣呈現
        seasonParticles.visible = st.show && !weatherOn;
        if (st.show) {
            seasonParticles.material.color.setHex(st.color);
            seasonParticles.material.size = st.size;
        }
    }
    SEASON_LIST.forEach(s => {
        const b = document.getElementById('season-' + s.id);
        if (b) b.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm transition ' + (s.id === id ? 'bg-stone-900 text-white shadow-sm' : 'hover:bg-stone-200/60');
    });
    if (typeof updateSceneNow === 'function') updateSceneNow();
    const mb = document.getElementById('season-mobile');
    if (mb) mb.textContent = SEASON_LIST.find(s => s.id === id).icon + ' ' + SEASON_LIST.find(s => s.id === id).name;
}
function cycleSeason() {
    const i = SEASON_LIST.findIndex(s => s.id === currentSeason);
    const next = SEASON_LIST[(i + 1) % 4];
    setSeason(next.id);
    showToast(`切換到${next.name}天`);
}

function createRichTownAndShrineProps() {
    const propsGroup = new THREE.Group();

    // 1. Miniature Wooden Machiya Houses & Policy Island Style Planter Boxes / Streetlights
    function buildMiniHouse(isRedRoof = false) {
        const h = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.20, 0.22), MATS.creamWall);
        body.position.y = 0.10;
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.04, 0.23), MATS.darkWood);
        beam.position.y = 0.16;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.15, 4), isRedRoof ? MATS.redTileRoof : MATS.roofSlate);
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(1.2, 1, 1);
        roof.position.y = 0.26;
        h.add(body, beam, roof);
        return h;
    }

    // Policy Island style square wooden planter with round green bush + street lamp!
    function buildPlanterAndLamp() {
        const p = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.22), MATS.hinoki);
        box.position.y = 0.05;
        const bush = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 12, 8),
            new THREE.MeshStandardMaterial({ color: 0x6fa75c, roughness: 0.8 })
        );
        bush.position.y = 0.14;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.48, 5), MATS.blackLacquer);
        pole.position.set(0.14, 0.24, 0.14);
        const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), MATS.lanternGlow);
        lampHead.position.set(0.14, 0.48, 0.14);
        p.add(box, bush, pole, lampHead);
        return p;
    }

    const townClusters = [
        [-4.1, 4.8], [-5.3, 5.2], [0.8, 4.6], [6.0, 2.5], [6.6, 3.1],
        [-7.6, 4.9], [-11.0, 5.1], [-13.2, 7.2], [7.8, -2.8], [10.8, -7.4]
    ];
    townClusters.forEach((c, idx) => {
        if (inLake(c[0] + 0.5, c[1] + 0.45, 0.15)) return;
        for (let i = 0; i < 2; i++) {
            const house = buildMiniHouse((idx + i) % 3 === 0);
            house.scale.setScalar(0.42);
            house.position.set(c[0] + 0.5 + i * 0.16, 0.92, c[1] + 0.45 + (i % 2) * 0.1);
            house.rotation.y = (idx + i) * 0.7;
            propsGroup.add(house);
        }
        const planter = buildPlanterAndLamp();
        planter.scale.setScalar(0.42);
        planter.position.set(c[0] + 0.4, 0.92, c[1] + 0.52);
        propsGroup.add(planter);
    });

    // 2. Diverse Trees:Tiered Pine, Rounded Bushy Tree, Sakura, Autumn Maple
    const pineMat1 = new THREE.MeshStandardMaterial({ color: 0x4f8a4e, roughness: 0.8 });
    const pineMat2 = new THREE.MeshStandardMaterial({ color: 0x67a05a, roughness: 0.8 });
    const sakuraMat = new THREE.MeshStandardMaterial({ color: 0xf2b3c6, roughness: 0.75 });
    const mapleMat = new THREE.MeshStandardMaterial({ color: 0xd9733f, roughness: 0.75 });
    regSeason(pineMat1, 'pine1');
    regSeason(pineMat2, 'pine2');
    regSeason(sakuraMat, 'sakura');
    regSeason(mapleMat, 'maple');

    function buildPineTree(scale = 1) {
        const t = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 5), MATS.wood);
        trunk.position.y = 0.11;
        t.add(trunk);
        for (let i = 0; i < 3; i++) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28 - i * 0.06, 0.28, 6), i % 2 === 0 ? pineMat1 : pineMat2);
            cone.position.y = 0.24 + i * 0.17;
            t.add(cone);
        }
        t.scale.setScalar(scale);
        return t;
    }

    function buildBroadTree(mat, scale = 1) {
        const t = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.30, 5), MATS.wood);
        trunk.position.y = 0.15;
        t.add(trunk);
        // 三顆圓潤球體疊成蓬鬆樹冠
        [[0, 0.44, 0, 0.22], [0.13, 0.36, 0.05, 0.16], [-0.11, 0.37, -0.06, 0.17]].forEach(([cx, cy, cz, r]) => {
            const crown = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
            crown.position.set(cx, cy, cz);
            crown.castShadow = true;
            t.add(crown);
        });
        t.scale.setScalar(scale);
        return t;
    }

    const forestSpots = [
        [-12.2, 6.6, 'pine'], [-14.0, 9.2, 'pine'], [-11.8, 4.4, 'maple'], [-9.2, 3.8, 'pine'],
        [-7.8, 3.3, 'sakura'], [-6.6, 7.6, 'pine'], [-8.9, 7.5, 'sakura'], [-4.8, 3.5, 'maple'],
        [-3.9, 6.2, 'sakura'], [-1.8, 4.9, 'pine'], [-0.5, 2.8, 'pine'], [0.7, 3.8, 'sakura'],
        [1.9, 1.5, 'pine'], [2.9, 3.6, 'sakura'], [4.2, 2.7, 'pine'], [5.2, 1.8, 'maple'],
        [6.9, 3.7, 'pine'], [7.4, 0.9, 'pine'], [7.2, -1.2, 'sakura'], [7.9, -3.5, 'pine'],
        [8.4, -5.2, 'sakura'], [9.8, -7.8, 'pine'], [12.5, -7.2, 'pine'], [11.6, -9.0, 'maple']
    ];

    forestSpots.forEach((f, idx) => {
        if (inLake(f[0], f[1], 0.1)) return;
        let tree;
        const sc = 0.36 + (idx % 3) * 0.08;
        if (f[2] === 'sakura') tree = buildBroadTree(sakuraMat, sc);
        else if (f[2] === 'maple') tree = buildBroadTree(mapleMat, sc);
        else tree = buildPineTree(sc);
        tree.position.set(f[0], 0.90, f[1]);
        propsGroup.add(tree);
    });

    scatterBushes(propsGroup);

    scene.add(propsGroup);
}

// 在島上隨機撒滿圓潤灌木叢（InstancedMesh，一次繪製數百棵不卡頓）
function pointInPoly(x, z, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
        if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
}

function scatterBushes(parent) {
    let seed = 20261027;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const geo = new THREE.SphereGeometry(1, 12, 9);
    const palettes = [0x4f8a45, 0x669f50, 0x7cb35c, 0x3f7642, 0x5d8f55];
    const meshes = palettes.map(c => new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }), 280));
    meshes.forEach((m, i) => regSeason(m.material, 'bush' + i));
    const counts = palettes.map(() => 0);
    const dummy = new THREE.Object3D();
    const avoid = PROVINCES_DATA.map(p => [p.mapX, p.mapZ]);
    let tries = 0, placed = 0;
    while (placed < 960 && tries < 12000) {
        tries++;
        const x = -16 + rand() * 31;
        const z = -11 + rand() * 22;
        const poly = ISLAND_POLYS.find(pl => pointInPoly(x, z, pl));
        if (!poly) continue;
        if (avoid.some(([ax, az]) => Math.hypot(ax - x, az - z) < 0.48)) continue;
        if (inLake(x, z, 0.08)) continue;
        // 北國（東北北部・北海道）的灌木覆著白雪
        const k = z < -2.8 ? 4 : Math.floor(rand() * 4);
        if (counts[k] >= 280) continue;
        const s = 0.035 + rand() * 0.045;
        dummy.position.set(x, 0.93 + s * 0.5, z);
        dummy.scale.set(s, s * 0.85, s);
        dummy.updateMatrix();
        meshes[k].setMatrixAt(counts[k]++, dummy.matrix);
        placed++;
    }
    meshes.forEach((m, i) => {
        m.count = counts[i];
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
    });
}
