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

document.querySelector('.start-btn').addEventListener('click', function() {
    startCountdown();
});
