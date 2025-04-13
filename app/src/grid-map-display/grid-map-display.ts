import GridBase from '../shared/grid-base.js'
import GridMapData from '../grid-map-data/grid-map-data.js'
import GridMapTiles from '../grid-map-tiles/grid-map-tiles.js'
import GridMapPointer from '../grid-map-pointer/grid-map-pointer.js'
import PointerType from '../grid-map-pointer/PointerType.js'

import {
  XY,
  XYMinMax,
  TileData,
  RenderedTile,
  GridMapDisplayLayer,
} from '../types'

// markup and style
import css from './grid-map-display.css?inline'
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
   * 
   * @type {XY} Units: Pixels
   */
  TileSize: XY = {
    x: 64,
    y: 64
  }

  /**
   * The pixel size of the entire Grid/Map
   * 
   * @type {XY} Units: Map Coordinates
   */
  GridSize: XY = {
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


  /**
   * Tile Data under the Pointer
   * 
   * @type {TileData|null}
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

  Container: HTMLElement | null | undefined = null

  Layers: Array<GridMapDisplayLayer> = []

  LayersStyle: HTMLStyleElement | null | undefined = null

  /** avatar img */
  Reticle: HTMLElement | null | undefined = null

  EditToolsPanel: HTMLElement | null | undefined

  Debug: HTMLElement | null | undefined = null

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

    // set references to display elements
    this.Container = this.shadowRoot?.querySelector('.container')
    this.Reticle = this.shadowRoot?.querySelector('.reticle')
    this.LayersStyle = this.shadowRoot?.querySelector('#layer-styles')
    this.EditToolsPanel = this.shadowRoot?.querySelector('.edit-tools-panel')
    this.Debug = this.shadowRoot?.querySelector('.debug')
    this.Pointer = this.shadowRoot?.querySelector('.layer-pointer')

    /**
     * Mouse Event Listeners
     */

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

    /**
     * Custom Event Listeners
     */

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
        this.UpdateDisplay()
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

    // handle resize
    new ResizeObserver(() => { this.HandleResize() }).observe(this)

    this.SetStateNormal()

  }


  async Init() {

    // don't bother doing anything until a map and tiles are loaded
    if (this.GridMapData == null || this.GridMapData.MapData == null || this.GridMapTiles == null) return

    // set the starting location
    // TODO pick a starting location if one is not defined
    this.CenterLocation.x = this.GridMapData.MapData.Start.x
    this.CenterLocation.y = this.GridMapData.MapData.Start.y

    this.SetGridSize()

    // create a Display Layer for each Map Layer
    this.GridMapData.MapData.Layers.forEach(
      (_layer, layerIdx) => {
        const svgContainer = this.CreateSvgTag(
          'svg',
          [
            ['width', this.GridSize.x],
            ['height', this.GridSize.y],
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
        this.Container?.appendChild(svgContainer)
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


  /**
   * @param {MouseEvent} event 
   * @returns {XY} Units: Map Coordinates
   */
  GetMapCoordFromMouseEvent(event: MouseEvent): XY {
    return {
      x: Math.ceil((event.offsetX - this.GridCenterOffset.x) / this.TileSize.x),
      y: Math.ceil((event.offsetY - this.GridCenterOffset.y) / this.TileSize.y)
    }
  }


  /**
   * @param {MouseEvent} event 
   */
  HandleMouseDown(event: MouseEvent) {

    const coord = {
      x: Math.ceil((event.offsetX - this.GridCenterOffset.x) / this.TileSize.x),
      y: Math.ceil((event.offsetY - this.GridCenterOffset.y) / this.TileSize.y)
    }

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


  /**
   * @param {MouseEvent} event 
   */
  HandlePointerMouseUp(event: MouseEvent) {
    const coord = this.GetMapCoordFromMouseEvent(event)
    const mapData = this.GridMapData?.GetTopMostMapData(coord)
    this.SelectedLocation = coord
    if (mapData) this.SelectedLocationData = mapData
    this.RenderDebug()
  }


  /**
   * Translate the current mouse pointer location into Map Coordinates
   * 
   * @param {MouseEvent} event 
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


  PositionPointer() {
    if (!this.Pointer) return
    this.Pointer.style.top = `${(this.PointerLocation.y - 1) * this.TileSize.y + this.GridCenterOffset.y}px`
    this.Pointer.style.left = `${(this.PointerLocation.x - 1) * this.TileSize.x + this.GridCenterOffset.x}px`
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
    this.GridSize = {
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

    if (this.State == 'normal') {
      // bomb out if the requests move is outside the map
      if (this.GridMapData == null || this.IsOutsideOfMap(coord)) return

      const SelectedLocationData = this.GridMapData.GetTopMostMapData(coord)
      if (SelectedLocationData == null) return

      if (anywhere == false) {
        // bomb out if it is not walkable
        if (SelectedLocationData.CanWalk == false) return
      }

      this.SelectedLocationData = SelectedLocationData
      this.CenterLocation = coord
      this.CenterOnMapCursor()

      return
    }

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

  /**
   * @param {XY} coord 
   * @returns {boolean}
   */
  IsOutsideOfMap(coord: XY): boolean {
    if (this.GridMapData == null || this.GridMapData.MapData == null) return true
    if (coord.x < 1 || coord.x > this.GridMapData.MapData.MapDataSize.x - 2) return true
    if (coord.y < 1 || coord.y > this.GridMapData.MapData.MapDataSize.y - 2) return true
    return false
  }


  /**
   * @param {TileData|null|undefined} tileData 
   */
  UpdateMapDataAtPointerLocation(tileData: TileData | null | undefined) {

    // if tileData is provided save it - this is the data used to update the map location while the use clicks and drags
    if (tileData) this.SavedTileData = tileData

    // TODO be nice to be able to select the -1 layer and set all layers to 0

    switch (this.Pointer?.PointerType) {

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
    this.UpdateDisplay()

  }


  /**
   * Handle when the display container changes size
   */
  HandleResize() {
    this.ViewRect = this.getBoundingClientRect()
    this.ViewCenter = {
      x: (this.ViewRect.width / 2),
      y: (this.ViewRect.height / 2),
    }

    this.CenterOnMapCursor()
    this.PositionPointer()
  }


  /**
   * Calculate the Grid/Map Size in pixels
   */
  SetGridSize() {

    if (this.GridMapData == null || this.GridMapData.MapData == null) return

    // Size of Map * Size of Tiles - the size of 2 tiles - we are not rendering the edge tiles
    this.GridSize.x = this.GridMapData.MapData.MapDataSize.x * this.TileSize.x - (this.TileSize.x * 2)
    this.GridSize.y = this.GridMapData.MapData.MapDataSize.y * this.TileSize.y - (this.TileSize.y * 2)
  }

  /**
   * Center the center display
   */
  CenterRecticle() {

    // bomb out if objects are not set
    if (this.ViewCenter.x == null || this.ViewCenter.y == null || this.Reticle == null) return

    this.Reticle.style.top = `${this.ViewCenter.y - (this.TileSize.y / 2)}px`
    this.Reticle.style.left = `${this.ViewCenter.x - (this.TileSize.x / 2)}px`

    this.Reticle.style.height = `${this.TileSize.y}px`
    this.Reticle.style.width = `${this.TileSize.x}px`
  }

  /**
   * Move Layers[] to center on MapCursor
   */
  CenterOnMapCursor() {

    // bomb out if things are not setup
    if (this.GridMapData == null || this.GridMapTiles == null) return

    this.CenterRecticle()

    const tileCenter = {
      x: this.CenterLocation.x * this.TileSize.x,
      y: this.CenterLocation.y * this.TileSize.y
    }

    this.GridCenterOffset = {
      x: this.ViewCenter.x - tileCenter.x + (this.TileSize.x / 2),
      y: this.GridCenterOffset.y = this.ViewCenter.y - tileCenter.y + (this.TileSize.y / 2)
    }

    if (this.GridCenterOffset.x != null && this.GridCenterOffset.y != null) {
      // position each layer
      this.Layers.forEach(
        (layer) => {
          layer.SvgContainer.style.marginLeft = this.GridCenterOffset.x.toString()
          layer.SvgContainer.style.marginTop = this.GridCenterOffset.y.toString()
        }
      )
    }

    this.UpdateDisplay()
  }

  /**
   * Returns the area of the Map to Render
   * @returns {XYMinMax}
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
  UpdateDisplay() {
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
          const tileNotRendred = this.Layers[layer].RenderedTiles.map(t => t.id).indexOf(tileId) == -1

          // tiles are offset from the main grid by half
          const tileOffset = {
            x: this.TileSize.x / 2,
            y: this.TileSize.y / 2
          }

          // only render tiles: within the viewableArea,
          // that have not been rendered and
          // are not in the last row or column
          if (
            tileNotRendred
            && y >= viewableArea.min.y
            && y <= viewableArea.max.y
            && x >= viewableArea.min.x
            && x <= viewableArea.max.x
            && (y <= this.GridMapData.MapData.MapDataSize.y - 1)
            && (x <= this.GridMapData.MapData.MapDataSize.x - 1)
          ) {

            // the tile used is based on where it is and what layer its on
            const tileData = this.GridMapData.GetTileData(x, y, layer)

            // don't render empty space
            if (tileData.SurroundingMapData == '0000') continue

            // get the tile
            const tile = this.GridMapTiles.GetTile(tileData.Tileset, tileData.SurroundingMapData)

            // position tile
            this.AddAttributesToElement(
              tile,
              [
                ['x', this.TileSize.x * x - tileOffset.x],
                ['y', this.TileSize.y * y - tileOffset.y],
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
