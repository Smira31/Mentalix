import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const onboardingSource = fs.readFileSync(new URL('../../src/screens/Onboarding.jsx', import.meta.url), 'utf8')
const onboardingCss = fs.readFileSync(new URL('../../src/screens/Onboarding.css', import.meta.url), 'utf8')

test('all onboarding question and completion steps use the shared compact-layout hook', () => {
  assert.equal(
    (onboardingSource.match(/mx-onboarding-question-step/g) || []).length,
    4,
    'focus, age, reminder, and completion steps must share the responsive layout class'
  )
  assert.match(onboardingSource, /mx-onboarding-option-list/)
  assert.match(onboardingSource, /mx-onboarding-reminder-list/)
})

test('low-height onboarding mode reduces vertical rhythm without changing content flow', () => {
  assert.match(onboardingCss, /@media \(max-height: 600px\)/)
  assert.match(onboardingCss, /\.mx-onboarding-question-step \{[\s\S]*padding-top: 16px[\s\S]*padding-bottom: 16px/)
  assert.match(onboardingCss, /\.mx-onboarding-option,\n  \.mx-onboarding-reminder \{[\s\S]*padding-top: 10px[\s\S]*padding-bottom: 10px/)
  assert.match(onboardingCss, /\.mx-onboarding-reminder \{[\s\S]*padding-top: 6px[\s\S]*padding-bottom: 6px/)
})
