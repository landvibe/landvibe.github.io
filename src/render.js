// ============================================================
//  CANVAS SETUP
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;

function fillCircle(x, y, r, col) {
    ctx.fillStyle = rgb(col);
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI*2); ctx.fill();
}
function strokeCircle(x, y, r, col, lw=1) {
    ctx.strokeStyle = rgb(col); ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI*2); ctx.stroke();
}
function fillRect(x, y, w, h, col) {
    ctx.fillStyle = rgb(col); ctx.fillRect(x, y, w, h);
}
function drawLine(x1, y1, x2, y2, col, lw=1) {
    ctx.strokeStyle = rgb(col); ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
}
function fillText(text, x, y, col, font='14px "Malgun Gothic", sans-serif', align='left') {
    ctx.fillStyle = rgb(col); ctx.font = font; ctx.textAlign = align;
    ctx.fillText(text, x, y);
}
function measureText(text, font='14px "Malgun Gothic", sans-serif') {
    ctx.font = font; return ctx.measureText(text).width;
}
function fillRoundRect(x, y, w, h, r, col) {
    ctx.fillStyle = rgb(col);
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath(); ctx.fill();
}
function strokeRoundRect(x, y, w, h, r, col, lw=2) {
    ctx.strokeStyle = rgb(col); ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath(); ctx.stroke();
}
function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => { if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
        const q = l < 0.5 ? l*(1+s) : l+s-l*s;
        const p = 2*l-q;
        r = hue2rgb(p, q, h+1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h-1/3);
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}
