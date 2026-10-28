// 點擊、鏡頭與動畫迴圈
// 這些檔案以一般 <script defer> 依序載入、共用同一個全域範圍（順序見 index.html）。

/***********************************************************************
 * 6. INTERACTION, CAMERA FLIGHT & ANIMATION LOOP
 ***********************************************************************/
function setupRaycasterInteraction() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const el = renderer.domElement;
    let downX = 0, downY = 0;

    function pick(e) {
        const rect = el.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(clickableMeshes, false);
        if (!hits.length) return null;
        const traveled = hits.find(h => h.object.userData.traveler);
        if (traveled) return '__traveler';
        if (hits.find(h => h.object.userData.dog)) return '__dog';
        const walker = hits.find(h => h.object.userData.walker !== undefined);
        if (walker) return { walker: walker.object.userData.walker };
        return hits[0].object.userData;
    }

    el.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
    el.addEventListener('pointerup', e => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
        const hit = pick(e);
        if (hit === '__traveler') openTravelerCard();
        else if (hit === '__dog') openDogCard();
        else if (hit && hit.walker !== undefined) openWalkerCard(hit.walker);
        else if (hit) selectProvince(hit.provId, true, hit.site || null);
    });
    let lastMove = 0;
    el.addEventListener('pointermove', e => {
        const now = performance.now();
        if (now - lastMove < 60) return;
        lastMove = now;
        el.style.cursor = pick(e) ? 'pointer' : 'grab';
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function flyCamera(pos, lookAt) {
    camTargetPos.copy(pos);
    camTargetLookAt.copy(lookAt);
    camAnimActive = true;
}

const _proj = new THREE.Vector3();
function placeLabel(el, anchor, shouldShow) {
    if (!shouldShow) {
        if (el.style.opacity !== '0') {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        }
        return;
    }
    _proj.copy(anchor).project(camera);
    if (_proj.z > 1 || Math.abs(_proj.x) > 1.1 || Math.abs(_proj.y) > 1.1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
    }
    const x = (_proj.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
}

const _travelerAnchor = new THREE.Vector3();
function updateLabels() {
    const q = searchQuery;
    const modern = showModernPrefecture;
    // 古令制國模式：一國一名牌；現代模式：改成一縣一名牌
    PROVINCES_DATA.forEach(prov => {
        const info = provinceNodeMap.get(prov.id);
        if (!info) return;
        const show = !modern && (prov.id === selectedProvinceId
            || showAllProvincePins
            || (q && matchesSearch(prov, q))
            || (!q && currentRegion !== 'all' && prov.region === currentRegion));
        placeLabel(info.labelEl, info.anchor, show);
        info.labelEl.style.zIndex = prov.id === selectedProvinceId ? '20' : '1';
    });
    const selPref = selectedPref || (selectedProvinceId ? shortPref(getProv(selectedProvinceId)) : null);
    prefLabelEls.forEach(pl => {
        const show = modern && (pl.info.name === selPref
            || showAllProvincePins
            || (q && prefMatchesSearch(pl.info, q))
            || (!q && currentRegion !== 'all' && pl.info.region === currentRegion));
        placeLabel(pl.el, pl.anchor, show);
        pl.el.style.zIndex = pl.info.name === selPref ? '20' : '2';
    });
    const showRegions = currentRegion === 'all' && !showAllProvincePins && !q && !selectedProvinceId && !selectedPref;
    regionLabelEls.forEach(r => placeLabel(r.el, r.anchor, showRegions && !modern));
    modernRegionLabelEls.forEach(r => placeLabel(r.el, r.anchor, showRegions && modern));
    const camDist = camera.position.distanceTo(controls.target);
    GEO_LABELS.forEach(g => {
        if (!g.el) return;
        const d = camera.position.distanceTo(g.anchor);
        placeLabel(g.el, g.anchor, showGeoLabels && (g.major ? d < 45 : d < 16));
        g.el.style.pointerEvents = 'none';
    });
    const near = selectedProvinceId && camDist < 7;
    siteLabels.forEach(s => placeLabel(s.el, s.anchor, near && s.provId === selectedProvinceId));
    placeWalkerLabels();
    placeDogLabel();
    placeWeatherLabels();
    if (travelerLabelEl && avatarGroup) {
        _travelerAnchor.copy(avatarGroup.position);
        _travelerAnchor.y += 0.24;
        placeLabel(travelerLabelEl, _travelerAnchor, camera.position.distanceTo(avatarGroup.position) < 9);
        travelerLabelEl.style.zIndex = '25';
    }
}

function animateLoop() {
    requestAnimationFrame(animateLoop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (camAnimActive) {
        camera.position.lerp(camTargetPos, 0.07);
        controls.target.lerp(camTargetLookAt, 0.07);
        if (camera.position.distanceTo(camTargetPos) < 0.03 && controls.target.distanceTo(camTargetLookAt) < 0.03) {
            camAnimActive = false;
        }
    }
    controls.update();
    updateMountainFade();

    // Traveler walks to the selected province
    if (avatarGroup) {
        const toTarget = avatarTargetPos.clone().sub(avatarGroup.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        const u = avatarGroup.userData;
        if (dist > 0.01) {
            const step = Math.min(dist, Math.max(1.6, dist * 1.4) * dt);
            toTarget.normalize();
            avatarGroup.position.addScaledVector(toTarget, step);
            avatarGroup.rotation.y = Math.atan2(toTarget.x, toTarget.z);
            const swing = Math.sin(t * 16) * 0.55;
            u.legL.rotation.x = swing;
            u.legR.rotation.x = -swing;
            u.armL.rotation.x = -swing * 0.7;
            u.armR.rotation.x = swing * 0.7;
            avatarGroup.position.y = avatarTargetPos.y + Math.abs(Math.sin(t * 16)) * 0.012;
        } else {
            u.legL.rotation.x = u.legR.rotation.x = 0;
            u.armL.rotation.x = Math.sin(t * 2) * 0.05;
            u.armR.rotation.x = -Math.sin(t * 2) * 0.05;
            avatarGroup.rotation.y += (0 - avatarGroup.rotation.y) * 0.08;
            avatarGroup.position.y = avatarTargetPos.y + Math.sin(t * 2.4) * 0.004;
            if (!traveler.arrived) onTravelerArrived();
        }
        if (travelerCardOpen && Math.floor(t * 4) !== lastTravelerCardTick) {
            lastTravelerCardTick = Math.floor(t * 4);
            updateTravelerLive();
        }
    }

    updateWalkers(dt, t);
    updateDog(dt, t);
    updateOrbitHold(dt);
    updateWaterfalls(dt, t);

    updateSnowAndSmoke(dt, t);
    updateWeather(dt, t);
    clouds.forEach(c => {
        c.position.x += c.userData.speed * dt;
        c.position.y = c.userData.baseY + Math.sin(t * 0.3 + c.userData.phase) * 0.12;
        if (c.position.x > 26) c.position.x = -26;
    });

    seagulls.forEach(g => {
        const u = g.userData;
        const a = t * u.speed + u.phase;
        g.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(t * 1.3 + u.phase) * 0.15, u.cz + Math.sin(a) * u.r);
        g.rotation.y = -a;
        g.rotation.z = 0.25;   // 繞圈時身體向內傾
        // 拍幾下翅膀、再滑翔一段
        const cyc = (t * 0.45 + u.phase) % 2;
        const flapping = cyc < 0.9;
        const f = flapping ? Math.sin(t * 11 + u.phase) : 0;
        u.wings.forEach(w => {
            w.inner.rotation.z = flapping ? f * 0.55 : 0.08;
            w.outer.rotation.z = flapping ? -Math.max(0, -f) * 0.6 + f * 0.25 : -0.05;
        });
    });

    boats.forEach(b => {
        const u = b.userData;
        const a = t * u.speed + u.phase;
        b.position.set(u.cx + Math.cos(a) * u.r, WATER_Y + 0.03 + Math.sin(t * 2 + u.phase) * 0.012, u.cz + Math.sin(a) * u.r);
        b.rotation.y = -a;
        b.rotation.z = Math.sin(t * 1.6 + u.phase) * 0.04;
        b.rotation.x = Math.sin(t * 1.1 + u.phase) * 0.025;
        if (u.oar) {
            u.oar.rotation.z = Math.sin(t * 2.4 + u.phase) * 0.35;
            u.man.rotation.y = Math.sin(t * 2.4 + u.phase) * 0.25;
        }
    });

    if (selectionRing && selectionRing.visible) {
        selectionRing.rotation.z = t * 0.8;
        selectionRing.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
    }

    renderer.render(scene, camera);
    updateLabels();
}
