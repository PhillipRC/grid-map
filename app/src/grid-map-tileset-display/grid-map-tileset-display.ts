import GridBase from '../shared/grid-base'

import {
  Tileset,
  XY,
} from '../types'

// markup and style
import css from './grid-map-tileset-display.css?raw'
import html from './grid-map-tileset-display.html?raw'


/**
 * Display a Tileset
 * 
 * @fires GridMapTilesetDisplay.EventSelected
 */
export default class GridMapTilesetDisplay extends GridBase {

  /** fires: Tileset is selected */
  static EventSelected = 'tile-set-selected'

  Display: HTMLElement | null = null

  TileName: HTMLElement | null = null

  TileType: HTMLElement | null = null

  TileFooter: HTMLElement | null = null

  /**
   * @type {XY}
   */
  TileSize: XY = {
    x: 64,
    y: 64,
  }

  TileData: Array<any> | null = null

  Tileset: Tileset | null = null


  constructor() {
    super(css, html)
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.TileName = this.shadowRoot?.querySelector('.tileset-name')!
    this.TileType = this.shadowRoot?.querySelector('.tileset-type')!
    this.Display = this.shadowRoot?.querySelector('.tileset-display')!
    this.TileFooter = this.shadowRoot?.querySelector('.tileset-footer')!


    this.addEventListener(
      'click',
      (() => { this.DispatchTileSetSelected() })
    )

    this.addEventListener(
      'keydown',
      (event) => {
        if (event.key == 'Enter')
          this.DispatchTileSetSelected()
      }
    )

    this.Show()
  }

  DispatchTileSetSelected() {
    document.dispatchEvent(
      new CustomEvent(
        GridMapTilesetDisplay.EventSelected,
        {
          bubbles: true,
          detail: this.Tileset,
        }
      )
    )
  }

  /**
   * Display list of the loaded Tile Sets
   */
  Show() {

    if (this.Display == null || this.Tileset == null) return

    // set name
    if (this.TileName) this.TileName.textContent = this.Tileset.Name

    this.SetCredit()

    // setup styles    
    const isTerrain = this.Tileset.AutoTerrain != null
    if (isTerrain) {
      this.Display.classList.add('terrain')
    } else {
      this.Display.classList.remove('terrain')
    }
    if (this.TileType) this.TileType.textContent = (isTerrain ? 'Terrain' : 'Other')

    // setup container for tiles
    const container = document.createElement('div')
    const columns = this.Tileset.AutoTerrain ? 4 : this.Tileset.TilesWide
    let zoom = 256 / (columns * this.TileSize.x)
    container.style.zoom = zoom.toString()
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`

    this.AddTiles(container)

    // add the tile to the container
    this.Display.appendChild(container)

  }


  AddTiles(container: HTMLDivElement) {

    if (!this.TileData) return

    // loop over the tiles
    this.TileData.forEach(
      (tile) => {
        // create each tile
        let tileClone = tile.cloneNode(true)
        container.appendChild(tileClone)
      }
    )
  }

  SetCredit() {

    if (!this.Tileset?.Credit || !this.TileFooter) return

    if (this.Tileset.Credit && this.TileFooter) {
      this.TileFooter.style.display = 'block'
      const creditLink = document.createElement('a')
      const url = this.Tileset?.Credit?.Url
      creditLink.href = url
      creditLink.textContent = this.Tileset.Credit.Name
      creditLink.title = 'Credit Link (opens in a new window)'
      creditLink.target = '_blank'
      creditLink.addEventListener(
        'click',
        (event) => { this.HandleCreditLink(event, url) }
      )
      this.TileFooter.appendChild(creditLink)
    }
  }

  HandleCreditLink(event: Event, url: string) {
    event.stopImmediatePropagation()
    event.preventDefault()
    window.open(url, '_blank')
  }

}
