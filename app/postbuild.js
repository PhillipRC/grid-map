// @ts-check
import { copyFile } from "node:fs"
import { join } from "node:path"

const currentDir = process.cwd()
const files = [
  'maskable-icon-512x512.png',
  'apple-touch-icon-180x180.png',
]

// vite-pwa generates maskable icons with white background
// current fix is to copy over those images
files.forEach(
  (fileName) => {
    copyFile(
      join(currentDir, 'public', fileName),
      join(currentDir, 'dist', fileName),
      (error) => {
        if (error) throw error
        console.log(`copied ${fileName} to dist`)
      }
    )
  }
)
