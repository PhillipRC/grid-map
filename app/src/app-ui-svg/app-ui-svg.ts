import { LionButton } from '@lion/ui/button.js'
import GridBase from '../shared/grid-base'

import css from './app-ui-svg.css?raw'
import html from './app-ui-svg.html?raw'
import EdgeOptionSVG from './svgs/edge-option.svg?raw'

/**
 * Handles displaying a SVG with Button events
 */
class AppUiSvg extends GridBase {

  static get observedAttributes() {
    return [
      'data-svg-name',
      'data-title',
    ]
  }

  ButtonTitle: string | null = null

  Button: LionButton | null = null

  SvgName: string | null = null

  Svg: SVGElement | null = null

  Svgs = {
    EdgeOption: EdgeOptionSVG,
  }

  constructor() {
    super(css, html)
  }


  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Button = this.shadowRoot?.querySelector('lion-button')!
    this.SetButtonTitle()

    if(this.SvgName) this.AddSvg(this.SvgName)
  
  }

  attributeChangedCallback(property: string, _oldValue: string | null, newValue: string | null) {
    
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

  SetButtonTitle() {
    this.Button?.setAttribute(
      'title',
      this.ButtonTitle ? this.ButtonTitle : ''
    )
  }

  AddSvg(name: string) {
    // @ts-ignore
    this.Svg = this.HtmlToNode(this.Svgs[name])! as SVGAElement
    this.Svg.setAttribute('slot','svg')
    this.appendChild(this.Svg)
  }

}

export default AppUiSvg
