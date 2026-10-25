// Headless playtest helper: loads index.html in headless Chrome and lets a script drive the game.
//   node tools/playtest.mjs                 -> smoke test (boots, plays ~300 random steps, dies, reports errors)
//   VIEWPORT=390x844 node tools/playtest.mjs ...  -> phone-sized window
//   node tools/playtest.mjs my-test.mjs     -> runs `export default async ({ T, shot, frames, errors }) => {...}`
// T(code) evaluates code in the page's global scope (all game state is reachable: state, snake, score...).
// shot(path) screenshots the canvas stage; frames(n) advances n frames by hand (rAF may not fire headless).
// Set CHROME=<path to chrome/edge> if it is not in the default Windows location.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9800 + Math.floor(Math.random() * 500);
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function withGame(fn, { width = 900, height = 1000 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'noodle-play-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank']);
  const errors = [];
  try {
    let targets;
    for (let i = 0; i < 60 && !targets; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(200); }
    }
    if (!targets) throw new Error('Chrome did not start; set CHROME to your browser path');
    const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
    let seq = 0; const pending = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
      if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    };
    const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: pathToFileURL(resolve(here, '..', 'index.html')).href });
    await sleep(1500);

    const T = async (code) => {
      const r = await send('Runtime.evaluate', { expression: code, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
      return r.result.result.value;
    };
    const frames = (n = 60, ms = 16) => T(`for (let i = 0; i < ${n}; i++) { frame(last + ${ms}); } 'ok'`);
    const shot = async (path, selector = '#stage') => {
      const rect = await T(`(() => { const r = document.querySelector('${selector}').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
      const s = await send('Page.captureScreenshot', { format: 'png', clip: { ...rect, scale: 1 } });
      writeFileSync(path, Buffer.from(s.result.data, 'base64'));
    };
    const result = await fn({ T, send, shot, frames, errors, sleep });
    ws.close();
    return result;
  } finally {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

// default smoke test: random play until death (or 300 steps), no exceptions allowed
async function smoke({ T, errors }) {
  await T(`start(); 'ok'`);
  const out = await T(`(() => {
    const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
    let steps = 0;
    for (; steps < 300 && state === 'play'; steps++) {
      if (Math.random() < 0.2) { const d = dirs[Math.floor(Math.random() * 4)]; turn(d[0], d[1]); }
      step(); clock += 150;
    }
    return { steps, state, score, eaten, length: snake.length };
  })()`);
  console.log('smoke:', JSON.stringify(out));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const script = process.argv[2];
  const fn = script ? (await import(pathToFileURL(resolve(script)).href)).default : smoke;
  const [width, height] = (process.env.VIEWPORT || '900x1000').split('x').map(Number);
  const errors = await withGame(async (api) => { await fn(api); await api.sleep(200); return api.errors; }, { width, height });
  if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }
  console.log('no page errors');
}
