# GymControl - Agent Notes

Hybrid Angular 20 + Ionic app: gym management UI (alumnos, maestros, users, attendance, memberships). Targets web, Electron (Windows), and Android via Capacitor. Spanish (es-MX).

Backend lives elsewhere: `https://gymcontrol-api-sne4.onrender.com/api/v1/`. This repo is frontend only.

---

## Commands

| Task | Command | Notes |
|---|---|---|
| Dev server (web) | `npm start` | Angular CLI on port 4200 |
| Dev server + Electron | `npm run electron:dev` | Uses `concurrently` + `wait-on http://localhost:4200`; sets `ELECTRON_DEV=true` |
| Production web build | `npm run build` | SSR enabled, output `dist/GymControl/server` + `browser` |
| Capacitor build (mobile) | `npm run capacitor:build` | Builds with `--configuration capacitor` then `npx cap sync` |
| Electron installer | `npm run electron:build` | Uses `capacitor` build config + `electron-builder` → `release/` |
| Electron only (no Angular) | `npm run electron:dist` | Assumes `dist/` already exists |
| Run SSR server | `npm run serve:ssr:GymControl` | Express on `PORT` (default 4000) |
| Unit tests | `npm test` | **Karma + Chrome** (not Jest). Requires Chrome installed. CI uses headless flags. |
| Open Android Studio | `npm run capacitor:open` | |

There is **no lint script** and no separate typecheck script. `ng build` performs typecheck+lint-equivalent checks via Angular's strict compiler.

### Build configurations (`angular.json`)

- `production` (default) — SSR on, server output, budget 800kB warn / 2MB error
- `development` — no SSR, file replacement swaps `environment.ts` → `environment.development.ts`
- `capacitor` — static output, budget 2MB warn / 5MB error. Used by `electron:build` and `capacitor:build`

---

## Architecture (not obvious from filenames)

- **Zoneless change detection**: `provideZonelessChangeDetection()` is set in `app.config.ts`. There is no `zone.js` polyfill; do not add zone-based code (e.g. `setTimeout` triggers won't auto-detect).
- **All components are standalone** — no NgModules. Each component declares its `imports` array.
- **Functional DI everywhere**: use `inject()` not constructor injection.
- **Functional guards/interceptors**: `authGuard` (`CanActivateFn`) and `authInterceptor` (`HttpInterceptorFn`) — not class-based.
- **Heavy use of signals**: `signal()`, `computed()`. Prefer signals over RxJS subjects for component state.
- **All routes are lazy**: every route uses `loadComponent` with dynamic imports. New routes must follow the same pattern.
- **Spanish UI**: locale `es-MX` is registered globally in `app.config.ts`. Date formatting uses Spanish conventions. Keep UI text in Spanish.
- **Soft delete**: entities use `is_deleted` boolean. Use `?include_deleted=true` query param on list endpoints to fetch them.

### File layout

```
src/app/
  app.config.ts / app.routes.ts    # Providers + routing
  Models/                          # TypeScript interfaces (no decorators)
  Services/
    api-service.ts                 # All HTTP calls — single source of truth for the API
    session.service.ts             # JWT + user in localStorage, isAuthenticated signal
  Guards/auth.guard.ts             # Redirects to /login if not authenticated
  Interceptors/auth.interceptor.ts # Attaches Bearer token; 401 → clears session
  Components/<Name>/<name>.ts|html|css
```

Each Component folder has the component, its template, styles, and a sibling modal (e.g. `alumnos.ts` + `alumno-form-modal.ts`) when CRUD is via modal.

---

## Auth flow

- `SessionService` stores `auth_token` and `auth_user` in `localStorage`. Exposes `isAuthenticated` signal.
- `authInterceptor` clones every request to add `Authorization: Bearer <token>`. On 401, it clears the session, sets `session_expired=1` in `sessionStorage`, and routes to `/login`.
- `authGuard` checks `session.isAuthenticated()` and returns a UrlTree to `/login` otherwise.
- Login component reads `sessionStorage.getItem('session_expired')` to show the "session expired" toast.

---

## Environment / API

`src/environments/environment.ts` holds `apiUrl`. The dev file (`environment.development.ts`) currently points at the **production** Render URL — the local `http://localhost:5000/api/v1/` line is commented out. Uncomment it to point dev at a local backend.

Cloudinary is used for student/teacher photos:
- Cloud name: `dyvqspnz7`
- Student preset: `gymcontrol_upload`
- Maestro preset: `gymcontrol_upload_maestros`

The app uploads directly to Cloudinary via `fetch` (no SDK). Search for `cloudinary` in `alumno-form-modal.ts` and `maestro-form-modal.ts`.

---

## Conventions

- Prettier: 2-space indent, single quotes, `printWidth: 100`, Angular HTML parser for `*.html`.
- TypeScript: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch` all on. **`noPropertyAccessFromIndexSignature` is the one that bites** — use `obj['key']` not `obj.key` for index signatures.
- Angular: `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` all on.
- Don't add comments unless asked.
- Match the file style: components use `imports: [...]` arrays and `inject()` calls in field initializers, not constructors.

---

## Gotchas

- `package-lock.json` is **gitignored** (`.gitignore` line 13). Only `package.json` is committed. Do not commit the lockfile.
- `dist/`, `release/`, `out-tsc/`, `coverage/`, `.angular/`, `.env` are all gitignored.
- There is **no e2e directory** and no ESLint config.
- Test files (`*.spec.ts`) are colocated with source. `tsconfig.app.json` excludes them from the browser build; `tsconfig.spec.json` includes all of `src/**/*.ts` for tests.
- Tests need a real Chrome binary. No headless config is set in `angular.json` — running in CI may require `CHROME_BIN` env var or a custom Karma launcher.
- `main` is set in `package.json` to `electron/main.js` for Electron packaging; this does not affect `ng serve`.
- `capacitor.config.ts` points `webDir` at `dist/GymControl/browser` — this is the output of the `capacitor` build config (and matches the static `outputMode`). Do not point it at the SSR server output.
- `android/` directory is the Capacitor-generated Android project. Run `npm run capacitor:build` after web changes to sync.

---

## Where to start when changing X

- **Add a new entity/feature**: add a model in `Models/`, add methods to `api-service.ts`, create a folder under `Components/<Name>/`, add a lazy route in `app.routes.ts` (under `dashboard` if protected).
- **Add a new guarded route**: child of `dashboard` in `app.routes.ts`; `authGuard` is already on the parent.
- **Change API base URL**: edit `environment.ts` (and/or `environment.development.ts`).
- **Add a new build target**: edit `angular.json` → `projects.GymControl.architect.build.configurations`.
- **Add a new npm script**: edit `package.json`; keep the `concurrently` + `wait-on` + `cross-env` pattern used in `electron:dev` if both server and shell need to run.
