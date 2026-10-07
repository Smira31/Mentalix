/*
 * PracticeIcon — рендерит трассированные иконки практик по ключу глифа.
 * Заменяет SemanticGlyph в потоках ритуалов и аскез.
 *
 * fill="currentColor" — цвет иконки задаётся CSS-свойством color родителя,
 * что позволяет переключать белую иконку на тёмном круге ↔ тёмную на белом.
 *
 * Старые ключи глифов (из существующих записей пользователей) алиасятся
 * на новые — миграция данных не нужна, меняется только отрисовка.
 */

import { IconHourglass } from './practice-art/IconHourglass'
import { IconGlass } from './practice-art/IconGlass'
import { IconSneaker } from './practice-art/IconSneaker'
import { IconBook } from './practice-art/IconBook'
import { IconWaves } from './practice-art/IconWaves'
import { IconJournal } from './practice-art/IconJournal'
import { IconPhoneSlash } from './practice-art/IconPhoneSlash'
import { IconPrayingHands } from './practice-art/IconPrayingHands'
import { IconShower } from './practice-art/IconShower'
import { IconMeditation } from './practice-art/IconMeditation'
import { IconShield } from './practice-art/IconShield'
import { IconCandy } from './practice-art/IconCandy'
import { IconPhonePlay } from './practice-art/IconPhonePlay'
import { IconWineGlass } from './practice-art/IconWineGlass'
import { IconCoffee } from './practice-art/IconCoffee'
import { IconSpeechSlash } from './practice-art/IconSpeechSlash'
import { IconShoppingBag } from './practice-art/IconShoppingBag'
import { IconCigarette } from './practice-art/IconCigarette'
import { IconStar } from './practice-art/IconStar'
import { IconTarget } from './practice-art/IconTarget'

// Старые ключи → новые (для существующих записей без миграции)
const GLYPH_ALIASES = {
  water: 'glass',
  breath: 'waves',
  alcohol: 'wine-glass',
  smoking: 'cigarette',
  asceza: 'shield',
  ritual: 'hourglass',
  purpose: 'star',
  focus: 'target',
  prayer: 'praying-hands',
}

const GLYPH_COMPONENTS = {
  hourglass: IconHourglass,
  glass: IconGlass,
  sneaker: IconSneaker,
  book: IconBook,
  waves: IconWaves,
  journal: IconJournal,
  'phone-slash': IconPhoneSlash,
  'praying-hands': IconPrayingHands,
  shower: IconShower,
  meditation: IconMeditation,
  shield: IconShield,
  candy: IconCandy,
  'phone-play': IconPhonePlay,
  'wine-glass': IconWineGlass,
  coffee: IconCoffee,
  'speech-slash': IconSpeechSlash,
  'shopping-bag': IconShoppingBag,
  cigarette: IconCigarette,
  star: IconStar,
  target: IconTarget,
}

export function resolveGlyphKey(key) {
  return GLYPH_ALIASES[key] || key
}

export const PRACTICE_ICON_KEYS = Object.keys(GLYPH_COMPONENTS)

export default function PracticeIcon({ glyph, className = '' }) {
  const resolvedKey = resolveGlyphKey(glyph)
  const IconComponent = GLYPH_COMPONENTS[resolvedKey] || GLYPH_COMPONENTS.hourglass
  return <IconComponent className={`mx-practice-icon ${className}`.trim()} />
}
