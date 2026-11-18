// 即時天氣
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 即時天氣：串接日本氣象廳的公開資料（連不上時改用 Open-Meteo），依各國實際經緯度查詢目前天氣，
 *   在地圖上顯示天氣標籤、烏雲、雨絲、雪花、霧與雷雨閃電
 ***********************************************************************/
// 各國代表地點的實際經緯度（國府・城下町或今日主要城市）
const PROV_LATLON = {
    yamashiro: [35.01, 135.77], yamato: [34.68, 135.83], kawachi: [34.68, 135.6], izumi: [34.57, 135.48], settsu: [34.69, 135.5],
    iga: [34.77, 136.13], ise: [34.88, 136.58], shima: [34.33, 136.83], owari: [35.18, 136.9], mikawa: [34.95, 137.17],
    totomi: [34.71, 137.73], suruga: [34.98, 138.38], izu: [35.12, 138.92], kai: [35.66, 138.57], sagami: [35.26, 139.15],
    musashi: [35.69, 139.69], awa_chiba: [34.99, 139.87], kazusa: [35.43, 140.29], shimosa: [35.72, 140.22], hitachi: [36.37, 140.47],
    omi: [35.0, 135.87], mino: [35.42, 136.76], hida: [36.14, 137.25], shinano: [36.24, 137.97], kozuke: [36.39, 139.06],
    shimotsuke: [36.56, 139.88], iwaki: [37.05, 140.89], iwashiro: [37.49, 139.93], rikuzen: [38.27, 140.87], rikuchu: [39.7, 141.15],
    mutsu_aomori: [40.6, 140.46], uzen: [38.24, 140.36], ugo: [39.72, 140.1], wakasa: [35.5, 135.75], echizen: [36.06, 136.22],
    kaga: [36.56, 136.65], noto: [37.04, 136.97], etchu: [36.7, 137.21], echigo: [37.92, 139.04], sado: [38.02, 138.37],
    tanba: [35.3, 135.12], tango: [35.54, 135.2], tajima: [35.54, 134.82], inaba: [35.5, 134.24], hoki: [35.43, 133.33],
    izumo: [35.47, 133.05], iwami: [34.9, 132.08], oki: [36.2, 133.32], harima: [34.82, 134.69], mimasaka: [35.07, 134.0],
    bizen: [34.66, 133.92], bitchu: [34.59, 133.77], bingo: [34.49, 133.36], aki: [34.39, 132.46], suo: [34.18, 131.47],
    nagato: [34.4, 131.4], kii: [34.23, 135.17], awaji: [34.34, 134.89], awa_tokushima: [34.07, 134.55], sanuki: [34.34, 134.05],
    iyo: [33.84, 132.77], tosa: [33.56, 133.53], chikuzen: [33.59, 130.4], chikugo: [33.32, 130.51], buzzen: [33.88, 130.88],
    bungo: [33.24, 131.61], hizen: [33.25, 130.3], higo: [32.8, 130.71], hyuga: [31.91, 131.42], osumi: [31.75, 130.76],
    satsuma: [31.6, 130.56], iki: [33.75, 129.69], tsushima: [34.2, 129.29], hokkaido_ezo: [43.06, 141.35], ryukyu: [26.21, 127.68]
};
// WMO 天氣代碼 → 中文、圖示、效果種類
function wmoInfo(code, isDay = 1) {
    if (code === 0) return { label: '晴', icon: isDay ? '☀️' : '🌙', kind: 'clear' };
    if (code === 1) return { label: '大致晴朗', icon: isDay ? '🌤️' : '🌙', kind: 'clear' };
    if (code === 2) return { label: '局部多雲', icon: '⛅', kind: 'cloud' };
    if (code === 3) return { label: '陰', icon: '☁️', kind: 'cloud' };
    if (code === 45 || code === 48) return { label: '霧', icon: '🌫️', kind: 'fog' };
    if (code >= 51 && code <= 57) return { label: code >= 56 ? '凍毛毛雨' : '毛毛雨', icon: '🌦️', kind: 'drizzle' };
    if (code >= 61 && code <= 67) return { label: code >= 66 ? '凍雨' : ['小雨', '中雨', '大雨'][Math.min(2, Math.floor((code - 61) / 2))], icon: '🌧️', kind: 'rain' };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: code === 77 ? '霰' : code >= 85 ? '陣雪' : ['小雪', '中雪', '大雪'][Math.min(2, Math.floor((code - 71) / 2))], icon: '🌨️', kind: 'snow' };
    if (code >= 80 && code <= 82) return { label: ['陣雨', '較強陣雨', '豪雨'][code - 80], icon: '🌦️', kind: 'rain' };
    if (code >= 95) return { label: code === 95 ? '雷雨' : '雷雨伴冰雹', icon: '⛈️', kind: 'thunder' };
    return { label: '—', icon: '❔', kind: 'clear' };
}

