// 旅人與換裝
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 旅人換裝系統：九種和服／裝束 × 傳統和色 × 和柄花色
 *   衣服以實際和服構造建模：交領（左前）、袂（垂袖）、帶＋帶揚＋帶締＋帶結、
 *   袴（褶＋紐＋腰板）、羽織（前開＋羽織紐＋家紋）等；
 *   花紋貼圖依零件實際尺寸計算座標，所有部位花紋大小一致、不會被拉長壓扁。
 ***********************************************************************/
const OUTFIT_TYPES = {
    kariginu: {
        name: '狩衣', kana: 'かりぎぬ', era: '平安時代', icon: '🏹', robe: 'knee', sleeve: 'kariginu', bottom: 'sashinuki', bottomColor: '#7b6aa8',
        collar: 'round', belt: '#3f4f7a', hat: 'eboshi', hair: 'male', extras: ['tsuyu'], defaultColor: '#9fc3dc',
        tags: ['平安時代', '狩衣・立烏帽子'],
        desc: [['狩衣（かりぎぬ）', '原是貴族獵鷹時穿的便服，袖子只在背後縫合、腋下敞開，方便活動；平安時代中期成為公家日常外出服。'],
            ['袖括之緒', '穿過袖口的紅色繩子，拉緊可以把寬大的袖口束起來。'],
            ['立烏帽子與指貫', '黑漆高帽與褲腳束起的寬袴，是平安男子出行的標準打扮。']]
    },
    suikan: {
        name: '水干', kana: 'すいかん', era: '平安時代', icon: '🌼', robe: 'knee', sleeve: 'kariginu', bottom: 'sashinuki', bottomColor: '#efe9d8',
        collar: 'v', belt: '#8a5a3c', hat: 'eboshi', hair: 'male', extras: ['kikutoji'], defaultColor: '#e8a0a8',
        tags: ['平安時代', '水干・菊綴'],
        desc: [['水干（すいかん）', '以清水上漿晾乾的布製成而得名，原為庶民的服裝，後來也是少年與白拍子的正式打扮；領口常翻開成「垂領」。'],
            ['菊綴（きくとじ）', '胸前與袖上的小絨球，原本是補強縫線的結，後來成為水干的代表裝飾。']]
    },
    tsubo: {
        name: '壺裝束', kana: 'つぼしょうぞく', era: '平安時代', icon: '👒', robe: 'long', sleeve: 'wide', bottom: 'none',
        collar: 'v', obi: '#c53d43', obiStyle: 'kakeobi', hat: 'ichimegasa', hair: 'long', extras: [], defaultColor: '#a59aca', defaultPattern: 'shippo',
        tags: ['平安時代', '市女笠・虫垂衣'],
        desc: [['壺裝束（つぼしょうぞく）', '平安貴族女性外出參拜、旅行時的打扮：把長長的衣裾「壺折」提起，方便步行。'],
            ['市女笠與虫垂衣', '寬邊的市女笠四周垂下薄紗「虫垂衣（むしのたれぎぬ）」，可以遮陽、防蟲，也遮住面容。'],
            ['掛帶（かけおび）', '參拜神社時從肩上斜掛到胸前的紅色帶子，表示潔淨與敬意。']]
    },
    miko: {
        name: '巫女裝束', kana: 'みこしょうぞく', era: '神社', icon: '⛩️', robe: 'hip', sleeve: 'wide', bottom: 'hakama', bottomColor: '#c8343a',
        collar: 'v', hat: 'none', hair: 'long', extras: ['takenaga'], defaultColor: '#ffffff',
        tags: ['神社', '白衣・緋袴'],
        desc: [['白衣（はくえ）', '象徵清淨的白色上衣，是神職與巫女的基本裝束。'],
            ['緋袴（ひばかま）', '鮮紅色的袴，紅色自古被認為有驅邪的力量。'],
            ['丈長（たけなが）', '把長髮束在背後的白色和紙髮飾。']]
    },
    furisode: {
        name: '振袖', kana: 'ふりそで', era: '江戶〜現代', icon: '👘', robe: 'long', sleeve: 'furisode', bottom: 'none',
        collar: 'v', obi: '#e2b33c', obiStyle: 'tateya', obiage: '#f4b3c2', obijime: '#2a5caa', hat: 'none', hair: 'bun', extras: ['kanzashi'], footwear: 'zori',
        defaultColor: '#c53d43', defaultPattern: 'sakura',
        tags: ['江戶〜現代', '振袖・袋帶'],
        desc: [['振袖（ふりそで）', '未婚女性最正式的和服，長長的袂可垂到膝下，成人式與婚禮時穿著。'],
            ['帶揚・帶締', '帶子上緣露出的布是「帶揚」，中間綁緊的彩色繩是「帶締」。'],
            ['立矢結', '背後斜向展開的華麗帶結，是振袖最搶眼的地方。']]
    },
    yukata: {
        name: '浴衣', kana: 'ゆかた', era: '江戶〜現代', icon: '🎆', robe: 'long', sleeve: 'medium', bottom: 'none',
        collar: 'v', obi: '#f2c14e', obiStyle: 'bunko', hat: 'none', hair: 'bun', extras: ['uchiwa', 'kanzashi'], footwear: 'geta',
        defaultColor: '#1e50a2', defaultPattern: 'seigaiha',
        tags: ['江戶〜現代', '浴衣・團扇'],
        desc: [['浴衣（ゆかた）', '原是沐浴後穿的單層棉衣，如今是夏日祭典與煙火大會的代表服裝。'],
            ['文庫結與木屐', '背後打成蝴蝶狀的「文庫結」，手拿團扇、腳踩木屐（下駄）。']]
    },
    haikara: {
        name: '女學生袴', kana: 'はいからさん', era: '明治・大正', icon: '🎀', robe: 'hip', sleeve: 'nishaku', bottom: 'hakama', hakamaHigh: true, bottomColor: '#773c30',
        collar: 'v', hat: 'none', hair: 'halfup', extras: ['ribbon'], footwear: 'boots', defaultColor: '#a59aca', defaultPattern: 'yagasuri',
        tags: ['明治・大正', '矢絣・海老茶袴'],
        desc: [['矢絣與二尺袖', '箭羽紋（矢絣）的和服配上稍長的「二尺袖」，是明治大正女學生的經典打扮。'],
            ['海老茶袴', '在胸下高高繫起的深紅褐色女袴，又稱「海老茶式部」。'],
            ['大緞帶與編上靴', '頭上的大緞帶搭配西式繫帶靴，是和洋折衷的「ハイカラさん」風格。']]
    },
    haori: {
        name: '羽織袴', kana: 'はおりはかま', era: '江戶〜現代', icon: '🎎', robe: 'hip', sleeve: 'medium', bottom: 'hakama', bottomColor: '#7d7a84', bottomPattern: 'shima',
        collar: 'v', innerColor: '#5c6670', hat: 'none', hair: 'short', extras: ['haori'], footwear: 'zori', defaultColor: '#2b2b2b',
        tags: ['江戶〜現代', '紋付羽織・仙台平袴'],
        desc: [['紋付羽織', '穿在和服外的短外套，背後與胸前印有白色家紋，以白色「羽織紐」繫起；黑色紋付是男性最正式的禮裝。'],
            ['仙台平袴', '細條紋的絹織袴，是男子禮裝的標準搭配。']]
    },
    yamabushi: {
        name: '山伏', kana: 'やまぶし', era: '修驗道', icon: '⛰️', robe: 'knee', sleeve: 'wide', bottom: 'kukuri', bottomColor: '#e9e2cf',
        collar: 'v', belt: '#5b4636', hat: 'tokin', hair: 'male', extras: ['bonten', 'staff'], footwear: 'waraji', defaultColor: '#e9e2cf', defaultPattern: 'asanoha',
        tags: ['修驗道', '鈴懸・梵天・錫杖'],
        desc: [['鈴懸（すずかけ）', '在山中修行的修驗者所穿的麻衣，常見麻葉紋，象徵驅邪與成長。'],
            ['頭襟與結袈裟', '額上的小小黑色頭巾「頭襟（ときん）」，胸前垂掛六顆「梵天」絨球。'],
            ['錫杖與腳絆', '頂端有金屬環的手杖，走路時叮噹作響；小腿綁上白色腳絆、腳穿草鞋。']]
    }
};

