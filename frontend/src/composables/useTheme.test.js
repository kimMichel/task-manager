import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from './useTheme.js'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

describe('useTheme', () => {
  it('starts in light mode by default', () => {
    useTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('starts in dark mode when localStorage has dark preference', () => {
    localStorage.setItem('theme', 'dark')
    useTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggle adds dark class when in light mode', () => {
    const { toggle } = useTheme()
    toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggle removes dark class when in dark mode', () => {
    document.documentElement.classList.add('dark')
    const { toggle } = useTheme()
    toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggle persists dark preference to localStorage', () => {
    const { toggle } = useTheme()
    toggle()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('toggle persists light preference to localStorage', () => {
    document.documentElement.classList.add('dark')
    const { toggle } = useTheme()
    toggle()
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('isDark reflects current theme state', () => {
    const { isDark, toggle } = useTheme()
    expect(isDark.value).toBe(false)
    toggle()
    expect(isDark.value).toBe(true)
  })
})
