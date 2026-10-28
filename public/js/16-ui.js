// 索引、介紹卡、照片
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 7. UI: REGION PILLS, INDEX LIST, DETAIL CARD & NAVIGATION
 ***********************************************************************/
function matchesSearch(prov, q) {
    const sites = getSites(prov);
    const pr = provReading(prov);
    const hay = [prov.name, prov.romaji, prov.modernPref, prov.regionName, prov.geoFeature, pr.kana, pr.roma,
        ...sites.shrines.map(s => s.n), ...sites.castles.map(c => c.n)].join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
}

function renderRegionPills() {
    const bar = document.getElementById('region-pills-bar');
    bar.innerHTML = '';
    regionsForMode().forEach(r => {
        const active = currentRegion === r.id;
        const btn = document.createElement('button');
        btn.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition shrink-0 ' +
            (active ? 'text-white shadow-sm' : 'bg-white/90 text-stone-600 border border-stone-200 hover:text-stone-900');
        if (active) btn.style.background = r.color;
        btn.textContent = r.shortName;
        btn.onclick = () => (r.id === 'all' ? resetToAllRegions() : focusRegion(r.id));
        bar.appendChild(btn);
    });
}

function prefMatchesSearch(info, q) {
    const ql = q.toLowerCase();
    return info.name.toLowerCase().includes(ql) || info.provinces.concat(info.partial).some(id => matchesSearch(getProv(id), q));
}

// 現代模式目錄：以八地方→都道府縣排列，每縣列出古代所屬的令制國
function renderPrefIndexList(box, q) {
    let html = '';
    MODERN_REGIONS.forEach(r => {
        if (!q && currentRegion !== 'all' && currentRegion !== r.id) return;
        const prefs = r.prefs.map(n => PREF_INFO[n]).filter(info => !q || prefMatchesSearch(info, q));
        if (!prefs.length) return;
        html += `<div class="pt-2 pb-0.5 px-1 text-[10px] font-black tracking-wider" style="color:${r.color}">${r.name}（${r.prefs.length}）</div>`;
        prefs.forEach(info => {
            const active = info.name === selectedPref || (selectedProvinceId && shortPref(getProv(selectedProvinceId)) === info.name);
            const olds = info.provinces.map(id => shortOldName(getProv(id)))
                .concat(info.partial.map(id => shortOldName(getProv(id)) + '（部分）'));
            const stamped = info.provinces.filter(id => stampedProvinces.has(id)).length;
            html += `
                <button onclick="selectPrefecture('${info.name}')" class="w-full text-left px-3 py-2 rounded-2xl border transition flex items-center gap-2.5 ${active ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-white/80 border-stone-200/80 hover:border-teal-300 hover:bg-white'}">
                    <span class="w-1 self-stretch rounded-full shrink-0" style="background:${r.color}"></span>
                    <span class="flex-1 min-w-0">
                        <span class="flex items-baseline justify-between gap-2">
                            <span><span class="font-serif-jp font-black text-sm text-stone-900">${info.name}</span><span class="text-[10px] text-stone-400 font-bold ml-1">${prefReading(info.name).kana}</span></span>
                            <span class="text-[10px] text-stone-400 shrink-0">${info.provinces.length ? info.provinces.length + ' 國' : '部分'}</span>
                        </span>
                        <span class="block text-[11px] text-stone-500 truncate mt-0.5">古：${olds.join('・')}</span>
                    </span>
                    ${stamped ? `<span class="text-[11px] font-bold text-red-700 shrink-0">💮${stamped}</span>` : ''}
                </button>`;
        });
    });
    box.innerHTML = html || `<div class="text-center text-xs text-stone-400 py-10">找不到符合「${q}」的都道府縣</div>`;
}

