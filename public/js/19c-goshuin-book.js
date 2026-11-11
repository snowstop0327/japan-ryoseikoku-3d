// 御朱印帳：折本、一覽、滿願
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 御朱印帳的三種看法
 *   折本：像真的蛇腹折帳，一次攤開兩頁，由右往左翻；封面布料可換
 *   一覽：全部神社／城的格子（還沒拜領的也列出來，見 renderGoshuinList）
 *   滿願：成套收集的進度；集滿一套會多一頁「滿願」大印，並解鎖新的封面
 ***********************************************************************/
let goshuinView = 'book';
let goshuinSpread = 0;          // 0 是封面，之後每一格是一個跨頁
const COVER_KEY = 'shinkoku_goshuin_cover_v1';
// 封面布料：前四款一開始就有，後面的靠滿願數解鎖（need = 需要的滿願數）
const GOSHUIN_COVERS = [
    { id: 'ai', name: '藍・麻の葉', hex: '#1e50a2', pattern: 'asanoha', need: 0 },
    { id: 'aka', name: '茜・青海波', hex: '#b7282e', pattern: 'seigaiha', need: 0 },
    { id: 'sumi', name: '墨・無地', hex: '#2b2b2b', pattern: 'plain', need: 0 },
    { id: 'moegi', name: '萌黃・七寶', hex: '#a7b63c', pattern: 'shippo', need: 0 },
    { id: 'sakura', name: '桜色・桜', hex: '#f4b3c2', pattern: 'sakura', need: 1 },
    { id: 'fuji', name: '藤色・矢絣', hex: '#a59aca', pattern: 'yagasuri', need: 2 },
    { id: 'asagi', name: '淺蔥・市松', hex: '#00a3af', pattern: 'ichimatsu', need: 4 },
    { id: 'murasaki', name: '江戶紫・七寶', hex: '#745399', pattern: 'shippo', need: 6 },
    { id: 'kin', name: '山吹・青海波', hex: '#f8b500', pattern: 'seigaiha', need: 9 }
];
let goshuinCover = { shrine: 'aka', castle: 'sumi' };
try { Object.assign(goshuinCover, JSON.parse(localStorage.getItem(COVER_KEY) || '{}')); } catch (e) {}

