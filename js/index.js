let AXES = ['반응속도', '정확도', '좌석 판단력', '회복력', '보안문자', '일관성'];
let CX = 180, CY = 130, R = 85;
let SVG_NS = 'http://www.w3.org/2000/svg';

function pointsFor(scores) {
    let points = [];
    for (let i = 0; i < scores.length; i++) {
        let score = scores[i];
        if (score == null) {
            score = 0;
        }
        let angle = (-90 + 60 * i) * Math.PI / 180;
        let r = R * score / 100;
        points.push({ x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) });
    }
    return points;
}

function toPointsAttr(points) {
    let text = '';
    for (let i = 0; i < points.length; i++) {
        if (i > 0) {
            text += ' ';
        }
        text += points[i].x.toFixed(1) + ',' + points[i].y.toFixed(1);
    }
    return text;
}

function svgEl(tag, attrs) {
    let el = document.createElementNS(SVG_NS, tag);
    for (let key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
    return el;
}

function drawRadar(svg, now, prev) {
    let grid = svg.querySelector('.radar-grid');
    let axes = svg.querySelector('.radar-axes');
    let labels = svg.querySelector('.radar-labels');
    grid.innerHTML = '';
    axes.innerHTML = '';
    labels.innerHTML = '';

    let levels = [33, 66, 100];
    for (let i = 0; i < levels.length; i++) {
        let level = levels[i];
        let points = pointsFor([level, level, level, level, level, level]);
        grid.appendChild(svgEl('polygon', { points: toPointsAttr(points) }));
    }

    let ends = pointsFor([100, 100, 100, 100, 100, 100]);
    for (let i = 0; i < ends.length; i++) {
        axes.appendChild(svgEl('line', { x1: CX, y1: CY, x2: ends[i].x, y2: ends[i].y }));
    }

    let nowPoints = '';
    let prevPoints = '';
    if (now) {
        nowPoints = toPointsAttr(pointsFor(now));
    }
    if (prev) {
        prevPoints = toPointsAttr(pointsFor(prev));
    }
    svg.querySelector('.radar-now').setAttribute('points', nowPoints);
    svg.querySelector('.radar-prev').setAttribute('points', prevPoints);
    svg.closest('.graph').classList.toggle('is-empty', !now);
    if (!now) {
        return;
    }

    let weakest = -1;
    for (let i = 0; i < now.length; i++) {
        if (now[i] != null && (weakest < 0 || now[i] < now[weakest])) {
            weakest = i;
        }
    }

    let positions = pointsFor([115, 115, 115, 115, 115, 115]);
    for (let i = 0; i < positions.length; i++) {
        let p = positions[i];
        let anchor = 'middle';
        if (Math.abs(p.x - CX) >= 1) {
            if (p.x > CX) {
                anchor = 'start';
            } else {
                anchor = 'end';
            }
        }
        let text = svgEl('text', { x: p.x, y: p.y, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
        if (now[i] == null) {
            text.textContent = AXES[i] + ' 미측정';
            text.classList.add('is-empty');
        } else {
            text.textContent = AXES[i] + ' ' + now[i];
        }
        if (i == weakest) {
            text.classList.add('is-weak');
        }
        labels.appendChild(text);
    }
}

drawRadar(
    document.querySelector('.graph .radar'),
    [80, 70, 55, 40, 65, 60],
    [60, 65, 50, 30, 55, 45]
);



let clockEl = document.querySelector('.server-time .clock');
let leftEl = document.querySelector('.server-time .left');

function pad(n, len) {
    if (len == undefined) {
        len = 2;
    }
    let text = String(n);
    while (text.length < len) {
        text = '0' + text;
    }
    return text;
}

function tick() {
    let now = new Date();
    clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' +
        pad(now.getSeconds()) + '.' + pad(now.getMilliseconds(), 3);

    let passed = now.getSeconds() * 1000 + now.getMilliseconds();
    let left = (60000 - passed) / 1000;
    if (left <= 3) {
        leftEl.textContent = left.toFixed(3);
    } else {
        leftEl.textContent = Math.floor(left);
    }
    leftEl.classList.toggle('urgent', left <= 3);
    requestAnimationFrame(tick);
}

tick();

let seatBg = document.querySelector('.seat-bg');
let seats = [];
let cols = Math.ceil(window.innerWidth / 40) + 2;
let rows = Math.ceil(window.innerHeight / 40) + 2;
for (let i = 0; i < cols * rows; i++) {
    let seat = document.createElement('span');
    seatBg.appendChild(seat);
    seats.push(seat);
}

function sellSeat() {
    let empty = [];
    for (let i = 0; i < seats.length; i++) {
        if (!seats[i].classList.contains('sold')) {
            empty.push(seats[i]);
        }
    }
    if (empty.length == 0) {
        setTimeout(function() {
            for (let i = 0; i < seats.length; i++) {
                seats[i].classList.remove('sold');
            }
            sellSeat();
        }, 1000);
        return;
    }
    let pick = empty[Math.floor(Math.random() * empty.length)];
    pick.classList.add('sold');
    setTimeout(sellSeat, Math.random() * 10);
}

sellSeat();
