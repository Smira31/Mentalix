import { useId } from 'react'

/*
 * МОТИВЫ — единый визуальный язык Mentalix
 *
 * Тринадцать рисунков, из которых складываются карточки ритуалов,
 * аскез и персон. Правила, по которым они сделаны:
 *
 *   1. Только прямые. Отрезок, ломаная, веер, сетка. Единственное
 *      круглое — точка света, и она не фигура, а свет.
 *   2. Один центр. Всё остальное — то, как линии к нему идут или
 *      от него расходятся.
 *   3. Всё рисуется currentColor. Иерархия держится прозрачностью,
 *      а не вторым цветом, — поэтому светлая тема работает сама,
 *      без второго набора рисунков.
 *   4. Ничего не касается краёв: поле 200×200, рабочая зона 12..188.
 *
 * Смысл задаётся геометрией, а не предметом: повтор — ряд засечек,
 * накопление — ступени, отказ — коридор, разговор — сетка между
 * двумя равными огнями. Поэтому мотивов хватает на весь список
 * ритуалов и хватит на будущие: они про характер действия, а не
 * про его реквизит.
 */

const C = 'currentColor'

/* ── примитивы ───────────────────────────────────────────── */

const r2 = (n) => Math.round(n * 100) / 100

const polar = (cx, cy, r, deg) => [
  r2(cx + r * Math.cos((deg * Math.PI) / 180)),
  r2(cy + r * Math.sin((deg * Math.PI) / 180)),
]

function ln(key, x1, y1, x2, y2, o = 0.35, w = 1, dash) {
  return (
    <line
      key={key}
      x1={r2(x1)}
      y1={r2(y1)}
      x2={r2(x2)}
      y2={r2(y2)}
      stroke={C}
      strokeOpacity={r2(o)}
      strokeWidth={w}
      strokeLinecap="round"
      strokeDasharray={dash}
    />
  )
}

const dot0 = '0.1 6'

function pt(key, x, y, r, o = 1) {
  return <circle key={key} cx={r2(x)} cy={r2(y)} r={r2(r)} fill={C} fillOpacity={r2(o)} />
}

function pl(key, points, o = 0.4, w = 1, dash) {
  const d = points.map((p, i) => (i ? 'L' : 'M') + r2(p[0]) + ' ' + r2(p[1])).join('')

  return (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={C}
      strokeOpacity={r2(o)}
      strokeWidth={w}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dash}
    />
  )
}

function glow(key, gid, x, y, r) {
  return <circle key={key} cx={x} cy={y} r={r} fill={`url(#${gid})`} />
}

function core(gid, x, y, r = 4.2, g = 34) {
  return [glow('gl', gid, x, y, g), pt('cr', x, y, r)]
}

function fan(prefix, cx, cy, from, to, count, r0, r1, o = 0.5, w = 0.8) {
  const out = []

  for (let i = 0; i < count; i++) {
    const a = from + ((to - from) * i) / (count - 1)
    const [x0, y0] = polar(cx, cy, r0, a)
    const [x1, y1] = polar(cx, cy, typeof r1 === 'function' ? r1(i, count) : r1, a)

    out.push(ln(`${prefix}${i}`, x0, y0, x1, y1, o, w))
  }

  return out
}

// Точка на периметре квадрата — так «схождение» остаётся
// угловатым: лучи упираются в рамку кадра, а не в окружность.
function squarePoint(t, inset) {
  const side = 200 - 2 * inset
  const d = (t % 1) * side * 4

  if (d < side) return [inset + d, inset]
  if (d < 2 * side) return [200 - inset, inset + (d - side)]
  if (d < 3 * side) return [200 - inset - (d - 2 * side), 200 - inset]

  return [inset, 200 - inset - (d - 3 * side)]
}

/*
 * Псевдослучайность нужна для «шума» снаружи коридора, но она
 * обязана быть одинаковой при каждом рендере: иначе рисунок
 * дёргается на любом обновлении состояния карточки. Поэтому
 * генератор с зерном, а не Math.random.
 */
function rng(seed) {
  let s = seed

  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
}

function scatter(seed, count, build) {
  const random = rng(seed)
  const out = []

  for (let i = 0; i < count; i++) out.push(build(random, i))

  return out
}

