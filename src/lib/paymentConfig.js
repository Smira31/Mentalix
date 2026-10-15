/*
 * PAY-UI-001: интерфейс оплаты Mentalix Pro (только фронтенд).
 *
 * Флаг VITE_PAYMENT_UI_ENABLED — по умолчанию выключен.
 * При выключенном флаге приложение выглядит и ведёт себя ровно как сейчас.
 * Включается только явной переменной окружения `VITE_PAYMENT_UI_ENABLED=true`
 * (Vite-флаг времени сборки/запуска dev-сервера).
 * Production-сборка флаг не получает.
 */
export const PAYMENT_UI_ENABLED = import.meta.env?.VITE_PAYMENT_UI_ENABLED === 'true'

/*
 * Цена Pro — единственный источник для приложения и тестов: 990 ₽ в месяц.
 * Годового тарифа нет, старых цен-заглушек быть не должно: и надпись, и
 * период все места берут отсюда.
 * Оплата идёт ВНЕ приложения: в Telegram — Tribute, в вебе — ЮKassa.
 * Автопродления нет.
 */
export const PRO_PRICE = '990 ₽'
export const PRO_PERIOD_LABEL = 'в месяц'
export const PRO_DURATION_DAYS = 30

// Ссылка товара в Tribute (открывается внутри Telegram через openTelegramLink).
export const TRIBUTE_TG_LINK = 'https://t.me/tribute/app?startapp=creatorProduct_165247'

// Запасная веб-ссылка Tribute.
export const TRIBUTE_WEB_LINK = 'https://web.tribute.tg/p/GZh'
