import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget.js'
import GridMapTiles from '../grid-map-tiles/grid-map-tiles.js'
import GridMapFormTileLayers from '../grid-map-form-tile-layers/grid-map-form-tile-layers'
import PerlinNoise from '../Noise.js'

import {
  XY,
  MapDefault,
  NoiseDefault,
  TileLayerDefault,
  RGBA,
  MapData,
} from '../types'

// markup and styles
import html from './grid-map-data-generate.html?raw'
import htmlNoiseLayer from './grid-map-data-generate-noise-layer.html?raw'
import css from './grid-map-data-generate.css?inline'


/**
 * Handles Form for Generatig Map data
 * 
 * The code contains partial support for multiple noiseLayers
 */
export default class GridMapDataGenerate extends AppSidebarWidget {

  GridMapTilesRef: GridMapTiles | null = null

  Form: HTMLFormElement | null | undefined = null

  /** Component representing the TileLayer inputs and data */
  Layers: GridMapFormTileLayers | null = null

  AddTileSetOption: HTMLButtonElement | null | undefined = null

  RemoveTileSetOption: HTMLButtonElement | null | undefined = null

  NoiseLayers: HTMLElement | null | undefined = null

  PreviewCanvas: HTMLCanvasElement | null | undefined = null

  PreviewStartCanvas: HTMLCanvasElement | null | undefined = null

  Noise: PerlinNoise = new PerlinNoise()

  Seed: number = 0

  DefaultMap: MapDefault = {
    Width: 512,
    Height: 512,
    Start: {
      x: 160,
      y: 201,
    },
  }

  /** 
   * Default values to use when a Noise Layer is added
   * 
   * @type {Array.<NoiseDefault>}
   */
  DefaultsNoise: Array<NoiseDefault> = [
    {
      Seed: 3,
      Zoom: 2,
      Octaves: 8,
      Persistence: .5,
    }
  ]

  /** Default values to use when a Tile Layer is added */
  DefaultsLayer: TileLayerDefault[] = [
    {
      CanWalk: true,
      Color: '#F5D151',
      Cutoff: -0.05,
      CutoffCap: .1,
      Tileset: 'Solid-1-Edge',
    },
    {
      CanWalk: true,
      Color: '#0F7110',
      Cutoff: -0.03,
      CutoffCap: .1,
      Tileset: 'Solid-1',
    },
    {
      CanWalk: true,
      Color: '#39302D',
      Cutoff: 0.06,
      CutoffCap: .16,
      Tileset: 'Rough-1-Edge',
    },
    {
      CanWalk: false,
      Color: '#362521',
      Cutoff: 0.1,
      CutoffCap: .12,
      Tileset: 'Solid-1-Edge-2',
    },
    {
      CanWalk: false,
      Color: '#72787E',
      Cutoff: .15,
      CutoffCap: 1,
      Tileset: 'Block-2',
    },

  ]
  SubmitButton: HTMLButtonElement | null = null
  
  MapDataLoading: boolean = false
  
  RemoveTilesetOption: any

  constructor() {
    super(css)
  }

  connectedCallback() {

    super.connectedCallback()

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.WidgetTitle = 'Generate Map'

    const node = this.HtmlToNode(html)
    if (node && this.WidgetContent) this.WidgetContent?.append(node)

    // save references elements
    this.Form = this.WidgetContent?.querySelector('.generate-form')
    this.NoiseLayers = this.WidgetContent?.querySelector('.noise-layers')
    this.AddTileSetOption = this.WidgetContent?.querySelector('.add-tileset')
    this.RemoveTilesetOption = this.WidgetContent?.querySelector('.remove-tileset')!
    this.SubmitButton = this.WidgetContent?.querySelector('button[type=submit]')!
    this.PreviewCanvas = this.WidgetContent?.querySelector('.noise-preview')
    this.PreviewStartCanvas = this.WidgetContent?.querySelector('.noise-preview-start')
    this.Form?.addEventListener('submit', (event) => { this.HandleSubmit(event) })

    // add listeners
    this.WidgetContent?.querySelector('input[name="startx"]')?.addEventListener(
      'change', () => { this.RenderStartPreview() }
    )

    this.WidgetContent?.querySelector('input[name="starty"]')?.addEventListener(
      'change', () => { this.RenderStartPreview() }
    )

    this.PreviewStartCanvas?.addEventListener(
      'mousemove',
      (event) => {
        const rect = this.PreviewStartCanvas?.getBoundingClientRect()
        if (rect) {
          this.SetStartFromPreviewCursor(
            {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            }
          )
        }
      }
    )

    this.PreviewStartCanvas?.addEventListener(
      'mouseout', () => { this.RenderStartPreview() }
    )

    this.PreviewStartCanvas?.addEventListener(
      'click',
      (event) => {
        const rect = this.PreviewStartCanvas?.getBoundingClientRect()
        if (rect) {
          this.SetStartFromPreviewStart(
            {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            }
          )
        }
      }
    )

    document.addEventListener(
      'grid-map-generate-update',
      () => { this.RenderPreview() }
    )

    document.addEventListener(
      'grid-map-data-loading',
      () => {
        this.MapDataLoading = true
      }
    )

    document.addEventListener(
      'grid-map-tiles-loaded',
      (event) => {
        // @ts-ignore
        this.GridMapTilesRef = event.detail
        this.Init()
      }
    )

    document.addEventListener(
      'grid-map-data-loaded',
      () => {
        this.MapDataLoading = false
        this.SubmitButton?.classList.remove('disabled')
      }
    )

    this.AddTileSetOption?.addEventListener(
      'click',
      () => { this.AddTileSetLayer() }
    )

    this.RemoveTilesetOption?.addEventListener(
      'click',
      () => { this.RemoveTileSetLayer() }
    )

    this.Init()

  }


