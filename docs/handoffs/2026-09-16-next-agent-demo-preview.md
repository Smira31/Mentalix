# Handoff для следующего агента Mentalix Demo Preview

## 1. Цель продолжения

Продолжить доработку мобильного интерфейса Mentalix **только в Demo Preview**, не затрагивая production и не выполняя merge в production branch. Работать с того места, где остановился предыдущий агент: унификация навигационных кнопок во всех вложенных экранах вкладки профиля/настроек.

Главное требование пользователя: во всех вложенных экранах, открываемых из раздела «человечек»/настроек, должна быть такая же крупная круглая кнопка, как в Demo Settings. Пользователь отдельно попросил заменить маленькую текстовую кнопку «Назад» на крупную круглую кнопку с иконкой. В Settings уже используются крупные круглые controls: размер 46×46, круг, лёгкая светлая рамка и полупрозрачный фон.

## 2. Репозиторий и рабочая ветка

- Репозиторий: `Smira31/Mentalix`
- Локальный путь: `/home/ubuntu/Mentalix`
- Рабочая ветка: `issue-618-polish-on-demo`
- Удалённая Demo-ветка: `fix/mentor-demo-preview-geometry`
- Последний опубликованный commit: `2308fbf9a4694e2bf9b8c664ae2aa7024f22a619`
- Последний короткий commit: `2308fbf9` — `style: match demo nested back controls`
- Последний Cloudflare workflow run: `35058108107`
- Workflow URL: https://github.com/Smira31/Mentalix/actions/runs/35058108107

Перед началом всегда проверить:

```bash
cd /home/ubuntu/Mentalix
git status --short --branch
git log -5 --oneline --decorate
git fetch origin fix/mentor-demo-preview-geometry
git log origin/fix/mentor-demo-preview-geometry -3 --oneline
```

Не переключаться на reference-ветку Issue #618 и не мержить её. Reference-ветка содержит только материалы.

## 3. Канонический Demo Preview

Сейчас канонический постоянный Demo Preview работает через Cloudflare Pages Owner QA, а не через Vercel. Vercel считается legacy QA и не должен использоваться для обычных обновлений Demo.

Основная ссылка для пользователя:

https://mentalix-owner-qa.pages.dev/?demo=1&tab=today

Для cache-busting можно временно добавить commit SHA:

```text
https://mentalix-owner-qa.pages.dev/?demo=1&tab=today&v=2308fbf9
```

Пользователь открывает эту ссылку в Safari и может добавить её на Home Screen. После нового успешного Cloudflare Owner QA deployment адрес остаётся тем же; новую иконку создавать не нужно.

Не сообщать пользователю Vercel preview URL как основной. Не запускать `vercel deploy`, не создавать новый Vercel project и не делать лишние Vercel builds.

## 4. Канонический Cloudflare publish flow

В репозитории уже есть workflow:

```text
.github/workflows/cloudflare-owner-qa.yml
```

После изменений:

1. Использовать Node.js 22.22.1:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22.22.1
```

2. Запустить локальные проверки.
3. Закоммитить изменения в рабочую ветку.
4. Push именно в Demo branch:

```bash
git push origin HEAD:fix/mentor-demo-preview-geometry
```

5. Запустить exact-SHA Cloudflare workflow:

```bash
sha=$(git rev-parse HEAD)
gh workflow run cloudflare-owner-qa.yml \
  -R Smira31/Mentalix \
  --ref fix/mentor-demo-preview-geometry \
  -f commit_sha="$sha"
```

6. Найти run:

```bash
gh run list -R Smira31/Mentalix \
  --workflow cloudflare-owner-qa.yml \
  --limit 1 \
  --json databaseId,status,headSha
