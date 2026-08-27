# Telegram Preview через GitHub Actions

Этот workflow создаёт отдельный Vercel Preview для каждого pull request в `main`, проверяет `GET /api/health` и после успешной проверки отправляет в основной Mentalix-бот Telegram-сообщение с кнопкой **«Открыть Preview»**. Production-домен, backend и основной Vercel project не изменяются.

## Как это работает

Vercel Git Integration запускает deployment для каждого push и PR в подключённом репозитории. После успешного Preview Vercel отправляет `repository_dispatch` в GitHub, а workflow проверяет `https://<preview>/api/health` и только затем вызывает Telegram Bot API. Если deployment или health-check завершается ошибкой, сообщение с Preview не отправляется. GitHub Actions больше не выполняет Vercel CLI и не требует `VERCEL_TOKEN`.

Workflow реагирует только на успешное событие `vercel.deployment.success` и ручной `workflow_dispatch` с URL. Preview создаётся подключённой Vercel Git Integration; PR из fork не получает доступ к Telegram-секретам. Одновременно для одного deployment выполняется только последний запуск; старый запуск отменяется.

## Одноразовая настройка через GitHub на телефоне

Откройте репозиторий `Smira31/Mentalix` в браузере телефона. В приложении GitHub раздел Settings иногда спрятан за меню с тремя точками; если его нет в приложении, используйте браузерную версию GitHub.

Перейдите в **Settings → Secrets and variables → Actions → New repository secret**. Создайте следующие три repository secrets:

| Secret                     | Что положить                                                             | Где получить                                                    |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `VERCEL_TOKEN`             | Personal access token Vercel с правом deploy в проект `mentalix-preview` | Vercel Dashboard → Account Settings → Tokens                    |
| `TELEGRAM_MAIN_BOT_TOKEN`  | Токен основного Mentalix-бота                                            | Сохранённое значение владельца бота / BotFather                 |
| `TELEGRAM_PREVIEW_CHAT_ID` | ID личного чата или группы, куда бот отправляет Preview                  | Существующая настройка Preview workflow или проверенный chat ID |

Значения вводятся непосредственно в GitHub и после сохранения больше не отображаются. **Не присылайте токены в issue, PR, чат или commit и не добавляйте их в `.env`-файлы, которые могут попасть в Git.**

Проект `mentalix-preview` подключён к `Smira31/Mentalix` через Vercel Git Integration. Поэтому `VERCEL_TOKEN`, `VERCEL_SCOPE` и `VERCEL_PROJECT` больше не нужны в GitHub Secrets или workflow. Если проект будет отключён от GitHub или перенесён в другой team, сначала восстановите подключение в Vercel Project Settings → Git.

## Ручной запуск с телефона

После того как workflow попадёт в `main`, для ручной проверки откройте **Actions → Telegram Preview → Run workflow**. Вставьте готовый Vercel Preview URL в поле `Vercel Preview URL to verify and notify` и нажмите **Run workflow**. В обычном сценарии ручной запуск не нужен: Vercel сам отправляет событие после успешного deployment.

## Ежедневный сценарий

После настройки вам не нужно запускать PowerShell, Vercel CLI или Telegram-команду. Достаточно отправить feature-ветку в GitHub или открыть PR. Vercel создаст Preview самостоятельно, затем workflow **Telegram Preview** проверит deployment и отправит в Telegram кнопку **«Открыть Preview»**. Preview предназначен для ручной проверки интерфейса на телефоне.

Для MXL-021 после открытия Preview нужно проверить Journey → `Продолжить сегодня` → Today, затем пройти ручной Telegram/iPhone gate. GitHub Actions может проверить сборку и health endpoint, но не заменяет визуальную проверку на реальном iPhone.

## Локальный fallback

Существующий локальный сценарий остаётся доступным на машине с PowerShell и настроенным `.env.local`:

```bash
npm run preview
```

Он выполняет похожую последовательность и отправляет сообщение в Telegram после успешного health-check. Для остановки локального Preview используется:

```bash
npm run preview:stop
```

## References

- [GitHub Actions secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions)
- [Vercel deploy CLI](https://vercel.com/docs/cli/deploy)
- [Telegram Bot API](https://core.telegram.org/bots/api)
