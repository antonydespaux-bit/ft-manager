'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CartesRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/menus?tab=cartes') }, [router])
  return null
}