// 路上的小人物：武士・商人・神官・百姓（也可在換裝間穿）
Object.assign(OUTFIT_TYPES, {
    bushi: {
        name: '武士', kana: 'ぶし', era: '江戶時代', icon: '⚔️', robe: 'hip', sleeve: 'medium', bottom: 'hakama', bottomMatch: true,
        collar: 'v', innerColor: '#3b3f46', hat: 'none', hair: 'chonmage', extras: ['kataginu', 'swords'], footwear: 'zori', defaultColor: '#46536a',
        tags: ['江戶時代', '裃・大小二刀'],
        desc: [['裃（かみしも）', '肩部撐開成翼狀的「肩衣」與同色的袴成套，是武士登城時的正式服裝。'],
            ['大小（だいしょう）', '腰間插著一長一短兩把刀，是武士身分的象徵。'],
            ['丁髷（ちょんまげ）', '剃去頭頂（月代）、把頭髮往前摺成髷的髮型。']]
    },
    shonin: {
        name: '商人', kana: 'しょうにん', era: '江戶時代', icon: '💰', robe: 'long', sleeve: 'medium', bottom: 'none',
        collar: 'v', obi: '#3b3226', obiStyle: 'kaku', hat: 'none', hair: 'chonmage', extras: ['maekake', 'furoshiki'], footwear: 'zori',
        defaultColor: '#8a6d55', defaultPattern: 'shima',
        tags: ['江戶時代', '著流し・前掛'],
        desc: [['著流し與角帶', '不穿袴、只繫一條硬挺「角帶」的日常和服，是町人的打扮。'],
            ['前掛（まえかけ）', '印著店號的深藍色圍裙，商家伙計的工作服。'],
            ['風呂敷包', '用唐草紋包袱巾包起貨物背在背上，走遍各地行商。']]
    },
    kannushi: {
        name: '神官', kana: 'かんぬし', era: '神社', icon: '⛩️', robe: 'knee', sleeve: 'kariginu', bottom: 'hakama', bottomColor: '#5fa8c8',
        collar: 'round', belt: '#d8d2c2', hat: 'eboshi', hair: 'male', extras: ['shaku'], footwear: 'asagutsu', defaultColor: '#f6f4ee',
        tags: ['神社', '狩衣・淺葱袴・笏'],
        desc: [['淨衣與狩衣', '神職祭祀時穿著白色或淡色的狩衣，象徵清淨。'],
            ['淺葱袴', '淡藍色的袴，依神職的位階會穿不同顏色的袴。'],
            ['笏（しゃく）', '手中拿著的細長木板，祭典時用來端正姿勢、記錄儀式順序。']]
    },
    hyakusho: {
        name: '百姓', kana: 'ひゃくしょう', era: '江戶時代', icon: '🌾', robe: 'knee', sleeve: 'tsutsu', bottom: 'momohiki', bottomColor: '#2e3a4f',
        collar: 'v', belt: '#b89a62', hat: 'sugegasa', hair: 'chonmage', extras: ['kago'], footwear: 'waraji', defaultColor: '#3b5f8a', defaultPattern: 'ichimatsu',
        tags: ['江戶時代', '野良著・菅笠'],
        desc: [['野良著（のらぎ）', '下田工作穿的短衣，筒袖不礙事，常用耐髒的藍染布。'],
            ['菅笠與背簍', '用菅草編成的斗笠遮陽擋雨，背上的竹簍裝著農作物或旅途行李。']]
    }
});

const WA_COLORS = [
    { name: '紅', hex: '#c53d43' }, { name: '桜色', hex: '#f4b3c2' }, { name: '茜色', hex: '#b7282e' },
    { name: '山吹色', hex: '#f8b500' }, { name: '萌黃', hex: '#a7b63c' }, { name: '若竹色', hex: '#68be8d' },
    { name: '淺蔥色', hex: '#00a3af' }, { name: '水色', hex: '#9fc3dc' }, { name: '瑠璃色', hex: '#1e50a2' },
    { name: '藤色', hex: '#a59aca' }, { name: '江戶紫', hex: '#745399' }, { name: '墨色', hex: '#2b2b2b' },
    { name: '白練', hex: '#f3f1ea' }, { name: '生成', hex: '#e9e2cf' }
];
const WA_PATTERNS = [
    { id: 'plain', name: '無地' }, { id: 'asanoha', name: '麻の葉' }, { id: 'ichimatsu', name: '市松' },
    { id: 'seigaiha', name: '青海波' }, { id: 'yagasuri', name: '矢絣' }, { id: 'sakura', name: '桜' },
    { id: 'shima', name: '縞' }, { id: 'shippo', name: '七寶' }
];
// 每種花紋一個循環單位在衣服上的實際大小（角色座標）
const PATTERN_TILE = { asanoha: 0.11, ichimatsu: 0.1, seigaiha: 0.12, yagasuri: 0.1, sakura: 0.15, shima: 0.09, shippo: 0.1 };

function hexLum(hex) {
    const c = new THREE.Color(hex);
    return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}
function patternAccent(hex) {
    const c = new THREE.Color(hex);
    return hexLum(hex) > 0.6 ? '#' + c.clone().multiplyScalar(0.6).getHexString() : '#' + c.clone().lerp(new THREE.Color('#ffffff'), 0.62).getHexString();
}
// 和柄：全部畫成可無縫拼接的一個循環單位；回傳畫布（麻の葉為 1:√3 長方形）
function drawPattern(pattern, base, w = 128) {
    const h = pattern === 'asanoha' ? Math.round(w * Math.sqrt(3)) : w;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    const acc = patternAccent(base);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = acc;
    ctx.fillStyle = acc;
    ctx.lineCap = 'round';
    ctx.lineWidth = w / 48;
    const wrap = fn => [-1, 0, 1].forEach(dx => [-1, 0, 1].forEach(dy => fn(dx * w, dy * h)));
    if (pattern === 'ichimatsu') {
        const c = w / 4;
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) ctx.fillRect(i * c, j * c, c, c);
    } else if (pattern === 'shima') {
        const c = w / 6;
        for (let i = 0; i < 6; i++) ctx.fillRect(i * c, 0, c * (i % 3 === 0 ? 0.42 : 0.14), h);
    } else if (pattern === 'yagasuri') {
        // 矢絣：一欄箭羽朝下、下一欄換色
        const c = w / 2;
        for (let col = 0; col < 2; col++) {
            ctx.fillStyle = col ? acc : base;
            ctx.fillRect(col * c, 0, c, h);
            ctx.fillStyle = col ? base : acc;
            for (let j = -1; j < 3; j++) {
                const y = j * c;
                ctx.beginPath();
                ctx.moveTo(col * c, y);
                ctx.lineTo(col * c + c / 2, y + c * 0.32);
                ctx.lineTo(col * c + c, y);
                ctx.lineTo(col * c + c, y + c * 0.5);
                ctx.lineTo(col * c + c / 2, y + c * 0.82);
                ctx.lineTo(col * c, y + c * 0.5);
                ctx.closePath();
                ctx.fill();
            }
        }
    } else if (pattern === 'seigaiha') {
        // 青海波：層層相疊的同心半圓
        const rr = w / 4;
        for (let row = -2; row < 10; row++) for (let col = -1; col < 3; col++) {
            const cx = col * rr * 2 + (row % 2 ? rr : 0), cy = row * rr * 0.5;
            for (let k = 4; k > 0; k--) {
                ctx.beginPath();
                ctx.arc(cx, cy, rr * k / 4, Math.PI, 0);
                ctx.closePath();
                ctx.fillStyle = k % 2 ? acc : base;
                ctx.fill();
            }
        }
    } else if (pattern === 'sakura') {
        const flower = (x, y, r, rot) => {
            for (let k = 0; k < 5; k++) {
                const a = rot + (k / 5) * Math.PI * 2;
                ctx.save();
                ctx.translate(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
                ctx.rotate(a + Math.PI / 2);
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 0.32, r * 0.46, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = '#f8d36b';
            ctx.beginPath(); ctx.arc(x, y, r * 0.15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = acc;
        };
        [[0.22, 0.24, 0.17, 0.2], [0.72, 0.3, 0.12, 1.1], [0.45, 0.74, 0.15, 0.6], [0.92, 0.82, 0.1, 2.0]].forEach(([x, y, r, rot]) =>
            wrap((ox, oy) => flower(x * w + ox, y * h + oy, r * w, rot)));
    } else if (pattern === 'asanoha') {
        // 麻の葉：正三角形格子，每個三角形再從頂點連到重心
        const L = w / 2, rH = h / 4;
        const off = j => (((j % 2) + 2) % 2) * L / 2;
        const tri = (a, b, c) => {
            const gx = (a[0] + b[0] + c[0]) / 3, gy = (a[1] + b[1] + c[1]) / 3;
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
            [a, b, c].forEach(p => { ctx.moveTo(p[0], p[1]); ctx.lineTo(gx, gy); });
            ctx.stroke();
        };
        for (let j = -1; j < 5; j++) for (let k = -2; k < 4; k++) {
            const A = [k * L + off(j), j * rH], B = [(k + 1) * L + off(j), j * rH];
            const C = [A[0] + L / 2, (j + 1) * rH], D = [C[0] + L, (j + 1) * rH];
            tri(A, B, C);
            tri(B, C, D);
        }
    } else if (pattern === 'shippo') {
        const rr = w / 2;
        for (let i = -1; i <= 3; i++) for (let j = -1; j <= 3; j++) {
            ctx.beginPath();
            ctx.arc(i * rr, j * rr, rr * 0.707, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    return cv;
}
const _fabricCache = {};
function fabricMaterial(hex, pattern = 'plain') {
    const key = hex + pattern;
    if (_fabricCache[key]) return _fabricCache[key];
    let mat;
    if (pattern === 'plain') {
        mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.68 });
    } else {
        const cv = drawPattern(pattern, hex, 128);
        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // 長方形的麻の葉：縱向依比例重複，保持正三角形不變形
        tex.repeat.set(1, cv.width / cv.height);
        tex.anisotropy = 8;
        mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.68 });
    }
    mat.userData.tile = PATTERN_TILE[pattern] || 0.1;
    _fabricCache[key] = mat;
    return mat;
}
function patternSwatchURL(hex, pattern) {
    const src = drawPattern(pattern, hex, 64);
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    cv.getContext('2d').drawImage(src, 0, 0, 64, Math.min(64, src.height), 0, 0, 64, Math.min(64, src.height));
    return cv.toDataURL();
}

// ---------- 依實際尺寸重算貼圖座標，避免花紋被拉伸 ----------
function uvLathe(geo, pts, segs, rMean, phiLen = Math.PI * 2) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + pts[i].distanceTo(pts[i - 1]);
    const uv = geo.attributes.uv, n = pts.length;
    for (let i = 0; i <= segs; i++) for (let j = 0; j < n; j++) uv.setXY(i * n + j, (i / segs) * phiLen * rMean, cum[j]);
    uv.needsUpdate = true;
}
function uvScale(geo, sx, sy) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
    uv.needsUpdate = true;
}
function uvBox(geo, w, h, d) {
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    const uv = geo.attributes.uv;
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
    uv.needsUpdate = true;
}
// 貼圖座標是「實際長度」，再依材質的花紋大小換算
function tileUV(geo, mat) {
    const t = (mat && mat.userData && mat.userData.tile) || 0.1;
    uvScale(geo, 1 / t, 1 / t);
}
function fabricLathe(prof, mat, segs = 28, squashZ = 0.82, phiStart = 0, phiLen = Math.PI * 2) {
    const pts = prof.map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(pts, segs, phiStart, phiLen);
    const rMean = prof.reduce((s, p) => s + p[0], 0) / prof.length;
    uvLathe(geo, pts, segs, rMean, phiLen);
    tileUV(geo, mat);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.scale.z = squashZ;
    return m;
}
function fabricBox(w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    uvBox(geo, w, h, d);
    tileUV(geo, mat);
    return new THREE.Mesh(geo, mat);
}
// 圓角矩形板（袂、垂髮）：沿 x 擠出厚度
function roundedPanel(width, height, depth, rBottom, rTop, mat, isFabric = true) {
    const s = new THREE.Shape();
    const w2 = width / 2;
    s.moveTo(-w2 + rTop, 0);
    s.lineTo(w2 - rTop, 0);
    if (rTop) s.quadraticCurveTo(w2, 0, w2, -rTop);
    s.lineTo(w2, -height + rBottom);
    s.quadraticCurveTo(w2, -height, w2 - rBottom, -height);
    s.lineTo(-w2 + rBottom, -height);
    s.quadraticCurveTo(-w2, -height, -w2, -height + rBottom);
    s.lineTo(-w2, -rTop);
    if (rTop) s.quadraticCurveTo(-w2, 0, -w2 + rTop, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: Math.min(0.01, depth * 0.25), bevelSegments: 2, curveSegments: 6 });
    geo.translate(0, 0, -depth / 2);
    if (isFabric) tileUV(geo, mat);
    geo.rotateY(Math.PI / 2);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
}
// 兩點之間的細帶（衣襟、帶締、袴紐）
function strip(a, b, w, th, mat) {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, th), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return m;
}

