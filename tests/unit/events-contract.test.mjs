import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

/*
 * Контракт POST /api/events (mentalix-bot, backend/events.py, Issue #1161):
 * event_type — только значения закрытого перечня (Literal в Pydantic),
 * entity_type — строка или null, entity_id — целое число или null.
 * Любое другое значение сервер отклоняет с 422, и событие теряется.
 *
 * Тест статически читает исходники фронтенда: каждый event_type, который
 * уходит в api.events.log (напрямую или через logEngagementEvent), обязан
 * входить в перечень. Новый тип события появляется только вместе с правкой
 * бэкенда, а не из фронтенда.
 *
 * События вовлечённости (PR #1162 удалил вызовы, задача — вернуть их):
 * контекст события живёт в entity_type по шаблону `группа[:значение]`,
 * а entity_id всегда null — там не должно быть ни строки, ни id пользователя.
 */
const BASE_EVENT_TYPES = [
  'ritual_complete',
  'asceza_complete',
  'checkin_morning_start',
  'checkin_morning_complete',
  'checkin_evening_start',
  'checkin_evening_complete',
  'reminder_disabled',
]

/*
 * Шаблон entity_type для событий вовлечённости.
 * exact — точная строка; prefix — статический префикс + подстановка
 * (slug значка, календарная дата); values — допустимые значения хвоста.
 */
const ENGAGEMENT_ENTITY_TYPES = {
  teaser_shown: { prefix: 'teaser:', values: ['morning', 'evening'] },
  badge_earned: { prefix: 'badge:' },
  streak_freeze_seen: { exact: 'streak_freeze' },
  streak_recovery_shown: { exact: 'streak_recovery' },
  streak_recovery_started: { exact: 'streak_recovery' },
  streak_recovery_dismissed: { exact: 'streak_recovery' },
  surprise_insight_shown: { exact: 'surprise_insight' },
  surprise_insight_opened: { exact: 'surprise_insight' },
  mood_practice_start: { exact: 'mood_practice' },
  guest_save_reminder_shown: { exact: 'guest_save_reminder' },
  guest_save_reminder_clicked: { exact: 'guest_save_reminder' },
}

const ALLOWED_EVENT_TYPES = [...BASE_EVENT_TYPES, ...Object.keys(ENGAGEMENT_ENTITY_TYPES)]

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
// Корень исходников можно переопределить, чтобы прогнать тест на другой ревизии.
const sourceRoot = process.env.EVENTS_CONTRACT_SRC
  ? path.resolve(process.env.EVENTS_CONTRACT_SRC)
  : path.join(repoRoot, 'src')

function sourceFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(full))
    else if (/\.(js|jsx|mjs)$/.test(entry.name)) files.push(full)
  }
  return files.sort()
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length
}

// Текст внутри парных скобок: вложенность учитывается, строковые литералы — нет.
function balancedText(source, openIndex) {
  const open = source[openIndex]
  const close = open === '(' ? ')' : open === '{' ? '}' : ']'
  let depth = 0
  let quote = null
  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i]
    if (quote) {
      if (char === '\\') i += 1
      else if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === open) depth += 1
    else if (char === close) {
      depth -= 1
      if (depth === 0) return { text: source.slice(openIndex + 1, i), end: i }
    }
  }
  throw new Error(`не закрыта скобка «${open}» с позиции ${openIndex}`)
}

