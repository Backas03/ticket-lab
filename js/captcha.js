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
let answerSlots = document.querySelector('.answer-slots');
let feedback = document.querySelector('.feedback');
let resultGrade = document.querySelector('.result-grade');
let resultStats = document.querySelector('.result-stats');
let resultList = document.querySelector('.result-list');

let answer = '';
let typed = '';
let wrongKeys = 0;
let totalKeys = 0;
let shownAt = 0;
let playing = false;
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

function toSec(ms) {
    return Math.round(ms / 10) / 100;
}

function showFeedback(text, color) {
    feedback.textContent = text;
    feedback.style.color = color;
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
            playing = true;
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

function nextRound() {
    progress.textContent = (rounds.length + 1) + ' / ' + totalRounds;
    answer = randomCode();
    captchaBox.textContent = answer;
    typed = '';
    wrongKeys = 0;
    totalKeys = 0;
    drawSlots();
    shownAt = new Date().getTime();
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

function submitAnswer() {
    if (typed.length < codeLength) {
        showFeedback('6자리를 모두 입력해 주세요.', '#ff6b66');
        return;
    }

    let timeMs = new Date().getTime() - shownAt;
    let typos = 0;
    for (let i = 0; i < codeLength; i++) {
        if (typed[i] != answer[i]) {
            typos++;
        }
    }

    rounds.push({
        answer: answer,
        typed: typed,
        typos: typos,
        wrongKeys: wrongKeys,
        totalKeys: totalKeys,
        timeMs: timeMs
    });

    if (typos == 0 && wrongKeys == 0) {
        showFeedback('정답 · ' + toSec(timeMs) + '초', '#7ee08a');
    } else if (typos == 0) {
        showFeedback('정답 · 오타 ' + wrongKeys + '번 수정 · ' + toSec(timeMs) + '초', '#f0c43c');
    } else {
        showFeedback('오답 · 틀린 글자 ' + typos + '개 · ' + toSec(timeMs) + '초', '#ff6b66');
    }

    if (rounds.length == totalRounds) {
        finish();
    } else {
        nextRound();
    }
}

document.onkeydown = function(event) {
    if (!playing) {
        return true;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return true;
    }

    let key = event.key;

    if (key == 'Enter') {
        submitAnswer();
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
        showFeedback('한글로 입력되고 있어요. 한/영 키를 눌러주세요.', '#ff6b66');
        return false;
    }

    if (key.length == 1) {
        let ch = key.toUpperCase();
        if (ch >= 'A' && ch <= 'Z') {
            typeLetter(ch);
            return false;
        }
        if (ch >= 'ㄱ' && ch <= '힣') {
            showFeedback('한글로 입력되고 있어요. 한/영 키를 눌러주세요.', '#ff6b66');
            return false;
        }
    }

    return true;
};

function finish() {
    playing = false;

    let totalTime = 0;
    let bestTime = rounds[0].timeMs;
    let allWrong = 0;
    let allKeys = 0;
    let correct = 0;

    for (let i = 0; i < rounds.length; i++) {
        totalTime += rounds[i].timeMs;
        allWrong += rounds[i].wrongKeys;
        allKeys += rounds[i].totalKeys;
        if (rounds[i].timeMs < bestTime) {
            bestTime = rounds[i].timeMs;
        }
        if (rounds[i].typos == 0) {
            correct++;
        }
    }

    let avgTime = Math.round(totalTime / totalRounds);
    let typoRate = allWrong / allKeys;

    let speedScore = Math.round(100 - (avgTime / 1000 - 3) * 10);
    if (speedScore > 100) {
        speedScore = 100;
    }
    if (speedScore < 0) {
        speedScore = 0;
    }
    let accuracyScore = Math.round(correct / totalRounds * (1 - typoRate) * 100);
    let score = Math.round(speedScore * 0.6 + accuracyScore * 0.4);

    let metrics = {
        avgTimeMs: avgTime,
        bestTimeMs: bestTime,
        typoRate: typoRate,
        correct: correct,
        speedScore: speedScore,
        accuracyScore: accuracyScore,
        score: score,
        grade: getGrade(score)
    };

    userData.addRecord({ mode: 'captcha', trials: totalRounds, metrics: metrics, rounds: rounds });
    showResult(metrics);
}

function getGrade(score) {
    if (score >= 90) {
        return '마스터';
    } else if (score >= 75) {
        return '고수';
    } else if (score >= 60) {
        return '프로';
    } else if (score >= 40) {
        return '루키';
    } else {
        return '뉴비';
    }
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

    resultGrade.innerHTML =
        '<span>등급</span>' +
        '<b>' + metrics.grade + '</b>' +
        '<p>' + metrics.score + '점 · 속도 ' + metrics.speedScore + '점 · 정확도 ' + metrics.accuracyScore + '점</p>';

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
        output += '<span class="miss">오타 ' + round.wrongKeys + '</span>';
        output += '</li>';
    }
    resultList.innerHTML = output;
}

document.querySelector('.start-btn').addEventListener('click', function() {
    startCountdown();
});

document.querySelector('.submit-btn').addEventListener('click', function() {
    submitAnswer();
});

document.querySelector('.retry').addEventListener('click', function() {
    rounds = [];
    showFeedback('', '#bbb');
    startCountdown();
});
