let maxSeats = 4;
let codeLength = 6;
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let screens = {
    intro: document.querySelector('.intro'),
    reaction: document.querySelector('.step-reaction'),
    captcha: document.querySelector('.step-captcha'),
    seat: document.querySelector('.step-seat'),
    result: document.querySelector('.result')
};

let clock = document.querySelector('.clock');
let target = document.querySelector('.target');
let bookBtn = document.querySelector('.book-btn');
let captchaBox = document.querySelector('.captcha');
let answerSlots = document.querySelector('.answer-slots');
let seatMap = document.querySelector('.seat-map');
let picked = document.querySelector('.picked');
let seatBook = document.querySelector('.seat-book');
let elapsedTexts = document.querySelectorAll('.elapsed');
let resultGrade = document.querySelector('.result-grade');
let resultStats = document.querySelector('.result-stats');
let resultList = document.querySelector('.result-list');

let step = '';
let targetTime = 0;
let openAt = 0;
let opened = false;
let clockTimer = 0;
let elapsedTimer = 0;
let earlyClicks = 0;
let reactionMs = 0;

let answer = '';
let typed = '';
let captchaStart = 0;
let captchaMs = 0;
let retries = 0;
let wrongKeys = 0;
let totalKeys = 0;

let seatEls = [];
let states = [];
let buyTimer = 0;
let seatStart = 0;
let seatMs = 0;
let missed = 0;
let bookedList = [];
let doneAt = 0;

function showScreen(name) {
    for (let key in screens) {
        if (key == name) {
            screens[key].style.display = 'block';
        } else {
            screens[key].style.display = 'none';
        }
    }
}

function showFeedback(name, text, color) {
    let box = document.querySelector('.' + name + '-feedback');
    box.textContent = text;
    box.style.color = color;
}

function updateElapsed() {
    let text = '정각 후 ' + toSec(new Date().getTime() - openAt) + '초';
    for (let i = 0; i < elapsedTexts.length; i++) {
        elapsedTexts[i].textContent = text;
    }
}

function setWaiting() {
    bookBtn.textContent = '예매 대기';
    bookBtn.style.backgroundColor = '#555';
    bookBtn.style.color = '#aaa';
}

function setOpened() {
    bookBtn.textContent = '예매하기';
    bookBtn.style.backgroundColor = '#f0803c';
    bookBtn.style.color = '#fff';
}

function tick() {
    let remain = openAt - new Date().getTime();
    clock.textContent = formatTime(targetTime - remain, true);
    if (!opened && remain <= 0) {
        opened = true;
        setOpened();
    }
}

function startGame() {
    earlyClicks = 0;
    retries = 0;
    wrongKeys = 0;
    totalKeys = 0;
    missed = 0;
    bookedList = [];

    let now = new Date();
    targetTime = (now.getHours() * 60 + now.getMinutes() + 1) * 60000;
    openAt = now.getTime() + 3000 + Math.floor(Math.random() * 2001);
    opened = false;

    step = 'reaction';
    showScreen('reaction');
    setWaiting();
    target.textContent = formatTime(targetTime, false) + ' 오픈';
    showFeedback('reaction', '', '#bbb');
    clockTimer = setInterval(tick, 10);
    tick();
}

bookBtn.addEventListener('click', function() {
    if (step != 'reaction') {
        return;
    }
    let now = new Date().getTime();
    if (now < openAt) {
        earlyClicks++;
        showFeedback('reaction', '아직 오픈 전이에요 · 일찍 누름 ' + earlyClicks + '회', '#ff6b66');
        return;
    }
    reactionMs = now - openAt;
    clearInterval(clockTimer);
    elapsedTimer = setInterval(updateElapsed, 100);
    startCaptcha();
});

function randomCode() {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }
    return code;
}



function drawSlots() {
    let output = '';
    for (let i = 0; i < codeLength; i++) {
        let ch = '';
        if (i < typed.length) {
            ch = typed[i];
        }
        if (i == typed.length) {
            output += '<span class="slot now">' + ch + '</span>';
        } else {
            output += '<span class="slot">' + ch + '</span>';
        }
    }
    answerSlots.innerHTML = output;
}

function newCaptcha() {
    answer = randomCode();
    captchaBox.textContent = answer;
    typed = '';
    drawSlots();
}

function startCaptcha() {
    step = 'captcha';
    showScreen('captcha');
    updateElapsed();
    showFeedback('captcha', '', '#bbb');
    newCaptcha();
    captchaStart = new Date().getTime();
}

function typeLetter(ch) {
    if (typed.length >= codeLength) {
        return;
    }
    if (ch != answer[typed.length]) {
        wrongKeys++;
    }
    totalKeys++;
    typed += ch;
    drawSlots();
}

