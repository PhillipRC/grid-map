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

import AnimatedCollapse from './animated-collapse/animated-collapse.ts'
customElements.define('animated-collapse', AnimatedCollapse)

import GridMapDisplay from './grid-map-display/grid-map-display.ts'
customElements.define('grid-map-display', GridMapDisplay)

import GridMapTiles from './grid-map-tiles/grid-map-tiles'
customElements.define('grid-map-tiles', GridMapTiles)

import GridMapPointer from './grid-map-pointer/grid-map-pointer'
customElements.define('grid-map-pointer', GridMapPointer)

import GridMapTilesSetDisplay from './grid-map-tiles-set-display/grid-map-tiles-set-display'
customElements.define('grid-map-tiles-set-display', GridMapTilesSetDisplay)

import GridMapData from './grid-map-data/grid-map-data'
customElements.define('grid-map-data', GridMapData)

import GridMapDataEdit from './grid-map-data-edit/grid-map-data-edit'
customElements.define('grid-map-data-edit', GridMapDataEdit)

import GridMapDataGenerate from './grid-map-data-generate/grid-map-data-generate'
customElements.define('grid-map-data-generate', GridMapDataGenerate)

import GridMapFormTileLayers from './grid-map-form-tile-layers/grid-map-form-tile-layers'
customElements.define('grid-map-form-tile-layers', GridMapFormTileLayers)


/**
 * Setup PWA
 */
initPWA(document.querySelector<HTMLElement>('body')!)
