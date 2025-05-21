/**
 * Allow for queueing up function calls,
 * created to keep event handler calls in order
 */
export class FunctionCallQueue {

  queue: Array<QueueItem> = []

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
    const next = this.queue.shift()
    if (next == undefined) return
    console.debug('FunctionCallQueue.Process()', next.func.name)
    await next.func(...next.args)
    this.Process()
  }

}

export type QueueItem = {
  func: Function
  args: any
}