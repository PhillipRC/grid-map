import GridBase from '../shared/grid-base'
import AppSidebar from '../app-sidebar/app-sidebar'

// markup and style
import html from './app-main.html?raw'
import css from './app-main.css?inline'


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

    // listen for keyboard events
    document.addEventListener(
      'keyup',
      (event) => { this.HandleKeyboardUp(event) },
      false
    )

  }
  HandleKeyboardUp(event: KeyboardEvent) {

    // esc key
    if (event.key == 'Escape') {
      this.Sidebar?.ToggleSidebar()
      // this.ToggleSidebar()
    }

    // ~ key
    if (event.key == '`') {
      this.dispatchEvent(
        new CustomEvent(
          'grid-console-toggle', { bubbles: true, detail: null }
        )
      )
    }

    // c key
    if (event.key == 'c') {
      this.dispatchEvent(
        new CustomEvent(
          'grid-map-display-clear', { bubbles: true, detail: null }
        )
      )
    }

    // grid-map-data-generate-random
    if (event.key == 'g') {
      this.dispatchEvent(
        new Event(
          'grid-map-data-generate-random', { bubbles: true }
        )
      )
    }

    // arrow keys
    if (event.keyCode >= 37 && event.keyCode <= 40) {

      this.dispatchEvent(
        new CustomEvent(
          'grid-map-cursor-move',
          {
            bubbles: true,
            detail: {
              x: (event.key == 'ArrowRight' ? 1 : event.key == 'ArrowLeft' ? -1 : 0),
              y: (event.key == 'ArrowUp' ? -1 : event.key == 'ArrowDown' ? 1 : 0),
            },
          }
        )
      )
    }

  }

}