  Init() {

    if (this.GridMapTilesRef == null) return

    this.SetMap()

    // add initial layer
    this.AddNoiseLayer()
    this.AddTileSetLayer()
    this.AddTileSetLayer()
    this.AddTileSetLayer()
    this.AddTileSetLayer()

    this.RenderPreview()
  }


  /**
   * Convert Color Hex color to RGBA
   * @param {string} hex 
   * @returns {RGBA}
   */
  ConvertColorHexToRGBA(hex: string): RGBA {
    return {
      r: parseInt(hex.substring(1, 3), 16),
      g: parseInt(hex.substring(3, 5), 16),
      b: parseInt(hex.substring(5, 7), 16),
      a: 255
    }
  }


  /**
   * Set Map inputs
   * 
   * @param {number|undefined} width 
   * @param {number|undefined} height 
   * @param {XY|undefined} start 
   * @param {number|undefined} seed 
   */
  SetMap(width: number | undefined = undefined, height: number | undefined = undefined, start: XY | undefined = undefined) {

    if (!width) width = this.DefaultMap.Width
    if (!height) height = this.DefaultMap.Height
    if (!start) start = this.DefaultMap.Start

    let widthInput: HTMLInputElement | null | undefined = this.shadowRoot?.querySelector('input[name="width"]')    
    let heightInput: HTMLInputElement | null | undefined = this.shadowRoot?.querySelector('input[name="height"]')

    if (widthInput) widthInput.value = width.toString()
    if (heightInput) heightInput.value = height.toString()

    this.SetStart(start)

  }


  /**
   * Set Map Start, translating XY from Preview Map
   * 
   * @param {XY} start 
   */
  SetStartFromPreviewStart(start: XY) {

    const formData = this.GetFormData()

    if (!this.PreviewCanvas || !formData) return

    this.SetStart({
      x: Math.floor(start.x * (formData?.Size.x / this.PreviewCanvas.width)),
      y: Math.floor(start.y * (formData?.Size.y / this.PreviewCanvas.height))
    })

  }

  /**
   * @param {XY} cursor 
   */
  SetStartFromPreviewCursor(cursor: XY) {
    this.RenderStartPreview(
      {
        x: Math.floor(cursor.x),
        y: Math.floor(cursor.y)
      }
    )
  }


  /**
   * Set Map Start inputs
   * 
   * @param {XY} start 
   */
  SetStart(start: XY) {
    let xInput: HTMLInputElement | null | undefined = this.shadowRoot?.querySelector('input[name="startx')
    let yInput: HTMLInputElement | null | undefined = this.shadowRoot?.querySelector('input[name="starty')

    if (xInput) xInput.value = start.x.toString()
    if (yInput) yInput.value = start.y.toString()

    this.RenderStartPreview()
  }


