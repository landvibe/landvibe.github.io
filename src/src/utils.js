// ============================================================
//  HELPERS
// ============================================================
function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function lerp_col(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    return [
        Math.round(c1[0]+(c2[0]-c1[0])*t),
        Math.round(c1[1]+(c2[1]-c1[1])*t),
        Math.round(c1[2]+(c2[2]-c1[2])*t)
    ];
}
function v_dot(a, b) { return a[0]*b[0]+a[1]*b[1]; }
function v_len(v) { return Math.hypot(v[0], v[1]); }
function v_nrm(v) { const l = v_len(v); return l > 0.001 ? [v[0]/l, v[1]/l] : [0, 0]; }
function v_perp(v) { return [-v[1], v[0]]; }

function nearest_on_seg(px, py, ax, ay, bx, by) {
    const dx = bx-ax, dy = by-ay;
    const l2 = dx*dx+dy*dy;
    if (l2 < 0.001) return [ax, ay];
    const t = Math.max(0, Math.min(1, ((px-ax)*dx+(py-ay)*dy)/l2));
    return [ax+t*dx, ay+t*dy];
}

function seg_circ(cx, cy, r, ax, ay, bx, by) {
    const [nx, ny] = nearest_on_seg(cx, cy, ax, ay, bx, by);
    const dx = cx-nx, dy = cy-ny;
    const d = Math.hypot(dx, dy);
    if (0.001 < d && d < r) return { hit:true, n:[dx/d, dy/d], pen:r-d };
    return { hit:false, n:[0,0], pen:0 };
}

function circ_circ(x1, y1, r1, x2, y2, r2) {
    const dx = x1-x2, dy = y1-y2;
    const d = Math.hypot(dx, dy);
    if (0.001 < d && d < r1+r2) return { hit:true, n:[dx/d, dy/d], pen:r1+r2-d };
    return { hit:false, n:[0,0], pen:0 };
}

function randUniform(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
