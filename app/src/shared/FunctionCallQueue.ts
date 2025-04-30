/**
 * Allow for queueing up function calls,
 * created to keep event handler calls in order
 */
export class FunctionCallQueue {

  queue: Array<any> = []

  isRunning: boolean = false

  constructor() { }

  Add(func: Function, ...args: any) {
    this.queue.push({ func, args })
    console.debug('FunctionCallQueue.Add()', func.name)
  }

  Clear() {
    this.queue = []
  }

  async Process() {
    this.isRunning = true
    if (this.queue.length === 0) {
      this.isRunning = false
      return
    }
    const { func, args } = this.queue.shift()
    console.debug('FunctionCallQueue.Process()', func.name)
    await func(...args)
    this.Process()
  }

}