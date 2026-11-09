/*
 * Иконки PWA Mentalix — сова с исходника docs/sources/brand/owl-icon-source.jpg
 * (issue #1151).
 *
 * Светлое кольцо на исходнике убирается не дорисовкой, а маской: скрипт
 * находит окружность кольца по внешней границе ярких пикселей, обрезает всё
 * от внутреннего края кольца наружу и поднимает фон до #050403 (max по
 * каналам), поэтому остаются только пиксели совы. Кольцо не пересекает тело
 * совы: между ними есть тёмный зазор, который и служит границей обрезки.
 *
 * Запуск (в web-контейнере, Playwright уже установлен):
 *   node scripts/generate-owl-icons.mjs
 * Пишет public/icons/icon-192.png, public/icons/icon-512.png,
 * public/icons/icon-maskable-512.png и public/apple-touch-icon.png.
 */

import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const SOURCE = new URL('../docs/sources/brand/owl-icon-source.jpg', import.meta.url)
const BACKGROUND = [5, 4, 3] // #050403 — фон иконки и theme-color приложения
const MASKABLE_CONTENT = 0.76 // сова целиком внутри центральных 80% maskable

const source = await fs.readFile(SOURCE)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

/* Вся пиксельная работа — в браузере: он умеет декодировать JPEG и отдавать PNG. */
const result = await page.evaluate(
  async ({ b64, background, maskableContent }) => {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Не удалось открыть исходник'))
      image.src = `data:image/jpeg;base64,${b64}`
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)
    const { width: W, height: H, data } = imageData
    const lum = (x, y) => {
      const i = (y * W + x) * 4
      return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    }

    /* 1. Внешняя граница кольца: для каждого луча — самый дальний яркий пиксель. */
    const cx0 = (W - 1) / 2
    const cy0 = (H - 1) / 2
    const outer = []
    for (let a = 0; a < 720; a += 1) {
      const rad = (a * Math.PI) / 360
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      for (let r = Math.min(W, H) / 2; r > Math.min(W, H) * 0.3; r -= 0.5) {
        const x = Math.round(cx0 + r * cos)
        const y = Math.round(cy0 + r * sin)
        if (x < 0 || y < 0 || x >= W || y >= H) continue
        if (lum(x, y) > 100) {
          outer.push({ cos, sin, r })
          break
        }
      }
    }
    if (outer.length < 700) throw new Error('Кольцо не найдено на исходнике')

    /* 2. Круг по внешней границе (алгебраический МНК). */
    let Sx = 0
    let Sy = 0
    let Sxx = 0
    let Syy = 0
    let Sxy = 0
    let Sxz = 0
    let Syz = 0
    let Sz = 0
    for (const p of outer) {
      const x = cx0 + p.r * p.cos
      const y = cy0 + p.r * p.sin
      const z = x * x + y * y
      Sx += x
      Sy += y
      Sxx += x * x
      Syy += y * y
      Sxy += x * y
      Sxz += x * z
      Syz += y * z
      Sz += z
    }
    const n = outer.length
    const A = [
      [Sxx, Sxy, Sx],
      [Sxy, Syy, Sy],
      [Sx, Sy, n],
    ]
    const b = [Sxz, Syz, Sz]
    for (let i = 0; i < 3; i += 1) {
      let pivot = i
      for (let k = i + 1; k < 3; k += 1) if (Math.abs(A[k][i]) > Math.abs(A[pivot][i])) pivot = k
      ;[A[i], A[pivot]] = [A[pivot], A[i]]
      ;[b[i], b[pivot]] = [b[pivot], b[i]]
      for (let k = i + 1; k < 3; k += 1) {
        const f = A[k][i] / A[i][i]
        for (let j = i; j < 3; j += 1) A[k][j] -= f * A[i][j]
        b[k] -= f * b[i]
      }
    }
    const sol = [0, 0, 0]
    for (let i = 2; i >= 0; i -= 1) {
      let sum = b[i]
      for (let j = i + 1; j < 3; j += 1) sum -= A[i][j] * sol[j]
      sol[i] = sum / A[i][i]
    }
    const ringCx = sol[0] / 2
    const ringCy = sol[1] / 2
    const ringOuter = Math.sqrt(sol[2] + ringCx * ringCx + ringCy * ringCy)

    /* 3. Внутренний край кольца по лучам. Сова местами подходит к кольцу
       вплотную и перекрывает его внутреннюю сторону — там пробег получается
       слишком широким, поэтому такие лучи отбрасываются, а за границу берётся
       нижний процентиль: кольцо начинается не раньше него ни в одном луче. */
    const innerEdges = []
    for (let a = 0; a < 720; a += 1) {
      const rad = (a * Math.PI) / 360
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      let start = null
      let end = null
      for (let r = ringOuter + 1; r > ringOuter - 14; r -= 0.25) {
        const x = Math.round(ringCx + r * cos)
        const y = Math.round(ringCy + r * sin)
        if (x < 0 || y < 0 || x >= W || y >= H) continue
        const bright = lum(x, y) > 60
        if (bright) {
          if (end === null) end = r
          start = r
        } else if (end !== null) break
      }
      if (start !== null && end - start <= 14) innerEdges.push(start)
    }
    innerEdges.sort((p, q) => p - q)
    const ringInner = innerEdges[Math.floor(innerEdges.length * 0.02)]
    const ringThickness = ringOuter - ringInner
    /* Обрезка на 0.75px внутри внутреннего края кольца: убирает его сглаживание. */
    const cut = ringInner - 0.75

    /* 4. Чистое полотно: снаружи cut — фон, внутри — max(пиксель, фон). */
    const master = new Uint8ClampedArray(W * H * 4)
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4
        const keep = Math.hypot(x - ringCx, y - ringCy) < cut
        for (let c = 0; c < 3; c += 1) master[i + c] = keep ? Math.max(data[i + c], background[c]) : background[c]
        master[i + 3] = 255
      }
    }

    /* 5. Габариты совы после очистки. */
    let minX = W
    let minY = H
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4
        const l = 0.2126 * master[i] + 0.7152 * master[i + 1] + 0.0722 * master[i + 2]
        if (l > background[0] + 8) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    const bbox = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
    bbox.cx = minX + bbox.w / 2
    bbox.cy = minY + bbox.h / 2

    /* 6. Площадное уменьшение с произвольным окном источника. */
    const render = (size, contentFraction) => {
      const side = Math.max(bbox.w, bbox.h) / contentFraction
      const x0 = bbox.cx - side / 2
      const y0 = bbox.cy - side / 2
      const out = document.createElement('canvas')
      out.width = size
      out.height = size
      const octx = out.getContext('2d')
      const outData = octx.createImageData(size, size)
      const scale = side / size
      for (let y = 0; y < size; y += 1) {
        const sy0 = y0 + y * scale
        const sy1 = sy0 + scale
        for (let x = 0; x < size; x += 1) {
          const sx0 = x0 + x * scale
          const sx1 = sx0 + scale
          let r = 0
          let g = 0
          let b = 0
          let weight = 0
          for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy += 1) {
            const wy = Math.min(sy + 1, sy1) - Math.max(sy, sy0)
            if (wy <= 0) continue
            for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx += 1) {
              const wx = Math.min(sx + 1, sx1) - Math.max(sx, sx0)
              if (wx <= 0) continue
              const w = wx * wy
              const inside = sx >= 0 && sy >= 0 && sx < W && sy < H
              const i = inside ? (sy * W + sx) * 4 : -1
              r += w * (inside ? master[i] : background[0])
              g += w * (inside ? master[i + 1] : background[1])
              b += w * (inside ? master[i + 2] : background[2])
              weight += w
            }
          }
          const d = (y * size + x) * 4
          outData.data[d] = Math.round(r / weight)
          outData.data[d + 1] = Math.round(g / weight)
          outData.data[d + 2] = Math.round(b / weight)
          outData.data[d + 3] = 255
        }
      }
      octx.putImageData(outData, 0, 0)
      return out.toDataURL('image/png')
    }

    /* 7. Пропорция «сова к квадрату» как на исходнике: кольцо было его рамкой. */
    const contentFraction = Math.max(bbox.w, bbox.h) / Math.max(W, H)
    return {
      metrics: {
        source: { width: W, height: H },
        ring: {
          cx: +ringCx.toFixed(2),
          cy: +ringCy.toFixed(2),
          outer: +ringOuter.toFixed(2),
          inner: +ringInner.toFixed(2),
          thickness: +ringThickness.toFixed(2),
          cut: +cut.toFixed(2),
        },
        owl: bbox,
        contentFraction: +contentFraction.toFixed(4),
      },
      icons: {
        'public/icons/icon-192.png': render(192, contentFraction),
        'public/icons/icon-512.png': render(512, contentFraction),
        'public/apple-touch-icon.png': render(180, contentFraction),
        'public/icons/icon-maskable-512.png': render(512, maskableContent),
      },
    }
  },
  { b64: source.toString('base64'), background: BACKGROUND, maskableContent: MASKABLE_CONTENT }
)

await browser.close()

for (const [path, dataUrl] of Object.entries(result.icons)) {
  await fs.writeFile(new URL(`../${path}`, import.meta.url), Buffer.from(dataUrl.split(',')[1], 'base64'))
}

console.log(JSON.stringify(result.metrics, null, 2))
console.log(Object.keys(result.icons).join('\n'))
