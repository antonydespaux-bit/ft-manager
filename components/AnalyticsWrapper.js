'use client'

import { useEffect } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/** Stub minimal : file la dataLayer jusqu’au chargement de gtag.js (ne touche pas aux cookies Supabase, essentiels). */
function ensureGtagStub() {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
  }
}

/**
 * Google Consent Mode v2 à partir des choix Axeptio (slugs = ceux du projet Axeptio).
 * Les cookies de session Supabase restent hors périmètre GCM (cookies essentiels / auth).
 */
function pushConsentUpdateFromChoices(choices) {
  ensureGtagStub()
  const c = choices || {}
  const analyticsGranted = !!c.google_analytics
  const adsGranted = !!(c.google_ads || c.google_ads_personalization)

  window.gtag('consent', 'update', {
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
    ad_storage: adsGranted ? 'granted' : 'denied',
    ad_user_data: adsGranted ? 'granted' : 'denied',
    ad_personalization: adsGranted ? 'granted' : 'denied',
  })
}

function loadGa4AfterConsent() {
  if (typeof window === 'undefined' || !GA_ID) return
  if (window.__skalcookGa4Loaded) return
  window.__skalcookGa4Loaded = true

  ensureGtagStub()
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  script.onload = () => {
    window.gtag('js', new Date())
    window.gtag('config', GA_ID, { send_page_view: true })
  }
  document.head.appendChild(script)
}

/**
 * Écoute Axeptio `cookies:complete` et applique `gtag('consent', 'update', …)`.
 * Charge GA4 uniquement si `google_analytics` est accepté et NEXT_PUBLIC_GA_MEASUREMENT_ID est défini.
 */
export default function AnalyticsWrapper() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.__skalcookAnalyticsWrapper) return
    window.__skalcookAnalyticsWrapper = true

    if (window.axeptioSettings === undefined) return

    window._axcb = window._axcb || []
    window._axcb.push(function (sdk) {
      sdk.on('cookies:complete', function (choices) {
        pushConsentUpdateFromChoices(choices)
        if (choices && choices.google_analytics) {
          loadGa4AfterConsent()
        }
      })
    })
  }, [])

  return null
}
