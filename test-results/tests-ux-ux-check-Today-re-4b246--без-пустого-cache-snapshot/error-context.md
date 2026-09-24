# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/ux-check.spec.mjs >> Today retry после критичного сбоя повторно загружает данные без пустого cache snapshot
- Location: tests/ux/ux-check.spec.mjs:1106:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1037 |     serviceWorkers: 'block',
  1038 |   })
  1039 |   await context.addInitScript(() => {
  1040 |     localStorage.clear()
  1041 |     sessionStorage.clear()
  1042 |   })
  1043 |
  1044 |   await context.route('**/api/**', async route => {
  1045 |     await route.fulfill(jsonResponse({ ok: true }))
  1046 |   })
  1047 |
  1048 |   const page = await context.newPage()
  1049 |   await freezePageTime(page)
  1050 |   await page.goto('/')
  1051 |
  1052 |   await expect(
  1053 |     page.getByRole('heading', { name: 'Продолжай расти даже вне приложения.' })
  1054 |   ).toBeVisible()
  1055 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  1056 |   await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  1057 |   await expect(page.locator('form')).toHaveCount(1)
  1058 |   await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  1059 |   await expect(page.getByRole('button', { name: 'Получить письмо' })).toBeVisible()
  1060 |   expect(await page.evaluate(() => localStorage.getItem('mentalix_web_user'))).toBeNull()
  1061 |
  1062 |   await context.close()
  1063 | })
  1064 |
  1065 | test('Today не маскирует ошибку критичного API под пустой список практик', async ({
  1066 |   browser,
  1067 |   baseURL,
  1068 | }) => {
  1069 |   const context = await browser.newContext({
  1070 |     baseURL,
  1071 |     viewport: { width: 390, height: 844 },
  1072 |     colorScheme: 'dark',
  1073 |     reducedMotion: 'reduce',
  1074 |     serviceWorkers: 'block',
  1075 |   })
  1076 |
  1077 |   await context.addInitScript(user => {
  1078 |     localStorage.clear()
  1079 |     sessionStorage.clear()
  1080 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1081 |     localStorage.setItem('mx-onboarded-v2', '1')
  1082 |     localStorage.setItem('mx-app-lock-enabled', '0')
  1083 |   }, TEST_USER)
  1084 |
  1085 |   await context.route('**/api/**', route => {
  1086 |     const pathname = new URL(route.request().url()).pathname
  1087 |
  1088 |     if (pathname === '/api/rituals') {
  1089 |       return route.fulfill(jsonResponse({ error: 'fixture failure' }, 503))
  1090 |     }
  1091 |
  1092 |     return route.fulfill(fixtureFor(route.request()))
  1093 |   })
  1094 |
  1095 |   const page = await context.newPage()
  1096 |   await freezePageTime(page)
  1097 |   await page.goto('/')
  1098 |
  1099 |   await expect(page.getByRole('alert')).toHaveText(/Проверь соединение/)
  1100 |   await expect(page.getByText('Добавь первый ритуал')).not.toBeVisible()
  1101 |   await expect(page.getByRole('button', { name: 'Повторить' })).toBeEnabled()
  1102 |
  1103 |   await context.close()
  1104 | })
  1105 |
  1106 | test('Today retry после критичного сбоя повторно загружает данные без пустого cache snapshot', async ({
  1107 |   browser,
  1108 |   baseURL,
  1109 | }) => {
  1110 |   const context = await browser.newContext({
  1111 |     baseURL,
  1112 |     viewport: { width: 390, height: 844 },
  1113 |     colorScheme: 'dark',
  1114 |     reducedMotion: 'reduce',
  1115 |     serviceWorkers: 'block',
  1116 |   })
  1117 |   await context.addInitScript(user => {
  1118 |     localStorage.clear()
  1119 |     sessionStorage.clear()
  1120 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1121 |     localStorage.setItem('mx-onboarded-v2', '1')
  1122 |     localStorage.setItem('mx-app-lock-enabled', '0')
  1123 |   }, TEST_USER)
  1124 |   let ritualsRequests = 0
  1125 |   await context.route('**/api/**', route => {
  1126 |     const pathname = new URL(route.request().url()).pathname
  1127 |     if (route.request().method() === 'GET' && pathname === '/api/rituals') {
  1128 |       ritualsRequests += 1
  1129 |       if (ritualsRequests <= 3) {
  1130 |         return route.fulfill(jsonResponse({ error: 'temporary fixture failure' }, 503))
  1131 |       }
  1132 |     }
  1133 |     return route.fulfill(fixtureFor(route.request()))
  1134 |   })
  1135 |   const page = await context.newPage()
  1136 |   await freezePageTime(page)
> 1137 |   await page.goto('/')
       |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  1138 |   await expect(page.getByRole('alert')).toHaveText(/Проверь соединение/)
  1139 |   await page.getByRole('button', { name: 'Повторить' }).click()
  1140 |   await expect.poll(() => ritualsRequests).toBe(4)
  1141 |   await expect(page.getByRole('alert')).toHaveCount(0)
  1142 |   await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible()
  1143 |   await context.close()
  1144 | })
  1145 |
  1146 | test('Evening Review проходится real touch tap на 390x844', async ({ browser, baseURL }) => {
  1147 |   const context = await browser.newContext({
  1148 |     baseURL,
  1149 |     viewport: { width: 390, height: 844 },
  1150 |     isMobile: true,
  1151 |     hasTouch: true,
  1152 |     colorScheme: 'dark',
  1153 |     reducedMotion: 'reduce',
  1154 |     serviceWorkers: 'block',
  1155 |   })
  1156 |   await context.addInitScript(user => {
  1157 |     localStorage.clear()
  1158 |     sessionStorage.clear()
  1159 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1160 |     localStorage.setItem('mx-onboarded-v2', '1')
  1161 |     localStorage.setItem('mx-app-lock-enabled', '0')
  1162 |   }, TEST_USER)
  1163 |   await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  1164 |   const page = await context.newPage()
  1165 |   await freezePageTime(page)
  1166 |   await page.goto('/?ui_lab=experiments')
  1167 |
  1168 |   const entryCta = page.getByRole('button', { name: 'Разобрать день' }).last()
  1169 |   await expect(entryCta).toBeVisible()
  1170 |   await entryCta.tap()
  1171 |   await expect(page.getByText('Фактический результат')).toBeVisible()
  1172 |
  1173 |   for (const option of [
  1174 |     'Сделал главное',
  1175 |     'Ясность',
  1176 |     'Маленький шаг помогает',
  1177 |     'Начать с пяти минут',
  1178 |   ]) {
  1179 |     await page.getByRole('radio', { name: option }).tap()
  1180 |     await page.getByRole('button', { name: /Дальше|Закрыть день/ }).tap()
  1181 |   }
  1182 |
  1183 |   await expect(page.getByText('День закрыт')).toBeVisible()
  1184 |   await page.locator('.mx-evening-review__closed').getByRole('button', { name: 'Продолжить' }).tap()
  1185 |   await expect(page.getByRole('button', { name: 'Разобрать день' }).last()).toBeVisible()
  1186 |   await context.close()
  1187 | })
  1188 |
```
