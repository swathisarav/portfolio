# Swathi Saravanan — portfolio

Personal portfolio site: a beach landing page you leave by pulling up a wave,
and the main page.

## Running it

```sh
npm install
npm run dev        # local dev server
npm run typecheck  # TypeScript only
npm run build      # type-check, then build into docs/
```

## Deploying

GitHub Pages serves the `docs/` folder of `main` at `/portfolio/`.
Run `npm run build` and commit the updated `docs/` folder.

## Where things are

- `src/app/App.tsx` — the main page (nav, about, projects, contact).
- `src/app/components/Gate.tsx` — the beach landing scene.
- `src/app/components/WaveTransition.tsx` — the pull-up wave that moves between
  the beach and the site, in both directions.
