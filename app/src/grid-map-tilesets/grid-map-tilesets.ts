import Color from '../Color'

import {
  HSLA,
  SurroundingMapData,
  Tileset,
  XY,
} from '../types'


/**
 * Manages Tile data, no UI
 * 
 * @fires GridMapTiles.EventLoaded
 */
class GridMapTilesets extends HTMLElement {

  /** fires: Tiles are loaded */
  static EventLoaded = 'grid-map-tiles-loaded'

  /** fires: Indicates a tileset that could not be loaded */
  static EventTilesetLoadError = 'grid-map-tiles-tileset-load-error'

  static DefaultRegistry = './tiles/tile-registry.json'

  ErrorImg: HTMLImageElement = new Image()

  TilesetRegistry: any

  /**
   * Track if connectedCallback() has been called
   */
  ConnectedCallback: boolean = false

  /** Available Tile Sets */
  TileSets: Array<Tileset> = [
    {
      Name: 'Smooth-Md-Edge',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Rough-Md-Edge',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Sand-Md-Rough',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Grass-Md-Rough',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Brick-Md-Smooth',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Brick-Wall-Md-Smooth',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Block-Wall-Md-Smooth',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Rock-Wall-Md-Rough',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Rock-Wall-Md-Rough',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Rock-Lg-Rough',
      Format: 'img',
      Ext: 'png',
      TilesTall: 4,
      TilesWide: 4,
      ApplyColor: true,
      AutoTerrain: 'dualgrid',
      IsLoaded: false,
    },
    {
      Name: 'Four-Seasons',
      Format: 'img',
      Ext: 'png',
      TilesTall: 16,
      TilesWide: 11,
      ApplyColor: false,
      AutoTerrain: null,
      IsLoaded: false,
      Credit: {
        Name: 'Kevins Moms House',
        Url: 'https://kevins-moms-house.itch.io/',
      }
    },
    {
      Name: 'Dungeon-Set',
      Format: 'img',
      Ext: 'png',
      TilesTall: 15,
      TilesWide: 13,
      ApplyColor: false,
      AutoTerrain: null,
      IsLoaded: false,
      Margin: {
        Left: 16,
        Right: 16,
        Top: 16,
        Bottom: 32
      },
      Credit: {
        Name: 'Incol Games',
        Url: 'https://incolgames.itch.io/'
      }
    },
  ]

  /** Holds the element that represents the graphic for each tile */
  Tiles: { [key: string]: (SVGSVGElement | HTMLImageElement)[] } = {}

  TileSize: XY = {
    x: 64,
    y: 64,
  }

  /**
   * Represents the name and mapping for each Tile
   * 
   * @example
   * Position 1: Top-Left
   * Position 2: Top-Right
   * Position 3: Bottom-Left
   * Position 4: Bottom-Right
   *
   * 0010 Fills the Bottom-Left of the Tile
   * 0101 Fill the Top-Right and Bottom-Right of the Tile
   */
  TileIndex: Array<SurroundingMapData> = [
    '0010', '0101', '1011', '0011',
    '1001', '0111', '1111', '1110',
    '0100', '1100', '1101', '1010',
    '0000', '0001', '0110', '1000'
  ]

  Header: HTMLElement | null = null

  Content: HTMLElement | null = null

  IsLoaded: boolean = false


  constructor() {
    super()
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.LoadTiles()
  }

  async LoadRegistry() {

    const url = GridMapTilesets.DefaultRegistry
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }

