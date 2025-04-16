import GridBase from '../shared/grid-base'

import {
  XY,
} from '../types'

// markup and style
import css from './grid-map-tiles-set-display.css?raw'
import html from './grid-map-tiles-set-display.html?raw'


/**
 * Display a Tile Set in a 4x4 configuration
 */
export default class GridMapTilesSetDisplay extends GridBase {


  Display: HTMLElement | null = null

  Title: HTMLElement | null = null

  /**
   * @type {XY}
   */
  TileSize: XY = {
    x: 64,
    y: 64,
  }

  /**
   * @type {Array|null}
   */
  #Tileset: Array<any> | null = null

  get Tileset() {
    return this.#Tileset
  }

  set Tileset(value) {
    this.#Tileset = value
    this.Show()
  }

  /**
   * @type {string|null}
   */
  #TileSetName: string | null = null
  set TileSetName(value: string) {
    this.#TileSetName = value
    this.Show()
  }


  constructor() {
    super(css, html)
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Title = this.shadowRoot?.querySelector('.tileset-name')!
    this.Display = this.shadowRoot?.querySelector('.tileset-display')!

    this.addEventListener(
      'click',
      (() => { this.DispatchTileSetSelected() })
    )

    this.addEventListener(
      'keydown',
      (event) => { 
        if(event.key == 'Enter')
          this.DispatchTileSetSelected()
      }
    )

    this.Show()
  }

  DispatchTileSetSelected() {
    document.dispatchEvent(
      new CustomEvent(
        'tile-set-selected',
        {
          bubbles: true,
          detail: this.#TileSetName,
        }
      )
    )
  }

  /**
   * Display list of the loaded Tile Sets
   */
  Show() {

    if (this.Display == null || this.#Tileset == null) return

    if (this.Title) this.Title.textContent = this.#TileSetName

    const svg = this.CreateSvgTag(
      'svg',
      [
        ['width', this.TileSize.x * 4],
        ['height', this.TileSize.y * 4],
      ]
    )

    // loop over the tiles
    this.#Tileset.forEach(
      (tile, tileIdx) => {

        // do not render empty
        if(tileIdx == 12) return

        // calculate the position of each tile
        let x = this.TileSize.x * (tileIdx % 4)
        let y = Math.floor(tileIdx / 4) * 64

        // create each tile
        var svgTile = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        )
        this.AddAttributesToElement(
          svgTile,
          [
            ['x', x],
            ['y', y],
          ]
        )
        svgTile.innerHTML = tile
        svg.appendChild(svgTile)
      }
    )

    // add the tile to the container
    this.Display.appendChild(svg)

  }


}
