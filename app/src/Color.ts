import { HSLA, RGBA } from "./types"

export default class Color {

  /** value 0 to 255 */
  r: number = 0
  /** value 0 to 255 */
  g: number = 0
  /** value 0 to 255 */
  b: number = 0

  /** value 0 to 255 */
  h: number = 0
  /** value 0 to 100 */
  s: number = 0
  /** value 0 to 100 */
  l: number = 0

  a: number = 1


  static ColorFromHex(hexString: string) {
    const colorObj = new Color()
    const rgba = {
      r: Math.floor(parseInt(hexString.substring(1, 3), 16)),
      g: Math.floor(parseInt(hexString.substring(3, 5), 16)),
      b: Math.floor(parseInt(hexString.substring(5, 7), 16)),
      a: colorObj.a,
    }
    colorObj.SetRGBA(rgba)
    colorObj.SetHSLA(Color.RgbaToHsla(colorObj as RGBA))
    return colorObj
  }


  static ColorFromHsla(hsla: HSLA) {
    const colorObj = new Color()
    colorObj.SetRGBA(Color.HslatoRgba(hsla))
    colorObj.SetHSLA(hsla)
    return colorObj
  }

  static ColorFromRgba(rgba: RGBA) {
    const colorObj = new Color()
    colorObj.r = rgba.r
    colorObj.g = rgba.g
    colorObj.b = rgba.b
    colorObj.a = rgba.a
    colorObj.SetHSLA(Color.RgbaToHsla(colorObj as RGBA))
    return colorObj
  }

  SetRGBA(rgba:RGBA) {
    this.r = rgba.r
    this.g = rgba.g
    this.b = rgba.b
    this.a = rgba.a
  }

  SetHSLA(hsla:HSLA) {
    this.h = hsla.h
    this.s = hsla.s
    this.l = hsla.l
    this.a = hsla.a
  }


  AsHex(): string {
    return this.ToHexString(this.r, this.g, this.b)
  }


  ToHexString(r: number, g: number, b: number): string {
    return '#'
      + ((r.toString(16).length == 1) ? "0" + r.toString(16) : r.toString(16))
      + ((g.toString(16).length == 1) ? "0" + g.toString(16) : g.toString(16))
      + ((b.toString(16).length == 1) ? "0" + b.toString(16) : b.toString(16))
  }


  /**
   * Adjust the level of the color
   * 
   * @param {string} rgb #112233
   * @param {number} percent -100 to 100
   * @returns {string}
   */
  Level(rgb: string, percent: number): string {

    // adjust each channel by percent
    let R = Math.floor(parseInt(rgb.substring(1, 3), 16) * (100 + percent) / 100)
    let G = Math.floor(parseInt(rgb.substring(3, 5), 16) * (100 + percent) / 100)
    let B = Math.floor(parseInt(rgb.substring(5, 7), 16) * (100 + percent) / 100)

    // cap each channel
    R = Math.round((R < 255) ? R : 255)
    G = Math.round((G < 255) ? G : 255)
    B = Math.round((B < 255) ? B : 255)

    return this.ToHexString(R, G, B)
  }


  Contrast(): string {
    const sum = Math.round(
      (
        (this.r * 299) + (this.g * 587) + (this.b * 114)
      ) / 1000
    )
    return (sum > 128) ? '#000000' : '#ffffff'

  }



  static RgbaToHsla(rgba: RGBA): HSLA {

    const r = rgba.r / 255
    const g = rgba.g / 255
    const b = rgba.b / 255
    let h, s, l = 0

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    h = s = l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: rgba.a
    }
  }

  static HslatoRgba(hsla: HSLA): RGBA {

    const h = hsla.h / 360
    const s = hsla.s / 100
    const l = hsla.l / 100
    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: hsla.a
    }
  }


  TargetHsla(target:HSLA):RGBA {
    return Color.HslatoRgba(
      {
        h: this.h + target.h,
        s: this.s = this.s * target.s / 100 * 1.2,
        l: this.s = this.l * target.l / 100 * 2,
        a: this.a,
      }
    )
  }

}
