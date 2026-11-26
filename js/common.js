function toSec(ms) {
    return Math.round(ms / 10) / 100;
}

function runCountdown(numberBox, done) {
    let count = 3;
    numberBox.textContent = count;

    let timer = setInterval(function() {
        count--;
        if (count > 0) {
            numberBox.textContent = count;
        } else {
            clearInterval(timer);
            done();
        }
    }, 1000);
}

function limitScore(score) {
    if (score > 100) {
        return 100;
    }
    if (score < 0) {
        return 0;
    }
    return score;
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
