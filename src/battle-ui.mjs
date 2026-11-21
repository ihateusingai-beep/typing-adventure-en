/**
 * Battle shell + virtual keyboard (SEN journey/drill).
 * R3: highlight sync without full board rebuild per key.
 */
import {normalizeCollection} from './collection.mjs';
import {
  labelForCode, syntheticKeyEvent, QWERTY_ROWS, HOME_ANCHORS, isCodeInLesson,
  readVirtKeyboardOn, writeVirtKeyboardOn, migrateLegacyInputMode,
} from './input-mode.mjs';
import {drillCodes} from './drill.mjs';
import {targetOf, physicalCode, fingerFor, keyLabel, applyInput, accuracy} from './core.mjs?v=values1';
import {BPMF_KEYS, BPMF_BY_KEY} from './keyboard.mjs';
import {iconHTML as gameIcon} from './icons.mjs';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Practice-star economy (journey first clear / replay / drill). */
export function grantPracticeStars(save, amount, claimId = null) {
  const c = normalizeCollection(save.collection);
  if (claimId) {
    if (c.claimedIds.includes(claimId)) return {save, stones: 0, newItems: []};
    c.claimedIds = [...c.claimedIds, claimId].slice(-128);
  }
  const n = Math.max(0, Math.round(Number(amount) || 0));
  c.earned += n; c.stones += n; c.revision++;
  const ladder = [
    ['outfit-O08', 25], ['outfit-O09', 50], ['outfit-O10', 80], ['outfit-O11', 110],
    ['outfit-O12', 140], ['outfit-O13', 170], ['outfit-O14', 200], ['outfit-O15', 230],
  ];
  const newItems = [];
  for (const [item, need] of ladder) {
    if (c.earned >= need && !c.items.includes(item)) { c.items.push(item); newItems.push(item); }
  }
  return {save: {...save, collection: c}, stones: n, newItems};
}

export function qwertyBoardRowsHTML(session, node, virtShiftHeld) {
  const t = targetOf(session);
  const expect = t ? physicalCode(t.char) : '';
  return QWERTY_ROWS.map(row => {
    const keys = row.map(code => {
      const lab = labelForCode(code);
      const isShift = code === 'ShiftLeft' || code === 'ShiftRight';
      const isSpace = code === 'Space';
      const isT = !isShift && code === expect;
      const inLesson = isCodeInLesson(code, node, t);
      const anchor = HOME_ANCHORS.has(code);
      let cls = 'virt-key';
      if (isShift) cls += ' is-shift';
      if (virtShiftHeld && isShift) cls += ' is-on';
      if (isSpace) cls += ' is-space';
      if (isT) cls += ' is-target';
      if (inLesson && !isT) cls += ' is-lesson';
      if (anchor) cls += ' is-anchor';
      const pressed = isShift ? String(!!virtShiftHeld) : 'false';
      return `<button type="button" class="${cls}" data-action="virt-key" data-code="${code}" aria-label="撳 ${lab}" aria-pressed="${isShift ? pressed : 'false'}">${esc(lab)}</button>`;
    }).join('');
    return `<div class="virt-row">${keys}</div>`;
  }).join('');
}

export function virtBoardHTML(session, node, drillKbMode, virtShiftHeld) {
  if (!session || !node) return '';
  const t = targetOf(session);
  const expect = t ? physicalCode(t.char) : '';
  if (node.drill) {
    if (drillKbMode === 'qwerty') {
      return `<div class="virt-board drill-board drill-qwerty" id="virt-board" data-board-kind="drill-qwerty" aria-label="完整畫面鍵盤"><p class="virt-hint">完整 QWERTY · 本組鍵會亮 · 目標鍵發光 · 實體鍵都用得</p>${qwertyBoardRowsHTML(session, node, virtShiftHeld)}</div>`;
    }
    const codes = drillCodes(node);
    const keys = codes.map(code => {
      const lab = labelForCode(code);
      const isT = code === expect;
      const anchor = HOME_ANCHORS.has(code);
      let cls = 'virt-key drill-big' + (isT ? ' is-target' : ' is-lesson') + (anchor ? ' is-anchor' : '');
      return `<button type="button" class="${cls}" data-action="virt-key" data-code="${code}" aria-label="撳 ${lab}">${esc(lab)}</button>`;
    }).join('');
    return `<div class="virt-board drill-board" id="virt-board" data-board-kind="drill-big" aria-label="本組畫面鍵"><p class="virt-hint">本組大掣 · ${esc(node.title)} · 實體鍵都用得</p><div class="virt-row drill-row">${keys}</div></div>`;
  }
  return `<div class="virt-board" id="virt-board" data-board-kind="journey" aria-label="畫面鍵盤"><p class="virt-hint">畫面鍵盤 · 目標鍵會發光 · 都用得實體鍵</p>${qwertyBoardRowsHTML(session, node, virtShiftHeld)}</div>`;
}