/*
 * Кадр обрезан по самому рисунку, а не по условному полю 200×200.
 * Иначе мотив выходит маленьким: он занимал бы середину квадрата,
 * а квадрат — середину широкой полосы карточки, и потери
 * складывались бы дважды. Значения посчитаны getBBox по реальной
 * отрисовке с полем 6 единиц; менять руками не нужно — если
 * геометрия мотива изменилась, пересчитать заново.
 */
const VIEWBOX = {
  ryad: [18, 40, 164, 114],
  voshod: [12, 52, 176, 132],
  lestnica: [28, 26, 172, 148],
  shozhdenie: [12, 12, 176, 176],
  noch: [14, 14, 172, 162],
  fizio: [4, 18, 190, 164],
  psiho: [2, 2, 196, 196],
  povedenie: [2, 14, 196, 182],
  cifra: [4, 18, 192, 168],
  pishevoe: [3, 9, 194, 183],
  sobesednik: [24, 66, 152, 68],
  nastavnik: [18, 6, 176, 176],
  sledopyt: [12, 43, 176, 139],
}

const STARS = {}

// Звёзды раскладываются внутри обрезанного кадра, иначе часть их
// оказалась бы за его пределами и просто не отрисовалась.
function stars(key, seed, count = 14) {
  if (!STARS[key]) {
    const [vx, vy, vw, vh] = VIEWBOX[key] || [0, 0, 200, 200]

    STARS[key] = scatter(seed, count, (random, i) =>
      pt(
        `s${i}`,
        vx + vw * 0.04 + random() * vw * 0.92,
        vy + vh * 0.04 + random() * vh * 0.92,
        0.7 + random() * 0.6,
        0.07 + random() * 0.13,
      ),
    )
  }

  return STARS[key]
}

/* ── ритуалы ─────────────────────────────────────────────── */

// Повтор. Семь одинаковых засечек, сегодняшняя выше и светится.
function ryad(gid) {
  const out = [ln('base', 26, 134, 174, 134, 0.26), ln('top', 24, 86, 176, 86, 0.14, 1, dot0)]

  for (let i = 0; i < 7; i++) {
    const x = 34 + i * 22
    const active = i === 3

    out.push(ln(`v${i}`, x, 134, x, active ? 78 : 108, active ? 0.75 : 0.3, active ? 1.3 : 1))

    if (!active) out.push(pt(`d${i}`, x, 108, 1.9, 0.45))
  }

  out.push(ln('foot', 88, 148, 112, 148, 0.2), ...core(gid, 100, 78, 3.8, 32))

  return out
}

// Начало. Точка на горизонте и слои, которые от неё расходятся.
function voshod(gid) {
  return [
    ln('l1', 40, 104, 160, 104, 0.2),
    ln('l2', 54, 80, 146, 80, 0.14),
    ln('l3', 68, 58, 132, 58, 0.09),
    ...fan('r', 100, 136, 194, 346, 15, 13, (i, n) => 26 + (i % 2 ? 10 : 0) + Math.sin((i / (n - 1)) * Math.PI) * 12),
    ln('h', 18, 136, 182, 136, 0.45),
    pt('a', 46, 136, 2.2, 0.5),
    pt('b', 156, 136, 2.4, 0.6),
    ...core(gid, 100, 136, 4.6, 42),
  ]
}

// Накопление. Каждый раз на ступень выше предыдущего.
function lestnica(gid) {
  const steps = []
  let x = 40
  let y = 158

  steps.push([x, y])

  for (let i = 0; i < 6; i++) {
    x += 20
    steps.push([x, y])
    y -= 15.33
    steps.push([x, y])
  }

  const out = [ln('guide', 34, 164, 166, 60, 0.13, 1, dot0), pl('steps', steps, 0.45)]

  for (let i = 1; i <= 6; i++) {
    out.push(pt(`n${i}`, 40 + i * 20, 158 - i * 15.33, 1.4 + i * 0.35, 0.28 + i * 0.12))
  }

  out.push(ln('foot', 40, 158, 40, 168, 0.22), ...core(gid, 160, 66, 3.8, 34))

  return out
}

// Всё лишнее держится по краю, внимание сходится в точку.
function shozhdenie(gid) {
  const out = [pl('frame', [[18, 18], [182, 18], [182, 182], [18, 182], [18, 18]], 0.09)]

  for (let i = 0; i < 44; i++) {
    const [ox, oy] = squarePoint(i / 44 + 0.011, 18)
    const dx = 100 - ox
    const dy = 100 - oy
    const len = Math.hypot(dx, dy)
    const k = (len - 30) / len

    out.push(ln(`c${i}`, ox, oy, ox + dx * k, oy + dy * k, 0.12 + (i % 4) * 0.06, 0.8))
  }

  out.push(...core(gid, 100, 100, 4.6, 48))

  return out
}

