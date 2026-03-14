'use client'
import { useDarkMode } from './ThemeContext'
import { theme } from './theme.jsx'

export function useTheme() {
  const { darkMode, toggleDarkMode } = useDarkMode()
  const c = darkMode ? theme.dark : theme.couleurs
  return { c, darkMode, toggleDarkMode }
}
