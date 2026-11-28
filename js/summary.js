let aiUrl = 'http://ai.int.vitamin.moe:11434/api/chat';
let aiModel = 'gemma4:12b';
let summaryKey = 'ticketlab-summary';

let summaryBox = document.querySelector('.summary-text');

let coachRule = '너는 티켓팅 연습 사이트 TicketLAB의 코치야. ' +
    '사용자의 훈련 기록을 보고 한국어 존댓말로 2~3문장만 써. ' +
    '가장 부족한 훈련과 그걸 고칠 구체적인 연습 방법 하나, 잘하고 있는 점 하나를 말해. ' +
    '제목, 목록, 마크다운, 이모지는 쓰지 마.';

function showSummary(text) {
    summaryBox.textContent = text;
}

function recentAverage(list) {
    let sum = 0;
    let count = 0;
    for (let i = list.length - 1; i >= 0 && count < 5; i--) {
        if (list[i].metrics != undefined && list[i].metrics.score != undefined) {
            sum += list[i].metrics.score;
            count++;
        }
    }
    if (count == 0) {
        return null;
    }
    return Math.round(sum / count);
}

function recordsText() {
    let text = '점수는 모두 100점 만점이야.\n';
    for (let i = 0; i < modeKeys.length; i++) {
        let list = userData.getRecords(modeKeys[i]);
        text += '[' + modeNames[modeKeys[i]] + '] ';
        if (list.length == 0) {
            text += '기록 없음\n';
        } else {
            let line = list.length + '회';
            let avg = recentAverage(list);
            if (avg != null) {
                line += ', 최근 평균 ' + avg + '점';
            }
            line += ', 가장 최근: ' + summaryText(list[list.length - 1]);
            text += line + '\n';
        }
    }
    return text;
}

function cleanText(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] != '*' && text[i] != '#') {
            result += text[i];
        }
    }
    return result;
}

function loadSaved(records) {
    let saved = localStorage.getItem(summaryKey);
    if (!saved) {
        return null;
    }
    saved = JSON.parse(saved);
    if (saved.count == records.length && saved.lastDate == records[records.length - 1].date) {
        return saved.text;
    }
    return null;
}

function requestSummary() {
    let records = userData.getRecords();
    if (records.length == 0) {
        showSummary('아직 훈련 기록이 없어요. 훈련을 하면 AI가 기록을 요약해 드려요.');
        return;
    }

    let saved = loadSaved(records);
    if (saved != null) {
        showSummary(saved);
        return;
    }

    showSummary('AI가 훈련 기록을 분석하고 있어요...');

    let answered = false;
    setTimeout(function() {
        if (!answered) {
            showSummary('AI 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요.');
        }
    }, 20000);

    let body = {
        model: aiModel,
        stream: false,
        think: false,
        options: { num_predict: 300, temperature: 0.6 },
        messages: [
            { role: 'system', content: coachRule },
            { role: 'user', content: recordsText() }
        ]
    };

    fetch(aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(function(response) {
        if (!response.ok) {
            return null;
        }
        return response.json();
    }).then(function(data) {
        answered = true;
        if (data == null || data.message == undefined || data.message.content == '') {
            showSummary('AI가 요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
            return;
        }
        let text = cleanText(data.message.content);
        localStorage.setItem(summaryKey, JSON.stringify({
            count: records.length,
            lastDate: records[records.length - 1].date,
            text: text
        }));
        showSummary(text);
    }).catch(function() {
        if (!answered) {
            answered = true;
            showSummary('AI 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
        }
    });
}

requestSummary();
