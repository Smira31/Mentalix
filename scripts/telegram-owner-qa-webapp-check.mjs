import { readFile } from 'node:fs/promises'

const workflow = await readFile(
  new URL('../.github/workflows/telegram-owner-qa-webapp.yml', import.meta.url),
  'utf8'
)
const required = [
  'workflow_dispatch:',
  'commit_sha:',
  'https://mentalix-owner-qa.pages.dev/?ui_lab=library-programs&review=1',
  'OWNER_QA_BASE_URL: https://mentalix-owner-qa.pages.dev',
  '"$OWNER_QA_BASE_URL/qa-build.json"',
  'web_app:',
  'Открыть Owner QA',
  'Открыть Owner QA в браузере',
  'TELEGRAM_PRODUCTION_BOT_TOKEN',
  'TELEGRAM_PREVIEW_CHAT_ID',
  "'Payload: web_app — отклонён текущим типом чата'",
]
for (const text of required) {
  if (!workflow.includes(text)) throw new Error(`workflow contract missing: ${text}`)
}
for (const forbidden of [
  'repository_dispatch:',
  'pull_request:',
  'push:',
  'mentalix.vercel.app',
  'mentalix-preview.vercel.app',
]) {
  if (workflow.includes(forbidden)) throw new Error(`forbidden trigger/host present: ${forbidden}`)
}
if (!workflow.includes('^[0-9]+:[A-Za-z0-9_-]+$'))
  throw new Error('Telegram token format guard missing')
if (!workflow.includes('^[0-9a-fA-F]{40}$')) throw new Error('exact SHA guard missing')
if (
  !workflow.includes(
    'reply_markup: {inline_keyboard: [[{text: "Открыть Owner QA", web_app: {url: $url}}]]}'
  )
)
  throw new Error('web_app JSON payload contract missing')
if (
  !workflow.includes(
    'reply_markup: {inline_keyboard: [[{text: "Открыть Owner QA в браузере", url: $url}]]}'
  )
)
  throw new Error('URL fallback JSON payload contract missing')
console.log('Owner QA Telegram Web App workflow contract passed')
