// 第一次開啟時的操作教學：聚光燈框出工具，旁邊放說明卡
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

const TOUR_KEY = 'shinkoku_tour_done_v1';
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

// target：依序嘗試的元件，取第一個在畫面上看得到的；可給多個 id 合併成一個框
const TOUR_STEPS = [
    {
        icon: '⛩️', title: '歡迎來到日本令制國 3D 探索島',
        body: () => `<p>這是一座把古代日本「68 令制國＋蝦夷地＋琉球」做成立體模型的小島。</p>
            <p>每一國都放了當地的<b>一之宮・名社</b>與<b>代表名城</b>，建築依實際樣式製作。花一分鐘看看怎麼玩吧！</p>`
    },
    {
        icon: '🖐️', title: '移動、旋轉、縮放地圖', target: [['view-ctl']],
        body: () => isTouch()
            ? `<p><b>單指拖拉</b>移動地圖，<b>雙指</b>捏合縮放、轉動方向。</p>`
            : `<p><b>左鍵拖拉</b>移動地圖，<b>滾輪</b>或觸控板雙指縮放。</p>
               <p>想轉方向：切到「🔄 旋轉」再拖拉，或按 ⟲ ⟳ 按鈕、<b>Q／E</b> 鍵；按住 <b>Shift</b> 拖拉也能暫時切換。</p>`
    },
    {
        icon: '🗾', title: '點一個國看看', target: [['right-index-panel']],
        body: () => `<p>點地圖上的<b>國名牌</b>${window.innerWidth >= 1024 ? '，或從右邊的索引選一國' : ''}，就會打開介紹卡。</p>
            <p>介紹卡裡有<b>實景照片</b>、主祭神、城主與歷史看點，按「📍 在地圖上看這座」鏡頭會飛過去。</p>`
    },
    {
        icon: '🔄', title: '古今地名切換', target: [['btn-pref-mode'], ['mobile-bar']],
        body: () => `<p>打開「古 ⚪ 今」開關，地圖會從古代的令制國，換成現代的都道府縣與八地方區分。</p>
            <p>國名旁也標了<b>平假名與羅馬拼音</b>。</p>`
    },
    {
        icon: '🌸', title: '景色與圖層', target: [['tb-scene', 'tb-layers'], ['mobile-bar']],
        body: () => `<p><b>景色</b>：切換晨曦、白晝、夜燈，以及春夏秋冬，春天滿山櫻花、冬天北國積雪。</p>
            <p><b>圖層</b>：開關名牌、驛道、山河湖名稱，還有串接各地<b>即時天氣</b>（會下雨、下雪喔）。</p>`
    },
    {
        icon: '🐕', title: '三種玩法', target: [['btn-dog', 'tb-wardrobe', 'tb-goshuin'], ['mobile-bar']],
        body: () => `<p><b>🐕 代參犬</b>：幫柴犬こまち一國一國選路，送牠到伊勢神宮或金刀比羅宮參拜；路上會遇到各種事件，要顧好體力和錢袋。</p>
            <p><b>👘 換裝</b>：幫旅人換上平安裝束、振袖、浴衣等和服。</p>
            <p><b>📖 御朱印帳</b>：在介紹卡領取每座神社的御朱印、每座城的御城印，集滿兩本帳。</p>`
    },
    {
        icon: '🎓', title: '準備好了！', target: [['tb-help'], ['mobile-bar']],
        body: () => `<p>之後想再看一次教學，可以按${isTouch() || window.innerWidth < 1280 ? '下方的「🎓 教學」' : '右上角的「?」→「操作教學」'}。</p>
            <p>祝你旅途愉快，一路平安！</p>`
    }
];

