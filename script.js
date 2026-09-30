'use strict';

const COLORS = ['red', 'green', 'yellow', 'blue'];           // clockwise order
const NAMES = { red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue' };
const HEX = { red: '#e53935', green: '#43a047', yellow: '#fdd835', blue: '#1e88e5' };
const START = { red: 0, green: 13, yellow: 26, blue: 39 };   // index on the 52-cell track
const HOME_START = { red: [7, 1, 0, 1], green: [1, 7, 1, 0], yellow: [7, 13, 0, -1], blue: [13, 7, -1, 0] }; // row, col, dRow, dCol
const BASE_ORIGIN = { red: [0, 0], green: [0, 9], yellow: [9, 9], blue: [9, 0] };
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const FINISH = 56;   // -1 = in base, 0..50 = main track, 51..55 = home column, 56 = center
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// 52-cell track as [row, col] on a 15x15 grid, starting at Red's start cell, clockwise
const TRACK = [];
const seg = (r, c, dr, dc, n) => { for (let i = 0; i < n; i++) TRACK.push([r + dr * i, c + dc * i]); };
seg(6, 1, 0, 1, 5);   seg(5, 6, -1, 0, 6);  seg(0, 7, 0, 1, 2);  seg(1, 8, 1, 0, 5);
seg(6, 9, 0, 1, 6);   seg(7, 14, 1, 0, 2);  seg(8, 13, 0, -1, 5); seg(9, 8, 1, 0, 6);
seg(14, 7, 0, -1, 2); seg(13, 6, -1, 0, 5); seg(8, 5, 0, -1, 6);  seg(7, 0, -1, 0, 2);

const boardEl = document.getElementById('board');
const dieEl = document.getElementById('die');
const rollBtn = document.getElementById('rollBtn');
const statusEl = document.getElementById('status');
const turnEl = document.getElementById('turn');
const playersEl = document.getElementById('players');
const countSel = document.getElementById('playerCount');

const cells = {};   // "r,c" -> element
const slots = {};   // color -> 4 base slot elements
let centerEl, st;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const cur = () => st.active[st.turn];
const setStatus = t => { statusEl.textContent = t; };

function makeEl(cls, r, c) {
  const d = document.createElement('div');
  d.className = cls;
  d.style.gridRow = r + 1;
  d.style.gridColumn = c + 1;
  boardEl.appendChild(d);
  return d;
}

function buildBoard() {
  boardEl.innerHTML = '';
  COLORS.forEach(p => {
    const [r0, c0] = BASE_ORIGIN[p];
    slots[p] = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const inner = r >= 1 && r <= 4 && c >= 1 && c <= 4;
        const d = makeEl('cell base-' + p + (inner ? ' inner' : ''), r0 + r, c0 + c);
        if ((r === 2 || r === 3) && (c === 2 || c === 3)) { d.classList.add('slot'); slots[p].push(d); }
      }
    }
  });
  TRACK.forEach(([r, c], i) => {
    cells[r + ',' + c] = makeEl('cell path' + (SAFE.has(i) ? ' safe' : ''), r, c);
  });
  COLORS.forEach(p => {
    cells[TRACK[START[p]].join()].classList.add('start-' + p);
    const [hr, hc, dr, dc] = HOME_START[p];
    for (let k = 0; k < 5; k++) {
      cells[(hr + dr * k) + ',' + (hc + dc * k)] = makeEl('cell path home-' + p, hr + dr * k, hc + dc * k);
    }
  });
  centerEl = document.createElement('div');
  centerEl.className = 'center';
  boardEl.appendChild(centerEl);
}

function getCell(p, i) {
  const pos = st.pos[p][i];
  if (pos === -1) return slots[p][i];
  if (pos === FINISH) return centerEl;
  if (pos <= 50) return cells[TRACK[(START[p] + pos) % 52].join()];
  const [hr, hc, dr, dc] = HOME_START[p];
  const k = pos - 51;
  return cells[(hr + dr * k) + ',' + (hc + dc * k)];
}

