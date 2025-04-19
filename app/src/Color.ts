export default class Color {

  r: number = 0
  g: number = 0
  b: number = 0
  a: number = 0


  Color(hexString: string) {
    this.r = Math.floor(parseInt(hexString.substring(1, 3), 16))
    this.g = Math.floor(parseInt(hexString.substring(3, 5), 16))
    this.b = Math.floor(parseInt(hexString.substring(5, 7), 16))
    return this
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

    return '#'
      + ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16))
      + ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16))
      + ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16))
  }


  Contrast(): string {
    var sum = Math.round(
      (
        (this.r * 299) + (this.g * 587) + (this.b * 114)
      ) / 1000
    )
    return (sum > 128) ? '#000000' : '#ffffff';

  }


}
