const DEFAULT_DURATION_COLLAPSE = '0.2s'
const DEFAULT_DURATION_EXPAND = '0.2s'
const DEFAULT_EASING_EXPAND = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DEFAULT_EASING_COLLAPSE = 'cubic-bezier(0.4, 0, 0.2, 1)'

export default class AnimatedCollapse extends HTMLElement {

  #state = 'expanded'
  #direction = 'verticle'

  static get observedAttributes() {
    return [
      'expanded',
      'direction',
    ]
  }

  static get is() {
    return 'animated-collapse'
  }

  set expanded(val) {
    if (val) {
      this.setAttribute('expanded', '')
    } else {
      this.removeAttribute('expanded')
    }
  }

  get expanded() {
    return this.hasAttribute('expanded')
  }

  constructor() {
    super()
    this.attachShadow({
      mode: 'open',
    }).innerHTML =
      '<style>:host(:not([hidden])){display:block}</style>' +
      '<div><slot></slot></div>'

    this.#state = this.expanded ? 'expanded' : 'collapsed' // 'expanding' | 'expanded' | 'collapsing' | 'collapsed'
  }

  connectedCallback() {
    const wrapperEl = this.shadowRoot?.lastElementChild! as HTMLElement

    if (!this.expanded) {
      const wrapperStyle = wrapperEl.style
      wrapperStyle.overflow = 'hidden'
      if (this.#direction == 'verticle')
        wrapperStyle.height = '0px'
      if (this.#direction == 'horizontal')
        wrapperStyle.width = '0px'
      wrapperStyle.visibility = 'hidden'
    }

    wrapperEl.addEventListener(
      'transitionend',
      this._onTransitionEnd.bind(this),
    )
  }


  attributeChangedCallback(property: string, _oldValue: string | null, newValue: string | null) {

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

  _expand() {
    if (['expanding', 'expanded'].includes(this.#state)) {
      return
    }

    const wrapperEl = this.shadowRoot?.lastElementChild! as HTMLElement
    const wrapperStyle = wrapperEl.style

    if (this.#direction == 'verticle') { }
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

  _collapse() {
    if (['collapsing', 'collapsed'].includes(this.#state)) {
      return
    }

    const wrapperEl = this.shadowRoot?.lastElementChild! as HTMLElement
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

  _onTransitionEnd() {
    if (this.shadowRoot?.lastElementChild == null) return

    switch (this.#state) {
      case 'expanding': {
        const wrapperStyle = (this.shadowRoot.lastElementChild as HTMLElement).style
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
        const wrapperStyle = (this.shadowRoot.lastElementChild as HTMLElement).style
        wrapperStyle.visibility = 'hidden'
        wrapperStyle.transition = ''
        this.#state = 'collapsed'
        this.dispatchEvent(new CustomEvent('collapseend'))
        break
      }

      case 'collapsed': {
        // noop
        break
      }
    }
  }
}