// ---------- 滿願：成套收集 ----------
const TWELVE_TENSHU = ['姬路城', '松本城', '彥根城', '犬山城', '松江城', '備中松山城', '丸龜城', '伊予松山城', '高知城', '丸岡城', '宇和島城', '弘前城'];
let _manganSets = null;
function manganSets() {
    if (_manganSets) return _manganSets;
    const all = { shrine: allStampSites('shrine'), castle: allStampSites('castle') };
    const named = (type, names, prov) => all[type].filter(x => names.includes(x.site.short) && (!prov || x.prov.id === prov)).map(x => x.key);
    const sets = [
        { id: 'kumano', icon: '🐦‍⬛', name: '熊野三山', note: '本宮・速玉・那智', type: 'shrine', keys: named('shrine', ['熊野本宮大社', '熊野速玉大社', '熊野那智大社']) },
        { id: 'suwa', icon: '🍃', name: '諏訪四社', note: '上社本宮・前宮、下社秋宮・春宮', type: 'shrine', keys: all.shrine.filter(x => x.site.short.startsWith('諏訪大社')).map(x => x.key) },
        { id: 'ise', icon: '🌅', name: '伊勢兩宮', note: '內宮與外宮', type: 'shrine', keys: all.shrine.filter(x => x.site.short.startsWith('伊勢神宮')).map(x => x.key) },
        { id: 'kamo', icon: '🌿', name: '賀茂兩社', note: '上賀茂與下鴨', type: 'shrine', keys: named('shrine', ['賀茂別雷神社', '賀茂御祖神社']) },
        { id: 'dewa', icon: '⛰️', name: '出羽三山', note: '羽黑・月山・湯殿山', type: 'shrine', keys: named('shrine', ['出羽神社', '月山神社', '湯殿山神社']) },
        { id: 'hachiman', icon: '🏹', name: '三大八幡', note: '宇佐・石清水・筥崎', type: 'shrine', keys: named('shrine', ['宇佐神宮', '石清水八幡宮', '筥崎宮']) },
        { id: 'tenjin', icon: '🌸', name: '兩大天滿宮', note: '北野與太宰府', type: 'shrine', keys: named('shrine', ['北野天滿宮', '太宰府天滿宮']) },
        { id: 'tenshu12', icon: '🏯', name: '現存十二天守', note: '江戶時代留存至今的天守', type: 'castle', keys: named('castle', TWELVE_TENSHU) },
        { id: 'tenkabito', icon: '👑', name: '天下人之城', note: '安土・大坂・江戶', type: 'castle', keys: named('castle', ['安土城', '大坂城', '江戶城']) },
        { id: 'gosanke', icon: '🌿', name: '德川御三家之城', note: '名古屋・和歌山・水戶', type: 'castle', keys: named('castle', ['名古屋城', '和歌山城', '水戶城']) },
        { id: 'gusuku', icon: '🌺', name: '琉球的城（グスク）', note: '首里・中城・今歸仁・座喜味・勝連', type: 'castle', keys: all.castle.filter(x => x.prov.id === 'ryukyu').map(x => x.key) }
    ];
    // 每一道的神社、每一道的城各一套
    REGIONS.filter(r => r.id !== 'all').forEach(r => {
        ['shrine', 'castle'].forEach(type => {
            const keys = all[type].filter(x => x.prov.region === r.id).map(x => x.key);
            if (keys.length >= 2) sets.push({ id: `${r.id}-${type}`, icon: type === 'shrine' ? '⛩️' : '🏯', name: `${r.shortName || r.name}${type === 'shrine' ? '神社巡拜' : '名城制霸'}`, note: `${r.name}的全部${type === 'shrine' ? '神社' : '城'}`, type, keys, color: r.color });
        });
    });
    sets.push({ id: 'all-shrine', icon: '💮', name: '全國神社滿願', note: '拜領全部的御朱印', type: 'shrine', keys: all.shrine.map(x => x.key) });
    sets.push({ id: 'all-castle', icon: '🎌', name: '全國名城滿願', note: '拜領全部的御城印', type: 'castle', keys: all.castle.map(x => x.key) });
    _manganSets = sets.filter(s => s.keys.length);
    return _manganSets;
}
const manganGot = s => s.keys.filter(k => stampedSites.has(k)).length;
const manganDone = () => manganSets().filter(s => manganGot(s) === s.keys.length);

// ---------- 封面 ----------
const _coverURL = {};
function coverStyle(type) {
    const c = GOSHUIN_COVERS.find(x => x.id === goshuinCover[type]) || GOSHUIN_COVERS[0];
    _coverURL[c.id] = _coverURL[c.id] || patternSwatchURL(c.hex, c.pattern);
    return `background-color:${c.hex};background-image:url(${_coverURL[c.id]});background-size:56px auto`;
}
function setGoshuinCover(id) {
    const c = GOSHUIN_COVERS.find(x => x.id === id);
    if (!c || manganDone().length < c.need) return;
    goshuinCover[goshuinTab] = id;
    try { localStorage.setItem(COVER_KEY, JSON.stringify(goshuinCover)); } catch (e) {}
    renderGoshuinGrid();
}

