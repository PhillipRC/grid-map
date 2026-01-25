
import GridBase from '../shared/grid-base'
import AnimatedCollapse from '../animated-collapse/animated-collapse.ts'

// HTML and CSS imports for the sidebar widget
import html from './app-side-bar-widget.html?raw'
import cssSideBarWidget from './app-side-bar-widget.css?raw'
import cssConsole from '../shared/console.css?raw'


/**
 * <app-side-bar-widget>
 *
 * Web Component for a collapsible sidebar widget in the grid map app.
 * Provides a header (title) and a content area that can be expanded/collapsed.
 * Uses Shadow DOM and supports custom CSS injection for the content area.
 *
 * @example
 * ```html
 * <app-side-bar-widget></app-side-bar-widget>
 * ```
 *
 * @fires GridMapData.EventLayerUpdated - When the widget content changes (inherited from GridBase)
 *
 * @listens click - On header element to toggle collapse/expand
 * @listens keydown - On header element for Enter key to toggle collapse/expand
 *
 * Inherits:
 *   GridBase – for Shadow DOM, template, and style management.
 */
export default class AppSidebarWidget extends GridBase {
  /**
   * Reference to the header element (displays the widget title).
   * Set in connectedCallback() after element is added to DOM.
   */
  WidgetHeader: HTMLElement | null = null

  /**
   * Reference to the content container (collapsible area using AnimatedCollapse).
   * Set in connectedCallback() after element is added to DOM.
   */
  WidgetContent: AnimatedCollapse | null = null

  /**
   * Internal storage for the widget title text.
   * @private
   */
  #WidgetTitle: string = ''

  /**
   * Gets the text displayed in the header.
   *
   * @returns The current widget title
   */
  get WidgetTitle(): string {
    return this.#WidgetTitle
  }

  /**
   * Sets the text displayed in the header.
   * Updates the header element immediately if it exists.
   *
   * @param value - The new title text to display
   */
  set WidgetTitle(value: string) {
    this.#WidgetTitle = value
    if (this.WidgetHeader) this.WidgetHeader.textContent = value
  }

  /**
   * CSS string to be injected into the WidgetContent area.
   * Applied during connectedCallback().
   * @private
   */
  #ContentCss: string = ''

  /**
   * Constructs the sidebar widget, injecting shared and widget-specific CSS.
   * Calls super() with combined CSS and HTML template.
   *
   * @param css - Additional CSS string to inject into the content area during initialization
   */
  constructor(css: string) {
    // Add cssConsole to share styling across all AppSidebarWidgets
    super(
      cssConsole + cssSideBarWidget,
      html
    )
    // Save the CSS to add to the WidgetContent
    this.#ContentCss = css
  }

  /**
   * Lifecycle callback: runs when the element is added to the DOM.
   * Sets up DOM references, injects content CSS, and attaches event listeners
   * for user interaction (click and keyboard navigation).
   */
  connectedCallback(): void {
    // Get references to display elements
    this.WidgetHeader = super.GetElementBySelector('.console-header')
    this.WidgetContent = super.GetElementBySelector('.console-content') as AnimatedCollapse

    // Inject additional CSS into the WidgetContent
    const style = document.createElement('style')
    style.innerHTML = this.#ContentCss
    this.WidgetContent?.appendChild(style)

    // Toggle collapse/expand on header click
    this.WidgetHeader?.addEventListener(
      'click',
      () => { this.ToggleDisplay() }
    )

    // Toggle collapse/expand on Enter key
    this.WidgetHeader?.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter')
          this.ToggleDisplay()
      }
    )
  }

  /**
   * Toggles the expanded/collapsed state of the content area.
   * Inverts the current expanded state of the WidgetContent AnimatedCollapse element.
   */
  ToggleDisplay(): void {
    if (this.WidgetContent) this.WidgetContent.expanded = !this.WidgetContent.expanded
  }
}
