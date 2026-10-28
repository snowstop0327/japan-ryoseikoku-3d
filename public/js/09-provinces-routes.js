// 各國地台、名牌與驛道
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 4. PROVINCE NODES, LABELS & GOKISHICHIDO ROUTES
 ***********************************************************************/
const NODE_Y = 0.96;
let selectionRing;
const regionLabelEls = [];

// 現代視角：八地方區分
const MODERN_REGIONS = [
    { id: 'm_hokkaido', name: '北海道地方', shortName: '北海道', color: '#2563eb', prefs: ['北海道'] },
    { id: 'm_tohoku', name: '東北地方', shortName: '東北', color: '#65a30d', prefs: ['青森縣', '岩手縣', '宮城縣', '秋田縣', '山形縣', '福島縣'] },
    { id: 'm_kanto', name: '關東地方', shortName: '關東', color: '#ea580c', prefs: ['茨城縣', '栃木縣', '群馬縣', '埼玉縣', '千葉縣', '東京都', '神奈川縣'] },
    { id: 'm_chubu', name: '中部地方', shortName: '中部', color: '#0284c7', prefs: ['新潟縣', '富山縣', '石川縣', '福井縣', '山梨縣', '長野縣', '岐阜縣', '靜岡縣', '愛知縣'] },
    { id: 'm_kinki', name: '近畿地方', shortName: '近畿', color: '#e11d48', prefs: ['三重縣', '滋賀縣', '京都府', '大阪府', '兵庫縣', '奈良縣', '和歌山縣'] },
    { id: 'm_chugoku', name: '中國地方', shortName: '中國', color: '#9333ea', prefs: ['鳥取縣', '島根縣', '岡山縣', '廣島縣', '山口縣'] },
    { id: 'm_shikoku', name: '四國地方', shortName: '四國', color: '#0d9488', prefs: ['德島縣', '香川縣', '愛媛縣', '高知縣'] },
    { id: 'm_kyushu', name: '九州・沖繩地方', shortName: '九州沖繩', color: '#dc2626', prefs: ['福岡縣', '佐賀縣', '長崎縣', '熊本縣', '大分縣', '宮崎縣', '鹿兒島縣', '沖繩縣'] }
];
const PREF_INFO = {};   // 縣名 → { name, region, provinces[主要], partial[部分], pos }
function getRegion(id) {
    return REGIONS.find(r => r.id === id) || MODERN_REGIONS.find(r => r.id === id) || REGIONS[0];
}
function regionsForMode() {
    return showModernPrefecture ? [REGIONS[0]].concat(MODERN_REGIONS) : REGIONS;
}
function modernRegionOf(prov) {
    const info = PREF_INFO[shortPref(prov)];
    return info ? info.region : 'all';
}
function provRegion(prov) {
    return showModernPrefecture ? modernRegionOf(prov) : prov.region;
}
function initModernGeography() {
    MODERN_REGIONS.forEach(r => r.prefs.forEach(name => {
        PREF_INFO[name] = { name, region: r.id, provinces: [], partial: [] };
    }));
    PROVINCES_DATA.forEach(p => {
        const main = shortPref(p);
        if (PREF_INFO[main]) PREF_INFO[main].provinces.push(p.id);
        PREFECTURES.forEach(name => {
            if (name !== main && PREF_INFO[name] && p.modernPref.includes(name)) PREF_INFO[name].partial.push(p.id);
        });
    });
    Object.values(PREF_INFO).forEach(info => {
        const ids = info.provinces.length ? info.provinces : info.partial;
        const ps = ids.map(getProv);
        const x = ps.reduce((s, p) => s + p.mapX, 0) / ps.length;
        let z = ps.reduce((s, p) => s + p.mapZ, 0) / ps.length;
        if (!info.provinces.length) z -= 0.75; // 只有部分範圍的縣（如埼玉縣）往北偏一點，避免與東京都重疊
        info.pos = { x, z };
        info.spread = Math.max(0.4, ...ps.map(p => Math.hypot(p.mapX - x, p.mapZ - z)));
    });
    MODERN_REGIONS.forEach(r => {
        const pts = r.prefs.map(n => PREF_INFO[n].pos);
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const spread = Math.max(1, ...pts.map(p => Math.hypot(p.x - cx, p.z - cz)));
        r.center = { x: cx, z: cz };
        r.cam = { x: cx, y: 6 + spread * 3.2, z: cz + 5 + spread * 2.6 };
    });
}
function getProv(id) {
    return PROVINCES_DATA.find(p => p.id === id);
}
const PREFECTURES = ['北海道', '青森縣', '岩手縣', '宮城縣', '秋田縣', '山形縣', '福島縣', '茨城縣', '栃木縣', '群馬縣',
    '埼玉縣', '千葉縣', '東京都', '神奈川縣', '新潟縣', '富山縣', '石川縣', '福井縣', '山梨縣', '長野縣', '岐阜縣', '靜岡縣',
    '愛知縣', '三重縣', '滋賀縣', '京都府', '大阪府', '兵庫縣', '奈良縣', '和歌山縣', '鳥取縣', '島根縣', '岡山縣', '廣島縣',
    '山口縣', '德島縣', '香川縣', '愛媛縣', '高知縣', '福岡縣', '佐賀縣', '長崎縣', '熊本縣', '大分縣', '宮崎縣', '鹿兒島縣', '沖繩縣'];
