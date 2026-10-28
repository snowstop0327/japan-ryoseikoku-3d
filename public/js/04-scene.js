// 3D 場景、海與島嶼
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 3. HIGH-PERFORMANCE THREE.JS DIORAMA & PUMA-STYLE DETAILED MODELS
 *    - Shared Material Palette (Zero redundant Shader compilation!)
 *    - Zero PointLights (Replaced with Emissive Lanterns for 60FPS!)
 *    - Realistic Mt. Fuji, 10+ Bespoke Shrines, Puma-style Characters
 ***********************************************************************/
let scene, camera, renderer, controls;
let clickableMeshes = [];
let terrainMeshes = [];
let provinceNodeMap = new Map();
let routeLinesGroup;
let avatarGroup;
let npcAvatars = [];
let avatarTargetPos = new THREE.Vector3(-4.2, 0.96, 4.1);
let ambientLight, hemiLight, dirLight;
let waterMesh;
let seagulls = [];
let clouds = [];
let boats = [];
let clock = new THREE.Clock();

let camAnimActive = false;
let camTargetPos = new THREE.Vector3();
let camTargetLookAt = new THREE.Vector3();

// SHARED MATERIAL PALETTE (Crucial for eliminating WebGL lag!)
const MATS = {};
function initSharedMaterials() {
    MATS.vermilion = new THREE.MeshStandardMaterial({ color: 0xd9383a, roughness: 0.42, flatShading: true });
    MATS.wood = new THREE.MeshStandardMaterial({ color: 0x854d27, roughness: 0.68, flatShading: true });
    MATS.hinoki = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.55, flatShading: true });
    MATS.darkWood = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.75, flatShading: true });
    MATS.blackLacquer = new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.32, metalness: 0.15, flatShading: true });
    MATS.roofSlate = new THREE.MeshStandardMaterial({ color: 0x2c425c, roughness: 0.48, flatShading: true });
    MATS.copperRoof = new THREE.MeshStandardMaterial({ color: 0x4db6ac, roughness: 0.45, flatShading: true });
    MATS.redTileRoof = new THREE.MeshStandardMaterial({ color: 0xa8382b, roughness: 0.50, flatShading: true });
    MATS.whiteWall = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.40, flatShading: true });
    MATS.creamWall = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.65, flatShading: true });
    MATS.stone = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78, flatShading: true });
    MATS.paver = new THREE.MeshStandardMaterial({ color: 0xe2dcd3, roughness: 0.70, flatShading: true });
    MATS.gold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.75, roughness: 0.22 });
    MATS.rope = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.65, flatShading: true });
    MATS.moundActive = new THREE.MeshStandardMaterial({ color: 0xd9c8a4, roughness: 0.85 });
    MATS.moundDim = new THREE.MeshStandardMaterial({ color: 0x9aa39a, roughness: 0.9 });
    MATS.shallowWater = new THREE.MeshStandardMaterial({ color: 0x6fb5b0, roughness: 0.4, transparent: true, opacity: 0.6 });
    MATS.lanternGlow = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.25
    });
    // Character Materials (Puma Policy Island style!)
    MATS.skin = new THREE.MeshStandardMaterial({ color: 0xfcd3b6, roughness: 0.55 });
    MATS.hairDark = new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.65 });
    MATS.hairBrown = new THREE.MeshStandardMaterial({ color: 0x5c3a28, roughness: 0.60 });
    MATS.vestOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.50 });
    MATS.shirtWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    MATS.pantsNavy = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.60 });
    MATS.hakamaRed = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.55 });
    MATS.bagTeal = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.45 });
    MATS.bagYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
}

function initThreeScene() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x86b4bb);
    scene.fog = new THREE.FogExp2(0x86b4bb, 0.0085);

    camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.2, 220);
    camera.position.set(0.5, 25, 25);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // 柔和電影感色調：壓低高光、降低飽和，避免刺眼
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.panSpeed = 1.15;
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minDistance = 1.2;
    controls.maxDistance = 50;
    controls.target.set(-1.5, 0.5, 1.5);

    // 平移時把中心點限制在列島範圍內，避免拖到看不見陸地
    controls.addEventListener('change', () => {
        const tg = controls.target;
        const cx = THREE.MathUtils.clamp(tg.x, -19, 15), cz = THREE.MathUtils.clamp(tg.z, -9, 16);
        if (cx !== tg.x || cz !== tg.z) {
            camera.position.x += cx - tg.x;
            camera.position.z += cz - tg.z;
            tg.x = cx;
            tg.z = cz;
        }
    });
    controls.addEventListener('start', () => {
        camAnimActive = false;
        if (typeof dog !== 'undefined' && dog.follow) toggleDogFollow();
        if (typeof followWalker !== 'undefined' && followWalker) {
            followWalker = false;
            controls.minDistance = 1.2;
            const fb = document.getElementById('wk-follow');
            if (fb) fb.textContent = '🎥 鏡頭跟隨';
        }
    });

    initSharedMaterials();
    setupLights();
    createVibrantBlueOcean();
    createLushGreenArchipelago();
    createWindingRiversAndLakes();
    createGreenMountainsAndForests();
    createRichTownAndShrineProps();
    createNorthernSnow();
    createProvinceDioramaLandmarks();
    createForests();
    createSkyCloudsAndSeagulls();
    createGokishichidoRoutes();
    createTravelerAvatar();
    setupRaycasterInteraction();

    window.addEventListener('resize', onWindowResize);
    animateLoop();
}

function setupLights() {
    ambientLight = new THREE.AmbientLight(0xfff8ee, 0.24);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0xdff1f5, 0x6b7f5a, 0.5);
    hemiLight.position.set(0, 35, 0);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xfff0d9, 1.25);
    dirLight.position.set(18, 32, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 6;
    dirLight.shadow.camera.far = 75;
    const d = 23;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
}

const WATER_Y = 0.5;   // 海面高度：島嶼沙岸頂端附近，海岸不再像懸空的高台
function createVibrantBlueOcean() {
    const waterGeo = new THREE.PlaneGeometry(200, 200, 28, 28);
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.4) * Math.cos(y * 0.4) * 0.03);
    }
    waterGeo.computeVertexNormals();

    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x2f7d8a,
        roughness: 0.42,
        metalness: 0.05
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = WATER_Y;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    terrainMeshes.push(waterMesh);
}
