export default class MapDataModifierRandom {


  /**
   * Force value to be 0 to 1
   */
  static ConstrainRate(value: number): number {
    if (value < 0 || value > 1) {
      return value = Math.abs(
        Math.sin(value)
      )
    }
    return value
  }


  /**
   * Randomly zero out data that is not zero
   */
  static Modify(data: number[], rate: number): number[] {

    const returnData = new Array(data.length).fill(0)

    rate = MapDataModifierRandom.ConstrainRate(rate)

    data.forEach(
      (value, valueIdx) => {
        if (value != 0 && Math.random() > rate) {
          returnData[valueIdx] = 0
        } else {
          returnData[valueIdx] = value
        }
      }
    )
    return returnData
  }


}