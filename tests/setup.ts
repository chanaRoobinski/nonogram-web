import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from '../src/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => localStorage.clear())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
