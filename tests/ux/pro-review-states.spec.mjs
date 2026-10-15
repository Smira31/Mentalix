import path from 'node:path'
import { test, expect } from '@playwright/test'

import { MOCK_LONG_REPORT_TEXT } from '../../src/lib/proMockLongText.js'
import { createEvidenceWriter, describeFrames } from './typography-evidence.mjs'

/*
 * PRO-002b/c — доказательная съёмка экранов Mentalix Pro.
 *
 * Что доказывает прогон (без backend: работает dev-only mock `?proMock=…`):
 *  1) состояния API: согласие → «ещё не собран» → готовый разбор → план →
 *     прогресс, а также ограничения доступа (402 pro_required, 404
 *     pro_*_disabled), недостаток данных, кризисный ответ, конфликт сборки,
 *     конфликт версий и конфликт пересборки;
 *  2) геометрия на 393×852 и 360×640: нет горизонтального выхода;
 *  3) MXL-KEYBOARD-001 в Pro: вход в правку («Изменить») ставит фокус в
 *     основное поле сам, фактический размер ввода — 16px;
 *  4) длинные русские тексты разбора переносятся, а не обрезаются (сценарий
 *     `longtext`), и возврат в аналитику сохраняет выбранный период и прокрутку.
 *
 * Кадр снимается через общий писатель доказательств: он требует уникальный
 * признак экрана, ждёт завершения анимации входа, отклоняет пустой кадр и
 * кадр, совпавший с другим состоянием. Поэтому «FAIL-» заглушки здесь
 * невозможны: состояние либо снято как доказательство, либо прогон падает.
 *
 * Запуск в web-контейнере (VITE_PRO_REVIEW_PLAN_ENABLED=true задаёт конфиг):
 *   npm run ux:pro-states
 */

const OUT_DIR = path.join('qa-evidence', 'pro-review-plan')
const MOCK_STATE_KEY = 'mx-pro-mock-state:v1'

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const DESKTOP_PHONE = { width: 393, height: 852 }

/* ── Измерения и проверки ── */

/** Фактический (computed) размер поля и владеет ли он фокусом. */
async function readField(page, testId) {
  return page.evaluate(id => {
    const el = document.querySelector(`[data-testid="${id}"]`)
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      size: Math.round(parseFloat(cs.fontSize) * 100) / 100,
      focused: document.activeElement === el,
    }
  }, testId)
}

/** Горизонтальный выход: сам документ и элементы, пересёкшие правую границу. */
async function readOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const offenders = [...document.querySelectorAll('body *')]
      .filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.right > de.clientWidth + 2
      })
      .slice(0, 5)
      .map(el => `${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''}`)

    return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, offenders }
  })
}

function assertNoOverflow(overflow, label) {
  expect(
    overflow.scrollWidth,
    `${label}: горизонтальный выход (виновники: ${overflow.offenders.join(', ')})`
  ).toBeLessThanOrEqual(overflow.clientWidth + 2)
}

/**
 * Состояние аналитики, которое не должно теряться при входе в Pro и возврате:
 * выбранный период и позиция прокрутки вкладки.
 */
async function readAnalyticsState(page) {
  return page.evaluate(() => {
    const trigger = document.querySelector('[data-testid="progress-period-trigger"]')
    const scrollRoot = document.querySelector('.mx-app-scroll-root')

    return {
      period: trigger ? trigger.textContent.trim() : null,
      scrollTop: scrollRoot ? Math.round(scrollRoot.scrollTop) : null,
    }
  })
}

/**
 * Как отрисован текст: переносится ли он и не режется ли — ни самим
 * элементом, ни предком с overflow: hidden. Многоточие и -webkit-line-clamp
 * считаются обрезкой независимо от фактической высоты.
 */
