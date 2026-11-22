// Yakışıklı, Karizmatik ve Şık Giyimli Keskin Nişancımız (Ajan Kartal)
// Saf SVG Vektör Motoru: 0 KB harici indirme, ultra keskin Retina & 4K desteği

const SNIPER_HERO_AVATAR_SVG = `
<svg viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <!-- Arka Plan Taktik Işıltı -->
        <radialGradient id="heroGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#090d16" stop-opacity="1"/>
        </radialGradient>

        <!-- Ten Rengi Gradyanı (Gölgeli ve gerçekçi yüz hatları) -->
        <linearGradient id="skinGrad" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stop-color="#fbd38d"/>
            <stop offset="50%" stop-color="#f6ad55"/>
            <stop offset="100%" stop-color="#dd6b20"/>
        </linearGradient>

        <!-- Şık Kömür Grisi Takım Elbise -->
        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="60%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
        </linearGradient>

        <!-- Parlak Siyah Karizmatik Saç -->
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="40%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>

        <!-- Titanyum Telsiz Kulaklığı -->
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="50%" stop-color="#e2e8f0"/>
            <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
    </defs>

    <!-- 1. Karizmatik Dairesel/Oval Çerçeve -->
    <rect width="200" height="240" rx="16" fill="url(#heroGlow)" stroke="#38bdf8" stroke-width="2"/>

    <!-- 2. Geniş Omuzlar & Şık Takım Elbise Ceketi -->
    <path d="M 25 240 L 40 165 L 75 160 L 100 185 L 125 160 L 160 165 L 175 240 Z" fill="url(#suitGrad)"/>
    <path d="M 30 240 L 45 170 L 70 165 L 78 240 Z" fill="#0f172a" opacity="0.6"/>
    <path d="M 170 240 L 155 170 L 130 165 L 122 240 Z" fill="#0f172a" opacity="0.6"/>

    <!-- Ceket Yakaları (Geniş İtalyan Kesim) -->
    <polygon points="40,165 72,160 88,215 55,210" fill="#334155"/>
    <polygon points="160,165 128,160 112,215 145,210" fill="#334155"/>

    <!-- Beyaz İpek Gömlek & V Yaka -->
    <polygon points="75,160 125,160 100,215" fill="#f8fafc"/>
    <polygon points="88,160 100,205 112,160" fill="#e2e8f0"/>

    <!-- İnce Siyah İpek Kravat -->
    <polygon points="96,168 104,168 106,230 100,238 94,230" fill="#090d16"/>
    <polygon points="98,168 102,168 103,178 97,178" fill="#1e293b"/> <!-- Kravat düğümü -->

    <!-- Boyun ve Adem Elması (Güçlü maskülen hatlar) -->
    <polygon points="86,115 114,115 118,165 82,165" fill="url(#skinGrad)"/>
    <path d="M 96 138 L 100 144 L 104 138 Z" fill="#c05621" opacity="0.4"/> <!-- Boyun gölgesi -->

    <!-- 3. Keskin Çene ve Yüz Hatları -->
    <path d="M 72 82 Q 72 130 100 138 Q 128 130 128 82 Q 128 50 100 50 Q 72 50 72 82 Z" fill="url(#skinGrad)"/>

    <!-- Çene ve Elmacık Kemiği Vurguları -->
    <path d="M 82 120 Q 100 134 118 120" stroke="#dd6b20" stroke-width="1.5" fill="none" opacity="0.4"/>

    <!-- Bakımlı Kirli Sakal / Gölge Efekti -->
    <path d="M 76 96 C 76 128 86 136 100 136 C 114 136 124 128 124 96 C 122 108 114 128 100 128 C 86 128 78 108 76 96 Z" fill="#2d3748" opacity="0.18"/>

    <!-- 4. Karizmatik Gözler & Kaşlar -->
    <!-- Sol Kaş (Kararlı, odaklanmış hafif çatık) -->
    <path d="M 76 74 Q 86 70 95 73" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
    <!-- Sağ Kaş -->
    <path d="M 124 74 Q 114 70 105 73" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Sol Göz (Badem şeklinde keskin bakış) -->
    <ellipse cx="86" cy="80" rx="6" ry="3.5" fill="#f8fafc"/>
    <circle cx="87" cy="80" r="2.8" fill="#1e3a8a"/> <!-- Koyu Mavi İris -->
    <circle cx="87.5" cy="79.5" r="1" fill="#f8fafc"/> <!-- Göz Işıltısı -->

    <!-- Sağ Göz -->
    <ellipse cx="114" cy="80" rx="6" ry="3.5" fill="#f8fafc"/>
    <circle cx="113" cy="80" r="2.8" fill="#1e3a8a"/>
    <circle cx="113.5" cy="79.5" r="1" fill="#f8fafc"/>

    <!-- Düzgün Burun Hatları -->
    <path d="M 100 75 L 98 96 L 104 96" stroke="#c05621" stroke-width="1.5" stroke-linecap="round" fill="none"/>

    <!-- Karizmatik Dudaklar (Hafif tebessüm) -->
    <path d="M 92 110 Q 100 113 108 110" stroke="#9c4221" stroke-width="2" stroke-linecap="round" fill="none"/>

    <!-- 5. Modern Şık Saç Modeli (Fade yanlar, hacimli taranmış üstler) -->
    <path d="M 69 76 C 68 52 76 34 100 32 C 124 34 132 52 131 76 C 126 58 118 42 100 42 C 82 42 74 58 69 76 Z" fill="url(#hairGrad)"/>
    <path d="M 72 65 Q 100 38 126 54 Q 110 32 94 36 Z" fill="#475569" opacity="0.5"/> <!-- Saç Işıltısı -->

    <!-- 6. Taktik Telsiz Kulaklığı & Mavi LED -->
    <rect x="67" y="85" width="4" height="12" rx="2" fill="url(#metalGrad)"/>
    <!-- Mikrofon teli çeneye doğru -->
    <path d="M 68 96 Q 72 116 85 118" stroke="#64748b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="86" cy="118" r="2.5" fill="#0284c7"/>
    <!-- Mavi Çalışma Işığı (Aktif Telsiz) -->
    <circle cx="69" cy="88" r="1.8" fill="#38bdf8"/>
    <circle cx="69" cy="88" r="3.5" stroke="#38bdf8" stroke-width="0.8" opacity="0.6" fill="none"/>

    <!-- Rütbe / İsim Rozeti -->
    <rect x="24" y="206" width="152" height="24" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" stroke-width="1"/>
    <text x="100" y="222" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5">KOD ADI: KARTAL 1</text>
</svg>
`;

window.SNIPER_HERO_AVATAR_SVG = SNIPER_HERO_AVATAR_SVG;