// 讀音：令制國（平假名, 羅馬拼音）與都道府縣
const PROV_KANA = {
    yamashiro: ['やましろ', 'Yamashiro'], yamato: ['やまと', 'Yamato'], kawachi: ['かわち', 'Kawachi'], izumi: ['いずみ', 'Izumi'], settsu: ['せっつ', 'Settsu'],
    iga: ['いが', 'Iga'], ise: ['いせ', 'Ise'], shima: ['しま', 'Shima'], owari: ['おわり', 'Owari'], mikawa: ['みかわ', 'Mikawa'],
    totomi: ['とおとうみ', 'Tōtōmi'], suruga: ['するが', 'Suruga'], izu: ['いず', 'Izu'], kai: ['かい', 'Kai'], sagami: ['さがみ', 'Sagami'],
    musashi: ['むさし', 'Musashi'], awa_chiba: ['あわ', 'Awa'], kazusa: ['かずさ', 'Kazusa'], shimosa: ['しもうさ', 'Shimōsa'], hitachi: ['ひたち', 'Hitachi'],
    omi: ['おうみ', 'Ōmi'], mino: ['みの', 'Mino'], hida: ['ひだ', 'Hida'], shinano: ['しなの', 'Shinano'], kozuke: ['こうずけ', 'Kōzuke'],
    shimotsuke: ['しもつけ', 'Shimotsuke'], iwaki: ['いわき', 'Iwaki'], iwashiro: ['いわしろ', 'Iwashiro'], rikuzen: ['りくぜん', 'Rikuzen'], rikuchu: ['りくちゅう', 'Rikuchū'],
    mutsu_aomori: ['むつ', 'Mutsu'], uzen: ['うぜん', 'Uzen'], ugo: ['うご', 'Ugo'], wakasa: ['わかさ', 'Wakasa'], echizen: ['えちぜん', 'Echizen'],
    kaga: ['かが', 'Kaga'], noto: ['のと', 'Noto'], etchu: ['えっちゅう', 'Etchū'], echigo: ['えちご', 'Echigo'], sado: ['さど', 'Sado'],
    tanba: ['たんば', 'Tanba'], tango: ['たんご', 'Tango'], tajima: ['たじま', 'Tajima'], inaba: ['いなば', 'Inaba'], hoki: ['ほうき', 'Hōki'],
    izumo: ['いずも', 'Izumo'], iwami: ['いわみ', 'Iwami'], oki: ['おき', 'Oki'], harima: ['はりま', 'Harima'], mimasaka: ['みまさか', 'Mimasaka'],
    bizen: ['びぜん', 'Bizen'], bitchu: ['びっちゅう', 'Bitchū'], bingo: ['びんご', 'Bingo'], aki: ['あき', 'Aki'], suo: ['すおう', 'Suō'],
    nagato: ['ながと', 'Nagato'], kii: ['きい', 'Kii'], awaji: ['あわじ', 'Awaji'], awa_tokushima: ['あわ', 'Awa'], sanuki: ['さぬき', 'Sanuki'],
    iyo: ['いよ', 'Iyo'], tosa: ['とさ', 'Tosa'], chikuzen: ['ちくぜん', 'Chikuzen'], chikugo: ['ちくご', 'Chikugo'], buzzen: ['ぶぜん', 'Buzen'],
    bungo: ['ぶんご', 'Bungo'], hizen: ['ひぜん', 'Hizen'], higo: ['ひご', 'Higo'], hyuga: ['ひゅうが', 'Hyūga'], osumi: ['おおすみ', 'Ōsumi'],
    satsuma: ['さつま', 'Satsuma'], iki: ['いき', 'Iki'], tsushima: ['つしま', 'Tsushima'], hokkaido_ezo: ['えぞち', 'Ezochi'], ryukyu: ['りゅうきゅう', 'Ryūkyū']
};
const PREF_KANA = {
    '北海道': ['ほっかいどう', 'Hokkaidō'], '青森縣': ['あおもりけん', 'Aomori-ken'], '岩手縣': ['いわてけん', 'Iwate-ken'], '宮城縣': ['みやぎけん', 'Miyagi-ken'],
    '秋田縣': ['あきたけん', 'Akita-ken'], '山形縣': ['やまがたけん', 'Yamagata-ken'], '福島縣': ['ふくしまけん', 'Fukushima-ken'], '茨城縣': ['いばらきけん', 'Ibaraki-ken'],
    '栃木縣': ['とちぎけん', 'Tochigi-ken'], '群馬縣': ['ぐんまけん', 'Gunma-ken'], '埼玉縣': ['さいたまけん', 'Saitama-ken'], '千葉縣': ['ちばけん', 'Chiba-ken'],
    '東京都': ['とうきょうと', 'Tōkyō-to'], '神奈川縣': ['かながわけん', 'Kanagawa-ken'], '新潟縣': ['にいがたけん', 'Niigata-ken'], '富山縣': ['とやまけん', 'Toyama-ken'],
    '石川縣': ['いしかわけん', 'Ishikawa-ken'], '福井縣': ['ふくいけん', 'Fukui-ken'], '山梨縣': ['やまなしけん', 'Yamanashi-ken'], '長野縣': ['ながのけん', 'Nagano-ken'],
    '岐阜縣': ['ぎふけん', 'Gifu-ken'], '靜岡縣': ['しずおかけん', 'Shizuoka-ken'], '愛知縣': ['あいちけん', 'Aichi-ken'], '三重縣': ['みえけん', 'Mie-ken'],
    '滋賀縣': ['しがけん', 'Shiga-ken'], '京都府': ['きょうとふ', 'Kyōto-fu'], '大阪府': ['おおさかふ', 'Ōsaka-fu'], '兵庫縣': ['ひょうごけん', 'Hyōgo-ken'],
    '奈良縣': ['ならけん', 'Nara-ken'], '和歌山縣': ['わかやまけん', 'Wakayama-ken'], '鳥取縣': ['とっとりけん', 'Tottori-ken'], '島根縣': ['しまねけん', 'Shimane-ken'],
    '岡山縣': ['おかやまけん', 'Okayama-ken'], '廣島縣': ['ひろしまけん', 'Hiroshima-ken'], '山口縣': ['やまぐちけん', 'Yamaguchi-ken'], '德島縣': ['とくしまけん', 'Tokushima-ken'],
    '香川縣': ['かがわけん', 'Kagawa-ken'], '愛媛縣': ['えひめけん', 'Ehime-ken'], '高知縣': ['こうちけん', 'Kōchi-ken'], '福岡縣': ['ふくおかけん', 'Fukuoka-ken'],
    '佐賀縣': ['さがけん', 'Saga-ken'], '長崎縣': ['ながさきけん', 'Nagasaki-ken'], '熊本縣': ['くまもとけん', 'Kumamoto-ken'], '大分縣': ['おおいたけん', 'Ōita-ken'],
    '宮崎縣': ['みやざきけん', 'Miyazaki-ken'], '鹿兒島縣': ['かごしまけん', 'Kagoshima-ken'], '沖繩縣': ['おきなわけん', 'Okinawa-ken'], '沖繩縣': ['おきなわけん', 'Okinawa-ken']
};
// 國名讀音：完整（〜のくに / 〜 no Kuni）與地圖用的短讀音
function provReading(prov) {
    const k = PROV_KANA[prov.id] || ['', ''];
    if (prov.id === 'hokkaido_ezo') return { kana: 'えぞち・ほっかいどう', roma: 'Ezochi / Hokkaidō', short: 'えぞち' };
    if (prov.id === 'ryukyu') return { kana: 'りゅうきゅうおうこく', roma: 'Ryūkyū Ōkoku', short: 'りゅうきゅう' };
    return { kana: k[0] + 'のくに', roma: k[1] + ' no Kuni', short: k[0] };
}
function prefReading(name) {
    const k = PREF_KANA[name] || ['', ''];
    return { kana: k[0], roma: k[1], short: k[0] };
}
function displayReading(prov) {
    return showModernPrefecture ? prefReading(shortPref(prov)) : provReading(prov);
}
// 現代視角只取主要對應的都道府縣名（例：「大阪府西南部（堺・岸和田）」→「大阪府」）
function shortPref(prov) {
    let best = null, bestIdx = Infinity;
    PREFECTURES.forEach(name => {
        const i = prov.modernPref.indexOf(name);
        if (i !== -1 && i < bestIdx) { best = name; bestIdx = i; }
    });
    return best || prov.modernPref;
}
// 古名去掉括號補充（例：「磐城國（陸奧南東）」→「磐城國」）
function shortOldName(prov) {
    return prov.name.replace(/（.*?）/g, '');
}
function displayName(prov) {
    return showModernPrefecture ? shortPref(prov) : shortOldName(prov);
}

