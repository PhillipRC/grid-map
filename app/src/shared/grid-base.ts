import { FunctionCallQueue } from "./FunctionCallQueue"

/**
 * Helper to remove redundant code creating shadowRoot
 */
export default class GridBase extends HTMLElement {


  /**
   * Track if connectedCallback() has been called
   */
  ConnectedCallback: boolean = false


  IsInitialized: boolean = false

  Queue = new FunctionCallQueue()


  /**
   * Set up a shadowdom with the input CSS and HTML
   * 
   * @param {string} css Style Sheet
   * @param {string} html Markup
   */
  constructor(css: string, html: string) {
    super()

    // load style sheet and markup into template as available
    const template = document.createElement('template')
    if (css) template.innerHTML = `<style>${css}</style>`
    if (html) template.innerHTML += html

    // create shadowroot with loaded style sheet and template
    this.attachShadow({ mode: 'open' })
    this.shadowRoot?.appendChild(template.content.cloneNode(true))
  }


  /**
   * Create an SVGElement
   * 
   * @param {string} tag
   * @param {Array} attributes
   * @returns {SVGElement}
   */
  CreateSvgTag(tag: string, attributes: Array<any>): SVGElement {
    const svg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      tag
    )
    return this.AddAttributesToElement(svg, attributes) as SVGElement
    
  }


  /**
   * Add an array of Attributes and Values to a Tag
   */
  AddAttributesToElement(tag: HTMLElement | SVGElement, attributes: Array<any>): HTMLElement | SVGElement {
    attributes.forEach(
      element => {
        tag.setAttribute(
          element[0],
          element[1]
        )
      }
    )
    return tag
  }


  /**
   * @param {string} html 
   * @returns {Node|null}
   */
  HtmlToNode(html: string): Node | null {
    const template = document.createElement('template')
    template.innerHTML = html
    const nNodes = template.content.childNodes.length
    if (nNodes !== 1) {
      throw new Error('HTML must contain a single node')
    }
    return template.content.firstChild
  }



}