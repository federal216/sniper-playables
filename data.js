// 20 Tactical Missions and Arsenal Database (English Localization for YouTube Playables)

const MISSIONS_DATA = [
    {
        id: 1,
        title: "Mission 1: The Rooftop Lookout",
        briefing: "Intel: A syndicate scout is monitoring the street from the opposite rooftop. No civilian collateral in the vicinity. Eliminate the lookout with a clean shot.",
        clue: "Target: Lone man on the rooftop wearing a grey trench coat on his phone.",
        reward: 250,
        distance: 180,
        wind: 0,
        timeLimit: 45,
        target: {
            x: 620,
            y: 310,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'none', jacket: '#4a5568', pants: '#1a202c', accessory: 'phone' },
            label: 'Lookout'
        },
        civilians: []
    },
    {
        id: 2,
        title: "Mission 2: The Briefcase Courier",
        briefing: "Intel: A black-market courier carrying stolen biometric drives is walking through the plaza. Intercept him before he reaches his handler.",
        clue: "Target: Man slowly walking right, holding a brown leather briefcase.",
        reward: 400,
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
            label: 'Courier'
        },
        civilians: [
            { x: 180, y: 490, speed: -0.4, clothes: { hat: 'cap_blue', jacket: '#e2e8f0', pants: '#2b6cb0' } },
            { x: 550, y: 490, speed: 0.5, clothes: { hat: 'none', jacket: '#dd6b20', pants: '#1a202c' } }
        ]
    },
    {
        id: 3,
        title: "Mission 3: The Balcony Kingpin",
        briefing: "Intel: Cartel lieutenant is celebrating at a luxury hotel terrace. Do not hit the server.",
        clue: "Target: Man in a vibrant red shirt smoking a cigar on the 2nd-floor balcony.",
        reward: 600,
        distance: 260,
        wind: -2.0,
        timeLimit: 35,
        target: {
            x: 480,
            y: 308,
            speed: 0,
            type: 'balcony',
            clothes: { hat: 'none', jacket: '#c53030', pants: '#1a202c', accessory: 'cigar' },
            label: 'Kingpin'
        },
        civilians: [
            { x: 420, y: 308, speed: 0, type: 'balcony', clothes: { hat: 'none', jacket: '#cbd5e0', pants: '#4a5568', accessory: 'cocktail' } } // Waiter
        ]
    },
    {
        id: 4,
        title: "Mission 4: The Red Cap Informant",
        briefing: "Intel: A hostile informant is blending into the crowd. Caution: Multiple civilians nearby. Spot the exact target from your dossier.",
        clue: "Target: Suspect wearing a bright red baseball cap scouting the perimeter.",
        reward: 800,
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
            label: 'Informant'
        },
        civilians: [
            { x: 380, y: 500, speed: 0.4, clothes: { hat: 'cap_blue', jacket: '#4a5568', pants: '#1a202c' } },
            { x: 640, y: 500, speed: -0.3, clothes: { hat: 'none', jacket: '#319795', pants: '#2d3748' } },
            { x: 280, y: 500, speed: 0.3, clothes: { hat: 'none', jacket: '#805ad5', pants: '#e2e8f0' } }
        ]
    },
    {
        id: 5,
        title: "Mission 5: The Window Hacker",
        briefing: "Intel: A rogue hacker is breaching the central bank firewall from a downtown office tower. Locate the lit terminal window.",
        clue: "Target: 2nd-floor plaza window with blue terminal glow, hacker with glasses typing on a laptop.",
        reward: 1000,
        distance: 350,
        wind: -1.5,
        timeLimit: 35,
        target: {
            x: 505,
            y: 295,
            speed: 0,
            type: 'window',
            clothes: { hat: 'glasses', jacket: '#3182ce', pants: '#1a202c', accessory: 'laptop' },
            label: 'Hacker'
        },
        civilians: [
            { x: 440, y: 295, speed: 0, type: 'window', clothes: { hat: 'none', jacket: '#e2e8f0', pants: '#4a5568' } }
        ]
    },
    {
        id: 6,
        title: "Mission 6: The Bridge Rendezvous",
        briefing: "Intel: Two suspects are meeting by the bridge walkway. Target is the supplier wearing a brown jacket handing over the package.",
        clue: "Target: Brown winter coat next to the bridge railing holding a box.",
        reward: 1250,
        distance: 380,
        wind: 4.2,
        timeLimit: 30,
        target: {
            x: 440,
            y: 430,
            speed: 0,
            type: 'bridge',
            clothes: { hat: 'none', jacket: '#975a16', pants: '#1a202c', accessory: 'box' },
            label: 'Supplier'
        },
        civilians: [
            { x: 490, y: 430, speed: 0, clothes: { hat: 'cap_black', jacket: '#1a202c', pants: '#4a5568' } }
        ]
    },
    {
        id: 7,
        title: "Mission 7: The Guarded Arms Baron",
        briefing: "Intel: An arms dealer is flanked by two private security contractors. If the guards notice you, he will flee. Neutralize the Baron in the center.",
        clue: "Target: Man in the white designer suit walking between two armed bodyguards.",
        reward: 1500,
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
            label: 'Arms Baron'
        },
        civilians: [
            { x: 410, y: 500, speed: 0.5, clothes: { hat: 'glasses', jacket: '#1a202c', pants: '#1a202c' } }, // Guard Left
            { x: 510, y: 500, speed: 0.5, clothes: { hat: 'glasses', jacket: '#1a202c', pants: '#1a202c' } }  // Guard Right
        ]
    },
    {
        id: 8,
        title: "Mission 8: Rainy Night Hit",
        briefing: "Intel: Heavy downpour obscures visibility. Use your Thermal Scope if needed. Target is waiting under the streetlight.",
        clue: "Target: Person holding a yellow umbrella illuminated beneath the streetlamp.",
        reward: 1800,
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
            label: 'Shadow Agent'
        },
        civilians: [
            { x: 260, y: 490, speed: 0.8, clothes: { hat: 'umbrella_black', jacket: '#4a5568', pants: '#2d3748' } }
        ]
    },
    {
        id: 9,
        title: "Mission 9: VIP Penthouse Party",
        briefing: "Intel: High-profile crime boss is enjoying a private rooftop gala. Wait for him to step away from the crowd.",
        clue: "Target: Man in a sharp purple blazer holding a lit cigar on the top deck.",
        reward: 2200,
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
            label: 'Mob Boss'
        },
        civilians: [
            { x: 570, y: 190, speed: 0, clothes: { hat: 'none', jacket: '#e2e8f0', pants: '#4a5568' } },
            { x: 700, y: 190, speed: 0, clothes: { hat: 'none', jacket: '#d69e2e', pants: '#1a202c' } }
        ]
    },
    {
        id: 10,
        title: "Mission 10: High-Wind Ridge",
        briefing: "Intel: Severe gale-force crosswinds (Check HUD Wind Gauge!). Bullet trajectory will drift noticeably to the side. Compensate your aim.",
        clue: "Target: Sniper spotter on the communications tower wearing a blue tactical helmet.",
        reward: 2600,
        distance: 520,
        wind: 7.8,
        timeLimit: 30,
        target: {
            x: 430,
            y: 310,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'helmet_blue', jacket: '#2b6cb0', pants: '#1a202c', accessory: 'binoculars' },
            label: 'Spotter'
        },
        civilians: []
    },
    {
        id: 11,
        title: "Mission 11: Hostage Crisis (Precision Shot)",
        briefing: "CRITICAL: A masked terrorist is holding a hostage as a human shield outside the federal bank. A pinpoint headshot is mandatory!",
        clue: "Target: Masked militant behind the hostage. DO NOT INJURE THE HOSTAGE!",
        reward: 3100,
        distance: 350,
        wind: 1.0,
        timeLimit: 20,
        target: {
            x: 505,
            y: 490,
            speed: 0,
            type: 'hostage_taker',
            clothes: { hat: 'ski_mask', jacket: '#c53030', pants: '#1a202c', accessory: 'gun' },
            label: 'Terrorist'
        },
        civilians: [
            { x: 495, y: 490, speed: 0, clothes: { hat: 'none', jacket: '#faf089', pants: '#4a5568' }, isHostage: true }
        ]
    },
    {
        id: 12,
        title: "Mission 12: Metro Station Transit",
        briefing: "Intel: A high-value fugitive is rushing through the subway transit plaza. Drop him before he enters the train station.",
        clue: "Target: Fast-walking fugitive wearing a dark green hooded jacket and dark sunglasses.",
        reward: 3600,
        distance: 380,
        wind: -4.0,
        timeLimit: 22,
        target: {
            x: 200,
            y: 500,
            speed: 1.2,
            minX: 150,
            maxX: 850,
            type: 'walking',
            clothes: { hat: 'hoodie_green', jacket: '#276749', pants: '#1a202c', accessory: 'none' },
            label: 'Fugitive'
        },
        civilians: [
            { x: 350, y: 500, speed: -0.4, clothes: { hat: 'none', jacket: '#4a5568', pants: '#718096' } },
            { x: 600, y: 500, speed: 0.5, clothes: { hat: 'cap_black', jacket: '#9b2c2c', pants: '#1a202c' } },
            { x: 750, y: 500, speed: -0.6, clothes: { hat: 'none', jacket: '#d69e2e', pants: '#2b6cb0' } }
        ]
    },
    {
        id: 13,
        title: "Mission 13: Cargo Terminal Peeker",
        briefing: "Intel: Smuggler is hiding behind shipping crates. He peeks out every few seconds to check his radio. Time your shot.",
        clue: "Target: Orange high-vis jacket peeking out from the red cargo container.",
        reward: 4200,
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
            label: 'Smuggler'
        },
        civilians: [
            { x: 300, y: 440, speed: 0.3, clothes: { hat: 'hard_hat', jacket: '#319795', pants: '#2d3748' } }
        ]
    },
    {
        id: 14,
        title: "Mission 14: Skyline Terrace Dining",
        briefing: "Intel: Syndicate financier is having lunch at an open-air rooftop restaurant. When he puts down his wine glass, you are cleared to fire.",
        clue: "Target: Seated diner wearing sunglasses and a navy dress shirt holding a wine glass.",
        reward: 4900,
        distance: 410,
        wind: -3.0,
        timeLimit: 25,
        target: {
            x: 450,
            y: 308,
            speed: 0,
            type: 'balcony',
            clothes: { hat: 'sunglasses', jacket: '#2b6cb0', pants: '#1a202c', accessory: 'wine' },
            label: 'Financier'
        },
        civilians: [
            { x: 520, y: 308, speed: 0, type: 'balcony', clothes: { hat: 'none', jacket: '#e2e8f0', pants: '#4a5568', accessory: 'cocktail' } }
        ]
    },
    {
        id: 15,
        title: "Mission 15: The Scaffolding Saboteur",
        briefing: "Intel: A saboteur is wiring explosives to a skyscraper scaffold. Eliminate him before he arms the remote detonator.",
        clue: "Target: 4th-tier scaffold, yellow hardhat, red jacket, carrying detonator case.",
        reward: 5700,
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
            label: 'Saboteur'
        },
        civilians: []
    },
    {
        id: 16,
        title: "Mission 16: Neon Nightclub Rooftop",
        briefing: "Intel: Under the pulsating neon glow, a cartel boss is closing a major deal. Low ambient light and high crosswinds.",
        clue: "Target: White leather jacket with gold chain necklace standing by the VIP lounge.",
        reward: 6600,
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
            label: 'Nightclub Boss'
        },
        civilians: [
            { x: 420, y: 300, speed: 0.2, clothes: { hat: 'none', jacket: '#d53f8c', pants: '#2b6cb0' } },
            { x: 660, y: 300, speed: -0.3, clothes: { hat: 'none', jacket: '#319795', pants: '#1a202c' } }
        ]
    },
    {
        id: 17,
        title: "Mission 17: Black-Market Exchange",
        briefing: "Intel: Two men are exchanging a weapon cache on the upper roof. The target is the seller handing over the heavy case.",
        clue: "Target: Wearing a black fedora and charcoal trench coat passing the briefcase.",
        reward: 7700,
        distance: 550,
        wind: 4.8,
        timeLimit: 20,
        target: {
            x: 480,
            y: 290,
            speed: 0,
            type: 'standing',
            clothes: { hat: 'fedora_black', jacket: '#1a202c', pants: '#1a202c', accessory: 'case' },
            label: 'Arms Dealer'
        },
        civilians: [
            { x: 530, y: 290, speed: 0, clothes: { hat: 'none', jacket: '#4a5568', pants: '#718096' } }
        ]
    },
    {
        id: 18,
        title: "Mission 18: Armored Limousine Convoy",
        briefing: "Intel: A corrupt diplomat is peering through the open rear window of a moving armored limo. You have one clean shot.",
        clue: "Target: Peering through the open limo window, wearing a black suit and blood-red tie.",
        reward: 9000,
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
            label: 'Corrupt Diplomat'
        },
        civilians: []
    },
    {
        id: 19,
        title: "Mission 19: Sniper Duel (Lethal Threat)",
        briefing: "WARNING: An enemy sniper is scanning your position from the clock tower! Look for the red laser trace. Shoot before he locks on!",
        clue: "Target: Camouflaged enemy sniper aiming a red laser beam directly from the tower.",
        reward: 11000,
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
            label: 'Enemy Sniper'
        },
        civilians: []
    },
    {
        id: 20,
        title: "Mission 20: FINAL — The Helipad Escape",
        briefing: "GRAND FINALE: The Cartel Kingpin is sprinting across the helipad to his extraction chopper. Once airborne, he is gone forever. Cement your legacy!",
        clue: "Target: Sprinting towards the helicopter in an all-white tailored suit with a gold briefcase.",
        reward: 20000,
        distance: 720,
        wind: 6.2,
        timeLimit: 16,
        target: {
            x: 180,
            y: 280,
            speed: 1.4,
            minX: 150,
            maxX: 820,
            type: 'running_boss',
            clothes: { hat: 'sunglasses', jacket: '#ffffff', pants: '#ffffff', accessory: 'gold_briefcase' },
            label: 'Cartel Overlord'
        },
        civilians: [
            { x: 780, y: 280, speed: 0, isHelicopter: true }
        ]
    }
];