function createProvinceDioramaLandmarks() {
    MATS.thatch = MATS.thatch || new THREE.MeshStandardMaterial({ color: 0x9c7b4f, roughness: 0.9, flatShading: true });
    const labelsContainer = document.getElementById('labels-container');
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    PROVINCES_DATA.forEach(prov => {
        const node = new THREE.Group();
        node.position.set(prov.mapX, NODE_Y, prov.mapZ);

        const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.40, 0.08, 14), MATS.moundActive);
        mound.position.y = 0.04;
        mound.receiveShadow = true;
        node.add(mound);

        // 主地台：左＝第一座一之宮社殿、右＝第一座代表城郭（依實際建築樣式個別建模）
        const sites = getSites(prov);
        const shrine = buildShrineModel(sites.shrines[0].m);
        shrine.scale.setScalar(0.34);
        shrine.position.set(-0.17, 0.08, 0.0);
        node.add(shrine);

        const castle = buildCastleModel(sites.castles[0].m, prov.castle.hasTenshu);
        castle.scale.setScalar(0.34);
        castle.position.set(0.18, 0.08, -0.02);
        node.add(castle);

        prov._sitePos = {
            shrine: [new THREE.Vector3(prov.mapX - 0.17, NODE_Y, prov.mapZ)],
            castle: [new THREE.Vector3(prov.mapX + 0.18, NODE_Y, prov.mapZ - 0.02)]
        };
        [['shrine', -0.17], ['castle', 0.18]].forEach(([type, x]) => {
            const hit = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.7, 0.76), hitMat);
            hit.position.set(x, 0.3, 0);
            hit.userData.provId = prov.id;
            hit.userData.site = { type, idx: 0 };
            node.add(hit);
            clickableMeshes.push(hit);
        });

        scene.add(node);

        // HTML floating pill label
        const region = getRegion(prov.region);
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        el.innerHTML = `
            <div class="map-label-inner flex flex-col items-center">
                <div class="lbl-pill flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fbf8f3] border border-stone-300/90 shadow-md text-[11px] font-bold text-stone-800 whitespace-nowrap">
                    <span class="w-2 h-2 rounded-full shrink-0" style="background:${region.color}"></span>
                    <span class="lbl-text">${displayName(prov)}</span><span class="lbl-kana text-[9px] font-semibold text-stone-400">${provReading(prov).short}</span>
                    <span class="lbl-stamp hidden">💮</span>
                </div>
                <div class="w-0.5 h-2.5 bg-stone-600/60"></div>
            </div>`;
        el.addEventListener('click', e => {
            e.stopPropagation();
            selectProvince(prov.id);
        });
        labelsContainer.appendChild(el);

        provinceNodeMap.set(prov.id, {
            node, mound, labelEl: el,
            textEl: el.querySelector('.lbl-text'),
            stampEl: el.querySelector('.lbl-stamp'),
            pillEl: el.querySelector('.lbl-pill'),
            anchor: new THREE.Vector3(prov.mapX, NODE_Y + 0.62, prov.mapZ),
            visible: false
        });
    });

    createSatelliteSites(hitMat);
    createGeoLabels();
    createModernLabels();

    // 道區大名牌（全國總覽時顯示）
    REGIONS.filter(r => r.id !== 'all').forEach(r => {
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        el.innerHTML = `
            <div class="map-label-inner">
                <div class="px-3 py-1 rounded-full text-white text-xs font-black shadow-lg whitespace-nowrap border-2 border-white/80" style="background:${r.color}">
                    ${r.shortName}
                </div>
            </div>`;
        el.addEventListener('click', e => {
            e.stopPropagation();
            focusRegion(r.id);
        });
        labelsContainer.appendChild(el);
        regionLabelEls.push({ el, anchor: new THREE.Vector3(r.center.x, NODE_Y + 1.6, r.center.z), visible: false });
    });

    // 選取光環
    selectionRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.018, 6, 40),
        new THREE.MeshBasicMaterial({ color: 0xea580c })
    );
    selectionRing.rotation.x = Math.PI / 2;
    selectionRing.visible = false;
    scene.add(selectionRing);

    refreshStampMarks();
}