export function boardKind(node, drillKbMode) {
  if (!node) return '';
  if (node.drill) return drillKbMode === 'qwerty' ? 'drill-qwerty' : 'drill-big';
  return 'journey';
}

export function virtToggleHTML({node, drillKbMode, view, settings}) {
  if (node?.drill) {
    const big = drillKbMode !== 'qwerty';
    return `<div class="virt-toggle-row drill-kb-row" role="group" aria-label="畫面鍵模式">
      <button type="button" class="text-link ${big ? 'is-active' : ''}" data-action="drill-kb" data-mode="big" aria-pressed="${big}">本組大掣</button>
      <button type="button" class="text-link ${!big ? 'is-active' : ''}" data-action="drill-kb" data-mode="qwerty" aria-pressed="${!big}">完整鍵盤</button>
    </div>`;
  }
  let on = false;
  if (view === 'battle') {
    // caller may pass resolved on; fall through settings if not battle-resolved
    on = typeof settings?.virtualKeyboard === 'boolean'
      ? settings.virtualKeyboard
      : migrateLegacyInputMode(settings || {});
  } else {
    const s = settings || {};
    if (typeof s.virtualKeyboard === 'boolean') on = s.virtualKeyboard;
    else on = migrateLegacyInputMode(s);
  }
  return `<div class="virt-toggle-row"><button type="button" class="text-link" data-action="toggle-virt">${on ? '關閉畫面鍵盤' : '開啟畫面鍵盤'}</button></div>`;
}

/** R3: update target/shift classes only — no board rebuild. */
export function syncVirtHighlights(session, virtShiftHeld) {
  const board = document.getElementById('virt-board');
  if (!board || board.hidden) return false;
  const t = targetOf(session);
  const expect = t ? physicalCode(t.char) : '';
  board.querySelectorAll('.virt-key').forEach(btn => {
    const code = btn.dataset.code;
    const isShift = code === 'ShiftLeft' || code === 'ShiftRight';
    btn.classList.toggle('is-target', !isShift && code === expect);
    if (isShift) {
      btn.classList.toggle('is-on', !!virtShiftHeld);
      btn.setAttribute('aria-pressed', String(!!virtShiftHeld));
    }
  });
  return true;
}

export function keyboardHTML(session, typingMode = 'en') {
  const t = targetOf(session);
  if (!t) return '';
  const char = BPMF_KEYS[t.char] ?? t.char.toLowerCase();
  let row = 'asdfghjkl;';
  if ('1234567890-'.includes(char)) row = '1234567890-';
  else if ('qwertyuiop'.includes(char)) row = 'qwertyuiop';
  else if ('zxcvbnm,./'.includes(char)) row = 'zxcvbnm,./';
  else if (char === ' ') row = ' ';
  return `${t.shift ? '<kbd class="lit">Shift</kbd>' : ''}${Array.from(row).map(k =>
    `<kbd class="${k === char ? 'lit' : k === 'f' || k === 'j' ? 'anchor' : ''}">${esc(k === ' ' ? '空白' : typingMode === 'zh-bpmf' ? (BPMF_BY_KEY[k] ?? '·') : k.toUpperCase())}</kbd>`
  ).join('')}`;
}

export function targetHTML(session) {
  const t = targetOf(session);
  if (!t) return '';
  if (t.kind === 'guard') {
    return `<span class="story-guard-label">${gameIcon('shield')}格擋</span><kbd class="story-guard-key">${esc(keyLabel(t.char))}</kbd>`;
  }
  return `${t.shift ? '<span class="shift-hint">Shift ＋</span>' : ''}${Array.from(t.value).map((char, i) =>
    `<span class="${i < session.progress ? 'done' : i === session.progress ? 'current' : ''} ${char === ' ' ? 'space-char' : ''}">${esc(char === ' ' ? '空白' : t.kind === 'word' || t.kind === 'case' ? char : char.toUpperCase())}</span>`
  ).join('')}`;
}

