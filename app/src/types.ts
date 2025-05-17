
/** Represents a Coordinate in space */
export type XY = {
  /** Horizontal */
  x: number
  /** Vertical */
  y: number
}

export type XYMinMax = {
  min: XY
  max: XY
}

export type MapData = {
  NoiseLayers: NoiseLayer[]
  Size: XY
  Start: XY
}


export type NoiseLayer = {
  Seed: number
  Zoom: number
  Octaves: number
  Persistence: number
  TileLayers: TileLayer[]
}


export type TileLayer = {
  Tileset: string
  Cutoff?: number
  CutoffCap?: number
  CanWalk: boolean
  Color: string
  Map?: number[]
  Carveout: boolean
}

export type TileLayerProperties =
  'Tileset'
  | 'Cutoff'
  | 'CutoffCap'
  | 'CanWalk'
  | 'Color'
  | 'Map'
  | 'Carveout'

export type RGBA = {
  r: number
  g: number
  b: number
  a: number
}

export type HSLA = {
  h: number
  s: number
  l: number
  a: number
}


export type Tileset = {
  /** Hyphenated name */
  Name: string
  /** Container type used to display the tile */
  Format: 'svg' | 'img'
  /** File extension */
  Ext: 'svg' | 'png'
  /** Number of tiles the sheet is tall */
  TilesTall: number
  /** Number of tiles the sheet is wide */
  TilesWide: number
  /** Enable color option */
  ApplyColor: boolean
  /** Type of auto terrain */
  AutoTerrain: 'dualgrid' | null
  /** Tileset is loaded */
  IsLoaded: boolean
  /** Spacing around the tiles in the sheet */
  Margin?: {
    Left: number
    Right: number
    Top: number
    Bottom: number
  }
  /** Tile source */
  Credit?: Credit
}

export type Credit = {
  Name: string
  Url: string
}

// TODO: only need this for loading individual files, this could be reduced to an int in other cases
export type SurroundingMapData = '0000' | '0001' | '0010' | '0011' | '0100' | '0101' | '0110' | '0111' | '1000' | '1001' | '1010' | '1011' | '1100' | '1101' | '1110' | '1111'

export type MapDefault = {
  Width: number
  Height: number
  Start: XY
}


export type NoiseDefault = {
  Seed: number
  Zoom: number
  Octaves: number
  Persistence: number
}

export type TileLayerDefault = {
  Tileset: string
  Cutoff?: number
  CutoffCap?: number
  CanWalk: boolean
  Color: string
  Map?: number[]
  Carveout: boolean,
}


export type TileData = {
  Layer: number
  Tileset: string | null
  CanWalk: boolean
}


export type RenderedTile = {
  /** format: [layerIdx]-[x]-[y] */
  id: string
  x: number
  y: number
  ref: SVGElement | HTMLImageElement
  value: number
}


export type GridMapDisplayLayer = {
  SvgContainer: SVGElement | HTMLElement
  RenderedTiles: RenderedTile[]
}


export type GridMapTileData = {
  /** Name of the Tileset */
  Tileset: string
  /** Surrounding Map Data */
  SurroundingMapData: SurroundingMapData
}


export type MapRenderData = {
  Start: XY
  MapDataSize: XY
  Layers: TileLayer[]
}