  /**
   * Adds and sets the Noise Layer form inputs
   * 
   * @param {number|undefined} seed
   * @param {number|undefined} zoom 
   * @param {number|undefined} octaves 
   * @param {number|undefined} persistence 
   */
  AddNoiseLayer(
    seed: number | undefined = undefined,
    zoom: number | undefined = undefined,
    octaves: number | undefined = undefined,
    persistence: number | undefined = undefined
  ) {

    // get the number of noise layers
    let noiseLayerIdx = 0
    if (this.NoiseLayers?.children.length) {
      noiseLayerIdx = this.NoiseLayers?.children.length
    }

    // pull from defaults if nothing is supplied
    let noiseLayerDefaultIdx = noiseLayerIdx
    if (noiseLayerDefaultIdx + 1 > this.DefaultsNoise.length) {
      noiseLayerDefaultIdx = (noiseLayerIdx + 1) % this.DefaultsLayer.length
    }
    if (seed == undefined) seed = this.DefaultsNoise[noiseLayerDefaultIdx].Seed
    if (zoom == undefined) zoom = this.DefaultsNoise[noiseLayerDefaultIdx].Zoom
    if (octaves == undefined) octaves = this.DefaultsNoise[noiseLayerDefaultIdx].Octaves
    if (persistence == undefined) persistence = this.DefaultsNoise[noiseLayerDefaultIdx].Persistence

    // update the markup with the inputs
    var noiseLayerMarkup = htmlNoiseLayer.replaceAll('##layer_idx##', (noiseLayerIdx + 1).toString())
    noiseLayerMarkup = noiseLayerMarkup.replaceAll('##noise_seed##', seed.toString())
    noiseLayerMarkup = noiseLayerMarkup.replaceAll('##noise_zoom##', zoom.toString())
    noiseLayerMarkup = noiseLayerMarkup.replaceAll('##noise_octaves##', octaves.toString())
    noiseLayerMarkup = noiseLayerMarkup.replaceAll('##noise_persistence##', persistence.toString())

    // append the markup
    const node = this.HtmlToNode(noiseLayerMarkup)
    if (node) this.NoiseLayers?.append(node)

  }

  /** @returns {HTMLElement|null|undefined} */
  GetLastNoiseLayer(): HTMLElement | null | undefined {
    return this.NoiseLayers?.querySelector(
      `#noise-layer-${this.NoiseLayers.children.length}`
    )
  }



  /**
   * Renders a preview of the map using a HTMLCanvasElement
   */
  RenderPreview() {

    const formData = this.GetFormData()
    const context = this.PreviewCanvas?.getContext('2d')

    if (!formData || !this.PreviewCanvas || !context) return

    const aspectRatio = formData.Size.y / formData.Size.x

    // update canvas to fit aspect ratio
    this.PreviewCanvas.setAttribute(
      'height',
      (256 * aspectRatio).toString()
    )

    const canvasWidth = this.PreviewCanvas.width
    const canvasHeight = this.PreviewCanvas.height
    const image = context.createImageData(canvasWidth, canvasHeight)

    formData.NoiseLayers.forEach(
      (layer) => {

        if (layer.Seed == 0) return

        // seed is 0 pick a rnd number
        this.Seed = this.Noise.seed(
          layer.Seed == 0
            ? Math.random()
            : layer.Seed
        )

        if (!this.Layers || !this.Layers.TileLayers) return

        this.Layers.TileLayers.forEach(
          (tileLayer, tileLayerIdx) => {

            const tileLayerColor: RGBA = this.ConvertColorHexToRGBA(tileLayer.Color)

            for (var x = 0; x < canvasWidth; x++) {
              for (var y = 0; y < canvasHeight; y++) {

                var value = this.Noise.Perlin2DWithOctaves(
                  x / canvasWidth * layer.Zoom,
                  y / canvasHeight * layer.Zoom,
                  layer.Octaves,
                  layer.Persistence
                )

                var cell = (x + y * canvasWidth) * 4

                if (!tileLayer.Cutoff || !tileLayer.CutoffCap) return

                if (value > tileLayer.Cutoff && value <= tileLayer.CutoffCap) {
                  image.data[cell] = tileLayerColor.r
                  image.data[cell + 1] = tileLayerColor.g
                  image.data[cell + 2] = tileLayerColor.b
                  image.data[cell + 3] = tileLayerColor.a
                } else {

                  // set the pixels for the bottom layer to blue
                  if (tileLayerIdx == 0) {
                    // 023e58
                    image.data[cell] = 2
                    image.data[cell + 1] = 62
                    image.data[cell + 2] = 88
                    image.data[cell + 3] = 255
                  }

                }
              }
            }

            context.putImageData(image, 0, 0)
          }
        )

      }
    )

  }