// ---------- 折本 ----------
// 頁序：依拜領日期，同一天的照全國順序；最後接上該冊的滿願頁
function goshuinPages(type) {
    const order = {};
    allStampSites(type).forEach((x, i) => { order[x.key] = i; });
    const pages = allStampSites(type).filter(x => stampedSites.has(x.key))
        .sort((a, b) => ((stampMeta[a.key] || {}).d || '').localeCompare((stampMeta[b.key] || {}).d || '') || order[a.key] - order[b.key])
        .map(x => ({ html: goshuinFace(type, x.site, x.prov, stampMeta[x.key]), label: x.site.short, sub: shortOldName(x.prov), go: `closeGoshuinModal(); focusSite('${x.prov.id}', '${type}', ${x.idx})` }));
    manganDone().filter(s => s.type === type).forEach(s => pages.push({ html: manganFace(s), label: `滿願・${s.name}`, sub: s.note }));
    return pages;
}
function manganFace(s) {
    const size = s.name.length <= 4 ? 1.9 : s.name.length <= 7 ? 1.4 : 1.1;
    return `
        <div class="gs-face gs-mangan"><div class="gs-in">
            <span class="gs-hohai">滿願</span>
            <span class="gs-mangan-seal gs-seal">滿<br>願</span>
            <span class="gs-name" style="font-size:${size}em">${s.name}</span>
            <span class="gs-date">成滿</span>
        </div></div>`;
}
function goshuinFlip(d) {
    const pages = goshuinPages(goshuinTab);
    const max = Math.ceil(pages.length / 2);
    const next = Math.max(0, Math.min(max, goshuinSpread + d));
    if (next === goshuinSpread) return;
    goshuinSpread = next;
    renderGoshuinBook(d > 0 ? 'fwd' : 'back');
}
function renderGoshuinBook(flip) {
    const type = goshuinTab, pages = goshuinPages(type);
    const max = Math.ceil(pages.length / 2);
    goshuinSpread = Math.min(goshuinSpread, max);
    const box = document.getElementById('goshuin-book');
    const title = type === 'shrine' ? '御朱印帳' : '御城印帳';
    const done = manganDone().length;
    let body;
    if (goshuinSpread === 0) {
        body = `
            <div class="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
                <button onclick="goshuinFlip(1)" class="gs-cover ${flip ? 'gs-flip-' + flip : ''}" style="${coverStyle(type)}" title="翻開">
                    <span class="gs-cover-title">${title}</span>
                </button>
                <div class="w-full sm:w-56 space-y-2">
                    <div class="text-xs font-black text-stone-700">封面布料</div>
                    <div class="grid grid-cols-5 sm:grid-cols-3 gap-1.5">
                        ${GOSHUIN_COVERS.map(c => {
                            const open = done >= c.need, on = goshuinCover[type] === c.id;
                            _coverURL[c.id] = _coverURL[c.id] || patternSwatchURL(c.hex, c.pattern);
                            return `<button onclick="setGoshuinCover('${c.id}')" ${open ? '' : 'disabled'} title="${open ? c.name : `滿願 ${c.need} 套後解鎖`}" class="relative aspect-square rounded-lg border-2 ${on ? 'border-orange-500 ring-2 ring-orange-300' : 'border-stone-300'} ${open ? '' : 'opacity-40 cursor-not-allowed'}" style="background-color:${c.hex};background-image:url(${_coverURL[c.id]});background-size:28px auto">${open ? '' : `<span class="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow">🔒${c.need}</span>`}</button>`;
                        }).join('')}
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">${pages.length ? `這一冊已有 ${pages.length} 頁。點封面翻開，由右往左讀。` : '這一冊還是空的。到介紹卡按「前往參拜」，拜領第一枚吧。'}　🔒 的布料要達成滿願才會解鎖（目前 ${done} 套）。</p>
                </div>
            </div>`;
    } else {
        // 日本的折本由右往左：右頁是這個跨頁的第一枚
        const i = (goshuinSpread - 1) * 2;
        const page = p => p ? `
            <div class="gs-page">
                ${p.html}
                <div class="mt-1.5 text-center">
                    <div class="text-xs font-serif-jp font-black text-stone-900 truncate">${p.label}</div>
                    <div class="text-[10px] text-stone-500 truncate">${p.sub}${p.go ? `　<button onclick="${p.go}" class="underline hover:text-orange-600">📍 去看看</button>` : ''}</div>
                </div>
            </div>` : `<div class="gs-page"><div class="gs-face gs-blank"></div></div>`;
        body = `
            <div class="gs-spread ${flip ? 'gs-flip-' + flip : ''}">
                ${page(pages[i + 1])}
                <div class="gs-fold"></div>
                ${page(pages[i])}
            </div>`;
    }
    box.innerHTML = `
        ${body}
        <div class="mt-4 flex items-center justify-center gap-3">
            <button onclick="goshuinFlip(1)" ${goshuinSpread >= max ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-black text-stone-700 hover:bg-stone-100 disabled:opacity-30">‹ 下一頁</button>
            <span class="text-[11px] font-bold text-stone-500 w-24 text-center">${goshuinSpread === 0 ? '封面' : `第 ${(goshuinSpread - 1) * 2 + 1}～${Math.min(pages.length, goshuinSpread * 2)} 頁／共 ${pages.length} 頁`}</span>
            <button onclick="goshuinFlip(-1)" ${goshuinSpread <= 0 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-black text-stone-700 hover:bg-stone-100 disabled:opacity-30">${goshuinSpread === 1 ? '封面' : '上一頁'} ›</button>
        </div>`;
}

