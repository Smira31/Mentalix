# Mentalix Demo Preview — финальный handoff, QA-план и путь в Production

**Дата:** 16 сентября 2026 года  
**Назначение:** перенести работу в новый диалог Manus без потери контекста и провести полный визуальный, функциональный и standalone-iOS аудит Demo Preview перед переносом в Production.

## Готовый первый промпт для нового агента

Скопируй следующий блок целиком в новый диалог:

> Ты продолжаешь работу над Mentalix после предыдущего агента. Работай как автономный senior collaborator: самостоятельно изучай код, reference-материалы, текущие workflow и реальные опубликованные URL; затем выполняй проверки, исправляй найденные проблемы, публикуй только Demo Preview и останавливайся перед Production до получения моего визуального PASS.
>
> Репозиторий: `Smira31/Mentalix`. Локальный путь: `/home/ubuntu/Mentalix`.
>
> Текущая ветка с auth-изменениями: `fix/production-standalone-web-auth`. Каноническая Demo-ветка: `fix/mentor-demo-preview-geometry`. Production branch: `main`.
>
> Канонический Demo Preview: `https://mentalix-owner-qa.pages.dev/?demo=1&tab=today`. Cloudflare Pages Owner QA — основной постоянный Demo host. Vercel не используй для обычных Demo-обновлений и не создавай новые Vercel Preview URL.
>
> Текущий опубликованный Demo commit: `e97905626462b764ff91d2d3854cba734e00bf04`. Успешный Cloudflare workflow: `35082527869` — https://github.com/Smira31/Mentalix/actions/runs/35082527869.
>
> PR standalone web auth: #621 — https://github.com/Smira31/Mentalix/pull/621. Его не мержить автоматически. Сначала завершить весь Demo QA и получить мой визуальный PASS.
>
> Главная задача нового диалога: пройти весь Demo Preview с начала до конца, сравнить UI/UX с reference-файлами, проверить поведение на мобильном viewport и реальном iPhone, зафиксировать найденные расхождения, исправить их Demo-only способом и повторно опубликовать Cloudflare Demo. Production можно готовить только после отдельного финального отчёта и моего явного разрешения на merge/release.
>
> Обязательно прочитай перед работой:
>
> - `docs/handoffs/2026-09-16-demo-preview-final-qa-and-production-handoff.md`;
> - `docs/handoffs/2026-09-16-new-agent-master-prompt.md`;
> - `docs/handoffs/2026-09-16-next-agent-demo-preview.md`;
> - `DESIGN_SYSTEM.md`;
> - `qa-evidence/`;
> - reference-материалы Issue #618 и `IMPLEMENTATION_PROMPT.md`, если они доступны в текущем checkout;
> - `docs/references/web-auth/photo_2026-09-16_12-45-46.jpg`;
> - `docs/references/web-auth/photo_2026-09-16_12-45-48.jpg`.
>
> Перед изменениями выполни:
>
> ```bash
> source "$HOME/.nvm/nvm.sh"
> nvm use 22.22.1
> cd /home/ubuntu/Mentalix
> git status --short --branch
> git log -8 --oneline --decorate
> git fetch origin fix/mentor-demo-preview-geometry
> git log origin/fix/mentor-demo-preview-geometry -5 --oneline
> ```
>
> Не добавляй автоматически существующие untracked QA/reference-файлы. В текущем рабочем дереве могут присутствовать `artifacts/mxl-010-gate/`, `qa-evidence/`, `docs/references/` и вспомогательные scripts. Перед коммитом добавляй только файлы, относящиеся к текущей задаче.
>
> Используй русский язык в отчётах. Для каждой итерации сообщай: что проверено, какой дефект найден, какое изменение сделано, какой commit опубликован, какой Cloudflare workflow завершился успешно и что именно мне нужно проверить на iPhone.

## 1. Канонические ссылки и режимы

| Сценарий                     | URL                                                                | Ожидаемый результат                                                                              |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Demo Preview, основной режим | `https://mentalix-owner-qa.pages.dev/?demo=1&tab=today`            | Synthetic Demo user, Today и все Demo-вкладки без реальной авторизации                           |
| Demo Preview с cache bust    | `https://mentalix-owner-qa.pages.dev/?demo=1&tab=today&v=e9790562` | Та же Demo-версия с принудительным новым URL                                                     |
| Standalone web-auth          | `https://mentalix-owner-qa.pages.dev/`                             | Web auth для неавторизованного web/standalone пользователя; открывать через Safari и Home Screen |
| Web-auth без старого кэша    | `https://mentalix-owner-qa.pages.dev/?v=e9790562`                  | Та же страница auth после текущего deployment                                                    |