      this.TilesetRegistry = await response.json()

    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(error.message)
      } else if (error instanceof Error) {
        console.error(error.message)
      } else {
        console.error(error)
      }
    }

    if (this.TilesetRegistry != null) this.LoadTiles()

  }


  GetTileSetByName(name: string) {

    if (!Array.isArray(this.TileSets) || this.TileSets.length == 0) return

    return this.TileSets.filter(
      (x) => {
        if (x.Name == name) return x
      }
    )[0]
  }

  async LoadTiles() {
    for (const [_idx, tileSet] of this.TileSets.entries()) {
      tileSet.IsLoaded = await this.LoadTileSet(tileSet)
    }

    this.IsLoaded = true

    // let eveyone know we are loaded up
    document.dispatchEvent(
      new CustomEvent(
        GridMapTilesets.EventLoaded,
        {
          bubbles: true,
          detail: this,
        }
      )
    )
  }


  async LoadTileSet(tileSet: Tileset): Promise<boolean> {

    // init tiles
    this.Tiles[tileSet.Name] = []

    try {
      if (tileSet.Format == 'svg' || tileSet.TilesWide == 1) {
        await this.LoadTilesIndividually(tileSet)
      } else {
        await this.LoadTilesFromSheet(tileSet)
      }
      return true
    } catch {
      delete this.Tiles[tileSet.Name]
      document.dispatchEvent(
        new CustomEvent(
          GridMapTilesets.EventTilesetLoadError,
          {
            bubbles: true,
            detail: tileSet,
          }
        )
      )

      return false
    }

  }

  /** Loads tiles from individual files, i.e. 1100.png */
  async LoadTilesIndividually(tileSet: Tileset) {

    for (const [_idx, tile] of this.TileIndex.entries()) {

      const url = `tiles/${tileSet.Name}/${tile}.${tileSet.Ext}`
      const response = await fetch(url)

      if (tileSet.Format == 'svg') {
        const svg = await response.text()
        var svgContainer = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        )
        svgContainer.innerHTML = svg
        this.Tiles[tileSet.Name].push(svgContainer)
      }

      if (tileSet.Format == 'img') {
        const blob = await response.blob()
        this.SaveBlobAsImgIntoTiles(tileSet.Name, blob)
      }

    }

  }

  /** Loads tiles from a single and cuts up the file */
  async LoadTilesFromSheet(tileSet: Tileset) {

    // load sheet
    const url = `tiles/${tileSet.Name}.${tileSet.Ext}`
    const response = await fetch(url)
    const sheet: Blob = await response.blob()

    // calc scale to fit  result into 64x64 tiles
    const sheetBmp = await createImageBitmap(sheet)

    // handle Margins if set
    const marginX = (tileSet.Margin?.Left && tileSet.Margin?.Right ? (tileSet.Margin.Left + tileSet.Margin.Right) : 0)
    const marginY = (tileSet.Margin?.Top && tileSet.Margin?.Bottom ? (tileSet.Margin.Top + tileSet.Margin.Bottom) : 0)
    const scaleX = Math.floor((sheetBmp.width - marginX) / tileSet.TilesWide)
    const scaleY = Math.floor((sheetBmp.height - marginY) / tileSet.TilesTall)

    sheetBmp.close()

    // temp canvas to hold the result
    const canvas = new OffscreenCanvas(64, 64)!

    for (var y = 0; y < tileSet.TilesTall; y++) {
      const marginTop = (tileSet.Margin?.Top ? tileSet.Margin.Top : 0)

      for (var x = 0; x < tileSet.TilesWide; x++) {
        const marginLeft = (tileSet.Margin?.Left ? tileSet.Margin.Left : 0)

        // cut up the sheet blob
        var tileBmp = await createImageBitmap(
          sheet,
          marginLeft + (x * scaleX),  // start x
          marginTop + (y * scaleY),  // start y
          scaleX,      // width
          scaleY,      // height
          {
            resizeWidth: 64,
            resizeHeight: 64,
            // TODO pixelated if growing - high if shrinking
            resizeQuality: 'pixelated',
          }
        )
        // create a 64x64 blob
        canvas.getContext('bitmaprenderer')?.transferFromImageBitmap(tileBmp)
        const blob = await canvas.convertToBlob({ type: 'image/png' })
        // save the blob as an image
        await this.SaveBlobAsImgIntoTiles(tileSet.Name, blob)
        tileBmp.close()
      }
    }


  }


  async SaveBlobAsImgIntoTiles(name: string, blob: Blob) {
    return new Promise(
      (resolve, reject) => {
        const imageURL = URL.createObjectURL(blob)
        const image = new Image()
        image.onload = () => resolve(imageURL)
        image.onerror = reject
        image.src = imageURL
        this.Tiles[name].push(image)
      }
    )
  }


  /** Generate Tile with color correction as needed */
  async LoadColorizedTiles(tileSet: Tileset, color: string) {

    // only load if img type and not previously loaded
    if (
      tileSet == undefined
      || this.Tiles[tileSet.Name] == undefined
      || tileSet.Format != 'img'
      || !tileSet.ApplyColor
      || this.Tiles[tileSet.Name + color] != undefined
    ) return

    const startTime = window.performance.now()

    const colorObj = Color.ColorFromHex(color)

    // init storage location
    this.Tiles[tileSet.Name + color] = []

    // loop over original tiles
    const tiles = this.Tiles[tileSet.Name] as HTMLImageElement[]
    for (var tileIdx = 0; tileIdx < tiles.length; tileIdx++) {

      // canvas to hold output
      const canvas = new OffscreenCanvas(64, 64)!
      const context = canvas.getContext('2d')

      if (context) {

        let originalBmp: ImageBitmap | null = null
        originalBmp = await createImageBitmap(tiles[tileIdx])

        context.drawImage(originalBmp, 0, 0)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Loop through each pixel
        for (let i = 0; i < data.length; i += 4) {

          // skip if alpha is 0
          if (data[i + 3] == 0) continue

          // get the current color
          const rgba = Color.ColorFromRgba(
            {
              r: data[i],
              g: data[i + 1],
              b: data[i + 2],
              a: data[i + 3],
            }
          ).TargetHsla(colorObj as HSLA)

          data[i] = rgba.r
          data[i + 1] = rgba.g
          data[i + 2] = rgba.b
          data[i + 3] = rgba.a
        }

        context.putImageData(imageData, 0, 0)

        // save the blob as an image
        const blob = await canvas.convertToBlob({ type: 'image/png' })
        this.SaveBlobAsImgIntoTiles(tileSet.Name + color, blob)

        originalBmp.close()

      }
    }

    console.debug('LoadColorizedTiles()', window.performance.now() - startTime)

  }


  /**
   * Get a Tile based on the map data
   * 
   * @param {string} tileSet Tile Set to get tile from, i.e. Solid-1
   * @param {SurroundingMapData} surroundingMapData Map data used to select correct tile
   * 
   * @example GetTile('Solid-1', '0011')
   */
  GetTile(
    tileSet: Tileset,
    surroundingMapData: SurroundingMapData,
    color: string
  ): SVGSVGElement | HTMLImageElement {

    const tileIdx = this.TileIndex.indexOf(surroundingMapData)

    // svg color is applied elsewhere
    if (tileSet.Format == 'svg') {
      try {
        return this.Tiles[tileSet.Name][tileIdx].cloneNode(true) as SVGSVGElement
      } catch {
        return this.ErrorImg
      }

    }

    // img with no color change
    if (!tileSet.ApplyColor) {
      try {
        return this.Tiles[tileSet.Name][tileIdx].cloneNode(true) as HTMLImageElement
      } catch {
        return this.ErrorImg
      }

    }

    // img with color change
    try {
      return this.Tiles[tileSet.Name + color][tileIdx].cloneNode(true) as HTMLImageElement
    } catch {
      return this.ErrorImg
    }
  }

}

export default GridMapTilesets