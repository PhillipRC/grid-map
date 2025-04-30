import GridBase from '../shared/grid-base'
import AnimatedCollapse from '../animated-collapse/animated-collapse'
import GridMapDisplay from '../grid-map-display/grid-map-display'

// markup and style
import html from './app-sidebar.html?raw'
import css from './app-sidebar.css?raw'


/**
 * @fires GridMapDisplay.EventEditState
 * @fires GridMapDisplay.EventNormalState
 */
export default class AppSidebar extends GridBase {

  Sidebar: AnimatedCollapse | null = null

  SidebarOption: HTMLButtonElement | null = null

  constructor() {
    super(
      css,
      html
    )
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Sidebar = this.shadowRoot?.querySelector('.slot-container')!
    this.SidebarOption = this.shadowRoot?.querySelector('.sidebar-toggle-option')!

    this.SidebarOption?.addEventListener(
      'click', () => { this.ToggleSidebar() }
    )
  }

  ToggleSidebar() {
    if (this.Sidebar) this.Sidebar.expanded = !this.Sidebar.expanded

    if (this.Sidebar?.expanded) {
      // this.SidebarOption?.classList.add('active')
      this.setAttribute('expanded', 'true')
      document.dispatchEvent(
        new Event(
          GridMapDisplay.EventEditState,
          { bubbles: true }
        )
      )
    } else {
      // this.SidebarOption?.classList.remove('active')
      this.removeAttribute('expanded')
      document.dispatchEvent(
        new Event(
          GridMapDisplay.EventNormalState,
          { bubbles: true }
        )
      )
    }

  }


}
