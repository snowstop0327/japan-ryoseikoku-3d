// 四季配色與河川湖泊
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 四季：每個會隨季節變色的材質都登記在這裡（夏季＝原始顏色）
 ***********************************************************************/
const SEASON_LIST = [
    { id: 'spring', name: '春', icon: '🌸' }, { id: 'summer', name: '夏', icon: '🌿' },
    { id: 'autumn', name: '秋', icon: '🍁' }, { id: 'winter', name: '冬', icon: '❄️' }
];
const SEASON_PAL = {
    ground: { spring: 0x8cc46a, autumn: 0xa8a95a, winter: 0xe9eef0 },
    hill: { spring: 0x76ad55, autumn: 0x9c8e4a, winter: 0xf3f6f8 },
    hokGround: { spring: 0xc9d6c8, autumn: 0xa7a25e, winter: 0xe9eef0 },
    hokHill: { spring: 0xe4ebe9, autumn: 0x9a8c4c, winter: 0xf3f6f8 },
    ryuGround: { spring: 0x8fcb62, autumn: 0x8dbb5a, winter: 0x80b658 },   // 亞熱帶：冬天也是綠的
    ryuHill: { spring: 0x74b452, autumn: 0x6fa64c, winter: 0x67a149 },
    pine1: { spring: 0x56924f, autumn: 0x4a7a46, winter: 0x7d9a8a },
    pine2: { spring: 0x76b05e, autumn: 0x5f8a4e, winter: 0xc9d8d4 },
    sakura: { spring: 0xf29bb8, summer: 0x5f9e55, autumn: 0xd98a4a, winter: 0x9a7b62 },
    maple: { spring: 0x9ccf6e, summer: 0x5f9a50, autumn: 0xd23f2c, winter: 0x8a6c55 },
    leafDark: { spring: 0x5a9a50, autumn: 0xb5652e, winter: 0xd9e3e3 },
    grass: { spring: 0x8cc46a, autumn: 0xa8a95a, winter: 0xe9eef0 },
    hillGreen: { spring: 0x7cb35c, autumn: 0x9c8e4a, winter: 0xe9eef0 },
    bush0: { spring: 0x6fb15a, autumn: 0xc9682e, winter: 0xdfe7e8 },
    bush1: { spring: 0x8cc96a, autumn: 0xe0a13a, winter: 0xe8eeef },
    bush2: { spring: 0xf2a2bc, autumn: 0xb8452c, winter: 0xd8e2e3 },
    bush3: { spring: 0x5a9a4e, autumn: 0x8a8a3c, winter: 0xcfdad9 },
    bush4: { spring: 0xdfe8e6, summer: 0x5d8f55, autumn: 0xb9a36a, winter: 0xeef3f4 },
    forest: { spring: 0x5f9a55, autumn: 0xa0622f, winter: 0xdfe6e6 },
    forestLight: { spring: 0x7cb35c, autumn: 0xc27f3a, winter: 0xe6ecec },
    calderaFloor: { spring: 0x9fca72, autumn: 0xc2a35a, winter: 0xeef2f3 },
    bamboo: { spring: 0xa9cf7c, autumn: 0xc9b066, winter: 0xeef2f3 },
    treeDark: { spring: 0x4d8a4a, autumn: 0x8d4a26, winter: 0xcfdcd9 }
};
const seasonTargets = [];
function regSeason(mat, palKey) {
    const pal = SEASON_PAL[palKey];
    if (!mat || !pal) return;
    seasonTargets.push({ mat, cols: Object.assign({ summer: mat.color.getHex() }, pal) });
}
function seasonOfToday() {
    const m = new Date().getMonth() + 1;
    return m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}
let currentSeason = 'summer';

