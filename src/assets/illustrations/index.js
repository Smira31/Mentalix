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
import { AscezasCollectionArt } from '../../components/practice-art/AscezasCollectionArt'
import { JournalCompleteArt } from '../../components/practice-art/JournalCompleteArt'
import { JournalIntroArt } from '../../components/practice-art/JournalIntroArt'
import { JournalHeroArt } from '../../components/practice-art/JournalHeroArt'
import { CatalogDieArt } from '../../components/practice-art/CatalogDieArt'
import { DaimonIntroArt } from '../../components/daimon-art/DaimonIntroArt'
import { DaimonHowToArt } from '../../components/daimon-art/DaimonHowToArt'
import { DaimonFinishArt } from '../../components/daimon-art/DaimonFinishArt'

export const illustrations = {
  recordComplete: CompletionArtEvening,
  profileSiteFeather: ProfileFeatherArt,
  // Ключи для главного экрана «Шаги» (Stoic Explore-редизайн).
  // Пока null — экран рендерится без картинки, контент поднимается вверх.
  stepsHero: JournalHeroArt,
  stepsCollectionsRituals: RitualsCollectionArt,
  stepsCollectionsAscezas: AscezasCollectionArt,
  // Ключи для Журнала (отдельная практика).
  // Пока null — фолбэк на иконку книги (SemanticGlyph 'journal').
  // Владелец заменит слоты на свои иллюстрации.
  journalIntro: JournalIntroArt,
  journalComplete: JournalCompleteArt,
  // Ключи для игры «Даймон».
  // daimonCard — карточка в каталоге «Шаги» и рейле «Новое и рекомендованное».
  //   Пока null — фолбэк на крупную залитую форму (SemanticGlyph 'daimon').
  // daimonIntro — иллюстрация на входе в игру (фигура с огнём и камнями).
  // daimonHowTo — иллюстрация сверху экрана «Как играть» (змея, кубик, стрела).
  // daimonFinish — иллюстрация сверху экрана финала игры (фигура у сердца).
  daimonCard: CatalogDieArt,
  daimonIntro: DaimonIntroArt,
  daimonHowTo: DaimonHowToArt,
  daimonFinish: DaimonFinishArt,
}
