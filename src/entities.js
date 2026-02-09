// ============================================================
//  BALL
// ============================================================
class Ball {
    constructor(x, y, vx=0, vy=0, ballType=null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.active = true; this.trail = [];
        this.in_lane = (x > TABLE_R);
        this.ball_type = ballType;
    }
    step(tilt_x=0, dt=0.5, gravity=GRAVITY) {
        this.vy += gravity * dt;
        this.vx += tilt_x * dt;
        let spd = Math.hypot(this.vx, this.vy);
        if (spd > MAX_SPEED) { const f = MAX_SPEED/spd; this.vx*=f; this.vy*=f; }
        this.vx *= (1 - 0.001*dt);
        this.vy *= (1 - 0.001*dt);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
    collide_walls(walls) {
        let hitAny = false;
        for (const [[ax,ay],[bx,by]] of walls) {
            const {hit, n, pen} = seg_circ(this.x, this.y, BALL_R, ax, ay, bx, by);
            if (hit) {
                this.x += n[0]*pen; this.y += n[1]*pen;
                const vn = v_dot([this.vx,this.vy], n);
                if (vn < 0) {
                    this.vx -= 2*vn*n[0]*0.7;
                    this.vy -= 2*vn*n[1]*0.7;
                    hitAny = true;
                }
            }
        }
        return hitAny;
    }
    update_trail() {
        this.trail.push([this.x, this.y]);
        const bid = this.ball_type ? this.ball_type.id : 'normal';
        const maxTrail = ['fire','feather','magnet','combo','ghost'].includes(bid) ? 14 : 8;
        while (this.trail.length > maxTrail) this.trail.shift();
    }
    draw(t) {
        const bt = this.ball_type;
        const main_c = bt ? bt.color : PEARL;
        const trail_c = bt ? bt.trail : PEARL2;
        const outline_c = bt ? lerp_col(main_c, BLACK, 0.3) : PEARL2;
        const bid = bt ? bt.id : 'normal';
        const trail_len = this.trail.length;

        // --- Trail ---
        for (let i = 0; i < trail_len; i++) {
            const [tx, ty] = this.trail[i];
            const a = (i+1) / Math.max(trail_len, 1);
            if (bid === 'feather') {
                const wave = Math.sin(t*0.15+i*0.8)*4;
                const r = Math.max(1, Math.round(BALL_R*a*0.6));
                fillCircle(tx+wave, ty, r, lerp_col([180,220,255], trail_c, a));
                if (i%2===0) fillCircle(tx+wave*1.5, ty-2, Math.max(1,Math.floor(r/2)), [240,250,255]);
            } else if (bid === 'heavy') {
                const r = Math.max(2, Math.round(BALL_R*a*0.7));
                fillCircle(tx, ty, r, lerp_col([100,90,70], trail_c, a));
            } else if (bid === 'magnet') {
                const r = Math.max(1, Math.round(BALL_R*a*0.5));
                const jx = a>0.3 ? randUniform(-2,2) : 0;
                const jy = a>0.3 ? randUniform(-2,2) : 0;
                fillCircle(tx+jx, ty+jy, r, lerp_col([100,30,30], trail_c, a));
                if (i>0 && a>0.4) {
                    const [px, py] = this.trail[i-1];
                    drawLine(px+jx, py+jy, tx+jx, ty+jy, [255,120,120], 1);
                }
            } else if (bid === 'combo') {
                const hue = (t*2+i*30)%360;
                const rc = hslToRgb(hue, 80, 60);
                const r = Math.max(1, Math.round(BALL_R*a*0.5));
                fillCircle(tx, ty, r, rc);
            } else if (bid === 'split') {
                const r = Math.max(1, Math.round(BALL_R*a*0.4));
                const c = lerp_col([80,40,120], trail_c, a);
                fillCircle(tx-2, ty, r, c); fillCircle(tx+2, ty, r, c);
            } else if (bid === 'fire') {
                const r = Math.max(2, Math.round(BALL_R*a*0.7));
                const flicker = randUniform(-2,2);
                fillCircle(tx+flicker, ty+flicker, r, lerp_col([200,50,0],[255,200,50], a));
            } else {
                const r = Math.max(1, Math.round(BALL_R*a*0.4));
                fillCircle(tx, ty, r, lerp_col(MID_SEA, trail_c, a));
            }
        }

        // --- Pre-ball glow effects ---
        if (bid === 'ghost') {
            const alpha = (50 + 30*Math.sin(t*0.12)) / 255;
            ctx.fillStyle = rgba(main_c, alpha);
            ctx.beginPath(); ctx.arc(this.x, this.y, BALL_R*4, 0, Math.PI*2); ctx.fill();
        }
        if (bid === 'feather') {
            for (let k=0;k<3;k++) {
                const fa = t*0.06+k*2.1;
                const fx = this.x + Math.sin(fa)*12;
                const fy = this.y - 8 - (t*0.3+k*5)%20;
                fillCircle(fx, fy, 2, [200,230,255]);
            }
        }
        if (bid === 'magnet') {
            for (let k=0;k<4;k++) {
                const ang = t*0.1+k*Math.PI/2;
                const ex = this.x + (BALL_R+6)*Math.cos(ang);
                const ey = this.y + (BALL_R+6)*Math.sin(ang);
                const pulse = Math.sin(t*0.2+k)*3;
                drawLine(
                    this.x + BALL_R*0.7*Math.cos(ang), this.y + BALL_R*0.7*Math.sin(ang),
                    ex+pulse, ey+pulse, [255,100,100], 2);
            }
        }
        if (bid === 'heavy') {
            const spd = Math.hypot(this.vx, this.vy);
            if (spd > 3) strokeCircle(this.x, this.y, BALL_R+3+spd*0.3, [120,100,70], 2);
        }
        if (bid === 'combo') {
            for (let k=0;k<8;k++) {
                const ang = t*0.1+k*Math.PI/4;
                const hue = (t*3+k*45)%360;
                const rc = hslToRgb(hue, 90, 60);
                fillCircle(this.x+(BALL_R+3)*Math.cos(ang), this.y+(BALL_R+3)*Math.sin(ang), 2, rc);
            }
        }
        if (bid === 'split') {
            for (let k=0;k<2;k++) {
                const ang = t*0.12+k*Math.PI;
                const ox = this.x+(BALL_R+5)*Math.cos(ang);
                const oy = this.y+(BALL_R+5)*Math.sin(ang);
                fillCircle(ox, oy, 3, [150,80,230]);
                fillCircle(ox, oy, 2, [200,160,255]);
            }
        }
        if (bid === 'fire') {
            for (let k=0;k<5;k++) {
                const fa = randUniform(0, Math.PI*2);
                const fd = BALL_R + randUniform(2,8);
                const fx = this.x + fd*Math.cos(fa);
                const fy = this.y + fd*Math.sin(fa) - randUniform(0,4);
                fillCircle(fx, fy, randInt(1,3), randChoice([[255,200,50],[255,120,30],[255,80,10]]));
            }
        }
        if (bid === 'golden') {
            ctx.fillStyle = rgba([255,220,50], 0.14);
            ctx.beginPath(); ctx.arc(this.x, this.y, BALL_R*3, 0, Math.PI*2); ctx.fill();
            for (let k=0;k<8;k++) {
                const ang = t*0.06+k*Math.PI/4;
                const dist = BALL_R+5+Math.sin(t*0.15+k)*3;
                const sz = 2+Math.sin(t*0.2+k*0.8);
                fillCircle(this.x+dist*Math.cos(ang), this.y+dist*Math.sin(ang), Math.max(1,sz), GOLD_C);
            }
        }

        // --- Evolution glow ---
        const evoLv = bt ? (bt.evo_level || 0) : 0;
        if (evoLv > 0) {
            const glowR = BALL_R + 3 + evoLv * 2;
            const pulse = Math.sin(t * 0.1) * 0.12;
            ctx.fillStyle = rgba(main_c, 0.18 + pulse);
            ctx.beginPath(); ctx.arc(this.x, this.y, glowR, 0, Math.PI*2); ctx.fill();
            if (evoLv >= 2) {
                ctx.fillStyle = rgba([255,255,200], 0.1 + pulse * 0.5);
                ctx.beginPath(); ctx.arc(this.x, this.y, glowR + 5, 0, Math.PI*2); ctx.fill();
                // Evolution ring
                for (let k = 0; k < 6; k++) {
                    const ang = t * 0.08 + k * Math.PI / 3;
                    const rx = this.x + (glowR + 3) * Math.cos(ang);
                    const ry = this.y + (glowR + 3) * Math.sin(ang);
                    fillCircle(rx, ry, 1.5, [255,255,200]);
                }
            }
        }

        // --- Main ball ---
        fillCircle(this.x, this.y, BALL_R, main_c);
        fillCircle(this.x-2, this.y-2, Math.max(1, Math.floor(BALL_R/3)), WHITE);
        strokeCircle(this.x, this.y, BALL_R, outline_c, 1);

        // Evolution star indicator
        if (evoLv > 0) {
            strokeCircle(this.x, this.y, BALL_R + 1, [255,255,150], 1);
        }
    }
}

// ============================================================
//  FLIPPER
// ============================================================
class Flipper {
    constructor(px, py, side, length=FLIP_LEN) {
        this.px=px; this.py=py; this.side=side; this.length=length;
        if (side==='left') { this.rest=0.45; this.act=-0.45; }
        else { this.rest=Math.PI-0.45; this.act=Math.PI+0.45; }
        this.angle=this.rest; this.prev_angle=this.rest; this.ang_v=0; this.on=false;
    }
    tip() {
        return [this.px+this.length*Math.cos(this.angle), this.py+this.length*Math.sin(this.angle)];
    }
    update() {
        this.prev_angle = this.angle;
        const tgt = this.on ? this.act : this.rest;
        const old = this.angle;
        const spd = this.on ? 0.18 : 0.10;
        const d = tgt - this.angle;
        if (Math.abs(d) < spd) this.angle = tgt;
        else this.angle += d > 0 ? spd : -spd;
        this.ang_v = this.angle - old;
    }
    collide_ball(ball, power_mult=1.0) {
        const [tx, ty] = this.tip();
        const {hit, n, pen} = seg_circ(ball.x, ball.y, BALL_R+FLIP_W/2, this.px, this.py, tx, ty);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const [cx, cy] = nearest_on_seg(ball.x, ball.y, this.px, this.py, tx, ty);
            const dist = Math.hypot(cx-this.px, cy-this.py);
            const fdir = v_nrm([tx-this.px, ty-this.py]);
            const perp = v_perp(fdir);
            const sv = [perp[0]*this.ang_v*dist, perp[1]*this.ang_v*dist];
            let rvx = ball.vx - sv[0], rvy = ball.vy - sv[1];
            const vn = v_dot([rvx, rvy], n);
            if (vn < 0) {
                ball.vx = rvx - 2*vn*n[0]*0.75*power_mult + sv[0];
                ball.vy = rvy - 2*vn*n[1]*0.75*power_mult + sv[1];
                const kick = Math.abs(this.ang_v)*dist*0.5*power_mult;
                ball.vx += n[0]*kick; ball.vy += n[1]*kick;
                return true;
            }
        }
        return false;
    }
    draw() {
        const [tx, ty] = this.tip();
        const dx = tx-this.px, dy = ty-this.py;
        const length = Math.hypot(dx, dy);
        if (length < 1) return;
        const ux = dx/length, uy = dy/length;
        const px = -uy, py = ux;
        const hw = FLIP_W/2+2;

        // Build flipper shape
        const pts1 = [], pts2 = [];
        for (let i=0; i<8; i++) {
            const t = i/7;
            const mx = this.px+dx*t, my = this.py+dy*t;
            const w = hw*Math.sin(t*Math.PI)*1.3+2;
            pts1.push([mx+px*w, my+py*w]);
        }
        for (let i=7; i>=0; i--) {
            const t = i/7;
            const mx = this.px+dx*t, my = this.py+dy*t;
            const w = hw*Math.sin(t*Math.PI)*1.3+2;
            pts2.push([mx-px*w, my-py*w]);
        }
        const allPts = [...pts1, ...pts2];

        ctx.fillStyle = rgb(SHELL_C);
        ctx.beginPath(); ctx.moveTo(allPts[0][0], allPts[0][1]);
        for (let i=1; i<allPts.length; i++) ctx.lineTo(allPts[i][0], allPts[i][1]);
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = rgb(SHELL_P); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(allPts[0][0], allPts[0][1]);
        for (let i=1; i<allPts.length; i++) ctx.lineTo(allPts[i][0], allPts[i][1]);
        ctx.closePath(); ctx.stroke();

        // Lines
        for (let i=1; i<6; i++) {
            const t = i/6;
            const sx = this.px+dx*t, sy = this.py+dy*t;
            const w = hw*Math.sin(t*Math.PI);
            drawLine(sx-px*w, sy-py*w, sx+px*w, sy+py*w, SHELL_P, 1);
        }

        fillCircle(this.px, this.py, 5, CORAL_D);
        fillCircle(this.px, this.py, 3, CORAL_C);
    }
}

