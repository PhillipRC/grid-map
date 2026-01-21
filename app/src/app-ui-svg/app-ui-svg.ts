import { LionButton } from '@lion/ui/button.js'
import GridBase from '../shared/grid-base'

import css from './app-ui-svg.css?raw'
import html from './app-ui-svg.html?raw'
import EdgeOptionSVG from './svgs/edge-option.svg?raw'

/**
 * Web Component for displaying an SVG icon within a button element.
 * Handles button events and dynamically updates the SVG based on attributes.
 * Observes 'data-svg-name' and 'data-title' attributes for reactive updates.
 */
class AppUiSvg extends GridBase {

  /**
   * Returns the list of attributes to observe for changes.
   * @returns Array of attribute names.
   */
  static get observedAttributes(): string[] {
    return [
      'data-svg-name',
      'data-title',
    ]
  }

  /**
   * The title text to set on the button element.
   */
  ButtonTitle: string | null = null

  /**
   * The LionButton element used for user interaction.
   */
  Button: LionButton | null = null

  /**
   * The name of the SVG to display, corresponding to a key in the Svgs object.
   */
  SvgName: string | null = null

  /**
   * The SVG element currently displayed in the component.
   */
  Svg: SVGElement | null = null

  /**
   * A record of available SVG strings, keyed by name.
   */
  Svgs: Record<string, string> = {
    EdgeOption: EdgeOptionSVG,
  }

  constructor() {
    super(css, html)
  }


  connectedCallback(): void {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Button = super.GetElementBySelector('lion-button') as LionButton
    this.SetButtonTitle()

    if(this.SvgName) this.AddSvg(this.SvgName)
  
  }

  /**
   * Called when an observed attribute changes.
   * Updates the component state accordingly.
   * @param property - The name of the changed attribute.
   * @param _oldValue - The previous value (unused).
   * @param newValue - The new value.
   */
  attributeChangedCallback(property: string, _oldValue: string | null, newValue: string | null): void {
    
    if (property == 'data-svg-name') {
      if (typeof newValue == 'string' && this.SvgName != newValue) {
        this.SvgName = newValue
        if (this.ConnectedCallback) this.AddSvg(this.SvgName)
      }
    }
    
    if (property == 'data-title') {
      this.ButtonTitle = newValue
      this.SetButtonTitle()
    }
  
  }

  /**
   * Sets the title attribute on the button element.
   */
  SetButtonTitle(): void {
    this.Button?.setAttribute(
      'title',
      this.ButtonTitle ? this.ButtonTitle : ''
    )
  }

  /**
   * Adds the specified SVG to the component by name.
   * Parses the SVG string and appends it as a child element.
   * @param name - The key of the SVG in the Svgs record.
   */
  AddSvg(name: string): void {
    this.Svg = this.HtmlToNode(this.Svgs[name])! as SVGAElement
    this.Svg.setAttribute('slot','svg')
    this.appendChild(this.Svg)
  }

}

export default AppUiSvg