function splitTopLevel(text) {
  const parts = []
  let depth = 0
  let quote = null
  let current = ''
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quote) {
      current += char
      if (char === '\\') {
        current += text[i + 1] ?? ''
        i += 1
      } else if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      current += char
      continue
    }
    if ('([{'.includes(char)) depth += 1
    if (')]}'.includes(char)) depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function splitProperty(property) {
  let depth = 0
  let quote = null
  for (let i = 0; i < property.length; i += 1) {
    const char = property[i]
    if (quote) {
      if (char === '\\') i += 1
      else if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if ('([{'.includes(char)) depth += 1
    else if (')]}'.includes(char)) depth -= 1
    else if (char === ':' && depth === 0) {
      return { key: property.slice(0, i).trim(), value: property.slice(i + 1).trim() }
    }
  }
  return { key: property.trim(), value: '' }
}

const STRING_LITERAL = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g
// Литералы-операнды сравнений (`status === 'done' ? …`) не являются event_type.
const COMPARISON_LITERAL = /(?:[=!]==?|[<>]=?)\s*(?:'[^']*'|"[^"]*")|(?:'[^']*'|"[^"]*")\s*(?:[=!]==?|[<>]=?)/g
const TEMPLATE_SUBSTITUTION = /\$\{([\s\S]*?)\}/g
// Подстановка в entity_type: путь к полю (`newBadge.id`, `date`) либо
// тернарный выбор из литералов (`isEvening ? 'evening' : 'morning'`).
const SAFE_SUBSTITUTION =
  /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$|^[A-Za-z_$][\w$]*\s*\?\s*(['"])[^'"]*\1\s*:\s*(['"])[^'"]*\2$/
// Данные человека в контекст события не попадают.
const FORBIDDEN_CONTEXT = /\b(user|userId|user_id|username|text|answer|note|mood|emotion|message|chat|content|title|body|name|email)\b/i

function literalsIn(expression) {
  return [...expression.matchAll(STRING_LITERAL)].map(match => match[0].slice(1, -1))
}

// Значения, которые реально уходят в событие: без литералов-операндов условий.
function valueLiterals(expression) {
  return literalsIn(expression.replace(COMPARISON_LITERAL, ''))
}

// Прямые вызовы api.events.log(userId, eventType, entityType, entityId).
function directSites(file, source) {
  const sites = []
  const pattern = /api\.events\s*\.\s*log\s*\(/g
  let match
  while ((match = pattern.exec(source))) {
    const call = balancedText(source, match.index + match[0].length - 1)
    const args = splitTopLevel(call.text)
    sites.push({
      where: `${path.relative(repoRoot, file)}:${lineAt(source, match.index)}`,
      eventTypeExpression: args[1] ?? '',
      entityTypeExpression: args[2] ?? '',
      entityIdExpression: args[3] ?? 'null',
    })
    pattern.lastIndex = call.end
  }
  return sites
}

// Вызовы logEngagementEvent({ event, entityType, entityId, send: api.events.log }).
function engagementSites(file, source) {
  const sites = []
  const pattern = /logEngagementEvent\s*\(\s*\{/g
  let match
  while ((match = pattern.exec(source))) {
    // Определение самого хелпера — не отправка события.
    if (/function\s+$/.test(source.slice(Math.max(0, match.index - 40), match.index))) {
      pattern.lastIndex = match.index + match[0].length
      continue
    }
    const object = balancedText(source, match.index + match[0].length - 1)
    const fields = new Map(
      splitTopLevel(object.text)
        .map(splitProperty)
        .map(({ key, value }) => [key, value])
    )
    sites.push({
      where: `${path.relative(repoRoot, file)}:${lineAt(source, match.index)}`,
      eventTypeExpression: fields.get('event') ?? '',
      entityTypeExpression: fields.get('entityType') ?? '',
      entityIdExpression: fields.get('entityId') ?? 'null',
    })
    pattern.lastIndex = object.end
  }
  return sites
}

function collectSites() {
  return sourceFiles(sourceRoot).flatMap(file => {
    const source = readFileSync(file, 'utf8')
    return [...directSites(file, source), ...engagementSites(file, source)]
  })
}

// entity_type: статический текст и подстановки шаблонной строки.
function entityTypeShape(expression) {
  const trimmed = expression.trim()
  if (!trimmed) return null
  const quoted = /^(['"])([\s\S]*)\1$/.exec(trimmed)
  if (quoted) return { staticText: quoted[2], substitutions: [] }
  const template = /^`([\s\S]*)`$/.exec(trimmed)
  if (!template) return null
  const body = template[1]
  return {
    staticText: body.replace(TEMPLATE_SUBSTITUTION, ''),
    substitutions: [...body.matchAll(TEMPLATE_SUBSTITUTION)].map(match => match[1].trim()),
  }
}

function entityTypeProblems(where, eventType, expression) {
  const rule = ENGAGEMENT_ENTITY_TYPES[eventType]
  if (!rule) return []
  const shape = entityTypeShape(expression)
  if (!shape) {
    return [`${where}: entity_type для ${eventType} «${expression}» — не строка и не шаблон`]
  }
  const problems = []
  if (FORBIDDEN_CONTEXT.test(expression)) {
    problems.push(`${where}: в entity_type ${eventType} попадают данные человека — «${expression}»`)
  }
  for (const substitution of shape.substitutions) {
    if (!SAFE_SUBSTITUTION.test(substitution)) {
      problems.push(
        `${where}: entity_type ${eventType} подставляет «${substitution}» — допустимы только поле записи или выбор из литералов`
      )
    }
  }
  if (rule.exact !== undefined) {
    if (shape.staticText !== rule.exact || shape.substitutions.length) {
      problems.push(
        `${where}: entity_type ${eventType} должен быть «${rule.exact}», получено «${expression}»`
      )
    }
    return problems
  }
  if (!shape.staticText.startsWith(rule.prefix)) {
    problems.push(
      `${where}: entity_type ${eventType} должен начинаться с «${rule.prefix}», получено «${expression}»`
    )
    return problems
  }
  const tail = shape.staticText.slice(rule.prefix.length)
  const tailLiterals = shape.substitutions.flatMap(literalsIn)
  if (!tail && !shape.substitutions.length) {
    problems.push(`${where}: entity_type ${eventType} без значения после «${rule.prefix}»`)
  }
  if (rule.values) {
    const values = [tail, ...tailLiterals].filter(Boolean)
    if (!values.length) {
      problems.push(`${where}: entity_type ${eventType} без значения из ${rule.values.join(' / ')}`)
    }
    for (const value of values) {
      if (!rule.values.includes(value)) {
        problems.push(
          `${where}: entity_type ${eventType} содержит «${value}», допустимо: ${rule.values.join(' / ')}`
        )
      }
    }
  }
  return problems
}

test('event_type входит в закрытый перечень POST /api/events', () => {
  const sites = collectSites()
  assert.ok(sites.length > 0, 'вызовы событий не найдены — проверка контракта не выполнима')

  const violations = []
  for (const site of sites) {
    const eventTypes = valueLiterals(site.eventTypeExpression)
    if (!eventTypes.length) {
      violations.push(`${site.where}: event_type «${site.eventTypeExpression}» не литерал`)
      continue
    }
    for (const eventType of eventTypes) {
      if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
        violations.push(`${site.where}: event_type «${eventType}» нет в контракте бэкенда`)
      }
    }
  }
  assert.deepEqual(
    violations,
    [],
    `События с типом вне перечня сервер отклоняет с 422 и теряет:\n${violations.join('\n')}`
  )
})

test('event_type из перечня не дублируется', () => {
  assert.equal(
    new Set(ALLOWED_EVENT_TYPES).size,
    ALLOWED_EVENT_TYPES.length,
    'в перечне event_type есть дубли'
  )
})

test('entity_id события — целое число или null', () => {
  const violations = []
  for (const site of collectSites()) {
    const expression = site.entityIdExpression
    if (expression === 'null' || /^-?\d+$/.test(expression)) continue
    if (literalsIn(expression).length || /\d+\.\d+/.test(expression)) {
      violations.push(`${site.where}: entity_id «${expression}» не целое число и не null`)
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Строковый или дробный entity_id сервер отклоняет с 422:\n${violations.join('\n')}`
  )
})

test('события вовлечённости шлют entity_id null и entity_type по шаблону', () => {
  const violations = []
  for (const site of collectSites()) {
    for (const eventType of valueLiterals(site.eventTypeExpression)) {
      if (!(eventType in ENGAGEMENT_ENTITY_TYPES)) continue
      if (site.entityIdExpression !== 'null') {
        violations.push(
          `${site.where}: ${eventType} отправляет entity_id «${site.entityIdExpression}» — контракт требует null`
        )
      }
      violations.push(...entityTypeProblems(site.where, eventType, site.entityTypeExpression))
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Контекст события уходит только в entity_type:\n${violations.join('\n')}`
  )
})

test('вызовы всех событий вовлечённости на месте', () => {
  const sent = new Set(collectSites().flatMap(site => valueLiterals(site.eventTypeExpression)))
  const missing = Object.keys(ENGAGEMENT_ENTITY_TYPES).filter(eventType => !sent.has(eventType))
  assert.deepEqual(
    missing,
    [],
    `Отправка событий вовлечённости пропала из исходников (#1162):\n${missing.join('\n')}`
  )
})

/*
 * Один канал отправки: событие вовлечённости не должно уходить напрямую
 * через api.events.log, иначе демо, предпросмотр и гость без сессии снова
 * начнут слать события (фильтр живёт только в logEngagementEvent).
 */
test('события вовлечённости отправляются только через logEngagementEvent', () => {
  const violations = []
  for (const file of sourceFiles(sourceRoot)) {
    const source = readFileSync(file, 'utf8')
    for (const site of directSites(file, source)) {
      for (const eventType of valueLiterals(site.eventTypeExpression)) {
        if (eventType in ENGAGEMENT_ENTITY_TYPES) {
          violations.push(
            `${site.where}: ${eventType} отправляется напрямую через api.events.log — нужен logEngagementEvent`
          )
        }
      }
    }
  }
  assert.deepEqual(
    violations,
    [],
    `События вовлечённости минуют фильтр демо/гостя:\n${violations.join('\n')}`
  )
})

test('api.events.log приводит entity_id к целому числу или null', () => {
  const apiSource = readFileSync(path.join(sourceRoot, 'lib/api.js'), 'utf8')
  assert.match(
    apiSource,
    /entity_id:\s*Number\.isInteger\(entityId\)\s*\?\s*entityId\s*:\s*null/,
    'api.events.log должен отправлять entity_id только как целое число или null'
  )
})