const prefLabelEls = [];
const modernRegionLabelEls = [];
function createModernLabels() {
    initModernGeography();
    const container = document.getElementById('labels-container');
    Object.values(PREF_INFO).forEach(info => {
        const region = getRegion(info.region);
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        el.innerHTML = `
            <div class="map-label-inner flex flex-col items-center">
                <div class="pref-pill flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border-2 shadow-md text-xs font-black text-stone-900 whitespace-nowrap" style="border-color:${region.color}">
                    <span class="w-2 h-2 rounded-full" style="background:${region.color}"></span>${info.name}<span class="text-[9px] font-semibold text-stone-400">${prefReading(info.name).kana}</span>
                </div>
                <div class="w-0.5 h-2.5 bg-stone-600/60"></div>
            </div>`;
        el.addEventListener('click', e => {
            e.stopPropagation();
            selectPrefecture(info.name);
        });
        container.appendChild(el);
        prefLabelEls.push({ el, info, anchor: new THREE.Vector3(info.pos.x, NODE_Y + 0.85, info.pos.z) });
    });
    MODERN_REGIONS.forEach(r => {
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        el.innerHTML = `
            <div class="map-label-inner">
                <div class="px-3 py-1 rounded-full text-white text-xs font-black shadow-lg whitespace-nowrap border-2 border-white/80" style="background:${r.color}">${r.shortName}</div>
            </div>`;
        el.addEventListener('click', e => {
            e.stopPropagation();
            focusRegion(r.id);
        });
        container.appendChild(el);
        modernRegionLabelEls.push({ el, anchor: new THREE.Vector3(r.center.x, NODE_Y + 1.6, r.center.z) });
    });
}

