import GridBase from '../shared/grid-base.js'
import Noise from '../Noise.js'
import {
  XY,
  NoiseLayer,
  MapRenderData,
  TileLayer,
  TileData,
  GridMapTileData
} from '../types'

// markup and style
import css from './grid-map-data.css?inline'
import html from './grid-map-data.html?raw'


/**
 * Handles Map Data
 */
export default class GridMapData extends GridBase {


  /** Current Map Data */
  MapData: MapRenderData | null = null

  Noise: Noise = new Noise()

  // TODO make a object with all the valid event names
  // figure out how to handle customevent vs normal, make all cusom?
  #EventGridMapUpdated = 'grid-map-data-updated'
  #EventGridMapDataLoading = 'grid-map-data-loading'

  Display: HTMLElement | null = null


  constructor() {
    super(css, html)
  }


  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    document.addEventListener(
      'grid-map-data-generate',
      (event) => {
        this.Generate(
          // @ts-ignore
          event.detail?.Size,
          // @ts-ignore
          event.detail?.Start,
          // @ts-ignore
          event.detail?.NoiseLayers,
        )
      },
      false
    )

    this.Display = this.shadowRoot?.querySelector('.display')!

    this.Init()

    // prevent keypresses from going outside
    this.shadowRoot?.addEventListener(
      'keyup',
      (event) => {
        event.stopPropagation()
      }
    )

  }


  Init() {
    this.Load()
  }


  SendEvent(eventName: string) {
    document.dispatchEvent(
      new Event(eventName, { bubbles: true })
    )
  }


  SetLayerColor(layerIdx: number, color: string) {

    if (!this.MapData) return

    this.MapData.Layers[layerIdx].Color = color
    this.SendEvent(this.#EventGridMapUpdated)
  }


  SetLayerTileSet(layerIdx: number, tileSet: string) {

    if (!this.MapData) return

    if (layerIdx < 0 || layerIdx > this.MapData.Layers.length) return

    this.MapData.Layers[layerIdx].Tileset = tileSet
    this.SendEvent(this.#EventGridMapUpdated)
  }


  SetLayerCanWalk(layerIdx: number, canWalk: boolean) {

    if (!this.MapData) return
    if (layerIdx < 0 || layerIdx > this.MapData.Layers.length) return

    this.MapData.Layers[layerIdx].CanWalk = canWalk
    this.SendEvent(this.#EventGridMapUpdated)
  }

  SendLoaded() {
    document.dispatchEvent(
      new CustomEvent(
        'grid-map-data-loaded',
        {
          bubbles: true,
          detail: this,
        }
      )
    )
  }


  /**
   * Load Map Data
   */
  async Load(url = './maps/map-01.json') {
    try {

      this.SendEvent(this.#EventGridMapDataLoading)

      this.MapData = null

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }

      const json = await response.json()

      this.MapData = json

      this.SendLoaded()

    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(error.message)
      } else if (error instanceof Error) {
        console.error(error.message)
      } else {
        console.error(error)
      }
    }
  }


  /**
   * Generate Map Data
   */
  async Generate(mapDataSize: XY, start: XY, noiseLayers: NoiseLayer[]) {

    if (noiseLayers == null) return

    this.SendEvent(this.#EventGridMapDataLoading)

    const tileLayers: Array<TileLayer> = []

    const layers: Array<Array<number>> = []

    noiseLayers.forEach(
      (noiseLayer) => {
        noiseLayer.TileLayers.forEach(
          (tileLayer) => {

            tileLayers.push(tileLayer)

            layers.push(
              new Array(mapDataSize.x * mapDataSize.y).fill(0)
            )
          }
        )
      }
    )

    noiseLayers.forEach(
      (noiseLayer) => {

        // seed is 0 pick a rnd number
        this.Noise.seed(
          noiseLayer.Seed == 0
            ? Math.random()
            : noiseLayer.Seed
        )


        for (var x = 0; x < mapDataSize.x; x++) {
          for (var y = 0; y < mapDataSize.y; y++) {

            var value = this.Noise.Perlin2DWithOctaves(
              x / mapDataSize.x * noiseLayer.Zoom,
              y / mapDataSize.y * noiseLayer.Zoom,
              noiseLayer.Octaves,
              noiseLayer.Persistence
            )

            tileLayers.forEach(
              (tileLayer, tileSetIdx) => {
                // TODO make this more readable
                const cutOff = (tileLayer?.Cutoff != undefined ? tileLayer.Cutoff : -1)
                const cutOffCap = (tileLayer.CutoffCap != undefined ? tileLayer.CutoffCap : 1)
                if (value > cutOff && value <= cutOffCap) {
                  layers[tileSetIdx][x + (y * mapDataSize.x)] = 1
                }
              }
            )

          }
        }

      }
    )

    // create Map object
    this.MapData = {
      Layers: [],
      MapDataSize: mapDataSize,
      Start: start
    }

    tileLayers.forEach(
      (tileLayer, tileSetIdx) => {
        this.MapData?.Layers.push(
          {
            Map: layers[tileSetIdx],
            Tileset: tileLayer.Tileset,
            CanWalk: tileLayer.CanWalk,
            Color: tileLayer.Color,
          }
        )
      }
    )

    this.SendLoaded()

  }


  /**
   * Get map data
   * @param {number} x 
   * @param {number} y 
   * @param {number} layer 
   */
  GetMapData(x: number, y: number, layer: number = 0) {
    // @ts-ignore
    return this.MapData.Layers[layer].Map[x + y * this.MapData.MapDataSize.x]
  }


  /**
   * Get top most map data
   * 
   * @param {XY|null} coord 
   * @returns {TileData|null}
   */
  GetTopMostMapData(coord: XY | null = null): TileData | null {

    if (!this.MapData) return null

    // if null using map start coords
    if (coord == null) {
      coord = {
        x: this.MapData.Start.x,
        y: this.MapData.Start.y
      }
    }
    // go from top to bottom looking for a non-zero
    for (let layerIdx = this.MapData.Layers.length - 1; layerIdx > -1; layerIdx--) {
      if (this.GetMapData(coord.x, coord.y, layerIdx) == 1) {
        return {
          Layer: layerIdx,
          Tileset: this.MapData.Layers[layerIdx].Tileset,
          CanWalk: this.MapData.Layers[layerIdx].CanWalk,
        }
      }
    }

    // no data defined
    return {
      Layer: -1,
      Tileset: null,
      CanWalk: false,
    }
  }


  SetMapData(x: number, y: number, layer = 0, value: number) {

    if (layer != -1) {
      // @ts-ignore
      this.MapData.Layers[layer].Map[x + y * this.MapData.MapDataSize.x] = value
      return
    }

    // -1 set all layers
    // @ts-ignore
    this.MapData.Layers.forEach(
      (layer) => {
        // @ts-ignore
        layer.Map[x + y * this.MapData.MapDataSize.x] = value
      }
    )

  }


  /**
   * Gets the data needed to request the correct Tile
   * 
   * @returns {GridMapTileData}
   */
  GetTileData(x: number, y: number, layer = 0): GridMapTileData {
    return {
      // @ts-ignore
      Tileset: this.MapData.Layers[layer].Tileset,
      SurroundingMapData: ''
        + this.GetMapData(x, y, layer)
        + this.GetMapData(x + 1, y, layer)
        + this.GetMapData(x, y + 1, layer)
        + this.GetMapData(x + 1, y + 1, layer)
    }
  }


}
