import GridBase from '../shared/grid-base.js'
import AnimatedCollapse from '../animated-collapse/animated-collapse'

// markup and style
import html from './app-sidebar.html?raw'
import css from './app-sidebar.css?inline'


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
        new Event('grid-map-set-edit-state-edit', { bubbles: true })
      )
    } else {
      // this.SidebarOption?.classList.remove('active')
      this.removeAttribute('expanded')
      document.dispatchEvent(
        new Event('grid-map-set-edit-state-normal', { bubbles: true })
      )
    }

  }


}
