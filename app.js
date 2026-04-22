// ── Teams & aliases ────────────────────────────────────────────────────────

const NRL_TEAMS = [
  'Broncos','Raiders','Bulldogs','Sharks','Titans',
  'Sea Eagles','Storm','Knights','Cowboys','Eels',
  'Panthers','Rabbitohs','Dragons','Roosters','Warriors',
  'Tigers','Dolphins'
];

const ALIAS_MAP = {
  // Broncos
  'brisbane':           'Broncos',
  'brisbane broncos':   'Broncos',
  'broncos':            'Broncos',
  'brl':                'Broncos',
  // Raiders
  'canberra':           'Raiders',
  'canberra raiders':   'Raiders',
  'raiders':            'Raiders',
  'cbr':                'Raiders',
  // Bulldogs
  'canterbury':         'Bulldogs',
  'Canterbury-bankstown': 'Bulldogs',
  'bulldogs':           'Bulldogs',
  'dogs':               'Bulldogs',
  'cby':                'Bulldogs',
  // Sharks
  'cronulla':           'Sharks',
  'cronulla sharks':    'Sharks',
  'sharks':             'Sharks',
  'crs':                'Sharks',
  // Titans
  'gold coast':         'Titans',
  'gold coast titans':  'Titans',
  'titans':             'Titans',
  'gct':                'Titans',
  // Sea Eagles
  'manly':              'Sea Eagles',
  'manly sea eagles':   'Sea Eagles',
  'sea eagles':         'Sea Eagles',
  'sea-eagles':         'Sea Eagles',
  'mnl':                'Sea Eagles',
  // Storm
  'melbourne':          'Storm',
  'melbourne storm':    'Storm',
  'storm':              'Storm',
  'mbs':                'Storm',
  // Knights
  'newcastle':          'Knights',
  'newcastle knights':  'Knights',
  'knights':            'Knights',
  'nen':                'Knights',
  // Cowboys
  'north queensland':         'Cowboys',
  'north queensland cowboys': 'Cowboys',
  'nth queensland':           'Cowboys',
  'cowboys':                  'Cowboys',
  'nql':                      'Cowboys',
  // Eels
  'parramatta':         'Eels',
  'parramatta eels':    'Eels',
  'eels':               'Eels',
  'pps':                'Eels',
  // Panthers
  'penrith':            'Panthers',
  'penrith panthers':   'Panthers',
  'panthers':           'Panthers',
  'pts':                'Panthers',
  // Rabbitohs
  'south sydney':           'Rabbitohs',
  'south sydney rabbitohs': 'Rabbitohs',
  'rabbitohs':              'Rabbitohs',
  'souths':                 'Rabbitohs',
  'bunnies':                'Rabbitohs',
  'ssy':                    'Rabbitohs',
  // Dragons
  'st george':                    'Dragons',
  'st george illawarra':          'Dragons',
  'st george illawarra dragons':  'Dragons',
  'dragons':                      'Dragons',
  'sgg':                          'Dragons',
  // Roosters
  'sydney roosters':  'Roosters',
  'roosters':         'Roosters',
  'syr':              'Roosters',
  // Warriors
  'new zealand':          'Warriors',
  'new zealand warriors': 'Warriors',
  'nz warriors':          'Warriors',
  'warriors':             'Warriors',
  'nzw':                  'Warriors',
  // Tigers
  'wests tigers': 'Tigers',
  'wests':        'Tigers',
  'tigers':       'Tigers',
  'wst':          'Tigers',
  // Dolphins
  'redcliffe dolphins': 'Dolphins',
  'redcliffe':          'Dolphins',
  'dolphins':           'Dolphins',
  'dps':                'Dolphins',
};

function normalizeTeam(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (ALIAS_MAP[lower]) return ALIAS_MAP[lower];
  // Partial match fallback
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (lower.includes(alias)) return canonical;
  }
  // Check if it already matches a canonical name directly
  const direct = NRL_TEAMS.find(t => t.toLowerCase() === lower);
  return direct || trimmed;
}

// ── Embedded selections ───────────────────────────────────────────────────

const EMBEDDED_CSV = `
Terry,Rabbitohs,Roosters,Storm,Broncos,Raiders,Panthers,Eels,Cowboys
Adam,Panthers,Broncos,Storm,Sharks,Roosters,Raiders,Dolphins,Dragons
Al,Rabbitohs,Storm,Bulldogs,Raiders,Broncos,Roosters,Panthers,Cowboys
Russ,Bulldogs,Knights,Broncos,Panthers,Storm,Raiders,Sea Eagles,Cowboys
Nate,Roosters,Storm,Raiders,Panthers,Sharks,Bulldogs,Broncos,Rabbitohs
Bob,Raiders,Rabbitohs,Sharks,Storm,Panthers,Broncos,Bulldogs,Roosters
Kip,Titans,Tigers,Eels,Knights,Rabbitohs,Dolphins,Dragons,Cowboys
Anthony,Sharks,Broncos,Raiders,Bulldogs,Storm,Panthers,Warriors,Roosters
Greg,Raiders,Storm,Broncos,Sharks,Panthers,Dolphins,Warriors,Bulldogs
`.trim();

