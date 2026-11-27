let modeKeys = ['all', 'reaction', 'seat', 'captcha'];
let modeNames = {
    all: '통합 훈련',
    reaction: '정각 반응',
    seat: '좌석 선택',
    captcha: '보안문자'
};

let overall = document.querySelector('.overall');
let modeStats = document.querySelector('.mode-stats');
let filters = document.querySelectorAll('.filter');
let table = document.querySelector('.record-table');
let tableBody = document.querySelector('.record-table tbody');
let empty = document.querySelector('.empty');
let hint = document.querySelector('.hint');

let currentFilter = '';

function dateText(time) {
    let d = new Date(time);
    return (d.getMonth() + 1) + '.' + twoDigits(d.getDate()) + ' ' + twoDigits(d.getHours()) + ':' + twoDigits(d.getMinutes());
}

function scoreOf(record) {
    if (record.metrics == undefined || record.metrics.score == undefined) {
        return null;
    }
    return record.metrics.score;
}

function modeSummary(mode) {
    let list = userData.getRecords(mode);
    let best = null;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < list.length; i++) {
        let score = scoreOf(list[i]);
        if (score != null && (best == null || score > best)) {
            best = score;
        }
    }

    for (let i = list.length - 1; i >= 0 && count < 5; i--) {
        let score = scoreOf(list[i]);
        if (score != null) {
            sum += score;
            count++;
        }
    }

    let recent = null;
    if (count > 0) {
        recent = Math.round(sum / count);
    }
    return { total: list.length, best: best, recent: recent };
}

function renderSummary() {
    let stats = '';
    let sum = 0;
    let modes = 0;
    let total = 0;

    for (let i = 0; i < modeKeys.length; i++) {
        let summary = modeSummary(modeKeys[i]);
        total += summary.total;

        let bestText = '-';
        let recentText = '기록 없음';
        if (summary.best != null) {
            bestText = summary.best + '점';
        }
        if (summary.recent != null) {
            recentText = '최근 평균 ' + summary.recent + '점 · ' + summary.total + '회';
            sum += summary.recent;
            modes++;
        }

        stats += '<div><span>' + modeNames[modeKeys[i]] + '</span><b>' + bestText + '</b><p>' + recentText + '</p></div>';
    }
    modeStats.innerHTML = stats;

    if (modes == 0) {
        overall.innerHTML = '<span>전체 등급</span><b>-</b><p>아직 훈련 기록이 없어요</p>';
    } else {
        let score = Math.round(sum / modes);
        overall.innerHTML = '<span>전체 등급</span><b>' + getGrade(score) + '</b><p>평균 ' + score + '점 · 총 ' + total + '회 훈련</p>';
    }
}

function percent(rate) {
    return Math.round(rate * 1000) / 10 + '%';
}

function summaryText(record) {
    let m = record.metrics;
    if (record.mode == 'captcha') {
        return '평균 ' + toSec(m.avgTimeMs) + '초 · 오타율 ' + percent(m.typoRate) + ' · 정답 ' + m.correct + '/' + record.trials;
    }
    if (record.mode == 'reaction') {
        if (m.avgMs == null) {
            return '성공 0/' + record.trials;
        }
        return '평균 ' + m.avgMs + 'ms · 성공 ' + m.success + '/' + record.trials;
    }
    if (record.mode == 'seat') {
        let text = '확보 ' + m.seats + '석 · 4연석 ' + m.fourTogether + '회';
        if (m.avgTimeMs != null) {
            text += ' · 평균 ' + toSec(m.avgTimeMs) + '초';
        }
        return text;
    }
    if (record.mode == 'all') {
        if (m.seatCount > 0) {
            return '총 ' + toSec(m.totalMs) + '초 · ' + m.seats;
        }
        return '총 ' + toSec(m.totalMs) + '초 · 매진';
    }
    return '';
}

function seatLine(count, seats, together, aisle) {
    if (count == 0) {
        return '매진';
    }
    let text = seats;
    let tags = seatTags(count, together, aisle);
    if (tags != '') {
        text += ' · ' + tags;
    }
    return text;
}

