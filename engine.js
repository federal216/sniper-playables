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
            this.ui.showToast("🎯 Dürbün Açıldı (Hassas Nişan)", "info");
        } else {
            this.targetZoom = 1.0;
            this.setBreath(false); // Dürbün kapalıyken nefes tutmayı sıfırla
            window.soundSystem.playZoom();
            this.ui.showToast("👁️ Genel Bakış (Şehri Tara)", "info");
        }
        this.ui.onScopeToggled(this.isScoped, this.targetZoom);
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
                ent.isAlive = false;

                // Kan ve yere düşme parçacıkları
                this.addBloodSplatter(ent.x, ent.y - (isHeadshot ? 45 : 15));
                window.soundSystem.playHitSound(isHeadshot);

                if (ent.isTarget) {
                    // HEDEF VURULDU! BAŞARILI!
                    this.state = 'BULLET_CAM';
                    setTimeout(() => {
                        window.soundSystem.playVoice(isHeadshot ? 'headshot' : 'target_hit');
                    }, 350);
                    setTimeout(() => {
                        this.handleMissionSuccess(isHeadshot);
                    }, 1400);
                    return;
                } else if (ent.isHostage) {
                    // REHİNE VURULDU! BAŞARISIZ!
                    window.soundSystem.playVoice('hostage_hit');
                    this.handleMissionFail("Rehine vuruldu! Görev başarısız.");
                    return;
                } else {
                    // MASUM SİVİL VURULDU!
                    window.soundSystem.playVoice('hostage_hit');
                    this.handleMissionFail("Masum bir sivil vuruldu!");
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
            this.ui.showToast("Hedef silah sesini duydu ve kaçıyor!", "warning");
        } else {
            this.ui.showToast("Atış ıska geçti! Susturucu sayesinde henüz fark edilmedin.", "info");
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
        if (!reason.includes("Rehine") && !reason.includes("sivil")) {
            window.soundSystem.playVoice('failed');
        }
        this.ui.onMissionFailed(reason || "Hedef kaçtı veya görevi tamamlayamadın.");
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
            p.vy += 0.25; // Yerçekimi
            p.life -= effectiveDt * 1.5;
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
        const viewX = this.camera.x + this.swayOffset.x + this.recoilOffset.x;
        const viewY = this.camera.y + this.swayOffset.y + this.recoilOffset.y;

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

        // Parçacıklar (Kan, Toz, Kıvılcım)
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Düşman Sniper Lazeri
        if (this.activeMission && this.activeMission.enemySniper && this.state === 'PLAYING') {
            this.drawEnemySniperLaser(ctx);
        }

        ctx.restore();

        // 5. Katman: Hava Durumu (Yağmur)
        if (this.activeMission && this.activeMission.weather === 'rain') {
            this.drawRain(ctx);
        }

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
        // Hafif parallaks kayması
        const parallaxX = vx * 0.15;
        ctx.fillStyle = '#0f172a';

        // Silüet binaları
        for (let i = 0; i < 15; i++) {
            const bx = i * 90 - parallaxX;
            const bh = 220 + Math.sin(i * 1.8) * 80;
            ctx.fillRect(bx, 600 - bh, 80, bh);
        }
    }

    drawMidBuildings(ctx) {
        // Çevre Binaları (2.5D derinlik)
        // Sol Bina
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(100, 240, 220, 380);

        // Orta Geniş Plaza
        ctx.fillStyle = '#334155';
        ctx.fillRect(360, 180, 260, 440);

        // Çatı Korkulukları
        ctx.fillStyle = '#475569';
        ctx.fillRect(100, 235, 220, 6);
        ctx.fillRect(360, 175, 260, 6);

        // Sağ Yüksek Kule
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(660, 140, 240, 480);
        ctx.fillRect(660, 135, 240, 6);

        // Pencereler ve Aydınlatmalar
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 3; col++) {
                // Rastgele sarı/mavi ışıklar
                const isLit = (row + col) % 2 === 0;
                ctx.fillStyle = isLit ? 'rgba(253, 224, 71, 0.45)' : 'rgba(30, 41, 59, 0.9)';
                ctx.fillRect(390 + col * 75, 220 + row * 65, 45, 40);
            }
        }

        // Balkon (Bölüm 3 & 9 için)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(400, 310, 180, 8);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.fillRect(400, 280, 180, 30);

        // Sokak Zemini
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 520, 1100, 180);
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

        // 1. Zemin Gölgesi (Ambient Occlusion Shadow)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const legCycle = Math.sin(t.animFrame);
        const walkOffset = legCycle * 7;
        const pantsColor = t.clothes.pants || '#1a202c';
        const shoeColor = '#0f172a';
        const skinColor = '#f6ad55';

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
        ctx.fillStyle = t.clothes.jacket || '#2d3748';
        ctx.beginPath();
        ctx.ellipse(-9, -24 + walkOffset * 0.4, 4, 10, -walkOffset * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Arka El
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-9, -13 + walkOffset * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();

        // 4. İnsan Gövdesi (Geniş omuzlar, bele doğru daralan takım elbise/mont)
        ctx.fillStyle = t.clothes.jacket || '#2d3748';
        ctx.beginPath();
        ctx.moveTo(-9, -36); // Sol omuz
        ctx.lineTo(9, -36);  // Sağ omuz
        ctx.lineTo(7, -8);   // Sağ bel
        ctx.lineTo(-7, -8);  // Sol bel
        ctx.closePath();
        ctx.fill();

        // Ceket Yakası & Gömlek V-kesimi
        ctx.fillStyle = '#f8fafc'; // Beyaz gömlek
        ctx.beginPath();
        ctx.moveTo(-3, -36);
        ctx.lineTo(3, -36);
        ctx.lineTo(0, -26);
        ctx.closePath();
        ctx.fill();

        // Kravat
        if (t.clothes.tie) {
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

        // 5. Boyun
        ctx.fillStyle = skinColor;
        ctx.fillRect(-2.5, -39, 5, 4);

        // 6. Kafa ve Çene
        ctx.beginPath();
        ctx.ellipse(0, -45, 6.5, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Saç / Saç Stili (Şapka yoksa)
        if (!t.clothes.hat || t.clothes.hat === 'none' || t.clothes.hat === 'sunglasses') {
            ctx.fillStyle = '#1c1917'; // Koyu kahve/siyah saç
            ctx.beginPath();
            ctx.arc(0, -48, 7, Math.PI, 0);
            ctx.fill();
            // Yan favori
            ctx.fillRect(4, -48, 2.5, 5);
        }

        // Güneş Gözlüğü
        if (t.clothes.hat === 'sunglasses' || t.clothes.accessories === 'glasses') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-1, -47, 8, 3.5);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(1, -46.5, 2, 1); // Cam parlaması
        } else {
            // Normal göz profili
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(2, -46, 2, 1.5);
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

            // "HEDEF" Etiketi
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'center';
            ctx.fillText('ŞÜPHELİ', 0, -82 - pulse * 6);
            ctx.restore();
        }

        ctx.restore();
    }

    // GENEL BAKIŞ MODU ARAYÜZÜ (Geniş Şehir Taraması)
    drawOverviewOverlay(ctx) {
        const w = this.width;
        const h = this.height;

        ctx.save();

        // 1. Dört Köşe Taktik Kamera Çerçevesi [  ]
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        const cornerSize = 40;
        const pad = 30;

        // Sol Üst
        ctx.beginPath();
        ctx.moveTo(pad, pad + cornerSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + cornerSize, pad);
        ctx.stroke();
        // Sağ Üst
        ctx.beginPath();
        ctx.moveTo(w - pad - cornerSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + cornerSize);
        ctx.stroke();
        // Sol Alt
        ctx.beginPath();
        ctx.moveTo(pad, h - pad - cornerSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + cornerSize, h - pad);
        ctx.stroke();
        // Sağ Alt
        ctx.beginPath();
        ctx.moveTo(w - pad - cornerSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - cornerSize);
        ctx.stroke();

        // 2. Merkez Hafif Nişangah Kutusu (Görüşü engellemez)
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

        // 3. Üst Bilgi Rozeti
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - 190, 26, 380, 34, 18);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('👁️ GENEL BAKIŞ MODU — ŞEHRİ TARA VE HEDEFİ BUL', cx, 42);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Nişan almak için [SAĞ TIK] yap veya [NİŞAN AL] butonuna bas', cx, 54);

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
