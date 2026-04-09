# OfficialCodeChessClub

Single-page tournament bracket app served by Vite.

## Stack

- HTML entry: `index.html`
- Runtime logic: `src/bracket-standalone.js`
- Data source: `src/data/season.json`
- Dev/build tooling: Vite

## Local Development

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

`npm run preview` serves the built output from `dist` for production-like verification.