// 衣身輪廓（半徑, 高度）：肩→腰→裾；長和服到腳踝、膝丈、腰丈三種
const ROBE_PROFILES = {
    long: [[0.122, 0.0], [0.118, 0.06], [0.108, 0.17], [0.104, 0.27], [0.106, 0.34], [0.104, 0.385], [0.088, 0.415], [0.06, 0.435], [0.038, 0.445], [0.0, 0.448]],
    knee: [[0.132, 0.12], [0.122, 0.17], [0.11, 0.24], [0.106, 0.31], [0.106, 0.36], [0.098, 0.4], [0.075, 0.428], [0.045, 0.443], [0.0, 0.448]],
    hip: [[0.11, 0.22], [0.106, 0.28], [0.106, 0.34], [0.104, 0.385], [0.088, 0.415], [0.06, 0.435], [0.038, 0.445], [0.0, 0.448]]
};
function robeRadiusAt(y, prof) {
    for (let i = 0; i < prof.length - 1; i++) {
        const [r1, y1] = prof[i], [r2, y2] = prof[i + 1];
        if ((y - y1) * (y - y2) <= 0) return r1 + (r2 - r1) * ((y - y1) / ((y2 - y1) || 1));
    }
    return prof[0][0];
}

// Q 版人物；style = { type, color, pattern }
function buildCharacter(style = 'heian') {
    if (typeof style === 'string') style = style === 'miko' ? { type: 'miko', color: '#ffffff', pattern: 'plain' } : { type: 'kariginu', color: '#9fc3dc', pattern: 'plain' };
    const def = OUTFIT_TYPES[style.type] || OUTFIT_TYPES.kariginu;
    const smooth = (color, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6 }, extra));
    if (!MATS.charReady) {
        MATS.charReady = true;
        MATS.cSkin = smooth(0xf9d6bd, { roughness: 0.75 });
        MATS.cHair = smooth(0x231d1f, { roughness: 0.42 });
        MATS.cEboshi = smooth(0x16161a, { roughness: 0.3, metalness: 0.1 });
        MATS.cLining = smooth(0xfaf6ee);
        MATS.cCord = smooth(0xd9534f);
        MATS.cShoe = smooth(0x1b1b1f, { roughness: 0.3 });
        MATS.cEye = smooth(0x111111, { roughness: 0.2 });
        MATS.cBrow = smooth(0x3a2a24);
        MATS.cMouth = smooth(0xb5524f);
        MATS.cBlush = new THREE.MeshStandardMaterial({ color: 0xf39aa0, roughness: 0.9, transparent: true, opacity: 0.75 });
        MATS.cGeta = smooth(0xb98a5a, { roughness: 0.8 });
        MATS.cBoots = smooth(0x5a3a28, { roughness: 0.5 });
        MATS.cGold = smooth(0xe7b84a, { metalness: 0.6, roughness: 0.3 });
        MATS.cVeil = new THREE.MeshStandardMaterial({ color: 0xfdfbf6, roughness: 0.9, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false });
        MATS.cStraw = smooth(0xc9a46a, { roughness: 0.9, flatShading: true });
        MATS.cTabi = smooth(0xfbfaf6);
        MATS.cInner = smooth(0x8b2d35);
    }
    const robeMat = fabricMaterial(style.color, style.pattern);
    const isHaori = def.extras.includes('haori') || def.extras.includes('kataginu');
    const kimonoMat = isHaori ? fabricMaterial(def.innerColor, 'plain') : robeMat;
    const bottomMat = def.bottom !== 'none' ? (def.bottomMatch ? robeMat : fabricMaterial(def.bottomColor, def.bottomPattern || 'plain')) : robeMat;
    const accent = smooth(def.obi || def.belt || '#c53d43');
    const edgeMat = smooth('#' + new THREE.Color(style.color).multiplyScalar(hexLum(style.color) > 0.6 ? 0.78 : 0.7).getHexString());
    const c = new THREE.Group();
    const add = (obj, x = 0, y = 0, z = 0, parent = c) => { obj.position.set(x, y, z); parent.add(obj); return obj; };
    const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
    const prof = ROBE_PROFILES[def.robe] || ROBE_PROFILES.long;
    const frontZ = y => robeRadiusAt(y, prof) * 0.82 + 0.004;

    // ---------- 下半身：袴／指貫／長和服下的腳 ----------
    const footwear = def.footwear || (def.bottom === 'sashinuki' ? 'asagutsu' : 'zori');
    const legs = [-1, 1].map(s => {
        const leg = new THREE.Group();
        leg.position.set(s * 0.05, 0.16, 0);
        if (def.bottom === 'sashinuki') {
            // 指貫：鼓起的燈籠狀袴，腳踝束起
            const pant = mesh(new THREE.SphereGeometry(0.068, 16, 12), bottomMat);
            pant.scale.set(0.95, 1.25, 0.95);
            pant.position.y = -0.065;
            const cuff = mesh(new THREE.TorusGeometry(0.03, 0.01, 6, 14), smooth(def.bottomColor));
            cuff.rotation.x = Math.PI / 2;
            cuff.position.y = -0.135;
            leg.add(pant, cuff);
        } else if (def.bottom === 'momohiki') {
            // 股引：貼身的長褲
            const pant = mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.15, 12), bottomMat);
            pant.position.y = -0.075;
            leg.add(pant);
        } else if (def.bottom === 'kukuri') {
            // 括袴＋白色腳絆
            const pant = mesh(new THREE.CylinderGeometry(0.05, 0.062, 0.08, 14), bottomMat);
            pant.position.y = -0.04;
            const kyahan = mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.07, 12), MATS.cTabi);
            kyahan.position.y = -0.11;
            [-0.09, -0.125].forEach(y => { const tie = mesh(new THREE.TorusGeometry(0.034, 0.004, 4, 12), MATS.cBrow); tie.rotation.x = Math.PI / 2; tie.position.y = y; leg.add(tie); });
            leg.add(pant, kyahan);
        }
        // 足袋＋鞋
        const foot = mesh(new THREE.SphereGeometry(0.034, 12, 8), footwear === 'boots' ? MATS.cBoots : footwear === 'asagutsu' ? MATS.cShoe : MATS.cTabi);
        foot.scale.set(0.85, 0.6, 1.45);
        foot.position.set(0, -0.148, 0.012);
        leg.add(foot);
        if (footwear === 'boots') {
            const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.07, 10), MATS.cBoots);
            shaft.position.y = -0.115;
            leg.add(shaft);
        }
        if (footwear === 'zori' || footwear === 'geta' || footwear === 'waraji') {
            const soleMat = footwear === 'geta' ? MATS.cGeta : footwear === 'waraji' ? MATS.cStraw : smooth(0xd8c3a5);
            const sole = mesh(new THREE.BoxGeometry(0.058, footwear === 'geta' ? 0.014 : 0.012, 0.1), soleMat);
            sole.position.set(0, -0.166, 0.012);
            leg.add(sole);
            if (footwear === 'geta') [-0.025, 0.035].forEach(z => add(mesh(new THREE.BoxGeometry(0.05, 0.014, 0.012), soleMat), 0, -0.178, z, leg));
            const hanao = mesh(new THREE.TorusGeometry(0.018, 0.005, 5, 10, Math.PI), footwear === 'waraji' ? MATS.cStraw : accent);
            hanao.position.set(0, -0.15, 0.04);
            leg.add(hanao);
        }
        c.add(leg);
        return leg;
    });

    // 袴（巫女・女學生・羽織袴）：喇叭狀、多褶，前有紐、後有腰板
    if (def.bottom === 'hakama') {
        const top = def.hakamaHigh ? 0.37 : 0.31;
        const hp = [[0.152, 0.015], [0.138, 0.08], [0.122, 0.17], [0.112, top - 0.04], [0.108, top]];
        const hak = fabricLathe(hp, bottomMat, 14, 0.86);
        hak.material = bottomMat;
        c.add(hak);
        const hakamaHex = def.bottomMatch ? style.color : def.bottomColor;
        const darker = smooth('#' + new THREE.Color(hakamaHex).multiplyScalar(0.72).getHexString());
        // 前面的褶線
        [-0.06, -0.025, 0.025, 0.06].forEach(x => {
            c.add(strip(new THREE.Vector3(x * 0.9, top - 0.04, 0.098), new THREE.Vector3(x * 1.35, 0.03, 0.132), 0.006, 0.004, darker));
        });
        // 袴紐：前腰交叉綁成十字結
        const himo = smooth(hakamaHex);
        const band = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.018, 24), himo);
        band.scale.z = 0.84;
        band.position.y = top + 0.002;
        c.add(band);
        const knot = mesh(new THREE.BoxGeometry(0.04, 0.018, 0.01), himo);
        knot.position.set(0, top - 0.02, 0.1);
        knot.rotation.z = 0.5;
        const knot2 = knot.clone();
        knot2.rotation.z = -0.5;
        c.add(knot, knot2);
        // 腰板（穿羽織時被外套蓋住）
        if (!def.extras.includes('haori')) {
            const koshi = mesh(new THREE.BoxGeometry(0.1, 0.05, 0.012), darker);
            koshi.position.set(0, top + 0.01, -0.092);
            koshi.rotation.x = -0.15;
            c.add(koshi);
        }
    }

    // ---------- 衣身 ----------
    const body = fabricLathe(prof, kimonoMat, 30, 0.82);
    c.add(body);
    if (def.robe === 'long') {
        // 衽線：上前（左前）的衣襟從腰帶下斜到衣裾，邊緣略為隆起
        c.add(strip(new THREE.Vector3(-0.035, 0.27, frontZ(0.27)), new THREE.Vector3(-0.07, 0.01, frontZ(0.01) - 0.004), 0.008, 0.006, edgeMat));
        c.add(strip(new THREE.Vector3(-0.07, 0.008, frontZ(0.01)), new THREE.Vector3(0.11, 0.004, frontZ(0.01) - 0.03), 0.006, 0.006, MATS.cInner));
    } else if (def.robe === 'knee') {
        // 狩衣・鈴懸：前後兩片衣身，側面開衩
        [-1, 1].forEach(s => c.add(strip(new THREE.Vector3(s * 0.104, 0.33, 0), new THREE.Vector3(s * 0.13, 0.125, 0), 0.006, 0.02, edgeMat)));
    }

    // 裃的肩衣：肩上撐開成翼狀的硬挺布面＋胸前兩片
    if (def.extras.includes('kataginu')) {
        [-1, 1].forEach(s => {
            const wing = fabricBox(0.13, 0.012, 0.12, robeMat);
            wing.position.set(s * 0.115, 0.43, 0);
            wing.rotation.z = s * -0.08;
            c.add(wing);
            const front = strip(new THREE.Vector3(s * 0.065, 0.425, 0.06), new THREE.Vector3(s * 0.03, 0.3, frontZ(0.3) + 0.004), 0.05, 0.01, robeMat);
            c.add(front);
            const back = strip(new THREE.Vector3(s * 0.05, 0.425, -0.07), new THREE.Vector3(s * 0.035, 0.3, -frontZ(0.3) - 0.004), 0.06, 0.01, robeMat);
            c.add(back);
        });
        // 家紋
        [[-0.035, 0.38], [0.035, 0.38]].forEach(([x, y]) => {
            const mon = mesh(new THREE.CircleGeometry(0.011, 12), smooth(0xf6f4ee));
            mon.position.set(x, y, frontZ(y) + 0.012);
            c.add(mon);
        });
    }
    // 羽織：前開的短外套
    if (def.extras.includes('haori')) {
        const hprof = [[0.13, 0.16], [0.122, 0.22], [0.114, 0.3], [0.113, 0.36], [0.104, 0.4], [0.08, 0.428], [0.05, 0.444], [0.032, 0.452]];
        const coat = fabricLathe(hprof, robeMat, 30, 0.84, 0.42, Math.PI * 2 - 0.84);
        coat.material = robeMat.clone();
        coat.material.side = THREE.DoubleSide;
        c.add(coat);
        // 家紋（胸前左右與背後）
        const mon = smooth(0xf6f4ee);
        [[-0.055, 0.38, 0.085], [0.055, 0.38, 0.085], [0, 0.39, -0.1]].forEach(([x, y, z]) => {
            const m = mesh(new THREE.CircleGeometry(0.014, 14), mon);
            m.position.set(x, y, z);
            m.lookAt(x * 3, y, z * 3);
            c.add(m);
        });
        // 羽織紐
        [-1, 1].forEach(s => c.add(strip(new THREE.Vector3(s * 0.045, 0.335, 0.09), new THREE.Vector3(s * 0.008, 0.31, 0.098), 0.006, 0.006, mon)));
        c.add(add(mesh(new THREE.SphereGeometry(0.014, 10, 8), mon), 0, 0.305, 0.1));
    }

    // ---------- 衣領 ----------
    if (def.collar === 'round') {
        // 盤領（狩衣）：立起的圓領＋蜻蛉結扣
        const collar = mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 26), edgeMat);
        collar.rotation.x = Math.PI / 2 - 0.42;
        collar.scale.set(1, 0.85, 1);
        collar.position.set(0, 0.425, 0.012);
        c.add(collar);
        c.add(add(mesh(new THREE.SphereGeometry(0.012, 8, 6), edgeMat), 0.06, 0.405, 0.075));
    } else {
        // 交領「左前」：穿著者的左襟在上，從正面看呈「y」字；內側露出白色半襟
        const collarMat = isHaori ? fabricMaterial(def.innerColor, 'plain') : edgeMat;
        // 交叉點放在帶子上緣附近，讓「y」字整個露在下巴下方
        const yTop = 0.432, yBot = def.obiStyle === 'tateya' ? 0.345 : (def.bottom === 'hakama' && def.hakamaHigh ? 0.372 : 0.318);
        const zf = y => frontZ(y) + 0.002;
        // 半襟（白）：沿著衣襟內側露出一條
        c.add(strip(new THREE.Vector3(-0.06, yTop + 0.004, zf(yTop) - 0.004), new THREE.Vector3(0.0, yBot + 0.014, zf(yBot)), 0.014, 0.006, MATS.cLining));
        c.add(strip(new THREE.Vector3(0.06, yTop + 0.004, zf(yTop) - 0.002), new THREE.Vector3(-0.004, yBot + 0.012, zf(yBot) + 0.002), 0.014, 0.006, MATS.cLining));
        // 下前（穿著者右襟）在下、上前（左襟）在上 —— 左前
        c.add(strip(new THREE.Vector3(-0.078, yTop, zf(yTop)), new THREE.Vector3(0.008, yBot, zf(yBot) + 0.004), 0.024, 0.008, collarMat));
        c.add(strip(new THREE.Vector3(0.078, yTop, zf(yTop) + 0.004), new THREE.Vector3(-0.012, yBot - 0.004, zf(yBot) + 0.01), 0.025, 0.009, collarMat));
        // 背後的衣領
        const back = mesh(new THREE.TorusGeometry(0.05, 0.009, 6, 16, Math.PI), collarMat);
        back.rotation.x = Math.PI / 2 - 0.3;
        back.rotation.z = Math.PI;
        back.position.set(0, 0.44, -0.004);
        c.add(back);
    }

    // ---------- 帶 ----------
    const waistY = 0.3;
    if (def.obiStyle === 'tateya' || def.obiStyle === 'bunko') {
        const big = def.obiStyle === 'tateya';
        const obiH = big ? 0.082 : 0.06;
        const obi = mesh(new THREE.CylinderGeometry(0.109, 0.109, obiH, 28), accent);
        obi.scale.z = 0.84;
        obi.position.y = waistY;
        c.add(obi);
        if (def.obiage) {
            // 帶揚：帶子上緣露出的一條布
            const ag = mesh(new THREE.CylinderGeometry(0.106, 0.108, 0.012, 24, 1, false, -0.9, 1.8), smooth(def.obiage));
            ag.scale.z = 0.84;
            ag.position.y = waistY + obiH / 2 + 0.004;
            c.add(ag);
        }
        // 帶締：中間的彩色編繩與前方結
        const jime = mesh(new THREE.TorusGeometry(0.11, 0.0045, 5, 32), smooth(def.obijime || '#d9534f'));
        jime.rotation.x = Math.PI / 2;
        jime.scale.y = 0.85;
        jime.position.y = waistY - 0.004;
        c.add(jime);
        c.add(add(mesh(new THREE.SphereGeometry(0.009, 8, 6), smooth(def.obijime || '#d9534f')), 0.012, waistY - 0.006, 0.094));
        // 背後帶結
        const bow = new THREE.Group();
        const wingW = big ? 0.13 : 0.085, wingH = big ? 0.06 : 0.045;
        [-1, 1].forEach(s => {
            const wing = mesh(new THREE.BoxGeometry(wingW, wingH, 0.026), accent);
            wing.position.set(s * wingW * 0.42, big ? s * 0.025 : 0, 0);
            wing.rotation.z = big ? s * 0.55 : s * 0.12;
            bow.add(wing);
        });
        bow.add(add(mesh(new THREE.BoxGeometry(0.034, wingH * 0.9, 0.036), accent), 0, 0, 0.004, bow));
        if (!big) [-1, 1].forEach(s => bow.add(add(mesh(new THREE.BoxGeometry(0.03, 0.07, 0.012), accent), s * 0.012, -0.045, 0.008, bow)));
        bow.position.set(0, waistY + (big ? 0.035 : 0.01), -0.105);
        c.add(bow);
    } else if (def.obiStyle === 'kaku') {
        // 角帶：細而硬挺，背後打貝口結
        const kaku = mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.034, 24), accent);
        kaku.scale.z = 0.84;
        kaku.position.y = 0.29;
        c.add(kaku);
        c.add(add(mesh(new THREE.BoxGeometry(0.06, 0.03, 0.02), accent), 0, 0.29, -0.098));
    } else if (def.obiStyle === 'kakeobi') {
        // 掛帶：從肩上斜掛到胸前的紅帶
        [-1, 1].forEach(s => c.add(strip(new THREE.Vector3(s * 0.07, 0.43, 0.02), new THREE.Vector3(s * 0.02, 0.31, frontZ(0.31) + 0.006), 0.012, 0.005, accent)));
        const kb = mesh(new THREE.TorusGeometry(0.106, 0.006, 5, 28), accent);
        kb.rotation.x = Math.PI / 2;
        kb.scale.y = 0.84;
        kb.position.y = 0.31;
        c.add(kb);
    } else if (def.belt) {
        const belt = mesh(new THREE.CylinderGeometry(0.109, 0.109, 0.02, 24), accent);
        belt.scale.z = 0.84;
        belt.position.y = def.robe === 'knee' ? 0.29 : 0.3;
        c.add(belt);
    }

    // ---------- 袖：上臂袖筒＋垂下的袂（可擺動） ----------
    const SL = {
        tsutsu: { H: 0.11, W: 0.075, D: 0.03, r: 0.02 },
        kariginu: { H: 0.22, W: 0.17, D: 0.05, r: 0.03 },
        wide: { H: 0.19, W: 0.14, D: 0.04, r: 0.035 },
        medium: { H: 0.15, W: 0.12, D: 0.034, r: 0.035 },
        nishaku: { H: 0.2, W: 0.12, D: 0.034, r: 0.04 },
        furisode: { H: 0.32, W: 0.13, D: 0.034, r: 0.045 }
    }[def.sleeve] || { H: 0.15, W: 0.12, D: 0.034, r: 0.035 };
    const sleeveMat = robeMat;
    const arms = [-1, 1].map(s => {
        const arm = new THREE.Group();
        arm.position.set(s * 0.098, 0.418, 0);
        const tamoto = roundedPanel(SL.W, SL.H, SL.D, SL.r, 0.012, sleeveMat);
        tamoto.position.set(s * 0.024, 0.01, -0.006);
        tamoto.rotation.z = s * 0.1;
        arm.add(tamoto);
        // 袖口（內裡色）與伸出的手
        const cuffMat = def.sleeve === 'kariginu' ? smooth('#' + new THREE.Color(style.color).multiplyScalar(0.55).getHexString()) : (style.type === 'miko' ? smooth(def.bottomColor) : MATS.cInner);
        const cuff = mesh(new THREE.CircleGeometry(0.024, 14), cuffMat);
        cuff.scale.set(0.9, 1.6, 1);
        cuff.position.set(s * 0.028, -0.07, SL.W / 2 + SL.D * 0.26);
        arm.add(cuff);
        const hand = mesh(new THREE.SphereGeometry(0.021, 10, 8), MATS.cSkin);
        hand.position.set(s * 0.028, -0.1, SL.W / 2 + 0.008);
        arm.add(hand);
        if (def.extras.includes('tsuyu')) {
            // 袖括之緒：沿袖口邊緣的紅繩與流蘇
            arm.add(strip(new THREE.Vector3(s * 0.05, -SL.H + 0.03, SL.W / 2), new THREE.Vector3(s * 0.05, -0.02, SL.W / 2), 0.005, 0.005, MATS.cCord));
            [-1, 1].forEach(k => arm.add(add(mesh(new THREE.ConeGeometry(0.008, 0.035, 6), MATS.cCord), s * 0.05 + k * 0.006, -SL.H - 0.005, SL.W / 2 - 0.01, arm)));
        }
        if (def.extras.includes('kikutoji')) {
            [-0.05, -0.12].forEach(y => arm.add(add(mesh(new THREE.SphereGeometry(0.014, 8, 6), accent), s * 0.05, y, 0.0, arm)));
        }
        c.add(arm);
        return arm;
    });

    // ---------- 頭與五官 ----------
    c.add(add(mesh(new THREE.SphereGeometry(0.15, 28, 20), MATS.cSkin), 0, 0.565, 0));
    [-1, 1].forEach(s => {
        c.add(add(mesh(new THREE.SphereGeometry(0.019, 12, 10), MATS.cEye), s * 0.052, 0.56, 0.137));
        c.add(add(mesh(new THREE.SphereGeometry(0.006, 6, 6), MATS.cLining), s * 0.052 + 0.006, 0.568, 0.152));
        const brow = mesh(new THREE.BoxGeometry(0.028, 0.006, 0.006), MATS.cBrow);
        brow.position.set(s * 0.052, 0.6, 0.134);
        brow.rotation.z = s * -0.12;
        c.add(brow);
        const b = mesh(new THREE.SphereGeometry(0.024, 12, 8), MATS.cBlush);
        b.scale.set(1, 0.55, 0.3);
        b.position.set(s * 0.088, 0.53, 0.122);
        c.add(b);
    });
    const mouth = mesh(new THREE.TorusGeometry(0.012, 0.0032, 5, 10, Math.PI), MATS.cMouth);
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, 0.522, 0.148);
    c.add(mouth);

    // ---------- 髮型 ----------
    if (def.hair !== 'chonmage') {
        const cap = mesh(new THREE.SphereGeometry(0.157, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), MATS.cHair);
        cap.position.set(0, 0.575, -0.018);
        cap.rotation.x = -0.42;
        c.add(cap);
    }
    const backHair = mesh(new THREE.SphereGeometry(0.152, 24, 16), MATS.cHair);
    backHair.scale.set(1, 0.95, 0.9);
    backHair.position.set(0, 0.56, -0.03);
    c.add(backHair);
    if (['long', 'bun', 'halfup'].includes(def.hair)) {
        // 前髮
        const bang = mesh(new THREE.SphereGeometry(0.158, 40, 16, -1.15, 2.3, 0.18, 0.62), MATS.cHair);
        bang.position.set(0, 0.57, 0.004);
        c.add(bang);
        // 兩側鬢髮
        [-1, 1].forEach(s => {
            const side = mesh(new THREE.SphereGeometry(0.05, 12, 10), MATS.cHair);
            side.scale.set(0.55, 1.4, 0.8);
            side.position.set(s * 0.13, 0.52, 0.03);
            c.add(side);
        });
    }
    if (def.hair === 'long') {
        const fall = roundedPanel(0.2, style.type === 'tsubo' ? 0.36 : 0.3, 0.05, 0.03, 0.06, MATS.cHair, false);
        fall.rotation.y = Math.PI / 2;
        fall.position.set(0, 0.6, -0.12);
        c.add(fall);
    } else if (def.hair === 'halfup') {
        const fall = roundedPanel(0.26, 0.26, 0.05, 0.05, 0.08, MATS.cHair, false);
        fall.rotation.y = Math.PI / 2;
        fall.position.set(0, 0.6, -0.11);
        c.add(fall);
    } else if (def.hair === 'bun') {
        // 日本髮：頭頂的髷、左右的鬢、後方的髱
        const mage = mesh(new THREE.SphereGeometry(0.075, 18, 12), MATS.cHair);
        mage.scale.set(1.35, 0.8, 1);
        mage.position.set(0, 0.705, -0.05);
        c.add(mage);
        [-1, 1].forEach(s => {
            const bin = mesh(new THREE.SphereGeometry(0.06, 14, 10), MATS.cHair);
            bin.scale.set(0.8, 1, 1.1);
            bin.position.set(s * 0.125, 0.58, -0.04);
            c.add(bin);
        });
        const tabo = mesh(new THREE.SphereGeometry(0.06, 14, 10), MATS.cHair);
        tabo.scale.set(1.2, 0.8, 1);
        tabo.position.set(0, 0.5, -0.13);
        c.add(tabo);
    } else if (def.hair === 'chonmage') {
        // 丁髷：剃光的月代（頭頂）＋往前摺的髷
        const pate = mesh(new THREE.SphereGeometry(0.1585, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.27), MATS.cSkin);
        pate.position.set(0, 0.565, 0);
        pate.rotation.x = 0.22;
        c.add(pate);
        const mage = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.1, 8), MATS.cHair);
        mage.rotation.x = Math.PI / 2 - 0.15;
        mage.position.set(0, 0.712, 0.0);
        c.add(mage);
        c.add(add(mesh(new THREE.SphereGeometry(0.016, 8, 6), MATS.cHair), 0, 0.71, -0.05));
    } else if (def.hair === 'male' || def.hair === 'short') {
        [-1, 1].forEach(s => {
            const side = mesh(new THREE.BoxGeometry(0.02, 0.06, 0.04), MATS.cHair);
            side.position.set(s * 0.142, 0.54, 0.02);
            c.add(side);
        });
        if (def.hair === 'male' && def.hat !== 'eboshi') c.add(add(mesh(new THREE.SphereGeometry(0.035, 10, 8), MATS.cHair), 0, 0.72, -0.04));
    }

    // ---------- 頭飾與帽子 ----------
    if (def.hat === 'eboshi') {
        const ebo = mesh(new THREE.CylinderGeometry(0.072, 0.098, 0.21, 20), MATS.cEboshi);
        ebo.rotation.x = -0.18;
        ebo.scale.set(1, 1, 0.8);
        ebo.position.set(0, 0.79, -0.035);
        c.add(ebo);
        const tip = mesh(new THREE.SphereGeometry(0.072, 16, 10), MATS.cEboshi);
        tip.scale.set(1, 0.5, 0.8);
        tip.position.set(0, 0.89, -0.02);
        c.add(tip);
        const band = mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 20), MATS.cEboshi);
        band.rotation.x = Math.PI / 2;
        band.position.set(0, 0.69, -0.02);
        c.add(band);
    } else if (def.hat === 'ichimegasa') {
        const kasa = mesh(new THREE.ConeGeometry(0.28, 0.1, 24), MATS.cStraw);
        kasa.position.y = 0.76;
        c.add(kasa);
        c.add(add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 14), MATS.cStraw), 0, 0.82, 0));
        const rim = mesh(new THREE.TorusGeometry(0.278, 0.006, 5, 32), smooth(0x8a6a3c));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.712;
        c.add(rim);
        // 虫垂衣：輕薄半透明、帶有垂墜皺褶
        const vgeo = new THREE.CylinderGeometry(0.265, 0.29, 0.4, 48, 4, true);
        const vp = vgeo.attributes.position;
        for (let i = 0; i < vp.count; i++) {
            const a = Math.atan2(vp.getZ(i), vp.getX(i));
            const k = 1 + Math.sin(a * 14) * 0.035 * (0.5 - vp.getY(i) / 0.4 + 0.5);
            vp.setX(i, vp.getX(i) * k);
            vp.setZ(i, vp.getZ(i) * k);
        }
        vgeo.computeVertexNormals();
        const veil = mesh(vgeo, MATS.cVeil);
        veil.position.y = 0.51;
        c.add(veil);
    } else if (def.hat === 'sugegasa') {
        const kasa = mesh(new THREE.ConeGeometry(0.24, 0.1, 22), MATS.cStraw);
        kasa.position.y = 0.745;
        c.add(kasa);
        c.add(add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.03, 10), MATS.cStraw), 0, 0.705, 0));
    } else if (def.hat === 'tokin') {
        const tokin = mesh(new THREE.DodecahedronGeometry(0.045, 0), MATS.cEboshi);
        tokin.scale.set(1, 0.8, 1);
        tokin.position.set(0, 0.705, 0.075);
        c.add(tokin);
        const cord = mesh(new THREE.TorusGeometry(0.15, 0.004, 4, 24), MATS.cEboshi);
        cord.rotation.x = Math.PI / 2 - 0.35;
        cord.position.set(0, 0.64, 0.0);
        c.add(cord);
    }
    if (def.extras.includes('takenaga')) {
        const tie = mesh(new THREE.BoxGeometry(0.07, 0.035, 0.05), MATS.cLining);
        tie.position.set(0, 0.47, -0.145);
        c.add(tie);
        c.add(add(mesh(new THREE.BoxGeometry(0.012, 0.03, 0.052), MATS.cCord), 0, 0.47, -0.145));
    }
    if (def.extras.includes('kanzashi')) {
        // 花簪＋垂飾
        const kz = new THREE.Group();
        for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2;
            const petal = mesh(new THREE.SphereGeometry(0.014, 8, 6), smooth(style.type === 'yukata' ? '#f4b3c2' : '#f8e6ea'));
            petal.scale.set(1, 0.5, 1);
            petal.position.set(Math.cos(a) * 0.016, 0, Math.sin(a) * 0.016);
            kz.add(petal);
        }
        kz.add(add(mesh(new THREE.SphereGeometry(0.008, 8, 6), MATS.cGold), 0, 0.004, 0, kz));
        [-0.01, 0.01].forEach(x => kz.add(strip(new THREE.Vector3(x, -0.005, 0), new THREE.Vector3(x * 1.5, -0.06, 0.004), 0.003, 0.003, MATS.cGold)));
        kz.rotation.z = -0.5;
        kz.rotation.x = 0.6;
        kz.position.set(0.1, 0.68, -0.02);
        c.add(kz);
        c.add(add(mesh(new THREE.SphereGeometry(0.016, 10, 8), accent), -0.06, 0.73, -0.08));
    }
    if (def.extras.includes('ribbon')) {
        const rib = smooth(0xb7282e);
        [-1, 1].forEach(s => {
            const w = mesh(new THREE.SphereGeometry(0.05, 12, 8), rib);
            w.scale.set(1.3, 0.85, 0.35);
            w.position.set(s * 0.06, 0.68, -0.125);
            w.rotation.z = s * 0.35;
            c.add(w);
            const tail = strip(new THREE.Vector3(s * 0.01, 0.67, -0.135), new THREE.Vector3(s * 0.035, 0.57, -0.15), 0.025, 0.006, rib);
            c.add(tail);
        });
        c.add(add(mesh(new THREE.SphereGeometry(0.02, 10, 8), rib), 0, 0.68, -0.14));
    }
    if (def.extras.includes('kikutoji')) [-1, 1].forEach(s => c.add(add(mesh(new THREE.SphereGeometry(0.016, 8, 6), accent), s * 0.04, 0.35, frontZ(0.35) + 0.006)));
    if (def.extras.includes('bonten')) {
        // 結袈裟：兩條帶子從肩垂下，掛著六顆梵天
        const kesa = smooth(0xf2f0ea);
        [-1, 1].forEach(s => c.add(strip(new THREE.Vector3(s * 0.065, 0.43, 0.03), new THREE.Vector3(s * 0.055, 0.22, frontZ(0.22) + 0.004), 0.018, 0.006, kesa)));
        const bc = smooth(0xd4505a);
        [[-0.055, 0.37], [0.055, 0.37], [-0.055, 0.3], [0.055, 0.3], [-0.055, 0.23], [0.055, 0.23]].forEach(([x, y], i) =>
            c.add(add(mesh(new THREE.SphereGeometry(i < 2 ? 0.027 : 0.022, 12, 10), i % 2 ? bc : kesa), x, y, frontZ(y) + 0.02)));
    }
    if (def.extras.includes('staff')) {
        const staff = new THREE.Group();
        staff.add(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.66, 6), MATS.cGeta));
        const head = mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 16), MATS.cGold);
        head.position.y = 0.35;
        staff.add(head);
        [-1, 1].forEach(k => staff.add(add(mesh(new THREE.TorusGeometry(0.012, 0.003, 4, 10), MATS.cGold), k * 0.03, 0.33, 0, staff)));
        staff.position.set(0.028, -0.06, SL.W / 2 + 0.01);
        arms[1].add(staff);
    }
    if (def.extras.includes('swords')) {
        // 大小二刀：插在穿著者左腰（畫面右側），刀柄朝前
        const saya = smooth(0x1b1b1f, { roughness: 0.3 });
        const tsuka = smooth(0xe9e4d8);
        [[0.34, 0.012, 0.0], [0.24, 0.01, -0.025]].forEach(([len, r, dy]) => {
            const sword = new THREE.Group();
            const sheath = mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 8), saya);
            sheath.position.y = -len / 2;
            const grip = mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, len * 0.3, 8), tsuka);
            grip.position.y = len * 0.15 + 0.012;
            const guard = mesh(new THREE.CylinderGeometry(r * 2.4, r * 2.4, 0.006, 12), MATS.cGold);
            guard.position.y = 0.002;
            sword.add(sheath, grip, guard);
            sword.position.set(0.112, 0.29 + dy, 0.02);
            sword.rotation.x = 1.22;
            sword.rotation.z = -0.12;
            c.add(sword);
        });
    }
    if (def.extras.includes('maekake')) {
        // 前掛：深藍色圍裙，中央印店號
        const apron = mesh(new THREE.BoxGeometry(0.17, 0.2, 0.008), smooth(0x1f2f4f));
        apron.position.set(0, 0.17, frontZ(0.17) + 0.006);
        apron.rotation.x = -0.06;
        c.add(apron);
        const mark = mesh(new THREE.RingGeometry(0.014, 0.022, 16), smooth(0xf6f4ee));
        mark.position.set(0, 0.2, frontZ(0.2) + 0.012);
        c.add(mark);
    }
    if (def.extras.includes('furoshiki')) {
        // 唐草紋風呂敷包，結打在胸前
        const pack = mesh(new THREE.SphereGeometry(0.09, 16, 12), fabricMaterial('#3f7d4a', 'shippo'));
        pack.scale.set(1.1, 0.85, 0.75);
        pack.position.set(0, 0.38, -0.15);
        c.add(pack);
        [-1, 1].forEach(s => c.add(strip(new THREE.Vector3(s * 0.075, 0.44, -0.05), new THREE.Vector3(0, 0.36, frontZ(0.36) + 0.006), 0.02, 0.008, smooth(0x3f7d4a))));
        c.add(add(mesh(new THREE.SphereGeometry(0.018, 8, 6), smooth(0x3f7d4a)), 0, 0.36, frontZ(0.36) + 0.012));
    }
    if (def.extras.includes('shaku')) {
        // 笏：雙手捧在胸前
        const shaku = mesh(new THREE.BoxGeometry(0.026, 0.12, 0.006), smooth(0xd8c49a));
        shaku.position.set(0, 0.3, frontZ(0.3) + 0.035);
        shaku.rotation.x = -0.25;
        c.add(shaku);
    }
    if (def.extras.includes('kago')) {
        // 竹編背簍
        const kago = mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.15, 12, 1, true), smooth(0xb8935a, { side: THREE.DoubleSide, flatShading: true }));
        kago.position.set(0, 0.36, -0.14);
        c.add(kago);
        const rim = mesh(new THREE.TorusGeometry(0.075, 0.006, 5, 16), smooth(0x8a6a3c));
        rim.rotation.x = Math.PI / 2;
        rim.position.set(0, 0.435, -0.14);
        c.add(rim);
        c.add(add(mesh(new THREE.SphereGeometry(0.05, 10, 8), smooth(0x7aa65a)), 0, 0.43, -0.14));
        [-1, 1].forEach(s => c.add(strip(new THREE.Vector3(s * 0.06, 0.44, -0.08), new THREE.Vector3(s * 0.07, 0.3, -0.1), 0.012, 0.006, smooth(0x8a6a3c))));
    }
    if (def.extras.includes('uchiwa')) {
        const fan = new THREE.Group();
        const disc = mesh(new THREE.CircleGeometry(0.05, 18), smooth(0xf3f1ea, { side: THREE.DoubleSide }));
        disc.position.y = 0.06;
        fan.add(disc, mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 5), MATS.cGeta));
        fan.add(add(mesh(new THREE.CircleGeometry(0.02, 12), smooth(0xc53d43, { side: THREE.DoubleSide })), 0.01, 0.065, 0.001, fan));
        fan.position.set(-0.028, -0.1, SL.W / 2 + 0.02);
        fan.rotation.z = 0.3;
        arms[0].add(fan);
    }

    c.userData.legL = legs[0];
    c.userData.legR = legs[1];
    c.userData.armL = arms[0];
    c.userData.armR = arms[1];
    c.traverse(o => { if (o.isMesh && o.material !== MATS.cVeil) o.castShadow = true; });
    return c;
}

