import '../App.css'

export function MatchCard({ match }) {
  const aWins = match.winner === 'A'
  const bWins = match.winner === 'B'

  return (
    <article className="match" aria-labelledby={`match-${match.id}-label`}>
      <p id={`match-${match.id}-label`} className="match-id">
        {match.id}
      </p>
      <div className={`slot ${aWins ? 'winner' : ''}`}>
        <span className="name">
          <span className="name__text">{match.playerA}</span>
          {aWins ? (
            <span className="winner-mark" aria-hidden="true">
              {' '}
              ⬆️
            </span>
          ) : null}
        </span>
      </div>
      <div className={`slot ${bWins ? 'winner' : ''}`}>
        <span className="name">
          <span className="name__text">{match.playerB}</span>
          {bWins ? (
            <span className="winner-mark" aria-hidden="true">
              {' '}
              ⬆️
            </span>
          ) : null}
        </span>
      </div>
    </article>
  )
}
