# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/ux-check.spec.mjs >> Mentor PersonaPicker сохраняет тематическую рамку без pager и gap под навигацией
- Location: tests/ux/ux-check.spec.mjs:861:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  806  |       results,
  807  |       check: async () => {
  808  |         await expect(page.getByRole('heading', { name: 'библиотека.' })).toBeVisible()
  809  |         await expect(page.getByRole('button', { name: 'Открыть поиск' })).toHaveCount(0)
  810  |         await assertLibrarySoonControl(page)
  811  |       },
  812  |     })
  813  | 
  814  |     await page.getByRole('button', { name: 'Прогресс' }).click()
  815  |     await captureScreen({
  816  |       page,
  817  |       viewport,
  818  |       screen: 'Trends',
  819  |       slug: '08-trends',
  820  |       runtimeErrors,
  821  |       results,
  822  |       check: async () => {
  823  |         await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeAttached()
  824  |         await expect(page.getByRole('button', { name: 'Прогресс' })).toHaveAttribute(
  825  |           'aria-current',
  826  |           'page'
  827  |         )
  828  |       },
  829  |     })
  830  | 
  831  |     await context.close()
  832  |   }
  833  | 
  834  |   await writeFile(path.join(ARTIFACT_ROOT, 'report.md'), buildReport(results), 'utf8')
  835  | 
  836  |   const visualDiffs = results
  837  |     .filter(result => result.status === 'visual_diff')
  838  |     .map(result => {
  839  |       const slug = result.screenshot.replace(/^[^/]+\//, '').replace(/\.png$/, '')
  840  |       return {
  841  |         screen: result.screen,
  842  |         slug,
  843  |         viewport: result.viewport,
  844  |         actual: result.screenshot,
  845  |         reason: result.reason,
  846  |       }
  847  |     })
  848  |   await writeFile(
  849  |     path.join(ARTIFACT_ROOT, 'visual-diffs.json'),
  850  |     JSON.stringify({ diffs: visualDiffs }, null, 2),
  851  |     'utf8'
  852  |   )
  853  | 
  854  |   const failed = results.filter(result => result.status === 'fail')
  855  |   expect(
  856  |     failed,
  857  |     `UX check: ${failed.map(item => `${item.viewport}/${item.screen}`).join(', ')}`
  858  |   ).toEqual([])
  859  | })
  860  | 
  861  | test('Mentor PersonaPicker сохраняет тематическую рамку без pager и gap под навигацией', async ({
  862  |   browser,
  863  |   baseURL,
  864  | }) => {
  865  |   const layouts = [
  866  |     ...VIEWPORTS,
  867  |     { name: '393x852', width: 393, height: 852 }, // iPhone 16
  868  |     { name: '402x874', width: 402, height: 874 }, // iPhone 16 Pro
  869  |     { name: '430x932', width: 430, height: 932 }, // iPhone 16 Pro Max
  870  |     { name: '768x1024', width: 768, height: 1024 },
  871  |     { name: '1280x800', width: 1280, height: 800 },
  872  |   ]
  873  | 
  874  |   for (const viewport of layouts) {
  875  |     const context = await browser.newContext({
  876  |       baseURL,
  877  |       viewport: { width: viewport.width, height: viewport.height },
  878  |       colorScheme: 'dark',
  879  |       reducedMotion: 'reduce',
  880  |       serviceWorkers: 'block',
  881  |     })
  882  | 
  883  |     await context.addInitScript(user => {
  884  |       localStorage.clear()
  885  |       sessionStorage.clear()
  886  |       localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  887  |       localStorage.setItem('mx-onboarded-v2', '1')
  888  |       localStorage.setItem('mx-app-lock-enabled', '0')
  889  |     }, TEST_USER)
  890  | 
  891  |     await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  892  | 
  893  |     const page = await context.newPage()
  894  |     await freezePageTime(page)
  895  |     const runtimeErrors = []
  896  |     page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  897  |     page.on('console', message => {
  898  |       if (
  899  |         message.type() === 'error' &&
  900  |         !message.text().includes('CloudStorage is not supported in version 6.0')
  901  |       ) {
  902  |         runtimeErrors.push(`console.error: ${message.text()}`)
  903  |       }
  904  |     })
  905  | 
> 906  |     await page.goto('/')
       |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  907  |     await page.getByRole('button', { name: 'Диалог' }).click()
  908  |     await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
  909  |     await expect(page.getByRole('heading', { name: /Выбери роль/ })).toBeVisible()
  910  |     const cards = page.getByTestId('mentor-persona-card')
  911  |     await expect(cards).toHaveCount(3)
  912  |     const cardGeometry = await cards.first().evaluate(element => {
  913  |       const rect = element.getBoundingClientRect()
  914  |       return { y: rect.y, width: rect.width, height: rect.height }
  915  |     })
  916  |     expect(cardGeometry.width, 'Карточка должна оставаться компактной').toBeGreaterThanOrEqual(190)
  917  |     expect(cardGeometry.width, 'Карточка не должна становиться dashboard-like').toBeLessThanOrEqual(
  918  |       204
  919  |     )
  920  |     expect(cardGeometry.height, 'Карточка должна иметь устойчивую высоту').toBeGreaterThan(200)
  921  |     expect(
  922  |       await cards.evaluateAll(elements =>
  923  |         elements.map(element => getComputedStyle(element).borderTopWidth)
  924  |       )
  925  |     ).toEqual(['1px', '1px', '1px'])
  926  |     await expect(page.getByRole('group', { name: 'Выбор роли' })).toHaveCount(0)
  927  |     const navigationBox = await page.locator('nav').locator('..').locator('..').boundingBox()
  928  |     expect(navigationBox).not.toBeNull()
  929  |     expect(
  930  |       Math.abs(navigationBox.y + navigationBox.height - viewport.height),
  931  |       'BottomNavigation должна доходить до нижнего края viewport без legacy gap'
  932  |     ).toBeLessThanOrEqual(0.5)
  933  |     expect(
  934  |       navigationBox.y - (cardGeometry.y + cardGeometry.height),
  935  |       'Карточка должна заканчиваться с небольшим зазором до BottomNavigation'
  936  |     ).toBeGreaterThanOrEqual(15)
  937  |     expect(
  938  |       navigationBox.y - (cardGeometry.y + cardGeometry.height),
  939  |       'Карточка не должна оставаться далеко от BottomNavigation'
  940  |     ).toBeLessThanOrEqual(17)
  941  | 
  942  |     if (viewport.width <= 430) {
  943  |       const track = page.getByTestId('mentor-persona-track')
  944  |       // pan-x pan-y: горизонтальный свайп карусели + вертикальная прокрутка
  945  |       // (anti-zoom: pan-y глобально, pan-x добавлен точечно для каруселей)
  946  |       await expect(track).toHaveCSS('touch-action', 'pan-x pan-y')
  947  |       const cardWidth = await cards
  948  |         .first()
  949  |         .evaluate(element => element.getBoundingClientRect().width)
  950  |       await track.evaluate((element, scrollLeft) => {
  951  |         element.scrollLeft = scrollLeft
  952  |         element.dispatchEvent(new Event('scroll'))
  953  |       }, cardWidth + 12)
  954  |       await expect(cards.nth(1)).toHaveAttribute('aria-current', 'true')
  955  |     }
  956  | 
  957  |     const cardTextGeometry = await cards.evaluateAll(elements =>
  958  |       elements.map(element => {
  959  |         const cardRect = element.getBoundingClientRect()
  960  |         const textNodes = [...element.querySelectorAll('h3, p')]
  961  |         const textRects = textNodes
  962  |           .map(node => node.getBoundingClientRect())
  963  |           .filter(rect => rect.width > 0 && rect.height > 0)
  964  |         return {
  965  |           cardRight: cardRect.right,
  966  |           cardLeft: cardRect.left,
  967  |           textRight: Math.max(...textRects.map(rect => rect.right)),
  968  |           textLeft: Math.min(...textRects.map(rect => rect.left)),
  969  |           scrollWidth: element.scrollWidth,
  970  |           clientWidth: element.clientWidth,
  971  |         }
  972  |       })
  973  |     )
  974  |     for (const geometry of cardTextGeometry) {
  975  |       expect(
  976  |         geometry.textRight,
  977  |         'Текст не должен выходить за правую границу карточки'
  978  |       ).toBeLessThanOrEqual(geometry.cardRight + 0.5)
  979  |       expect(
  980  |         geometry.textLeft,
  981  |         'Текст не должен выходить за левую границу карточки'
  982  |       ).toBeGreaterThanOrEqual(geometry.cardLeft - 0.5)
  983  |       expect(
  984  |         geometry.scrollWidth,
  985  |         'Карточка не должна иметь горизонтального overflow'
  986  |       ).toBeLessThanOrEqual(geometry.clientWidth)
  987  |     }
  988  |     const mentorCard = cards.filter({ hasText: 'Наставник' })
  989  |     const sideCard = cards.filter({ hasText: 'Собеседник' })
  990  |     await sideCard.click()
  991  |     await expect(sideCard).toHaveAttribute('aria-current', 'true')
  992  |     await expect(mentorCard).not.toHaveAttribute('aria-current', 'true')
  993  |     await expect(page.getByText('История kompas')).toHaveCount(0)
  994  |     await expect(page.getByRole('button', { name: 'Назад' })).toHaveCount(0)
  995  | 
  996  |     await mentorCard.click()
  997  |     await expect(mentorCard).toHaveAttribute('aria-current', 'true')
  998  |     await expect(
  999  |       mentorCard.getByRole('button', { name: 'Начать разговор: Наставник' })
  1000 |     ).toBeVisible()
  1001 |     await expect(page.getByText('История kompas')).toHaveCount(0)
  1002 | 
  1003 |     await mentorCard.getByRole('button', { name: 'Начать разговор: Наставник' }).click()
  1004 |     await expect(page.getByText('История kompas')).toBeVisible()
  1005 |     await expect(page.getByText('История mayak')).toHaveCount(0)
  1006 |     await assertClickable(page.getByRole('button', { name: 'Назад' }))
```