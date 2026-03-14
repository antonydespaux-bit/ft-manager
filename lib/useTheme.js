'use client'
import { useDarkMode } from './ThemeContext'
import { theme } from './theme.jsx'

export function useTheme() {
  const context = useDarkMode()
  const darkMode = context?.darkMode || false
  const toggleDarkMode = context?.toggleDarkMode || (() => {})
  const c = darkMode ? theme.dark : theme.couleurs
  return { c, darkMode, toggleDarkMode }
}
