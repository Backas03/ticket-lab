let totalRounds = 5;

let screens = {
    intro: document.querySelector('.intro'),
    play: document.querySelector('.play'),
    result: document.querySelector('.result')
};

let clock = document.querySelector('.clock');
let target = document.querySelector('.target');
let progress = document.querySelector('.progress');
let bookBtn = document.querySelector('.book-btn');
let feedback = document.querySelector('.feedback');
let resultGrade = document.querySelector('.result-grade');
let resultStats = document.querySelector('.result-stats');
let resultList = document.querySelector('.result-list');

let targetTime = 0;
let openAt = 0;
let opened = false;
let waiting = false;
let timer = 0;
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

function nextRound() {
    progress.textContent = (rounds.length + 1) + ' / ' + totalRounds;

    let now = new Date();
    targetTime = (now.getHours() * 60 + now.getMinutes() + 1) * 60000;
    openAt = now.getTime() + 3000 + Math.floor(Math.random() * 2001);
    opened = false;
    waiting = true;

    setWaiting();
    target.textContent = formatTime(targetTime, false) + ' 오픈';
    showFeedback('', '#bbb');
    timer = setInterval(tick, 10);
    tick();
}

function startGame() {
    rounds = [];
    showScreen('play');
    nextRound();
}

bookBtn.addEventListener('click', function() {
    if (!waiting) {
        return;
    }
    waiting = false;
    clearInterval(timer);

    let diff = new Date().getTime() - openAt;
    clock.textContent = formatTime(targetTime + diff, true);

    if (diff < 0) {
        rounds.push({ success: false, diffMs: diff });
        showFeedback('실패 · ' + toSec(-diff) + '초 일찍 눌렀어요', '#ff6b66');
    } else {
        rounds.push({ success: true, diffMs: diff });
        showFeedback('성공 · ' + diff + 'ms', '#7ee08a');
    }

    if (rounds.length == totalRounds) {
        setTimeout(finish, 1500);
    } else {
        setTimeout(nextRound, 2000);
    }
});

function finish() {
    let success = 0;
    let total = 0;
    let best = null;

    for (let i = 0; i < rounds.length; i++) {
        if (rounds[i].success) {
            success++;
            total += rounds[i].diffMs;
            if (best == null || rounds[i].diffMs < best) {
                best = rounds[i].diffMs;
            }
        }
    }

    let avg = null;
    let deviation = null;
    let speedScore = 0;

    if (success > 0) {
        avg = Math.round(total / success);
        let sum = 0;
        for (let i = 0; i < rounds.length; i++) {
            if (rounds[i].success) {
                sum += (rounds[i].diffMs - avg) * (rounds[i].diffMs - avg);
            }
        }
        deviation = Math.round(Math.sqrt(sum / success));
        speedScore = limitScore(Math.round(100 - (avg - 50) / 5));
    }

    let successScore = Math.round(success / totalRounds * 100);
    let score = Math.round(speedScore * 0.6 + successScore * 0.4);

    let metrics = {
        avgMs: avg,
        bestMs: best,
        deviationMs: deviation,
        success: success,
        speedScore: speedScore,
        successScore: successScore,
        score: score,
        grade: getGrade(score)
    };

    userData.addRecord({ mode: 'reaction', trials: totalRounds, metrics: metrics, rounds: rounds });
    showResult(metrics);
}

function msText(value, front) {
    if (value == null) {
        return '-';
    }
    return front + value + 'ms';
}

function showResult(metrics) {
    showScreen('result');

    resultGrade.innerHTML =
        '<span>등급</span>' +
        '<b>' + metrics.grade + '</b>' +
        '<p>' + metrics.score + '점 · 속도 ' + metrics.speedScore + '점 · 성공 ' + metrics.successScore + '점</p>';

    resultStats.innerHTML =
        '<div><span>평균 반응</span><b>' + msText(metrics.avgMs, '') + '</b></div>' +
        '<div><span>최고 기록</span><b>' + msText(metrics.bestMs, '') + '</b></div>' +
        '<div><span>편차</span><b>' + msText(metrics.deviationMs, '±') + '</b></div>' +
        '<div><span>성공</span><b>' + metrics.success + ' / ' + totalRounds + '</b></div>';

    let output = '';
    for (let i = 0; i < rounds.length; i++) {
        let round = rounds[i];
        output += '<li>';
        output += '<span class="no">' + (i + 1) + '</span>';
        if (round.success) {
            output += '<span class="value">' + round.diffMs + 'ms</span>';
            output += '<span class="state ok">성공</span>';
        } else {
            output += '<span class="value fail">실패</span>';
            output += '<span class="state fail">' + toSec(-round.diffMs) + '초 빠름</span>';
        }
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