let weatherOn = false;
let weatherData = {};
let weatherFetchedAt = 0;
let weatherTime = '';
let weatherTimer = null;
let weatherGroup = null;
let rainLines = null, rainDrops = [];
let snowPts = null, snowFlakes = [];
const thunderClouds = [];
const weatherClouds = [];
const weatherLabels = {};

// 天氣來源：先用日本氣象廳（JMA）的公開資料，連不上再改用 Open-Meteo；
// 兩邊都失敗時，拿這台瀏覽器存的 6 小時內舊資料來用
const WEATHER_CACHE_KEY = 'ryoseikoku_weather_cache_v1';   // 不用 shinkoku_ 開頭，備份時才不會帶到
let weatherStaleAt = 0;                                    // 正在用舊資料時，記下那份資料的取得時間
let weatherSource = '';
async function fetchJsonTimeout(url, ms, text = false) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), ms);
    try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await (text ? res.text() : res.json());
    } finally {
        clearTimeout(timer);
    }
}

/* ---------- 日本氣象廳 ----------
 *   AMeDAS（全國約 1,300 個觀測站，每 10 分鐘更新）：氣溫、雨量、風速、日照
 *   全國天氣概況（22 個地方的今日預報）：晚上沒有日照可看時，用來判斷晴或陰
 *   兩者都允許網頁直接讀取（CORS），不需要金鑰 */
