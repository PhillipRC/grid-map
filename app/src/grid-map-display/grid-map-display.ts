import GridBase from '../shared/grid-base'
import GridMapData from '../grid-map-data/grid-map-data'
import GridMapTiles from '../grid-map-tiles/grid-map-tiles'
import GridMapPointer from '../grid-map-pointer/grid-map-pointer'
import PointerType from '../grid-map-pointer/PointerType'

import {
  XY,
  XYMinMax,
  TileData,
  RenderedTile,
  GridMapDisplayLayer,
} from '../types'

// markup and style
import css from './grid-map-display.css?raw'
import html from './grid-map-display.html?raw'


/**
 * Handles displaying GridMapData.
 * 
 * A SVGElement is created for each GridMapData Layers (`GridMapData.Layers`).
 * Tiles are added and removed as they enter and leave the Render Area.
 */
export default class GridMapDisplay extends GridBase {

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
   * 
   * @type {TileData}
   */
  SelectedLocationData: TileData = {
    Layer: -1,
    Tileset: null,
    CanWalk: false,
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

  #State: string = 'normal'

  set State(value) {
    if (!(value == 'normal' || value == 'edit')) return
    this.#State = value
    if (value == 'normal') this.SetStateNormal()
    if (value == 'edit') this.SetStateEdit()
  }

  get State() {
    return this.#State
  }


  constructor() {
    super(css, html)
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    // allow display to capture focus
    this.setAttribute('tabindex', '1')

    // #region set display element references
    
    this.Container = this.shadowRoot?.querySelector('.container')!
    this.ScaleContainer = this.shadowRoot?.querySelector('.scale-container')!
    this.Reticle = this.shadowRoot?.querySelector('.reticle')!
    this.LayersStyle = this.shadowRoot?.querySelector('#layer-styles')
    this.EditToolsPanel = this.shadowRoot?.querySelector('.edit-tools-panel')!
    this.Debug = this.shadowRoot?.querySelector('.debug')!
    this.Pointer = this.shadowRoot?.querySelector('.layer-pointer')

    // #endregion

    // #region Mouse Listeners

    this.addEventListener(
      'mousemove',
      (event) => { this.HandlePointerMouseMove(event) }
    )

    this.addEventListener(
      'click',
      (event) => { this.HandlePointerMouseUp(event) }
    )

    this.addEventListener(
      'mouseover',
      () => { this.HandlePointerMouseIn() }
    )

    this.addEventListener(
      'mouseout',
      () => { this.HandlePointerMouseOut() }
    )

    this.addEventListener(
      'mousedown',
      (event) => { this.HandleMouseDown(event) }
    )

    this.addEventListener(
      'wheel',
      (event) => { this.HandleWheel(event) }
    )

    // #endregion

    /**
     * Keyboard Event Listeners
     */

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
      'grid-map-set-edit-state-normal',
      () => { this.State = 'normal' }
    )

    document.addEventListener(
      'grid-map-set-edit-state-edit',
      () => { this.State = 'edit' }
    )

    document.addEventListener(
      'grid-map-data-loading',
      () => { this.HandleGridMapLoading() }
    )

    // @ts-ignore
    document.addEventListener(
      'grid-map-data-loaded',
      (/**@type {CustomEvent} */ customEvent: CustomEvent) => { this.HandleGridMapLoaded(customEvent.detail) }
    )

    // @ts-ignore
    document.addEventListener(
      'grid-map-cursor-move',
      (/**@type {CustomEvent} */ customEvent: CustomEvent) => { this.CursorMoveBy(customEvent.detail) }
    )

    document.addEventListener(
      'grid-map-display-clear',
      () => { this.Clear() }
    )

    // @ts-ignore
    document.addEventListener(
      'grid-map-tiles-loaded',
      (event: CustomEvent) => { this.HandleTilesLoaded(event.detail) }
    )

    // @ts-ignore
    document.addEventListener(
      'tile-set-selected',
      (event: CustomEvent) => { this.HandleTileSetSelected(event.detail) }
    )

    document.addEventListener(
      'grid-map-data-updated',
      () => {
        this.RemoveAllTiles()
        this.SetLayerStyles()
        this.Render()
      }
    )

    document.addEventListener(
      'grid-map-display-select-tile',
      () => {
        this.SetPointer(PointerType.Select)
      }
    )

    document.addEventListener(
      'grid-map-display-remove-tile',
      () => {
        this.SetPointer(PointerType.Remove)
      }
    )

    document.addEventListener(
      'grid-map-display-add-tile',
      () => {
        this.SetPointer(PointerType.Add)
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

    // create a Display Layer for each Map Layer
    this.GridMapData.MapData.Layers.forEach(
      (_layer, layerIdx) => {
        const svgContainer = this.CreateSvgTag(
          'svg',
          [
            ['width', this.GridPixelSize.x],
            ['height', this.GridPixelSize.y],
          ]
        )
        svgContainer.id = `layer-${layerIdx}`
        svgContainer.style.zIndex = ((layerIdx + 1) * 100).toString()
        this.Layers.push(
          {
            SvgContainer: svgContainer,
            RenderedTiles: []
          }
        )
        this.ScaleContainer?.appendChild(svgContainer)
      }
    )

    this.SetLayerStyles()
    this.HandleResize()

  }

  /**
   * Set the Styles for each layer
   */
  SetLayerStyles() {

    if (!this.GridMapData || !this.GridMapData.MapData) return

    this.ClearLayerStyles()

    this.GridMapData.MapData.Layers.forEach(
      (layer, layerIdx) => {
        // add styles to apply the select color
        const styles = []
        // base color
        styles.push(`#layer-${layerIdx} .fills {fill: ${layer.Color};}`)
        // color variant 1
        styles.push(`#layer-${layerIdx} .fills-1 {fill: ${this.ColorRgbLevel(layer.Color, -10)};}`)
        // color variant 2
        styles.push(`#layer-${layerIdx} .fills-2 {fill: ${this.ColorRgbLevel(layer.Color, -20)};}`)
        // 50% opacity
        styles.push(`#layer-${layerIdx} .fills-o {fill: ${layer.Color};fill-opacity: .5;}`)
        styles.forEach(
          (style) => {
            this.LayersStyle?.appendChild(
              document.createTextNode(style)
            )
          }
        )
      }
    )
  }


  SetStateNormal() {
    this.EditToolsPanel?.setAttribute('hidden', 'true')
    this.Container?.classList.remove('edit')
    this.SetPointer(PointerType.None)
    this.ReticleShow()
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


  SetStateEdit() {
    this.EditToolsPanel?.removeAttribute('hidden')
    this.Container?.classList.add('edit')
    this.SetPointer(PointerType.Select)
    this.ReticleHide()
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


  /**
   * @param {GridMapTiles} event 
   */
  HandleTilesLoaded(event: GridMapTiles) {
    this.GridMapTiles = event
    this.Init()
  }


  GetMapCoordFromMouseEvent(event: MouseEvent): XY {
    return {
      x: Math.ceil(((event.offsetX * (1 / this.DisplayScale)) - this.GridCenterOffset.x) / this.TilePixelSize.x),
      y: Math.ceil(((event.offsetY * (1 / this.DisplayScale)) - this.GridCenterOffset.y) / this.TilePixelSize.y)
    }
  }

  
  // #region Mouse Handlers

  HandleWheel(event:WheelEvent) {

    this.CursorMoveBy(
      {
        x: 0,
        y: (event.deltaY > 1 ? 1 : -1)
      },
      this.State == 'edit' ? true : false
    )

  }


  HandleMouseDown(event: MouseEvent) {

    const coord = this.GetMapCoordFromMouseEvent(event)

    // in normal state move
    if (this.State == 'normal') {
      this.CursorMove(coord, false)
      return
    }

    if (this.State == 'edit') {
      const SelectedLocationData = this.GridMapData?.GetTopMostMapData(coord)
      this.UpdateMapDataAtPointerLocation(SelectedLocationData)
    }

  }


  HandlePointerMouseUp(event: MouseEvent) {
    const coord = this.GetMapCoordFromMouseEvent(event)
    const mapData = this.GridMapData?.GetTopMostMapData(coord)
    this.SelectedLocation = coord
    if (mapData) this.SelectedLocationData = mapData
    this.RenderDebug()
  }


  /**
   * Translate the current mouse pointer location into Map Coordinates
   */
  HandlePointerMouseMove(event: MouseEvent) {

    if (!this.GridMapData) return

    const coord = this.GetMapCoordFromMouseEvent(event)

    // if the coords changed
    if (this.PointerLocation.x != coord.x || this.PointerLocation.y != coord.y) {

      this.PointerLocation = coord
      this.PointerLocationData = this.GridMapData?.GetTopMostMapData(coord)
      this.RenderDebug()
      this.PositionPointer()

      // when in edit state and the primary button is down - update map data
      if (this.State == 'edit' && event.buttons == 1) {
        this.UpdateMapDataAtPointerLocation(null)
      }

      // when in edit state and button is released - forget the tile data
      if (this.State == 'edit' && event.buttons == 0) {
        this.SavedTileData = null
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


  HandlePointerMouseIn() {
    this.Pointer?.removeAttribute('hidden')
  }


  HandlePointerMouseOut() {
    this.Pointer?.setAttribute('hidden', 'true')
  }

  // #endregion

  // #region KB Handlers

  HandleKeyboardDown(event: KeyboardEvent) {
    
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

    // grid-map-data-generate-random
    if (event.key == 'g') {
      document.dispatchEvent(
        new Event(
          'grid-map-data-generate-random', { bubbles: true }
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
   * Adjust the level of the color
   * 
   * @param {string} rgb #112233
   * @param {number} percent -100 to 100
   * @returns {string}
   */
  ColorRgbLevel(rgb: string, percent: number): string {

    // adjust each channel by percent
    let R = Math.floor(parseInt(rgb.substring(1, 3), 16) * (100 + percent) / 100)
    let G = Math.floor(parseInt(rgb.substring(3, 5), 16) * (100 + percent) / 100)
    let B = Math.floor(parseInt(rgb.substring(5, 7), 16) * (100 + percent) / 100)

    // cap each channel
    R = Math.round((R < 255) ? R : 255)
    G = Math.round((G < 255) ? G : 255)
    B = Math.round((B < 255) ? B : 255)

    return '#'
      + ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16))
      + ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16))
      + ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16))
  }


  /**
   * Clear the display
   */
  Clear() {

    // clear each layer
    this.Layers.forEach(
      (layer) => {
        layer.SvgContainer?.remove()
        layer.RenderedTiles = []
      }
    )
    this.Layers = []

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

  /**
   * @param {number} pointer
   */
  SetPointer(pointer: number) {
    if (this.GridMapData) {
      this.Pointer?.setAttribute('data-pointer', PointerType.GetName(pointer))
    } else {
      this.Pointer?.setAttribute('data-pointer', PointerType.GetName(0))
    }
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

    this.SelectedLocationData = SelectedLocationData
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

    // if tileData is provided save it - this is the data used to update the map location while the use clicks and drags
    if (tileData) this.SavedTileData = tileData

    // TODO be nice to be able to select the -1 layer and set all layers to 0

    switch (this.Pointer?.PointerType) {

      case (PointerType.Select):
        document.dispatchEvent(
          new CustomEvent(
            'grid-map-display-select-layer',
            { bubbles: true, detail: tileData }
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

    this.RemoveAllTiles()
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
    // prevent odd numbers to keep graphics aligned
    scale = GridMapDisplay.EvenDecimal(scale)

    this.DisplayScale = scale
    if (this.ScaleContainer) this.ScaleContainer.style.zoom = scale.toString()
  }

  
  /**
   * i.e. 10.03 > 10, 10.19999 > 10.2, etc.
   */
  static EvenDecimal(value: number): number {
    return (
      Math.round(
        Math.floor(value * 10) / 2
      ) * 2
    ) / 10
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
   * Update the MaxRenderAreaSize based on size of viewport
   */
  UpdateMaxRenderAreaSize() {
    // TODO do this to reduce cpu useage
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

            if(tileNotRendred) {

              // don't render empty space
              if (tileData.SurroundingMapData == '0000') continue

              // get the tile
              const tile = this.GridMapTiles.GetTile(tileData.Tileset, tileData.SurroundingMapData)

              // position tile
              this.AddAttributesToElement(
                tile,
                [
                  ['x', this.TilePixelSize.x * x - tileOffset.x],
                  ['y', this.TilePixelSize.y * y - tileOffset.y],
                  ['t', tileId]
                ]
              )

              const renderedTile = {
                id: tileId,
                x: x,
                y: y,
                ref: tile
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

  /**
   * Loops through the Rendered Tiles removing Tiles out of the Viewable area
   * 
   * @param {boolean} all Remove all Tiles
   */
  RemoveTilesOutOfViewableArea(all: boolean = false) {

    const viewableArea = this.GetRenderArea()

    // loop through layers
    for (let layer = 0; layer < this.Layers.length; layer++) {

      /**
       * Create an array of tiles to remove
       * @type {Array.<RenderedTile>}
       */
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
