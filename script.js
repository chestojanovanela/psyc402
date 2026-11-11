/* PSYC 402 — Encoding Strategies Experiment
   Standalone browser app. No server, framework, or external dependencies. */
(() => {
  'use strict';

  const WORD_DURATION_MS = 3000;
  const DISTRACTOR_DURATION_MS = 30000;
  const LISTS = [
    { id: 'A', words: ['banana', 'pencil', 'garden', 'window', 'candle', 'bottle'] },
    { id: 'B', words: ['camera', 'orange', 'rabbit', 'pillow', 'ladder', 'guitar'] },
    { id: 'C', words: ['flower', 'basket', 'castle', 'mirror', 'turtle', 'rocket'] }
  ];
  const STRATEGIES = [
    {
      id: 'maintenance', name: 'Maintenance rehearsal',
      cue: 'Repeat it in your mind',
      explanation: 'As each word appears, repeat it silently to yourself again and again. Focus on the sound of the word, without building a story or making a picture.'
    },
    {
      id: 'self_reference', name: 'Self-reference',
      cue: 'Connect it to your life',
      explanation: 'For each word, think about how it relates to your own experiences. Remember a time you encountered that object, or consider what it means in your life.'
    },
    {
      id: 'imagery', name: 'Mental imagery',
      cue: 'Make a vivid mental picture',
      explanation: 'For each word, imagine a clear, detailed picture of the object. Notice its color, shape, surroundings, and other visual details.'
    }
  ];

  const content = document.getElementById('panel-content');
  const label = document.getElementById('stage-label');
  const counter = document.getElementById('step-counter');
  const progress = document.getElementById('progress-fill');
  const progressTrack = document.getElementById('progress-track');
  const session = {
    id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `session-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    started: null, finished: null, blocks: [], trials: [],
    distractorStart: null, distractorResponses: [], recallRaw: '', scores: {}, matched: new Map()
  };
  let blockIndex = 0;
  let activeTimer = null;
  let activeInterval = null;
  let submitted = false;

  function shuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function updateHeader(stage, status, completed) {
    label.textContent = stage;
    counter.textContent = status;
    const percent = Math.max(0, Math.min(100, completed));
    progress.style.width = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
  }
  function clearActiveTimers() {
    if (activeTimer !== null) clearTimeout(activeTimer);
    if (activeInterval !== null) clearInterval(activeInterval);
    activeTimer = null;
    activeInterval = null;
  }
  function setPanel(html) {
    content.innerHTML = html;
    const heading = content.querySelector('h2');
    if (heading) { heading.id = 'stage-title'; heading.setAttribute('tabindex', '-1'); }
    if (heading) heading.focus({ preventScroll: true });
  }
  function initialize() {
    const strategyOrder = shuffle(STRATEGIES);
    const listOrder = shuffle(LISTS);
    session.blocks = strategyOrder.map((strategy, i) => ({
      strategy, list: listOrder[i], words: shuffle(listOrder[i].words)
    }));
    session.started = new Date().toISOString();
    showBlockInstructions();
  }
  function showBlockInstructions() {
    clearActiveTimers();
    const { strategy } = session.blocks[blockIndex];
    updateHeader('STUDY PHASE', `ROUND ${blockIndex + 1} OF 3`, (blockIndex / 3) * 70);
    setPanel(`
      <div class="stage-icon" aria-hidden="true">${['01', '02', '03'][blockIndex]}</div>
      <h2>${escapeHtml(strategy.name)}</h2>
      <p>You're about to study six words, presented one at a time for three seconds each.</p>
      <div class="instruction-card"><strong>Your task: ${escapeHtml(strategy.cue)}.</strong><br>${escapeHtml(strategy.explanation)}</div>
      <p class="fine-print">Keep using this strategy until all six words have appeared. The words advance automatically.</p>
      <div class="action-row"><button type="button" class="primary-button" id="begin-round">Show the first word <span aria-hidden="true">→</span></button></div>
    `);
    document.getElementById('begin-round').addEventListener('click', () => showWord(0));
  }
  function showWord(wordIndex) {
    clearActiveTimers();
    const block = session.blocks[blockIndex];
    const word = block.words[wordIndex];
    const completed = (blockIndex * 6 + wordIndex) / 18;
    updateHeader('STUDY THE WORD', `ROUND ${blockIndex + 1} · WORD ${wordIndex + 1}/6`, completed * 70);
    setPanel(`
      <div class="word-stage">
        <div class="word-kicker">${escapeHtml(block.strategy.name.toUpperCase())}</div>
        <div class="stimulus" role="status" aria-label="Study word: ${escapeHtml(word)}">${escapeHtml(word)}</div>
        <div class="timed-bar" aria-hidden="true"><div class="timed-fill" id="word-timer-fill"></div></div>
        <div class="word-bottom">REMEMBER THIS WORD · ADVANCES AUTOMATICALLY</div>
      </div>
    `);
    const trial = { strategy: block.strategy.id, strategyName: block.strategy.name, listId: block.list.id,
      blockPosition: blockIndex + 1, wordPosition: wordIndex + 1, word, displayMs: WORD_DURATION_MS };
    session.trials.push(trial);
    requestAnimationFrame(() => { const fill = document.getElementById('word-timer-fill'); if (fill) fill.style.width = '100%'; });
    activeTimer = setTimeout(() => {
      if (wordIndex < 5) showWord(wordIndex + 1);
      else if (blockIndex < 2) { blockIndex += 1; showBlockInstructions(); }
      else showDistractorInstructions();
    }, WORD_DURATION_MS);
  }
  function showDistractorInstructions() {
    clearActiveTimers();
    updateHeader('DISTRACTOR TASK', 'NEXT · 30 SECONDS', 72);
    setPanel(`
      <div class="stage-icon" aria-hidden="true">−3</div>
      <h2>A quick counting task</h2>
      <p>For 30 seconds, count backward by threes from a starting number. Type each next number into the box and press Enter or select “Submit number.”</p>
      <div class="instruction-card"><strong>Example:</strong> If you start at 826, type 823, then 820, then 817, and keep going.</div>
      <p class="fine-print">The timer begins when you press the button. After 30 seconds, the recall test will start automatically.</p>
      <div class="action-row"><button type="button" class="primary-button" id="start-counting">Start 30-second task <span aria-hidden="true">→</span></button></div>
    `);
    document.getElementById('start-counting').addEventListener('click', runDistractor);
  }
  function runDistractor() {
    clearActiveTimers();
    session.distractorStart = Math.floor(700 + Math.random() * 300);
    const endAt = Date.now() + DISTRACTOR_DURATION_MS;
    let previous = session.distractorStart;
    updateHeader('DISTRACTOR TASK', '00:30 REMAINING', 75);
    setPanel(`
      <div class="stage-icon" aria-hidden="true">−3</div>
      <h2>Count backward by 3</h2>
      <p>Start at the number below. Type the next number, then keep subtracting three.</p>
      <div class="count-number">${session.distractorStart}</div>
      <div class="count-timer" id="countdown" role="timer" aria-live="off">00:30 remaining</div>
      <form id="count-form" autocomplete="off">
        <label class="field-label" for="count-input">Next number</label>
        <input id="count-input" class="answer-field" type="number" inputmode="numeric" step="1" required aria-label="Next number in backward counting sequence">
        <div class="action-row"><button type="submit" class="secondary-button">Submit number <span aria-hidden="true">↵</span></button></div>
      </form>
      <span class="subtle-stat" id="count-submitted">0 numbers submitted</span>
    `);
    const form = document.getElementById('count-form');
    const input = document.getElementById('count-input');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (Date.now() >= endAt) return;
      if (input.value.trim() === '') return;
      const number = Number(input.value);
      if (!Number.isFinite(number)) return;
      session.distractorResponses.push({ number, expected: previous - 3, correct: number === previous - 3 });
      previous = number;
      document.getElementById('count-submitted').textContent = `${session.distractorResponses.length} numbers submitted`;
      input.value = '';
      input.focus();
    });
    input.focus();
    const tick = () => {
      const remainingMs = Math.max(0, endAt - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      document.getElementById('countdown').textContent = `00:${String(remainingSec).padStart(2, '0')} remaining`;
      counter.textContent = `00:${String(remainingSec).padStart(2, '0')} REMAINING`;
      updateHeader('DISTRACTOR TASK', counter.textContent, 75 + ((DISTRACTOR_DURATION_MS - remainingMs) / DISTRACTOR_DURATION_MS) * 12);
      if (remainingMs === 0) { clearActiveTimers(); showRecall(); }
    };
    activeInterval = setInterval(tick, 100);
    tick();
  }
  function showRecall() {
    clearActiveTimers();
    updateHeader('FREE RECALL TEST', '18 WORDS STUDIED', 91);
    setPanel(`
      <div class="stage-icon" aria-hidden="true">✎</div>
      <h2>What can you remember?</h2>
      <p>Write down as many of the <strong>18 words</strong> you studied as possible, in any order. You don't need to group them by strategy.</p>
      <form id="recall-form">
        <label class="field-label" for="recall-input">Your recalled words</label>
        <textarea id="recall-input" class="recall-field" spellcheck="false" placeholder="Type words here, separated by commas, spaces, or new lines…" aria-describedby="recall-help"></textarea>
        <p id="recall-help" class="help-text">Separate words with commas, spaces, or new lines. If none come to mind, leave the box empty and continue. Capitalization doesn't matter; recognizable minor typos are accepted.</p>
        <div class="action-row"><button class="primary-button" type="submit">See my results <span aria-hidden="true">→</span></button></div>
      </form>
    `);
    document.getElementById('recall-form').addEventListener('submit', e => {
      e.preventDefault();
      if (submitted) return;
      const raw = document.getElementById('recall-input').value.trim();
      submitted = true;
      session.recallRaw = raw;
      session.finished = new Date().toISOString();
      scoreRecall(raw);
      showResults();
    });
    document.getElementById('recall-input').focus();
  }
  function normalize(word) {
    return String(word).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  }
  function levenshtein(a, b) {
    let row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++) {
        next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      row = next;
    }
    return row[b.length];
  }
  function scoreRecall(raw) {
    const responses = raw.split(/[\s,;]+/).map(normalize).filter(Boolean);
    const trialWords = session.trials.map(t => normalize(t.word));
    const usedWords = new Set();
    const usedResponseIndices = new Set();
    const assignments = [];
    // Match exact answers first so a typo can never take credit from a later exact answer.
    responses.forEach((r, i) => {
      const j = trialWords.findIndex((word, idx) => word === r && !usedWords.has(idx));
      if (j !== -1) { usedWords.add(j); usedResponseIndices.add(i); assignments.push([j, i]); }
    });
    // Conservative fuzzy matching: one edit for 5–7 letters; up to two for 8+.
    responses.forEach((r, i) => {
      if (usedResponseIndices.has(i)) return;
      const candidates = trialWords.map((word, idx) => ({ idx, d: levenshtein(r, word),
        limit: word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0 }))
        .filter(x => !usedWords.has(x.idx) && x.d > 0 && x.d <= x.limit)
        .sort((a,b) => a.d - b.d);
      // Only credit when there is a unique best possible match.
      if (candidates.length && (candidates.length === 1 || candidates[0].d < candidates[1].d)) {
        usedWords.add(candidates[0].idx); usedResponseIndices.add(i); assignments.push([candidates[0].idx, i]);
      }
    });
    session.matched = new Map(assignments.map(([trialIndex, responseIndex]) => [trialIndex, {
      response: responses[responseIndex], responsePosition: responseIndex + 1
    }]));
    session.scores = Object.fromEntries(STRATEGIES.map(strategy => [strategy.id,
      session.trials.reduce((sum, t, index) => sum + (t.strategy === strategy.id && session.matched.has(index) ? 1 : 0), 0)
    ]));
  }
  function showResults() {
    updateHeader('YOUR RESULTS', 'EXPERIMENT COMPLETE', 100);
    const total = Object.values(session.scores).reduce((a, b) => a + b, 0);
    setPanel(`
      <div class="stage-icon" aria-hidden="true">✓</div>
      <h2>Your memory results</h2>
      <p>Here is how many words you recalled from each encoding strategy. Every strategy had six words, so the scores are directly comparable within this session.</p>
      <div class="results-grid">${STRATEGIES.map(s => `
        <div class="result-card"><span class="score">${session.scores[s.id]}<span style="font-size:15px;color:#879595"> / 6</span></span>
        <span class="result-label">${escapeHtml(s.name)}</span></div>
      `).join('')}</div>
      <div class="score-total">Total recalled: ${total} of 18 words</div>
      <h3>Save your experiment data</h3>
      <p>Download both CSV files below. The summary contains one row for your session; the trial-level file contains one row for each studied word.</p>
      <div class="downloads">
        <button type="button" class="primary-button" id="download-summary">↓ Summary CSV</button>
        <button type="button" class="secondary-button" id="download-trials">↓ Trial-level CSV</button>
      </div>
      <p class="icon-note">Your responses stay in your browser. No data is automatically sent to a server.</p>
      <div class="action-row"><button type="button" class="secondary-button" id="restart">Start a new session <span aria-hidden="true">↻</span></button></div>
    `);
    document.getElementById('download-summary').addEventListener('click', () => downloadCsv('summary'));
    document.getElementById('download-trials').addEventListener('click', () => downloadCsv('trials'));
    document.getElementById('restart').addEventListener('click', () => location.reload());
  }
  function serializeCsv(headers, rows) {
    const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [headers.map(csvCell).join(','), ...rows.map(row => headers.map(h => csvCell(row[h])).join(','))].join('\r\n') + '\r\n';
  }
  function getSummaryCsv() {
    const row = {
      session_id: session.id, started_at_utc: session.started, finished_at_utc: session.finished,
      strategy_order: session.blocks.map(b => b.strategy.id).join(' > '),
      list_assignment: session.blocks.map(b => `${b.strategy.id}:${b.list.id}`).join('; '),
      maintenance_recalled: session.scores.maintenance,
      self_reference_recalled: session.scores.self_reference,
      imagery_recalled: session.scores.imagery,
      total_recalled: Object.values(session.scores).reduce((a,b) => a+b, 0),
      distractor_start_number: session.distractorStart,
      distractor_responses: session.distractorResponses.length,
      distractor_correct_responses: session.distractorResponses.filter(r => r.correct).length,
      typed_recall: session.recallRaw
    };
    return serializeCsv(Object.keys(row), [row]);
  }
  function getTrialCsv() {
    const rows = session.trials.map((t, i) => ({
      session_id: session.id, trial_number: i + 1, block_position: t.blockPosition,
      word_position: t.wordPosition, strategy: t.strategy, stimulus_list: t.listId,
      studied_word: t.word, presentation_ms: t.displayMs,
      recalled: session.matched.has(i) ? 1 : 0,
      matched_response: session.matched.get(i)?.response ?? '',
      response_position: session.matched.get(i)?.responsePosition ?? ''
    }));
    return serializeCsv(Object.keys(rows[0]), rows);
  }
  function downloadCsv(type) {
    const contents = type === 'summary' ? getSummaryCsv() : getTrialCsv();
    const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `encoding_${type}_${session.id.slice(0,8)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.getElementById('start-button').addEventListener('click', initialize, { once: true });
})();
