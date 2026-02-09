// ============================================================
//  AUDIO (Web Audio API)
// ============================================================
let audioCtx = null;
const SND = {};

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, dur = 0.08, vol = 0.12) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function playSweep(f1, f2, dur = 0.15, vol = 0.10) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(f1, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(f2, audioCtx.currentTime + dur);
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function sndBump() { playTone(800, 0.05, 0.10); }
function sndFlip() { playTone(350, 0.03, 0.06); }
function sndWall() { playTone(500, 0.025, 0.05); }
function sndDrain() { playTone(180, 0.3, 0.12); }
function sndLaunch() { playSweep(200, 900, 0.2, 0.08); }
function sndTarget() { playTone(1000, 0.06, 0.08); }
function sndSpin() { playTone(600, 0.04, 0.06); }
function sndMulti() { playSweep(400, 1200, 0.3, 0.12); }
function sndBonus() { playSweep(300, 1500, 0.5, 0.10); }
function sndBuy() { playTone(1200, 0.08, 0.10); }
function sndRoundClear() { playSweep(500, 1800, 0.6, 0.12); }
