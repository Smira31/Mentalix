# Telegram Preview через GitHub Actions

Этот workflow создаёт отдельный Vercel Preview для каждого pull request в `main`, проверяет `GET /api/health` и после успешной проверки отправляет в основной Mentalix-бот Telegram-сообщение с кнопкой **«Открыть Preview»**. Production-домен, backend и основной Vercel project не изменяются.

## Как это работает

Workflow запускается при открытии PR, повторном открытии PR и каждом новом push в его feature-ветку. Он устанавливает зависимости, выполняет `npm run lint`, собирает приложение через `npm run build`, создаёт deployment в проекте `mentalix-preview`, проверяет `https://<preview>/api/health` и только затем вызывает Telegram Bot API. Если любой шаг до уведомления завершается ошибкой, сообщение с Preview не отправляется.

Workflow намеренно работает только для PR из веток внутри `Smira31/Mentalix`. PR из fork не получает доступ к секретам. Одновременно для одного PR выполняется только последний запуск; старый запуск отменяется.

## Одноразовая настройка через GitHub на телефоне

Откройте репозиторий `Smira31/Mentalix` в браузере телефона. В приложении GitHub раздел Settings иногда спрятан за меню с тремя точками; если его нет в приложении, используйте браузерную версию GitHub.

Перейдите в **Settings → Secrets and variables → Actions → New repository secret**. Создайте следующие три repository secrets:

| Secret                     | Что положить                                                             | Где получить                                                    |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `VERCEL_TOKEN`             | Personal access token Vercel с правом deploy в проект `mentalix-preview` | Vercel Dashboard → Account Settings → Tokens                    |
| `TELEGRAM_MAIN_BOT_TOKEN`  | Токен основного Mentalix-бота                                            | Сохранённое значение владельца бота / BotFather                 |
| `TELEGRAM_PREVIEW_CHAT_ID` | ID личного чата или группы, куда бот отправляет Preview                  | Существующая настройка Preview workflow или проверенный chat ID |

Значения вводятся непосредственно в GitHub и после сохранения больше не отображаются. **Не присылайте токены в issue, PR, чат или commit и не добавляйте их в `.env`-файлы, которые могут попасть в Git.**

`VERCEL_SCOPE` и `VERCEL_PROJECT` уже зафиксированы в workflow как непубличные параметры маршрутизации deployment: `smiraandre2-8311s-projects` и `mentalix-preview`. Если Vercel-проект будет переименован или перенесён, workflow нужно обновить отдельным PR.

## Ежедневный сценарий

После настройки вам не нужно запускать PowerShell, Vercel CLI или Telegram-команду. Достаточно отправить feature-ветку в GitHub или открыть PR. В приложении GitHub откройте PR и дождитесь зелёного workflow **Telegram Preview**. Затем откройте Telegram: бот пришлёт кнопку **«Открыть Preview»**. Preview считается временным и предназначен для ручной проверки интерфейса на телефоне.

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
