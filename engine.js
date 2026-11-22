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
        this.scopeZoom = weapon.zoomLevels[weapon.currentZoomIdx || 0];
        this.targetZoom = this.scopeZoom;

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
        this.ui.onMissionStarted(this.activeMission, weapon);
        window.soundSystem.playVoice('start');
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
        // Zoom derecesine göre hassasiyeti ayarla
        const sensitivity = 0.55 / this.scopeZoom;
        this.targetCamera.x += dx * sensitivity;
        this.targetCamera.y += dy * sensitivity;

        // Sahne sınırları
        this.targetCamera.x = Math.max(100, Math.min(900, this.targetCamera.x));
        this.targetCamera.y = Math.max(120, Math.min(580, this.targetCamera.y));
    }

    // Dürbün Zoom Seviyesi Değiştirme
    cycleZoom() {
        if (this.state !== 'PLAYING') return;
        const weapon = this.getActiveWeapon();
        weapon.currentZoomIdx = ((weapon.currentZoomIdx || 0) + 1) % weapon.zoomLevels.length;
        this.targetZoom = weapon.zoomLevels[weapon.currentZoomIdx];
        window.soundSystem.playZoom();
        this.ui.updateHUDZoom(this.targetZoom);
    }

    // Nefes Tutma
    setBreath(holding) {
        if (this.state !== 'PLAYING') return;
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

        // 6. Katman: Keskin Nişancı Dürbünü (Scope Lens & Reticle)
        if (this.state === 'PLAYING' || this.state === 'BULLET_CAM') {
            this.drawScopeOverlay(ctx);
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

    drawCharacter(ctx, t) {
        if (!t.isAlive) {
            // Yere serilmiş ceset
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.fillStyle = '#1a202c';
            ctx.fillRect(-22, -6, 44, 10);
            ctx.beginPath();
            ctx.arc(22, -2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(t.x, t.y);

        // Yürüme sallantısı
        const legAngle = Math.sin(t.animFrame) * 0.45;

        // 1. Bacaklar
        ctx.strokeStyle = t.clothes.pants || '#1a202c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Sol bacak
        ctx.moveTo(0, -10);
        ctx.lineTo(-6 + Math.sin(legAngle) * 8, 12);
        // Sağ bacak
        ctx.moveTo(0, -10);
        ctx.lineTo(6 - Math.sin(legAngle) * 8, 12);
        ctx.stroke();

        // 2. Gövde / Ceket
        ctx.fillStyle = t.clothes.jacket || '#2d3748';
        ctx.fillRect(-7, -35, 14, 26);

        // Kravat
        if (t.clothes.tie) {
            ctx.fillStyle = t.clothes.tie;
            ctx.fillRect(-2, -32, 4, 16);
        }

        // 3. Kafa
        ctx.fillStyle = '#f6ad55'; // Ten rengi
        ctx.beginPath();
        ctx.arc(0, -42, 7, 0, Math.PI * 2);
        ctx.fill();

        // 4. Şapka / Maske / Aksesuar
        if (t.clothes.hat === 'cap_red') {
            ctx.fillStyle = '#e53e3e';
            ctx.beginPath();
            ctx.arc(0, -45, 8, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-2, -45, 12, 3); // Siperlik
        } else if (t.clothes.hat === 'cap_blue') {
            ctx.fillStyle = '#3182ce';
            ctx.beginPath();
            ctx.arc(0, -45, 8, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-2, -45, 12, 3);
        } else if (t.clothes.hat === 'hardhat_yellow') {
            ctx.fillStyle = '#ecc94b';
            ctx.fillRect(-9, -49, 18, 7);
        } else if (t.clothes.hat === 'ski_mask') {
            ctx.fillStyle = '#1a202c';
            ctx.beginPath();
            ctx.arc(0, -42, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f6ad55';
            ctx.fillRect(-4, -43, 8, 3); // Göz boşluğu
        }

        // Aksesuarlar (Çanta, Şemsiye, Puro)
        if (t.clothes.accessory === 'briefcase') {
            ctx.fillStyle = '#1a202c';
            ctx.fillRect(8, -22, 10, 8);
        } else if (t.clothes.accessory === 'cigar') {
            ctx.fillStyle = '#ecc94b';
            ctx.fillRect(4, -40, 6, 2);
            ctx.fillStyle = '#e53e3e';
            ctx.fillRect(10, -40, 2, 2);
        } else if (t.clothes.accessory === 'umbrella') {
            ctx.fillStyle = '#ecc94b';
            ctx.beginPath();
            ctx.arc(0, -56, 18, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -56);
            ctx.lineTo(0, -30);
            ctx.stroke();
        }

        // Panik İfadesi (!)
        if (t.panic) {
            ctx.fillStyle = '#e53e3e';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('!', -3, -56);
        }

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
