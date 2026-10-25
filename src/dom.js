// Page elements the game talks to.
'use strict';

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let dpr = 1;

const $score = document.getElementById('score');
const $best = document.getElementById('best');
const $snacks = document.getElementById('snacks');
const $fx = document.getElementById('fx');
const $spdbar = document.getElementById('spdbar');
const $spdlbl = document.getElementById('spdlbl');
const $spdx = document.getElementById('spdx');
const $mute = document.getElementById('mute');
const $lowfx = document.getElementById('lowfx');
const $trophies = document.getElementById('trophies');
const $trophyCount = document.getElementById('trophy-count');

// UI layer over the canvas (ui.js)
const $toasts = document.getElementById('toasts');
const $scrTitle = document.getElementById('scr-title');
const $scrPause = document.getElementById('scr-pause');
const $pauseSub = document.getElementById('pause-sub');
const $scrOver = document.getElementById('scr-over');
const $overCard = document.getElementById('over-card');
const $scrRecords = document.getElementById('scr-records');
const $recBody = document.getElementById('rec-body');
const $titleSub = document.getElementById('title-sub');
