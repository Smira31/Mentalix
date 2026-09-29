import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CLOCK_PRESETS, readDemoClock, setDemoClock } from '../lib/clock'
import {
  DEMO_NETWORKS, DEMO_SCENARIOS, demoNetwork, demoScenario,
  resetDemoState, setDemoNetwork, setDemoScenario,
} from '../lib/demoMode'
import './DemoPanel.css'

const references = {
  ...import.meta.glob('../../docs/references/stoic-video-2026-09-23/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../../docs/references/checkin-screenshots/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }),
}

export default function DemoPanel({ open, onOpen, onClose }) {
  const [clock, setClock] = useState(readDemoClock)
  const [scenario, setScenario] = useState(demoScenario)
  const [network, setNetwork] = useState(demoNetwork)
  const [reference, setReference] = useState('')
  const [opacity, setOpacity] = useState(50)
  const objectUrl = useRef(null)
  const touchStart = useRef(null)

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current) }, [])

  function refresh() {
    const url = new URL(window.location.href)
    url.searchParams.set('panel', '1')
    window.location.assign(url.href)
  }

  function changeClock(preset, days = clock.days) {
    setDemoClock(preset, days)
    setClock({ preset, days })
    refresh()
  }

  function chooseFile(event) {
    const file = event.target.files?.[0]
    if (!file?.type.startsWith('image/')) return
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setReference(objectUrl.current)
  }

  return createPortal(
    <>
      {reference && <img className="mx-demo-reference" src={reference} alt="" style={{ opacity: opacity / 100 }} />}
      <button type="button" className="mx-demo-badge" data-testid="demo-panel-badge" onClick={onOpen}>
        {clock.preset || 'Сейчас'}{clock.days ? ` ${clock.days > 0 ? '+' : ''}${clock.days} д.` : ''} · {scenario} · {network}
      </button>
      {open && (
        <div className="mx-demo-panel-backdrop" onClick={onClose}>
          <section className="mx-demo-panel" role="dialog" aria-modal="true" aria-label="Демо-панель" data-testid="demo-panel" onClick={event => event.stopPropagation()}>
            <header className="mx-demo-panel-header" onTouchStart={event => { touchStart.current = event.touches[0].clientY }} onTouchEnd={event => { if (touchStart.current !== null && event.changedTouches[0].clientY - touchStart.current > 70) onClose(); touchStart.current = null }}>
              <h2>Демо-панель</h2>
              <button type="button" aria-label="Закрыть демо-панель" onClick={onClose}>×</button>
            </header>
            <div className="mx-demo-panel-content">
              <fieldset>
                <legend>Машина времени</legend>
                <div className="mx-demo-panel-options">
                  {CLOCK_PRESETS.map(preset => <button key={preset} type="button" aria-pressed={clock.preset === preset} onClick={() => changeClock(preset)}>{preset}</button>)}
                  <button type="button" onClick={() => changeClock(clock.preset, clock.days + 1)}>+1 день</button>
                  <button type="button" onClick={() => changeClock(clock.preset, clock.days - 1)}>−1 день</button>
                  <button type="button" onClick={() => changeClock(null, 0)}>Реальное время</button>
                </div>
              </fieldset>
              <fieldset>
                <legend>Готовые аккаунты</legend>
                <div className="mx-demo-panel-options">
                  {DEMO_SCENARIOS.map(value => <button key={value} type="button" aria-pressed={scenario === value} onClick={() => { setDemoScenario(value); setScenario(value); refresh() }}>{value}</button>)}
                </div>
              </fieldset>
              <fieldset>
                <legend>Сеть</legend>
                <div className="mx-demo-panel-options">
                  {DEMO_NETWORKS.map(value => <button key={value} type="button" aria-pressed={network === value} onClick={() => { setDemoNetwork(value); setNetwork(value); refresh() }}>{value}</button>)}
                </div>
              </fieldset>
              <button type="button" className="mx-demo-panel-reset" onClick={() => { resetDemoState(); refresh() }}>Сбросить демо</button>
              <fieldset>
                <legend>Наложение референса</legend>
                <select aria-label="Выбрать референс" value={Object.entries(references).find(([, url]) => url === reference)?.[0] || ''} onChange={event => setReference(references[event.target.value] || '')}>
                  <option value="">Выбрать кадр</option>
                  {Object.keys(references).sort().map(path => <option key={path} value={path}>{path.split('/').slice(-2).join(' / ')}</option>)}
                </select>
                <label className="mx-demo-panel-file">Своё изображение <input type="file" accept="image/*" onChange={chooseFile} /></label>
                {reference && <div className="mx-demo-panel-opacity"><label htmlFor="demo-opacity">Прозрачность: {opacity}%</label><input id="demo-opacity" type="range" min="0" max="100" value={opacity} onChange={event => setOpacity(Number(event.target.value))} /><button type="button" onClick={() => setReference('')}>Убрать</button></div>}
              </fieldset>
            </div>
          </section>
        </div>
      )}
    </>, document.body
  )
}
