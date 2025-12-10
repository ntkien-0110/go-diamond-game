function doGet(e) {
  var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'leaderboard';
  if (action === 'leaderboard') return leaderboard();
  if (action === 'questions') return questions();
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var data = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
  if (data && data.action === 'submit') {
    var ss = SpreadsheetApp.getActive();
    var sh = ss.getSheetByName('Scores');
    if (!sh) sh = ss.insertSheet('Scores');
    if (sh.getLastRow() === 0) sh.appendRow(['name','team','score','completedAt']);
    var rows = sh.getDataRange().getValues();
    if (rows.length > 0) rows.shift();
    var n = (data.name||'').toString().trim().toLowerCase();
    var t = (data.team||'').toString().trim().toLowerCase();
    var exists = rows.some(function(r){ return (r[0]||'').toString().trim().toLowerCase()===n && (r[1]||'').toString().trim().toLowerCase()===t; });
    if (exists) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, reason: 'duplicate' })).setMimeType(ContentService.MimeType.JSON);
    }
    sh.appendRow([data.name, data.team, data.score, data.completedAt]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
}

function leaderboard() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Scores');
  var rows = sh ? sh.getDataRange().getValues() : [];
  if (rows.length > 0) rows.shift();
  rows.sort(function(a,b){ return (b[2]-a[2]) || (a[3]-b[3]); });
  var out = rows.map(function(r){ return { name:r[0], team:r[1], score:r[2], completedAt:r[3] }; });
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function questions() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Questions');
  var rows = sh ? sh.getDataRange().getValues() : [];
  if (rows.length > 0) rows.shift();
  var out = rows.map(function(r){
    var levelId=r[0], text=r[1], a=r[2], b=r[3], c=r[4], d=r[5], correct=r[6];
    var opts=[
      {text:a,correct:correct==='A'},
      {text:b,correct:correct==='B'},
      {text:c,correct:correct==='C'},
      {text:d,correct:correct==='D'}
    ];
    return { levelId: levelId, text: text, options: opts };
  });
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
