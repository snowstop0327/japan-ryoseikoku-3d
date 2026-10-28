// 全域狀態與御朱印儲存
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 2. APPLICATION STATE & STORAGE
 ***********************************************************************/
let currentRegion = 'all';
let selectedProvinceId = null;
let showAllProvincePins = false;
let showModernPrefecture = false;
let showHighwayLines = true;
let showGeoLabels = true;
let selectedPref = null;
let currentDetailTab = 'shrine';
let searchQuery = '';
// 御朱印（神社）與御城印（城）分開收集：每座神社、每座城各一枚
let stampedSites = new Set();          // 'provId|shrine|社名'、'provId|castle|城名'
let stampedProvinces = new Set();      // 至少收到一枚印的國（地圖上的💮標記用）

const STORAGE_KEY = 'shinkoku_meijo_69_stamps_v4';          // 舊版：以國為單位
const SITE_STAMP_KEY = 'shinkoku_meijo_site_stamps_v1';
function siteStampKey(provId, type, site) {
    return `${provId}|${type}|${site.short}`;
}
function allStampSites(type) {
    const out = [];
    PROVINCES_DATA.forEach(p => getSites(p)[type === 'shrine' ? 'shrines' : 'castles'].forEach((s, i) => out.push({ prov: p, site: s, idx: i, key: siteStampKey(p.id, type, s) })));
    return out;
}
function recomputeProvinceStamps() {
    stampedProvinces = new Set([...stampedSites].map(k => k.split('|')[0]));
}
function loadStamps() {
    try {
        const raw = localStorage.getItem(SITE_STAMP_KEY);
        if (raw) stampedSites = new Set(JSON.parse(raw));
        else {
            // 舊版以國蓋印：換成該國第一座神社與第一座城的印
            const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            old.forEach(id => {
                const p = getProv(id);
                if (!p) return;
                const st = getSites(p);
                if (st.shrines[0]) stampedSites.add(siteStampKey(id, 'shrine', st.shrines[0]));
                if (st.castles[0]) stampedSites.add(siteStampKey(id, 'castle', st.castles[0]));
            });
        }
    } catch (e) {
        stampedSites = new Set();
    }
    recomputeProvinceStamps();
    updateStampUI();
}
function saveStamps() {
    try {
        localStorage.setItem(SITE_STAMP_KEY, JSON.stringify([...stampedSites]));
    } catch (e) {}
    recomputeProvinceStamps();
    updateStampUI();
}
function stampCounts(type) {
    const list = allStampSites(type);
    return { got: list.filter(x => stampedSites.has(x.key)).length, total: list.length };
}
function updateStampUI() {
    const s = stampCounts('shrine'), c = stampCounts('castle');
    const pill = document.getElementById('stamp-counter-pill');
    if (pill) pill.textContent = `⛩️${s.got}・🏯${c.got}`;
    ['shrine', 'castle'].forEach(type => {
        const el = document.getElementById('gs-count-' + type);
        const n = type === 'shrine' ? s : c;
        if (el) el.textContent = `${n.got} / ${n.total}`;
    });
}
