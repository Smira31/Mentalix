import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Регрессия: при ошибке загрузки ритуалов/аскез (500 от /api/rituals
 * или /api/ascezas) компонент показывал пустой список «сегодня 0 из 0»
 * вместо экрана ошибки с кнопкой «Повторить», а системная кнопка «Назад»
 * не работала.
 *
 * Причина: блок ошибки загрузки случайно оказался внутри колбэка
 * useBackButton — JSX возвращался из обработчика кнопки, а не из рендера.
 * Поэтому блок не отображался, а onBack() не вызывался из-за раннего
 * return с JSX.
 */

const source = await readFile(
  new URL('../../src/components/practices/PracticeListFlow.jsx', import.meta.url),
  'utf8'
)

// Извлекаем тело колбэка useBackButton (открывающая скобка до закрывающей \n  })
const backButtonMatch = source.match(/useBackButton\(\(\)\s*=>\s*\{([\s\S]*?)\n  \}\)/)
const backButtonBody = backButtonMatch?.[1] ?? ''

test('экран ошибки загрузки рендерится на уровне компонента, не внутри useBackButton', () => {
  assert.ok(backButtonMatch, 'useBackButton callback найден в исходнике')

  // Блок ошибки НЕ должен быть внутри колбэка useBackButton
  assert.doesNotMatch(
    backButtonBody,
    /data-testid="practice-load-error"/,
    'экран ошибки не должен быть внутри колбэка useBackButton — он не рендерится оттуда'
  )
  assert.doesNotMatch(
    backButtonBody,
    /data-testid="practice-load-retry"/,
    'кнопка «Повторить» не должна быть внутри колбэка useBackButton'
  )

  // Экран ошибки должен быть в теле компонента на уровне рендера
  assert.match(source, /data-testid="practice-load-error"/, 'data-testid экрана ошибки присутствует')
  assert.match(source, /data-testid="practice-load-retry"/, 'data-testid кнопки повтора присутствует')
})

test('системная кнопка «Назад» вызывает onBack() при ошибке загрузки', () => {
  assert.ok(backButtonMatch, 'useBackButton callback найден')

  // При loadError обработчик НЕ должен возвращать JSX (return ( ... ))
  // — это не рендер, кнопка «Назад» просто молча проглатывает вызов.
  assert.doesNotMatch(
    backButtonBody,
    /loadError[\s\S]*?return\s*\(/,
    'при loadError обработчик не должен возвращать JSX из useBackButton'
  )

  // При loadError обработчик должен вызывать onBack()
  assert.match(
    backButtonBody,
    /loadError[\s\S]*?onBack\(\)/,
    'при loadError обработчик «Назад» должен вызывать onBack()'
  )
})

test('блок ошибки загрузки стоит после useEffect и до if (selected)', () => {
  // Позиция последнего useEffect
  const effects = [...source.matchAll(/useEffect\(/g)]
  assert.ok(effects.length > 0, 'в компоненте есть useEffect')
  const lastEffectPos = effects[effects.length - 1].index

  // Позиция блока ошибки
  const errorPos = source.indexOf('data-testid="practice-load-error"')
  assert.ok(errorPos > lastEffectPos, 'блок ошибки загрузки должен быть после useEffect')

  // После блока ошибки должен идти if (selected) — как в рендере
  const afterError = source.slice(errorPos)
  assert.match(afterError, /if\s*\(selected\)/, 'if (selected) должен быть после блока ошибки')
})
