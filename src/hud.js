// The DOM HUD above the canvas.
'use strict';

function updateHud() {
  $score.textContent = score; $best.textContent = best; $snacks.textContent = eaten;
  const parts = [];
  for (const k of THEME_ORDER) {
    if (isActive(k)) parts.push(`${iconHtml(EFFECTS[k].emo)} ${EFFECTS[k].name} ${Math.ceil((fx[k] - clock) / 1000)}s`);
  }
  if (shields > 0) parts.push(`${iconHtml('shield')} SHIELD${shields > 1 ? ' ×' + shields : ''}`);
  const m = multiplier();
  const t = parts.length ? parts.join(' • ') + (m > 1 ? `  (×${m})` : '') : `${iconHtml('face_relieved')} Feeling normal`;
  if (t !== lastFxText) { $fx.innerHTML = t; lastFxText = t; }
  updateSpeedMeter();
  const th = currentTheme();
  if (th !== theme) {
    theme = th;
    document.body.className = th === 'normal' ? '' : 'fx-' + th;
    cv.style.boxShadow = GLOWS[th];
  }
}

let lastSpd = '';
function updateSpeedMeter() {
  const night = isActive('night') && state !== 'over';
  const pct = Math.round(speedLvl / MAX_LVL * 100);
  const x = (150 / interval()).toFixed(1);
  const key = pct + '|' + x + '|' + night;
  if (key === lastSpd) return;
  lastSpd = key;
  $spdbar.style.width = Math.max(4, pct) + '%';
  $spdbar.style.backgroundColor = night ? '#7c8cff' : `hsl(${120 - 120 * pct / 100},80%,52%)`;
  $spdlbl.innerHTML = night ? `${iconHtml('zzz')} Speed` : 'Speed';
  $spdx.textContent = x + '×';
}
