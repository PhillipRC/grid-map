import GridMapTilesSetDisplay from '../grid-map-tiles-set-display/grid-map-tiles-set-display'
import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'

import {
  HSLA,
  SurroundingMapData,
  Tileset,
  XY,
} from '../types'

// style
import css from './grid-map-tiles.css?raw'
import Color from '../Color'


/**
 * Handles Tile Data
 * 
 * @fires GridMapTiles.EventLoaded
 */
class GridMapTiles extends AppSidebarWidget {

  /** fires: Tiles are loaded */
  static EventLoaded = 'grid-map-tiles-loaded'

  /** Available Tile Sets */
  TileSets: Array<Tileset> = [
    {
      Name: 'Solid-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Solid-1-Edge',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Solid-1-Edge-2',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Rough-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Rough-1-Edge',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Brick-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Brick-2',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Brick-3',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Block-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Block-2',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
      ApplyColor: true,
    },
    {
      Name: 'Rock-1',
      Format: 'img',
      Ext: 'png',
      TilesWide: 4,
      ApplyColor: true,
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
    super(
      css
    )
  }

  connectedCallback() {

    super.connectedCallback()

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.WidgetTitle = 'Tilesets'
    this.LoadTiles()
  }


  /**
   * Display loaded Tile Sets
   */
  Show() {

    // loop over the Tile Sets
    this.TileSets.forEach(
      (tileSet) => {
        const tileSetDisplay = new GridMapTilesSetDisplay()
        tileSetDisplay.TileSetName = tileSet.Name
        const tileset = this.Tiles[tileSet.Name]
        if (tileset) tileSetDisplay.Tileset = tileset
        this.WidgetContent?.appendChild(tileSetDisplay)
      }
    )
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
      await this.LoadTileSet(tileSet)
    }

    this.IsLoaded = true

    // let eveyone know we are loaded up
    document.dispatchEvent(
      new CustomEvent(
        GridMapTiles.EventLoaded,
        {
          bubbles: true,
          detail: this,
        }
      )
    )

    this.Show()
  }


  async LoadTileSet(tileSet: Tileset) {

    // init tiles
    this.Tiles[tileSet.Name] = []

    if (tileSet.Format == 'svg' || tileSet.TilesWide == 1) {
      await this.LoadTilesIndividually(tileSet)
    } else {
      await this.LoadTilesFromSheet(tileSet)
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
    const scale = Math.floor(sheetBmp.width / tileSet.TilesWide)
    sheetBmp.close()

    // temp canvas to hold the result
    const canvas = new OffscreenCanvas(64, 64)!


    for (var y = 0; y < tileSet.TilesWide; y++) {
      for (var x = 0; x < 4; x++) {
        // cut up the sheet blob
        var tileBmp = await createImageBitmap(
          sheet,
          x * scale,  // start x
          y * scale,  // start y
          scale,      // width
          scale,      // height
          {
            resizeWidth: 64,
            resizeHeight: 64,
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
        image.onload = () => resolve(image.width)
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
      tileSet.Format != 'img'
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

        let originalBmp:ImageBitmap | null = null
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
      return this.Tiles[tileSet.Name][tileIdx].cloneNode(true) as SVGSVGElement
    }

    // img with no color change
    if (!tileSet.ApplyColor) {
      return this.Tiles[tileSet.Name][tileIdx].cloneNode(true) as HTMLImageElement
    }

    // img with color change
    return this.Tiles[tileSet.Name + color][tileIdx].cloneNode(true) as HTMLImageElement
  }

}

export default GridMapTiles