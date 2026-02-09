// ============================================================
//  MAIN GAME
// ============================================================
class PinballGame {
    constructor() {
        this.state = 'menu';
        this._testMode = false;
        this._testRound = 1;
        this._testGold = 50;
        this._testCursor = 0; // 0=round, 1=gold, 2=start
        this.score = 0; this.lives = 3;
        this.high_score = parseInt(localStorage.getItem('pinball_high_score')) || 0;
        this.best_round = parseInt(localStorage.getItem('pinball_best_round')) || 0;
        this.tilt_cnt = 0; this.tilt_lock = false; this.tilt_x = 0;
        this.t = 0; this.multi = 1;
        this.combo = 0; this.combo_t = 0;

        // Roguelike
        this.round_num = 0; this.round_score = 0; this.round_target = 0;
        this.gold = 0; this.gold_earned = 0; this.round_clear_timer = 0;
        this.boss = null; this.boss_killed_gold = 0;
        this.shop_cursor = 0;
        this.shop_tab = 0; // 0=강화 뽑기, 1=소모품 뽑기, 2=공 뽑기, 3=유물 뽑기
        this.upgrades = {};
        for (const item of SHOP_ITEMS) this.upgrades[item.id] = 0;
        this.upgrade_choices = null; // [item, item] two choices
        this.upgrade_pick = 0; // 0 or 1
        this.upgrade_draw_count = 0; // 강화 뽑기 횟수 (비용 증가용)

        // Consumables inventory (persists across rounds, max 2 slots)
        this.consumable_inv = []; // array of consumable ids in inventory
        this.consumable_max = 2;
        this.consumable_draw_result = null; // last drawn consumable
        this.consumable_draw_timer = 0;
        this.consumable_open = false; // pause menu open
        this.consumable_cursor = 0; // selected slot in pause menu
        this.deep_sea_timer = 0;
        this.shield_count = 0;
        this.slow_time_timer = 0;
        this.combo_master = false;

        // Ball gacha (3 slots: main, 2nd, 3rd)
        this.ball_slots = [null, null, null];
        this.current_ball_type = null; // alias for ball_slots[0]
        this.gacha_result = null; this.gacha_result_timer = 0;

        // Relics (permanent passives)
        this.relics = {};
        this.relic_result = null; this.relic_result_timer = 0;
        this.relic_bought_ante = 0; // 현재 앤티에서 구매한 유물 수
        this.relic_choices = null; // [relic, relic] two choices
        this.relic_pick = 0;

        // Next round hold timer (prevent accidental skip)
        this._nextRoundHold = 0;
        this._nextRoundHolding = false;
        this._nextRoundTouchId = null;
        this._nextRoundRequired = 60; // frames (1 second)
        this._stateChangeCooldown = 0; // prevent touch leaking between states

        // Upgrade computed
        this.gravity_val = GRAVITY;
        this.flipper_power_val = 1.0;
        this.base_multi = 1.0;
        this.bumper_mult_val = 1.0;

        this.balls = [];
        this.lf = new Flipper(140, 735, 'left');
        this.rf = new Flipper(360, 735, 'right');
        this.plunger = new Plunger();
        this.ball_in_p = false;

        this.bumpers = [
            new Bumper(180, 250, 22, 'puffer', 100),
            new Bumper(300, 220, 22, 'jelly', 150),
            new Bumper(240, 330, 22, 'puffer', 100),
        ];
        this.pin = new Pin(250, 755, 5, 50);  // drain saver dot
        this.slings = [
            new Slingshot(55, 610, 120, 700),
            new Slingshot(420, 610, 380, 700),
        ];
        this.drops = []; this._reset_drops();
        this.spinner = new Spinner(250, 470);
        this.bonus = new BonusStage();
        this.bonus_th = 50000; this.next_bonus = this.bonus_th;

        this.particles = [];
        this.bubbles = [];
        for (let i=0;i<25;i++) this.bubbles.push(new Bubble());
        this.popups = [];
        this.multiball = false; this.multiball_t = 0;

        // Keys
        this.keys = {};
        this._setupInput();
    }