Параметры `?demo=1` и `?source=pwa` специально включают synthetic Demo Mode. Они **не показывают авторизацию**. Для проверки входа используй URL без `demo=1`, добавь его на Home Screen и открывай именно через иконку.

## 2. Что уже реализовано

### Today и нижняя навигация

Today в Demo использует Stoic-inspired monochrome composition. В шапке оставлены нейтральные controls, убраны лишние синие акценты и удалена галочка у понедельника. Pin-bar использует пять нейтральных пунктов: «Сегодня», «Шаги», «Диалог», «Библиотека» и «Прогресс». Иконки соответствуют выбранному направлению: дом, лампочка, компас, открытая книга и trends/progress. Самодельная белая iOS Home Indicator не рисуется; используется native safe-area iOS.

При прокрутке pin-bar должен переходить в компактное круглое состояние. При возврате к верхней части страницы он должен восстанавливаться в expanded capsule. Это необходимо проверять на всех пяти вкладках.

### Profile, Settings и вложенные экраны

В Demo Settings используется крупная круглая кнопка назад размером около 46×46 px. Во вложенных Demo-экранах оставлена только кнопка «Назад» в едином стиле. Лишнюю кнопку X/«Закрыть» во вложенных экранах не возвращать без отдельного запроса.

Нужно сохранить рабочими переходы в «Мои фразы», подписку, «Поддержать проект», связь с сайтом, политику и данные, блокировку приложения и concept-test. Кнопка должна не только выглядеть правильно, но и действительно возвращать в Settings.

### Premium

Premium в Demo оформлен как fullscreen portal. Карточки растянуты по ширине и переведены в Design System без синих галочек и синих CTA. Цены указаны в рублях:

- `690 ₽ в месяц`;
- `8 280 ₽ в год`;
- Premium + AI: `1 290 ₽ в месяц`;
- Premium + AI: `15 480 ₽ в год`.

Оплата не подключается: это visual/demo concept flow. Нужно отдельно проверить, что на iPhone 16 Pro и 16 Pro Max нет лишнего чёрного пространства сверху или снизу, а кнопка «Назад» возвращает в Settings.

### Support Project

Старая gift-карточка заменена на «Поддержать проект». Доступны суммы `100 ₽`, `300 ₽`, `500 ₽` и `1000 ₽`. Выбранная сумма использует нейтральную светлую поверхность. Demo Support вынесен в portal, чтобы его layout не смещался относительно transformed Demo phone frame. Нужно проверить заголовок, возврат, выбор суммы и финальную кнопку.

### Daily Check-In

Daily Check-In в Demo получил Stoic-inspired visual layer:

- горизонтальные полосы между шкалами удалены;
- лица компактные и не окружены большими внешними кругами;
- выбранное настроение или значение заполняется светлым/белым состоянием;
- прогресс показывается как `ЧЕК-ИН · N ИЗ 6`, а не как набор верхних точек;
- editor использует чёрный экран и placeholder `Начни писать`;
- серый текст «Сохраняется после завершения» не должен возвращаться;
- toolbar содержит `Aa` и кнопку продолжения;
- dock/action bar должен позиционироваться над клавиатурой;
- после отправки текста клавиатура не должна закрываться автоматически;
- закрыть клавиатуру пользователь должен сам.

Обязательные шаги для QA: mood, energy, noise, focus, choice/closer-to-you и editor `Что на уме?`. Для каждого состояния проверить выбранное значение, переход вперёд, возврат назад, сохранение черновика и отсутствие визуального overflow.

### WebAuthScreen и standalone iOS

WebAuthScreen переделан по загруженным reference-фотографиям:

- полноэкранный чёрный фон;
- Stoic-style monochrome illustration;
- круглая кнопка закрытия сверху справа;
- заголовок «Продолжай расти даже вне приложения»;
- три смысловых блока;
- поле email;
- цитата Эпиктета;
- светлая CTA-кнопка;
- mobile-first safe-area и адаптация к уменьшенному visual viewport.

Файлы пользовательских references находятся в ветке `Smira31-patch-2`:

- `docs/references/web-auth/photo_2026-09-16_12-45-46.jpg` — состояние без клавиатуры;
- `docs/references/web-auth/photo_2026-09-16_12-45-48.jpg` — состояние с iOS-клавиатурой.

