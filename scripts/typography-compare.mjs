import fs from 'node:fs'
import path from 'node:path'

/*
 * MXL-TYPE-READABLE-001 — отчёт «до/после» по фактическим (computed) размерам.
 *
 * Читает evidence, собранный tests/ux/typography-readable-scale.spec.mjs в фазах
 * before и after (qa-evidence/typography-readable/<phase>/measure-<viewport>.json),
 * и печатает таблицу ролей: цель, значение до, значение после, изменение.
 *
 * Запуск: node scripts/typography-compare.mjs [--check]
 *   без флага — печатает отчёт и пишет qa-evidence/typography-readable/REPORT.md;
 *   --check  — дополнительно падает, если в after роль не совпадает с целью
 *              или состояние есть в after, но отсутствует в baseline.
 */

const ROOT = path.join('qa-evidence', 'typography-readable')
const VIEWPORTS = ['393x852', '360x640']

/* Смысловые роли шкалы: имя роли → целевой computed-размер. */
const ROLE_TARGETS = {
  ask: 24,
  read: 16,
  note: 14,
  caption: 13,
  action: 16,
}

const LABELS = {
  today: 'Сегодня',
  checkinMorning: 'Чек-ин (утро)',
  checkinEvening: 'Разбор дня (вечер)',
  completeMorning: 'Финал утра (превью)',
  completeEvening: 'Финал вечера (превью)',
  journal: 'Дневник',
}

const STAGE_LABELS = {
  questionStep: 'вопрос',
  focusStep: 'фокус дня',
  emotionStep: 'эмоции',
  editorStep: 'поле записи',
  completion: 'финал',
  setup: 'настройка',
  review: 'ревью цели',
  stream: 'поток',
  question: 'вопрос дня',
  complete: 'финал записи',
  today: 'запись за сегодня',
  entries: 'мои записи',
}

