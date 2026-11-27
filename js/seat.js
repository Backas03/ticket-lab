let totalRounds = 3;
let maxSeats = 4;

let screens = {
    intro: document.querySelector('.intro'),
    countdown: document.querySelector('.countdown'),
    play: document.querySelector('.play'),
    result: document.querySelector('.result')
};

let countNum = document.querySelector('.countdown-num');
let progress = document.querySelector('.progress');
let seatMap = document.querySelector('.seat-map');
let picked = document.querySelector('.picked');
let bookBtn = document.querySelector('.seat-book');
let feedback = document.querySelector('.feedback');
let resultGrade = document.querySelector('.result-grade');
let resultStats = document.querySelector('.result-stats');
let resultList = document.querySelector('.result-list');

let seatEls = [];
let states = [];
let playing = false;
let buyTimer = 0;
let startedAt = 0;
let missed = 0;
let rounds = [];

function showScreen(name) {
    for (let key in screens) {
        if (key == name) {
            screens[key].style.display = 'block';
        } else {
            screens[key].style.display = 'none';
        }
    }
}

function showFeedback(text, color) {
    feedback.textContent = text;
    feedback.style.color = color;
}

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

function startRound() {
    showScreen('countdown');
    runCountdown(countNum, function() {
        progress.textContent = (rounds.length + 1) + ' / ' + totalRounds;
        states = [];
        for (let i = 0; i < seatRowCount * seatColCount; i++) {
            if (Math.random() < 0.4) {
                states.push('sold');
            } else {
                states.push('empty');
            }
        }
        missed = 0;

        showScreen('play');
        drawSeats();
        updatePicked();
        showFeedback('', '#bbb');

        playing = true;
        startedAt = new Date().getTime();
        buyTimer = setInterval(othersBuy, 100);
    });
}

function startGame() {
    rounds = [];
    startRound();
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
        showFeedback(seatName(pick) + ' 좌석을 다른 사람이 먼저 예매했어요', '#ff6b66');
    }
    states[pick] = 'sold';
    paintSeat(pick);
    updatePicked();

    if (countState('empty') == 0 && countState('mine') == 0) {
        showFeedback('좌석이 모두 매진됐어요', '#ff6b66');
        endRound([]);
    }
}

function clickSeat(i) {
    if (!playing) {
        return;
    }
    if (states[i] == 'sold') {
        showFeedback('이미 판매된 좌석이에요', '#ff6b66');
        return;
    }
    if (states[i] == 'mine') {
        states[i] = 'empty';
        paintSeat(i);
        updatePicked();
        return;
    }
    if (countState('mine') >= maxSeats) {
        showFeedback('최대 ' + maxSeats + '석까지 선택할 수 있어요', '#f0c43c');
        return;
    }
    states[i] = 'mine';
    paintSeat(i);
    updatePicked();
}

function endRound(list) {
    playing = false;
    clearInterval(buyTimer);

    let timeMs = new Date().getTime() - startedAt;
    let count = list.length;
    let together = isTogether(list);
    let aisle = hasAisle(list);
    let score = seatScore(count, together, aisle, timeMs);

    rounds.push({
        seats: seatNames(list),
        count: count,
        together: together,
        aisle: aisle,
        missed: missed,
        timeMs: timeMs,
        score: score
    });

    if (count > 0) {
        let text = '예매 완료 · ' + count + '석';
        let tags = seatTags(count, together, aisle);
        if (tags != '') {
            text += ' · ' + tags;
        }
        showFeedback(text + ' · ' + score + '점', '#7ee08a');
    }

    if (rounds.length == totalRounds) {
        setTimeout(finish, 2000);
    } else {
        setTimeout(startRound, 2000);
    }
}

bookBtn.addEventListener('click', function() {
    if (!playing) {
        return;
    }
    let list = mySeats();
    if (list.length == 0) {
        showFeedback('좌석을 먼저 선택해 주세요', '#ff6b66');
        return;
    }
    endRound(list);
});

function finish() {
    let totalScore = 0;
    let seatTotal = 0;
    let fourTogether = 0;
    let missedTotal = 0;
    let timeTotal = 0;
    let booked = 0;

    for (let i = 0; i < rounds.length; i++) {
        let round = rounds[i];
        totalScore += round.score;
        seatTotal += round.count;
        missedTotal += round.missed;
        if (round.count == maxSeats && round.together) {
            fourTogether++;
        }
        if (round.count > 0) {
            timeTotal += round.timeMs;
            booked++;
        }
    }

    let avgTime = null;
    if (booked > 0) {
        avgTime = Math.round(timeTotal / booked);
    }
    let score = Math.round(totalScore / totalRounds);

    let metrics = {
        avgTimeMs: avgTime,
        seats: seatTotal,
        fourTogether: fourTogether,
        missed: missedTotal,
        score: score,
        grade: getGrade(score)
    };

    userData.addRecord({ mode: 'seat', trials: totalRounds, metrics: metrics, rounds: rounds });
    showResult(metrics);
}

function showResult(metrics) {
    showScreen('result');

    let avgText = '-';
    if (metrics.avgTimeMs != null) {
        avgText = toSec(metrics.avgTimeMs) + '초';
    }

    resultGrade.innerHTML =
        '<span>등급</span>' +
        '<b>' + metrics.grade + '</b>' +
        '<p>평균 ' + metrics.score + '점</p>';

    resultStats.innerHTML =
        '<div><span>평균 시간</span><b>' + avgText + '</b></div>' +
        '<div><span>확보 좌석</span><b>' + metrics.seats + ' / ' + (totalRounds * maxSeats) + '</b></div>' +
        '<div><span>4연석</span><b>' + metrics.fourTogether + ' / ' + totalRounds + '</b></div>' +
        '<div><span>놓친 좌석</span><b>' + metrics.missed + '석</b></div>';

    let output = '';
    for (let i = 0; i < rounds.length; i++) {
        let round = rounds[i];
        output += '<li>';
        output += '<span class="no">' + (i + 1) + '</span>';
        if (round.count > 0) {
            output += '<span class="seats">' + round.seats + '</span>';
            output += '<span class="time">' + toSec(round.timeMs) + '초</span>';
        } else {
            output += '<span class="seats fail">매진</span>';
            output += '<span class="time">-</span>';
        }
        output += '<span class="score">' + round.score + '점</span>';
        output += '<span class="tags">' + seatTags(round.count, round.together, round.aisle) + '</span>';
        output += '</li>';
    }
    resultList.innerHTML = output;
}

document.querySelector('.start-btn').addEventListener('click', function() {
    startGame();
});

document.querySelector('.retry').addEventListener('click', function() {
    startGame();
});