// ============================================================
//  BUMPER
// ============================================================
// ============================================================
//  PIN (small dot bumper)
// ============================================================
class Pin {
    constructor(x, y, r=5, pts=50) {
        this.x=x; this.y=y; this.r=r; this.pts=pts; this.hit_t=0;
    }
    update() { if (this.hit_t > 0) this.hit_t--; }
    collide_ball(ball) {
        const {hit, n, pen} = circ_circ(ball.x, ball.y, BALL_R, this.x, this.y, this.r);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const spd = Math.max(3, Math.hypot(ball.vx, ball.vy));
            ball.vx = n[0]*spd*0.9; ball.vy = n[1]*spd*0.9;
            this.hit_t = 10; return true;
        }
        return false;
    }
    draw(t) {
        const c = this.hit_t > 0 ? WHITE : [180, 200, 220];
        fillCircle(this.x, this.y, this.r, c);
        strokeCircle(this.x, this.y, this.r, [120,140,160], 1);
        if (this.hit_t > 5) strokeCircle(this.x, this.y, this.r+4, [220,230,255], 1);
    }
}

class Bumper {
    constructor(x, y, r, style='puffer', pts=100) {
        this.x=x; this.y=y; this.r=r; this.style=style; this.pts=pts;
        this.hit_t=0; this.pulse=0;
    }
    update() { if (this.hit_t > 0) this.hit_t--; this.pulse += 0.05; }
    collide_ball(ball) {
        const {hit, n, pen} = circ_circ(ball.x, ball.y, BALL_R, this.x, this.y, this.r);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const spd = Math.max(4, Math.hypot(ball.vx, ball.vy));
            ball.vx = n[0]*spd*1.1; ball.vy = n[1]*spd*1.1;
            this.hit_t = 15; return true;
        }
        return false;
    }
    draw(t) {
        const hr = this.r + (this.hit_t > 0 ? 3 : 0);
        const p = Math.sin(this.pulse)*2;
        if (this.style === 'puffer') {
            const bc = this.hit_t > 8 ? WHITE : PUFFER_Y;
            for (let i=0;i<12;i++) {
                const ang = i*Math.PI*2/12+t*0.05;
                fillCircle(this.x+(hr+p+2)*Math.cos(ang), this.y+(hr+p+2)*Math.sin(ang), 3, PUFFER_D);
            }
            fillCircle(this.x, this.y, hr+p, bc);
            // Eyes
            const ex_off = hr*0.35, ey = this.y - hr*0.1;
            fillCircle(this.x-ex_off, ey, 7, WHITE);
            fillCircle(this.x+ex_off, ey, 7, WHITE);
            fillCircle(this.x-ex_off, ey, 3, BLACK);
            fillCircle(this.x+ex_off, ey, 3, BLACK);
            fillCircle(this.x-ex_off-1, ey-1, 1, WHITE);
            fillCircle(this.x+ex_off-1, ey-1, 1, WHITE);
            // Cheeks
            fillCircle(this.x-ex_off-2, ey+5, 3, [255,180,180]);
            fillCircle(this.x+ex_off+2, ey+5, 3, [255,180,180]);
            if (this.hit_t > 10) strokeCircle(this.x, this.y, hr+10, [255,255,200], 2);
        } else {
            const bc = this.hit_t > 0 ? [240,220,255] : JELLY_P;
            // Ellipse approximation
            ctx.fillStyle = rgb(bc);
            ctx.beginPath(); ctx.ellipse(this.x, this.y, hr+p, hr*0.6, 0, 0, Math.PI*2); ctx.fill();
            fillCircle(this.x-6, this.y-5, 2, BLACK);
            fillCircle(this.x+6, this.y-5, 2, BLACK);
            fillCircle(this.x-10, this.y+2, 3, [255,150,150]);
            fillCircle(this.x+10, this.y+2, 3, [255,150,150]);
            if (this.hit_t > 0) {
                const gr = hr+8+this.hit_t;
                ctx.fillStyle = rgba(JELLY_B, 0.2);
                ctx.beginPath(); ctx.arc(this.x, this.y, gr, 0, Math.PI*2); ctx.fill();
            }
            // Tentacles
            for (let i=0;i<5;i++) {
                const tx2 = this.x - hr*0.5+i*(hr*0.25);
                const ty2 = this.y + hr*0.4;
                const off = Math.sin(t*0.1+i)*5;
                drawLine(tx2, ty2, tx2+off, ty2+10, JELLY_K, 3);
                fillCircle(tx2+off, ty2+10, 2, JELLY_K);
            }
        }
    }
}

