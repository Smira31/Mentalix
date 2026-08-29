# MXL-010 web fallback evidence

Локально на commit `29f156180941d5dc326f3e965124c42c2f6e1f3d` (`origin/main`) по адресу `http://127.0.0.1:5173/` приложение загрузилось без blank screen или runtime overlay. Видимый экран: `Вход в Mentalix`, подпись `Введи email — пришлём одноразовый код`, email input с placeholder `you@example.com` и кнопка `Получить код`.

Классификация: старт web fallback — **PASS**. Продолжение авторизации и весь пользовательский цикл — **BLOCKED**, поскольку нужен реальный одноразовый код и backend/API; реальные приватные данные не вводились. Screenshot browser session: `/home/ubuntu/screenshots/127_0_0_1_2026-08-29_11-30-53_6633.webp`.

Это не является доказательством поведения Telegram Mini App или iPhone WebView.
