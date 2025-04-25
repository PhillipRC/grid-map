import GridMapTilesSetDisplay from '../grid-map-tiles-set-display/grid-map-tiles-set-display'
import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'

import {
  XY,
  Tileset,
} from '../types'

// style
import css from './grid-map-tiles.css?raw'


/**
 * Handles Tile Data
 */
class GridMapTiles extends AppSidebarWidget {

  /** Available Tile Sets */
  TileSets: Array<Tileset> = [
    {
      Name: 'Solid-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Solid-1-Edge',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Solid-1-Edge-2',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Rough-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Rough-1-Edge',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Brick-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Brick-2',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Brick-3',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Block-1',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Block-2',
      Format: 'svg',
      Ext: 'svg',
      TilesWide: 1,
    },
    {
      Name: 'Rock-1',
      Format: 'img',
      Ext: 'png',
      TilesWide: 4,
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
  TileIndex: Array<string> = [
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
        'grid-map-tiles-loaded',
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
        this.SaveBlobAsImgIntoTiles(tileSet, blob)
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
    const scale = Math.floor(sheetBmp.width/tileSet.TilesWide)
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
        this.SaveBlobAsImgIntoTiles(tileSet, blob)
        tileBmp.close()
      }
    }
  }


  SaveBlobAsImgIntoTiles(tileSet: Tileset, blob: Blob) {
    const imageURL = URL.createObjectURL(blob)
    const image = new Image()
    image.src = imageURL
    this.Tiles[tileSet.Name].push(image)
  }


  /**
   * Get a Tile based on the map data
   * 
   * @param {string} tileSet Tile Set to get tile from, i.e. Solid-1
   * @param {string} surroundingMapData Map data to select correct tile, i.e. 0011
   * 
   * @example GetTile('Solid-1', '0011')
   */
  GetTile(tileSet: Tileset, surroundingMapData: string): SVGSVGElement | HTMLImageElement {
    const tileIdx = this.TileIndex.indexOf(surroundingMapData)
    const tileCache = this.Tiles[tileSet.Name]
    return tileCache[tileIdx].cloneNode(true) as SVGSVGElement | HTMLImageElement
  }

}

export default GridMapTiles