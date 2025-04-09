// @ts-check

/**
 * Helper to remove redundant code creating shadowRoot
 */
export default class GridBase extends HTMLElement {


  /**
   * Track if connectedCallback() has been called
   */
  ConnectedCallback: boolean = false


  /**
   * Set up a shadowdom with the input CSS and HTML
   * 
   * @param {string} css Style Sheet
   * @param {string} html Markup
   */
  constructor(css: string, html: string) {
    super()

    // load style sheet and template as available
    const template = document.createElement('template')
    if (css) template.innerHTML = `<style>${css}</style>`
    if (html) template.innerHTML += html

    // create shadowroot with loaded style sheet and template
    this.attachShadow({ mode: 'open' })
    this.shadowRoot?.appendChild(template.content.cloneNode(true))
  }


}