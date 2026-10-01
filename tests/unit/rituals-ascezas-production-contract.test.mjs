import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const rituals = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const ascezas = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
const flow = await readFile(new URL('../../src/components/practices/PracticeListFlow.jsx', import.meta.url), 'utf8')
const wording = await readFile(new URL('../../src/lib/practiceWording.js', import.meta.url), 'utf8')
const detail = await readFile(new URL('../../src/components/PracticeDetail.jsx', import.meta.url), 'utf8')
const flowCss = await readFile(new URL('../../src/components/practices/PracticeListFlow.css', import.meta.url), 'utf8')
const detailCss = await readFile(new URL('../../src/components/PracticeDetail.css', import.meta.url), 'utf8')
const milestoneCss = await readFile(
  new URL('../../src/components/practices/PracticeMilestone.css', import.meta.url),
  'utf8'
)
const header = await readFile(
  new URL('../../src/components/NestedScreenHeader.jsx', import.meta.url),
  'utf8'
)
const fieldFlow = await readFile(
  new URL('../../src/components/practices/PracticeFieldFlow.jsx', import.meta.url),
  'utf8'
)
const milestone = await readFile(
  new URL('../../src/components/practices/PracticeMilestone.jsx', import.meta.url),
  'utf8'
)
const signScreen = await readFile(
  new URL('../../src/components/practices/PracticeSignScreen.jsx', import.meta.url),
  'utf8'
)

function block(source, start, end) {
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end, startIndex + start.length)
  assert.notEqual(startIndex, -1, `missing block start: ${start}`)
  assert.notEqual(endIndex, -1, `missing block end: ${end}`)
  return source.slice(startIndex, endIndex)
}

