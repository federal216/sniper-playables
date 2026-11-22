// UI ve Giriş (Input / Kontrol) Yönetimi

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const toast = document.getElementById('toast-notification');

    // UI Elemanları
    const els = {
        timerVal: document.getElementById('timer-val'),
        cashVal: document.getElementById('cash-val'),
        windVal: document.getElementById('wind-val'),
        distVal: document.getElementById('dist-val'),
        zoomVal: document.getElementById('zoom-val'),
        breathFill: document.getElementById('breath-fill'),
        missionNameHud: document.getElementById('mission-name-hud'),

        // Modallar
        menuModal: document.getElementById('menu-modal'),
        briefingModal: document.getElementById('briefing-modal'),
        victoryModal: document.getElementById('victory-modal'),
        failModal: document.getElementById('fail-modal'),
        armoryModal: document.getElementById('armory-modal'),
        levelsModal: document.getElementById('levels-modal'),

        // Brifing Elemanları
        briefingTitle: document.getElementById('briefing-title'),
        briefingText: document.getElementById('briefing-text'),
        briefingClue: document.getElementById('briefing-clue'),
        briefingReward: document.getElementById('briefing-reward'),

        // Sonuç Elemanları
        victoryReward: document.getElementById('victory-reward'),
        victoryHeadshotBadge: document.getElementById('victory-headshot-badge'),
        failReason: document.getElementById('fail-reason'),

        // Butonlar
        startBriefingBtn: document.getElementById('start-briefing-btn'),
        launchMissionBtn: document.getElementById('launch-mission-btn'),
        nextMissionBtn: document.getElementById('next-mission-btn'),
        retryMissionBtn: document.getElementById('retry-mission-btn'),
        openArmoryBtn: document.getElementById('open-armory-btn'),
        closeArmoryBtn: document.getElementById('close-armory-btn'),
        openLevelsBtn: document.getElementById('open-levels-btn'),
        closeLevelsBtn: document.getElementById('close-levels-btn'),

        // Kontrol Butonları
        fireBtn: document.getElementById('fire-btn'),
        zoomBtn: document.getElementById('zoom-btn'),
        breathBtn: document.getElementById('breath-btn')
    };

    // UI Hook Nesnesi
    const uiHooks = {
        showToast(msg, type = 'info') {
            toast.textContent = msg;
            toast.className = `show toast-${type}`;
            setTimeout(() => { toast.className = ''; }, 2600);
        },
        updateHUD(data) {
            els.timerVal.textContent = `${data.timeLeft}s`;
            els.cashVal.textContent = `$${data.cash}`;
            els.windVal.textContent = `${data.wind > 0 ? '➡ ' : '⬅ '}${Math.abs(data.wind).toFixed(1)} m/s`;
            els.distVal.textContent = `${data.distance}m`;
            els.breathFill.style.width = `${Math.max(0, data.breathGauge * 100)}%`;
        },
        updateHUDZoom(zoom) {
            els.zoomVal.textContent = `${zoom}x`;
        },
        onMissionStarted(mission, weapon) {
            hideAllModals();
            els.missionNameHud.textContent = mission.title;
            els.zoomVal.textContent = `${weapon.zoomLevels[weapon.currentZoomIdx || 0]}x`;
        },
        onMissionComplete(mission, earned, isHeadshot) {
            hideAllModals();
            els.victoryModal.classList.remove('hidden');
            els.victoryReward.textContent = `+$${earned}`;
            els.victoryHeadshotBadge.style.display = isHeadshot ? 'inline-block' : 'none';
        },
        onMissionFailed(reason) {
            hideAllModals();
            els.failModal.classList.remove('hidden');
            els.failReason.textContent = reason;
        }
    };

    // Motoru Başlat
    const engine = new SniperEngine(canvas, uiHooks);

    function hideAllModals() {
        els.menuModal.classList.add('hidden');
        els.briefingModal.classList.add('hidden');
        els.victoryModal.classList.add('hidden');
        els.failModal.classList.add('hidden');
        els.armoryModal.classList.add('hidden');
        els.levelsModal.classList.add('hidden');
    }

    function showBriefing(missionIdx) {
        hideAllModals();
        const m = MISSIONS_DATA[missionIdx];
        els.briefingTitle.textContent = m.title;
        els.briefingText.textContent = m.briefing;
        els.briefingClue.textContent = `🎯 İPUCU: ${m.clue}`;
        els.briefingReward.textContent = `ÖDÜL: $${m.reward}`;
        els.briefingModal.classList.remove('hidden');
    }

    // Modal Buton Etkileşimleri
    els.startBriefingBtn.addEventListener('click', () => {
        showBriefing(engine.playerState.currentMissionIdx);
    });

    els.launchMissionBtn.addEventListener('click', () => {
        engine.startMission(engine.playerState.currentMissionIdx);
    });

    els.nextMissionBtn.addEventListener('click', () => {
        const nextIdx = engine.playerState.currentMissionIdx + 1;
        if (nextIdx < MISSIONS_DATA.length) {
            showBriefing(nextIdx);
        } else {
            uiHooks.showToast("Tebrikler! Tüm 20 bölümü tamamladın!", "info");
            els.menuModal.classList.remove('hidden');
        }
    });

    els.retryMissionBtn.addEventListener('click', () => {
        engine.startMission(engine.playerState.currentMissionIdx);
    });

    // --- CEPHANE / SİLAH VE YÜKSELTME SİSTEMİ ---
    function renderArmory() {
        const grid = document.getElementById('weapons-catalog');
        grid.innerHTML = '';

        WEAPONS_DATA.forEach(w => {
            const isOwned = w.owned || (w.price === 0);
            const isEquipped = engine.playerState.currentWeaponId === w.id;

            const card = document.createElement('div');
            card.className = `weapon-card ${isEquipped ? 'active' : ''}`;
            card.innerHTML = `
                <div style="font-size:24px; margin-bottom:4px;">${w.imageIcon}</div>
                <div class="weapon-name">${w.name}</div>
                <div class="tactical-title">${w.type}</div>
                <div class="weapon-desc">${w.description}</div>
                <div style="font-size:12px; color:#38bdf8; margin-bottom:8px;">
                    Hasar: ${w.damage} | Zoom: ${w.zoomLevels.join(', ')}x ${w.silenced ? '| 🔇 Susturuculu' : ''}
                </div>
                <button class="buy-btn ${isEquipped ? 'owned' : ''}" data-id="${w.id}">
                    ${isEquipped ? 'KUŞANILDI' : (isOwned ? 'KUŞAN' : `SATIN AL ($${w.price})`)}
                </button>
            `;

            const btn = card.querySelector('.buy-btn');
            btn.addEventListener('click', () => {
                if (isEquipped) return;
                if (isOwned) {
                    engine.playerState.currentWeaponId = w.id;
                    engine.saveData();
                    renderArmory();
                    uiHooks.showToast(`${w.name} kuşandı!`, "info");
                } else {
                    if (engine.playerState.cash >= w.price) {
                        engine.playerState.cash -= w.price;
                        w.owned = true;
                        engine.playerState.currentWeaponId = w.id;
                        engine.saveData();
                        renderArmory();
                        uiHooks.showToast(`${w.name} satın alındı ve kuşandı!`, "info");
                    } else {
                        uiHooks.showToast("Yetersiz bakiye! Görev tamamlayıp para kazan.", "warning");
                    }
                }
            });

            grid.appendChild(card);
        });

        // Yükseltmeler
        renderUpgradesList();
    }

    function renderUpgradesList() {
        const upgCont = document.getElementById('upgrades-catalog');
        upgCont.innerHTML = '';

        UPGRADES_DATA.forEach(u => {
            const currentLvl = engine.playerState.upgrades[u.id] || 0;
            const isMax = currentLvl >= u.maxLevel;
            const cost = (currentLvl + 1) * u.costMultiplier;

            const row = document.createElement('div');
            row.style.cssText = 'background:#1e293b; padding:12px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';
            row.innerHTML = `
                <div>
                    <div style="font-weight:700; font-size:14px;">${u.name} (Seviye ${currentLvl}/${u.maxLevel})</div>
                    <div style="font-size:12px; color:#94a3b8;">${u.effect}</div>
                </div>
                <button class="primary-btn" style="padding:6px 14px; font-size:13px;" ${isMax ? 'disabled' : ''}>
                    ${isMax ? 'MAKSİMUM' : `YÜKSELT ($${cost})`}
                </button>
            `;

            const btn = row.querySelector('button');
            if (!isMax) {
                btn.addEventListener('click', () => {
                    if (engine.playerState.cash >= cost) {
                        engine.playerState.cash -= cost;
                        engine.playerState.upgrades[u.id] = currentLvl + 1;
                        engine.saveData();
                        renderArmory();
                        uiHooks.showToast(`${u.name} yükseltildi!`, "info");
                    } else {
                        uiHooks.showToast("Yetersiz para!", "warning");
                    }
                });
            } else {
                btn.style.background = '#475569';
            }

            upgCont.appendChild(row);
        });
    }

    els.openArmoryBtn.addEventListener('click', () => {
        hideAllModals();
        renderArmory();
        els.armoryModal.classList.remove('hidden');
    });

    els.closeArmoryBtn.addEventListener('click', () => {
        hideAllModals();
        els.menuModal.classList.remove('hidden');
    });

    // --- BÖLÜM SEÇİMİ (20 Bölüm) ---
    function renderLevelSelect() {
        const grid = document.getElementById('levels-grid');
        grid.innerHTML = '';

        MISSIONS_DATA.forEach((m, idx) => {
            const isUnlocked = idx < engine.playerState.unlockedMissions;
            const btn = document.createElement('button');
            btn.style.cssText = `
                padding: 12px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 14px;
                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                background: ${isUnlocked ? '#1e293b' : '#0f172a'};
                border: 1px solid ${isUnlocked ? '#38bdf8' : '#334155'};
                color: ${isUnlocked ? '#f8fafc' : '#64748b'};
            `;
            btn.innerHTML = `Bölüm ${m.id}<br><span style="font-size:11px; font-weight:normal;">${isUnlocked ? `$${m.reward}` : '🔒 Kilitli'}</span>`;

            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    engine.playerState.currentMissionIdx = idx;
                    showBriefing(idx);
                });
            }
            grid.appendChild(btn);
        });
    }

    els.openLevelsBtn.addEventListener('click', () => {
        hideAllModals();
        renderLevelSelect();
        els.levelsModal.classList.remove('hidden');
    });

    els.closeLevelsBtn.addEventListener('click', () => {
        hideAllModals();
        els.menuModal.classList.remove('hidden');
    });

    // --- FARE & DOKUNMATİK KONTROLLER ---
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    // Masaüstü Fare Nişan Alma (Canvas üzerinde hareket ettikçe dürbünü oynatır)
    canvas.addEventListener('mousemove', (e) => {
        if (engine.state !== 'PLAYING') return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        // Ekran merkezine göre kaydırma miktarı
        const dx = (mouseX - 0.5) * 22;
        const dy = (mouseY - 0.5) * 22;
        engine.aim(dx, dy);
    });

    // Mobil Dokunmatik Nişan Alma
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length === 0) return;
        const tx = e.touches[0].clientX;
        const ty = e.touches[0].clientY;
        const dx = (tx - lastX) * 1.6;
        const dy = (ty - lastY) * 1.6;
        engine.aim(dx, dy);
        lastX = tx;
        lastY = ty;
    }, { passive: true });

    canvas.addEventListener('touchend', () => { isDragging = false; });

    // Ateş Butonu
    els.fireBtn.addEventListener('click', () => engine.pullTrigger());

    // Zoom Butonu
    els.zoomBtn.addEventListener('click', () => engine.cycleZoom());

    // Nefes Tut Butonu (Bas-çek)
    const startBreath = () => {
        engine.setBreath(true);
        els.breathBtn.classList.add('active');
    };
    const endBreath = () => {
        engine.setBreath(false);
        els.breathBtn.classList.remove('active');
    };

    els.breathBtn.addEventListener('mousedown', startBreath);
    els.breathBtn.addEventListener('mouseup', endBreath);
    els.breathBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startBreath(); });
    els.breathBtn.addEventListener('touchend', endBreath);

    // Klavye Kısayolları (Masaüstü için)
    window.addEventListener('keydown', (e) => {
        if (engine.state !== 'PLAYING') return;
        if (e.code === 'Space') {
            engine.pullTrigger();
        } else if (e.code === 'KeyZ') {
            engine.cycleZoom();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            startBreath();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            endBreath();
        }
    });

    // Fare Tıklaması ile Ateş
    canvas.addEventListener('mousedown', (e) => {
        if (engine.state === 'PLAYING' && e.button === 0) {
            engine.pullTrigger();
        }
    });

    // Sağ Tık ile Nefes Tutma
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        engine.cycleZoom();
    });

    // YouTube Playables SDK Entegrasyonu (Varsa otomatik algılar)
    if (window.ytgame) {
        window.ytgame.game.firstFrameReady();
        window.ytgame.game.gameReady();

        window.ytgame.system.onPause(() => {
            if (window.soundSystem) window.soundSystem.muted = true;
        });

        window.ytgame.system.onResume(() => {
            if (window.soundSystem) window.soundSystem.muted = false;
        });
    }
});
