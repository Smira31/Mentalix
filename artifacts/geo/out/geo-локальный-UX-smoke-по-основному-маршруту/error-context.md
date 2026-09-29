# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: geo.spec.mjs >> локальный UX smoke по основному маршруту
- Location: artifacts/geo/geo.spec.mjs:430:1

# Error details

```
Error: UX check: 320x568/Rituals

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 9

- Array []
+ Array [
+   Object {
+     "reason": "Нижняя навигация перекрывает CTA «+ Новый ритуал»",
+     "screen": "Rituals",
+     "screenshot": "320x568/04-rituals.png",
+     "status": "fail",
+     "viewport": "320x568",
+   },
+ ]
```

# Test source

```ts
  751 |     await page.getByRole('button', { name: 'Открыть ритуалы' }).click()
  752 |     await captureScreen({
  753 |       page,
  754 |       viewport,
  755 |       screen: 'Rituals',
  756 |       slug: '04-rituals',
  757 |       runtimeErrors,
  758 |       results,
  759 |       check: async () => {
  760 |         await expect(page.getByRole('heading', { name: 'ритуалы.' })).toBeVisible()
  761 |         await assertClickable(page.getByRole('button', { name: 'Создать ритуал' }))
  762 |       },
  763 |     })
  764 |     await page.getByRole('button', { name: 'Назад' }).click()
  765 |     const todayNavButton = page.locator('nav[aria-hidden="false"] > button[aria-label="Сегодня"]')
  766 |     await todayNavButton.click()
  767 |     await expect(todayNavButton).toHaveAttribute('aria-current', 'page')
  768 |     await page.getByRole('button', { name: 'Шаги' }).click()
  769 |     await expect(page.getByRole('heading', { name: 'шаги.' })).toBeVisible()
  770 | 
  771 |     await page.getByRole('button', { name: /Аскезы.*Выбранные ограничения/ }).click()
  772 |     await page.getByRole('button', { name: 'Открыть аскезы' }).click()
  773 |     await captureScreen({
  774 |       page,
  775 |       viewport,
  776 |       screen: 'Ascezas',
  777 |       slug: '05-ascezas',
  778 |       runtimeErrors,
  779 |       results,
  780 |       check: async () => {
  781 |         await expect(page.getByRole('heading', { name: 'аскезы.' })).toBeVisible()
  782 |         await assertClickable(page.getByRole('button', { name: 'Принять аскезу' }))
  783 |       },
  784 |     })
  785 |     await page.getByRole('button', { name: 'Назад' }).click()
  786 |     await todayNavButton.click()
  787 |     await expect(todayNavButton).toHaveAttribute('aria-current', 'page')
  788 |     await page.getByRole('button', { name: 'Шаги' }).click()
  789 |     await expect(page.getByRole('heading', { name: 'шаги.' })).toBeVisible()
  790 | 
  791 |     await expect(page.getByRole('button', { name: /Психологические практики/ })).toHaveCount(0)
  792 |     await page.getByRole('button', { name: 'Библиотека' }).click()
  793 |     await captureScreen({
  794 |       page,
  795 |       viewport,
  796 |       screen: 'Library',
  797 |       slug: '07-library',
  798 |       runtimeErrors,
  799 |       results,
  800 |       check: async () => {
  801 |         await expect(page.getByRole('heading', { name: 'библиотека.' })).toBeVisible()
  802 |         await expect(page.getByRole('button', { name: 'Открыть поиск' })).toHaveCount(0)
  803 |         await assertLibrarySoonControl(page)
  804 |       },
  805 |     })
  806 | 
  807 |     await page.getByRole('button', { name: 'Прогресс' }).click()
  808 |     await captureScreen({
  809 |       page,
  810 |       viewport,
  811 |       screen: 'Trends',
  812 |       slug: '08-trends',
  813 |       runtimeErrors,
  814 |       results,
  815 |       check: async () => {
  816 |         await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeAttached()
  817 |         await expect(page.getByRole('button', { name: 'Прогресс' })).toHaveAttribute(
  818 |           'aria-current',
  819 |           'page'
  820 |         )
  821 |       },
  822 |     })
  823 | 
  824 |     await context.close()
  825 |   }
  826 | 
  827 |   await writeFile(path.join(ARTIFACT_ROOT, 'report.md'), buildReport(results), 'utf8')
  828 | 
  829 |   const visualDiffs = results
  830 |     .filter(result => result.status === 'visual_diff')
  831 |     .map(result => {
  832 |       const slug = result.screenshot.replace(/^[^/]+\//, '').replace(/\.png$/, '')
  833 |       return {
  834 |         screen: result.screen,
  835 |         slug,
  836 |         viewport: result.viewport,
  837 |         actual: result.screenshot,
  838 |         reason: result.reason,
  839 |       }
  840 |     })
  841 |   await writeFile(
  842 |     path.join(ARTIFACT_ROOT, 'visual-diffs.json'),
  843 |     JSON.stringify({ diffs: visualDiffs }, null, 2),
  844 |     'utf8'
  845 |   )
  846 | 
  847 |   const failed = results.filter(result => result.status === 'fail')
  848 |   expect(
  849 |     failed,
  850 |     `UX check: ${failed.map(item => `${item.viewport}/${item.screen}`).join(', ')}`
> 851 |   ).toEqual([])
      |     ^ Error: UX check: 320x568/Rituals
  852 | })
  853 | 
  854 | test('Mentor PersonaPicker сохраняет тематическую рамку без pager и gap под навигацией', async ({
  855 |   browser,
  856 |   baseURL,
  857 | }) => {
  858 |   const layouts = [
  859 |     ...VIEWPORTS,
  860 |     { name: '393x852', width: 393, height: 852 }, // iPhone 16
  861 |     { name: '402x874', width: 402, height: 874 }, // iPhone 16 Pro
  862 |     { name: '430x932', width: 430, height: 932 }, // iPhone 16 Pro Max
  863 |     { name: '768x1024', width: 768, height: 1024 },
  864 |     { name: '1280x800', width: 1280, height: 800 },
  865 |   ]
  866 | 
  867 |   for (const viewport of layouts) {
  868 |     const context = await browser.newContext({
  869 |       baseURL,
  870 |       viewport: { width: viewport.width, height: viewport.height },
  871 |       colorScheme: 'dark',
  872 |       reducedMotion: 'reduce',
  873 |       serviceWorkers: 'block',
  874 |     })
  875 | 
  876 |     await context.addInitScript(user => {
  877 |       localStorage.clear()
  878 |       sessionStorage.clear()
  879 |       localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  880 |       localStorage.setItem('mx-onboarded-v2', '1')
  881 |       localStorage.setItem('mx-app-lock-enabled', '0')
  882 |     }, TEST_USER)
  883 | 
  884 |     await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  885 | 
  886 |     const page = await context.newPage()
  887 |     await freezePageTime(page)
  888 |     const runtimeErrors = []
  889 |     page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  890 |     page.on('console', message => {
  891 |       if (
  892 |         message.type() === 'error' &&
  893 |         !message.text().includes('CloudStorage is not supported in version 6.0')
  894 |       ) {
  895 |         runtimeErrors.push(`console.error: ${message.text()}`)
  896 |       }
  897 |     })
  898 | 
  899 |     await page.goto('/')
  900 |     await page.getByRole('button', { name: 'Диалог' }).click()
  901 |     await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
  902 |     await expect(page.getByRole('heading', { name: /Выбери роль/ })).toBeVisible()
  903 |     const cards = page.getByTestId('mentor-persona-card')
  904 |     await expect(cards).toHaveCount(3)
  905 |     const cardGeometry = await cards.first().evaluate(element => {
  906 |       const rect = element.getBoundingClientRect()
  907 |       return { y: rect.y, width: rect.width, height: rect.height }
  908 |     })
  909 |     expect(cardGeometry.width, 'Карточка должна оставаться компактной').toBeGreaterThanOrEqual(190)
  910 |     expect(cardGeometry.width, 'Карточка не должна становиться dashboard-like').toBeLessThanOrEqual(
  911 |       204
  912 |     )
  913 |     expect(cardGeometry.height, 'Карточка должна иметь устойчивую высоту').toBeGreaterThan(200)
  914 |     expect(
  915 |       await cards.evaluateAll(elements =>
  916 |         elements.map(element => getComputedStyle(element).borderTopWidth)
  917 |       )
  918 |     ).toEqual(['1px', '1px', '1px'])
  919 |     await expect(page.getByRole('group', { name: 'Выбор роли' })).toHaveCount(0)
  920 |     const navigationBox = await page.locator('nav').locator('..').locator('..').boundingBox()
  921 |     expect(navigationBox).not.toBeNull()
  922 |     expect(
  923 |       Math.abs(navigationBox.y + navigationBox.height - viewport.height),
  924 |       'BottomNavigation должна доходить до нижнего края viewport без legacy gap'
  925 |     ).toBeLessThanOrEqual(0.5)
  926 |     expect(
  927 |       navigationBox.y - (cardGeometry.y + cardGeometry.height),
  928 |       'Карточка должна заканчиваться с небольшим зазором до BottomNavigation'
  929 |     ).toBeGreaterThanOrEqual(15)
  930 |     expect(
  931 |       navigationBox.y - (cardGeometry.y + cardGeometry.height),
  932 |       'Карточка не должна оставаться далеко от BottomNavigation'
  933 |     ).toBeLessThanOrEqual(17)
  934 | 
  935 |     if (viewport.width <= 430) {
  936 |       const track = page.getByTestId('mentor-persona-track')
  937 |       // pan-x pan-y: горизонтальный свайп карусели + вертикальная прокрутка
  938 |       // (anti-zoom: pan-y глобально, pan-x добавлен точечно для каруселей)
  939 |       await expect(track).toHaveCSS('touch-action', 'pan-x pan-y')
  940 |       const cardWidth = await cards
  941 |         .first()
  942 |         .evaluate(element => element.getBoundingClientRect().width)
  943 |       await track.evaluate((element, scrollLeft) => {
  944 |         element.scrollLeft = scrollLeft
  945 |         element.dispatchEvent(new Event('scroll'))
  946 |       }, cardWidth + 12)
  947 |       await expect(cards.nth(1)).toHaveAttribute('aria-current', 'true')
  948 |     }
  949 | 
  950 |     const cardTextGeometry = await cards.evaluateAll(elements =>
  951 |       elements.map(element => {
```