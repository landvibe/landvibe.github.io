// ============================================================
//  CONSTANTS
// ============================================================
const WIDTH = 500, HEIGHT = 800;
const FPS = 60;
const GRAVITY = 0.18;
const BALL_R = 7;
const FLIP_LEN = 85;
const FLIP_W = 10;
const TABLE_L = 35;
const TABLE_R = 440;
const LANE_IN = 452;
const LANE_OUT = 490;
const MAX_SPEED = 28;

// Colors (Balatro Style - Sky Blue Theme)
const BALATRO_BG_BASE = [70, 130, 180];
const BALATRO_RED = [235, 65, 65];
const BALATRO_BLUE = [50, 100, 200];
const BALATRO_GOLD = [255, 180, 40];
const BALATRO_ORANGE = [255, 120, 40];
const BALATRO_PANEL = [30, 60, 100];
const BALATRO_DARK = [40, 80, 120];
const BALATRO_BORDER = [240, 240, 240];

const DEEP_SEA = [60, 120, 170];
const MID_SEA = BALATRO_BLUE;
const LIGHT_SEA = [120, 180, 240];
const SKY_SEA = [180, 215, 245];
const SURF_SEA = [220, 235, 250];
const WHITE = [245, 245, 245];
const BLACK = [20, 25, 40];
const PEARL = [235, 235, 240];
const PEARL2 = [210, 215, 230];

const PUFFER_Y = BALATRO_GOLD;
const PUFFER_D = BALATRO_ORANGE;
const JELLY_P = [255, 100, 255];
const JELLY_K = [200, 50, 200];
const JELLY_B = [100, 255, 255];
const CORAL_C = [255, 150, 130];
const CORAL_D = [255, 100, 80];
const SHELL_C = [255, 240, 220];
const SHELL_P = [255, 180, 180];
const FISH_COL = [BALATRO_RED, BALATRO_BLUE, BALATRO_GOLD, JELLY_P, JELLY_B];
const SEAWEED_C = [50, 200, 100];
const GOLD_C = BALATRO_GOLD;
const SCORE_C = WHITE;
const GLOW_C = [150, 220, 255];
const TREASURE_C = BALATRO_GOLD;

const ROUND_BASE_TARGET = 1500;
const ROUND_SCALE = 1000;
const GOLD_PER_ROUND = 4; // fixed base gold reward per round
const SHOP_BG = BALATRO_BG_BASE;
const SHOP_PANEL = [50, 50, 70];
const SHOP_HIGHLIGHT = [230, 230, 230];
const SHOP_MAX_C = [100, 220, 100];

// Table Walls
const WALLS = [
    [[TABLE_L, 80], [55, 35]],
    [[55, 35], [120, 12]],
    [[120, 12], [250, 8]],
    [[250, 8], [380, 12]],
    [[380, 12], [TABLE_R, 35]],
    [[TABLE_R, 35], [462, 55]],
    [[462, 55], [LANE_OUT, 100]],
    [[TABLE_R, 100], [TABLE_R, 685]],
    [[LANE_OUT, 100], [LANE_OUT, 770]],
    [[LANE_IN, 170], [LANE_IN, 770]],
    [[LANE_IN, 770], [LANE_OUT, 770]],
    [[TABLE_L, 80], [TABLE_L, 685]],
    [[TABLE_L, 685], [120, 740]],
    [[380, 740], [TABLE_R, 685]],
];

// ============================================================
//  SHOP ITEMS
// ============================================================
const SHOP_ITEMS = [
    {id:'flipper_power', name:'플리퍼 강화', desc:'플리퍼 힘 +15%', max_lv:5, icon:'💪'},
    {id:'gravity', name:'가벼운 공', desc:'중력 -10%', max_lv:5, icon:'🎈'},
    {id:'score_boost', name:'점수 부스트', desc:'기본 배율 +0.2', max_lv:5, icon:'📈'},
    {id:'bumper_bonus', name:'범퍼 보너스', desc:'범퍼 점수 +30%', max_lv:5, icon:'💥'},
    {id:'flipper_size', name:'큰 플리퍼', desc:'플리퍼 길이 +5', max_lv:5, icon:'📏'},
];
const UPGRADE_DRAW_COST = 5;
const CONSUMABLE_DRAW_COST = 4;
const GACHA_COST = 3;
const RELIC_COST = 12;