function createGeoLabels() {
    const container = document.getElementById('labels-container');
    GEO_LABELS.forEach(g => {
        const el = document.createElement('div');
        el.className = 'map-label';
        el.style.opacity = '0';
        const style = g.type === 'mountain'
            ? 'text-stone-700 bg-white/75 border-stone-300/80'
            : 'text-sky-900 bg-sky-50/85 border-sky-200';
        const icon = g.type === 'mountain' ? '▲' : g.type === 'lake' ? '◍' : '〰';
        el.innerHTML = `
            <div class="map-label-inner">
                <div class="px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide whitespace-nowrap border shadow-sm font-serif-jp ${style}">
                    <span class="${g.type === 'mountain' ? 'text-emerald-700' : 'text-sky-600'}">${icon}</span> ${g.name}
                </div>
            </div>`;
        el.style.pointerEvents = 'none';
        container.appendChild(el);
        g.el = el;
        g.anchor = new THREE.Vector3(g.x, g.y, g.z);
    });
}

// 一國有多座一之宮或代表城郭時，其餘每一座各自擺在主地台周圍的小地台上
const siteLabels = [];
function createSatelliteSites(hitMat) {
    const placed = [];
    const RING = [0.68, 1.02];
    PROVINCES_DATA.forEach(prov => {
        const sites = getSites(prov);
        const extras = [];
        sites.shrines.slice(1).forEach((s, i) => extras.push({ type: 'shrine', idx: i + 1, site: s }));
        sites.castles.slice(1).forEach((c, i) => extras.push({ type: 'castle', idx: i + 1, site: c }));
        extras.forEach((ex, exIdx) => {
            // 前 6 座排在內圈，再多的放到外圈
            const R = exIdx < 6 ? RING[0] : RING[1];
            let best = null;
            for (let deg = 0; deg < 360; deg += 15) {
                const a = deg * Math.PI / 180;
                const x = prov.mapX + Math.cos(a) * R;
                const z = prov.mapZ - Math.sin(a) * R;
                let clear = Infinity;
                PROVINCES_DATA.forEach(o => { if (o.id !== prov.id) clear = Math.min(clear, Math.hypot(o.mapX - x, o.mapZ - z) - 0.42); });
                placed.forEach(p => { clear = Math.min(clear, Math.hypot(p.x - x, p.z - z) - 0.4); });
                const sideBonus = (ex.type === 'shrine' ? -Math.cos(a) : Math.cos(a)) * 0.08 + Math.sin(a) * 0.04;
                const onLand = ISLAND_POLYS.some(pl => pointInPoly(x, z, pl)) ? 0.15 : 0;
                const wet = inLake(x, z, 0.25) ? -0.6 : 0;
                const buried = mountainOccluders.some(m => Math.hypot(m.x - x, m.z - z) < m.r * 0.85 + 0.2) ? -0.6 : 0;
                const score = Math.min(clear, 0.6) + sideBonus + onLand + wet + buried;
                if (!best || score > best.score) best = { x, z, score };
            }
            placed.push(best);
            const g = new THREE.Group();
            g.position.set(best.x, NODE_Y, best.z);
            const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.06, 12), MATS.moundActive);
            mound.position.y = 0.03;
            mound.receiveShadow = true;
            g.add(mound);
            const model = ex.type === 'shrine' ? buildShrineModel(ex.site.m) : buildCastleModel(ex.site.m);
            model.scale.setScalar(0.27);
            model.position.y = 0.06;
            g.add(model);
            const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.6, 8), hitMat);
            hit.position.y = 0.25;
            hit.userData.provId = prov.id;
            hit.userData.site = { type: ex.type, idx: ex.idx };
            g.add(hit);
            clickableMeshes.push(hit);
            scene.add(g);
            // 主地台與附屬地台之間的參道小徑
            const path = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, Math.hypot(best.x - prov.mapX, best.z - prov.mapZ) - 0.5), MATS.paver);
            path.position.set((best.x + prov.mapX) / 2, NODE_Y + 0.005, (best.z + prov.mapZ) / 2);
            path.rotation.y = Math.atan2(best.x - prov.mapX, best.z - prov.mapZ);
            scene.add(path);
            provinceNodeMap.get(prov.id).satellites = (provinceNodeMap.get(prov.id).satellites || []).concat(mound);
            prov._sitePos[ex.type][ex.idx] = new THREE.Vector3(best.x, NODE_Y, best.z);
        });
    });

    // 每一座神社、城郭各自的小名牌（選取該國時顯示）
    const container = document.getElementById('labels-container');
    PROVINCES_DATA.forEach(prov => {
        const sites = getSites(prov);
        ['shrine', 'castle'].forEach(type => {
            const list = type === 'shrine' ? sites.shrines : sites.castles;
            list.forEach((s, idx) => {
                const pos = prov._sitePos[type][idx];
                if (!pos) return;
                const el = document.createElement('div');
                el.className = 'map-label';
                el.style.opacity = '0';
                el.innerHTML = `
                    <div class="map-label-inner">
                        <div class="px-2 py-0.5 rounded-full text-[10px] font-bold shadow whitespace-nowrap border ${type === 'shrine' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-900 border-amber-200'}">
                            ${type === 'shrine' ? '⛩️' : '🏯'} ${s.short}
                        </div>
                    </div>`;
                el.addEventListener('click', e => {
                    e.stopPropagation();
                    selectProvince(prov.id, true, { type, idx });
                });
                container.appendChild(el);
                siteLabels.push({ el, provId: prov.id, anchor: pos.clone().setY(NODE_Y + (idx === 0 ? 0.42 : 0.36)) });
            });
        });
    });
}