Исправлен standalone routing: Safari Home Screen определяется через `display-mode: standalone` или `navigator.standalone` и направляется в web platform, а не в Telegram platform. Дополнительно исправлено зависание splash: если `/api/auth/session` недоступен или возвращает ошибку, `authChecked` теперь завершается, и пользователь попадает на WebAuthScreen вместо бесконечной загрузки.

### Demo Preview label на iPhone

Для Demo manifest теперь используются:

- `name`: `Mentalix — демо-превью`;
- `short_name`: `Демо-превью`;
- `description`: `Демо-превью Mentalix`.

В Demo runtime также меняются `apple-mobile-web-app-title` и `document.title`. iOS кэширует старое имя. После deployment нужно удалить старую иконку, открыть Demo URL в Safari и заново выбрать «Поделиться → На экран “Домой”». Production label `Mentalix` не изменён.

## 3. Полный порядок ручной проверки

### Этап A. Доступность и PWA

Сначала открой канонический Demo URL в Safari и на компьютере. Убедись, что Cloudflare отвечает `200`, а экран Today загружается без splash. На iPhone удали старую Demo-иконку, добавь URL заново и проверь, что подпись под иконкой — «Демо-превью».

Открой Demo через иконку в Home Screen и проверь, что standalone-режим не теряет Today, не показывает Telegram-ошибку и не зависает на splash. Затем отдельной ссылкой без `demo=1` добавь web-auth shortcut или открой её в standalone-контексте. Проверь экран без клавиатуры, нажми email field и проверь состояние с клавиатурой.

### Этап B. Today

Проверь приветствие, hero-карточку, профильный control, reward/streak control, отсутствие синей подсветки и отсутствие понедельничной галочки. Нажми главную CTA, открой Daily Check-In, вернись назад и проверь, что состояние Today не сбросилось неправильно.

Прокрути Today вниз и вверх. Убедись, что expanded pin-bar превращается в компактный круглый control и возвращается обратно. Проверь safe-area в нижней части и отсутствие искусственной белой полосы.

### Этап C. Check-In

Последовательно пройди шаги 1–6. Для шагов 1–5 проверь выбранное лицо или значение, белое selected state, отсутствие горизонтальных полос, корректную кнопку продолжения и возможность вернуться назад. На шестом шаге введи длинный текст, открой клавиатуру, прокрути, вставь несколько строк и отправь текст. Убедись, что клавиатура остаётся открытой после отправки и что dock расположен непосредственно над клавиатурой.

Отдельно проверь rotation/resize поведения, если устройство позволяет. На iOS это важнее, чем в desktop browser, потому что `visualViewport` меняется при открытии клавиатуры.

### Этап D. Navigation

Проверь все пять вкладок: Today, Steps, Dialog, Library, Progress. В каждой вкладке проверь expanded pin-bar, scroll collapse, возврат expanded state и отсутствие синего active background. Открой Dialog, выбери наставника, сфокусируй composer, введи сообщение и отправь его. Проверь, что composer находится у клавиатуры, keyboard не закрывается сама и экран не показывает пустую чёрную прослойку.

### Этап E. Profile и Settings

Открой профиль. Проверь крупные controls и нейтральный стиль. Последовательно открой каждую вложенную страницу и нажми «Назад». Ни одна страница не должна требовать сворачивания приложения для возврата. Проверь отдельно Premium, Premium + AI, Support Project, My Quotes, Link Web Account, Privacy/Data, App Lock и concept test.

### Этап F. Console и smoke checks

После каждого крупного сценария проверь консоль. Особое внимание удели React warnings, ResizeObserver, `visualViewport`, portal mounting, duplicate keys, failed network requests и ошибкам API. Любая ошибка, связанная с пользовательским сценарием, должна быть исправлена до Production.

## 4. Автоматические проверки перед каждым Demo deployment

Используй Node.js `22.22.1`:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22.22.1
cd /home/ubuntu/Mentalix
git diff --check
npm run lint
npm run test:unit
npm run build
npm run test:design-guard
npm run docs:check
npm run ux:mxl010
```

Если меняются общие навигация, Today, Check-In, Dialog или viewport-поведение, дополнительно запускай:

```bash
npm run ux:check
```

Текущий локальный gate для auth fallback и Demo label прошёл `lint` и `build`. Не считать локальный build доказательством опубликованного результата: после push обязательно дождаться Cloudflare workflow success и открыть стабильный URL.

## 5. Публикация Demo Preview

Не использовать `vercel deploy`. Канонический flow:

```bash
git add <только файлы текущей задачи>
git commit -m "<описательный commit>"
git push origin HEAD:fix/mentor-demo-preview-geometry
sha=$(git rev-parse HEAD)
gh workflow run cloudflare-owner-qa.yml \
  -R Smira31/Mentalix \
  --ref fix/mentor-demo-preview-geometry \
  -f commit_sha="$sha"
