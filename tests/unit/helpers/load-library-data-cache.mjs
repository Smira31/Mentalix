/*
 * Загрузчик src/lib/libraryDataCache.js для unit-тестов.
 *
 * Модуль тянет api.js (сеть, Telegram-адаптер) и demoMode.js — их в тесте
 * заменяем заглушками. Логика кеша, фильтрация скрытых статей и группировка
 * по темам остаются настоящими; демо-каталог по умолчанию тоже настоящий
 * (src/data/demoContent.js), его можно подменить аргументом demoArticles.
 */
import { readFile } from 'node:fs/promises'

const cacheUrl = new URL('../../../src/lib/libraryDataCache.js', import.meta.url)
const demoContentUrl = new URL('../../../src/data/demoContent.js', import.meta.url)
const topicsUrl = new URL('../../../src/data/libraryTopics.js', import.meta.url)

export const libraryDataCacheSource = await readFile(cacheUrl, 'utf8')

export async function loadLibraryDataCache({ demo = false, demoArticles = null } = {}) {
  const source = libraryDataCacheSource
    .replace("import { api } from './api'", 'const api = {}')
    .replace(
      "import { isPreviewDemoMode } from './demoMode'",
      `const isPreviewDemoMode = () => ${demo}`
    )
    .replace(
      "import { DEMO_ARTICLES } from '../data/demoContent'",
      demoArticles
        ? `const DEMO_ARTICLES = ${JSON.stringify(demoArticles)}`
        : `import { DEMO_ARTICLES } from '${demoContentUrl.href}'`
    )
    .replace(
      "import { libraryTopic } from '../data/libraryTopics'",
      `import { libraryTopic } from '${topicsUrl.href}'`
    )
  return import(`data:text/javascript,${encodeURIComponent(source)}`)
}
