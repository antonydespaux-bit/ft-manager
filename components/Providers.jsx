'use client'
import { TenantProvider } from '../lib/useTenant'

export default function Providers({ children }) {
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  )
}