function renderIndexList() {
    const box = document.getElementById('index-list-container');
    const q = searchQuery;
    if (showModernPrefecture) {
        renderPrefIndexList(box, q);
        return;
    }
    const list = PROVINCES_DATA.filter(p => q ? matchesSearch(p, q) : (currentRegion === 'all' || p.region === currentRegion));
    if (!list.length) {
        box.innerHTML = `<div class="text-center text-xs text-stone-400 py-10">找不到符合「${q}」的令制國</div>`;
        return;
    }
    let html = '';
    let lastRegion = null;
    list.forEach(p => {
        const r = getRegion(p.region);
        if (p.region !== lastRegion) {
            lastRegion = p.region;
            html += `<div class="pt-2 pb-0.5 px-1 text-[10px] font-black tracking-wider" style="color:${r.color}">${r.name}</div>`;
        }
        const active = p.id === selectedProvinceId;
        const stamped = stampedProvinces.has(p.id);
        html += `
            <button onclick="selectProvince('${p.id}')" class="w-full text-left px-3 py-2 rounded-2xl border transition flex items-center gap-2.5 ${active ? 'bg-orange-50 border-orange-300 shadow-sm' : 'bg-white/80 border-stone-200/80 hover:border-orange-300 hover:bg-white'}">
                <span class="w-1 self-stretch rounded-full shrink-0" style="background:${r.color}"></span>
                <span class="flex-1 min-w-0">
                    <span class="flex items-baseline justify-between gap-2">
                        <span class="truncate"><span class="font-serif-jp font-black text-sm text-stone-900">${displayName(p)}</span><span class="text-[10px] text-stone-400 font-bold ml-1">${displayReading(p).short}</span></span>
                        <span class="text-[10px] text-stone-400 truncate shrink-0 max-w-[45%]">${showModernPrefecture ? shortOldName(p) : shortPref(p)}</span>
                    </span>
                    <span class="block text-[11px] text-stone-500 truncate mt-0.5">⛩️ ${siteNames(p, 'shrine')}　🏯 ${siteNames(p, 'castle')}</span>
                </span>
                ${stamped ? '<span class="text-base shrink-0" title="已巡拜">💮</span>' : ''}
            </button>`;
    });
    box.innerHTML = html;
}

function updateBreadcrumb() {
    const sep1 = document.getElementById('bc-sep-1');
    const regBtn = document.getElementById('bc-region-btn');
    const sep2 = document.getElementById('bc-sep-2');
    const provName = document.getElementById('bc-prov-name');
    const hasRegion = currentRegion !== 'all';
    sep1.classList.toggle('hidden', !hasRegion);
    regBtn.classList.toggle('hidden', !hasRegion);
    if (hasRegion) regBtn.textContent = getRegion(currentRegion).shortName;
    const prov = selectedProvinceId ? getProv(selectedProvinceId) : null;
    const label = prov ? (showModernPrefecture ? `${shortPref(prov)} / ${shortOldName(prov)}` : displayName(prov)) : selectedPref;
    sep2.classList.toggle('hidden', !label);
    provName.classList.toggle('hidden', !label);
    if (label) provName.textContent = label;
}

function updateMoundHighlight() {
    PROVINCES_DATA.forEach(p => {
        const info = provinceNodeMap.get(p.id);
        if (!info) return;
        const active = currentRegion === 'all' || provRegion(p) === currentRegion;
        info.mound.material = active ? MATS.moundActive : MATS.moundDim;
        (info.satellites || []).forEach(m => { m.material = info.mound.material; });
    });
}

function refreshUI() {
    renderRegionPills();
    renderIndexList();
    updateBreadcrumb();
    updateMoundHighlight();
}

function openDetailCard() {
    setCardVisible('left-detail-card', true);
}

function closeDetailCard() {
    setCardVisible('left-detail-card', false);
    selectedProvinceId = null;
    if (selectionRing) selectionRing.visible = false;
    refreshUI();
}

function fillDetailCard(prov) {
    const region = getRegion(provRegion(prov));
    const pill = document.getElementById('dc-region-pill');
    pill.textContent = showModernPrefecture ? region.name : prov.regionName;
    pill.style.backgroundColor = region.color;
    const alias = (prov.romaji.match(/（(.*?)）|\((.*?)\)/) || []).slice(1).find(Boolean);
    document.getElementById('dc-romaji').textContent = alias ? `別稱：${alias}` : '';
    const rd = displayReading(prov);
    document.getElementById('dc-kana').textContent = rd.kana;
    document.getElementById('dc-roma').textContent = rd.roma;
    document.getElementById('dc-title').textContent = displayName(prov);
    document.getElementById('dc-modern-pref').textContent = showModernPrefecture ? `古：${prov.name}` : `今：${prov.modernPref}`;
    document.getElementById('dc-geo-desc').textContent = `📍 ${prov.geoFeature}｜${prov.desc}`;

    renderSiteCards(prov);
    renderDetailWeather(prov);

    const nb = document.getElementById('dc-neighbors');
    nb.innerHTML = '';
    prov.neighbors.forEach(nid => {
        const n = getProv(nid);
        if (!n) return;
        const btn = document.createElement('button');
        btn.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 hover:bg-orange-100 hover:text-orange-700 text-stone-700 border border-stone-200 transition flex items-center gap-1';
        btn.innerHTML = `<span class="w-1.5 h-1.5 rounded-full" style="background:${getRegion(n.region).color}"></span>${displayName(n)}`;
        btn.onclick = () => selectProvince(n.id);
        nb.appendChild(btn);
    });
    if (!prov.neighbors.length) nb.innerHTML = '<span class="text-[11px] text-stone-400">（離島，無陸路相鄰國）</span>';

    updateStampButton();
    switchDetailTab(currentDetailTab);
}

