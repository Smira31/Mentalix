/*
 * Mentalix Pro (PRO-002b/c): флаг фичи на frontend.
 *
 * По умолчанию выключен: включается только явной переменной окружения
 * `VITE_PRO_REVIEW_PLAN_ENABLED=true` (Vite-флаг времени сборки/запуска
 * dev-сервера). Production-сборка флаг не получает, поэтому раздел
 * не виден и запросы к /api/pro не отправляются. Бэкенд-флаги
 * (PRO_WEEKLY_REPORT_ENABLED и т. д.) здесь не включаются — их решение
 * остаётся за backend-репозиторием.
 */
export const PRO_REVIEW_PLAN_ENABLED = import.meta.env?.VITE_PRO_REVIEW_PLAN_ENABLED === 'true'