const ISLAND_POLYS = [];
// Helper: Build Multi-tiered Natural Muted Sage & Forest Green Island Mass
function createGreenIslandMass(points, depth = 0.65, palette = null) {
    const isHokkaido = palette && palette.kind === 'hokkaido';
    const isRyukyu = palette && palette.kind === 'ryukyu';
    const group = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], -points[0][1]);
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], -points[i][1]);
    }
    shape.closePath();

    // 1. Lower Warm Coastal Cliff & Sand Base
    const baseGeo = new THREE.ExtrudeGeometry(shape, {
        depth: depth * 0.72,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.38,
        bevelThickness: 0.28
    });
    baseGeo.computeVertexNormals();
    const baseMat = new THREE.MeshStandardMaterial({
        color: palette ? palette.base : 0xdcc08a,
        roughness: 0.9
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = -0.15;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);
    terrainMeshes.push(baseMesh);

    // 2. Main Natural Sage-Moss Green Meadow Layer
    const greenGeo = new THREE.ExtrudeGeometry(shape, {
        depth: depth * 0.48,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.14,
        bevelThickness: 0.18
    });
    greenGeo.computeVertexNormals();
    const greenMat = new THREE.MeshStandardMaterial({
        color: palette ? palette.green : 0x7caa5a,
        roughness: 0.85
    });
    regSeason(greenMat, isHokkaido ? 'hokGround' : isRyukyu ? 'ryuGround' : 'ground');
    const greenMesh = new THREE.Mesh(greenGeo, greenMat);
    greenMesh.rotation.x = -Math.PI / 2;
    greenMesh.position.y = 0.28;
    greenMesh.receiveShadow = true;
    greenMesh.castShadow = true;
    group.add(greenMesh);
    terrainMeshes.push(greenMesh);

    // 3. Upper Deep Forest Highland Tier
    const hillGeo = new THREE.ExtrudeGeometry(shape, {
        depth: depth * 0.25,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: -0.25,
        bevelThickness: 0.16
    });
    hillGeo.computeVertexNormals();
    const hillMat = new THREE.MeshStandardMaterial({
        color: palette ? palette.hill : 0x6a9a4f,
        roughness: 0.88
    });
    regSeason(hillMat, isHokkaido ? 'hokHill' : isRyukyu ? 'ryuHill' : 'hill');
    const hillMesh = new THREE.Mesh(hillGeo, hillMat);
    hillMesh.rotation.x = -Math.PI / 2;
    hillMesh.position.y = 0.62;
    hillMesh.receiveShadow = true;
    group.add(hillMesh);
    terrainMeshes.push(hillMesh);

    // 4. 淺灘：島嶼外圍一圈較淺的湖水綠，讓海岸線有層次
    const shelfGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.01,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.95,
        bevelThickness: 0.02
    });
    const shelfMesh = new THREE.Mesh(shelfGeo, MATS.shallowWater);
    shelfMesh.rotation.x = -Math.PI / 2;
    shelfMesh.position.y = WATER_Y + 0.02;
    shelfMesh.receiveShadow = true;
    group.add(shelfMesh);

    ISLAND_POLYS.push(points);
    return group;
}

