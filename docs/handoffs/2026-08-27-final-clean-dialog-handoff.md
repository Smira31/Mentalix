# Mentalix — финальный handoff для нового чистого диалога

Дата сверки: **27.08.2026, Europe/Moscow**.

> Этот handoff — компактная стартовая карта. Перед любым действием нужно повторно проверить `origin/main`, `PROJECT_STATE.md`, `docs/TASK_INDEX.md`, открытые PR/Issues и checks.

## Готовый prompt для нового диалога

```text
Продолжи работу над Mentalix в репозитории Smira31/Mentalix.

Сначала прочитай MENTALIX_WORKSPACE_CONTEXT.md, PROJECT_STATE.md, TASKS.md, docs/TASK_INDEX.md, docs/COORDINATION_PROTOCOL.md и этот handoff: docs/handoffs/2026-08-27-final-clean-dialog-handoff.md.

Затем выполни read-only аудит: git fetch origin main, git status, фактический SHA origin/main, открытые PR/Issues, GitHub Actions checks и состояние Vercel/Render workflow. Не доверяй старым SHA и статусам из handoff без повторной проверки.

Роль этого диалога: [координатор / исполнитель / QA].
Цель: [одна цель].
Активная задача или PR: [ID/номер].

Не делай commit, push, merge, rebase, stash, deploy, удаление, изменение secrets, production/data-операции или внешнюю публикацию без моего отдельного подтверждения. Не выбирай P0 самостоятельно. Не расширяй product scope. Для MXL-021 сначала уточняй, о каком историческом scope идёт речь.

Перед изменением запиши scope lock: задача, branch, base SHA, writer, точные файлы, out-of-scope, проверки и rollback. В конце дай handoff: что изменилось, где, что проверено, что не проверено, следующий decision gate, риски и rollback.
```

## Каноническое состояние

| Область | Состояние |
|---|---|
| Release | `v1.0.0` опубликован; Render `/api/health` gate встроен в release workflow |
| GitHub automation | Русские PR/Issue/release templates, Vercel Git Integration, Telegram Preview, Render health-check, project journal |
| Secrets | `VERCEL_TOKEN` отсутствует после проверки Settings; значения действующих secrets не раскрываются |
| iPhone gate | PASS на iPhone 16 Pro Max, iOS 26.6; Today, Check-in, Practices, AI, Library, Trends и navigation подтверждены владельцем |
| v1.1.0 priority | `MXL-UX-RESPONSIVE-001`; реализация ещё не начиналась |
| Android gate | `MXL-012` остаётся `manual-gate`; Android evidence отсутствует |
| Journal | Persistence/history/privacy остаются зависимыми от backend contract, privacy decision и manual gates |

## Что завершено в истории

Закрыты основные Today/Journey/History/AI и release slices, включая `MXL-007`, `MXL-008`, `MXL-021` через PR #203, `MXL-005`, `MXL-006`, `MXL-009`, `MXL-011`, `MXL-014`, `MXL-015`, `MXL-016` и `MXL-019`. Для `MXL-021` помнить: исторически использовались два разных scope — тёплый фон и Journey → Today.

Смёржены automation/release/handoff PR #233, #235, #236, #238, #240. Текущая документационная coordination ветка находится в PR #242 и пока не смёржена из-за Vercel production `build-rate-limit`.

## Текущий блокер

На последней проверке PR #242 имел 3 успешных checks и 1 failed check:

- GitHub Actions — success;
- Vercel Preview Comments — success;
- Vercel Preview — success;
- Vercel production `mentalix` — failure из-за deployment rate limit (`upgradeToPro=build-rate-limit`).

Merge PR #242 не выполнять, пока production check не станет успешным, если владелец отдельно не разрешит документированный bypass. Старые PR не закрывать массово.

## Open PR triage

| PR | Краткий статус | Следующее действие |
|---|---|---|
| #241 | Home/typography, conflicting, Vercel failure | Диагностика и review, возможное пересечение responsive |
| #237 | Journal History, conflicting, checks success | Journal decision и Telegram/iPhone gate |
| #234 | Journal architecture/privacy docs, clean | Отдельное owner review |
| #152 | Security audit docs, conflicting | Сверка с приватным backend PR #14 |
| #28/#26/#21/#11 | Старые draft PR, conflicting | Рассматривать по одному; не закрывать автоматически |

## Следующий рабочий порядок

1. Проверить, снят ли Vercel rate limit PR #242.
2. Если checks зелёные и mergeability clean, отдельно подтвердить merge и затем обновить `PROJECT_STATE.md` с новым SHA.
3. Если blocker сохраняется, не обходить gate; зафиксировать дату повторной проверки.
4. После coordination merge перейти к `MXL-UX-RESPONSIVE-001`: read-only audit UI-кода, воспроизведение UX-R кейсов, минимальный scope и отдельный implementation PR.
5. Android `MXL-012` планировать отдельно на реальном Android, не считать desktop/iPhone evidence заменой.

## Handoff

**Что изменилось:** подготовлена финальная карта для чистого диалога; зафиксирован текущий Vercel blocker PR #242.

**Где находится:** этот файл, `docs/COORDINATION_PROTOCOL.md`, `docs/handoffs/2026-08-27-pr-triage.md`, `PROJECT_STATE.md`, `docs/TASK_INDEX.md`.

**Что проверено:** GitHub PR/checks, текущий backlog и существующий Mentalix workflow.

**Что не проверено:** снятие Vercel rate limit, Android device gate, merge PR #242, закрытие/архивирование старых PR.

**Следующий decision gate:** повторная проверка PR #242; после зелёных checks — подтверждение merge.

**Риски:** старые branches конфликтуют с main; snapshots могут устаревать; несколько диалогов могут одновременно менять canonical docs.

**Rollback:** документационные изменения откатываются revert PR; старые PR не закрывать без отдельного решения по каждому.
