import { expect } from 'chai'
import { beforeNextFrame, heavyCalculation } from './utils'
import { Queue, priorities } from '@nx-js/queue-util'

describe('priorities and processing', () => {
  it('should run all critical tasks before the next frame', async () => {
    let runs = 0
    const queue = new Queue(priorities.CRITICAL)
    for (let i = 0; i < 10; i++) {
      queue.add(() => {
        heavyCalculation()
        runs++
      })
    }

    expect(queue.size).to.equal(10)
    await beforeNextFrame()
    expect(runs).to.equal(10)
    expect(queue.size).to.equal(0)
  })

  it('should run all critical tasks before high prio tasks before the low prio tasks', async () => {
    let criticalRuns = 0
    let highRuns = 0
    let lowRuns = 0

    const criticalQueue = new Queue(priorities.CRITICAL)
    const highQueue = new Queue(priorities.HIGH)
    const lowQueue = new Queue(priorities.LOW)

    for (let i = 0; i < 10; i++) {
      criticalQueue.add(() => {
        criticalRuns++
        heavyCalculation()
      })

      highQueue.add(() => {
        highRuns++
        heavyCalculation()
      })

      lowQueue.add(() => {
        lowRuns++
        heavyCalculation()
      })
    }

    await criticalQueue.processing()
    expect(criticalRuns).to.equal(10)
    expect(highRuns).to.equal(0)
    expect(lowRuns).to.equal(0)
    await highQueue.processing()
    expect(criticalRuns).to.equal(10)
    expect(highRuns).to.equal(10)
    expect(lowRuns).to.equal(0)
    await lowQueue.processing()
    expect(criticalRuns).to.equal(10)
    expect(highRuns).to.equal(10)
    expect(lowRuns).to.equal(10)
  })

  it('should process non critical tasks in chunks to achieve 60 fps', async () => {
    const lowQueue = new Queue(priorities.LOW)
    const highQueue = new Queue(priorities.HIGH)

    for (let i = 0; i < 10; i++) {
      highQueue.add(() => heavyCalculation())
      lowQueue.add(() => heavyCalculation())
    }

    await beforeNextFrame()
    expect(highQueue.size).to.not.eql(0)
    expect(lowQueue.size).to.eql(10)
    await lowQueue.processing()
    expect(highQueue.size).to.eql(0)
    expect(lowQueue.size).to.eql(0)
  })
})