function createLushGreenArchipelago() {
    const archipelagoGroup = new THREE.Group();

    // 1. HONSHU (本州)
    const honshuPts = [
        [-12.8, 5.1], [-11.5, 5.7], [-9.8, 5.3], [-7.5, 5.2], [-6.0, 5.2],
        [-5.2, 6.6], [-3.8, 7.6], [-2.2, 6.8], [-0.8, 7.1], [0.2, 5.5],
        [2.2, 5.7], [3.8, 5.5], [4.5, 6.1], [5.4, 4.9], [6.8, 5.8],
        [7.6, 4.4], [8.5, 2.2], [8.3, -0.2], [8.9, -2.5], [9.2, -5.6],
        [7.6, -5.5], [6.8, -3.5], [6.2, -1.6], [3.5, -0.5], [1.2, 1.0],
        [-0.3, -0.4], [-1.2, 0.2], [-1.5, 1.5], [-3.4, 2.8], [-5.8, 2.0],
        [-8.2, 2.4], [-10.2, 2.5], [-11.8, 3.8]
    ];
    archipelagoGroup.add(createGreenIslandMass(honshuPts, 0.72));

    // 2. SHIKOKU (四國)
    const shikokuPts = [
        [-9.8, 7.2], [-8.8, 8.6], [-7.6, 8.4], [-5.9, 7.4],
        [-6.2, 6.3], [-7.8, 6.1], [-9.2, 6.7]
    ];
    archipelagoGroup.add(createGreenIslandMass(shikokuPts, 0.66));

    // 3. KYUSHU (九州)
    const kyushuPts = [
        [-13.5, 5.8], [-12.0, 6.0], [-11.8, 7.8], [-12.2, 9.6],
        [-13.0, 10.9], [-14.4, 10.6], [-14.3, 8.5], [-14.9, 7.2], [-14.2, 6.1]
    ];
    archipelagoGroup.add(createGreenIslandMass(kyushuPts, 0.68));

    // 4. HOKKAIDO (北海道)
    const hokkaidoPts = [
        [8.8, -6.5], [10.4, -6.0], [13.8, -6.6], [14.5, -8.5],
        [12.2, -10.4], [9.8, -9.6], [9.1, -8.0]
    ];
    // 北海道：雪國，地面覆蓋白雪
    archipelagoGroup.add(createGreenIslandMass(hokkaidoPts, 0.72, { kind: 'hokkaido', base: 0xcfc9bd, green: 0x7fa860, hill: 0x6c9a52 }));

    // 5. SADO, AWAJI, OKI, IKI, TSUSHIMA (五大離島令制國!)
    const sadoPts = [[2.2, -1.7], [3.0, -1.8], [2.9, -2.5], [2.1, -2.3]];
    archipelagoGroup.add(createGreenIslandMass(sadoPts, 0.52));

    const awajiPts = [[-6.2, 5.5], [-5.7, 5.6], [-5.8, 6.2], [-6.3, 6.1]];
    archipelagoGroup.add(createGreenIslandMass(awajiPts, 0.50));

    const okiPts = [[-9.9, 0.5], [-9.2, 0.5], [-9.3, 1.1], [-10.0, 1.1]];
    archipelagoGroup.add(createGreenIslandMass(okiPts, 0.50));

    const ikiPts = [[-14.6, 4.9], [-14.0, 4.9], [-14.0, 5.5], [-14.6, 5.5]];
    archipelagoGroup.add(createGreenIslandMass(ikiPts, 0.50));

    const tsushimaPts = [[-15.2, 3.3], [-14.5, 3.4], [-14.5, 4.3], [-15.2, 4.2]];
    archipelagoGroup.add(createGreenIslandMass(tsushimaPts, 0.52));

    // 6. 琉球：沖繩本島
    const okinawaPts = [[-14.9, 11.9], [-14.5, 12.2], [-15.2, 13.0], [-16.1, 13.9], [-16.6, 13.8], [-16.2, 13.1], [-15.5, 12.4]];
    archipelagoGroup.add(createGreenIslandMass(okinawaPts, 0.55, { kind: 'ryukyu', base: 0xf1e2bd, green: 0x86c35f, hill: 0x6faa4e }));

    scene.add(archipelagoGroup);
}

// 湖泊位置（地圖座標，已避開令制國地台）
const LAKES = [
    { name: '琵琶湖', x: -1.7, z: 4.45, rx: 0.42, rz: 1.12, shape: [[-0.064, -1.12], [0.224, -0.992], [0.416, -0.64], [0.384, -0.192], [0.192, 0.128], [0.096, 0.48], [0.128, 0.832], [0.032, 1.12], [-0.096, 0.96], [-0.096, 0.544], [-0.192, 0.192], [-0.384, -0.16], [-0.416, -0.608], [-0.288, -0.96]] },
    { name: '霞ヶ浦', x: 7.95, z: 1.35, rx: 0.24, rz: 0.16 },
    { name: '諏訪湖', x: 2.35, z: 2.8, rx: 0.13, rz: 0.11 },
    { name: '宍道湖', x: -9.95, z: 3.2, rx: 0.26, rz: 0.11 },
    { name: '豬苗代湖', x: 6.4, z: 0.15, rx: 0.17, rz: 0.15 }
];
function inLake(x, z, margin = 0) {
    return LAKES.some(l => Math.hypot((x - l.x) / (l.rx + margin), (z - l.z) / (l.rz + margin)) < 1.05);
}

