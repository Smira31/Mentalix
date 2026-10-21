import { expect, test } from '@playwright/test'

/*
 * Стабильность финала журнала (задача «визуальный скачок на финале журнала»,
 * продолжение #1096).
 *
 * Владелец подтвердил дефект в Telegram: после «Сохранить» финальный экран
 * открывается, рисунок дневника появляется в одном положении, а затем меняет
 * размер и смещается.
 *
 * Причина: финал журнала живёт на общей поверхности <Screen>, а та брала
 * высоту от visualViewport («resize»). Клавиатура закрывается анимацией,
 * и последний её кадр приходится уже на открытый финал: `saveAndComplete`
 * показывает финал, как только инсет клавиатуры стал меньше 80 px, поэтому
 * поверхность рождается на ~60 px ниже layout-вьюпорта и догоняет его, когда
 * клавиатура закрылась. Полоса героя (.mx-completion__art-wrap) — единственная
 * растягиваемая полоса финала, поэтому догоняет её именно рисунок: он и
 * меняет размер, и смещается.
 *
 * Что проверяется:
 *   1. Клавиатура открыта в момент «Сохранить», финал появляется на
 *      закрывающейся клавиатуре, затем она закрывается целиком — рисунок,
 *      заголовок, плашка даты и кнопка «Готово» не двигаются и не меняют
 *      размер; шелл финала стоит на layout-вьюпорте и за клавиатурой не
 *      следует; рисунок не обрезан и не заходит под кнопку.
 *   2. Реальное изменение размера экрана (короткий ↔ высокий): содержимое
 *      остаётся доступным, рисунок не вылезает за полосу героя, кнопка видна.
 *
 * Вьюпорты задачи — 430×932 (iPhone 15 Pro Max) и 360×640.
 * `?frame=0` выключает демо-рамку телефона: поверхность считается от размера
 * окна, как на реальном устройстве.
 * Скриншоты: JOURNAL_COMPLETION_SHOTS (по умолчанию test-results/journal-completion).
 */

const SHOTS = process.env.JOURNAL_COMPLETION_SHOTS || 'test-results/journal-completion'
const VIEWPORTS = [
  { name: '430x932', width: 430, height: 932 },
  { name: '360x640', width: 360, height: 640 },
]

/*
 * Клавиатура iOS/Telegram уменьшает visualViewport, но не window.innerHeight.
 * Подменяем только высоту visualViewport и сообщаем об этом приложению
 * штатным событием resize — тем же приёмом, что и в
 * checkin-streak-stability.spec.mjs.
 */
async function installKeyboardStub(page) {
  await page.evaluate(() => {
    const viewport = window.visualViewport
    const proto = Object.getPrototypeOf(viewport)
    window.__mxKeyboardInset = 0
    if (!window.__mxVvRestore) {
      window.__mxVvRestore = {
        height: Object.getOwnPropertyDescriptor(proto, 'height'),
        offsetTop: Object.getOwnPropertyDescriptor(proto, 'offsetTop'),
      }
    }
    Object.defineProperty(viewport, 'height', {
      configurable: true,
      get: () => Math.round(window.innerHeight) - window.__mxKeyboardInset,
    })
    Object.defineProperty(viewport, 'offsetTop', { configurable: true, get: () => 0 })
  })
}

/* Кадры после изменения размера окна: событие resize приходит задачей,
   а замер до перерисовки React показывает геометрию прошлого размера. */
async function waitForLayout(page) {
  await page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
}

/** Новый инсет клавиатуры в пикселях (0 — клавиатура закрыта). */
async function setKeyboardInset(page, inset) {
  await page.evaluate(value => {
    window.__mxKeyboardInset = value
    window.visualViewport.dispatchEvent(new Event('resize'))
  }, inset)
  // Ждём кадр с пересчитанной геометрией, а не время.
  await page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
}