// Завершение. Свет стоит высоко, а внизу — ровные слои.
function noch(gid) {
  return [
    ln('w1', 20, 140, 180, 140, 0.45, 1.1),
    ln('w2', 30, 151, 170, 151, 0.34, 1.1),
    ln('w3', 42, 161, 158, 161, 0.24, 1.1),
    ln('w4', 56, 170, 144, 170, 0.15, 1.1),
    ln('col', 100, 74, 100, 168, 0.4, 1, dot0),
    ln('r1', 88, 140, 112, 140, 0.75, 1.3),
    ln('r2', 92, 151, 108, 151, 0.5, 1.2),
    ln('r3', 95, 161, 105, 161, 0.3, 1.1),
    pt('s1', 52, 48, 1.8, 0.45),
    pt('s2', 150, 68, 1.5, 0.35),
    pt('s3', 132, 34, 1.2, 0.28),
    ...core(gid, 100, 62, 4.4, 42),
  ]
}

/* ── аскезы ──────────────────────────────────────────────── */

/*
 * Общий жест всех пяти категорий — коридор из двух прямых.
 * Снаружи тот же материал в беспорядке, внутри — он же, но
 * упорядоченный. Это и есть «отказ от лишнего, выбор свободы»:
 * граница не отнимает, а держит.
 */

const LX = 66
const RX = 134

function corridor() {
  return [
    ln('cl', LX, 26, LX, 174, 0.55),
    ln('cr', RX, 26, RX, 174, 0.55),
    ln('ct', LX, 26, RX, 26, 0.16, 1, dot0),
    ln('cb', LX, 174, RX, 174, 0.16, 1, dot0),
  ]
}

// Вертикальный зигзаг: ровный внутри, рваный снаружи.
function zig(x, y0, y1, amp, segs, random) {
  const pts = []

  for (let i = 0; i <= segs; i++) {
    const y = y0 + ((y1 - y0) * i) / segs
    const a = random ? amp * (0.25 + random() * 1.35) : amp

    pts.push([x + (i === 0 || i === segs ? 0 : i % 2 ? a : -a), y])
  }

  return pts
}

const NOISE_PHYSIO = (() => {
  const random = rng(11)

  return [22, 40, 160, 178].map((x, i) => pl(`z${i}`, zig(x, 24, 176, 9, 11, random), 0.14 + random() * 0.16, 0.9))
})()

// Снаружи — рваный ритм. Внутри — ровный.
function fizio(gid) {
  return [
    ...corridor(),
    ...NOISE_PHYSIO,
    pl('pulse', zig(100, 40, 160, 15, 8), 0.7, 1.2),
    glow('gl', gid, 100, 100, 30),
    pt('cr', 100, 100, 2.6),
  ]
}

const NOISE_PSYCHO = scatter(23, 16, (random, i) => {
  const x0 = i % 2 === 0 ? 10 + random() * 48 : 142 + random() * 48
  const y0 = 16 + random() * 168
  const [x1, y1] = polar(x0, y0, 26 + random() * 46, random() * 360)

  return ln(`k${i}`, x0, y0, Math.max(8, Math.min(192, x1)), Math.max(8, Math.min(192, y1)), 0.12 + random() * 0.16, 0.9)
})

// Снаружи — узел из линий. Внутри — одна прямая.
function psiho(gid) {
  return [
    ...corridor(),
    ...NOISE_PSYCHO,
    ln('axis', 100, 40, 100, 160, 0.7, 1.2),
    glow('gl', gid, 100, 100, 28),
    pt('cr', 100, 100, 3),
  ]
}

const clamp = (v) => Math.max(8, Math.min(192, v))

const NOISE_SOCIAL = scatter(37, 20, (random, i) => {
  const x0 = i % 2 === 0 ? 14 + random() * 40 : 146 + random() * 40
  const y0 = 20 + random() * 160
  const [x1, y1] = polar(x0, y0, 10 + random() * 16, random() * 360)

  return ln(`t${i}`, x0, y0, clamp(x1), clamp(y1), 0.14 + random() * 0.18, 0.9)
})

