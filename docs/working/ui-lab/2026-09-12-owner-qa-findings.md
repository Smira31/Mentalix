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
