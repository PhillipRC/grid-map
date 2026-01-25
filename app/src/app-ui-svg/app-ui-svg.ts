import { LionButton } from '@lion/ui/button.js'
import GridBase from '../shared/grid-base'

import css from './app-ui-svg.css?raw'
import html from './app-ui-svg.html?raw'
import EdgeOptionSVG from './svgs/edge-option.svg?raw'

/**
 * Web Component for displaying an SVG icon within a button element.
 * Handles button events and dynamically updates the SVG based on attributes.
 * Observes 'data-svg-name' and 'data-title' attributes for reactive updates.
 *
 * This component extends GridBase and integrates with Lion UI's button component
 * to provide a customizable SVG button with accessibility features.
 *
 * @example
 * ```html
 * <app-ui-svg data-svg-name="EdgeOption" data-title="Toggle Edge Options"></app-ui-svg>
 * ```
 */
class AppUiSvg extends GridBase {

  /**
   * Returns the list of attributes to observe for changes.
   * The component reacts to changes in 'data-svg-name' and 'data-title' attributes.
   * @returns Array of attribute names that trigger attributeChangedCallback.
   */
  static get observedAttributes(): string[] {
    return [
      'data-svg-name',
      'data-title',
    ]
  }

  /**
   * The title text to set on the button element for accessibility.
   * Corresponds to the 'data-title' attribute value.
   */
  ButtonTitle: string | null = null

  /**
   * The LionButton element used for user interaction.
   * Provides the button functionality and styling from Lion UI.
   */
  Button: LionButton | null = null

  /**
   * The name of the SVG to display, corresponding to a key in the Svgs object.
   * Set via the 'data-svg-name' attribute.
   */
  SvgName: string | null = null

  /**
   * The SVG element currently displayed in the component.
   * Dynamically created and appended to the component's shadow DOM.
   */
  Svg: SVGElement | null = null

  /**
   * A record of available SVG strings, keyed by name.
   * Contains pre-imported SVG content that can be displayed in the button.
   */
  Svgs: Record<string, string> = {
    EdgeOption: EdgeOptionSVG,
  }

  /**
   * Creates a new AppUiSvg instance.
   * Initializes the component with its CSS and HTML templates.
   */
  constructor() {
    super(css, html)
  }


  /**
   * Lifecycle callback invoked when the component is added to the DOM.
   * Sets up the button reference and initializes the SVG if a name is provided.
   * Ensures setup only occurs once per component instance.
   */
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
   * Updates the component state accordingly, handling SVG name and title changes.
   * @param property - The name of the changed attribute ('data-svg-name' or 'data-title').
   * @param _oldValue - The previous value (unused in current implementation).
   * @param newValue - The new value of the attribute.
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
   * Sets the title attribute on the button element for accessibility.
   * Uses the ButtonTitle property value, defaulting to empty string if null.
   */
  SetButtonTitle(): void {
    this.Button?.setAttribute(
      'title',
      this.ButtonTitle ? this.ButtonTitle : ''
    )
  }

  /**
   * Adds the specified SVG to the component by name.
   * Parses the SVG string from the Svgs record and appends it as a child element
   * with the 'svg' slot assigned for proper styling.
   * @param name - The key of the SVG in the Svgs record to display.
   * @remarks
   * The SVG is appended to the component's light DOM, not shadow DOM,
   * and uses a slot to allow CSS styling within the shadow root.
   */
  AddSvg(name: string): void {
    this.Svg = this.HtmlToNode(this.Svgs[name])! as SVGAElement
    this.Svg.setAttribute('slot','svg')
    this.appendChild(this.Svg)
  }

}

export default AppUiSvg
