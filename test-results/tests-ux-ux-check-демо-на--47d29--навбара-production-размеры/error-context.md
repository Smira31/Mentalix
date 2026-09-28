# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/ux-check.spec.mjs >> демо на реальном телефоне 440×956 — капсула активной вкладки, сворачивание навбара, production-размеры
- Location: tests/ux/ux-check.spec.mjs:1343:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/?demo=1
Call log:
  - navigating to "http://127.0.0.1:4173/?demo=1", waiting until "load"

```

# Test source

```ts
  1262 |     colorScheme: 'dark',
  1263 |     reducedMotion: 'reduce',
  1264 |     serviceWorkers: 'block',
  1265 |   })
  1266 |   await context.addInitScript(user => {
  1267 |     localStorage.clear()
  1268 |     sessionStorage.clear()
  1269 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1270 |     localStorage.setItem('mx-onboarded-v2', '1')
  1271 |     localStorage.setItem('mx-app-lock-enabled', '0')
  1272 |   }, TEST_USER)
  1273 |   // Автоповтор Today переживает кратковременный сбой без участия
  1274 |   // пользователя: ускоряем задержки, чтобы 4 попытки уложились в тест.
  1275 |   await context.addInitScript(() => {
  1276 |     window.__MX_TODAY_RETRY_DELAYS_MS__ = [0, 0, 0]
  1277 |   })
  1278 |   let ritualsRequests = 0
  1279 |   await context.route('**/api/**', route => {
  1280 |     const pathname = new URL(route.request().url()).pathname
  1281 |     if (route.request().method() === 'GET' && pathname === '/api/rituals') {
  1282 |       ritualsRequests += 1
  1283 |       if (ritualsRequests <= 3) {
  1284 |         return route.fulfill(jsonResponse({ error: 'temporary fixture failure' }, 503))
  1285 |       }
  1286 |     }
  1287 |     return route.fulfill(fixtureFor(route.request()))
  1288 |   })
  1289 |   const page = await context.newPage()
  1290 |   await freezePageTime(page)
  1291 |   await page.goto('/')
  1292 |   // 3 попытки падают (503 — повторяемая), 4-я успешна: данные дня
  1293 |   // загружаются, пустой cache snapshot не создаётся, экран ошибки не нужен.
  1294 |   await expect.poll(() => ritualsRequests).toBe(4)
  1295 |   await expect(page.getByRole('alert')).toHaveCount(0)
  1296 |   await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible()
  1297 |   await context.close()
  1298 | })
  1299 | 
  1300 | test('Evening Review проходится real touch tap на 390x844', async ({ browser, baseURL }) => {
  1301 |   const context = await browser.newContext({
  1302 |     baseURL,
  1303 |     viewport: { width: 390, height: 844 },
  1304 |     isMobile: true,
  1305 |     hasTouch: true,
  1306 |     colorScheme: 'dark',
  1307 |     reducedMotion: 'reduce',
  1308 |     serviceWorkers: 'block',
  1309 |   })
  1310 |   await context.addInitScript(user => {
  1311 |     localStorage.clear()
  1312 |     sessionStorage.clear()
  1313 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1314 |     localStorage.setItem('mx-onboarded-v2', '1')
  1315 |     localStorage.setItem('mx-app-lock-enabled', '0')
  1316 |   }, TEST_USER)
  1317 |   await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  1318 |   const page = await context.newPage()
  1319 |   await freezePageTime(page)
  1320 |   await page.goto('/?ui_lab=experiments')
  1321 | 
  1322 |   const entryCta = page.getByRole('button', { name: 'Разобрать день' }).last()
  1323 |   await expect(entryCta).toBeVisible()
  1324 |   await entryCta.tap()
  1325 |   await expect(page.getByText('Фактический результат')).toBeVisible()
  1326 | 
  1327 |   for (const option of [
  1328 |     'Сделал главное',
  1329 |     'Ясность',
  1330 |     'Маленький шаг помогает',
  1331 |     'Начать с пяти минут',
  1332 |   ]) {
  1333 |     await page.getByRole('radio', { name: option }).tap()
  1334 |     await page.getByRole('button', { name: /Дальше|Закрыть день/ }).tap()
  1335 |   }
  1336 | 
  1337 |   await expect(page.getByText('День закрыт')).toBeVisible()
  1338 |   await page.locator('.mx-evening-review__closed').getByRole('button', { name: 'Продолжить' }).tap()
  1339 |   await expect(page.getByRole('button', { name: 'Разобрать день' }).last()).toBeVisible()
  1340 |   await context.close()
  1341 | })
  1342 | 
  1343 | test('демо на реальном телефоне 440×956 — капсула активной вкладки, сворачивание навбара, production-размеры', async ({
  1344 |   browser,
  1345 | }) => {
  1346 |   const context = await browser.newContext({
  1347 |     baseURL: 'http://127.0.0.1:4173',
  1348 |     viewport: { width: 440, height: 956 },
  1349 |     isMobile: true,
  1350 |     hasTouch: true,
  1351 |     colorScheme: 'dark',
  1352 |     reducedMotion: 'reduce',
  1353 |     serviceWorkers: 'block',
  1354 |   })
  1355 | 
  1356 |   // В демо-режиме API перехватывается демо-данными (demoRequest в demoMode.js).
  1357 |   await context.route('**/api/**', route =>
  1358 |     route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  1359 |   )
  1360 | 
  1361 |   const page = await context.newPage()
> 1362 |   await page.goto('/?demo=1')
       |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/?demo=1
  1363 | 
  1364 |   // Дождаться загрузки приложения
  1365 |   await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible({ timeout: 15_000 })
  1366 | 
  1367 |   // data-mentalix-demo-frame не должен быть установлен на реальном телефоне
  1368 |   // (иначе активная вкладка прозрачная, nav полноширинный, заголовки скрыты)
  1369 |   const shell = page.locator('.mx-app-shell')
  1370 |   await expect(shell).not.toHaveAttribute('data-mentalix-demo-frame', 'true')
  1371 | 
  1372 |   // 1. Активная вкладка имеет видимую капсулу (не прозрачный фон)
  1373 |   const activeTab = page.locator('.mx-bottom-nav > div nav button.is-active').first()
  1374 |   await expect(activeTab).toBeVisible()
  1375 |   const activeBg = await activeTab.evaluate(el => getComputedStyle(el).backgroundColor)
  1376 |   expect(activeBg, 'активная вкладка должна иметь видимый фон-капсулу').not.toBe('rgba(0, 0, 0, 0)')
  1377 |   expect(activeBg, 'активная вкладка не должна быть прозрачной').not.toBe('transparent')
  1378 | 
  1379 |   // 2. Размеры кнопки профиля 43×43 (±1) и отступ контента 21 (±1)
  1380 |   const profileButton = page.getByTestId('today-profile-button')
  1381 |   await expect(profileButton).toBeVisible()
  1382 |   const profileBox = await profileButton.boundingBox()
  1383 |   expect(Math.abs(profileBox.width - 43), 'ширина кнопки профиля ≈ 43px').toBeLessThanOrEqual(1)
  1384 |   expect(Math.abs(profileBox.height - 43), 'высота кнопки профиля ≈ 43px').toBeLessThanOrEqual(1)
  1385 |   // Отступ от правого края экрана до кнопки профиля = --mx-header-edge (21px)
  1386 |   const rightOffset = 440 - (profileBox.x + profileBox.width)
  1387 |   expect(Math.abs(rightOffset - 21), 'отступ контента ≈ 21px').toBeLessThanOrEqual(1)
  1388 | 
  1389 |   // 3. После прокрутки вниз на 600px навбар сворачивается.
  1390 |   // Демо-контент при 440px может не переполнять scroll-root, поэтому
  1391 |   // добавляем spacer, чтобы гарантировать возможность прокрутки.
  1392 |   await page.evaluate(() => {
  1393 |     const content = document.querySelector('.mx-app-scroll-root > div')
  1394 |     if (content) {
  1395 |       const spacer = document.createElement('div')
  1396 |       spacer.style.height = '800px'
  1397 |       spacer.style.width = '100%'
  1398 |       spacer.setAttribute('data-testid', 'scroll-test-spacer')
  1399 |       content.appendChild(spacer)
  1400 |     }
  1401 |     const root = document.querySelector('.mx-app-scroll-root')
  1402 |     if (root) {
  1403 |       root.scrollTop = 600
  1404 |       root.dispatchEvent(new Event('scroll', { bubbles: true }))
  1405 |     }
  1406 |   })
  1407 |   await expect(
  1408 |     page.locator('.mx-bottom-nav.mx-demo-bottom-nav--collapsed'),
  1409 |     'навбар должен свернуться после прокрутки вниз'
  1410 |   ).toHaveCount(1, { timeout: 5_000 })
  1411 | 
  1412 |   // 4. После прокрутки вверх навбар раскрывается
  1413 |   await page.evaluate(() => {
  1414 |     const root = document.querySelector('.mx-app-scroll-root')
  1415 |     if (root) {
  1416 |       root.scrollTop = 0
  1417 |       root.dispatchEvent(new Event('scroll', { bubbles: true }))
  1418 |     }
  1419 |   })
  1420 |   await expect(
  1421 |     page.locator('.mx-bottom-nav.mx-demo-bottom-nav--collapsed'),
  1422 |     'навбар должен раскрыться после прокрутки вверх'
  1423 |   ).toHaveCount(0, { timeout: 5_000 })
  1424 | 
  1425 |   await context.close()
  1426 | })
  1427 | 
```