function detailHtml(record) {
    let m = record.metrics;
    let lines = [];

    if (record.mode == 'all') {
        let reaction = '정각 반응 ' + m.reactionMs + 'ms';
        if (m.earlyClicks > 0) {
            reaction += ' · 일찍 누름 ' + m.earlyClicks + '회';
        }
        lines.push(reaction + ' · ' + m.reactionScore + '점');
        lines.push('보안문자 ' + toSec(m.captchaMs) + '초 · 재시도 ' + m.retries + '회 · 오타율 ' + percent(m.typoRate) + ' · ' + m.captchaScore + '점');
        let seat = '좌석 선택 ' + seatLine(m.seatCount, m.seats, m.together, m.aisle) + ' · ' + toSec(m.seatMs) + '초';
        if (m.missed > 0) {
            seat += ' · 놓친 좌석 ' + m.missed + '석';
        }
        lines.push(seat + ' · ' + m.seatScore + '점');
    } else if (record.rounds != undefined) {
        for (let i = 0; i < record.rounds.length; i++) {
            let r = record.rounds[i];
            let text = (i + 1) + '. ';
            if (record.mode == 'captcha') {
                text += r.typed;
                if (r.typos > 0) {
                    text += ' (정답 ' + r.answer + ')';
                }
                text += ' · 오타 ' + r.wrongKeys + ' · ' + toSec(r.timeMs) + '초';
            } else if (record.mode == 'reaction') {
                if (r.success) {
                    text += r.diffMs + 'ms 성공';
                } else {
                    text += toSec(-r.diffMs) + '초 빠름 실패';
                }
            } else if (record.mode == 'seat') {
                text += seatLine(r.count, r.seats, r.together, r.aisle) + ' · ' + r.score + '점';
                if (r.count > 0) {
                    text += ' · ' + toSec(r.timeMs) + '초';
                }
                if (r.missed > 0) {
                    text += ' · 놓친 좌석 ' + r.missed + '석';
                }
            }
            lines.push(text);
        }
    }

    let output = '';
    for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
            output += '<br>';
        }
        output += lines[i];
    }
    return output;
}

function renderTable() {
    let records = userData.getRecords();
    if (currentFilter != '') {
        records = userData.getRecords(currentFilter);
    }

    let output = '';
    for (let i = records.length - 1; i >= 0; i--) {
        let record = records[i];
        let score = scoreOf(record);
        let scoreText = '-';
        let gradeText = '-';
        if (score != null) {
            scoreText = score + '점';
            gradeText = record.metrics.grade;
        }

        output += '<tr class="record-row">';
        output += '<td>' + dateText(record.date) + '</td>';
        output += '<td>' + modeNames[record.mode] + '</td>';
        output += '<td class="score">' + scoreText + '</td>';
        output += '<td>' + gradeText + '</td>';
        output += '<td>' + summaryText(record) + '</td>';
        output += '</tr>';
        output += '<tr class="detail-row" style="display: none;"><td colspan="5">' + detailHtml(record) + '</td></tr>';
    }
    tableBody.innerHTML = output;

    let rows = tableBody.querySelectorAll('.record-row');
    let details = tableBody.querySelectorAll('.detail-row');
    for (let i = 0; i < rows.length; i++) {
        rows[i].addEventListener('click', function() {
            if (details[i].style.display == 'none') {
                details[i].style.display = '';
            } else {
                details[i].style.display = 'none';
            }
        });
    }

    if (records.length == 0) {
        table.style.display = 'none';
        hint.style.display = 'none';
        empty.style.display = 'block';
    } else {
        table.style.display = '';
        hint.style.display = 'block';
        empty.style.display = 'none';
    }
}

function renderFilters() {
    for (let i = 0; i < filters.length; i++) {
        let mode = '';
        if (i > 0) {
            mode = modeKeys[i - 1];
        }
        if (mode == currentFilter) {
            filters[i].setAttribute('class', 'filter filter-on');
        } else {
            filters[i].setAttribute('class', 'filter');
        }
    }
}

function render() {
    renderSummary();
    renderFilters();
    renderTable();
}

for (let i = 0; i < filters.length; i++) {
    filters[i].addEventListener('click', function() {
        if (i == 0) {
            currentFilter = '';
        } else {
            currentFilter = modeKeys[i - 1];
        }
        renderFilters();
        renderTable();
    });
}

document.querySelector('.reset-btn').addEventListener('click', function() {
    if (confirm('모든 훈련 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없어요.')) {
        userData.clear();
        render();
    }
});

render();