// Rivers, Lakes & Policy Island Style Bridges
function createWindingRiversAndLakes() {
    const waterFeatureGroup = new THREE.Group();
    const riverMat = new THREE.MeshStandardMaterial({
        color: 0x4f9fb0,
        roughness: 0.22,
        metalness: 0.12
    });
    MATS.lakeShore = new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 0.9 });

    // 1. 五大湖泊：依實際輪廓與比例繪製，放在所屬令制國旁、不被地台蓋住
    //    （琵琶湖：北湖寬、南湖窄的琵琶形；其餘以不規則橢圓近似）
    LAKES.forEach(l => {
        GEO_LABELS.push({ type: 'lake', name: l.name, x: l.x, z: l.z, y: 1.0, major: l.name === '琵琶湖' });
        const pts = l.shape || Array.from({ length: 20 }, (_, i) => {
            const a = (i / 20) * Math.PI * 2;
            const wob = 1 + Math.sin(a * 3 + l.x) * 0.08 + Math.cos(a * 5) * 0.05;
            return [Math.cos(a) * l.rx * wob, Math.sin(a) * l.rz * wob];
        });
        const makeLayer = (grow, mat, y, depth) => {
            const s = new THREE.Shape();
            pts.forEach(([px, pz], i) => {
                const k = 1 + grow / Math.max(0.05, Math.hypot(px, pz));
                const X = l.x + px * k, Z = l.z + pz * k;
                if (i === 0) s.moveTo(X, -Z); else s.lineTo(X, -Z);
            });
            s.closePath();
            const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }), mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = y;
            mesh.receiveShadow = true;
            return mesh;
        };
        waterFeatureGroup.add(makeLayer(0.07, MATS.lakeShore, 0.955, 0.012));
        waterFeatureGroup.add(makeLayer(0, riverMat, 0.962, 0.012));
    });

    // 2. Winding Major Rivers
    const riversData = [
        [new THREE.Vector3(-1.72, 0.91, 5.5), new THREE.Vector3(-3.1, 0.91, 4.75), new THREE.Vector3(-5.5, 0.90, 5.4)], // 淀川・鴨川（瀨田川自琵琶湖南端流出）
        [new THREE.Vector3(2.2, 0.92, 2.3), new THREE.Vector3(2.8, 0.91, 1.0), new THREE.Vector3(3.4, 0.90, -0.5)],   // 信濃川
        [new THREE.Vector3(4.5, 0.92, 1.8), new THREE.Vector3(6.2, 0.91, 2.4), new THREE.Vector3(7.6, 0.90, 3.0)],    // 利根川
        [new THREE.Vector3(0.2, 0.92, 3.4), new THREE.Vector3(-0.1, 0.91, 4.2), new THREE.Vector3(-0.3, 0.90, 5.2)],  // 木曾川
        [new THREE.Vector3(8.4, 0.92, -3.5), new THREE.Vector3(8.2, 0.91, -2.2), new THREE.Vector3(8.2, 0.90, -1.2)], // 北上川
        [new THREE.Vector3(-8.5, 0.91, 7.5), new THREE.Vector3(-7.4, 0.91, 7.2), new THREE.Vector3(-6.2, 0.90, 7.0)]  // 吉野川
    ];

    const riverNames = ['淀川', '信濃川', '利根川', '木曾川', '北上川', '吉野川'];
    riversData.forEach((pts, i) => {
        GEO_LABELS.push({ type: 'river', name: riverNames[i], x: pts[1].x, z: pts[1].z, y: 1.02, major: false });
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.13, 6, false);
        const riverMesh = new THREE.Mesh(tubeGeo, riverMat);
        riverMesh.scale.set(1, 0.08, 1);
        riverMesh.position.y = 0.893;
        waterFeatureGroup.add(riverMesh);
    });

    // 3. Policy Island Style Balustrade Bridges & Red Taiko Bridges over rivers!
    const bridgeSpots = [
        { x: -4.2, z: 4.6, rot: 0.6, style: 'balustrade' }, // 京都五條大橋 (白石欄杆橋)
        { x: -5.4, z: 5.5, rot: 0.4, style: 'red-arch' },   // 大阪住吉反橋
        { x: 0.1, z: 4.2, rot: 0.1, style: 'balustrade' },  // 尾張美濃木曾川橋
        { x: 6.4, z: 2.6, rot: -0.5, style: 'balustrade' }, // 江戶日本橋 (Policy Island 風格橋樑)
        { x: 3.1, z: -0.4, rot: 0.3, style: 'red-arch' }    // 越後萬代橋
    ];
    bridgeSpots.forEach(b => {
        const bridgeGroup = new THREE.Group();
        if (b.style === 'balustrade') {
            const deck = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.42), MATS.paver);
            deck.position.y = 0.06;
            const railL = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.05), MATS.creamWall);
            railL.position.set(0, 0.14, 0.19);
            const railR = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.05), MATS.creamWall);
            railR.position.set(0, 0.14, -0.19);
            bridgeGroup.add(deck, railL, railR);
            [-0.34, 0, 0.34].forEach(px => {
                const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.20, 0.07), MATS.whiteWall);
                post1.position.set(px, 0.15, 0.19);
                const post2 = post1.clone();
                post2.position.z = -0.19;
                bridgeGroup.add(post1, post2);
            });
        } else {
            const archGeo = new THREE.TorusGeometry(0.32, 0.06, 6, 12, Math.PI);
            const arch = new THREE.Mesh(archGeo, MATS.vermilion);
            arch.scale.set(1.2, 0.65, 1.8);
            arch.position.y = 0.02;
            bridgeGroup.add(arch);
        }
        bridgeGroup.scale.setScalar(0.45);
        bridgeGroup.position.set(b.x, 0.95, b.z);
        bridgeGroup.rotation.y = b.rot;
        waterFeatureGroup.add(bridgeGroup);
    });

    scene.add(waterFeatureGroup);
}