function render() {
  document.querySelectorAll('.piece').forEach(e => e.remove());
  const p0 = cur();
  st.active.forEach(p => st.pos[p].forEach((pos, i) => {
    const b = document.createElement('button');
    b.className = 'piece piece-' + p;
    b.setAttribute('aria-label', NAMES[p] + ' piece ' + (i + 1));
    if (p === p0 && st.moves.includes(i)) {
      b.classList.add('movable');
      b.onclick = () => movePiece(i);
    }
    getCell(p, i).appendChild(b);
  }));
  document.querySelectorAll('.cell, .center').forEach(c =>
    c.classList.toggle('multi', c.querySelectorAll('.piece').length > 1));

  turnEl.textContent = st.over ? NAMES[p0] + ' wins!' : NAMES[p0] + "'s turn";
  turnEl.style.background = HEX[p0];
  turnEl.className = 'turn' + (p0 === 'yellow' ? ' yellow' : '');
  rollBtn.disabled = st.busy || st.rolled || st.over;
  playersEl.innerHTML = '';
  st.active.forEach(p => {
    const done = st.pos[p].filter(x => x === FINISH).length;
    const chip = document.createElement('div');
    chip.className = 'chip' + (p === p0 ? ' active' : '');
    chip.innerHTML = '<span class="dot" style="background:' + HEX[p] + '"></span>' + NAMES[p] +
      '<span class="count">' + done + '/4 home</span>';
    playersEl.appendChild(chip);
  });
}

function newGame() {
  const n = +countSel.value;
  const active = n === 2 ? ['red', 'yellow'] : n === 3 ? ['red', 'green', 'yellow'] : COLORS.slice();
  st = { active, pos: {}, turn: 0, dice: 0, rolled: false, busy: false, over: false, moves: [] };
  active.forEach(p => { st.pos[p] = [-1, -1, -1, -1]; });
  dieEl.textContent = FACES[0];
  setStatus('Red starts. Roll the dice!');
  render();
}

function endTurn() {
  st.turn = (st.turn + 1) % st.active.length;
  st.rolled = false; st.busy = false; st.moves = [];
  setStatus(NAMES[cur()] + "'s turn. Roll the dice!");
  render();
}

async function rollDice() {
  if (st.busy || st.rolled || st.over) return;
  st.busy = true; render();
  for (let k = 0; k < 8; k++) { dieEl.textContent = FACES[Math.floor(Math.random() * 6)]; await sleep(60); }
  const d = 1 + Math.floor(Math.random() * 6);
  st.dice = d; st.rolled = true;
  dieEl.textContent = FACES[d - 1];
  const p = cur(), moves = [];
  let baseAdded = false;
  st.pos[p].forEach((pos, i) => {
    if (pos === -1) { if (d === 6 && !baseAdded) { moves.push(i); baseAdded = true; } }
    else if (pos + d <= FINISH) moves.push(i);
  });
  st.moves = moves;
  if (!moves.length) {
    setStatus(NAMES[p] + ' rolled ' + d + '. No valid move.');
    render();
    await sleep(1100);
    endTurn();
    return;
  }
  st.busy = false;
  if (moves.length === 1) {
    setStatus(NAMES[p] + ' rolled ' + d + '. Only one move available.');
    render();
    await sleep(600);
    movePiece(moves[0]);
  } else {
    setStatus(NAMES[p] + ' rolled ' + d + '. Choose a highlighted piece to move.');
    render();
  }
}

async function movePiece(i) {
  if (st.busy || !st.moves.includes(i)) return;
  const p = cur(), d = st.dice, arr = st.pos[p];
  st.busy = true; st.moves = [];
  if (arr[i] === -1) {
    arr[i] = 0; render(); await sleep(250);
  } else {
    for (let s = 0; s < d; s++) { arr[i]++; render(); await sleep(170); }
  }
  let captured = false;
  if (arr[i] <= 50) {
    const a = (START[p] + arr[i]) % 52;
    if (!SAFE.has(a)) {
      st.active.forEach(q => {
        if (q === p) return;
        st.pos[q].forEach((qp, j) => {
          if (qp >= 0 && qp <= 50 && (START[q] + qp) % 52 === a) { st.pos[q][j] = -1; captured = true; }
        });
      });
    }
  }
  const fin = arr[i] === FINISH;
  if (arr.every(x => x === FINISH)) {
    st.over = true; st.busy = false;
    setStatus('🏆 ' + NAMES[p] + ' wins the game! Press New Game to play again.');
    render();
    return;
  }
  if (d === 6 || captured || fin) {
    const why = captured ? 'captured a piece' : fin ? 'reached the center' : 'rolled a 6';
    st.rolled = false; st.busy = false;
    setStatus(NAMES[p] + ' ' + why + ' and rolls again!');
    render();
  } else {
    endTurn();
  }
}

rollBtn.addEventListener('click', rollDice);
dieEl.addEventListener('click', rollDice);
document.getElementById('newGame').addEventListener('click', newGame);
countSel.addEventListener('change', newGame);

buildBoard();
newGame();