const JMA = 'https://www.jma.go.jp/bosai';
// 全國概況裡 22 個地方預報的代表地點
const JMA_REGION_LATLON = {
    '014100': [42.98, 144.38], '012000': [43.77, 142.37], '016000': [43.06, 141.35], '020000': [40.82, 140.74], '050000': [39.72, 140.1],
    '040000': [38.27, 140.87], '150000': [37.92, 139.04], '170000': [36.56, 136.65], '130000': [35.69, 139.69], '090000': [36.56, 139.88],
    '200000': [36.65, 138.18], '230000': [35.18, 136.9], '270000': [34.69, 135.5], '370000': [34.34, 134.05], '320000': [35.47, 133.05],
    '340000': [34.39, 132.46], '390000': [33.56, 133.53], '400000': [33.59, 130.4], '460100': [31.6, 130.56], '460040': [28.38, 129.49],
    '471000': [26.21, 127.68], '474000': [24.34, 124.16]
};
let _amedasNear = null;   // 各國最近的幾個觀測站（第一次查詢時算一次）
const kmBetween = (a, b) => Math.hypot((a[0] - b[0]) * 111, (a[1] - b[1]) * 111 * Math.cos(a[0] * Math.PI / 180));
async function fetchWeatherJMA(ids) {
    const latest = (await fetchJsonTimeout(`${JMA}/amedas/data/latest_time.txt`, 8000, true)).trim();   // 2026-11-18T16:10:00+09:00
    const stamp = latest.slice(0, 19).replace(/[-T:]/g, '');
    const [obs, overview, table] = await Promise.all([
        fetchJsonTimeout(`${JMA}/amedas/data/map/${stamp}.json`, 12000),
        fetchJsonTimeout(`${JMA}/forecast/data/forecast/010000.json`, 12000).catch(() => []),
        _amedasNear ? null : fetchJsonTimeout(`${JMA}/amedas/const/amedastable.json`, 12000)
    ]);
    if (table) {
        const st = Object.entries(table).map(([id, t]) => ({ id, ll: [t.lat[0] + t.lat[1] / 60, t.lon[0] + t.lon[1] / 60] }));
        _amedasNear = {};
        ids.forEach(pid => {
            _amedasNear[pid] = st.map(x => ({ id: x.id, km: kmBetween(PROV_LATLON[pid], x.ll) })).sort((a, b) => a.km - b.km).slice(0, 8);
        });
    }
    // 地方預報：今天的天氣代碼（1xx 晴、2xx 陰、3xx 雨、4xx 雪）
    const regions = [];
    (overview || []).forEach(o => {
        const ts = o.srf && o.srf.timeSeries && o.srf.timeSeries[0];
        const area = ts && (Array.isArray(ts.areas) ? ts.areas[0] : ts.areas);
        if (area && JMA_REGION_LATLON[o.officeCode]) regions.push({ ll: JMA_REGION_LATLON[o.officeCode], code: String(area.weatherCodes[0] || '') });
    });
    const hour = +latest.slice(11, 13);
    const val = (x, k) => x && Array.isArray(x[k]) && x[k][0] !== null && x[k][1] === 0 ? x[k][0] : null;
    const data = {};
    ids.forEach(pid => {
        const near = _amedasNear[pid].map(n => ({ km: n.km, o: obs[n.id] })).filter(n => n.o);
        const first = k => { const n = near.find(n => val(n.o, k) !== null); return n ? val(n.o, k) : null; };
        const temp = first('temp');
        if (temp === null) return;
        // 雨量取 30 公里內最大值（才不會剛好錯過下雨的那一站）；日照取 40 公里內平均
        const pr = near.filter(n => n.km < 30).map(n => val(n.o, 'precipitation1h')).filter(v => v !== null);
        const precip = pr.length ? Math.max(...pr) : (first('precipitation1h') || 0);
        const sun = near.filter(n => n.km < 40).map(n => val(n.o, 'sun1h')).filter(v => v !== null).slice(0, 3);
        let code;
        if (precip > 0) code = temp <= 1.5 ? (precip >= 3 ? 73 : 71) : precip >= 10 ? 65 : precip >= 3 ? 63 : 61;
        else if (sun.length && hour >= 9 && hour <= 15) {
            const s = sun.reduce((a, b) => a + b, 0) / sun.length;
            code = s >= 0.9 ? 0 : s >= 0.6 ? 1 : s >= 0.2 ? 2 : 3;
        } else {
            const r = regions.slice().sort((a, b) => kmBetween(PROV_LATLON[pid], a.ll) - kmBetween(PROV_LATLON[pid], b.ll))[0];
            const c = r ? r.code : '';
            code = c === '100' ? 0 : c[0] === '1' ? 1 : ['201', '210', '211'].includes(c) ? 2 : 3;
        }
        data[pid] = {
            temp, code, precip, cloud: null, wind: first('wind') || 0, isDay: hour >= 6 && hour < 17 ? 1 : 0, time: latest,
            sun: sun.length ? Math.round(sun.reduce((a, b) => a + b, 0) / sun.length * 60) : null
        };
    });
    if (Object.keys(data).length < ids.length * 0.8) throw new Error('JMA data incomplete');
    return { data, time: latest.slice(11, 16), source: '日本氣象廳 AMeDAS' };
}