async function readTextFit(page, selector) {
  return page.evaluate(sel => {
    const el = document.querySelector(sel)
    if (!el) return null

    const style = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4

    const clippedBy = []
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      const s = getComputedStyle(node)
      if (s.overflowY === 'hidden' && node.scrollHeight > node.clientHeight + 1) {
        clippedBy.push(`${node.tagName.toLowerCase()}.${node.className}`)
      }
      if (s.overflowX === 'hidden' && node.scrollWidth > node.clientWidth + 1) {
        clippedBy.push(`${node.tagName.toLowerCase()}.${node.className}`)
      }
    }

    return {
      text: el.textContent,
      textOverflow: style.textOverflow,
      lineClamp: style.webkitLineClamp ?? '',
      whiteSpace: style.whiteSpace,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      lines: Math.round(rect.height / lineHeight),
      clippedBy,
    }
  }, selector)
}

/** Текст показан целиком: без многоточия, обрезки по строкам и клиппинга. */
function expectNoClipping(fit, label) {
  expect(fit, `${label}: элемент найден`).not.toBeNull()
  expect(fit.textOverflow, `${label}: многоточие не используется`).not.toBe('ellipsis')
  expect(
    fit.lineClamp === '' || fit.lineClamp === 'none',
    `${label}: текст не обрезан по числу строк (${fit.lineClamp})`
  ).toBe(true)
  expect(fit.whiteSpace, `${label}: текст переносится`).not.toBe('nowrap')
  expect(fit.scrollWidth, `${label}: ширина не обрезана`).toBeLessThanOrEqual(fit.clientWidth + 1)
  expect(fit.scrollHeight, `${label}: высота не обрезана`).toBeLessThanOrEqual(fit.clientHeight + 1)
  expect(fit.clippedBy, `${label}: предки не обрезают текст`).toEqual([])
}

/* ── Прохождение экранов Pro ── */

