import season from './data/season.json'
import { Bracket } from './components/Bracket'
import './App.css'

function Rules({ sections }) {
  return (
    <div className="rules prose">
      {sections.map((sec, i) => (
        <section key={`${sec.heading}-${i}`}>
          <h3>{sec.heading}</h3>
          {sec.paragraphs?.map((p, pi) => (
            <p key={pi}>{p}</p>
          ))}
          {sec.listItems?.length ? (
            <ul>
              {sec.listItems.map((item, li) => (
                <li key={li}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  )
}

function App() {
  const { title, seasonLabel, rules, bracket } = season

  return (
    <div className="app">
      <header className="site-header">
        <p className="eyebrow">{seasonLabel}</p>
        <h1>{title}</h1>
        <nav className="jump-nav" aria-label="Page sections">
          <a href="#bracket">Bracket</a>
          <a href="#rules">Rules</a>
        </nav>
      </header>

      <main>
        <section id="bracket" className="panel">
          <h2>Bracket:</h2>
          <Bracket bracket={bracket} />
        </section>

        <section id="rules" className="panel">
          <h2>Rules:</h2>
          <Rules sections={rules.sections} />
        </section>
      </main>

      <footer className="site-footer">
        <small>
          Season <code>{season.seasonId}</code> · Static site — no login
        </small>
      </footer>
    </div>
  )
}

export default App
