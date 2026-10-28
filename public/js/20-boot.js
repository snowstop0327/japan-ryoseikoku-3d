// 啟動
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 10. BOOT
 ***********************************************************************/
function boot() {
    initThreeScene();
    setSeason(seasonOfToday());
    loadStamps();
    initViewControls();
    // 依標題卡實際高度，讓左側卡片從它下方開始
    const brand = document.getElementById('brand-card');
    const syncCardTop = () => document.documentElement.style.setProperty('--card-top', (brand.getBoundingClientRect().bottom + 12) + 'px');
    syncCardTop();
    if (window.ResizeObserver) new ResizeObserver(syncCardTop).observe(brand);
    window.addEventListener('resize', syncCardTop);
    refreshStampMarks();
    refreshUI();

    const input = document.getElementById('search-input');
    input.addEventListener('input', () => {
        searchQuery = input.value.trim();
        document.getElementById('clear-search-btn').classList.toggle('hidden', !searchQuery);
        renderIndexList();
    });

    document.getElementById('wardrobe-modal').addEventListener('click', e => {
        if (e.target.id === 'wardrobe-modal') closeWardrobe();
    });
    ['source-modal', 'goshuin-modal'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => {
            if (e.target.id === id) hideModal(id);
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (tourOpen()) return;   // 教學進行中由教學自己處理 Esc
        hideModal('source-modal');
        hideModal('goshuin-modal');
        closeWardrobe();
        if (travelerCardOpen) { closeTravelerCard(); return; }
        if (selectedPref) { closePrefCard(); return; }
        if (selectedWalker !== null) { closeWalkerCard(); return; }
        if (selectedProvinceId) closeDetailCard();
    });
}

// 先讓載入畫面顯示「建造神社與城郭」，再開始建 3D 場景（建場景時畫面會暫停更新）
if (window.setLoaderProgress) setLoaderProgress(0.8, '建造神社與城郭…');
setTimeout(() => {
    try {
        boot();
    } catch (e) {
        console.error(e);
        if (window.setLoaderProgress) setLoaderProgress(1, '這個瀏覽器無法顯示 3D 畫面，請改用最新版 Chrome、Safari 或 Edge');
        return;
    }
    // 稍等第一個畫面畫出來再收起載入畫面
    setTimeout(() => window.hideLoader && hideLoader(), 150);
}, 60);
