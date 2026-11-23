// UI & Input Management (English Localization for YouTube Playables)

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const toast = document.getElementById('toast-notification');

    // UI Elements
    const els = {
        timerVal: document.getElementById('timer-val'),
        cashVal: document.getElementById('cash-val'),
        windVal: document.getElementById('wind-val'),
        distVal: document.getElementById('dist-val'),
        zoomVal: document.getElementById('zoom-val'),
        breathFill: document.getElementById('breath-fill'),
        missionNameHud: document.getElementById('mission-name-hud'),

        // Modals
        menuModal: document.getElementById('menu-modal'),
        briefingModal: document.getElementById('briefing-modal'),
        victoryModal: document.getElementById('victory-modal'),
        failModal: document.getElementById('fail-modal'),
        armoryModal: document.getElementById('armory-modal'),
        levelsModal: document.getElementById('levels-modal'),
        endlessModal: document.getElementById('endless-modal'),
        endlessFailReason: document.getElementById('endless-fail-reason'),
        endlessFinalStreak: document.getElementById('endless-final-streak'),
        endlessBestStreak: document.getElementById('endless-best-streak'),
        endlessTotalCash: document.getElementById('endless-total-cash'),

        // HUD Clue & Streak Banner
        hudClueBanner: document.getElementById('hud-clue-banner'),
        hudStreakPill: document.getElementById('hud-streak-pill'),
        hudClueText: document.getElementById('hud-clue-text'),
        targetMugshotCanvas: document.getElementById('target-mugshot-canvas'),
        hudTargetLabel: document.getElementById('hud-target-label'),

        // Briefing Elements
        briefingTitle: document.getElementById('briefing-title'),
        briefingText: document.getElementById('briefing-text'),
        briefingClue: document.getElementById('briefing-clue'),
        briefingReward: document.getElementById('briefing-reward'),

        // Result Elements
        victoryReward: document.getElementById('victory-reward'),
        victoryHeadshotBadge: document.getElementById('victory-headshot-badge'),
        failReason: document.getElementById('fail-reason'),

        // Buttons
        startBriefingBtn: document.getElementById('start-briefing-btn'),
        startEndlessBtn: document.getElementById('start-endless-btn'),
        endlessRetryBtn: document.getElementById('endless-retry-btn'),
        endlessMenuBtn: document.getElementById('endless-menu-btn'),
        launchMissionBtn: document.getElementById('launch-mission-btn'),
        nextMissionBtn: document.getElementById('next-mission-btn'),
        victoryReplayBtn: document.getElementById('victory-replay-btn'),
        retryMissionBtn: document.getElementById('retry-mission-btn'),
        hudRetryBtn: document.getElementById('hud-retry-btn'),
        victory2xBtn: document.getElementById('victory-2x-reward-btn'),
        armoryGrantBtn: document.getElementById('armory-grant-ad-btn'),
        endless2xBtn: document.getElementById('endless-2x-reward-btn'),
        openArmoryBtn: document.getElementById('open-armory-btn'),
        closeArmoryBtn: document.getElementById('close-armory-btn'),
        openLevelsBtn: document.getElementById('open-levels-btn'),
        closeLevelsBtn: document.getElementById('close-levels-btn'),

        // Control Buttons
        scopeToggleBtn: document.getElementById('scope-toggle-btn'),
        scopeToggleText: document.getElementById('scope-toggle-text'),
        thermalBtn: document.getElementById('thermal-btn'),
        fireBtn: document.getElementById('fire-btn'),
        zoomBtn: document.getElementById('zoom-btn'),
        breathBtn: document.getElementById('breath-btn')
    };

    // Handsome Operative Avatar Placement
    if (window.SNIPER_HERO_AVATAR_SVG) {
        const menuAv = document.getElementById('hero-avatar-menu');
        const victoryAv = document.getElementById('hero-avatar-victory');
        const hudAv = document.getElementById('hero-avatar-hud');
        if (menuAv) menuAv.innerHTML = window.SNIPER_HERO_AVATAR_SVG;
        if (victoryAv) victoryAv.innerHTML = window.SNIPER_HERO_AVATAR_SVG;
        if (hudAv) hudAv.innerHTML = window.SNIPER_HERO_AVATAR_SVG;
    }

    // ===== PLAYGAMA BRIDGE SDK: Full Monetization & Lifecycle System =====
    const bridgeReady = { initialized: false };
    let lastInterstitialTime = 0;
    const INTERSTITIAL_COOLDOWN_MS = 120000; // 2 dakika minimum bekleme (SDK de kontrol eder)

    function notifyGameReady() {
        if (window.bridge && window.bridge.platform && typeof window.bridge.platform.sendMessage === 'function') {
            try {
                window.bridge.platform.sendMessage("game_ready");
                console.log("Playgama Bridge: game_ready signal sent!");
            } catch (e) {
                console.warn("Playgama Bridge sendMessage error:", e);
            }
        }
    }

    // Interstitial (Geçiş Reklamı) — Doğal duraklamalarda tetiklenir
    function showInterstitialAd(placement) {
        if (!window.bridge || !window.bridge.advertisement) return;
        const now = Date.now();
        if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
            console.log("Playgama: Interstitial cooldown active, skipping.");
            return;
        }
        try {
            window.bridge.advertisement.showInterstitial(placement || null);
            lastInterstitialTime = now;
            console.log("Playgama: Interstitial requested →", placement);
        } catch (e) {
            console.warn("Playgama interstitial error:", e);
        }
    }

    // Rewarded (Ödüllü Video) — Oyuncu isteğiyle tetiklenir, ödül callback ile verilir
    function showRewardedAd(placement, onRewarded) {
        if (!window.bridge || !window.bridge.advertisement) {
            console.warn("Playgama: Bridge not available for rewarded ad.");
            if (onRewarded) onRewarded(); // Standalone/test modda ödülü direkt ver
            return;
        }

        let rewarded = false;
        const handler = (state) => {
            console.log("Playgama: Rewarded state →", state);
            if (state === 'rewarded') {
                rewarded = true;
            }
            if (state === 'closed') {
                // Dinleyiciyi kaldır (bir kerelik)
                window.bridge.advertisement.off('rewarded_state_changed', handler);
                if (rewarded && onRewarded) {
                    onRewarded();
                }
            }
            if (state === 'failed') {
                window.bridge.advertisement.off('rewarded_state_changed', handler);
                console.warn("Playgama: Rewarded ad failed to load.");
            }
        };

        window.bridge.advertisement.on('rewarded_state_changed', handler);

        try {
            window.bridge.advertisement.showRewarded(placement || null);
            console.log("Playgama: Rewarded requested →", placement);
        } catch (e) {
            console.warn("Playgama rewarded error:", e);
            window.bridge.advertisement.off('rewarded_state_changed', handler);
        }
    }

    // Interstitial state dinleme (ses & duraklatma için)
    function setupInterstitialStateListener() {
        if (!window.bridge || !window.bridge.advertisement) return;
        window.bridge.advertisement.on('interstitial_state_changed', (state) => {
            console.log("Playgama: Interstitial state →", state);
            if (state === 'opened') {
                if (window.soundSystem) window.soundSystem.setMuted(true);
            }
            if (state === 'closed' || state === 'failed') {
                // Kullanıcının kendi mute durumuna dön
                if (window.soundSystem) window.soundSystem.setMuted(window.soundSystem.userMuted);
            }
        });
    }

    // Platform Lifecycle: Reklam, sekme değiştirme vs. anlarında ses/oyun kontrolü
    function setupPlatformLifecycle() {
        if (!window.bridge || !window.bridge.platform) return;

        // Başlangıçta ses durumunu kontrol et
        if (typeof window.bridge.platform.isAudioEnabled !== 'undefined') {
            if (!window.bridge.platform.isAudioEnabled && window.soundSystem) {
                window.soundSystem.setMuted(true);
            }
        }

        window.bridge.platform.on('audio_state_changed', (isEnabled) => {
            console.log("Playgama: Audio state →", isEnabled);
            if (window.soundSystem) {
                window.soundSystem.setMuted(!isEnabled);
            }
        });

        window.bridge.platform.on('pause_state_changed', (isPaused) => {
            console.log("Playgama: Pause state →", isPaused);
            if (window.soundSystem) {
                if (isPaused) {
                    window.soundSystem.setMuted(true);
                    window.soundSystem.stopHeartbeat();
                } else {
                    window.soundSystem.setMuted(window.soundSystem.userMuted);
                }
            }
        });
    }

    // SDK Başlatma
    if (window.bridge && typeof window.bridge.initialize === 'function') {
        window.bridge.initialize().then(() => {
            bridgeReady.initialized = true;
            console.log("Playgama Bridge SDK initialized!");
            notifyGameReady();
            setupInterstitialStateListener();
            setupPlatformLifecycle();
        }).catch(err => {
            console.log("Playgama Bridge standalone mode:", err);
            notifyGameReady();
        });
    }

    window.addEventListener('load', () => {
        setTimeout(notifyGameReady, 250);
    });
    // ===== END PLAYGAMA BRIDGE =====

    // UI Hooks
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
        onMissionStarted(mission, weapon, isScoped) {
            hideAllModals();
            els.missionNameHud.textContent = mission.title;
            if (els.hudStreakPill) els.hudStreakPill.style.display = 'none';
            if (els.hudClueText) els.hudClueText.textContent = `🎯 ${mission.clue}`;
            if (els.targetMugshotCanvas) engine.renderTargetMugshot(els.targetMugshotCanvas);
            if (els.hudTargetLabel && mission.target) els.hudTargetLabel.textContent = mission.target.label || 'Target';
            els.zoomVal.textContent = isScoped ? `${weapon.zoomLevels[weapon.currentZoomIdx || 0]}x` : '1x';
            if (els.scopeToggleText) {
                els.scopeToggleText.textContent = isScoped ? '👁️ RECON' : '🎯 SCOPE IN';
            }
        },
        onEndlessStarted(contract, weapon, streak, bestStreak) {
            hideAllModals();
            els.missionNameHud.textContent = `🔥 CONTRACT #${streak + 1}`;
            if (els.hudStreakPill) {
                els.hudStreakPill.style.display = 'inline-block';
                els.hudStreakPill.textContent = `🔥 STREAK: ${streak}`;
            }
            if (els.hudClueText) els.hudClueText.textContent = contract.clue;
            if (els.targetMugshotCanvas) engine.renderTargetMugshot(els.targetMugshotCanvas);
            if (els.hudTargetLabel && contract.target) els.hudTargetLabel.textContent = contract.target.label || 'Target';
            els.zoomVal.textContent = '1x';
            if (els.scopeToggleText) els.scopeToggleText.textContent = '🎯 SCOPE IN';
        },
        onEndlessContractLoaded(contract, streak, bestStreak) {
            els.missionNameHud.textContent = `🔥 CONTRACT #${streak + 1}`;
            if (els.hudStreakPill) {
                els.hudStreakPill.style.display = 'inline-block';
                els.hudStreakPill.textContent = `🔥 STREAK: ${streak}`;
            }
            if (els.hudClueText) els.hudClueText.textContent = contract.clue;
            if (els.targetMugshotCanvas) engine.renderTargetMugshot(els.targetMugshotCanvas);
            if (els.hudTargetLabel && contract.target) els.hudTargetLabel.textContent = contract.target.label || 'Target';
        },
        onEndlessComplete(data) {
            hideAllModals();
            if (els.endlessModal) {
                els.endlessModal.classList.remove('hidden');
                els.endlessFailReason.textContent = data.reason;
                els.endlessFinalStreak.textContent = data.streak;
                els.endlessBestStreak.textContent = data.bestStreak;
                els.endlessTotalCash.textContent = `+$${data.totalEarned}`;

                // Endless 2x ödül butonunu hazırla
                if (els.endless2xBtn) {
                    els.endless2xBtn.disabled = false;
                    els.endless2xBtn.classList.remove('claimed');
                    els.endless2xBtn.textContent = `🎬 DOUBLE ENDLESS REWARD (+$${data.totalEarned})`;
                    els.endless2xBtn._earned = data.totalEarned;
                }
            }
            // Endless mod bittikten sonra interstitial
            showInterstitialAd('endless_complete');
        },
        onScopeToggled(isScoped, zoom) {
            if (els.scopeToggleText) {
                els.scopeToggleText.textContent = isScoped ? '👁️ RECON' : '🎯 SCOPE IN';
            }
            els.zoomVal.textContent = isScoped ? `${zoom}x` : '1x';
        },
        onThermalToggled(isThermal) {
            if (els.thermalBtn) {
                els.thermalBtn.style.background = isThermal ? '#0d9488' : '#0f766e';
                els.thermalBtn.style.borderColor = isThermal ? '#5eead4' : '#2dd4bf';
            }
        },
        onMissionComplete(mission, earned, isHeadshot) {
            hideAllModals();
            els.victoryModal.classList.remove('hidden');
            els.victoryReward.textContent = `+$${earned}`;
            els.victoryHeadshotBadge.style.display = isHeadshot ? 'inline-block' : 'none';

            // Zafer ekranında 2x ödül butonunu hazırla (her bölüm sonunda taze)
            if (els.victory2xBtn) {
                els.victory2xBtn.disabled = false;
                els.victory2xBtn.classList.remove('claimed');
                els.victory2xBtn.textContent = `🎬 CLAIM 2X BOUNTY (+$${earned})`;
                els.victory2xBtn._earned = earned; // Referans tut
            }

            // İlk 3 bölüm hariç bölüm sonu interstitial (hook bölgesi)
            if (engine.playerState.currentMissionIdx >= 3) {
                showInterstitialAd('mission_complete');
            }
        },
        onMissionFailed(reason) {
            hideAllModals();
            els.failModal.classList.remove('hidden');
            els.failReason.textContent = reason;

            // Başarısızlık sonrası interstitial (ilk 3 bölüm hariç, çifte reklam koruması SDK'da)
            if (engine.playerState.currentMissionIdx >= 3) {
                showInterstitialAd('mission_failed');
            }
        }
    };

    // Initialize Game Engine
    const engine = new SniperEngine(canvas, uiHooks);

    function hideAllModals() {
        els.menuModal.classList.add('hidden');
        els.briefingModal.classList.add('hidden');
        els.victoryModal.classList.add('hidden');
        els.failModal.classList.add('hidden');
        els.armoryModal.classList.add('hidden');
        els.levelsModal.classList.add('hidden');
        if (els.endlessModal) els.endlessModal.classList.add('hidden');
    }

    function showBriefing(missionIdx) {
        hideAllModals();
        const m = MISSIONS_DATA[missionIdx];
        els.briefingTitle.textContent = m.title;
        els.briefingText.textContent = m.briefing;
        els.briefingClue.textContent = `🎯 TARGET CLUE: ${m.clue}`;
        els.briefingReward.textContent = `BOUNTY: $${m.reward}`;
        els.briefingModal.classList.remove('hidden');
    }

    // Modal Interactions
    els.startBriefingBtn.addEventListener('click', () => {
        showBriefing(engine.playerState.currentMissionIdx);
    });

    els.launchMissionBtn.addEventListener('click', () => {
        engine.startMission(engine.playerState.currentMissionIdx);
    });

    els.nextMissionBtn.addEventListener('click', () => {
        const nextIdx = engine.playerState.currentMissionIdx + 1;
        if (nextIdx < MISSIONS_DATA.length) {
            engine.playerState.currentMissionIdx = nextIdx;
            engine.saveData();
            showBriefing(nextIdx);
        } else {
            uiHooks.showToast("Congratulations! All 20 missions completed!", "info");
            els.menuModal.classList.remove('hidden');
        }
    });

    if (els.victoryReplayBtn) {
        els.victoryReplayBtn.addEventListener('click', () => {
            engine.startMission(engine.playerState.currentMissionIdx);
        });
    }

    els.retryMissionBtn.addEventListener('click', () => {
        engine.startMission(engine.playerState.currentMissionIdx);
    });

    if (els.hudRetryBtn) {
        els.hudRetryBtn.addEventListener('click', () => {
            if (engine.isEndlessMode) {
                engine.startEndlessMode();
            } else {
                engine.startMission(engine.playerState.currentMissionIdx);
            }
            uiHooks.showToast("Operation restarted 🔄", "info");
        });
    }

    if (els.startEndlessBtn) {
        els.startEndlessBtn.addEventListener('click', () => {
            engine.startEndlessMode();
        });
    }

    if (els.endlessRetryBtn) {
        els.endlessRetryBtn.addEventListener('click', () => {
            engine.startEndlessMode();
        });
    }

    if (els.endlessMenuBtn) {
        els.endlessMenuBtn.addEventListener('click', () => {
            hideAllModals();
            els.menuModal.classList.remove('hidden');
        });
    }

    // ===== REWARDED AD BUTTONS (Ödüllü Reklam Tetikleyicileri) =====

    // 1. Victory 2x Reward Button — Bölüm sonu ödülü ikiye katla
    if (els.victory2xBtn) {
        els.victory2xBtn.addEventListener('click', () => {
            const bonusCash = els.victory2xBtn._earned || 0;
            els.victory2xBtn.disabled = true;
            els.victory2xBtn.textContent = '⏳ Loading Ad...';
            showRewardedAd('victory_2x_reward', () => {
                // Ödül verildi!
                engine.playerState.cash += bonusCash;
                engine.saveData();
                els.victory2xBtn.classList.add('claimed');
                els.victory2xBtn.textContent = `✅ CLAIMED +$${bonusCash} BONUS!`;
                els.victoryReward.textContent = `+$${bonusCash * 2}`;
                uiHooks.showToast(`💰 Double bounty! +$${bonusCash} extra earned!`, 'info');
            });
        });
    }

    // 2. Endless 2x Reward Button — Endless mod ödülünü ikiye katla
    if (els.endless2xBtn) {
        els.endless2xBtn.addEventListener('click', () => {
            const bonusCash = els.endless2xBtn._earned || 0;
            els.endless2xBtn.disabled = true;
            els.endless2xBtn.textContent = '⏳ Loading Ad...';
            showRewardedAd('endless_2x_reward', () => {
                engine.playerState.cash += bonusCash;
                engine.saveData();
                els.endless2xBtn.classList.add('claimed');
                els.endless2xBtn.textContent = `✅ CLAIMED +$${bonusCash} BONUS!`;
                els.endlessTotalCash.textContent = `+$${bonusCash * 2}`;
                uiHooks.showToast(`💰 Double bounty! +$${bonusCash} extra earned!`, 'info');
            });
        });
    }

    // 3. Armory Ad Grant Button — Silah atölyesinde reklam karşılığı +$1000 bonus
    const armoryGrantBtn = els.armoryGrantBtn;
    if (armoryGrantBtn) {
        armoryGrantBtn.addEventListener('click', () => {
            armoryGrantBtn.disabled = true;
            armoryGrantBtn.textContent = '⏳ Loading Ad...';
            showRewardedAd('armory_grant', () => {
                engine.playerState.cash += 1000;
                engine.saveData();
                armoryGrantBtn.classList.add('claimed');
                armoryGrantBtn.textContent = '✅ +$1,000 TACTICAL AIRDROP COLLECTED!';
                uiHooks.showToast('💰 Tactical airdrop received! +$1,000!', 'info');
                renderArmory(); // Silah listesini güncelle (yeni bakiye ile)
            });
        });
    }

    // --- ARMORY & WEAPON MODIFICATIONS SYSTEM ---
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
                    Damage: ${w.damage} | Zoom: ${w.zoomLevels.join(', ')}x ${w.silenced ? '| 🔇 Suppressed' : ''}
                </div>
                <button class="buy-btn ${isEquipped ? 'owned' : ''}" data-id="${w.id}">
                    ${isEquipped ? 'EQUIPPED' : (isOwned ? 'EQUIP' : `PURCHASE ($${w.price})`)}
                </button>
            `;

            const btn = card.querySelector('.buy-btn');
            btn.addEventListener('click', () => {
                if (isEquipped) return;
                if (isOwned) {
                    engine.playerState.currentWeaponId = w.id;
                    engine.saveData();
                    renderArmory();
                    uiHooks.showToast(`${w.name} equipped!`, "info");
                } else {
                    if (engine.playerState.cash >= w.price) {
                        engine.playerState.cash -= w.price;
                        w.owned = true;
                        engine.playerState.currentWeaponId = w.id;
                        engine.saveData();
                        renderArmory();
                        uiHooks.showToast(`${w.name} purchased and equipped!`, "info");
                    } else {
                        uiHooks.showToast("Insufficient bounty funds! Complete contracts to earn cash.", "warning");
                    }
                }
            });

            grid.appendChild(card);
        });

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
                    <div style="font-weight:700; font-size:14px;">${u.name} (Tier ${currentLvl}/${u.maxLevel})</div>
                    <div style="font-size:12px; color:#94a3b8;">${u.effect}</div>
                </div>
                <button class="primary-btn" style="padding:6px 14px; font-size:13px;" ${isMax ? 'disabled' : ''}>
                    ${isMax ? 'MAX TIER' : `UPGRADE ($${cost})`}
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
                        uiHooks.showToast(`${u.name} upgraded!`, "info");
                    } else {
                        uiHooks.showToast("Insufficient cash!", "warning");
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
        // Armory her açıldığında reklam butonunu sıfırla (cooldown yok, her girişte tekrar izlenebilir)
        if (els.armoryGrantBtn) {
            els.armoryGrantBtn.disabled = false;
            els.armoryGrantBtn.classList.remove('claimed');
            els.armoryGrantBtn.textContent = '🎬 TACTICAL AIRDROP: WATCH AD FOR +$1,000';
        }
        els.armoryModal.classList.remove('hidden');
    });

    els.closeArmoryBtn.addEventListener('click', () => {
        hideAllModals();
        els.menuModal.classList.remove('hidden');
    });

    // --- 20 MISSIONS DIRECTORY ---
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
            btn.innerHTML = `Mission ${m.id}<br><span style="font-size:11px; font-weight:normal;">${isUnlocked ? `$${m.reward}` : '🔒 Locked'}</span>`;

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

    // --- MOUSE & TOUCH CONTROLS ---
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    // Desktop Mouse Aiming
    canvas.addEventListener('mousemove', (e) => {
        if (engine.state !== 'PLAYING') return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        const dx = (mouseX - 0.5) * 22;
        const dy = (mouseY - 0.5) * 22;
        engine.aim(dx, dy);
    });

    // Mobile Touch Drag Aiming
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

    // Buttons
    if (els.scopeToggleBtn) {
        els.scopeToggleBtn.addEventListener('click', () => engine.toggleScope());
    }
    if (els.thermalBtn) {
        els.thermalBtn.addEventListener('click', () => engine.toggleThermal());
    }

    els.fireBtn.addEventListener('click', () => engine.pullTrigger());
    els.zoomBtn.addEventListener('click', () => engine.cycleZoom());

    // Audio Mute Toggle Control
    const muteBtn = document.getElementById('audio-mute-btn');
    const muteIcon = document.getElementById('audio-mute-icon');
    const muteText = document.getElementById('audio-mute-text');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const isMuted = window.soundSystem.toggleMute();
            if (muteIcon) muteIcon.textContent = isMuted ? '🔇' : '🔊';
            if (muteText) muteText.textContent = isMuted ? 'MUTED' : 'SFX ON';
            uiHooks.showToast(isMuted ? '🔇 Audio Muted' : '🔊 Audio Enabled', 'info');
        });
    }

    // Breath Focus Control
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

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (engine.state !== 'PLAYING') return;
        if (e.code === 'KeyQ' || e.code === 'Tab') {
            e.preventDefault();
            engine.toggleScope();
        } else if (e.code === 'KeyT') {
            e.preventDefault();
            engine.toggleThermal();
        } else if (e.code === 'Space') {
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

    // Left Click to Fire
    canvas.addEventListener('mousedown', (e) => {
        if (engine.state === 'PLAYING' && e.button === 0) {
            engine.pullTrigger();
        }
    });

    // Right Click to Scope / Recon
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        engine.toggleScope();
    });

    // YouTube Playables SDK Lifecycle Hooks (YouTube'da reklam yok, sadece ses/duraklatma)
    if (window.ytgame) {
        window.ytgame.game.firstFrameReady();
        window.ytgame.game.gameReady();

        window.ytgame.system.onPause(() => {
            if (window.soundSystem) window.soundSystem.setMuted(true);
        });

        window.ytgame.system.onResume(() => {
            if (window.soundSystem) window.soundSystem.setMuted(window.soundSystem.userMuted);
        });
    }
});
