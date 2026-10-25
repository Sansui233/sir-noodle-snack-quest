// Keyboard, touch and mouse input.
'use strict';

function turn(dx, dy) {
  if (state !== 'play') return;
  if (isActive('dizzy')) { dx = -dx; dy = -dy; }
  const last = queue.length ? queue[queue.length - 1] : dir;
  if (last.x === -dx && last.y === -dy) return;
  if (last.x === dx && last.y === dy) return;
  if (queue.length < 2) queue.push({ x: dx, y: dy });
}
function primary() {            // space / enter / tap
  audio();
  if (state === 'title' || state === 'over') start();
  else if (state === 'play') state = 'pause';
  else if (state === 'pause') state = 'play';
  wake();
}
function toggleMute() { muted = !muted; $mute.innerHTML = iconHtml(muted ? 'speaker_off' : 'speaker'); if (!muted) audio(); }

function applyLowFx() {
  $lowfx.innerHTML = lowFx ? `${iconHtml('feather')} FX: Low` : `${iconHtml('sparkle')} FX: High`;
  document.body.classList.toggle('low-fx', lowFx);
  dpr = lowFx ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  cv.width = cv.height = SIZE * dpr;                       // resizing also resets the context state
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  spriteCache.clear();                                     // sprite buckets are per dpr
  grassStatic = false;
}
function toggleLowFx() {
  lowFx = !lowFx;
  try { localStorage.setItem('sirNoodleLowFx', lowFx ? '1' : '0'); } catch (e) {}
  applyLowFx(); wake();
}

const KEYMAP = {
  ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
  w:[0,-1], s:[0,1], a:[-1,0], d:[1,0], W:[0,-1], S:[0,1], A:[-1,0], D:[1,0]
};
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); primary(); return; }
  if (e.key === 'p' || e.key === 'P') { if (state === 'play' || state === 'pause') primary(); return; }
  if (e.key === 'm' || e.key === 'M') { toggleMute(); return; }
  if (e.key === 'l' || e.key === 'L') { toggleLowFx(); return; }
  const m = KEYMAP[e.key];
  if (m) {
    e.preventDefault();
    if (state === 'title' || state === 'over') { start(); }
    else if (state === 'pause') { state = 'play'; }
    turn(m[0], m[1]);
    wake();
  }
});
$mute.addEventListener('click', (e) => { toggleMute(); e.target.blur(); });
$lowfx.addEventListener('click', (e) => { toggleLowFx(); e.target.blur(); });
window.addEventListener('blur', () => { if (state === 'play') state = 'pause'; });

// touch / swipe / click
let tx = 0, ty = 0;
cv.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; e.preventDefault();
}, { passive: false });
cv.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
  e.preventDefault();
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { primary(); return; }
  if (state === 'title' || state === 'over') start();
  else if (state === 'pause') state = 'play';
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
  wake();
}, { passive: false });
cv.addEventListener('mousedown', () => { if (state !== 'play') primary(); });
