import GridBase from '../shared/grid-base'
import AppSidebar from '../app-sidebar/app-sidebar'

// markup and style
import html from './app-main.html?raw'
import css from './app-main.css?raw'


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

    // grid-map-data-generate-random
    if (event.key == 'g') {
      this.dispatchEvent(
        new Event(
          'grid-map-data-generate-random', { bubbles: true }
        )
      )
    }

    // arrow keys - move horizontal and vertical
    if (
      event.key == 'ArrowRight'
      || event.key == 'ArrowLeft'
      || event.key == 'ArrowUp'
      || event.key == 'ArrowDown'
    ) {

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

    // wasd - move horizontal and vertical
    if (
      event.key == 'd'
      || event.key == 'a'
      || event.key == 'w'
      || event.key == 's'
    ) {

      this.dispatchEvent(
        new CustomEvent(
          'grid-map-cursor-move',
          {
            bubbles: true,
            detail: {
              x: (event.key == 'd' ? 1 : event.key == 'a' ? -1 : 0),
              y: (event.key == 'w' ? -1 : event.key == 's' ? 1 : 0),
            },
          }
        )
      )
    }

    // qezc - move at an angle
    if (
      event.key == 'q'
      || event.key == 'e'
      || event.key == 'z'
      || event.key == 'c'
    ) {

      this.dispatchEvent(
        new CustomEvent(
          'grid-map-cursor-move',
          {
            bubbles: true,
            detail: {
              x: ((event.key == 'q' || event.key == 'z') ? -1 : (event.key == 'e' || event.key == 'c') ? 1 : 0),
              y: ((event.key == 'q' || event.key == 'e') ? -1 : (event.key == 'z' || event.key == 'c') ? 1 : 0),
            },
          }
        )
      )
    }


  }

}