// 旅人狀態
const OUTFIT_KEY = 'shinkoku_traveler_outfit_v1';
function loadOutfit() {
    try {
        const raw = localStorage.getItem(OUTFIT_KEY);
        if (raw) {
            const o = JSON.parse(raw);
            if (OUTFIT_TYPES[o.type]) return o;
        }
    } catch (e) {}
    return { type: 'kariginu', color: '#9fc3dc', pattern: 'plain' };
}
const traveler = {
    name: '朝霧',
    kana: 'あさぎり',
    at: 'yamashiro',
    from: null,
    to: 'yamashiro',
    startDist: 0,
    arrived: true,
    footprints: ['yamashiro'],
    portrait: '',
    outfit: loadOutfit()
};
let travelerLabelEl = null;
let travelerHit = null;
const TRAVELER_SCALE = 0.21;

function attachTravelerHit() {
    if (travelerHit) {
        const i = clickableMeshes.indexOf(travelerHit);
        if (i >= 0) clickableMeshes.splice(i, 1);
    }
    travelerHit = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 8), new THREE.MeshBasicMaterial({ visible: false }));
    travelerHit.position.y = 0.45;
    travelerHit.userData.traveler = true;
    avatarGroup.add(travelerHit);
    clickableMeshes.push(travelerHit);
}

