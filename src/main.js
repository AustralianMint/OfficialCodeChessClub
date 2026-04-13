import './styles/bracket.css'
import season from './data/season.json'

const AVATARS = ['🐉', '🦁', '🦊', '🐺', '🦅', '🐯', '🦋', '🐻', '🦈', '🦂', '🐲', '🦄', '🦍', '🦚', '🐍', '🦖']
const COLORS = ['#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#E67E22', '#16A085', '#2C3E50', '#C0392B', '#1ABC9C', '#D35400', '#7F8C8D', '#F39C12', '#2ECC71', '#E74C3C', '#3498DB', '#9B59B6']

const ROUND_COUNTS = { r2: 4, r3: 2, final: 1 }

const KNOCKOUT_ROUND_KEYS = [
  { key: 'r2', count: ROUND_COUNTS.r2 },
  { key: 'r3', count: ROUND_COUNTS.r3 },
  { key: 'final', count: ROUND_COUNTS.final },
]

/** Resolve a JSON player string to an index in `players` (append if missing). */
function nameToPlayerIdx(players, raw) {
  const n = String(raw ?? '').trim()
  if (!n || n === '—' || n === 'TBD' || n === '???') return null
  let i = players.indexOf(n)
  if (i < 0) {
    players.push(n)
    i = players.length - 1
  }
  return i
}

function buildMatchesFromJson(players, jsonMatches) {
  return jsonMatches.map((m) => ({
    p1: nameToPlayerIdx(players, m.playerA),
    p2: nameToPlayerIdx(players, m.playerB),
    s1: null,
    s2: null,
    winner: null,
  }))
}

function createEmptyRounds(players) {
  const leftOpening = season.bracket?.opening?.left?.matches ?? []
  const rightOpening = season.bracket?.opening?.right?.matches ?? []
  return {
    r1: buildMatchesFromJson(players, leftOpening),
    r1Qualified: buildMatchesFromJson(players, rightOpening),
    r2: Array.from({ length: ROUND_COUNTS.r2 }, () => ({ p1: null, p2: null, s1: null, s2: null, winner: null })),
    r3: Array.from({ length: ROUND_COUNTS.r3 }, () => ({ p1: null, p2: null, s1: null, s2: null, winner: null })),
    final: [{ p1: null, p2: null, s1: null, s2: null, winner: null }],
  }
}

