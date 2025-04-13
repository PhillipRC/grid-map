import GridBase from '../shared/grid-base.js'
import PointerType from './PointerType.js'

// markup and style
import css from './grid-map-pointer.css?inline'
import html from './grid-map-pointer.html?raw'
import PointerNone from './svgs/PointerNone.svg?raw'
import PointerAdd from './svgs/PointerAdd.svg?raw'
import PointerRemove from './svgs/PointerRemove.svg?raw'
import PointerSelect from './svgs/PointerSelect.svg?raw'


/**
 * Handles Pointer display
 */
class GridMapPointer extends GridBase {

  
  static get observedAttributes() {
    return [
      'data-pointer',
      'data-label-text',
    ]
  }

  PointerType: number = PointerType.None

  get PointerTypeName() {
    return PointerType.GetName(this.PointerType)
  }
  
  PointerReferences: Array<SVGAElement> = []
  
  Container: HTMLElement | null | undefined = null

  LabelText: string = ''

  LabelTextContainer: HTMLElement | null = null

  
  constructor() {
    super(
      css,
      html
    )
  }

  
  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Container = this.shadowRoot?.querySelector('.container')

    this.LabelTextContainer = this.shadowRoot?.querySelector('.pointer-label-text')!
    this.LabelTextContainer.setAttribute('hidden', 'true')

    // add pointers
    const pointerNone = this.HtmlToNode(PointerNone)
    if (pointerNone) {
      this.Container?.appendChild(pointerNone)
      // @ts-ignore
      this.PointerReferences.push(pointerNone)
    }

    const pointerAdd = this.HtmlToNode(PointerAdd)
    if (pointerAdd) {
      this.Container?.appendChild(pointerAdd)
      // @ts-ignore
      this.PointerReferences.push(pointerAdd)
    }

    const pointerRemove = this.HtmlToNode(PointerRemove)
    if (pointerRemove) {
      this.Container?.appendChild(pointerRemove)
      // @ts-ignore
      this.PointerReferences.push(pointerRemove)
    }

    const pointerSelect = this.HtmlToNode(PointerSelect)
    if (pointerSelect) {
      this.Container?.appendChild(pointerSelect)
      // @ts-ignore
      this.PointerReferences.push(pointerSelect)
    }

    this.SetPointer()
  }


  attributeChangedCallback(property: string, _oldValue: string | null, newValue: string | null) {
    if (property === 'data-pointer') {
      switch (newValue) {
        case ('Add'):
          this.PointerType = PointerType.Add
          break
        case ('Remove'):
          this.PointerType = PointerType.Remove
          break
        case ('Select'):
          this.PointerType = PointerType.Select
          break
        default:
          this.PointerType = PointerType.None
      }
      this.SetPointer()
    }
    if (property === 'data-label-text') {

      if(!this.LabelTextContainer) return
      
      if(newValue && newValue != '') {
        this.LabelText = newValue

        this.LabelTextContainer.innerHTML = newValue
        this.LabelTextContainer?.removeAttribute('hidden')
      } else {
        this.LabelTextContainer.innerHTML = ''
        this.LabelTextContainer?.setAttribute('hidden', 'true')
      }

    }
  }


  /**
   * Show the current pointer, hide the others
   */
  SetPointer() {
    this.PointerReferences.forEach(
      (ref, refIdx) => {
        if (refIdx == this.PointerType) {
          this.Container?.classList.add(`type-${refIdx}`)
          ref.removeAttribute('hidden')
        } else {
          this.Container?.classList.remove(`type-${refIdx}`)
          ref.setAttribute('hidden', 'true')
        }
      }
    )
  }

}

export default GridMapPointer
