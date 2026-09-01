import React from 'react'
import { createRoot } from 'react-dom/client'
import MazeLogo from '../../src/components/MazeLogo.jsx'

const states = [0, 0.5, 1]

createRoot(document.getElementById('root')).render(
  states.map(progress => (
    <section key={progress} data-testid={`maze-state-${String(progress).replace('.', '-')}`}>
      <strong>{`progress=${progress}`}</strong>
      <MazeLogo size={160} progress={progress} showDot />
    </section>
  ))
)
