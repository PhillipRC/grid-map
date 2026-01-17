import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'
import GridMapData from '../grid-map-data/grid-map-data'

// markup and styles
import html from './grid-map-data-persist.html?raw'
import css from './grid-map-data-persist.css?raw'


/**
 * @listens GridMapData.EventLoaded
 */
export default class GridMapDataPersist extends AppSidebarWidget {


  GridMapData: GridMapData | null = null


  /**
   * Option to save to file
   */
  SaveFileSystemOption: HTMLButtonElement | null = null


  /**
   * Option to load from file
   */
  LoadFileSystemOption: HTMLButtonElement | null = null


  constructor() {
    super(css)
  }


  connectedCallback() {

    super.connectedCallback()

    this.WidgetTitle = 'Save & Load'

    // add base markup for edit options
    const node = this.HtmlToNode(html)
    if (node) this.WidgetContent?.append(node)

    this.LoadFileSystemOption = this.shadowRoot?.querySelector('.load-file')!
    this.SaveFileSystemOption = this.shadowRoot?.querySelector('.save-file')!

    this.LoadFileSystemOption?.addEventListener(
      'click',
      () => { this.HandleLoadFileSystemOption() }
    )

    this.SaveFileSystemOption?.addEventListener(
      'click',
      () => { this.HandleSaveFileSystemOption() }
    )

    document.addEventListener(
      GridMapData.EventLoaded,
      (customEvent: CustomEventInit<GridMapData>) => {
        if (customEvent.detail) this.GridMapData = customEvent.detail
      }
    )

  }


  /** Load a map from the local file system */
  HandleLoadFileSystemOption() {

    const input = document.createElement('input')
    input.type = 'file';
    input.setAttribute('accept', '.json')
    input.addEventListener(
      'change',
      (event) => {
        // @ts-ignore
        const files = event.target.files
        if (files) {

          if (files.length < 1) return

          const file = files[0]
          const reader: FileReader = new FileReader()

          reader.onload = () => {
            try {
              if (reader.result) {
                this.GridMapData?.LoadMapData(
                  JSON.parse(
                    reader.result.toString()
                  )
                )
              }
            } catch (error) {
              if (error instanceof SyntaxError) {
                console.error(error.message)
              } else if (error instanceof Error) {
                console.error(error.message)
              } else {
                console.error(error)
              }
            }
          }
          reader.readAsText(file)
        }
      }
    )
    input.click()
  }


  /** Download a map to the local file system */
  HandleSaveFileSystemOption() {
    
    const json = JSON.stringify(this.GridMapData?.MapData, null)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'map.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  
  }


}
