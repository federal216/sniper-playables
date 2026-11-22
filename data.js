// 20 Görev ve Cephane / Silah Sistemi Veritabanı

const MISSIONS_DATA = [
    {
        id: 1,
        title: "Bölüm 1: Çatıdaki Gözcü",
        briefing: "İstihbarat: Hedef karşı binanın çatısında telefonla konuşuyor. Masum siviller yok. Temiz bir atış yap ve görevi tamamla.",
        clue: "Hedef: Çatıda tek başına duran gri ceketli adam.",
        reward: 200,
        distance: 180, // metre
        wind: 0,
        timeLimit: 45,
        target: {
            x: 620,
            y: 310,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'none', jacket: '#4a5568', pants: '#1a202c', accessory: 'phone' },
            label: 'Hedef'
        },
        civilians: []
    },
    {
        id: 2,
        title: "Bölüm 2: Çantalı Kurye",
        briefing: "İstihbarat: Çalıntı gizli verileri taşıyan kurye sokakta yürüyor. Elinde siyah evrak çantası var.",
        clue: "Hedef: Yavaşça sağa doğru yürüyen, elinde siyah çanta olan adam.",
        reward: 350,
        distance: 220,
        wind: 1.5,
        timeLimit: 40,
        target: {
            x: 350,
            y: 490,
            speed: 0.6,
            minX: 200,
            maxX: 780,
            type: 'walking',
            clothes: { hat: 'none', jacket: '#2d3748', pants: '#4a5568', accessory: 'briefcase' },
            label: 'Kurye'
        },
        civilians: [
            { x: 180, y: 490, speed: -0.4, clothes: { hat: 'cap_blue', jacket: '#e2e8f0', pants: '#2b6cb0' } },
            { x: 550, y: 490, speed: 0.5, clothes: { hat: 'none', jacket: '#dd6b20', pants: '#1a202c' } }
        ]
    },
    {
        id: 3,
        title: "Bölüm 3: Balkondaki Elebaşı",
        briefing: "İstihbarat: Çete lideri lüks otelin teras balkonunda kadeh kaldırıyor. Hedefi teşhis et ve indir.",
        clue: "Hedef: 2. kat balkonunda puro içen kırmızı gömlekli adam.",
        reward: 500,
        distance: 260,
        wind: -2.0,
        timeLimit: 35,
        target: {
            x: 480,
            y: 280,
            speed: 0,
            type: 'balcony',
            clothes: { hat: 'none', jacket: '#c53030', pants: '#1a202c', accessory: 'cigar' },
            label: 'Elebaşı'
        },
        civilians: [
            { x: 420, y: 280, speed: 0, clothes: { hat: 'none', jacket: '#cbd5e0', pants: '#4a5568' } } // Garson
        ]
    },
    {
        id: 4,
        title: "Bölüm 4: Kırmızı Şapkalı Muhbir",
        briefing: "İstihbarat: Düşman casusu kalabalık meydanda bekliyor. Dikkat: Yanında masum siviller var, yanlış kişiyi vurma!",
        clue: "Hedef: Kırmızı bere/şapka takan ve etrafı gözetleyen adam.",
        reward: 700,
        distance: 310,
        wind: 3.0,
        timeLimit: 30,
        target: {
            x: 520,
            y: 500,
            speed: 0.2,
            minX: 450,
            maxX: 590,
            type: 'walking',
            clothes: { hat: 'cap_red', jacket: '#1a202c', pants: '#718096', accessory: 'none' },
            label: 'Casus'
        },
        civilians: [
            { x: 380, y: 500, speed: 0.4, clothes: { hat: 'cap_blue', jacket: '#4a5568', pants: '#1a202c' } },
            { x: 640, y: 500, speed: -0.3, clothes: { hat: 'none', jacket: '#319795', pants: '#2d3748' } },
            { x: 280, y: 500, speed: 0.3, clothes: { hat: 'none', jacket: '#805ad5', pants: '#e2e8f0' } }
        ]
    },
    {
        id: 5,
        title: "Bölüm 5: Penceredeki Hacker",
        briefing: "İstihbarat: Devlet veritabanını hackleyen yazılımcı ofis binasında çalışıyor. Işık yanan pencereyi bul.",
        clue: "Hedef: Karşı plazanın 3. katındaki yeşil ışıklı pencerede oturan gözlüklü şahıs.",
        reward: 900,
        distance: 350,
        wind: -1.5,
        timeLimit: 35,
        target: {
            x: 580,
            y: 210,
            speed: 0,
            type: 'window',
            clothes: { hat: 'glasses', jacket: '#3182ce', pants: '#1a202c', accessory: 'laptop' },
            label: 'Hacker'
        },
        civilians: [
            { x: 320, y: 210, speed: 0, clothes: { hat: 'none', jacket: '#e2e8f0', pants: '#4a5568' } }
        ]
    },
    {
        id: 6,
        title: "Bölüm 6: Köprüdeki Gizli Buluşma",
        briefing: "İstihbarat: İki şüpheli köprüde buluşuyor. İstihbarat alan ajanımıza göre hedef teslimatı yapacak olan kahverengi montlu satıcı.",
        clue: "Hedef: Köprü korkuluğu yanında kahverengi montlu, elinde paket olan adam.",
        reward: 1100,
        distance: 380,
        wind: 4.2,
        timeLimit: 30,
        target: {
            x: 440,
            y: 430,
            speed: 0,
            type: 'bridge',
            clothes: { hat: 'none', jacket: '#975a16', pants: '#1a202c', accessory: 'box' },
            label: 'Satıcı'
        },
        civilians: [
            { x: 490, y: 430, speed: 0, clothes: { hat: 'cap_black', jacket: '#1a202c', pants: '#4a5568' } }
        ]
    },
    {
        id: 7,
        title: "Bölüm 7: İki Korumalı Silah Baronu",
        briefing: "İstihbarat: Baron iki silahlı korumasıyla avluda yürüyor. Korumalar fark ederse kaçar! Doğrudan ortadaki Baron'u vur.",
        clue: "Hedef: Korumaların ortasında yürüyen beyaz takım elbiseli Baron.",
        reward: 1350,
        distance: 400,
        wind: -3.5,
        timeLimit: 25,
        target: {
            x: 460,
            y: 500,
            speed: 0.5,
            minX: 250,
            maxX: 700,
            type: 'walking',
            clothes: { hat: 'none', jacket: '#f7fafc', pants: '#edf2f7', accessory: 'cane' },
            label: 'Baron'
        },
        civilians: [
            { x: 410, y: 500, speed: 0.5, clothes: { hat: 'glasses', jacket: '#1a202c', pants: '#1a202c' } }, // Sol Koruma
            { x: 510, y: 500, speed: 0.5, clothes: { hat: 'glasses', jacket: '#1a202c', pants: '#1a202c' } }  // Sağ Koruma
        ]
    },
    {
        id: 8,
        title: "Bölüm 8: Yağmurlu Gece Suikastı",
        briefing: "İstihbarat: Sağanak yağmur görüşü zorlaştırıyor. Hedef sokak lambasının altında şemsiyesiyle bekleyen hedef.",
        clue: "Hedef: Sokak lambasının sarı ışığı altında sarı şemsiye tutan şüpheli.",
        reward: 1600,
        distance: 420,
        wind: 5.5,
        weather: 'rain',
        timeLimit: 30,
        target: {
            x: 510,
            y: 490,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'umbrella_yellow', jacket: '#2d3748', pants: '#1a202c', accessory: 'umbrella' },
            label: 'Ajan'
        },
        civilians: [
            { x: 260, y: 490, speed: 0.8, clothes: { hat: 'umbrella_black', jacket: '#4a5568', pants: '#2d3748' } }
        ]
    },
    {
        id: 9,
        title: "Bölüm 9: VIP Penthouse Partisi",
        briefing: "İstihbarat: Hedef gökdelenin en üst katındaki özel partide korumasız bir an yakalamaya çalışıyor.",
        clue: "Hedef: Çatı katında mor ceket giyen ve puro içen organize suç lideri.",
        reward: 1900,
        distance: 450,
        wind: -2.8,
        timeLimit: 25,
        target: {
            x: 640,
            y: 190,
            speed: 0.3,
            minX: 550,
            maxX: 720,
            type: 'walking',
            clothes: { hat: 'none', jacket: '#6b46c1', pants: '#1a202c', accessory: 'cigar' },
            label: 'Suç Lideri'
        },
        civilians: [
            { x: 570, y: 190, speed: 0, clothes: { hat: 'none', jacket: '#e2e8f0', pants: '#4a5568' } },
            { x: 700, y: 190, speed: 0, clothes: { hat: 'none', jacket: '#d69e2e', pants: '#1a202c' } }
        ]
    },
    {
        id: 10,
        title: "Bölüm 10: Rüzgarlı Tepe Gözcüsü",
        briefing: "İstihbarat: Çok şiddetli rüzgar esiyor (Göstergeye dikkat et!). Rüzgar mermini kaydıracak, hedefin hafif tersine nişan al.",
        clue: "Hedef: Çatıda dürbünle gözetleme yapan mavi kasklı keskin nişancı yardımcısı.",
        reward: 2200,
        distance: 520,
        wind: 7.8, // Güçlü rüzgar
        timeLimit: 30,
        target: {
            x: 430,
            y: 310,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'helmet_blue', jacket: '#2b6cb0', pants: '#1a202c', accessory: 'binoculars' },
            label: 'Gözcü'
        },
        civilians: []
    },
    {
        id: 11,
        title: "Bölüm 11: Rehine Krizi (Kritik Atış)",
        briefing: "İstihbarat: Terörist banka önünde bir rehineyi önünde kalkan olarak tutuyor. Çok hassas bir kafa vuruşu gerekiyor!",
        clue: "Hedef: Rehinenin arkasına saklanan maskeli terörist. REHİNEYİ VURMA!",
        reward: 2600,
        distance: 350,
        wind: 1.0,
        timeLimit: 20,
        target: {
            x: 505,
            y: 490,
            speed: 0,
            type: 'hostage_taker',
            clothes: { hat: 'ski_mask', jacket: '#c53030', pants: '#1a202c', accessory: 'gun' },
            label: 'Terörist'
        },
        civilians: [
            { x: 495, y: 490, speed: 0, clothes: { hat: 'none', jacket: '#faf089', pants: '#4a5568' }, isHostage: true }
        ]
    },
    {
        id: 12,
        title: "Bölüm 12: Metro Meydanı Kaçışı",
        briefing: "İstihbarat: Hedef polisten kaçmak için metro çıkışında hızlı adımlarla ilerliyor. Tren gelmeden indir.",
        clue: "Hedef: Siperlikli şapkalı, koyu yeşil kapüşonlu mont giyen ve hızlı yürüyen firari.",
        reward: 3000,
        distance: 380,
        wind: -4.0,
        timeLimit: 22,
        target: {
            x: 200,
            y: 500,
            speed: 1.2, // Hızlı
            minX: 150,
            maxX: 850,
            type: 'walking',
            clothes: { hat: 'hoodie_green', jacket: '#276749', pants: '#1a202c', accessory: 'none' },
            label: 'Firari'
        },
        civilians: [
            { x: 350, y: 500, speed: -0.4, clothes: { hat: 'none', jacket: '#4a5568', pants: '#718096' } },
            { x: 600, y: 500, speed: 0.5, clothes: { hat: 'cap_black', jacket: '#9b2c2c', pants: '#1a202c' } },
            { x: 750, y: 500, speed: -0.6, clothes: { hat: 'none', jacket: '#d69e2e', pants: '#2b6cb0' } }
        ]
    },
    {
        id: 13,
        title: "Bölüm 13: Liman Konteyner Bölgesi",
        briefing: "İstihbarat: Kaçakçı konteynerların arkasında saklanıyor. Birkaç saniyede bir kafasını çıkarıp etrafı kontrol ediyor.",
        clue: "Hedef: Kırmızı konteynerin kenarından kafasını çıkaran turuncu yelekli kaçakçı.",
        reward: 3500,
        distance: 460,
        wind: 3.2,
        timeLimit: 30,
        target: {
            x: 620,
            y: 440,
            speed: 0,
            peekInterval: 2500,
            type: 'peeker',
            clothes: { hat: 'cap_black', jacket: '#dd6b20', pants: '#1a202c', accessory: 'radio' },
            label: 'Kaçakçı'
        },
        civilians: [
            { x: 300, y: 440, speed: 0.3, clothes: { hat: 'hard_hat', jacket: '#319795', pants: '#2d3748' } }
        ]
    },
    {
        id: 14,
        title: "Bölüm 14: Restoran Terası Suikastı",
        briefing: "İstihbarat: Hedef açık hava restoranında öğle yemeği yiyor. Elindeki şarap kadehini masaya bıraktığında ateş serbest.",
        clue: "Hedef: Masada oturan siyah güneş gözlüklü, çizgili gömlekli mafya finansörü.",
        reward: 4100,
        distance: 410,
        wind: -3.0,
        timeLimit: 25,
        target: {
            x: 450,
            y: 350,
            speed: 0,
            type: 'dining',
            clothes: { hat: 'sunglasses', jacket: '#2b6cb0', pants: '#1a202c', accessory: 'wine' },
            label: 'Finansör'
        },
        civilians: [
            { x: 500, y: 350, speed: 0, clothes: { hat: 'none', jacket: '#e2e8f0', pants: '#4a5568' } } // Partneri
        ]
    },
    {
        id: 15,
        title: "Bölüm 15: İnşaat İskelesi Sabotajcısı",
        briefing: "İstihbarat: Sabotajcı yüksek inşaat iskelesine bomba yerleştiriyor. İskeleden aşağı düşürmeden imha et.",
        clue: "Hedef: 4. kat iskelede sarı baretli, elinde fünye çantası olan şahıs.",
        reward: 4800,
        distance: 510,
        wind: 6.0,
        timeLimit: 22,
        target: {
            x: 370,
            y: 220,
            speed: 0.4,
            minX: 300,
            maxX: 480,
            type: 'scaffolding',
            clothes: { hat: 'hardhat_yellow', jacket: '#c53030', pants: '#1a202c', accessory: 'detonator' },
            label: 'Sabotajcı'
        },
        civilians: []
    },
    {
        id: 16,
        title: "Bölüm 16: Gece Kulübü Çatısı",
        briefing: "İstihbarat: Neon ışıklarının altında uyuşturucu baronu anlaşma yapıyor. Ortam loş ve rüzgarlı.",
        clue: "Hedef: Altın zincirli, beyaz deri ceketli, dans pisti kenarındaki hedef.",
        reward: 5500,
        distance: 480,
        wind: -5.2,
        weather: 'neon_night',
        timeLimit: 25,
        target: {
            x: 540,
            y: 300,
            speed: 0.3,
            minX: 470,
            maxX: 610,
            type: 'walking',
            clothes: { hat: 'chain', jacket: '#edf2f7', pants: '#1a202c', accessory: 'gold' },
            label: 'Baron'
        },
        civilians: [
            { x: 420, y: 300, speed: 0.2, clothes: { hat: 'none', jacket: '#d53f8c', pants: '#2b6cb0' } },
            { x: 660, y: 300, speed: -0.3, clothes: { hat: 'none', jacket: '#319795', pants: '#1a202c' } }
        ]
    },
    {
        id: 17,
        title: "Bölüm 17: Silah Tüccarı ve Alıcı",
        briefing: "İstihbarat: İki kişi çatı katında çanta değiş tokuşu yapıyor. Dikkat: Satıcı parayı alıp kaçacak olan siyah pardösülü kişi.",
        clue: "Hedef: Siyah uzun pardösü giyen, çantayı teslim eden adam.",
        reward: 6300,
        distance: 550,
        wind: 4.8,
        timeLimit: 20,
        target: {
            x: 480,
            y: 290,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'fedora_black', jacket: '#1a202c', pants: '#1a202c', accessory: 'case' },
            label: 'Tüccar'
        },
        civilians: [
            { x: 530, y: 290, speed: 0, clothes: { hat: 'none', jacket: '#4a5568', pants: '#718096' } }
        ]
    },
    {
        id: 18,
        title: "Bölüm 18: Zırhlı Araç Konvoyu",
        briefing: "İstihbarat: Hedef yavaşlayan siyah limuzinin camını açıp dışarıyı gözetliyor. Araç hızlanmadan önce tek atış hakkın var!",
        clue: "Hedef: Limuzinin arka penceresinden başını çıkaran kırmızı kravatlı diplomat.",
        reward: 7200,
        distance: 430,
        wind: -2.5,
        timeLimit: 18,
        target: {
            x: 250,
            y: 510,
            speed: 0.9,
            minX: 200,
            maxX: 800,
            type: 'limo_target',
            clothes: { hat: 'none', jacket: '#1a202c', tie: '#e53e3e', pants: '#1a202c', accessory: 'tie' },
            label: 'Hain Diplomat'
        },
        civilians: []
    },
    {
        id: 19,
        title: "Bölüm 19: Keskin Nişancı Düellosu (Ölümcül)",
        briefing: "UYARI: Düşman sniper karşı kulede seni arıyor! Kırmızı lazer ışığını görür görmez tetiği çek, yoksa seni o vurur!",
        clue: "Hedef: Karşı saatin kulesindeki kırmızı lazeri yönlendiren kamuflajlı keskin nişancı.",
        reward: 8500,
        distance: 650,
        wind: 8.5,
        timeLimit: 15,
        enemySniper: true,
        target: {
            x: 515,
            y: 160,
            speed: 0,
            type: 'enemy_sniper',
            clothes: { hat: 'ghillie_hood', jacket: '#22543d', pants: '#1c4532', accessory: 'rifle' },
            label: 'Düşman Sniper'
        },
        civilians: []
    },
    {
        id: 20,
        title: "Bölüm 20: FİNAL — Helikopter Kaçışı",
        briefing: "FİNAL GÖREVİ: Kartel Lideri çatı helikopter pistine doğru koşuyor. Helikopter kalkarsa sonsuza kadar kaçar. Adını tarihe yaz!",
        clue: "Hedef: Helikoptere doğru koşan beyaz takımlı, elinde altın çanta olan Kartel Lideri.",
        reward: 15000,
        distance: 720,
        wind: 6.2,
        timeLimit: 16,
        target: {
            x: 180,
            y: 280,
            speed: 1.4, // Çok hızlı koşuyor
            minX: 150,
            maxX: 820,
            type: 'running_boss',
            clothes: { hat: 'sunglasses', jacket: '#ffffff', pants: '#ffffff', accessory: 'gold_briefcase' },
            label: 'Kartel Lideri'
        },
        civilians: [
            { x: 780, y: 280, speed: 0, isHelicopter: true }
        ]
    }
];

