import { registerSW } from 'virtual:pwa-register'

/**
 * Initializes the Progressive Web App (PWA) functionality.
 * @param app - The root element of the application.
 */
export function initPWA(app: Element): void {
  const pwaToast = app.querySelector<HTMLDivElement>('#pwa-toast')!
  const pwaToastMessage = pwaToast.querySelector<HTMLDivElement>('.message #toast-message')!
  const pwaCloseBtn = pwaToast.querySelector<HTMLButtonElement>('#pwa-close')!
  const pwaRefreshBtn = pwaToast.querySelector<HTMLButtonElement>('#pwa-refresh')!

  let refreshSW: (reloadPage?: boolean) => Promise<void> | undefined

  const refreshCallback = (): Promise<void> | undefined => refreshSW?.(true)

  /**
   * Hides the PWA toast notification.
   * @param raf - Indicates if the requestAnimationFrame should be used.
   */
  function hidePwaToast(raf: boolean): void {
    if (raf) {
      requestAnimationFrame(() => hidePwaToast(false))
      return
    }
    if (pwaToast.classList.contains('refresh'))
      pwaRefreshBtn.removeEventListener('click', refreshCallback)

    pwaToast.classList.remove('show', 'refresh')
  }

  /**
   * Shows the PWA toast notification.
   * @param offline - Indicates if the app is offline.
   */
  function showPwaToast(offline: boolean): void {
    if (!offline)
      pwaRefreshBtn.addEventListener('click', refreshCallback)
    requestAnimationFrame(() => {
      hidePwaToast(false)
      if (!offline)
        pwaToast.classList.add('refresh')
      pwaToast.classList.add('show')
    })
  }

  let swActivated = false
  // periodic sync is disabled, change the value to enable it, the period is in milliseconds
  // You can remove onRegisteredSW callback and registerPeriodicSync function
  const period = 0

  window.addEventListener('load', () => {
    pwaCloseBtn.addEventListener('click', () => hidePwaToast(true))
    refreshSW = registerSW({
      immediate: true,
      onOfflineReady() {
        pwaToastMessage.innerHTML = 'Ready to install for offline use.'
        showPwaToast(true)
      },
      onNeedRefresh() {
        pwaToastMessage.innerHTML = 'Update available, select \'Reload\' to update.'
        showPwaToast(false)
      },
      onRegisteredSW(swUrl, r) {
        if (period <= 0) return
        if (r?.active?.state === 'activated') {
          swActivated = true
          registerPeriodicSync(period, swUrl, r)
        }
        else if (r?.installing) {
          r.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker
            swActivated = sw.state === 'activated'
            if (swActivated)
              registerPeriodicSync(period, swUrl, r)
          })
        }
      },
    })
  })
}

/**
 * Registers a periodic sync check for the service worker.
 * @param period - The interval period in milliseconds for the sync check.
 * @param swUrl - The URL of the service worker.
 * @param r - The service worker registration object.
 */
function registerPeriodicSync(period: number, swUrl: string, r: ServiceWorkerRegistration): void {
  if (period <= 0) return

  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine)
      return

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (resp?.status === 200)
      await r.update()
  }, period)
}