function createGokishichidoRoutes() {
    routeLinesGroup = new THREE.Group();
    const done = new Set();
    PROVINCES_DATA.forEach(prov => {
        prov.neighbors.forEach(nid => {
            const key = [prov.id, nid].sort().join('|');
            if (done.has(key)) return;
            done.add(key);
            const other = getProv(nid);
            if (!other) return;
            // 起訖點設在地台邊緣，避免驛道線穿過社殿與城郭
            const ca = new THREE.Vector3(prov.mapX, NODE_Y + 0.05, prov.mapZ);
            const cb = new THREE.Vector3(other.mapX, NODE_Y + 0.05, other.mapZ);
            const dir = cb.clone().sub(ca).setY(0).normalize();
            const a = ca.clone().addScaledVector(dir, 0.42);
            const b = cb.clone().addScaledVector(dir, -0.42);
            const mid = a.clone().lerp(b, 0.5);
            mid.y += 0.18 + a.distanceTo(b) * 0.1;
            const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
            const color = prov.region === other.region ? getRegion(prov.region).color : '#f8fafc';
            const tube = new THREE.Mesh(
                new THREE.TubeGeometry(curve, 20, 0.012, 5, false),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62 })
            );
            routeLinesGroup.add(tube);
        });
    });
    routeLinesGroup.visible = showHighwayLines;
    scene.add(routeLinesGroup);
}
