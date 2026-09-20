import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')

test('onboarding completion refreshes fullscreen geometry before Today mounts', () => {
  assert.match(appSource, /import \{ getFullscreenSnapshot, initFullscreen \} from ['"]\.\/lib\/tgFullscreen['"]/) 
  assert.match(
    appSource,
    /const completeOnboarding = useCallback\(\(\) => \{[\s\S]*setFullscreen\(getFullscreenSnapshot\(\)\)[\s\S]*setOnboardedFlag\('1'\)/
  )
  assert.match(appSource, /<Onboarding[\s\S]*onFinish=\{completeOnboarding\}/)
})
