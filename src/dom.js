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
