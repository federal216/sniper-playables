// 2.5D Keskin Nişancı Oyun Motoru (Canvas + Fizik + Parallaks + Karakter Çizici)

class SniperEngine {
    constructor(canvas, uiHooks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiHooks;

        // Boyutlar
        this.width = canvas.width = 1280;
        this.height = canvas.height = 720;

        // Oyuncu & Silah Durumu
        this.playerState = {
            cash: 500,
            currentMissionIdx: 0,
            currentWeaponId: 'scout_sr21',
            unlockedMissions: 1,
            upgrades: {
                stabilizer: 1,
                breath_extender: 1,
                suppressor: 0
            }
        };

        this.loadSavedData();

        // Kamera & Dürbün Durumu
        this.camera = { x: 500, y: 350 };
        this.targetCamera = { x: 500, y: 350 };
        this.scopeZoom = 2.0;
        this.targetZoom = 2.0;
        this.swayTime = 0;
        this.swayOffset = { x: 0, y: 0 };
        this.recoilOffset = { x: 0, y: 0 };

        // Dürbün vs Genel Bakış Modu
        this.isScoped = false; // Başlangıçta geniş Genel Bakış modu
        this.overviewScanTime = 0;
        this.isThermal = false; // Termal Görüş (FLIR) Modu
        this.bulletCam = null;  // Ağır Çekim Mermi Kamerası
        this.shellCasings = []; // Boş Kovan Fırlatma Parçacıkları
        this.screenShake = 0;   // Ekran Sarsıntısı

        // Nefes Tutma
        this.isHoldingBreath = false;
        this.breathGauge = 1.0; // 0 to 1
        this.timeScale = 1.0;

        // Oyun Durumu
        this.state = 'MENU'; // 'BRIEFING', 'PLAYING', 'BULLET_CAM', 'SUCCESS', 'FAILED'
        this.activeMission = null;
        this.targets = []; // Hedef ve siviller
        this.particles = [];
        this.decals = [];
        this.rainDrops = [];

        // Düşman Sniper Lazer Durumu
        this.enemySniperAimTime = 0;

        // Zamanlayıcı
        this.missionTimeLeft = 30;
        this.lastFrameTime = performance.now();

        this.initRain();
        this.setupLoop();
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('sniper_playables_save');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.playerState = Object.assign(this.playerState, parsed);
            }
        } catch (e) {
            console.warn("Save load error:", e);
        }
    }

    saveData() {
        try {
            localStorage.setItem('sniper_playables_save', JSON.stringify(this.playerState));
        } catch (e) {
            console.warn("Save error:", e);
        }
    }

    getActiveWeapon() {
        return WEAPONS_DATA.find(w => w.id === this.playerState.currentWeaponId) || WEAPONS_DATA[0];
    }

    // Görev Başlatma
    startMission(missionIndex) {
        if (missionIndex < 0 || missionIndex >= MISSIONS_DATA.length) return;
        this.playerState.currentMissionIdx = missionIndex;
        this.activeMission = JSON.parse(JSON.stringify(MISSIONS_DATA[missionIndex]));

        const weapon = this.getActiveWeapon();
        // Göreve geniş Genel Bakış (Overview) ile başla ki oyuncu şehri tarayıp hedefi rahatça bulsun
        this.isScoped = false;
        this.isThermal = false;
        this.bulletCam = null;
        this.shellCasings = [];
        this.screenShake = 0;
        this.scopeZoom = 1.0;
        this.targetZoom = 1.0;
        this.overviewScanTime = 0;

        this.missionTimeLeft = this.activeMission.timeLimit;
        this.camera.x = 500;
        this.camera.y = 350;
        this.targetCamera.x = 500;
        this.targetCamera.y = 350;
        this.particles = [];
        this.decals = [];
        this.enemySniperAimTime = 0;
        this.breathGauge = 1.0;
        this.isHoldingBreath = false;
        this.timeScale = 1.0;

        // Hedefleri Oluştur
        this.initMissionEntities();

        this.state = 'PLAYING';
        this.ui.onMissionStarted(this.activeMission, weapon, this.isScoped);
        window.soundSystem.playVoice('start');
    }

    // Dürbün Açma / Kapatma (Genel Bakış <-> Hassas Nişan)
    toggleScope(forceState) {
        if (this.state !== 'PLAYING') return;
        this.isScoped = forceState !== undefined ? forceState : !this.isScoped;
        const weapon = this.getActiveWeapon();

        if (this.isScoped) {
            this.targetZoom = weapon.zoomLevels[weapon.currentZoomIdx || 0];
            window.soundSystem.playZoom();
            this.ui.showToast("🎯 Scope Deployed (Precision Aim)", "info");
        } else {
            this.targetZoom = 1.0;
            this.setBreath(false); // Reset breath when leaving scope
            window.soundSystem.playZoom();
            this.ui.showToast("👁️ Recon Overview (Area Survey)", "info");
        }
        this.ui.onScopeToggled(this.isScoped, this.targetZoom);
    }

    // Thermal Vision (FLIR Infrared Sensor)
    toggleThermal() {
        if (this.state !== 'PLAYING') return;
        this.isThermal = !this.isThermal;
        window.soundSystem.playZoom();
        this.ui.showToast(this.isThermal ? "🌡️ Thermal FLIR Mode Activated" : "👁️ Standard Optical Scope", "info");
        this.ui.onThermalToggled(this.isThermal);
    }

    // Boş Kovan Fırlatma (Ekrandan dönerek fırlayan pirinç kovan)
    ejectCasing() {
        this.shellCasings.push({
            x: this.width - 80,
            y: this.height - 120,
            vx: -3.5 - Math.random() * 3,
            vy: -7 - Math.random() * 4,
            rot: Math.random() * Math.PI,
            vRot: 0.25 + Math.random() * 0.35,
            life: 1.0
        });
    }

    initMissionEntities() {
        this.targets = [];

        // Ana Hedef
        const t = this.activeMission.target;
        this.targets.push({
            isTarget: true,
            x: t.x,
            y: t.y,
            speed: t.speed || 0,
            minX: t.minX || t.x - 100,
            maxX: t.maxX || t.x + 100,
            type: t.type,
            clothes: t.clothes,
            label: t.label,
            isAlive: true,
            panic: false,
            animFrame: 0,
            peekTimer: 0,
            peekHidden: false
        });

        // Siviller & Korumalar
        if (this.activeMission.civilians) {
            this.activeMission.civilians.forEach(c => {
                this.targets.push({
                    isTarget: false,
                    isHostage: c.isHostage || false,
                    isHelicopter: c.isHelicopter || false,
                    x: c.x,
                    y: c.y,
                    speed: c.speed || 0,
                    minX: c.x - 80,
                    maxX: c.x + 80,
                    type: 'civilian',
                    clothes: c.clothes,
                    isAlive: true,
                    panic: false,
                    animFrame: Math.random() * 10
                });
            });
        }
    }

    initRain() {
        this.rainDrops = [];
        for (let i = 0; i < 150; i++) {
            this.rainDrops.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                len: 12 + Math.random() * 18,
                speed: 18 + Math.random() * 12
            });
        }
    }

    // Fare / Dokunmatik Nişan Hareketi
    aim(dx, dy) {
        if (this.state !== 'PLAYING') return;
        // Genel Bakış modunda kamera hızlı hareket eder; Dürbün modunda hassas kayar
        const sensitivity = this.isScoped ? (0.45 / this.scopeZoom) : 1.1;
        this.targetCamera.x += dx * sensitivity;
        this.targetCamera.y += dy * sensitivity;

        // Sahne sınırları
        this.targetCamera.x = Math.max(100, Math.min(900, this.targetCamera.x));
        this.targetCamera.y = Math.max(120, Math.min(580, this.targetCamera.y));
    }

    // Dürbün Zoom Seviyesi Değiştirme
    cycleZoom() {
        if (this.state !== 'PLAYING') return;
        if (!this.isScoped) {
            this.toggleScope(true);
            return;
        }
        const weapon = this.getActiveWeapon();
        weapon.currentZoomIdx = ((weapon.currentZoomIdx || 0) + 1) % weapon.zoomLevels.length;
        this.targetZoom = weapon.zoomLevels[weapon.currentZoomIdx];
        window.soundSystem.playZoom();
        this.ui.updateHUDZoom(this.targetZoom);
    }

    // Nefes Tutma
    setBreath(holding) {
        if (this.state !== 'PLAYING') return;
        if (!this.isScoped && holding) {
            this.toggleScope(true); // Nefes tutmak isteyince otomatik dürbün açar
        }
        if (holding && this.breathGauge > 0.2) {
            this.isHoldingBreath = true;
            this.timeScale = 0.35; // Zaman yavaşlar
            window.soundSystem.startHeartbeat();
        } else {
            this.isHoldingBreath = false;
            this.timeScale = 1.0;
            window.soundSystem.stopHeartbeat();
        }
    }

    // Tetiği Çekme (Ateş Etme)
    pullTrigger() {
        if (this.state !== 'PLAYING') return;

        // Eğer Genel Bakış modundaysak, ateş etmek yerine önce dürbünü açıp odaklar
        if (!this.isScoped) {
            this.toggleScope(true);
            return;
        }

        const weapon = this.getActiveWeapon();
        const hasSilencer = weapon.silenced || this.playerState.upgrades.suppressor > 0;

        window.soundSystem.playGunshot(hasSilencer);
        window.soundSystem.stopHeartbeat();
        this.isHoldingBreath = false;
        this.timeScale = 1.0;

        // Namlu Geri Tepmesi (Recoil)
        this.recoilOffset.y = -28 / Math.sqrt(this.scopeZoom);
        this.recoilOffset.x = (Math.random() - 0.5) * 12;
        this.screenShake = 6;
        this.ejectCasing();

        // Balistik & Rüzgar Hesabı
        const crosshairWorldX = this.camera.x + this.swayOffset.x;
        const crosshairWorldY = this.camera.y + this.swayOffset.y;

        // Rüzgar sapması: Barrett gibi ağır tüfeklerde rüzgar etkisi %70 azalır
        const windResistance = weapon.id === 'barrett_m82' ? 0.2 : 0.8;
        const windDrift = (this.activeMission.wind || 0) * (this.activeMission.distance / 120) * windResistance;
        const bulletImpactX = crosshairWorldX - windDrift;
        const bulletImpactY = crosshairWorldY;

        // Mermi İzi / Patlama Parçacığı
        this.addBulletImpactEffect(bulletImpactX, bulletImpactY);

        // Vuruş Kontrolü
        this.checkHit(bulletImpactX, bulletImpactY);
    }

    checkHit(hitX, hitY) {
        let hitSomething = false;

        for (let i = 0; i < this.targets.length; i++) {
            const ent = this.targets[i];
            if (!ent.isAlive) continue;

            // Karakter Bounding Box
            // Kafa: y - 55 to y - 35, x - 12 to x + 12
            // Gövde: y - 35 to y + 5, x - 15 to x + 15
            const headDist = Math.hypot(hitX - ent.x, hitY - (ent.y - 45));
            const bodyDistX = Math.abs(hitX - ent.x);
            const bodyDistY = Math.abs(hitY - (ent.y - 15));

            const isHeadshot = headDist < 16;
            const isBodyHit = bodyDistX < 18 && bodyDistY < 32;

            if (isHeadshot || isBodyHit) {
                hitSomething = true;

                // Pencere arkasındaysa cam kırılma efekti ve sesi
                if (ent.type === 'window' || ent.behindGlass) {
                    ent.glassBroken = true;
                    window.soundSystem.playGlassShatter();
                    this.addGlassShards(ent.x, ent.y - (isHeadshot ? 45 : 15));
                }

                if (ent.isTarget) {
                    // SİNEMATİK AĞIR ÇEKİM MERMİ KAMERASI (BULLET-CAM)
                    this.state = 'BULLET_CAM';
                    this.bulletCam = {
                        startX: this.camera.x,
                        startY: this.camera.y,
                        targetX: ent.x,
                        targetY: ent.y - (isHeadshot ? 45 : 15),
                        targetEnt: ent,
                        isHeadshot: isHeadshot,
                        progress: 0.0,
                        duration: 1.1,
                        trail: []
                    };
                    this.timeScale = 0.2;
                    return;
                } else if (ent.isHostage) {
                    ent.isAlive = false;
                    this.addBloodSplatter(ent.x, ent.y - (isHeadshot ? 45 : 15));
                    window.soundSystem.playHitSound(isHeadshot);
                    window.soundSystem.playVoice('hostage_hit');
                    this.handleMissionFail("Hostage injured! Mission compromised.");
                    return;
                } else {
                    ent.isAlive = false;
                    this.addBloodSplatter(ent.x, ent.y - (isHeadshot ? 45 : 15));
                    window.soundSystem.playHitSound(isHeadshot);
                    window.soundSystem.playVoice('hostage_hit');
                    this.handleMissionFail("Innocent civilian killed! Mission failed.");
                    return;
                }
            }
        }

        if (!hitSomething) {
            // Iskalama!
            window.soundSystem.playRicochet();
            this.handleMissShot();
        }
    }

    handleMissShot() {
        const weapon = this.getActiveWeapon();
        const hasSilencer = weapon.silenced || this.playerState.upgrades.suppressor > 0;
        window.soundSystem.playVoice('miss');

        // Eğer susturucu yoksa herkes panikler ve hedef kaçmaya başlar!
        if (!hasSilencer) {
            this.targets.forEach(t => {
                t.panic = true;
                t.speed = (t.speed >= 0 ? 1 : -1) * 2.8; // Hızlıca koş
            });
            this.ui.showToast("Target heard the gunshot and is fleeing!", "warning");
        } else {
            this.ui.showToast("Shot missed! Suppressor kept you undetected.", "info");
        }
    }

    handleMissionSuccess(isHeadshot) {
        this.state = 'SUCCESS';
        window.soundSystem.playSuccess();

        let earned = this.activeMission.reward;
        if (isHeadshot) earned += 150; // Headshot bonusu
        if (this.playerState.upgrades.suppressor > 0) earned = Math.round(earned * 1.25);

        this.playerState.cash += earned;

        // Sonraki görevin kilidini aç
        if (this.playerState.currentMissionIdx + 1 >= this.playerState.unlockedMissions &&
            this.playerState.unlockedMissions < MISSIONS_DATA.length) {
            this.playerState.unlockedMissions = this.playerState.currentMissionIdx + 2;
        }

        this.saveData();
        this.ui.onMissionComplete(this.activeMission, earned, isHeadshot);
    }

    handleMissionFail(reason) {
        this.state = 'FAILED';
        window.soundSystem.playFail();
        if (!reason.includes("Hostage") && !reason.includes("civilian")) {
            window.soundSystem.playVoice('failed');
        }
        this.ui.onMissionFailed(reason || "Target escaped or mission objectives failed.");
    }

    addBloodSplatter(x, y) {
        for (let i = 0; i < 24; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 1.2) * 6,
                color: '#c53030',
                size: 2 + Math.random() * 4,
                life: 1.0
            });
        }
    }

    addBulletImpactEffect(x, y) {
        // Duvar tozu / kıvılcım
        for (let i = 0; i < 14; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: Math.random() > 0.5 ? '#ecc94b' : '#a0aec0',
                size: 2 + Math.random() * 3,
                life: 0.6
            });
        }
        this.decals.push({ x: x, y: y, size: 4 });
    }

    addGlassShards(x, y) {
        // Cam kırılma parçacık patlaması (40 adet dönerken düşen kristal cam kırığı)
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.5,
                color: Math.random() > 0.4 ? 'rgba(224, 242, 254, 0.95)' : 'rgba(186, 230, 253, 0.8)',
                size: 2 + Math.random() * 4,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 15,
                life: 1.2,
                isGlass: true
            });
        }
    }

    // Ana Döngü (Update & Render)
    setupLoop() {
        const loop = (now) => {
            const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = now;

            this.update(dt);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update(dt) {
        const effectiveDt = dt * this.timeScale;

        // Dürbün Hareketi ve Sallantı (Sway)
        const weapon = this.getActiveWeapon();
        const stabBonus = (this.playerState.upgrades.stabilizer - 1) * 0.1;
        const totalStability = Math.min(0.98, weapon.baseStability + stabBonus);

        this.swayTime += effectiveDt * (this.isHoldingBreath ? 0.4 : 1.2);
        const swayAmp = (1.0 - totalStability) * (this.isHoldingBreath ? 3 : 16);
        this.swayOffset.x = Math.sin(this.swayTime * 1.5) * swayAmp;
        this.swayOffset.y = Math.cos(this.swayTime * 2.3) * (swayAmp * 0.7);

        // Geri tepme yumuşatma
        this.recoilOffset.x *= 0.85;
        this.recoilOffset.y *= 0.85;
        this.screenShake *= 0.85;

        // Boş Kovan Fiziği
        for (let i = this.shellCasings.length - 1; i >= 0; i--) {
            const c = this.shellCasings[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.5; // Yerçekimi
            c.rot += c.vRot;
            c.life -= dt * 1.2;
            if (c.life <= 0) this.shellCasings.splice(i, 1);
        }

        // SİNEMATİK AĞIR ÇEKİM MERMİ KAMERASI (BULLET-CAM)
        if (this.state === 'BULLET_CAM' && this.bulletCam) {
            const bc = this.bulletCam;
            bc.progress += (dt / bc.duration);

            const currentBulletX = bc.startX + (bc.targetX - bc.startX) * Math.min(1.0, bc.progress);
            const currentBulletY = bc.startY + (bc.targetY - bc.startY) * Math.min(1.0, bc.progress);

            // Kamera mermiyi odaklar ve yakından takip eder
            this.camera.x = currentBulletX;
            this.camera.y = currentBulletY;
            this.targetZoom = 3.6;

            bc.trail.push({ x: currentBulletX, y: currentBulletY });
            if (bc.trail.length > 24) bc.trail.shift();

            // Mermi hedefe çarptı!
            if (bc.progress >= 1.0) {
                bc.targetEnt.isAlive = false;
                if (bc.targetEnt.type === 'window' || bc.targetEnt.behindGlass) {
                    bc.targetEnt.glassBroken = true;
                    window.soundSystem.playGlassShatter();
                    this.addGlassShards(bc.targetX, bc.targetY);
                }
                this.addBloodSplatter(bc.targetX, bc.targetY);
                window.soundSystem.playHitSound(bc.isHeadshot);
                this.screenShake = 18; // Şiddetli vuruş etkisi
                this.recoilOffset.y = -16;

                setTimeout(() => {
                    window.soundSystem.playVoice(bc.isHeadshot ? 'headshot' : 'target_hit');
                }, 300);

                setTimeout(() => {
                    this.handleMissionSuccess(bc.isHeadshot);
                }, 1300);

                this.bulletCam = null;
            }
        }

        // Kamera yumuşak takip
        this.camera.x += (this.targetCamera.x - this.camera.x) * 0.12;
        this.camera.y += (this.targetCamera.y - this.camera.y) * 0.12;
        this.scopeZoom += (this.targetZoom - this.scopeZoom) * 0.15;

        // Nefes Barı Yönetimi
        const maxBreath = weapon.breathTime + (this.playerState.upgrades.breath_extender - 1) * 1.5;
        if (this.isHoldingBreath) {
            this.breathGauge -= dt / maxBreath;
            if (this.breathGauge <= 0) {
                this.breathGauge = 0;
                this.setBreath(false); // Nefes tükendi!
            }
        } else {
            this.breathGauge = Math.min(1.0, this.breathGauge + dt * 0.35); // Yavaşça dolar
        }

        if (this.state === 'PLAYING') {
            // Zamanlayıcı
            this.missionTimeLeft -= effectiveDt;
            if (this.missionTimeLeft <= 0) {
                this.handleMissionFail("Süre doldu! Hedef bölgeden uzaklaştı.");
            }

            // Düşman Sniper Tehdidi (Bölüm 19)
            if (this.activeMission && this.activeMission.enemySniper) {
                this.enemySniperAimTime += effectiveDt;
                if (this.enemySniperAimTime > 10.0) {
                    this.handleMissionFail("Düşman keskin nişancı seni tespit edip vurdu!");
                }
            }

            // Hedeflerin Yürümesi ve Hareketi
            this.targets.forEach(t => {
                if (!t.isAlive) return;
                t.x += t.speed * effectiveDt * 30;
                t.animFrame += Math.abs(t.speed) * effectiveDt * 10;

                // Belirlenen aralıkta git-gel yapma
                if (t.speed > 0 && t.x > t.maxX) {
                    t.speed = -Math.abs(t.speed);
                } else if (t.speed < 0 && t.x < t.minX) {
                    t.speed = Math.abs(t.speed);
                }

                // Sınır dışına çıkarsa ve panik halindeyse kaçmıştır
                if (t.panic && (t.x < 50 || t.x > 950)) {
                    t.isAlive = false;
                    this.handleMissionFail("Hedef gözden kayboldu ve kaçtı!");
                }
            });
        }

        // Parçacıkları Güncelle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * effectiveDt * 40;
            p.y += p.vy * effectiveDt * 40;
            p.vy += p.isGlass ? 0.35 : 0.25; // Cam daha ağır düşer
            if (p.isGlass && p.vRot) p.rot = (p.rot || 0) + p.vRot * effectiveDt * 10;
            p.life -= effectiveDt * (p.isGlass ? 0.9 : 1.5);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Yağmur Damlaları
        if (this.activeMission && this.activeMission.weather === 'rain') {
            this.rainDrops.forEach(r => {
                r.y += r.speed * (effectiveDt * 50);
                r.x -= 2;
                if (r.y > this.height) {
                    r.y = -10;
                    r.x = Math.random() * this.width;
                }
            });
        }

        // UI Güncellemeleri
        if (this.state === 'PLAYING') {
            this.ui.updateHUD({
                timeLeft: Math.max(0, Math.ceil(this.missionTimeLeft)),
                breathGauge: this.breathGauge,
                wind: this.activeMission.wind || 0,
                distance: this.activeMission.distance || 200,
                cash: this.playerState.cash
            });
        }
    }

    // --- 2.5D Çizim ve Render Motoru ---
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const currentZoom = this.scopeZoom;
        const shakeX = (Math.random() - 0.5) * this.screenShake;
        const shakeY = (Math.random() - 0.5) * this.screenShake;
        const viewX = this.camera.x + this.swayOffset.x + this.recoilOffset.x + shakeX;
        const viewY = this.camera.y + this.swayOffset.y + this.recoilOffset.y + shakeY;

        ctx.save();
        // Zoom ve Kamera Merkezleme
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(currentZoom, currentZoom);
        ctx.translate(-viewX, -viewY);

        // 1. Katman: Gökyüzü ve Arka Plan (Parallaks)
        this.drawSkyAndBackdrop(ctx, viewX, viewY);

        // 2. Katman: Uzak Gökdelenler & Şehir Silüeti
        this.drawFarCity(ctx, viewX, viewY);

        // 3. Katman: Ana Binalar, Pencereler, Çatılar
        this.drawMidBuildings(ctx);

        // Mermi Delikleri
        this.decals.forEach(d => {
            ctx.fillStyle = '#1a202c';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // 4. Katman: Hedefler, Karakterler, Siviller
        this.targets.forEach(t => this.drawCharacter(ctx, t));

        // 5. Katman: Mimari Ön Plan Detayları (Balkon Korkulukları, Pencere Cam Yansımaları, Çerçeveler, Pervazlar)
        this.drawBuildingForegrounds(ctx);

        // Parçacıklar (Kan, Toz, Kıvılcım, Dönen Kristal Cam Kırıkları)
        this.particles.forEach(p => {
            if (p.isGlass) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot || 0);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath();
                ctx.moveTo(-p.size, -p.size * 0.7);
                ctx.lineTo(p.size, -p.size * 0.3);
                ctx.lineTo(p.size * 0.3, p.size);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;

        // Düşman Sniper Lazeri
        if (this.activeMission && this.activeMission.enemySniper && this.state === 'PLAYING') {
            this.drawEnemySniperLaser(ctx);
        }

        // Sinematik Mermi Kamerası
        if (this.bulletCam) {
            this.drawBulletCam(ctx);
        }

        ctx.restore();

        // 5. Katman: Hava Durumu (Yağmur)
        if (this.activeMission && this.activeMission.weather === 'rain') {
            this.drawRain(ctx);
        }

        // Fırlayan Boş Kovanlar
        this.drawShellCasings(ctx);

        // 6. Katman: Keskin Nişancı Dürbünü veya Genel Bakış HUD
        if (this.state === 'PLAYING' || this.state === 'BULLET_CAM') {
            if (this.isScoped || this.state === 'BULLET_CAM') {
                this.drawScopeOverlay(ctx);
            } else {
                this.drawOverviewOverlay(ctx);
            }
        }
    }

    drawSkyAndBackdrop(ctx, vx, vy) {
        const isNight = this.activeMission && (this.activeMission.weather === 'neon_night' || this.activeMission.weather === 'rain');
        const grad = ctx.createLinearGradient(0, -200, 0, 700);
        if (isNight) {
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.7, '#1e1b4b');
            grad.addColorStop(1, '#2e1065');
        } else {
            grad.addColorStop(0, '#1e3a8a');
            grad.addColorStop(0.4, '#3b82f6');
            grad.addColorStop(0.8, '#f59e0b');
            grad.addColorStop(1, '#ea580c');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(-200, -200, 1500, 900);
    }

    drawFarCity(ctx, vx, vy) {
        // 2.5D Derin Parallaks Şehir Katmanı
        const parallaxX = vx * 0.12;

        // Uzak Silüet Plazaları
        ctx.fillStyle = '#090d16';
        for (let i = 0; i < 18; i++) {
            const bx = i * 85 - parallaxX;
            const bh = 240 + Math.sin(i * 1.7) * 90;
            ctx.fillRect(bx, 620 - bh, 75, bh);

            // Uzak bina tepelerindeki yanıp sönen kırmızı uyarı ışıkları (Aviation Beacon)
            const blink = Math.sin(performance.now() * 0.004 + i) > 0.3;
            if (blink && i % 3 === 0) {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(bx + 37, 620 - bh - 6, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#090d16';
            }

            // Uzak minik pencere ışıltıları
            for (let w = 0; w < 4; w++) {
                if ((i + w) % 2 === 0) {
                    ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
                    ctx.fillRect(bx + 15 + w * 12, 620 - bh + 40 + w * 25, 4, 6);
                    ctx.fillStyle = '#090d16';
                }
            }
        }
    }

    // Gerçekçi Binalar, Dokular, Çatı Ekipmanları ve Aydınlatmalar
    drawMidBuildings(ctx) {
        const time = performance.now();
        const isThermal = this.isThermal;

        // --- 1. SOL BİNA: Tarihi Tuğla / Taş Rezidans ---
        const leftWallColor = isThermal ? '#081226' : '#26161b';
        ctx.fillStyle = leftWallColor;
        ctx.fillRect(80, 230, 240, 390);

        // Tuğla Dokusu ve Derz Çizgileri
        if (!isThermal) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.lineWidth = 1;
            for (let y = 230; y < 620; y += 16) {
                ctx.beginPath();
                ctx.moveTo(80, y);
                ctx.lineTo(320, y);
                ctx.stroke();

                // Dikey şaşırtmalı tuğla çizgileri
                const row = Math.floor((y - 230) / 16);
                const shift = (row % 2) * 12;
                for (let x = 80 + shift; x < 320; x += 24) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + 16);
                    ctx.stroke();
                }
            }

            // Çatı Taş Silmesi & Parapet (Cornice with brackets)
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(76, 222, 248, 8);
            ctx.fillStyle = '#18181b';
            ctx.fillRect(74, 220, 252, 3);
            for (let bx = 84; bx < 320; bx += 20) {
                ctx.fillRect(bx, 226, 6, 6);
            }

            // Dış Duvar AC Kompresörleri (Damlama animasyonlu)
            [ {x: 95, y: 350}, {x: 275, y: 480} ].forEach(ac => {
                ctx.fillStyle = '#475569';
                ctx.fillRect(ac.x, ac.y, 18, 14);
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(ac.x + 9, ac.y + 7, 4.5, 0, Math.PI * 2);
                ctx.fill();
                const dropOffset = (time * 0.04 + ac.x) % 25;
                ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
                ctx.fillRect(ac.x + 9, ac.y + 14 + dropOffset, 1.5, 3);
            });
        }

        // Yangın Merdiveni (Fire Escape) - Sol Cephe
        ctx.strokeStyle = isThermal ? '#1e293b' : '#334155';
        ctx.lineWidth = 2;
        for (let floor = 0; floor < 4; floor++) {
            const fy = 270 + floor * 70;
            ctx.strokeRect(60, fy, 40, 6);
            ctx.strokeRect(60, fy - 16, 40, 16);
            ctx.beginPath();
            ctx.moveTo(95, fy + 6);
            ctx.lineTo(65, fy + 70);
            ctx.stroke();
        }

        // Çatı Su Kulesi (Cedar Wood Water Tower)
        ctx.fillStyle = isThermal ? '#0f172a' : '#451a03';
        ctx.fillRect(110, 150, 60, 60);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(110, 162, 60, 2);
        ctx.strokeRect(110, 185, 60, 2);
        ctx.strokeRect(110, 202, 60, 2);
        ctx.fillStyle = isThermal ? '#1e293b' : '#57534e';
        ctx.beginPath();
        ctx.moveTo(105, 150);
        ctx.lineTo(140, 115);
        ctx.lineTo(175, 150);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(115, 210); ctx.lineTo(110, 230);
        ctx.moveTo(165, 210); ctx.lineTo(170, 230);
        ctx.moveTo(115, 210); ctx.lineTo(170, 230);
        ctx.moveTo(165, 210); ctx.lineTo(110, 230);
        ctx.stroke();

        // Çatı Havalandırma (HVAC) ve Dönen Pervane
        ctx.fillStyle = '#334155';
        ctx.fillRect(200, 195, 50, 35);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(225, 212, 12, 0, Math.PI * 2);
        ctx.fill();
        const fanAngle = time * 0.015;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(225 - Math.cos(fanAngle) * 10, 212 - Math.sin(fanAngle) * 10);
        ctx.lineTo(225 + Math.cos(fanAngle) * 10, 212 + Math.sin(fanAngle) * 10);
        ctx.stroke();

        // Sol Bina Pencereleri
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 3; c++) {
                const wx = 120 + c * 60;
                const wy = 260 + r * 65;
                ctx.fillStyle = '#1c1917';
                ctx.fillRect(wx - 2, wy - 2, 34, 44);
                const isWarm = (r + c) % 2 === 0;
                ctx.fillStyle = isThermal ? '#0284c7' : (isWarm ? 'rgba(254, 240, 138, 0.7)' : 'rgba(15, 23, 42, 0.85)');
                ctx.fillRect(wx, wy, 30, 40);

                if (!isThermal && isWarm) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    for (let j = 0; j < 6; j++) {
                        ctx.fillRect(wx, wy + j * 4, 30, 1.5);
                    }
                }
            }
        }

        // --- 2. ORTA BİNA: Modern Cam & Çelik Plaza (Vanguard Plaza) ---
        const midWallGrad = ctx.createLinearGradient(350, 160, 640, 620);
        midWallGrad.addColorStop(0, isThermal ? '#081a33' : '#1e293b');
        midWallGrad.addColorStop(1, isThermal ? '#030712' : '#0f172a');
        ctx.fillStyle = midWallGrad;
        ctx.fillRect(350, 160, 290, 460);

        // Çatı Korkuluğu ve Helipad Işıkları
        ctx.fillStyle = '#475569';
        ctx.fillRect(350, 155, 290, 6);
        for (let x = 360; x <= 630; x += 30) {
            ctx.fillStyle = isThermal ? '#38bdf8' : '#22c55e';
            ctx.fillRect(x, 153, 4, 2);
        }

        // Gökdelen Cam Giydirme Cephe (Curtain Wall Panelleri)
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 4; col++) {
                const gx = 375 + col * 65;
                const gy = 185 + row * 65;

                const glassGrad = ctx.createLinearGradient(gx, gy, gx + 45, gy + 45);
                if (isThermal) {
                    glassGrad.addColorStop(0, '#0369a1');
                    glassGrad.addColorStop(0.5, '#0c4a6e');
                    glassGrad.addColorStop(1, '#082f49');
                } else {
                    const isLit = (row * 3 + col) % 3 === 0;
                    if (isLit) {
                        glassGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
                        glassGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.8)');
                        glassGrad.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
                    } else {
                        glassGrad.addColorStop(0, 'rgba(30, 58, 138, 0.8)');
                        glassGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.95)');
                        glassGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
                    }
                }

                ctx.fillStyle = glassGrad;
                ctx.fillRect(gx, gy, 48, 45);

                ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(gx, gy, 48, 45);
            }
        }

        // Canlı Finans & Haber Kayan Yazısı (LED Stock Ticker)
        if (!isThermal) {
            ctx.fillStyle = '#020617';
            ctx.fillRect(350, 360, 290, 16);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 10px monospace';
            const tickerText = "NASDAQ ▲ 18,940.25   |   VANGUARD CORP ▲ +3.8%   |   GOLD $2,780/oz   |   CODENAME: EAGLE-1 ACTIVE   |   ";
            const offset = (time * 0.04) % 450;
            ctx.save();
            ctx.beginPath();
            ctx.rect(350, 360, 290, 16);
            ctx.clip();
            ctx.fillText(tickerText, 352 - offset, 372);
            ctx.fillText(tickerText, 352 - offset + 450, 372);
            ctx.restore();
        }

        // Neon Otel / Bar Tabelası (Canlı Neon Parıltısı)
        if (!isThermal) {
            ctx.save();
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 12;
            ctx.font = '900 13px sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('HOTEL VANGUARD', 420, 175);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // VIP Teras Balkonu Taban Tabla Yapısı
        ctx.fillStyle = isThermal ? '#1e293b' : '#334155';
        ctx.fillRect(390, 310, 210, 8);

        // --- 3. SAĞ BİNA: Telekomünikasyon Kulesi & Helikopter Pisti ---
        ctx.fillStyle = isThermal ? '#08182e' : '#111827';
        ctx.fillRect(680, 130, 240, 490);
        ctx.fillStyle = '#374151';
        ctx.fillRect(680, 125, 240, 6);

        // Çatı İletişim Anteni (Yüksek çelik kule)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(740, 125); ctx.lineTo(740, 40);
        ctx.moveTo(730, 125); ctx.lineTo(740, 75); ctx.lineTo(750, 125);
        ctx.stroke();

        // Tepe Yanıp Sönen Kırmızı Uyarı Işığı (Strobe Beacon)
        const strobe = Math.sin(time * 0.007) > 0.1;
        ctx.fillStyle = strobe ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(740, 38, strobe ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Parabolik Uydu Çanağı (Satellite Dish)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(840, 105, 18, 0.8 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(840, 105); ctx.lineTo(828, 92);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(826, 90, 4, 4);

        // Sağ Kule Pencereleri & Işıklar
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 3; c++) {
                const px = 715 + c * 65;
                const py = 150 + r * 62;
                const isLit = (r + c * 2) % 3 !== 0;
                ctx.fillStyle = isThermal ? '#0369a1' : (isLit ? 'rgba(56, 189, 248, 0.7)' : 'rgba(17, 24, 39, 0.9)');
                ctx.fillRect(px, py, 42, 38);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, 42, 38);
            }
        }

        // --- 4. ZEMİN CADDE & SOKAK DETAYLARI ---
        ctx.fillStyle = isThermal ? '#030712' : '#0a0f1d';
        ctx.fillRect(0, 520, 1100, 180);

        // Asfalt Yol Şeritleri
        ctx.strokeStyle = isThermal ? '#1e293b' : '#eab308';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 565); ctx.lineTo(1100, 565);
        ctx.moveTo(0, 569); ctx.lineTo(1100, 569);
        ctx.stroke();

        // Sokak Lambası Direği & Işık Konisi (Streetlamp Lighting)
        if (!isThermal) {
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(510, 520); ctx.lineTo(510, 440);
            ctx.lineTo(525, 435);
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(525, 437, 4, 0, Math.PI * 2);
            ctx.fill();

            const lightGrad = ctx.createRadialGradient(525, 440, 5, 525, 520, 110);
            lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
            lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.moveTo(525, 440);
            ctx.lineTo(440, 540);
            ctx.lineTo(610, 540);
            ctx.closePath();
            ctx.fill();
        }
    }

    // 5. Katman: Mimari Ön Plan Detayları (Balkon Korkulukları, Cam Yansımaları, Çerçeveler, Pervazlar)
    drawBuildingForegrounds(ctx) {
        const isThermal = this.isThermal;

        // 1. VIP TERAS BALKONU ÖN PLANI (Balkondaki karakterlerin bacaklarının önüne gelir)
        ctx.fillStyle = isThermal ? '#0f172a' : '#1e293b';
        ctx.fillRect(388, 308, 214, 5);

        // Buzlu & füme güvenlik cam panelleri
        const glassRailingGrad = ctx.createLinearGradient(390, 275, 390, 310);
        glassRailingGrad.addColorStop(0, isThermal ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.35)');
        glassRailingGrad.addColorStop(1, isThermal ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.6)');
        ctx.fillStyle = glassRailingGrad;
        ctx.fillRect(390, 275, 210, 33);

        // Paslanmaz çelik dikey dikmeler ve üst küpeşte korkuluk
        ctx.strokeStyle = isThermal ? '#38bdf8' : '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(388, 275); ctx.lineTo(602, 275);
        ctx.stroke();

        // Cam panel bölme dikmeleri
        for (let bx = 390; bx <= 600; bx += 35) {
            ctx.beginPath();
            ctx.moveTo(bx, 275);
            ctx.lineTo(bx, 308);
            ctx.stroke();
        }

        // Balkon Mobilyası: Bistro kokteyl masası (x: 440)
        ctx.fillStyle = isThermal ? '#1e293b' : '#334155';
        ctx.fillRect(432, 282, 16, 2);
        ctx.fillRect(439, 284, 2, 24);
        ctx.fillRect(434, 306, 12, 2);
        if (!isThermal) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(442, 276, 3, 5);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(442, 278, 3, 3);
        }

        // Saksı Bitkileri (Yeşil topiary / teras peyzajı)
        [393, 585].forEach(px => {
            ctx.fillStyle = isThermal ? '#064e3b' : '#14532d';
            ctx.beginPath();
            ctx.arc(px + 6, 272, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px + 2, 275, 8, 8);
        });

        // 2. SOL BİNA FRANSIZ BALKONLARI (Wrought Iron Railings)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const wx = 120 + c * 60;
                const wy = 260 + r * 65;
                ctx.fillStyle = isThermal ? '#1e293b' : '#475569';
                ctx.fillRect(wx - 4, wy + 39, 38, 4);

                ctx.strokeStyle = isThermal ? '#0f172a' : '#1c1917';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(wx - 2, wy + 26, 34, 14);
                for (let px = wx + 2; px < wx + 32; px += 5) {
                    ctx.beginPath();
                    ctx.moveTo(px, wy + 26);
                    ctx.lineTo(px, wy + 40);
                    ctx.stroke();
                }
            }
        }

        // 3. PENCERE ARKASINDAKİ HEDEFLER İÇİN ÖN CAM, ÇERÇEVE & KIRILMA DETAYLARI
        this.targets.forEach(t => {
            if (t.type === 'window' || t.behindGlass) {
                const pw = 48;
                const ph = 46;
                const px = t.x - pw / 2;
                const py = t.y - ph + 4;

                // İç oda aydınlatması / Hacker mavi ekran ışığı
                if (!isThermal && !t.glassBroken) {
                    const specGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
                    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
                    specGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.18)');
                    specGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
                    specGrad.addColorStop(1, 'rgba(15, 23, 42, 0.35)');
                    ctx.fillStyle = specGrad;
                    ctx.fillRect(px, py, pw, ph);
                }

                // Pencere Çerçevesi ve Orta Haç Bölmeler
                ctx.strokeStyle = isThermal ? '#1e293b' : '#334155';
                ctx.lineWidth = 2;
                ctx.strokeRect(px, py, pw, ph);

                ctx.beginPath();
                ctx.moveTo(px + pw / 2, py); ctx.lineTo(px + pw / 2, py + ph);
                ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2);
                ctx.stroke();

                // Yan perdeler
                if (!isThermal) {
                    ctx.fillStyle = '#1e3a8a';
                    ctx.fillRect(px, py, 6, ph);
                    ctx.fillRect(px + pw - 6, py, 6, ph);
                }

                // Alt Mermer Pervaz
                ctx.fillStyle = isThermal ? '#0f172a' : '#cbd5e1';
                ctx.fillRect(px - 3, py + ph, pw + 6, 3);

                // KIRILMIŞ CAM EFEKTİ
                if (t.glassBroken) {
                    ctx.save();
                    const hitPointX = t.x;
                    const hitPointY = t.y - 28;

                    // Mermi deliği
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                    ctx.beginPath();
                    ctx.arc(hitPointX, hitPointY, 7, 0, Math.PI * 2);
                    ctx.fill();

                    // Işınsal örümcek ağı cam çatlakları
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.lineWidth = 1.2;
                    for (let a = 0; a < 8; a++) {
                        const angle = (a / 8) * Math.PI * 2;
                        const len = 12 + ((a * 7) % 14);
                        ctx.beginPath();
                        ctx.moveTo(hitPointX, hitPointY);
                        ctx.lineTo(hitPointX + Math.cos(angle) * len, hitPointY + Math.sin(angle) * len);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            } else if (t.type === 'fire_escape') {
                ctx.strokeStyle = isThermal ? '#38bdf8' : '#64748b';
                ctx.lineWidth = 2;
                ctx.strokeRect(t.x - 25, t.y - 20, 50, 20);
                for (let fx = t.x - 20; fx < t.x + 25; fx += 8) {
                    ctx.beginPath();
                    ctx.moveTo(fx, t.y - 20);
                    ctx.lineTo(fx, t.y);
                    ctx.stroke();
                }
            }
        });

        // 4. CADDE KALDIRIM VE BORDIR ÖN PLANI
        ctx.fillStyle = isThermal ? '#081226' : '#1e293b';
        ctx.fillRect(0, 520, 1100, 6);
    }

    // İnsan Anatomisine Sahip Gelişmiş Karakter Çizici (Gölge, Beden, Kollar, Kıyafet, Saç)
    drawCharacter(ctx, t) {
        if (!t.isAlive) {
            // Yere serilmiş insan cesedi (Gerçekçi devrilme)
            ctx.save();
            ctx.translate(t.x, t.y);
            // Kan lekesi
            ctx.fillStyle = 'rgba(153, 27, 27, 0.7)';
            ctx.beginPath();
            ctx.ellipse(0, 8, 22, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Yatan gövde
            ctx.fillStyle = t.clothes.jacket || '#2d3748';
            ctx.fillRect(-18, 0, 36, 10);
            // Yatan bacaklar
            ctx.fillStyle = t.clothes.pants || '#1a202c';
            ctx.fillRect(-28, 2, 14, 7);
            // Kafa
            ctx.fillStyle = '#f6ad55';
            ctx.beginPath();
            ctx.arc(22, 5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(t.x, t.y);

        if (this.isThermal) {
            // TERMAL GÖRÜŞ (FLIR INFRARED HEAT MAP)
            ctx.fillStyle = '#ef4444'; // Dış kızılötesi ısı
            ctx.beginPath();
            ctx.ellipse(0, -22, 16, 28, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#facc15'; // Sıcak vücut çekirdeği
            ctx.beginPath();
            ctx.ellipse(0, -22, 11, 23, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff'; // En sıcak çekirdek (göğüs ve kafa)
            ctx.beginPath();
            ctx.arc(0, -42, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, -25, 7, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            return;
        }

        // 1. Zemin Gölgesi (Ambient Occlusion Shadow)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const legCycle = Math.sin(t.animFrame);
        const walkOffset = legCycle * 7;
        const pantsColor = (t.clothes && t.clothes.pants) || '#1a202c';
        const shoeColor = (t.clothes && t.clothes.shoeColor) || '#0f172a';
        const skinColor = (t.clothes && t.clothes.skinTone) || '#f6ad55';
        const hairColor = (t.clothes && t.clothes.hairColor) || '#1c1917';
        const eyeColor = (t.clothes && t.clothes.eyeColor) || '#1e3a8a';
        const hairStyle = (t.clothes && t.clothes.hairStyle) || 'slick_back';
        const facialHair = (t.clothes && t.clothes.facialHair) || 'clean';
        const jacketColor = (t.clothes && t.clothes.jacket) || '#2d3748';
        const jacketStyle = (t.clothes && t.clothes.jacketStyle) || 'suit';
        const shirtColor = (t.clothes && t.clothes.shirt) || '#f8fafc';

        // 2. Bacaklar ve Ayakkabılar (Kalın, kumaş hatlı insan bacağı)
        // Sol Bacak
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.moveTo(-4, -10);
        ctx.lineTo(-7 + walkOffset, 10);
        ctx.lineTo(-2 + walkOffset, 10);
        ctx.lineTo(-1, -10);
        ctx.fill();
        // Sol Ayakkabı
        ctx.fillStyle = shoeColor;
        ctx.fillRect(-8 + walkOffset, 10, 8, 4);

        // Sağ Bacak
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.moveTo(1, -10);
        ctx.lineTo(2 - walkOffset, 10);
        ctx.lineTo(7 - walkOffset, 10);
        ctx.lineTo(4, -10);
        ctx.fill();
        // Sağ Ayakkabı
        ctx.fillStyle = shoeColor;
        ctx.fillRect(2 - walkOffset, 10, 8, 4);

        // 3. Arka Kol (Yürüyüş salınımı)
        ctx.fillStyle = jacketColor;
        ctx.beginPath();
        ctx.ellipse(-9, -24 + walkOffset * 0.4, 4, 10, -walkOffset * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Arka El
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-9, -13 + walkOffset * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();

        // 4. İnsan Gövdesi (Ceket, Yelek, Trençkot, Kapüşonlu)
        ctx.fillStyle = jacketColor;
        ctx.beginPath();
        ctx.moveTo(-9, -36); // Sol omuz
        ctx.lineTo(9, -36);  // Sağ omuz
        ctx.lineTo(7, -8);   // Sağ bel
        ctx.lineTo(-7, -8);  // Sol bel
        ctx.closePath();
        ctx.fill();

        // Gömlek V-kesimi
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        ctx.moveTo(-3, -36);
        ctx.lineTo(3, -36);
        ctx.lineTo(0, -26);
        ctx.closePath();
        ctx.fill();

        // Ceket Stili Detayları
        if (jacketStyle === 'tuxedo') {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(-9, -36); ctx.lineTo(-3, -36); ctx.lineTo(-1, -24); ctx.lineTo(-7, -24); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(9, -36); ctx.lineTo(3, -36); ctx.lineTo(1, -24); ctx.lineTo(7, -24); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(4, -28, 3, 1.5); // Cep mendili
        } else if (jacketStyle === 'trench') {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-8, -36, 4, 1.5);
            ctx.fillRect(4, -36, 4, 1.5);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-3, -24, 1.5, 1.5); ctx.fillRect(1.5, -24, 1.5, 1.5);
            ctx.fillRect(-3, -18, 1.5, 1.5); ctx.fillRect(1.5, -18, 1.5, 1.5);
        } else if (jacketStyle === 'hoodie') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(0, -36, 6, 0, Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-2, -34); ctx.lineTo(-2, -26);
            ctx.moveTo(2, -34); ctx.lineTo(2, -26);
            ctx.stroke();
        }

        // Kravat
        if (t.clothes && t.clothes.tie) {
            ctx.fillStyle = t.clothes.tie;
            ctx.beginPath();
            ctx.moveTo(-1.5, -35);
            ctx.lineTo(1.5, -35);
            ctx.lineTo(2, -18);
            ctx.lineTo(0, -15);
            ctx.lineTo(-2, -18);
            ctx.closePath();
            ctx.fill();
        }

        // Ceket Düğmeleri / Fermuar çizgisi
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -8);
        ctx.stroke();

        // 5. Boyun & Çene Altı Gölgesi
        ctx.fillStyle = skinColor;
        ctx.fillRect(-2.5, -39, 5, 4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(-2.5, -39, 5, 1.5);

        // 6. Kafa ve Çene Anatomisi
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -45, 6.5, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Kulak ve Telsiz Kulaklığı
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-5.8, -44, 2, 0, Math.PI * 2);
        ctx.fill();
        if (t.clothes && t.clothes.earpiece) {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-6.5, -44, 1.5, 2.5);
        }

        // 7. KAŞLAR (Eyebrows)
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-1, -48); ctx.lineTo(1.8, -48.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2.5, -48.8); ctx.lineTo(6.5, -48);
        ctx.stroke();

        // 8. GÖZLER (Sclera + Renkli İris + Siyah Gözbebeği + Canlı Işık Parıltısı)
        if (t.clothes && (t.clothes.hat === 'sunglasses' || t.clothes.accessory === 'sunglasses' || t.clothes.glasses === 'sunglasses')) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, -47.5, 7.5, 4);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(0, -47.5, 7.5, 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(1.5, -47, 2, 1);
        } else if (t.clothes && (t.clothes.hat === 'glasses' || t.clothes.glasses === 'optical')) {
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.strokeRect(1, -47.5, 6, 4);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(4, -45.5, 2.2, 1.3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = eyeColor;
            ctx.beginPath(); ctx.arc(4.3, -45.5, 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(4.4, -45.5, 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(3.8, -46.2, 0.8, 0.8);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(4, -45.5, 2.2, 1.3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.arc(4.3, -45.5, 1.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(4.4, -45.5, 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(3.9, -46.2, 0.8, 0.8);

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(2, -46.7);
            ctx.lineTo(6, -46.4);
            ctx.stroke();
        }

        // 9. BURUN (Nose Bridge & Tip)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(3.5, -45.5);
        ctx.lineTo(6.6, -42.8);
        ctx.lineTo(4.6, -42.2);
        ctx.stroke();

        // 10. DUDAK VE AĞIZ (Mouth & Lips)
        ctx.strokeStyle = 'rgba(153, 27, 27, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(2.5, -40.2);
        ctx.lineTo(5.5, -40.2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(3, -39.4, 2.5, 0.8);

        // 11. SAKAL, BIYIK VE KİRLİ SAKAL (Facial Hair)
        if (facialHair === 'stubble') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            for (let sx = 0; sx <= 5; sx += 1.5) {
                for (let sy = -41; sy <= -38; sy += 1.2) {
                    ctx.fillRect(sx, sy, 0.8, 0.8);
                }
            }
        } else if (facialHair === 'goatee') {
            ctx.fillStyle = hairColor;
            ctx.fillRect(2.5, -41.8, 3.5, 1.2);
            ctx.fillRect(3, -39.5, 2.8, 2.5);
        } else if (facialHair === 'full_beard') {
            ctx.fillStyle = hairColor;
            ctx.beginPath();
            ctx.moveTo(0, -43);
            ctx.lineTo(6, -42);
            ctx.lineTo(5.5, -37.5);
            ctx.lineTo(-2, -37.5);
            ctx.closePath();
            ctx.fill();
        } else if (facialHair === 'mustache') {
            ctx.fillStyle = hairColor;
            ctx.fillRect(2, -41.8, 4.5, 1.5);
        }

        // 12. SAÇ MODELLERİ (Hair Styles)
        if (!t.clothes || !t.clothes.hat || t.clothes.hat === 'none' || t.clothes.hat === 'sunglasses' || t.clothes.hat === 'glasses') {
            ctx.fillStyle = hairColor;
            if (hairStyle === 'slick_back') {
                ctx.beginPath();
                ctx.arc(0, -48, 7.2, Math.PI * 0.9, 0.1);
                ctx.fill();
                ctx.fillRect(3, -48, 2.5, 5);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(-2, -50, 5, 1.5);
            } else if (hairStyle === 'side_part') {
                ctx.beginPath();
                ctx.arc(-1, -48, 7.5, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(4, -48, 2.5, 4);
            } else if (hairStyle === 'buzz_cut') {
                ctx.beginPath();
                ctx.arc(0, -47.5, 6.8, Math.PI, 0);
                ctx.fill();
            } else if (hairStyle === 'bald') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.beginPath();
                ctx.arc(1, -49, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (hairStyle === 'curly') {
                for (let ca = 0; ca < 5; ca++) {
                    ctx.beginPath();
                    ctx.arc(-4 + ca * 2.5, -50 + (ca % 2), 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillRect(3, -48, 2.5, 4);
            } else if (hairStyle === 'pompadour') {
                ctx.beginPath();
                ctx.arc(1, -50, 6, Math.PI * 0.9, 0.2);
                ctx.fill();
                ctx.fillRect(4, -48, 2.5, 5);
            } else {
                ctx.beginPath();
                ctx.arc(0, -48, 7, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(4, -48, 2.5, 5);
            }
        }

        // 7. Şapkalar & Kasklar
        if (t.clothes.hat === 'cap_red') {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(0, -48, 7.5, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(1, -48, 8, 2.5); // Siperlik
        } else if (t.clothes.hat === 'cap_blue') {
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.arc(0, -48, 7.5, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(1, -48, 8, 2.5);
        } else if (t.clothes.hat === 'cap_black') {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, -48, 7.5, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(1, -48, 8, 2.5);
        } else if (t.clothes.hat === 'hardhat_yellow') {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(0, -49, 8.5, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-7, -49, 15, 3); // Baret siperi
        } else if (t.clothes.hat === 'ski_mask') {
            ctx.fillStyle = '#18181b';
            ctx.beginPath();
            ctx.ellipse(0, -45, 7, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skinColor;
            ctx.fillRect(0, -46, 6, 2.5); // Göz yarığı
        } else if (t.clothes.hat === 'fedora_black') {
            ctx.fillStyle = '#09090b';
            ctx.fillRect(-9, -48, 18, 3); // Geniş kenar
            ctx.fillRect(-5, -55, 10, 7); // Tepe
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-5, -49, 10, 1.5); // Kırmızı şerit
        }

        // 8. Ön Kol & Taşınan Eşyalar
        ctx.fillStyle = t.clothes.jacket || '#2d3748';
        ctx.beginPath();
        ctx.ellipse(7, -24 - walkOffset * 0.4, 4, 10, walkOffset * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(7, -13 - walkOffset * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Aksesuarlar (Çanta, Şemsiye, Telefon, Kadeh)
        if (t.clothes.accessory === 'briefcase') {
            ctx.fillStyle = '#451a03'; // Deri evrak çantası
            ctx.fillRect(5, -14 - walkOffset * 0.4, 12, 10);
            ctx.fillStyle = '#fbbf24'; // Altın kilit
            ctx.fillRect(10, -11 - walkOffset * 0.4, 2, 2);
        } else if (t.clothes.accessory === 'phone') {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(3, -44, 3, 6); // Kulağa götürülen telefon
        } else if (t.clothes.accessory === 'cigar') {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(4, -42, 6, 2);
            ctx.fillStyle = '#ef4444'; // Yanan uç
            ctx.fillRect(10, -42, 2, 2);
            if (!this.isThermal) {
                const smokeTime = performance.now() * 0.003;
                ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
                ctx.beginPath();
                ctx.arc(13 + Math.sin(smokeTime) * 3, -46 - (smokeTime % 1) * 8, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (t.clothes.accessory === 'wine' || t.clothes.accessory === 'cocktail') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1;
            ctx.strokeRect(6, -26, 4, 7);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(6.5, -23, 3, 3.5);
        } else if (t.clothes.accessory === 'laptop') {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(4, -22, 14, 2);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(14, -32, 2, 11);
            if (!this.isThermal) {
                const glow = ctx.createRadialGradient(10, -32, 2, 0, -42, 18);
                glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
                glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, -42, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (t.clothes.accessory === 'binoculars') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(2, -48, 8, 5);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(9, -47.5, 1.5, 4);
        } else if (t.clothes.accessory === 'umbrella') {
            ctx.fillStyle = '#eab308'; // Şemsiye kubbesi
            ctx.beginPath();
            ctx.arc(4, -60, 20, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(4, -60);
            ctx.lineTo(4, -30);
            ctx.stroke();
        }

        // Panik İfadesi (!)
        if (t.panic) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('!', -3, -60);
        }

        // 9. GENEL BAKIŞ MODUNDA HEDEF BELİRTEÇ VURGUSU
        // Kullanıcı "hedefi zor buldum" dediği için Genel Bakış modundayken hedef üstünde hafif bir taktik işaretçi gösterilir
        if (!this.isScoped && t.isTarget && this.state === 'PLAYING') {
            const pulse = (Math.sin(performance.now() * 0.006) + 1) * 0.5;
            ctx.save();
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;

            // Yanıp sönen ters sarı üçgen ok
            ctx.beginPath();
            ctx.moveTo(0, -68 - pulse * 6);
            ctx.lineTo(-7, -78 - pulse * 6);
            ctx.lineTo(7, -78 - pulse * 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // "SUSPECT" Target Marker
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'center';
            ctx.fillText('SUSPECT', 0, -82 - pulse * 6);
            ctx.restore();
        }

        ctx.restore();
    }

    // RECON OVERVIEW HUD (Wide City Survey Mode)
    drawOverviewOverlay(ctx) {
        const w = this.width;
        const h = this.height;

        ctx.save();

        // 1. Tactical Frame Corners [  ]
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        const cornerSize = 40;
        const pad = 30;

        // Top Left
        ctx.beginPath();
        ctx.moveTo(pad, pad + cornerSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + cornerSize, pad);
        ctx.stroke();
        // Top Right
        ctx.beginPath();
        ctx.moveTo(w - pad - cornerSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + cornerSize);
        ctx.stroke();
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(pad, h - pad - cornerSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + cornerSize, h - pad);
        ctx.stroke();
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(w - pad - cornerSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - cornerSize);
        ctx.stroke();

        // 2. Light Center Reticle Box
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 24, cy - 24, 48, 48);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
        ctx.stroke();

        // 3. Top Info Pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - 195, 26, 390, 34, 18);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('👁️ RECON OVERVIEW — SCAN AREA TO IDENTIFY TARGET', cx, 42);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Aim & Scope: [RIGHT CLICK] or tap [SCOPE IN]', cx, 54);

        ctx.restore();
    }

    // Sinematik Mermi Kamerası Çizimi (Bullet-Cam)
    drawBulletCam(ctx) {
        if (!this.bulletCam) return;
        const bc = this.bulletCam;
        const curX = bc.startX + (bc.targetX - bc.startX) * Math.min(1.0, bc.progress);
        const curY = bc.startY + (bc.targetY - bc.startY) * Math.min(1.0, bc.progress);
        const angle = Math.atan2(bc.targetY - bc.startY, bc.targetX - bc.startX);

        ctx.save();
        // 1. Duman ve Hava Şok Dalgası İzi
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        bc.trail.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // 2. Altın / Pirinç .50 Cal Mermi
        ctx.translate(curX, curY);
        ctx.rotate(angle);

        // Şok halkaları
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-10, 0, 5, 12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Mermi gövdesi
        const bGrad = ctx.createLinearGradient(0, -5, 0, 5);
        bGrad.addColorStop(0, '#fef08a');
        bGrad.addColorStop(0.5, '#eab308');
        bGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(14, 0); // Sivri aerodinamik uç
        ctx.lineTo(2, 5);
        ctx.lineTo(-12, 5);
        ctx.lineTo(-12, -5);
        ctx.lineTo(2, -5);
        ctx.closePath();
        ctx.fill();

        // Arka parlama
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(-12, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Boş Kovan Fırlatma Çizimi
    drawShellCasings(ctx) {
        ctx.save();
        this.shellCasings.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(-6, -2.5, 12, 5);
            ctx.fillStyle = '#713f12';
            ctx.fillRect(4, -3, 2, 6); // Rim
            ctx.restore();
        });
        ctx.restore();
    }

    drawEnemySniperLaser(ctx) {
        // Karşı kuleden oyuncunun dürbününe doğru yaklaşan kırmızı lazer
        const target = this.activeMission.target;
        const progress = Math.min(1.0, this.enemySniperAimTime / 10.0);

        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + progress * 0.5})`;
        ctx.lineWidth = 2 + progress * 2;
        ctx.setLineDash([8, 4]);

        ctx.beginPath();
        ctx.moveTo(target.x, target.y - 45);
        ctx.lineTo(this.camera.x, this.camera.y);
        ctx.stroke();
        ctx.restore();
    }

    drawRain(ctx) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        this.rainDrops.forEach(r => {
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x - 4, r.y + r.len);
        });
        ctx.stroke();
    }

    // Gerçekçi Keskin Nişancı Dürbünü (Reticle, Vignette, Mil-Dots)
    drawScopeOverlay(ctx) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const radius = Math.min(cx, cy) - 30;

        ctx.save();

        // 1. Dürbün Dışı Karartma (Optik Dışı Maskeleme)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
        ctx.fill();

        // 2. Mercek İç Kenar Gölgesi (Vignette)
        const lensGrad = ctx.createRadialGradient(cx, cy, radius * 0.75, cx, cy, radius);
        lensGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lensGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.4)');
        lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Mercek Çerçeve Çemberi
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Reticle (Artı Kılı ve Mil-Dot Çizgileri)
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.lineWidth = 1.5;

        // Dikey Çizgi
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx, cy + radius);
        // Yatay Çizgi
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.stroke();

        // Mil-Dot Noktaları (Mesafe ve Denge Hesaplama Çizgileri)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const step = 45;
            // Yatay çizgiler
            ctx.beginPath();
            ctx.arc(cx + i * step, cy, 2, 0, Math.PI * 2);
            ctx.arc(cx, cy + i * step, 2, 0, Math.PI * 2);
            ctx.fill();

            // Rüzgar çizgisi cetveli
            ctx.fillRect(cx + i * step - 0.5, cy - 4, 1, 8);
            ctx.fillRect(cx - 4, cy + i * step - 0.5, 8, 1);
        }

        // Merkez Kırmızı Işık (Red Dot - Hassas Nişan Noktası)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