// ============================================================
//  BOSS (trash theme, appears every 3rd round)
// ============================================================
const BOSS_GOLD_REWARD = 3;
class Boss {
    constructor(x, y, ante) {
        this.x = x; this.y = y;
        this.r = 30 + ante * 3; // grows with ante
        this.max_hp = 3 + ante; // ante1=4, ante2=5, ante3=6...
        this.hp = this.max_hp;
        this.alive = true;
        this.hit_t = 0;
        this.wobble = 0;
        this.death_t = 0; // death animation timer
        this.ante = ante;
        this.base_y = y;

        // Movement (ante 2+)
        this.moves = ante >= 2;
        this.move_t = 0;
        this.move_speed = 0.008 + ante * 0.003; // faster at higher ante
        this.move_range_x = 60 + ante * 10; // wider at higher ante
        this.move_range_y = 20 + ante * 5;

        this.heal_flash = 0;

        // Boss debuff abilities (ante 3+)
        this.debuff = null; // current active debuff
        this.debuff_timer = 0;
        this.debuff_cooldown = 0;
        this._pick_debuffs(ante);
    }
    _pick_debuffs(ante) {
        // Ante 3+: boss has debuff abilities
        this.debuff_pool = [];
        if (ante >= 3) this.debuff_pool.push('gravity_up');   // increase gravity
        if (ante >= 4) this.debuff_pool.push('flip_reverse'); // reverse flippers
        if (ante >= 5) this.debuff_pool.push('heal');           // boss heals 1 HP
        if (ante >= 6) this.debuff_pool.push('flip_lock_left', 'flip_lock_right'); // lock one flipper
    }
    update() {
        if (this.hit_t > 0) this.hit_t--;
        if (this.heal_flash > 0) this.heal_flash--;
        this.wobble += 0.04;
        if (!this.alive && this.death_t > 0) this.death_t--;

        // Movement
        if (this.alive && this.moves) {
            this.move_t += this.move_speed;
            this.x = WIDTH / 2 + Math.sin(this.move_t) * this.move_range_x;
            this.y = this.base_y + Math.sin(this.move_t * 0.7) * this.move_range_y;
        }

        // Debuff logic
        if (this.alive && this.debuff_pool.length > 0) {
            if (this.debuff_timer > 0) {
                this.debuff_timer--;
                if (this.debuff_timer <= 0) this.debuff = null;
            } else if (this.debuff_cooldown > 0) {
                this.debuff_cooldown--;
            } else {
                // Activate random debuff
                this.debuff = this.debuff_pool[Math.floor(Math.random() * this.debuff_pool.length)];
                if (this.debuff === 'heal') {
                    // Instant heal, no duration
                    if (this.hp < this.max_hp) {
                        this.hp++;
                        this.heal_flash = 30; // signal for visual effect
                    }
                    this.debuff = null;
                    this.debuff_cooldown = 300;
                } else {
                    this.debuff_timer = 180; // ~3 seconds
                    this.debuff_cooldown = 300; // ~5 seconds between debuffs
                }
            }
        }
        if (!this.alive) this.debuff = null;
    }
    collide_ball(ball) {
        if (!this.alive) return false;
        const {hit, n, pen} = circ_circ(ball.x, ball.y, BALL_R, this.x, this.y, this.r);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const spd = Math.max(4, Math.hypot(ball.vx, ball.vy));
            ball.vx = n[0]*spd*0.9; ball.vy = n[1]*spd*0.9;
            this.hp--;
            this.hit_t = 12;
            if (this.hp <= 0) {
                this.alive = false;
                this.death_t = 60;
            }
            return true;
        }
        return false;
    }
    draw(t) {
        if (!this.alive) {
            // Death explosion animation
            if (this.death_t > 0) {
                const prog = this.death_t / 60;
                const er = this.r * (2 - prog);
                ctx.globalAlpha = prog * 0.6;
                fillCircle(this.x, this.y, er, [120, 100, 80]);
                // Debris
                for (let i = 0; i < 8; i++) {
                    const a = i * Math.PI * 2 / 8 + t * 0.05;
                    const dr = er * (1.2 + (1 - prog) * 0.8);
                    const dx = this.x + Math.cos(a) * dr;
                    const dy = this.y + Math.sin(a) * dr;
                    fillCircle(dx, dy, 3 + prog * 4, [90, 80, 60]);
                }
                ctx.globalAlpha = 1;
            }
            return;
        }
        const hr = this.r + (this.hit_t > 0 ? 4 : 0);
        const wx = Math.sin(this.wobble) * 2;
        const wy = Math.cos(this.wobble * 0.7) * 1.5;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(this.x, this.y + hr * 0.7, hr * 0.9, hr * 0.3, 0, 0, Math.PI * 2); ctx.fill();

        // Trash bag body (dark greenish brown)
        const bodyCol = this.hit_t > 6 ? [220, 200, 180] : [70, 80, 50];
        ctx.fillStyle = rgb(bodyCol);
        ctx.beginPath();
        ctx.ellipse(this.x + wx, this.y + wy, hr * 0.9, hr, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bag texture lines
        ctx.strokeStyle = this.hit_t > 6 ? 'rgba(180,160,140,0.6)' : 'rgba(40,50,30,0.6)';
        ctx.lineWidth = 1.5;
        for (let i = -2; i <= 2; i++) {
            const lx = this.x + wx + i * hr * 0.3;
            drawLine(lx, this.y + wy - hr * 0.6, lx + i * 2, this.y + wy + hr * 0.6,
                this.hit_t > 6 ? [180,160,140] : [50,60,35], 1);
        }

        // Bag tie at top
        ctx.fillStyle = this.hit_t > 6 ? rgb([200,180,160]) : rgb([90, 100, 60]);
        ctx.beginPath();
        ctx.ellipse(this.x + wx, this.y + wy - hr * 0.85, hr * 0.35, hr * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trash sticking out
        const stickCol = [180, 150, 100];
        // Banana peel
        ctx.fillStyle = rgb([220, 200, 60]);
        ctx.beginPath();
        ctx.moveTo(this.x + wx - hr * 0.3, this.y + wy - hr * 0.7);
        ctx.quadraticCurveTo(this.x + wx - hr * 0.5, this.y + wy - hr * 1.1,
            this.x + wx - hr * 0.15, this.y + wy - hr * 1.0);
        ctx.lineWidth = 2; ctx.stroke(); ctx.fill();

        // Can sticking out
        fillCircle(this.x + wx + hr * 0.25, this.y + wy - hr * 0.75, 5, [150, 160, 170]);
        strokeCircle(this.x + wx + hr * 0.25, this.y + wy - hr * 0.75, 5, [100, 110, 120], 1);

        // Fish bone
        const fbx = this.x + wx + hr * 0.1, fby = this.y + wy - hr * 0.5;
        drawLine(fbx - 6, fby, fbx + 6, fby, [200, 200, 190], 1.5);
        for (let i = -2; i <= 2; i++) {
            const fx = fbx + i * 3;
            drawLine(fx, fby - 3, fx, fby + 3, [200, 200, 190], 1);
        }

        // Angry eyes
        const ex_off = hr * 0.25;
        const ey = this.y + wy - hr * 0.15;
        // Eye whites
        fillCircle(this.x + wx - ex_off, ey, 6, [200, 200, 180]);
        fillCircle(this.x + wx + ex_off, ey, 6, [200, 200, 180]);
        // Pupils
        fillCircle(this.x + wx - ex_off, ey + 1, 3, [40, 30, 20]);
        fillCircle(this.x + wx + ex_off, ey + 1, 3, [40, 30, 20]);
        // Angry eyebrows
        drawLine(this.x + wx - ex_off - 5, ey - 7, this.x + wx - ex_off + 4, ey - 4, [60, 50, 30], 2);
        drawLine(this.x + wx + ex_off + 5, ey - 7, this.x + wx + ex_off - 4, ey - 4, [60, 50, 30], 2);

        // Hit flash ring
        if (this.hit_t > 8) {
            strokeCircle(this.x + wx, this.y + wy, hr + 8, [255, 200, 100], 3);
        }

        // HP bar above boss
        const barW = hr * 2, barH = 6;
        const barX = this.x - barW / 2, barY = this.y - hr - 18;
        fillRect(barX, barY, barW, barH, [30, 30, 30]);
        const hpRatio = this.hp / this.max_hp;
        const hpCol = hpRatio > 0.5 ? [80, 200, 80] : (hpRatio > 0.25 ? [220, 180, 40] : [220, 60, 40]);
        fillRect(barX, barY, Math.round(barW * hpRatio), barH, hpCol);
        ctx.strokeStyle = rgb([80, 80, 80]); ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        fillText(`${this.hp}/${this.max_hp}`, this.x, barY - 3, WHITE, '10px "Malgun Gothic", sans-serif', 'center');

        // Heal flash effect
        if (this.heal_flash > 0) {
            const hp = this.heal_flash / 30;
            // Green glow ring expanding outward
            const ringR = hr + (1 - hp) * 40;
            ctx.globalAlpha = hp * 0.7;
            strokeCircle(this.x + wx, this.y + wy, ringR, [80, 255, 120], 3);
            ctx.globalAlpha = hp * 0.3;
            fillCircle(this.x + wx, this.y + wy, hr + 5, [80, 255, 120]);
            ctx.globalAlpha = 1;
            // Rising + particles
            if (this.heal_flash % 4 === 0) {
                const px = this.x + wx + (Math.random() - 0.5) * hr * 1.5;
                const py = this.y + wy + (Math.random() - 0.5) * hr;
                fillText('💚', px, py - (30 - this.heal_flash), WHITE, '14px sans-serif', 'center');
            }
            // "+1 HP" text
            const txtAlpha = Math.min(1, hp * 2);
            ctx.globalAlpha = txtAlpha;
            fillText('+1 HP', this.x, this.y - hr - 30 - (1 - hp) * 15, [80, 255, 120], 'bold 14px "Malgun Gothic", sans-serif', 'center');
            ctx.globalAlpha = 1;
        }

        // Debuff casting aura
        if (this.debuff) {
            const auraR = hr + 15 + Math.sin(t * 0.15) * 5;
            ctx.globalAlpha = 0.2 + Math.sin(t * 0.1) * 0.1;
            const auraCols = {
                'flip_lock_left': [200, 50, 50],
                'flip_lock_right': [200, 50, 50],
                'flip_reverse': [200, 150, 50],
                'heal': [50, 200, 50],
                'gravity_up': [50, 50, 200]
            };
            const ac = auraCols[this.debuff] || [150,150,150];
            fillCircle(this.x + wx, this.y + wy, auraR, ac);
            ctx.globalAlpha = 1;
        }
    }
}

// ============================================================
//  SLINGSHOT
// ============================================================
class Slingshot {
    constructor(x1, y1, x2, y2, pts=10) {
        this.x1=x1; this.y1=y1; this.x2=x2; this.y2=y2; this.pts=pts; this.hit_t=0;
    }
    update() { if (this.hit_t > 0) this.hit_t--; }
    collide_ball(ball) {
        const {hit, n, pen} = seg_circ(ball.x, ball.y, BALL_R+3, this.x1, this.y1, this.x2, this.y2);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const vn = v_dot([ball.vx, ball.vy], n);
            if (vn < 0) {
                ball.vx -= 2.2*vn*n[0]; ball.vy -= 2.2*vn*n[1];
                ball.vy -= 3; this.hit_t = 10; return true;
            }
        }
        return false;
    }
    draw(t) {
        const c = this.hit_t > 0 ? WHITE : CORAL_C;
        const dx = this.x2-this.x1, dy = this.y2-this.y1;
        const l = Math.hypot(dx, dy);
        if (l < 1) return;
        const ux = dx/l, uy = dy/l;
        const px = -uy, py = ux;
        const w = 6;
        const pts = [
            [this.x1+px*w, this.y1+py*w], [this.x2+px*w, this.y2+py*w],
            [this.x2-px*w, this.y2-py*w], [this.x1-px*w, this.y1-py*w]
        ];
        ctx.fillStyle = rgb(c);
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i=1;i<4;i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgb(CORAL_D); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i=1;i<4;i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath(); ctx.stroke();
        for (let i=0;i<3;i++) {
            const tp = (i+1)/4;
            const bx = this.x1+dx*tp+px*w;
            const by = this.y1+dy*tp+py*w;
            fillCircle(bx, by, 4, CORAL_D);
            fillCircle(bx, by, 3, c);
        }
    }
}

