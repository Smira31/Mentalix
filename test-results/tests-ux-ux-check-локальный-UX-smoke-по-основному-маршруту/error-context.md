# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/ux-check.spec.mjs >> локальный UX smoke по основному маршруту
- Location: tests/ux/ux-check.spec.mjs:435:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  376 |   } catch (error) {
  377 |     status = 'fail'
  378 |     reason = sanitizeReason(error)
  379 |     if (
  380 |       RUN_VISUAL_SNAPSHOTS &&
  381 |       VISUAL_ANCHOR_SLUGS.has(slug) &&
  382 |       String(error?.message || '').includes('to have screenshot')
  383 |     ) {
  384 |       status = 'visual_diff'
  385 |     }
  386 |   }
  387 | 
  388 |   await mkdir(path.dirname(screenshotAbsolute), { recursive: true })
  389 | 
  390 |   try {
  391 |     await page.screenshot({ path: screenshotAbsolute, fullPage: false })
  392 |   } catch (error) {
  393 |     status = 'fail'
  394 |     reason = `Не удалось сохранить screenshot: ${sanitizeReason(error)}`
  395 |   }
  396 | 
  397 |   results.push({
  398 |     screen,
  399 |     viewport: viewport.name,
  400 |     status,
  401 |     reason,
  402 |     screenshot: screenshotRelative.replaceAll('\\', '/'),
  403 |   })
  404 | 
  405 |   runtimeErrors.length = 0
  406 | }
  407 | 
  408 | function buildReport(results) {
  409 |   const rows = results.map(
  410 |     result =>
  411 |       `| ${result.screen} | ${result.viewport} | ${result.status} | ${result.reason} | [${result.screenshot}](${result.screenshot}) |`
  412 |   )
  413 |   const failed = results.filter(result => result.status === 'fail').length
  414 | 
  415 |   return (
  416 |     `# Mentalix UX check\n\n` +
  417 |     `Результат: **${failed === 0 ? 'PASS' : 'FAIL'}** — ${results.length - failed}/${results.length} экранов прошли проверки.\n\n` +
  418 |     `| Экран | Viewport | Статус | Причина | Screenshot |\n` +
  419 |     `| --- | --- | --- | --- | --- |\n` +
  420 |     `${rows.join('\n')}\n\n` +
  421 |     `## Что проверяет автоматический gate\n\n` +
  422 |     `- локальный web-маршрут на детерминированных fixtures без запросов к production API;\n` +
  423 |     `- отсутствие горизонтального overflow и пустого экрана;\n` +
  424 |     `- границы корневого контента внутри viewport;\n` +
  425 |     `- отсутствие пересечения видимых критических CTA с нижней навигацией;\n` +
  426 |     `- отсутствие page runtime errors и console.error;\n` +
  427 |     `- доступность ожидаемых интерактивных элементов;\n` +
  428 |     `- disabled/«Скоро» элементы в Practices и Library не открываются;\n` +
  429 |     `- визуальное сравнение восьми anchor-состояний на четырёх mobile viewport.\n\n` +
  430 |     `## Обязательный ручной iPhone gate\n\n` +
  431 |     `Этот отчёт не является доказательством корректности Telegram safe-area, iOS keyboard, fullscreen Telegram, swipe physics или WebView performance. Эти пять областей нужно проверять вручную на реальном iPhone внутри Telegram.\n`
  432 |   )
  433 | }
  434 | 
  435 | test('локальный UX smoke по основному маршруту', async ({ browser, baseURL }) => {
  436 |   test.setTimeout(300_000)
  437 | 
  438 |   await rm(ARTIFACT_ROOT, { recursive: true, force: true })
  439 |   await mkdir(ARTIFACT_ROOT, { recursive: true })
  440 | 
  441 |   const results = []
  442 | 
  443 |   for (const viewport of VIEWPORTS) {
  444 |     const context = await browser.newContext({
  445 |       baseURL,
  446 |       viewport: { width: viewport.width, height: viewport.height },
  447 |       colorScheme: 'dark',
  448 |       reducedMotion: 'reduce',
  449 |       serviceWorkers: 'block',
  450 |     })
  451 | 
  452 |     await context.addInitScript(user => {
  453 |       localStorage.clear()
  454 |       sessionStorage.clear()
  455 |       localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  456 |       localStorage.setItem('mx-onboarded-v2', '1')
  457 |       localStorage.setItem('mx-app-lock-enabled', '0')
  458 |     }, TEST_USER)
  459 | 
  460 |     await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  461 | 
  462 |     const page = await context.newPage()
  463 |     await freezePageTime(page)
  464 |     const runtimeErrors = []
  465 | 
  466 |     page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  467 |     page.on('console', message => {
  468 |       if (
  469 |         message.type() === 'error' &&
  470 |         !message.text().includes('CloudStorage is not supported in version 6.0')
  471 |       ) {
  472 |         runtimeErrors.push(`console.error: ${message.text()}`)
  473 |       }
  474 |     })
  475 | 
> 476 |     await page.goto('/')
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  477 |     await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible()
  478 | 
  479 |     await captureScreen({
  480 |       page,
  481 |       viewport,
  482 |       screen: 'Today',
  483 |       slug: '01-today',
  484 |       runtimeErrors,
  485 |       results,
  486 |       check: async () => {
  487 |         const checkin = page.getByRole('button', { name: /Утренний чек-ин/ })
  488 |         await assertClickable(checkin)
  489 |       },
  490 |     })
  491 | 
  492 |     await page.getByRole('button', { name: /Утренний чек-ин/ }).click()
  493 |     await captureScreen({
  494 |       page,
  495 |       viewport,
  496 |       screen: 'Check-in',
  497 |       slug: '02-check-in',
  498 |       runtimeErrors,
  499 |       results,
  500 |       check: async () => {
  501 |         // На первом morning Check-in шаге BackButton имеет label «Сегодня»;
  502 |         // на остальных состояниях flow может сохраняться label «Назад».
  503 |         await assertClickable(page.getByRole('button', { name: /^(Назад|Сегодня)$/ }))
  504 |         await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
  505 |       },
  506 |     })
  507 | 
  508 |     // Scale answers advance only after pressing the main «Далее» button.
  509 |     // Порядок: mood → sleep_quality → energy → focus
  510 |     for (const option of ['Нормально', 'Нормально', 'Средне', 'Держусь']) {
  511 |       const answer = page.getByRole('radio', { name: new RegExp(`^3: ${option}$`, 'i') })
  512 |       await expect(answer).toBeVisible()
  513 |       await expect(answer).toBeEnabled()
  514 |       await answer.click()
  515 |       await assertClickable(page.getByRole('button', { name: 'Далее' }))
  516 |       await page.getByRole('button', { name: 'Далее' }).click()
  517 |     }
  518 | 
  519 |     // Главный фокус дня (необязательный текстовый шаг)
  520 |     const dayFocusInput = page.locator('[data-testid="checkin-day-focus-input"]')
  521 |     await expect(dayFocusInput).toBeVisible()
  522 |     await dayFocusInput.fill('Фокус дня')
  523 |     await assertClickable(page.getByRole('button', { name: 'Далее' }))
  524 |     await page.getByRole('button', { name: 'Далее' }).click()
  525 | 
  526 |     await captureScreen({
  527 |       page,
  528 |       viewport,
  529 |       screen: 'Check-in writer',
  530 |       slug: '02b-check-in-writer',
  531 |       runtimeErrors,
  532 |       results,
  533 |       check: async () => {
  534 |         const editor = page.getByRole('textbox', { name: 'Что на уме' })
  535 |         await expect(editor).toBeVisible()
  536 |         await editor.pressSequentially('Спокойное утро')
  537 |         await assertClickable(page.getByRole('button', { name: 'Показать форматирование' }))
  538 |         await assertClickable(page.getByRole('button', { name: 'Пойти глубже' }))
  539 |         await expect(page.getByRole('button', { name: 'Завершить' })).toHaveCount(1)
  540 |         await assertClickable(page.getByRole('button', { name: 'Завершить' }))
  541 |       },
  542 |     })
  543 |     // После editor-шага общий BackButton использует label «Сегодня»;
  544 |     // на остальных состояниях flow сохраняется label «Назад».
  545 |     const checkinBackButton = page.getByRole('button', { name: /^(Назад|Сегодня)$/ })
  546 |     await expect(checkinBackButton).toBeVisible()
  547 |     await expect(checkinBackButton).toBeEnabled()
  548 |     await checkinBackButton.click()
  549 |     await expect(page.getByRole('heading', { name: 'Главный фокус дня' })).toBeVisible()
  550 |     await checkinBackButton.click()
  551 |     await expect(page.getByRole('heading', { name: 'Уровень концентрации' })).toBeVisible()
  552 |     await checkinBackButton.click()
  553 |     await expect(page.getByRole('heading', { name: 'Сколько в тебе энергии?' })).toBeVisible()
  554 |     await checkinBackButton.click()
  555 |     await expect(page.getByRole('heading', { name: 'Как ты спал?' })).toBeVisible()
  556 |     await checkinBackButton.click()
  557 |     await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
  558 |     await checkinBackButton.click()
  559 | 
  560 |     const draftDialog = page.locator(
  561 |       '[role="dialog"][aria-labelledby="checkin-draft-dialog-title"]'
  562 |     )
  563 |     await expect(draftDialog).toHaveCount(0)
  564 |     await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible()
  565 | 
  566 |     await page.getByRole('button', { name: /о меньшем усилии/ }).click()
  567 |     // Карусель темы недели: CTA «Начать запись» открывает ThemeScreen
  568 |     await page.getByTestId('theme-carousel-cta').click()
  569 |     await captureScreen({
  570 |       page,
  571 |       viewport,
  572 |       screen: 'Theme journal',
  573 |       slug: '03-theme-journal',
  574 |       runtimeErrors,
  575 |       results,
  576 |       check: async () => {
```