// Снаружи — случайные штрихи. Внутри — ровный шаг.
function povedenie(gid) {
  const out = [...corridor(), ...NOISE_SOCIAL]

  for (let i = 0; i < 6; i++) {
    const last = i === 5

    out.push(ln(`m${i}`, 86, 48 + i * 22, 114, 48 + i * 22, last ? 0.85 : 0.5, last ? 1.3 : 1))
  }

  out.push(glow('gl', gid, 100, 100, 30))

  return out
}

// Снаружи — сигнал давит с двух сторон. Внутри — тихо.
function cifra(gid) {
  const out = [...corridor()]

  for (let i = 0; i < 13; i++) {
    const y = 24 + i * 13
    const w = 14 + ((i * 7) % 5) * 8
    const o = 0.1 + ((i * 3) % 5) * 0.05

    out.push(ln(`sl${i}`, 10, y, 10 + w, y, o, 0.9))
    out.push(ln(`sr${i}`, 190 - w, y, 190, y, o, 0.9))
  }

  out.push(pt('e1', 56, 100, 1.6, 0.3), pt('e2', 144, 100, 1.6, 0.3), glow('gl', gid, 100, 100, 38), pt('cr', 100, 100, 4.4))

  return out
}

const NOISE_FOOD = scatter(53, 60, (random, i) =>
  pt(
    `f${i}`,
    i % 2 === 0 ? 11 + random() * 46 : 143 + random() * 46,
    15 + random() * 170,
    0.9 + random() * 1.5,
    0.1 + random() * 0.3,
  ),
)

// Снаружи — россыпь. Внутри — три засечки, мера.
function pishevoe(gid) {
  return [
    ...corridor(),
    ...NOISE_FOOD,
    ln('axis', 100, 56, 100, 144, 0.28, 1, dot0),
    pt('m1', 100, 64, 3),
    pt('m2', 100, 100, 3),
    pt('m3', 100, 136, 3),
    glow('gl', gid, 100, 100, 30),
  ]
}

/* ── персоны ─────────────────────────────────────────────── */

const TALK_NODES = [
  [84, 74],
  [116, 74],
  [78, 100],
  [122, 100],
  [84, 126],
  [116, 126],
  [100, 88],
  [100, 112],
]

// Два равных огня и сетка связей между ними. Никто не выше.
function sobesednik(gid) {
  const out = []

  TALK_NODES.forEach((n, i) => {
    out.push(ln(`a${i}`, 62, 100, n[0], n[1], 0.16, 0.8))
    out.push(ln(`b${i}`, 138, 100, n[0], n[1], 0.16, 0.8))
  })

  out.push(ln('x1', 84, 74, 116, 74, 0.22, 0.8), ln('x2', 84, 126, 116, 126, 0.22, 0.8), ln('x3', 100, 88, 100, 112, 0.22, 0.8))

  TALK_NODES.forEach((n, i) => out.push(pt(`n${i}`, n[0], n[1], 1.7, 0.5)))

  out.push(
    ln('tl', 30, 100, 62, 100, 0.25, 1, dot0),
    ln('tr', 138, 100, 170, 100, 0.25, 1, dot0),
    glow('gl', gid, 62, 100, 28),
    glow('gr', gid, 138, 100, 28),
    pt('cl', 62, 100, 4),
    pt('cc', 138, 100, 4),
  )

  return out
}

const CLIMB = [
  [36, 166],
  [62, 148],
  [82, 122],
  [104, 102],
  [126, 76],
  [138, 62],
]

// Одна далёкая точка и путь, который к ней поднимается.
function nastavnik(gid) {
  const out = [
    ...fan('w', 146, 54, 108, 196, 9, 16, (i, n) => 52 + Math.sin((i / (n - 1)) * Math.PI) * 74, 0.16, 0.8),
    pl('path', CLIMB, 0.4, 1, dot0),
  ]

  CLIMB.forEach(([x, y], i) => out.push(pt(`p${i}`, x, y, 1.5 + i * 0.35, 0.26 + i * 0.13)))

  out.push(ln('ground', 24, 176, 66, 176, 0.18), ...fan('r', 146, 54, 0, 340, 18, 9, 15, 0.42, 0.7), ...core(gid, 146, 54, 4.6, 42))

  return out
}

const TRACE = [
  [176, 56],
  [146, 74],
  [118, 96],
  [86, 118],
  [52, 142],
]

