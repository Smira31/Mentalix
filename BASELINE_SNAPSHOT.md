# Mentalix — Baseline Snapshot

> Фаза 0 (Freeze & Baseline). Только документирование фактического состояния; runtime-код, UI, дизайн и продуктовые документы не изменялись.

## Freeze metadata

| Поле | Значение |
|---|---|
| `date` | 2026-09-10 |
| `checked_at` | 2026-09-10T20:57:05+03:00 |
| `baseline_branch` | `main` |
| `checked_from` | Fresh clones via GitHub CLI; GitHub repository metadata and live HTTP checks |
| `scope` | `Smira31/Mentalix`, `Smira31/mentalix-bot` |

## Production / preview / backend endpoints

| Environment / термин | URL | Наблюдаемый статус | Деплой / SHA |
|---|---|---|---|
| Production | <https://mentalix.vercel.app> | HTTP `200`; `server: Vercel` на момент проверки | SHA фактически обслуживаемого Vercel deployment не удалось подтвердить доступными GitHub/Vercel credentials |
| Owner QA Preview | <https://mentalix-preview.vercel.app> | HTTP `200`; `server: Vercel` на момент проверки | SHA фактически обслуживаемого Vercel deployment не удалось подтвердить доступными GitHub/Vercel credentials |
| Render backend | <https://mentalix-bot.onrender.com> | `GET /api/health` → HTTP `200`, `{"status":"ok"}` | SHA фактически работающего Render deployment не удалось подтвердить доступными credentials; URL подтверждён live health-check |

В репозитории `mentalix-bot/RENDER.md` этот Render URL указан как backend и health endpoint. Проверка не является доказательством полного production-поведения, webhook-состояния или provenance deployment.

## Repository: `Smira31/Mentalix`

| Поле | Значение |
|---|---|
| `environment` | Public React/Vite frontend; Vercel production и Owner QA Preview URL выше |
| `repo` | <https://github.com/Smira31/Mentalix> |
| `branch` | `main` |
| `commit SHA` | `d4b908903d97be74e4ada645f843aafe024ecb91` |
| `date` | 2026-09-10 |
| `checked_at` | 2026-09-10T20:57:05+03:00 |
| `known discrepancies` | GitHub `main` protected; required check observed: `Базовая проверка проекта`. Live Vercel deployment SHA не подтверждён. В репозитории есть активные удалённые ветки кроме `main`: `dependabot/npm_and_yarn/js-yaml-4.3.2`, `feat/mentor-mvp-kompas-ux`, `feat/mxl-practice-flow-ux-001-production`, `feature/mxl-today-prod-hero-001`, `fix/mxl-525-visual-batch`; они не входят в `main` по локальной проверке `git branch -r --merged origin/main`. |

### Current CI gates

Последний завершившийся `Mentalix CI baseline` на этом HEAD:

- workflow run `34510045515` — `success`;
- `Frontend quality` — `success` (core checks: unit tests, lint, build, docs check, docs drift);
- `Playwright Chromium smoke` — `success` (UX smoke и MXL-010 production-like gate);
- `Backend health` — `success`;
- `Dependency audit` — `success` (workflow настроен с `continue-on-error: true`);
- `Базовая проверка проекта` — `success`.

## Repository: `Smira31/mentalix-bot`

| Поле | Значение |
|---|---|
| `environment` | Private FastAPI/Telegram backend; Render deployment URL выше |
| `repo` | <https://github.com/Smira31/mentalix-bot> |
| `branch` | `main` |
| `commit SHA` | `d6694f585ec318288da8c0df0326ac722b40a3f9` |
| `date` | 2026-09-10 |
| `checked_at` | 2026-09-10T20:57:05+03:00 |
| `known discrepancies` | Единственная удалённая ветка — `main`; GitHub branch-protection details не удалось прочитать через текущую интеграцию (GitHub API вернул ограничение для private repository), поэтому статус protection не утверждается. Render live SHA не подтверждён. Документация репозитория содержит исторические compatibility-названия `KOYEB_*`; это не принимается за текущий deployment URL. |

### Current CI / jobs gates

Последний завершившийся run на этом HEAD:

- workflow `Backend CI baseline` — run для `main` на SHA `d6694f585ec318288da8c0df0326ac722b40a3f9`, job `Backend CI baseline` — `success`;
- workflow `Mentalix scheduled jobs` — run `34502512611`, job `tick` — `success`.

В backend CI шаг, обозначенный как lint, является syntax check (`python -m compileall -q backend bot`); отдельный ruff/flake8/black в репозитории не настроен.

## Explicit Scope C resolution — PR #572

**Ответ: смёржен в `main`.**

Evidence:

1. GitHub PR <https://github.com/Smira31/Mentalix/pull/572> имеет состояние `MERGED`, merge commit `dfb6bed18b86a83d21478c141badee6d8dc74072`.
2. `git log main --oneline -20` содержит `dfb6bed1 feat: Scope C — карточная раскладка Progress V2 (#572)`.
3. Merge commit является предком текущего `main` (`git merge-base --is-ancestor` завершился успешно).
4. В текущем `src/screens/Analytics.jsx` прямое включение Scope C присутствует в строках `692–694`:

   ```jsx
   className={`mx-progress-redesign mx-progress-redesign--live mx-type-page w-full max-w-md px-5 animate-fade-in${
     PROGRESS_LAYOUT_V2_ENABLED ? ' mx-progress-layout-v2' : ''
   }`}
   ```

   Сам флаг определяется в строке `10`:

   ```jsx
   const PROGRESS_LAYOUT_V2_ENABLED = import.meta.env.VITE_PROGRESS_LAYOUT_V2 === 'true'
   ```

Это подтверждает наличие карточной раскладки Progress V2 в текущем frontend-коде. Этот baseline не утверждает, какое значение feature flag установлено в каждом внешнем окружении.

## Scope boundary

Фаза 1 не выполнялась: она требует отдельного подтверждения владельца после завершения Фазы 0. Не изменялись `PROJECT_STATE.md`, README, `docs/DOCUMENTATION_GUIDE.md`, `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `AGENTS.md`, `TASKS.md`, `CHANGES.md`, `docs/archive/**`, UI Lab и любой runtime-код.
