/*
 * Реестр иллюстраций.
 * Владелец заменяет картинки одним файлом — достаточно поменять
 * значение здесь, не трогая экраны.
 *
 * Ключи:
 *   profileSiteFeather — перо в карточке «Mentalix на сайте» (профиль)
 *
 * Значение — React-компонент иллюстрации или null.
 * Экран корректно обрабатывает null: карточка без пера.
 */
import { ProfileFeatherArt } from '../../screens/settings/ProfileBannerArt'

export const illustrations = {
  profileSiteFeather: ProfileFeatherArt,
}