function submitCaptcha() {
    if (typed.length < codeLength) {
        showFeedback('captcha', '6자리를 모두 입력해 주세요.', '#ff6b66');
        return;
    }
    if (typed != answer) {
        retries++;
        showFeedback('captcha', '보안문자가 틀렸어요. 새 문자를 입력해 주세요. (재시도 ' + retries + '회)', '#ff6b66');
        newCaptcha();
        return;
    }
    captchaMs = new Date().getTime() - captchaStart;
    startSeat();
}

document.onkeydown = function(event) {
    if (step != 'captcha') {
        return true;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return true;
    }

    let key = event.key;

    if (key == 'Enter') {
        submitCaptcha();
        return false;
    }

    if (key == 'Backspace') {
        if (typed.length > 0) {
            typed = typed.slice(0, -1);
            drawSlots();
        }
        return false;
    }

    if (key == 'Process') {
        showFeedback('captcha', '한글로 입력되고 있어요. 한/영 키를 눌러주세요.', '#ff6b66');
        return false;
    }

    if (key.length == 1) {
        let ch = key.toUpperCase();
        if (ch >= 'A' && ch <= 'Z') {
            typeLetter(ch);
            return false;
        }
        if (ch >= 'ㄱ' && ch <= '힣') {
            showFeedback('captcha', '한글로 입력되고 있어요. 한/영 키를 눌러주세요.', '#ff6b66');
            return false;
        }
    }

    return true;
};

document.querySelector('.submit-btn').addEventListener('click', function() {
    if (step == 'captcha') {
        submitCaptcha();
    }
});

function countState(name) {
    let count = 0;
    for (let i = 0; i < states.length; i++) {
        if (states[i] == name) {
            count++;
        }
    }
    return count;
}

function mySeats() {
    let list = [];
    for (let i = 0; i < states.length; i++) {
        if (states[i] == 'mine') {
            list.push(i);
        }
    }
    return list;
}

function paintSeat(i) {
    seatEls[i].setAttribute('class', 'seat ' + states[i]);
}

function drawSeats() {
    seatMap.innerHTML = seatMapHtml();
    seatEls = seatMap.querySelectorAll('.seat');
    for (let i = 0; i < seatEls.length; i++) {
        seatEls[i].addEventListener('click', function() {
            clickSeat(i);
        });
        paintSeat(i);
    }
}

function updatePicked() {
    let list = mySeats();
    if (list.length == 0) {
        picked.textContent = '좌석을 선택해 주세요 (최대 ' + maxSeats + '석)';
    } else {
        picked.textContent = '선택한 좌석 ' + seatNames(list) + ' (' + list.length + '/' + maxSeats + ')';
    }
}

function startSeat() {
    step = 'seat';

    let soldRate = 0.3 + (new Date().getTime() - openAt) / 1000 * 0.03;
    if (soldRate > 0.85) {
        soldRate = 0.85;
    }
    states = [];
    for (let i = 0; i < seatRowCount * seatColCount; i++) {
        if (Math.random() < soldRate) {
            states.push('sold');
        } else {
            states.push('empty');
        }
    }

    showScreen('seat');
    updateElapsed();
    drawSeats();
    updatePicked();
    showFeedback('seat', '', '#bbb');

    seatStart = new Date().getTime();
    buyTimer = setInterval(othersBuy, 100);
}

function othersBuy() {
    if (Math.random() < 0.5) {
        return;
    }

    let open = [];
    for (let i = 0; i < states.length; i++) {
        if (states[i] != 'sold') {
            open.push(i);
        }
    }
    if (open.length == 0) {
        return;
    }

    let pick = open[Math.floor(Math.random() * open.length)];
    if (states[pick] == 'mine') {
        missed++;
        showFeedback('seat', seatName(pick) + ' 좌석을 다른 사람이 먼저 예매했어요', '#ff6b66');
    }
    states[pick] = 'sold';
    paintSeat(pick);
    updatePicked();

    if (countState('empty') == 0 && countState('mine') == 0) {
        showFeedback('seat', '좌석이 모두 매진됐어요', '#ff6b66');
        endSeat([]);
    }
}

function clickSeat(i) {
    if (step != 'seat') {
        return;
    }
    if (states[i] == 'sold') {
        showFeedback('seat', '이미 판매된 좌석이에요', '#ff6b66');
        return;
    }
    if (states[i] == 'mine') {
        states[i] = 'empty';
        paintSeat(i);
        updatePicked();
        return;
    }
    if (countState('mine') >= maxSeats) {
        showFeedback('seat', '최대 ' + maxSeats + '석까지 선택할 수 있어요', '#f0c43c');
        return;
    }
    states[i] = 'mine';
    paintSeat(i);
    updatePicked();
}

