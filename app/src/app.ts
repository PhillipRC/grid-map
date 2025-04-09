import { initPWA } from './pwa/pwa.ts'
import './pwa/pwa.css'

/**
 * Register the webcomponent
 */
import AppMain from './app-main/app-main'
customElements.define('app-main', AppMain)


/**
 * Setup PWA
 */
initPWA(document.querySelector<HTMLElement>('body')!)