    _setupInput() {
        document.addEventListener('keydown', e => {
            if (e.repeat) return;
            this.keys[e.code] = true;
            this._onKeyDown(e.code);
        });
        document.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            this._onKeyUp(e.code);
        });
    }

    _onKeyDown(code) {
        if (!audioCtx) initAudio();

        if (this.state === 'menu') {
            if (code === 'Space') this._start();
            else if (code === 'KeyT') {
                this.state = 'test_setup';
                this._testRound = 1;
                this._testGold = 50;
                this._testCursor = 0;
            }
        } else if (this.state === 'test_setup') {
            if (code === 'ArrowUp') this._testCursor = (this._testCursor - 1 + 3) % 3;
            else if (code === 'ArrowDown') this._testCursor = (this._testCursor + 1) % 3;
            else if (code === 'ArrowLeft') {
                if (this._testCursor === 0) this._testRound = Math.max(1, this._testRound - 1);
                else if (this._testCursor === 1) this._testGold = Math.max(0, this._testGold - 10);
            } else if (code === 'ArrowRight') {
                if (this._testCursor === 0) this._testRound = Math.min(999, this._testRound + 1);
                else if (this._testCursor === 1) this._testGold = Math.min(9999, this._testGold + 10);
            } else if (code === 'Space' || code === 'Enter') {
                if (this._testCursor === 2) this._startTest();
            } else if (code === 'Escape') {
                this.state = 'menu';
            }
        } else if (this.state === 'gameover' || this.state === 'victory') {
            if (code === 'Space') this.state = 'menu';
        } else if (this.state === 'round_clear') {
            if (code === 'Space') this.round_clear_timer = 0;
        } else if (this.state === 'shop') {
            // If upgrade choices are shown, handle pick
            if (this.upgrade_choices) {
                const maxPick = this.upgrade_choices.length - 1;
                if (code === 'ArrowLeft') this.upgrade_pick = Math.max(0, this.upgrade_pick - 1);
                else if (code === 'ArrowRight') this.upgrade_pick = Math.min(maxPick, this.upgrade_pick + 1);
                else if (code === 'Space' || code === 'Enter') this._upgrade_pick_confirm();
                return; // must pick one, no cancel
            }
            // If relic choices are shown, handle pick
            if (this.relic_choices) {
                const maxPick = this.relic_choices.length - 1;
                if (code === 'ArrowLeft') this.relic_pick = Math.max(0, this.relic_pick - 1);
                else if (code === 'ArrowRight') this.relic_pick = Math.min(maxPick, this.relic_pick + 1);
                else if (code === 'Space' || code === 'Enter') this._relic_pick_confirm();
                return; // must pick one, no cancel
            }
            const tabCounts = [1, 1, 3, 1]; // items per tab (draw buttons; gacha has 3 slots)
            const total = tabCounts[this.shop_tab];
            if (code === 'ArrowUp') this.shop_cursor = (this.shop_cursor - 1 + total) % total;
            else if (code === 'ArrowDown') this.shop_cursor = (this.shop_cursor + 1) % total;
            else if (code === 'ArrowLeft') { this.shop_tab = (this.shop_tab - 1 + 4) % 4; this.shop_cursor = 0; }
            else if (code === 'ArrowRight') { this.shop_tab = (this.shop_tab + 1) % 4; this.shop_cursor = 0; }
            else if (code === 'Space') this._shop_buy();
            else if (code === 'Enter') this._nextRoundHolding = true;
        } else if (this.state === 'play') {
            // Consumable pause menu
            if (this.consumable_open) {
                if (code === 'Escape' || code === 'KeyQ' || code === 'Tab') {
                    this.consumable_open = false;
                } else if (code === 'ArrowLeft') {
                    this.consumable_cursor = Math.max(0, this.consumable_cursor - 1);
                } else if (code === 'ArrowRight') {
                    this.consumable_cursor = Math.min(this.consumable_inv.length - 1, this.consumable_cursor);
                    if (this.consumable_cursor < this.consumable_inv.length - 1) this.consumable_cursor++;
                } else if (code === 'Space' || code === 'Enter') {
                    if (this.consumable_inv.length > 0 && this.consumable_cursor < this.consumable_inv.length) {
                        this._use_consumable(this.consumable_cursor);
                        if (this.consumable_inv.length > 0)
                            this.consumable_cursor = Math.min(this.consumable_cursor, this.consumable_inv.length - 1);
                    }
                } else if (code === 'KeyM') {
                    // 메인 화면으로 돌아가기
                    this.consumable_open = false;
                    this.state = 'menu';
                }
                return; // block other play inputs while menu is open
            }

            if (code === 'KeyQ' || code === 'Tab') {
                this.consumable_open = true;
                this.consumable_cursor = 0;
                return;
            }
            if (code === 'KeyZ' || code === 'ShiftLeft') { this._flipper_on('left'); }
            if (code === 'Slash' || code === 'ShiftRight') { this._flipper_on('right'); }
            if (code === 'Space' && this.ball_in_p) this.plunger.charging = true;
            if (code === 'ArrowLeft' && !this.tilt_lock) { this.tilt_x = -0.15; this.tilt_cnt++; }
            if (code === 'ArrowRight' && !this.tilt_lock) { this.tilt_x = 0.15; this.tilt_cnt++; }
            if (this.tilt_cnt >= 5) { this.tilt_lock = true; this.tilt_x = 0; }
        }
    }

    _onKeyUp(code) {
        if (code === 'Enter') { this._nextRoundHolding = false; this._nextRoundHold = 0; }
        if (this.state === 'play') {
            if (code === 'KeyZ' || code === 'ShiftLeft') this._flipper_off('left');
            if (code === 'Slash' || code === 'ShiftRight') this._flipper_off('right');
            if (code === 'Space') {
                if (this.ball_in_p && this.plunger.charging) {
                    for (const b of this.balls) {
                        if (Math.abs(b.x - this.plunger.x) < 20 && b.y > 700) {
                            b.vy = this.plunger.launch_speed();
                            b.vx = randUniform(-0.5, 0.5);
                        }
                    }
                    this.ball_in_p = false;
                    this.plunger.charging = false;
                    sndLaunch();
                }
            }
            if (code === 'ArrowLeft' || code === 'ArrowRight') this.tilt_x = 0;
        }
    }

    _reset_drops() {
        this.drops = [];
        const layout = this._current_map_drops || null;
        if (layout) {
            for (const d of layout) this.drops.push(new DropTarget(d[0], d[1], d[2], d[3]));
        } else {
            for (let i=0;i<5;i++)
                this.drops.push(new DropTarget(130+i*60, 430-Math.abs(i-2)*15, FISH_COL[i], 200));
        }
    }

    _setup_map(ante) {
        // Different map layouts per ante
        const maps = [
            // Ante 1: 기본 배치
            {
                bumpers: [
                    [180, 250, 22, 'puffer', 100],
                    [300, 220, 22, 'jelly', 150],
                    [240, 330, 22, 'puffer', 100],
                ],
                drops: [[130,430,FISH_COL[0],200],[190,415,FISH_COL[1],200],[250,400,FISH_COL[2],200],[310,415,FISH_COL[3],200],[370,430,FISH_COL[4],200]],
                spinner: [250, 470],
                pin: [250, 755, 5, 50],
            },
            // Ante 2: 범퍼 넓게, 드롭 높이
            {
                bumpers: [
                    [130, 230, 22, 'jelly', 150],
                    [350, 230, 22, 'puffer', 150],
                    [240, 310, 25, 'puffer', 120],
                ],
                drops: [[100,380,FISH_COL[1],200],[180,360,FISH_COL[3],200],[260,350,FISH_COL[0],200],[340,360,FISH_COL[4],200],[420,380,FISH_COL[2],200]],
                spinner: [200, 480],
                pin: [250, 755, 5, 50],
            },
            // Ante 3: 사각형 배치
            {
                bumpers: [
                    [160, 220, 20, 'puffer', 100],
                    [320, 220, 20, 'puffer', 100],
                    [240, 280, 25, 'jelly', 180],
                    [160, 340, 20, 'puffer', 150],
                ],
                drops: [[140,440,FISH_COL[2],220],[220,420,FISH_COL[0],220],[300,420,FISH_COL[4],220],[380,440,FISH_COL[1],220]],
                spinner: [300, 490],
                pin: [250, 755, 5, 50],
            },
            // Ante 4: 삼각형 + 중앙 대형
            {
                bumpers: [
                    [240, 200, 28, 'jelly', 200],
                    [150, 320, 22, 'puffer', 120],
                    [330, 320, 22, 'puffer', 120],
                ],
                drops: [[110,420,FISH_COL[3],250],[190,400,FISH_COL[1],250],[270,390,FISH_COL[0],250],[350,400,FISH_COL[4],250],[430,420,FISH_COL[2],250]],
                spinner: [340, 470],
                pin: [250, 755, 5, 50],
            },
            // Ante 5: 다이아몬드
            {
                bumpers: [
                    [240, 190, 22, 'puffer', 130],
                    [160, 280, 22, 'jelly', 170],
                    [320, 280, 22, 'puffer', 170],
                    [240, 360, 22, 'puffer', 130],
                ],
                drops: [[130,450,FISH_COL[0],250],[210,430,FISH_COL[2],250],[290,430,FISH_COL[4],250],[370,450,FISH_COL[1],250]],
                spinner: [180, 490],
                pin: [250, 755, 5, 50],
            },
            // Ante 6: 밀집 배치
            {
                bumpers: [
                    [180, 230, 20, 'puffer', 160],
                    [300, 230, 20, 'jelly', 160],
                    [240, 300, 22, 'puffer', 140],
                    [180, 370, 20, 'puffer', 140],
                    [300, 370, 20, 'puffer', 180],
                ],
                drops: [[120,440,FISH_COL[4],280],[200,425,FISH_COL[2],280],[280,420,FISH_COL[0],280],[360,425,FISH_COL[3],280]],
                spinner: [250, 480],
                pin: [250, 755, 5, 50],
            },
            // Ante 7: 지그재그
            {
                bumpers: [
                    [140, 220, 22, 'puffer', 150],
                    [280, 260, 25, 'jelly', 200],
                    [170, 340, 22, 'puffer', 180],
                    [340, 310, 22, 'puffer', 150],
                ],
                drops: [[100,430,FISH_COL[1],300],[180,400,FISH_COL[3],300],[260,410,FISH_COL[0],300],[340,400,FISH_COL[4],300],[420,430,FISH_COL[2],300]],
                spinner: [320, 490],
                pin: [250, 755, 5, 50],
            },
            // Ante 8: 최종 - 대형 배치
            {
                bumpers: [
                    [180, 210, 24, 'puffer', 200],
                    [310, 210, 24, 'puffer', 200],
                    [130, 310, 20, 'puffer', 160],
                    [360, 310, 20, 'puffer', 160],
                    [240, 360, 26, 'jelly', 250],
                ],
                drops: [[110,440,FISH_COL[0],350],[190,420,FISH_COL[2],350],[270,415,FISH_COL[4],350],[350,420,FISH_COL[1],350],[430,440,FISH_COL[3],350]],
                spinner: [240, 490],
                pin: [250, 755, 5, 50],
            },
        ];

        const idx = Math.min(ante - 1, maps.length - 1);
        const m = maps[idx];

        this.bumpers = m.bumpers.map(b => new Bumper(b[0], b[1], b[2], b[3], b[4]));
        this._current_map_drops = m.drops;
        this.spinner = new Spinner(m.spinner[0], m.spinner[1]);
        const pinR = m.pin[2] * (this.relics.big_pin ? 1.6 : 1);
        this.pin = new Pin(m.pin[0], m.pin[1], pinR, m.pin[3]);
    }

    _spawn_plunger() {
        const slotIdx = Math.min(this.ball_launch_index || 0, 2);
        const ballType = this.ball_slots[slotIdx];
        this.current_ball_type = ballType; // 글로벌 효과를 현재 공에 맞춤
        this.balls.push(new Ball(this.plunger.x, 720, 0, 0, ballType));
        this.ball_in_p = true;
    }

    _get_ante(n=null) {
        if (n === null) n = this.round_num;
        return Math.ceil(n / 3);
    }
    _get_stage(n=null) {
        if (n === null) n = this.round_num;
        return ((n - 1) % 3) + 1; // 1, 2, 3
    }
    _is_boss_round(n=null) {
        return this._get_stage(n) === 3;
    }

    _get_round_target(n=null) {
        if (n === null) n = this.round_num;
        const base = ROUND_BASE_TARGET + (n-1)*ROUND_SCALE + Math.floor(Math.pow(n-1, 1.5)*200);
        return this._testMode ? Math.floor(base / 5) : base;
    }

    _apply_upgrades() {
        const lv = this.upgrades;
        this.gravity_val = GRAVITY * (1 - 0.08*lv.gravity);
        this.flipper_power_val = 1.0 + 0.15*lv.flipper_power;
        this.base_multi = 1.0 + 0.2*lv.score_boost;
        this.bumper_mult_val = 1.0 + 0.3*lv.bumper_bonus;
        const newLen = FLIP_LEN + lv.flipper_size*5;
        this.lf.length = newLen; this.rf.length = newLen;
    }

    _start() {
        this._testMode = false;
        this.score = 0; this.lives = 3;
        this.round_num = 0; this.gold = 0;
        this.upgrades = {};
        for (const item of SHOP_ITEMS) this.upgrades[item.id] = 0;
        this.consumable_inv = []; this.deep_sea_timer = 0;
        this.consumable_draw_result = null; this.consumable_draw_timer = 0;
        this.consumable_max = 2;
        this.shield_count = 0; this.slow_time_timer = 0; this.combo_master = false;
        this.ball_slots = [null, null, null];
        this.current_ball_type = null;
        this.gacha_result = null; this.gacha_result_timer = 0;
        this.relics = {};
        this.relic_result = null; this.relic_result_timer = 0;
        this.relic_choices = null; this.relic_pick = 0;
        this.relic_bought_ante = 0;
        this.shop_cursor = 0; this.shop_tab = 0;
        this.upgrade_choices = null; this.upgrade_pick = 0; this._upgradeCooldown = 0;
        this.tilt_cnt = 0; this.tilt_lock = false; this.tilt_x = 0;
        this.multi = 1; this.combo = 0; this.combo_t = 0;
        this.next_bonus = this.bonus_th;
        this.multiball = false; this.multiball_t = 0;
        this._apply_upgrades();
        this._start_round();
    }

    _startTest() {
        this._testMode = true;
        this.score = 0; this.lives = 3;
        this.round_num = Math.max(0, this._testRound - 1); // _start_round will increment
        this.gold = this._testGold + (this._testMoney || 0);
        this.upgrades = {};
        for (const item of SHOP_ITEMS) this.upgrades[item.id] = 0;
        this.consumable_inv = []; this.deep_sea_timer = 0;
        this.consumable_draw_result = null; this.consumable_draw_timer = 0;
        this.consumable_max = 2;
        this.upgrade_choices = null; this.upgrade_pick = 0; this._upgradeCooldown = 0;
        this.shield_count = 0; this.slow_time_timer = 0; this.combo_master = false;
        this.ball_slots = [null, null, null];
        this.current_ball_type = null;
        this.gacha_result = null; this.gacha_result_timer = 0;
        this.relics = {};
        this.relic_result = null; this.relic_result_timer = 0;
        this.relic_choices = null; this.relic_pick = 0;
        this.relic_bought_ante = 0;
        this.shop_cursor = 0; this.shop_tab = 0;
        this.tilt_cnt = 0; this.tilt_lock = false; this.tilt_x = 0;
        this.multi = 1; this.combo = 0; this.combo_t = 0;
        this.next_bonus = this.bonus_th;
        this.multiball = false; this.multiball_t = 0;
        this._apply_upgrades();
        this._start_round();
    }

    _start_round() {
        this.round_num++;

        // Check if we completed ante 8 → victory!
        if (this._get_ante() > 8) {
            this.state = 'victory';
            if (!this._testMode) {
                if (this.score > this.high_score) {
                    this.high_score = this.score;
                    localStorage.setItem('pinball_high_score', this.high_score);
                }
                if (this.round_num - 1 > this.best_round) {
                    this.best_round = this.round_num - 1;
                    localStorage.setItem('pinball_best_round', this.best_round);
                }
            }
            return;
        }

        this.round_score = 0;
        this.round_bonus_gold = 0;
        this.round_target = this._get_round_target();
        this.lives = 3 + (this.relics.extra_life ? 1 : 0);
        this.ball_launch_index = 0; // 현재 발사할 공 슬롯 인덱스
        this.state = 'play';
        this.balls = [];
        this.tilt_cnt = 0; this.tilt_lock = false; this.tilt_x = 0;
        this.combo = 0; this.combo_t = 0;
        this.multiball = false; this.multiball_t = 0;
        this.multi = 1;
        this.boss_killed_gold = 0;

        // Reset active consumable effects (inventory persists)
        this.deep_sea_timer = 0;
        this.shield_count = 0;
        this.slow_time_timer = 0;
        this.combo_master = false;

        // Setup new map layout when ante changes (stage 1)
        if (this._get_stage() === 1 || this.round_num === 1) {
            this._setup_map(this._get_ante());
            this.relic_bought_ante = 0; // 앤티 변경 시 유물 구매 횟수 리셋
        }

        // Spawn boss on boss rounds (stage 3 of each ante)
        if (this._is_boss_round()) {
            const ante = this._get_ante();
            this.boss = new Boss(WIDTH / 2, 180, ante);
        } else {
            this.boss = null;
        }

        this._reset_drops();
        this._spawn_plunger();
        this._apply_upgrades();
    }

    _complete_round() {
        const bt_eff = (this.current_ball_type || {}).effects || {};
        const gold_mult = bt_eff.gold_mult || 1.0;
        const alive_balls = this.balls.filter(b => b.active).length;
        const ball_bonus = alive_balls * 2; // +2G per remaining ball
        const bumper_gold = this.round_bonus_gold || 0;
        const boss_gold = this.boss_killed_gold || 0;
        const base_gold = GOLD_PER_ROUND + (this.relics.gold_rush ? 2 : 0);
        this.gold_earned = Math.floor((base_gold + bumper_gold + boss_gold) * gold_mult) + ball_bonus;
        this.bumper_gold_earned = bumper_gold;
        this.boss_gold_earned = boss_gold;
        this.ball_bonus_gold = ball_bonus;
        this.gold += this.gold_earned;
        this.state = 'round_clear';
        this.round_clear_timer = 150;
        if (!this._testMode && this.round_num > this.best_round) {
            this.best_round = this.round_num;
            localStorage.setItem('pinball_best_round', this.best_round);
        }
        sndRoundClear();
    }

    _add_score(pts, x, y) {
        const bt_eff = (this.current_ball_type || {}).effects || {};
        const ball_score_mult = bt_eff.score_mult || 1.0;
        const deep_sea_mult = this.deep_sea_timer > 0 ? 3.0 : 1.0;
        const actual = Math.floor(pts * this.multi * this.base_multi * ball_score_mult * deep_sea_mult);
        this.score += actual; this.round_score += actual;
        const has_mult = this.multi > 1 || this.base_multi > 1.0 || ball_score_mult > 1.0 || deep_sea_mult > 1;
        this.popups.push(new ScorePopup(x, y, `+${actual}`, has_mult ? GOLD_C : SCORE_C));
        const combo_ext = bt_eff.combo_extend || 1.0;
        const combo_master_mult = this.combo_master ? 2.0 : 1.0;
        const relic_combo = this.relics.combo_anchor ? 1.5 : 1.0;
        this.combo++; this.combo_t = Math.floor(120*combo_ext*combo_master_mult*relic_combo);
        if (this.score >= this.next_bonus && !this.bonus.active) {
            this.bonus.start(); this.next_bonus += this.bonus_th; sndBonus();
        }
    }

    _spawn_fx(x, y, col, cnt=8, spd=3, life=20, sz=3) {
        for (let i=0;i<cnt;i++) {
            const a = randUniform(0, 6.283);
            const s = randUniform(0.5, spd);
            this.particles.push(new Particle(x, y, s*Math.cos(a), s*Math.sin(a), col, randInt(Math.floor(life/2), life), sz));
        }
    }

    _flipper_on(side) {
        const debuff = this.boss ? this.boss.debuff : null;
        if (debuff === 'flip_lock_left' && side === 'left') return;
        if (debuff === 'flip_lock_right' && side === 'right') return;
        if (debuff === 'flip_reverse') {
            // Reversed: left input → right flipper, right → left
            if (side === 'left') { this.rf.on = true; sndFlip(); }
            else { this.lf.on = true; sndFlip(); }
        } else {
            if (side === 'left') { this.lf.on = true; sndFlip(); }
            else { this.rf.on = true; sndFlip(); }
        }
    }
    _flipper_off(side) {
        const debuff = this.boss ? this.boss.debuff : null;
        if (debuff === 'flip_reverse') {
            if (side === 'left') this.rf.on = false;
            else this.lf.on = false;
        } else {
            if (side === 'left') this.lf.on = false;
            else this.rf.on = false;
        }
    }

    _shop_buy() {
        if (this.shop_tab === 0) {
            // Upgrade draw - show 2 choices
            this._upgrade_draw();
        } else if (this.shop_tab === 1) {
            // Consumable gacha draw
            this._consumable_draw();
        } else if (this.shop_tab === 2) {
            // Gacha draw
            this._gacha_draw();
        } else if (this.shop_tab === 3) {
            // Relic draw
            this._relic_draw();
        }
    }

    _get_upgrade_cost() {
        return Math.min(UPGRADE_DRAW_COST + this.upgrade_draw_count, 15);
    }

    _upgrade_draw() {
        if (this.upgrade_choices) return; // already choosing
        if (this._upgradeCooldown > 0) return; // cooldown after pick
        const cost = this._get_upgrade_cost();
        if (this.gold < cost) return;
        // Check if any upgrades available
        const available = SHOP_ITEMS.filter(item => this.upgrades[item.id] < item.max_lv);
        if (available.length === 0) return;

        this.gold -= cost;
        this.upgrade_draw_count++;

        // Pick 2 (or 3 with relic) random different upgrades
        const pick_count = 2 + (this.relics.triple_choice ? 1 : 0);
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const picks = shuffled.slice(0, Math.min(pick_count, shuffled.length));

        this.upgrade_choices = picks;
        this.upgrade_pick = 0;
        sndBuy();
    }

    _upgrade_pick_confirm() {
        if (!this.upgrade_choices) return;
        const chosen = this.upgrade_choices[this.upgrade_pick];
        if (!chosen) return;
        this.upgrades[chosen.id]++;
        this._apply_upgrades();
        this.upgrade_choices = null;
        this._upgradeCooldown = 15; // prevent immediate re-draw
    }

    _consumable_draw() {
        if (this.gold < CONSUMABLE_DRAW_COST) return;
        if (this.consumable_inv.length >= this.consumable_max) return;
        this.gold -= CONSUMABLE_DRAW_COST;

        // Weighted random pick
        const total_w = CONSUMABLES.reduce((s, c) => s + c.weight, 0);
        let roll = randUniform(0, total_w);
        let chosen = CONSUMABLES[0];
        for (const c of CONSUMABLES) {
            roll -= c.weight;
            if (roll <= 0) { chosen = c; break; }
        }

        this.consumable_inv.push(chosen.id);
        this.consumable_draw_result = chosen;
        this.consumable_draw_timer = 120; // 2 seconds
        sndBuy();
    }

    _use_consumable(slot) {
        if (this.state !== 'play') return;
        if (slot < 0 || slot >= this.consumable_inv.length) return;
        const cid = this.consumable_inv[slot];
        const cons = CONSUMABLES.find(c => c.id === cid);
        if (!cons) return;

        // Remove from inventory
        this.consumable_inv.splice(slot, 1);

        // Apply effect
        if (cid === 'deep_sea') {
            this.deep_sea_timer = 600; // 10s
            this._spawn_fx(WIDTH/2, HEIGHT/2, [60,180,255], 20, 5, 40, 4);
        } else if (cid === 'shield') {
            this.shield_count++;
            this._spawn_fx(WIDTH/2, HEIGHT/2, [100,255,200], 15, 4, 30, 3);
        } else if (cid === 'slow_time') {
            this.slow_time_timer = 480; // 8s
            this._spawn_fx(WIDTH/2, HEIGHT/2, [180,140,255], 15, 4, 30, 3);
        } else if (cid === 'combo_master') {
            this.combo_master = true;
            this._spawn_fx(WIDTH/2, HEIGHT/2, [255,160,60], 15, 4, 30, 3);
        } else if (cid === 'temp_life') {
            this.lives++;
            this._spawn_fx(WIDTH/2, HEIGHT/2, [255,100,120], 15, 4, 30, 3);
        }

        // Show popup
        this.popups.push(new ScorePopup(WIDTH/2, HEIGHT/2 - 30, `${cons.icon} ${cons.name}`, cons.color));
        sndBuy();
    }

    _gacha_draw() {
        if (this.gold < GACHA_COST) return;
        this.gold -= GACHA_COST;
        const drawable = BALL_TYPES.filter(bt => bt.weight > 0);
        const total_w = drawable.reduce((s, bt) => s + bt.weight, 0);
        let roll = randUniform(0, total_w);
        let chosen = drawable[0];
        let cumul = 0;
        for (const bt of drawable) {
            cumul += bt.weight;
            if (roll <= cumul) { chosen = bt; break; }
        }
        // Assign to selected slot (shop_cursor 0,1,2 in gacha tab)
        const slot = this.shop_cursor;
        this.ball_slots[slot] = chosen;
        this.current_ball_type = this.ball_slots[0]; // main ball = slot 0
        this.gacha_result = chosen;
        this.gacha_result_timer = 180;
        sndRoundClear();
    }

    _relic_draw() {
        if (this.relic_choices) return; // already choosing
        if (this.gold < RELIC_COST) return;
        if (this.relic_bought_ante >= 1) return; // 앤티당 1회 제한
        const available = RELICS.filter(r => !this.relics[r.id]);
        if (available.length === 0) return;
        this.gold -= RELIC_COST;
        this.relic_bought_ante++;

        // Pick 2 random different relics (or 1 if only 1 available)
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const picks = shuffled.slice(0, Math.min(2, shuffled.length));
        this.relic_choices = picks;
        this.relic_pick = 0;
        sndBuy();
    }

    _relic_pick_confirm() {
        if (!this.relic_choices) return;
        const chosen = this.relic_choices[this.relic_pick];
        if (!chosen) return;
        this.relics[chosen.id] = true;
        this._apply_relics();
        this.relic_result = chosen;
        this.relic_result_timer = 180;
        this.relic_choices = null;
        sndRoundClear();
    }

    _apply_relics() {
        // extra_box: consumable_max
        this.consumable_max = 2 + (this.relics.extra_box ? 1 : 0);
        // big_pin: update pin radius immediately
        if (this.pin) {
            this.pin.r = (this.relics.big_pin ? 8 : 5);
        }
    }

    _update() {
        if (this.state === 'round_clear') {
            this.round_clear_timer--;
            if (this.round_clear_timer <= 0) {
                this.state = 'shop';
                this._nextRoundHold = 0;
                this._nextRoundHolding = false;
                this._nextRoundTouchId = null;
                this._stateChangeCooldown = 30; // 0.5s touch guard
            }
            return;
        }
        if (this.state === 'shop') {
            if (this._stateChangeCooldown > 0) this._stateChangeCooldown--;
            if (this._upgradeCooldown > 0) this._upgradeCooldown--;
            if (this.gacha_result_timer > 0) this.gacha_result_timer--;
            if (this.relic_result_timer > 0) this.relic_result_timer--;
            if (this.consumable_draw_timer > 0) this.consumable_draw_timer--;
            // Next round hold logic
            if (this._nextRoundHolding) {
                this._nextRoundHold++;
                if (this._nextRoundHold >= this._nextRoundRequired) {
                    this._nextRoundHold = 0;
                    this._nextRoundHolding = false;
                    this._nextRoundTouchId = null;
                    this._start_round();
                }
            } else {
                this._nextRoundHold = 0;
            }
            return;
        }
        if (this.state !== 'play') return;
        if (this.consumable_open) return; // paused while consumable menu is open
        this.t++;

        // Consumable timers countdown
        if (this.deep_sea_timer > 0) this.deep_sea_timer--;
        if (this.slow_time_timer > 0) this.slow_time_timer--;

        if (this.tilt_lock && this.t % 300 === 0) {
            this.tilt_lock = false;
            this.tilt_cnt = Math.max(0, this.tilt_cnt - 2);
        }
        if (this.combo_t > 0) this.combo_t--;
        else this.combo = 0;

        this.lf.update(); this.rf.update(); this.plunger.update();
        for (const b of this.bumpers) b.update();
        if (this.boss) {
            this.boss.update();
            if (this.boss.heal_flash === 29) { // just healed
                this._spawn_fx(this.boss.x, this.boss.y, [80,255,120], 15, 3, 25, 3);
                this.popups.push(new ScorePopup(this.boss.x, this.boss.y - this.boss.r - 10, '💚 회복!', [80,255,120]));
            }
        }
        this.pin.update();
        for (const s of this.slings) s.update();
        for (const d of this.drops) d.update();
        this.spinner.update();

        if (this.multiball) {
            this.multi = 2; this.multiball_t--;
            if (this.multiball_t <= 0 || this.balls.length <= 1) { this.multiball = false; this.multi = 1; }
        }

        const tilt = this.tilt_lock ? 0 : this.tilt_x;
        const bt_eff = (this.current_ball_type || {}).effects || {};
        const slow_mult = this.slow_time_timer > 0 ? 0.5 : 1.0;
        const boss_grav = (this.boss && this.boss.debuff === 'gravity_up') ? 1.5 : 1.0;
        const ball_grav = this.gravity_val * (bt_eff.gravity_mult || 1.0) * slow_mult * boss_grav;

        const drained = [];
        const split_spawns = [];
        for (const ball of this.balls) {
            if (!ball.active) continue;

            if (this.ball_in_p && ball.y > 700 && Math.abs(ball.x - this.plunger.x) < 20) {
                ball.vx = 0; ball.vy = 0;
                ball.x = this.plunger.x; ball.y = 720;
                ball.update_trail(); continue;
            }

            const spd = Math.hypot(ball.vx, ball.vy);
            const n_steps = Math.max(4, Math.floor(spd / BALL_R) + 1);
            const sub_dt = 1.0 / n_steps;

            // Store flipper final angles for interpolation
            const lf_final = this.lf.angle, rf_final = this.rf.angle;
            const lf_prev = this.lf.prev_angle, rf_prev = this.rf.prev_angle;

            for (let si=0; si<n_steps; si++) {
                // Interpolate flipper angles for this substep
                const st = (si + 1) / n_steps;
                this.lf.angle = lf_prev + (lf_final - lf_prev) * st;
                this.rf.angle = rf_prev + (rf_final - rf_prev) * st;

                ball.step(tilt, sub_dt, ball_grav);

                if (ball.collide_walls(WALLS)) sndWall();

                if (ball.in_lane && ball.x < TABLE_R) ball.in_lane = false;

                if (!ball.in_lane && ball.x > TABLE_R && 35 < ball.y && ball.y < 685) {
                    ball.x = TABLE_R - BALL_R;
                    if (ball.vx > 0) ball.vx = -Math.abs(ball.vx)*0.5;
                }

                if (this.lf.collide_ball(ball, this.flipper_power_val))
                    this._spawn_fx(ball.x, ball.y, SHELL_P, 5, 2, 15, 2);
                if (this.rf.collide_ball(ball, this.flipper_power_val))
                    this._spawn_fx(ball.x, ball.y, SHELL_P, 5, 2, 15, 2);

                for (const bmp of this.bumpers) {
                    if (bmp.collide_ball(ball)) {
                        const bmp_pts = Math.floor(bmp.pts * this.bumper_mult_val * (bt_eff.bumper_mult || 1.0));
                        this._add_score(bmp_pts, bmp.x, bmp.y - 20);
                        this._spawn_fx(ball.x, ball.y, bmp.style==='puffer'?PUFFER_Y:JELLY_P, 10, 4, 20, 3);
                        sndBump();
                        // +0.5 gold per jellyfish hit (jelly_bounty doubles it)
                        if (bmp.style === 'jelly') {
                            const jellyGold = 0.5 * (this.relics.jelly_bounty ? 2 : 1);
                            this.round_bonus_gold += jellyGold;
                            this.popups.push(new ScorePopup(bmp.x + 20, bmp.y - 35, `+${jellyGold}G`, GOLD_C));
                        }
                        if ((bt_eff.split_chance || 0) > 0) {
                            if (Math.random() < bt_eff.split_chance) split_spawns.push([ball.x, ball.y, ball.ball_type]);
                        }
                    }
                }

                // Boss collision
                if (this.boss && this.boss.alive) {
                    if (this.boss.collide_ball(ball)) {
                        this._spawn_fx(ball.x, ball.y, [120,100,60], 8, 3, 18, 2);
                        this.popups.push(new ScorePopup(this.boss.x, this.boss.y - this.boss.r - 25,
                            `HP -1 (${this.boss.hp}/${this.boss.max_hp})`, [255, 200, 80]));
                        sndBump();
                        if (!this.boss.alive) {
                            // Boss defeated!
                            this.boss_killed_gold = BOSS_GOLD_REWARD;
                            this.popups.push(new ScorePopup(this.boss.x, this.boss.y - 40, `+${BOSS_GOLD_REWARD}G BOSS!`, GOLD_C));
                            this._spawn_fx(this.boss.x, this.boss.y, [200,180,100], 30, 6, 40, 4);
                        }
                    }
                }

                // Drain saver pin
                if (this.pin.collide_ball(ball)) {
                    this._add_score(this.pin.pts, this.pin.x, this.pin.y - 10);
                    this._spawn_fx(ball.x, ball.y, [200,220,240], 4, 2, 10, 1);
                    sndWall();
                }

                if (!bt_eff.ghost) {
                    for (const sl of this.slings) {
                        if (sl.collide_ball(ball)) {
                            this._add_score(sl.pts, (sl.x1+sl.x2)/2, (sl.y1+sl.y2)/2-15);
                            this._spawn_fx(ball.x, ball.y, CORAL_C, 6, 3, 15, 2);
                            sndWall();
                        }
                    }
                }

                for (const dt of this.drops) {
                    if (dt.collide_ball(ball)) {
                        this._add_score(dt.pts, dt.x, dt.y-15);
                        this._spawn_fx(dt.x, dt.y, dt.color, 12, 4, 25, 3);
                        sndTarget();
                    }
                }

                if (this.spinner.collide_ball(ball)) {
                    this._add_score(this.spinner.pts, this.spinner.x, this.spinner.y-20);
                    sndSpin();
                }
            }

            // Restore final flipper angles after substep interpolation
            this.lf.angle = lf_final;
            this.rf.angle = rf_final;

            ball.update_trail();

            // Magnet
            if (bt_eff.magnet && ball.y > 600 && !ball.in_lane) {
                const center_x = 250;
                const drain_factor = Math.min(1.0, (ball.y - 600)/150);
                const pull = (center_x - ball.x) * (0.012 + 0.008*drain_factor);
                ball.vx += pull;
                if (ball.y > 680) ball.vy *= 0.97;
                if (this.t % 3 === 0) this._spawn_fx(ball.x, ball.y, [255,80,80], 3, 1, 8, 1);
            }

            if (ball.in_lane && ball.y > 700 && Math.abs(ball.x - this.plunger.x) < 30) {
                ball.vx = 0; ball.vy = 0;
                ball.x = this.plunger.x; ball.y = 720;
                this.ball_in_p = true;
            }

            if (ball.y > HEIGHT + 20) { ball.active = false; drained.push(ball); }
        }

        for (const [sx, sy, sbt] of split_spawns) {
            this.balls.push(new Ball(sx, sy, randUniform(-3,3), randUniform(-4,-1), sbt));
            this._spawn_fx(sx, sy, [180,100,255], 8, 3, 15, 2);
        }

        if (this.drops.every(d => !d.alive)) {
            if (!this.multiball) {
                this.multiball = true; this.multiball_t = 600;
                for (let i=0;i<2;i++) {
                    this.balls.push(new Ball(randUniform(100,350), 100, randUniform(-2,2), randUniform(1,3), this.current_ball_type));
                }
                this._spawn_fx(250, 300, GLOW_C, 30, 5, 40, 4);
                sndMulti();
            }
            this._reset_drops();
        }

        this.balls = this.balls.filter(b => b.active);
        if (drained.length > 0 && this.balls.length === 0) {
            // Shield: prevent drain once
            if (this.shield_count > 0) {
                this.shield_count--;
                this._spawn_plunger();
                this._spawn_fx(WIDTH/2, HEIGHT - 40, [100,255,200], 20, 4, 30, 4);
                this.popups.push(new ScorePopup(WIDTH/2, HEIGHT - 60, '🛡️ 방어막!', [100,255,200]));
                // skip life loss
            } else {
            this.lives--;
            this.ball_launch_index++; // 다음 공 슬롯으로
            sndDrain();
            if (this.lives <= 0) {
                this.state = 'gameover';
                if (!this._testMode && this.score > this.high_score) {
                    this.high_score = this.score;
                    localStorage.setItem('pinball_high_score', this.high_score);
                }
                if (!this._testMode && this.round_num > this.best_round) {
                    this.best_round = this.round_num;
                    localStorage.setItem('pinball_best_round', this.best_round);
                }
            } else {
                this._spawn_plunger();
            }
            } // end shield else
        }

        if (this.bonus.active) {
            const bp = this.bonus.update(this.balls);
            if (bp > 0) { this.score += bp; this.round_score += bp; }
            if (!this.bonus.active && this.bonus.collected >= Math.floor(this.bonus.total/2)) {
                this.lives = Math.min(this.lives+1, 9);
                this.popups.push(new ScorePopup(WIDTH/2, HEIGHT/2, "추가 생명!", GOLD_C));
            }
        }

        this.particles = this.particles.filter(p => p.update());
        this.popups = this.popups.filter(p => p.update());
        for (const b of this.bubbles) b.update(this.t);

        // Round clear condition: boss round = kill boss, normal = reach target score
        if (this.boss) {
            if (!this.boss.alive && this.boss.death_t <= 0) this._complete_round();
        } else {
            if (this.round_score >= this.round_target) this._complete_round();
        }
    }

    // ============================================================
    //  DRAWING
    // ============================================================
    _draw_bg() {
        fillRect(0, 0, WIDTH, HEIGHT, BALATRO_BG_BASE);
        const cx = WIDTH/2, cy = HEIGHT/2;
        for (let i=0; i<8; i++) {
            const t_off = this.t*0.004 + i*0.6;
            const rad = 80 + i*45 + Math.sin(t_off)*40;
            const ang = t_off*0.4 + i;
            const c = lerp_col([55,110,160],[90,155,200], (Math.sin(t_off)+1)/2);
            ctx.strokeStyle = rgb(c); ctx.lineWidth = 35;
            ctx.beginPath();
            for (let j=0; j<20; j++) {
                const a = ang + j*0.3;
                const r = rad + Math.sin(a*3+this.t*0.015)*25;
                const px = cx+r*Math.cos(a), py = cy+r*Math.sin(a);
                if (j===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
            }
            ctx.closePath(); ctx.stroke();
        }
        // Grid
        const grid_off = (this.t*0.4)%40;
        ctx.strokeStyle = rgb([60,120,165]); ctx.lineWidth = 1;
        for (let x = Math.floor(grid_off)-40; x < WIDTH; x+=40) {
            ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,HEIGHT); ctx.stroke();
        }
        for (let y = Math.floor(grid_off)-40; y < HEIGHT; y+=40) {
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WIDTH,y); ctx.stroke();
        }
        for (const b of this.bubbles) b.draw();
    }

    _draw_walls() {
        for (const [[x1,y1],[x2,y2]] of WALLS) {
            drawLine(x1,y1,x2,y2,[40,80,140],3);
            drawLine(x1,y1,x2,y2,[80,140,200],1);
        }
    }

    _draw_ui() {
        // Top bar
        ctx.fillStyle = 'rgba(20,40,80,0.7)';
        ctx.fillRect(0, 0, WIDTH, 36);
        drawLine(0, 36, WIDTH, 36, BALATRO_BLUE, 1);

        const ante = this._get_ante();
        const stage = this._get_stage();
        const isBoss = this._is_boss_round();
        fillText(`ANTE ${ante} - ${stage}/3${isBoss ? ' 🗑️BOSS' : ''}`, 8, 15, isBoss ? [255,180,80] : BALATRO_GOLD, '14px "Malgun Gothic", sans-serif', 'left');
        if (this._testMode) fillText("TEST", 8, 32, BALATRO_ORANGE, '10px "Malgun Gothic", sans-serif', 'left');
        fillText(`${this.round_score.toLocaleString()}`, WIDTH/2, 18, WHITE, '20px "Malgun Gothic", sans-serif', 'center');

        let prog;
        if (this.boss) {
            const bossLabel = this.boss.alive ? `🗑️ HP ${this.boss.hp}/${this.boss.max_hp}` : '🗑️ 처치!';
            fillText(bossLabel, WIDTH-8, 15, this.boss.alive ? [255,180,80] : [100,255,100], 'bold 14px "Malgun Gothic", sans-serif', 'right');
            prog = this.boss.alive ? 1 - (this.boss.hp / this.boss.max_hp) : 1;
        } else {
            fillText(`GOAL ${this.round_target.toLocaleString()}`, WIDTH-8, 15, [200,200,220], '14px "Malgun Gothic", sans-serif', 'right');
            prog = Math.min(1, this.round_score / Math.max(1, this.round_target));
        }
        const bar_w = WIDTH - 16;
        fillRect(8, 22, bar_w, 5, [15,30,60]);
        if (prog > 0) {
            const bar_col = this.boss ? lerp_col([180,60,40], [255,200,80], prog) : lerp_col(BALATRO_BLUE, BALATRO_GOLD, prog);
            fillRect(8, 22, Math.round(bar_w*prog), 5, bar_col);
        }
        ctx.strokeStyle = rgb([40,70,120]); ctx.lineWidth=1;
        ctx.strokeRect(8, 22, bar_w, 5);

        fillText(`TOTAL ${this.score.toLocaleString()}`, WIDTH/2, 33, [160,180,210], '12px "Malgun Gothic", sans-serif', 'center');

        // Boss debuff warning
        if (this.boss && this.boss.debuff && this.boss.alive) {
            const debuffNames = {
                'flip_lock_left': '🔒 왼쪽 플리퍼 잠금!',
                'flip_lock_right': '🔒 오른쪽 플리퍼 잠금!',
                'flip_reverse': '🔄 플리퍼 반전!',
                'heal': '💚 체력 회복!',
                'gravity_up': '⬇️ 중력 증가!'
            };
            const dName = debuffNames[this.boss.debuff] || '';
            const flash = Math.sin(this.t * 0.2) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(180,40,40,0.6)';
                roundRect(WIDTH/2 - 80, 38, 160, 22, 6);
                ctx.fill();
                fillText(dName, WIDTH/2, 53, [255,220,180], 'bold 13px "Malgun Gothic", sans-serif', 'center');
            }
        }

        // Bottom bar
        const b_y = HEIGHT - 22;
        ctx.fillStyle = 'rgba(20,40,80,0.7)';
        ctx.fillRect(0, b_y, WIDTH, 22);
        drawLine(0, b_y, WIDTH, b_y, BALATRO_BLUE, 1);

        const bGold = this.round_bonus_gold || 0;
        fillText(`$${this.gold}  (+${bGold})`, 8, b_y+15, BALATRO_GOLD, '14px "Malgun Gothic", sans-serif', 'left');

        // Lives
        let lx = 65;
        for (let i=0; i<this.lives; i++) {
            fillCircle(lx+i*12, b_y+11, 4, BALATRO_RED);
            fillCircle(lx+i*12, b_y+11, 1, WHITE);
        }

        // Ball type
        const cbt = this.current_ball_type;
        const b_name = cbt ? cbt.name : "기본 공";
        const b_col = cbt ? cbt.color : PEARL;
        fillCircle(200, b_y+11, 5, b_col);
        fillText(b_name, 210, b_y+15, WHITE, '14px "Malgun Gothic", sans-serif', 'left');

        // Multiplier
        const t_mult = this.multi * this.base_multi;
        if (t_mult > 1.0) {
            fillText(`x${t_mult.toFixed(1)}`, WIDTH-10, b_y+15, BALATRO_ORANGE, '14px "Malgun Gothic", sans-serif', 'right');
        }

        // Consumable box button (top area) - always shown
        {
            const boxW = 80, boxH = 28, boxX = WIDTH/2 - boxW/2, boxY = 40;
            ctx.fillStyle = 'rgba(40,60,100,0.6)';
            ctx.strokeStyle = 'rgba(100,150,220,0.5)';
            ctx.lineWidth = 1;
            roundRect(boxX, boxY, boxW, boxH, 6);
            ctx.fill(); ctx.stroke();

            if (this.consumable_inv.length > 0) {
                // Mini icons
                const iconStartX = boxX + 6;
                for (let i = 0; i < Math.min(this.consumable_inv.length, 5); i++) {
                    const cid = this.consumable_inv[i];
                    const cons = CONSUMABLES.find(c => c.id === cid);
                    if (cons) fillText(cons.icon, iconStartX + i * 14, boxY + 18, WHITE, '11px "Malgun Gothic", sans-serif', 'left');
                }
            } else {
                fillText("📦 비어있음", boxX + 6, boxY + 18, [120,140,170], '10px "Malgun Gothic", sans-serif', 'left');
            }
            fillText(this._isMobile ? '▼' : 'Q', boxX + boxW - 14, boxY + 18, [180,200,230], '11px "Malgun Gothic", sans-serif', 'center');
        }

        // Consumable pause menu overlay
        if (this.consumable_open) {
            // Dim background
            ctx.fillStyle = 'rgba(0,0,20,0.75)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            fillText("소모품 박스", WIDTH/2, 140, WHITE, 'bold 28px "Malgun Gothic", sans-serif', 'center');

            const cardW = 80, cardH = 120, cardGap = 10;
            const invLen = this.consumable_inv.length;

            if (invLen > 0) {
                fillText("사용할 소모품을 선택하세요", WIDTH/2, 168, [150,170,210], '14px "Malgun Gothic", sans-serif', 'center');

                const totalW = invLen * (cardW + cardGap) - cardGap;
                const startX = WIDTH/2 - totalW/2;
                const cardY = 210;

                for (let i = 0; i < invLen; i++) {
                    const cid = this.consumable_inv[i];
                    const cons = CONSUMABLES.find(c => c.id === cid);
                    if (!cons) continue;
                    const cx = startX + i * (cardW + cardGap);
                    const selected = (i === this.consumable_cursor);

                    // Card
                    const glow = selected ? 0.5 : 0.15;
                    ctx.fillStyle = `rgba(${cons.color[0]},${cons.color[1]},${cons.color[2]},${glow})`;
                    ctx.strokeStyle = selected
                        ? `rgba(${Math.min(255,cons.color[0]+80)},${Math.min(255,cons.color[1]+80)},${Math.min(255,cons.color[2]+80)},1)`
                        : `rgba(${cons.color[0]},${cons.color[1]},${cons.color[2]},0.5)`;
                    ctx.lineWidth = selected ? 3 : 1;
                    roundRect(cx, cardY, cardW, cardH, 10);
                    ctx.fill(); ctx.stroke();

                    // Selected glow
                    if (selected) {
                        ctx.shadowColor = `rgba(${cons.color[0]},${cons.color[1]},${cons.color[2]},0.6)`;
                        ctx.shadowBlur = 15;
                        roundRect(cx, cardY, cardW, cardH, 10);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }

                    // Icon large
                    fillText(cons.icon, cx + cardW/2, cardY + 40, WHITE, '30px "Malgun Gothic", sans-serif', 'center');
                    // Name
                    fillText(cons.name, cx + cardW/2, cardY + 70, selected ? WHITE : [200,200,220], 'bold 12px "Malgun Gothic", sans-serif', 'center');
                    // Desc
                    fillText(cons.desc, cx + cardW/2, cardY + 88, selected ? [220,220,240] : [140,160,190], '10px "Malgun Gothic", sans-serif', 'center');

                    // Selection indicator
                    if (selected) {
                        fillText("▲", cx + cardW/2, cardY - 8, cons.color, 'bold 16px sans-serif', 'center');
                    }
                }

                // Empty slots
                for (let i = invLen; i < this.consumable_max; i++) {
                    const cx = startX + i * (cardW + cardGap);
                    ctx.fillStyle = 'rgba(30,40,60,0.3)';
                    ctx.strokeStyle = 'rgba(60,70,90,0.3)';
                    ctx.lineWidth = 1;
                    roundRect(cx, cardY, cardW, cardH, 10);
                    ctx.fill(); ctx.stroke();
                }

                // Bottom hint
                const sel_cons = CONSUMABLES.find(c => c.id === this.consumable_inv[this.consumable_cursor]);
                if (sel_cons) {
                    fillText(`[ Space ] ${sel_cons.name} 사용`, WIDTH/2, 380, sel_cons.color, 'bold 16px "Malgun Gothic", sans-serif', 'center');
                }
            } else {
                // Empty inventory message
                fillText("📦", WIDTH/2, 230, WHITE, '48px "Malgun Gothic", sans-serif', 'center');
                fillText("소모품이 없습니다", WIDTH/2, 280, [150,170,210], '18px "Malgun Gothic", sans-serif', 'center');
                fillText("상점에서 소모품을 뽑아보세요!", WIDTH/2, 305, [120,140,170], '13px "Malgun Gothic", sans-serif', 'center');
            }

            // "메인 화면으로" button (always shown)
            const menuBtnX = WIDTH/2 - 70, menuBtnY = 470, menuBtnW = 140, menuBtnH = 40;
            ctx.fillStyle = 'rgba(40,60,100,0.7)';
            ctx.strokeStyle = 'rgba(100,150,220,0.6)';
            ctx.lineWidth = 1;
            roundRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH, 8);
            ctx.fill(); ctx.stroke();
            fillText("🏠 메인 화면으로", WIDTH/2, menuBtnY + menuBtnH/2 + 6, [200,220,255], 'bold 15px "Malgun Gothic", sans-serif', 'center');

            if (this._isMobile) {
                // Close button
                const clX = WIDTH/2 - 60, clY = 430, clW = 120, clH = 40;
                ctx.fillStyle = 'rgba(80,40,40,0.7)';
                ctx.strokeStyle = 'rgba(180,80,80,0.6)';
                ctx.lineWidth = 1;
                roundRect(clX, clY, clW, clH, 8);
                ctx.fill(); ctx.stroke();
                fillText("닫기", WIDTH/2, clY + clH/2 + 6, WHITE, 'bold 16px "Malgun Gothic", sans-serif', 'center');
            } else {
                fillText("[ ←→ ] 선택   [ Space ] 사용   [ M ] 메인으로   [ Q / ESC ] 닫기", WIDTH/2, 420, [120,140,180], '12px "Malgun Gothic", sans-serif', 'center');
            }

            fillText("⏸ 일시정지", WIDTH/2, 110, [200,200,100], '14px "Malgun Gothic", sans-serif', 'center');
        }

        // Active consumable effects overlay
        if (this.deep_sea_timer > 0) {
            const sec = Math.ceil(this.deep_sea_timer / 60);
            const alpha = Math.min(1, 0.15 + Math.sin(this.t * 0.05) * 0.05);
            ctx.fillStyle = `rgba(0,80,200,${alpha.toFixed(2)})`;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            fillText(`🌊 심해 x3 (${sec}s)`, WIDTH/2, 55, [100,200,255], 'bold 14px "Malgun Gothic", sans-serif', 'center');
        }
        if (this.slow_time_timer > 0) {
            const sec = Math.ceil(this.slow_time_timer / 60);
            const alpha = Math.min(1, 0.08 + Math.sin(this.t * 0.03) * 0.03);
            ctx.fillStyle = `rgba(100,60,200,${alpha.toFixed(2)})`;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            const yOff = this.deep_sea_timer > 0 ? 72 : 55;
            fillText(`🐌 슬로우 (${sec}s)`, WIDTH/2, yOff, [180,150,255], 'bold 14px "Malgun Gothic", sans-serif', 'center');
        }

        // Status icons on right side
        {
            let iy = 55;
            if (this.shield_count > 0) {
                fillText(`🛡️x${this.shield_count}`, WIDTH - 10, iy, [100,255,200], '13px "Malgun Gothic", sans-serif', 'right');
                iy += 18;
            }
            if (this.combo_master) {
                fillText('🔥콤보+', WIDTH - 10, iy, [255,160,60], '13px "Malgun Gothic", sans-serif', 'right');
                iy += 18;
            }
        }

        // Overlay warnings
        if (this.multiball) {
            fillText("MULTIBALL!", WIDTH/2, 105, BALATRO_BLUE, '20px "Malgun Gothic", sans-serif', 'center');
        }
        if (this.tilt_lock) {
            fillText("TILT!", WIDTH/2, HEIGHT/2, BALATRO_RED, '20px "Malgun Gothic", sans-serif', 'center');
        } else if (this.tilt_cnt >= 3) {
            fillText("WARNING", WIDTH/2, 105, BALATRO_ORANGE, '14px "Malgun Gothic", sans-serif', 'center');
        }
        if (this.combo > 2) {
            fillText(`COMBO x${this.combo}`, WIDTH/2, HEIGHT-40, BALATRO_ORANGE, '14px "Malgun Gothic", sans-serif', 'center');
        }
    }

    _draw_menu() {
        this._draw_bg();
        const title = "바다 핀볼";
        const chars = [...title];
        for (let i=0; i<chars.length; i++) {
            const yo = Math.sin(this.t*0.05+i*0.5)*8;
            fillText(chars[i], WIDTH/2 - chars.length*22 + i*44, 260+yo, WHITE, '42px "Malgun Gothic", sans-serif', 'left');
        }
        fillText("Ocean Pinball Roguelike", WIDTH/2, 310, SKY_SEA, '20px "Malgun Gothic", sans-serif', 'center');

        const desc_lines = ["라운드별 목표 점수를 달성하세요!", "라운드 클리어 후 상점에서 강화할 수 있습니다."];
        for (let i=0; i<desc_lines.length; i++) {
            fillText(desc_lines[i], WIDTH/2, 350+i*20, [180,210,240], '14px "Malgun Gothic", sans-serif', 'center');
        }

        // Swimming fish
        const fx = WIDTH/2 + Math.sin(this.t*0.03)*80;
        const fy = 420;
        ctx.fillStyle = rgb(FISH_COL[0]);
        ctx.beginPath(); ctx.ellipse(fx, fy, 15, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(fx-15,fy); ctx.lineTo(fx-25,fy-8); ctx.lineTo(fx-25,fy+8); ctx.closePath(); ctx.fill();
        fillCircle(fx+5, fy-2, 3, WHITE);
        fillCircle(fx+5, fy-2, 1, BLACK);

        if (Math.floor(this.t/40)%2) {
            fillText("스페이스 키를 눌러 시작", WIDTH/2, 470, WHITE, '20px "Malgun Gothic", sans-serif', 'center');
        }

        const ctrls = ["Z / 왼쪽 Shift: 왼쪽 플리퍼", "/ / 오른쪽 Shift: 오른쪽 플리퍼", "Space: 발사 (꾹 누르기)", "방향키: 기울이기 (주의!)"];
        for (let i=0; i<ctrls.length; i++) {
            fillText(ctrls[i], WIDTH/2, 530+i*22, [150,180,220], '14px "Malgun Gothic", sans-serif', 'center');
        }
        if (this.high_score > 0) fillText(`최고 점수: ${this.high_score.toLocaleString()}`, WIDTH/2, 660, GOLD_C, '14px "Malgun Gothic", sans-serif', 'center');
        if (this.best_round > 0) fillText(`최고 라운드: ${this.best_round}`, WIDTH/2, 680, GOLD_C, '14px "Malgun Gothic", sans-serif', 'center');

        // Test mode: T key only (hidden)
    }

    _draw_test_setup() {
        this._draw_bg();
        ctx.fillStyle = 'rgba(0,0,30,0.7)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        fillText("테스트 모드", WIDTH/2, 180, BALATRO_ORANGE, '36px "Malgun Gothic", sans-serif', 'center');
        fillText("원하는 설정으로 게임을 시작합니다", WIDTH/2, 215, [180,180,210], '14px "Malgun Gothic", sans-serif', 'center');

        const items = [
            { label: "라운드", value: String(this._testRound) },
            { label: "골드", value: this._testGold + "G" },
            { label: "게임 시작!", value: "" }
        ];

        const startY = 300;
        const gap = 70;
        const boxW = 360, boxH = 50;

        for (let i = 0; i < items.length; i++) {
            const y = startY + i * gap;
            const selected = (this._testCursor === i);
            const bx = WIDTH/2 - boxW/2, by = y - boxH/2;

            // Box background
            ctx.fillStyle = selected ? 'rgba(100,140,255,0.25)' : 'rgba(40,40,70,0.5)';
            ctx.strokeStyle = selected ? 'rgba(120,160,255,0.8)' : 'rgba(80,80,120,0.4)';
            ctx.lineWidth = selected ? 2 : 1;
            roundRect(bx, by, boxW, boxH, 8);
            ctx.fill(); ctx.stroke();

            if (i < 2) {
                // Label on left
                fillText(items[i].label, bx + 15, y + 5, selected ? WHITE : [180,180,210], '16px "Malgun Gothic", sans-serif', 'left');

                // - and + buttons
                const btnSize = 36;
                const valCenterX = bx + boxW - 90;

                // Minus button
                const minusBx = valCenterX - 70 - btnSize/2;
                ctx.fillStyle = selected ? 'rgba(200,80,80,0.4)' : 'rgba(80,60,60,0.3)';
                ctx.strokeStyle = selected ? 'rgba(255,120,120,0.6)' : 'rgba(120,80,80,0.3)';
                ctx.lineWidth = 1;
                roundRect(minusBx, y - btnSize/2, btnSize, btnSize, 6);
                ctx.fill(); ctx.stroke();
                fillText("−", minusBx + btnSize/2, y + 6, selected ? [255,150,150] : [140,100,100], 'bold 22px "Malgun Gothic", sans-serif', 'center');

                // Value display
                fillText(items[i].value, valCenterX, y + 6, selected ? GOLD_C : [200,200,230], 'bold 22px "Malgun Gothic", sans-serif', 'center');

                // Plus button
                const plusBx = valCenterX + 70 - btnSize/2;
                ctx.fillStyle = selected ? 'rgba(80,200,80,0.4)' : 'rgba(60,80,60,0.3)';
                ctx.strokeStyle = selected ? 'rgba(120,255,120,0.6)' : 'rgba(80,120,80,0.3)';
                ctx.lineWidth = 1;
                roundRect(plusBx, y - btnSize/2, btnSize, btnSize, 6);
                ctx.fill(); ctx.stroke();
                fillText("+", plusBx + btnSize/2, y + 6, selected ? [150,255,150] : [100,140,100], 'bold 22px "Malgun Gothic", sans-serif', 'center');
            } else {
                // Start button
                fillText(items[i].label, WIDTH/2, y + 5, selected ? BALATRO_ORANGE : [180,180,210], 'bold 20px "Malgun Gothic", sans-serif', 'center');
            }

            // Selection indicator (keyboard)
            if (selected && !this._isMobile) {
                fillText("▸", bx - 15, y + 5, BALATRO_BLUE, '20px "Malgun Gothic", sans-serif', 'center');
            }
        }

        // Back button (top-left)
        const backBtnW = 60, backBtnH = 30, backBx = 10, backBy = 15;
        ctx.fillStyle = 'rgba(60,60,90,0.7)';
        ctx.strokeStyle = 'rgba(150,150,200,0.5)';
        ctx.lineWidth = 1;
        roundRect(backBx, backBy, backBtnW, backBtnH, 6);
        ctx.fill(); ctx.stroke();
        fillText("← 뒤로", backBx + backBtnW/2, backBy + backBtnH/2 + 5, [180,180,220], '12px "Malgun Gothic", sans-serif', 'center');

        if (!this._isMobile) {
            fillText("[ ↑↓ ] 선택  [ ←→ ] 값 조절  [ Space ] 시작  [ ESC ] 뒤로", WIDTH/2, startY + gap * 3 + 30, [120,120,150], '12px "Malgun Gothic", sans-serif', 'center');
        }
    }

    _draw_round_clear() {
        this._draw_bg();
        ctx.fillStyle = 'rgba(0,0,50,0.55)';
        ctx.fillRect(0,0,WIDTH,HEIGHT);

        if (this.round_clear_timer % 8 === 0) {
            for (let i=0;i<3;i++) {
                this.particles.push(new Particle(
                    randUniform(50,WIDTH-50), randUniform(200,500),
                    randUniform(-2,2), randUniform(-3,-1),
                    randChoice([GOLD_C,PUFFER_Y,JELLY_P,CORAL_C,GLOW_C]),
                    randInt(20,40), randInt(2,5)));
            }
        }
        for (const p of this.particles) { p.update(); p.draw(); }

        const y_off = Math.sin(this.t*0.08)*5;
        const rcAnte = this._get_ante();
        const rcStage = this._get_stage();
        fillText(`앤티 ${rcAnte} - ${rcStage}/3 클리어!`, WIDTH/2, 260+y_off, [180,200,230], '16px "Malgun Gothic", sans-serif', 'center');
        fillText(`라운드 ${this.round_num} 클리어!`, WIDTH/2, 300+y_off, GOLD_C, '36px "Malgun Gothic", sans-serif', 'center');
        if (this.boss_gold_earned > 0) {
            fillText(`🗑️ 보스 처치! +${this.boss_gold_earned}G`, WIDTH/2, 340, [255,200,80], 'bold 18px "Malgun Gothic", sans-serif', 'center');
        }
        fillText(`라운드 점수: ${this.round_score.toLocaleString()}`, WIDTH/2, 370, WHITE, '18px "Malgun Gothic", sans-serif', 'center');
        fillText(`획득 골드: +${this.gold_earned}G`, WIDTH/2, 410, GOLD_C, '24px "Malgun Gothic", sans-serif', 'center');
        let detailY = 432;
        const details = [];
        details.push(`기본 ${GOLD_PER_ROUND}G`);
        if (this.bumper_gold_earned > 0) details.push(`범퍼 +${this.bumper_gold_earned}G`);
        if (this.boss_gold_earned > 0) details.push(`보스 +${this.boss_gold_earned}G`);
        if (this.ball_bonus_gold > 0) details.push(`남은 공 +${this.ball_bonus_gold}G`);
        if (details.length > 1) {
            fillText(`(${details.join(' / ')})`, WIDTH/2, detailY, [200,220,150], '13px "Malgun Gothic", sans-serif', 'center');
            detailY += 22;
        }
        fillText(`총 점수: ${this.score.toLocaleString()}`, WIDTH/2, detailY + 10, [150,180,220], '14px "Malgun Gothic", sans-serif', 'center');

        if (Math.floor(this.t/30)%2) {
            fillText("Space로 건너뛰기", WIDTH/2, 540, [120,140,180], '14px "Malgun Gothic", sans-serif', 'center');
        }
    }

    _draw_shop() {
        fillRect(0, 0, WIDTH, HEIGHT, SHOP_BG);

        // Wave deco
        for (let i=0; i<3; i++) {
            const c = lerp_col(SHOP_PANEL, SHOP_BG, i/3);
            ctx.fillStyle = rgb(c);
            ctx.beginPath(); ctx.moveTo(0, 0);
            for (let x=0; x<=WIDTH; x+=5) {
                const yy = 55 + i*3 + Math.sin(x*0.02+this.t*0.03+i)*4;
                ctx.lineTo(x, yy);
            }
            ctx.lineTo(WIDTH, 0); ctx.closePath(); ctx.fill();
        }

        fillText("상    점", WIDTH/2, 38, WHITE, '32px "Malgun Gothic", sans-serif', 'center');

        const next_target = this._get_round_target(this.round_num+1);
        const shopAnte = this._get_ante();
        const shopStage = this._get_stage();
        const nextIsBoss = this._is_boss_round(this.round_num + 1);
        fillText(`앤티 ${shopAnte} (${shopStage}/3)  |  다음: ${next_target.toLocaleString()}${nextIsBoss ? ' 🗑️BOSS' : ''}`, WIDTH/2, 60, nextIsBoss ? [255,180,80] : SKY_SEA, '13px "Malgun Gothic", sans-serif', 'center');

        fillText(`💰 ${this.gold}G`, 40, 82, GOLD_C, 'bold 18px "Malgun Gothic", sans-serif', 'left');
        fillText(`❤️ ${this.lives}`, WIDTH-40, 82, PEARL, '14px "Malgun Gothic", sans-serif', 'right');

        // === TAB BAR ===
        const tabNames = ['강화 뽑기', '소모품 뽑기', '공 뽑기', '유물 뽑기'];
        const tabY = 95;
        const tabH = 28;
        const tabW = (WIDTH - 40) / 4;
        for (let ti = 0; ti < 4; ti++) {
            const tx = 20 + ti * tabW;
            const isActive = (this.shop_tab === ti);
            ctx.fillStyle = isActive ? 'rgba(80,140,255,0.35)' : 'rgba(30,40,60,0.6)';
            ctx.strokeStyle = isActive ? 'rgba(120,180,255,0.9)' : 'rgba(60,80,120,0.4)';
            ctx.lineWidth = isActive ? 2 : 1;
            roundRect(tx, tabY, tabW - 4, tabH, 6);
            ctx.fill(); ctx.stroke();
            fillText(tabNames[ti], tx + (tabW-4)/2, tabY + tabH/2 + 5, isActive ? WHITE : [140,150,180], `${isActive?'bold ':''}12px "Malgun Gothic", sans-serif`, 'center');
        }

        const content_y = tabY + tabH + 10;

        // === TAB 0: UPGRADE DRAW ===
        if (this.shop_tab === 0) {
            // Show current upgrade levels summary
            const summY = content_y + 2;
            fillText('보유 강화', WIDTH/2, summY, [140,170,210], '13px "Malgun Gothic", sans-serif', 'center');
            const rowH = 20;
            for (let i = 0; i < SHOP_ITEMS.length; i++) {
                const item = SHOP_ITEMS[i];
                const lv = this.upgrades[item.id];
                const iy = summY + 12 + i * rowH;
                fillText(`${item.icon} ${item.name}`, 44, iy, WHITE, '13px "Malgun Gothic", sans-serif', 'left');
                // Level dots
                for (let l = 0; l < item.max_lv; l++) {
                    const dotGap = 14;
                    const dotRightX = WIDTH - 44; // keep some right margin
                    const dotStartX = dotRightX - (item.max_lv - 1) * dotGap;
                    const lx2 = dotStartX + l * dotGap;
                    if (l < lv) fillCircle(lx2, iy - 4, 4, GOLD_C);
                    else { fillCircle(lx2, iy - 4, 4, [50,60,80]); strokeCircle(lx2, iy - 4, 4, [80,100,140], 1); }
                }
            }

            // Draw button
            const btnY = summY + 12 + SHOP_ITEMS.length * rowH + 16;
            const allMaxed = SHOP_ITEMS.every(item => this.upgrades[item.id] >= item.max_lv);
            const upgCost = this._get_upgrade_cost();
            const canDraw = !allMaxed && this.gold >= upgCost;
            const btnBg = allMaxed ? [25,55,40] : (canDraw ? [40,70,140] : SHOP_PANEL);
            const btnBorder = allMaxed ? [60,120,60] : (canDraw ? [80,140,255] : [60,80,120]);

            fillRoundRect(40, btnY, WIDTH-80, 48, 10, btnBg);
            strokeRoundRect(40, btnY, WIDTH-80, 48, 10, btnBorder, 2);
            if (allMaxed) {
                fillText('🎉 모든 강화 완료!', WIDTH/2, btnY+28, [100,220,100], 'bold 18px "Malgun Gothic", sans-serif', 'center');
            } else {
                fillText(`🎲 강화 뽑기  (${upgCost}G)`, WIDTH/2, btnY+22, canDraw ? WHITE : [120,120,140], 'bold 18px "Malgun Gothic", sans-serif', 'center');
                fillText('2개 중 1개 선택', WIDTH/2, btnY+40, [140,160,200], '11px "Malgun Gothic", sans-serif', 'center');
            }

            // Available upgrades list
            const listY = btnY + 64;
            fillText('등장 가능한 강화', WIDTH/2, listY, [100,130,170], '12px "Malgun Gothic", sans-serif', 'center');
            let ly = listY + 16;
            for (const item of SHOP_ITEMS) {
                const lv = this.upgrades[item.id];
                if (lv >= item.max_lv) {
                    fillText(`${item.icon} ${item.name}  ✅ MAX`, WIDTH/2, ly, [60,120,60], '12px "Malgun Gothic", sans-serif', 'center');
                } else {
                    fillText(`${item.icon} ${item.name}  (Lv.${lv}) — ${item.desc}`, WIDTH/2, ly, [130,150,180], '12px "Malgun Gothic", sans-serif', 'center');
                }
                ly += 18;
            }

            // === UPGRADE CHOICE OVERLAY ===
            if (this.upgrade_choices) {
                // Dark overlay
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);

                fillText('강화를 선택하세요!', WIDTH/2, 100, GOLD_C, 'bold 22px "Malgun Gothic", sans-serif', 'center');

                const cardW = 150, cardH = 200, gap = 20;
                const totalW = this.upgrade_choices.length * cardW + (this.upgrade_choices.length - 1) * gap;
                const startX = WIDTH/2 - totalW/2;

                for (let ci = 0; ci < this.upgrade_choices.length; ci++) {
                    const ch = this.upgrade_choices[ci];
                    const cx = startX + ci * (cardW + gap);
                    const cy = 130;
                    const isPick = (ci === this.upgrade_pick);
                    const lv = this.upgrades[ch.id];
                    const newLv = lv + 1;

                    // Card bg
                    const cbg = isPick ? [50,80,160] : [30,40,65];
                    const cborder = isPick ? [120,180,255] : [60,80,120];
                    fillRoundRect(cx, cy, cardW, cardH, 12, cbg);
                    strokeRoundRect(cx, cy, cardW, cardH, 12, cborder, isPick ? 3 : 1);

                    // Glow for selected
                    if (isPick) {
                        ctx.save();
                        ctx.shadowColor = 'rgba(100,180,255,0.6)';
                        ctx.shadowBlur = 20;
                        fillRoundRect(cx, cy, cardW, cardH, 12, cbg);
                        ctx.restore();
                    }

                    // Icon
                    fillText(ch.icon, cx + cardW/2, cy + 50, WHITE, '40px "Malgun Gothic", sans-serif', 'center');
                    // Name
                    fillText(ch.name, cx + cardW/2, cy + 80, WHITE, 'bold 16px "Malgun Gothic", sans-serif', 'center');
                    // Level change
                    fillText(`Lv.${lv} → Lv.${newLv}`, cx + cardW/2, cy + 105, GOLD_C, 'bold 14px "Malgun Gothic", sans-serif', 'center');
                    // Description
                    fillText(ch.desc, cx + cardW/2, cy + 130, [180,200,230], '12px "Malgun Gothic", sans-serif', 'center');

                    // Level dots
                    const dotStartX = cx + cardW/2 - (ch.max_lv * 14)/2;
                    for (let l = 0; l < ch.max_lv; l++) {
                        const dx = dotStartX + l * 14 + 7;
                        const dy = cy + 155;
                        if (l < newLv) fillCircle(dx, dy, 5, GOLD_C);
                        else { fillCircle(dx, dy, 5, [50,60,80]); strokeCircle(dx, dy, 5, [80,100,140], 1); }
                    }

                    // Selection indicator
                    if (isPick) {
                        fillText('▲', cx + cardW/2, cy + cardH + 16, GOLD_C, 'bold 16px "Malgun Gothic", sans-serif', 'center');
                    }
                }

                // Hints
                const isMobile = ('ontouchstart' in window);
                if (!isMobile) {
                    fillText('← → 선택  |  Space 확정', WIDTH/2, 360, [120,140,170], '12px "Malgun Gothic", sans-serif', 'center');
                } else {
                    fillText('카드를 터치하여 선택', WIDTH/2, 360, [120,140,170], '14px "Malgun Gothic", sans-serif', 'center');
                }
            }

        }

        // === TAB 1: CONSUMABLE DRAW ===
        else if (this.shop_tab === 1) {
            // Inventory display
            fillText(`소모품 박스: ${this.consumable_inv.length}/${this.consumable_max}`, WIDTH/2, content_y + 6, this.consumable_inv.length >= this.consumable_max ? [255,100,100] : [140,170,210], '13px "Malgun Gothic", sans-serif', 'center');

            // Current inventory cards
            const invY = content_y + 20;
            const invCardW = 100, invCardH = 70, invGap = 12;
            const invTotalW = this.consumable_max * (invCardW + invGap) - invGap;
            const invStartX = WIDTH/2 - invTotalW/2;
            for (let i = 0; i < this.consumable_max; i++) {
                const ix = invStartX + i * (invCardW + invGap);
                if (i < this.consumable_inv.length) {
                    const cons = CONSUMABLES.find(c => c.id === this.consumable_inv[i]);
                    if (cons) {
                        ctx.fillStyle = `rgba(${cons.color[0]},${cons.color[1]},${cons.color[2]},0.25)`;
                        ctx.strokeStyle = `rgba(${cons.color[0]},${cons.color[1]},${cons.color[2]},0.7)`;
                        ctx.lineWidth = 2;
                        roundRect(ix, invY, invCardW, invCardH, 8);
                        ctx.fill(); ctx.stroke();
                        fillText(cons.icon, ix + invCardW/2, invY + 30, WHITE, '22px "Malgun Gothic", sans-serif', 'center');
                        fillText(cons.name, ix + invCardW/2, invY + 55, WHITE, '12px "Malgun Gothic", sans-serif', 'center');
                    }
                } else {
                    ctx.fillStyle = 'rgba(30,40,60,0.3)';
                    ctx.strokeStyle = 'rgba(60,70,90,0.3)';
                    ctx.lineWidth = 1;
                    roundRect(ix, invY, invCardW, invCardH, 8);
                    ctx.fill(); ctx.stroke();
                    fillText("빈 칸", ix + invCardW/2, invY + 40, [80,90,110], '12px "Malgun Gothic", sans-serif', 'center');
                }
            }

            // Draw button
            const drawY = invY + invCardH + 24;
            const drawH = 60;
            const canDraw = this.gold >= CONSUMABLE_DRAW_COST && this.consumable_inv.length < this.consumable_max;
            const drawSel = (this.shop_cursor === 0);

            let dbg, dbd;
            if (drawSel) { dbg = SHOP_HIGHLIGHT; dbd = [100,180,255]; }
            else { dbg = [30,40,70]; dbd = [50,80,140]; }
            fillRoundRect(24, drawY, WIDTH-48, drawH, 8, dbg);
            strokeRoundRect(24, drawY, WIDTH-48, drawH, 8, dbd, 2);

            if (drawSel) {
                const ax = 10, ay = drawY + drawH/2;
                const pulse = Math.sin(this.t*0.1)*3;
                ctx.fillStyle = rgb(GOLD_C);
                ctx.beginPath();
                ctx.moveTo(ax+pulse, ay); ctx.lineTo(ax-6+pulse, ay-6); ctx.lineTo(ax-6+pulse, ay+6);
                ctx.closePath(); ctx.fill();
            }

            const dtc = drawSel ? [20,20,30] : WHITE;
            const dcc = drawSel ? (canDraw ? [20,20,30] : [150,50,50]) : (canDraw ? GOLD_C : [120,80,80]);
            fillText("🎲 소모품 뽑기", 44, drawY + 24, dtc, 'bold 20px "Malgun Gothic", sans-serif', 'left');
            fillText("랜덤 소모품 1개를 뽑습니다", 44, drawY + 46, drawSel ? [50,50,60] : [130,160,200], '13px "Malgun Gothic", sans-serif', 'left');
            fillText(`${CONSUMABLE_DRAW_COST}G`, WIDTH-68, drawY + 24, dcc, 'bold 20px "Malgun Gothic", sans-serif', 'right');

            if (this.consumable_inv.length >= this.consumable_max) {
                fillText("⚠ 박스가 가득 찼습니다!", WIDTH/2, drawY + drawH + 24, [255,100,100], '14px "Malgun Gothic", sans-serif', 'center');
            }

            // Consumable types reference
            const refY = drawY + drawH + 50;
            fillText("뽑을 수 있는 소모품", 44, refY, [140,170,210], '13px "Malgun Gothic", sans-serif', 'left');
            for (let ci = 0; ci < CONSUMABLES.length; ci++) {
                const cons = CONSUMABLES[ci];
                const ry = refY + 20 + ci * 28;
                fillText(cons.icon, 50, ry + 10, WHITE, '16px "Malgun Gothic", sans-serif', 'left');
                fillText(cons.name, 72, ry + 10, WHITE, '13px "Malgun Gothic", sans-serif', 'left');
                fillText(cons.desc, 170, ry + 10, [130,160,200], '12px "Malgun Gothic", sans-serif', 'left');
            }

            // Draw result popup
            if (this.consumable_draw_timer > 0 && this.consumable_draw_result) {
                const fade = Math.min(1, this.consumable_draw_timer / 20);
                ctx.fillStyle = `rgba(0,0,30,${(0.7*fade).toFixed(2)})`;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);

                const cr = this.consumable_draw_result;
                const popY = HEIGHT/2 - 60;

                // Glow
                ctx.fillStyle = `rgba(${cr.color[0]},${cr.color[1]},${cr.color[2]},${(0.2*fade).toFixed(2)})`;
                ctx.beginPath(); ctx.arc(WIDTH/2, popY, 80, 0, Math.PI*2); ctx.fill();

                fillText(cr.icon, WIDTH/2, popY, WHITE, '48px "Malgun Gothic", sans-serif', 'center');
                fillText(cr.name, WIDTH/2, popY + 45, cr.color, 'bold 24px "Malgun Gothic", sans-serif', 'center');
                fillText(cr.desc, WIDTH/2, popY + 72, [180,200,230], '14px "Malgun Gothic", sans-serif', 'center');
                fillText("소모품 박스에 추가되었습니다!", WIDTH/2, popY + 100, [150,170,210], '13px "Malgun Gothic", sans-serif', 'center');
            }
        }

        // === TAB 2: GACHA (3 slots) ===
        else if (this.shop_tab === 2) {
            const can_gacha = this.gold >= GACHA_COST;
            const slotLabels = ['1번째 공', '2번째 공', '3번째 공'];

            // 3 slot cards
            const slotH = 72;
            const slotGap = 8;
            let slotY = content_y;
            for (let si = 0; si < 3; si++) {
                const sel = (this.shop_cursor === si);
                const sbt = this.ball_slots[si];
                let sbg, sbd;
                if (sel) { sbg = SHOP_HIGHLIGHT; sbd = [100,180,255]; }
                else { sbg = [20,30,50]; sbd = [40,60,100]; }
                fillRoundRect(24, slotY, WIDTH-48, slotH, 8, sbg);
                strokeRoundRect(24, slotY, WIDTH-48, slotH, 8, sbd, sel ? 2 : 1);

                // Slot label
                const labelCol = sel ? [20,20,30] : [140,170,210];
                fillText(slotLabels[si], 44, slotY+16, labelCol, 'bold 13px "Malgun Gothic", sans-serif', 'left');

                // Cost
                const costCol = sel ? [20,20,30] : (can_gacha ? GOLD_C : [120,80,80]);
                fillText(`${GACHA_COST}G`, WIDTH-44, slotY+16, costCol, 'bold 13px "Malgun Gothic", sans-serif', 'right');

                // Ball info
                if (sbt) {
                    fillCircle(52, slotY+46, 12, sbt.color);
                    fillCircle(49, slotY+43, 4, WHITE);
                    strokeCircle(52, slotY+46, 12, lerp_col(sbt.color, BLACK, 0.3), 2);
                    const rc = RARITY_COLORS[sbt.rarity];
                    fillText(`[${sbt.rarity_name}] ${sbt.name}`, 72, slotY+42, rc, 'bold 14px "Malgun Gothic", sans-serif', 'left');
                    fillText(sbt.desc, 72, slotY+60, sel ? [40,50,70] : [150,180,220], '12px "Malgun Gothic", sans-serif', 'left');
                } else {
                    fillCircle(52, slotY+46, 12, PEARL);
                    fillCircle(49, slotY+43, 4, WHITE);
                    fillText("기본 공", 72, slotY+42, sel ? [40,50,70] : [180,200,220], '14px "Malgun Gothic", sans-serif', 'left');
                    fillText("뽑기로 공을 장착하세요", 72, slotY+60, sel ? [60,60,80] : [130,160,200], '12px "Malgun Gothic", sans-serif', 'left');
                }

                // Selection arrow
                if (sel) fillText("▶", 32, slotY+46, [20,20,30], 'bold 14px "Malgun Gothic", sans-serif', 'left');

                slotY += slotH + slotGap;
            }

            // Draw instruction
            fillText("[ ↑↓ ] 슬롯 선택  [ Space ] 뽑기", WIDTH/2, slotY+8, [100,130,180], '12px "Malgun Gothic", sans-serif', 'center');

            // Ball types reference
            const refY = slotY + 28;
            fillText("공 종류 안내", 44, refY, [140,170,210], '13px "Malgun Gothic", sans-serif', 'left');
            const BALL_TYPES_REF = typeof BALL_TYPES !== 'undefined' ? BALL_TYPES : [];
            for (let bi = 0; bi < BALL_TYPES_REF.length && bi < 9; bi++) {
                const bt = BALL_TYPES_REF[bi];
                const bx = 40 + (bi % 2) * (WIDTH/2 - 30);
                const by = refY + 12 + Math.floor(bi/2) * 28;
                fillCircle(bx, by+6, 6, bt.color);
                fillCircle(bx-1, by+5, 2, WHITE);
                const rc = RARITY_COLORS[bt.rarity];
                fillText(`${bt.name}`, bx+14, by+10, rc, '12px "Malgun Gothic", sans-serif', 'left');
            }
        }

        // === TAB 3: RELIC DRAW ===
        else if (this.shop_tab === 3) {
            const relic_sel = (this.shop_cursor === 0);
            const available = RELICS.filter(r => !this.relics[r.id]);
            const allOwned = available.length === 0;
            const anteLimitReached = this.relic_bought_ante >= 1;
            const can_relic = !allOwned && !anteLimitReached && this.gold >= RELIC_COST;

            // Owned relics display
            const ownedRelics = RELICS.filter(r => this.relics[r.id]);
            fillText(`보유 유물: ${ownedRelics.length}/${RELICS.length}`, WIDTH/2, content_y + 6, [140,170,210], '13px "Malgun Gothic", sans-serif', 'center');

            const listY = content_y + 22;
            if (ownedRelics.length > 0) {
                for (let ri = 0; ri < ownedRelics.length; ri++) {
                    const rl = ownedRelics[ri];
                    const rx = 40 + (ri % 2) * (WIDTH/2 - 20);
                    const ry = listY + Math.floor(ri/2) * 32;
                    fillText(`${rl.icon} ${rl.name}`, rx, ry + 10, [200,220,255], 'bold 13px "Malgun Gothic", sans-serif', 'left');
                    fillText(rl.desc, rx + 2, ry + 26, [130,160,200], '11px "Malgun Gothic", sans-serif', 'left');
                }
            } else {
                fillText("아직 유물이 없습니다", WIDTH/2, listY + 16, [100,120,160], '13px "Malgun Gothic", sans-serif', 'center');
            }

            // Draw button
            const ownedRows = Math.max(1, Math.ceil(ownedRelics.length / 2));
            const btnY = listY + ownedRows * 32 + 16;
            const btnH = 60;
            let rbg, rbd;
            if (relic_sel) { rbg = SHOP_HIGHLIGHT; rbd = [100,180,255]; }
            else { rbg = [30,40,70]; rbd = [50,80,140]; }
            fillRoundRect(24, btnY, WIDTH-48, btnH, 8, rbg);
            strokeRoundRect(24, btnY, WIDTH-48, btnH, 8, rbd, 2);

            if (allOwned) {
                fillText('🎉 모든 유물 수집 완료!', WIDTH/2, btnY+34, [100,220,100], 'bold 18px "Malgun Gothic", sans-serif', 'center');
            } else if (anteLimitReached) {
                fillText('이번 앤티에서 이미 구매했습니다', WIDTH/2, btnY+28, [200,150,80], 'bold 16px "Malgun Gothic", sans-serif', 'center');
                fillText('다음 앤티에서 다시 구매할 수 있습니다', WIDTH/2, btnY+48, [140,120,80], '12px "Malgun Gothic", sans-serif', 'center');
            } else {
                const r_txt_col = relic_sel ? [20,20,30] : WHITE;
                const r_cost_col = relic_sel ? [20,20,30] : (can_relic ? GOLD_C : [120,80,80]);
                fillText("🏺 유물 뽑기", 44, btnY+24, r_txt_col, 'bold 20px "Malgun Gothic", sans-serif', 'left');
                fillText(`랜덤 영구 능력 획득 (${available.length}종 남음)`, 44, btnY+46, relic_sel ? [50,50,60] : [130,160,200], '13px "Malgun Gothic", sans-serif', 'left');
                fillText(`${RELIC_COST}G`, WIDTH-68, btnY+24, r_cost_col, 'bold 20px "Malgun Gothic", sans-serif', 'right');
            }

            // All relics reference
            const refY = btnY + btnH + 20;
            fillText("유물 도감", 44, refY, [140,170,210], '13px "Malgun Gothic", sans-serif', 'left');
            for (let ri = 0; ri < RELICS.length; ri++) {
                const rl = RELICS[ri];
                const rx = 40 + (ri % 2) * (WIDTH/2 - 20);
                const ry = refY + 14 + Math.floor(ri/2) * 24;
                const owned = !!this.relics[rl.id];
                fillText(`${rl.icon} ${rl.name}`, rx, ry+10, owned ? [200,220,255] : [80,90,120], `${owned?'bold ':''}12px "Malgun Gothic", sans-serif`, 'left');
            }
        }

        // Key hints (non-mobile)
        if (!this._isMobile) {
            fillText("[ ←→ ] 탭  [ Space ] 뽑기  [ Enter 꾹 ] 다음", WIDTH/2, HEIGHT-18, [100,130,180], '13px "Malgun Gothic", sans-serif', 'center');
        }

        // === RELIC CHOICE OVERLAY (rendered over any tab) ===
        if (this.relic_choices) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            fillText('유물을 선택하세요!', WIDTH/2, 100, [100,180,255], 'bold 22px "Malgun Gothic", sans-serif', 'center');

            const rcW = 150, rcH = 180, rcGap = 20;
            const rcTotalW = this.relic_choices.length * rcW + (this.relic_choices.length - 1) * rcGap;
            const rcStartX = WIDTH/2 - rcTotalW/2;

            for (let ci = 0; ci < this.relic_choices.length; ci++) {
                const rl = this.relic_choices[ci];
                const cx = rcStartX + ci * (rcW + rcGap);
                const cy = 130;
                const isPick = (ci === this.relic_pick);

                const cbg = isPick ? [40,60,120] : [25,35,60];
                const cborder = isPick ? [100,180,255] : [50,70,110];
                fillRoundRect(cx, cy, rcW, rcH, 12, cbg);
                strokeRoundRect(cx, cy, rcW, rcH, 12, cborder, isPick ? 3 : 1);

                if (isPick) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(100,180,255,0.6)';
                    ctx.shadowBlur = 20;
                    fillRoundRect(cx, cy, rcW, rcH, 12, cbg);
                    ctx.restore();
                }

                fillText(rl.icon, cx + rcW/2, cy + 50, WHITE, '40px "Malgun Gothic", sans-serif', 'center');
                fillText(rl.name, cx + rcW/2, cy + 85, [220,240,255], 'bold 16px "Malgun Gothic", sans-serif', 'center');
                fillText(rl.desc, cx + rcW/2, cy + 115, [150,180,220], '12px "Malgun Gothic", sans-serif', 'center');

                if (isPick) {
                    fillText('▲', cx + rcW/2, cy + rcH + 16, [100,180,255], 'bold 16px "Malgun Gothic", sans-serif', 'center');
                }
            }

            const isMobileRC = ('ontouchstart' in window);
            if (!isMobileRC) {
                fillText('← → 선택  |  Space 확정', WIDTH/2, 340, [120,140,170], '12px "Malgun Gothic", sans-serif', 'center');
            } else {
                fillText('카드를 터치하여 선택', WIDTH/2, 340, [120,140,170], '14px "Malgun Gothic", sans-serif', 'center');
            }
        }

        // Relic result popup
        if (this.relic_result_timer > 0) {
            const fade = Math.min(1, this.relic_result_timer / 30);
            ctx.fillStyle = `rgba(0,0,30,${(0.63*fade).toFixed(2)})`;
            ctx.fillRect(0,0,WIDTH,HEIGHT);

            const rl = this.relic_result;
            const popY = HEIGHT/2 - 60;
            fillRoundRect(60, popY, WIDTH-120, 120, 12, [20,30,60]);
            strokeRoundRect(60, popY, WIDTH-120, 120, 12, [100,180,255], 2);
            fillText("유물 획득!", WIDTH/2, popY + 20, [100,180,255], 'bold 16px "Malgun Gothic", sans-serif', 'center');
            fillText(`${rl.icon}`, WIDTH/2, popY + 55, WHITE, '36px "Malgun Gothic", sans-serif', 'center');
            fillText(rl.name, WIDTH/2, popY + 80, [220,240,255], 'bold 20px "Malgun Gothic", sans-serif', 'center');
            fillText(rl.desc, WIDTH/2, popY + 102, [150,180,220], '14px "Malgun Gothic", sans-serif', 'center');
        }

        // Gacha result popup
        if (this.gacha_result_timer > 0) {
            const fade = Math.min(1, this.gacha_result_timer / 30);
            ctx.fillStyle = `rgba(0,0,30,${(0.63*fade).toFixed(2)})`;
            ctx.fillRect(0,0,WIDTH,HEIGHT);

            const bt = this.gacha_result;
            const rarity = bt.rarity;
            const rc = RARITY_COLORS[rarity];
            const cx = WIDTH/2, cy = HEIGHT/2 - 30;

            if (rarity >= 1) {
                const num = rarity*6+4;
                for (let i2=0;i2<num;i2++) {
                    const ang = this.t*0.06+i2*Math.PI*2/num;
                    const dist = 50+Math.sin(this.t*0.1+i2)*12;
                    const sr = 2+Math.sin(this.t*0.2+i2*0.7);
                    fillCircle(cx+dist*Math.cos(ang), cy+dist*Math.sin(ang), Math.max(1,sr), rc);
                }
            }

            const glow_r = 55+Math.sin(this.t*0.15)*8;
            ctx.fillStyle = rgba(rc, 0.18*fade);
            ctx.beginPath(); ctx.arc(cx, cy, glow_r*2, 0, Math.PI*2); ctx.fill();

            fillCircle(cx, cy, 24, bt.color);
            fillCircle(cx-6, cy-6, 7, WHITE);
            strokeCircle(cx, cy, 24, rc, 2);

            fillText(`[ ${bt.rarity_name} ]`, cx, cy-42, rc, '14px "Malgun Gothic", sans-serif', 'center');
            fillText(bt.name, cx, cy+55, WHITE, '26px "Malgun Gothic", sans-serif', 'center');
            fillText(bt.desc, cx, cy+82, [180,200,230], '14px "Malgun Gothic", sans-serif', 'center');
        }
    }

    _draw_gameover() {
        this._draw_bg();
        if (this._testMode) {
            fillText("[ 테스트 모드 ]", WIDTH/2, 230, BALATRO_ORANGE, '16px "Malgun Gothic", sans-serif', 'center');
        }
        fillText("게임 오버", WIDTH/2, 270, [255,100,100], '42px "Malgun Gothic", sans-serif', 'center');
        const goAnte = this._get_ante();
        const goStage = this._get_stage();
        fillText(`앤티 ${goAnte} - ${goStage}/3  (라운드 ${this.round_num})`, WIDTH/2, 330, GOLD_C, '22px "Malgun Gothic", sans-serif', 'center');
        fillText(`최종 점수: ${this.score.toLocaleString()}`, WIDTH/2, 380, WHITE, '20px "Malgun Gothic", sans-serif', 'center');

        if (!this._testMode && this.score >= this.high_score && this.score > 0) {
            fillText("새로운 최고 기록!", WIDTH/2, 420, GOLD_C, '20px "Malgun Gothic", sans-serif', 'center');
        }

        let upgrade_y = 470;
        const has_upgrades = Object.values(this.upgrades).some(v => v > 0);
        if (has_upgrades) {
            fillText("이번 런 업그레이드:", WIDTH/2, upgrade_y, [150,180,220], '14px "Malgun Gothic", sans-serif', 'center');
            upgrade_y += 22;
            for (const item of SHOP_ITEMS) {
                const lv = this.upgrades[item.id];
                if (lv > 0) {
                    fillText(`${item.name} Lv.${lv}`, WIDTH/2, upgrade_y, SKY_SEA, '14px "Malgun Gothic", sans-serif', 'center');
                    upgrade_y += 18;
                }
            }
        }

        if (Math.floor(this.t/40)%2) {
            fillText("스페이스 키로 메뉴로", WIDTH/2, HEIGHT-80, WHITE, '20px "Malgun Gothic", sans-serif', 'center');
        }
    }

    _draw_victory() {
        this._draw_bg();

        // Celebration particles
        if (this.t % 5 === 0) {
            for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(
                    randUniform(30, WIDTH - 30), randUniform(100, 400),
                    randUniform(-3, 3), randUniform(-4, -1),
                    randChoice([GOLD_C, [255,220,100], [100,255,200], [100,180,255], [255,150,200]]),
                    randInt(30, 60), randInt(2, 6)));
            }
        }
        for (const p of this.particles) { p.update(); p.draw(); }

        // Gold shimmer overlay
        ctx.fillStyle = 'rgba(255,220,80,0.03)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        const y_off = Math.sin(this.t * 0.06) * 5;

        fillText("🎉", WIDTH/2, 180 + y_off, WHITE, '60px "Malgun Gothic", sans-serif', 'center');
        fillText("게임 클리어!", WIDTH/2, 260 + y_off, GOLD_C, '42px "Malgun Gothic", sans-serif', 'center');
        fillText("8앤티를 모두 돌파했습니다!", WIDTH/2, 310, [200, 230, 255], '18px "Malgun Gothic", sans-serif', 'center');

        fillText(`최종 점수: ${this.score.toLocaleString()}`, WIDTH/2, 370, WHITE, '22px "Malgun Gothic", sans-serif', 'center');
        fillText(`도달 라운드: ${this.round_num}`, WIDTH/2, 405, [180, 200, 230], '16px "Malgun Gothic", sans-serif', 'center');

        if (!this._testMode && this.score > 0) {
            if (this.score >= this.high_score) {
                fillText("🏆 새로운 최고 기록!", WIDTH/2, 445, GOLD_C, 'bold 20px "Malgun Gothic", sans-serif', 'center');
            }
        }

        // Upgrades summary
        let uy = 490;
        const has_upgrades = Object.values(this.upgrades).some(v => v > 0);
        if (has_upgrades) {
            fillText("이번 런 업그레이드:", WIDTH/2, uy, [150,180,220], '14px "Malgun Gothic", sans-serif', 'center');
            uy += 20;
            for (const item of SHOP_ITEMS) {
                const lv = this.upgrades[item.id];
                if (lv > 0) {
                    fillText(`${item.icon} ${item.name} Lv.${lv}`, WIDTH/2, uy, SKY_SEA, '13px "Malgun Gothic", sans-serif', 'center');
                    uy += 17;
                }
            }
        }

        if (Math.floor(this.t / 35) % 2) {
            fillText("스페이스 키로 메뉴로", WIDTH/2, HEIGHT - 80, WHITE, '18px "Malgun Gothic", sans-serif', 'center');
        }
    }

    _draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        if (this.state === 'menu') this._draw_menu();
        else if (this.state === 'test_setup') this._draw_test_setup();
        else if (this.state === 'gameover') this._draw_gameover();
        else if (this.state === 'victory') this._draw_victory();
        else if (this.state === 'round_clear') this._draw_round_clear();
        else if (this.state === 'shop') this._draw_shop();
        else if (this.state === 'play') {
            this._draw_bg();
            this._draw_walls();
            for (const sl of this.slings) sl.draw(this.t);
            for (const dt of this.drops) dt.draw(this.t);
            for (const bm of this.bumpers) bm.draw(this.t);
            if (this.boss) this.boss.draw(this.t);
            this.pin.draw(this.t);
            this.spinner.draw(this.t);
            this.lf.draw(); this.rf.draw();
            for (const ball of this.balls) ball.draw(this.t);

            // Magnet zone
            const bt_eff_draw = (this.current_ball_type || {}).effects || {};
            if (bt_eff_draw.magnet) {
                const pulse = (15 + 10*Math.sin(this.t*0.08))/255;
                ctx.fillStyle = rgba([255,60,60], pulse);
                ctx.fillRect(30, 600, TABLE_R-30, HEIGHT-600);
                const cx2 = 250;
                for (let yy=610; yy<HEIGHT-20; yy+=12) {
                    const wave = Math.sin(this.t*0.15+yy*0.03)*8;
                    const alpha2 = Math.min(0.31, (40+(yy-610)*0.3)/255);
                    ctx.fillStyle = rgba([255,100,100], alpha2);
                    ctx.beginPath(); ctx.arc(cx2+wave, yy, 2, 0, Math.PI*2); ctx.fill();
                }
            }

            // Feather particles
            if ((bt_eff_draw.gravity_mult || 1.0) < 0.9) {
                for (let k=0;k<6;k++) {
                    const fx = (this.t*0.4+k*80)%WIDTH;
                    const fy = (this.t*0.2+k*120+Math.sin(this.t*0.03+k)*30)%HEIGHT;
                    ctx.fillStyle = rgba([200,230,255], 0.2);
                    ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = rgba([220,240,255], 0.12);
                    ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI*2); ctx.fill();
                }
            }

            this.plunger.draw();
            for (const p of this.particles) p.draw();
            for (const p of this.popups) p.draw();
            this.bonus.draw();
            this._draw_ui();
        }

        // CRT Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y=0; y<HEIGHT; y+=3) {
            ctx.fillRect(0, y, WIDTH, 1);
        }
    }

    // ============================================================
    //  MOBILE TOUCH CONTROLS
    // ============================================================
    _drawTouchControls() {
        if (this.state === 'play' && this._isMobile) {
            // Left flipper zone
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, HEIGHT*0.5, WIDTH*0.35, HEIGHT*0.5);
            // Right flipper zone
            ctx.fillRect(WIDTH*0.65, HEIGHT*0.5, WIDTH*0.35, HEIGHT*0.5);
            // Plunger zone
            ctx.fillStyle = 'rgba(255,200,40,0.08)';
            ctx.fillRect(WIDTH*0.35, HEIGHT*0.75, WIDTH*0.3, HEIGHT*0.25);

            // Labels
            ctx.globalAlpha = 0.25;
            fillText("L", WIDTH*0.175, HEIGHT*0.55, WHITE, 'bold 28px sans-serif', 'center');
            fillText("R", WIDTH*0.825, HEIGHT*0.55, WHITE, 'bold 28px sans-serif', 'center');
            if (this.ball_in_p) fillText("▲", WIDTH*0.5, HEIGHT*0.88, BALATRO_GOLD, 'bold 24px sans-serif', 'center');
            ctx.globalAlpha = 1;
        }

        if (this.state === 'shop') {
            // Bottom bar: Buy button + Next round hold button
            const btnH = 50;
            const buyW = WIDTH * 0.45;
            const nrW2 = WIDTH * 0.45;

            // Buy/Draw button
            const buyLabel = this.shop_tab === 0 ? "강화 뽑기" : (this.shop_tab === 1 ? "소모품 뽑기" : (this.shop_tab === 2 ? "공 뽑기" : "유물 뽑기"));
            fillRoundRect(10, HEIGHT-btnH-5, buyW, btnH-5, 8, [60,80,40]);
            strokeRoundRect(10, HEIGHT-btnH-5, buyW, btnH-5, 8, [120,180,80], 2);
            fillText(buyLabel, 10+buyW/2, HEIGHT-btnH+22, BALATRO_GOLD, 'bold 18px "Malgun Gothic",sans-serif', 'center');

            // Next round (hold button with progress)
            const nrX = WIDTH-nrW2-10, nrY = HEIGHT-btnH-5, nrH2 = btnH-5;
            const holdProg = this._nextRoundHold / this._nextRoundRequired;
            fillRoundRect(nrX, nrY, nrW2, nrH2, 8, [80,40,40]);
            if (holdProg > 0) {
                const fillH2 = Math.round(nrH2 * holdProg);
                ctx.save();
                roundRect(nrX, nrY, nrW2, nrH2, 8);
                ctx.clip();
                fillRect(nrX, nrY+nrH2-fillH2, nrW2, fillH2, [180,80,80]);
                ctx.restore();
            }
            strokeRoundRect(nrX, nrY, nrW2, nrH2, 8, holdProg > 0 ? [255,120,120] : [180,80,80], 2);
            fillText(holdProg > 0 ? `꾹! ${Math.round(holdProg*100)}%` : "다음 라운드 ▸", nrX+nrW2/2, nrY+nrH2/2+6, WHITE, 'bold 15px "Malgun Gothic",sans-serif', 'center');
        }
    }

    _setupTouch() {
        // Detect mobile
        this._isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this._activeTouches = {};
        this._plungerTouch = null;

        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            this._isMobile = true; // confirmed touch device
            if (!audioCtx) initAudio();
            for (const touch of e.changedTouches) {
                const [tx, ty] = this._touchPos(touch);
                this._activeTouches[touch.identifier] = {x:tx, y:ty, startY:ty};
                this._handleTouchStart(tx, ty, touch.identifier);
            }
        }, {passive:false});

        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const [tx, ty] = this._touchPos(touch);
                if (this._activeTouches[touch.identifier]) {
                    this._activeTouches[touch.identifier].x = tx;
                    this._activeTouches[touch.identifier].y = ty;
                }
                this._handleTouchMove(tx, ty, touch.identifier);
            }
        }, {passive:false});

        canvas.addEventListener('touchend', e => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const [tx, ty] = this._touchPos(touch);
                this._handleTouchEnd(tx, ty, touch.identifier);
                delete this._activeTouches[touch.identifier];
            }
        }, {passive:false});
    }

    _touchPos(touch) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = WIDTH / rect.width;
        const scaleY = HEIGHT / rect.height;
        return [(touch.clientX - rect.left)*scaleX, (touch.clientY - rect.top)*scaleY];
    }

    _handleTouchStart(x, y, id) {
        if (this.state === 'menu') {
            this._onKeyDown('Space');
            return;
        }
        if (this.state === 'gameover' || this.state === 'victory' || this.state === 'round_clear') {
            this._onKeyDown('Space');
            return;
        }
        if (this.state === 'test_setup') {
            // Back button (top-left)
            if (x >= 10 && x <= 70 && y >= 15 && y <= 45) {
                this.state = 'menu';
                return;
            }

            const startY = 300, gap = 70, boxW = 360, boxH = 50;
            const bxStart = WIDTH/2 - boxW/2;
            const btnSize = 36;

            for (let i = 0; i < 3; i++) {
                const iy = startY + i * gap;
                if (y >= iy - boxH/2 && y <= iy + boxH/2) {
                    this._testCursor = i;
                    if (i < 2) {
                        const valCenterX = bxStart + boxW - 90;
                        const minusBx = valCenterX - 70 - btnSize/2;
                        const plusBx = valCenterX + 70 - btnSize/2;
                        // Check minus button
                        if (x >= minusBx && x <= minusBx + btnSize) {
                            this._onKeyDown('ArrowLeft');
                        }
                        // Check plus button
                        else if (x >= plusBx && x <= plusBx + btnSize) {
                            this._onKeyDown('ArrowRight');
                        }
                    } else {
                        this._onKeyDown('Space');
                    }
                    return;
                }
            }
            return;
        }
        if (this.state === 'shop') {
            if (this._stateChangeCooldown > 0) return; // ignore touch during cooldown

            // Upgrade choice overlay touch - must pick one
            if (this.upgrade_choices) {
                const cardW = 150, cardH = 200, gap = 20;
                const totalCW = this.upgrade_choices.length * cardW + (this.upgrade_choices.length - 1) * gap;
                const startCX = WIDTH/2 - totalCW/2;
                const cy = 130;

                for (let ci = 0; ci < this.upgrade_choices.length; ci++) {
                    const cx = startCX + ci * (cardW + gap);
                    if (x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH) {
                        this.upgrade_pick = ci;
                        this._upgrade_pick_confirm();
                        return;
                    }
                }
                return; // ignore all other touches, must pick a card
            }

            // Relic choice overlay touch - must pick one
            if (this.relic_choices) {
                const rcW = 150, rcH = 180, rcGap = 20;
                const rcTotalCW = this.relic_choices.length * rcW + (this.relic_choices.length - 1) * rcGap;
                const rcStartCX = WIDTH/2 - rcTotalCW/2;
                const rcy = 130;

                for (let ci = 0; ci < this.relic_choices.length; ci++) {
                    const cx = rcStartCX + ci * (rcW + rcGap);
                    if (x >= cx && x <= cx + rcW && y >= rcy && y <= rcy + rcH) {
                        this.relic_pick = ci;
                        this._relic_pick_confirm();
                        return;
                    }
                }
                return; // ignore all other touches, must pick a card
            }

            // Tab bar touch (y: 95 to 123)
            const tabY = 95, tabH = 28, tabW = (WIDTH - 40) / 4;
            if (y >= tabY && y <= tabY + tabH) {
                const ti = Math.floor((x - 20) / tabW);
                if (ti >= 0 && ti < 4 && ti !== this.shop_tab) {
                    this.shop_tab = ti;
                    this.shop_cursor = 0;
                }
                return;
            }

            // Bottom buttons
            const btnH = 50;
            const buyW = WIDTH * 0.45;
            const nrW2 = WIDTH * 0.45;
            // Buy button
            if (x < buyW + 10 && y > HEIGHT - btnH - 5) {
                this._onKeyDown('Space'); return;
            }
            // Next round button (hold to activate)
            if (x > WIDTH - nrW2 - 10 && y > HEIGHT - btnH - 5) {
                this._nextRoundHolding = true;
                this._nextRoundTouchId = id;
                return;
            }

            // Content area touch - select item
            const content_y = tabY + tabH + 10;
            if (y >= content_y && y < HEIGHT - btnH - 10) {
                if (this.shop_tab === 0) {
                    this.shop_cursor = 0; // only 1 item (draw button)
                } else if (this.shop_tab === 1) {
                    this.shop_cursor = 0; // only 1 item (draw button)
                } else if (this.shop_tab === 2) {
                    // 3 slot cards: determine which slot was touched
                    const slotH = 72, slotGap = 8;
                    const relY = y - content_y;
                    const slotIdx = Math.floor(relY / (slotH + slotGap));
                    this.shop_cursor = Math.max(0, Math.min(2, slotIdx));
                } else if (this.shop_tab === 3) {
                    this.shop_cursor = 0; // only 1 item (draw button)
                }
            }
            return;
        }
        if (this.state === 'play') {
            // Consumable pause menu is open
            if (this.consumable_open) {
                const cardW = 80, cardH = 120, cardGap = 10;
                const invLen = this.consumable_inv.length;
                const totalW2 = invLen * (cardW + cardGap) - cardGap;
                const startX2 = WIDTH/2 - totalW2/2;
                const cardY2 = 210;

                // Card touch
                if (y >= cardY2 && y <= cardY2 + cardH && invLen > 0) {
                    const slot = Math.floor((x - startX2) / (cardW + cardGap));
                    if (slot >= 0 && slot < invLen) {
                        this.consumable_cursor = slot;
                        this._use_consumable(slot);
                        if (this.consumable_inv.length > 0)
                            this.consumable_cursor = Math.min(this.consumable_cursor, this.consumable_inv.length - 1);
                    }
                    return;
                }

                // "메인 화면으로" button touch (y: 470~510)
                if (y >= 470 && y <= 510 && x >= WIDTH/2 - 70 && x <= WIDTH/2 + 70) {
                    this.consumable_open = false;
                    this.state = 'menu';
                    return;
                }

                // Close button (y: 430~470)
                if (y >= 430 && y <= 470 && x >= WIDTH/2 - 60 && x <= WIDTH/2 + 60) {
                    this.consumable_open = false;
                    return;
                }

                // Tap anywhere else to close
                if (y < cardY2 - 20 || y > cardY2 + cardH + 120) {
                    this.consumable_open = false;
                }
                return;
            }

            // Consumable box button touch (y: 40 ~ 68)
            if (y >= 40 && y <= 68) {
                const boxW = 80, boxX = WIDTH/2 - boxW/2;
                if (x >= boxX && x <= boxX + boxW) {
                    this.consumable_open = true;
                    this.consumable_cursor = 0;
                    return;
                }
            }

            // Left flipper zone: left 35%
            if (x < WIDTH*0.35 && y > HEIGHT*0.5) {
                this._flipper_on('left'); return;
            }
            // Right flipper zone: right 35%
            if (x > WIDTH*0.65 && y > HEIGHT*0.5) {
                this._flipper_on('right'); return;
            }
            // Plunger zone: center bottom
            if (x > WIDTH*0.35 && x < WIDTH*0.65 && y > HEIGHT*0.75) {
                if (this.ball_in_p) {
                    this.plunger.charging = true;
                    this._plungerTouch = id;
                }
                return;
            }
            // Tilt: swipe left/right in top half
            if (y < HEIGHT*0.5 && !this.tilt_lock) {
                if (x < WIDTH*0.3) { this.tilt_x = -0.15; this.tilt_cnt++; }
                else if (x > WIDTH*0.7) { this.tilt_x = 0.15; this.tilt_cnt++; }
                if (this.tilt_cnt >= 5) { this.tilt_lock = true; this.tilt_x = 0; }
            }
        }
    }

    _handleTouchMove(x, y, id) {
        // Nothing special needed
    }

    _handleTouchEnd(x, y, id) {
        // Cancel next round hold if this touch was holding it
        if (id === this._nextRoundTouchId) {
            this._nextRoundHolding = false;
            this._nextRoundHold = 0;
            this._nextRoundTouchId = null;
        }
        if (this.state === 'play') {
            // Release flippers
            let anyLeft = false, anyRight = false;
            for (const [tid, t] of Object.entries(this._activeTouches)) {
                if (parseInt(tid) === id) continue;
                if (t.x < WIDTH*0.35 && t.y > HEIGHT*0.5) anyLeft = true;
                if (t.x > WIDTH*0.65 && t.y > HEIGHT*0.5) anyRight = true;
            }
            if (!anyLeft) this._flipper_off('left');
            if (!anyRight) this._flipper_off('right');

            // Plunger release
            if (id === this._plungerTouch) {
                if (this.ball_in_p && this.plunger.charging) {
                    for (const b of this.balls) {
                        if (Math.abs(b.x - this.plunger.x) < 20 && b.y > 700) {
                            b.vy = this.plunger.launch_speed();
                            b.vx = randUniform(-0.5, 0.5);
                        }
                    }
                    this.ball_in_p = false;
                    this.plunger.charging = false;
                    sndLaunch();
                }
                this._plungerTouch = null;
            }

            this.tilt_x = 0;
        }
    }

    _resizeCanvas() {
        const ratio = WIDTH / HEIGHT;
        let w = window.innerWidth, h = window.innerHeight;
        if (w / h > ratio) { w = h * ratio; }
        else { h = w / ratio; }
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    }

    run() {
        this._setupTouch();
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        // Fixed 60fps timestep
        const frameDur = 1000 / FPS;
        let lastTime = performance.now();
        let accumulator = 0;

        const loop = (now) => {
            const delta = now - lastTime;
            lastTime = now;
            // Cap delta to avoid spiral of death
            accumulator += Math.min(delta, 200);

            while (accumulator >= frameDur) {
                this._update();
                if (this.state !== 'play') this.t++;
                accumulator -= frameDur;
            }

            this._draw();
            this._drawTouchControls();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