/** «Прогресс» → «Аналитика» с карточкой «Разбор и план недели» на экране. */
async function openAnalytics(page, scenario) {
  /*
   * Состояние mock живёт в localStorage: согласие, собранный разбор и план
   * переживают перезагрузку страницы, поэтому каждый сценарий начинается с
   * чистого состояния — иначе он получил бы данные предыдущего.
   */
  await page.addInitScript(key => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* хранилище недоступно — состояние и так пустое */
    }
  }, MOCK_STATE_KEY)

  await page.goto(`/?demo=1&frame=0&proMock=${scenario}`)
  await expect(page.getByRole('button', { name: 'Прогресс' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Прогресс' }).click()
  await expect(page.getByTestId('progress-pro-card')).toBeVisible()
}

/** Вход в разбор — тот же, что у пользователя: карточка в аналитике. */
async function openPro(page, scenario) {
  await openAnalytics(page, scenario)
  await page.getByTestId('pro-card-open').click()
  await expect(page.locator('.mx-page-title')).toContainText('мой разбор.')
}

/** Согласие → сборка разбора. Общий первый шаг почти всех сценариев. */
async function buildReport(page) {
  await page.getByTestId('pro-consent-enable').click()
  await expect(page.getByTestId('pro-generate-report')).toBeVisible()
  await page.getByTestId('pro-generate-report').click()
}

/** Согласие → разбор → план недели. */
async function buildPlan(page) {
  await buildReport(page)
  await expect(page.getByTestId('pro-open-plan')).toBeVisible()
  await page.getByTestId('pro-open-plan').click()
  await expect(page.getByTestId('pro-generate-plan')).toBeVisible()
  await page.getByTestId('pro-generate-plan').click()
  await expect(page.getByTestId('pro-plan-progress')).toBeVisible()
}

/**
 * Снять состояние: сначала довести признак в видимую область (кадр снимается
 * с текущей позиции прокрутки), затем снять через писатель доказательств.
 */
async function capture(page, writer, { name, marker, label }) {
  await page
    .locator(marker)
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {})

  const overflow = await readOverflow(page)
  assertNoOverflow(overflow, `${name} (${label})`)

  await writer.capture(page, { name, marker, markerLabel: label })

  return overflow
}

/* ── Полный путь на двух размерах телефона ── */

for (const viewport of VIEWPORTS) {
  test.describe(`Pro: полный путь — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('согласие → разбор → план → правки → прогресс', async ({ page }) => {
      const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, viewport.name) })

      await openPro(page, 'ready')

      // 1. Согласие на использование записей.
      await capture(page, writer, {
        name: '1-consent.png',
        marker: '[data-testid="pro-consent-enable"]',
        label: 'Pro: согласие',
      })

      // 2. Разбор ещё не собран.
      await page.getByTestId('pro-consent-enable').click()
      await capture(page, writer, {
        name: '2-report-not-generated.png',
        marker: '[data-testid="pro-generate-report"]',
        label: 'Pro: разбор не собран',
      })

      // 3. Готовый разбор: направление и достижения видны сразу.
      await page.getByTestId('pro-generate-report').click()
      await expect(page.getByTestId('pro-report-direction')).toBeVisible()
      await expect(page.getByTestId('pro-report-achievements')).toBeVisible()
      await expect(page.getByText('Три дня подряд день начинался со стакана воды')).toBeVisible()
      await capture(page, writer, {
        name: '3-report-ready.png',
        marker: '[data-testid="pro-open-plan"]',
        label: 'Pro: разбор недели готов',
      })

      // 3a. Подробности свёрнуты, но не потеряны: раскрытие показывает текст.
      const difficulty = 'Вечером было трудно удержать внимание на одном деле'
      await expect(page.getByText(difficulty)).toBeHidden()
      await page.getByTestId('pro-details-difficulties').locator('summary').click()
      await expect(page.getByText(difficulty)).toBeVisible()
      await capture(page, writer, {
        name: '3a-report-details.png',
        marker: '[data-testid="pro-details-difficulties"]',
        label: 'Pro: подробности разбора раскрыты',
      })

      // 4. План ещё не собран.
      await page.getByTestId('pro-open-plan').click()
      await capture(page, writer, {
        name: '4-plan-not-generated.png',
        marker: '[data-testid="pro-generate-plan"]',
        label: 'Pro: план не собран',
      })

      // 5. Готовый план недели.
      await page.getByTestId('pro-generate-plan').click()
      await capture(page, writer, {
        name: '5-plan-ready.png',
        marker: '[data-testid="pro-plan-progress"]',
        label: 'Pro: план недели готов',
      })

      // 6. Правка общей цели: фокус без второго нажатия, поле 16px.
      await page.getByTestId('pro-goal-edit').click()
      await expect(page.getByTestId('pro-goal-edit-input')).toBeFocused()
      await capture(page, writer, {
        name: '6-goal-edit-focus.png',
        marker: '[data-testid="pro-goal-edit-input"]',
        label: 'Pro: правка цели с фокусом',
      })

      const goalField = await readField(page, 'pro-goal-edit-input')
      expect(goalField.focused, 'правка цели: поле получило фокус само').toBe(true)
      expect(goalField.size, 'правка цели: фактический размер ввода').toBeCloseTo(16, 1)

      await page.getByRole('button', { name: 'Отмена' }).click()

      // 7. Правка действия дня: фокус в поле действия, оба поля 16px.
      await page.getByTestId('pro-day-1-edit').click()
      await expect(page.getByTestId('pro-plan-edit-input')).toBeFocused()
      await capture(page, writer, {
        name: '7-day-edit-focus.png',
        marker: '[data-testid="pro-plan-edit-input"]',
        label: 'Pro: правка дня с фокусом',
      })

      const actionField = await readField(page, 'pro-plan-edit-input')
      const criteriaField = await readField(page, 'pro-plan-edit-criteria')
      expect(actionField.focused, 'правка дня: поле действия получило фокус само').toBe(true)
      expect(actionField.size, 'правка дня: размер поля действия').toBeCloseTo(16, 1)
      expect(criteriaField.size, 'правка дня: размер поля критерия').toBeCloseTo(16, 1)

      await page.getByRole('button', { name: 'Отмена' }).click()

      // 8. Прогресс недели.
      await page.getByTestId('pro-open-progress').click()
      await capture(page, writer, {
        name: '8-progress.png',
        marker: '[data-testid="pro-progress-completion"]',
        label: 'Pro: прогресс недели',
      })

      console.log(`Pro ${viewport.name}:\n${describeFrames(writer)}`)
    })

    /*
     * Карточка входа в Pro — по образцу владельца, карточке «Твои практики»
     * в этой же аналитике: та же оболочка `.mx-progress-card` и композиция
     * «кольцо слева, текст справа». Проверяем не «на глаз», а числами:
     * ширина, высота, отступы, скругление и размеры заголовка совпадают с
     * образцом. В демо без данных образец показывает пустое состояние
     * (185 px) — это предусловие проверяется отдельно, иначе падение
     * читалось бы как расхождение геометрии вместо изменения данных.
     */
    test('карточка входа в Pro совпадает по геометрии с образцом «Твои практики»', async ({
      page,
    }) => {
      const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, viewport.name) })

      // Вкладка «Прогресс» открывается на «Аналитике» — карточка Pro уже на
      // экране; сегмент не нажимаем (на 360×640 его перекрывает переключатель
      // размера экрана демо-панели). Сценарий mock нужен, чтобы карточка
      // получила состояние разбора, а не ответ демо-фолбэка.
      await page.goto('/?demo=1&frame=0&proMock=ready')
      await page.getByRole('button', { name: 'Прогресс' }).click()
      await expect(page.getByTestId('progress-pro-card')).toBeVisible()
      await expect(page.getByTestId('progress-practices')).toBeVisible()

      await expect(
        page.getByTestId('progress-practices'),
        'образец в демо — пустое состояние (данных о практиках нет)'
      ).toContainText('Пока нет данных')

      const measured = await page.evaluate(() => {
        const read = id => {
          const el = document.querySelector(`[data-testid="${id}"]`)
          const rect = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            padding: style.padding,
            borderRadius: style.borderRadius,
            background: style.backgroundColor,
            titleFont: getComputedStyle(el.querySelector('.mx-progress-card__title')).fontSize,
            subtitleFont: getComputedStyle(el.querySelector('.mx-progress-card__subtitle'))
              .fontSize,
          }
        }

        return { pro: read('progress-pro-card'), sample: read('progress-practices') }
      })

      expect(measured.pro.width, 'ширина карточки Pro как у образца').toBe(measured.sample.width)
      expect(measured.pro.height, 'высота карточки Pro как у образца').toBe(measured.sample.height)
      expect(measured.pro.padding, 'отступы карточки Pro как у образца').toBe(
        measured.sample.padding
      )
      expect(measured.pro.borderRadius, 'скругление карточки Pro как у образца').toBe(
        measured.sample.borderRadius
      )
      expect(measured.pro.background, 'фон карточки Pro как у образца').toBe(
        measured.sample.background
      )
      expect(measured.pro.titleFont, 'размер заголовка как у образца').toBe(measured.sample.titleFont)
      expect(measured.pro.subtitleFont, 'размер подписи как у образца').toBe(
        measured.sample.subtitleFont
      )

      // Обе карточки в одном кадре — визуальное сравнение рядом.
      await page.locator('[data-testid="progress-practices"]').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('progress-pro-card')).toBeVisible()
      assertNoOverflow(await readOverflow(page), `карточка Pro ${viewport.name}`)
      await writer.capture(page, {
        name: '0-pro-analytics-card.png',
        marker: '[data-testid="progress-pro-card"]',
        markerLabel: 'Аналитика: карточка Pro рядом с образцом «Твои практики»',
      })

      console.log(
        `Pro карточка ${viewport.name}: ${measured.pro.width}×${measured.pro.height}, образец ${measured.sample.width}×${measured.sample.height}`
      )
    })

    /*
     * Кольцо карточки показывает готовность РАЗБОРА по данным, а не по
     * нажатию кнопки: до сборки — пустое, после сборки и возврата «Назад» —
     * заполненное. Процентов сборки в интерфейсе нет, период — по датам.
     */
    test('карточка: кольцо готовности разбора по данным', async ({ page }) => {
      const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, viewport.name) })

      await openAnalytics(page, 'ready')
      const card = page.getByTestId('progress-pro-card')

      await expect(card).toHaveAttribute('data-state', 'not_generated')
      await expect(page.getByTestId('pro-card-title')).toHaveText('Подведи итоги недели')
      await expect(page.getByTestId('pro-card-period')).toContainText('неделя')
      await expect(page.getByTestId('pro-card-retry')).toHaveCount(0)
      await capture(page, writer, {
        name: '0a-pro-card-waiting.png',
        marker: '[data-testid="progress-pro-card"][data-state="not_generated"]',
        label: 'Pro: карточка ждёт разбор',
      })

      // Разбор собирается на своём экране; карточка читает готовность по данным.
      await page.getByTestId('pro-card-open').click()
      await expect(page.locator('.mx-page-title')).toContainText('мой разбор.')
      await buildReport(page)
      // Дожидаемся готового разбора: карточка читает данные, а не нажатие.
      await expect(page.getByTestId('pro-open-plan')).toBeVisible()
      await page.getByTestId('pro-back-button').click()
      await expect(card).toHaveAttribute('data-state', 'ready')
      await expect(page.getByTestId('pro-card-title')).toHaveText('Разбор готов')
      await capture(page, writer, {
        name: '0b-pro-card-ready.png',
        marker: '[data-testid="progress-pro-card"][data-state="ready"]',
        label: 'Pro: карточка с готовым разбором',
      })
    })

    /*
     * Ошибка запроса — не «разбора нет»: нейтральное кольцо, повтор грузит
     * состояние заново и не запускает генерацию.
     */
    test('карточка: ошибка запроса с повтором, без генерации', async ({ page }) => {
      const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, viewport.name) })

      await openAnalytics(page, 'network')
      const card = page.getByTestId('progress-pro-card')

      await expect(card).toHaveAttribute('data-state', 'error')
      await expect(page.getByTestId('pro-card-title')).toHaveText('Не удалось загрузить')
      await expect(page.getByTestId('pro-card-retry')).toBeVisible()
      await capture(page, writer, {
        name: '0c-pro-card-error.png',
        marker: '[data-testid="progress-pro-card"][data-state="error"]',
        label: 'Pro: карточка не загрузилась',
      })

      const before = await page.evaluate(() => window.__mxProMockGets || 0)
      await page.getByTestId('pro-card-retry').click()
      await expect(card).toHaveAttribute('data-state', 'error')
      const after = await page.evaluate(() => window.__mxProMockGets || 0)
      expect(after, 'повтор карточки заново запрашивает состояние').toBeGreaterThan(before)
      expect(
        await page.evaluate(() => window.__mxProMockPosts || 0),
        'карточка не запускает генерацию'
      ).toBe(0)
    })

    /*
     * Разбор недели — свободный текст от AI: он бывает заметно длиннее
     * образца. Сценарий `longtext` подаёт длинные русские строки и проверяет,
     * что экран их переносит (полное совпадение с данными mock, без многоточия,
     * -webkit-line-clamp и клиппинга у предков).
     *
     * Тем же проходом проверяется возврат в аналитику: выбранный период и
     * прокрутка — состояние вкладки, которое вход в Pro не должен терять.
     */
    test('длинный русский текст не обрезается, возврат хранит период и прокрутку', async ({
      page,
    }) => {
      const writer = createEvidenceWriter({ dir: path.join(OUT_DIR, viewport.name) })
      const long = MOCK_LONG_REPORT_TEXT

      await openAnalytics(page, 'longtext')

      // 1. Период аналитики — состояние вкладки, а не экрана Pro.
      await page.getByTestId('progress-period-trigger').click()
      await page.getByRole('menuitemradio', { name: 'Месяцы' }).click()
      await expect(page.getByTestId('progress-period-trigger')).toContainText('Месяцы')

      // 2. Прокручиваем аналитику: карточка входа остаётся в кадре (её и
      //    нажимаем), а позиция прокрутки — не нулевая, иначе проверять
      //    сохранение было бы нечем.
      const scrolled = await page.evaluate(() => {
        const root = document.querySelector('.mx-app-scroll-root')
        const card = document.querySelector('[data-testid="progress-pro-card"]')
        if (!root || !card) return null

        const rootRect = root.getBoundingClientRect()
        const cardTop = card.getBoundingClientRect().top - rootRect.top + root.scrollTop
        root.scrollTop = Math.max(0, cardTop - root.clientHeight / 3)

        const after = card.getBoundingClientRect()

        return {
          scrollTop: Math.round(root.scrollTop),
          cardVisible: after.top < window.innerHeight && after.bottom > 0,
        }
      })
      expect(scrolled?.cardVisible, 'карточка входа осталась в кадре').toBe(true)
      const before = await readAnalyticsState(page)
      expect(before.scrollTop, 'аналитика прокручена').toBeGreaterThan(0)

      // 3. Разбор с длинными текстами.
      await page.getByTestId('pro-card-open').click()
      await buildReport(page)
      await expect(page.getByTestId('pro-report-direction')).toBeVisible()

      // 4. Направление на неделю — целиком, с переносом на несколько строк.
      const direction = await readTextFit(
        page,
        '[data-testid="pro-report-direction"] .mx-pro-report__direction-text'
      )
      expect(direction.text.trim(), 'направление показано целиком').toBe(long.direction)
      expectNoClipping(direction, 'направление на неделю')
      expect(direction.lines, 'направление занимает несколько строк').toBeGreaterThan(1)

      await capture(page, writer, {
        name: '3b-report-long-text.png',
        marker: '[data-testid="pro-report-direction"]',
        label: 'Pro: длинный текст разбора без обрезки',
      })

      // 5. Раскрытые подробности: длинные тема, трудность и закономерность.
      const theme = await readTextFit(
        page,
        '[data-testid="pro-details-themes"] .mx-pro-report__chip'
      )
      expect(theme.text.trim(), 'тема показана целиком').toBe(long.theme)
      expectNoClipping(theme, 'тема недели')

      await page.getByTestId('pro-details-difficulties').locator('summary').click()
      const difficulty = await readTextFit(
        page,
        '[data-testid="pro-details-difficulties"] .mx-pro-text'
      )
      expect(difficulty.text.trim(), 'трудность показана целиком').toBe(long.difficulty)
      expectNoClipping(difficulty, 'трудность недели')

      await page.getByTestId('pro-details-patterns').locator('summary').click()
      const pattern = await readTextFit(
        page,
        '[data-testid="pro-details-patterns"] .mx-pro-text'
      )
      expect(pattern.text.trim(), 'закономерность показана целиком').toBe(long.pattern)
      expectNoClipping(pattern, 'закономерность недели')

      await capture(page, writer, {
        name: '3c-report-long-details.png',
        marker: '[data-testid="pro-details-patterns"]',
        label: 'Pro: длинные подробности разбора раскрыты',
      })

      // 6. «Назад» возвращает в аналитику: период и прокрутка на месте.
      await page.getByTestId('pro-back-button').click()
      await expect(page.getByTestId('progress-pro-card')).toBeVisible()
      const after = await readAnalyticsState(page)
      expect(after.period, 'выбранный период сохранён').toBe(before.period)
      expect(Math.abs(after.scrollTop - before.scrollTop), 'прокрутка сохранена').toBeLessThanOrEqual(
        2
      )

      console.log(`Pro длинный текст ${viewport.name}:\n${describeFrames(writer)}`)
    })
  })
}

/* ── Состояния доступа и особые ответы API ── */

test.describe('Pro: доступ и особые состояния', () => {
  test.use({ viewport: DESKTOP_PHONE })

  test('402 pro_required и 404 pro_report_disabled', async ({ page }) => {
    const writer = createEvidenceWriter({ dir: OUT_DIR })

    await openPro(page, 'nopro')
    await capture(page, writer, {
      name: '9-blocked-nopro.png',
      marker: '[data-testid="pro-blocked-state"]',
      label: 'Pro: нет подписки (402)',
    })
    await expect(page.locator('[data-testid="pro-blocked-state"]')).toContainText('Pro недоступен')

    await openPro(page, 'disabled')
    await capture(page, writer, {
      name: '10-blocked-disabled.png',
      marker: '[data-testid="pro-blocked-state"]',
      label: 'Pro: функция отключена (404)',
    })
    await expect(page.locator('[data-testid="pro-blocked-state"]')).toContainText('Функция пока отключена')

    console.log(`Pro доступ:\n${describeFrames(writer)}`)
  })

  test('недостаточно данных, кризисный ответ и конфликт сборки', async ({ page }) => {
    const writer = createEvidenceWriter({ dir: OUT_DIR })

    // Недостаточно данных (409 insufficient_data).
    await openPro(page, 'insufficient')
    await buildReport(page)
    await capture(page, writer, {
      name: '11-insufficient.png',
      marker: '[data-testid="pro-insufficient-state"]',
      label: 'Pro: недостаточно данных',
    })

    // Кризисный ответ (200 crisis) — разбор не собирается.
    await openPro(page, 'crisis')
    await buildReport(page)
    await expect(page.getByText('Похоже, сейчас тебе по-настоящему тяжело')).toBeVisible()
    await capture(page, writer, {
      name: '12-crisis.png',
      marker: '.mx-page-title',
      label: 'Pro: кризисный ответ',
    })

    // Конфликт сборки: POST отвечает 409, разбор доходит ограниченным GET.
    await openPro(page, 'conflict')
    await buildReport(page)
    await capture(page, writer, {
      name: '13-conflict-ready.png',
      marker: '[data-testid="pro-open-plan"]',
      label: 'Pro: сборка после 409 завершилась',
    })

    console.log(`Pro состояния:\n${describeFrames(writer)}`)
  })

  test('конфликт пересборки и конфликт версий сохраняют план и ввод', async ({
    page,
  }) => {
    const writer = createEvidenceWriter({ dir: OUT_DIR })

    // Конфликт пересборки: план уже собран и изменён на сервере.
    await openPro(page, 'rebuild_conflict')
    await buildPlan(page)
    page.on('dialog', dialog => dialog.accept())
    await page.getByTestId('pro-rebuild-plan').click()
    await expect(page.getByText('Пересборка не выполнена')).toBeVisible()
    await capture(page, writer, {
      name: '14-rebuild-conflict.png',
      marker: '[data-testid="pro-plan-progress"]',
      label: 'Pro: конфликт пересборки',
    })

    // Конфликт версий: правка не сохраняется, введённый текст остаётся.
    await openPro(page, 'version_conflict')
    await buildPlan(page)
    await page.getByTestId('pro-day-1-edit').click()
    await page.getByTestId('pro-plan-edit-input').fill('Проверка сохранения ввода при конфликте')
    await page.getByTestId('pro-plan-edit-save').click()
    await expect(page.getByTestId('pro-conflict-card')).toBeVisible()
    await capture(page, writer, {
      name: '15-version-conflict.png',
      marker: '[data-testid="pro-conflict-card"]',
      label: 'Pro: конфликт версий, ввод сохранён',
    })
    await expect(page.getByTestId('pro-plan-edit-input')).toHaveValue(
      'Проверка сохранения ввода при конфликте'
    )

    console.log(`Pro конфликты:\n${describeFrames(writer)}`)
  })
})