// Authentic Mt. Fuji with Concave Volcanic Curve, Crater Rim & Jagged Snow Cap!
function buildAuthenticMtFuji() {
    const fujiGroup = new THREE.Group();

    // 1. Concave Slope Profile using LatheGeometry (12-gon low-poly art style)
    const lathePoints = [
        new THREE.Vector2(1.85, 0.0),
        new THREE.Vector2(1.42, 0.42),
        new THREE.Vector2(1.06, 0.90),
        new THREE.Vector2(0.78, 1.42),
        new THREE.Vector2(0.55, 1.92),
        new THREE.Vector2(0.36, 2.38),
        new THREE.Vector2(0.24, 2.65),
        new THREE.Vector2(0.12, 2.52),
        new THREE.Vector2(0.0,  2.50)
    ];
    const bodyGeo = new THREE.LatheGeometry(lathePoints, 12);
    bodyGeo.computeVertexNormals();
    const fujiBlueMat = new THREE.MeshStandardMaterial({
        color: 0x4d7ea3,
        roughness: 0.7,
        flatShading: true
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, fujiBlueMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    fujiGroup.add(bodyMesh);

    // 2. Jagged Snow Cap with Iconic Snow Valleys (白雪鋸齒山巔)
    const snowPoints = [
        new THREE.Vector2(0.68, 1.62),
        new THREE.Vector2(0.54, 1.94),
        new THREE.Vector2(0.365, 2.39),
        new THREE.Vector2(0.245, 2.66),
        new THREE.Vector2(0.12, 2.53)
    ];
    const snowGeo = new THREE.LatheGeometry(snowPoints, 12);
    const sPos = snowGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
        const vy = sPos.getY(i);
        if (vy < 1.75) {
            const angle = Math.atan2(sPos.getZ(i), sPos.getX(i));
            const streak = Math.sin(angle * 6) * 0.18 + Math.cos(angle * 3) * 0.08;
            sPos.setY(i, vy + streak);
            const scaleAdjust = 1.0 - streak * 0.16;
            sPos.setX(i, sPos.getX(i) * scaleAdjust);
            sPos.setZ(i, sPos.getZ(i) * scaleAdjust);
        }
    }
    snowGeo.computeVertexNormals();
    const snowMesh = new THREE.Mesh(snowGeo, MATS.whiteWall);
    fujiGroup.add(snowMesh);

    // 3. Hoeizan Secondary Crater Bump on the southeastern flank (寶永山火口)
    const hoeiGeo = new THREE.ConeGeometry(0.45, 0.75, 7);
    const hoeiMesh = new THREE.Mesh(hoeiGeo, fujiBlueMat);
    hoeiMesh.position.set(0.75, 0.72, 0.45);
    hoeiMesh.rotation.z = -0.35;
    fujiGroup.add(hoeiMesh);

    return fujiGroup;
}

// Helper: Muted Pine Forest Mountain with Snow Cap
function buildGreenMountainPeak(radius, height, snowRatio = 0.38, isFuji = false) {
    if (isFuji) {
        return buildAuthenticMtFuji();
    }
    const group = new THREE.Group();

    // 1. Lower Muted Deep Pine Slope
    const baseGeo = new THREE.ConeGeometry(radius, height, 7, 2);
    const pos = baseGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < height * 0.35 && y > -height * 0.45) {
            pos.setX(i, pos.getX(i) + Math.sin(i * 2.3) * radius * 0.14);
            pos.setZ(i, pos.getZ(i) + Math.cos(i * 1.9) * radius * 0.14);
        }
    }
    baseGeo.computeVertexNormals();
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x4f7f49,
        roughness: 0.8,
        flatShading: true
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = height / 2;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // 2. Mid-Altitude Sage Ridge
    const midH = height * 0.68;
    const midR = radius * 0.70;
    const midGeo = new THREE.ConeGeometry(midR, midH, 7, 1);
    midGeo.computeVertexNormals();
    const midMat = new THREE.MeshStandardMaterial({
        color: 0x639453,
        roughness: 0.8,
        flatShading: true
    });
    const midMesh = new THREE.Mesh(midGeo, midMat);
    midMesh.position.y = height - midH / 2 + 0.01;
    group.add(midMesh);

    // 3. Upper Crisp White Snow Cap
    if (snowRatio > 0) {
        const capH = height * snowRatio;
        const capR = radius * (snowRatio + 0.03);
        const capGeo = new THREE.ConeGeometry(capR, capH, 7, 1);
        capGeo.computeVertexNormals();
        const capMesh = new THREE.Mesh(capGeo, MATS.whiteWall);
        capMesh.position.y = height - capH / 2 + 0.03;
        group.add(capMesh);
    }

    return group;
}

const mountainOccluders = [];
// 山、河川、湖泊的地名標籤
const GEO_LABELS = [];
const _segA = new THREE.Vector3(), _segB = new THREE.Vector3(), _mPt = new THREE.Vector3(), _closest = new THREE.Vector3();
const _seg = new THREE.Line3();
function updateMountainFade() {
    _seg.set(camera.position, controls.target);
    mountainOccluders.forEach(m => {
        _mPt.set(m.x, 0.9 + m.h * 0.45, m.z);
        _seg.closestPointToPoint(_mPt, true, _closest);
        const blocking = _closest.distanceTo(_mPt) < m.r * 0.95 && _closest.distanceTo(controls.target) > 0.4;
        const target = blocking ? 0.22 : 1;
        if (Math.abs(m.fade - target) < 0.01) return;
        m.fade += (target - m.fade) * 0.15;
        m.mats.forEach(mat => {
            mat.opacity = m.fade;
            mat.depthWrite = m.fade > 0.95;
        });
    });
}