function createTravelerAvatar() {
    avatarGroup = buildCharacter(traveler.outfit);
    avatarGroup.scale.setScalar(TRAVELER_SCALE);
    const start = getProv('yamashiro');
    avatarTargetPos.set(start.mapX + 0.02, NODE_Y + 0.08, start.mapZ + 0.36);
    avatarGroup.position.copy(avatarTargetPos);
    scene.add(avatarGroup);
    attachTravelerHit();

    // 角色名牌附一顆「換裝」按鈕
    travelerLabelEl = document.createElement('div');
    travelerLabelEl.className = 'map-label';
    travelerLabelEl.style.opacity = '0';
    travelerLabelEl.innerHTML = `
        <div class="map-label-inner">
            <div class="pl-2.5 pr-1 py-1 rounded-full bg-stone-900/90 text-amber-50 text-[11px] font-bold shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-amber-300/40">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>旅人・${traveler.name}
                <button class="tl-wardrobe w-6 h-6 rounded-full bg-amber-100 text-stone-900 text-xs flex items-center justify-center hover:bg-white transition" title="換裝">👘</button>
            </div>
        </div>`;
    travelerLabelEl.addEventListener('click', e => {
        e.stopPropagation();
        if (e.target.closest('.tl-wardrobe')) openWardrobe();
        else openTravelerCard();
    });
    document.getElementById('labels-container').appendChild(travelerLabelEl);

    // 驛道上來往的武士・商人・神官・百姓
    createWalkers();

    renderTravelerPortrait();
}