// ---------- 滿願一覽 ----------
function renderGoshuinSets() {
    const type = goshuinTab;
    const sets = manganSets().filter(s => s.type === type);
    const done = manganDone().length;
    const nextCover = GOSHUIN_COVERS.filter(c => c.need > done).sort((a, b) => a.need - b.need)[0];
    document.getElementById('goshuin-sets').innerHTML = `
        <div class="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 font-bold">
            🏅 已滿願 ${done} 套（神社與城合計）。${nextCover ? `再 ${nextCover.need - done} 套解鎖封面布料「${nextCover.name}」。` : '封面布料已全部解鎖！'}集滿一套，這一冊的最後會多一頁「滿願」大印。
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${sets.map(s => {
                const got = manganGot(s), full = got === s.keys.length;
                return `
                    <div class="rounded-2xl border-2 p-3 flex items-center gap-3 ${full ? 'border-red-300 bg-red-50/70' : 'border-stone-200 bg-white'}">
                        <div class="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-xl ${full ? 'bg-red-700 text-white' : 'bg-stone-100'}">${full ? '願' : s.icon}</div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-baseline justify-between gap-2">
                                <span class="text-sm font-serif-jp font-black text-stone-900 truncate">${s.name}</span>
                                <span class="text-[11px] font-black ${full ? 'text-red-700' : 'text-stone-500'} shrink-0">${full ? '滿願！' : `${got} / ${s.keys.length}`}</span>
                            </div>
                            <div class="text-[10px] text-stone-500 truncate">${s.note}</div>
                            <div class="mt-1 h-1.5 rounded-full bg-stone-200 overflow-hidden"><div class="h-full rounded-full ${full ? 'bg-red-600' : 'bg-amber-500'}" style="width:${100 * got / s.keys.length}%"></div></div>
                        </div>
                    </div>`;
            }).join('')}
        </div>`;
}

// ---------- 切換 ----------
function switchGoshuinView(v) {
    goshuinView = v;
    renderGoshuinGrid();
}
// 御朱印帳的總繪製：其他檔案都呼叫這一個（名稱沿用舊的）
function renderGoshuinGrid() {
    renderGoshuinList();   // 順便更新分頁樣式與進度文字
    [['book', '📖 折本'], ['list', '🗂 一覽'], ['sets', '🏅 滿願']].forEach(([id]) => {
        const b = document.getElementById('gs-view-' + id);
        if (b) b.className = 'px-3 py-1.5 rounded-xl text-xs font-black transition ' + (id === goshuinView ? 'bg-amber-500 text-white shadow' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50');
    });
    document.getElementById('goshuin-grid').classList.toggle('hidden', goshuinView !== 'list');
    document.getElementById('goshuin-book').classList.toggle('hidden', goshuinView !== 'book');
    document.getElementById('goshuin-sets').classList.toggle('hidden', goshuinView !== 'sets');
    if (goshuinView === 'book') renderGoshuinBook();
    else if (goshuinView === 'sets') renderGoshuinSets();
}
