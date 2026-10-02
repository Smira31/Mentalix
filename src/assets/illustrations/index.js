/*
 * Реестр иллюстраций для экранов Следопыта, «Записи» и профиля.
 * Владелец заменяет картинки одним файлом — достаточно поменять
 * значение здесь, не трогая экраны.
 *
 * Ключи:
 *   trackerStart   — старт Следопыта (пока null, экран без картинки)
 *   recordIntro    — вступление «Записи» (пока null, экран без картинки)
 *   recordComplete — финал «Записи» (временно — арт финала вечернего разбора)
 *   profileSiteFeather — перо в карточке «Mentalix на сайте» (профиль)
 *
 * Значение — React-компонент иллюстрации или null.
 * Экран корректно обрабатывает null: контент поднимается вверх,
 * без пустого места.
 */
import CompletionArtEvening from '../../components/CompletionArtEvening'
import { ProfileFeatherArt } from '../../screens/settings/ProfileBannerArt'

export const illustrations = {
  trackerStart: null,
  recordIntro: null,
  recordComplete: CompletionArtEvening,
  profileSiteFeather: ProfileFeatherArt,
  // Ключи для главного экрана «Шаги» (Stoic Explore-редизайн).
  // Пока null — экран рендерится без картинки, контент поднимается вверх.
  stepsHero: null,
  stepsCollectionsRituals: null,
  stepsCollectionsAscezas: null,
  // Ключи для Журнала (отдельная практика).
  // Пока null — фолбэк на иконку книги (SemanticGlyph 'journal').
  // Владелец заменит слоты на свои иллюстрации.
  journalIntro: null,
  journalComplete: null,
}
