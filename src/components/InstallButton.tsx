import "pwa-install"

export function InstallButton() {
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <pwa-install
        manifest-url="/manifest.webmanifest"
        style={{ width: "100%" }}
      >
        <button className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-semibold shadow-lg flex items-center justify-center gap-2 text-base cursor-pointer border-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Instalar app
        </button>
      </pwa-install>
    </div>
  )
}