const RELICS = [
    {id:'extra_box', name:'깊은 상자', desc:'소모품 슬롯 +1', icon:'📦'},
    {id:'extra_life', name:'생명의 산호', desc:'기본 생명 +1', icon:'🪸'},
    {id:'gold_rush', name:'황금 조개', desc:'라운드 기본 골드 +2', icon:'🐚'},
    {id:'jelly_bounty', name:'해파리 왕관', desc:'해파리 골드 2배', icon:'👑'},
    {id:'combo_anchor', name:'콤보 닻', desc:'콤보 유지시간 +50%', icon:'⚓'},
    {id:'big_pin', name:'거대 핀', desc:'드레인 세이버 크기 1.6배', icon:'📍'},
    {id:'triple_choice', name:'선택의 나침반', desc:'강화 뽑기 선택지 +1', icon:'🧭'},
];

const CONSUMABLES = [
    {id:'deep_sea', name:'심해 보너스', desc:'10초간 점수 3배', color:[60,180,255], icon:'🌊', weight:20},
    {id:'shield', name:'방어막', desc:'1회 드레인 방지', color:[100,255,200], icon:'🛡️', weight:25},
    {id:'slow_time', name:'슬로우 타임', desc:'8초간 중력 50% 감소', color:[180,140,255], icon:'🐌', weight:25},
    {id:'combo_master', name:'콤보 마스터', desc:'콤보 유지시간 2배', color:[255,160,60], icon:'🔥', weight:18},
    {id:'temp_life', name:'임시 생명', desc:'이번 라운드 생명 +1', color:[255,100,120], icon:'❤️', weight:12},
];

// ============================================================
//  BALL TYPES (Gacha)
// ============================================================
const RARITY_COLORS = [[180,200,220],[100,180,255],[255,220,50]];
const RARITY_GLOW = [[80,100,120],[60,120,200],[200,180,30]];

const BALL_TYPES = [
    {id:'normal',name:'기본 공',desc:'평범한 진주 공',rarity:0,rarity_name:'일반',color:PEARL,trail:PEARL2,weight:0,effects:{}},
    {id:'heavy',name:'무거운 공',desc:'범퍼 점수 +25%',rarity:0,rarity_name:'일반',color:[180,160,140],trail:[150,130,110],weight:25,effects:{bumper_mult:1.25}},
    {id:'feather',name:'깃털 공',desc:'중력 -20%, 가볍게 떠다님',rarity:0,rarity_name:'일반',color:[220,240,255],trail:[180,210,255],weight:25,effects:{gravity_mult:0.8}},
    {id:'fire',name:'불꽃 공',desc:'모든 점수 +30%',rarity:1,rarity_name:'희귀',color:[255,120,60],trail:[255,80,30],weight:12,effects:{score_mult:1.3}},
    {id:'magnet',name:'자석 공',desc:'배수구 근처에서 중앙으로 끌림',rarity:1,rarity_name:'희귀',color:[220,80,80],trail:[180,60,60],weight:12,effects:{magnet:true}},
    {id:'combo',name:'콤보 공',desc:'콤보 유지 시간 +80%',rarity:1,rarity_name:'희귀',color:[100,255,200],trail:[70,220,170],weight:12,effects:{combo_extend:1.8}},
    {id:'golden',name:'황금 공',desc:'모든 점수 x1.5, 골드 x2',rarity:2,rarity_name:'전설',color:[255,220,50],trail:[255,200,30],weight:5,effects:{score_mult:1.5,gold_mult:2.0}},
    {id:'split',name:'분열 공',desc:'범퍼 충돌 시 20% 확률로 분열',rarity:2,rarity_name:'전설',color:[180,100,255],trail:[150,70,230],weight:5,effects:{split_chance:0.2}},
    {id:'ghost',name:'유령 공',desc:'슬링샷 무시, 신비로운 궤적',rarity:2,rarity_name:'전설',color:[200,220,255],trail:[160,180,220],weight:4,effects:{ghost:true}},
];
