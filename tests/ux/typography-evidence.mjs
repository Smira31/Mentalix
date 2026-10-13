import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

/*
 * MXL-TYPE-READABLE-001 — чтение кадров evidence без внешних зависимостей
 * и единственная точка съёмки экранов (createEvidenceWriter).
 *
 * Снимок экрана — единственное доказательство того, что состояние отрисовано,
 * поэтому кадры проверяются по пикселям: пустой (почти чёрный) кадр и кадр,
 * повторяющий другое состояние, — дефект evidence-конвейера, а не «особенность
 * рендера». Декодер поддерживает 8-битные PNG без интерлейса (то, что отдаёт
 * Playwright): цветовые типы 0/2/4/6, фильтры 0–4.
 *
 * Почему это не «лишняя строгость»: 13.10.2026 три разных экрана журнала
 * (настройка, «запись сохранена», «мои записи») дали один и тот же кадр.
 * Причина — не загрузка списка, а анимация входа полноэкранного слоя:
 * при reducedMotion: reduce слой проявляется прозрачностью 0 → 1 за 150 мс
 * (.mx-reduced-enter в src/index.css), а снимок делался сразу после клика.
 * В момент снимка слой полностью прозрачен, поэтому в кадр попадал не экран
 * журнала, а тёмный фон под ним — один и тот же для всех трёх состояний
 * (contentPixels = 0, одинаковый sha1). Отсюда три правила ниже: ждать
 * завершения анимации входа, требовать уникальный признак текущего экрана
 * и отвергать пустой или повторяющийся кадр.
 */

function decodePng(buffer) {
  let pos = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const chunks = []

  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos)
    const type = buffer.toString('ascii', pos + 4, pos + 8)
    const data = buffer.subarray(pos + 8, pos + 8 + length)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      chunks.push(data)
    } else if (type === 'IEND') {
      break
    }

    pos += 12 + length
  }

  if (bitDepth !== 8) throw new Error(`PNG bitDepth ${bitDepth} не поддержан`)
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
  if (!channels) throw new Error(`PNG colorType ${colorType} не поддержан`)

  const raw = zlib.inflateSync(Buffer.concat(chunks))
  const bytesPerPixel = channels
  const stride = width * bytesPerPixel
  const pixels = Buffer.alloc(height * stride)
  let read = 0

  for (let y = 0; y < height; y += 1) {
    const filter = raw[read]
    read += 1
    const row = raw.subarray(read, read + stride)
    read += stride
    const previous = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride)
    const current = pixels.subarray(y * stride, (y + 1) * stride)

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0
      const up = previous[x]
      const upLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0
      let value = row[x]

      if (filter === 1) value = (value + left) & 255
      else if (filter === 2) value = (value + up) & 255
      else if (filter === 3) value = (value + ((left + up) >> 1)) & 255
      else if (filter === 4) {
        const p = left + up - upLeft
        const pa = Math.abs(p - left)
        const pb = Math.abs(p - up)
        const pc = Math.abs(p - upLeft)
        value = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255
      }

      current[x] = value
    }
  }

  return { width, height, channels, pixels }
}

function luminance(pixels, channels, width, x, y) {
  const index = (y * width + x) * channels

  return 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]
}

/**
 * Сводка кадра: размер, хеш содержимого и число «содержательных» пикселей
 * ниже демо-шапки (кадр на телефоне: сверху рамка демо, под ней — экран).
 *
 * @param {string} file путь к PNG
 * @param {{headerRatio?: number, threshold?: number}} [options]
 */
export function frameStats(file, { headerRatio = 0.15, threshold = 60 } = {}) {
  const buffer = fs.readFileSync(file)
  const { width, height, channels, pixels } = decodePng(buffer)
  const start = Math.floor(height * headerRatio)
  let content = 0

  for (let y = start; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (luminance(pixels, channels, width, x, y) > threshold) content += 1
    }
  }

  return {
    file,
    width,
    height,
    contentPixels: content,
    contentRatio: content / (width * Math.max(1, height - start)),
    hash: crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12),
  }
}

/**
 * Яркие пиксели внутри области кадра (координаты — CSS-пиксели вьюпорта,
 * то есть то же, что отдаёт getBoundingClientRect при deviceScaleFactor 1).
 *
 * @param {string} file путь к PNG
 * @param {{x: number, y: number, width: number, height: number}} rect
 * @param {{threshold?: number}} [options]
 */
