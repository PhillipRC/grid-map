import GridBase from '../shared/grid-base'
import AppSidebar from '../app-sidebar/app-sidebar'
import GridConsole from '../app-console/app-console'

// markup and style
import html from './app-main.html?raw'
import css from './app-main.css?raw'

/**
 * @fires GridConsole.ToggleDisplay
 */
export default class AppMain extends GridBase {

  Sidebar: AppSidebar | null = null

  constructor() {
    super(css, html)
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Sidebar = this.shadowRoot?.querySelector('app-sidebar')!

    document.addEventListener(
      'keyup',
      (event) => { this.HandleKeyboardUpOnDocument(event) }
    )

  }

  HandleKeyboardUpOnDocument(event: KeyboardEvent) {
    // esc key
    if (event.key == 'Escape') {
      event.stopPropagation()
      this.Sidebar?.ToggleSidebar()
    }

    // ~ key
    if (event.key == '`') {
      this.dispatchEvent(
        new CustomEvent(
          GridConsole.ToggleDisplay,
          {
            bubbles: true,
            detail: null
          }
        )
      )
    }
  }


}