const EMBEDDED_LADDER_CSV = `
Round 1,Storm,Sharks,Panthers,Warriors,Knights,Rabbitohs,Bulldogs,Raiders,Tigers,Dragons,Sea Eagles,Cowboys,Dolphins,Roosters,Broncos,Titans,Eels
Round 2,Storm,Warriors,Panthers,Knights,Tigers,Bulldogs,Sharks,Rabbitohs,Dolphins,Roosters,Raiders,Eels,Sea Eagles,Dragons,Broncos,Cowboys,Titans
Round 3,Warriors,Panthers,Bulldogs,Storm,Tigers,Dolphins,Rabbitohs,Knights,Eels,Sharks,Sea Eagles,Cowboys,Broncos,Raiders,Roosters,Dragons,Titans
Round 4,Panthers,Warriors,Tigers,Knights,Rabbitohs,Bulldogs,Storm,Dolphins,Sharks,Broncos,Cowboys,Roosters,Eels,Sea Eagles,Raiders,Titans,Dragons
Round 5,Panthers,Tigers,Knights,Rabbitohs,Warriors,Sharks,Cowboys,Broncos,Bulldogs,Roosters,Storm,Sea Eagles,Dolphins,Eels,Titans,Raiders,Dragons
Round 6,Panthers,Tigers,Warriors,Cowboys,Rabbitohs,Knights,Bulldogs,Roosters,Sea Eagles,Sharks,Broncos,Dolphins,Storm,Titans,Raiders,Eels,Dragons
Round 7,Panthers,Warriors,Tigers,Rabbitohs,Roosters,Sea Eagles,Sharks,Knights,Broncos,Bulldogs,Cowboys,Dolphins,Raiders,Eels,Storm,Titans,Dragons
`.trim();

// ── State ──────────────────────────────────────────────────────────────────

let tipsData      = [];  // [{name, picks: [canonical...]}]
let ladder        = {};  // {canonicalTeam: position 1–17}
let ladderHistory = {};  // {roundLabel: [team1, team2, ... team17]}
let lastScoredRows = []; // latest leaderboard rows for export

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildLadderGrid();
  loadFromStorage();
  if (!tipsData.length) {
    parseTipsFromCSV(EMBEDDED_CSV);
  }
  loadLadderCSV();
});

// ── Ladder CSV ────────────────────────────────────────────────────────────

async function loadLadderCSV() {
  try {
    const resp = await fetch('NRL Ladder.csv');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    populateLadderHistory(text);
  } catch (e) {
    console.warn('Could not load NRL Ladder.csv from fetch, using embedded fallback:', e);
    populateLadderHistory(EMBEDDED_LADDER_CSV);
  }
}

function populateLadderHistory(raw) {
  const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
  ladderHistory = {};

  for (const line of lines) {
    const cols = parseCSVLine(line);
    const label = (cols[0] || '').trim();
    if (!label) continue;

    const teams = cols.slice(1).map(team => normalizeTeam(team)).filter(Boolean);
    if (teams.length) {
      ladderHistory[label] = teams;
    }
  }

  populateRoundSelector();
}

function populateRoundSelector() {
  const sel = document.getElementById('round-select');
  const rounds = Object.keys(ladderHistory);
  if (!rounds.length) { sel.innerHTML = '<option value="">No data</option>'; return; }
  sel.innerHTML = rounds.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
  // Default to latest round
  const latest = rounds[rounds.length - 1];
  sel.value = latest;
  applyRound(latest);
}

function applyRound(roundLabel) {
  const teams = ladderHistory[roundLabel];
  if (!teams) return;
  // Populate dropdowns
  for (let pos = 1; pos <= 17; pos++) {
    const sel = document.getElementById(`ladder-pos-${pos}`);
    if (sel) sel.value = teams[pos - 1] || '';
  }
  // Build and save ladder state
  ladder = {};
  teams.forEach((team, idx) => { if (team) ladder[team] = idx + 1; });
  localStorage.setItem('ladder', JSON.stringify(ladder));
  renderLeaderboard();
}

// ── Ladder UI ──────────────────────────────────────────────────────────────