/** Журнал до вопроса дня: intro → «Поток» → «Вопрос дня». */
async function openQuestion(page) {
  await page.goto('/?demo=1&frame=0&tab=practices')
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  await page.getByTestId('journal-open-cta').click()
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()
  await page.getByTestId('dj-intro-skip').click()
  await expect(page.getByTestId('dj-stream-input')).toBeVisible()
  await page
    .getByTestId('dj-stream-input')
    .fill('Проверка стабильности финала журнала: сижу дома, пью чай.')
  await page.getByTestId('dj-stream-next').click()
  await expect(page.getByTestId('dj-question-input')).toBeVisible()
  await page
    .getByTestId('dj-question-input')
    .fill('Откладываю отдых, хотя знаю, что он важен.')
}

/*
 * Положение и размер ключевых элементов финала в координатах вьюпорта.
 * shellHeight нужен отдельно: у стабильной поверхности он равен layout-вьюпорту
 * (window.innerHeight) и не следует за visualViewport.
 */
async function readFinalLayout(page) {
  return page.evaluate(() => {
    const screen = document.querySelector('.mx-completion')
    const shell = document.querySelector('.mx-fullscreen-surface')
    const measure = el => {
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        width: Math.round(rect.width),
      }
    }
    const overflow = () => {
      if (!screen) return null
      for (let el = screen.parentElement; el; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
          return Math.max(0, el.scrollHeight - el.clientHeight)
        }
      }
      return 0
    }
    return {
      shell: measure(shell),
      shellHeight: Math.round(shell?.getBoundingClientRect().height ?? 0),
      innerHeight: Math.round(window.innerHeight),
      visualHeight: Math.round(window.visualViewport?.height ?? window.innerHeight),
      artWrap: measure(screen?.querySelector('.mx-completion__art-wrap')),
      art: measure(screen?.querySelector('.mx-completion__art')),
      title: measure(screen?.querySelector('.mx-completion__title')),
      meta: measure(screen?.querySelector('.mx-completion__date-pill')),
      cta: measure(document.querySelector('[data-testid="dj-complete-close"]')),
      overflow: overflow(),
    }
  })
}

/*
 * Стабильный шелл: высота от layout-вьюпорта, а не от visualViewport.
 * Финал обязан стоять на window.innerHeight и при закрывающейся клавиатуре.
 */
function expectStableShell(layout, label) {
  expect(layout.shellHeight, `${label}: шелл занимает layout-вьюпорт`).toBeGreaterThan(0)
  expect(
    Math.abs(layout.shellHeight - layout.innerHeight),
    `${label}: шелл не следует за клавиатурой (${layout.shellHeight} vs ${layout.innerHeight})`
  ).toBeLessThanOrEqual(2)
}

