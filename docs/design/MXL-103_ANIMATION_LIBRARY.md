# MXL-103 — Mentalix animation library

Each approved animation records `motion_id`, purpose, trigger, duration, easing, affected property, reduced-motion behavior, performance risk and example screen. Motion exists to explain state or response, not to increase pressure or time-in-app.

| Pattern | Default | Reduced motion |
| --- | --- | --- |
| page/state enter | opacity + small translate, 180–240ms | opacity or instant |
| completion feedback | short scale/opacity response | static success state |
| loading | skeleton or restrained opacity pulse | static placeholder |
| error | no shake by default | static error copy |

Avoid looping decorative motion, parallax, surprise movement and animations that obscure keyboard focus. Any production addition requires a before/after smoke check at mobile and desktop widths.
