// ============================================================
//  BONUS STAGE
// ============================================================
class BonusStage {
    constructor() {
        this.active=false; this.timer=0; this.max_t=900;
        this.treasures=[]; this.collected=0; this.total=8; this.particles=[];
    }
    start() {
        this.active=true; this.timer=this.max_t; this.collected=0;
        this.treasures=[];
        for (let i=0;i<this.total;i++) {
            this.treasures.push({x:randUniform(80,400),y:randUniform(150,600),r:12,alive:true,glow:randUniform(0,6.28)});
        }
    }
    update(balls) {
        if (!this.active) return 0;
        this.timer--; let pts=0;
        for (const tr of this.treasures) {
            if (!tr.alive) continue; tr.glow += 0.08;
            for (const ball of balls) {
                if (Math.hypot(ball.x-tr.x, ball.y-tr.y) < BALL_R+tr.r) {
                    tr.alive=false; this.collected++; pts+=5000;
                    for (let k=0;k<10;k++) {
                        this.particles.push(new Particle(tr.x,tr.y,randUniform(-3,3),randUniform(-3,3),TREASURE_C,30,4));
                    }
                }
            }
        }
        this.particles = this.particles.filter(p => p.update());
        if (this.timer <= 0) this.active = false;
        return pts;
    }
    draw() {
        if (!this.active) return;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        for (const tr of this.treasures) {
            if (!tr.alive) continue;
            const g = Math.sin(tr.glow)*0.3+0.7;
            const r = Math.round(tr.r*g);
            ctx.fillStyle = rgba(TREASURE_C, 0.16);
            ctx.beginPath(); ctx.arc(tr.x, tr.y, r*2, 0, Math.PI*2); ctx.fill();
            fillCircle(tr.x, tr.y, r, TREASURE_C);
            strokeCircle(tr.x, tr.y, r, GOLD_C, 2);
            fillCircle(tr.x-3, tr.y-3, Math.max(1, Math.floor(r/3)), WHITE);
        }
        for (const p of this.particles) p.draw();
        const tl = Math.max(0, this.timer/60);
        fillText(`심해 보너스! ${tl.toFixed(1)}초  보물: ${this.collected}/${this.total}`,
            WIDTH/2, 45, TREASURE_C, '20px "Malgun Gothic", sans-serif', 'center');
    }
}
