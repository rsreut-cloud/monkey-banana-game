// ---------- Setup ----------
const MONKEY_EMOJIS = ['🐵', '🙊', '🙉', '🦍', '🐒'];
const HUNGRY_LABEL = '😋';
const HAPPY_LABEL = '💕';

const monkeysEl = document.getElementById('monkeys');
const trayEl = document.getElementById('tray');
const scoreEl = document.getElementById('score');

let score = 0;
const TRAY_SIZE = 5;
const NUM_MONKEYS = 5;

// ---------- Sound (tiny synthesized tones, no audio files needed) ----------
let audioCtx = null;

function getAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, startTime, duration, ctx, peakGain = 0.18, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playDing() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

function playChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(1046, now, 0.22, ctx, 0.14, 'triangle');
  playTone(1568, now + 0.09, 0.22, ctx, 0.12, 'triangle');
}

function playPop() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}

const SOUND_MODES = [
  { id: 'ding', icon: '🔔', play: playDing },
  { id: 'chime', icon: '🎐', play: playChime },
  { id: 'pop', icon: '🫧', play: playPop },
  { id: 'mute', icon: '🔇', play: null },
];

const soundPickerEl = document.getElementById('sound-picker');
const savedSoundId = localStorage.getItem('monkeyGameSoundMode');
let soundModeIndex = Math.max(0, SOUND_MODES.findIndex((m) => m.id === savedSoundId));

const soundButtons = SOUND_MODES.map((mode, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sound-btn';
  btn.textContent = mode.icon;
  btn.setAttribute('aria-label', mode.id);
  btn.addEventListener('click', () => selectSoundMode(i));
  soundPickerEl.appendChild(btn);
  return btn;
});

function updateSoundButtons() {
  soundButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === soundModeIndex);
  });
}

function playCurrentSound() {
  const mode = SOUND_MODES[soundModeIndex];
  if (mode.play) mode.play();
}

function selectSoundMode(i) {
  soundModeIndex = i;
  updateSoundButtons();
  localStorage.setItem('monkeyGameSoundMode', SOUND_MODES[soundModeIndex].id);
  playCurrentSound();
}

updateSoundButtons();

// ---------- Build monkeys ----------
const monkeys = [];

for (let i = 0; i < NUM_MONKEYS; i++) {
  const monkey = document.createElement('div');
  monkey.className = 'monkey hungry';
  monkey.dataset.id = i;

  const face = document.createElement('div');
  face.className = 'face';
  face.textContent = MONKEY_EMOJIS[i % MONKEY_EMOJIS.length];

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = HUNGRY_LABEL;

  monkey.appendChild(face);
  monkey.appendChild(label);
  monkeysEl.appendChild(monkey);

  monkeys.push({ el: monkey, face, label, happyTimeout: null });
}

// ---------- Build banana tray ----------
function spawnBanana(slot) {
  const banana = document.createElement('div');
  banana.className = 'banana';
  banana.textContent = '🍌';
  banana.style.animationDelay = (Math.random() * 1.5) + 's';
  slot.innerHTML = '';
  slot.appendChild(banana);
  attachDragHandlers(banana);
}

const slots = [];
for (let i = 0; i < TRAY_SIZE; i++) {
  const slot = document.createElement('div');
  slot.className = 'tray-slot';
  trayEl.appendChild(slot);
  slots.push(slot);
  spawnBanana(slot);
}

// ---------- Layout picker (row / circle / scatter) ----------
const gameEl = document.querySelector('.game');
const layoutPickerEl = document.getElementById('layout-picker');

const LAYOUT_MODES = [
  { id: 'row', iconClass: 'icon-row' },
  { id: 'circle', iconClass: 'icon-circle' },
  { id: 'scatter', iconClass: 'icon-scatter' },
];

const savedLayoutId = localStorage.getItem('monkeyGameLayoutMode');
let layoutModeIndex = Math.max(0, LAYOUT_MODES.findIndex((m) => m.id === savedLayoutId));

const layoutButtons = LAYOUT_MODES.map((mode, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'layout-btn';
  btn.setAttribute('aria-label', mode.id);

  const icon = document.createElement('span');
  icon.className = 'layout-icon ' + mode.iconClass;
  icon.appendChild(document.createElement('i'));
  icon.appendChild(document.createElement('i'));
  icon.appendChild(document.createElement('i'));
  btn.appendChild(icon);

  btn.addEventListener('click', () => selectLayoutMode(i));
  layoutPickerEl.appendChild(btn);
  return btn;
});

function updateLayoutButtons() {
  layoutButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === layoutModeIndex);
  });
}

function selectLayoutMode(i) {
  layoutModeIndex = i;
  updateLayoutButtons();
  localStorage.setItem('monkeyGameLayoutMode', LAYOUT_MODES[layoutModeIndex].id);
  applyLayout();
}

function applyLayout() {
  const mode = LAYOUT_MODES[layoutModeIndex].id;
  gameEl.classList.remove('layout-row', 'layout-circle', 'layout-scatter');
  gameEl.classList.add('layout-' + mode);

  monkeys.forEach((m) => { m.el.style.left = ''; m.el.style.top = ''; });
  slots.forEach((s) => { s.style.left = ''; s.style.top = ''; });

  if (mode === 'circle') {
    positionCircleLayout();
  } else if (mode === 'scatter') {
    positionScattered();
  }
}

