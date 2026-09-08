# Mentalix Preview и UI Lab: единый рабочий контур

Этот документ — каноническая инструкция по локальному UI Lab, временному
Cloudflare Tunnel, Vercel Preview и production deployment. Другие документы
должны ссылаться сюда, а не описывать альтернативную последовательность.

## Три среды без дублирующих deployment

| Среда              | Для чего                                    | Когда использовать                       |
| ------------------ | ------------------------------------------- | ---------------------------------------- |
| Локальный UI Lab   | Частые визуальные итерации и скриншоты      | По умолчанию, без push и Vercel          |
| `mentalix-preview` | Один точный QA-кандидат для Telegram/iPhone | После локальных проверок и готовности PR |
| `mentalix`         | Пользовательский production                 | Только после owner PASS и merge в `main` |

Обычный бюджет одной UI-задачи: **0 deployments** во время разработки,
**1 QA deployment** после готовности кандидата и **1 production deployment**
после merge. Исправленный QA-кандидат допускает ещё один deployment, но push
после каждой микроитерации не является Preview-процессом.

## Локальный UI Lab без Vercel

В первом окне PowerShell:

```powershell
npm run ui-lab:local
```

Каталог «Шаги» открывается по адресу:

```text
http://127.0.0.1:5173/?ui_lab=practice-catalog
```

Локально выполняются сравнение вариантов, скриншоты 320/375/390/430 px,
визуальные снапшоты и Playwright. Git commit не создаёт deployment; deployment
может запустить только push в подключённую Git-ветку или явная команда Vercel.

## Временный Cloudflare Tunnel для быстрого просмотра на iPhone

Cloudflare Quick Tunnel уже установлен на рабочем Windows-компьютере. Сначала
можно проверить окружение без публикации URL:

```powershell
npm run ui-lab:tunnel:check
```

Оставьте `npm run ui-lab:local` запущенным в первом окне. Во втором окне:

```powershell
npm run ui-lab:tunnel
```

`cloudflared` напечатает временный адрес вида
`https://<random>.trycloudflare.com`. Для каталога добавьте к нему
`/?ui_lab=practice-catalog`.

Скрипт по умолчанию использует HTTP/2, чтобы не зависеть от доступности UDP/QUIC.
Если сеть блокирует исходящий TCP-порт 7844, Tunnel не установится: не менять
firewall автоматически, а использовать локальный UI Lab или Vercel QA и
зафиксировать точный connectivity error.

Quick Tunnel — только быстрый визуальный просмотр. URL публичный, случайный и
временный: не вводить реальные дневниковые записи, Telegram `initData`, токены,
секреты или персональные данные. Он не заменяет exact-SHA Vercel QA candidate,
не становится BotFather URL и не используется как production. Остановка —
`Ctrl+C` в обоих окнах PowerShell.

## Vercel: закреплённое разделение проектов

- `mentalix`: Git Integration автоматически собирает только production `main`;
  feature-branch Preview в этом проекте пропускаются через Ignored Build Step.
- `mentalix-preview`: автоматические Git deployments отключены. Один готовый
  кандидат разворачивается явно из точного worktree/SHA и получает канонический
  alias `https://mentalix-preview.vercel.app`.
- deploy-hook `auto-retry-quota-reset` — аварийный механизм после исчерпания
  квоты, а не обязательный второй deployment после каждого merge. Если Git
  Integration уже успешно собрала `main`, hook не вызывается.

Перед QA агент обязан доказать, что alias указывает на запрошенный SHA. Сам факт
HTTP 200 или существования alias этого не доказывает.

Пример единственного QA deployment из точного worktree готового PR:

```powershell
npx vercel@latest deploy --prod --yes --project mentalix-preview --scope smiraandre2-8311s-projects
```

Команда выполняется только после `npm run check:core`, `npm run ux:check` и
явного разрешения на создание QA deployment. Перед запуском проверить текущую
ветку и `git rev-parse HEAD`; после запуска — `vercel inspect` и SHA deployment.

## Если Vercel сообщает о лимите

1. Не повторять deploy в цикле.
2. Открыть Vercel Dashboard → команда → Usage и записать точное имя лимита.
3. Продолжать локальную работу/UI Lab; лимит Vercel не является ошибкой кода.
4. Для быстрого визуального просмотра использовать локальный UI Lab или Quick
   Tunnel.
5. После сброса квоты создать один deployment готового SHA.

На Hobby различаются как минимум часовой build limit, суточный deployment
limit и месячные included resources. Поэтому запись «Vercel limit» без точного
кода/ресурса недостаточна для решения.

## Telegram Preview через GitHub Actions

Этот workflow проверяет уже существующий Vercel Preview через `GET /api/health` и после явного ручного запуска отправляет в основной Mentalix-бот одно однозначное Telegram-сообщение с одной кнопкой. Workflow не создаёт Vercel deployment. Production-домен, backend и основной Vercel project не изменяются.

## Как это работает

Vercel Git Integration может запускать deployment для push и PR в подключённом репозитории. `repository_dispatch` от Vercel сохраняется только для совместимости и не отправляет Telegram. Канонический путь — `workflow_dispatch` с URL уже существующего Preview и явными `branch`, `pr_number`, `preview_title`, `commit_sha` и, при необходимости, `ui_lab_route`/`experiment_label`. Workflow проверяет `https://<preview>/api/health` и только затем вызывает Telegram Bot API. GitHub Actions не выполняет Vercel CLI.

