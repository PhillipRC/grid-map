import AppSidebarWidget from '../app-side-bar-widget/app-side-bar-widget'
import GridMapData from '../grid-map-data/grid-map-data'

// markup and styles
import html from './grid-map-data-persist.html?raw'
import css from './grid-map-data-persist.css?raw'


/**
 * Widget responsible for persisting grid map data (save / load).
 *
 * @remarks
 * Extends AppSidebarWidget to provide UI for saving and loading map data to/from the filesystem.
 * Listens for GridMapData.EventLoaded to capture the current GridMapData instance.
 * @listens GridMapData.EventLoaded
 */
export default class GridMapDataPersist extends AppSidebarWidget {


  /** Reference to the central GridMapData instance (set when loaded). */
  GridMapData: GridMapData | null = null


  /** Button element that triggers saving the map to the filesystem. */
  SaveFileSystemOption: HTMLButtonElement | null = null


  /** Button element that triggers loading a map from the filesystem. */
  LoadFileSystemOption: HTMLButtonElement | null = null


  /**
   * Construct the widget and provide component styles to the base class.
   */
  constructor() {
    super(css)
  }


  /**
   * Connected lifecycle hook.
   *
   * Mounts template content and wires UI and global event listeners.
   */
  connectedCallback(): void {

    super.connectedCallback()

    this.WidgetTitle = 'Save & Load'

    // add base markup for edit options
    const node = this.HtmlToNode(html)
    if (node) this.WidgetContent?.append(node)

    this.LoadFileSystemOption = super.GetElementBySelector('.load-file') as HTMLButtonElement
    this.SaveFileSystemOption = super.GetElementBySelector('.save-file') as HTMLButtonElement

    this.LoadFileSystemOption?.addEventListener(
      'click',
      () => { this.HandleLoadFileSystemOption() }
    )

    this.SaveFileSystemOption?.addEventListener(
      'click',
      () => { this.HandleSaveFileSystemOption() }
    )

    // Listen for the central GridMapData instance being loaded elsewhere in the app.
    document.addEventListener(
      GridMapData.EventLoaded,
      (evt: Event) => {
        const customEvent = evt as CustomEvent<GridMapData>
        if (customEvent?.detail) this.GridMapData = customEvent.detail
      }
    )

  }


  /**
   * Prompt the user to select a JSON file and load it into GridMapData.
   *
   * @remarks
   * Creates a temporary file input element to handle file selection.
   * Parses the selected JSON file and delegates loading to GridMapData.LoadMapData.
   * Logs errors if JSON parsing fails.
   * @example
   * // User clicks load button, selects a valid map.json file
   * // GridMapData.MapData is updated with the loaded data
   */
  HandleLoadFileSystemOption(): void {

    const input = document.createElement('input')
    input.type = 'file';
    input.setAttribute('accept', '.json')
    input.addEventListener(
      'change',
      (event: Event) => {
        // Cast to HTMLInputElement to access `.files` safely
        const inputEl = event.target as HTMLInputElement | null
        const files = inputEl?.files
        if (!files || files.length < 1) return

        const file = files[0]
        const reader: FileReader = new FileReader()

        // When the file is loaded, parse and delegate to GridMapData
        reader.onload = (): void => {
          try {
            if (typeof reader.result === 'string') {
              this.GridMapData?.LoadMapData(JSON.parse(reader.result))
            }
          } catch (error) {
            // Log parsing errors concisely
            console.error(error instanceof Error ? error.message : error)
          }
        }
        reader.readAsText(file)
      }
    )
    input.click()
  }


  /**
   * Serialize current GridMapData.MapData and trigger a download.
   *
   * @remarks
   * Exports the map data as a JSON file named 'map.json'.
   * No-op if MapData is unavailable.
   * @example
   * // User clicks save button with valid MapData
   * // A 'map.json' file is downloaded containing the serialized data
   */
  HandleSaveFileSystemOption(): void {
    if (!this.GridMapData?.MapData) return

    const json = JSON.stringify(this.GridMapData.MapData, null)
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
