import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'
import GridMapData from '../grid-map-data/grid-map-data'
import GridMapTilesets from '../grid-map-tilesets/grid-map-tilesets'
import GridMapFormTileLayers from '../grid-map-form-tile-layers/grid-map-form-tile-layers'
import PointerType from '../grid-map-pointer/PointerType'
import { TileData } from '../types'
import GridMapDisplay from '../grid-map-display/grid-map-display'

// markup and styles
import DataEditHtml from './grid-map-data-edit.html?raw'
import css from './grid-map-data-edit.css?raw'


/**
 * Handles Form for 
 * 
 * @fires GridMapDataEdit.EventPointerTypeSelected
 * @fires GridMapDataEdit.EventLayerSelected
 * 
 * @listens GridMapData.EventLoaded
 * @listens GridMapData.EventLayerRemoved
 * @listens GridMapData.EventLayerAdded
 * 
 * @listens GridMapTiles.EventLoaded
 * 
 * @listens GridMapDisplay.EventLayerSelected
 * @listens GridMapDisplay.EventPointerTypeSelected
 */
export default class GridMapDataEdit extends AppSidebarWidget {

  /** fires: Pointer Type Selected */
  static EventPointerTypeSelected = 'grid-map-data-edit-select-pointer'

  /** fires: Layer Selected */
  static EventLayerSelected = 'grid-map-edit-selected-layer'


  /**
   * Component handling Map data: loading, generating, getting
   */
  GridMapData: GridMapData | null = null


  GridMapTilesRef: GridMapTilesets | null = null


  /**
   * Container holding the Layers
   * 
   * @type {HTMLFormElement|null|undefined}
   */
  LayersForm: HTMLFormElement | null | undefined = null


  /**
   * Component representing the TileLayer inputs and data
   * 
   * @type {GridMapFormTileLayers|null}
   */
  Layers: GridMapFormTileLayers | null = null

  AddLayerOption: HTMLButtonElement | null = null
  RemoveLayerOption: HTMLButtonElement | null = null


  /**
   * Option to Add tiles
   * 
   * @type {HTMLButtonElement|null|undefined}
   */
  PointerAddOption: HTMLButtonElement | null = null


  /**
   * Option to Remove tiles
   * 
   * @type {HTMLButtonElement|null|undefined}
   */
  PointerRemoveOption: HTMLButtonElement | null = null


  /**
   * Option to Select tiles
   * 
   * @type {HTMLButtonElement|null|undefined}
   */
  PointerSelectOption: HTMLButtonElement | null = null


  constructor() {
    super(css)
  }


  connectedCallback() {

    super.connectedCallback()

    this.WidgetTitle = 'Edit'

    // add base markup for edit options
    const node = this.HtmlToNode(DataEditHtml)
    if (node) this.WidgetContent?.append(node)

    this.LayersForm = this.shadowRoot?.querySelector('.layers-form')
    this.PointerAddOption = this.shadowRoot?.querySelector('.pointer-add-option')!
    this.PointerRemoveOption = this.shadowRoot?.querySelector('.pointer-remove-option')!
    this.PointerSelectOption = this.shadowRoot?.querySelector('.pointer-select-option')!

    this.AddLayerOption = this.shadowRoot?.querySelector('.add-tileset')!
    this.RemoveLayerOption = this.shadowRoot?.querySelector('.remove-tileset')!

    // add listeners
    this.PointerAddOption?.addEventListener('click', () => { this.HandlePointerOptionSelection(PointerType.Add) })
    this.PointerRemoveOption?.addEventListener('click', () => { this.HandlePointerOptionSelection(PointerType.Remove) })
    this.PointerSelectOption?.addEventListener('click', () => { this.HandlePointerOptionSelection(PointerType.Select) })

    this.AddLayerOption?.addEventListener(
      'click',
      () => { this.HandleAddLayer() }
    )

    this.RemoveLayerOption?.addEventListener(
      'click',
      () => { this.HandleRemoveLayer() }
    )

    document.addEventListener(
      GridMapData.EventLoaded,
      (event: CustomEventInit<GridMapData>) => {
        if (event.detail != undefined) {
          this.GridMapData = event.detail
          this.HandleDataLoaded()
        }
      }
    )

    document.addEventListener(
      GridMapTilesets.EventLoaded,
      (event: CustomEventInit<GridMapTilesets>) => {
        if (event.detail != undefined) {
          this.GridMapTilesRef = event.detail
          this.HandleDataLoaded()
        }
      }
    )

    document.addEventListener(
      GridMapData.EventLayerRemoved,
      (event: CustomEventInit<number>) => {
        if (event.detail != undefined) {
          this.HandleLayerRemoved(event.detail)
        }
      }
    )

    document.addEventListener(
      GridMapData.EventLayerAdded,
      (event: CustomEventInit<number>) => {
        if (event.detail != undefined) {
          this.HandleLayerAdded(event.detail)
        }
      }
    )

    document.addEventListener(
      GridMapDisplay.EventLayerSelected,
      (event: CustomEventInit<TileData>) => {
        if (event.detail != undefined) {
          if (event.detail != null && event.detail.Layer != null) {
            this.Layers?.SelectLayer(event.detail.Layer)
          }
        }
      }
    )

    document.addEventListener(
      GridMapDisplay.EventPointerTypeSelected,
      (event: CustomEventInit<PointerType>) => {
        if (event.detail) this.HandlePointerSelection(event.detail)
      }
    )

    // set default selection
    this.HandlePointerSelection(PointerType.Select)

    // open display on first load
    this.ToggleDisplay()

  }


