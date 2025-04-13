
import GridBase from '../shared/grid-base.js'

// markup and style
import html from './app-console.html?raw'
import css from './app-console.css?inline'
import consoleCss from '../shared/console.css?inline'


export default class GridConsole extends GridBase {

  Textarea: HTMLTextAreaElement | null = null

  /**
   * @type {string}
   */
  Prompt: string = '>> '

  PromptSpace = '   '


  constructor() {
    super(
      consoleCss + css,
      html
    )
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

    this.Textarea = this.shadowRoot?.querySelector('textarea')!
    this.Textarea.value = ''
    this.Help([])
    this.Textarea.value += `\r${this.Prompt}`

    // listen for console button click
    this.shadowRoot?.querySelector('.console-button')?.addEventListener(
        'click',
        () => { this.HandleConsoleToggle() },
        false
      )

    // listen for mouse click
    document.addEventListener(
      'grid-console-toggle',
      () => { this.HandleConsoleToggle() },
      false
    )

    // listen for events from the textarea
    this.shadowRoot?.querySelector('textarea')?.addEventListener(
      'keyup',
      (event) => {
        event.stopPropagation()
        this.HandleKeydown(event)
      },
      false
    )

    this.shadowRoot?.querySelector('textarea')?.addEventListener(
      'keydown',
      (event) => {
        if (event.key == '`') {
          event.preventDefault()
        }
        if (event.key == 'Enter') {
          event.preventDefault()
          this.ProcessCommand()
          this.ScrollToBottom()
        }
      },
      false
    )

  }

  ScrollToBottom() {
    if(this.Textarea) this.Textarea.scrollTop = this.Textarea.scrollHeight
  }

  HandleKeydown(event: KeyboardEvent) {
    if (event.key == '`') {
      this.HandleConsoleToggle()
    }
  }

  HandleConsoleToggle() {
    if (this.getAttribute('expanded')) {
      this.removeAttribute('expanded')
      this.shadowRoot?.querySelector('textarea')?.blur()
    } else {
      this.setAttribute('expanded', 'true')
      this.shadowRoot?.querySelector('textarea')?.focus()
    }
  }

  async ProcessCommand() {

    if(!this.Textarea) return

    const value = this.Textarea.value
    const lastPrompt = value.lastIndexOf(this.Prompt) + this.Prompt.length
    const command = value.substring(lastPrompt, value.length).toLowerCase().split(' ')
    
    
    // TODO an array would be better than this
    switch (command[0]) {
      case 'clear':
      case 'c':
      case 'clr':
        this.Clear()
        break
      case 'help':
      case 'h':
        this.Help(command)
        break
      case 'generate':
      case 'g':
        this.Generate(command)
        break
      case 'joke':
      case 'j':
        await this.Joke()
        break
      case '':
        break
      default:
        this.Textarea.value += '\r⛔ Command Not Found'
        break
    }

    if(this.Textarea.value.length != 0) {
      this.Textarea.value += '\r'
    }
    this.Textarea.value += this.Prompt
    
    this.ScrollToBottom()

  }

  Clear() {
    if(this.Textarea) this.Textarea.value = ''
  }

  Help(command: any[]) {

    if(!this.Textarea) return

    if(command?.length == 2) {

      switch (command[1].toLowerCase()) {
        case 'joke':
        case 'j':
          this.Textarea.value += '\r'
          + this.PromptSpace + 'There is no help for you. 😐'
          return
          break
      }
      

    }

    this.Textarea.value += '\r'
    + this.PromptSpace + ' Command     Description\r'
    + this.PromptSpace + '----------  ---------------------\r'
    + this.PromptSpace + ' Joke        Dad joke\r'
    + this.PromptSpace + ' Help        Command details\r'    
  }

  Generate(command: any[]) {
    document.dispatchEvent(
      new CustomEvent(
        'grid-map-data-generate',
        {
          bubbles: true,
          detail: {
            sizeX:command[1],
            sizeY:command[2],
            rate:command[3]
          },
        }
      )
    )
  }

  async Joke() {

    if(!this.Textarea) return

    const response = await fetch(
      'https://icanhazdadjoke.com/',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const json = await response.json()

    const faces = [
      '😜',
      '😊',
      '😂',
      '🤣',
      '😁',
      '😆',
      '😄',
      '😎',
      '😅',
      '🤗',
      '😛'
    ]
    this.Textarea.value += '\r'
      + `${json.joke} `
      + faces[Math.floor(Math.random() * faces.length)]
    this.ScrollToBottom()
  }

}
