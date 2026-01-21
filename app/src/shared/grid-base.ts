import { FunctionCallQueue } from "./FunctionCallQueue"

/**
 * Base class for all grid map web components that provides common functionality
 * for Shadow DOM setup, element querying, and SVG manipulation.
 */
export default class GridBase extends HTMLElement {

  /**
   * Track if connectedCallback() has been called
   */
  ConnectedCallback: boolean = false

  /**
   * Track if the component has been fully initialized
   */
  IsInitialized: boolean = false

  /**
   * Queue for managing function calls
   */
  Queue = new FunctionCallQueue()

  /**
   * Set up a shadow DOM with the input CSS and HTML
   *
   * @param css - Style sheet content to include in the shadow DOM
   * @param html - HTML markup to include in the shadow DOM
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
   * Get an HTMLElement from the shadow DOM by CSS selector
   *
   * @param selector - CSS selector string
   * @returns The found HTMLElement
   * @throws Error if element not found or not an HTMLElement
   */
  GetElementBySelector(selector: string): HTMLElement {
    const element = this.shadowRoot?.querySelector(selector) ?? null
    if (element && element instanceof HTMLElement) {
      return element
    }
    throw new Error(`"${selector}" element not found or not an HTMLElement`)
  }

  /**
   * Create an SVGElement with the specified tag name and attributes
   *
   * @param tag - SVG element tag name (e.g., 'rect', 'circle')
   * @param attributes - Array of [attributeName, attributeValue] pairs
   * @returns The created SVGElement with attributes applied
   */
  CreateSvgTag(tag: string, attributes: Array<any>): SVGElement {
    const svg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      tag
    )
    return this.AddAttributesToElement(svg, attributes) as SVGElement

  }

  /**
   * Add an array of attributes and values to an HTMLElement or SVGElement
   *
   * @param tag - The element to add attributes to
   * @param attributes - Array of [attributeName, attributeValue] pairs
   * @returns The element with attributes applied
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
   * Convert HTML string to a DOM Node
   *
   * @param html - HTML string containing a single root element
   * @returns The parsed DOM Node
   * @throws Error if HTML contains more or less than one node
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