  HandleRemoveLayer() {

    const layerIdx = this.Layers?.Tabs?.selectedIndex

    if (!this.GridMapData || layerIdx == undefined) return

    this.GridMapData.RemoveLayer(layerIdx)
  }


  HandleLayerRemoved(layerIdx: number) {
    if (layerIdx == 0) layerIdx = 1
    this.SetLayersEditControls(layerIdx - 1)
  }


  HandleAddLayer() {

    const layerIdx = this.Layers?.Tabs?.selectedIndex

    if (!this.GridMapData || layerIdx == undefined) return

    // set defaults for new layer
    this.GridMapData.AddLayer(
      layerIdx + 1,
      {
        Tileset: 'Smooth-Md-Edge',
        CanWalk: true,
        Color: '#855785',
        ModifierName: 'None',
      }
    )
  }

  HandleLayerAdded(layerIdx: number) {
    this.SetLayersEditControls(layerIdx)
  }


  HandleDataLoaded() {
    if (!this.GridMapData || !this.GridMapTilesRef) return
    this.Init()
  }


  /** Handle first load */
  Init() {
    this.SetLayersEditControls()
  }


  /** Clear layer inputs */
  ClearLayersEditControls() {
    if (this.Layers) this.LayersForm?.removeChild(this.Layers)
  }


  /** Create inputs for each Layer */
  SetLayersEditControls(selectedIdx: number = 0) {

    this.ClearLayersEditControls()

    if (!this.GridMapData || !this.GridMapData.MapData || !this.GridMapData.MapData.Layers) return

    // create new layer inputs
    this.Layers = new GridMapFormTileLayers()
    if (this.GridMapTilesRef?.TileSets) this.Layers.SetTilesets(this.GridMapTilesRef.TileSets)
    this.LayersForm?.appendChild(this.Layers)

    // todo - convert from the type used by render to the type used by the form
    this.Layers.SetTileLayers(this.GridMapData?.MapData?.Layers)

    this.Layers?.Tabs?.addEventListener(
      'selected-changed',
      () => { this.HandleLayerChanged() }
    )

    if (selectedIdx) {
      this.Layers.Tabs?.setAttribute(
        'selected-index',
        selectedIdx.toString()
      )
    }

    // send event with default layer selection
    document.dispatchEvent(
      new CustomEvent(
        'grid-map-edit-selected-layer',
        {
          bubbles: true,
          detail: this.Layers?.Tabs?.selectedIndex,
        }
      )
    )


    // @ts-ignore
    this.Layers.addEventListener(
      'change',
      (event) => {

        event.stopPropagation()

        if (!event.target) return

        // @ts-ignore
        const name = event.target.getAttribute('name')
        // @ts-ignore
        const layerIdx = event.target.getAttribute('data-layer-idx')
        // @ts-ignore
        const value = event.target.value

        if (!name || !layerIdx || !value) return

        switch (name) {

          case ('Color'):
            this.GridMapData?.SetLayerColor(layerIdx, value)
            break

          case ('Tileset'):
            this.GridMapData?.SetLayerTileSet(layerIdx, value)
            break

          case ('CanWalk'):
            const bool = value == 'true' ? true : false
            this.GridMapData?.SetLayerCanWalk(layerIdx, bool)
            break

        }
      }
    )
  }


  /** Handle when user selects one of the available layers */
  HandleLayerChanged() {
    let selectedLayer = this.Layers?.Tabs?.selectedIndex
    selectedLayer = (selectedLayer == undefined || selectedLayer == null ? 0 : selectedLayer)
    document.dispatchEvent(
      new CustomEvent(
        GridMapDataEdit.EventLayerSelected,
        {
          bubbles: true,
          detail: selectedLayer,
        }
      )
    )
  }

  /** Handle when user selects one of the available pointers */
  HandlePointerOptionSelection(pointerType: PointerType) {
    document.dispatchEvent(
      new CustomEvent(
        GridMapDataEdit.EventPointerTypeSelected,
        { bubbles: true, detail: pointerType }
      )
    )

    this.HandlePointerSelection(pointerType)
  }


  /** Handle Pointer Select */
  HandlePointerSelection(pointerType: PointerType) {

    this.ClearSelected()

    if (pointerType == PointerType.Add) {
      this.PointerAddOption?.setAttribute('selected', 'true')
    }

    if (pointerType == PointerType.Remove) {
      this.PointerRemoveOption?.setAttribute('selected', 'true')
    }

    if (pointerType == PointerType.Select) {
      this.PointerSelectOption?.setAttribute('selected', 'true')
    }

  }


  ClearSelected() {
    this.PointerAddOption?.removeAttribute('selected')
    this.PointerRemoveOption?.removeAttribute('selected')
    this.PointerSelectOption?.removeAttribute('selected')
  }


}
