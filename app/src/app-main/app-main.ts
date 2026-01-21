import GridBase from '../shared/grid-base'
import AppSidebar from '../app-sidebar/app-sidebar'
import GridConsole from '../app-console/app-console'

// markup and style
import html from './app-main.html?raw'
import css from './app-main.css?raw'

/**
 * Main application component that manages the sidebar and global keyboard events.
 * @fires GridConsole.ToggleDisplay - Dispatched when the tilde key is pressed to toggle console display.
 */
export default class AppMain extends GridBase {

  /** Reference to the app sidebar component, or null if not found. */
  Sidebar: AppSidebar | null = null

  constructor() {
    super(css, html)
  }

  /**
   * Initializes the component once when connected to the DOM.
   * Sets up the sidebar reference and keyboard event listener.
   */
  connectedCallback(): void {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Sidebar = super.GetElementBySelector('app-sidebar') as AppSidebar

    document.addEventListener(
      'keyup',
      (event) => { this.HandleKeyboardUpOnDocument(event) }
    )

  }

  /**
   * Handles keyboard events on the document.
   * - Escape key: Toggles the sidebar.
   * - Tilde key: Dispatches event to toggle console display.
   */
  HandleKeyboardUpOnDocument(event: KeyboardEvent): void {
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