export function battleShellHTML({node, session, title, metricsHTML, helpRow, outfitName, enemyName}) {
  const drill = !!node.drill;
  return `<div class="story-hud">${metricsHTML}${drill ? `<div class="drill-progress" id="drill-progress">${session.correct}/${node.completion.target}</div>` : ''}<button class="quiet" data-action="pause">${gameIcon('pause')}停</button></div><div class="story-playfield"><div class="target-area"><div class="target-label" id="target-label">${title}</div><div class="target-word" id="target-word" aria-label="而家要撳">${targetHTML(session)}</div><div class="finger" id="finger">${esc(fingerFor(targetOf(session).char))} · 慢慢嚟得</div></div><div class="story-actors"><div class="actor-wrap hero-actor"><div id="hero-motion" aria-label="${esc(outfitName)}"></div></div><div class="actor-wrap enemy-actor"><div id="enemy-motion" aria-label="${esc(enemyName)}"></div><span class="enemy-intent" aria-hidden="true"></span><span class="actor-caption">${esc(enemyName)}</span></div></div><div class="story-message" id="story-message" role="status" aria-live="polite">${drill ? '練習 · 睇清楚再撳。' : '睇清楚，再撳。'}</div><div class="keyboard-hint" id="keyboard-hint" ${drill || node.chapterId === 'C01' ? '' : 'hidden'}>${keyboardHTML(session)}</div>${helpRow}<div class="no-keyboard">可以用鍵盤，或者下面大掣。</div></div>`;
}

/**
 * Apply one keypress: pure applyInput + return UI patch instructions.
 * Caller owns session assignment, fx, finishLesson.
 */
export function runBattleKey(session, event) {
  return applyInput(session, event);
}

export function battleHudPatch(session, result, node, typingMode = 'en') {
  const correct = result.event !== 'wrong';
  const current = targetOf(session);
  const patch = {
    correct,
    complete: result.event === 'complete',
    move: result.event === 'complete'
      ? (result.target.kind === 'guard' ? 'guard' : result.target.kind === 'word' ? 'word' : 'correct')
      : result.event,
    acc: accuracy(session),
    combo: session.combo,
    score: session.score,
    targetKind: current?.kind,
    finger: current
      ? (current.shift ? '按住 Shift，再撳字母' : fingerFor(current.char)) + ' · 慢慢嚟得'
      : '',
    targetHTML: current ? targetHTML(session) : '',
    keyboardHTML: current ? keyboardHTML(session, typingMode) : '',
    drillProgress: node?.drill ? `${session.correct}/${node.completion.target}` : null,
    message: '',
    showHint: false,
    offerDemo: false,
  };
  if (!correct && current) {
    patch.message = '✕ 唔啱。' + (session.errorStreak >= 3
      ? `先搵${fingerFor(current.char)}下嘅 ${keyLabel(current.char)}。慢慢嚟。`
      : `再撳 ${keyLabel(current.char)} 再試。`);
    if (session.errorStreak >= 3) patch.showHint = true;
    if (session.errorStreak === 5 && !node?.drill) patch.offerDemo = true;
  } else if (correct) {
    patch.message = '✓ 啱喇 · ' + (
      result.event === 'guard' ? '守住了！看準再出下一招。'
        : result.event === 'word' ? '這一串完成了，穩穩的一招。'
          : session.combo % 5 === 0 ? `${session.combo} 連中，越來越穩了。`
            : '下一個。'
    );
  }
  return patch;
}

export function applyBattleHudPatch(patch) {
  const acc = document.getElementById('stat-acc');
  const combo = document.getElementById('stat-combo');
  const score = document.getElementById('stat-score');
  if (acc) acc.textContent = patch.acc + '%';
  if (combo) combo.textContent = patch.combo;
  if (score) score.textContent = patch.score;
  const answer = patch.correct ? 'correct' : 'wrong';
  const msg = document.getElementById('story-message');
  const tw = document.getElementById('target-word');
  if (msg) { msg.dataset.answer = answer; if (patch.message) msg.textContent = patch.message; }
  if (tw) {
    tw.dataset.answer = answer;
    if (patch.targetHTML) tw.innerHTML = patch.targetHTML;
  }
  const finger = document.getElementById('finger');
  if (finger && patch.finger) finger.textContent = patch.finger;
  const kh = document.getElementById('keyboard-hint');
  if (kh && patch.keyboardHTML != null) {
    kh.innerHTML = patch.keyboardHTML;
    if (patch.showHint) kh.hidden = false;
  }
  const dp = document.getElementById('drill-progress');
  if (dp && patch.drillProgress != null) dp.textContent = patch.drillProgress;
}

export {
  syntheticKeyEvent, readVirtKeyboardOn, writeVirtKeyboardOn, migrateLegacyInputMode,
};
