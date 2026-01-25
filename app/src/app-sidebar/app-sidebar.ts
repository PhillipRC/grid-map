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
 *
 * @example
 * ```html
 * <app-sidebar>
 *   <!-- Sidebar content goes here -->
 * </app-sidebar>
 * ```
 */
export default class AppSidebar extends GridBase {

  /**
   * The animated collapse container that holds the sidebar content.
   * Controls the expand/collapse animation and state.
   * Initialized in connectedCallback from the '.slot-container' element.
   */
  Sidebar: AnimatedCollapse | null = null

  /**
   * The button element that toggles the sidebar visibility.
   * Clicking this button calls the ToggleSidebar method.
   * Initialized in connectedCallback from the '.sidebar-toggle-option' element.
   */
  SidebarOption: HTMLButtonElement | null = null

  /**
   * Creates a new AppSidebar instance.
   * Initializes the component with its CSS and HTML templates.
   */
  constructor() {
    super(
      css,
      html
    )
  }

  /**
   * Lifecycle callback invoked when the component is added to the DOM.
   * Sets up event listeners and initializes component references.
   * Ensures setup only occurs once per component instance.
   */
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
   *
   * When expanded, sets the 'expanded' attribute and fires GridMapDisplay.EventEditState.
   * When collapsed, removes the 'expanded' attribute and fires GridMapDisplay.EventNormalState.
   *
   * @remarks
   * This method is typically called in response to user interaction with the sidebar toggle button.
   * The sidebar's expanded state is managed by the AnimatedCollapse component.
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
