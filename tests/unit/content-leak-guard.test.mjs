/*
 * Страж бандла (#1112, этап 3): scripts/dist-content-leak-check.mjs падает,
 * если тексты курса вернулись в собранный dist. Тест проверяет сам страж —
 * прогоняет его на подставных каталогах dist и следит, что он не проходит
 * «вхолостую», когда сканируется не тот каталог или другой исходник.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(
  new URL('../../scripts/dist-content-leak-check.mjs', import.meta.url)
)
const source = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

// Те же фразы, что в страже: шаг 5 и шаг 16 против шага 1 (демо-глава I).
const STEP_5 = 'К вечеру плечи каменные, голова гудит, спина ноет.'
const STEP_16 = 'Но кусочки сами не держатся.'
const DEMO_STEP_1 = 'В этом шаге ты посмотришь вперёд и найдёшь одну опору.'

async function runGuard(files) {
  const dir = await mkdtemp(join(tmpdir(), 'content-leak-'))
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = join(dir, rel)
      await mkdir(dirname(full), { recursive: true })
      await writeFile(full, content)
    }
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: dir,
      encoding: 'utf8',
    })
    return { status: result.status, output: `${result.stdout}${result.stderr}` }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test('чистый бандл с демо-фразой главы I проходит', async () => {
  const { status, output } = await runGuard({
    'dist/assets/index.js': `const demo = '${DEMO_STEP_1}'`,
    'dist/index.html': '<div id="root"></div>',
  })
  assert.equal(status, 0, output)
  assert.match(output, /\[content-leak\] OK/)
})

test('текст шага 5 в бандле — падение с указанием шага', async () => {
  const { status, output } = await runGuard({
    'dist/assets/index.js': `const demo = '${DEMO_STEP_1}'; const leak = '${STEP_5}'`,
  })
  assert.equal(status, 1, output)
  assert.match(output, /шаг 5/)
  assert.match(output, /index\.js/)
})

test('текст шага 16 в бандле — падение с указанием шага', async () => {
  const { status, output } = await runGuard({
    'dist/assets/chunk.css': `.x::after { content: '${STEP_16}' }`,
    'dist/assets/index.js': `const demo = '${DEMO_STEP_1}'`,
  })
  assert.equal(status, 1, output)
  assert.match(output, /шаг 16/)
  assert.match(output, /chunk\.css/)
})

test('без демо-фразы главы I результат недействителен: сканируется не тот каталог', async () => {
  const { status, output } = await runGuard({
    'dist/assets/index.js': 'const app = 1',
  })
  assert.equal(status, 1, output)
  assert.match(output, /Контрольная фраза/)
})

test('без каталога dist страж требует сборку', async () => {
  const { status, output } = await runGuard({ 'src/index.js': 'const app = 1' })
  assert.equal(status, 1, output)
  assert.match(output, /npm run build/)
})

test('пустой dist — проверять нечего', async () => {
  const { status, output } = await runGuard({ 'dist/nothing.bin': 'no text files here' })
  assert.equal(status, 1, output)
  assert.match(output, /нет текстовых файлов/)
})

test('страж подключён к check:core и запускается по собранному dist', async () => {
  const pkg = JSON.parse(await source('package.json'))
  assert.match(pkg.scripts['check:core'], /check:content-leak/)
  assert.equal(pkg.scripts['check:content-leak'], 'node scripts/dist-content-leak-check.mjs')
  assert.match(pkg.scripts.build, /vite build/)
})

test('фразы стража действительно ушли из исходников: тексты только на сервере', async () => {
  const heroData = await source('src/data/heroJourney.js')
  const demo = await source('src/data/demoContent.js')
  for (const phrase of [STEP_5, STEP_16]) {
    assert.equal(heroData.includes(phrase), false, phrase)
    assert.equal(demo.includes(phrase), false, phrase)
  }
  // Контрольная фраза — демо-глава I, она обязана остаться в бандле.
  assert.equal(demo.includes(DEMO_STEP_1), true)
})
