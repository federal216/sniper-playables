# -*- coding: utf-8 -*-
"""
Script to update data.js with rich facial physiognomy and diverse clothing across all 20 missions.
"""

MISSIONS_JS = """// 20 Tactical Missions and Arsenal Database (English Localization for YouTube Playables)
// Enhanced with Unique Facial Physiognomy (Eyebrows, Eyes, Noses, Lips, Facial Hair) and Dynamic Clothing

const MISSIONS_DATA = [
    {
        id: 1,
        title: "Mission 1: The Rooftop Lookout",
        briefing: "Intel: A syndicate scout is monitoring the street from the opposite rooftop. No civilian collateral in the vicinity. Eliminate the lookout with a clean shot.",
        clue: "Target: Scout in a grey trench coat, short buzz cut, stubble beard on his phone.",
        reward: 250,
        distance: 180,
        wind: 0,
        timeLimit: 45,
        target: {
            x: 620,
            y: 310,
            speed: 0,
            type: 'standing',
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#1c1917',
                hairStyle: 'buzz_cut',
                eyeColor: '#5c3a21',
                facialHair: 'stubble',
                hat: 'none',
                jacket: '#4a5568',
                jacketStyle: 'trench',
                shirt: '#f8fafc',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'phone'
            },
            label: 'Lookout'
        },
        civilians: []
    },
    {
        id: 2,
        title: "Mission 2: The Briefcase Courier",
        briefing: "Intel: A black-market courier carrying stolen biometric drives is walking through the plaza. Intercept him before he reaches his handler.",
        clue: "Target: Fair-skinned courier in a charcoal suit, side-part brown hair, holding a brown briefcase.",
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
            clothes: {
                skinTone: '#fde68a',
                hairColor: '#451a03',
                hairStyle: 'side_part',
                eyeColor: '#0284c7',
                facialHair: 'clean',
                hat: 'none',
                jacket: '#2d3748',
                jacketStyle: 'suit',
                shirt: '#ffffff',
                tie: '#c53030',
                pants: '#4a5568',
                shoeColor: '#0f172a',
                accessory: 'briefcase'
            },
            label: 'Courier'
        },
        civilians: [
            { x: 180, y: 490, speed: -0.4, clothes: { skinTone: '#f6ad55', hairColor: '#1c1917', eyeColor: '#16a34a', facialHair: 'stubble', hat: 'cap_blue', jacket: '#e2e8f0', jacketStyle: 'hoodie', pants: '#2b6cb0' } },
            { x: 550, y: 490, speed: 0.5, clothes: { skinTone: '#b45309', hairColor: '#09090b', eyeColor: '#451a03', facialHair: 'mustache', hairStyle: 'curly', hat: 'none', jacket: '#dd6b20', jacketStyle: 'jacket', pants: '#1a202c' } }
        ]
    },
    {
        id: 3,
        title: "Mission 3: The Balcony Kingpin",
        briefing: "Intel: Cartel lieutenant is celebrating at a luxury hotel terrace. Do not hit the server.",
        clue: "Target: Tan cartel kingpin in a vibrant red silk shirt, goatee beard, smoking a cigar on the balcony.",
        reward: 600,
        distance: 260,
        wind: -2.0,
        timeLimit: 35,
        target: {
            x: 480,
            y: 308,
            speed: 0,
            type: 'balcony',
            clothes: {
                skinTone: '#e29547',
                hairColor: '#09090b',
                hairStyle: 'pompadour',
                eyeColor: '#15803d',
                facialHair: 'goatee',
                hat: 'none',
                jacket: '#c53030',
                jacketStyle: 'shirt',
                shirt: '#991b1b',
                pants: '#1a202c',
                shoeColor: '#78350f',
                accessory: 'cigar'
            },
            label: 'Kingpin'
        },
        civilians: [
            { x: 420, y: 308, speed: 0, type: 'balcony', clothes: { skinTone: '#fde68a', hairColor: '#d4af37', hairStyle: 'slick_back', eyeColor: '#0284c7', facialHair: 'clean', hat: 'none', jacket: '#ffffff', jacketStyle: 'vest', shirt: '#ffffff', tie: '#0f172a', pants: '#4a5568', accessory: 'cocktail' } }
        ]
    },
    {
        id: 4,
        title: "Mission 4: The Red Cap Informant",
        briefing: "Intel: A hostile informant is blending into the crowd. Caution: Multiple civilians nearby. Spot the exact target from your dossier.",
        clue: "Target: Suspect wearing a bright red baseball cap, black bomber jacket, scruffy stubble.",
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
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#291811',
                hairStyle: 'buzz_cut',
                eyeColor: '#16a34a',
                facialHair: 'stubble',
                hat: 'cap_red',
                jacket: '#1a202c',
                jacketStyle: 'jacket',
                shirt: '#475569',
                pants: '#718096',
                shoeColor: '#0f172a',
                accessory: 'none'
            },
            label: 'Informant'
        },
        civilians: [
            { x: 380, y: 500, speed: 0.4, clothes: { skinTone: '#fde68a', hairColor: '#59341c', eyeColor: '#0284c7', facialHair: 'clean', hat: 'cap_blue', jacket: '#4a5568', pants: '#1a202c' } },
            { x: 640, y: 500, speed: -0.3, clothes: { skinTone: '#b45309', hairColor: '#09090b', eyeColor: '#5c3a21', facialHair: 'full_beard', hat: 'none', jacket: '#319795', pants: '#2d3748' } },
            { x: 280, y: 500, speed: 0.3, clothes: { skinTone: '#78350f', hairColor: '#1c1917', eyeColor: '#38bdf8', facialHair: 'mustache', hat: 'none', jacket: '#805ad5', pants: '#e2e8f0' } }
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
            clothes: {
                skinTone: '#fde68a',
                hairColor: '#59341c',
                hairStyle: 'curly',
                eyeColor: '#0284c7',
                facialHair: 'stubble',
                hat: 'glasses',
                glasses: 'optical',
                jacket: '#1e40af',
                jacketStyle: 'hoodie',
                shirt: '#f8fafc',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'laptop'
            },
            label: 'Hacker'
        },
        civilians: [
            { x: 440, y: 295, speed: 0, type: 'window', clothes: { skinTone: '#f6ad55', hairColor: '#1c1917', hairStyle: 'side_part', eyeColor: '#5c3a21', facialHair: 'clean', hat: 'none', jacket: '#e2e8f0', jacketStyle: 'shirt', pants: '#4a5568' } }
        ]
    },
    {
        id: 6,
        title: "Mission 6: The Bridge Rendezvous",
        briefing: "Intel: Two suspects are meeting by the bridge walkway. Target is the supplier wearing a brown jacket handing over the package.",
        clue: "Target: Heavy brown coat, rugged full beard, holding a wooden contraband box.",
        reward: 1250,
        distance: 380,
        wind: 4.2,
        timeLimit: 30,
        target: {
            x: 440,
            y: 430,
            speed: 0,
            type: 'bridge',
            clothes: {
                skinTone: '#b45309',
                hairColor: '#291811',
                hairStyle: 'slick_back',
                eyeColor: '#5c3a21',
                facialHair: 'full_beard',
                hat: 'none',
                jacket: '#975a16',
                jacketStyle: 'parka',
                shirt: '#1c1917',
                pants: '#1a202c',
                shoeColor: '#451a03',
                accessory: 'box'
            },
            label: 'Supplier'
        },
        civilians: [
            { x: 490, y: 430, speed: 0, clothes: { skinTone: '#f6ad55', hairColor: '#1c1917', eyeColor: '#0284c7', facialHair: 'mustache', hat: 'cap_black', jacket: '#1a202c', pants: '#4a5568' } }
        ]
    },
    {
        id: 7,
        title: "Mission 7: The Guarded Arms Baron",
        briefing: "Intel: An arms dealer is flanked by two private security contractors. If the guards notice you, he will flee. Neutralize the Baron in the center.",
        clue: "Target: Pure white designer tuxedo, slicked silver hair, silver mustache walking between armed bodyguards.",
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
            clothes: {
                skinTone: '#fde68a',
                hairColor: '#cbd5e1',
                hairStyle: 'slick_back',
                eyeColor: '#64748b',
                facialHair: 'mustache',
                hat: 'none',
                jacket: '#ffffff',
                jacketStyle: 'tuxedo',
                shirt: '#ffffff',
                tie: '#0f172a',
                pants: '#ffffff',
                shoeColor: '#0f172a',
                accessory: 'none'
            },
            label: 'Arms Baron'
        },
        civilians: [
            { x: 420, y: 500, speed: 0.5, minX: 210, maxX: 660, clothes: { skinTone: '#f6ad55', hairColor: '#09090b', hairStyle: 'buzz_cut', eyeColor: '#0f172a', facialHair: 'stubble', hat: 'sunglasses', earpiece: true, jacket: '#0f172a', jacketStyle: 'suit', pants: '#0f172a' } },
            { x: 500, y: 500, speed: 0.5, minX: 290, maxX: 740, clothes: { skinTone: '#78350f', hairColor: '#09090b', hairStyle: 'buzz_cut', eyeColor: '#0f172a', facialHair: 'stubble', hat: 'sunglasses', earpiece: true, jacket: '#0f172a', jacketStyle: 'suit', pants: '#0f172a' } }
        ]
    },
    {
        id: 8,
        title: "Mission 8: Rainy Night Hit",
        briefing: "Intel: Heavy downpour is obscuring visibility. Target is carrying a bright yellow umbrella near the plaza fountain.",
        clue: "Target: Deep blue trench coat holding a bright yellow umbrella in the rain.",
        reward: 1800,
        distance: 330,
        wind: 2.0,
        weather: 'rain',
        timeLimit: 30,
        target: {
            x: 390,
            y: 500,
            speed: 0,
            type: 'standing',
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#1c1917',
                hairStyle: 'side_part',
                eyeColor: '#0284c7',
                facialHair: 'stubble',
                hat: 'none',
                jacket: '#1e3a8a',
                jacketStyle: 'trench',
                shirt: '#f8fafc',
                pants: '#1e293b',
                shoeColor: '#0f172a',
                accessory: 'umbrella'
            },
            label: 'Shadow Agent'
        },
        civilians: [
            { x: 250, y: 500, speed: 0.4, clothes: { skinTone: '#fde68a', hairColor: '#59341c', eyeColor: '#15803d', facialHair: 'clean', hat: 'none', jacket: '#4a5568', pants: '#2d3748' } },
            { x: 580, y: 500, speed: -0.3, clothes: { skinTone: '#b45309', hairColor: '#09090b', eyeColor: '#5c3a21', facialHair: 'full_beard', hat: 'cap_black', jacket: '#718096', pants: '#1a202c' } }
        ]
    },
    {
        id: 9,
        title: "Mission 9: VIP Penthouse Party",
        briefing: "Intel: High-profile crime boss is enjoying a private rooftop gala. Wait for him to step away from the crowd.",
        clue: "Target: Velvet royal purple blazer, slicked dark hair, holding a lit cigar on the top deck.",
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
            clothes: {
                skinTone: '#e29547',
                hairColor: '#09090b',
                hairStyle: 'slick_back',
                eyeColor: '#5c3a21',
                facialHair: 'goatee',
                hat: 'none',
                jacket: '#6b46c1',
                jacketStyle: 'suit',
                shirt: '#09090b',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'cigar'
            },
            label: 'Mob Boss'
        },
        civilians: [
            { x: 570, y: 190, speed: 0, clothes: { skinTone: '#fde68a', hairColor: '#d4af37', hairStyle: 'curly', eyeColor: '#0284c7', facialHair: 'clean', hat: 'none', jacket: '#ffffff', pants: '#4a5568', accessory: 'cocktail' } },
            { x: 700, y: 190, speed: 0, clothes: { skinTone: '#f6ad55', hairColor: '#59341c', hairStyle: 'pompadour', eyeColor: '#16a34a', facialHair: 'stubble', hat: 'none', jacket: '#d69e2e', pants: '#1a202c', accessory: 'cocktail' } }
        ]
    },
    {
        id: 10,
        title: "Mission 10: High-Wind Ridge",
        briefing: "Intel: Extreme crosswinds are blowing across the ridge. Adjust your mil-dot holdover carefully before squeezing the trigger.",
        clue: "Target: Heavy navy mountain windbreaker standing on the high overlook ledge.",
        reward: 2600,
        distance: 480,
        wind: 5.5,
        timeLimit: 25,
        target: {
            x: 470,
            y: 320,
            speed: 0,
            type: 'standing',
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#59341c',
                hairStyle: 'buzz_cut',
                eyeColor: '#0284c7',
                facialHair: 'full_beard',
                hat: 'none',
                jacket: '#1e3a8a',
                jacketStyle: 'parka',
                shirt: '#f8fafc',
                pants: '#2d3748',
                shoeColor: '#451a03',
                accessory: 'binoculars'
            },
            label: 'Spotter'
        },
        civilians: []
    },
    {
        id: 11,
        title: "Mission 11: Hostage Crisis (Precision Shot)",
        briefing: "CRITICAL: Hostage taker is holding an asset at gunpoint. A body shot might hit the hostage. ONLY a headshot is acceptable.",
        clue: "Target: Terrorist in black combat gear and ski mask holding the hostage in blue suit.",
        reward: 3100,
        distance: 360,
        wind: 0,
        timeLimit: 20,
        target: {
            x: 520,
            y: 490,
            speed: 0,
            type: 'hostage_taker',
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#09090b',
                hairStyle: 'buzz_cut',
                eyeColor: '#ef4444',
                facialHair: 'clean',
                hat: 'ski_mask',
                jacket: '#18181b',
                jacketStyle: 'jacket',
                shirt: '#09090b',
                pants: '#18181b',
                shoeColor: '#0f172a',
                accessory: 'none'
            },
            label: 'Terrorist'
        },
        civilians: [
            { x: 504, y: 490, speed: 0, isHostage: true, clothes: { skinTone: '#fde68a', hairColor: '#451a03', hairStyle: 'side_part', eyeColor: '#0284c7', facialHair: 'clean', hat: 'none', jacket: '#2b6cb0', shirt: '#ffffff', tie: '#e53e3e', pants: '#4a5568' } }
        ]
    },
    {
        id: 12,
        title: "Mission 12: Metro Station Transit",
        briefing: "Intel: A fugitive is attempting to board the transit shuttle. Multiple commuters present. Target has a green jacket and dark beanie.",
        clue: "Target: Green military jacket, dark beanie cap, running towards the train.",
        reward: 3600,
        distance: 390,
        wind: -1.0,
        timeLimit: 22,
        target: {
            x: 260,
            y: 500,
            speed: 0.8,
            minX: 200,
            maxX: 780,
            type: 'walking',
            clothes: {
                skinTone: '#b45309',
                hairColor: '#1c1917',
                hairStyle: 'buzz_cut',
                eyeColor: '#5c3a21',
                facialHair: 'stubble',
                hat: 'cap_black',
                jacket: '#2f855a',
                jacketStyle: 'jacket',
                shirt: '#1c1917',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'none'
            },
            label: 'Fugitive'
        },
        civilians: [
            { x: 350, y: 500, speed: -0.4, clothes: { skinTone: '#fde68a', hairColor: '#d4af37', eyeColor: '#0284c7', facialHair: 'clean', hat: 'none', jacket: '#4a5568', pants: '#2d3748' } },
            { x: 480, y: 500, speed: 0.5, clothes: { skinTone: '#f6ad55', hairColor: '#59341c', eyeColor: '#15803d', facialHair: 'mustache', hat: 'none', jacket: '#c53030', pants: '#1a202c' } },
            { x: 620, y: 500, speed: -0.5, clothes: { skinTone: '#78350f', hairColor: '#09090b', eyeColor: '#451a03', facialHair: 'goatee', hat: 'cap_blue', jacket: '#e2e8f0', pants: '#718096' } }
        ]
    },
    {
        id: 13,
        title: "Mission 13: Cargo Terminal Peeker",
        briefing: "Intel: Smuggler is hiding behind shipping crates. He peeks out every few seconds to check his radio. Time your shot.",
        clue: "Target: Orange high-vis jacket peeking out from the red cargo container, dark stubble.",
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
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#1c1917',
                hairStyle: 'buzz_cut',
                eyeColor: '#5c3a21',
                facialHair: 'stubble',
                hat: 'cap_black',
                jacket: '#dd6b20',
                jacketStyle: 'vest',
                shirt: '#1c1917',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'radio'
            },
            label: 'Smuggler'
        },
        civilians: [
            { x: 300, y: 440, speed: 0.3, clothes: { skinTone: '#fde68a', hairColor: '#59341c', eyeColor: '#0284c7', facialHair: 'clean', hat: 'hardhat_yellow', jacket: '#319795', pants: '#2d3748' } }
        ]
    },
    {
        id: 14,
        title: "Mission 14: Skyline Terrace Dining",
        briefing: "Intel: Syndicate financier is having lunch at an open-air rooftop restaurant. When he puts down his wine glass, you are cleared to fire.",
        clue: "Target: Navy dress shirt, expensive sunglasses, holding a wine glass on the restaurant balcony.",
        reward: 4900,
        distance: 410,
        wind: -3.0,
        timeLimit: 25,
        target: {
            x: 450,
            y: 308,
            speed: 0,
            type: 'balcony',
            clothes: {
                skinTone: '#e29547',
                hairColor: '#09090b',
                hairStyle: 'side_part',
                eyeColor: '#0284c7',
                facialHair: 'stubble',
                hat: 'sunglasses',
                jacket: '#2b6cb0',
                jacketStyle: 'shirt',
                shirt: '#1e3a8a',
                pants: '#1a202c',
                shoeColor: '#78350f',
                accessory: 'wine'
            },
            label: 'Financier'
        },
        civilians: [
            { x: 520, y: 308, speed: 0, type: 'balcony', clothes: { skinTone: '#fde68a', hairColor: '#d4af37', hairStyle: 'curly', eyeColor: '#15803d', facialHair: 'clean', hat: 'none', jacket: '#e2e8f0', jacketStyle: 'shirt', pants: '#4a5568', accessory: 'cocktail' } }
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
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#451a03',
                hairStyle: 'buzz_cut',
                eyeColor: '#0f172a',
                facialHair: 'full_beard',
                hat: 'hardhat_yellow',
                jacket: '#c53030',
                jacketStyle: 'jacket',
                shirt: '#1c1917',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'detonator'
            },
            label: 'Saboteur'
        },
        civilians: []
    },
    {
        id: 16,
        title: "Mission 16: Neon Nightclub Rooftop",
        briefing: "Intel: Under the pulsating neon glow, a cartel boss is closing a major deal. Low ambient light and high crosswinds.",
        clue: "Target: White leather jacket with gold chain necklace, bleached blonde hair, aviator shades.",
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
            clothes: {
                skinTone: '#fde68a',
                hairColor: '#fef08a',
                hairStyle: 'pompadour',
                eyeColor: '#0284c7',
                facialHair: 'goatee',
                hat: 'sunglasses',
                jacket: '#edf2f7',
                jacketStyle: 'jacket',
                shirt: '#09090b',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'gold'
            },
            label: 'Nightclub Boss'
        },
        civilians: [
            { x: 420, y: 300, speed: 0.2, clothes: { skinTone: '#f6ad55', hairColor: '#1c1917', eyeColor: '#16a34a', facialHair: 'clean', hat: 'none', jacket: '#d53f8c', pants: '#2b6cb0' } },
            { x: 660, y: 300, speed: -0.3, clothes: { skinTone: '#78350f', hairColor: '#09090b', eyeColor: '#5c3a21', facialHair: 'full_beard', hat: 'none', jacket: '#319795', pants: '#1a202c' } }
        ]
    },
    {
        id: 17,
        title: "Mission 17: Black-Market Exchange",
        briefing: "Intel: A midnight weapons exchange is underway. Two dealers are comparing crates. Target is the buyer in the long black coat.",
        clue: "Target: Black trench coat, black fedora hat with crimson band, smoking cigarette.",
        reward: 7700,
        distance: 440,
        wind: 3.5,
        timeLimit: 22,
        target: {
            x: 510,
            y: 490,
            speed: 0,
            type: 'standing',
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#1c1917',
                hairStyle: 'side_part',
                eyeColor: '#0f172a',
                facialHair: 'stubble',
                hat: 'fedora_black',
                jacket: '#18181b',
                jacketStyle: 'trench',
                shirt: '#991b1b',
                pants: '#18181b',
                shoeColor: '#0f172a',
                accessory: 'cigar'
            },
            label: 'Arms Dealer'
        },
        civilians: [
            { x: 450, y: 490, speed: 0, clothes: { skinTone: '#b45309', hairColor: '#09090b', eyeColor: '#5c3a21', facialHair: 'goatee', hat: 'none', jacket: '#4a5568', pants: '#2d3748' } }
        ]
    },
    {
        id: 18,
        title: "Mission 18: Armored Limousine Convoy",
        briefing: "Intel: A corrupt diplomat is peering through the open rear window of a moving armored limo. You have one clean shot.",
        clue: "Target: Peering through the open limo window, wearing a charcoal pinstripe suit and blood-red tie.",
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
            clothes: {
                skinTone: '#fde68a',
                hairColor: '#291811',
                hairStyle: 'slick_back',
                eyeColor: '#0284c7',
                facialHair: 'clean',
                hat: 'none',
                jacket: '#1a202c',
                jacketStyle: 'suit',
                shirt: '#ffffff',
                tie: '#e53e3e',
                pants: '#1a202c',
                shoeColor: '#0f172a',
                accessory: 'tie'
            },
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
        distance: 550,
        wind: 7.2,
        enemySniper: true,
        sniperCountdown: 4.5,
        timeLimit: 15,
        target: {
            x: 740,
            y: 130,
            speed: 0,
            type: 'enemy_sniper',
            clothes: {
                skinTone: '#f6ad55',
                hairColor: '#09090b',
                hairStyle: 'buzz_cut',
                eyeColor: '#38bdf8',
                facialHair: 'stubble',
                hat: 'none',
                jacket: '#22543d',
                jacketStyle: 'jacket',
                shirt: '#09090b',
                pants: '#1c1917',
                shoeColor: '#0f172a',
                accessory: 'none'
            },
            label: 'Enemy Sniper'
        },
        civilians: []
    },
    {
        id: 20,
        title: "Mission 20: FINAL — The Helipad Escape",
        briefing: "FINAL MISSION: Cartel Overlord is sprinting towards his extraction helicopter on the skyscraper helipad! Stop him before he takes off!",
        clue: "Target: Overlord in a carbon-black combat suit with silver hair temples sprinting to the chopper.",
        reward: 15000,
        distance: 520,
        wind: -4.0,
        timeLimit: 12,
        target: {
            x: 380,
            y: 190,
            speed: 1.8,
            minX: 360,
            maxX: 780,
            type: 'running_boss',
            clothes: {
                skinTone: '#fde68a',
                hairColor: '#94a3b8',
                hairStyle: 'slick_back',
                eyeColor: '#0284c7',
                facialHair: 'goatee',
                hat: 'none',
                jacket: '#0f172a',
                jacketStyle: 'tuxedo',
                shirt: '#09090b',
                tie: '#c53030',
                pants: '#0f172a',
                shoeColor: '#0f172a',
                accessory: 'none'
            },
            label: 'Cartel Overlord'
        },
        civilians: [
            { x: 780, y: 280, speed: 0, isHelicopter: true }
        ]
    }
];
"""

with open("data.js", "r", encoding="utf-8") as f:
    original = f.read()

# Keep WEAPONS_DATA and UPGRADES_DATA
weapons_start = original.find("// Sniper Rifles & Arsenal")
weapons_section = original[weapons_start:]

full_js = MISSIONS_JS + "\n\n" + weapons_section

with open("data.js", "w", encoding="utf-8") as f:
    f.write(full_js)

print("data.js updated with 20 unique missions, facial physiognomy and diverse clothing!")