// 換裝預覽與大頭照共用一個小型渲染器（避免反覆建立 WebGL context）
let wardrobeR = null;
function getWardrobeRenderer() {
    if (wardrobeR) return wardrobeR;
    const renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer2.toneMapping = THREE.ACESFilmicToneMapping;
    renderer2.toneMappingExposure = 1.0;
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight(0xffffff, 0xd6c3a5, 0.95));
    const d = new THREE.DirectionalLight(0xfff1dc, 1.05);
    d.position.set(1, 2, 3);
    s.add(d);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
    wardrobeR = { renderer: renderer2, scene: s, camera: cam, char: null };
    return wardrobeR;
}
function setPreviewCharacter(style) {
    const w = getWardrobeRenderer();
    if (w.char) w.scene.remove(w.char);
    w.char = buildCharacter(style);
    w.scene.add(w.char);
}

// 用離屏渲染器拍一張旅人大頭照，給介紹卡使用
function renderTravelerPortrait() {
    try {
        const w = getWardrobeRenderer();
        setPreviewCharacter(traveler.outfit);
        w.renderer.setSize(192, 192, false);
        w.scene.background = new THREE.Color(0xf3e7d3);
        w.char.rotation.y = -0.35;
        w.camera.aspect = 1;
        w.camera.position.set(0, 0.64, 1.3);
        w.camera.lookAt(0, 0.57, 0);
        w.camera.updateProjectionMatrix();
        w.renderer.render(w.scene, w.camera);
        traveler.portrait = w.renderer.domElement.toDataURL('image/png');
        const img = document.getElementById('tc-portrait');
        if (img) img.src = traveler.portrait;
    } catch (e) {
        traveler.portrait = '';
    }
}

