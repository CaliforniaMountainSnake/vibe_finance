import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

const { error: originalError } = console

// Подавляем варнинги React act(...) от Radix UI Tooltip/Presence/Popper.
// Это безвредный шум — асинхронные стейт-апдейты в Radix-компонентах,
// которые срабатывают после завершения теста.
console.error = (...arguments_: unknown[]) => {
  const message = typeof arguments_[0] === 'string' ? arguments_[0] : ''
  if (message.includes('inside a test was not wrapped in act(...)')) {
    return
  }
  originalError.call(console, ...arguments_)
}