for (const viewport of VIEWPORTS) {
  test(`журнал: закрытие клавиатуры не двигает и не масштабирует рисунок финала, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openQuestion(page)

    // Клавиатура открыта в момент нажатия «Сохранить» — как на iPhone.
    await installKeyboardStub(page)
    await setKeyboardInset(page, 336)
    await page.getByTestId('dj-question-next').click()

    /*
     * Клавиатура закрывается анимацией: финал появляется на её последнем
     * кадре (инсет < 80 px), а не после полного закрытия.
     */
    await setKeyboardInset(page, 60)
    await expect(page.getByTestId('checkin-completion')).toBeVisible()
    const appeared = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/journal-final-keyboard-closing-${viewport.name}.png` })

    // Клавиатура закрылась — visualViewport вернулся к полной высоте.
    await setKeyboardInset(page, 0)
    const settled = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/journal-final-settled-${viewport.name}.png` })

    console.log(
      `journal final keyboard closing→closed ${viewport.name}`,
      JSON.stringify({ appeared, settled })
    )

    // Место, отведённое рисунку, и его положение не меняются.
    expect
      .soft(
        Math.abs(settled.artWrap.top - appeared.artWrap.top),
        `полоса героя сдвинулась на ${Math.abs(settled.artWrap.top - appeared.artWrap.top)} px`
      )
      .toBeLessThanOrEqual(2)
    expect
      .soft(
        Math.abs(settled.artWrap.height - appeared.artWrap.height),
        `полоса героя изменила высоту на ${Math.abs(settled.artWrap.height - appeared.artWrap.height)} px`
      )
      .toBeLessThanOrEqual(2)
    expect
      .soft(
        Math.abs(settled.art.top - appeared.art.top),
        `рисунок сместился на ${Math.abs(settled.art.top - appeared.art.top)} px`
      )
      .toBeLessThanOrEqual(2)
    expect
      .soft(
        Math.abs(settled.art.height - appeared.art.height),
        `рисунок изменил размер на ${Math.abs(settled.art.height - appeared.art.height)} px`
      )
      .toBeLessThanOrEqual(2)
    for (const key of ['title', 'meta', 'cta']) {
      expect
        .soft(
          Math.abs(settled[key].top - appeared[key].top),
          `после закрытия клавиатуры сдвинулся ${key}`
        )
        .toBeLessThanOrEqual(2)
    }

    // Поверхность финала не следует за клавиатурой ни в один из моментов.
    expectStableShell(appeared, `финал журнала, клавиатура закрывается, ${viewport.name}`)
    expectStableShell(settled, `финал журнала, клавиатура закрыта, ${viewport.name}`)

    // Рисунок не обрезан: он целиком внутри полосы героя и не нулевой.
    expect(settled.art.height, 'рисунок отрисован').toBeGreaterThan(0)
    expect(
      settled.artWrap.height - settled.art.height,
      'рисунок не обрезан полосой героя'
    ).toBeGreaterThanOrEqual(-1)
    // …и не перекрывает кнопку «Готово».
    expect(
      settled.artWrap.bottom,
      'полоса героя не заходит под кнопку «Готово»'
    ).toBeLessThanOrEqual(settled.cta.top + 1)
    expect(settled.cta.bottom, 'кнопка «Готово» в пределах экрана').toBeLessThanOrEqual(
      viewport.height + 1
    )
    expect(settled.overflow, 'финал журнала не требует скролла').toBeLessThanOrEqual(1)
  })
}

test('журнал: реальное изменение размера экрана сохраняет адаптивность финала', async ({
  page,
}) => {
  const short = { width: 360, height: 640 }
  const tall = { width: 430, height: 932 }

  await page.setViewportSize(short)
  await openQuestion(page)
  await installKeyboardStub(page)
  await setKeyboardInset(page, 336)
  await page.getByTestId('dj-question-next').click()
  await setKeyboardInset(page, 0)
  await expect(page.getByTestId('checkin-completion')).toBeVisible()

  const onShort = await readFinalLayout(page)
  await page.screenshot({ path: `${SHOTS}/journal-final-short-360x640.png` })

  await page.setViewportSize(tall)
  await waitForLayout(page)
  const onTall = await readFinalLayout(page)
  await page.screenshot({ path: `${SHOTS}/journal-final-tall-430x932.png` })

  // Возврат к короткому экрану даёт прежнюю геометрию, а не «залипшую».
  await page.setViewportSize(short)
  await waitForLayout(page)
  const backToShort = await readFinalLayout(page)

  console.log(
    'journal final resize',
    JSON.stringify({ onShort, onTall, backToShort })
  )

  for (const [label, layout] of [
    ['короткий 360×640', onShort],
    ['высокий 430×932', onTall],
    ['снова короткий 360×640', backToShort],
  ]) {
    expect(layout.art.height, `${label}: рисунок отрисован`).toBeGreaterThan(0)
    expect(layout.art.height, `${label}: рисунок не крупнее 180 pt`).toBeLessThanOrEqual(180)
    expect(
      layout.art.height - layout.artWrap.height,
      `${label}: рисунок не обрезан полосой героя`
    ).toBeLessThanOrEqual(1)
    expect(
      layout.artWrap.bottom,
      `${label}: полоса героя не заходит под кнопку`
    ).toBeLessThanOrEqual(layout.cta.top + 1)
    expect(
      layout.cta.bottom,
      `${label}: кнопка «Готово» доступна без прокрутки`
    ).toBeLessThanOrEqual(layout.innerHeight + 1)
    expect(layout.overflow, `${label}: лишнего скролла нет`).toBeLessThanOrEqual(1)
  }

  // На высоком экране рисунок доходит до своей полной высоты (180), на
  // коротком ужимается — но возвращается к прежнему значению.
  expect(onTall.art.height, 'высокий экран: рисунок в полную высоту').toBe(180)
  expect(backToShort.art.height, 'возврат к короткому экрану: прежняя высота рисунка').toBe(
    onShort.art.height
  )
})