run=$(gh run list -R Smira31/Mentalix \
  --workflow cloudflare-owner-qa.yml \
  --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$run" -R Smira31/Mentalix --interval 10 --exit-status
gh run view "$run" -R Smira31/Mentalix --json status,conclusion,headSha,url
```

Публикация считается успешной только при `success` и прохождении exact SHA, build, Cloudflare Direct Upload и stable/immutable provenance. Если checkout workflow сообщает, что SHA не найден, сначала проверь `gh api repos/Smira31/Mentalix/git/ref/heads/fix/mentor-demo-preview-geometry`, затем повтори dispatch после подтверждения, что SHA уже находится в remote branch.

## 6. Production release gate

Production пока **не считать готовым** только потому, что Demo deployment зелёный. Сначала нужен один полный QA-цикл:

1. Все этапы A–F пройдены на iPhone.
2. Все расхождения с reference-фотографиями зафиксированы screenshots или кратким списком.
3. Нет ошибок в browser console и нет критичных failed requests.
4. Check-In editor и Dialog composer проверены с настоящей iOS-клавиатурой.
5. Premium, Support, Profile и navigation проверены на iPhone 16 Pro/Pro Max или максимально близком устройстве.
6. Пользователь дал явный визуальный PASS.

Только после этого новый агент должен подготовить Production release plan. План должен перечислить конкретные commits и файлы, которые переносятся, и отдельно подтвердить, какие Demo-only guards остаются только в Demo. Затем можно рассмотреть merge PR #621 и обновление `main`. Merge, production deployment, auth/security changes и платежные изменения не выполнять молча до явного разрешения пользователя.

## 7. Слепые пятна, которые обязательно проверить

Следующие вопросы раньше не были полностью закрыты и должны попасть в QA, даже если пользователь отдельно их не назвал:

- очищается ли web session после logout и не открывается ли старый пользователь на общем устройстве;
- что происходит при offline/slow network во время auth restore;
- можно ли повторно запросить email code и что происходит при истёкшем коде;
- сохраняется ли введённый draft Check-In после временного ухода с экрана;
- не закрывается ли клавиатура после отправки Dialog или Check-In сообщения;
- нет ли horizontal overflow на iPhone 16 Pro Max и на более узком viewport;
- доступен ли каждый back control с tap target не менее 44×44 px;
- достаточно ли контрастны серые подписи на чёрных и серых поверхностях;
- не смешиваются ли Demo localStorage и реальная web session;
- не появляется ли Production UI на Demo URL из-за host/query gate;
- не ломается ли manifest и cache после повторной установки PWA;
- не загружаются ли случайно платёжные действия из Demo;
- не остаются ли старые синие CSS variables, active states или icon fills на вложенных экранах;
- не появляется ли искусственная Home Indicator после изменений safe-area;
- не меняется ли внешний вид Telegram Mini App при Demo-only CSS overrides.

## 8. Рабочие правила

Работай итеративно: сначала воспроизведение, затем минимальный fix, затем автоматические проверки, затем Cloudflare deployment, затем browser/iPhone smoke-check. Не смешивай крупный визуальный redesign с auth/security fix в одном непроверенном коммите.

Не переписывай reference-ветку Issue #618 и не мержи её. Не копируй reference PNG в Production без необходимости. Не добавляй untracked QA artifacts автоматически. Не считай screenshot локального Vite достаточным доказательством iOS-поведения.

Если задача касается только Demo UI, ограничивай стили и поведение через `isPreviewDemoMode()` или `previewDemoMode`. Если изменение касается standalone auth, сначала проверь, что оно действительно исправляет Home Screen и не ломает Telegram WebApp. Production переносить только после отдельного PASS.

## References

[1]: https://github.com/Smira31/Mentalix 'Mentalix repository'
[2]: https://github.com/Smira31/Mentalix/pull/621 'Standalone web authentication pull request'
[3]: https://github.com/Smira31/Mentalix/actions/runs/35082527869 'Cloudflare Owner QA deployment'
[4]: https://mentalix-owner-qa.pages.dev/?demo=1&tab=today 'Canonical Mentalix Demo Preview'