seatBook.addEventListener('click', function() {
    if (step != 'seat') {
        return;
    }
    let list = mySeats();
    if (list.length == 0) {
        showFeedback('seat', '좌석을 먼저 선택해 주세요', '#ff6b66');
        return;
    }
    endSeat(list);
});

function endSeat(list) {
    step = 'done';
    clearInterval(buyTimer);
    clearInterval(elapsedTimer);

    doneAt = new Date().getTime();
    seatMs = doneAt - seatStart;
    bookedList = list;

    if (list.length > 0) {
        showFeedback('seat', '예매 완료 · ' + seatNames(list) + ' · 정각 후 ' + toSec(doneAt - openAt) + '초', '#7ee08a');
    }
    setTimeout(finish, 1500);
}

function finish() {
    let reactionScore = limitScore(Math.round(100 - (reactionMs - 50) / 5) - earlyClicks * 20);

    let typoRate = 0;
    if (totalKeys > 0) {
        typoRate = wrongKeys / totalKeys;
    }
    let captchaSpeed = limitScore(Math.round(100 - (captchaMs / 1000 - 3) * 10));
    let captchaScore = Math.round(captchaSpeed * 0.6 + (1 - typoRate) * 100 * 0.4);

    let count = bookedList.length;
    let together = isTogether(bookedList);
    let aisle = hasAisle(bookedList);
    let seatPoint = seatScore(count, together, aisle, seatMs);

    let score = Math.round((reactionScore + captchaScore + seatPoint) / 3);

    let metrics = {
        reactionMs: reactionMs,
        earlyClicks: earlyClicks,
        reactionScore: reactionScore,
        captchaMs: captchaMs,
        retries: retries,
        typoRate: typoRate,
        captchaScore: captchaScore,
        seatMs: seatMs,
        seats: seatNames(bookedList),
        seatCount: count,
        together: together,
        aisle: aisle,
        missed: missed,
        seatScore: seatPoint,
        totalMs: doneAt - openAt,
        score: score,
        grade: getGrade(score)
    };

    userData.addRecord({ mode: 'all', trials: 1, metrics: metrics });
    showResult(metrics);
}

function showResult(m) {
    showScreen('result');

    let summary = '총점 ' + m.score + '점 · ';
    if (m.seatCount > 0) {
        summary += '정각부터 예매 완료까지 ' + toSec(m.totalMs) + '초';
    } else {
        summary += '좌석 매진으로 예매 실패';
    }

    resultGrade.innerHTML =
        '<span>등급</span>' +
        '<b>' + m.grade + '</b>' +
        '<p>' + summary + '</p>';

    resultStats.innerHTML =
        '<div><span>정각 반응</span><b>' + m.reactionMs + 'ms</b></div>' +
        '<div><span>보안문자</span><b>' + toSec(m.captchaMs) + '초</b></div>' +
        '<div><span>좌석 선택</span><b>' + toSec(m.seatMs) + '초</b></div>' +
        '<div><span>총 소요</span><b>' + toSec(m.totalMs) + '초</b></div>';

    let reactionDetail = m.reactionMs + 'ms';
    if (m.earlyClicks > 0) {
        reactionDetail += ' · 일찍 누름 ' + m.earlyClicks + '회';
    }

    let captchaDetail = toSec(m.captchaMs) + '초 · 재시도 ' + m.retries + '회 · 오타율 ' + Math.round(m.typoRate * 1000) / 10 + '%';

    let seatDetail = '';
    if (m.seatCount > 0) {
        seatDetail = m.seats;
        let tags = seatTags(m.seatCount, m.together, m.aisle);
        if (tags != '') {
            seatDetail += ' · ' + tags;
        }
        seatDetail += ' · ' + toSec(m.seatMs) + '초';
    } else {
        seatDetail = '매진';
    }
    if (m.missed > 0) {
        seatDetail += ' · 놓친 좌석 ' + m.missed + '석';
    }

    resultList.innerHTML =
        '<li><span class="no">1</span><span class="step-name">정각 반응</span><span class="detail">' + reactionDetail + '</span><span class="step-score">' + m.reactionScore + '점</span></li>' +
        '<li><span class="no">2</span><span class="step-name">보안문자</span><span class="detail">' + captchaDetail + '</span><span class="step-score">' + m.captchaScore + '점</span></li>' +
        '<li><span class="no">3</span><span class="step-name">좌석 선택</span><span class="detail">' + seatDetail + '</span><span class="step-score">' + m.seatScore + '점</span></li>';
}

document.querySelector('.start-btn').addEventListener('click', function() {
    startGame();
});

document.querySelector('.retry').addEventListener('click', function() {
    startGame();
});
