import GridBase from '../shared/grid-base'
import AnimatedCollapse from '../animated-collapse/animated-collapse.ts'

// markup and style
import html from './app-side-bar-widget.html?raw'
import cssSideBarWidget from './app-side-bar-widget.css?raw'
import cssConsole from '../shared/console.css?raw'


/**
 * Handles a sidebar widget header/tile with collapsing Content
 */
export default class AppSidebarWidget extends GridBase {

  WidgetHeader: HTMLElement | null = null

  WidgetContent: AnimatedCollapse | null = null

  #WidgetTile: string = ''

  get WidgetTitle() {
    return this.#WidgetTile
  }

  set WidgetTitle(value) {
    this.#WidgetTile = value
    if(this.WidgetHeader) this.WidgetHeader.textContent = value
  }

  #ContentCss: string = ''


  constructor(css: string) {
    super(
      cssConsole + cssSideBarWidget,
      html
    )
    this.#ContentCss = css
  }

  connectedCallback() {

    this.WidgetHeader = this.shadowRoot?.querySelector('.console-header')!
    this.WidgetContent = this.shadowRoot?.querySelector('.console-content')!

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
