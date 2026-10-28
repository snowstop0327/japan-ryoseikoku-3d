// 雲、海鷗、船
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 5. SKY, SEA LIFE & TRAVELER CHARACTERS
 ***********************************************************************/
function createSkyCloudsAndSeagulls() {
    // 蓬鬆積雲：多顆平滑球體堆疊、底部壓平，帶淡淡自發光保持潔白
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.18 });
    const puffGeo = new THREE.SphereGeometry(1, 18, 14);
    const cloudSpots = [
        [-18, 9.6, -7], [-9, 10.2, -9.5], [4, 9.8, -10], [15, 10.4, -3],
        [-21, 9.8, 10], [10, 9.4, 12], [-5, 10.6, 15], [20, 9.2, 6]
    ];
    cloudSpots.forEach((spot, i) => {
        const c = new THREE.Group();
        const puffs = [
            [0, 0.35, 0, 0.95], [-0.95, 0.15, 0.1, 0.72], [0.95, 0.12, -0.05, 0.78],
            [-1.7, -0.05, 0, 0.5], [1.75, -0.05, 0.1, 0.52], [-0.4, 0.7, -0.15, 0.62],
            [0.45, 0.62, 0.2, 0.58], [0.1, 0.05, 0.55, 0.6], [-0.2, 0.0, -0.5, 0.62]
        ];
        puffs.forEach(([px, py, pz, r], j) => {
            const jitter = 0.85 + ((i * 7 + j * 3) % 5) * 0.06;
            const puff = new THREE.Mesh(puffGeo, cloudMat);
            puff.position.set(px, py, pz);
            puff.scale.setScalar(r * jitter);
            c.add(puff);
        });
        // 平底：把整朵雲壓扁一點
        c.scale.set(1 + (i % 3) * 0.2, 0.62, 0.8 + (i % 2) * 0.2);
        c.position.set(spot[0], spot[1], spot[2]);
        c.userData.speed = 0.18 + (i % 4) * 0.05;
        c.userData.baseY = spot[1];
        c.userData.phase = i * 1.3;
        clouds.push(c);
        scene.add(c);
    });

    // 海鷗：流線身體、灰背白腹、黃喙，翅膀分內外兩節（拍翅時外節會彎折），翼尖黑色
    const gullWhite = new THREE.MeshStandardMaterial({ color: 0xfbfbf8, roughness: 0.6 });
    const gullGray = new THREE.MeshStandardMaterial({ color: 0xb9c2c9, roughness: 0.6, side: THREE.DoubleSide });
    const gullTip = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.6, side: THREE.DoubleSide });
    const gullBeak = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 });
    const wingShape = (len, root, tip, sweep) => {
        const s = new THREE.Shape();
        s.moveTo(0, root * 0.55);
        s.lineTo(len, root * 0.55 - sweep);
        s.lineTo(len, root * 0.55 - sweep - tip);
        s.lineTo(0, -root * 0.45);
        s.closePath();
        const g = new THREE.ShapeGeometry(s);
        g.rotateX(-Math.PI / 2);
        return g;
    };
    const innerGeo = wingShape(0.13, 0.085, 0.07, 0.01);
    const outerGeo = wingShape(0.12, 0.07, 0.03, 0.045);
    const tipGeo = wingShape(0.045, 0.034, 0.012, 0.022);
    const buildGull = () => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), gullWhite);
        body.scale.set(0.95, 0.85, 2.4);
        const back = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), gullGray);
        back.scale.set(1, 0.6, 2.2);
        back.position.y = 0.006;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), gullWhite);
        head.position.set(0, 0.018, 0.08);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.035, 6), gullBeak);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.014, 0.112);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 4), gullWhite);
        tail.rotation.x = -Math.PI / 2;
        tail.scale.set(1.4, 0.35, 1);
        tail.position.set(0, 0.004, -0.095);
        g.add(body, back, head, beak, tail);
        [-1, 1].forEach(s => {
            {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 4), gullTip);
                eye.position.set(s * 0.019, 0.026, 0.093);
                g.add(eye);
            }
        });
        const wings = [-1, 1].map(s => {
            const inner = new THREE.Group();
            inner.position.set(s * 0.025, 0.01, 0.01);
            inner.scale.x = s;
            inner.add(new THREE.Mesh(innerGeo, gullGray));
            const outer = new THREE.Group();
            outer.position.x = 0.13;
            outer.add(new THREE.Mesh(outerGeo, gullGray));
            const tip = new THREE.Mesh(tipGeo, gullTip);
            tip.position.set(0.12, 0.001, -0.045);
            outer.add(tip);
            inner.add(outer);
            g.add(inner);
            return { inner, outer, s };
        });
        g.userData.wings = wings;
        g.traverse(o => { if (o.isMesh) o.castShadow = true; });
        return g;
    };
    const gullSpots = [[-6, 6.8], [2, 7.5], [-11, 1.5], [9.5, 0.5], [-2, 0], [11, -4.5], [-14, 7.5], [6.5, 6.2], [-8.5, -1.2]];
    gullSpots.forEach((s, i) => {
        const g = buildGull();
        g.scale.setScalar(0.75);
        g.userData = Object.assign(g.userData, { cx: s[0], cz: s[1], r: 0.9 + (i % 3) * 0.45, speed: 0.38 + (i % 2) * 0.16, phase: i * 1.3, h: 2.1 + (i % 4) * 0.25 });
        seagulls.push(g);
        scene.add(g);
    });

    // 船：江戶時代的弁才船（千石船：高翹船首、大型白帆、船尾屋形）與小漁船（漁夫搖櫓）
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: 0.75, side: THREE.DoubleSide });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xc89a62, roughness: 0.8 });
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x3a2a1e, transparent: true, opacity: 0.7 });
    const sailTex = (() => {
        const cv = document.createElement('canvas');
        cv.width = 128; cv.height = 128;
        const c = cv.getContext('2d');
        c.fillStyle = '#f6f0e2'; c.fillRect(0, 0, 128, 128);
        c.strokeStyle = 'rgba(120, 100, 70, 0.45)'; c.lineWidth = 2;
        for (let x = 8; x < 128; x += 12.5) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); }
        c.fillStyle = 'rgba(150, 120, 80, 0.18)'; c.fillRect(0, 118, 128, 10);
        return new THREE.CanvasTexture(cv);
    })();
    const sailMat = new THREE.MeshStandardMaterial({ map: sailTex, roughness: 0.8, side: THREE.DoubleSide });
    // 船身：沿船長方向取多個 U 形斷面拼成曲面，船首尖且翹起、船尾平
    const hullGeo = (L, B, D, bowRise) => {
        const N = 14, M = 6, verts = [], idx = [];
        for (let i = 0; i <= N; i++) {
            const u = i / N, z = (u - 0.5) * L;
            const w = u > 0.55 ? B * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.55) / 0.45, 2))) : B * (0.78 + 0.22 * Math.sin(u / 0.55 * Math.PI / 2));
            const sheer = D + Math.pow(Math.max(0, u - 0.6) / 0.4, 2) * bowRise + Math.pow(Math.max(0, 0.15 - u) / 0.15, 2) * bowRise * 0.25;
            const keel = u > 0.85 ? (u - 0.85) / 0.15 * D * 0.6 : 0;
            for (let j = 0; j <= M; j++) {
                const a = (j / M) * Math.PI;
                const x = -Math.cos(a) * w * 0.5;
                const y = sheer - (sheer - keel) * Math.pow(Math.sin(a), 0.7);
                verts.push(x, y, z);
            }
        }
        for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
            const a = i * (M + 1) + j, b = a + M + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
        // 船尾板
        const sternC = verts.length / 3;
        verts.push(0, D * 0.6, -L / 2);
        for (let j = 0; j < M; j++) idx.push(sternC, j, j + 1);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        return g;
    };
    const buildBezaisen = () => {
        const b = new THREE.Group();
        const L = 0.62, B = 0.2, D = 0.09;
        b.add(new THREE.Mesh(hullGeo(L, B, D, 0.07), hullMat));
        const deck = new THREE.Mesh(new THREE.BoxGeometry(B * 0.82, 0.01, L * 0.62), deckMat);
        deck.position.set(0, D - 0.008, -0.03);
        b.add(deck);
        // 船首的「水押」
        const stem = bx(0.014, 0.12, 0.05, MATS.darkWood, 0, D + 0.03, L / 2 - 0.01);
        stem.rotation.x = 0.5;
        b.add(stem);
        // 船尾屋形（艫屋形）與舵
        b.add(bx(0.15, 0.06, 0.12, MATS.plainWood || deckMat, 0, D + 0.03, -L / 2 + 0.1));
        b.add(gable(0.17, 0.14, 0.05, MATS.darkWood, 0).translateY(D + 0.06).translateZ(-L / 2 + 0.1));
        const rudder = bx(0.012, 0.1, 0.06, MATS.darkWood, 0, D - 0.02, -L / 2 - 0.02);
        b.add(rudder);
        // 帆柱、帆桁、大型四角帆（微微鼓起）
        const mast = cy(0.008, 0.011, 0.56, MATS.darkWood, 0, D, 0.04);
        b.add(mast);
        const yard = cy(0.006, 0.006, 0.36, MATS.darkWood, 0, D + 0.34, 0.055);
        yard.rotation.z = Math.PI / 2;
        b.add(yard);
        const sg = new THREE.PlaneGeometry(0.34, 0.38, 6, 6);
        const sp = sg.attributes.position;
        for (let k = 0; k < sp.count; k++) {
            const x = sp.getX(k) / 0.17, y = sp.getY(k) / 0.19;
            sp.setZ(k, (1 - x * x) * (1 - 0.4 * y * y) * 0.045);
        }
        sg.computeVertexNormals();
        const sail = new THREE.Mesh(sg, sailMat);
        sail.position.set(0, D + 0.32, 0.06);
        b.add(sail);
        // 繩索
        const rope = (pts) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(q => new THREE.Vector3(...q))), ropeMat);
        b.add(rope([[0, D + 0.56, 0.04], [0, D + 0.1, L / 2 - 0.02]]));
        b.add(rope([[-0.17, D + 0.52, 0.055], [-0.08, D + 0.02, -0.2]]));
        b.add(rope([[0.17, D + 0.52, 0.055], [0.08, D + 0.02, -0.2]]));
        b.userData.sail = sail;
        return b;
    };
    const buildFishingBoat = () => {
        const b = new THREE.Group();
        b.add(new THREE.Mesh(hullGeo(0.34, 0.11, 0.045, 0.035), hullMat));
        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.006, 0.2), deckMat);
        deck.position.set(0, 0.04, -0.01);
        b.add(deck);
        // 漁夫：斗笠、藍衣，在船尾搖櫓
        const man = new THREE.Group();
        man.position.set(0, 0.04, -0.1);
        const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x3d5a80, roughness: 0.8 }));
        robe.position.y = 0.03;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), new THREE.MeshStandardMaterial({ color: 0xf1c7a0, roughness: 0.7 }));
        head.position.y = 0.072;
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.018, 12), new THREE.MeshStandardMaterial({ color: 0xd9b36c, roughness: 0.9 }));
        hat.position.y = 0.088;
        man.add(robe, head, hat);
        b.add(man);
        const oar = cy(0.003, 0.003, 0.2, MATS.darkWood, 0.02, 0.06, -0.19);
        oar.rotation.x = 1.1;
        b.add(oar);
        b.userData.oar = oar;
        b.userData.man = man;
        return b;
    };
    // 白色航跡
    const wakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
    const wakeGeo = (() => {
        const s = new THREE.Shape();
        s.moveTo(-0.05, 0); s.lineTo(0.05, 0); s.lineTo(0.16, -0.5); s.lineTo(-0.16, -0.5); s.closePath();
        const g = new THREE.ShapeGeometry(s);
        g.rotateX(-Math.PI / 2);
        return g;
    })();
    const boatSpots = [[-8.6, 5.75, 0.9, 'big'], [1.5, 8.2, 1.6, 'big'], [-4.5, -0.8, 1.4, 'small'], [10.4, -1.5, 1.3, 'big'],
        [-16.0, 6.5, 1.0, 'small'], [-1.0, 9.0, 1.2, 'small'], [-6.8, 7.4, 0.7, 'small'], [6.0, 5.6, 1.1, 'big']];
    // 船的航線不可碰到陸地（含沙岸與淺灘外緣），碰到就縮小半徑或把中心往海上移
    const seaOk = (x, z) => [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]
        .every(([dx, dz]) => !ISLAND_POLYS.some(pl => pointInPoly(x + dx, z + dz, pl)));
    const loopOk = (cx, cz, r) => {
        for (let k = 0; k < 24; k++) {
            const a = k / 24 * Math.PI * 2;
            if (!seaOk(cx + Math.cos(a) * r, cz + Math.sin(a) * r)) return false;
        }
        return true;
    };
    const fitLoop = (cx, cz, r) => {
        for (let d = 0; d <= 3; d += 0.5) {
            for (let k = 0; k < (d ? 16 : 1); k++) {
                const a = k / 16 * Math.PI * 2, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
                for (let rr = r; rr >= 0.4; rr -= 0.2) if (loopOk(x, z, rr)) return [x, z, rr];
            }
        }
        return null;
    };
    boatSpots.forEach((s, i) => {
        const fit = fitLoop(s[0], s[1], s[2]);
        if (!fit) return;
        [s[0], s[1], s[2]] = fit;
        const b = s[3] === 'big' ? buildBezaisen() : buildFishingBoat();
        b.scale.setScalar(s[3] === 'big' ? 1.25 : 1.35);
        const wake = new THREE.Mesh(wakeGeo, wakeMat);
        wake.position.set(0, 0.012, s[3] === 'big' ? -0.3 : -0.17);
        wake.scale.setScalar(s[3] === 'big' ? 1 : 0.6);
        b.add(wake);
        b.traverse(o => { if (o.isMesh && o !== wake) o.castShadow = true; });
        b.userData = Object.assign(b.userData, { cx: s[0], cz: s[1], r: s[2], speed: (s[3] === 'big' ? 0.1 : 0.06) + (i % 3) * 0.03, phase: i * 2.1 });
        boats.push(b);
        scene.add(b);
    });
}