export function regionStats(file, rect, { threshold = 60 } = {}) {
  const { width, height, channels, pixels } = decodePng(fs.readFileSync(file))
  const x0 = Math.max(0, Math.floor(rect.x))
  const y0 = Math.max(0, Math.floor(rect.y))
  const x1 = Math.min(width, Math.ceil(rect.x + rect.width))
  const y1 = Math.min(height, Math.ceil(rect.y + rect.height))
  let bright = 0
  let sampled = 0

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      sampled += 1
      if (luminance(pixels, channels, width, x, y) > threshold) bright += 1
    }
  }

  return { bright, sampled, brightRatio: sampled ? bright / sampled : 0 }
}

/**
 * Съёмка экранов с проверкой, что кадр действительно принадлежит этому экрану.
 *
 * Правила (каждое закрывает свой способ получить ложный кадр):
 *  1) ждём уникальный признак экрана — элемент, который есть только здесь;
 *  2) ждём завершения анимации входа полноэкранного слоя (иначе кадр тёмный);
 *  3) снимаем с `animations: 'disabled'` — оставшиеся CSS-анимации доводятся
 *     до конечного состояния до кадра;
 *  4) признак экрана на месте после снимка;
 *  5) внутри области признака в кадре есть собственные пиксели экрана
 *     (содержимое отрисовано, а не подменено фоном);
 *  6) кадр не пустой и его хеш не совпадает с хешем другого снятого состояния.
 *
 * @param {{dir: string, minContentRatio?: number, minMarkerRatio?: number}} options
 */
export function createEvidenceWriter({
  dir,
  minContentRatio = 0.001,
  minMarkerRatio = 0.005,
} = {}) {
  const frames = []
  const byHash = new Map()

  async function waitForSurfaceEnter(page, timeout = 5_000) {
    await page
      .waitForFunction(
        () => {
          if (document.querySelector('[data-fullscreen-exit="true"]')) return false
          const surface = document.querySelector('.mx-fullscreen-surface')
          if (!surface) return true
          if (Number.parseFloat(getComputedStyle(surface).opacity) < 0.99) return false
          const rect = surface.getBoundingClientRect()
          return rect.width >= window.innerWidth - 2 && rect.height >= window.innerHeight - 2
        },
        null,
        { timeout }
      )
      .catch(() => {})
  }

  /**
   * @param {import('@playwright/test').Page} page
   * @param {{name: string, marker: string, markerLabel?: string}} options
   */
  async function capture(page, { name, marker, markerLabel = marker }) {
    fs.mkdirSync(dir, { recursive: true })
    const markerLocator = page.locator(marker).first()

    await markerLocator.waitFor({ state: 'visible', timeout: 8_000 })
    await waitForSurfaceEnter(page)

    const file = path.join(dir, name)
    await page.screenshot({ path: file, animations: 'disabled' })

    if (!(await markerLocator.isVisible().catch(() => false))) {
      throw new Error(`${name}: признак экрана «${markerLabel}» исчез во время снимка`)
    }

    const stats = frameStats(file)
    if (stats.contentRatio < minContentRatio) {
      throw new Error(
        `${name}: пустой кадр (${stats.contentPixels} содержательных пикселей) — снимок сделан не на отрисованном экране «${markerLabel}»`
      )
    }

    const previous = byHash.get(stats.hash)
    if (previous) {
      throw new Error(
        `кадры разных экранов совпали: «${previous}» и «${name}» (sha1 ${stats.hash}) — снимок не показывает текущий экран`
      )
    }

    const box = await markerLocator.boundingBox()
    let region = null
    if (box && box.y + box.height > 0 && box.y < stats.height && box.width > 0) {
      region = regionStats(file, box)
      if (region.brightRatio < minMarkerRatio) {
        throw new Error(
          `${name}: область признака «${markerLabel}» в кадре пуста (${region.bright} ярких пикселей) — экран не отрисован`
        )
      }
    }

    byHash.set(stats.hash, name)
    frames.push({ name, marker: markerLabel, hash: stats.hash, contentPixels: stats.contentPixels })
    return { ...stats, markerLabel, region }
  }

  return { dir, capture, frames }
}

/** Сводка по снятым кадрам — печатается в отчёт теста. */
export function describeFrames(writer) {
  return writer.frames.map(frame => `${frame.name} ${frame.hash} (${frame.contentPixels} px)`).join('\n')
}
