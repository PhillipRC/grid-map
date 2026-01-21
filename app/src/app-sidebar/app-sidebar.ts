import GridBase from '../shared/grid-base'
import AnimatedCollapse from '../animated-collapse/animated-collapse'
import GridMapDisplay from '../grid-map-display/grid-map-display'

// markup and style
import html from './app-sidebar.html?raw'
import css from './app-sidebar.css?raw'


/**
 * Sidebar component for the grid map application.
 * Manages the display and toggling of the sidebar, which contains editing tools and controls.
 * Communicates state changes via custom events to coordinate with other components.
 *
 * @fires GridMapDisplay.EventEditState - Fired when the sidebar is expanded, indicating edit mode
 * @fires GridMapDisplay.EventNormalState - Fired when the sidebar is collapsed, indicating normal mode
 */
export default class AppSidebar extends GridBase {

  /**
   * The animated collapse container that holds the sidebar content.
   * Controls the expand/collapse animation and state.
   */
  Sidebar: AnimatedCollapse | null = null

  /**
   * The button element that toggles the sidebar visibility.
   * Clicking this button calls the ToggleSidebar method.
   */
  SidebarOption: HTMLButtonElement | null = null

  constructor() {
    super(
      css,
      html
    )
  }

  connectedCallback(): void {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Sidebar = super.GetElementBySelector('.slot-container') as AnimatedCollapse
    this.SidebarOption = super.GetElementBySelector('.sidebar-toggle-option') as HTMLButtonElement

    this.SidebarOption?.addEventListener(
      'click', () => { this.ToggleSidebar() }
    )
  }

  /**
   * Toggles the sidebar between expanded and collapsed states.
   * Updates the component's attributes and dispatches appropriate events
   * to notify other components of the state change.
   */
  ToggleSidebar(): void {
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
