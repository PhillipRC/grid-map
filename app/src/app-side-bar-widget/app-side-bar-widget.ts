import GridBase from '../shared/grid-base'
import AnimatedCollapse from '../animated-collapse/animated-collapse.ts'

// markup and style
import html from './app-side-bar-widget.html?raw'
import cssSideBarWidget from './app-side-bar-widget.css?raw'
import cssConsole from '../shared/console.css?raw'


/**
 * Handles a sidebar widget header/title with collapsing Content
 */
export default class AppSidebarWidget extends GridBase {

  /** Header container for the widget */
  WidgetHeader: HTMLElement | null = null

  /** Content container for the widget */
  WidgetContent: AnimatedCollapse | null = null

  #WidgetTile: string = ''

  /** Text displayed in the header */
  get WidgetTitle() {
    return this.#WidgetTile
  }

  set WidgetTitle(value) {
    this.#WidgetTile = value
    if(this.WidgetHeader) this.WidgetHeader.textContent = value
  }

  /** CSS added to the WidgetContent  */
  #ContentCss: string = ''


  constructor(css: string) {
    // adding cssConsole to share the same styling across all AppSidebarWidgets
    super(
      cssConsole + cssSideBarWidget,
      html
    )
    
    // save the CSS to add to the WidgetContent
    this.#ContentCss = css
  }

  connectedCallback() {

    // references to display elements
    this.WidgetHeader = this.shadowRoot?.querySelector('.console-header')!
    this.WidgetContent = this.shadowRoot?.querySelector('.console-content')!

    // add CSS to the WidgetContent
    const style = document.createElement("style")
    style.innerHTML = this.#ContentCss
    this.WidgetContent?.appendChild(style)

    this.WidgetHeader?.addEventListener(
      'click',
      () => { this.ToggleDisplay() }
    )

    this.WidgetHeader?.addEventListener(
      'keydown',
      (event) => {
        if (event.key == 'Enter')
          this.ToggleDisplay()
      }
    )

  }

  
  ToggleDisplay() {
    if(this.WidgetContent) this.WidgetContent.expanded = !this.WidgetContent.expanded
  }


}
