import { LionTabs } from '@lion/ui/tabs.js'

import {
  TileLayer,
  TileLayerDefault,
  Tileset,
  TileLayerProperties,
} from '../types'

// markup
import html from './grid-map-form-tile-layer.html?raw'


/**
 * Handles displaying Inputs for multiple layers in a set of Tabs
 */
export default class GridMapFormTileLayers extends HTMLElement {

  /**
   * Tabs Container
   * 
   * @type {LionTabs|null}
   */
  Tabs: LionTabs | null = null


  /**
   * Controls the min number of layers
   */
  MinTileLayers = 1


  /**
   * Controls the max number of layers
   */
  MaxTileLayers = 8


  /**
   * Tilesets to select from
   *  
   * @type {Array.<Tileset>|null}
   */
  AvailableTilesets: Array<Tileset> | null = null


  /** Layer data being displayed */
  TileLayers: Array<TileLayer> | null = null


  AllInputs: Array<TileLayerProperties> = [
    'Tileset',
    'Color',
    'CanWalk',
    'Cutoff',
    'CutoffCap',
    'Carveout',
  ]


  constructor() {
    super()
  }

  connectedCallback() { }

  /** @param {Array.<Tileset>} tileSets */
  SetTilesets(tileSets: Array<Tileset>) {
    this.AvailableTilesets = tileSets
  }


  SelectLayer(layerIdx: number) {
    
    if (!this.Tabs) return
    if (layerIdx < 0 || layerIdx > this.Tabs.panels.length) return

    this.Tabs.selectedIndex = layerIdx
  }


  /** 
   * Set and Add an Array of TileLayers
   * 
   * @param {Array.<TileLayer>} tileLayers
   */
  SetTileLayers(tileLayers: Array<TileLayer>) {
    this.TileLayers = tileLayers
    this.AddLayers()
  }

  /**
   * Add all the layers currently in TileLayers
   */
  AddLayers() {

    if (!this.TileLayers || !this.TileLayers.length || !this.AvailableTilesets) return

    this.AddTabs()

    // add each layer
    this.TileLayers.forEach(
      (tileLayer, tileLayerIdx) => {
        this.AddLayer(tileLayer, tileLayerIdx)
      }
    )
  }


  /**
   * Add a TileLayer
   * 
   * @param {TileLayerDefault} tileLayer 
   */
  AddTileLayer(tileLayer: TileLayerDefault) {

    if (this.TileLayers == null) this.TileLayers = []

    if (this.TileLayers.length > this.MaxTileLayers - 1) throw new Error('max tile layers of ' + this.MaxTileLayers)

    this.TileLayers?.push(tileLayer)

    this.AddTabs()
    this.AddLayer(
      tileLayer,
      this.TileLayers.length - 1
    )
  }


  /**
   * Add the Tab component if not added
   */
  AddTabs() {
    if (this.Tabs == null) {
      var newTab = new LionTabs()
      if (!newTab) return
      this.Tabs = newTab
      this.appendChild(this.Tabs)
      this.Tabs.addEventListener('change', (event) => { this.HandleInputChange(event) })
      this.Tabs.addEventListener('mousewheel', (event) => { this.HandleInputChange(event) })
    }
  }


  /**
   * @param {Event} event 
   */
  HandleInputChange(event: Event) {

    if (!this.TileLayers) return

    // @ts-ignore
    const name: TileLayerProperties = event.target.getAttribute('name')
    // @ts-ignore
    const layerIdx = event.target.getAttribute('data-layer-idx')
    // @ts-ignore
    const value = event.target.value

    if (!name || !layerIdx || !value) return

    let newValue = null

    switch (name) {

      case ('CanWalk'):
        newValue = value == 'true' ? true : false
        break

      default:
        newValue = value
        break

    }


    // stop the event if nothing was actually changed
    if (this.TileLayers[layerIdx][name] == newValue) {
      event.stopPropagation()
    } else {
      // @ts-ignore
      this.TileLayers[layerIdx][name] = newValue
    }

  }


