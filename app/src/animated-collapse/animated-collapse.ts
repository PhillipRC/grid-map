const DEFAULT_DURATION_COLLAPSE = '0.2s'
const DEFAULT_DURATION_EXPAND = '0.2s'
const DEFAULT_EASING_EXPAND = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DEFAULT_EASING_COLLAPSE = 'cubic-bezier(0.4, 0, 0.2, 1)'

/**
 * A custom element that provides animated collapse/expand functionality for its content.
 * Supports vertical and horizontal directions with customizable durations and easings via CSS variables.
 *
 * @fires expandstart - Fired when the expand animation starts.
 * @fires collapsestart - Fired when the collapse animation starts.
 * @fires expandend - Fired when the expand animation ends.
 * @fires collapseend - Fired when the collapse animation ends.
 */
export default class AnimatedCollapse extends HTMLElement {

  #state = 'expanded'
  #direction = 'verticle'

  /**
   * Observed attributes for the custom element.
   * @returns Array of attribute names to observe.
   */
  static get observedAttributes(): string[] {
    return [
      'expanded',
      'direction',
    ]
  }

  /**
   * The tag name for this custom element.
   * @returns The string 'animated-collapse'.
   */
  static get is(): string {
    return 'animated-collapse'
  }

  /**
   * Sets the expanded state of the component.
   * When set to true, expands the content; when false, collapses it.
   * @param val - Boolean value indicating whether to expand or collapse.
   */
  set expanded(val) {
    if (val) {
      this.collapsed = false
      this.setAttribute('expanded', '')
    } else {
      this.removeAttribute('expanded')
    }
  }

  /**
   * Gets the expanded state of the component.
   * @returns True if the component is expanded, false otherwise.
   */
  get expanded(): boolean {
    return this.hasAttribute('expanded')
  }

  /**
   * Sets the collapsed state of the component.
   * Automatically managed based on the expanded state.
   * @param val - Boolean value indicating whether to set as collapsed.
   */
  set collapsed(val) {
    if (val) {
      this.setAttribute('collapsed', '')
    } else {
      this.removeAttribute('collapsed')
    }
  }

  /**
   * Gets the collapsed state of the component.
   * @returns True if the component is collapsed, false otherwise.
   */
  get collapsed(): boolean {
    return this.hasAttribute('collapsed')
  }

  /**
   * Creates an instance of AnimatedCollapse.
   * Initializes the shadow DOM and sets the initial state based on the 'expanded' attribute.
   */
  constructor() {
    super()
    this.attachShadow({
      mode: 'open',
    }).innerHTML =
      '<style>:host(:not([hidden])){display:block}</style>' +
      '<div><slot></slot></div>'

    this.#state = this.expanded ? 'expanded' : 'collapsed' // 'expanding' | 'expanded' | 'collapsing' | 'collapsed'
  }

  /**
   * Called when the element is inserted into the DOM.
   * Sets up initial styles for collapsed state and adds event listeners for transitions.
   */
  connectedCallback(): void {
    const wrapperEl = this.shadowRoot!.lastElementChild as HTMLElement

    if (!this.expanded) {
      const wrapperStyle = wrapperEl.style
      wrapperStyle.overflow = 'hidden'
      if (this.#direction == 'verticle')
        wrapperStyle.height = '0px'
      if (this.#direction == 'horizontal')
        wrapperStyle.width = '0px'
      wrapperStyle.visibility = 'hidden'
      this.collapsed = true
    }

    wrapperEl.addEventListener(
      'transitionend',
      this._onTransitionEnd.bind(this),
    )
  }


  /**
   * Called when observed attributes change.
   * Handles changes to 'expanded' and 'direction' attributes by triggering expand/collapse or updating direction.
   * @param property - The name of the changed attribute.
   * @param _oldValue - The old value of the attribute (unused).
   * @param newValue - The new value of the attribute.
   */
  attributeChangedCallback(property: string, _oldValue: string | null, newValue: string | null): void {

    if (property == 'expanded') {
      if (this.expanded) {
        this._expand()
      } else {
        this._collapse()
      }
    }

    if (property == 'direction') {
      if (newValue == 'verticle' || newValue == 'horizontal')
        this.#direction = newValue
    }

  }

  _expand(): void {
    if (['expanding', 'expanded'].includes(this.#state)) {
      return
    }

    const wrapperEl = this.shadowRoot!.lastElementChild as HTMLElement
    const wrapperStyle = wrapperEl.style

    if (this.#direction == 'verticle') {
      // Add logic here if needed, or remove this block entirely
    }
    wrapperStyle.height = `${wrapperEl.scrollHeight}px`
    if (this.#direction == 'horizontal')
      wrapperStyle.width = `${wrapperEl.scrollWidth}px`

    wrapperStyle.visibility = ''
    wrapperStyle.transition =
      (this.#direction == 'verticle' ? 'height' : 'width') +
      ` var(--animated-collapse-duration-expand, ${DEFAULT_DURATION_EXPAND})` +
      ` var(--animated-collapse-easing-expand, ${DEFAULT_EASING_EXPAND})`
    this.#state = 'expanding'
    this.dispatchEvent(new CustomEvent('expandstart'))
  }

  _collapse(): void {
    if (['collapsing', 'collapsed'].includes(this.#state)) {
      return
    }

    const wrapperEl = this.shadowRoot!.lastElementChild as HTMLElement
    const wrapperStyle = wrapperEl.style
    wrapperStyle.overflow = 'hidden'

    if (this.#direction == 'verticle') {
      wrapperStyle.height = `${wrapperEl.scrollHeight}px`
      wrapperStyle.transition =
        'height' +
        ` var(--animated-collapse-duration-collapse, ${DEFAULT_DURATION_COLLAPSE})` +
        ` var(--animated-collapse-easing-collapse, ${DEFAULT_EASING_COLLAPSE})`
      wrapperEl.scrollHeight // force layout
      wrapperStyle.height = '0px'
    }

    if (this.#direction == 'horizontal') {
      wrapperStyle.width = `${wrapperEl.scrollWidth}px`
      wrapperStyle.transition =
        'width' +
        ` var(--animated-collapse-duration-collapse, ${DEFAULT_DURATION_COLLAPSE})` +
        ` var(--animated-collapse-easing-collapse, ${DEFAULT_EASING_COLLAPSE})`
      wrapperEl.scrollWidth // force layout
      wrapperStyle.width = '0px'
    }

    this.#state = 'collapsing'
    this.dispatchEvent(new CustomEvent('collapsestart'))
  }

  _onTransitionEnd(): void {
    if (this.shadowRoot!.lastElementChild == null) return

    switch (this.#state) {
      case 'expanding': {
        const wrapperStyle = (this.shadowRoot!.lastElementChild as HTMLElement).style
        wrapperStyle.transition = wrapperStyle.overflow = wrapperStyle.height =
          ''
        this.#state = 'expanded'
        this.dispatchEvent(new CustomEvent('expandend'))
        break
      }

      case 'expanded': {
        // noop
        break
      }

      case 'collapsing': {
        const wrapperStyle = (this.shadowRoot!.lastElementChild as HTMLElement).style
        wrapperStyle.visibility = 'hidden'
        wrapperStyle.transition = ''
        this.#state = 'collapsed'
        this.dispatchEvent(new CustomEvent('collapseend'))
        break
      }

      case 'collapsed': {
        this.collapsed = true
        break
      }
    }
  }
}