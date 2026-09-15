let audioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null

  audioContext ||= new AudioContext()
  return audioContext
}

function playDemoClick() {
  const context = getAudioContext()
  if (!context) return

  if (context.state === 'suspended') {
    context.resume().catch(() => {})
  }

  try {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(520, start)
    oscillator.frequency.exponentialRampToValueAtTime(390, start + 0.045)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.026, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.06)
  } catch {
    // Audio is an enhancement only; unsupported or restricted contexts are silent.
  }
}

export function installDemoPressFeedback(root = document) {
  if (typeof window === 'undefined' || !root?.addEventListener) return () => {}

  const onPointerDown = event => {
    const button = event.target?.closest?.('button')
    if (!button || !button.closest("[data-mentalix-demo-frame='true']")) return

    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(8)
    }

    playDemoClick()
  }

  const onKeyDown = event => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    const button = event.target?.closest?.('button')
    if (!button || !button.closest("[data-mentalix-demo-frame='true']")) return

    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(8)
    }

    playDemoClick()
  }

  root.addEventListener('pointerdown', onPointerDown, true)
  root.addEventListener('keydown', onKeyDown, true)

  return () => {
    root.removeEventListener('pointerdown', onPointerDown, true)
    root.removeEventListener('keydown', onKeyDown, true)
  }
}

export function resetDemoPressFeedbackForTests() {
  audioContext?.close?.().catch?.(() => {})
  audioContext = null
}
