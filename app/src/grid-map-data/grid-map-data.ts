import GridBase from '../shared/grid-base'
import Noise from '../Noise'
import {
  GridMapTileData,
  MapData,
  MapRenderData,
  NoiseLayer,
  SurroundingMapData,
  TileData,
  TileLayer,
  XY,
} from '../types'

// markup and style
import css from './grid-map-data.css?raw'
import html from './grid-map-data.html?raw'


/**
 * Handles Map Data
 * 
 * @fires GridMapData.EventLoading
 * @fires GridMapData.EventLoaded
 * @fires GridMapData.EventLayerRemoved
 * @fires GridMapData.EventLayerAdded
 * @fires GridMapData.EventLayerTilesetUpdateSet
 * @fires GridMapData.EventLayerUpdated
 * 
 * @listens GridMapData.EventGenerateRandom
 * @listens GridMapData.EventGenerate
 */
export default class GridMapData extends GridBase {


  /** Current Map Data */
  MapData: MapRenderData | null = null

  Noise: Noise = new Noise()
  
  /** listens: Color, CanWalk udpated */
  static EventLayerUpdated = 'grid-map-data-layer-updated'
  
  /** fires: Layer Removed */
  static EventLayerRemoved = 'grid-map-data-layer-removed'
  
  /** fires: Layer Added */
  static EventLayerAdded = 'grid-map-data-layer-added'
  
  /** fires: Layer Tileset updated */
  static EventLayerTilesetUpdateSet = 'grid-map-data-layer-tileset-updated'

  /** fires: Map Loading */
  static EventLoading = 'grid-map-data-loading'
  
  /** fires: Map Loaded */
  static EventLoaded = 'grid-map-data-loaded'

  /** listens: Generate a Random Map */
  static EventGenerateRandom = 'grid-map-data-generate-random'

  /** listens: Generate a Map with parameters */
  static EventGenerate = 'grid-map-data-generate'

  Display: HTMLElement | null = null


  constructor() {
    super(css, html)
  }


  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Display = this.shadowRoot?.querySelector('.display')!

    document.addEventListener(
      GridMapData.EventGenerate,
      (customEvent: CustomEventInit<MapData>) => {
        if (customEvent.detail != undefined) this.GenerateHandler(customEvent.detail)
      }
    )

    document.addEventListener(
      GridMapData.EventGenerateRandom,
      () => { this.GenerateRandomMap() }
    )

