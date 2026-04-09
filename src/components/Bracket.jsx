import { MatchCard } from './MatchCard'
import { useBracketConnectors } from '../hooks/useBracketConnectors'

function OpeningColumn({ title, matches }) {
  return (
    <>
      <h3 className="bracket-round__title">{title}</h3>
      <div className="round-matches">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </>
  )
}

export function Bracket({ bracket }) {
  const { opening, hub, knockout } = bracket
  const primaryRounds = knockout.slice(0, 2)
  const secondaryRounds = knockout.slice(2)

  const {
    shellRef,
    leftRef,
    rightRef,
    hubRef,
    setKnockoutRef,
    setKnockoutMatchRef,
    svgWidth,
    svgHeight,
    paths,
  } = useBracketConnectors({ opening, hub, knockout })

  return (
    <div
      className="bracket-shell"
      ref={shellRef}
      role="region"
      aria-label="Tournament bracket"
    >
      {svgWidth > 0 && svgHeight > 0 && (
        <svg
          className="bracket-svg"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          aria-hidden
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="var(--bracket-line)"
              strokeWidth="2"
            />
          ))}
        </svg>
      )}

      <div className="bracket-content">
        <div className="bracket-opening">
          <section
            ref={leftRef}
            className="bracket-opening__col bracket-opening__col--left"
          >
            <OpeningColumn
              title={opening.left.name}
              matches={opening.left.matches}
            />
          </section>
          <section
            ref={rightRef}
            className="bracket-opening__col bracket-opening__col--right"
          >
            <OpeningColumn
              title={opening.right.name}
              matches={opening.right.matches}
            />
          </section>
        </div>

        <div ref={hubRef} className="bracket-hub">
          <span className="bracket-hub__label">{hub.label}</span>
        </div>

        <div className="bracket-knockout">
          <div className="bracket-knockout__top">
            {primaryRounds.map((round, index) => (
              <section
                key={round.name}
                ref={setKnockoutRef(index)}
                className={`bracket-round bracket-round--stacked ${
                  index === 0
                    ? 'bracket-round--r2'
                    : index === 1
                      ? 'bracket-round--qf'
                      : ''
                }`}
              >
                <h3 className="bracket-round__title">{round.name}</h3>
                <div className="round-matches">
                  {round.matches.map((m, matchIndex) => (
                    <div
                      key={m.id}
                      ref={setKnockoutMatchRef(index, matchIndex)}
                      className="bracket-match-anchor"
                    >
                      <MatchCard match={m} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="bracket-knockout__bottom">
            {secondaryRounds.map((round, secondaryIndex) => {
              const index = secondaryIndex + 2
              return (
                <section
                  key={round.name}
                  ref={setKnockoutRef(index)}
                  className="bracket-round bracket-round--stacked bracket-round--detached"
                >
                  <h3 className="bracket-round__title">{round.name}</h3>
                  <div className="round-matches">
                    {round.matches.map((m, matchIndex) => (
                      <div
                        key={m.id}
                        ref={setKnockoutMatchRef(index, matchIndex)}
                        className="bracket-match-anchor"
                      >
                        <MatchCard match={m} />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
