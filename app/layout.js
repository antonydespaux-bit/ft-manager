import { ThemeProvider } from '../lib/ThemeContext'
import './globals.css'

export const metadata = {
  title: 'FT Manager — La Fantaisie',
  description: 'Gestion des fiches techniques culinaires',
}

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