function readPhase(phase, viewport) {
  const file = path.join(ROOT, phase, `measure-${viewport}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/* Разворачивает report в плоскую карту: путь состояния → карта ролей. */
function roleMap(report) {
  const out = new Map()
  const add = (key, roles) => {
    if (roles) out.set(key, roles)
  }

  add('today', report.today?.roles)

  for (const surface of ['checkinMorning', 'checkinEvening']) {
    const block = report[surface]
    if (!block) continue
    for (const stage of ['questionStep', 'focusStep', 'emotionStep', 'editorStep']) {
      add(`${surface}.${stage}`, block[stage])
    }
    add(`${surface}.completion`, block.completion?.roles)
  }

  add('completeMorning', report.completeMorning?.roles)
  add('completeEvening', report.completeEvening?.roles)

  for (const [stage, value] of Object.entries(report.journal || {})) {
    add(`journal.${stage}`, value?.roles)
  }

  return out
}

/* Полная таблица фактических размеров — для сводки изменений. */
function inventoryMap(report) {
  const out = new Map()
  const add = (key, inv) => {
    for (const row of inv || []) out.set(`${key}|${row.sel}|${row.text}`, row.size)
  }

  add('today', report.today?.inventory)

  for (const surface of ['checkinMorning', 'checkinEvening']) {
    const block = report[surface]
    if (!block) continue
    for (const step of block.steps || []) add(`${surface}.s${step.index}`, step.inventory)
    add(`${surface}.completion`, block.completion?.inventory)
  }

  add('completeMorning', report.completeMorning?.inventory)
  add('completeEvening', report.completeEvening?.inventory)

  for (const [stage, value] of Object.entries(report.journal || {})) {
    add(`journal.${stage}`, value?.inventory)
  }

  return out
}

function roleRows(before, after) {
  const rows = []
  const beforeMap = roleMap(before)
  const afterMap = roleMap(after)

  for (const [stateKey, roles] of afterMap) {
    const surface = stateKey.split('.')[0]
    const stageName = stateKey.split('.').slice(1).join('.')
    const stageLabel = STAGE_LABELS[stageName] || stageName
    const beforeRoles = beforeMap.get(stateKey)

    for (const [roleName, reading] of Object.entries(roles)) {
      if (!reading) continue
      // Шаги чек-ина хранят рядом с ролями служебные поля (overflow) — это не роли,
      // и в таблицу «до/после» они попадать не должны.
      if (!reading.role) continue
      const target = ROLE_TARGETS[reading.role] ?? null
      const beforeReading = beforeRoles?.[roleName] || null
      const beforeSize = beforeReading?.size ?? null
      const delta = beforeSize === null ? null : Math.round((reading.size - beforeSize) * 100) / 100
      const ok = target === null ? null : Math.abs(reading.size - target) < 0.05
      const missingInBaseline = beforeSize === null

      rows.push({
        surface: LABELS[surface] || surface,
        stage: stageLabel,
        role: `${roleName} (${reading.role})`,
        target,
        before: beforeSize,
        after: reading.size,
        lh: reading.lh,
        delta,
        ok,
        missingInBaseline,
        text: reading.text,
      })
    }
  }

  return rows
}

function inventoryDiff(before, after) {
  const a = inventoryMap(before)
  const b = inventoryMap(after)
  const changed = []
  for (const [key, valueAfter] of b) {
    if (!a.has(key)) continue
    const valueBefore = a.get(key)
    if (Math.abs(valueBefore - valueAfter) < 0.01) continue
    changed.push({ key, before: valueBefore, after: valueAfter, delta: Math.round((valueAfter - valueBefore) * 100) / 100 })
  }
  changed.sort((x, y) => x.delta - y.delta)

  return { changed, total: b.size, comparable: [...b.keys()].filter(key => a.has(key)).length }
}

function fmt(value) {
  return value === null || value === undefined ? '—' : String(value)
}

function signed(delta) {
  if (delta === null) return '—'
  return `${delta > 0 ? '+' : ''}${delta}`
}

function main() {
  const check = process.argv.includes('--check')
  const before = readPhase('before', VIEWPORTS[0])
  const after = readPhase('after', VIEWPORTS[0])

  if (!before || !after) {
    console.error(
      `Нужны обе фазы evidence: before=${Boolean(before)}, after=${Boolean(after)}. ` +
        'Сначала прогоните MX_TYPE_PHASE=before и MX_TYPE_PHASE=after.'
    )
    process.exit(2)
  }

  const lines = []
  const problems = []
  let increases = 0
  let decreases = 0

  console.log(`\nMXL-TYPE-READABLE-001 — фактические размеры (${VIEWPORTS[0]})\n`)
  lines.push('# MXL-TYPE-READABLE-001 — фактические размеры и сравнение до/после', '')
  lines.push(
    `Viewport: ${VIEWPORTS.join(', ')}. Значения — computed font-size в px.`,
    'Фаза `before` — код до шкалы, `after` — с новой шкалой; состояния и измерения одинаковые.',
    ''
  )

  for (const viewport of VIEWPORTS) {
    const beforePhase = readPhase('before', viewport)
    const afterPhase = readPhase('after', viewport)
    if (!beforePhase || !afterPhase) continue

    const rows = roleRows(beforePhase, afterPhase)
    const header = `| Поверхность | Состояние | Роль | Цель | before | after | Δ | Итог |`
    const divider = `| --- | --- | --- | --- | --- | --- | --- | --- |`

    console.log(`── ${viewport} ──`)
    lines.push(`## ${viewport}`, '', header, divider)

    for (const row of rows) {
      const verdict = row.ok === null ? 'вне шкалы' : row.ok ? '✔' : '✘ цель не достигнута'
      if (row.delta !== null && row.delta > 0) increases += 1
      if (row.delta !== null && row.delta < 0) decreases += 1
      if (row.missingInBaseline) problems.push(`${viewport}: ${row.surface}/${row.stage}/${row.role} нет в baseline`)
      if (check && row.ok === false) problems.push(`${viewport}: ${row.surface}/${row.stage}/${row.role} = ${row.after} (цель ${row.target})`)

      const line = `| ${row.surface} | ${row.stage} | ${row.role} | ${fmt(row.target)} | ${fmt(row.before)} | ${fmt(row.after)} | ${signed(row.delta)} | ${verdict} |`
      lines.push(line)
      console.log(
        `${(row.surface + ' / ' + row.stage).padEnd(34)} ${row.role.padEnd(22)} цель ${fmt(row.target).padStart(4)}  ${fmt(row.before).padStart(6)} → ${fmt(row.after).padStart(6)}  ${signed(row.delta).padStart(6)}  ${verdict}`
      )
    }
    lines.push('')

    const diff = inventoryDiff(beforePhase, afterPhase)
    const down = diff.changed.filter(row => row.delta < 0)
    const up = diff.changed.filter(row => row.delta > 0)
    console.log(
      `${viewport}: изменено ${diff.changed.length} из ${diff.comparable} сопоставимых элементов ` +
        `(уменьшилось ${down.length}, увеличилось ${up.length})`
    )
    lines.push(
      `**Итог по инвентарю ${viewport}:** изменено ${diff.changed.length} из ${diff.comparable} сопоставимых элементов, ` +
        `уменьшилось ${down.length}, увеличилось ${up.length}.`,
      ''
    )
    if (down.length) {
      lines.push('<details><summary>Уменьшения</summary>', '')
      lines.push('| Элемент | before | after | Δ |', '| --- | --- | --- | --- |')
      for (const row of down) {
        lines.push(`| \`${row.key.replace(/\|/g, ' / ')}\` | ${row.before} | ${row.after} | ${signed(row.delta)} |`)
      }
      lines.push('', '</details>', '')
    }
    if (up.length) {
      lines.push('<details><summary>Увеличения</summary>', '')
      lines.push('| Элемент | before | after | Δ |', '| --- | --- | --- | --- |')
      for (const row of up) {
        lines.push(`| \`${row.key.replace(/\|/g, ' / ')}\` | ${row.before} | ${row.after} | ${signed(row.delta)} |`)
      }
      lines.push('', '</details>', '')
    }
  }

  // Паритет состояний: baseline обязан покрывать те же состояния, что и after.
  for (const viewport of VIEWPORTS) {
    const beforeKeys = new Set(roleMap(readPhase('before', viewport) || {}).keys())
    const afterKeys = new Set(roleMap(readPhase('after', viewport) || {}).keys())
    const missing = [...afterKeys].filter(key => !beforeKeys.has(key))
    if (missing.length) problems.push(`${viewport}: в baseline нет состояний ${missing.join(', ')}`)
  }

  console.log(`\nВсего: уменьшилось ${decreases}, увеличилось ${increases}`)
  lines.push(`## Сводка`, '', `- Ролей с уменьшением: ${decreases}.`, `- Ролей с увеличением: ${increases}.`, '')

  if (problems.length) {
    console.log(`\nЗамечания (${problems.length}):`)
    for (const problem of problems) console.log(`  - ${problem}`)
    lines.push('## Замечания', '', ...problems.map(problem => `- ${problem}`), '')
  }

  fs.writeFileSync(path.join(ROOT, 'REPORT.md'), lines.join('\n'))
  console.log(`\nОтчёт: ${path.join(ROOT, 'REPORT.md')}`)

  if (check && problems.length) process.exit(1)
}

main()
