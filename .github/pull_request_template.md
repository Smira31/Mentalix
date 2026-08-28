## Контекст

**Issue / задача:** `MXL-...` или ссылка на Issue.
**Тип работы:** `feature` / `bug` / `ui` / `docs` / `automation` / `security` / `backend-dependent`
**Следующий decision gate:** что должен подтвердить владелец, если подтверждение требуется.

**Проблема и ожидаемый результат:**

## Scope

**Что изменено:**

**Что намеренно не менялось:**

## Проверка

- [ ] `npm run doctor`
- [ ] `npm run check:core`
- [ ] `npm run docs:drift`
- [ ] `npm run ux:check` — если менялся UI
- [ ] Preview проверен — если создавался Preview
- [ ] Реальный Telegram/iPhone gate пройден — если изменены safe area, keyboard, fixed/sticky/fullscreen или платформа
- [ ] Внешний `/api/health` проверен — если затрагивается API/release

**Ограничения проверки / что не проверено:**

**Agent handoff:** что изменено, что проверено, что не проверено, риски и точный следующий шаг для Codex/Claude Code.

## Риск и rollback

**Риск после merge:**

**Rollback:**

## Фокус ревью

Что именно должен проверить ревьюер или владелец перед merge?
