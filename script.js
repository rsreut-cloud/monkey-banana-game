// ---------- Setup ----------
const MONKEY_EMOJIS = ['🐵', '🙊', '🙉', '🦍', '🐒'];
const HUNGRY_LABEL = 'רעב 😋';
const HAPPY_LABEL = 'יאמי! 💕';

const monkeysEl = document.getElementById('monkeys');
const trayEl = document.getElementById('tray');
const scoreEl = document.getElementById('score');

let score = 0;
const TRAY_SIZE = 5;
const NUM_MONKEYS = 5;

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