// Silahlar ve Geliştirmeler
const WEAPONS_DATA = [
    {
        id: 'scout_sr21',
        name: 'Scout SR-21',
        type: 'Hafif Taktik',
        price: 0, // Başlangıç silahı
        owned: true,
        damage: 100,
        baseStability: 0.65, // Sallantı miktarı
        breathTime: 3.5, // Saniye nefes tutma
        zoomLevels: [2, 4],
        currentZoomIdx: 0,
        silenced: false,
        imageIcon: '🎯',
        description: 'Standart hafif keskin nişancı tüfeği. Hızlı ama rüzgarda sallanır.'
    },
    {
        id: 'awm_tactical',
        name: 'AWM .338 Lapua',
        type: 'Profesyonel Keskin Nişancı',
        price: 2500,
        owned: false,
        damage: 250,
        baseStability: 0.85,
        breathTime: 5.0,
        zoomLevels: [3, 6, 9],
        currentZoomIdx: 0,
        silenced: false,
        imageIcon: '⚡',
        description: 'Efsanevi AWM. Ağır gövdesi sayesinde sallantıyı büyük oranda emer.'
    },
    {
        id: 'barrett_m82',
        name: 'Barrett M82 .50 Cal',
        type: 'Ağır Anti-Materyal',
        price: 6500,
        owned: false,
        damage: 500,
        baseStability: 0.92,
        breathTime: 6.5,
        zoomLevels: [4, 8, 14],
        currentZoomIdx: 0,
        silenced: false,
        imageIcon: '💥',
        description: 'Zırh delen devasa 50 kalibre mermi. Rüzgardan ve mesafeden neredeyse hiç etkilenmez.'
    },
    {
        id: 'ghost_reaper_x',
        name: 'Ghost Reaper X',
        type: 'Prototip Hayalet',
        price: 14000,
        owned: false,
        damage: 800,
        baseStability: 0.98,
        breathTime: 9.0,
        zoomLevels: [4, 8, 16],
        currentZoomIdx: 0,
        silenced: true,
        imageIcon: '👻',
        description: 'Entegre susturuculu nano-karbon suikast tüfeği. Sıfır tepme, mutlak sessizlik.'
    }
];

// Geliştirme Yükseltmeleri (Her silah için alınabilen modifikasyonlar)
const UPGRADES_DATA = [
    {
        id: 'stabilizer',
        name: 'Hidrolik Kundak (Sallantı Azaltıcı)',
        level: 1,
        maxLevel: 4,
        costMultiplier: 600,
        effect: '+%15 Sallantı Dengeleme'
    },
    {
        id: 'breath_extender',
        name: 'Oksijen Regülatörü (Nefes Tutma)',
        level: 1,
        maxLevel: 4,
        costMultiplier: 800,
        effect: '+1.5 Saniye Odaklanma'
    },
    {
        id: 'suppressor',
        name: 'Taktik Susturucu',
        level: 0,
        maxLevel: 1,
        costMultiplier: 2000,
        effect: 'Iskaladığında panik yapmaz + %25 Ekstra Ödül'
    }
];
