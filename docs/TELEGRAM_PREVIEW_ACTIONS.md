# Telegram Preview через GitHub Actions

Этот workflow создаёт отдельный Vercel Preview для каждого pull request в `main`, проверяет `GET /api/health` и после успешной проверки отправляет в основной Mentalix-бот Telegram-сообщение с кнопкой **«Открыть Preview»**. Production-домен, backend и основной Vercel project не изменяются.

## Как это работает

Vercel Git Integration запускает deployment для каждого push и PR в подключённом репозитории. После успешного Preview Vercel отправляет `repository_dispatch` в GitHub, а workflow проверяет `https://<preview>/api/health` и только затем вызывает Telegram Bot API. Если deployment или health-check завершается ошибкой, сообщение с Preview не отправляется. GitHub Actions не выполняет Vercel CLI: деплой полностью выполняет сама Vercel Git Integration.

Workflow реагирует только на успешное событие `vercel.deployment.success` и ручной `workflow_dispatch` с URL. Preview создаётся подключённой Vercel Git Integration; PR из fork не получает доступ к Telegram-секретам. Одновременно для одного deployment выполняется только последний запуск; старый запуск отменяется.

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

Основной способ отправить Preview — открыть GitHub Actions → **Telegram Preview** → **Run workflow** или открыть PR и дождаться автоматического события от Vercel. В ручной форме укажите готовый Vercel Preview URL в поле `Vercel Preview URL to verify and notify`. Workflow проверит deployment и `/api/health`, затем отправит в Telegram кнопку **«Открыть Preview»**.

Не запускайте одновременно локальный PowerShell-сценарий и GitHub workflow для одного deployment: это может создать дублирующие сообщения и конкурирующие cleanup-действия.

## Ручной запуск с телефона

После того как workflow попадёт в `main`, для ручной проверки откройте **Actions → Telegram Preview → Run workflow**. Вставьте готовый Vercel Preview URL в поле `Vercel Preview URL to verify and notify` и нажмите **Run workflow**. В обычном сценарии ручной запуск не нужен: Vercel сам отправляет событие после успешного deployment.

## Проверка Preview

После настройки достаточно отправить feature-ветку в GitHub или открыть PR. Vercel создаст Preview самостоятельно, затем workflow **Telegram Preview** проверит deployment и отправит в Telegram кнопку **«Открыть Preview»**. Preview предназначен для ручной проверки интерфейса на телефоне.

Для MXL-021 после открытия Preview нужно проверить Journey → `Продолжить сегодня` → Today, затем пройти ручной Telegram/iPhone gate. GitHub Actions может проверить сборку и health endpoint, но не заменяет визуальную проверку на реальном iPhone.

## Проверка внешнего backend

Основной CI дополнительно проверяет `https://mentalix-bot.onrender.com/api/health`. Ожидаемый ответ — HTTP 200 и JSON `{"status":"ok"}`. Проверка повторяется несколько раз, чтобы учитывать пробуждение Render Free после периода простоя.

Результаты merge и автоматических проверок фиксируются в [`PROJECT_STATE.md`](../PROJECT_STATE.md). Продуктовый статус и ручной iPhone/Telegram gate подтверждаются владельцем в Pull Request.

## Локальный fallback (Windows/PowerShell)

Локальный сценарий не является основным production-процессом. Используйте его только на машине с PowerShell и настроенным `.env.local`, если GitHub Actions или Vercel временно недоступны:

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
