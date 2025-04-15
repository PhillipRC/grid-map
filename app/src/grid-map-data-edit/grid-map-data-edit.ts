import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget.js'
import GridMapData from '../grid-map-data/grid-map-data'
import GridMapTiles from '../grid-map-tiles/grid-map-tiles'
import GridMapFormTileLayers from '../grid-map-form-tile-layers/grid-map-form-tile-layers'
import PointerType from '../grid-map-pointer/PointerType.js'
import { TileData } from '../types'

// markup and styles
import DataEditHtml from './grid-map-data-edit.html?raw'
import css from './grid-map-data-edit.css?inline'


/**
 * Handles Form for 
 */
export default class GridMapDataEdit extends AppSidebarWidget {

  /**
   * Component handling Map data: loading, generating, getting
   */
  GridMapData: GridMapData | null = null
  
  
  GridMapTilesRef: GridMapTiles | null = null


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


  /**
   * Option to Add tiles
   * 
   * @type {HTMLButtonElement|null|undefined}
   */
  PointerAddOption: HTMLButtonElement | null | undefined = null


  /**
   * Option to Remove tiles
   * 
   * @type {HTMLButtonElement|null|undefined}
   */
  PointerRemoveOption: HTMLButtonElement | null | undefined = null


  /**
   * Option to Select tiles
   * 
   * @type {HTMLButtonElement|null|undefined}
   */
  PointerSelectOption: HTMLButtonElement | null | undefined = null


  constructor() {
    super(css)
  }


  connectedCallback() {

    super.connectedCallback()

    this.WidgetTitle = 'Edit Map'

    // add base markup for edit options
    const node = this.HtmlToNode(DataEditHtml)
    if (node) this.WidgetContent?.append(node)

    this.LayersForm = this.shadowRoot?.querySelector('.layers-form')
    this.PointerAddOption = this.shadowRoot?.querySelector('.pointer-add-option')
    this.PointerRemoveOption = this.shadowRoot?.querySelector('.pointer-remove-option')
    this.PointerSelectOption = this.shadowRoot?.querySelector('.pointer-select-option')

    // add listeners
    this.PointerAddOption?.addEventListener('click', () => { this.HandlePointerSelection(PointerType.Add) })
    this.PointerRemoveOption?.addEventListener('click', () => { this.HandlePointerSelection(PointerType.Remove) })
    this.PointerSelectOption?.addEventListener('click', () => { this.HandlePointerSelection(PointerType.Select) })

    // @ts-ignore
    document.addEventListener(
      'grid-map-data-loaded',
      (customEvent) => {
        // @ts-ignore
        this.GridMapData = customEvent.detail
        this.HandleDataLoaded()
      }
    )

    document.addEventListener(
      'grid-map-tiles-loaded',
      (customEvent) => {
        // @ts-ignore
        this.GridMapTilesRef = customEvent.detail
        this.HandleDataLoaded()
      }
    )

    document.addEventListener(
      'grid-map-display-select-layer',
      (customEvent) => {
        // @ts-ignore
        const tileData = customEvent.detail as TileData
        this.Layers?.SelectLayer(tileData.Layer)
      }
    )

  }


  HandleDataLoaded() {
    if(!this.GridMapData || !this.GridMapTilesRef) return
    this.Init()
  }


  Init() {

    // clear layer inputs
    if (this.Layers) this.LayersForm?.removeChild(this.Layers)

    if (!this.GridMapData || !this.GridMapData.MapData || !this.GridMapData.MapData.Layers) return

    // create new layer inputs
    this.Layers = new GridMapFormTileLayers()
    if(this.GridMapTilesRef?.TileSets) this.Layers.SetTilesets(this.GridMapTilesRef.TileSets)
    this.LayersForm?.appendChild(this.Layers)

    // todo - convert from the type used by render to the type used by the form
    this.Layers.SetTileLayers(this.GridMapData?.MapData?.Layers)

    // @ts-ignore
    this.Layers.addEventListener(
      'change',
      (event) => {

        event.stopPropagation()

        if(!event.target) return
        
        // @ts-ignore
        const name = event.target.getAttribute('name')
        // @ts-ignore
        const layerIdx = event.target.getAttribute('data-layer-idx')
        // @ts-ignore
        const value = event.target.value

        if (!name || !layerIdx || !value) return

        switch(name) {

          case('Color'):
            this.GridMapData?.SetLayerColor(layerIdx, value)
            break

          case('Tileset'):
            this.GridMapData?.SetLayerTileSet(layerIdx, value)
            break

          case('CanWalk'):
            const bool = value == 'true' ? true : false
            this.GridMapData?.SetLayerCanWalk(layerIdx, bool)
            break

        }
      }
    )
  }


  /**
   * Handle Pointer Select
   * 
   * @param {PointerType} pointerType
   */
  HandlePointerSelection(pointerType: PointerType) {
    
    this.ClearSelected()
    
    if (pointerType == PointerType.Add) {
      this.PointerAddOption?.setAttribute('selected', 'true')
      document.dispatchEvent(
        new Event('grid-map-display-add-tile')
      )
    }

    if (pointerType == PointerType.Remove) {
      this.PointerRemoveOption?.setAttribute('selected', 'true')
      document.dispatchEvent(
        new Event('grid-map-display-remove-tile')
      )
    }

    if (pointerType == PointerType.Select) {
      this.PointerSelectOption?.setAttribute('selected', 'true')
      document.dispatchEvent(
        new Event('grid-map-display-select-tile')
      )
    }

  }


  ClearSelected() {
    this.PointerAddOption?.removeAttribute('selected')
    this.PointerRemoveOption?.removeAttribute('selected')
    this.PointerSelectOption?.removeAttribute('selected')
  }


}
