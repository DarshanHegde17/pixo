// Dashboard Artwork Assets — High fidelity SVG data URIs & Fallbacks
// 100% Offline, Zero external network dependencies, pixel-perfect match to reference image

export const DASHBOARD_ART = {
  // Gamer avatar with neon green headset
  avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0E2314"/>
        <stop offset="100%" stop-color="#040A06"/>
      </linearGradient>
      <linearGradient id="neonG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#39FF14"/>
        <stop offset="100%" stop-color="#00FFA3"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="58" fill="url(#bgGlow)" stroke="#39FF14" stroke-width="3"/>
    <!-- Head and hair -->
    <path d="M42 42 Q60 22 78 42 Q86 64 80 82 Q60 88 40 82 Q34 64 42 42 Z" fill="#1C2826"/>
    <!-- Face silhouette -->
    <path d="M46 50 Q60 56 74 50 Q72 70 60 76 Q48 70 46 50 Z" fill="#2E3F34"/>
    <!-- Glowing green eyes / visor reflection -->
    <ellipse cx="53" cy="58" rx="4" ry="2" fill="#39FF14"/>
    <ellipse cx="67" cy="58" rx="4" ry="2" fill="#39FF14"/>
    <!-- Neon Gaming Headset -->
    <path d="M30 52 C30 32 40 22 60 22 C80 22 90 32 90 52" fill="none" stroke="#39FF14" stroke-width="4" stroke-linecap="round"/>
    <rect x="24" y="46" width="12" height="24" rx="6" fill="#141E17" stroke="#39FF14" stroke-width="2"/>
    <rect x="84" y="46" width="12" height="24" rx="6" fill="#141E17" stroke="#39FF14" stroke-width="2"/>
    <!-- Shoulders / Cyber Hoodie -->
    <path d="M22 108 C26 88 44 84 60 84 C76 84 94 88 98 108 Z" fill="#0C150F" stroke="#39FF14" stroke-width="1.5"/>
    <path d="M50 84 L60 98 L70 84" fill="none" stroke="#39FF14" stroke-width="2"/>
  </svg>`,

  // 3D Gift Box with Neon Green Ribbon
  giftBox: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="boxTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#223628"/>
        <stop offset="100%" stop-color="#142218"/>
      </linearGradient>
      <linearGradient id="boxLeft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#111B14"/>
        <stop offset="100%" stop-color="#070C08"/>
      </linearGradient>
      <linearGradient id="boxRight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#18271C"/>
        <stop offset="100%" stop-color="#0C150F"/>
      </linearGradient>
      <linearGradient id="ribbonGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#55FF33"/>
        <stop offset="50%" stop-color="#39FF14"/>
        <stop offset="100%" stop-color="#00DD22"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <!-- Isometric Cube Shadow -->
    <ellipse cx="60" cy="102" rx="42" ry="14" fill="rgba(57, 255, 20, 0.15)"/>
    <!-- Top Face -->
    <polygon points="60,28 98,46 60,64 22,46" fill="url(#boxTop)" stroke="#39FF14" stroke-width="1.2"/>
    <!-- Left Face -->
    <polygon points="22,46 60,64 60,100 22,82" fill="url(#boxLeft)" stroke="#39FF14" stroke-width="1"/>
    <!-- Right Face -->
    <polygon points="60,64 98,46 98,82 60,100" fill="url(#boxRight)" stroke="#39FF14" stroke-width="1"/>
    <!-- Ribbon Left Face -->
    <polygon points="38,54 44,57 44,92 38,89" fill="url(#ribbonGlow)"/>
    <!-- Ribbon Right Face -->
    <polygon points="76,57 82,54 82,89 76,92" fill="url(#ribbonGlow)"/>
    <!-- Ribbon Top Face Cross -->
    <polygon points="41,37 79,55 75,57 37,39" fill="url(#ribbonGlow)"/>
    <polygon points="79,37 41,55 45,57 83,39" fill="url(#ribbonGlow)"/>
    <!-- 3D Ribbon Bow Top -->
    <path d="M60 28 C50 16 38 18 48 30 C55 36 60 30 60 30 Z" fill="url(#ribbonGlow)" filter="url(#glow)"/>
    <path d="M60 28 C70 16 82 18 72 30 C65 36 60 30 60 30 Z" fill="url(#ribbonGlow)" filter="url(#glow)"/>
    <circle cx="60" cy="30" r="5" fill="#39FF14" filter="url(#glow)"/>
  </svg>`,

  // Cyber Strike 2099 Artwork (Futuristic Cyborg Warrior in Cyberpunk City)
  cyberStrike: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#02140D"/>
        <stop offset="50%" stop-color="#082A1C"/>
        <stop offset="100%" stop-color="#030C07"/>
      </linearGradient>
      <linearGradient id="visorGlow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#39FF14"/>
        <stop offset="50%" stop-color="#00FFA3"/>
        <stop offset="100%" stop-color="#00E5FF"/>
      </linearGradient>
      <linearGradient id="armorGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#142820"/>
        <stop offset="100%" stop-color="#08140E"/>
      </linearGradient>
    </defs>
    <!-- Background Sky -->
    <rect width="400" height="240" fill="url(#skyGrad)"/>
    <!-- Distant Skyscrapers with Neon Lights -->
    <rect x="20" y="40" width="35" height="180" fill="#061810"/>
    <rect x="25" y="55" width="4" height="60" fill="#39FF14" opacity="0.6"/>
    <rect x="70" y="20" width="45" height="200" fill="#082015"/>
    <rect x="80" y="30" width="5" height="120" fill="#00E5FF" opacity="0.7"/>
    <rect x="92" y="40" width="16" height="8" fill="#39FF14" opacity="0.8"/>
    <rect x="92" y="56" width="16" height="8" fill="#39FF14" opacity="0.8"/>
    <rect x="280" y="30" width="50" height="190" fill="#071D13"/>
    <rect x="290" y="45" width="6" height="90" fill="#39FF14" opacity="0.7"/>
    <rect x="345" y="50" width="40" height="170" fill="#05140D"/>
    <rect x="355" y="70" width="5" height="60" fill="#00E5FF" opacity="0.5"/>
    <!-- Cyberpunk Warrior Silhouette -->
    <!-- Helmet & Visor -->
    <path d="M165 75 Q200 48 235 75 Q245 105 238 128 Q200 135 162 128 Q155 105 165 75 Z" fill="#0B1C13" stroke="#1D3E2A" stroke-width="2"/>
    <!-- Glowing Visor Band -->
    <path d="M168 88 Q200 82 232 88 Q234 98 230 102 Q200 96 170 102 Z" fill="url(#visorGlow)"/>
    <line x1="168" y1="95" x2="232" y2="95" stroke="#FFFFFF" stroke-width="1.5" opacity="0.8"/>
    <!-- Tactical Mask / Rebreather -->
    <rect x="188" y="108" width="24" height="20" rx="4" fill="#051009" stroke="#39FF14" stroke-width="1.5"/>
    <line x1="192" y1="114" x2="208" y2="114" stroke="#39FF14" stroke-width="1.5"/>
    <line x1="192" y1="120" x2="208" y2="120" stroke="#39FF14" stroke-width="1.5"/>
    <!-- Armored Shoulders & Chest -->
    <path d="M120 145 C150 132 170 130 200 130 C230 130 250 132 280 145 L310 240 L90 240 Z" fill="url(#armorGrad)" stroke="#39FF14" stroke-width="1.5"/>
    <!-- Chest Armor Plates -->
    <polygon points="175,145 225,145 220,185 180,185" fill="#08160E" stroke="#39FF14" stroke-width="1.2"/>
    <polygon points="185,155 215,155 212,175 188,175" fill="#0F2A1C" stroke="#00E5FF" stroke-width="1"/>
    <!-- Shoulder Armor Pads -->
    <polygon points="120,150 155,142 160,180 115,190" fill="#091A11" stroke="#39FF14" stroke-width="1.5"/>
    <polygon points="280,150 245,142 240,180 285,190" fill="#091A11" stroke="#39FF14" stroke-width="1.5"/>
    <!-- Tech Hud Overlay Lines -->
    <line x1="40" y1="20" x2="140" y2="20" stroke="#39FF14" stroke-width="1" opacity="0.4"/>
    <circle cx="140" cy="20" r="3" fill="#39FF14" opacity="0.6"/>
    <text x="45" y="16" fill="#39FF14" font-size="9" font-family="monospace" letter-spacing="1">SECTOR // 2099</text>
  </svg>`,

  // Retro Adventure Artwork (8-Bit Pixel Knight and Castle)
  retroAdventure: `data:image/svg+xml;utf8;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
    <defs>
      <linearGradient id="retroSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4B9CD3"/>
        <stop offset="55%" stop-color="#87CEEB"/>
        <stop offset="56%" stop-color="#5B8731"/>
        <stop offset="100%" stop-color="#385E18"/>
      </linearGradient>
    </defs>
    <!-- Sky & Ground -->
    <rect width="400" height="240" fill="url(#retroSky)"/>
    <!-- Pixel Clouds -->
    <rect x="50" y="24" width="70" height="16" fill="#FFFFFF" opacity="0.9"/>
    <rect x="65" y="14" width="40" height="10" fill="#FFFFFF" opacity="0.9"/>
    <rect x="260" y="30" width="90" height="20" fill="#FFFFFF" opacity="0.85"/>
    <rect x="280" y="18" width="50" height="12" fill="#FFFFFF" opacity="0.85"/>
    <!-- Pixel Castle in Background -->
    <rect x="210" y="80" width="140" height="90" fill="#4B5868"/>
    <rect x="210" y="70" width="20" height="10" fill="#4B5868"/>
    <rect x="240" y="70" width="20" height="10" fill="#4B5868"/>
    <rect x="270" y="70" width="20" height="10" fill="#4B5868"/>
    <rect x="300" y="70" width="20" height="10" fill="#4B5868"/>
    <rect x="330" y="70" width="20" height="10" fill="#4B5868"/>
    <!-- Castle Spire Towers -->
    <rect x="195" y="50" width="30" height="120" fill="#374354"/>
    <polygon points="190,50 210,20 230,50" fill="#8B263E"/>
    <rect x="335" y="50" width="30" height="120" fill="#374354"/>
    <polygon points="330,50 350,20 370,50" fill="#8B263E"/>
    <!-- Castle Gate & Windows -->
    <rect x="265" y="125" width="30" height="45" rx="15" fill="#1A212B"/>
    <rect x="205" y="75" width="10" height="18" fill="#1A212B"/>
    <rect x="345" y="75" width="10" height="18" fill="#1A212B"/>
    <!-- 8-Bit Pixel Knight -->
    <!-- Helmet & Brown Hair -->
    <rect x="95" y="72" width="36" height="32" rx="4" fill="#A86C3E"/>
    <rect x="99" y="82" width="28" height="16" fill="#FAD6A5"/>
    <!-- Pixel Eyes -->
    <rect x="105" y="86" width="4" height="6" fill="#111111"/>
    <rect x="117" y="86" width="4" height="6" fill="#111111"/>
    <rect x="109" y="94" width="8" height="2" fill="#C46B4F"/>
    <!-- Blue Armor Body -->
    <rect x="91" y="104" width="44" height="42" rx="4" fill="#2E5DA8"/>
    <rect x="99" y="112" width="28" height="26" fill="#4278CE"/>
    <rect x="109" y="118" width="8" height="14" fill="#F4B41A"/>
    <!-- Knight Sword -->
    <rect x="135" y="75" width="6" height="48" fill="#D3D9E2"/>
    <polygon points="138,62 135,75 141,75" fill="#D3D9E2"/>
    <rect x="127" y="115" width="22" height="6" fill="#8A5A36"/>
    <rect x="135" y="121" width="6" height="10" fill="#F4B41A"/>
    <!-- Knight Legs & Boots -->
    <rect x="95" y="146" width="14" height="26" fill="#3A4D6B"/>
    <rect x="117" y="146" width="14" height="26" fill="#3A4D6B"/>
    <rect x="93" y="166" width="18" height="10" fill="#754321"/>
    <rect x="115" y="166" width="18" height="10" fill="#754321"/>
  </svg>`,

  // Neon Racing Artwork (Purple/Cyan Exotic Supercar driving at speed)
  neonRacing: `data:image/svg+xml;utf8;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180" width="300" height="180">
    <defs>
      <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#070C12"/>
        <stop offset="50%" stop-color="#120A1A"/>
        <stop offset="100%" stop-color="#05070A"/>
      </linearGradient>
      <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#8A2BE2"/>
        <stop offset="50%" stop-color="#5A189A"/>
        <stop offset="100%" stop-color="#240046"/>
      </linearGradient>
      <linearGradient id="neonLight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FF007F"/>
        <stop offset="50%" stop-color="#00E5FF"/>
        <stop offset="100%" stop-color="#39FF14"/>
      </linearGradient>
    </defs>
    <!-- Dark Asphalt Road -->
    <rect width="300" height="180" fill="url(#roadGrad)"/>
    <!-- Neon Speed Light Trails -->
    <line x1="10" y1="120" x2="130" y2="120" stroke="#FF007F" stroke-width="2" opacity="0.8"/>
    <line x1="20" y1="135" x2="280" y2="135" stroke="#00E5FF" stroke-width="1.5" opacity="0.6"/>
    <line x1="5" y1="150" x2="295" y2="150" stroke="#39FF14" stroke-width="2" opacity="0.9"/>
    <!-- Car Silhouette -->
    <!-- Cabin Glass -->
    <path d="M100 80 Q140 55 190 70 L215 90 L85 90 Z" fill="#0A1822" stroke="#00E5FF" stroke-width="1.5"/>
    <!-- Aerodynamic Chassis -->
    <path d="M50 115 Q65 92 95 90 Q150 78 220 85 Q260 92 275 110 L265 125 L45 125 Z" fill="url(#carBody)" stroke="#9D4EDD" stroke-width="2"/>
    <!-- Front LED Headlights -->
    <polygon points="265,102 278,110 260,112" fill="#00E5FF"/>
    <line x1="278" y1="110" x2="300" y2="114" stroke="#00E5FF" stroke-width="3" opacity="0.8"/>
    <!-- Rear Taillights -->
    <polygon points="52,105 45,110 56,114" fill="#FF0055"/>
    <line x1="45" y1="110" x2="0" y2="110" stroke="#FF0055" stroke-width="3" opacity="0.8"/>
    <!-- Wheels with Glowing Cyan Rims -->
    <circle cx="85" cy="125" r="18" fill="#050708" stroke="#00E5FF" stroke-width="3"/>
    <circle cx="85" cy="125" r="8" fill="#1A1A1A"/>
    <circle cx="230" cy="125" r="18" fill="#050708" stroke="#00E5FF" stroke-width="3"/>
    <circle cx="230" cy="125" r="8" fill="#1A1A1A"/>
    <!-- Neon Underglow -->
    <ellipse cx="160" cy="135" rx="80" ry="6" fill="#39FF14" opacity="0.45"/>
  </svg>`,

  // Lime Green Supercar Artwork (Discover: Neon Racing)
  greenCar: `data:image/svg+xml;utf8;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
    <defs>
      <linearGradient id="limeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4EFA18"/>
        <stop offset="50%" stop-color="#2DBE09"/>
        <stop offset="100%" stop-color="#145904"/>
      </linearGradient>
    </defs>
    <rect width="200" height="140" fill="#061208"/>
    <!-- Underglow -->
    <ellipse cx="100" cy="115" rx="75" ry="8" fill="#39FF14" opacity="0.5"/>
    <!-- Front Cabin Windshield -->
    <path d="M55 60 Q100 45 145 60 L155 78 L45 78 Z" fill="#07190C" stroke="#39FF14" stroke-width="1.2"/>
    <!-- Hood and Aggressive Front Grill -->
    <path d="M25 90 Q35 74 60 72 Q100 68 140 72 Q165 74 175 90 L180 108 L20 108 Z" fill="url(#limeGrad)" stroke="#39FF14" stroke-width="1.8"/>
    <!-- Angled LED DRL Headlights -->
    <polygon points="35,82 58,84 45,90" fill="#FFFFFF"/>
    <polygon points="165,82 142,84 155,90" fill="#FFFFFF"/>
    <!-- Center Air Intake Grill -->
    <rect x="75" y="94" width="50" height="12" rx="3" fill="#070D08" stroke="#39FF14" stroke-width="1"/>
    <!-- Wheels -->
    <circle cx="45" cy="108" r="14" fill="#050906" stroke="#39FF14" stroke-width="2"/>
    <circle cx="155" cy="108" r="14" fill="#050906" stroke="#39FF14" stroke-width="2"/>
  </svg>`,

  // Isometric Glowing Cyan Cube Puzzle (Discover: Cyber Puzzle)
  cyberPuzzle: `data:image/svg+xml;utf8;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="cubeCyanTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00FFFF"/>
        <stop offset="100%" stop-color="#0088CC"/>
      </linearGradient>
      <linearGradient id="cubeCyanLeft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#005588"/>
        <stop offset="100%" stop-color="#00223D"/>
      </linearGradient>
      <linearGradient id="cubeCyanRight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0088BB"/>
        <stop offset="100%" stop-color="#003D55"/>
      </linearGradient>
      <filter id="cubeGlow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <rect width="160" height="160" fill="#030C12"/>
    <!-- Ambient Aura -->
    <ellipse cx="80" cy="130" rx="55" ry="16" fill="rgba(0, 229, 255, 0.25)"/>
    <!-- Top Face -->
    <polygon points="80,25 125,50 80,75 35,50" fill="url(#cubeCyanTop)" stroke="#00E5FF" stroke-width="2" filter="url(#cubeGlow)"/>
    <!-- Left Face -->
    <polygon points="35,50 80,75 80,125 35,100" fill="url(#cubeCyanLeft)" stroke="#00E5FF" stroke-width="1.8"/>
    <!-- Right Face -->
    <polygon points="80,75 125,50 125,100 80,125" fill="url(#cubeCyanRight)" stroke="#00E5FF" stroke-width="1.8"/>
    <!-- Puzzle Interlocking Joint Insets -->
    <!-- Top Face Puzzle Notch -->
    <circle cx="80" cy="50" r="8" fill="#003355" stroke="#00E5FF" stroke-width="1.5"/>
    <circle cx="58" cy="88" r="6" fill="#00E5FF"/>
    <circle cx="102" cy="88" r="6" fill="#00E5FF"/>
    <!-- Core Center Energy Core -->
    <circle cx="80" cy="75" r="4" fill="#FFFFFF"/>
  </svg>`,

  // Trending Gamepad Art (Trending Solo Adventures)
  trendingGamepad: `data:image/svg+xml;utf8;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
    <defs>
      <linearGradient id="padGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#142C1B"/>
        <stop offset="50%" stop-color="#0A1C10"/>
        <stop offset="100%" stop-color="#040D07"/>
      </linearGradient>
    </defs>
    <!-- Background Angle Lines -->
    <line x1="10" y1="110" x2="70" y2="10" stroke="#39FF14" stroke-width="2" opacity="0.3"/>
    <line x1="30" y1="110" x2="90" y2="10" stroke="#39FF14" stroke-width="1.5" opacity="0.2"/>
    <line x1="50" y1="110" x2="110" y2="10" stroke="#39FF14" stroke-width="1" opacity="0.15"/>
    <!-- Gamepad Body -->
    <path d="M40 40 C60 30 140 30 160 40 C178 52 188 95 168 108 C152 118 136 88 120 85 C108 82 92 82 80 85 C64 88 48 118 32 108 C12 95 22 52 40 40 Z" fill="url(#padGrad)" stroke="#39FF14" stroke-width="2.5"/>
    <!-- D-Pad Left -->
    <rect x="52" y="52" width="8" height="24" rx="2" fill="#39FF14"/>
    <rect x="44" y="60" width="24" height="8" rx="2" fill="#39FF14"/>
    <!-- Action Buttons Right (A, B, X, Y) -->
    <circle cx="140" cy="56" r="4" fill="#00E5FF"/>
    <circle cx="154" cy="62" r="4" fill="#FFD700"/>
    <circle cx="126" cy="62" r="4" fill="#39FF14"/>
    <circle cx="140" cy="72" r="4" fill="#FF453A"/>
    <!-- Dual Thumbsticks -->
    <circle cx="78" cy="74" r="10" fill="#050E07" stroke="#39FF14" stroke-width="1.5"/>
    <circle cx="122" cy="74" r="10" fill="#050E07" stroke="#39FF14" stroke-width="1.5"/>
  </svg>`,
};

