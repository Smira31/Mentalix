/*
 * Реестр иллюстраций для экранов Даймона и профиля.
 * Владелец заменяет картинки одним файлом — достаточно поменять
 * значение здесь, не трогая экраны.
 *
 * Ключи:
 *   profileSiteFeather — перо в карточке «Mentalix на сайте» (профиль)
 *
 * Значение — React-компонент иллюстрации или null.
 * Экран корректно обрабатывает null: контент поднимается вверх,
 * без пустого места.
 */
import CompletionArtEvening from '../../components/CompletionArtEvening'
import { ProfileFeatherArt } from '../../screens/settings/ProfileBannerArt'
import { RitualsCollectionArt } from '../../components/practice-art/RitualsCollectionArt'

export const illustrations = {
  recordComplete: CompletionArtEvening,
  profileSiteFeather: ProfileFeatherArt,
  // Ключи для главного экрана «Шаги» (Stoic Explore-редизайн).
  // Пока null — экран рендерится без картинки, контент поднимается вверх.
  stepsHero: null,
  stepsCollectionsRituals: RitualsCollectionArt,
  stepsCollectionsAscezas: null,
  // Ключи для Журнала (отдельная практика).
  // Пока null — фолбэк на иконку книги (SemanticGlyph 'journal').
  // Владелец заменит слоты на свои иллюстрации.
  journalIntro: null,
  journalComplete: null,
  // Ключи для игры «Даймон».
  // daimonCard — карточка в каталоге «Шаги» и рейле «Новое и рекомендованное».
  //   Пока null — фолбэк на крупную залитую форму (SemanticGlyph 'daimon').
  // daimonIntro — пустой слот на входе в игру (текст поднят к середине экрана).
  // daimonHowTo — пустой слот сверху экрана «Как играть».
  // daimonFinish — пустой слот сверху экрана финала игры.
  daimonCard: null,
  daimonIntro: null,
  daimonHowTo: null,
  daimonFinish: null,
}
