const AXES = ['반응속도', '정확도', '좌석 판단력', '회복력', '보안문자', '일관성'];
const CX = 180, CY = 130, R = 85;
const SVG_NS = 'http://www.w3.org/2000/svg';

function pointsFor(scores) {
  return scores.map((score, i) => {
    const angle = (-90 + 60 * i) * Math.PI / 180;
    const r = R * (score ?? 0) / 100;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });
}

function toPointsAttr(pts) {
  return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const key in attrs) el.setAttribute(key, attrs[key]);
  return el;
}

function drawRadar(svg, now, prev) {
  const grid = svg.querySelector('.radar-grid');
  const axes = svg.querySelector('.radar-axes');
  const labels = svg.querySelector('.radar-labels');
  grid.innerHTML = '';
  axes.innerHTML = '';
  labels.innerHTML = '';

  [33, 66, 100].forEach(level => {
    const pts = pointsFor([level, level, level, level, level, level]);
    grid.appendChild(svgEl('polygon', { points: toPointsAttr(pts) }));
  });

  pointsFor([100, 100, 100, 100, 100, 100]).forEach(p => {
    axes.appendChild(svgEl('line', { x1: CX, y1: CY, x2: p.x, y2: p.y }));
  });

  svg.querySelector('.radar-now').setAttribute('points', now ? toPointsAttr(pointsFor(now)) : '');
  svg.querySelector('.radar-prev').setAttribute('points', prev ? toPointsAttr(pointsFor(prev)) : '');
  svg.closest('.graph').classList.toggle('is-empty', !now);
  if (!now) return;
  
  let weakest = -1;
  now.forEach((s, i) => {
    if (s != null && (weakest < 0 || s < now[weakest])) weakest = i;
  });

  pointsFor([115, 115, 115, 115, 115, 115]).forEach((p, i) => {
    const anchor = Math.abs(p.x - CX) < 1 ? 'middle' : (p.x > CX ? 'start' : 'end');
    const text = svgEl('text', { x: p.x, y: p.y, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
    text.textContent = now[i] == null ? `${AXES[i]} 미측정` : `${AXES[i]} ${now[i]}`;
    if (now[i] == null) text.classList.add('is-empty');
    if (i === weakest) text.classList.add('is-weak');
    labels.appendChild(text);
  });
}

drawRadar(
  document.querySelector('.graph .radar'),
  [80, 70, 55, 40, 65, 60],
  [60, 65, 50, 30, 55, 45]
);

function aiAnalyze() {

}


const clockEl = document.querySelector('.server-time .clock');
const leftEl = document.querySelector('.server-time .left');

const pad = (n, len = 2) => String(n).padStart(len, '0');

function tick() {
    const now = new Date();

    clockEl.textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;

    const passed = now.getSeconds() * 1000 + now.getMilliseconds();
    const left = (60000 - passed) / 1000;

    if (left <= 3) {
        leftEl.textContent = left.toFixed(3);
    } else {
        leftEl.textContent = Math.floor(left);
    }
    leftEl.classList.toggle('urgent', left <= 3);

    requestAnimationFrame(tick);
}

tick();

const seatBg = document.querySelector('.seat-bg');
const seats = [];

const cols = Math.ceil(window.innerWidth / 40) + 2;
const rows = Math.ceil(window.innerHeight / 40) + 2;
for (let i = 0; i < cols * rows; i++) {
    const seat = document.createElement('span');
    seatBg.appendChild(seat);
    seats.push(seat);
}

function sellSeat() {
    const empty = seats.filter(s => !s.classList.contains('sold'));

    if (empty.length === 0) {
        setTimeout(() => {
            seats.forEach(s => s.classList.remove('sold'));
            sellSeat();
        }, 1000);
        return;
    }

    const pick = empty[Math.floor(Math.random() * empty.length)];
    pick.classList.add('sold');

    setTimeout(sellSeat, Math.random() * 10);
}

sellSeat();