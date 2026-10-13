import crypto from 'node:crypto'
import fs from 'node:fs'
import zlib from 'node:zlib'

/*
 * MXL-TYPE-READABLE-001 — чтение кадров evidence без внешних зависимостей.
 *
 * Снимок экрана — единственное доказательство того, что состояние отрисовано,
 * поэтому кадры проверяются по пикселям: пустой (почти чёрный) кадр и кадр,
 * повторяющий другое состояние, — дефект evidence-конвейера, а не «особенность
 * рендера». Декодер поддерживает 8-битные PNG без интерлейса (то, что отдаёт
 * Playwright): цветовые типы 0/2/4/6, фильтры 0–4.
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
      const index = (y * width + x) * channels
      const luminance =
        0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]
      if (luminance > threshold) content += 1
    }
  }

  return {
    file,
    width,
    height,
    contentPixels: content,
    hash: crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12),
  }
}
