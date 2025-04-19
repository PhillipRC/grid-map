// @ts-check

import {
  readdirSync,
  readdir,
  stat,
  readFile,
  writeFile,
  statSync,
  readFileSync,
  mkdir,
  mkdirSync,
  rmdirSync,
  existsSync,
  writeFileSync
} from "node:fs"

import { join } from "node:path"

import {
  xml2js,
  js2xml
} from 'xml-js'


/**
 * @typedef {Object} SrcSvgFolders
 * @property {string} Path
 * @property {string} FolderName
 */


/**
 * Manipulate SVGs exported from PenPot.app into files used by grid-tile
 */
class TileBuilder {

  /**
   * Used to clear the STYLE attribute from a SVG element and add a CLASS attribute,
   * allowing a stylesheet to set the style
   */
  StyleClassPairs = [
    // fill-opacity: 0.5 replaced with class="fills-o"
    {
      Style: 'fill-opacity: 0.5',
      Class: 'fills-o',
    },
    // #66666 replaced with class="fills"
    {
      Style: '102, 102, 102',
      Class: 'fills',
    },
    // #555555 replaced with class="fills-1"
    {
      Style: '76, 76, 76',
      Class: 'fills-1',
    },
    // #333333 replaced with class="fills-2"
    {
      Style: '51, 51, 51',
      Class: 'fills-2',
    },
  ]


  /** @type {Array.<SrcSvgFolders>} */
  SrcSvgFolders = []


  /** @type {string} */
  OutputFolder = 'dist'

  
  /** @type {string} */
  OutputFolderPath = ''


  constructor() {
    this.SetSrcSvgFolders()
    this.ClearOutputFolder()
  }


  SetSrcSvgFolders() {
    const currentDir = process.cwd()
    const srcDir = join(currentDir, 'src-svg')
    const folderNames = readdirSync(srcDir)
    folderNames.forEach(
      (srcFolder) => {
        this.SrcSvgFolders.push(
          {
            Path: join(currentDir, 'src-svg', srcFolder),
            FolderName: srcFolder,
          }
        )
      }
    )
  }

  ClearOutputFolder() {
    this.OutputFolderPath = join(process.cwd(), this.OutputFolder)

    if (existsSync(this.OutputFolderPath))
      rmdirSync(this.OutputFolderPath, { recursive: true })

    mkdirSync(this.OutputFolderPath)
  }


  Build() {
    this.ProcessSrcFolders()
  }


  ProcessSrcFolders() {
    this.SrcSvgFolders.forEach(
      (srcFolder) => {
        this.ProcessSrcFolder(srcFolder)
      }
    )
  }


  /** @param {SrcSvgFolders} srcFolder  */
  ProcessSrcFolder(srcFolder) {

    const outputFolderPath = join(this.OutputFolderPath, srcFolder.FolderName)
    mkdirSync(outputFolderPath)

    readdir(
      srcFolder.Path,
      (error, files) => {

        if (error) {
          console.error('Error: ', error)
          return
        }

        files.forEach(
          (fileName) => {

            console.log(`processing ${srcFolder.FolderName} - ${fileName}`)

            const filePath = join(srcFolder.Path, fileName)
            const fileStats = statSync(filePath)

            // only files
            if (!fileStats.isFile) return

            const file = readFileSync(filePath, 'utf8')
            const xmlDoc = xml2js(file, { compact: true })

            // <g class="frame-children"> is where PenPot puts the guts
            const frameChildren = this.FindParentObject(xmlDoc, 'class', 'frame-children')
            let output = ''
            if(frameChildren != null) {
              const processedChildren = this.ProcessFrameChildren(frameChildren)
              output = js2xml(processedChildren, { compact: true, spaces: 0 })
            }
            const gWrapper = `<g class="frame-children">${output}</g>`
            const outputFilePath = join(outputFolderPath, fileName)
            writeFileSync(outputFilePath, gWrapper)
          }
        )
      }
    )
  }


  /** @param {object} obj */
  ProcessFrameChildren(obj) {

    for (const [key, value] of Object.entries(obj)) {

      if (Array.isArray(obj[key])) {
        this.ProcessArrayChildren(obj[key])
        continue
      }

      // process specific children
      if (key == 'rect' || key == 'path')
        this.ClearStyleSetClass(obj[key])

    }

    return obj
  }

  
  /** @param {object} obj */
  ProcessArrayChildren(obj) {
    obj.forEach(
      (child) => {
        this.ClearStyleSetClass(child)
      }
    )
  }


  /** @param {object} obj */
  ClearStyleSetClass(obj) {
    this.StyleClassPairs.forEach(
      (pair) => {
        if (obj._attributes.style.indexOf(pair.Style) > 0) {
          obj._attributes.class = pair.Class
          obj._attributes.style = ''
          return
        }
      }
    )
  }


  FindParentObject(obj, key, value, parent = null) {
    for (const currentKey in obj) {
      if (obj.hasOwnProperty(currentKey)) {
        if (currentKey === key && obj[currentKey] === value) {
          return parent
        } else if (typeof obj[currentKey] === 'object' && obj[currentKey] !== null) {
          const result = this.FindParentObject(obj[currentKey], key, value, obj)
          if (result) {
            return result
          }
        }
      }
    }
    return null
  }


}

export default TileBuilder