# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/ux-check.spec.mjs >> Today не маскирует ошибку критичного API под пустой список практик
- Location: tests/ux/ux-check.spec.mjs:1209:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
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
  1228 |   // Ускоряем автоповтор Today: 503 повторяемая, все попытки падают —
  1229 |   // экран ошибки должен появиться после исчерпания автоповторов.
  1230 |   await context.addInitScript(() => {
  1231 |     window.__MX_TODAY_RETRY_DELAYS_MS__ = [0, 0, 0]
  1232 |   })
  1233 | 
  1234 |   await context.route('**/api/**', route => {
  1235 |     const pathname = new URL(route.request().url()).pathname
  1236 | 
  1237 |     if (pathname === '/api/rituals') {
  1238 |       return route.fulfill(jsonResponse({ error: 'fixture failure' }, 503))
  1239 |     }
  1240 | 
  1241 |     return route.fulfill(fixtureFor(route.request()))
  1242 |   })
  1243 | 
  1244 |   const page = await context.newPage()
  1245 |   await freezePageTime(page)
> 1246 |   await page.goto('/')
       |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  1247 | 
  1248 |   await expect(page.getByRole('alert')).toHaveText(/Обычно это меньше минуты/)
  1249 |   await expect(page.getByText('Добавь первый ритуал')).not.toBeVisible()
  1250 |   await expect(page.getByRole('button', { name: 'Повторить' })).toBeEnabled()
  1251 | 
  1252 |   await context.close()
  1253 | })
  1254 | 
  1255 | test('Today retry после критичного сбоя повторно загружает данные без пустого cache snapshot', async ({
  1256 |   browser,
  1257 |   baseURL,
  1258 | }) => {
  1259 |   const context = await browser.newContext({
  1260 |     baseURL,
  1261 |     viewport: { width: 390, height: 844 },
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
```