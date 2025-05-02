import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'
import GridMapTilesetDisplay from '../grid-map-tileset-display/grid-map-tileset-display'
import GridMapTilesets from '../grid-map-tilesets/grid-map-tilesets'

// markup and style
import css from './grid-map-tilesets-display.css?raw'
import html from './grid-map-tilesets-display.html?raw'


/**
 * Display a listing of loaded Tilesets
 */
export default class GridMapTilesetsDisplay extends AppSidebarWidget {

  /** Component handling Tile data: loading and creating */
  GridMapTiles: GridMapTilesets | null = null

  TilesetDisplay: HTMLDivElement | null = null


  constructor() {
    super(css)
  }

  connectedCallback() {

    super.connectedCallback()

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.WidgetTitle = 'Tilesets'

    // add base markup for edit options
    const node = this.HtmlToNode(html)
    if (node) this.WidgetContent?.append(node)

    this.TilesetDisplay = this.shadowRoot?.querySelector('.tilesets-display')!

    document.addEventListener(
      GridMapTilesets.EventLoaded,
      (event: CustomEventInit<GridMapTilesets>) => {
        if (event.detail != undefined) this.HandleTilesLoaded(event.detail)
      }
    )

  }


  HandleTilesLoaded(event: GridMapTilesets) {
    if (this.GridMapTiles == null) this.GridMapTiles = event
    this.Clear()
    this.Show()
  }


  Clear() {
    if (!this.TilesetDisplay) return
    for (var idx = this.TilesetDisplay.childNodes.length; idx > 0; idx--) {
      const node = this.TilesetDisplay.childNodes.item(idx - 1)
      this.TilesetDisplay.removeChild(node)
    }
  }

  /**
   * Display loaded Tile Sets
   */
  Show() {
    // loop over the Tile Sets
    this.GridMapTiles?.TileSets.forEach(
      (tileSet) => {
        const tileSetDisplay = new GridMapTilesetDisplay()

        // set the tileset
        tileSetDisplay.Tileset = tileSet

        // set the data
        const tileset = this.GridMapTiles?.Tiles[tileSet.Name]
        if (tileset) tileSetDisplay.TileData = tileset
        this.TilesetDisplay?.appendChild(tileSetDisplay)
      }
    )
  }


}
