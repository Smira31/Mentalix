# Owner QA findings — 2026-09-12

## Baseline screenshots

`qa-evidence/library-reader-refinement-2026-09-12/390x844-landing.png` показывает, что featured programme занимает заметно меньшую роль, чем ожидается для hero: карточка примерно 330×212 при боковых gutters около 30px, текст описания обрывается через `...`, а programme rail визуально показывает две карточки без выраженного partial-next affordance. Нижняя navigation визуально перекрывает верхнюю часть article cards: artwork/text continuity и нижняя граница articles не читаются.

`qa-evidence/library-reader-refinement-2026-09-12/390x844-article-start.png` показывает detail reader: верхний black header шире нижнего artwork inset; по бокам образуется ступенька. Внизу viewport виден частично перекрытый swipe hint/контент. Progress line в header выглядит как почти полный divider, несмотря на `1 из 3`.

## Кодовые гипотезы для проверки

- Featured geometry: `.mx-library-programs__featured` uses `aspect-ratio: 1.55`, `grid-template-columns: 38% 1fr`; copy max width 190px. This explains narrow text column and premature truncation.
- Programme/article rails share `flex-basis: 47%`; article cards share the same fixed height and grid, but article artwork and text are sibling children without an explicit single clipping wrapper beyond the button itself.
- Main scroll uses `padding-bottom: calc(88px + env(safe-area-inset-bottom))`; fixed bottom nav also has own 14px + safe area padding. Effective inset may be insufficient for the nav's full height.
- Reader uses a negative top offset and negative bottom margin: `.reader { top:-62px; height:calc(100% + 62px); margin:0 -18px -88px; }`, while header is full width and `.reader-art` is an independent inset rectangle. This likely causes hero notch/step and clipping.
- Reader progress is rendered as an absolutely positioned full-width gradient at the header bottom; percentage must be tied to article index (33/66/100), not a full divider.
- Intro/clarify flow likely has a structural min-height/centering rule in CSS after line 527; inspect before changing.

No API, backend, data, secrets, production or merge changes are intended.

## Final bounded sanity check — 2026-09-12

После удаления раннего дублирующего owner override и переноса правил в один canonical block post-patch screenshots сохранили ожидаемую геометрию. На landing featured занимает почти всю полезную ширину, description укладывается естественно, programme rail показывает partial third card, а articles имеют единый image/text surface и доступный нижний content inset. На reader header и artwork находятся внутри одной rounded outer card; progress для `1 из 3` занимает примерно треть ширины.

CSS conflict был локальным и ограничен `.mx-library-programs--review` selectors в этом UI Lab файле. Legacy block на строках 1025+ переопределял `.reader` margin, `.reader-header` border/radius, `.reader-slide` bottom padding, `.reader-art` width/border/radius, featured aspect ratio, small-program basis/height и intro flow `min-height`. Ранний owner block на строках 934+ был удалён полностью; canonical owner-QA block после legacy оставлен один раз и содержит все намеренные corrected values. Широкий refactor не выполнялся, поскольку legacy block включает остальные принятые density rules и затрагивание его структуры за пределами scope не нужно.

## Rework UI Lab — 2026-09-12

Работа выполнена от baseline `99240a0f`, без переноса изменений из `dcf3f2c6`. В `LibraryProgramsExperiment.jsx` landing приведён к единому языку: программы и статьи используют одинаковые featured-карточки с пропорцией 40/60, а статьи дополнительно имеют rail маленьких карточек. Для направленных записей сохранена отдельная featured-карточка без rail и добавлен обычный список строк. Во всех rails заданы единые размеры маленьких карточек: ширина 130px, padding 12px, radius 18px и glyph 26px; третья карточка частично подглядывает из контейнера.

Ридер статьи переведён на production-компонент `ArticleCover` с `variant="banner"`; кастомная рамка вокруг reader удалена, контент свободно расположен на фоне UI Lab. Intro, writing/question и completion GuidedJournal используют вертикальное центрирование внутри device-height вместо top-aligned layout с пустым нижним пространством. Логика навигации, `STORAGE_KEY`, session storage и экран «Ваши ответы» не менялись.

Новые screenshots сохранены в `qa-evidence/library-programs-ui-lab-2026-09-12-rework/`. Для 390×844 доступны `390x844-landing.png`, `390x844-article-start.png`, `390x844-guided-question-1.png`, `390x844-guided-completion.png`, а также промежуточные состояния reader, review и catalog. Визуально сверены landing, reader, question и completion; automated check прошёл на 320×568, 375×812, 390×844 и 430×932. `npm run build` завершился успешно; ESLint не обнаружил ошибок в изменённом JSX (остались четыре существующих warning о неиспользуемых параметрах/переменных).

## Rail cards rework — 2026-09-12

В `LibraryProgramsExperiment` карточки ProgramRail и ArticleRail переведены на общий `.mx-library-programs__rail-card` contract по production reference: ширина 43%, высота 238px, padding 14px/92px top, radius 22px, centered content и avatar 68×68. Программы получили описания из согласованного черновика; статьи используют duration badge, eyebrow category и двухстрочный intro, без статуса «Прочитано/Не прочитано». Before/after screenshots для viewport 390×844 сохранены в `qa-evidence/library-programs-rail-cards-2026-09-12/`. Build выполняется после изменений.
