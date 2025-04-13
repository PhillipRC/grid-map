import GridMapTilesSetDisplay from '../grid-map-tiles-set-display/grid-map-tiles-set-display'
import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'

import {
  XY,
  Tileset,
} from '../types'

// style
import css from './grid-map-tiles.css?inline'


/**
 * Handles Tile Data
 */
class GridMapTiles extends AppSidebarWidget {

  /** Available Tile Sets */
  TileSets: Array<Tileset> = [
    {
      Name: 'Solid-1',
    },
    {
      Name: 'Solid-1-Edge',
    },
    {
      Name: 'Solid-1-Edge-2',
    },
    {
      Name: 'Rough-1',
    },
    {
      Name: 'Rough-1-Edge',
    },
    {
      Name: 'Brick-1',
    },
    {
      Name: 'Brick-2',
    },
    {
      Name: 'Block-1',
    },
    {
      Name: 'Block-2',
    },
  ]

  /** Holds the graphic data for each tileset, format: {'Solid-1': ['<g></g>',...'<g></g>']} */
  Tiles: { [key: string]: string[] } = {}

  TileSize: XY = {
    x: 64,
    y: 64,
  }

  /**
   * Represents the name and mapping for each Tile
   * 
   * @type {Array}
   * @example
   * Position 1: Top-Left
   * Position 2: Top-Right
   * Position 3: Bottom-Left
   * Position 4: Bottom-Right
   *
   * 0010 Fills the Bottom-Left of the Tile
   * 0101 Fill the Top-Right and Bottom-Right of the Tile
   */
  TileIndex: Array<any> = [
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

    this.WidgetTitle = 'Tile Sets'
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
        if(tileset) tileSetDisplay.Tileset = tileset
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
      await this.LoadTileSet(tileSet.Name)
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


  async LoadTileSet(tileSet: string) {

    // init tiles
    this.Tiles[tileSet] = []

    for (const [_idx, tile] of this.TileIndex.entries()) {
      
      // do not load empty
      if(tile == '0000') return
      
      const response = await fetch(
        `tiles/${tileSet}/${tile}.svg`
      )
      const svg = await response.text()
      this.Tiles[tileSet].push(svg)
    }

  }

  /**
   * Get a Tile based on the map data
   * 
   * @param {string} tileSet Tile Set to get tile from, i.e. sand-2
   * @param {string} surroundingMapData Map data to select correct tile, i.e. 0011
   * @returns {SVGAElement}
   * 
   * @example GetTile('sand-2', '0011')
   */
  GetTile(tileSet: string, surroundingMapData: string): SVGAElement {
    const tileIdx = this.TileIndex.indexOf(surroundingMapData)
    const tile = this.Tiles[tileSet][tileIdx]
    var svg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    )
    svg.innerHTML = tile
    // @ts-ignore
    return svg
  }

}

export default GridMapTiles