/* ---------- Open-Meteo（備援） ---------- */
async function fetchWeatherOpenMeteo(ids) {
    const lat = ids.map(id => PROV_LATLON[id][0]).join(',');
    const lon = ids.map(id => PROV_LATLON[id][1]).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,cloud_cover,wind_speed_10m,is_day&wind_speed_unit=ms&timezone=Asia%2FTokyo`;
    const json = await fetchJsonTimeout(url, 12000);
    const data = {};
    let time = '';
    (Array.isArray(json) ? json : [json]).forEach((item, i) => {
        const cur = item.current;
        if (!cur) return;
        data[ids[i]] = {
            temp: cur.temperature_2m, code: cur.weather_code, precip: cur.precipitation,
            cloud: cur.cloud_cover, wind: cur.wind_speed_10m, isDay: cur.is_day, time: cur.time
        };
        time = (cur.time || '').slice(11, 16);
    });
    return { data, time, source: 'Open-Meteo' };
}

async function fetchWeather() {
    const ids = PROVINCES_DATA.map(p => p.id).filter(id => PROV_LATLON[id]);
    let got;
    try {
        got = await fetchWeatherJMA(ids).catch(() => fetchWeatherOpenMeteo(ids));
    } catch (e) {
        let cache = null;
        try { cache = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null'); } catch (err) {}
        if (!cache || Date.now() - cache.at > 6 * 3600 * 1000) throw e;
        weatherData = cache.data;
        weatherTime = cache.time;
        weatherSource = cache.source || '';
        weatherStaleAt = cache.at;
        weatherFetchedAt = Date.now() - 8 * 60 * 1000;   // 兩分鐘後可以再試
        return;
    }
    weatherData = got.data;
    weatherTime = got.time;
    weatherSource = got.source;
    weatherFetchedAt = Date.now();
    weatherStaleAt = 0;
    try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ at: weatherFetchedAt, time: weatherTime, source: weatherSource, data: weatherData })); } catch (e) {}
}

async function toggleWeather() {
    weatherOn = !weatherOn;
    setToolbarBtn('btn-weather', weatherOn);
    const mb = document.getElementById('weather-mobile');
    if (mb) mb.className = 'shrink-0 whitespace-nowrap px-3 py-2 rounded-full text-xs font-black transition ' + (weatherOn ? 'bg-stone-900 text-white' : 'text-stone-800 hover:bg-stone-200/60');
    if (!weatherOn) {
        clearWeatherVisuals();
        clearInterval(weatherTimer);
        setSeason(currentSeason); // 還原季節飄落效果
        if (selectedProvinceId) renderDetailWeather(getProv(selectedProvinceId));
        return;
    }
    await refreshWeather(true);
    clearInterval(weatherTimer);
    weatherTimer = setInterval(() => refreshWeather(false), 15 * 60 * 1000);
}

async function refreshWeather(announce) {
    if (!weatherOn) return;
    try {
        if (Date.now() - weatherFetchedAt > 10 * 60 * 1000) {
            if (announce) showToast('正在取得日本各地的即時天氣…');
            await fetchWeather();
        }
        applyWeatherVisuals();
        if (seasonParticles) seasonParticles.visible = false; // 天氣模式下改由實際降雨／降雪呈現
        const raining = Object.values(weatherData).filter(w => ['rain', 'drizzle', 'thunder'].includes(wmoInfo(w.code).kind)).length;
        const snowing = Object.values(weatherData).filter(w => wmoInfo(w.code).kind === 'snow').length;
        if (announce && weatherStaleAt) showToast(`天氣服務暫時連不上，先顯示 ${Math.max(1, Math.round((Date.now() - weatherStaleAt) / 60000))} 分鐘前的天氣（日本時間 ${weatherTime}）`);
        else if (announce) showToast(`即時天氣已更新（日本時間 ${weatherTime}）：${raining} 國下雨、${snowing} 國下雪`);
        if (selectedProvinceId) renderDetailWeather(getProv(selectedProvinceId));
    } catch (e) {
        showToast('天氣服務暫時連不上（氣象廳與 Open-Meteo 都沒有回應），請過幾分鐘再試');
        weatherOn = false;
        setToolbarBtn('btn-weather', false);
    }
}

function clearWeatherVisuals() {
    if (weatherGroup) { scene.remove(weatherGroup); weatherGroup = null; }
    rainLines = null; rainDrops = [];
    snowPts = null; snowFlakes = [];
    thunderClouds.length = 0;
    weatherClouds.length = 0;
    Object.values(weatherLabels).forEach(l => { l.el.style.opacity = '0'; l.el.style.pointerEvents = 'none'; });
}

function applyWeatherVisuals() {
    clearWeatherVisuals();
    weatherGroup = new THREE.Group();
    const puffGeo = new THREE.SphereGeometry(1, 14, 10);
    const greyMat = new THREE.MeshStandardMaterial({ color: 0xd9dee2, roughness: 1, transparent: true, opacity: 0.92 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x7d8790, roughness: 1, transparent: true, opacity: 0.94 });
    const fogMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 1, transparent: true, opacity: 0.45, depthWrite: false });
    const rainPos = [], snowPos = [];
    PROVINCES_DATA.forEach(p => {
        const w = weatherData[p.id];
        if (!w) return;
        const info = wmoInfo(w.code, w.isDay);
        const cx = p.mapX, cz = p.mapZ;
        const wet = ['drizzle', 'rain', 'thunder', 'snow'].includes(info.kind);
        // 雲：雲量多或有降水時，在該國上空出現雲團
        if (w.cloud >= 55 || wet || info.kind === 'cloud') {
            // 每朵雲用自己的材質，鏡頭靠近時可單獨變透明
            const mat = info.kind === 'thunder' ? new THREE.MeshStandardMaterial({ color: 0x5f6870, roughness: 1, emissive: 0xfff6c8, emissiveIntensity: 0, transparent: true, opacity: 0.96 }) : (wet && info.kind !== 'snow' ? darkMat : greyMat).clone();
            const cloud = new THREE.Group();
            cloud.userData.mat = mat;
            cloud.userData.baseOpacity = mat.opacity;
            weatherClouds.push(cloud);
            const size = 0.16 + Math.min(1, w.cloud / 100) * 0.1 + (wet ? 0.06 : 0);
            [[0, 0, 0, 1], [-0.9, -0.15, 0.2, 0.75], [0.9, -0.12, -0.1, 0.8], [0.2, 0.25, -0.35, 0.7], [-0.3, 0.1, 0.5, 0.65]].forEach(([x, y, z, r]) => {
                const puff = new THREE.Mesh(puffGeo, mat);
                puff.position.set(x * size, y * size, z * size);
                puff.scale.setScalar(r * size);
                cloud.add(puff);
            });
            cloud.scale.y = 0.62;
            cloud.position.set(cx, 2.45, cz);
            weatherGroup.add(cloud);
            if (info.kind === 'thunder') thunderClouds.push({ mat, next: Math.random() * 3, flash: 0 });
        }
        // 霧：貼地的一層白霧
        if (info.kind === 'fog') {
            const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.3, 20), fogMat);
            fog.position.set(cx, 1.12, cz);
            weatherGroup.add(fog);
        }
        // 雨絲與雪花：數量依降水強度
        const intensity = Math.min(1, (w.precip || 0) / 4);
        if (['drizzle', 'rain', 'thunder'].includes(info.kind)) {
            const n = Math.round((info.kind === 'drizzle' ? 30 : 60) + intensity * 90 + (info.kind === 'thunder' ? 40 : 0));
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.55;
                rainDrops.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: 0.97 + Math.random() * 1.35, v: 2.2 + Math.random() * 0.8 + intensity });
                rainPos.push(0, 0, 0, 0, 0, 0);
            }
        }
        if (info.kind === 'snow') {
            const n = Math.round(50 + intensity * 90);
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.6;
                snowFlakes.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: 0.97 + Math.random() * 0.95, v: 0.25 + Math.random() * 0.2, ph: Math.random() * 6 });
                snowPos.push(0, 0, 0);
            }
        }
        // 天氣小標籤：圖示＋氣溫
        let lbl = weatherLabels[p.id];
        if (!lbl) {
            const el = document.createElement('div');
            el.className = 'map-label';
            el.style.opacity = '0';
            el.addEventListener('click', e => { e.stopPropagation(); selectProvince(p.id); });
            document.getElementById('labels-container').appendChild(el);
            lbl = weatherLabels[p.id] = { el, anchor: new THREE.Vector3(cx, NODE_Y + 1.25, cz) };
        }
        lbl.el.innerHTML = `
            <div class="map-label-inner">
                <div class="px-1.5 py-0.5 rounded-full bg-white/90 border border-sky-200 shadow-sm text-[10px] font-black text-stone-800 whitespace-nowrap" title="${shortOldName(p)}：${info.label}">
                    ${info.icon} ${Math.round(w.temp)}°
                </div>
            </div>`;
    });
    if (rainDrops.length) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rainPos), 3));
        rainLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x4f7fa8, transparent: true, opacity: 0.85 }));
        rainLines.frustumCulled = false;
        weatherGroup.add(rainLines);
    }
    if (snowFlakes.length) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(snowPos), 3));
        snowPts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, map: seasonParticles ? seasonParticles.material.map : null, transparent: true, opacity: 0.95, depthWrite: false }));
        snowPts.frustumCulled = false;
        weatherGroup.add(snowPts);
    }
    scene.add(weatherGroup);
}

function updateWeather(dt, t) {
    if (!weatherOn || !weatherGroup) return;
    if (rainLines) {
        const a = rainLines.geometry.attributes.position;
        rainDrops.forEach((d, i) => {
            d.y -= d.v * dt;
            if (d.y < 0.97) d.y = 2.3;
            a.setXYZ(i * 2, d.x - 0.01, d.y + 0.12, d.z);
            a.setXYZ(i * 2 + 1, d.x, d.y, d.z);
        });
        a.needsUpdate = true;
    }
    if (snowPts) {
        const a = snowPts.geometry.attributes.position;
        snowFlakes.forEach((f, i) => {
            f.y -= f.v * dt;
            if (f.y < 0.97) f.y = 2.3;
            a.setXYZ(i, f.x + Math.sin(t * 1.2 + f.ph) * 0.03, f.y, f.z + Math.cos(t + f.ph) * 0.03);
        });
        a.needsUpdate = true;
    }
    // 鏡頭靠近雲團時讓雲變透明，避免擋住底下的社殿與城郭
    weatherClouds.forEach(cl => {
        const d = camera.position.distanceTo(cl.position);
        const k = Math.max(0.18, Math.min(1, (d - 1.5) / 3.5));
        cl.userData.mat.opacity = cl.userData.baseOpacity * k;
        cl.userData.mat.depthWrite = k > 0.9;
    });
    // 雷雨：雲團隨機閃光
    thunderClouds.forEach(c => {
        c.next -= dt;
        if (c.next <= 0) { c.flash = 1; c.next = 1.5 + Math.random() * 4; }
        c.flash = Math.max(0, c.flash - dt * 4);
        c.mat.emissiveIntensity = c.flash * (0.6 + Math.random() * 0.6);
    });
}

function placeWeatherLabels() {
    Object.entries(weatherLabels).forEach(([id, l]) => {
        placeLabel(l.el, l.anchor, weatherOn && !!weatherData[id]);
    });
}

// 介紹卡上的該國即時天氣
function renderDetailWeather(prov) {
    const el = document.getElementById('dc-weather');
    if (!el) return;
    const w = weatherOn && weatherData[prov.id];
    if (!w) { el.classList.add('hidden'); return; }
    const info = wmoInfo(w.code, w.isDay);
    el.classList.remove('hidden');
    el.innerHTML = `<span class="text-base leading-none">${info.icon}</span>
        <span class="font-black text-stone-900">${info.label}　${w.temp.toFixed(1)}°C</span>
        <span class="text-stone-500">降水 ${w.precip} mm${w.cloud !== null && w.cloud !== undefined ? `・雲量 ${w.cloud}%` : ''}${w.sun !== null && w.sun !== undefined && w.isDay ? `・日照 ${w.sun} 分／時` : ''}・風 ${w.wind.toFixed(1)} m/s</span>
        <span class="text-[10px] text-stone-400 w-full">日本時間 ${weatherTime} 更新・資料來源 ${weatherSource || 'Open-Meteo'}</span>`;
}