  /**
   * 
   * @param {XY|null} cursor 
   * @returns 
   */
  RenderStartPreview(cursor: XY | null = null) {

    const formData = this.GetFormData()
    const context = this.PreviewStartCanvas?.getContext('2d')

    if (!formData || !this.PreviewCanvas || !context) return

    const scaledStart = {
      x: formData.Start.x * (this.PreviewCanvas.width / formData?.Size.x),
      y: formData.Start.y * (this.PreviewCanvas.height / formData?.Size.y)
    }

    context.clearRect(0, 0, 256, 256)

    // render cursor if provided
    if (cursor != null) this.RenderCursor(context, cursor, scaledStart)

    context.beginPath()
    context.globalAlpha = 1
    context.lineWidth = 2
    context.strokeStyle = 'white'
    context.arc(
      scaledStart.x,
      scaledStart.y,
      11,
      0,
      2 * Math.PI
    )
    context.stroke()
    context.closePath()

    context.beginPath()
    context.fillStyle = 'rgba(0,0,0,.2)'
    context.arc(
      scaledStart.x,
      scaledStart.y,
      11,
      0,
      2 * Math.PI
    )
    context.fill()
    context.closePath()


    context.beginPath()
    context.globalAlpha = 1
    context.fillStyle = 'white'
    context.arc(
      formData.Start.x * (this.PreviewCanvas.width / formData?.Size.x),
      formData.Start.y * (this.PreviewCanvas.height / formData?.Size.y),
      3,
      0,
      2 * Math.PI
    )
    context.fill()
    context.closePath()
  }

  /**
   * @param {CanvasRenderingContext2D} context 
   * @param {XY} cursor 
   * @param {XY} scaledStart 
   */
  RenderCursor(context: CanvasRenderingContext2D, cursor: XY, scaledStart: XY) {

    const cursorRadius = 10

    context.save()

    context.beginPath()
    context.strokeStyle = 'rgba(0,0,0,.2)'
    context.lineWidth = 7
    context.arc(
      cursor.x,
      cursor.y,
      cursorRadius,
      0,
      2 * Math.PI
    )
    context.stroke()
    context.closePath()

    context.beginPath()
    context.strokeStyle = 'white'
    context.globalAlpha = 1
    context.lineWidth = 2
    context.arc(
      cursor.x,
      cursor.y,
      cursorRadius,
      0,
      2 * Math.PI
    )
    context.stroke()
    context.closePath()

    // get the angle between start cursor
    const angle = Math.atan2(cursor.y - scaledStart.y, cursor.x - scaledStart.x)
    context.translate(cursor.x, cursor.y)
    context.rotate(angle)

    context.strokeStyle = 'rgba(0,0,0,.2)'
    context.beginPath()

    context.lineWidth = 6

    context.moveTo(-400, 0)
    context.lineTo(-cursorRadius + 5, 0)
    context.moveTo(400, 0)
    context.lineTo(cursorRadius - 5, 0)
    context.moveTo(0, -400)
    context.lineTo(0, -cursorRadius + 5)
    context.moveTo(0, 400)
    context.lineTo(0, cursorRadius - 5)
    context.stroke()
    context.closePath()

    context.beginPath()
    context.strokeStyle = 'white'
    context.lineWidth = 2
    context.setLineDash([15, 5])
    context.moveTo(-20, 0)
    context.lineTo(-cursorRadius + 5, 0)
    context.moveTo(20, 0)
    context.lineTo(cursorRadius - 5, 0)
    context.moveTo(0, -20)
    context.lineTo(0, -cursorRadius + 5)
    context.moveTo(0, 20)
    context.lineTo(0, cursorRadius - 5)
    context.stroke()
    context.closePath()

    context.restore()
  }


  /**
   * Removes the last Noise Layer
   */
  RemoveNoiseLayer() {
    if (!this.NoiseLayers) return

    const noiseLayerCount = this.NoiseLayers.children.length
    if (noiseLayerCount <= 1) return

    this.GetLastNoiseLayer()?.remove()
    this.RenderPreview()
  }

  AddTileSetLayer() {

    // bomb out if there is no noise layer to add too
    if (!this.NoiseLayers || !this.GridMapTilesRef || !this.GridMapTilesRef.TileSets) return

    const noiseLayerCount = this.NoiseLayers.children.length

    if (noiseLayerCount == 0) return

    // container for the grid-map-form-tile-layer
    const lastNoiseLayer = this.GetLastNoiseLayer()
    const tileSetLayers = lastNoiseLayer?.querySelector('.tileset-layers')

    if (!tileSetLayers) return

    // create component if it has not been created
    if (!this.Layers) {
      this.Layers = new GridMapFormTileLayers()
      if (this.GridMapTilesRef?.TileSets) this.Layers.SetTilesets(this.GridMapTilesRef.TileSets)
      tileSetLayers?.appendChild(this.Layers)
      // add change to Layers container
      this.Layers.addEventListener('change', () => { this.RenderPreview() })
      this.Layers.addEventListener('mousewheel', () => { this.RenderPreview() })
    }

    // use DefaultLayers to set the initial values
    let currentLength = this.Layers.TileLayers?.length
    currentLength = currentLength == null ? 0 : currentLength
    this.Layers.AddTileLayer(
      this.DefaultsLayer[currentLength % this.DefaultsLayer.length]
    )

    this.RenderPreview()

  }


