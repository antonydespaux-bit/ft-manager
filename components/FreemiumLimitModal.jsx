'use client'

export default function FreemiumLimitModal({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="freemium-limit-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl shadow-zinc-900/10">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Offre gratuite
        </div>
        <h2 id="freemium-limit-title" className="text-xl font-semibold tracking-tight text-zinc-900">
          Limite de 5 fiches atteinte
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Passez au plan <span className="font-semibold text-zinc-800">Chef</span> pour un nombre illimité de
          fiches techniques et débloquer tout le potentiel de Skalcook.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  )
}
