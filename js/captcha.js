let totalRounds = 5;
let codeLength = 6;
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let screens = {
    intro: document.querySelector('.intro'),
    countdown: document.querySelector('.countdown'),
    play: document.querySelector('.play'),
    result: document.querySelector('.result')
};

let countNum = document.querySelector('.countdown-num');
let captchaBox = document.querySelector('.captcha');
let progress = document.querySelector('.progress');
let answerForm = document.querySelector('.answer-form');
let answerInput = document.querySelector('.answer');
let feedback = document.querySelector('.feedback');
let resultStats = document.querySelector('.result-stats');
let resultList = document.querySelector('.result-list');

let answer = '';
let shownAt = 0;
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

function random(min, max) {
    return Math.round(min + Math.random() * (max - min));
}

function toSec(ms) {
    return Math.round(ms / 10) / 100;
}

function startCountdown() {
    showScreen('countdown');
    let count = 3;
    countNum.textContent = count;

    let timer = setInterval(function() {
        count--;
        if (count > 0) {
            countNum.textContent = count;
        } else {
            clearInterval(timer);
            showScreen('play');
            nextRound();
        }
    }, 1000);
}

function randomCode() {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }
    return code;
}

function drawCaptcha(code) {
    let output = '';
    for (let i = 0; i < code.length; i++) {
        output += '<span style="font-size: ' + random(30, 38) + 'px;">' + code[i] + '</span>';
    }
    captchaBox.innerHTML = output;
}

function nextRound() {
    progress.textContent = (rounds.length + 1) + ' / ' + totalRounds;
    answer = randomCode();
    drawCaptcha(answer);
    answerInput.value = '';
    answerInput.focus();
    shownAt = new Date().getTime();
}

answerInput.addEventListener('input', function() {
    let typed = answerInput.value.toUpperCase();
    let cleaned = '';
    for (let i = 0; i < typed.length; i++) {
        let ch = typed[i];
        if (ch >= 'ㄱ' && ch <= '힣') {
            feedback.textContent = '한글로 입력되고 있어요. 한/영 키를 눌러주세요.';
        }
        if (ch >= 'A' && ch <= 'Z') {
            cleaned += ch;
        }
    }
    answerInput.value = cleaned;
});

answerForm.onsubmit = function() {
    let typed = answerInput.value.toUpperCase();
    if (typed.length < codeLength) {
        feedback.textContent = '6자리를 모두 입력해 주세요.';
        return false;
    }

    let timeMs = new Date().getTime() - shownAt;
    let typos = 0;
    for (let i = 0; i < codeLength; i++) {
        if (typed[i] != answer[i]) {
            typos++;
        }
    }

    rounds.push({ answer: answer, typed: typed, typos: typos, timeMs: timeMs });

    if (typos == 0) {
        feedback.textContent = '정답 · ' + toSec(timeMs) + '초';
    } else {
        feedback.textContent = '오타 ' + typos + '개 · ' + toSec(timeMs) + '초';
    }

    if (rounds.length == totalRounds) {
        finish();
    } else {
        nextRound();
    }
    return false;
};

function finish() {
    let totalTime = 0;
    let totalTypos = 0;
    let bestTime = rounds[0].timeMs;
    let correct = 0;

    for (let i = 0; i < rounds.length; i++) {
        totalTime += rounds[i].timeMs;
        totalTypos += rounds[i].typos;
        if (rounds[i].timeMs < bestTime) {
            bestTime = rounds[i].timeMs;
        }
        if (rounds[i].typos == 0) {
            correct++;
        }
    }

    let metrics = {
        avgTimeMs: Math.round(totalTime / totalRounds),
        bestTimeMs: bestTime,
        typoRate: totalTypos / (totalRounds * codeLength),
        correct: correct
    };

    userData.addRecord({ mode: 'captcha', trials: totalRounds, metrics: metrics, rounds: rounds });
    showResult(metrics);
}

function markTypos(round) {
    let output = '';
    for (let i = 0; i < round.typed.length; i++) {
        if (round.typed[i] == round.answer[i]) {
            output += round.typed[i];
        } else {
            output += '<em>' + round.typed[i] + '</em>';
        }
    }
    return output;
}

function showResult(metrics) {
    showScreen('result');

    resultStats.innerHTML =
        '<div><span>평균 시간</span><b>' + toSec(metrics.avgTimeMs) + '초</b></div>' +
        '<div><span>최고 기록</span><b>' + toSec(metrics.bestTimeMs) + '초</b></div>' +
        '<div><span>오타율</span><b>' + Math.round(metrics.typoRate * 1000) / 10 + '%</b></div>' +
        '<div><span>정답</span><b>' + metrics.correct + ' / ' + totalRounds + '</b></div>';

    let output = '';
    for (let i = 0; i < rounds.length; i++) {
        let round = rounds[i];
        output += '<li>';
        output += '<span class="no">' + (i + 1) + '</span>';
        output += '<span class="word">' + markTypos(round);
        if (round.typos > 0) {
            output += '<span class="correct-hint">정답 ' + round.answer + '</span>';
        }
        output += '</span>';
        output += '<span class="time">' + toSec(round.timeMs) + '초</span>';
        output += '</li>';
    }
    resultList.innerHTML = output;
}

document.querySelector('.start-btn').addEventListener('click', function() {
    startCountdown();
});

document.querySelector('.retry').addEventListener('click', function() {
    rounds = [];
    feedback.textContent = '';
    startCountdown();
});
