import GridBase from '../shared/grid-base'
import GridMapData from '../grid-map-data/grid-map-data'
import GridMapTiles from '../grid-map-tiles/grid-map-tiles'
import GridMapPointer from '../grid-map-pointer/grid-map-pointer'
import PointerType from '../grid-map-pointer/PointerType'
import Color from '../Color'
import GridMapDataEdit from '../grid-map-data-edit/grid-map-data-edit'
import GridMapTilesSetDisplay from '../grid-map-tiles-set-display/grid-map-tiles-set-display'

import {
  XY,
  XYMinMax,
  TileData,
  RenderedTile,
  GridMapDisplayLayer,
  Tileset,
} from '../types'

// markup and style
import css from './grid-map-display.css?raw'
import html from './grid-map-display.html?raw'


/**
 * Handles displaying GridMapData using GridMapTiles.
 * 
 * Tiles are added and removed as they enter and leave the Render Area.
 * 
 * @fires GridMapDisplay.EventLayerSelected
 * @fires GridMapDisplay.EventPointerTypeSelected
 * @fires GridMapData.EventGenerateRandom
 * 
 * @listens AppSidebar.EventNormalState
 * @listens AppSidebar.EventEditState
 * 
 * @listens GridMapTiles.EventLoaded
 *
 * @listens GridMapData.EventLoading
 * @listens GridMapData.EventLoaded 
 * @listens GridMapData.EventLayerUpdated
 * @listens GridMapData.EventLayerRemoved
 * @listens GridMapData.EventLayerAdded
 * @listens GridMapData.EventLayerTilesetUpdateSet
 * 
 * @listens GridMapDataEdit.EventPointerTypeSelected
 * @listens GridMapDataEdit.EventLayerSelected
 *
 * @listens GridMapTilesSetDisplay.EventSelected
 */
export default class GridMapDisplay extends GridBase {

  /** fires: Layer Selected */
  static EventLayerSelected = 'grid-map-display-select-layer'

  /** fires: Pointer Type Selected */
  static EventPointerTypeSelected = 'grid-map-display-select-pointer'

  /** listens: normal state */
  static EventNormalState = 'grid-map-display-state-normal'
  
  /** listens: edit state */
  static EventEditState = 'grid-map-display-state-edit'

  /** Component handling Tile data: loading and creating */
  GridMapTiles: GridMapTiles | null = null

  /** Component handling Map data: loading, generating, getting */
  GridMapData: GridMapData | null = null

  /**
   * Used to determines the largest area of tiles that will be rendered.
   * 
   * @type {XY} Units: Map Coordinates
   */
  MaxRenderAreaSize: XY = {
    x: 19,
    y: 10
  }

  /**
   * The pixel size of a tile in the Grid/Map
   */
  TilePixelSize: XY = {
    x: 64,
    y: 64
  }

  /**
   * The pixel size of the entire Grid/Map
   * 
   * @type {XY} Units: Map Coordinates
   */
  GridPixelSize: XY = {
    x: 0,
    y: 0
  }

  /**
   * Tracks the Top Left corner of the SVGContainers
   * relative to the Top Left of the view port
   * 
   * @type {XY} Units: Pixels
   */

  GridCenterOffset: XY = {
    x: 0,
    y: 0
  }

  /** 
   * Center Map Location
   * 
   * @type {XY} Units: Map Coordinates
   */
  CenterLocation: XY = {
    x: 0,
    y: 0
  }


  /** 
   * Selected Map Location
   * 
   * @type {XY} Units: Map Coordinates
   */
  SelectedLocation: XY = {
    x: 0,
    y: 0
  }

