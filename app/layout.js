import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: 'FT Manager',
  description: 'Gestion des fiches techniques culinaires',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