function collectPlayersFromSeason() {
  const names = []
  const pushName = (name) => {
    const n = String(name ?? '').trim()
    if (!n || n === '—' || n === 'TBD' || n === '???') return
    if (!names.includes(n)) names.push(n)
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

  return names
}

/** Apply completed left-side opening results to r1 only (knockout JSON supplies later rounds). */
function applySeasonResults(rounds) {
  const openingMatches = season.bracket?.opening?.left?.matches ?? []
  openingMatches.forEach((match, index) => {
    const m = rounds.r1[index]
    if (!m) return
    if (match.winner === 'A' && m.p1 !== null) {
      m.winner = m.p1
      m.s1 = 1
      m.s2 = 0
    } else if (match.winner === 'B' && m.p2 !== null) {
      m.winner = m.p2
      m.s1 = 0
      m.s2 = 1
    }
  })
}

/** Placeholder in JSON means "keep slot from advancement"; explicit name overrides. */
function slotFromJsonPlayerName(name, players, existingSlot) {
  const n = String(name ?? '').trim()
  if (!n || n === '—' || n === 'TBD' || n === '???') return existingSlot ?? null
  const idx = players.indexOf(n)
  return idx >= 0 ? idx : null
}

function applyKnockoutFromSeason(rounds, players) {
  const knockout = season.bracket?.knockout
  if (!Array.isArray(knockout) || knockout.length === 0) return

  let k = 0
  for (const { key, count } of KNOCKOUT_ROUND_KEYS) {
    while (k < knockout.length && (knockout[k].matches?.length ?? 0) !== count) {
      k += 1
    }
    if (k >= knockout.length) break

    const jsonMatches = knockout[k].matches
    const internal = rounds[key]
    for (let i = 0; i < count; i += 1) {
      const jm = jsonMatches[i]
      const im = internal[i]
      if (!jm || !im) continue

      im.p1 = slotFromJsonPlayerName(jm.playerA, players, im.p1)
      im.p2 = slotFromJsonPlayerName(jm.playerB, players, im.p2)

      if (jm.winner === 'A' && im.p1 !== null) {
        im.winner = im.p1
        im.s1 = 1
        im.s2 = 0
      } else if (jm.winner === 'B' && im.p2 !== null) {
        im.winner = im.p2
        im.s1 = 0
        im.s2 = 1
      }
    }
    k += 1
  }
}

function createStateFromSeason() {
  const players = collectPlayersFromSeason()
  const rounds = createEmptyRounds(players)
  applySeasonResults(rounds)
  applyKnockoutFromSeason(rounds, players)
  return { players, rounds }
}

const state = createStateFromSeason()

function updateHeader() {
  const title = document.getElementById('page-title')
  const subtitle = document.getElementById('page-subtitle')
  const playerCount = `${state.players.length} Players`
  if (title) title.textContent = season.title || 'Championship'
  if (subtitle) subtitle.textContent = `${playerCount} · Single Elimination`
}

function createMatchCardElement(match, mi, roundKey) {
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

  const avatar1 = p1idx !== null ? AVATARS[p1idx % AVATARS.length] : '?'
  const avatar2 = p2idx !== null ? AVATARS[p2idx % AVATARS.length] : '?'
  const color1 = p1idx !== null ? COLORS[p1idx % COLORS.length] : '#444'
  const color2 = p2idx !== null ? COLORS[p2idx % COLORS.length] : '#444'

  const seed1 = roundKey === 'r1' && p1idx !== null ? `#${p1idx + 1}` : ''
  const seed2 = roundKey === 'r1' && p2idx !== null ? `#${p2idx + 1}` : ''

  const matchNum = mi + 1 + (roundKey === 'r2' ? 8 : roundKey === 'r3' ? 12 : roundKey === 'final' ? 14 : 0)

  const div = document.createElement('div')
  div.className = 'match'
  div.innerHTML = `
      <div class="match-status">
        <span><span class="status-dot ${dotClass}"></span>${statusLabel}</span>
        <span>M${matchNum}</span>
      </div>
      <div class="player ${p1win ? 'winner' : p2win ? 'loser' : ''}">
        <span class="seed">${seed1}</span>
        <div class="avatar" style="background:${color1}20;border-color:${color1}40;color:${color1}">${avatar1}</div>
        <span class="player-name">${p1name}</span>
        <span class="win-badge"></span>
      </div>
      <div class="vs-pill">VS</div>
      <div class="player ${p2win ? 'winner' : p1win ? 'loser' : ''}">
        <span class="seed">${seed2}</span>
        <div class="avatar" style="background:${color2}20;border-color:${color2}40;color:${color2}">${avatar2}</div>
        <span class="player-name">${p2name}</span>
        <span class="win-badge"></span>
      </div>
    `
  return div
}

function createQualifiedMatchElement(match, mi) {
  const p1name = match.p1 !== null ? state.players[match.p1] : '???'
  const p2name = match.p2 !== null ? state.players[match.p2] : '???'
  const p1idx = match.p1
  const p2idx = match.p2

  const avatar1 = p1idx !== null ? AVATARS[p1idx % AVATARS.length] : '?'
  const avatar2 = p2idx !== null ? AVATARS[p2idx % AVATARS.length] : '?'
  const color1 = p1idx !== null ? COLORS[p1idx % COLORS.length] : '#444'
  const color2 = p2idx !== null ? COLORS[p2idx % COLORS.length] : '#444'

  const seed1 = p1idx !== null ? `#${p1idx + 1}` : ''
  const seed2 = p2idx !== null ? `#${p2idx + 1}` : ''

  const div = document.createElement('div')
  div.className = 'match match--qualified'
  div.innerHTML = `
      <div class="match-status">
        <span><span class="status-dot done"></span>Qualified</span>
        <span>B${mi + 1}</span>
      </div>
      <div class="player qualified">
        <span class="seed">${seed1}</span>
        <div class="avatar" style="background:${color1}20;border-color:${color1}40;color:${color1}">${avatar1}</div>
        <span class="player-name">${p1name}</span>
        <span class="win-badge"></span>
      </div>
      <div class="vs-pill vs-pill--qualified">VS</div>
      <div class="player qualified">
        <span class="seed">${seed2}</span>
        <div class="avatar" style="background:${color2}20;border-color:${color2}40;color:${color2}">${avatar2}</div>
        <span class="player-name">${p2name}</span>
        <span class="win-badge"></span>
      </div>
    `
  return div
}

function renderRound(roundKey) {
  const container = document.getElementById(`matches-${roundKey}`)
  const data = state.rounds[roundKey]
  if (!container || !Array.isArray(data)) return
  container.innerHTML = ''

  data.forEach((match, mi) => {
    container.appendChild(createMatchCardElement(match, mi, roundKey))
  })
}

function renderOpeningQualified() {
  const root = document.getElementById('opening-qualified')
  const data = state.rounds.r1Qualified
  if (!root) return
  if (!Array.isArray(data) || data.length === 0) {
    root.hidden = true
    root.innerHTML = ''
    return
  }

  root.hidden = false
  root.innerHTML = ''

  const inner = document.createElement('div')
  inner.className = 'opening-qualified__inner'

  const head = document.createElement('div')
  head.className = 'opening-qualified__head'
  const title = document.createElement('h2')
  title.className = 'opening-qualified__title'
  title.textContent = season.bracket?.opening?.right?.name ?? 'Already qualified'
  const sub = document.createElement('p')
  sub.className = 'opening-qualified__sub'
  sub.textContent = 'Advance to next round'
  head.appendChild(title)
  head.appendChild(sub)
  inner.appendChild(head)

  const list = document.createElement('div')
  list.className = 'opening-qualified__matches'
  data.forEach((match, mi) => {
    list.appendChild(createQualifiedMatchElement(match, mi))
  })
  inner.appendChild(list)
  root.appendChild(inner)
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
  renderOpeningQualified()
  renderRound('r2')
  renderRound('r3')
  renderRound('final')
  renderChampion()
}

function showTab(id, tabEl) {
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'))
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')
  if (tabEl) tabEl.classList.add('active')
}

window.showTab = showTab

updateHeader()
renderAll()
