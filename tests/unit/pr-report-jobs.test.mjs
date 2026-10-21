// Отчёты PR (informational): размеры чанков и скриншоты экранов.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SCRIPT = 'scripts/bundle-size-report.mjs'
// Отчёты PR (informational) вынесены из ci.yml в отдельный workflow ручного
// запуска (issue #1111, этап 2), поэтому job'ы ищем в обоих файлах.
const workflowSources = [
  readFileSync('.github/workflows/ci.yml', 'utf8'),
  readFileSync('.github/workflows/informational-checks.yml', 'utf8'),
]

function job(name) {
  for (const source of workflowSources) {
    const start = source.indexOf(`\n  ${name}:\n`)
    if (start === -1) continue
    const next = source.slice(start + 1).search(/\n {2}[a-z0-9-]+:\n/)
    return next === -1 ? source.slice(start) : source.slice(start, start + 1 + next)
  }
  assert.fail(`job ${name} не найден`)
}

function dist(files) {
  const dir = mkdtempSync(join(tmpdir(), 'mx-dist-'))
  mkdirSync(join(dir, 'assets'))
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, 'assets', name), body)
  return dir
}

function report(current, base) {
  return execFileSync('node', [SCRIPT, current, base], { encoding: 'utf8' })
}

test('bundle-size-report: пустая сборка PR — предупреждение, а не «всё удалено»', () => {
  const base = dist({ 'index-AAA.js': 'x'.repeat(2048) })
  const out = report(join(tmpdir(), 'mx-missing-dist'), base)
  assert.match(out, /Отчёт не построен/)
  assert.doesNotMatch(out, /~~index-AAA\.js~~/)
})

test('bundle-size-report: обычное сравнение показывает чанк и дельту', () => {
  const base = dist({ 'index-AAA.js': 'x'.repeat(1024) })
  const current = dist({ 'index-BBB.js': 'x'.repeat(2048) })
  const out = report(current, base)
  assert.match(out, /\| index-BBB\.js \| JS \| 2\.00 kB \|/)
  assert.match(out, /\+1\.00 \(\+100\.0%\)/)
})

test('bundle-size-report: JS и CSS с одним именем и одноимённые чанки не путаются', () => {
  const files = {
    'UiLab-AAA.js': 'j'.repeat(3072),
    'UiLab-BBB.css': 'c'.repeat(1024),
    'index-CCC.js': 'i'.repeat(2048),
    'index-DDD.js': 'k'.repeat(512),
  }
  const out = report(dist(files), dist(files))
  for (const name of Object.keys(files)) {
    const row = out.split('\n').find(line => line.startsWith(`| ${name} |`))
    assert.ok(row, name)
    assert.match(row, /\| ±0 \| ±0 \|$/, row)
  }
  assert.doesNotMatch(out, /~~/)
})

test('ci: скрипт копируется до checkout main и запускается из $RUNNER_TEMP', () => {
  const bundle = job('bundle-size-report')
  assert.doesNotMatch(bundle, /git clean[^\n]*dist-pr/)
  assert.match(bundle, /mv dist "\$RUNNER_TEMP\/dist-pr"/)
  // Скрипт копируется в $RUNNER_TEMP до checkout main — иначе main его затрёт
  const cpIdx = bundle.indexOf('cp scripts/bundle-size-report.mjs "$RUNNER_TEMP/bundle-size-report.mjs"')
  const checkoutIdx = bundle.indexOf('git checkout origin/main')
  assert.ok(cpIdx !== -1, 'cp скрипта в $RUNNER_TEMP не найден')
  assert.ok(checkoutIdx !== -1, 'checkout main не найден')
  assert.ok(cpIdx < checkoutIdx, 'скрипт должен копироваться до checkout main')
  // Запуск из $RUNNER_TEMP, а не из рабочей папки (где main затёр файлы)
  assert.match(bundle, /node "\$RUNNER_TEMP\/bundle-size-report\.mjs" "\$RUNNER_TEMP\/dist-pr" dist/)
})

test('ci: PR-скриншоты собираются с демо-режимом', () => {
  assert.match(job('pr-screenshots'), /run: VITE_LOCAL_PREVIEW=true npm run build/)
})

// Безопасность informational-checks: workflow может проверять код произвольного
// PR (refs/pull/<N>/head) и выполняет на нём npm-команды, поэтому write-прав у
// токена быть не должно, а отчёты идут в артефакты и Summary, а не в комментарии.
test('informational-checks: только чтение — без write-прав и комментариев из кода PR', () => {
  const workflow = readFileSync('.github/workflows/informational-checks.yml', 'utf8')
  const start = workflow.indexOf('\npermissions:\n')
  const end = workflow.indexOf('\nconcurrency:')
  assert.ok(start !== -1 && end > start, 'блок permissions не найден')
  const permissions = workflow.slice(start, end)
  assert.match(permissions, /contents: read/)
  assert.match(permissions, /actions: read/)
  assert.doesNotMatch(permissions, /write/)
  // Комментарии в PR требовали pull-requests: write — их больше нет.
  assert.doesNotMatch(workflow, /pull-requests:\s*write/)
  assert.doesNotMatch(workflow, /github-script/)
  // Токен не остаётся в .git/config для npm-команд на коде PR.
  assert.match(workflow, /persist-credentials: false/)
  // Код сторонних fork-PR не запускается: job guard допускает только PR из
  // этого репозитория (read-only токен тоже имеет доступ к данным приватного).
  assert.match(workflow, /pull-requests: read/)
  assert.match(workflow, /\n  guard:\n/)
  assert.match(workflow, /head\.repo\.full_name/)
  for (const name of ['ux-visual', 'ux-visual-progress', 'qa-crawl', 'bundle-size-report', 'pr-screenshots'])
    assert.match(job(name), /needs: guard/, `${name} должен зависеть от guard`)
})

test('pr-screens: сценарии не ссылаются на удалённые элементы', () => {
  const screens = readFileSync('tests/visual/pr-screens.mjs', 'utf8')
  for (const gone of ['today-thoughts', 'progress-hero-journey', 'hero-step-0', 'tab=progress'])
    assert.ok(!screens.includes(`'${gone}'`) && !screens.includes(`${gone}'`), gone)
  assert.match(screens, /tab=library&action=hero_journey/)
  assert.match(screens, /tab=trends/)
})