  /** @returns {HTMLElement|null|undefined} */
  GetLastTileSetLayer(): HTMLElement | null | undefined {
    const lastNoiseLayer = this.GetLastNoiseLayer()
    const tileSetLayers = lastNoiseLayer?.querySelector('.tileset-layers')
    return tileSetLayers?.querySelector(
      `#tile-layer-${tileSetLayers.children.length}`
    )
  }


  /**
   * Removes the last Tile Layer
   */
  RemoveTileSetLayer() {

    if (!this.NoiseLayers) return

    // do allow last noise layer to be removed
    const lastNoiseLayer = this.GetLastNoiseLayer()
    if (!lastNoiseLayer) return

    
    if(!this.Layers || !this.Layers.TileLayers || !Array.isArray(this.Layers.TileLayers)) return 
      
    const tileSetLayerCount = this.Layers.TileLayers.length
      
    
    

    if (tileSetLayerCount > 1) {
      this.Layers?.RemoveLayer(tileSetLayerCount - 1)
    }

    this.RenderPreview()

  }


  /**
   * Type safe get FromData value
   * @param {FormData} formData 
   * @param {string} inputName 
   * @returns {number}
   */
  GetInputValue(formData: FormData, inputName: string): number {
    var returnValue = formData.get(inputName)?.toString()
    if (returnValue == undefined) return 0
    return parseFloat(returnValue)
  }


  /**
   * 
   * @returns {MapData|undefined}
   */
  GetFormData(): MapData | undefined {

    if (!this.Form) throw new  Error('there is no form')

    const formData: FormData = new FormData(this.Form)

    const returnData: MapData = {
      Size: {
        x: this.GetInputValue(formData, 'width'),
        y: this.GetInputValue(formData, 'height'),
      },
      Start: {
        x: this.GetInputValue(formData, 'startx'),
        y: this.GetInputValue(formData, 'starty'),
      },
      NoiseLayers: [],
    }

    const seeds = formData.getAll('seed')
    const octaves = formData.getAll('octaves')
    const persistence = formData.getAll('persistence')

    // add the each noise layer
    formData.getAll('zoom').forEach(
      (zoom, noiseIdx) => {
        returnData.NoiseLayers.push(
          {
            Zoom: parseFloat(zoom.toString()),
            Seed: parseInt(seeds[noiseIdx].toString(), 10),
            Octaves: parseInt(octaves[noiseIdx].toString()),
            Persistence: parseFloat(persistence[noiseIdx].toString()),
            TileLayers: []
          }
        )
      }
    )

    // return what we have if there are no NoiseLayers
    if (!this.NoiseLayers) return returnData

    // add tile layer data for each noise layer
    const tileSet = formData.getAll('Tileset')
    const canWalk = formData.getAll('CanWalk')
    const cutoff = formData.getAll('Cutoff')
    const cutoffcap = formData.getAll('CutoffCap')
    const color = formData.getAll('Color')

    let noiseLayer = 0
    for (const _element of this.NoiseLayers.children) {

      let totalIdx = 0
      tileSet.forEach(
        () => {
          const data = {
                Tileset: tileSet[totalIdx].toString(),
                CanWalk: canWalk[totalIdx] == "true" ? true : false,
                Cutoff: parseFloat(cutoff[totalIdx].toString()),
                CutoffCap: parseFloat(cutoffcap[totalIdx].toString()),
                Color: color[totalIdx].toString(),
              }
          returnData.NoiseLayers[noiseLayer].TileLayers.push(data)
          totalIdx++
        }
      )

      noiseLayer++
    }

    return returnData

  }


  /**
   * @param {Event} event 
   */
  HandleSubmit(event: Event) {

    event.preventDefault()
    event.stopPropagation()

    if (!this.Form || this.MapDataLoading) return

    this.RenderPreview()

    this.SubmitButton?.classList.add('disabled')

    // call with a delay to allow UI update before
    setTimeout(
      () => {
        document.dispatchEvent(
          new CustomEvent(
            'grid-map-data-generate',
            {
              bubbles: true,
              detail: this.GetFormData(),
            }
          )
        )
      }
      , 200
    )

  }


}