// Sniper Rifles & Arsenal (Upgrades & Specs)
const WEAPONS_DATA = [
    {
        id: 'scout_sr21',
        name: 'Scout SR-21',
        type: 'Light Tactical',
        price: 0,
        owned: true,
        damage: 100,
        baseStability: 0.65,
        breathTime: 3.5,
        zoomLevels: [2, 4],
        currentZoomIdx: 0,
        silenced: false,
        imageIcon: '🎯',
        description: 'Standard issue scout rifle. Fast target acquisition with light chassis.'
    },
    {
        id: 'awm_tactical',
        name: 'AWM .338 Lapua',
        type: 'Precision Sniper',
        price: 2500,
        owned: false,
        damage: 250,
        baseStability: 0.85,
        breathTime: 5.0,
        zoomLevels: [3, 6, 9],
        currentZoomIdx: 0,
        silenced: false,
        imageIcon: '⚡',
        description: 'Legendary Arctic Warfare Magnum. Heavy steel receiver absorbs wind sway.'
    },
    {
        id: 'barrett_m82',
        name: 'Barrett M82 .50 Cal',
        type: 'Anti-Materiel Heavy',
        price: 6500,
        owned: false,
        damage: 500,
        baseStability: 0.92,
        breathTime: 6.5,
        zoomLevels: [4, 8, 14],
        currentZoomIdx: 0,
        silenced: false,
        imageIcon: '💥',
        description: 'Devastating 50 BMG round. Armor-piercing velocity ignores crosswinds.'
    },
    {
        id: 'ghost_reaper_x',
        name: 'Ghost Reaper X',
        type: 'Prototype Spec-Ops',
        price: 14000,
        owned: false,
        damage: 800,
        baseStability: 0.98,
        breathTime: 9.0,
        zoomLevels: [4, 8, 16],
        currentZoomIdx: 0,
        silenced: true,
        imageIcon: '👻',
        description: 'Integrated suppressor with nano-carbon dampener. Zero muzzle flash, absolute stealth.'
    }
];

// Weapon Upgrades
const UPGRADES_DATA = [
    {
        id: 'stabilizer',
        name: 'Hydraulic Cheek Rest (Stability)',
        level: 1,
        maxLevel: 4,
        costMultiplier: 600,
        effect: '+15% Aim Stabilization'
    },
    {
        id: 'breath_extender',
        name: 'Oxygen Regulator (Focus Time)',
        level: 1,
        maxLevel: 4,
        costMultiplier: 800,
        effect: '+1.5s Steady Breath Duration'
    },
    {
        id: 'suppressor',
        name: 'Tactical Suppressor',
        level: 0,
        maxLevel: 1,
        costMultiplier: 2000,
        effect: 'Missed shots do not alert targets + 25% Cash Bonus'
    }
];
