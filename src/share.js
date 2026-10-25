// Game over extras: peek at the board (the card slides away for a screenshot) and share the run.
// The share picture is drawn here on its own canvas (board snapshot + stats), so no DOM screenshot is needed.
// A page opened from file:// can't export it: the board canvas has drawn local PNGs, which taints it.
'use strict';

const PLAY_URL = 'https://sansui233.github.io/static/sir-noodle/';
const playUrl = () => /^https?:$/.test(location.protocol) ? location.origin + location.pathname : PLAY_URL;
let lastRep = null;                        // the game over report on screen (showGameOver)

// ---------- peek ----------
const peeking = () => state === 'over' && $scrOver.classList.contains('peek');
function setPeek(on) {
  if (on === peeking()) return;
  $scrOver.classList.toggle('peek', on);
  if (on) document.activeElement?.blur();
  sfx.click();
}

// ---------- the share picture ----------
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

// 720 x 960: title, the board as it was at the crash, avatar + name, the four stats, a line, the link
async function drawShareImage() {
  const r = lastRep.run, W = 720, H = 960;
  const [avatar, clockIco] = await Promise.all([loadImg(`assets/${save.profile.avatar}.png`), loadImg('assets/clock.png')]);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const font = (size, w = 600) => `${w} ${size}px ${TEXT_FONT}`;
  // text that shrinks (down to 60%) to fit maxW; returns its width
  const txt = (s, x, y, size, color = INK, align = 'center', w = 600, maxW = W) => {
    g.font = font(size, w);
    const k = Math.max(.6, Math.min(1, maxW / g.measureText(s).width));
    if (k < 1) g.font = font(Math.round(size * k), w);
    g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(s, x, y);
    return g.measureText(s).width;
  };
  const box = (x, y, w, h, rad) => { g.beginPath(); g.roundRect(x, y, w, h, rad); };

  const bg = g.createRadialGradient(W * .2, H * .1, 0, W * .2, H * .1, H * 1.1);
  bg.addColorStop(0, '#ffe3f1'); bg.addColorStop(.45, '#ffd2b8'); bg.addColorStop(1, '#c9f0ff');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  txt(tr('shareImgTitle'), W / 2, 58, 40, '#e0457b');

  // the board, framed like in the game
  const bx = 60, by = 100, bs = 600;
  g.save(); box(bx, by, bs, bs, 26); g.clip(); g.drawImage(cv, bx, by, bs, bs); g.restore();
  g.lineWidth = 8; g.strokeStyle = INK; box(bx, by, bs, bs, 26); g.stroke();

  // results panel
  const py = 724, ph = 190;
  g.fillStyle = INK; box(bx, py + 8, bs, ph, 26); g.fill();
  g.fillStyle = '#fffaf3'; box(bx, py, bs, ph, 26); g.fill(); g.lineWidth = 6; g.stroke();
  if (avatar) g.drawImage(avatar, bx + 22, py + 18, 52, 52);
  const nameW = txt(shownName(save.profile.name), bx + 86, py + 44, 26, INK, 'left', 600, 220);
  txt(lastRep.newBest ? tr('newHigh') : deathMsg, bx + bs - 24, py + 44, 20, lastRep.newBest ? '#e0457b' : INK, 'right', 500,
    bs - 24 - 86 - nameW - 24);
  const stats = [['coin', tr('score'), fmtNum(score)], ['snackbag', tr('snacks'), fmtNum(eaten)],
    ['worm', tr('length'), fmtNum(r.length)], [clockIco, tr('time'), fmtTime(clock)]];
  const colX = [0, 184, 320, 456], colW = [176, 128, 128, 120];       // score gets the wide column
  stats.forEach(([ico, label, v], i) => {
    const x = bx + 20 + colX[i], y = py + 128;
    const img = typeof ico === 'string' ? ICONS[ico] : ico;
    if (img) g.drawImage(img, x, y - 23, 46, 46);
    g.globalAlpha = .65; txt(label, x + 54, y - 14, 16, INK, 'left', 600, colW[i] - 58); g.globalAlpha = 1;
    txt(v, x + 54, y + 13, i ? 28 : 30, i ? INK : '#e0457b', 'left', 600, colW[i] - 58);
  });

  g.globalAlpha = .7; txt(playUrl().replace(/^https?:\/\//, ''), W / 2, H - 22, 18, INK, 'center', 500); g.globalAlpha = 1;
  return new Promise((ok) => { try { c.toBlob((b) => ok(b), 'image/png'); } catch (e) { ok(null); } });   // tainted (file://)
}

// ---------- the share dialog ----------
let shareBlob = null, shareUrlObj = '', shareGen = 0;
const shareOpen = () => !$scrShare.hidden && !$scrShare.classList.contains('out');
const shareMsg = () => $scrShare.querySelector('#share-text').value.trim();
const fullMsg = () => `${shareMsg()} ${playUrl()}`;

function openShare() {
  if (!lastRep) return;
  const gen = ++shareGen;
  shareBlob = null;
  if (shareUrlObj) URL.revokeObjectURL(shareUrlObj);
  shareUrlObj = '';
  const r = lastRep.run, d = (ms) => `style="--d:${ms}ms"`;
  const socials = lang === 'zh' ? ['weibo', 'x', 'facebook'] : ['x', 'facebook', 'weibo'];
  $shareCard.innerHTML = `<div class="share-head pop" ${d(60)}><h2>${tr('shareT')}</h2>
      <button class="btn close" data-act="share-close" title="${tr('closeTip')}" aria-label="${tr('close')}"></button></div>
    <div class="share-shot pop" ${d(120)} id="share-shot"><span class="note">${tr('drawing')}</span></div>
    <textarea id="share-text" class="pop" ${d(180)} rows="3" spellcheck="false" aria-label="${tr('shareT')}">${esc(tr('shareText', {
      best: lastRep.newBest, score: fmtNum(score), snacks: fmtNum(eaten), length: fmtNum(r.length), time: fmtTime(clock), death: r.death }))}</textarea>
    <div class="actions pop" ${d(240)}>
      ${navigator.share ? `<button class="btn primary" data-act="share-native">${iconHtml('share')} ${tr('shareBtn')}</button>` : ''}
      <button class="btn small" data-act="share-copy-img" data-needs-img disabled>${tr('copyImg')}</button>
      <button class="btn small" data-act="share-save" data-needs-img disabled>${tr('saveImg')}</button>
      <button class="btn small" data-act="share-copy-text">${tr('copyText')}</button>
    </div>
    <div class="share-to pop" ${d(300)}><small>${tr('postTo')}</small>
      ${socials.map(s => `<button class="btn small" data-act="share-${s}" title="${tr('socialTip')}">${tr('net_' + s)}</button>`).join('')}
    </div>`;
  showScreen($scrShare);
  sfx.click();
  drawShareImage().then((blob) => {
    if (gen !== shareGen) return;           // closed and reopened meanwhile
    const shot = $scrShare.querySelector('#share-shot');
    if (!blob) { shot.innerHTML = `<span class="note">${tr('noImage')}</span>`; shot.classList.add('none'); return; }
    shareBlob = blob; shareUrlObj = URL.createObjectURL(blob);
    shot.innerHTML = `<img src="${shareUrlObj}" alt="${tr('shareT')}">`;
    for (const b of $scrShare.querySelectorAll('[data-needs-img]')) b.disabled = false;
  });
}
function closeShare() { hideScreen($scrShare); sfx.click(); }
function shareKey(e) { if (e.key === 'Escape') { e.preventDefault(); closeShare(); } }

// a button says what it did for a moment
function flashBtn(b, text) {
  if (!b._label) b._label = b.innerHTML;
  b.innerHTML = text; clearTimeout(b._t);
  b._t = setTimeout(() => { b.innerHTML = b._label; }, 1400);
  sfx.pop();
}
async function copyText(s) {
  try { await navigator.clipboard.writeText(s); return true; } catch (e) {}
  const t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  t.remove(); return ok;
}
const shareFile = () => new File([shareBlob], `sir-noodle-${score}.png`, { type: 'image/png' });

async function shareAction(act, b) {
  if (act === 'share-native') {
    const data = { text: fullMsg() };
    if (shareBlob && navigator.canShare && navigator.canShare({ files: [shareFile()] })) data.files = [shareFile()];
    else { data.url = playUrl(); data.text = shareMsg(); }
    try { await navigator.share(data); } catch (e) {}   // cancelled: nothing to do
  } else if (act === 'share-copy-img') {
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': shareBlob })]); flashBtn(b, tr('copied')); }
    catch (e) { flashBtn(b, tr('copyFailed')); }
  } else if (act === 'share-save') {
    const a = document.createElement('a'); a.href = shareUrlObj; a.download = shareFile().name; a.click();
    flashBtn(b, tr('saved'));
  } else if (act === 'share-copy-text') {
    flashBtn(b, (await copyText(fullMsg())) ? tr('copied') : tr('copyFailed'));
  } else {
    const t = encodeURIComponent(shareMsg()), u = encodeURIComponent(playUrl());
    const url = { 'share-x': `https://x.com/intent/tweet?text=${t}&url=${u}`,
      'share-weibo': `https://service.weibo.com/share/share.php?title=${t}&url=${u}`,
      'share-facebook': `https://www.facebook.com/sharer/sharer.php?u=${u}` }[act];
    if (url) window.open(url, '_blank', 'noopener');
  }
}
