import { initPWA } from './pwa/pwa.ts'
import './pwa/pwa.css'

/**
 * Register the webcomponent
 */

import '@lion/ui/define/lion-tabs.js'
import '@lion/ui/define/lion-button.js'

import AppMain from './app-main/app-main'
customElements.define('app-main', AppMain)

import AppUiSvg from './app-ui-svg/app-ui-svg'
customElements.define('app-ui-svg', AppUiSvg)

import AppConsole from './app-console/app-console'
customElements.define('app-console', AppConsole)

import AppSidebar from './app-sidebar/app-sidebar'
customElements.define('app-sidebar', AppSidebar)

import AnimatedCollapse from './animated-collapse/animated-collapse'
customElements.define('animated-collapse', AnimatedCollapse)

import GridMapDisplay from './grid-map-display/grid-map-display'
customElements.define('grid-map-display', GridMapDisplay)

import GridMapTilesets from './grid-map-tilesets/grid-map-tilesets'
customElements.define('grid-map-tilesets', GridMapTilesets)

import GridMapPointer from './grid-map-pointer/grid-map-pointer'
customElements.define('grid-map-pointer', GridMapPointer)

import GridMapData from './grid-map-data/grid-map-data'
customElements.define('grid-map-data', GridMapData)

import GridMapDataEdit from './grid-map-data-edit/grid-map-data-edit'
customElements.define('grid-map-data-edit', GridMapDataEdit)

import GridMapDataGenerate from './grid-map-data-generate/grid-map-data-generate'
customElements.define('grid-map-data-generate', GridMapDataGenerate)

import GridMapFormTileLayers from './grid-map-form-tile-layers/grid-map-form-tile-layers'
customElements.define('grid-map-form-tile-layers', GridMapFormTileLayers)

import GridMapDataPersist from './grid-map-data-persist/grid-map-data-persist'
customElements.define('grid-map-data-persist', GridMapDataPersist)

import GridMapTilesetsDisplay from './grid-map-tilesets-display/grid-map-tilesets-display'
customElements.define('grid-map-tilesets-display', GridMapTilesetsDisplay)

import GridMapTilesetDisplay from './grid-map-tileset-display/grid-map-tileset-display'
customElements.define('grid-map-tileset-display', GridMapTilesetDisplay)

// disable touchmove
window.addEventListener('touchmove', (event) => { event.preventDefault() })

/**
 * Setup PWA
 */
initPWA(document.querySelector<HTMLElement>('body')!)