// 一社一城各自一張介紹卡
function renderSiteCards(prov) {
    const sites = getSites(prov);
    const row = (label, value, cls = 'text-stone-800 font-bold') => `
        <div class="pt-1.5 first:pt-0 border-t first:border-t-0 border-stone-100">
            <span class="text-stone-400 font-bold block text-[10px]">【${label}】</span>
            <span class="${cls} mt-0.5 block">${value}</span>
        </div>`;
    const nav = (type, list) => list.length < 2 ? '' : list.map((s, i) => `
        <button onclick="focusSite('${prov.id}', '${type}', ${i})" class="px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${type === 'shrine' ? 'bg-white border-red-200 text-red-800 hover:bg-red-50' : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-50'}">
            ${type === 'shrine' ? '⛩️' : '🏯'} ${s.short}
        </button>`).join('');
    const mapBtn = (type, i) => `<button onclick="focusSite('${prov.id}', '${type}', ${i})" class="text-[11px] font-bold text-stone-500 hover:text-orange-600 underline underline-offset-2">📍 在地圖上看這座</button>`;

    document.getElementById('dc-shrine-nav').innerHTML = nav('shrine', sites.shrines);
    document.getElementById('dc-castle-nav').innerHTML = nav('castle', sites.castles);
    document.getElementById('tab-count-shrine').textContent = sites.shrines.length > 1 ? `×${sites.shrines.length}` : '';
    document.getElementById('tab-count-castle').textContent = sites.castles.length > 1 ? `×${sites.castles.length}` : '';

    document.getElementById('dc-shrine-list').innerHTML = sites.shrines.map((s, i) => `
        <div id="site-shrine-${i}" class="site-card p-4 rounded-2xl bg-red-50/75 border border-red-200/90 space-y-3 transition-shadow duration-500">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-black tracking-wider text-red-700">⛩️ ${s.r}${sites.shrines.length > 1 ? `　${i + 1} / ${sites.shrines.length}` : ''}</span>
                ${mapBtn('shrine', i)}
            </div>

            <div class="site-photo relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-200/70 animate-pulse" data-prov="${prov.id}" data-type="shrine" data-idx="${i}"></div>
            <h3 class="text-lg font-serif-jp font-black text-stone-900 leading-snug">${s.n}</h3>
            <div class="grid grid-cols-1 gap-2 text-xs bg-white/95 p-3 rounded-xl border border-red-100">
                ${row('主祭神', s.d)}
                ${row('御神德・祈願利益', s.v, 'text-red-700 font-bold')}
                ${row('鎮座地', s.a, 'text-stone-700 font-medium')}
            </div>
            <div>
                <div class="text-[11px] font-bold text-stone-500 mb-1">神社建築與歷史看點</div>
                <p class="text-xs text-stone-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-red-100/80">${s.t}</p>
            </div>
            <button id="stamp-shrine-${i}" onclick="toggleSiteStamp('${prov.id}', 'shrine', ${i})" class="w-full"></button>
        </div>`).join('') + `
        <a href="https://ichinomiya-junpai.jp/" target="_blank" rel="noopener noreferrer" class="inline-block text-[11px] font-bold text-red-600 underline hover:text-red-800">全國一之宮巡拜會官網 ↗</a>`;

    document.getElementById('dc-castle-list').innerHTML = sites.castles.map((c, i) => `
        <div id="site-castle-${i}" class="site-card p-4 rounded-2xl bg-amber-50/75 border border-amber-200/90 space-y-3 transition-shadow duration-500">
            <div class="flex items-center justify-between gap-2">
                <span class="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-950 text-[10px] font-bold">${c.b}</span>
                ${mapBtn('castle', i)}
            </div>

            <div class="site-photo relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-200/70 animate-pulse" data-prov="${prov.id}" data-type="castle" data-idx="${i}"></div>
            <h3 class="text-lg font-serif-jp font-black text-stone-900 leading-snug">${c.n}${sites.castles.length > 1 ? `<span class="text-xs text-stone-400 font-sans ml-1.5">${i + 1} / ${sites.castles.length}</span>` : ''}</h3>
            <div class="grid grid-cols-1 gap-2 text-xs bg-white/95 p-3 rounded-xl border border-amber-100">
                ${row('城郭結構與特色', c.y + (c.m && c.m.k === 'T' ? '（有天守）' : ''))}
                ${row('歷代築城主・代表城主', c.l, 'text-amber-900 font-bold')}
            </div>
            <div>
                <div class="text-[11px] font-bold text-stone-500 mb-1">名城歷史與建築看點</div>
                <p class="text-xs text-stone-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-100/80">${c.t}</p>
            </div>
            <button id="stamp-castle-${i}" onclick="toggleSiteStamp('${prov.id}', 'castle', ${i})" class="w-full"></button>
        </div>`).join('');
    refreshSiteStampButtons(prov);
    loadSitePhotos();
}

