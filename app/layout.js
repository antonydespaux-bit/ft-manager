'use client'
import { ThemeProvider } from '../lib/ThemeContext'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