test('production lists use the unified two-column flow tile contract', () => {
  assert.match(rituals, /kind="ritual"/)
  assert.match(ascezas, /kind="asceza"/)
  assert.match(flow, /mx-practice-flow-grid/)
  assert.match(flow, /data-testid="practice-tile"/)
  assert.match(flow, /data-done=/)
  assert.match(flow, /onOpenDetail\(/)
  assert.doesNotMatch(flow, /StreakBar|StreakRestoreSheet|restoreTarget|freezes/)
  assert.match(flowCss, /\.mx-practice-flow-grid\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)/)
  assert.match(flowCss, /\.mx-practice-flow-tile\.is-done\s*\{[\s\S]*#ece8e1/)
  assert.match(wording, /серия/)
  assert.match(wording, /держишься/)
})

test('плитки и «готовые» держат две строки текста, а не обрезают его', () => {
  const tileName = block(
    flowCss,
    '.mx-practice-flow-tile__name {',
    '.mx-practice-flow-tile__minimum {'
  )
  // Название — до двух строк, без «…» и без запрета переноса.
  assert.match(tileName, /-webkit-line-clamp: 2/)
  assert.doesNotMatch(tileName, /white-space: nowrap/)
  assert.doesNotMatch(tileName, /text-overflow: ellipsis/)

  const readyBody = block(
    flowCss,
    '.mx-practice-ready-card__body {',
    '.mx-practice-ready-card__action {'
  )
  // Название сверху, «Минимум: …» строкой ниже — колонка, не одна строка.
  assert.match(readyBody, /flex-direction: column/)
  assert.doesNotMatch(readyBody, /white-space: nowrap/)

  const readyAction = block(
    flowCss,
    '.mx-practice-ready-card__action {',
    '.mx-practice-ready-card.is-added'
  )
  // «+»/галочка стоит справа отдельно и не наезжает на текст.
  assert.match(readyAction, /margin-left: auto/)
  assert.match(readyAction, /flex-shrink: 0/)
})

test('нулевая серия называется новым ритуалом и новой аскезой', () => {
  assert.match(wording, /'новый ритуал'/)
  assert.match(wording, /'новая аскеза'/)
})

test('кнопка «‹» списка — круглая 43 слева сверху, в Telegram её рисует система', () => {
  assert.match(header, /export function RoundBackButton\(\{[\s\S]*className = ''/)
  assert.match(header, /<ScreenBack[\s\S]*className=\{className\}/)
  assert.match(flow, /<RoundBackButton onClick=\{onBack\} className="mx-practice-flow-screen__back" \/>/)
  assert.match(
    flowCss,
    /\.mx-practice-flow-screen__back \{[\s\S]*position: absolute;[\s\S]*left: 0;/
  )
})

test('practice detail exposes toggle, three accordions and the asceza break action', () => {
  assert.match(detail, /data-testid="practice-detail-toggle"/)
  assert.match(detail, /testId="practice-accordion-why"/)
  assert.match(detail, /testId="practice-accordion-how"/)
  assert.match(detail, /testId="practice-accordion-note"/)
  assert.match(detail, /onLog/)
  assert.match(detail, /Сорвался сегодня/)
  assert.match(detail, /<DeleteConfirmationDialog/)
})

test('экран практики показывает «ЭТА НЕДЕЛЯ» и возвращает уровни отметки', () => {
  // Карточка недели стоит над отметкой: 7 кружков и правило про пропуск.
  assert.match(detail, /data-testid="practice-detail-week"/)
  assert.match(detail, /<PracticeWeek streak=\{practice\.streak \|\| 0\} \/>/)
  assert.match(detail, /1 пропуск в неделю не рвёт серию/)
  assert.match(detailCss, /\.mx-practice-detail__week \{/)
  // Уровни отметки ритуала (минимум / оптимум) вернулись из старого экрана.
  assert.match(
    detail,
    /const hasLevels = isRitual && Boolean\(practice\.min_version && practice\.optimal_version\)/
  )
  assert.match(detail, /data-testid=\{`practice-detail-level-\$\{item\.value\}`\}/)
  assert.match(detailCss, /\.mx-practice-detail__level\.is-active \{/)
})

test('practice logging keeps user scope and invalidates Today and practices caches', () => {
  assert.match(rituals, /api\.rituals\.log\(ritualId, user\.id, level\)/)
  assert.match(ascezas, /api\.ascezas\.log\(ascezaId, user\.id, status, breakTrigger, breakNote\)/)
  for (const source of [rituals, ascezas]) {
    assert.match(source, /invalidateTodayData\(user\.id\)/)
    assert.match(source, /invalidatePracticesData\(user\.id\)/)
    assert.match(source, /isLinkedWebWriteBlocked\(user, error\)/)
  }
})

test('delete remains a named confirmation flow', () => {
  assert.match(detail, /itemName=\{practice\.name\}/)
  assert.match(detail, /onDelete\(practice\.id\)/)
})

test('unified own-create flow is a 2-step magazine with fullscreen and native BackButton', () => {
  const start = flow.indexOf('function OwnScreen')
  const end = flow.indexOf('export default function', start)
  const ownSlice = flow.slice(start, end)
  assert.match(ownSlice, /ownSteps/)
  assert.match(ownSlice, /buildOwnDraft/)
  // Экран-поле общий для «Свой» и «Изменить»: полноэкранная поверхность
  // и нативный «Назад» живут в нём.
  assert.match(fieldFlow, /useFullscreenSurface\(\)/)
  assert.match(fieldFlow, /useBackButton\(/)
  assert.match(wording, /от чего отказываешься/)
  assert.match(wording, /где твоя граница даже в плохой день/)
  assert.match(wording, /Держусь сегодня/)
  assert.match(wording, /Отметить сегодня/)
})

test('practice menu offers edit, sign and delete', () => {
  assert.match(detail, /testId="practice-detail-edit"/)
  assert.match(detail, /testId="practice-detail-sign"/)
  assert.match(detail, /testId="practice-detail-delete"/)
  // «Изменить» — тот же экран-поле, что и «Свой»; «Знак» — сетка 4×3.
  assert.match(detail, /<PracticeFieldFlow/)
  assert.match(detail, /buildEditPatch/)
  assert.match(detail, /<PracticeSignScreen/)
  assert.match(signScreen, /PRACTICE_GLYPHS/)
  assert.match(signScreen, /SemanticGlyph/)
  assert.match(wording, /buildEditPatch/)
})

test('streak milestone — круг, «3 дня.» 34/700, капс-название и неделя кружками', () => {
  assert.match(milestone, /useFullscreenSurface\(\)/)
  assert.match(milestone, /getFullscreenPortalTarget\(\)/)
  assert.match(milestone, /data-testid="practice-milestone-done"/)
  assert.match(milestone, /Готово/)
  // Неделя вехи — те же 7 кружков, что на экране практики, а не точки.
  assert.match(milestone, /<PracticeWeek streak=\{streak\} \/>/)
  assert.doesNotMatch(milestone, /__dot/)
  assert.match(milestoneCss, /\.mx-practice-milestone-screen__days \{[\s\S]*font-size: 34px[\s\S]*font-weight: 700/)
  assert.match(
    milestoneCss,
    /\.mx-practice-milestone-screen__name \{[\s\S]*text-transform: uppercase/
  )
  assert.match(wording, /MILESTONE_PHRASES/)
  assert.match(wording, /Три дня подряд — ты уже не новичок\./)
  assert.match(wording, /Месяц\. Ты доказал себе, что можешь\./)
  assert.match(wording, /milestoneDayLabel/)
})
