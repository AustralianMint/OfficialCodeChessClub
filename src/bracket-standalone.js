import season from './data/season.json'

const STORAGE_KEY = 'occc-bracket-state-v1'

const AVATARS = ['🐉', '🦁', '🦊', '🐺', '🦅', '🐯', '🦋', '🐻', '🦈', '🦂', '🐲', '🦄', '🦍', '🦚', '🐍', '🦖']
const COLORS = ['#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#E67E22', '#16A085', '#2C3E50', '#C0392B', '#1ABC9C', '#D35400', '#7F8C8D', '#F39C12', '#2ECC71', '#E74C3C', '#3498DB', '#9B59B6']

const ROUND_FLOW = { r1: 'r2', r2: 'r3', r3: 'final' }
const ROUND_COUNTS = { r1: 8, r2: 4, r3: 2, final: 1 }

let editTarget = null

function createEmptyRounds() {
  return {
    r1: Array.from({ length: ROUND_COUNTS.r1 }, (_, i) => ({ p1: i * 2, p2: i * 2 + 1, s1: null, s2: null, winner: null })),
    r2: Array.from({ length: ROUND_COUNTS.r2 }, () => ({ p1: null, p2: null, s1: null, s2: null, winner: null })),
    r3: Array.from({ length: ROUND_COUNTS.r3 }, () => ({ p1: null, p2: null, s1: null, s2: null, winner: null })),
    final: [{ p1: null, p2: null, s1: null, s2: null, winner: null }],
  }
}

function collectPlayersFromSeason() {
  const names = []
  const pushName = (name) => {
    if (!name || name === '—' || name === 'TBD' || name === '???') return
    if (!names.includes(name)) names.push(name)
  }

  season.bracket?.opening?.left?.matches?.forEach((m) => {
    pushName(m.playerA)
    pushName(m.playerB)
  })
  season.bracket?.opening?.right?.matches?.forEach((m) => {
    pushName(m.playerA)
    pushName(m.playerB)
  })
  season.bracket?.knockout?.forEach((round) => {
    round.matches?.forEach((m) => {
      pushName(m.playerA)
      pushName(m.playerB)
    })
  })

  while (names.length < 16) {
    names.push(`Player ${names.length + 1}`)
  }

  return names.slice(0, 16)
}

function setWinnerInternal(rounds, roundKey, matchIdx, slot, scoreOverride = null) {
  const match = rounds[roundKey][matchIdx]
  const winnerPlayerIdx = match[slot]
  if (winnerPlayerIdx === null) return

  const winScore = slot === 'p1' ? 's1' : 's2'
  const otherScore = slot === 'p1' ? 's2' : 's1'
  match.winner = winnerPlayerIdx

  if (scoreOverride) {
    match[winScore] = scoreOverride.win
    match[otherScore] = scoreOverride.lose
  } else {
    match[winScore] = Math.floor(Math.random() * 3) + 9
    match[otherScore] = Math.floor(Math.random() * 7)
  }

  const nextRound = ROUND_FLOW[roundKey]
  if (!nextRound) return
  const nextMatchIdx = Math.floor(matchIdx / 2)
  const nextSlot = matchIdx % 2 === 0 ? 'p1' : 'p2'
  rounds[nextRound][nextMatchIdx][nextSlot] = winnerPlayerIdx
}

function applySeasonResults(rounds) {
  const openingMatches = season.bracket?.opening?.left?.matches ?? []
  openingMatches.slice(0, ROUND_COUNTS.r1).forEach((match, index) => {
    if (match.winner === 'A') {
      setWinnerInternal(rounds, 'r1', index, 'p1', { win: 1, lose: 0 })
    } else if (match.winner === 'B') {
      setWinnerInternal(rounds, 'r1', index, 'p2', { win: 1, lose: 0 })
    }
  })
}