function positionCircleLayout() {
  const rect = gameEl.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  const monkeyHalf = Math.max(monkeys[0].el.offsetWidth, monkeys[0].el.offsetHeight) / 2;
  const slotHalf = Math.max(slots[0].offsetWidth, slots[0].offsetHeight) / 2;

  const maxOuterRadius = Math.min(rect.width, rect.height) / 2 - monkeyHalf - 4;
  const outerRadius = Math.min(Math.min(rect.width, rect.height) * 0.34, Math.max(maxOuterRadius, 40));

  const maxInnerRadius = outerRadius - monkeyHalf - slotHalf - 10;
  const innerRadius = Math.max(20, Math.min(outerRadius * 0.42, maxInnerRadius));

  monkeys.forEach((m, i) => {
    const angle = (2 * Math.PI * i) / monkeys.length - Math.PI / 2;
    m.el.style.left = (cx + outerRadius * Math.cos(angle)) + 'px';
    m.el.style.top = (cy + outerRadius * Math.sin(angle)) + 'px';
  });

  slots.forEach((s, i) => {
    const angle = (2 * Math.PI * i) / slots.length - Math.PI / 2;
    s.style.left = (cx + innerRadius * Math.cos(angle)) + 'px';
    s.style.top = (cy + innerRadius * Math.sin(angle)) + 'px';
  });
}

function positionScattered() {
  const rect = gameEl.getBoundingClientRect();
  const placed = [];

  function placeElement(el) {
    const halfW = el.offsetWidth / 2;
    const halfH = el.offsetHeight / 2;
    const pad = 6;
    const minX = halfW + pad;
    const maxX = Math.max(minX, rect.width - halfW - pad);
    const minY = halfH + pad;
    const maxY = Math.max(minY, rect.height - halfH - pad);
    const ownRadius = Math.max(halfW, halfH);

    let best = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      best = { x, y };
      const clear = placed.every((p) => {
        const dx = x - p.x;
        const dy = y - p.y;
        return Math.hypot(dx, dy) > (ownRadius + p.r) * 0.95;
      });
      if (clear) break;
    }

    placed.push({ x: best.x, y: best.y, r: ownRadius });
    el.style.left = best.x + 'px';
    el.style.top = best.y + 'px';
  }

  monkeys.forEach((m) => placeElement(m.el));
  slots.forEach((s) => placeElement(s));
}

updateLayoutButtons();
applyLayout();

window.addEventListener('resize', () => {
  const mode = LAYOUT_MODES[layoutModeIndex].id;
  if (mode === 'circle') positionCircleLayout();
  else if (mode === 'scatter') positionScattered();
});

// ---------- Drag logic (pointer events, works for mouse + touch) ----------
let dragState = null;

function attachDragHandlers(banana) {
  banana.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(e) {
  const banana = e.currentTarget;
  e.preventDefault();

  const rect = banana.getBoundingClientRect();
  const clone = banana.cloneNode(true);
  clone.classList.add('dragging');
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  document.body.appendChild(clone);

  banana.classList.add('placeholder');

  dragState = {
    original: banana,
    clone,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    currentMonkey: null,
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp, { once: true });
}

function onPointerMove(e) {
  if (!dragState) return;
  const { clone } = dragState;
  clone.style.left = (e.clientX - dragState.offsetX) + 'px';
  clone.style.top = (e.clientY - dragState.offsetY) + 'px';

  clone.style.display = 'none';
  const under = document.elementFromPoint(e.clientX, e.clientY);
  clone.style.display = '';

  const monkeyEl = under ? under.closest('.monkey') : null;

  if (dragState.currentMonkey && dragState.currentMonkey !== monkeyEl) {
    dragState.currentMonkey.classList.remove('drag-over');
  }
  if (monkeyEl) {
    monkeyEl.classList.add('drag-over');
  }
  dragState.currentMonkey = monkeyEl;
}

function onPointerUp(e) {
  window.removeEventListener('pointermove', onPointerMove);
  if (!dragState) return;

  const { original, clone, currentMonkey } = dragState;

  if (currentMonkey) {
    currentMonkey.classList.remove('drag-over');
    const id = Number(currentMonkey.dataset.id);
    feedMonkey(id);

    const slot = original.parentElement;
    setTimeout(() => spawnBanana(slot), 550);
  } else {
    original.classList.remove('placeholder');
  }

  clone.remove();
  dragState = null;
}

// ---------- Feeding ----------
function feedMonkey(id) {
  const monkey = monkeys[id];

  score++;
  scoreEl.textContent = score;
  playCurrentSound();

  monkey.el.classList.remove('hungry');
  monkey.el.classList.add('happy');
  monkey.label.textContent = HAPPY_LABEL;

  spawnHearts(monkey.el);

  clearTimeout(monkey.happyTimeout);
  monkey.happyTimeout = setTimeout(() => {
    monkey.el.classList.remove('happy');
    monkey.el.classList.add('hungry');
    monkey.label.textContent = HUNGRY_LABEL;
  }, 1400);
}

function spawnHearts(monkeyEl) {
  const heartsChars = ['💕', '✨', '🍌'];
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('div');
    heart.className = 'hearts';
    heart.textContent = heartsChars[i % heartsChars.length];
    heart.style.left = (40 + (Math.random() * 30 - 15)) + 'px';
    heart.style.animationDelay = (i * 0.12) + 's';
    monkeyEl.appendChild(heart);
    setTimeout(() => heart.remove(), 1300);
  }
}
