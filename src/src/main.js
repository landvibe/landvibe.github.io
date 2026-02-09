// ============================================================
//  START
// ============================================================
const game = new PinballGame();

// Query params: ?test=true&round=7&gold=100&money=50
const _urlParams = new URLSearchParams(window.location.search);
if (_urlParams.get('test') === 'true') {
    game._testRound = parseInt(_urlParams.get('round')) || 1;
    game._testGold = parseInt(_urlParams.get('gold')) || 100;
    game._testMoney = parseInt(_urlParams.get('money')) || 0;
    game._startTest();
}

game.run();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