function createStateFromSeason() {
  const players = collectPlayersFromSeason()
  const rounds = createEmptyRounds()
  applySeasonResults(rounds)
  return { players, rounds }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createStateFromSeason()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.players) || !parsed.rounds) return createStateFromSeason()
    return parsed
  } catch {
    return createStateFromSeason()
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let state = loadState()

function updateHeader() {
  const title = document.getElementById('page-title')
  const subtitle = document.getElementById('page-subtitle')
  const playerCount = `${state.players.length} Players`
  if (title) title.textContent = season.title || 'Championship'
  if (subtitle) subtitle.textContent = `${playerCount} · Single Elimination`
}

function renderRound(roundKey) {
  const container = document.getElementById(`matches-${roundKey}`)
  const data = state.rounds[roundKey]
  if (!container || !Array.isArray(data)) return
  container.innerHTML = ''

  data.forEach((match, mi) => {
    const p1name = match.p1 !== null ? state.players[match.p1] : (roundKey === 'r1' ? '???' : 'TBD')
    const p2name = match.p2 !== null ? state.players[match.p2] : (roundKey === 'r1' ? '???' : 'TBD')
    const p1idx = match.p1
    const p2idx = match.p2

    const isDone = match.winner !== null
    const isLive = !isDone && match.p1 !== null && match.p2 !== null
    const statusLabel = isDone ? 'Completed' : isLive ? 'Ready' : 'Pending'
    const dotClass = isDone ? 'done' : isLive ? 'live' : ''

    const p1win = isDone && match.winner === match.p1
    const p2win = isDone && match.winner === match.p2

    const avatar1 = p1idx !== null ? AVATARS[p1idx] : '?'
    const avatar2 = p2idx !== null ? AVATARS[p2idx] : '?'
    const color1 = p1idx !== null ? COLORS[p1idx] : '#444'
    const color2 = p2idx !== null ? COLORS[p2idx] : '#444'

    const seed1 = roundKey === 'r1' ? `#${p1idx * 2 + 1}` : ''
    const seed2 = roundKey === 'r1' ? `#${p2idx * 2 + 2}` : ''

    const matchNum = mi + 1 + (roundKey === 'r2' ? 8 : roundKey === 'r3' ? 12 : roundKey === 'final' ? 14 : 0)

    const div = document.createElement('div')
    div.className = 'match'
    div.innerHTML = `
      <div class="match-status">
        <span><span class="status-dot ${dotClass}"></span>${statusLabel}</span>
        <span>M${matchNum}</span>
      </div>
      <div class="player ${p1win ? 'winner' : p2win ? 'loser' : ''}"
           onclick="handlePlayerClick('${roundKey}',${mi},'p1')">
        <span class="seed">${seed1}</span>
        <div class="avatar" style="background:${color1}20;border-color:${color1}40;color:${color1}">${avatar1}</div>
        <span class="player-name">${p1name}</span>
        <span class="score">${match.s1 ?? '—'}</span>
        <span class="win-badge"></span>
      </div>
      <div class="vs-pill">VS</div>
      <div class="player ${p2win ? 'winner' : p1win ? 'loser' : ''}"
           onclick="handlePlayerClick('${roundKey}',${mi},'p2')">
        <span class="seed">${seed2}</span>
        <div class="avatar" style="background:${color2}20;border-color:${color2}40;color:${color2}">${avatar2}</div>
        <span class="player-name">${p2name}</span>
        <span class="score">${match.s2 ?? '—'}</span>
        <span class="win-badge"></span>
      </div>
    `
    container.appendChild(div)

    if (isLive && !isDone) {
      const sb = document.createElement('div')
      sb.className = 'score-btns'
      sb.innerHTML = `
        <button class="score-btn" onclick="setWinner('${roundKey}',${mi},'p1')">✓ ${p1name.split(' ')[0]} Wins</button>
        <button class="score-btn" onclick="setWinner('${roundKey}',${mi},'p2')">✓ ${p2name.split(' ')[0]} Wins</button>
      `
      container.appendChild(sb)
    }
  })
}

function renderChampion() {
  const area = document.getElementById('champion-area')
  const match = state.rounds.final[0]
  if (!area || !match) return
  if (match.winner !== null) {
    const name = state.players[match.winner]
    area.innerHTML = `
      <div class="champion-banner">
        <div class="champion-trophy">🏆</div>
        <div class="champion-label">Champion</div>
        <div class="champion-name">${name}</div>
      </div>
    `
  } else {
    area.innerHTML = ''
  }
}

function renderAll() {
  renderRound('r1')
  renderRound('r2')
  renderRound('r3')
  renderRound('final')
  renderChampion()
}

function clearRoundMatch(match) {
  match.winner = null
  match.s1 = null
  match.s2 = null
}

function clearDownstream(roundKey, matchIdx) {
  const nextRound = ROUND_FLOW[roundKey]
  if (!nextRound) return
  const nextMatchIdx = Math.floor(matchIdx / 2)
  const nextSlot = matchIdx % 2 === 0 ? 'p1' : 'p2'
  const nextMatch = state.rounds[nextRound][nextMatchIdx]
  if (!nextMatch) return

  nextMatch[nextSlot] = null
  clearRoundMatch(nextMatch)
  clearDownstream(nextRound, nextMatchIdx)
}

function setWinner(roundKey, matchIdx, slot) {
  const match = state.rounds[roundKey][matchIdx]
  if (!match) return
  clearDownstream(roundKey, matchIdx)
  setWinnerInternal(state.rounds, roundKey, matchIdx, slot)
  persistState()
  renderAll()
}

function handlePlayerClick(roundKey, matchIdx, slot) {
  if (roundKey !== 'r1') return
  const match = state.rounds[roundKey][matchIdx]
  const pIdx = match?.[slot]
  if (pIdx === null || pIdx === undefined) return
  editTarget = { playerIdx: pIdx }
  const input = document.getElementById('modal-input')
  const modal = document.getElementById('modal')
  if (input) input.value = state.players[pIdx]
  if (modal) modal.classList.add('open')
}

function closeModal() {
  const modal = document.getElementById('modal')
  if (modal) modal.classList.remove('open')
  editTarget = null
}

function saveModal() {
  if (!editTarget) return
  const input = document.getElementById('modal-input')
  const value = input?.value?.trim()
  if (value) {
    state.players[editTarget.playerIdx] = value
    persistState()
  }
  closeModal()
  renderAll()
}

function showTab(id, tabEl) {
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'))
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')
  if (tabEl) tabEl.classList.add('active')
}

document.getElementById('modal')?.addEventListener('click', function onModalClick(event) {
  if (event.target === this) closeModal()
})

window.showTab = showTab
window.setWinner = setWinner
window.handlePlayerClick = handlePlayerClick
window.closeModal = closeModal
window.saveModal = saveModal

updateHeader()
renderAll()
