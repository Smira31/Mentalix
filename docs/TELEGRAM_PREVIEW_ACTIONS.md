# Telegram Preview через GitHub Actions

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

Проект `mentalix-preview` подключён к `Smira31/Mentalix` через Vercel Git Integration. Vercel самостоятельно создаёт Preview, поэтому в GitHub нужно хранить только Telegram-секреты, перечисленные выше.

## Основной ежедневный сценарий

Основной способ отправить Preview — открыть GitHub Actions → **Telegram Preview** → **Run workflow**. В ручной форме укажите готовый Vercel Preview URL, branch, commit SHA и metadata PR. Для PR #490 используйте title `Today` и route `Today`; для PR #494 — `Practices`, `ui_lab_route=experiments`, `experiment_label=UI Lab / Practices`; для PR #496 — `Evening Review`, `ui_lab_route=experiments`, `experiment_label=UI Lab / Evening Review`. Workflow проверит существующий URL и отправит ровно одну кнопку с точным route.

Не запускайте одновременно локальный PowerShell-сценарий и GitHub workflow для одного deployment: это может создать дублирующие сообщения и конкурирующие cleanup-действия.

## Ручной запуск с телефона

После того как workflow попадёт в `main`, откройте **Actions → Telegram Preview → Run workflow**. Вставьте готовый Vercel Preview URL и заполните metadata. Нажмите **Run workflow** только после local → CI → review и явного разрешения на manual iPhone/Telegram gate. Этот запуск не создаёт новый Vercel deployment.

## Проверка Preview

После настройки Vercel Preview создаётся обычным подключённым процессом. Затем workflow **Telegram Preview** запускается вручную с уже существующим URL, проверяет health и отправляет одну кнопку. Preview предназначен для ручной проверки интерфейса на телефоне.

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
