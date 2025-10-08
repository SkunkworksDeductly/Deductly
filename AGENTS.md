# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React client: UI elements in `src/components`, page flows in `src/pages`, shared state in `src/contexts`, config helpers in `src/config`, and API calls in `src/services`.
- `backend/` houses the Flask API; each domain (`insights`, `personalization`, `skill_builder`) exposes `routes.py` and `logic.py` and is wired up through `backend/app.py`. Data assets and scrapers live beside those blueprints.
- `public/` serves static files, while root configs (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`) control bundling and styling.

## Build, Test, and Development Commands
- `npm install` installs front-end dependencies; run it after pulling changes to `package.json`.
- `npm run dev` launches Vite on `http://localhost:5173`; it assumes the Flask API is running.
- `npm run build` compiles to `dist/`; `npm run preview` serves that bundle for QA checks.
- `npm run backend` (or `cd backend && source venv/bin/activate && python app.py`) starts Flask on port `5001`. Prep the venv with `python -m venv venv && pip install -r backend/requirements.txt`.

## Coding Style & Naming Conventions
- JavaScript/JSX: 2-space indentation, single quotes, functional components with PascalCase filenames (e.g., `StudyPlan.jsx`), and Tailwind utility classes grouped by purpose.
- Python: PEP 8 (4 spaces, snake_case modules). Keep request parsing inside blueprint logic and document complex helpers with short docstrings.
- Mirror existing folder layout when adding features; prefer descriptive module names over deep nesting.

## Testing Guidelines
- Automated suites are not present yet; seed new features with targeted coverage as you introduce frameworks. Use Vitest + React Testing Library for UI (`*.test.jsx`) and pytest for Flask endpoints under `backend/tests/`.
- Until tests are committed, record manual verification steps in PRs and ensure `npm run build` plus a backend smoke run pass locally.

## Commit & Pull Request Guidelines
- Follow the existing pattern `[DEDUCTLY-<AREA>-<ID>] Imperative summary`, for example `[DEDUCTLY-SERVICE-4] Add personalization endpoint guards`; keep bodies focused on rationale and follow-up work.
- Pull requests must link the driving issue, describe user impact, list manual/automated test evidence, and include screenshots or response samples for UI or API changes. Request cross-team review when modifying shared contracts.

## Environment & Configuration Tips
- Secrets belong in `backend/.env`; `python-dotenv` already loads them in `app.py`. Use sample entries from `DEPLOYMENT.md` when onboarding new keys.
- Front-end environment values live in Vite `.env*` files with the `VITE_` prefix and are read through modules in `src/config` to keep consumption centralized.
