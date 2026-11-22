// Web Audio API Tabanlı Prosedürel Ses Motoru (Harici MP3 gerektirmez, anında yüklenir)
class SoundSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.heartbeatOsc = null;
        this.heartbeatTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Gerçekçi Keskin Nişancı Ateş Sesi (Patlama + Rezonans + Yankı)
    playGunshot(silenced = false) {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        if (silenced) {
            // Susturuculu atış sesi ("Pfff-thuk")
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < buffer.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
            }
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.Q.setValueAtTime(3, now);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            return;
        }

        // 1. Patlama Darbesi (Kick Transient)
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'triangle';
        kickOsc.frequency.setValueAtTime(160, now);
        kickOsc.frequency.exponentialRampToValueAtTime(25, now + 0.15);
        kickGain.gain.setValueAtTime(1.0, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.25);

        // 2. Namlu Gürültüsü (Blast Noise)
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
        }
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(4500, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(350, now + 0.6);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
    }

    // Hedef Vurulma Sesi (Thump / Headshot)
    playHitSound(isHeadshot = false) {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isHeadshot ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(isHeadshot ? 550 : 220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Gerçekçi Cam Kırılma Sesi (Pencere arkası hedef vurulduğunda)
    playGlassShatter() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 1. Cam çatlama ve kırılma gürültüsü
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
        }
        noise.buffer = buffer;

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(3000, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        noise.connect(highpass);
        highpass.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);

        // 2. Çınlayan cam parçacıkları
        [2100, 2800, 3500, 4400].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + idx * 0.03 + 0.15);

            g.gain.setValueAtTime(0.2, now + idx * 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.2);

            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.03);
            osc.stop(now + idx * 0.03 + 0.22);
        });
    }

    // Kurşun Sekme / Iskalama Sesi (Whiz / Ricochet)
    playRicochet() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
    }

    // Dürbün Zoom Sesi (Mekanik klik)
    playZoom() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.07);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Nefes Tutma Kalp Atışı (Slow-mo)
    startHeartbeat() {
        if (this.muted || this.heartbeatTimer) return;
        this.init();

        const beat = () => {
            const ctx = this.ctx;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(65, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
        };

        beat();
        this.heartbeatTimer = setInterval(beat, 650);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // Zafer & Para Kazanma Cıngılı
    playSuccess() {
        if (this.muted) return;
        this.init();
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                const ctx = this.ctx;
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            }, idx * 100);
        });
    }

    // Başarısızlık / Alarm Sesi
    playFail() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.45);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Prosedürel Rüzgar Uğultusu ve Değişim Esintisi (Wind Gust Transition)
    playWindGust() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.9, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(i / (ctx.sampleRate * 0.9) * Math.PI);
        }
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.linearRampToValueAtTime(750, now + 0.45);
        filter.frequency.linearRampToValueAtTime(200, now + 0.9);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.4);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.9);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
    }

    // Ses Aç / Kapa (Mute / Unmute)
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopHeartbeat();
        }
        return this.muted;
    }

    // Taktik Telsiz Seslendirmeleri (Edge-TTS tarafından üretildi)
    playVoice(name) {
        if (this.muted) return;
        try {
            const audio = new Audio(`audio/${name}.mp3`);
            audio.volume = 0.9;
            audio.play().catch(err => {
                // Tarayıcı otomatik oynatma kısıtlaması için sessiz log
                console.log("Ses oynatma bekleniyor:", err);
            });
        } catch (e) {
            console.warn("Telsiz ses hatası:", e);
        }
    }
}

window.soundSystem = new SoundSystem();