// ============================================================
//  DROP TARGET (Fish)
// ============================================================
class DropTarget {
    constructor(x, y, color, pts=200) {
        this.x=x; this.y=y; this.color=color; this.pts=pts; this.alive=true; this.anim=0;
    }
    update() { if (this.anim > 0) this.anim--; }
    collide_ball(ball) {
        if (!this.alive) return false;
        const {hit, n, pen} = circ_circ(ball.x, ball.y, BALL_R, this.x, this.y, 12);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const vn = v_dot([ball.vx,ball.vy], n);
            if (vn < 0) { ball.vx -= 1.5*vn*n[0]; ball.vy -= 1.5*vn*n[1]; }
            this.alive = false; this.anim = 20; return true;
        }
        return false;
    }
    draw(t) {
        if (!this.alive && this.anim <= 0) return;
        if (this.anim > 0 && !this.alive) {
            const a = this.anim / 20;
            const r = Math.round(12*(1+(1-a)*2));
            strokeCircle(this.x, this.y, r, lerp_col([50,50,80], this.color, a), 2);
            return;
        }
        const offset_y = Math.sin(t*0.05+this.x*0.1)*3;
        const cx = this.x, cy = this.y + offset_y;
        // Fish body
        ctx.fillStyle = rgb(this.color);
        // Tail
        const tail_ang = Math.sin(t*0.2+this.x)*0.5;
        const ttx = cx - 14*Math.cos(tail_ang), tty = cy - 14*Math.sin(tail_ang);
        ctx.beginPath();
        ctx.moveTo(cx-8, cy); ctx.lineTo(ttx-6, tty-6); ctx.lineTo(ttx-6, tty+6);
        ctx.closePath(); ctx.fill();
        // Body
        ctx.beginPath(); ctx.ellipse(cx, cy, 12, 10, 0, 0, Math.PI*2); ctx.fill();
        // Eye
        fillCircle(cx+4, cy-3, 5, WHITE);
        fillCircle(cx+6, cy-3, 2, BLACK);
        fillCircle(cx+5, cy-4, 1, WHITE);
    }
}

