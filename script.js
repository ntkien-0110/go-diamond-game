(() => {
  const nameEl = document.getElementById('playerName');
  const teamEl = document.getElementById('playerTeam');
  const startBtn = document.getElementById('startBtn');
  const register = document.getElementById('register');
  const game = document.getElementById('game');
  const final = document.getElementById('final');
  const levelName = document.getElementById('levelName');
  const scoreEl = document.getElementById('score');
  const questionText = document.getElementById('questionText');
  const optionsBox = document.getElementById('options');
  const feedback = document.getElementById('feedback');
  const icons = document.getElementById('icons');
  const finalTitle = document.getElementById('finalTitle');
  const totalScore = document.getElementById('totalScore');
  const leaderboardBox = document.getElementById('leaderboard');
  const saveStatus = document.getElementById('saveStatus');
  const shareLink = document.getElementById('shareLink');
  const viewLeaderboardBtn = document.getElementById('viewLeaderboard');
  const registerMsg = document.getElementById('registerMsg');
  const celebrate = document.getElementById('celebrate');
  const fwCanvas = document.getElementById('fwCanvas');

  const levels = [
    { id: '3', name: '3%' },
    { id: '6', name: '6%' },
    { id: '12', name: '12%' },
    { id: '15', name: '15%' },
    { id: 'silver', name: 'Silver' },
    { id: 'gold', name: 'Gold' },
    { id: 'platinum', name: 'Platinum' },
    { id: 'emerald', name: 'Emerald' },
    { id: 'diamond', name: 'Diamond' }
  ];

  const baseQuestions = [
    'Chọn đáp án đúng để qua mốc',
    'Giải mã đáp án chính xác',
    'Chọn phương án chuẩn xác',
    'Đưa ra lựa chọn đúng',
    'Kiểm chứng kiến thức ở mốc này',
    'Tiếp tục thể hiện phong độ',
    'Mốc khó, chọn thật chuẩn',
    'Cận đích, chọn đáp án đúng',
    'Cú chốt hạ để thành Diamond'
  ];

  const questionBank = levels.map((lvl, i) => ({
    levelId: lvl.id,
    text: baseQuestions[i] + ' (' + lvl.name + ')',
    options: [
      { text: 'Đáp án A', correct: true },
      { text: 'Đáp án B', correct: false },
      { text: 'Đáp án C', correct: false },
      { text: 'Đáp án D', correct: false }
    ]
  }));

  let current = 0;
  let score = 0;
  let attempts = 0;
  let player = null;
  let dynamicQuestions = null;

  const levelIcons = {
    '3': '📈',
    '6': '📈',
    '12': '📈',
    '15': '📈',
    'silver': '🥈',
    'gold': '🥇',
    'platinum': '💠',
    'emerald': '💚',
    'diamond': '💎'
  };
  const levelScale = {
    '3': 0.95,
    '6': 1.00,
    '12': 1.02,
    '15': 1.04,
    'silver': 1.06,
    'gold': 1.08,
    'platinum': 1.10,
    'emerald': 1.12,
    'diamond': 1.15
  };
  let audioCtx;
  function getAudioCtx(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function beep(freq, start, duration, type, vol){
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    o.connect(g); g.connect(ctx.destination);
    o.start(ctx.currentTime + start);
    o.stop(ctx.currentTime + start + duration + 0.02);
  }
  function playCorrect(){
    try { beep(880,0,0.16,'sine',0.22); beep(1320,0.16,0.16,'sine',0.22); } catch(e) {}
  }
  function playWrong(){
    try { beep(220,0,0.26,'square',0.2); beep(180,0.24,0.26,'square',0.2); } catch(e) {}
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  

  function chipClass(id) {
    if (['3','6','12','15'].includes(id)) return 'percent';
    if (id === 'silver') return 'silver';
    if (id === 'gold') return 'gold';
    if (id === 'platinum') return 'platinum';
    if (id === 'emerald') return 'emerald';
    if (id === 'diamond') return 'diamond';
    return '';
  }

  function updateStatus() {
    levelName.textContent = levels[current].name;
    scoreEl.textContent = score;
  }

  function renderQuestion() {
    const q = (dynamicQuestions || questionBank)[current];
    questionText.textContent = q.text;
    optionsBox.innerHTML = '';
    feedback.textContent = '';
    const opts = shuffle(q.options);
    opts.forEach(opt => {
      const b = document.createElement('button');
      b.textContent = opt.text;
      b.addEventListener('click', () => handleAnswer(opt, b));
      optionsBox.appendChild(b);
    });
  }

  function handleAnswer(opt, button) {
    const opts = Array.from(optionsBox.querySelectorAll('button'));
    if (opt.correct) {
      let add = 0;
      if (attempts === 0) add = 100;
      else if (attempts === 1) add = 50;
      else if (attempts === 2) add = 25;
      else add = 0;
      score += add;
      updateStatus();
      feedback.textContent = add > 0 ? ('Đúng, +'+add+' điểm') : 'Đúng, 0 điểm';
      opts.forEach(o => o.disabled = true);
      button.classList.add('correct');
      playCorrect();
      addIcon(levels[current]);
      if (current === levels.length - 1) {
        setTimeout(finishGame, 400);
      } else {
        floatLevelMessage(levels[current]);
        setTimeout(advanceLevel, 2600);
      }
    } else {
      attempts += 1;
      feedback.textContent = 'Sai lần ' + attempts + ', hãy chọn lại';
      playWrong();
      button.classList.add('wrong');
    }
  }

  function floatLevelMessage(lvl) {
    const msg = document.createElement('div');
    msg.className = 'float-badge';
    msg.textContent = 'Bạn đã đạt mốc ' + lvl.name + ', cố gắng lên mốc tiếp theo nhé!';
    document.body.appendChild(msg);
    setTimeout(() => { msg.remove(); }, 2200);
  }

  function addIcon(lvl) {
    const chip = document.createElement('div');
    chip.className = 'chip ' + chipClass(lvl.id);
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = levelIcons[lvl.id] || '⭐';
    const text = document.createElement('span');
    text.textContent = lvl.name;
    chip.appendChild(icon);
    chip.appendChild(text);
    const sc = levelScale[lvl.id] || 1;
    chip.style.transform = 'scale(' + sc + ')';
    icons.appendChild(chip);
  }

  function advanceLevel() {
    if (current < levels.length - 1) {
      current += 1;
      attempts = 0;
      updateStatus();
      renderQuestion();
    } else {
      finishGame();
    }
  }

  function finishGame() {
    game.classList.add('hidden');
    final.classList.remove('hidden');
    finalTitle.textContent = 'Bạn đã trở thành Diamond A70';
    totalScore.textContent = score;
    shareLink.href = location.href;
    triggerCelebrate('confetti');
    triggerCelebrate('heart');
    triggerFireworks();
    playFanfare();
    submitResult().then(loadLeaderboard);
  }

  function triggerCelebrate(type) {
    celebrate.classList.remove('hidden');
    const count = 90;
    for (let i = 0; i < count; i++) {
      if (type === 'confetti') {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.left = Math.random()*100 + 'vw';
        el.style.background = ['#f59e0b','#06b6d4','#7c3aed','#22c55e','#ef4444'][Math.floor(Math.random()*5)];
        el.style.animation = 'fall ' + (1.5 + Math.random()*1.2) + 's ease-out';
        el.style.transform = 'rotate(' + Math.random()*360 + 'deg)';
        celebrate.appendChild(el);
      } else {
        const el = document.createElement('div');
        el.className = 'heart';
        el.textContent = '💖';
        el.style.left = Math.random()*100 + 'vw';
        el.style.animation = 'fall ' + (1.6 + Math.random()*1.2) + 's ease-out';
        celebrate.appendChild(el);
      }
    }
    setTimeout(() => { celebrate.innerHTML=''; celebrate.classList.add('hidden'); }, 2200);
  }

  function triggerFireworks() {
    if (!fwCanvas) return;
    celebrate.classList.remove('hidden');
    const ctx = fwCanvas.getContext('2d');
    const W = fwCanvas.width = window.innerWidth;
    const H = fwCanvas.height = window.innerHeight;
    let particles = [];
    function burst(x, y, color) {
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, alpha: 1, color, life: Math.random() * 50 + 40 });
      }
    }
    const colors = ['#f59e0b','#06b6d4','#7c3aed','#22c55e','#ef4444','#67e8f9'];
    for (let b = 0; b < 6; b++) {
      setTimeout(() => { burst(Math.random()*W*0.8+W*0.1, Math.random()*H*0.5+H*0.2, colors[b%colors.length]); }, b*200);
    }
    let t = 0;
    function loop(){
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => {
        p.vx *= 0.99; p.vy = p.vy*0.99 + 0.05; p.x += p.vx; p.y += p.vy; p.alpha -= 0.008; p.life -= 1;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI*2); ctx.fill();
      });
      particles = particles.filter(p => p.life > 0 && p.alpha > 0);
      t += 1;
      if (t < 180) requestAnimationFrame(loop); else { ctx.clearRect(0,0,W,H); celebrate.classList.add('hidden'); }
    }
    loop();
  }

  function playFanfare() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [440, 554.37, 659.25, 880];
      const start = ctx.currentTime;
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, start + i*0.25);
        g.gain.exponentialRampToValueAtTime(0.3, start + i*0.25 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, start + i*0.25 + 0.22);
        o.connect(g); g.connect(ctx.destination);
        o.start(start + i*0.25); o.stop(start + i*0.25 + 0.24);
      });
    } catch(e) {}
  }

  function submitResult() {
    const payload = {
      action: 'submit',
      name: player.name,
      team: player.team,
      score,
      completedAt: Date.now()
    };
    if (window.API_URL) {
      const form = new URLSearchParams();
      form.append('action', 'submit');
      form.append('name', payload.name);
      form.append('team', payload.team);
      form.append('score', String(payload.score));
      form.append('completedAt', String(payload.completedAt));
      return fetch(window.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      }).then(async r => {
        let data = null; try { data = await r.json(); } catch(e){}
        if (data && data.ok) {
          if (saveStatus) saveStatus.textContent = 'Đã lưu điểm lên bảng xếp hạng.';
        } else if (data && data.reason === 'duplicate') {
          if (saveStatus) saveStatus.textContent = 'Tên/Tổ này đã tham gia trước đó, không ghi điểm lần nữa.';
        } else {
          if (saveStatus) saveStatus.textContent = 'Không thể lưu điểm lên bảng xếp hạng. Thử lại sau.';
          await fallbackSubmit(payload);
        }
      }).catch(async () => {
        // Fallback: thử JSON không-cors (đọc response không khả dụng nhưng vẫn gửi)
        try {
          await fetch(window.API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
          if (saveStatus) saveStatus.textContent = 'Đã gửi điểm (no-cors). Kiểm tra Sheet sau ít phút.';
        } catch(e) {
          if (saveStatus) saveStatus.textContent = 'Mạng lỗi, lưu tạm cục bộ.';
          await fallbackSubmit(payload);
        }
      });
    }
    return fallbackSubmit(payload);
  }

  function fallbackSubmit(p) {
    const key = 'gdg_scores';
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    data.push(p);
    localStorage.setItem(key, JSON.stringify(data));
    return Promise.resolve();
  }

  function loadLeaderboard() {
    if (window.API_URL) {
      return fetch(window.API_URL + '?action=leaderboard')
        .then(r => r.json())
        .then(renderBoard)
        .catch(() => renderBoard(getLocalBoard()));
    }
    renderBoard(getLocalBoard());
  }

  function getLocalBoard() {
    const key = 'gdg_scores';
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return data
      .sort((a,b) => (b.score - a.score) || (a.completedAt - b.completedAt));
  }

  function renderBoard(rows) {
    const table = document.createElement('table');
    table.className = 'board';
    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    ['Hạng','#','Họ tên','Tổ','Điểm','Thời gian'].forEach(t => {
      const th = document.createElement('th'); th.textContent = t; hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    const tbody = document.createElement('tbody');
    const rankIcon = ['🥇','🥈','🥉'];
    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      const time = new Date(r.completedAt).toLocaleString();
      const cells = [rankIcon[i] || '—', i+1, r.name, r.team, r.score, time];
      cells.forEach(val => {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    leaderboardBox.innerHTML = '';
    leaderboardBox.appendChild(table);
  }

  async function prepareQuestions() {
    let fallback = questionBank.slice();
    if (window.API_URL) {
      try {
        const res = await fetch(window.API_URL + '?action=questions');
        const data = await res.json();
        const map = {};
        data.forEach(q => { map[q.levelId] = q; });
        dynamicQuestions = levels.map((l, idx) => map[l.id] || fallback[idx]);
      } catch (e) {
        dynamicQuestions = fallback;
      }
    } else {
      try {
        const res = await fetch('sample-data/questions.csv');
        const txt = await res.text();
        const rows = txt.trim().split(/\r?\n/).slice(1);
        const list = rows.map(line => {
          const cols = line.split(',');
          const levelId = cols[0];
          const text = cols[1];
          const a = cols[2], b = cols[3], c = cols[4], d = cols[5];
          const correct = cols[6].toUpperCase();
          return {
            levelId,
            text,
            options: [
              { text: a, correct: correct === 'A' },
              { text: b, correct: correct === 'B' },
              { text: c, correct: correct === 'C' },
              { text: d, correct: correct === 'D' }
            ]
          };
        });
        const map = {};
        list.forEach(q => { map[q.levelId] = q; });
        dynamicQuestions = levels.map((l, idx) => map[l.id] || fallback[idx]);
      } catch(e) {
        dynamicQuestions = fallback;
      }
    }
  }

  function normalize(s){ return (s||'').trim().toLowerCase(); }
  async function checkDuplicate(name, team){
    const n = normalize(name), t = normalize(team);
    try {
      if (window.API_URL) {
        const rows = await fetch(window.API_URL + '?action=leaderboard').then(r=>r.json());
        return rows.some(r => normalize(r.name)===n && normalize(r.team)===t);
      } else {
        const rows = getLocalBoard();
        return rows.some(r => normalize(r.name)===n && normalize(r.team)===t);
      }
    } catch(e) { return false; }
  }

  startBtn.addEventListener('click', async () => {
    const name = nameEl.value.trim();
    const team = teamEl.value.trim();
    if (!name || !team) return;
    registerMsg && (registerMsg.textContent = '');
    if (await checkDuplicate(name, team)) {
      if (registerMsg) registerMsg.textContent = 'Tên/Tổ này đã tham gia, chỉ được chơi 1 lần.';
      return;
    }
    player = { name, team };
    register.classList.add('hidden');
    game.classList.remove('hidden');
    current = 0;
    score = 0;
    attempts = 0;
    icons.innerHTML = '';
    icons.classList.add('ramp');
    try { await prepareQuestions(); } catch(e) {}
    updateStatus();
    try { renderQuestion(); } catch (e) {
      dynamicQuestions = null;
      renderQuestion();
    }
  });

  if (viewLeaderboardBtn) {
    viewLeaderboardBtn.addEventListener('click', async () => {
      register.classList.add('hidden');
      game.classList.add('hidden');
      final.classList.remove('hidden');
      finalTitle.textContent = 'Bảng xếp hạng';
      totalScore.textContent = '';
      saveStatus && (saveStatus.textContent = '');
      await loadLeaderboard();
    });
  }

  
})();