function buildLadderGrid() {
  const grid = document.getElementById('ladder-grid');
  grid.innerHTML = '';
  for (let pos = 1; pos <= 17; pos++) {
    const row = document.createElement('div');
    row.className = 'ladder-row';
    const labelClass = pos <= 8 ? 'pos-label top8' : 'pos-label';
    row.innerHTML = `
      <span class="${labelClass}">${pos}${ordSuffix(pos)}</span>
      <select id="ladder-pos-${pos}" class="team-select">
        <option value="">— select —</option>
        ${NRL_TEAMS.map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
    `;
    grid.appendChild(row);
  }
}

function ordSuffix(n) {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

function saveLadder() {
  const newLadder = {};
  const used = new Set();
  const errors = [];

  for (let pos = 1; pos <= 17; pos++) {
    const team = document.getElementById(`ladder-pos-${pos}`).value;
    if (!team) continue;
    if (used.has(team)) {
      errors.push(`"${team}" is selected at multiple positions.`);
      continue;
    }
    used.add(team);
    newLadder[team] = pos;
  }

  if (errors.length) {
    alert('Fix these before saving:\n' + errors.join('\n'));
    return;
  }

  ladder = newLadder;
  localStorage.setItem('ladder', JSON.stringify(ladder));
  renderLeaderboard();
}

function clearLadder() {
  for (let pos = 1; pos <= 17; pos++) {
    const sel = document.getElementById(`ladder-pos-${pos}`);
    if (sel) sel.value = '';
  }
  ladder = {};
  localStorage.removeItem('ladder');
  renderLeaderboard();
}

// ── CSV loading ────────────────────────────────────────────────────────────

function parseTipsFromCSV(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = [];

  for (const line of lines) {
    const cols = parseCSVLine(line);
    const name = (cols[0] || '').trim();
    // skip blank lines and any header row that starts with "Name"
    if (!name || name.toLowerCase() === 'name') continue;
    if (cols.length < 9) continue;
    const picks = cols.slice(1, 9).map(p => normalizeTeam(p)).filter(Boolean);
    if (picks.length === 8) parsed.push({ name, picks });
  }

  if (!parsed.length) return;
  tipsData = parsed;
  localStorage.setItem('tipsData', JSON.stringify(tipsData));
  renderLeaderboard();
}

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

// ── Persistence ────────────────────────────────────────────────────────────

function loadFromStorage() {
  const rawTips = localStorage.getItem('tipsData');
  if (rawTips) {
    try {
      tipsData = JSON.parse(rawTips);
      // participants loaded (panel removed)
    } catch { /* ignore */ }
  }

  const rawLadder = localStorage.getItem('ladder');
  if (rawLadder) {
    try {
      ladder = JSON.parse(rawLadder);
      for (const [team, pos] of Object.entries(ladder)) {
        const sel = document.getElementById(`ladder-pos-${pos}`);
        if (sel) sel.value = team;
      }
    } catch { /* ignore */ }
  }

  if (tipsData.length || Object.keys(ladder).length) renderLeaderboard();
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreParticipant(picks) {
  let totalScore = 0, correctCount = 0, bonusTotal = 0;
  let top4Count = 0, top2Count = 0, bestPosition = null;
  const detail = [];

  for (const team of picks) {
    const pos = ladder[team];
    const correct = pos !== undefined && pos >= 1 && pos <= 8;
    if (correct) {
      const points = 20 + (9 - pos);
      totalScore  += points;
      correctCount++;
      bonusTotal  += (9 - pos);
      if (pos <= 4) top4Count++;
      if (pos <= 2) top2Count++;
      if (bestPosition === null || pos < bestPosition) bestPosition = pos;
      detail.push({ team, pos, points, correct: true });
    } else {
      detail.push({ team, pos: pos ?? null, points: 0, correct: false });
    }
  }

  return { totalScore, correctCount, bonusTotal, top4Count, top2Count, bestPosition, detail };
}

// Sort comparator — higher is better except bestPosition (lower is better)
function tiebreakCompare(a, b) {
  if (b.totalScore   !== a.totalScore)   return b.totalScore   - a.totalScore;   // 1 score
  if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount; // 2 correct count
  if (b.bonusTotal   !== a.bonusTotal)   return b.bonusTotal   - a.bonusTotal;   // 3 positional bonus
  if (b.top4Count    !== a.top4Count)    return b.top4Count    - a.top4Count;    // 4 top 4
  if (b.top2Count    !== a.top2Count)    return b.top2Count    - a.top2Count;    // 5 top 2
  const aBest = a.bestPosition ?? 99, bBest = b.bestPosition ?? 99;
  if (aBest !== bBest) return aBest - bBest;                                     // 6 best single pos
  return 0;
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderLeaderboard() {
  const wrap = document.getElementById('leaderboard-wrap');
  const roundSelect = document.getElementById('round-select');
  const currentRoundLabel = roundSelect && roundSelect.value ? roundSelect.value : 'No round selected';

  if (!tipsData.length) {
    wrap.innerHTML = '<p class="empty-state">Load tips data to see the leaderboard.</p>';
    return;
  }

  const ladderSet = Object.keys(ladder).length > 0;

  const scored = tipsData.map(p => ({
    name: p.name,
    picks: p.picks,
    ...scoreParticipant(p.picks),
  }));
  scored.sort(tiebreakCompare);

  // Assign ranks (ties share same rank)
  let rank = 1;
  for (let i = 0; i < scored.length; i++) {
    scored[i].rank = (i > 0 && tiebreakCompare(scored[i], scored[i - 1]) === 0)
      ? scored[i - 1].rank
      : rank;
    rank++;
  }
  lastScoredRows = scored;

  const rows = scored.map(p => {
    const rowClass = p.rank === 1 ? 'row-gold' : p.rank === 2 ? 'row-silver' : p.rank === 3 ? 'row-bronze' : '';

    const chips = p.picks.map(team => {
      const d = p.detail.find(x => x.team === team);
      if (!d) return `<span class="chip wrong">${esc(team)}</span>`;
      if (d.correct) {
        return `<span class="chip correct" title="Position ${d.pos}: ${d.points} pts">${esc(team)} #${d.pos} (${d.points})</span>`;
      }
      const posNote = d.pos ? ` #${d.pos}` : '';
      return `<span class="chip wrong" title="Finished ${d.pos ? '#' + d.pos : 'outside top 8'}">${esc(team)}${posNote}</span>`;
    }).join('');

    return `
      <tr class="${rowClass}">
        <td class="rank-cell" data-label="Rank">${rankIcon(p.rank)}</td>
        <td class="name-cell" data-label="Name">${esc(p.name)}</td>
        <td class="score-cell" data-label="Score">${ladderSet ? p.totalScore : '—'}</td>
        <td class="num-cell" data-label="Correct">${ladderSet ? `${p.correctCount}/8` : '—'}</td>
        <td class="num-cell" data-label="Top 4">${ladderSet ? p.top4Count : '—'}</td>
        <td class="num-cell" data-label="Top 2">${ladderSet ? p.top2Count : '—'}</td>
        <td class="chips-cell" data-label="Picks">${chips}</td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    ${!ladderSet ? '<div class="banner warn">⚠ Ladder not set — choose a round to populate the ladder.</div>' : ''}
    <div class="leaderboard-heading">
      <div>
        <p class="round-badge">${esc(currentRoundLabel)}</p>
        <p class="leaderboard-subtitle">Current leaderboard based on the selected ladder round.</p>
      </div>
    </div>
    <div class="leaderboard-toolbar no-print">
      <div class="export-copy">Export the current leaderboard view for ${esc(currentRoundLabel)}.</div>
      <div class="export-actions">
        <button class="btn btn-secondary" onclick="exportLeaderboardCSV()">Export CSV</button>
        <button class="btn btn-ghost" onclick="printLeaderboard()">Print / Save PDF</button>
      </div>
    </div>
    <div class="print-title">
      <h1>NRL Top 8 Tipping Scorer</h1>
      <p>${esc(currentRoundLabel)}</p>
    </div>
    <div class="table-scroll">
      <table class="leaderboard">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Score</th>
            <th>Correct</th>
            <th>Top 4</th>
            <th>Top 2</th>
            <th>Picks (correct shown with position &amp; points)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="last-updated">Last updated: ${new Date().toLocaleTimeString()}</p>
  `;
}

function ordSuffix2(n) {
  if (n === 1) return '1st'; if (n === 2) return '2nd';
  if (n === 3) return '3rd'; return `${n}th`;
}

function rankIcon(r) {
  return r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r;
}

function exportLeaderboardCSV() {
  if (!lastScoredRows.length) return;

  const ladderSet = Object.keys(ladder).length > 0;
  const rows = lastScoredRows.map(player => [
    player.rank,
    player.name,
    ladderSet ? player.totalScore : '',
    ladderSet ? player.correctCount : '',
    ladderSet ? player.top4Count : '',
    ladderSet ? player.top2Count : '',
    player.picks.join(' | ')
  ]);

  const csvLines = [
    ['Rank', 'Name', 'Score', 'Correct', 'Top 4', 'Top 2', 'Picks'],
    ...rows,
  ].map(columns => columns.map(csvCell).join(','));

  const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = buildLeaderboardFilename('csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function printLeaderboard() {
  window.print();
}

function buildLeaderboardFilename(extension) {
  const roundSelect = document.getElementById('round-select');
  const roundLabel = roundSelect && roundSelect.value ? roundSelect.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'current-round';
  return `nrl-top8-leaderboard-${roundLabel}.${extension}`;
}

function csvCell(value) {
  const escaped = String(value ?? '').replace(/"/g, '""');
  return `"${escaped}"`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