    this.Init()

  }


  Init() {
    this.GenerateRandomMap()
  }


  SendEvent(eventName: string) {
    document.dispatchEvent(
      new Event(eventName, { bubbles: true })
    )
  }


  SetLayerColor(layerIdx: number, color: string) {

    if (!this.MapData) return

    this.MapData.Layers[layerIdx].Color = color
    this.SendEvent(GridMapData.EventLayerUpdated)
  }


  SetLayerTileSet(layerIdx: number, tileSet: string) {

    if (!this.MapData) return

    if (layerIdx < 0 || layerIdx > this.MapData.Layers.length) return

    this.MapData.Layers[layerIdx].Tileset = tileSet

    document.dispatchEvent(
      new CustomEvent(
        GridMapData.EventLayerTilesetUpdateSet,
        {
          bubbles: true,
          detail: layerIdx
        }
      )
    )
  }


  SetLayerCanWalk(layerIdx: number, canWalk: boolean) {

    if (!this.MapData) return
    if (layerIdx < 0 || layerIdx > this.MapData.Layers.length) return

    this.MapData.Layers[layerIdx].CanWalk = canWalk
    this.SendEvent(GridMapData.EventLayerUpdated)
  }


  RemoveLayer(layerIdx: number) {

    if (
      !this.MapData
      || layerIdx < 0
      || layerIdx > this.MapData.Layers.length
      || this.MapData.Layers.length == 1
    ) return

    // remove the layer
    this.MapData.Layers.splice(layerIdx, 1)
    document.dispatchEvent(
      new CustomEvent(
        GridMapData.EventLayerRemoved,
        {
          bubbles: true,
          detail: layerIdx
        }
      )
    )
  }


  AddLayer(layerIdx: number, tileLayer: TileLayer, data: number = 0) {

    if (
      !this.MapData
      || this.MapData.Layers.length == 8
    ) return

    const newLayer: TileLayer = {
      ...tileLayer,
      Map: new Array(this.MapData.MapDataSize.x * this.MapData.MapDataSize.y).fill(data)
    }
    this.MapData?.Layers.splice(layerIdx, 0, newLayer)
    document.dispatchEvent(
      new CustomEvent(
        GridMapData.EventLayerAdded,
        {
          bubbles: true,
          detail: layerIdx
        }
      )
    )
  }


  SendLoaded() {
    // using a setTimeout to give components time to listen before sending
    setTimeout(
      () => {
        document.dispatchEvent(
          new CustomEvent(
            GridMapData.EventLoaded,
            { detail: this, bubbles: true })
        )
      }
      , 0
    )
  }


  /**
   * Load Map Data
   */
  async Load(url = './maps/map-01.json') {
    try {

      this.SendEvent(GridMapData.EventLoading)

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

  LoadMapData(json: MapRenderData) {
    this.SendEvent(GridMapData.EventLoading)
    // let the event cycle
    setTimeout(
      () => {
        this.MapData = json
        this.SetWalkableStart()
        this.SendLoaded()
      },
      1
    )
  }

  /** Generate a random map */
  GenerateRandomMap() {

    const mapDataSize = {
      x: 512,
      y: 512,
    }

    const start = {
      x: 0,
      y: 0,
    }

    const noiseLayers = [
      {
        Zoom: 2,
        Seed: 0,
        Octaves: 8,
        Persistence: 0.5,
        TileLayers: [
          {
            CanWalk: true,
            Color: '#e6bd28',
            Cutoff: -0.05,
            CutoffCap: .1,
            Tileset: 'Rough-Md-Edge',
          },
          {
            CanWalk: true,
            Color: '#e9bb16',
            Cutoff: -0.02,
            CutoffCap: .1,
            Tileset: 'Sand-Md-Rough',
          },
          {
            CanWalk: true,
            Color: '#24a326',
            Cutoff: .02,
            CutoffCap: .1,
            Tileset: 'Grass-Md-Rough',
          },
          {
            CanWalk: true,
            Color: '#49722c',
            Cutoff: 0.08,
            CutoffCap: .18,
            Tileset: 'Grass-Md-Rough',
          },
          {
            CanWalk: true,
            Color: '#294c2c',
            Cutoff: 0.11,
            CutoffCap: .14,
            Tileset: 'Grass-Md-Rough',
          },
          {
            CanWalk: true,
            Color: '#72787E',
            Cutoff: .17,
            CutoffCap: 1,
            Tileset: 'Brick-Md-Smooth',
          },
          {
            CanWalk: false,
            Color: '#949494',
            Cutoff: .16,
            CutoffCap: 1,
            Tileset: 'Rock-Wall-Md-Rough',
          },
        ]
      }
    ]

    this.Generate(mapDataSize, start, noiseLayers)
  }


  GenerateHandler(mapData: MapData) {
    this.Generate(
      mapData.Size,
      mapData.Start,
      mapData.NoiseLayers,
    )
  }


  /**
   * Generate Map Data
   */
  async Generate(mapDataSize: XY, start: XY, noiseLayers: NoiseLayer[]) {

    if (noiseLayers == null) return

    this.SendEvent(GridMapData.EventLoading)

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

    this.SetWalkableStart()

    this.SendLoaded()

  }

  /** Set Start to a walkable location */
  SetWalkableStart() {

    if (!this.MapData) return

    // if start is not outside of map and walkable - use it
    if (
      !this.IsOutsideOfMap(this.MapData.Start)
      && this.GetTopMostMapData(this.MapData.Start)?.CanWalk == true
    ) return

    let maxAttempt: number = 300
    // TODO: come up with a way to pick something close to the middle if possible
    while (maxAttempt > 0) {

      // pick a rnd location
      this.MapData.Start.x = this.RandomRange(2, this.MapData.MapDataSize.x - 2)
      this.MapData.Start.y = this.RandomRange(2, this.MapData.MapDataSize.y - 2)

      // get the data for the location - if its walkable and next to anything use it
      const topMostData = this.GetTopMostMapData(this.MapData.Start)
      if (topMostData?.CanWalk == true) {
        if (this.GetTileData(this.MapData.Start.x, this.MapData.Start.y, topMostData.Layer).SurroundingMapData != '1111') {
          maxAttempt = 0
        }
      }
      maxAttempt--
    }
  }


  RandomRange(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
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


  IsOutsideOfMap(coord: XY): boolean {
    if (this.MapData == null) return true
    if (coord.x < 1 || coord.x > this.MapData.MapDataSize.x - 2) return true
    if (coord.y < 1 || coord.y > this.MapData.MapDataSize.y - 2) return true
    return false
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


  /** Gets the data needed to request the correct Tile */
  GetTileData(x: number, y: number, layer = 0): GridMapTileData {
    return {
      // @ts-ignore
      Tileset: this.MapData.Layers[layer].Tileset,
      SurroundingMapData: ''
        + this.GetMapData(x, y, layer)
        + this.GetMapData(x + 1, y, layer)
        + this.GetMapData(x, y + 1, layer)
        + this.GetMapData(x + 1, y + 1, layer) as SurroundingMapData
    }
  }


}