Workflow принимает `vercel.deployment.success`, но job для этого события намеренно не запускается. Только `workflow_dispatch` может отправить Telegram. PR из fork не получает доступ к Telegram-секретам. Concurrency отменяет конкурирующий manual run для того же commit/route; persistent deduplication здесь не используется.

## Сценарий проверки в Telegram-сообщении

Текст «что проверить» в Telegram берётся из тела PR, не генерируется автоматически по изменённым файлам и не передаётся отдельным параметром. Добавьте в описание PR раздел с заголовком `## Preview checklist` — заголовок обязателен дословно, содержимое под ним пишете под конкретный PR каждый раз заново. Ниже — пример формата, не текст для копирования:

```markdown
## Preview checklist

1. Открыть Today
2. Нажать карточку темы
3. Убедиться, что показывается вторая тема, а не первая
```

Текст между `## Preview checklist` и следующим `## `-заголовком (или концом описания) отправляется в Telegram как есть. Если раздела нет или он пустой, Telegram получит явное «Сценарий проверки не указан в PR — проверьте вручную» со ссылкой на diff — не общий шаблонный текст, который можно принять за реальный сценарий.

## Одноразовая настройка через GitHub на телефоне

Откройте репозиторий `Smira31/Mentalix` в браузере телефона. В приложении GitHub раздел Settings иногда спрятан за меню с тремя точками; если его нет в приложении, используйте браузерную версию GitHub.

Перейдите в **Settings → Secrets and variables → Actions → New repository secret**. Для Telegram Preview нужны только два repository secret:

| Secret                     | Что положить                                     | Где получить                                    |
| -------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `TELEGRAM_MAIN_BOT_TOKEN`  | Токен основного Mentalix-бота                    | Сохранённое значение владельца бота / BotFather |
| `TELEGRAM_PREVIEW_CHAT_ID` | ID личного чата или группы для сообщений Preview | Проверенный Telegram chat ID                    |

Значения вводятся непосредственно в GitHub и после сохранения больше не отображаются. **Не присылайте токены в issue, PR, чат или commit и не добавляйте их в `.env`-файлы, которые могут попасть в Git.**

Проект `mentalix-preview` связан с репозиторием для provenance, но автоматические
Git deployments отключены для экономии квоты. Готовый exact-SHA QA deployment
создаётся один раз явной командой Vercel, после чего GitHub хранит только
Telegram-секреты, перечисленные выше.

## Основной ежедневный сценарий

Основной способ отправить Preview — открыть GitHub Actions → **Telegram Preview** → **Run workflow**. В ручной форме укажите готовый Vercel Preview URL, branch, commit SHA и metadata PR. Для PR #490 используйте title `Today` и route `Today`; для PR #494 — `Practices`, `ui_lab_route=experiments`, `experiment_label=UI Lab / Practices`; для PR #496 — `Evening Review`, `ui_lab_route=experiments`, `experiment_label=UI Lab / Evening Review`. Workflow проверит существующий URL и отправит ровно одну кнопку с точным route.

Не запускайте одновременно локальный PowerShell-сценарий и GitHub workflow для одного deployment: это может создать дублирующие сообщения и конкурирующие cleanup-действия.

## Ручной запуск с телефона

После того как workflow попадёт в `main`, откройте **Actions → Telegram Preview → Run workflow**. Используйте только канонический URL `https://mentalix-preview.vercel.app`, для которого Vercel-side проверка подтвердила exact SHA. Заполните metadata PR. Нажмите **Run workflow** только после local → CI → review и явного разрешения на manual iPhone/Telegram gate. Этот запуск не создаёт новый Vercel deployment.

## Проверка Preview

После явного exact-SHA deployment workflow **Telegram Preview** запускается
вручную с каноническим URL, проверяет health и отправляет одну кнопку. Preview
предназначен для ручной проверки интерфейса на телефоне.

Для MXL-021 после открытия Preview нужно проверить Journey → `Продолжить сегодня` → Today, затем пройти ручной Telegram/iPhone gate. GitHub Actions может проверить сборку и health endpoint, но не заменяет визуальную проверку на реальном iPhone.

## Проверка внешнего backend

Основной CI дополнительно проверяет `https://mentalix-bot.onrender.com/api/health`. Ожидаемый ответ — HTTP 200 и JSON `{"status":"ok"}`. Проверка повторяется несколько раз, чтобы учитывать пробуждение Render Free после периода простоя.

Результаты merge и автоматических проверок фиксируются в [`PROJECT_STATE.md`](../PROJECT_STATE.md). Продуктовый статус и ручной iPhone/Telegram gate подтверждаются владельцем в Pull Request.

## Локальный fallback (Windows/PowerShell)

Legacy-скрипт не является обычным Preview-путём и не должен использоваться для Telegram gate. Обычная команда `npm run preview` запускает только локальный web preview. Legacy-скрипт требует явный PR metadata и завершается до deployment/Telegram, если `-PullRequest` не указан.

```bash
npm run preview
```

Он выполняет похожую последовательность и отправляет сообщение в Telegram после успешного health-check. Для остановки локального Preview используется:

```bash
npm run preview:stop
```

## References

- [GitHub Actions secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions)
- [Vercel Git deployments](https://vercel.com/docs/deployments/git)
- [Vercel deploy CLI](https://vercel.com/docs/cli/deploy)
- [Telegram Bot API](https://core.telegram.org/bots/api)