// ============================================================
//  SPINNER (Whirlpool)
// ============================================================
class Spinner {
    constructor(x, y, pts=50) {
        this.x=x; this.y=y; this.pts=pts; this.angle=0; this.spin=0; this.r=20;
    }
    update() { this.angle += this.spin; this.spin *= 0.97; }
    collide_ball(ball) {
        const {hit, n, pen} = circ_circ(ball.x, ball.y, BALL_R, this.x, this.y, this.r);
        if (hit) {
            ball.x += n[0]*pen; ball.y += n[1]*pen;
            const cross = ball.vx*n[1] - ball.vy*n[0];
            this.spin += cross*0.05;
            const vn = v_dot([ball.vx,ball.vy], n);
            if (vn < 0) { ball.vx -= 1.5*vn*n[0]; ball.vy -= 1.5*vn*n[1]; }
            return true;
        }
        return false;
    }
    draw(t) {
        const cc = Math.abs(this.spin) > 0.5 ? GLOW_C : LIGHT_SEA;
        for (let arm=0; arm<3; arm++) {
            ctx.strokeStyle = rgb(cc); ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i=0; i<20; i++) {
                const a = this.angle + arm*Math.PI*2/3 + i*0.3;
                const r = 3 + i*0.9;
                const px = this.x + r*Math.cos(a), py = this.y + r*Math.sin(a);
                if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        fillCircle(this.x, this.y, 4, cc);
        strokeCircle(this.x, this.y, this.r, MID_SEA, 1);
    }
}

// ============================================================
//  PLUNGER
// ============================================================
class Plunger {
    constructor() {
        this.x = (LANE_IN+LANE_OUT)/2; this.y_base = 750; this.y = this.y_base;
        this.power = 0; this.charging = false; this.max_pw = 100;
    }
    update() {
        if (this.charging) {
            this.power = Math.min(this.power+2, this.max_pw);
            this.y = this.y_base + this.power*0.15;
        } else { this.power = 0; this.y = this.y_base; }
    }
    launch_speed() { return -(this.power*0.12 + 20); }
    draw() {
        const top = this.y - 20;
        fillRect(this.x-4, top, 8, this.y-top+20, [100,100,120]);
        fillCircle(this.x, this.y-3, 5, [120,120,140]);
        if (this.charging && this.power > 0) {
            const bh = Math.round(this.power*0.6);
            const by = this.y_base - 70;
            fillRect(this.x+12, by, 8, 60, [40,40,60]);
            const c = lerp_col([80,200,80],[255,80,80], this.power/this.max_pw);
            fillRect(this.x+12, by+60-bh, 8, bh, c);
        }
    }
}
