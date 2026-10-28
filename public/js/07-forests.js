// 森林
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 森林：闊葉樹・針葉樹・櫻花樹（InstancedMesh 大量種植，顏色隨四季變化）
 ***********************************************************************/
const FOREST_PALETTE = {
    broad: {
        spring: [0x8fcf6a, 0x9fd77a, 0x7cc35e, 0xa9dc84],
        summer: [0x4f8a45, 0x5f9a50, 0x3f7a40, 0x6aa456],
        autumn: [0xd23f2c, 0xe07a2c, 0xe8b23a, 0xb5652e, 0xc9502a, 0xe39a35],
        winter: [0x8a7a6a, 0x9a8b7b, 0x7d6e60]
    },
    conifer: {
        spring: [0x2f6a3a, 0x3a7a44, 0x2a5f36],
        summer: [0x2f6a3a, 0x3a7a44, 0x2a5f36],
        autumn: [0x35663a, 0x456f3c, 0x2f5e36],
        winter: [0xe8eef0, 0xdfe7e6, 0xb9cbc4]
    },
    sakura: {
        spring: [0xf29bb8, 0xf5adc4, 0xee8fae, 0xf8c2d2, 0xf3a3bd],
        summer: [0x5f9e55, 0x6aa85c, 0x579650],
        autumn: [0xd97a3a, 0xc2502e, 0xe09a40],
        winter: [0x8a6d55, 0x7a604c, 0x957a62]
    }
};
const forestSets = [];
// 賞櫻名所：在這些國的周圍種一整片櫻花林
const SAKURA_SPOTS = ['yamato', 'yamashiro', 'mutsu_aomori', 'musashi', 'shinano', 'harima', 'omi', 'chikuzen'];

function createForests() {
    let seed = 777;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const gauss = () => (rand() + rand() + rand() - 1.5) * 0.8;
    const sitePts = [];
    PROVINCES_DATA.forEach(p => {
        sitePts.push([p.mapX, p.mapZ, 0.5]);
        ['shrine', 'castle'].forEach(t => ((p._sitePos || {})[t] || []).forEach((pos, i) => { if (i > 0 && pos) sitePts.push([pos.x, pos.z, 0.3]); }));
    });
    const free = (x, z) => {
        if (!ISLAND_POLYS.some(pl => pointInPoly(x, z, pl))) return false;
        if (inLake(x, z, 0.06)) return false;
        if (sitePts.some(([sx, sz, r]) => Math.hypot(sx - x, sz - z) < r)) return false;
        if (mountainOccluders.some(m => Math.hypot(m.x - x, m.z - z) < m.r * 0.72)) return false;
        return true;
    };
    const nearMountain = (x, z) => mountainOccluders.some(m => Math.hypot(m.x - x, m.z - z) < m.r + 0.6);

    // 林地中心：大部分樹成片生長
    const clusters = [];
    for (let tries = 0; clusters.length < 150 && tries < 4000; tries++) {
        const x = -15 + rand() * 29.5, z = -10.5 + rand() * 21;
        if (free(x, z)) clusters.push([x, z]);
    }
    const items = { broad: [], conifer: [], sakura: [] };
    const place = (type, x, z) => {
        const s = type === 'conifer' ? 0.8 + rand() * 0.5 : 0.75 + rand() * 0.55;
        items[type].push({ x, z, s, v: rand(), rot: rand() * Math.PI * 2 });
    };
    let tries = 0;
    while (items.broad.length + items.conifer.length + items.sakura.length < 2100 && tries < 40000) {
        tries++;
        let x, z;
        if (rand() < 0.72) {
            const c = clusters[Math.floor(rand() * clusters.length)];
            x = c[0] + gauss() * 0.45;
            z = c[1] + gauss() * 0.45;
        } else {
            x = -15 + rand() * 29.5;
            z = -10.5 + rand() * 21;
        }
        if (!free(x, z)) continue;
        const hokkaido = z < -5.9 && x > 8.7;
        const north = z < -1.8;
        let pConifer = hokkaido ? 0.75 : north ? 0.55 : 0.32;
        if (nearMountain(x, z)) pConifer += 0.25;
        const pSakura = hokkaido ? 0.04 : north ? 0.1 : 0.16;
        const r = rand();
        place(r < pSakura ? 'sakura' : r < pSakura + pConifer ? 'conifer' : 'broad', x, z);
    }
    // 賞櫻名所的櫻花林
    SAKURA_SPOTS.forEach(id => {
        const p = getProv(id);
        if (!p) return;
        let n = 0, t2 = 0;
        while (n < 45 && t2 < 900) {
            t2++;
            const a = rand() * Math.PI * 2, d = 0.52 + rand() * 0.6;
            const x = p.mapX + Math.cos(a) * d, z = p.mapZ + Math.sin(a) * d;
            if (!free(x, z)) continue;
            place('sakura', x, z);
            n++;
        }
    });

    const trunkGeo = new THREE.CylinderGeometry(0.007, 0.011, 0.07, 5);
    trunkGeo.translate(0, 0.035, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.85 });
    const crownGeos = {
        broad: (() => { const g = new THREE.SphereGeometry(0.06, 9, 7); g.translate(0, 0.1, 0); return g; })(),
        // 杉・松：兩層塔狀樹冠
        conifer: new THREE.LatheGeometry([[0, 0.035], [0.052, 0.042], [0.02, 0.118], [0.04, 0.112], [0, 0.215]].map(([x, y]) => new THREE.Vector2(x, y)), 7),
        sakura: (() => { const g = new THREE.SphereGeometry(0.068, 10, 7); g.scale(1.25, 0.82, 1.25); g.translate(0, 0.1, 0); return g; })()
    };
    const group = new THREE.Group();
    const dummy = new THREE.Object3D();
    Object.entries(items).forEach(([type, list]) => {
        if (!list.length) return;
        const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, list.length);
        const crowns = new THREE.InstancedMesh(crownGeos[type], new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, flatShading: type === 'conifer' }), list.length);
        list.forEach((it, i) => {
            dummy.position.set(it.x, 0.955, it.z);
            dummy.rotation.set(0, it.rot, 0);
            dummy.scale.setScalar(it.s);
            dummy.updateMatrix();
            trunks.setMatrixAt(i, dummy.matrix);
            crowns.setMatrixAt(i, dummy.matrix);
            crowns.setColorAt(i, new THREE.Color(FOREST_PALETTE[type].summer[Math.floor(it.v * FOREST_PALETTE[type].summer.length)]));
        });
        crowns.castShadow = true;
        crowns.receiveShadow = true;
        trunks.receiveShadow = true;
        group.add(trunks, crowns);
        forestSets.push({ type, list, crowns });
    });
    scene.add(group);
}

function updateForestSeason(season) {
    const c = new THREE.Color();
    forestSets.forEach(set => {
        const pal = FOREST_PALETTE[set.type][season];
        set.list.forEach((it, i) => {
            c.setHex(pal[Math.floor(it.v * pal.length) % pal.length]);
            set.crowns.setColorAt(i, c);
        });
        set.crowns.instanceColor.needsUpdate = true;
    });
}
