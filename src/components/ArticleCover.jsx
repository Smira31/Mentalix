import Motif, { motifForArticle } from './Motif'

/*
 * ОБЛОЖКИ СТАТЕЙ
 *
 * Обложка рисуется кодом, а не берётся из файла. Причин две.
 * Во-первых, каждая новая статья иначе требовала бы отдельной
 * работы дизайнера, и рано или поздно картинки разъехались бы
 * по стилю. Во-вторых, изображения весят, а Mini App должен
 * открываться мгновенно.
 *
 * Раньше здесь жил свой набор из шести архетипов — лабиринт,
 * волна, нить. Он был сделан до общего языка мотивов и рядом с
 * ним читался как чужой: те же золотые линии, но другая
 * грамматика. Теперь обложка берёт мотив из общего реестра, и
 * библиотека говорит на одном языке с ритуалами и аскезами.
 *
 * Два размера: `block` — квадратный блок в карточке списка,
 * `banner` — широкая полоса над текстом самой статьи. Мотив у
 * них один и тот же, поэтому статья узнаётся при открытии.
 */

export default function ArticleCover({
  article,
  variant = 'block',
  className = '',
}) {
  const banner = variant === 'banner'

  return (
    <div
      className={[
        'bg-emerald-light overflow-hidden text-gold/70 flex items-center justify-center',
        banner ? 'w-full h-[150px] rounded-3xl' : 'rounded-2xl',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      <Motif
        name={motifForArticle(article)}
        className={banner ? 'w-full h-full p-5' : 'w-full h-full p-3.5'}
      />
    </div>
  )
}