let tourIndex = 0;
function tourOpen() {
    const el = document.getElementById('tour');
    return el && !el.classList.contains('hidden');
}
function tourTargetRect(step) {
    for (const ids of step.target || []) {
        const rects = ids.map(id => document.getElementById(id)).filter(Boolean)
            .map(el => el.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
        if (!rects.length) continue;
        const left = Math.min(...rects.map(r => r.left)), top = Math.min(...rects.map(r => r.top));
        const right = Math.max(...rects.map(r => r.right)), bottom = Math.max(...rects.map(r => r.bottom));
        return { left, top, right, bottom, width: right - left, height: bottom - top };
    }
    return null;
}
function renderTour() {
    const step = TOUR_STEPS[tourIndex];
    document.getElementById('tour-step').textContent = `${tourIndex + 1} / ${TOUR_STEPS.length}`;
    document.getElementById('tour-icon').textContent = step.icon;
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-body').innerHTML = step.body();
    document.getElementById('tour-prev').style.visibility = tourIndex ? 'visible' : 'hidden';
    document.getElementById('tour-next').textContent = tourIndex === TOUR_STEPS.length - 1 ? '開始探索' : '下一步';
    document.getElementById('tour-dots').innerHTML = TOUR_STEPS.map((s, i) =>
        `<span class="h-1.5 rounded-full ${i === tourIndex ? 'w-4 bg-orange-600' : 'w-1.5 bg-stone-300'} transition-all"></span>`).join('');
    placeTour();
}
// 聚光燈框住目標；說明卡放在目標下方（不夠放就上方，再不行就左右），沒有目標時置中
function placeTour() {
    if (!tourOpen()) return;
    const step = TOUR_STEPS[tourIndex];
    const spot = document.getElementById('tour-spot');
    const shade = document.getElementById('tour-shade');
    const card = document.getElementById('tour-card');
    const vw = window.innerWidth, vh = window.innerHeight, gap = 14, pad = 8;
    const r = tourTargetRect(step);
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let x, y;
    if (!r) {
        spot.classList.add('hidden');
        shade.style.clipPath = 'none';
        x = (vw - cw) / 2;
        y = (vh - ch) / 2;
    } else {
        spot.classList.remove('hidden');
        const hx = r.left - pad, hy = r.top - pad, hw = r.width + pad * 2, hh = r.height + pad * 2;
        Object.assign(spot.style, { left: hx + 'px', top: hy + 'px', width: hw + 'px', height: hh + 'px' });
        // 遮罩挖一個圓角洞，露出目標
        const k = Math.min(24, hw / 2, hh / 2);
        const hole = `M${hx + k} ${hy}H${hx + hw - k}A${k} ${k} 0 0 1 ${hx + hw} ${hy + k}V${hy + hh - k}A${k} ${k} 0 0 1 ${hx + hw - k} ${hy + hh}H${hx + k}A${k} ${k} 0 0 1 ${hx} ${hy + hh - k}V${hy + k}A${k} ${k} 0 0 1 ${hx + k} ${hy}Z`;
        shade.style.clipPath = `path(evenodd, "M0 0H${vw}V${vh}H0Z ${hole}")`;
        const cx = r.left + r.width / 2;
        if (r.bottom + pad + gap + ch < vh - 8) { x = cx - cw / 2; y = r.bottom + pad + gap; }
        else if (r.top - pad - gap - ch > 8) { x = cx - cw / 2; y = r.top - pad - gap - ch; }
        else if (r.left - pad - gap - cw > 8) { x = r.left - pad - gap - cw; y = r.top + r.height / 2 - ch / 2; }
        else { x = r.right + pad + gap; y = r.top + r.height / 2 - ch / 2; }
    }
    card.style.left = Math.max(16, Math.min(vw - cw - 16, x)) + 'px';
    card.style.top = Math.max(16, Math.min(vh - ch - 16, y)) + 'px';
}
function startTour() {
    document.querySelectorAll('.tb-pop').forEach(el => el.classList.add('hidden'));
    tourIndex = 0;
    document.getElementById('tour').classList.remove('hidden');
    renderTour();
}
function tourGo(d) {
    const next = tourIndex + d;
    if (next >= TOUR_STEPS.length) return endTour();
    tourIndex = Math.max(0, next);
    renderTour();
}
function endTour() {
    document.getElementById('tour').classList.add('hidden');
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {}
}

window.addEventListener('resize', placeTour);
window.addEventListener('keydown', e => {
    if (!tourOpen()) return;
    if (e.key === 'Escape') endTour();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') tourGo(1);
    else if (e.key === 'ArrowLeft') tourGo(-1);
});

// 第一次來的人：載入畫面收起後自動開始（由 index.html 的 hideLoader 呼叫）
function maybeStartTour() {
    let done = false;
    try { done = localStorage.getItem(TOUR_KEY) === '1'; } catch (e) {}
    if (!done) setTimeout(startTour, 500);
}