// ---------- 換裝視窗 ----------
let wardrobeDraft = null;
let wardrobeAnim = null;
function openWardrobe() {
    wardrobeDraft = Object.assign({}, traveler.outfit);
    const w = getWardrobeRenderer();
    const holder = document.getElementById('wardrobe-preview');
    if (w.renderer.domElement.parentNode !== holder) holder.appendChild(w.renderer.domElement);
    w.renderer.domElement.style.width = '100%';
    w.renderer.domElement.style.height = '100%';
    w.renderer.setSize(holder.clientWidth || 240, holder.clientHeight || 300, false);
    w.scene.background = null;
    w.camera.aspect = (holder.clientWidth || 240) / (holder.clientHeight || 300);
    w.camera.position.set(0, 0.5, 2.0);
    w.camera.lookAt(0, 0.42, 0);
    w.camera.updateProjectionMatrix();
    renderWardrobeUI();
    showModal('wardrobe-modal');
    requestAnimationFrame(() => {
        // 視窗顯示後才量得到實際大小
        const W = holder.clientWidth || 240, H = holder.clientHeight || 300;
        w.renderer.setSize(W, H, false);
        w.camera.aspect = W / H;
        w.camera.updateProjectionMatrix();
    });
    cancelAnimationFrame(wardrobeAnim);
    const spin = () => {
        wardrobeAnim = requestAnimationFrame(spin);
        if (w.char) w.char.rotation.y += 0.012;
        w.renderer.render(w.scene, w.camera);
    };
    spin();
}
function closeWardrobe() {
    cancelAnimationFrame(wardrobeAnim);
    hideModal('wardrobe-modal');
}
function renderWardrobeUI() {
    const d = wardrobeDraft;
    const def = OUTFIT_TYPES[d.type];
    setPreviewCharacter(d);
    document.getElementById('wd-types').innerHTML = Object.entries(OUTFIT_TYPES).map(([id, t]) => `
        <button onclick="wardrobePick('type','${id}')" class="p-2 rounded-2xl border text-left transition ${id === d.type ? 'bg-orange-50 border-orange-400 shadow-sm' : 'bg-white border-stone-200 hover:border-orange-300'}">
            <div class="text-lg leading-none">${t.icon}</div>
            <div class="text-xs font-black text-stone-900 mt-1">${t.name}</div>
            <div class="text-[10px] text-stone-400 font-bold">${t.era}</div>
        </button>`).join('');
    document.getElementById('wd-colors').innerHTML = WA_COLORS.map(cl => `
        <button onclick="wardrobePick('color','${cl.hex}')" title="${cl.name}" class="flex flex-col items-center gap-0.5">
            <span class="w-8 h-8 rounded-full border-2 ${cl.hex === d.color ? 'border-orange-500 ring-2 ring-orange-200' : 'border-white shadow'}" style="background:${cl.hex}"></span>
            <span class="text-[9px] font-bold ${cl.hex === d.color ? 'text-orange-700' : 'text-stone-500'}">${cl.name}</span>
        </button>`).join('');
    document.getElementById('wd-patterns').innerHTML = WA_PATTERNS.map(pt => `
        <button onclick="wardrobePick('pattern','${pt.id}')" class="flex flex-col items-center gap-0.5">
            <img src="${patternSwatchURL(d.color, pt.id)}" alt="${pt.name}" class="w-11 h-11 rounded-xl border-2 ${pt.id === d.pattern ? 'border-orange-500 ring-2 ring-orange-200' : 'border-white shadow'}">
            <span class="text-[10px] font-bold ${pt.id === d.pattern ? 'text-orange-700' : 'text-stone-500'}">${pt.name}</span>
        </button>`).join('');
    const colorName = (WA_COLORS.find(cl => cl.hex === d.color) || {}).name || '';
    const patName = (WA_PATTERNS.find(pt => pt.id === d.pattern) || {}).name || '';
    document.getElementById('wd-title').textContent = `${def.name}（${def.kana}）`;
    document.getElementById('wd-sub').textContent = `${def.era}・${colorName}${patName && d.pattern !== 'plain' ? '・' + patName : ''}`;
    document.getElementById('wd-desc').innerHTML = def.desc.map(([k, v]) => `<p><b class="text-stone-900">${k}</b>　${v}</p>`).join('');
}
function wardrobePick(kind, value) {
    if (kind === 'type') {
        // 換款式時套用該款式的經典配色，之後仍可自由改色與花色
        const def = OUTFIT_TYPES[value];
        wardrobeDraft = { type: value, color: def.defaultColor, pattern: def.defaultPattern || 'plain' };
    } else {
        wardrobeDraft[kind] = value;
    }
    renderWardrobeUI();
}
function wardrobeRandom() {
    const ids = Object.keys(OUTFIT_TYPES);
    wardrobeDraft = {
        type: ids[Math.floor(Math.random() * ids.length)],
        color: WA_COLORS[Math.floor(Math.random() * WA_COLORS.length)].hex,
        pattern: WA_PATTERNS[Math.floor(Math.random() * WA_PATTERNS.length)].id
    };
    renderWardrobeUI();
}
function applyWardrobe() {
    traveler.outfit = Object.assign({}, wardrobeDraft);
    try { localStorage.setItem(OUTFIT_KEY, JSON.stringify(traveler.outfit)); } catch (e) {}
    const old = avatarGroup;
    avatarGroup = buildCharacter(traveler.outfit);
    avatarGroup.scale.setScalar(TRAVELER_SCALE);
    avatarGroup.position.copy(old.position);
    avatarGroup.rotation.copy(old.rotation);
    scene.remove(old);
    scene.add(avatarGroup);
    attachTravelerHit();
    closeWardrobe();
    renderTravelerPortrait();
    if (travelerCardOpen) renderTravelerCard();
    showToast(`朝霧換上了${OUTFIT_TYPES[traveler.outfit.type].name}！`);
}
