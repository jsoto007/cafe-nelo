# Black Ink Tattoo

A minimal, monochrome full-stack experience for the BLACK INK TATTOO studio. The React + Tailwind client pairs with a Flask + SQLAlchemy API to showcase work, capture consultations, and stay accessible across light and dark themes.

## Getting Started

1. Clone this repository.
2. Copy the provided environment examples and adjust values.
3. Install dependencies for the client and server.
4. Run the dev servers in separate terminals.

### Environment setup

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### Server

```bash
cd server
pipenv install
pipenv run flask --app wsgi run --debug
```

### Client

```bash
cd client
npm install
npm run dev
```

Available scripts:

- `npm run dev` - Vite development server on http://127.0.0.1:5173
- `npm run build` - production bundle
- `npm run preview` - preview built assets
- `npm run lint` - lint source files with ESLint
- `npm run format` - format with Prettier

## Environment variables

| Name | Location | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `client/.env` | Base URL for the Flask API (default `http://127.0.0.1:5000`) |
| `FLASK_ENV` | `server/.env` | Flask environment (`development`, `production`, etc.) |
| `DATABASE_URL` | `server/.env` | Database connection string; defaults to in-memory SQLite when unset |
| `SECRET_KEY` | `server/.env` | Secret key for Flask session security |

## Architecture

- `client/` - Vite + React single-page application with TailwindCSS, modular UI components, and data fallbacks.
- `server/` - Flask application factory with SQLAlchemy models, seeded demo records, and JSON-only routes.
- Shared focus on monochrome styling, ample spacing, and light/dark theming managed via `document.documentElement.classList`.

## Accessibility & performance checklist

- Descriptive `alt` text for imagery and discernible labels for interactive elements.
- Keyboard-friendly navigation with focus trapping in dialogs and lightbox, plus arrow-key tabs.
- Respects `prefers-reduced-motion`; lazy loads gallery imagery.
- Theme toggle persists user choice and honors initial system preference.

## Deployment notes

- Frontend: deploy `client/` build output to Netlify or Vercel with `VITE_API_BASE_URL` pointing to the live API.
- Backend: deploy `server/` to Render, Fly.io, or Heroku; provision a persistent database via `DATABASE_URL`.
- Update CORS origins in `app/__init__.py` if production hosts differ from local defaults.
# black-work-tattoo