  /**
   * Create the form elements for a layer
   * 
   * @param {TileLayerDefault} tileLayer 
   * @param {number} tileLayerIdx 
   */
  AddLayer(tileLayer: TileLayerDefault, tileLayerIdx: number) {

    if (!this.TileLayers) throw new Error('missing TileLayers')
    if (!this.AvailableTilesets) throw new Error('missing AvailableTilesets')

    // create/set tab
    const tab = document.createElement('button')
    tab.setAttribute('slot', 'tab')
    tab.setAttribute('type', 'button')
    tab.setAttribute('title', `Select Layer ${tileLayerIdx}`)
    tab.setAttribute('class', 'button console-font tab')
    tab.textContent = tileLayerIdx.toString()
    this.Tabs?.appendChild(tab)

    // create panel
    const panel = document.createElement('div')
    panel.setAttribute('title', `Settings for Layer ${tileLayerIdx}`)
    panel.setAttribute('slot', 'panel')
    panel.setAttribute('class', 'test')

    let layerMarkup = `${html}`

    // set layer idx for easy access
    layerMarkup = layerMarkup.replaceAll('##TileLayerIdx##', tileLayerIdx.toString())

    // set ids of all inputs
    this.AllInputs.forEach(
      (element) => {
        // tileLayer doesn't have the field remove it from the markup
        if (!(element in tileLayer)) {
          layerMarkup = this.RemoveInputFromMarkup(layerMarkup, element)
          return
        }

        const tokenId = '##' + element + '_id##'
        layerMarkup = layerMarkup.replaceAll(tokenId, this.CreateID())
      }
    )

    // add panel
    panel.innerHTML = `${layerMarkup}`
    this.Tabs?.appendChild(panel)

    // <select> tileset
    var tileSetSelect: HTMLSelectElement | null = panel.querySelector(`select[name="Tileset"]`)
    if (tileSetSelect != null) {
      this.AvailableTilesets.forEach(
        (tileName) => {
          const option = document.createElement('option')
          option.text = tileName.Name
          tileSetSelect?.add(option)
        }
      )
      tileSetSelect.value = tileLayer.Tileset
    }

    // set values
    this.AllInputs.forEach(
      (element) => {
        let inputElement: HTMLInputElement | null = panel.querySelector(`input[name="${element}"]`)

        // @ts-ignore
        if (inputElement) inputElement.value = tileLayer[element].toString()
        inputElement = panel.querySelector(`select[name="${element}"]`)
        // @ts-ignore
        if (inputElement) inputElement.value = tileLayer[element].toString()
      }
    )

  }

  /**
   * Remove the form elements for a layer
   * 
   * @param {number} tileLayerIdx 
   */
  RemoveLayer(tileLayerIdx: number) {

    if (!this.TileLayers) throw new Error('missing TileLayers')
    if (!this.Tabs) throw new Error('missing Tabs')
    if (tileLayerIdx > this.MaxTileLayers - 1) throw new Error('min tile layers of ' + this.MinTileLayers)

    const tabs = this.Tabs?.querySelectorAll('button[slot="tab"]')
    const panels = this.Tabs?.querySelectorAll('div[slot="panel"]')

    if (!tabs || !panels) throw new Error('missing tabs and panels')

    // if removing the currently selected select another
    if (tileLayerIdx == this.Tabs?.selectedIndex) {
      this.Tabs.selectedIndex = Math.max(0, tileLayerIdx - 1)
    }

    // remove the inputs
    this.Tabs?.removeChild(tabs[tileLayerIdx])
    this.Tabs?.removeChild(panels[tileLayerIdx])

    // remove the data
    this.TileLayers.splice(tileLayerIdx, 1)

  }


  RemoveInputFromMarkup(html: string, input: string): string {
    const token = '<!-- ' + input + '_input -->'
    const cutStart = html.indexOf(token)
    const cutEnd = html.indexOf(token, cutStart + 1) + token.length
    return html.slice(0, cutStart) + html.slice(cutEnd, html.length)
  }

  CreateID() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

}