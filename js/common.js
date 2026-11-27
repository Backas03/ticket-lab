let seatRowNames = 'ABCDEFGHIJ';
let seatRowCount = 10;
let seatColCount = 20;

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

function twoDigits(n) {
    if (n < 10) {
        return '0' + n;
    }
    return '' + n;
}

function threeDigits(n) {
    if (n < 10) {
        return '00' + n;
    } else if (n < 100) {
        return '0' + n;
    }
    return '' + n;
}

function formatTime(ms, withMs) {
    let oneDay = 24 * 60 * 60 * 1000;
    while (ms < 0) {
        ms += oneDay;
    }
    while (ms >= oneDay) {
        ms -= oneDay;
    }

    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    let text = twoDigits(h) + ':' + twoDigits(m) + ':' + twoDigits(s);
    if (withMs) {
        text += '.' + threeDigits(ms % 1000);
    }
    return text;
}

function seatName(i) {
    return seatRowNames[Math.floor(i / seatColCount)] + (i % seatColCount + 1);
}

function seatNames(list) {
    let text = '';
    for (let k = 0; k < list.length; k++) {
        if (k > 0) {
            text += ' ';
        }
        text += seatName(list[k]);
    }
    return text;
}

function blockOf(i) {
    let col = i % seatColCount;
    if (col < 5) {
        return 0;
    } else if (col < 15) {
        return 1;
    }
    return 2;
}

function isAisle(i) {
    let col = i % seatColCount;
    return col == 4 || col == 5 || col == 14 || col == 15;
}

function hasAisle(list) {
    for (let k = 0; k < list.length; k++) {
        if (isAisle(list[k])) {
            return true;
        }
    }
    return false;
}

function isTogether(list) {
    if (list.length < 2) {
        return false;
    }
    let first = list[0];
    let last = list[list.length - 1];
    if (Math.floor(first / seatColCount) != Math.floor(last / seatColCount)) {
        return false;
    }
    if (blockOf(first) != blockOf(last)) {
        return false;
    }
    return last - first == list.length - 1;
}

function seatTags(count, together, aisle) {
    let text = '';
    if (together) {
        text += count + '연석';
    }
    if (aisle) {
        if (text != '') {
            text += ' · ';
        }
        text += '복도';
    }
    return text;
}

function seatScore(count, together, aisle, timeMs) {
    if (count == 0) {
        return 0;
    }
    let score = count * 10;
    if (together) {
        score += count * 5;
    }
    if (aisle) {
        score += 10;
    }
    let timeScore = limitScore(Math.round(100 - (timeMs / 1000 - 3) * 7));
    return score + Math.round(timeScore * 0.3);
}

function seatMapHtml() {
    let output = '<div class="stage">STAGE</div>';
    for (let r = 0; r < seatRowCount; r++) {
        output += '<div class="seat-row">';
        output += '<span class="row-name">' + seatRowNames[r] + '</span>';
        for (let c = 0; c < seatColCount; c++) {
            if (c == 5 || c == 15) {
                output += '<span class="aisle"></span>';
            }
            output += '<span class="seat"></span>';
        }
        output += '</div>';
    }
    return output;
}