```

7. Дождаться завершения:

```bash
gh run watch <RUN_ID> -R Smira31/Mentalix --interval 10 --exit-status
```

Deployment считается опубликованным только если workflow завершился с `success` и прошли шаги exact SHA, build, direct upload и stable/immutable provenance.

В GitHub Actions может появляться informational annotation о Node.js 20 в `actions/checkout`/`actions/setup-node`; это предупреждение GitHub Actions, а не ошибка проекта. Проект сам проверяется на Node 22.22.1.

## 5. Что уже сделано в текущей задаче

### Навигация Demo Settings

Причина бага была найдена в:

```text
src/components/BackButton.jsx
```

Компонент скрывал кнопку, если включён `previewDemoMode`, потому что предполагал наличие системной кнопки Telegram. В браузерном Demo Preview системной кнопки нет, поэтому callback `onBack` существовал, но пользователь не видел control.

Изменение уже внесено:

```jsx
export default function BackButton({
  onClick,
  label = 'Назад',
  className = '',
  showInDemo = false,
})
```

Поведение:

- Telegram: системная Telegram BackButton, визуальная web-кнопка скрыта;
- обычный web без Demo: стандартная текстовая кнопка «Назад»;
- Demo Preview при `showInDemo`: крупная круглая кнопка только с иконкой ChevronLeft.

### Новый общий стиль

Создан файл:

```text
src/styles/demo-navigation.css
```

Класс:

```css
.mx-demo-back-button {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.08);
  color: #f2f2f2;
}
```

CSS подключается из `BackButton.jsx`.

### Экраны, которым уже передан `showInDemo`

Проверены и изменены следующие файлы:

- `src/App.jsx` — профиль;
- `src/screens/SubscriptionManager.jsx` — подписка;
- `src/screens/DonateScreen.jsx` — подарок/поддержка проекта;
- `src/screens/LinkWebAccount.jsx` — связать с сайтом;
- `src/screens/PrivacyNotice.jsx` — политика и данные;
- `src/screens/WillingnessToPayTest.jsx` — concept test;
- `src/screens/QuotesManager.jsx` — мои фразы;
- `src/screens/AppLock.jsx` — настройка PIN.

В `Settings.jsx` уже была отдельная Demo-шапка с крупными кнопками 46×46:

- слева — круглая стрелка назад;
- справа — круглый крестик закрытия настроек;
- отдельный круглый подарок скрыт по текущему контракту Demo.

Важно: пользователь попросил именно такие большие кнопки. Не возвращать текстовую кнопку «Назад» в Demo-вложенных экранах.

## 6. Все Settings destinations, которые нужно сохранять рабочими

В `src/screens/Settings.jsx` есть состояние:

```jsx
const [screen, setScreen] = useState(null)
```

Текущие destinations:

- `quotes` → `QuotesManager user={user} onBack={() => setScreen(null)}`;
- `subscription` → `SubscriptionManager ... onBack={() => setScreen(null)}`;
- `donate` → `DonateScreen ... onBack={() => setScreen(null)}`;
- `link-web` → `LinkWebAccount onBack={() => setScreen(null)}`;
- `privacy-notice` → `PrivacyNotice onBack={() => setScreen(null)}`;
- `app-lock-setup` → `AppLock onCancel={() => setScreen(null)}`;
- `wtp-test` → `WillingnessToPayTest ... onBack={() => setScreen(null)}`.

Не удалять callbacks и не заменять их только визуальным control. Кнопка должна действительно возвращать на Settings.

Верхний Settings Demo header:

- «Назад» возвращает на Today;
- «Закрыть настройки» также возвращает на Today;
- профиль открывается из строки профиля и должен возвращать на Settings.

## 7. Последняя локальная проверка

Перед последним commit были успешно выполнены:

```bash
git diff --check
npm run lint
npm run test:unit
npm run build
```

Результат unit suite:

```text
tests 273
pass 271
fail 0
skipped 2
```

Последний Cloudflare workflow `35058108107` был запущен для SHA `2308fbf9a4694e2bf9b8c664ae2aa7024f22a619`. На момент handoff он ещё отслеживался background watcher; сначала проверь его статус:

```bash
gh run view 35058108107 -R Smira31/Mentalix --json status,conclusion,headSha,url
```

Если он уже завершился с success, не запускай повторный deployment без изменения кода.

## 8. Что проверить после завершения workflow

### Browser smoke-check

Открыть:

```text
https://mentalix-owner-qa.pages.dev/?demo=1&tab=today&v=2308fbf9
```

Далее проверить:

1. Нажать иконку профиля/человечка.
2. Убедиться, что в Settings видны две большие круглые кнопки:
   - стрелка назад слева;
   - крестик закрытия справа.
3. Нажать «Попробовать 7 дней бесплатно».
4. Убедиться, что во вложенном экране подписки слева видна большая круглая стрелка назад.
5. Нажать её и убедиться, что открылись Settings.
6. Снова открыть профиль/Settings.
7. Нажать «Подарить Mentalix близкому человеку».
8. Убедиться, что во вложенном экране подарка есть такая же большая круглая стрелка назад.
9. Повторно проверить остальные строки: «Мои фразы», «Связать с сайтом», «Политика и данные», «Блокировка приложения», «Что было бы полезно?».
10. В каждом случае убедиться, что возврат работает, а после завершения подарка кнопка «Готово» возвращает в Settings.

Для browser console можно использовать DOM-проверку:

```js
JSON.stringify({
  demoBackButtons: [...document.querySelectorAll('.mx-demo-back-button')].map(button => ({
    aria: button.getAttribute('aria-label'),
    width: Math.round(button.getBoundingClientRect().width),
    height: Math.round(button.getBoundingClientRect().height),
  })),
})
```

Ожидаемый размер каждого Demo back control: примерно `46 × 46`.

## 9. Правила дальнейшей работы

- Не трогать production branch.
- Не делать merge PR в production.
- Не мержить reference branch Issue #618.
- Все новые UI-изменения сначала проверять локально.
- Использовать Node 22.22.1.
- Для Demo deploy использовать только Cloudflare Owner QA workflow.
- Не создавать новую ссылку для каждой правки: постоянная ссылка остаётся `mentalix-owner-qa.pages.dev`.
- Не делать лишние Vercel deployments.
- Не добавлять hardcode, который меняет production flow.
- Если изменение нужно только для Demo, ограничивать его `isPreviewDemoMode()`/`showInDemo` и не ломать Telegram flow.
- Не удалять existing callbacks, accessibility labels или keyboard behavior.
- После каждой публикации сообщать пользователю: что изменилось, commit SHA, результат lint/unit/build, статус Cloudflare и ссылку на тот же Demo Preview.

## 10. Следующая точка работы

Сначала проверить завершение workflow `35058108107`. Затем выполнить browser smoke-check экранов профиля. Если визуально кнопка соответствует крупной кнопке из Settings и возврат работает, сообщить пользователю, что задача завершена.

Если пользователь попросит дальнейшую визуальную доработку, продолжать в этой же ветке и публиковать через тот же Cloudflare flow. Не начинать заново с Vercel и не создавать новый Demo URL.
