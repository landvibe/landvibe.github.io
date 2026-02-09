// ============================================================
//  PARTICLE / BUBBLE / SCOREPOPUP
// ============================================================
class Particle {
    constructor(x, y, vx, vy, color, life, size=3, grav=0) {
        this.x=x; this.y=y; this.vx=vx; this.vy=vy;
        this.color=color; this.life=life; this.mx=life;
        this.size=size; this.grav=grav;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += this.grav;
        this.life--; return this.life > 0;
    }
    draw() {
        const a = this.life / this.mx;
        const r = Math.max(1, Math.round(this.size * a));
        const c = lerp_col(BLACK, this.color, a);
        fillCircle(this.x, this.y, r, c);
    }
}

class Bubble {
    constructor() {
        this.x = randUniform(TABLE_L, TABLE_R);
        this.y = randUniform(50, HEIGHT);
        this.r = randUniform(2, 6);
        this.spd = randUniform(0.3, 1.0);
        this.wa = randUniform(0.5, 2);
        this.ws = randUniform(0.02, 0.06);
        this.ph = randUniform(0, Math.PI*2);
    }
    update(t) {
        this.y -= this.spd;
        this.x += Math.sin(t * this.ws + this.ph) * this.wa * 0.3;
        if (this.y < -10) {
            this.x = randUniform(TABLE_L, TABLE_R);
            this.y = HEIGHT + randUniform(0, 50);
            this.r = randUniform(2, 6);
        }
    }
    draw() {
        const c = [Math.min(255, 180+Math.round(this.r*10)), Math.min(255, 220+Math.round(this.r*5)), 255];
        strokeCircle(this.x, this.y, this.r, c, 1);
        if (this.r > 3) fillCircle(this.x - this.r*0.3, this.y - this.r*0.3, Math.max(1, this.r*0.3), WHITE);
    }
}

class ScorePopup {
    constructor(x, y, text, color=SCORE_C) {
        this.x=x; this.y=y; this.text=text; this.color=color; this.life=60;
    }
    update() { this.y -= 1.2; this.life--; return this.life > 0; }
    draw() {
        const a = this.life / 60.0;
        const c = lerp_col([50,50,50], this.color, a);
        fillText(this.text, this.x, this.y, c, '14px "Malgun Gothic", sans-serif', 'center');
    }
}
