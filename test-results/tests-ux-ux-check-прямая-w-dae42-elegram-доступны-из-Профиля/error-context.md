# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/ux-check.spec.mjs >> прямая web-ссылка автоматически создаёт гостя; email и Telegram доступны из Профиля
- Location: tests/ux/ux-check.spec.mjs:1102:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1027 |         cycle: {
  1028 |           idea: { text: 'Сначала замечаю главное.', status: 'draft' },
  1029 |           action: { text: 'Делаю один спокойный шаг.', status: 'draft' },
  1030 |           analysis: { text: '', status: 'draft' },
  1031 |           newStep: { text: '', status: 'draft' },
  1032 |         },
  1033 |         freeWrites: [],
  1034 |         updatedAt: '2026-08-27T12:00:00.000Z',
  1035 |       },
  1036 |     },
  1037 |   }
  1038 | 
  1039 |   for (const viewport of layouts) {
  1040 |     const context = await browser.newContext({
  1041 |       baseURL,
  1042 |       viewport: { width: viewport.width, height: viewport.height },
  1043 |       colorScheme: 'dark',
  1044 |       reducedMotion: 'reduce',
  1045 |       serviceWorkers: 'block',
  1046 |     })
  1047 | 
  1048 |     await context.addInitScript(
  1049 |       ({ user, store }) => {
  1050 |         localStorage.clear()
  1051 |         sessionStorage.clear()
  1052 |         localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1053 |         localStorage.setItem('mx-onboarded-v2', '1')
  1054 |         localStorage.setItem('mx-app-lock-enabled', '0')
  1055 |         localStorage.setItem(`mx-journal-v2:user:${user.id}`, JSON.stringify(store))
  1056 |       },
  1057 |       { user: TEST_USER, store: journalStore }
  1058 |     )
  1059 | 
  1060 |     await context.route('**/api/**', route => {
  1061 |       const pathname = new URL(route.request().url()).pathname
  1062 |       if (route.request().method() === 'GET' && pathname === '/api/rituals') {
  1063 |         return route.fulfill(jsonResponse([{ id: 1, title: 'Тестовый ритуал' }]))
  1064 |       }
  1065 |       return route.fulfill(fixtureFor(route.request()))
  1066 |     })
  1067 | 
  1068 |     const page = await context.newPage()
  1069 |     await freezePageTime(page)
  1070 |     const runtimeErrors = []
  1071 |     page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  1072 |     page.on('response', response => {
  1073 |       if (response.status() >= 500) {
  1074 |         runtimeErrors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`)
  1075 |       }
  1076 |     })
  1077 |     page.on('console', message => {
  1078 |       if (
  1079 |         message.type() === 'error' &&
  1080 |         !message.text().includes('CloudStorage is not supported in version 6.0')
  1081 |       ) {
  1082 |         runtimeErrors.push(`console.error: ${message.text()}`)
  1083 |       }
  1084 |     })
  1085 | 
  1086 |     await page.goto('/')
  1087 |     await page.getByRole('button', { name: 'История' }).click()
  1088 |     await page.getByRole('button', { name: 'История' }).click()
  1089 |     await expect(page.getByTestId('local-journal-history')).toBeVisible()
  1090 |     await expect(page.getByText('Локальный журнал')).toBeVisible()
  1091 |     await expect(page.getByText('2/4 шага')).toBeVisible()
  1092 |     await expect(page.getByText('Идея')).toBeVisible()
  1093 |     await expect(page.getByText('Действие')).toBeVisible()
  1094 |     await expect(page.getByText('Сначала замечаю главное.')).toBeVisible()
  1095 |     await expect(page.getByText('Делаю один спокойный шаг.')).toBeVisible()
  1096 |     await assertCommonScreenChecks(page, runtimeErrors)
  1097 | 
  1098 |     await context.close()
  1099 |   }
  1100 | })
  1101 | 
  1102 | test('прямая web-ссылка автоматически создаёт гостя; email и Telegram доступны из Профиля', async ({ browser, baseURL }) => {
  1103 |   const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  1104 |   await context.addInitScript(() => {
  1105 |     localStorage.clear()
  1106 |     sessionStorage.clear()
  1107 |     localStorage.setItem('mx-onboarded-v2', '1')
  1108 |   })
  1109 |   const guest = { id: 900002, first_name: 'Гость', is_guest: true }
  1110 |   let guestRequests = 0
  1111 |   let mergeRequests = 0
  1112 |   await context.route('**/api/**', route => {
  1113 |     const path = new URL(route.request().url()).pathname
  1114 |     if (path === '/api/auth/guest') {
  1115 |       guestRequests += 1
  1116 |       return route.fulfill(jsonResponse({ ok: true, user: guest, merge_token: 'merge-guest', session_token: 'guest-session' }))
  1117 |     }
  1118 |     if (path === '/api/auth/email/verify') return route.fulfill(jsonResponse({ ok: true, user: TEST_USER, session_token: 'email-session' }))
  1119 |     if (path === '/api/auth/guest/merge') {
  1120 |       mergeRequests += 1
  1121 |       expect(route.request().postDataJSON().merge_token).toBe('merge-guest')
  1122 |       return route.fulfill(jsonResponse({ user: TEST_USER }))
  1123 |     }
  1124 |     return route.fulfill(fixtureFor(route.request()))
  1125 |   })
  1126 |   const page = await context.newPage()
> 1127 |   await page.goto('/')
       |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  1128 |   await expect(page.getByTestId('today-profile-button')).toBeVisible()
  1129 |   expect(guestRequests).toBe(1)
  1130 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toHaveCount(0)
  1131 |   expect(await page.evaluate(() => localStorage.getItem('mentalix_session_token'))).toBe('guest-session')
  1132 |   expect(await page.evaluate(() => localStorage.getItem('mentalix_guest_merge_token'))).toBe('merge-guest')
  1133 | 
  1134 |   await page.getByTestId('today-profile-button').click()
  1135 |   await page.getByTestId('profile-guest-login-link').click()
  1136 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  1137 |   await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  1138 |   await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  1139 |   await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com')
  1140 |   await page.getByRole('button', { name: 'Получить письмо' }).click()
  1141 |   await page.getByRole('textbox', { name: 'Код из email' }).fill('123456')
  1142 |   await page.getByRole('button', { name: 'Войти' }).click()
  1143 |   await expect(page.getByTestId('profile-screen')).toBeVisible()
  1144 |   await expect(page.getByTestId('profile-guest-login-link')).toHaveCount(0)
  1145 |   expect(mergeRequests).toBe(1)
  1146 |   expect(await page.evaluate(() => localStorage.getItem('mentalix_guest_merge_token'))).toBeNull()
  1147 |   await context.close()
  1148 | })
  1149 | 
  1150 | test('ошибка гостевого входа оставляет рабочий email и повтор гостевого входа', async ({ browser, baseURL }) => {
  1151 |   const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  1152 |   await context.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  1153 |   let attempts = 0
  1154 |   await context.route('**/api/**', route => {
  1155 |     if (new URL(route.request().url()).pathname === '/api/auth/guest') {
  1156 |       attempts += 1
  1157 |       return route.fulfill(jsonResponse(attempts === 1 ? { error: 'unavailable' } : { ok: true, user: TEST_USER, merge_token: 'retry' }, attempts === 1 ? 503 : 200))
  1158 |     }
  1159 |     return route.fulfill(fixtureFor(route.request()))
  1160 |   })
  1161 |   const page = await context.newPage()
  1162 |   await page.goto('/')
  1163 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  1164 |   await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  1165 |   await page.getByTestId('web-auth-guest-button').click()
  1166 |   await expect(page.getByText(/Пара вопросов — и приложение/)).toBeVisible()
  1167 |   expect(attempts).toBe(2)
  1168 |   await context.close()
  1169 | })
  1170 | 
  1171 | test('email-подтверждение не запускает автогостя', async ({ browser, baseURL }) => {
  1172 |   const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  1173 |   await context.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  1174 |   let guestRequests = 0
  1175 |   await context.route('**/api/**', route => {
  1176 |     if (new URL(route.request().url()).pathname === '/api/auth/guest') guestRequests += 1
  1177 |     return route.fulfill(fixtureFor(route.request()))
  1178 |   })
  1179 |   const page = await context.newPage()
  1180 |   await page.goto('/?email=test%40example.com&code=123456')
  1181 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  1182 |   expect(guestRequests).toBe(0)
  1183 |   await page.goto('/?token=magic-link-token')
  1184 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  1185 |   expect(guestRequests).toBe(0)
  1186 |   await context.close()
  1187 | })
  1188 | 
  1189 | test('Telegram Mini App не создаёт web-гостя', async ({ browser, baseURL }) => {
  1190 |   const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  1191 |   await context.addInitScript(() => {
  1192 |     localStorage.clear()
  1193 |     sessionStorage.clear()
  1194 |     window.TelegramWebviewProxy = { postEvent() {} }
  1195 |   })
  1196 |   let guestRequests = 0
  1197 |   await context.route('**/api/**', route => {
  1198 |     if (new URL(route.request().url()).pathname === '/api/auth/guest') guestRequests += 1
  1199 |     return route.fulfill(fixtureFor(route.request()))
  1200 |   })
  1201 |   const page = await context.newPage()
  1202 |   await page.goto('/')
  1203 |   await expect(page.getByText('Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя')).toBeVisible()
  1204 |   expect(guestRequests).toBe(0)
  1205 |   await expect(page.getByRole('heading', { name: 'Вход по email' })).toHaveCount(0)
  1206 |   await context.close()
  1207 | })
  1208 | 
  1209 | test('Today не маскирует ошибку критичного API под пустой список практик', async ({
  1210 |   browser,
  1211 |   baseURL,
  1212 | }) => {
  1213 |   const context = await browser.newContext({
  1214 |     baseURL,
  1215 |     viewport: { width: 390, height: 844 },
  1216 |     colorScheme: 'dark',
  1217 |     reducedMotion: 'reduce',
  1218 |     serviceWorkers: 'block',
  1219 |   })
  1220 | 
  1221 |   await context.addInitScript(user => {
  1222 |     localStorage.clear()
  1223 |     sessionStorage.clear()
  1224 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  1225 |     localStorage.setItem('mx-onboarded-v2', '1')
  1226 |     localStorage.setItem('mx-app-lock-enabled', '0')
  1227 |   }, TEST_USER)
```