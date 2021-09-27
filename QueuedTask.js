function QueuedTask(name) {
  this.name = name
}; QueuedTask.taskQueue = {
  task: null,
  context: null,
  next: {}
}; QueuedTask.prototype = {
  run: async function() {
    if (!QueuedTask.taskQueue.task) {
      // A comes in and finds an empty queue.
      // So it adds itself ...
      QueuedTask.taskQueue.task = atomicFn
      QueuedTask.taskQueue.context = this
      // ... and runs (printing A 1 -> A 2 without interruption).
      await atomicFn.call(this)
    } else {
      // B comes in and finds a task in the queue.
      // So it looks into the next node.
      var next = QueuedTask.taskQueue.next
      // And finds that no task is next.
      var count = 0
      while (next.task) {
        next = next.next
        count++
      }
      console.log(this.name + ' registers as next task ' + count)
      // So it registers itself as the next task.
      next.task = atomicFn
      next.context = this
      next.next = {}
    }

    async function atomicFn() {
      try {
        var value1 = await new Promise(function(resolve, reject) {
          setTimeout(function() { resolve(1) }, 1000)
        })
        console.log(this.name +' '+ value1)
        var value2 = await new Promise(function(resolve, reject) {
          setTimeout(function() { resolve(2) }, 1000)
        })
        console.log(this.name +' '+ value2)
      } catch (e) {
        console.error(e)
      } finally {
        if (QueuedTask.taskQueue.next.task) {
          // A has finished running after 2 seconds and sees B's task in the next node.
          // So it sets it as the current task, discarding its own, that is now finished.
          QueuedTask.taskQueue = QueuedTask.taskQueue.next
          // Then it runs B's task.
          await QueuedTask.taskQueue.task.call(QueuedTask.taskQueue.context)
        } else {
          // B has finished running and sees that no task is next.
          // So it sets the current task to null.
          QueuedTask.taskQueue.task = null
        }
      }
    }
  }
}

var A = new QueuedTask('A')
var B = new QueuedTask('B')
var C = new QueuedTask('C')
Promise.all([A.run(), B.run(), C.run()]).catch(function(err) {
  console.error(err)
})
