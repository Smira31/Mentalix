# Cloudflare Owner QA

Workflow `Cloudflare Owner QA` запускается только вручную через `workflow_dispatch` и принимает полный `commit_sha`. Он checkout-ит именно этот SHA, выполняет `npm ci`, `npm run check:core`, `npm run build`, добавляет `dist/qa-build.json` и `dist/_headers`, а затем публикует Direct Upload в Cloudflare Pages project `mentalix-owner-qa` через официальный `cloudflare/wrangler-action@v4`.

Workflow использует только GitHub Environment `cloudflare-owner-qa`. Значения `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID` читаются исключительно из secrets этого Environment. После публикации workflow проверяет `qa-build.json` на стабильном и immutable URL, заголовок `X-Robots-Tag: noindex, nofollow`, deployment ID и точное совпадение опубликованного SHA с requested SHA.

Cloudflare Owner QA — это **не Production** и не механизм Vercel. Он не изменяет `https://mentalix.vercel.app` или `https://mentalix-preview.vercel.app`. Cloudflare Owner QA также не заменяет ручной Owner PASS на реальном iPhone внутри Telegram: safe-area, WebView, клавиатура, fullscreen и жесты должны быть проверены отдельно.

## Ручной запуск

В GitHub откройте **Actions → Cloudflare Owner QA → Run workflow**, выберите Environment `cloudflare-owner-qa` и передайте полный 40-символьный SHA. Workflow не запускается на `push`, `pull_request`, `schedule` или других автоматических событиях. Deployment и merge не выполняются автоматически при изменении репозитория.

После успешного запуска используйте stable и immutable URL только для проверки exact-SHA provenance. До Owner PASS результат не считается подтверждением готовности продукта к релизу.
