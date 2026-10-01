/*
 * Реестр иллюстраций для экранов Следопыта и «Записи».
 * Владелец заменяет картинки одним файлом — достаточно поменять
 * значение здесь, не трогая экраны.
 *
 * Ключи:
 *   trackerStart   — старт Следопыта (пока null, экран без картинки)
 *   recordIntro    — вступление «Записи» (пока null, экран без картинки)
 *   recordComplete — финал «Записи» (временно — арт финала вечернего разбора)
 *
 * Значение — React-компонент иллюстрации или null.
 * Экран корректно обрабатывает null: контент поднимается вверх,
 * без пустого места.
 */
import CompletionArtEvening from '../../components/CompletionArtEvening'

export const illustrations = {
  trackerStart: null,
  recordIntro: null,
  recordComplete: CompletionArtEvening,
}
