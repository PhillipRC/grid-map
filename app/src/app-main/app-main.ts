import GridBase from '../grid-base'
import html from './app-main.html?raw'
import css from './app-main.css?inline'

export default class AppMain extends GridBase {

  constructor() {
    super(css, html)
  }

  connectedCallback() {

    // only handle once
    if (this.ConnectedCallback) return
    this.ConnectedCallback = true

  }

}