  /**
   * Selected Tile Data
   */
  #selectedLocationData: TileData = {
    Layer: -1,
    Tileset: null,
    CanWalk: false,
  }

  set SelectedLocationData(value: TileData) {
    if (value) {
      this.Container?.classList.remove(`selected-layer-${this.#selectedLocationData.Layer}`)
      this.Container?.querySelector(`#layer-${this.#selectedLocationData.Layer}`)?.classList.remove('selected')

      this.#selectedLocationData = value

      this.Container?.classList.add(`selected-layer-${value.Layer}`)
      this.Container?.querySelector(`#layer-${value.Layer}`)?.classList.add('selected')
    }
  }

  get SelectedLocationData(): TileData {
    return this.#selectedLocationData
  }


  /**
   * Tile Data under the Pointer
   * 
   * @type {TileData|null}
   */
  PointerLocationData: TileData | null = null


  /** 
   * Pointer Map Location
   * 
   *  @type {XY} Units: Map Coordinates
   */
  PointerLocation: XY = {
    x: 0,
    y: 0
  }


  Pointer: GridMapPointer | null | undefined = null


  #displayScale: number = 1

  set DisplayScale(value) {
    if (value && value != this.#displayScale) {
      this.#displayScale = value
      if (this.ScaleContainer) this.ScaleContainer.style.zoom = value.toString()
    }
  }

  get DisplayScale() {
    return this.#displayScale
  }


  /**
   * Tile Data under the Pointer
   */
  SavedTileData: TileData | null = null


  /** 
   * Offset from Top Left corner of the GridMapDisplay
   * 
   * @type {XY} Units: Pixels
   */
  ViewCenter: XY = {
    x: 0,
    y: 0
  }

  ViewRect: DOMRect | null = null

  Container: HTMLElement | null = null

  ScaleContainer: HTMLElement | null = null

  Layers: Array<GridMapDisplayLayer> = []

  LayersStyle: HTMLStyleElement | null | undefined = null

  /** avatar img */
  Reticle: HTMLElement | null = null

  EditToolsPanel: HTMLElement | null = null

  Debug: HTMLElement | null = null

  /** Track if it is the first render after a map is loaded */
  FirstRenderAfterLoad: boolean = true

  UpdateTime: number = 0

  #Focus: boolean = false

  State: 'normal' | 'edit' = 'normal'


  constructor() {
    super(css, html)
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    // allow display to capture focus/keyboard
    this.setAttribute('tabindex', '1')

    // #region display references

    this.Container = this.shadowRoot?.querySelector('.container')!
    this.ScaleContainer = this.shadowRoot?.querySelector('.scale-container')!
    this.Reticle = this.shadowRoot?.querySelector('.reticle')!
    this.LayersStyle = this.shadowRoot?.querySelector('#layer-styles')
    this.EditToolsPanel = this.shadowRoot?.querySelector('.edit-tools-panel')!
    this.Debug = this.shadowRoot?.querySelector('.debug')!
    this.Pointer = this.shadowRoot?.querySelector('.layer-pointer')

    // #endregion

    this.addEventListener(
      'focus',
      () => {
        this.#Focus = true
        this.Container?.classList.add('focus')
      }
    )

    this.addEventListener(
      'blur',
      () => {
        this.#Focus = false
        this.Container?.classList.remove('focus')
      }
    )

    // #region Mouse Listeners

    this.addEventListener(
      'mousemove',
      (event) => { this.HandleMouseMove(event) }
    )

    this.addEventListener(
      'click',
      () => { this.HandleMouseUp() }
    )

    this.addEventListener(
      'mouseover',
      () => { this.HandleMouseIn() }
    )

    this.addEventListener(
      'mouseout',
      () => { this.HandleMouseOut() }
    )

    this.addEventListener(
      'mousedown',
      (event) => { this.HandleMouseDown(event) }
    )

    this.addEventListener(
      'wheel',
      (event) => { this.HandleMouseWheel(event) }
    )

    // process when the mouse or touch is down
    setInterval(
      () => {
        if (this.#mouseIsDown) this.HandleMouseIsDown()
        if (this.#touchIsDown) this.HandleTouchIsDown()
      },
      100
    )

    // #endregion

    // #region Touch Listeners
    this.addEventListener(
      'touchstart',
      (event) => { this.HandleTouchStart(event) }
    )

    this.addEventListener(
      'touchmove',
      (event) => { this.HandleTouchMove(event) }
    )

    this.addEventListener(
      'touchend',
      () => { this.HandleTouchEnd() }
    )

    this.addEventListener(
      'touchcancel',
      () => { this.HandleTouchEnd() }
    )

    // #endregion


    // #region KB Listeners

    this.addEventListener(
      'keyup',
      (event) => { this.HandleKeyboardUp(event) }
    )

    this.addEventListener(
      'keydown',
      (event) => { this.HandleKeyboardDown(event) }
    )

    // #endregion


    // #region Custom Event Listeners

    document.addEventListener(
      GridMapData.EventLoading,
      () => {
        
        // if its not yet init its the first fun
        if (!this.IsInitialized) return

        this.Queue.Clear()
        this.HandleGridMapLoading()
      }
    )

    document.addEventListener(
      GridMapData.EventLoaded,
      (event: CustomEventInit<GridMapData>) => {
        // do not queue map loaded
        if (event.detail != undefined) this.HandleGridMapLoaded(event.detail)
      }
    )

    document.addEventListener(
      GridMapTiles.EventLoaded,
      (event: CustomEventInit<GridMapTiles>) => {
        // do not queue tiles loaded
        if (event.detail != undefined) this.HandleTilesLoaded(event.detail)
      }
    )

    document.addEventListener(
      GridMapDisplay.EventNormalState,
      () => {
        const GridMapDisplay_SetStateNormal = () => { this.SetStateNormal() }
        this.Queue.Add(GridMapDisplay_SetStateNormal)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapDisplay.EventEditState,
      () => {
        const GridMapDisplay_SetStateEdit = () => { this.SetStateEdit() }
        this.Queue.Add(GridMapDisplay_SetStateEdit)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapTilesSetDisplay.EventSelected,
      (event: CustomEventInit<string>) => {
        const GridMapDisplay_HandleTileSetSelected = () => {
          if (event.detail != undefined) this.HandleTileSetSelected(event.detail)
        }
        this.Queue.Add(GridMapDisplay_HandleTileSetSelected)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    /** Handle Color, CanWalk, etc. is updated */
    document.addEventListener(
      GridMapData.EventLayerUpdated,
      () => {
        const GridMapDisplay_ResetTiles = () => {
          this.ResetTiles()
        }
        this.Queue.Add(GridMapDisplay_ResetTiles)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapData.EventLayerRemoved,
      (event: CustomEventInit<number>) => {
        const ResetLayers = () => {
          if (event.detail != undefined) this.ResetLayers(event.detail)
        }
        this.Queue.Add(ResetLayers)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapData.EventLayerAdded,
      (event: CustomEventInit<number>) => {
        const ResetLayers = () => {
          if (event.detail != undefined) this.ResetLayers(event.detail)
        }
        this.Queue.Add(ResetLayers)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapData.EventLayerTilesetUpdateSet,
      (event: CustomEventInit<number>) => {
        const ResetLayers = () => {
          if (event.detail != undefined) this.ResetLayers(event.detail)
        }
        this.Queue.Add(ResetLayers)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapDataEdit.EventPointerTypeSelected,
      (custeomEvent: CustomEventInit<number>) => {
        const GridMapDisplay_SetPointer = () => {
          if (
            this.State == 'edit'
            && custeomEvent.detail
          ) {
            this.SetPointer(custeomEvent.detail)
          }
        }
        this.Queue.Add(GridMapDisplay_SetPointer)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    document.addEventListener(
      GridMapDataEdit.EventLayerSelected,
      (event: CustomEventInit<number>) => {
        const GridMapDisplay_HandleLayerSelected = () => {
          if (event.detail != undefined) this.HandleLayerSelected(event.detail)
        }
        this.Queue.Add(GridMapDisplay_HandleLayerSelected)
        if (this.IsInitialized) this.Queue.Process()
      }
    )

    // #endregion

    // handle resize
    new ResizeObserver(() => { this.HandleResize() }).observe(this)

    this.SetStateNormal()

  }


  async Init() {

    // don't bother doing anything until a map and tiles are loaded
    if (
      this.GridMapData == null
      || this.GridMapData.MapData == null
      || this.GridMapTiles == null
    ) return

    // set the starting location
    this.CenterLocation.x = this.GridMapData.MapData.Start.x
    this.CenterLocation.y = this.GridMapData.MapData.Start.y
    
    this.SetGridPixelSize()
    await this.ResetLayers()
    this.HandleResize()

    this.IsInitialized = true
    this.Queue.Process()

  }


  /**
   * Clear and Rebuild Layers and Tiles
   */
  async ResetLayers(_layerIdx?: number) {
    await this.ResetTiles(false)
    this.SetLayers()
    this.Render()
  }


  /**
   * Clear and Rebuild Tiles,
   * needed to refresh display when tile props change, i.e. color, tileset
   */
  async ResetTiles(render: boolean = true) {
    this.RemoveAllTiles()
    await this.SetLayerColors()
    if (render) this.Render()
  }


  /** Create a Display Layer for each Map Layer */
  SetLayers() {

    // don't bother doing anything until a map and tiles are loaded
    if (
      this.GridMapData == null
      || this.GridMapData.MapData == null
      || this.GridMapTiles == null
    ) return

    this.ClearLayers()

    for (var layerIdx = 0; layerIdx < this.GridMapData.MapData.Layers.length; layerIdx++) {

      const layer = this.GridMapData.MapData.Layers[layerIdx]
      const tileSet = this.GridMapTiles?.GetTileSetByName(layer.Tileset)!

      let container = null

      // create svg layer
      if (tileSet?.Format == 'svg') {
        container = this.CreateSvgTag(
          'svg',
          [
            ['width', this.GridPixelSize.x],
            ['height', this.GridPixelSize.y],
          ]
        )
      }

      // create image layer
      if (tileSet?.Format == 'img') {
        container = document.createElement('div')
        container.style.width = this.GridPixelSize.x.toString() + 'px'
        container.style.height = this.GridPixelSize.y.toString() + 'px'
      }

      if (container != null) {
        container.id = `layer-${layerIdx}`
        container.classList.add('layer')
        container.style.zIndex = ((layerIdx + 1) * 100).toString()
        this.Layers.push(
          {
            SvgContainer: container,
            RenderedTiles: []
          }
        )
        this.ScaleContainer?.appendChild(container)
      }

    }

    this.AddDummyLayer()

  }

  /**
   * Dummy layer is added to fix a TouchMove listener issue,
   * without this TouchMove was not firing on the last layer
   */
  AddDummyLayer() {

    if (!this.GridMapData?.MapData) return

    // remove previous dummy layer to ensure its last in the DOM
    const currentDummyLayer = this.ScaleContainer?.querySelector('#dummy-layer')
    if (currentDummyLayer) this.ScaleContainer?.removeChild(currentDummyLayer)

    // create dummy layer
    const dummyLayer = this.CreateSvgTag('svg', [['width', this.GridPixelSize.x], ['height', this.GridPixelSize.y]])
    dummyLayer.id = 'dummy-layer'
    dummyLayer.classList.add('layer')
    dummyLayer.style.zIndex = ((this.GridMapData.MapData.Layers.length + 1) * 100).toString()
    this.ScaleContainer?.appendChild(dummyLayer)
  }

  /**
   * Set the Styles for each layer,
   * enables setting a color for a svg layer using styles
   */
  async SetLayerColors() {

    if (
      !this.GridMapData
      || !this.GridMapData.MapData
      || !this.GridMapTiles
    ) return

    this.ClearLayerStyles()

    for (var layerIdx = 0; layerIdx < this.GridMapData.MapData.Layers.length; layerIdx++) {

      const layer = this.GridMapData.MapData.Layers[layerIdx]
      const tileSet = this.GridMapTiles?.GetTileSetByName(layer.Tileset)!
      await this.GridMapTiles.LoadColorizedTiles(tileSet, layer.Color)

      // add styles to apply the select color
      const styles = []
      // set stroke color
      styles.push(`#layer-${layerIdx}{--stroke-color: ${Color.ColorFromHex(layer.Color).Contrast()};}`)
      // set base color
      styles.push(`#layer-${layerIdx} .fills {fill: ${layer.Color};} `)
      // set color variant 1
      styles.push(`#layer-${layerIdx} .fills-1 {fill: ${Color.ColorFromHex(layer.Color).Level(layer.Color, -10)};}`)
      // set color variant 2
      styles.push(`#layer-${layerIdx} .fills-2 {fill: ${Color.ColorFromHex(layer.Color).Level(layer.Color, -20)};}`)
      // set 50% opacity
      styles.push(`#layer-${layerIdx} .fills-o {fill: ${layer.Color};fill-opacity: .5;}`)
      styles.forEach(
        (style) => {
          this.LayersStyle?.appendChild(
            document.createTextNode(style)
          )
        }
      )
    }

  }


  SetStateNormal() {
    this.State = 'normal'
    this.EditToolsPanel?.setAttribute('hidden', 'true')
    this.Container?.classList.remove('edit')
    this.SetPointer(PointerType.None)
    this.ReticleShow()
  }


  SetStateEdit() {
    this.State = 'edit'
    this.EditToolsPanel?.removeAttribute('hidden')
    this.Container?.classList.add('edit')
    this.SetPointer(PointerType.Select)
    this.ReticleHide()
  }


  ReticleShow() {
    if (
      this.GridMapData
      && !this.FirstRenderAfterLoad
      && this.State == 'normal'
    ) {
      this.Reticle?.removeAttribute('hidden')
    }
  }


  ReticleHide() {
    this.Reticle?.setAttribute('hidden', 'true')
  }


  /**
   * @param {string} tileSet 
   */
  HandleTileSetSelected(tileSet: string) {
    if (this.GridMapData == null) return

    this.GridMapData.SetLayerTileSet(
      this.SelectedLocationData.Layer,
      tileSet
    )
  }


  HandleLayerSelected(layerIdx: number) {
    let tileLayer = this.GridMapData?.MapData?.Layers[layerIdx]
    if (tileLayer?.Tileset != null && tileLayer?.CanWalk != null) {
      this.SelectedLocationData = {
        Layer: layerIdx,
        Tileset: tileLayer?.Tileset!,
        CanWalk: tileLayer?.CanWalk!,
      }
      this.SavedTileData = {
        Layer: layerIdx,
        Tileset: tileLayer?.Tileset!,
        CanWalk: tileLayer?.CanWalk!,
      }
    }
  }


  /**
   * @param {GridMapTiles} event 
   */
  HandleTilesLoaded(event: GridMapTiles) {
    this.GridMapTiles = event
    this.Init()
  }


  // #region Touch Handlers

  #touchIsDown: boolean = false
  #touchMoveBy: XY = { x: 0, y: 0 }

  GetMapCoordFromTouchEvent(touch: Touch): XY {
    return {
      x: Math.ceil(((touch.clientX * (1 / this.DisplayScale)) - this.GridCenterOffset.x - (this.TilePixelSize.x / 2)) / (this.TilePixelSize.x)
      ),
      y: Math.ceil(((touch.clientY * (1 / this.DisplayScale)) - this.GridCenterOffset.y - (this.TilePixelSize.y / 2)) / (this.TilePixelSize.y))
    }
  }


  HandleTouchStart(event: TouchEvent) {

    if (!this.GridMapData) return

    this.#touchIsDown = true
    this.focus()

    const coord = this.GetMapCoordFromTouchEvent(event.touches[0])
    this.#touchMoveBy = {
      x: (coord.x > this.CenterLocation.x ? 1 : coord.x < this.CenterLocation.x ? -1 : 0),
      y: (coord.y > this.CenterLocation.y ? 1 : coord.y < this.CenterLocation.y ? -1 : 0)
    }

    // if the coords changed
    if (this.PointerLocation.x != coord.x || this.PointerLocation.y != coord.y) {
      this.PointerLocation = coord
      this.PointerLocationData = this.GridMapData.GetTopMostMapData(coord)
    }

    this.PositionPointer()
    this.Pointer?.removeAttribute('hidden')

    if (this.#Focus && this.State == 'edit') {
      const SelectedLocationData = this.GridMapData.GetTopMostMapData(coord)
      this.UpdateMapDataAtPointerLocation(SelectedLocationData)
    }
  }

  HandleTouchMove(event: TouchEvent) {

    if (!this.GridMapData) return

    this.#touchIsDown = true

    const coord = this.GetMapCoordFromTouchEvent(event.touches[0])

    this.#touchMoveBy = {
      x: (coord.x > this.CenterLocation.x ? 1 : coord.x < this.CenterLocation.x ? -1 : 0),
      y: (coord.y > this.CenterLocation.y ? 1 : coord.y < this.CenterLocation.y ? -1 : 0)
    }

    if (this.PointerLocation.x != coord.x || this.PointerLocation.y != coord.y) {

      this.PointerLocation = coord
      this.PointerLocationData = this.GridMapData.GetTopMostMapData(coord)
      this.RenderDebug()
      this.PositionPointer()

      // when in edit state - update map data
      if (this.State == 'edit') {
        this.UpdateMapDataAtPointerLocation(null)
      }

    }

  }


  HandleTouchIsDown() {
    if (this.State != 'normal') return

    this.CursorMoveBy(
      this.#touchMoveBy,
      false
    )
  }

  HandleTouchEnd() {
    this.Pointer?.setAttribute('hidden', 'true')
    this.#touchIsDown = false
  }

  // #endregion


  // #region Mouse Handlers

  #mouseIsDown: boolean = false
  #mouseMoveBy: XY = { x: 0, y: 0 }


  GetMapCoordFromMouseEvent(event: MouseEvent): XY {
    return {
      x: Math.ceil(((event.offsetX * (1 / this.DisplayScale)) - this.GridCenterOffset.x) / this.TilePixelSize.x),
      y: Math.ceil(((event.offsetY * (1 / this.DisplayScale)) - this.GridCenterOffset.y) / this.TilePixelSize.y)
    }
  }


  HandleMouseWheel(event: WheelEvent) {

    this.CursorMoveBy(
      {
        x: 0,
        y: (event.deltaY > 1 ? 1 : -1)
      },
      this.State == 'edit' ? true : false
    )

  }

  HandleMouseDown(event: MouseEvent) {

    this.#mouseIsDown = true
    this.UpdateMouseMoveBy()

    const coord = this.GetMapCoordFromMouseEvent(event)

    if (this.#Focus && this.State == 'edit') {
      const SelectedLocationData = this.GridMapData?.GetTopMostMapData(coord)
      this.UpdateMapDataAtPointerLocation(SelectedLocationData)
    }

  }


  HandleMouseUp() {
    this.#mouseIsDown = false
    this.RenderDebug()
  }


  /** Handle performing operations  */
  HandleMouseIsDown() {

    if (this.State != 'normal') return

    this.CursorMoveBy(
      this.#mouseMoveBy,
      false
    )
  }


  UpdateMouseMoveBy() {
    this.#mouseMoveBy = {
      x: (this.PointerLocation.x > this.CenterLocation.x ? 1 : this.PointerLocation.x < this.CenterLocation.x ? -1 : 0),
      y: (this.PointerLocation.y > this.CenterLocation.y ? 1 : this.PointerLocation.y < this.CenterLocation.y ? -1 : 0)
    }
  }


  /**
   * Translate the current mouse pointer location into Map Coordinates
   */
  HandleMouseMove(event: MouseEvent) {

    if (!this.GridMapData) return

    const coord = this.GetMapCoordFromMouseEvent(event)

    // if the coords changed
    if (this.PointerLocation.x != coord.x || this.PointerLocation.y != coord.y) {

      this.PointerLocation = coord
      this.PointerLocationData = this.GridMapData?.GetTopMostMapData(coord)
      this.RenderDebug()
      this.PositionPointer()
      this.UpdateMouseMoveBy()

      // when in edit state and the primary button is down - update map data
      if (this.State == 'edit' && event.buttons == 1) {
        this.UpdateMapDataAtPointerLocation(null)
      }

      // when in edit state - update pointer text
      if (this.State == 'edit' && this.PointerLocationData) {

        let text = ''

        if (this.SavedTileData) {
          text = ''
        } else {
          if (this.Pointer)
            text = `${this.Pointer?.PointerTypeName} ${this.PointerLocationData.Tileset}<br/>`
              + `Layer: ${this.PointerLocationData.Layer}`
        }
        this.Pointer?.setAttribute('data-label-text', text)
      }


    }
  }


  HandleMouseIn() {
    this.Pointer?.removeAttribute('hidden')
  }


  HandleMouseOut() {
    this.#mouseIsDown = false
    this.Pointer?.setAttribute('hidden', 'true')
  }

  // #endregion

  // #region KB Handlers

  HandleKeyboardDown(event: KeyboardEvent) {

    if (!this.GridMapData) return

    if (this.State == 'edit') {
      if (event.ctrlKey || event.shiftKey) {
        if (event.ctrlKey) this.SetPointer(PointerType.Remove)
        if (event.shiftKey) this.SetPointer(PointerType.Add)
      } else {
        // jump to pointer location
        if (event.code == 'Space') {
          const coord = {
            x: (this.PointerLocation.x - this.CenterLocation.x),
            y: (this.PointerLocation.y - this.CenterLocation.y)
          }
          this.CursorMoveBy(coord, true)
          this.PointerLocation = {
            x: this.CenterLocation.x + coord.x,
            y: this.CenterLocation.y + coord.y
          }
          this.PointerLocationData = this.GridMapData.GetTopMostMapData(this.PointerLocation)
        }
        this.SetPointer(PointerType.Select)
      }
    }


    // arrow keys - move horizontal and vertical
    if (
      event.key == 'ArrowRight'
      || event.key == 'ArrowLeft'
      || event.key == 'ArrowUp'
      || event.key == 'ArrowDown'
    ) {
      this.CursorMoveBy(
        {
          x: (event.key == 'ArrowRight' ? 1 : event.key == 'ArrowLeft' ? -1 : 0),
          y: (event.key == 'ArrowUp' ? -1 : event.key == 'ArrowDown' ? 1 : 0),
        },
        this.State == 'edit' ? true : false
      )
    }

    // wasd - move horizontal and vertical
    if (
      event.key == 'd'
      || event.key == 'a'
      || event.key == 'w'
      || event.key == 's'
    ) {
      this.CursorMoveBy(
        {
          x: (event.key == 'd' ? 1 : event.key == 'a' ? -1 : 0),
          y: (event.key == 'w' ? -1 : event.key == 's' ? 1 : 0),
        },
        this.State == 'edit' ? true : false
      )
    }

    // qezc - move at an angle
    if (
      event.key == 'q'
      || event.key == 'e'
      || event.key == 'z'
      || event.key == 'c'
    ) {
      this.CursorMoveBy(
        {
          x: ((event.key == 'q' || event.key == 'z') ? -1 : (event.key == 'e' || event.key == 'c') ? 1 : 0),
          y: ((event.key == 'q' || event.key == 'e') ? -1 : (event.key == 'z' || event.key == 'c') ? 1 : 0),
        },
        this.State == 'edit' ? true : false
      )
    }

  }

  HandleKeyboardUp(event: KeyboardEvent) {

    if (this.State == 'edit') this.SetPointer(PointerType.Select)

    if (event.key == 'g') {
      document.dispatchEvent(
        new Event(
          GridMapData.EventGenerateRandom,
          { bubbles: true }
        )
      )
    }

  }

  // #endregion


  PositionPointer() {
    if (!this.Pointer) return
    this.Pointer.style.top = `${(this.PointerLocation.y - 1) * this.TilePixelSize.y + this.GridCenterOffset.y}px`
    this.Pointer.style.left = `${(this.PointerLocation.x - 1) * this.TilePixelSize.x + this.GridCenterOffset.x}px`
  }


  /**
   * Clear the display
   */
  Clear() {

    // clear each layer
    this.ClearLayers()

    // clear LayersStyle
    this.ClearLayerStyles()

    this.GridMapData = null
    this.GridPixelSize = {
      x: 0,
      y: 0
    }

    this.ReticleHide()

    this.SetPointer(PointerType.None)

    this.RenderDebug()
  }

  /** Clear each layer */
  ClearLayers() {
    this.Layers.forEach(
      (layer) => {
        layer.SvgContainer?.remove()
        layer.RenderedTiles = []
      }
    )
    this.Layers = []
  }

  /**
   * @param {number} pointer
   */
  SetPointer(pointer: number) {
    let setPointer = PointerType.GetName(pointer)
    if (setPointer == null) setPointer = PointerType.GetName(0)
    this.Pointer?.setAttribute('data-pointer', setPointer)

    document.dispatchEvent(
      new CustomEvent(
        GridMapDisplay.EventPointerTypeSelected,
        {
          bubbles: true,
          detail: pointer
        }
      )
    )
  }

  ClearLayerStyles() {

    if (!this.LayersStyle) return

    for (var idx = this.LayersStyle.childNodes.length; idx > 0; idx--) {
      const node = this.LayersStyle.childNodes.item(idx - 1)
      this.LayersStyle.removeChild(node)
    }
  }

  /**
   * @param {XY} coord 
   */
  CursorMove(coord: XY, anywhere = false) {

    // bomb out if the requested move is outside the map
    if (this.GridMapData == null || this.GridMapData.IsOutsideOfMap(coord)) return

    const SelectedLocationData = this.GridMapData.GetTopMostMapData(coord)
    if (SelectedLocationData == null) return

    if (anywhere == false) {
      // bomb out if it is not walkable
      if (SelectedLocationData.CanWalk == false) return
    }

    this.CenterLocation = coord
    this.CenterOnMapCursor()

  }


  /**
   * Move the Cursor by a difference,
   * i.e. CursorMoveBy({-1,0})
   * 
   * @param {XY} coord 
   * @param {boolean} anywhere Flag to ignore CanWalk flag
   */
  CursorMoveBy(coord: XY, anywhere: boolean = false) {

    const newCoord: XY = {
      x: this.CenterLocation.x + coord.x,
      y: this.CenterLocation.y + coord.y
    }

    this.CursorMove(newCoord, anywhere)

  }

  HandleGridMapLoading() {
    this.Clear()
  }

  /**
   * @param {GridMapData} gridMapData 
   */
  HandleGridMapLoaded(gridMapData: GridMapData) {

    this.FirstRenderAfterLoad = true
    this.GridMapData = gridMapData

    this.Init()

    const data = this.GridMapData.GetTopMostMapData()
    if (data) this.SelectedLocationData = data

    // show reticle in normal mode
    if (this.State == 'normal') this.ReticleShow()
  }


  UpdateMapDataAtPointerLocation(tileData: TileData | null | undefined) {

    switch (this.Pointer?.PointerType) {

      case (PointerType.Select):
        if (tileData) this.SavedTileData = tileData
        document.dispatchEvent(
          new CustomEvent(
            GridMapDisplay.EventLayerSelected,
            {
              bubbles: true,
              detail: tileData
            }
          )
        )
        // no need to update the map with select
        return
        break

      case (PointerType.Remove):
        this.GridMapData?.SetMapData(
          this.PointerLocation.x,
          this.PointerLocation.y,
          this.SavedTileData?.Layer,
          0
        )
        break

      case (PointerType.Add):
        this.GridMapData?.SetMapData(
          this.PointerLocation.x,
          this.PointerLocation.y,
          this.SavedTileData?.Layer,
          1
        )
        break
    }

    this.RemoveUpdatedTiles()
    this.Render()

  }


  /**
   * Handle when the display container changes size
   */
  HandleResize() {

    this.ViewRect = this.getBoundingClientRect()
    this.SetDisplayScale()

    this.ViewCenter = {
      x: (this.ViewRect.width / 2) * (1 / this.DisplayScale),
      y: (this.ViewRect.height / 2) * (1 / this.DisplayScale),
    }
    this.CenterOnMapCursor()
    this.PositionPointer()
  }


  SetDisplayScale() {

    if (!this.ViewRect) return

    // calculate - scale = max(fh/ih, fw/iw)
    let scale = Math.max(
      this.ViewRect?.height / ((this.MaxRenderAreaSize.y + (this.MaxRenderAreaSize.y / 2)) * this.TilePixelSize.y),
      this.ViewRect?.width / ((this.MaxRenderAreaSize.x + (this.MaxRenderAreaSize.x / 2)) * this.TilePixelSize.x)
    )

    // snap decimal value to prevent artifacts caused by scaling
    scale = GridMapDisplay.SnapDecimal(scale)

    this.DisplayScale = scale
  }


  /**
   * Snap to specific decimal values
   */
  static SnapDecimal(value: number): number {

    const allowedDecimal = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]
    const wholeValue = parseInt(value.toString())
    const decimalValue = value - wholeValue
    let safeDecimalValue: number = 0

    for (const allowedDecimalValue of allowedDecimal) {

      if (
        decimalValue == allowedDecimalValue
        || decimalValue < allowedDecimalValue
      ) {
        safeDecimalValue = allowedDecimalValue
        break
      }
    }

    return wholeValue + safeDecimalValue
  }


  /**
   * Calculate the Grid/Map Size in pixels
   */
  SetGridPixelSize() {

    if (this.GridMapData == null || this.GridMapData.MapData == null) return

    // Size of Map * Size of Tiles - the size of 2 tiles - we are not rendering the edge tiles
    this.GridPixelSize.x = this.GridMapData.MapData.MapDataSize.x * this.TilePixelSize.x - (this.TilePixelSize.x * 2)
    this.GridPixelSize.y = this.GridMapData.MapData.MapDataSize.y * this.TilePixelSize.y - (this.TilePixelSize.y * 2)
  }

  /**
   * Center the center display
   */
  CenterRecticle() {

    // bomb out if objects are not set
    if (this.ViewCenter.x == null || this.ViewCenter.y == null || this.Reticle == null) return

    const tileCenter = {
      x: this.CenterLocation.x * this.TilePixelSize.x,
      y: this.CenterLocation.y * this.TilePixelSize.y
    }

    this.Reticle.style.top = (this.GridCenterOffset.y + tileCenter.y - this.TilePixelSize.y) + 'px'
    this.Reticle.style.left = (this.GridCenterOffset.x + tileCenter.x - this.TilePixelSize.x) + 'px'

    this.Reticle.style.height = `${this.TilePixelSize.y}px`
    this.Reticle.style.width = `${this.TilePixelSize.x}px`
  }

  /**
   * Move Layers[] to center on MapCursor
   */
  CenterOnMapCursor() {

    // bomb out if things are not setup
    if (this.GridMapData == null || this.GridMapTiles == null) return

    const tileCenter = {
      x: this.CenterLocation.x * this.TilePixelSize.x,
      y: this.CenterLocation.y * this.TilePixelSize.y
    }

    this.GridCenterOffset = {
      x: this.ViewCenter.x - tileCenter.x + (this.TilePixelSize.x / 2),
      y: this.ViewCenter.y - tileCenter.y + (this.TilePixelSize.y / 2)
    }

    if (this.ScaleContainer) {
      this.ScaleContainer.style.marginLeft = this.GridCenterOffset.x.toString() + 'px'
      this.ScaleContainer.style.marginTop = this.GridCenterOffset.y.toString() + 'px'
    }

    this.CenterRecticle()

    this.Render()
  }

  /**
   * Returns the area of the Map to Render
   */
  GetRenderArea(): XYMinMax {
    return {
      min: {
        x: Math.max(this.CenterLocation.x - this.MaxRenderAreaSize.x, 0),
        y: Math.max(this.CenterLocation.y - this.MaxRenderAreaSize.y, 0)
      },
      max: {
        // @ts-ignore
        x: Math.min(this.CenterLocation.x + this.MaxRenderAreaSize.x, this.GridMapData.MapData.MapDataSize.x - 2),
        // @ts-ignore
        y: Math.min(this.CenterLocation.y + this.MaxRenderAreaSize.y, this.GridMapData.MapData.MapDataSize.y - 2)
      }
    }
  }


  /**
   * Render the Display
   */
  Render() {
    const startTime = window.performance.now()
    this.RenderTilesInViewableArea()
    this.RemoveTilesOutOfViewableArea()
    this.UpdateTime = window.performance.now() - startTime
    this.RenderDebug()
  }

  /**
   * Render the Debug Display
   */
  RenderDebug() {

    if (this.State == 'normal' || !this.Debug) return

    var display = ''
    if (this.GridMapData != null) {
      const bounds = this.GetRenderArea()
      var display = ''
      display += `<pre>Render Range   (${bounds.min.x},${bounds.min.y}) to (${bounds.max.x},${bounds.max.y})`
      display += `<br/>Update Time    ${this.UpdateTime.toFixed(3)} ms`
      display += `<br/>Center   Loc   (${this.CenterLocation.x},${this.CenterLocation.y})`
      display += `<br/>Selected Loc   (${this.SelectedLocation.x},${this.SelectedLocation.y})`
      display += `<br/>Selected Data  Layer:${this.SelectedLocationData.Layer} Tile:${this.SelectedLocationData.Tileset}`
      display += `<br/>Saved TileData ${this.SavedTileData?.Layer} Tile:${this.SavedTileData?.Tileset}`
      display += `<br/>Pointer Loc    (${this.PointerLocation.x},${this.PointerLocation.y})</pre>`

    }
    this.Debug.innerHTML = display
  }

  /**
   * Adds the Tiles in the Viewable Area
   */
  RenderTilesInViewableArea() {

    if (
      this.GridMapData == null
      || this.GridMapData.MapData == null
      || this.GridMapTiles == null
      || this.Layers.length == 0
    ) {
      return
    }

    const viewableArea = this.GetRenderArea()

    // loop through the viewable area
    for (let y = viewableArea.min.y; y <= viewableArea.max.y; y++) {
      for (let x = viewableArea.min.x; x <= viewableArea.max.x; x++) {
        for (let layer = this.Layers.length - 1; layer >= 0; layer--) {

          const tileId = `${layer}-${x}-${y}`

          // tiles are offset from the main grid by half
          const tileOffset = {
            x: this.TilePixelSize.x / 2,
            y: this.TilePixelSize.y / 2
          }

          const tileLayer = this.GridMapData.MapData.Layers[layer]

          // @ts-ignore
          const tileSet: Tileset = this.GridMapTiles?.GetTileSetByName(
            tileLayer.Tileset
          )

          // only render tiles: within the viewableArea,
          // that have not been rendered and
          // are not in the last row or column
          if (
            y >= viewableArea.min.y
            && y <= viewableArea.max.y
            && x >= viewableArea.min.x
            && x <= viewableArea.max.x
            && (y <= this.GridMapData.MapData.MapDataSize.y - 1)
            && (x <= this.GridMapData.MapData.MapDataSize.x - 1)
          ) {

            // tileNotRendred
            const tileNotRendred = this.Layers[layer].RenderedTiles.map(t => t.id).indexOf(tileId) == -1

            // the tile used is based on where it is and what layer its on
            const tileData = this.GridMapData.GetTileData(x, y, layer)

            if (tileNotRendred) {

              // don't render empty space
              if (tileData.SurroundingMapData == '0000') continue

              // get the tile
              // @ts-ignore
              const tile = this.GridMapTiles.GetTile(
                tileSet,
                tileData.SurroundingMapData,
                tileLayer.Color
              )

              tile.setAttribute('t', tileId)

              // position svg with attributes
              if (tileSet?.Format == 'svg') {
                this.AddAttributesToElement(
                  tile,
                  [
                    ['x', this.TilePixelSize.x * x - tileOffset.x],
                    ['y', this.TilePixelSize.y * y - tileOffset.y],
                  ]
                )
              }

              // position img with style
              if (tileSet?.Format == 'img') {
                tile.style.left = (this.TilePixelSize.x * x - tileOffset.x).toString() + 'px'
                tile.style.top = (this.TilePixelSize.y * y - tileOffset.y).toString() + 'px'
              }

              const renderedTile = {
                id: tileId,
                x: x,
                y: y,
                ref: tile,
                value: parseInt(tileData.SurroundingMapData, 2)
              }

              this.Layers[layer].RenderedTiles.push(renderedTile)
              this.Layers[layer].SvgContainer.appendChild(tile)

            }

            // do not render other layers if the topmost is solid
            if (tileData.SurroundingMapData == '1111') layer = -1

          }

        }
      }
    }

    if (this.FirstRenderAfterLoad) {
      this.FirstRenderAfterLoad = false
      this.ReticleShow()
    }

  }


  RemoveAllTiles() {
    this.RemoveTilesOutOfViewableArea(true)
  }


  /** Remove only the updated tiles */
  RemoveUpdatedTiles() {

    // loop through layers
    for (let layer = 0; layer < this.Layers.length; layer++) {

      // array of tiles to remove
      const tilesToRemove: Array<RenderedTile> = []

      this.Layers[layer].RenderedTiles.forEach(
        (tile) => {
          // @ts-ignore
          let data = this.GridMapData.GetTileData(tile.x, tile.y, layer).SurroundingMapData
          let mapValue = parseInt(data, 2)
          if (mapValue != tile.value) {
            tilesToRemove.push(tile)
          }
        }
      )

      // nothing to remove
      if (tilesToRemove.length == 0) continue

      this.RemoveTilesByLayer(tilesToRemove, layer)
    }

  }


  /**
   * Loops through the Rendered Tiles removing Tiles out of the Viewable area
   * 
   * @param {boolean} all Remove all Tiles
   */
  RemoveTilesOutOfViewableArea(all: boolean = false) {

    const viewableArea = this.GetRenderArea()

    // loop through layers
    for (let layer = 0; layer < this.Layers.length; layer++) {

      // array of tiles to remove
      const tilesToRemove: Array<RenderedTile> = []

      this.Layers[layer].RenderedTiles.forEach(
        (tile) => {
          if (
            all
            || tile.y < viewableArea.min.y
            || tile.y > viewableArea.max.y
            || tile.x < viewableArea.min.x
            || tile.x > viewableArea.max.x
          ) {
            tilesToRemove.push(tile)
          }
        }
      )

      // nothing to remove
      if (tilesToRemove.length == 0) continue

      this.RemoveTilesByLayer(tilesToRemove, layer)

    }
  }


  /**
   * @param {Array.<RenderedTile>} tilesToRemove 
   * @param {number} layer 
   */
  RemoveTilesByLayer(tilesToRemove: Array<RenderedTile>, layer: number) {
    // loop through rendered tiles
    for (var idx = this.Layers[layer].RenderedTiles.length - 1; idx > -1; idx--) {
      var renderedTile = this.Layers[layer].RenderedTiles[idx]
      // if its on the list to remove - remove it
      if (tilesToRemove.map(t => t.id).indexOf(renderedTile.id) != -1) {
        renderedTile.ref.remove()
        this.Layers[layer].RenderedTiles.splice(idx, 1)
      }
    }
  }


}