// Следы уходят назад. У самого раннего — рамка внимания:
// он остановился и разбирает именно этот момент.
function sledopyt(gid) {
  const out = [pl('path', TRACE, 0.24, 1, '0.1 7')]

  TRACE.forEach(([x, y], i) => {
    const off = i % 2 === 0 ? 5.5 : -5.5
    const o = 0.24 + i * 0.17

    out.push(pt(`l${i}`, x - 0.6 * off, y - 0.8 * off, 2.3, o))
    out.push(pt(`r${i}`, x + 0.6 * off, y + 0.8 * off, 2.3, o * 0.55))
  })

  const [fx, fy] = [52, 142]
  const k = 24
  const t = 9

  ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => {
    out.push(ln(`bh${i}`, fx + sx * k, fy + sy * k, fx + sx * (k - t), fy + sy * k, 0.6, 1.1))
    out.push(ln(`bv${i}`, fx + sx * k, fy + sy * k, fx + sx * k, fy + sy * (k - t), 0.6, 1.1))
  })

  out.push(
    glow('gl', gid, fx, fy, 34),
    ln('tl', fx - 34, fy, fx - 26, fy, 0.3, 1, dot0),
    ln('tr', fx + 26, fy, fx + 34, fy, 0.3, 1, dot0),
  )

  return out
}

/* ── реестр ──────────────────────────────────────────────── */

const MOTIFS = {
  ryad,
  voshod,
  lestnica,
  shozhdenie,
  noch,
  fizio,
  psiho,
  povedenie,
  cifra,
  pishevoe,
  sobesednik,
  nastavnik,
  sledopyt,
}

export const MOTIF_NAMES = Object.keys(MOTIFS)

/*
 * Мотив ритуала угадывается по названию на клиенте: поля
 * категории у ритуала в базе нет, а заводить его ради картинки
 * дороже, чем словарь на пятнадцать строк. Первое совпадение
 * выигрывает, поэтому порядок правил — это приоритет.
 *
 * «Ряд» специально сделан нейтральным: он запасной вариант и
 * никогда не выглядит ошибкой.
 */
const RITUAL_RULES = [
  ['voshod', ['утр', 'рассвет', 'подъём', 'подъем', 'проснут', 'зарядк', 'вода', 'воды', 'душ', 'кофе', 'завтрак', 'план дня']],
  ['noch', ['вечер', 'ноч', 'сон', 'спать', 'засып', 'итог', 'разбор', 'перед сном', 'дневник']],
  ['shozhdenie', ['медитац', 'дыхан', 'дыш', 'тишин', 'чтен', 'читат', 'книг', 'молитв', 'фокус', 'благодарн', 'осознан', 'йог']],
  ['lestnica', ['спорт', 'трениров', 'зал', 'бег', 'шаг', 'прогул', 'ходьб', 'растяжк', 'плаван', 'учить', 'учу', 'язык', 'практик']],
]

export function motifForRitual(title) {
  const text = String(title || '').toLowerCase()

  for (const [motif, roots] of RITUAL_RULES) {
    if (roots.some((root) => text.includes(root))) return motif
  }

  return 'ryad'
}

const ASCEZA_MOTIFS = {
  physio: 'fizio',
  psycho: 'psiho',
  social: 'povedenie',
  digital: 'cifra',
  food: 'pishevoe',
}

export function motifForAsceza(category) {
  return ASCEZA_MOTIFS[category] || 'psiho'
}

const PERSONA_MOTIFS = {
  mayak: 'sobesednik',
  kompas: 'nastavnik',
  dnevnik: 'sledopyt',
}

export function motifForPersona(key) {
  return PERSONA_MOTIFS[key] || 'sobesednik'
}

/*
 * Рисунок наследует цвет от родителя через currentColor, поэтому
 * управлять им нужно классом текста: text-gold, text-cream/40 и
 * так далее. Так один и тот же мотив работает и активным, и
 * приглушённым, и в светлой теме.
 */
export default function Motif({ name, className = '' }) {
  const uid = useId()
  const gid = `mx-glow-${uid.replace(/:/g, '')}`

  const key = MOTIFS[name] ? name : 'ryad'
  const draw = MOTIFS[key]

  return (
    <svg
      viewBox={VIEWBOX[key].join(' ')}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gid}>
          <stop offset="0%" stopColor={C} stopOpacity="0.5" />
          <stop offset="40%" stopColor={C} stopOpacity="0.14" />
          <stop offset="100%" stopColor={C} stopOpacity="0" />
        </radialGradient>
      </defs>

      {stars(key, key.length * 977 + key.charCodeAt(0) * 131)}

      <g className="mx-ink">{draw(gid)}</g>
    </svg>
  )
}
