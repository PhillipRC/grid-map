
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
}

export type TileLayerProperties = 'Tileset' | 'Cutoff' | 'CutoffCap' | 'CanWalk' | 'Color' | 'Map'

export type RGBA = {
  r: number
  g: number
  b: number
  a: number
}



export type Tileset = {
  Name: string
}


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
}


export type TileData = {
  Layer: number
  Tileset: string|null
  CanWalk: boolean
}


export type RenderedTile = {
  /** format: [layerIdx]-[x]-[y] */
  id: string
  x: number
  y: number
  ref: SVGElement
}


export type GridMapDisplayLayer = {
  SvgContainer: SVGElement
  RenderedTiles: RenderedTile[]
}


export type GridMapTileData = {
  /** Name of the Tileset */
  Tileset: string
  /** Surrounding Map Data */
  SurroundingMapData: string
}


export type MapRenderData = {
  Start: XY
  MapDataSize: XY
  Layers: TileLayer[]
}