/* ---------- 介紹卡的實景照片：日文維基百科（Wikimedia Commons）---------- */
// 名稱 → 日文維基百科條目（繁體字、同名異地已事先比對好）
const WIKI_TITLES = {"ryukyu|波上宮": "波上宮", "ryukyu|普天滿宮": "普天満宮", "ryukyu|齋場御嶽": "斎場御嶽", "ryukyu|首里城": "首里城", "ryukyu|中城城": "中城城", "ryukyu|今歸仁城": "今帰仁城", "ryukyu|座喜味城": "座喜味城", "ryukyu|勝連城": "勝連城", "yamashiro|賀茂別雷神社": "賀茂別雷神社", "yamashiro|賀茂御祖神社": "賀茂御祖神社", "yamashiro|伏見稻荷大社": "伏見稲荷大社", "yamashiro|八坂神社": "八坂神社", "yamashiro|石清水八幡宮": "石清水八幡宮", "yamashiro|北野天滿宮": "北野天満宮", "yamashiro|貴船神社": "貴船神社", "yamashiro|平安神宮": "平安神宮", "yamashiro|伏見城": "伏見城", "yamato|大神神社": "大神神社", "yamato|春日大社": "春日大社", "yamato|石上神宮": "石上神宮", "yamato|橿原神宮": "橿原神宮", "yamato|高取城": "高取城", "yamato|大和郡山城": "郡山城 (大和国)", "kawachi|枚岡神社": "枚岡神社", "kawachi|千早城": "千早城", "kawachi|赤坂城": "赤坂城", "izumi|大鳥大社": "大鳥大社", "izumi|岸和田城": "岸和田城", "settsu|住吉大社": "住吉大社", "settsu|坐摩神社": "坐摩神社", "settsu|大坂城": "大坂城", "iga|敢國神社": "敢國神社", "iga|伊賀上野城": "上野城", "ise|椿大神社": "椿大神社", "ise|都波岐奈加等神社": "都波岐神社・奈加等神社", "ise|伊勢神宮 內宮": "皇大神宮", "ise|伊勢神宮 外宮": "豊受大神宮", "ise|松阪城": "松坂城", "ise|津城": "津城", "shima|伊雜宮": "伊雑宮", "shima|伊射波神社": "伊射波神社", "shima|鳥羽城": "鳥羽城", "owari|真清田神社": "真清田神社", "owari|大神神社": "大神神社 (一宮市)", "owari|熱田神宮": "熱田神宮", "owari|犬山城": "犬山城", "owari|名古屋城": "名古屋城", "mikawa|砥鹿神社": "砥鹿神社", "mikawa|岡崎城": "岡崎城", "mikawa|長篠城": "長篠城", "totomi|小國神社": "小国神社", "totomi|事任八幡宮": "事任八幡宮", "totomi|掛川城": "掛川城", "totomi|濱松城": "浜松城", "totomi|高天神城": "高天神城", "suruga|富士山本宮淺間大社": "富士山本宮浅間大社", "suruga|駿府城": "駿府城", "suruga|興國寺城": "興国寺城", "izu|三嶋大社": "三嶋大社", "izu|山中城": "山中城", "izu|韮山城": "韮山城", "kai|淺間神社": "浅間神社", "kai|北口本宮冨士淺間神社": "北口本宮冨士浅間神社", "kai|武田氏館": "武田氏館", "kai|甲府城": "甲府城", "sagami|寒川神社": "寒川神社", "sagami|鶴岡八幡宮": "鶴岡八幡宮", "sagami|箱根神社": "箱根神社", "sagami|小田原城": "小田原城", "musashi|冰川神社": "氷川神社", "musashi|小野神社": "小野神社 (多摩市)", "musashi|明治神宮": "明治神宮", "musashi|三峯神社": "三峯神社", "musashi|江戶城": "江戸城", "musashi|川越城": "川越城", "musashi|鉢形城": "鉢形城", "awa_chiba|安房神社": "安房神社", "awa_chiba|洲崎神社": "洲崎神社", "awa_chiba|館山城": "館山城", "kazusa|玉前神社": "玉前神社", "kazusa|大多喜城": "大多喜城", "kazusa|久留里城": "久留里城", "shimosa|香取神宮": "香取神宮", "shimosa|佐倉城": "佐倉城", "hitachi|鹿島神宮": "鹿島神宮", "hitachi|大洗磯前神社": "大洗磯前神社", "hitachi|水戶城": "水戸城", "omi|建部大社": "建部大社", "omi|日吉大社": "日吉大社", "omi|多賀大社": "多賀大社", "omi|都久夫須麻神社": "都久夫須麻神社", "omi|彥根城": "彦根城", "omi|安土城": "安土城", "omi|觀音寺城": "観音寺城", "mino|南宮大社": "南宮大社", "mino|岐阜城": "岐阜城", "mino|岩村城": "岩村城", "hida|飛驒一宮 水無神社": "水無神社", "hida|高山城": "高山城 (飛騨国)", "hida|神岡城": "神岡城", "shinano|諏訪大社 上社本宮": "諏訪大社", "shinano|諏訪大社 上社前宮": "諏訪大社", "shinano|諏訪大社 下社秋宮": "諏訪大社", "shinano|諏訪大社 下社春宮": "諏訪大社", "shinano|戶隱神社": "戸隠神社", "shinano|松本城": "松本城", "shinano|上田城": "上田城", "shinano|松代城": "松代城", "shinano|小諸城": "小諸城", "kozuke|一之宮 貫前神社": "一之宮貫前神社", "kozuke|箕輪城": "箕輪城", "kozuke|金山城": "金山城", "shimotsuke|日光二荒山神社": "日光二荒山神社", "shimotsuke|宇都宮二荒山神社": "宇都宮二荒山神社", "shimotsuke|日光東照宮": "日光東照宮", "shimotsuke|足利氏館": "鑁阿寺", "iwaki|八槻都都古別神社": "都々古別神社", "iwaki|馬場都都古別神社": "都々古別神社", "iwaki|白河小峰城": "白河小峰城", "iwashiro|伊佐須美神社": "伊佐須美神社", "iwashiro|會津若松城": "若松城", "iwashiro|二本松城": "二本松城", "rikuzen|鹽竈神社": "鹽竈神社", "rikuzen|仙台城": "仙台城", "rikuzen|多賀城": "多賀城", "rikuchu|駒形神社": "駒形神社", "rikuchu|盛岡城": "盛岡城", "mutsu_aomori|岩木山神社": "岩木山神社", "mutsu_aomori|弘前城": "弘前城", "mutsu_aomori|根城": "根城", "uzen|出羽神社": "出羽神社", "uzen|月山神社": "月山神社", "uzen|湯殿山神社": "湯殿山神社", "uzen|山形城": "山形城", "uzen|米澤城": "米沢城", "ugo|鳥海山大物忌神社": "鳥海山大物忌神社", "ugo|久保田城": "久保田城", "wakasa|若狹姬神社": "若狭彦神社", "wakasa|小濱城": "小浜城", "wakasa|後瀨山城": "後瀬山城", "echizen|氣比神宮": "氣比神宮", "echizen|丸岡城": "丸岡城", "echizen|一乘谷朝倉氏遺跡": "一乗谷朝倉氏遺跡", "kaga|白山比咩神社": "白山比咩神社", "kaga|金澤城": "金沢城", "noto|氣多大社": "気多大社", "noto|七尾城": "七尾城", "etchu|高瀨神社・氣多神社・射水神社・雄山神社": "高瀬神社", "etchu|高岡城": "高岡城", "echigo|彌彥神社": "彌彦神社", "echigo|居多神社": "居多神社", "echigo|春日山城": "春日山城", "echigo|新發田城": "新発田城", "sado|度津神社": "度津神社", "sado|佐渡奉行所": "佐渡奉行", "sado|雜太城": "雑太城", "tanba|出雲大神宮": "出雲大神宮", "tanba|篠山城": "篠山城", "tanba|福知山城": "福知山城", "tango|元伊勢 籠神社": "籠神社", "tango|田邊城": "田辺城 (丹後国)", "tango|宮津城": "宮津城", "tajima|出石神社": "出石神社", "tajima|粟鹿神社": "粟鹿神社", "tajima|竹田城": "竹田城", "tajima|出石城": "出石城", "inaba|宇倍神社": "宇倍神社", "inaba|鳥取城": "鳥取城", "hoki|倭文神社": "倭文神社 (湯梨浜町)", "hoki|米子城": "米子城", "izumo|出雲大社": "出雲大社", "izumo|熊野大社": "熊野大社", "izumo|美保神社": "美保神社", "izumo|松江城": "松江城", "izumo|月山富田城": "月山富田城", "iwami|物部神社": "物部神社", "iwami|津和野城": "津和野城", "iwami|濱田城": "浜田城", "oki|水若酢神社": "水若酢神社", "oki|由良比女神社": "由良比女神社", "oki|黑木御所跡": "黒木御所", "oki|隱岐國分寺": "隠岐国分寺", "harima|伊和神社": "伊和神社", "harima|姬路城": "姫路城", "harima|赤穗城": "赤穂城", "harima|明石城": "明石城", "mimasaka|中山神社": "中山神社", "mimasaka|津山城": "津山城", "bizen|吉備津彥神社": "吉備津彦神社", "bizen|石上布都魂神社": "石上布都魂神社", "bizen|岡山城": "岡山城", "bitchu|吉備津神社": "吉備津神社", "bitchu|備中松山城": "備中松山城", "bitchu|鬼之城": "鬼ノ城", "bingo|吉備津神社": "吉備津神社 (福山市)", "bingo|素盞嗚神社": "素盞嗚神社", "bingo|福山城": "福山城", "aki|嚴島神社": "厳島神社", "aki|廣島城": "広島城", "aki|吉田郡山城": "吉田郡山城", "suo|玉祖神社": "玉祖神社", "suo|岩國城": "岩国城", "nagato|住吉神社": "住吉神社 (下関市)", "nagato|萩城": "萩城", "kii|日前神宮": "日前神宮・國懸神宮", "kii|國懸神宮": "日前神宮・國懸神宮", "kii|伊太祁曾神社": "伊太祁曽神社", "kii|丹生都比賣神社": "丹生都比売神社", "kii|熊野本宮大社": "熊野本宮大社", "kii|熊野速玉大社": "熊野速玉大社", "kii|熊野那智大社": "熊野那智大社", "kii|和歌山城": "和歌山城", "awaji|伊弉諾神宮": "伊弉諾神宮", "awaji|洲本城": "洲本城", "awa_tokushima|大麻比古神社": "大麻比古神社", "awa_tokushima|一宮神社": "一宮神社 (徳島市)", "awa_tokushima|上一宮大粟神社": "上一宮大粟神社", "awa_tokushima|德島城": "徳島城", "awa_tokushima|一宮城": "一宮城 (阿波国)", "sanuki|田村神社": "田村神社", "sanuki|金刀比羅宮": "金刀比羅宮", "sanuki|丸龜城": "丸亀城", "sanuki|高松城": "高松城", "sanuki|屋嶋城": "屋嶋城", "iyo|大山祇神社": "大山祇神社", "iyo|伊予松山城": "松山城", "iyo|宇和島城": "宇和島城", "iyo|今治城": "今治城", "tosa|土佐神社": "土佐神社", "tosa|高知城": "高知城", "chikuzen|住吉神社": "住吉神社 (福岡市)", "chikuzen|筥崎宮": "筥崎宮", "chikuzen|太宰府天滿宮": "太宰府天満宮", "chikuzen|宗像大社": "宗像大社", "chikuzen|福岡城": "福岡城", "chikuzen|大野城": "大野城", "chikuzen|水城": "水城", "chikugo|高良大社": "高良大社", "chikugo|久留米城": "久留米城", "chikugo|柳川城": "柳川城", "buzzen|宇佐神宮": "宇佐神宮", "buzzen|小倉城": "小倉城", "buzzen|中津城": "中津城", "bungo|柞原八幡宮": "柞原八幡宮", "bungo|西寒多神社": "西寒多神社", "bungo|岡城": "岡城", "bungo|大分府內城": "府内城", "hizen|與止日女神社": "與止日女神社", "hizen|千栗八幡宮": "千栗八幡宮", "hizen|佐賀城": "佐賀城", "hizen|名護屋城": "名護屋城", "hizen|吉野ヶ里遺跡": "吉野ヶ里遺跡", "hizen|平戶城": "平戸城", "hizen|島原城": "島原城", "higo|阿蘇神社": "阿蘇神社", "higo|熊本城": "熊本城", "higo|人吉城": "人吉城", "hyuga|都農神社": "都農神社", "hyuga|高千穗神社": "高千穂神社", "hyuga|鵜戶神宮": "鵜戸神宮", "hyuga|飫肥城": "飫肥城", "osumi|鹿兒島神宮": "鹿児島神宮", "osumi|霧島神宮": "霧島神宮", "osumi|高山城": "高山城 (大隅国)", "satsuma|新田神社": "新田神社", "satsuma|枚聞神社": "枚聞神社", "satsuma|鹿兒島城": "鹿児島城", "satsuma|知覽城": "知覧城", "iki|天手長男神社": "天手長男神社", "iki|興神社": "興神社", "iki|勝本城": "勝本城", "tsushima|海神神社": "海神神社", "tsushima|嚴原八幡宮神社": "厳原八幡宮神社", "tsushima|金田城": "金田城", "tsushima|清水山城": "清水山城", "hokkaido_ezo|北海道神宮": "北海道神宮", "hokkaido_ezo|五稜郭": "五稜郭", "hokkaido_ezo|松前城": "松前城", "hokkaido_ezo|根室半島チャシ跡群": "根室半島チャシ跡群", "yamashiro|二條城": "二条城", "wakasa|若狹彥神社": "若狭彦神社"};
const _wikiCache = {};
// 同一國的照片合併成一次查詢（減少對維基百科的請求次數）
function wikiPhotos(titles) {
    const need = [...new Set(titles)].filter(t => !_wikiCache[t]);
    if (need.length) {
        const url = 'https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=800&titles=' + encodeURIComponent(need.join('|'));
        const req = fetch(url).then(r => r.json()).then(d => {
            const q = d.query || {};
            const alias = {};
            (q.normalized || []).concat(q.redirects || []).forEach(m => { alias[m.from] = m.to; });
            const pages = {};
            Object.values(q.pages || {}).forEach(pg => { pages[pg.title] = pg; });
            const res = {};
            need.forEach(t => {
                let k = t;
                for (let n = 0; n < 3 && alias[k]; n++) k = alias[k];
                const pg = pages[k];
                res[t] = pg && pg.missing === undefined ? { title: pg.title, src: pg.thumbnail && pg.thumbnail.source, file: pg.pageimage } : null;
            });
            return res;
        });
        need.forEach(t => {
            _wikiCache[t] = req.then(res => res[t]).catch(() => { delete _wikiCache[t]; return null; });
        });
    }
    return titles.map(t => _wikiCache[t]);
}
// 沒有照片時，拍一張地圖上的 3D 模型當替代
const _modelThumbCache = {};
function renderSiteModelThumb(type, spec, key) {
    if (_modelThumbCache[key] !== undefined) return _modelThumbCache[key];
    try {
        const w = getWardrobeRenderer();
        const prevChar = w.char;
        if (prevChar) w.scene.remove(prevChar);
        const model = type === 'shrine' ? buildShrineModel(spec) : buildCastleModel(spec, spec && spec.k === 'T');
        model.rotation.y = -0.5;
        w.scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
        const r = Math.max(size.x, size.y, size.z);
        w.renderer.setSize(480, 300, false);
        w.scene.background = new THREE.Color(type === 'shrine' ? 0xf7e4dc : 0xf6ead2);
        w.camera.aspect = 480 / 300;
        w.camera.position.set(c.x + r * 0.9, c.y + r * 0.75, c.z + r * 1.6);
        w.camera.lookAt(c);
        w.camera.updateProjectionMatrix();
        w.renderer.render(w.scene, w.camera);
        _modelThumbCache[key] = w.renderer.domElement.toDataURL('image/png');
        w.scene.remove(model);
        if (prevChar) w.scene.add(prevChar);
    } catch (e) {
        _modelThumbCache[key] = '';
    }
    return _modelThumbCache[key];
}
function loadSitePhotos() {
    const boxes = [...document.querySelectorAll('.site-photo')];
    const titleOf = box => {
        const prov = getProv(box.dataset.prov);
        const site = getSites(prov)[box.dataset.type === 'shrine' ? 'shrines' : 'castles'][+box.dataset.idx];
        return site ? (WIKI_TITLES[prov.id + '|' + site.short] || site.short) : '';
    };
    const reqs = wikiPhotos(boxes.map(titleOf).filter(Boolean));
    const reqOf = {};
    boxes.map(titleOf).filter(Boolean).forEach((t, k) => { reqOf[t] = reqs[k]; });
    boxes.forEach(box => {
        const prov = getProv(box.dataset.prov);
        const type = box.dataset.type, i = +box.dataset.idx;
        const site = getSites(prov)[type === 'shrine' ? 'shrines' : 'castles'][i];
        if (!site) return;
        const title = WIKI_TITLES[prov.id + '|' + site.short] || site.short;
        const done = html => {
            box.classList.remove('animate-pulse', 'bg-stone-200/70');
            box.innerHTML = html;
        };
        const fallback = info => {
            const img = renderSiteModelThumb(type, site.m, prov.id + type + i);
            done((img ? `<img src="${img}" alt="${site.short} 3D 模型" class="w-full h-full object-cover">` : '') + `
                <div class="absolute left-2 bottom-2 px-2 py-0.5 rounded-full bg-white/85 text-[10px] font-bold text-stone-600">維基百科暫無照片，先看 3D 模型${info ? `・<a href="https://ja.wikipedia.org/wiki/${encodeURIComponent(info.title)}" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-600">條目 ↗</a>` : ''}</div>`);
        };
        reqOf[title].then(info => {
            if (!box.isConnected) return;
            if (!info || !info.src) return fallback(info);
            const img = new Image();
            img.onload = () => done(`
                <img src="${info.src}" alt="${site.short} 實景照片" class="w-full h-full object-cover">
                <div class="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between gap-2 text-[10px] text-white/90 font-bold">
                    <span>📷 照片：<a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(info.file || '')}" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">Wikimedia Commons</a></span>
                    <a href="https://ja.wikipedia.org/wiki/${encodeURIComponent(info.title)}" target="_blank" rel="noopener noreferrer" class="underline hover:text-white shrink-0">維基百科 ↗</a>
                </div>`);
            img.onerror = () => fallback(info);
            img.src = info.src;
        });
    });
}

// 切到某一座神社／城郭：切換分頁、捲到該卡片並短暫亮框，鏡頭飛到它在地圖上的位置
function focusSite(provId, type, idx) {
    const prov = getProv(provId);
    if (!prov) return;
    if (selectedProvinceId !== provId) {
        selectProvince(provId, true, { type, idx });
        return;
    }
    switchDetailTab(type);
    const card = document.getElementById(`site-${type}-${idx}`);
    if (card) {
        card.scrollIntoView({ block: 'start', behavior: 'smooth' });
        document.querySelectorAll('.site-card').forEach(el => el.classList.remove('ring-2', 'ring-orange-400'));
        card.classList.add('ring-2', 'ring-orange-400');
        setTimeout(() => card.classList.remove('ring-2', 'ring-orange-400'), 1800);
    }
    const pos = prov._sitePos && prov._sitePos[type][idx];
    if (pos) {
        flyCamera(
            new THREE.Vector3(pos.x - 0.35, NODE_Y + 1.5, pos.z + 1.9),
            new THREE.Vector3(pos.x - 0.35, NODE_Y + 0.1, pos.z)
        );
    }
}

function selectProvince(id, fly = true, focus = null) {
    const prov = getProv(id);
    if (!prov) return;
    selectedProvinceId = id;
    currentRegion = provRegion(prov);
    selectedPref = null;
    setCardVisible('pref-card', false);
    hideWalkerCardOnly();
    if (focus) currentDetailTab = focus.type;
    fillDetailCard(prov);
    openDetailCard();
    refreshUI();
    if (focus) {
        requestAnimationFrame(() => focusSite(id, focus.type, focus.idx));
        fly = fly && focus.idx === 0;
    }

    const info = provinceNodeMap.get(id);
    if (selectionRing && info) {
        selectionRing.position.set(prov.mapX, NODE_Y + 0.06, prov.mapZ);
        selectionRing.visible = true;
    }
    hideTravelerCard();
    if (traveler.to !== id) {
        traveler.from = traveler.arrived ? traveler.to : traveler.at;
        traveler.to = id;
        traveler.arrived = false;
        avatarTargetPos.set(prov.mapX + 0.02, NODE_Y + 0.08, prov.mapZ + 0.36);
        traveler.startDist = Math.max(0.01, avatarGroup.position.distanceTo(avatarTargetPos));
    }

    if (fly) {
        // 拉近到看得清社殿與城郭細節的距離（鏡頭略偏左，讓左側卡片不擋住）
        flyCamera(
            new THREE.Vector3(prov.mapX - 0.45, NODE_Y + 1.9, prov.mapZ + 2.5),
            new THREE.Vector3(prov.mapX - 0.45, NODE_Y + 0.1, prov.mapZ)
        );
    }

    // 讓目錄捲到被選中的項目
    requestAnimationFrame(() => {
        const activeBtn = document.querySelector('#index-list-container .bg-orange-50');
        if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
}
