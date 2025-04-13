export default class PointerType {

  static None: number = 0
  static Add: number = 1
  static Remove: number = 2
  static Select: number = 3

  /**
   * Return the Property Name for a given id
   */
  static GetName(id: number): string {

    for (const property in PointerType) {
      // @ts-ignore
      if (id == PointerType[property]) return property
    }
    return ''
  }

}